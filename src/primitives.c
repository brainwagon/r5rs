#include <scheme.h>
#include <vm.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

static Value* prim_add(VM* vm, int nargs, Value** args) {
    (void)vm;
    long sum = 0;
    for (int i = 0; i < nargs; i++) sum += args[i]->as.fixnum;
    return make_fixnum(sum);
}

static Value* prim_sub(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs == 0) return make_fixnum(0);
    long res = args[0]->as.fixnum;
    if (nargs == 1) return make_fixnum(-res);
    for (int i = 1; i < nargs; i++) res -= args[i]->as.fixnum;
    return make_fixnum(res);
}

static Value* prim_mul(VM* vm, int nargs, Value** args) {
    (void)vm;
    long prod = 1;
    for (int i = 0; i < nargs; i++) prod *= args[i]->as.fixnum;
    return make_fixnum(prod);
}

static Value* prim_num_eq(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 2) return make_boolean(true);
    long first = args[0]->as.fixnum;
    for (int i = 1; i < nargs; i++) if (args[i]->as.fixnum != first) return make_boolean(false);
    return make_boolean(true);
}

static Value* prim_zero_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && args[0]->as.fixnum == 0);
}

static Value* prim_cons(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) { fprintf(stderr, "cons expects 2 args\n"); exit(1); }
    return make_pair(args[0], args[1]);
}

static Value* prim_car(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_pair(args[0])) { fprintf(stderr, "car expects a pair\n"); exit(1); }
    return args[0]->as.pair.car;
}

static Value* prim_cdr(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_pair(args[0])) { fprintf(stderr, "cdr expects a pair\n"); exit(1); }
    return args[0]->as.pair.cdr;
}

static Value* prim_list(VM* vm, int nargs, Value** args) {
    (void)vm;
    Value* res = make_nil();
    for (int i = nargs - 1; i >= 0; i--) res = make_pair(args[i], res);
    return res;
}

static Value* prim_pair_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_pair(args[0]));
}

static Value* prim_symbol_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_symbol(args[0]));
}

static Value* prim_number_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_fixnum(args[0]));
}

static Value* prim_boolean_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_boolean(args[0]));
}

static Value* prim_null_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_nil(args[0]));
}

static Value* prim_make_string(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 1 || nargs > 2 || !is_fixnum(args[0])) { fprintf(stderr, "make-string expects a length and optional char\n"); exit(1); }
    int len = args[0]->as.fixnum;
    char c = (nargs == 2 && is_char(args[1])) ? args[1]->as.character : ' ';
    char* buf = malloc(len + 1);
    memset(buf, c, len);
    buf[len] = '\0';
    Value* str = make_string(buf);
    free(buf);
    return str;
}

static Value* prim_string_ref(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2 || !is_string(args[0]) || !is_fixnum(args[1])) { fprintf(stderr, "string-ref expects a string and an index\n"); exit(1); }
    int idx = args[1]->as.fixnum;
    if (idx < 0 || idx >= args[0]->as.string.len) { fprintf(stderr, "string-ref index out of bounds\n"); exit(1); }
    return make_char(args[0]->as.string.str[idx]);
}

static Value* prim_string_set(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 3 || !is_string(args[0]) || !is_fixnum(args[1]) || !is_char(args[2])) { fprintf(stderr, "string-set! expects a string, index, and char\n"); exit(1); }
    int idx = args[1]->as.fixnum;
    if (idx < 0 || idx >= args[0]->as.string.len) { fprintf(stderr, "string-set! index out of bounds\n"); exit(1); }
    args[0]->as.string.str[idx] = args[2]->as.character;
    return make_nil(); // R5RS says return value is unspecified
}

static Value* prim_make_vector(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 1 || nargs > 2 || !is_fixnum(args[0])) { fprintf(stderr, "make-vector expects a length and optional fill\n"); exit(1); }
    int len = args[0]->as.fixnum;
    Value* fill = (nargs == 2) ? args[1] : make_nil(); // Unspecified in R5RS, using nil
    return make_vector(len, fill);
}

