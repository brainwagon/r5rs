#define _POSIX_C_SOURCE 200809L
#include <scheme.h>
#include <vm.h>
#include <bignum.h>
#include <reader.h>
#include <compiler.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <limits.h>
#include <ctype.h>
#include <unistd.h>

static bool is_number(Value* v) {
    return is_fixnum(v) || is_bignum(v) || is_real(v);
}

static void ensure_number(VM* vm, Value* v, const char* op) {
    if (!is_number(v)) {
        vm_error(vm, "%s: expected number, got something else", op);
    }
}

static Value* num_add(VM* vm, Value* a, Value* b) {
    ensure_number(vm, a, "+");
    ensure_number(vm, b, "+");
    if (is_fixnum(a) && is_fixnum(b)) {
        long va = a->as.fixnum;
        long vb = b->as.fixnum;
        long res = va + vb;
        if (((va ^ res) & (vb ^ res)) < 0) {
            return bignum_add(bignum_from_long(va), bignum_from_long(vb));
        }
        return make_fixnum(res);
    }
    if (is_real(a) || is_real(b)) {
        double va = is_real(a) ? a->as.real : (is_fixnum(a) ? (double)a->as.fixnum : bignum_to_double(a));
        double vb = is_real(b) ? b->as.real : (is_fixnum(b) ? (double)b->as.fixnum : bignum_to_double(b));
        return make_real(va + vb);
    }
    Value* ba = is_bignum(a) ? a : bignum_from_long(a->as.fixnum);
    Value* bb = is_bignum(b) ? b : bignum_from_long(b->as.fixnum);
    return bignum_add(ba, bb);
}

static Value* num_sub(VM* vm, Value* a, Value* b) {
    ensure_number(vm, a, "-");
    ensure_number(vm, b, "-");
    if (is_fixnum(a) && is_fixnum(b)) {
        long va = a->as.fixnum;
        long vb = b->as.fixnum;
        long res = va - vb;
        if (((va ^ vb) & (va ^ res)) < 0) {
            return bignum_sub(bignum_from_long(va), bignum_from_long(vb));
        }
        return make_fixnum(res);
    }
    if (is_real(a) || is_real(b)) {
        double va = is_real(a) ? a->as.real : (is_fixnum(a) ? (double)a->as.fixnum : bignum_to_double(a));
        double vb = is_real(b) ? b->as.real : (is_fixnum(b) ? (double)b->as.fixnum : bignum_to_double(b));
        return make_real(va - vb);
    }
    Value* ba = is_bignum(a) ? a : bignum_from_long(a->as.fixnum);
    Value* bb = is_bignum(b) ? b : bignum_from_long(b->as.fixnum);
    return bignum_sub(ba, bb);
}

static Value* num_mul(VM* vm, Value* a, Value* b) {
    ensure_number(vm, a, "*");
    ensure_number(vm, b, "*");
    if (is_fixnum(a) && is_fixnum(b)) {
        long va = a->as.fixnum;
        long vb = b->as.fixnum;
        if (va == 0 || vb == 0) return make_fixnum(0);
        if (va > 0 && vb > 0 && va > LONG_MAX / vb) goto mul_overflow;
        if (va > 0 && vb < 0 && vb < LONG_MIN / va) goto mul_overflow;
        if (va < 0 && vb > 0 && va < LONG_MIN / vb) goto mul_overflow;
        if (va < 0 && vb < 0 && va < LONG_MAX / vb) goto mul_overflow;
        return make_fixnum(va * vb);
    mul_overflow:
        return bignum_mul(bignum_from_long(va), bignum_from_long(vb));
    }
    if (is_real(a) || is_real(b)) {
        double va = is_real(a) ? a->as.real : (is_fixnum(a) ? (double)a->as.fixnum : bignum_to_double(a));
        double vb = is_real(b) ? b->as.real : (is_fixnum(b) ? (double)b->as.fixnum : bignum_to_double(b));
        return make_real(va * vb);
    }
    Value* ba = is_bignum(a) ? a : bignum_from_long(a->as.fixnum);
    Value* bb = is_bignum(b) ? b : bignum_from_long(b->as.fixnum);
    return bignum_mul(ba, bb);
}

