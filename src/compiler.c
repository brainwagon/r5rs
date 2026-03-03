#include <compiler.h>
#include <macro.h>
#include <vm.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

typedef struct {
    unsigned char* code;
    int cap;
    int len;
    Value** constants;
    int c_cap;
    int c_len;
} ProtoBuilder;

static void pb_init(ProtoBuilder* pb) {
    pb->cap = 64;
    pb->code = malloc(pb->cap);
    pb->len = 0;
    pb->c_cap = 16;
    pb->constants = malloc(sizeof(Value*) * pb->c_cap);
    pb->c_len = 0;
}

static void pb_emit(ProtoBuilder* pb, unsigned char b) {
    if (pb->len == pb->cap) {
        pb->cap *= 2;
        pb->code = realloc(pb->code, pb->cap);
    }
    pb->code[pb->len++] = b;
}

static void pb_emit2(ProtoBuilder* pb, int v) {
    pb_emit(pb, (v >> 8) & 0xFF);
    pb_emit(pb, v & 0xFF);
}

static int pb_add_constant(ProtoBuilder* pb, Value* v) {
    for (int i = 0; i < pb->c_len; i++) {
        if (pb->constants[i] == v) return i;
    }
    if (pb->c_len == pb->c_cap) {
        pb->c_cap *= 2;
        pb->constants = realloc(pb->constants, sizeof(Value*) * pb->c_cap);
    }
    pb->constants[pb->c_len++] = v;
    return pb->c_len - 1;
}

static bool lookup_lexical(Value* env, Value* sym, int* depth, int* index) {
    int d = 0;
    while (is_pair(env)) {
        Value* frame = env->as.pair.car;
        int i = 0;
        while (is_pair(frame)) {
            if (frame->as.pair.car == sym) {
                *depth = d;
                *index = i;
                return true;
            }
            frame = frame->as.pair.cdr;
            i++;
        }
        if (is_symbol(frame) && frame == sym) {
            *depth = d;
            *index = i;
            return true;
        }
        env = env->as.pair.cdr;
        d++;
    }
    return false;
}

static Value* lookup_syntax(Value* syntax_env, Value* sym) {
    while (is_pair(syntax_env)) {
        Value* pair = syntax_env->as.pair.car;
        if (pair->as.pair.car == sym) return pair->as.pair.cdr;
        syntax_env = syntax_env->as.pair.cdr;
    }
    return NULL;
}

static int count_args(Value* params) {
    int count = 0;
    while (is_pair(params)) {
        count++;
        params = params->as.pair.cdr;
    }
    return count;
}

static void compile_expr(ProtoBuilder* pb, Value* expr, Value* env, Value* syntax_env, bool tail);

static void compile_body(ProtoBuilder* pb, Value* exprs, Value* env, Value* syntax_env, bool tail) {
    if (is_nil(exprs)) {
        pb_emit(pb, OP_CONST);
        pb_emit2(pb, pb_add_constant(pb, make_nil()));
        if (tail) pb_emit(pb, OP_RET);
        return;
    }
    while (is_pair(exprs)) {
        Value* e = exprs->as.pair.car;
        bool last = is_nil(exprs->as.pair.cdr);
        compile_expr(pb, e, env, syntax_env, last ? tail : false);
        if (!last) pb_emit(pb, OP_POP);
        exprs = exprs->as.pair.cdr;
    }
}

static void compile_and(ProtoBuilder* pb, Value* exprs, Value* env, Value* syntax_env, bool tail) {
    if (is_nil(exprs)) {
        pb_emit(pb, OP_CONST);
        pb_emit2(pb, pb_add_constant(pb, make_boolean(true)));
        if (tail) pb_emit(pb, OP_RET);
        return;
    }
    Value* first = exprs->as.pair.car;
    Value* rest = exprs->as.pair.cdr;
    if (is_nil(rest)) {
        compile_expr(pb, first, env, syntax_env, tail);
        return;
    }
    compile_expr(pb, first, env, syntax_env, false);
    pb_emit(pb, OP_JF);
    int jf_pos = pb->len;
    pb_emit2(pb, 0);
    compile_and(pb, rest, env, syntax_env, tail);
    if (!tail) {
        pb_emit(pb, OP_JUMP);
        int jump_pos = pb->len;
        pb_emit2(pb, 0);
        int false_start = pb->len;
        pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
        pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
        pb_emit(pb, OP_CONST);
        pb_emit2(pb, pb_add_constant(pb, make_boolean(false)));
        int end_pos = pb->len;
        pb->code[jump_pos] = (end_pos - jump_pos - 2) >> 8;
        pb->code[jump_pos + 1] = (end_pos - jump_pos - 2) & 0xFF;
    } else {
        int false_start = pb->len;
        pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
        pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
        pb_emit(pb, OP_CONST);
        pb_emit2(pb, pb_add_constant(pb, make_boolean(false)));
        pb_emit(pb, OP_RET);
    }
}

