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

bool is_fixnum(Value* v);
bool is_boolean(Value* v);
bool is_nil(Value* v);
bool is_symbol(Value* v);
bool is_pair(Value* v);

#endif /* SCHEME_H */
