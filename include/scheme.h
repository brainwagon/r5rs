#ifndef SCHEME_H
#define SCHEME_H

#include <stdbool.h>

typedef enum {
    VAL_FIXNUM,
    VAL_BOOLEAN,
    VAL_NIL,
    VAL_SYMBOL,
    VAL_PAIR,
} ValueType;

typedef struct Value {
    ValueType type;
    bool marked;
    struct Value* next; // All objects are on a single linked list
    union {
        long fixnum;
        bool boolean;
        const char* symbol;
        struct {
            struct Value* car;
            struct Value* cdr;
        } pair;
    } as;
} Value;

Value* make_fixnum(long n);
Value* make_boolean(bool b);
Value* make_nil(void);
Value* make_symbol(const char* name);
Value* make_pair(Value* car, Value* cdr);

void gc_init(void);
Value* gc_alloc(ValueType type);
void gc_collect(void);
void gc_add_root(Value** root);

bool is_fixnum(Value* v);
bool is_boolean(Value* v);
bool is_nil(Value* v);
bool is_symbol(Value* v);
bool is_pair(Value* v);

#endif /* SCHEME_H */
