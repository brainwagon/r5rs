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

    if (c == '"') {
        (*input)++;
        int cap = 32;
        int len = 0;
        char* buf = malloc(cap);
        while (**input && **input != '"') {
            if (**input == '\\') {
                (*input)++;
                if (**input == 'n') { buf[len++] = '\n'; (*input)++; }
                else if (**input == '\\') { buf[len++] = '\\'; (*input)++; }
                else if (**input == '"') { buf[len++] = '"'; (*input)++; }
                else { buf[len++] = **input; (*input)++; }
            } else {
                buf[len++] = **input;
                (*input)++;
            }
            if (len == cap) {
                cap *= 2;
                buf = realloc(buf, cap);
            }
        }
        if (**input == '"') (*input)++;
        buf[len] = '\0';
        Value* str = make_string(buf);
        free(buf);
        return str;
    }

    if (c == '#') {
        (*input)++;
        char next = **input;
        if (next == 't') {
            (*input)++;
            return make_boolean(true);
        } else if (next == 'f') {
            (*input)++;
            return make_boolean(false);
        } else if (next == '\\') { // Character
            (*input)++;
            const char* start = *input;
            int len = 0;
            while (**input && !isspace(**input) && **input != '(' && **input != ')' && **input != ';') {
                (*input)++;
                len++;
            }
            if (len == 1) {
                return make_char(start[0]);
            } else if (len == 5 && strncmp(start, "space", 5) == 0) {
                return make_char(' ');
            } else if (len == 7 && strncmp(start, "newline", 7) == 0) {
                return make_char('\n');
            }
            return NULL; // Invalid char
        } else if (next == '(') { // Vector
            (*input)++;
            Value* lst = read_list(input);
            int count = 0;
            Value* p = lst;
            while (is_pair(p)) {
                count++;
                p = p->as.pair.cdr;
            }
            Value* vec = make_vector(count, make_nil());
            p = lst;
            for (int i = 0; i < count; i++) {
                vec->as.vector.elements[i] = p->as.pair.car;
                p = p->as.pair.cdr;
            }
            return vec;
        }
        return NULL; // Error
    }

    // Number or Symbol
    const char* start = *input;
    int len = 0;
    while (**input && !isspace(**input) && **input != '(' && **input != ')' && **input != ';' && **input != '"') {
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
