#include <reader.h>
#include <bignum.h>
#include <ctype.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <errno.h>

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

static Value* parse_numeric_atom(const char* atom) {
    char* endptr;
    
    // Check if it's a real (contains '.')
    if (strchr(atom, '.')) {
        double d = strtod(atom, &endptr);
        if (*endptr == '\0') return make_real(d);
    }
    
    // Try parsing as fixnum
    errno = 0;
    long n = strtol(atom, &endptr, 10);
    if (*endptr == '\0' && (isdigit(atom[0]) || ((atom[0] == '-' || atom[0] == '+') && isdigit(atom[1])))) {
        if (errno != ERANGE) return make_fixnum(n);
    } else {
        if (!isdigit(atom[0]) && !((atom[0] == '-' || atom[0] == '+') && isdigit(atom[1]))) return NULL;
    }
    
    // Fallback to bignum
    int sign = 1;
    const char* p = atom;
    if (*p == '-') { sign = -1; p++; }
    else if (*p == '+') { p++; }
    
    if (!isdigit(*p)) return NULL;
    
    Value* res = bignum_from_long(0);
    Value* ten = bignum_from_long(10);
    while (*p >= '0' && *p <= '9') {
        Value* digit = bignum_from_long(*p - '0');
        res = bignum_add(bignum_mul(res, ten), digit);
        p++;
    }
    if (*p == '\0') {
        res->as.bignum.sign = sign;
        return res;
    }
    
    return NULL;
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
            if (len >= cap - 1) {
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
        } else if (next == '\\') {
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
            return NULL;
        } else if (next == '(') {
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
    }

    const char* start = *input;
    int len = 0;
    while (**input && !isspace(**input) && **input != '(' && **input != ')' && **input != ';' && **input != '"') {
        (*input)++;
        len++;
    }

    char* atom = malloc(len + 1);
    strncpy(atom, start, len);
    atom[len] = '\0';

    Value* num = parse_numeric_atom(atom);
    if (num) {
        free(atom);
        return num;
    }

    Value* sym = make_symbol(atom);
    free(atom);
    return sym;
}
