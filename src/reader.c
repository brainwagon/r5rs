#include <reader.h>
#include <ctype.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

static void skip_whitespace(const char** input) {
    while (**input && (isspace(**input) || **input == ';')) {
        if (**input == ';') {
            while (**input && **input != '\n') (*input)++;
        } else {
            (*input)++;
        }
    }
}

static Value* read_list(const char** input) {
    skip_whitespace(input);
    if (**input == ')') {
        (*input)++;
        return make_nil();
    }
    
    Value* car = read_sexpr_str(input);
    
    skip_whitespace(input);
    if (**input == '.') {
        // Check if it's a dotted pair or just a symbol starting with '.'
        const char* next = (*input) + 1;
        if (isspace(*next) || *next == '(' || *next == ')' || *next == ';' || *next == '\0') {
            (*input)++;
            Value* cdr = read_sexpr_str(input);
            skip_whitespace(input);
            if (**input == ')') {
                (*input)++;
            }
            return make_pair(car, cdr);
        }
    }
    
    Value* cdr = read_list(input);
    return make_pair(car, cdr);
}

Value* read_sexpr_str(const char** input) {
    skip_whitespace(input);
    if (!**input) return NULL;

    char c = **input;
    if (c == '(') {
        (*input)++;
        return read_list(input);
    }
    
    if (c == '\'') {
        (*input)++;
        Value* quoted = read_sexpr_str(input);
        return make_pair(make_symbol("quote"), make_pair(quoted, make_nil()));
    }

    if (c == '#') {
        (*input)++;
        char next = **input;
        (*input)++;
        if (next == 't') return make_boolean(true);
        if (next == 'f') return make_boolean(false);
        return NULL; // Error
    }

    // Number or Symbol
    const char* start = *input;
    int len = 0;
    while (**input && !isspace(**input) && **input != '(' && **input != ')' && **input != ';') {
        (*input)++;
        len++;
    }

    char* atom = malloc(len + 1);
    strncpy(atom, start, len);
    atom[len] = '\0';

    char* endptr;
    long n = strtol(atom, &endptr, 10);
    if (*endptr == '\0') {
        free(atom);
        return make_fixnum(n);
    }

    Value* sym = make_symbol(atom);
    free(atom);
    return sym;
}
