#ifndef SCHEME_H
#define SCHEME_H

#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

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
    OP_CALLCC,  // [1]
    OP_DUP,     // [1]
    OP_APPLY,   // [1]
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
    VAL_CONTINUATION,
    VAL_RAW,
    VAL_STRING,
    VAL_VECTOR,
    VAL_CHAR,
    VAL_BIGNUM,
    VAL_REAL,
    VAL_MACRO,
} ValueType;

struct VM; // Forward declaration

typedef struct Value {
    ValueType type;
    bool marked;
    struct Value* next; // All objects are on a single linked list
    union {
        long fixnum;
        bool boolean;
        char character;
        double real;
        const char* symbol;
        struct {
            uint32_t* digits;
            int len;
            int sign; // 1 for pos, -1 for neg
        } bignum;
        struct {
            char* str;
            int len;
        } string;
        struct {
            struct Value** elements;
            int len;
        } vector;
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
            bool has_rest;
        } proto;
        struct {
            struct Value* proto; // VAL_PROTOTYPE
            struct Value* env;   // VAL_PAIR or VAL_NIL (linked list of frames)
        } closure;
        struct Value* (*primitive)(struct VM* vm, int nargs, struct Value** args);
        struct {
            struct Value** stack;
            int sp;
            struct Value* env;
            struct Value* proto;
            unsigned char* pc;
        } cont;
        struct {
            struct Value* literals; // List of symbols
            struct Value* rules;    // List of (pattern . template) pairs
        } macro;
        void* raw;
    } as;
} Value;

Value* make_fixnum(long n);
Value* make_boolean(bool b);
Value* make_char(char c);
Value* make_string(const char* s);
Value* make_vector(int len, Value* fill);
Value* make_bignum(int sign, uint32_t* digits, int len);
Value* make_real(double d);
Value* make_macro(Value* literals, Value* rules);
Value* make_nil(void);
Value* make_symbol(const char* name);
Value* make_pair(Value* car, Value* cdr);
Value* make_proto(unsigned char* code, int code_len, Value** constants, int num_constants, int num_args, bool has_rest);
Value* make_closure(Value* proto, Value* env);
Value* make_primitive(Value* (*primitive)(struct VM* vm, int nargs, struct Value** args));
Value* make_continuation(struct Value** stack, int sp, struct Value* env, struct Value* proto, unsigned char* pc);
Value* make_raw(void* p);

void gc_init(void);
void gc_shutdown(void);
Value* gc_alloc(ValueType type);
void gc_collect(void);
void gc_add_root(Value** root);
void gc_remove_root(Value** root);
void gc_push_root(Value* v);
void gc_pop_root(void);
void gc_set_stack_root(Value*** stack, int* sp);
int gc_get_object_count(void);

bool is_fixnum(Value* v);
bool is_boolean(Value* v);
bool is_char(Value* v);
bool is_string(Value* v);
bool is_vector(Value* v);
bool is_bignum(Value* v);
bool is_real(Value* v);
bool is_macro(Value* v);
bool is_nil(Value* v);
bool is_symbol(Value* v);
bool is_pair(Value* v);
bool is_closure(Value* v);
bool is_proto(Value* v);
bool is_primitive(Value* v);
bool is_continuation(Value* v);

void print_value(Value* v, bool quoted);
void fprint_value(FILE* f, Value* v, bool quoted);

#endif /* SCHEME_H */