static int num_compare(VM* vm, Value* a, Value* b, const char* op) {
    ensure_number(vm, a, op);
    ensure_number(vm, b, op);
    if (is_fixnum(a) && is_fixnum(b)) {
        if (a->as.fixnum > b->as.fixnum) return 1;
        if (a->as.fixnum < b->as.fixnum) return -1;
        return 0;
    }
    if (is_real(a) || is_real(b)) {
        double va = is_real(a) ? a->as.real : (is_fixnum(a) ? (double)a->as.fixnum : bignum_to_double(a));
        double vb = is_real(b) ? b->as.real : (is_fixnum(b) ? (double)b->as.fixnum : bignum_to_double(b));
        if (va > vb) return 1;
        if (va < vb) return -1;
        return 0;
    }
    Value* ba = is_bignum(a) ? a : bignum_from_long(a->as.fixnum);
    Value* bb = is_bignum(b) ? b : bignum_from_long(b->as.fixnum);
    return bignum_compare(ba, bb);
}

static Value* prim_add(VM* vm, int nargs, Value** args) {
    Value* res = make_fixnum(0);
    for (int i = 0; i < nargs; i++) res = num_add(vm, res, args[i]);
    return res;
}

static Value* prim_sub(VM* vm, int nargs, Value** args) {
    if (nargs == 0) return make_fixnum(0);
    if (nargs == 1) return num_sub(vm, make_fixnum(0), args[0]);
    Value* res = args[0];
    for (int i = 1; i < nargs; i++) res = num_sub(vm, res, args[i]);
    return res;
}

static Value* prim_mul(VM* vm, int nargs, Value** args) {
    Value* res = make_fixnum(1);
    for (int i = 0; i < nargs; i++) res = num_mul(vm, res, args[i]);
    return res;
}

static Value* prim_num_eq(VM* vm, int nargs, Value** args) {
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(vm, args[i], args[i+1], "=") != 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_lt(VM* vm, int nargs, Value** args) {
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(vm, args[i], args[i+1], "<") >= 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_gt(VM* vm, int nargs, Value** args) {
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(vm, args[i], args[i+1], ">") <= 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_zero_p(VM* vm, int nargs, Value** args) {
    if (nargs != 1) { vm_error(vm, "zero? expects 1 arg"); }
    ensure_number(vm, args[0], "zero?");
    if (is_fixnum(args[0])) return make_boolean(args[0]->as.fixnum == 0);
    if (is_real(args[0])) return make_boolean(args[0]->as.real == 0.0);
    if (is_bignum(args[0])) return make_boolean(bignum_compare(args[0], bignum_from_long(0)) == 0);
    return make_boolean(false);
}

static Value* prim_cons(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) return make_nil();
    return make_pair(args[0], args[1]);
}

static Value* prim_car(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_pair(args[0])) return make_nil();
    return args[0]->as.pair.car;
}

static Value* prim_cdr(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_pair(args[0])) return make_nil();
    return args[0]->as.pair.cdr;
}

static Value* prim_list(VM* vm, int nargs, Value** args) {
    (void)vm;
    Value* res = make_nil();
    for (int i = nargs - 1; i >= 0; i--) {
        res = make_pair(args[i], res);
    }
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
    return make_boolean(nargs == 1 && (is_fixnum(args[0]) || is_bignum(args[0]) || is_real(args[0])));
}

static Value* prim_boolean_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_boolean(args[0]));
}

static Value* prim_null_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_nil(args[0]));
}

static Value* prim_display(VM* vm, int nargs, Value** args) {
    if (nargs >= 1) fprint_value(vm->out, args[0], false);
    return make_nil();
}

static Value* prim_write(VM* vm, int nargs, Value** args) {
    if (nargs >= 1) fprint_value(vm->out, args[0], true);
    return make_nil();
}

static Value* prim_newline(VM* vm, int nargs, Value** args) {
    (void)nargs; (void)args;
    if (isatty(fileno(vm->out)))
        fprintf(vm->out, "\r\n");
    else
        fprintf(vm->out, "\n");
    return make_nil();
}

