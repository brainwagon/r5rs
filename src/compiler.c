#include <compiler.h>
#include <macro.h>
#include <vm.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

extern struct VM* global_vm_ptr;

typedef struct {
    unsigned char* code;
    int len;
    int cap;
    Value** constants;
    int c_len;
    int c_cap;
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

static void pb_emit2(ProtoBuilder* pb, int val) {
    pb_emit(pb, (val >> 8) & 0xFF);
    pb_emit(pb, val & 0xFF);
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

static bool lookup_lexical(Value* env, Value* sym, int* depth, int* idx) {
    int d = 0;
    while (is_pair(env)) {
        Value* frame = env->as.pair.car;
        int i = 0;
        while (is_pair(frame)) {
            if (frame->as.pair.car == sym) {
                *depth = d;
                *idx = i;
                return true;
            }
            frame = frame->as.pair.cdr;
            i++;
        }
        if (frame == sym) { // Handle rest argument or (lambda args ...)
            *depth = d;
            *idx = i;
            return true;
        }
        env = env->as.pair.cdr;
        d++;
    }
    return false;
}

static Value* lookup_syntax(Value* syntax_env, Value* sym) {
    while (is_pair(syntax_env)) {
        Value* entry = syntax_env->as.pair.car;
        if (entry->as.pair.car == sym) return entry->as.pair.cdr;
        syntax_env = syntax_env->as.pair.cdr;
    }
    return NULL;
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
    Value* e = exprs->as.pair.car;
    Value* rest = exprs->as.pair.cdr;
    if (is_nil(rest)) {
        compile_expr(pb, e, env, syntax_env, tail);
        return;
    }
    compile_expr(pb, e, env, syntax_env, false);
    pb_emit(pb, OP_JF);
    int jf_pos = pb->len;
    pb_emit2(pb, 0);
    compile_and(pb, rest, env, syntax_env, tail);
    if (!tail) {
        int end_pos = pb->len;
        pb->code[jf_pos] = (end_pos - jf_pos - 2) >> 8;
        pb->code[jf_pos + 1] = (end_pos - jf_pos - 2) & 0xFF;
    } else {
        // Already handled by tail call or OP_RET
    }
}

static void compile_or(ProtoBuilder* pb, Value* exprs, Value* env, Value* syntax_env, bool tail) {
    if (is_nil(exprs)) {
        pb_emit(pb, OP_CONST);
        pb_emit2(pb, pb_add_constant(pb, make_boolean(false)));
        if (tail) pb_emit(pb, OP_RET);
        return;
    }
    Value* e = exprs->as.pair.car;
    Value* rest = exprs->as.pair.cdr;
    if (is_nil(rest)) {
        compile_expr(pb, e, env, syntax_env, tail);
        return;
    }
    compile_expr(pb, e, env, syntax_env, false);
    pb_emit(pb, OP_DUP);
    pb_emit(pb, OP_JF);
    int jf_pos = pb->len;
    pb_emit2(pb, 0);
    // If true, jump to end (with value on stack)
    pb_emit(pb, OP_JUMP);
    int jump_pos = pb->len;
    pb_emit2(pb, 0);
    
    // If false, pop and evaluate rest
    int false_start = pb->len;
    pb->code[jf_pos] = (false_start - jf_pos - 2) >> 8;
    pb->code[jf_pos + 1] = (false_start - jf_pos - 2) & 0xFF;
    pb_emit(pb, OP_POP);
    compile_or(pb, rest, env, syntax_env, tail);
    
    if (!tail) {
        int end_pos = pb->len;
        pb->code[jump_pos] = (end_pos - jump_pos - 2) >> 8;
        pb->code[jump_pos + 1] = (end_pos - jump_pos - 2) & 0xFF;
    }
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
        if (getenv("VM_DEBUG_COMPILER")) printf("Compiling symbol: %s\n", expr->as.symbol);
        
        const char* s = expr->as.symbol;
        bool is_kw = (strcmp(s, "if") == 0 || strcmp(s, "define") == 0 || strcmp(s, "set!") == 0 || strcmp(s, "lambda") == 0 ||
                      strcmp(s, "quote") == 0 || strcmp(s, "begin") == 0 || strcmp(s, "let") == 0 || strcmp(s, "cond") == 0);

        int d, i;
        if (lookup_lexical(env, expr, &d, &i)) {
            pb_emit(pb, OP_LREF);
            pb_emit(pb, (unsigned char)d);
            pb_emit2(pb, i);
        } else if (strncmp(s, "%gen-", 5) == 0) {
            // Renamed symbol, not found lexically. Extract base name and lookup globally.
            const char* start = s + 5;
            const char* end = strrchr(start, '-');
            if (end && end > start) {
                int len = end - start;
                char* base = malloc(len + 1);
                strncpy(base, start, len);
                base[len] = '\0';
                Value* base_sym = make_symbol(base);
                free(base);
                int idx = pb_add_constant(pb, base_sym);
                pb_emit(pb, OP_GREF);
                pb_emit2(pb, idx);
            } else {
                int idx = pb_add_constant(pb, expr);
                pb_emit(pb, OP_GREF);
                pb_emit2(pb, idx);
            }
        } else if (is_kw) {
            // Keyword used as identifier, but not shadowed.
            // If it's not in the global env, it will fail at runtime if we use GREF.
            // But for pervasive tests like ((lambda lambda lambda) 'x), 
            // the second 'lambda' is passed as an argument to the first 'lambda'.
            // Actually, if it's a keyword and NOT shadowed, it SHOULD be an error to use it as a value
            // UNLESS it's bound in the global environment.
            int idx = pb_add_constant(pb, expr);
            pb_emit(pb, OP_GREF);
            pb_emit2(pb, idx);
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
                gc_push_root(expanded);
                compile_expr(pb, expanded, env, syntax_env, tail);
                gc_pop_root();
                return;
            }

            const char* name = car->as.symbol;
            int d, i;
            if (!lookup_lexical(env, car, &d, &i)) {
                if (strcmp(name, "call-with-current-continuation") == 0 || strcmp(name, "call/cc") == 0) {
                    Value* proc_expr = expr->as.pair.cdr->as.pair.car;
                    compile_expr(pb, proc_expr, env, syntax_env, false);
                    pb_emit(pb, OP_CALLCC);
                    if (tail) pb_emit(pb, OP_RET);
                    return;
                }
            }
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
                Value* else_part = make_nil();
                if (is_pair(expr->as.pair.cdr->as.pair.cdr->as.pair.cdr)) {
                    else_part = expr->as.pair.cdr->as.pair.cdr->as.pair.cdr->as.pair.car;
                }
                gc_push_root(else_part);
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
                gc_pop_root(); // else_part
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
                Value* temp_sym = make_symbol("%%case-temp"); gc_push_root(temp_sym);
                Value* cond_clauses = make_nil(); gc_push_root(cond_clauses);
                Value* c = clauses;
                while (is_pair(c)) {
                    Value* clause = c->as.pair.car;
                    Value* data = clause->as.pair.car;
                    Value* exprs = clause->as.pair.cdr;
                    Value* cond_clause;
                    if (is_symbol(data) && strcmp(data->as.symbol, "else") == 0) {
                        Value* else_sym = make_symbol("else"); gc_push_root(else_sym);
                        cond_clause = make_pair(else_sym, exprs);
                        gc_pop_root();
                    } else {
                        Value* quote_sym = make_symbol("quote"); gc_push_root(quote_sym);
                        Value* q_data = make_pair(quote_sym, make_pair(data, make_nil())); gc_push_root(q_data);
                        Value* memv_sym = make_symbol("memv"); gc_push_root(memv_sym);
                        Value* test = make_pair(memv_sym, make_pair(temp_sym, make_pair(q_data, make_nil())));
                        gc_pop_root(); // memv_sym
                        gc_pop_root(); // q_data
                        gc_pop_root(); // quote_sym
                        cond_clause = make_pair(test, exprs);
                    }
                    gc_push_root(cond_clause);
                    cond_clauses = make_pair(cond_clause, cond_clauses);
                    gc_pop_root(); // cond_clause
                    gc_pop_root(); // old cond_clauses
                    gc_push_root(cond_clauses);
                    c = c->as.pair.cdr;
                }
                Value* r_clauses = make_nil(); gc_push_root(r_clauses);
                while (is_pair(cond_clauses)) {
                    r_clauses = make_pair(cond_clauses->as.pair.car, r_clauses);
                    gc_pop_root(); gc_push_root(r_clauses);
                    cond_clauses = cond_clauses->as.pair.cdr;
                }
                Value* cond_sym = make_symbol("cond"); gc_push_root(cond_sym);
                Value* cond = make_pair(cond_sym, r_clauses); gc_push_root(cond);
                Value* let_sym = make_symbol("let"); gc_push_root(let_sym);
                Value* let = make_pair(let_sym, make_pair(make_pair(make_pair(temp_sym, make_pair(key_expr, make_nil())), make_nil()), make_pair(cond, make_nil())));
                gc_push_root(let);
                compile_expr(pb, let, env, syntax_env, tail);
                gc_pop_root(); // let
                gc_pop_root(); // let_sym
                gc_pop_root(); // cond
                gc_pop_root(); // cond_sym
                gc_pop_root(); // r_clauses
                gc_pop_root(); // cond_clauses
                gc_pop_root(); // temp_sym
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
                    Value* vars = make_nil(); gc_push_root(vars);
                    Value* vals = make_nil(); gc_push_root(vals);
                    Value* b = bindings;
                    while (is_pair(b)) {
                        Value* binding = b->as.pair.car;
                        vars = make_pair(binding->as.pair.car, vars);
                        gc_pop_root(); gc_pop_root();
                        gc_push_root(vars); gc_push_root(vals);
                        vals = make_pair(binding->as.pair.cdr->as.pair.car, vals);
                        gc_pop_root(); gc_pop_root();
                        gc_push_root(vars); gc_push_root(vals);
                        b = b->as.pair.cdr;
                    }
                    Value* rvars = make_nil(); gc_push_root(rvars);
                    Value* rvals = make_nil(); gc_push_root(rvals);
                    while (is_pair(vars)) {
                        rvars = make_pair(vars->as.pair.car, rvars);
                        gc_pop_root(); gc_pop_root();
                        gc_push_root(rvars); gc_push_root(rvals);
                        rvals = make_pair(vals->as.pair.car, rvals);
                        gc_pop_root(); gc_pop_root();
                        gc_push_root(rvars); gc_push_root(rvals);
                        vars = vars->as.pair.cdr;
                        vals = vals->as.pair.cdr;
                    }
                    Value* lambda_sym = make_symbol("lambda"); gc_push_root(lambda_sym);
                    Value* lambda = make_pair(lambda_sym, make_pair(rvars, body)); gc_push_root(lambda);
                    Value* letrec_sym = make_symbol("letrec"); gc_push_root(letrec_sym);
                    Value* letrec_bindings = make_pair(make_pair(name_val, make_pair(lambda, make_nil())), make_nil()); gc_push_root(letrec_bindings);
                    Value* letrec = make_pair(letrec_sym, make_pair(letrec_bindings, make_pair(name_val, make_nil()))); gc_push_root(letrec);
                    Value* call = make_pair(letrec, rvals); gc_push_root(call);
                    compile_expr(pb, call, env, syntax_env, tail);
                    gc_pop_root(); // call
                    gc_pop_root(); // letrec
                    gc_pop_root(); // letrec_bindings
                    gc_pop_root(); // letrec_sym
                    gc_pop_root(); // lambda
                    gc_pop_root(); // lambda_sym
                    gc_pop_root(); // rvals
                    gc_pop_root(); // rvars
                    gc_pop_root(); // vals
                    gc_pop_root(); // vars
                    return;
                }
                Value* vars = make_nil(); gc_push_root(vars);
                Value* vals = make_nil(); gc_push_root(vals);
                Value* b = bindings;
                while (is_pair(b)) {
                    Value* binding = b->as.pair.car;
                    vars = make_pair(binding->as.pair.car, vars);
                    gc_pop_root(); gc_pop_root();
                    gc_push_root(vars); gc_push_root(vals);
                    vals = make_pair(binding->as.pair.cdr->as.pair.car, vals);
                    gc_pop_root(); gc_pop_root();
                    gc_push_root(vars); gc_push_root(vals);
                    b = b->as.pair.cdr;
                }
                Value* rvars = make_nil(); gc_push_root(rvars);
                Value* rvals = make_nil(); gc_push_root(rvals);
                while (is_pair(vars)) {
                    rvars = make_pair(vars->as.pair.car, rvars);
                    gc_pop_root(); gc_pop_root();
                    gc_push_root(rvars); gc_push_root(rvals);
                    rvals = make_pair(vals->as.pair.car, rvals);
                    gc_pop_root(); gc_pop_root();
                    gc_push_root(rvars); gc_push_root(rvals);
                    vars = vars->as.pair.cdr;
                    vals = vals->as.pair.cdr;
                }
                Value* lambda_sym = make_symbol("lambda"); gc_push_root(lambda_sym);
                Value* lambda = make_pair(lambda_sym, make_pair(rvars, body)); gc_push_root(lambda);
                Value* call = make_pair(lambda, rvals); gc_push_root(call);
                compile_expr(pb, call, env, syntax_env, tail);
                gc_pop_root(); // call
                gc_pop_root(); // lambda
                gc_pop_root(); // lambda_sym
                gc_pop_root(); // rvals
                gc_pop_root(); // rvars
                gc_pop_root(); // vals
                gc_pop_root(); // vars
                return;
            }
            if (strcmp(name, "let*") == 0) {
                Value* bindings = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr;
                if (is_nil(bindings)) {
                    compile_body(pb, body, env, syntax_env, tail);
                } else {
                    Value* first = bindings->as.pair.car;
                    Value* rest = bindings->as.pair.cdr;
                    Value* let_star_sym = make_symbol("let*"); gc_push_root(let_star_sym);
                    Value* inner = make_pair(let_star_sym, make_pair(rest, body)); gc_push_root(inner);
                    Value* let_sym = make_symbol("let"); gc_push_root(let_sym);
                    Value* let = make_pair(let_sym, make_pair(make_pair(first, make_nil()), make_pair(inner, make_nil()))); gc_push_root(let);
                    compile_expr(pb, let, env, syntax_env, tail);
                    gc_pop_root(); // let
                    gc_pop_root(); // let_sym
                    gc_pop_root(); // inner
                    gc_pop_root(); // let_star_sym
                }
                return;
            }
            if (strcmp(name, "letrec") == 0) {
                Value* bindings = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr;
                Value* vars = make_nil(); gc_push_root(vars);
                Value* b = bindings;
                while (is_pair(b)) {
                    vars = make_pair(b->as.pair.car->as.pair.car, vars);
                    gc_pop_root(); gc_push_root(vars);
                    b = b->as.pair.cdr;
                }

                // 1. Create a sub-prototype for the letrec body
                ProtoBuilder sub_pb;
                pb_init(&sub_pb);
                
                Value* new_env = make_pair(vars, env); gc_push_root(new_env);

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
                
                int n_args = 0;
                Value* v_ptr = vars;
                while (is_pair(v_ptr)) { n_args++; v_ptr = v_ptr->as.pair.cdr; }
                
                for (int i = 0; i < sub_pb.c_len; i++) gc_push_root(constants[i]);
                Value* sub_proto = make_proto(code, sub_pb.len, constants, sub_pb.c_len, n_args, false);
                for (int i = 0; i < sub_pb.c_len; i++) gc_pop_root();
                
                free(sub_pb.code);
                free(sub_pb.constants);
                gc_push_root(sub_proto);

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
                gc_pop_root(); // sub_proto
                gc_pop_root(); // new_env
                gc_pop_root(); // vars
                return;
            }
            if (strcmp(name, "define") == 0) {
                Value* sym = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr;
                
                if (is_pair(sym)) {
                    // (define (foo x) body) => (define foo (lambda (x) body))
                    Value* name_val = sym->as.pair.car;
                    Value* params = sym->as.pair.cdr;
                    Value* lambda_sym = make_symbol("lambda"); gc_push_root(lambda_sym);
                    Value* lambda = make_pair(lambda_sym, make_pair(params, body)); gc_push_root(lambda);
                    
                    compile_expr(pb, lambda, env, syntax_env, false);
                    int idx = pb_add_constant(pb, name_val);
                    pb_emit(pb, OP_DEF);
                    pb_emit2(pb, idx);
                    gc_pop_root(); // lambda
                    gc_pop_root(); // lambda_sym
                } else {
                    compile_expr(pb, body->as.pair.car, env, syntax_env, false);
                    int idx = pb_add_constant(pb, sym);
                    pb_emit(pb, OP_DEF);
                    pb_emit2(pb, idx);
                }
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
            if (strcmp(name, "define-syntax") == 0) {
                Value* sym = expr->as.pair.cdr->as.pair.car;
                Value* transformer_expr = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                if (is_pair(transformer_expr) && is_symbol(transformer_expr->as.pair.car) && strcmp(transformer_expr->as.pair.car->as.symbol, "syntax-rules") == 0) {
                    Value* literals = transformer_expr->as.pair.cdr->as.pair.car;
                    Value* rules = transformer_expr->as.pair.cdr->as.pair.cdr;
                    Value* macro = make_macro(literals, rules); gc_push_root(macro);
                    set_global(global_vm_ptr, sym, macro); // TODO: Properly handle syntax env
                    pb_emit(pb, OP_CONST);
                    pb_emit2(pb, pb_add_constant(pb, make_nil()));
                    if (tail) pb_emit(pb, OP_RET);
                    gc_pop_root(); // macro
                    return;
                }
            }
            if (strcmp(name, "let-syntax") == 0 || strcmp(name, "letrec-syntax") == 0) {
                Value* bindings = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr;
                Value* new_syntax_env = syntax_env; gc_push_root(new_syntax_env);
                Value* b = bindings;
                while (is_pair(b)) {
                    Value* binding = b->as.pair.car;
                    Value* sym = binding->as.pair.car;
                    Value* transformer_expr = binding->as.pair.cdr->as.pair.car;
                    Value* literals = transformer_expr->as.pair.cdr->as.pair.car;
                    Value* rules = transformer_expr->as.pair.cdr->as.pair.cdr;
                    Value* macro = make_macro(literals, rules); gc_push_root(macro);
                    Value* entry = make_pair(sym, macro); gc_push_root(entry);
                    new_syntax_env = make_pair(entry, new_syntax_env);
                    gc_pop_root(); // entry
                    gc_pop_root(); // macro
                    gc_pop_root(); // old new_syntax_env
                    gc_push_root(new_syntax_env);
                    b = b->as.pair.cdr;
                }
                compile_body(pb, body, env, new_syntax_env, tail);
                gc_pop_root(); // new_syntax_env
                return;
            }
            if (strcmp(name, "set!") == 0) {
                Value* sym = expr->as.pair.cdr->as.pair.car;
                Value* val_expr = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                compile_expr(pb, val_expr, env, syntax_env, false);
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
                if (is_symbol(p)) has_rest = true;

                Value* inner_env = make_pair(params, env); gc_push_root(inner_env);
                Value* sub_proto = compile(body, inner_env, syntax_env, num_args, has_rest); gc_push_root(sub_proto);
                int idx = pb_add_constant(pb, sub_proto);
                pb_emit(pb, OP_CLOSURE);
                pb_emit2(pb, idx);
                if (tail) pb_emit(pb, OP_RET);
                gc_pop_root(); // sub_proto
                gc_pop_root(); // inner_env
                return;
            }
        }

        // Procedure call
        int nargs = 0;
        Value* args = expr->as.pair.cdr;
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
    gc_push_root(expr);
    gc_push_root(env);
    gc_push_root(syntax_env);
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
    
    for (int i = 0; i < pb.c_len; i++) gc_push_root(constants[i]);
    Value* proto = make_proto(code, pb.len, constants, pb.c_len, (is_lambda ? num_args : 0), has_rest);
    for (int i = 0; i < pb.c_len; i++) gc_pop_root();
    
    free(pb.code);
    free(pb.constants);
    gc_pop_root(); // syntax_env
    gc_pop_root(); // env
    gc_pop_root(); // expr
    return proto;
}