static void compile_or(ProtoBuilder* pb, Value* exprs, Value* env, Value* syntax_env, bool tail) {
    if (is_nil(exprs)) {
        pb_emit(pb, OP_CONST);
        pb_emit2(pb, pb_add_constant(pb, make_boolean(false)));
        if (tail) pb_emit(pb, OP_RET);
        return;
    }
    Value* first = exprs->as.pair.car;
    Value* rest = exprs->as.pair.cdr;
    if (is_nil(rest)) {
        compile_expr(pb, first, env, syntax_env, tail);
        return;
    }
    compile_expr(pb, first, env, syntax_env, false);
    pb_emit(pb, OP_DUP);
    pb_emit(pb, OP_JF);
    int jf_pos = pb->len;
    pb_emit2(pb, 0);
    if (tail) {
        pb_emit(pb, OP_RET);
    } else {
        pb_emit(pb, OP_JUMP);
        int jump_pos = pb->len;
        pb_emit2(pb, 0);
        int false_start = pb->len;
        pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
        pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
        pb_emit(pb, OP_POP);
        compile_or(pb, rest, env, syntax_env, false);
        int end_pos = pb->len;
        pb->code[jump_pos] = (end_pos - jump_pos - 2) >> 8;
        pb->code[jump_pos + 1] = (end_pos - jump_pos - 2) & 0xFF;
        return;
    }
    int false_start = pb->len;
    pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
    pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
    pb_emit(pb, OP_POP);
    compile_or(pb, rest, env, syntax_env, true);
}

static void compile_cond(ProtoBuilder* pb, Value* clauses, Value* env, Value* syntax_env, bool tail) {
    if (is_nil(clauses)) {
        pb_emit(pb, OP_CONST);
        pb_emit2(pb, pb_add_constant(pb, make_nil()));
        if (tail) pb_emit(pb, OP_RET);
        return;
    }
    Value* clause = clauses->as.pair.car;
    Value* rest = clauses->as.pair.cdr;
    Value* test = clause->as.pair.car;
    Value* expressions = clause->as.pair.cdr;
    bool is_else = (is_symbol(test) && strcmp(test->as.symbol, "else") == 0);

    if (is_else) {
        compile_body(pb, expressions, env, syntax_env, tail);
        return;
    }

    if (is_nil(expressions)) {
        compile_expr(pb, test, env, syntax_env, false);
        pb_emit(pb, OP_DUP);
        pb_emit(pb, OP_JF);
        int jf_pos = pb->len;
        pb_emit2(pb, 0);
        if (tail) {
            pb_emit(pb, OP_RET);
        } else {
            pb_emit(pb, OP_JUMP);
            int jump_pos = pb->len;
            pb_emit2(pb, 0);
            int false_start = pb->len;
            pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
            pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
            pb_emit(pb, OP_POP);
            compile_cond(pb, rest, env, syntax_env, false);
            int end_pos = pb->len;
            pb->code[jump_pos] = (end_pos - jump_pos - 2) >> 8;
            pb->code[jump_pos + 1] = (end_pos - jump_pos - 2) & 0xFF;
            return;
        }
        int false_start = pb->len;
        pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
        pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
        pb_emit(pb, OP_POP);
        compile_cond(pb, rest, env, syntax_env, true);
        return;
    }

    if (is_pair(expressions) && is_symbol(expressions->as.pair.car) && strcmp(expressions->as.pair.car->as.symbol, "=>") == 0) {
        Value* proc = expressions->as.pair.cdr->as.pair.car;
        compile_expr(pb, test, env, syntax_env, false);
        pb_emit(pb, OP_DUP);
        pb_emit(pb, OP_JF);
        int jf_pos = pb->len;
        pb_emit2(pb, 0);
        compile_expr(pb, proc, env, syntax_env, false);
        pb_emit(pb, OP_CALL);
        pb_emit(pb, 1);
        if (tail) {
            pb_emit(pb, OP_RET);
        } else {
            pb_emit(pb, OP_JUMP);
            int jump_pos = pb->len;
            pb_emit2(pb, 0);
            int false_start = pb->len;
            pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
            pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
            pb_emit(pb, OP_POP);
            compile_cond(pb, rest, env, syntax_env, false);
            int end_pos = pb->len;
            pb->code[jump_pos] = (end_pos - jump_pos - 2) >> 8;
            pb->code[jump_pos + 1] = (end_pos - jump_pos - 2) & 0xFF;
            return;
        }
        int false_start = pb->len;
        pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
        pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
        pb_emit(pb, OP_POP);
        compile_cond(pb, rest, env, syntax_env, true);
        return;
    }

    compile_expr(pb, test, env, syntax_env, false);
    pb_emit(pb, OP_JF);
    int jf_pos = pb->len;
    pb_emit2(pb, 0);
    compile_body(pb, expressions, env, syntax_env, tail);
    if (!tail) {
        pb_emit(pb, OP_JUMP);
        int jump_pos = pb->len;
        pb_emit2(pb, 0);
        int false_start = pb->len;
        pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
        pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
        compile_cond(pb, rest, env, syntax_env, false);
        int end_pos = pb->len;
        pb->code[jump_pos] = (end_pos - jump_pos - 2) >> 8;
        pb->code[jump_pos + 1] = (end_pos - jump_pos - 2) & 0xFF;
    } else {
        int false_start = pb->len;
        pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
        pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
        compile_cond(pb, rest, env, syntax_env, true);
    }
}

