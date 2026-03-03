#define _POSIX_C_SOURCE 200809L
#include <scheme.h>
#include <bignum.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

Value* make_fixnum(long n) {
    Value* v = gc_alloc(VAL_FIXNUM);
    if (v) v->as.fixnum = n;
    return v;
}

Value* make_boolean(bool b) {
    Value* v = gc_alloc(VAL_BOOLEAN);
    if (v) v->as.boolean = b;
    return v;
}

Value* make_char(char c) {
    Value* v = gc_alloc(VAL_CHAR);
    if (v) v->as.character = c;
    return v;
}

Value* make_string(const char* s) {
    Value* v = gc_alloc(VAL_STRING);
    if (v) {
        v->as.string.len = strlen(s);
        v->as.string.str = strdup(s);
    }
    return v;
}

Value* make_vector(int len, Value* fill) {
    Value* v = gc_alloc(VAL_VECTOR);
    if (v) {
        v->as.vector.len = len;
        v->as.vector.elements = malloc(sizeof(Value*) * len);
        for (int i = 0; i < len; i++) {
            v->as.vector.elements[i] = fill;
        }
    }
    return v;
}

Value* make_bignum(int sign, uint32_t* digits, int len) {
    Value* v = gc_alloc(VAL_BIGNUM);
    if (v) {
        v->as.bignum.sign = sign;
        v->as.bignum.len = len;
        v->as.bignum.digits = malloc(sizeof(uint32_t) * len);
        memcpy(v->as.bignum.digits, digits, sizeof(uint32_t) * len);
    }
    return v;
}

Value* make_real(double d) {
    Value* v = gc_alloc(VAL_REAL);
    if (v) v->as.real = d;
    return v;
}

Value* make_macro(Value* literals, Value* rules) {
    Value* v = gc_alloc(VAL_MACRO);
    if (v) {
        v->as.macro.literals = literals;
        v->as.macro.rules = rules;
    }
    return v;
}

Value* make_nil(void) {
    return gc_alloc(VAL_NIL);
}

static Value* symbol_registry = NULL;

Value* make_symbol(const char* name) {
    if (!symbol_registry) gc_add_root(&symbol_registry);
    Value* current = symbol_registry;
    while (current) {
        Value* sym = current->as.pair.car;
        if (strcmp(sym->as.symbol, name) == 0) return sym;
        current = current->as.pair.cdr;
    }
    Value* v = gc_alloc(VAL_SYMBOL);
    if (v) {
        v->as.symbol = strdup(name);
        Value* link = gc_alloc(VAL_PAIR);
        if (link) {
            link->as.pair.car = v;
            link->as.pair.cdr = symbol_registry;
            symbol_registry = link;
        }
    }
    return v;
}

Value* make_pair(Value* car, Value* cdr) {
    Value* v = gc_alloc(VAL_PAIR);
    if (v) {
        v->as.pair.car = car;
        v->as.pair.cdr = cdr;
    }
    return v;
}

Value* make_proto(unsigned char* code, int code_len, Value** constants, int num_constants, int num_args, bool has_rest) {
    Value* v = gc_alloc(VAL_PROTOTYPE);
    if (v) {
        v->as.proto.code = code;
        v->as.proto.code_len = code_len;
        v->as.proto.constants = constants;
        v->as.proto.num_constants = num_constants;
        v->as.proto.num_args = num_args;
        v->as.proto.has_rest = has_rest;
    }
    return v;
}

Value* make_closure(Value* proto, Value* env) {
    Value* v = gc_alloc(VAL_CLOSURE);
    if (v) {
        v->as.closure.proto = proto;
        v->as.closure.env = env;
    }
    return v;
}

Value* make_primitive(Value* (*primitive)(struct VM* vm, int nargs, Value** args)) {
    Value* v = gc_alloc(VAL_PRIMITIVE);
    if (v) v->as.primitive = primitive;
    return v;
}

