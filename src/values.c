#define _POSIX_C_SOURCE 200809L
#include <scheme.h>
#include <stdlib.h>
#include <string.h>

Value* make_fixnum(long n) {
    Value* v = gc_alloc(VAL_FIXNUM);
    if (v) {
        v->as.fixnum = n;
    }
    return v;
}

Value* make_boolean(bool b) {
    Value* v = gc_alloc(VAL_BOOLEAN);
    if (v) {
        v->as.boolean = b;
    }
    return v;
}

Value* make_nil(void) {
    return gc_alloc(VAL_NIL);
}

static Value* symbol_registry = NULL;

Value* make_symbol(const char* name) {
    if (!symbol_registry) {
        gc_add_root(&symbol_registry);
    }
    Value* current = symbol_registry;
    while (current) {
        Value* sym = current->as.pair.car;
        if (strcmp(sym->as.symbol, name) == 0) {
            return sym;
        }
        current = current->as.pair.cdr;
    }

    Value* v = gc_alloc(VAL_SYMBOL);
    if (v) {
        v->as.symbol = strdup(name);
        // Link it into the registry
        Value* link = gc_alloc(VAL_PAIR); // Internal link
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

bool is_fixnum(Value* v) { return v && v->type == VAL_FIXNUM; }
bool is_boolean(Value* v) { return v && v->type == VAL_BOOLEAN; }
bool is_nil(Value* v) { return v && v->type == VAL_NIL; }
bool is_symbol(Value* v) { return v && v->type == VAL_SYMBOL; }
bool is_pair(Value* v) { return v && v->type == VAL_PAIR; }
