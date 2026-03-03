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
}
