#ifndef SCHEME_H
#define SCHEME_H

#include <stdbool.h>

typedef enum {
    OP_HALT,    // [1]
    OP_CONST,   // [1, idx:2] - idx is index in constant pool
    OP_LREF,    // [1, depth:1, idx:2] - depth and index in lexical env
    OP_LSET,    // [1, depth:1, idx:2]
    OP_GREF,    // [1, idx:2] - idx is symbol index in constant pool
    OP_GSET,    // [1, idx:2]
    OP_JUMP,    // [1, offset:2] - relative offset
    OP_JF,      // [1, offset:2]
    OP_CALL,    // [1, nargs:1]
    OP_TCALL,   // [1, nargs:1]
    OP_RET,     // [1]
    OP_CLOSURE, // [1, idx:2] - idx is proto index in constant pool
    OP_POP,     // [1]
    OP_DEF,     // [1, idx:2]
} OpCode;

typedef enum {
    VAL_FIXNUM,
    VAL_BOOLEAN,
    VAL_NIL,
    VAL_SYMBOL,
    VAL_PAIR,
    VAL_CLOSURE,
    VAL_PROTOTYPE,
    VAL_PRIMITIVE,
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
        struct {
            unsigned char* code;
            int code_len;
            struct Value** constants;
            int num_constants;
            int num_args;
        } proto;
        struct {
            struct Value* proto; // VAL_PROTOTYPE
            struct Value* env;   // VAL_PAIR or VAL_NIL (linked list of frames)
        } closure;
        struct Value* (*primitive)(int nargs, struct Value** args);
    } as;
} Value;

Value* make_fixnum(long n);
Value* make_boolean(bool b);
Value* make_nil(void);
Value* make_symbol(const char* name);
Value* make_pair(Value* car, Value* cdr);
Value* make_proto(unsigned char* code, int code_len, Value** constants, int num_constants, int num_args);
Value* make_closure(Value* proto, Value* env);
Value* make_primitive(Value* (*primitive)(int nargs, Value** args));

void gc_init(void);
Value* gc_alloc(ValueType type);
void gc_collect(void);
void gc_add_root(Value** root);

bool is_fixnum(Value* v);
bool is_boolean(Value* v);
bool is_nil(Value* v);
bool is_symbol(Value* v);
bool is_pair(Value* v);
bool is_closure(Value* v);
bool is_proto(Value* v);
bool is_primitive(Value* v);

#endif /* SCHEME_H */