static void compile_expr(ProtoBuilder* pb, Value* expr, Value* env, Value* syntax_env, bool tail) {
    if (is_fixnum(expr) || is_boolean(expr) || is_nil(expr) || is_char(expr) || is_string(expr) || is_vector(expr) || is_bignum(expr) || is_real(expr)) {
        int idx = pb_add_constant(pb, expr);
        pb_emit(pb, OP_CONST);
        pb_emit2(pb, idx);
        if (tail) pb_emit(pb, OP_RET);
        return;
    }
    
    if (is_symbol(expr)) {
        int d, i;
        if (lookup_lexical(env, expr, &d, &i)) {
            pb_emit(pb, OP_LREF);
            pb_emit(pb, (unsigned char)d);
            pb_emit2(pb, i);
        } else {
            int idx = pb_add_constant(pb, expr);
            pb_emit(pb, OP_GREF);
            pb_emit2(pb, idx);
        }
        if (tail) pb_emit(pb, OP_RET);
        return;
    }

    if (is_pair(expr)) {
        Value* car = expr->as.pair.car;
        if (is_symbol(car)) {
            Value* transformer = lookup_syntax(syntax_env, car);
            if (transformer) {
                Value* expanded = macro_expand_with_transformer(transformer, expr);
                compile_expr(pb, expanded, env, syntax_env, tail);
                return;
            }

            const char* name = car->as.symbol;
            if (strcmp(name, "quote") == 0) {
                Value* datum = expr->as.pair.cdr->as.pair.car;
                int idx = pb_add_constant(pb, datum);
                pb_emit(pb, OP_CONST);
                pb_emit2(pb, idx);
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
            if (strcmp(name, "if") == 0) {
                Value* test = expr->as.pair.cdr->as.pair.car;
                Value* then_part = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                Value* else_part = expr->as.pair.cdr->as.pair.cdr->as.pair.cdr->as.pair.car;
                compile_expr(pb, test, env, syntax_env, false);
                pb_emit(pb, OP_JF);
                int jf_pos = pb->len;
                pb_emit2(pb, 0); 
                compile_expr(pb, then_part, env, syntax_env, tail);
                int jump_pos = -1;
                if (!tail) {
                    pb_emit(pb, OP_JUMP);
                    jump_pos = pb->len;
                    pb_emit2(pb, 0);
                }
                int else_start = pb->len;
                pb->code[jf_pos] = (else_start - jf_pos - 2) >> 8;
                pb->code[jf_pos + 1] = (else_start - jf_pos - 2) & 0xFF;
                compile_expr(pb, else_part, env, syntax_env, tail);
                if (!tail) {
                    int end_pos = pb->len;
                    pb->code[jump_pos] = (end_pos - jump_pos - 2) >> 8;
                    pb->code[jump_pos + 1] = (end_pos - jump_pos - 2) & 0xFF;
                }
                return;
            }
            if (strcmp(name, "and") == 0) {
                compile_and(pb, expr->as.pair.cdr, env, syntax_env, tail);
                return;
            }
            if (strcmp(name, "or") == 0) {
                compile_or(pb, expr->as.pair.cdr, env, syntax_env, tail);
                return;
            }
            if (strcmp(name, "cond") == 0) {
                compile_cond(pb, expr->as.pair.cdr, env, syntax_env, tail);
                return;
            }
            if (strcmp(name, "case") == 0) {
                Value* key_expr = expr->as.pair.cdr->as.pair.car;
                Value* clauses = expr->as.pair.cdr->as.pair.cdr;
                Value* temp_sym = make_symbol("%%case-temp");
                Value* cond_clauses = make_nil();
                Value* c = clauses;
                while (is_pair(c)) {
                    Value* clause = c->as.pair.car;
                    Value* data = clause->as.pair.car;
                    Value* exprs = clause->as.pair.cdr;
                    Value* cond_clause;
                    if (is_symbol(data) && strcmp(data->as.symbol, "else") == 0) {
                        cond_clause = make_pair(make_symbol("else"), exprs);
                    } else {
                        Value* test = make_pair(make_symbol("memv"), make_pair(temp_sym, make_pair(make_pair(make_symbol("quote"), make_pair(data, make_nil())), make_nil())));
                        cond_clause = make_pair(test, exprs);
                    }
                    cond_clauses = make_pair(cond_clause, cond_clauses);
                    c = c->as.pair.cdr;
                }
                Value* r_clauses = make_nil();
                while (is_pair(cond_clauses)) {
                    r_clauses = make_pair(cond_clauses->as.pair.car, r_clauses);
                    cond_clauses = cond_clauses->as.pair.cdr;
                }
                Value* cond = make_pair(make_symbol("cond"), r_clauses);
                Value* let = make_pair(make_symbol("let"), make_pair(make_pair(make_pair(temp_sym, make_pair(key_expr, make_nil())), make_nil()), make_pair(cond, make_nil())));
                compile_expr(pb, let, env, syntax_env, tail);
                return;
            }
            if (strcmp(name, "let") == 0) {
                Value* cdr = expr->as.pair.cdr;
                Value* bindings = cdr->as.pair.car;
                Value* body = cdr->as.pair.cdr;
                if (is_symbol(bindings)) {
                    Value* name_val = bindings;
                    bindings = cdr->as.pair.cdr->as.pair.car;
                    body = cdr->as.pair.cdr->as.pair.cdr;
                    Value* vars = make_nil();
                    Value* vals = make_nil();
                    Value* b = bindings;
                    while (is_pair(b)) {
                        Value* binding = b->as.pair.car;
                        vars = make_pair(binding->as.pair.car, vars);
                        vals = make_pair(binding->as.pair.cdr->as.pair.car, vals);
                        b = b->as.pair.cdr;
                    }
                    Value* rvars = make_nil();
                    Value* rvals = make_nil();
                    while (is_pair(vars)) {
                        rvars = make_pair(vars->as.pair.car, rvars);
                        rvals = make_pair(vals->as.pair.car, rvals);
                        vars = vars->as.pair.cdr;
                        vals = vals->as.pair.cdr;
                    }
                    // (let tag ((v i) ...) body ...) =>
                    // ((letrec ((tag (lambda (v ...) body ...))) tag) i ...)
                    Value* lambda = make_pair(make_symbol("lambda"), make_pair(rvars, body));
                    Value* letrec_bindings = make_pair(make_pair(name_val, make_pair(lambda, make_nil())), make_nil());
                    Value* letrec = make_pair(make_symbol("letrec"), make_pair(letrec_bindings, make_pair(name_val, make_nil())));
                    Value* call = make_pair(letrec, rvals);
                    compile_expr(pb, call, env, syntax_env, tail);
                    return;
                }
                Value* vars = make_nil();
                Value* vals = make_nil();
                Value* b = bindings;
                while (is_pair(b)) {
                    Value* binding = b->as.pair.car;
                    vars = make_pair(binding->as.pair.car, vars);
                    vals = make_pair(binding->as.pair.cdr->as.pair.car, vals);
                    b = b->as.pair.cdr;
                }
                Value* rvars = make_nil();
                Value* rvals = make_nil();
                while (is_pair(vars)) {
                    rvars = make_pair(vars->as.pair.car, rvars);
                    rvals = make_pair(vals->as.pair.car, rvals);
                    vars = vars->as.pair.cdr;
                    vals = vals->as.pair.cdr;
                }
                Value* lambda = make_pair(make_symbol("lambda"), make_pair(rvars, body));
                Value* call = make_pair(lambda, rvals);
                compile_expr(pb, call, env, syntax_env, tail);
                return;
            }
            if (strcmp(name, "let*") == 0) {
                Value* bindings = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr;
                if (is_nil(bindings)) {
                    Value* begin = make_pair(make_symbol("begin"), body);
                    compile_expr(pb, begin, env, syntax_env, tail);
                } else {
                    Value* first = bindings->as.pair.car;
                    Value* rest = bindings->as.pair.cdr;
                    Value* next_let = make_pair(make_symbol("let*"), make_pair(rest, body));
                    Value* outer_let = make_pair(make_symbol("let"), make_pair(make_pair(first, make_nil()), make_pair(next_let, make_nil())));
                    compile_expr(pb, outer_let, env, syntax_env, tail);
                }
                return;
            }
            if (strcmp(name, "letrec") == 0) {
                Value* bindings = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr;
                Value* vars = make_nil();
                Value* b = bindings;
                while (is_pair(b)) {
                    vars = make_pair(b->as.pair.car->as.pair.car, vars);
                    b = b->as.pair.cdr;
                }

                // 1. Create a sub-prototype for the letrec body
                ProtoBuilder sub_pb;
                sub_pb.cap = 64;
                sub_pb.code = malloc(sub_pb.cap);
                sub_pb.len = 0;
                sub_pb.c_cap = 16;
                sub_pb.constants = malloc(sizeof(Value*) * sub_pb.c_cap);
                sub_pb.c_len = 0;
                
                Value* new_env = make_pair(vars, env);

                // Compile sets for each binding
                b = bindings;
                while (is_pair(b)) {
                    Value* binding = b->as.pair.car;
                    Value* var = binding->as.pair.car;
                    Value* val = binding->as.pair.cdr->as.pair.car;
                    compile_expr(&sub_pb, val, new_env, syntax_env, false);
                    int depth, idx;
                    if (lookup_lexical(new_env, var, &depth, &idx)) {
                        pb_emit(&sub_pb, OP_LSET);
                        pb_emit(&sub_pb, (unsigned char)depth);
                        pb_emit2(&sub_pb, idx);
                    } else {
                        int c_idx = pb_add_constant(&sub_pb, var);
                        pb_emit(&sub_pb, OP_GSET);
                        pb_emit2(&sub_pb, c_idx);
                    }
                    pb_emit(&sub_pb, OP_POP);
                    b = b->as.pair.cdr;
                }
                compile_body(&sub_pb, body, new_env, syntax_env, true);
                
                unsigned char* code = malloc(sub_pb.len);
                memcpy(code, sub_pb.code, sub_pb.len);
                Value** constants = malloc(sizeof(Value*) * sub_pb.c_len);
                memcpy(constants, sub_pb.constants, sizeof(Value*) * sub_pb.c_len);
                Value* sub_proto = make_proto(code, sub_pb.len, constants, sub_pb.c_len, count_args(vars), false);
                free(sub_pb.code);
                free(sub_pb.constants);

                // 2. In outer pb, push #f for each var
                int n = 0;
                b = bindings;
                while (is_pair(b)) {
                    pb_emit(pb, OP_CONST);
                    pb_emit2(pb, pb_add_constant(pb, make_boolean(false)));
                    n++;
                    b = b->as.pair.cdr;
                }
                
                // 3. Push closure and call it
                int p_idx = pb_add_constant(pb, sub_proto);
                pb_emit(pb, OP_CLOSURE);
                pb_emit2(pb, p_idx);
                pb_emit(pb, tail ? OP_TCALL : OP_CALL);
                pb_emit(pb, (unsigned char)n);
                return;
            }
            if (strcmp(name, "define") == 0) {
                Value* sym = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                compile_expr(pb, body, env, syntax_env, false);
                int idx = pb_add_constant(pb, sym);
                pb_emit(pb, OP_DEF);
                pb_emit2(pb, idx);
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
            if (strcmp(name, "define-syntax") == 0) {
                Value* sym = expr->as.pair.cdr->as.pair.car;
                Value* transformer_expr = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                if (is_pair(transformer_expr) && is_symbol(transformer_expr->as.pair.car) && strcmp(transformer_expr->as.pair.car->as.symbol, "syntax-rules") == 0) {
                    Value* literals = transformer_expr->as.pair.cdr->as.pair.car;
                    Value* rules = transformer_expr->as.pair.cdr->as.pair.cdr;
                    Value* macro = make_macro(literals, rules);
                    if (global_vm_ptr) {
                        global_vm_ptr->syntax_env = make_pair(make_pair(sym, macro), global_vm_ptr->syntax_env);
                    }
                    pb_emit(pb, OP_CONST);
                    pb_emit2(pb, pb_add_constant(pb, make_nil()));
                    if (tail) pb_emit(pb, OP_RET);
                    return;
                }
            }
            if (strcmp(name, "let-syntax") == 0 || strcmp(name, "letrec-syntax") == 0) {
                Value* bindings = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr;
                Value* new_syntax_env = syntax_env;
                Value* b = bindings;
                while (is_pair(b)) {
                    Value* binding = b->as.pair.car;
                    Value* sym = binding->as.pair.car;
                    Value* transformer_expr = binding->as.pair.cdr->as.pair.car;
                    Value* literals = transformer_expr->as.pair.cdr->as.pair.car;
                    Value* rules = transformer_expr->as.pair.cdr->as.pair.cdr;
                    Value* macro = make_macro(literals, rules);
                    new_syntax_env = make_pair(make_pair(sym, macro), new_syntax_env);
                    b = b->as.pair.cdr;
                }
                compile_body(pb, body, env, new_syntax_env, tail);
                return;
            }
            if (strcmp(name, "set!") == 0) {
                Value* sym = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                compile_expr(pb, body, env, syntax_env, false);
                int d, i;
                if (lookup_lexical(env, sym, &d, &i)) {
                    pb_emit(pb, OP_LSET);
                    pb_emit(pb, (unsigned char)d);
                    pb_emit2(pb, i);
                } else {
                    int idx = pb_add_constant(pb, sym);
                    pb_emit(pb, OP_GSET);
                    pb_emit2(pb, idx);
                }
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
            if (strcmp(name, "apply") == 0) {
                Value* proc_expr = expr->as.pair.cdr->as.pair.car;
                Value* arg_list_expr = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                compile_expr(pb, proc_expr, env, syntax_env, false);
                compile_expr(pb, arg_list_expr, env, syntax_env, false);
                pb_emit(pb, OP_APPLY);
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
            if (strcmp(name, "begin") == 0) {
                compile_body(pb, expr->as.pair.cdr, env, syntax_env, tail);
                return;
            }
            if (strcmp(name, "lambda") == 0) {
                Value* params = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr;
                int num_args = 0;
                bool has_rest = false;
                Value* p = params;
                while (is_pair(p)) {
                    num_args++;
                    p = p->as.pair.cdr;
                }
                if (is_symbol(p)) {
                    has_rest = true;
                }
                Value* new_env = make_pair(params, env);
                Value* proto = compile(body, new_env, syntax_env, num_args, has_rest);
                int idx = pb_add_constant(pb, proto);
                pb_emit(pb, OP_CLOSURE);
                pb_emit2(pb, idx);
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
            if (strcmp(name, "call/cc") == 0 || strcmp(name, "call-with-current-continuation") == 0) {
                Value* receiver = expr->as.pair.cdr->as.pair.car;
                compile_expr(pb, receiver, env, syntax_env, false);
                pb_emit(pb, OP_CALLCC);
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
        }
        Value* args = expr->as.pair.cdr;
        int nargs = 0;
        while (is_pair(args)) {
            compile_expr(pb, args->as.pair.car, env, syntax_env, false);
            args = args->as.pair.cdr;
            nargs++;
        }
        compile_expr(pb, car, env, syntax_env, false);
        pb_emit(pb, tail ? OP_TCALL : OP_CALL);
        pb_emit(pb, (unsigned char)nargs);
        return;
    }
}

Value* compile(Value* expr, Value* env, Value* syntax_env, int num_args, bool has_rest) {
    ProtoBuilder pb;
    pb_init(&pb);
    bool is_lambda = (num_args >= 0);
    if (is_lambda) {
        compile_body(&pb, expr, env, syntax_env, true);
    } else {
        compile_expr(&pb, expr, env, syntax_env, false);
        pb_emit(&pb, OP_HALT);
    }
    unsigned char* code = malloc(pb.len);
    memcpy(code, pb.code, pb.len);
    Value** constants = malloc(sizeof(Value*) * pb.c_len);
    memcpy(constants, pb.constants, sizeof(Value*) * pb.c_len);
    Value* proto = make_proto(code, pb.len, constants, pb.c_len, (is_lambda ? num_args : 0), has_rest);
    free(pb.code);
    free(pb.constants);
    return proto;
}