static Value* prim_eq_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) { vm_error(vm, "eq? expects 2 args"); }
    return make_boolean(args[0] == args[1]);
}

static Value* prim_append(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs == 0) return make_nil();
    Value* res = args[nargs - 1];
    for (int i = nargs - 2; i >= 0; i--) {
        Value* list = args[i];
        Value* head = make_nil();
        Value* tail = NULL;
        Value* p = list;
        while (is_pair(p)) {
            Value* new_pair = make_pair(p->as.pair.car, make_nil());
            if (!tail) { head = new_pair; tail = new_pair; }
            else { tail->as.pair.cdr = new_pair; tail = new_pair; }
            p = p->as.pair.cdr;
        }
        if (tail) {
            tail->as.pair.cdr = res;
            res = head;
        }
    }
    return res;
}

static Value* prim_eqv_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) return make_boolean(false);
    Value* a = args[0];
    Value* b = args[1];
    if (a == b) return make_boolean(true);
    if (a->type != b->type) return make_boolean(false);
    if (is_nil(a)) return make_boolean(true);
    if (is_boolean(a)) return make_boolean(a->as.boolean == b->as.boolean);
    if (is_fixnum(a)) return make_boolean(a->as.fixnum == b->as.fixnum);
    if (is_char(a)) return make_boolean(a->as.character == b->as.character);
    if (is_real(a)) return make_boolean(a->as.real == b->as.real);
    if (is_bignum(a)) return make_boolean(bignum_compare(a, b) == 0);
    return make_boolean(false);
}

static Value* prim_equal_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) { vm_error(vm, "equal? expects 2 args"); }
    Value* a = args[0];
    Value* b = args[1];
    if (a == b) return make_boolean(true);
    if (a->type != b->type) return make_boolean(false);
    switch (a->type) {
        case VAL_PAIR: {
            Value* aa[2] = {a->as.pair.car, b->as.pair.car};
            if (!prim_equal_p(vm, 2, aa)->as.boolean) return make_boolean(false);
            Value* ab[2] = {a->as.pair.cdr, b->as.pair.cdr};
            return prim_equal_p(vm, 2, ab);
        }
        case VAL_STRING:
            return make_boolean(strcmp(a->as.string.str, b->as.string.str) == 0);
        case VAL_VECTOR: {
            if (a->as.vector.len != b->as.vector.len) return make_boolean(false);
            for (int i = 0; i < a->as.vector.len; i++) {
                Value* av[2] = {a->as.vector.elements[i], b->as.vector.elements[i]};
                if (!prim_equal_p(vm, 2, av)->as.boolean) return make_boolean(false);
            }
            return make_boolean(true);
        }
        default:
            return prim_eqv_p(vm, nargs, args);
    }
}

static Value* prim_string_to_symbol(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_string(args[0])) { vm_error(vm, "string->symbol expects 1 string"); }
    return make_symbol(args[0]->as.string.str);
}

static Value* prim_symbol_to_string(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_symbol(args[0])) { vm_error(vm, "symbol->string expects 1 symbol"); }
    return make_string(args[0]->as.symbol);
}

static Value* prim_not(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1) { vm_error(vm, "not expects 1 arg"); }
    return make_boolean(is_boolean(args[0]) && !args[0]->as.boolean);
}

static Value* prim_make_string(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 1) return make_nil();
    int len = args[0]->as.fixnum;
    char fill = (nargs > 1) ? args[1]->as.character : ' ';
    char* s = malloc(len + 1);
    memset(s, fill, len);
    s[len] = '\0';
    Value* v = make_string(s);
    free(s);
    return v;
}

static Value* prim_string_length(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_string(args[0])) return make_fixnum(0);
    return make_fixnum(strlen(args[0]->as.string.str));
}

static Value* prim_string_ref(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2 || !is_string(args[0]) || !is_fixnum(args[1])) return make_char('\0');
    return make_char(args[0]->as.string.str[args[1]->as.fixnum]);
}

