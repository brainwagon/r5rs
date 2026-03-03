#include <compiler.h>
#include <stdlib.h>
#include <string.h>

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
        env = env->as.pair.cdr;
        d++;
    }
    return false;
}

static void compile_expr(ProtoBuilder* pb, Value* expr, Value* env, bool tail);

static void compile_expr(ProtoBuilder* pb, Value* expr, Value* env, bool tail) {
    if (is_fixnum(expr) || is_boolean(expr) || is_nil(expr) || is_char(expr) || is_string(expr) || is_vector(expr)) {
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

                compile_expr(pb, test, env, false);
                pb_emit(pb, OP_JF);
                int jf_pos = pb->len;
                pb_emit2(pb, 0); 
                
                compile_expr(pb, then_part, env, tail);
                int jump_pos = -1;
                if (!tail) {
                    pb_emit(pb, OP_JUMP);
                    jump_pos = pb->len;
                    pb_emit2(pb, 0);
                }
                
                int else_start = pb->len;
                pb->code[jf_pos] = (else_start - jf_pos - 2) >> 8;
                pb->code[jf_pos + 1] = (else_start - jf_pos - 2) & 0xFF;
                
                compile_expr(pb, else_part, env, tail);
                if (!tail) {
                    int end_pos = pb->len;
                    pb->code[jump_pos] = (end_pos - jump_pos - 2) >> 8;
                    pb->code[jump_pos + 1] = (end_pos - jump_pos - 2) & 0xFF;
                }
                return;
            }
            if (strcmp(name, "define") == 0) {
                Value* sym = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                compile_expr(pb, body, env, false);
                int idx = pb_add_constant(pb, sym);
                pb_emit(pb, OP_DEF);
                pb_emit2(pb, idx);
                if (tail) {
                    pb_emit(pb, OP_RET);
                }
                return;
            }
            if (strcmp(name, "set!") == 0) {
                Value* sym = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                compile_expr(pb, body, env, false);
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
                Value* exprs = expr->as.pair.cdr;
                if (is_nil(exprs)) {
                    // Empty begin returns unspecified, let's say NIL
                    pb_emit(pb, OP_CONST);
                    pb_emit2(pb, pb_add_constant(pb, make_nil()));
                    if (tail) pb_emit(pb, OP_RET);
                    return;
                }
                while (is_pair(exprs)) {
                    Value* e = exprs->as.pair.car;
                    exprs = exprs->as.pair.cdr;
                    if (is_nil(exprs)) {
                        // Last expression
                        compile_expr(pb, e, env, tail);
                    } else {
                        // Not last, ignore result
                        compile_expr(pb, e, env, false);
                        pb_emit(pb, OP_POP);
                    }
                }
                return;
            }
            if (strcmp(name, "lambda") == 0) {
                Value* params = expr->as.pair.cdr->as.pair.car;
                Value* body = expr->as.pair.cdr->as.pair.cdr->as.pair.car;
                
                int num_args = 0;
                Value* p = params;
                while (is_pair(p)) {
                    num_args++;
                    p = p->as.pair.cdr;
                }
                
                Value* new_env = make_pair(params, env);
                Value* proto = compile(body, new_env, num_args);
                
                int idx = pb_add_constant(pb, proto);
                pb_emit(pb, OP_CLOSURE);
                pb_emit2(pb, idx);
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
            if (strcmp(name, "call/cc") == 0 || strcmp(name, "call-with-current-continuation") == 0) {
                Value* receiver = expr->as.pair.cdr->as.pair.car;
                compile_expr(pb, receiver, env, false);
                pb_emit(pb, OP_CALLCC);
                if (tail) pb_emit(pb, OP_RET);
                return;
            }
        }
        
        // Procedure call
        Value* args = expr->as.pair.cdr;
        int nargs = 0;
        while (is_pair(args)) {
            compile_expr(pb, args->as.pair.car, env, false);
            args = args->as.pair.cdr;
            nargs++;
        }
        compile_expr(pb, car, env, false);
        pb_emit(pb, tail ? OP_TCALL : OP_CALL);
        pb_emit(pb, (unsigned char)nargs);
        return;
    }
}

Value* compile(Value* expr, Value* env, int num_args) {
    ProtoBuilder pb;
    pb_init(&pb);
    bool is_lambda = (num_args >= 0);
    compile_expr(&pb, expr, env, is_lambda);
    if (!is_lambda) pb_emit(&pb, OP_HALT);
    
    unsigned char* code = malloc(pb.len);
    memcpy(code, pb.code, pb.len);
    Value** constants = malloc(sizeof(Value*) * pb.c_len);
    memcpy(constants, pb.constants, sizeof(Value*) * pb.c_len);
    
    Value* proto = make_proto(code, pb.len, constants, pb.c_len, (is_lambda ? num_args : 0));
    free(pb.code);
    free(pb.constants);
    return proto;
}
