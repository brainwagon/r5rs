#include <scheme.h>
#include <vm.h>
#include <stdlib.h>
#include <string.h>

static Value* prim_add(int nargs, Value** args) {
    long sum = 0;
    for (int i = 0; i < nargs; i++) {
        sum += args[i]->as.fixnum;
    }
    return make_fixnum(sum);
}

static Value* prim_sub(int nargs, Value** args) {
    if (nargs == 0) return make_fixnum(0);
    long res = args[0]->as.fixnum;
    if (nargs == 1) return make_fixnum(-res);
    for (int i = 1; i < nargs; i++) {
        res -= args[i]->as.fixnum;
    }
    return make_fixnum(res);
}

static Value* prim_mul(int nargs, Value** args) {
    long prod = 1;
    for (int i = 0; i < nargs; i++) {
        prod *= args[i]->as.fixnum;
    }
    return make_fixnum(prod);
}

static Value* prim_num_eq(int nargs, Value** args) {
    if (nargs < 2) return make_boolean(true);
    long first = args[0]->as.fixnum;
    for (int i = 1; i < nargs; i++) {
        if (args[i]->as.fixnum != first) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_zero_p(int nargs, Value** args) {
    if (nargs != 1) return make_boolean(false);
    return make_boolean(args[0]->as.fixnum == 0);
}

void vm_register_primitives(VM* vm) {
    set_global(vm, make_symbol("+"), make_primitive(prim_add));
    set_global(vm, make_symbol("-"), make_primitive(prim_sub));
    set_global(vm, make_symbol("*"), make_primitive(prim_mul));
    set_global(vm, make_symbol("="), make_primitive(prim_num_eq));
    set_global(vm, make_symbol("zero?"), make_primitive(prim_zero_p));
}