static Value* prim_string_set(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 3 || !is_string(args[0]) || !is_fixnum(args[1]) || !is_char(args[2])) return make_nil();
    args[0]->as.string.str[args[1]->as.fixnum] = args[2]->as.character;
    return make_nil();
}

static Value* prim_make_vector(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 1) return make_nil();
    return make_vector(args[0]->as.fixnum, (nargs > 1) ? args[1] : make_nil());
}

static Value* prim_vector_length(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_vector(args[0])) return make_fixnum(0);
    return make_fixnum(args[0]->as.vector.len);
}

static Value* prim_vector_ref(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2 || !is_vector(args[0]) || !is_fixnum(args[1])) return make_nil();
    return args[0]->as.vector.elements[args[1]->as.fixnum];
}

static Value* prim_vector_set(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 3 || !is_vector(args[0]) || !is_fixnum(args[1])) return make_nil();
    args[0]->as.vector.elements[args[1]->as.fixnum] = args[2];
    return make_nil();
}

static Value* prim_char_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_char(args[0]));
}

static Value* prim_char_integer(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_char(args[0])) return make_fixnum(0);
    return make_fixnum((unsigned char)args[0]->as.character);
}

static Value* prim_integer_char(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_fixnum(args[0])) return make_char('\0');
    return make_char((char)args[0]->as.fixnum);
}

static Value* prim_char_alphabetic_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_char(args[0]) && isalpha(args[0]->as.character));
}

static Value* prim_char_numeric_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_char(args[0]) && isdigit(args[0]->as.character));
}

static Value* prim_char_whitespace_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_char(args[0]) && isspace(args[0]->as.character));
}

static Value* prim_char_upper_case_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_char(args[0]) && isupper(args[0]->as.character));
}

static Value* prim_char_lower_case_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    return make_boolean(nargs == 1 && is_char(args[0]) && islower(args[0]->as.character));
}

static Value* prim_memq(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) return make_boolean(false);
    Value* obj = args[0];
    Value* lst = args[1];
    while (is_pair(lst)) {
        if (lst->as.pair.car == obj) return lst;
        lst = lst->as.pair.cdr;
    }
    return make_boolean(false);
}

static Value* prim_memv(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) return make_boolean(false);
    Value* obj = args[0];
    Value* lst = args[1];
    while (is_pair(lst)) {
        Value* a[2] = {obj, lst->as.pair.car};
        if (prim_eqv_p(vm, 2, a)->as.boolean) return lst;
        lst = lst->as.pair.cdr;
    }
    return make_boolean(false);
}

static Value* prim_div(VM* vm, int nargs, Value** args) {
    if (nargs < 1) return make_fixnum(1);
    for (int i = 0; i < nargs; i++) ensure_number(vm, args[i], "/");
    Value* res = args[0];
    if (nargs == 1) {
        double v = is_real(res) ? res->as.real : (is_fixnum(res) ? (double)res->as.fixnum : bignum_to_double(res));
        if (v == 0.0) vm_error(vm, "/: division by zero");
        return make_real(1.0 / v);
    }
    for (int i = 1; i < nargs; i++) {
        double v1 = is_real(res) ? res->as.real : (is_fixnum(res) ? (double)res->as.fixnum : bignum_to_double(res));
        double v2 = is_real(args[i]) ? args[i]->as.real : (is_fixnum(args[i]) ? (double)args[i]->as.fixnum : bignum_to_double(args[i]));
        if (v2 == 0.0) vm_error(vm, "/: division by zero");
        res = make_real(v1 / v2);
    }
    return res;
}

