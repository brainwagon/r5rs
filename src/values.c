#define _POSIX_C_SOURCE 200809L
#include <scheme.h>
#include <stdlib.h>
#include <string.h>

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

Value* make_proto(unsigned char* code, int code_len, Value** constants, int num_constants, int num_args) {
    Value* v = gc_alloc(VAL_PROTOTYPE);
    if (v) {
        v->as.proto.code = code;
        v->as.proto.code_len = code_len;
        v->as.proto.constants = constants;
        v->as.proto.num_constants = num_constants;
        v->as.proto.num_args = num_args;
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

bool is_fixnum(Value* v) { return v && v->type == VAL_FIXNUM; }
bool is_boolean(Value* v) { return v && v->type == VAL_BOOLEAN; }
bool is_nil(Value* v) { return v && v->type == VAL_NIL; }
bool is_symbol(Value* v) { return v && v->type == VAL_SYMBOL; }
bool is_pair(Value* v) { return v && v->type == VAL_PAIR; }
bool is_closure(Value* v) { return v && v->type == VAL_CLOSURE; }
bool is_proto(Value* v) { return v && v->type == VAL_PROTOTYPE; }
bool is_primitive(Value* v) { return v && v->type == VAL_PRIMITIVE; }
bool is_continuation(Value* v) { return v && v->type == VAL_CONTINUATION; }