Value* make_continuation(Value** stack, int sp, Value* env, Value* proto, unsigned char* pc) {
    Value* v = gc_alloc(VAL_CONTINUATION);
    if (v) {
        v->as.cont.stack = malloc(sizeof(Value*) * sp);
        memcpy(v->as.cont.stack, stack, sizeof(Value*) * sp);
        v->as.cont.sp = sp;
        v->as.cont.env = env;
        v->as.cont.proto = proto;
        v->as.cont.pc = pc;
    }
    return v;
}

Value* make_raw(void* p) {
    Value* v = gc_alloc(VAL_RAW);
    if (v) v->as.raw = p;
    return v;
}

void print_value(Value* v, bool quoted) {
    if (!v) { printf("NULL"); return; }
    switch (v->type) {
        case VAL_FIXNUM: printf("%ld", v->as.fixnum); break;
        case VAL_BOOLEAN: printf(v->as.boolean ? "#t" : "#f"); break;
        case VAL_CHAR:
            if (quoted) {
                if (v->as.character == '\n') printf("#\\newline");
                else if (v->as.character == ' ') printf("#\\space");
                else printf("#\\%c", v->as.character);
            } else {
                printf("%c", v->as.character);
            }
            break;
        case VAL_STRING:
            if (quoted) printf("\"%s\"", v->as.string.str);
            else printf("%s", v->as.string.str);
            break;
        case VAL_VECTOR:
            printf("#(");
            for (int i = 0; i < v->as.vector.len; i++) {
                print_value(v->as.vector.elements[i], quoted);
                if (i < v->as.vector.len - 1) printf(" ");
            }
            printf(")");
            break;
        case VAL_BIGNUM: {
            char* s = bignum_to_string(v);
            printf("%s", s);
            free(s);
            break;
        }
        case VAL_REAL: printf("%g", v->as.real); break;
        case VAL_MACRO: printf("#<macro>"); break;
        case VAL_NIL: printf("()"); break;
        case VAL_SYMBOL: printf("%s", v->as.symbol); break;
        case VAL_PAIR:
            printf("(");
            while (is_pair(v)) {
                print_value(v->as.pair.car, quoted);
                v = v->as.pair.cdr;
                if (is_pair(v)) printf(" ");
            }
            if (!is_nil(v)) {
                printf(" . ");
                print_value(v, quoted);
            }
            printf(")");
            break;
        case VAL_CLOSURE: printf("#<closure>"); break;
        case VAL_PROTOTYPE: printf("#<prototype>"); break;
        case VAL_PRIMITIVE: printf("#<primitive>"); break;
        case VAL_CONTINUATION: printf("#<continuation>"); break;
        case VAL_RAW: printf("#<raw %p>", v->as.raw); break;
    }
}

bool is_fixnum(Value* v) { return v && v->type == VAL_FIXNUM; }
bool is_boolean(Value* v) { return v && v->type == VAL_BOOLEAN; }
bool is_char(Value* v) { return v && v->type == VAL_CHAR; }
bool is_string(Value* v) { return v && v->type == VAL_STRING; }
bool is_vector(Value* v) { return v && v->type == VAL_VECTOR; }
bool is_bignum(Value* v) { return v && v->type == VAL_BIGNUM; }
bool is_real(Value* v) { return v && v->type == VAL_REAL; }
bool is_macro(Value* v) { return v && v->type == VAL_MACRO; }
bool is_nil(Value* v) { return v && v->type == VAL_NIL; }
bool is_symbol(Value* v) { return v && v->type == VAL_SYMBOL; }
bool is_pair(Value* v) { return v && v->type == VAL_PAIR; }
bool is_closure(Value* v) { return v && v->type == VAL_CLOSURE; }
bool is_proto(Value* v) { return v && v->type == VAL_PROTOTYPE; }
bool is_primitive(Value* v) { return v && v->type == VAL_PRIMITIVE; }
bool is_continuation(Value* v) { return v && v->type == VAL_CONTINUATION; }