static Value* prim_le(VM* vm, int nargs, Value** args) {
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(vm, args[i], args[i+1], "<=") > 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_ge(VM* vm, int nargs, Value** args) {
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(vm, args[i], args[i+1], ">=") < 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_quotient(VM* vm, int nargs, Value** args) {
    if (nargs != 2) { vm_error(vm, "quotient expects 2 args"); }
    ensure_number(vm, args[0], "quotient");
    ensure_number(vm, args[1], "quotient");
    if (is_fixnum(args[0]) && is_fixnum(args[1])) {
        if (args[1]->as.fixnum == 0) vm_error(vm, "quotient: division by zero");
        return make_fixnum(args[0]->as.fixnum / args[1]->as.fixnum);
    }
    Value* ba = is_bignum(args[0]) ? args[0] : bignum_from_long(is_fixnum(args[0]) ? args[0]->as.fixnum : (long)args[0]->as.real);
    gc_push_root(ba);
    Value* bb = is_bignum(args[1]) ? args[1] : bignum_from_long(is_fixnum(args[1]) ? args[1]->as.fixnum : (long)args[1]->as.real);
    gc_push_root(bb);
    if (bb->as.bignum.len == 1 && bb->as.bignum.digits[0] == 0) vm_error(vm, "quotient: division by zero");
    Value* q;
    bignum_div_rem(ba, bb, &q, NULL);
    gc_pop_root();
    gc_pop_root();
    return q;
}

static Value* prim_remainder(VM* vm, int nargs, Value** args) {
    if (nargs != 2) { vm_error(vm, "remainder expects 2 args"); }
    ensure_number(vm, args[0], "remainder");
    ensure_number(vm, args[1], "remainder");
    if (is_fixnum(args[0]) && is_fixnum(args[1])) {
        if (args[1]->as.fixnum == 0) vm_error(vm, "remainder: division by zero");
        return make_fixnum(args[0]->as.fixnum % args[1]->as.fixnum);
    }
    Value* ba = is_bignum(args[0]) ? args[0] : bignum_from_long(is_fixnum(args[0]) ? args[0]->as.fixnum : (long)args[0]->as.real);
    gc_push_root(ba);
    Value* bb = is_bignum(args[1]) ? args[1] : bignum_from_long(is_fixnum(args[1]) ? args[1]->as.fixnum : (long)args[1]->as.real);
    gc_push_root(bb);
    if (bb->as.bignum.len == 1 && bb->as.bignum.digits[0] == 0) vm_error(vm, "remainder: division by zero");
    Value* r;
    bignum_div_rem(ba, bb, NULL, &r);
    gc_pop_root();
    gc_pop_root();
    return r;
}

static Value* prim_modulo(VM* vm, int nargs, Value** args) {
    if (nargs != 2) { vm_error(vm, "modulo expects 2 args"); }
    ensure_number(vm, args[0], "modulo");
    ensure_number(vm, args[1], "modulo");
    if (is_fixnum(args[0]) && is_fixnum(args[1])) {
        long a = args[0]->as.fixnum;
        long b = args[1]->as.fixnum;
        if (b == 0) vm_error(vm, "modulo: division by zero");
        long r = a % b;
        if ((r > 0 && b < 0) || (r < 0 && b > 0)) r += b;
        return make_fixnum(r);
    }
    Value* ba = is_bignum(args[0]) ? args[0] : bignum_from_long(is_fixnum(args[0]) ? args[0]->as.fixnum : (long)args[0]->as.real);
    gc_push_root(ba);
    Value* bb = is_bignum(args[1]) ? args[1] : bignum_from_long(is_fixnum(args[1]) ? args[1]->as.fixnum : (long)args[1]->as.real);
    gc_push_root(bb);
    if (bb->as.bignum.len == 1 && bb->as.bignum.digits[0] == 0) vm_error(vm, "modulo: division by zero");
    Value* r;
    bignum_div_rem(ba, bb, NULL, &r);
    if ((r->as.bignum.sign == 1 && bb->as.bignum.sign == -1 && (r->as.bignum.len > 1 || r->as.bignum.digits[0] > 0)) ||
        (r->as.bignum.sign == -1 && bb->as.bignum.sign == 1 && (r->as.bignum.len > 1 || r->as.bignum.digits[0] > 0))) {
        r = bignum_add(r, bb);
    }
    gc_pop_root();
    gc_pop_root();
    return r;
}

static void register_prim(VM* vm, const char* name, Value* (*fn)(VM*, int, Value**)) {
    Value* sym = make_symbol(name);
    gc_push_root(sym);
    Value* prim = make_primitive(fn);
    gc_push_root(prim);
    set_global(vm, sym, prim);
    gc_pop_root();
    gc_pop_root();
}

static void register_keyword(VM* vm, const char* name) {
    Value* sym = make_symbol(name);
    gc_push_root(sym);
    set_global(vm, sym, sym);
    gc_pop_root();
}

static Value* prim_load(VM* vm, int nargs, Value** args) {
    if (nargs != 1 || !is_string(args[0])) { vm_error(vm, "load expects 1 string"); }
    const char* filename = args[0]->as.string.str;
    FILE* f = fopen(filename, "r");
    if (!f) { vm_error(vm, "load: cannot open file"); }
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    char* content = malloc(size + 1);
    fread(content, 1, size, f);
    content[size] = '\0';
    fclose(f);
    Value* result = make_nil();
    const char* p = content;
    while (p && *p) {
        while (*p && isspace(*p)) p++;
        if (!*p) break;
        Value* expr = read_sexpr_str(&p);
        if (!expr) break;
        Value* proto = compile(expr, make_nil(), vm->syntax_env, -1, false);
        result = vm_run(vm, proto);
        gc_collect();
    }
    free(content);
    return result;
}

#include <math.h>

static Value* prim_expt(VM* vm, int nargs, Value** args) {
    if (nargs != 2) { vm_error(vm, "expt expects 2 args"); }
    ensure_number(vm, args[0], "expt");
    ensure_number(vm, args[1], "expt");

    Value* base = args[0];
    Value* exp = args[1];

    // If exponent is an exact integer
    if (is_fixnum(exp) || is_bignum(exp)) {
        bool exp_neg = is_fixnum(exp) ? (exp->as.fixnum < 0) : bignum_is_negative(exp);
        bool exp_zero = is_fixnum(exp) ? (exp->as.fixnum == 0) : bignum_is_zero(exp);
        
        if (exp_zero) return make_fixnum(1);
        
        if (!exp_neg && (is_fixnum(base) || is_bignum(base))) {
            // Exact integer base and non-negative exact integer exponent -> Exact result
            Value* b_big = is_fixnum(base) ? bignum_from_long(base->as.fixnum) : base;
            gc_push_root(b_big);
            Value* e_big = is_fixnum(exp) ? bignum_from_long(exp->as.fixnum) : exp;
            gc_push_root(e_big);
            
            Value* res = bignum_expt(b_big, e_big);
            
            gc_pop_root();
            gc_pop_root();
            return res;
        }
    }

    double v1 = is_real(base) ? base->as.real : (is_fixnum(base) ? (double)base->as.fixnum : bignum_to_double(base));
    double v2 = is_real(exp) ? exp->as.real : (is_fixnum(exp) ? (double)exp->as.fixnum : bignum_to_double(exp));
    return make_real(pow(v1, v2));
}

static Value* prim_number_to_string(VM* vm, int nargs, Value** args) {
    if (nargs < 1 || nargs > 2) { vm_error(vm, "number->string expects 1 or 2 args"); }
    Value* n = args[0];
    ensure_number(vm, n, "number->string");
    
    int radix = 10;
    if (nargs == 2) {
        if (!is_fixnum(args[1])) { vm_error(vm, "number->string: radix must be a fixnum"); }
        radix = args[1]->as.fixnum;
        if (radix != 2 && radix != 8 && radix != 10 && radix != 16) {
            vm_error(vm, "number->string: unsupported radix %d", radix);
        }
    }

    char buf[128];
    if (is_fixnum(n)) {
        if (radix == 10) sprintf(buf, "%ld", n->as.fixnum);
        else if (radix == 8) sprintf(buf, "%lo", n->as.fixnum);
        else if (radix == 16) sprintf(buf, "%lx", n->as.fixnum);
        else if (radix == 2) {
            unsigned long val = (unsigned long)n->as.fixnum;
            if (n->as.fixnum < 0) {
                buf[0] = '-';
                val = (unsigned long)(-n->as.fixnum);
            } else {
                buf[0] = '\0';
            }
            char tmp[65];
            int i = 0;
            if (val == 0) tmp[i++] = '0';
            while (val > 0) {
                tmp[i++] = (val % 2) + '0';
                val /= 2;
            }
            int start = (buf[0] == '-') ? 1 : 0;
            for (int j = 0; j < i; j++) {
                buf[start + j] = tmp[i - 1 - j];
            }
            buf[start + i] = '\0';
        }
        return make_string(buf);
    } else if (is_real(n)) {
        if (radix != 10) { vm_error(vm, "number->string: radix must be 10 for reals"); }
        sprintf(buf, "%g", n->as.real);
        return make_string(buf);
    } else if (is_bignum(n)) {
        if (radix != 10) { vm_error(vm, "number->string: radix must be 10 for bignums for now"); }
        char* s = bignum_to_string(n);
        Value* str = make_string(s);
        free(s);
        return str;
    }
    return make_string("");
}

void vm_register_primitives(VM* vm) {
    // Core keywords
    register_keyword(vm, "if");
    register_keyword(vm, "define");
    register_keyword(vm, "set!");
    register_keyword(vm, "lambda");
    register_keyword(vm, "quote");
    register_keyword(vm, "begin");
    register_keyword(vm, "let");
    register_keyword(vm, "cond");

    register_prim(vm, "load", prim_load);
    register_prim(vm, "+", prim_add);
    register_prim(vm, "-", prim_sub);
    register_prim(vm, "*", prim_mul);
    register_prim(vm, "/", prim_div);
    register_prim(vm, "=", prim_num_eq);
    register_prim(vm, "<", prim_lt);
    register_prim(vm, ">", prim_gt);
    register_prim(vm, "<=", prim_le);
    register_prim(vm, ">=", prim_ge);
    register_prim(vm, "quotient", prim_quotient);
    register_prim(vm, "remainder", prim_remainder);
    register_prim(vm, "modulo", prim_modulo);
    register_prim(vm, "not", prim_not);
    register_prim(vm, "zero?", prim_zero_p);
    register_prim(vm, "cons", prim_cons);
    register_prim(vm, "car", prim_car);
    register_prim(vm, "cdr", prim_cdr);
    register_prim(vm, "list", prim_list);
    register_prim(vm, "pair?", prim_pair_p);
    register_prim(vm, "symbol?", prim_symbol_p);
    register_prim(vm, "number?", prim_number_p);
    register_prim(vm, "boolean?", prim_boolean_p);
    register_prim(vm, "null?", prim_null_p);
    register_prim(vm, "eq?", prim_eq_p);
    register_prim(vm, "eqv?", prim_eqv_p);
    register_prim(vm, "equal?", prim_equal_p);
    register_prim(vm, "memq", prim_memq);
    register_prim(vm, "memv", prim_memv);
    register_prim(vm, "append", prim_append);
    register_prim(vm, "string->symbol", prim_string_to_symbol);
    register_prim(vm, "symbol->string", prim_symbol_to_string);

    register_prim(vm, "make-string", prim_make_string);

    register_prim(vm, "string-length", prim_string_length);
    register_prim(vm, "string-ref", prim_string_ref);
    register_prim(vm, "string-set!", prim_string_set);
    register_prim(vm, "make-vector", prim_make_vector);
    register_prim(vm, "vector-length", prim_vector_length);
    register_prim(vm, "vector-ref", prim_vector_ref);
    register_prim(vm, "vector-set!", prim_vector_set);
    register_prim(vm, "char?", prim_char_p);
    register_prim(vm, "char->integer", prim_char_integer);
    register_prim(vm, "integer->char", prim_integer_char);
    register_prim(vm, "char-alphabetic?", prim_char_alphabetic_p);
    register_prim(vm, "char-numeric?", prim_char_numeric_p);
    register_prim(vm, "char-whitespace?", prim_char_whitespace_p);
    register_prim(vm, "char-upper-case?", prim_char_upper_case_p);
    register_prim(vm, "char-lower-case?", prim_char_lower_case_p);
    register_prim(vm, "display", prim_display);
    register_prim(vm, "write", prim_write);
    register_prim(vm, "newline", prim_newline);
    register_prim(vm, "expt", prim_expt);
    register_prim(vm, "number->string", prim_number_to_string);
}