static Value* prim_vector_ref(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2 || !is_vector(args[0]) || !is_fixnum(args[1])) { fprintf(stderr, "vector-ref expects a vector and an index\n"); exit(1); }
    int idx = args[1]->as.fixnum;
    if (idx < 0 || idx >= args[0]->as.vector.len) { fprintf(stderr, "vector-ref index out of bounds\n"); exit(1); }
    return args[0]->as.vector.elements[idx];
}

static Value* prim_vector_set(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 3 || !is_vector(args[0]) || !is_fixnum(args[1])) { fprintf(stderr, "vector-set! expects a vector, index, and value\n"); exit(1); }
    int idx = args[1]->as.fixnum;
    if (idx < 0 || idx >= args[0]->as.vector.len) { fprintf(stderr, "vector-set! index out of bounds\n"); exit(1); }
    args[0]->as.vector.elements[idx] = args[2];
    return make_nil();
}

static Value* prim_char_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_char(args[0]));
}

static Value* prim_string_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_string(args[0]));
}

static Value* prim_vector_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_vector(args[0]));
}

static Value* prim_eqv_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) { fprintf(stderr, "eqv? expects 2 args\n"); exit(1); }
    Value* a = args[0];
    Value* b = args[1];
    if (a == b) return make_boolean(true);
    if (a->type != b->type) return make_boolean(false);
    if (a->type == VAL_FIXNUM) return make_boolean(a->as.fixnum == b->as.fixnum);
    if (a->type == VAL_CHAR) return make_boolean(a->as.character == b->as.character);
    return make_boolean(false);
}

static Value* prim_memv(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) { fprintf(stderr, "memv expects 2 args\n"); exit(1); }
    Value* key = args[0];
    Value* list = args[1];
    while (is_pair(list)) {
        Value* car = list->as.pair.car;
        bool match = false;
        if (key == car) match = true;
        else if (key->type == car->type) {
            if (key->type == VAL_FIXNUM) match = (key->as.fixnum == car->as.fixnum);
            else if (key->type == VAL_CHAR) match = (key->as.character == car->as.character);
        }
        if (match) return list;
        list = list->as.pair.cdr;
    }
    return make_boolean(false);
}

void vm_register_primitives(VM* vm) {
    set_global(vm, make_symbol("+"), make_primitive(prim_add));
    set_global(vm, make_symbol("-"), make_primitive(prim_sub));
    set_global(vm, make_symbol("*"), make_primitive(prim_mul));
    set_global(vm, make_symbol("="), make_primitive(prim_num_eq));
    set_global(vm, make_symbol("zero?"), make_primitive(prim_zero_p));
    set_global(vm, make_symbol("cons"), make_primitive(prim_cons));
    set_global(vm, make_symbol("car"), make_primitive(prim_car));
    set_global(vm, make_symbol("cdr"), make_primitive(prim_cdr));
    set_global(vm, make_symbol("list"), make_primitive(prim_list));
    set_global(vm, make_symbol("pair?"), make_primitive(prim_pair_p));
    set_global(vm, make_symbol("symbol?"), make_primitive(prim_symbol_p));
    set_global(vm, make_symbol("number?"), make_primitive(prim_number_p));
    set_global(vm, make_symbol("boolean?"), make_primitive(prim_boolean_p));
    set_global(vm, make_symbol("null?"), make_primitive(prim_null_p));
    
    set_global(vm, make_symbol("make-string"), make_primitive(prim_make_string));
    set_global(vm, make_symbol("string-ref"), make_primitive(prim_string_ref));
    set_global(vm, make_symbol("string-set!"), make_primitive(prim_string_set));
    set_global(vm, make_symbol("make-vector"), make_primitive(prim_make_vector));
    set_global(vm, make_symbol("vector-ref"), make_primitive(prim_vector_ref));
    set_global(vm, make_symbol("vector-set!"), make_primitive(prim_vector_set));
    set_global(vm, make_symbol("char?"), make_primitive(prim_char_p));
    set_global(vm, make_symbol("string?"), make_primitive(prim_string_p));
    set_global(vm, make_symbol("vector?"), make_primitive(prim_vector_p));
    set_global(vm, make_symbol("eqv?"), make_primitive(prim_eqv_p));
    set_global(vm, make_symbol("memv"), make_primitive(prim_memv));
}

