#include <scheme.h>
#include <vm.h>
#include <bignum.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <limits.h>
#include <ctype.h>

static Value* num_add(Value* a, Value* b) {
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

static Value* num_sub(Value* a, Value* b) {
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

static Value* num_mul(Value* a, Value* b) {
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

static int num_compare(Value* a, Value* b) {
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
    (void)vm;
    Value* res = make_fixnum(0);
    for (int i = 0; i < nargs; i++) res = num_add(res, args[i]);
    return res;
}

static Value* prim_sub(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs == 0) return make_fixnum(0);
    if (nargs == 1) return num_sub(make_fixnum(0), args[0]);
    Value* res = args[0];
    for (int i = 1; i < nargs; i++) res = num_sub(res, args[i]);
    return res;
}

static Value* prim_mul(VM* vm, int nargs, Value** args) {
    (void)vm;
    Value* res = make_fixnum(1);
    for (int i = 0; i < nargs; i++) res = num_mul(res, args[i]);
    return res;
}

static Value* prim_num_eq(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(args[i], args[i+1]) != 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_lt(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(args[i], args[i+1]) >= 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_gt(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(args[i], args[i+1]) <= 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_zero_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1) return make_boolean(false);
    return make_boolean(is_fixnum(args[0]) && args[0]->as.fixnum == 0);
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
    (void)vm;
    if (nargs >= 1) print_value(args[0], false);
    return make_nil();
}

static Value* prim_write(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs >= 1) print_value(args[0], true);
    return make_nil();
}

static Value* prim_newline(VM* vm, int nargs, Value** args) {
    (void)vm; (void)nargs; (void)args;
    printf("\n");
    return make_nil();
}

static Value* prim_eq_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) { fprintf(stderr, "eq? expects 2 args\n"); exit(1); }
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
    if (is_fixnum(a)) return make_boolean(a->as.fixnum == b->as.fixnum);
    if (is_char(a)) return make_boolean(a->as.character == b->as.character);
    return make_boolean(false);
}

static Value* prim_equal_p(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) { fprintf(stderr, "equal? expects 2 args\n"); exit(1); }
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
    if (nargs != 1 || !is_string(args[0])) { fprintf(stderr, "string->symbol expects 1 string\n"); exit(1); }
    return make_symbol(args[0]->as.string.str);
}

static Value* prim_symbol_to_string(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1 || !is_symbol(args[0])) { fprintf(stderr, "symbol->string expects 1 symbol\n"); exit(1); }
    return make_string(args[0]->as.symbol);
}

static Value* prim_not(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 1) { fprintf(stderr, "not expects 1 arg\n"); exit(1); }
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
    (void)vm;
    if (nargs < 1) return make_fixnum(1);
    Value* res = args[0];
    if (nargs == 1) {
        double v = is_real(res) ? res->as.real : (is_fixnum(res) ? (double)res->as.fixnum : bignum_to_double(res));
        return make_real(1.0 / v);
    }
    for (int i = 1; i < nargs; i++) {
        double v1 = is_real(res) ? res->as.real : (is_fixnum(res) ? (double)res->as.fixnum : bignum_to_double(res));
        double v2 = is_real(args[i]) ? args[i]->as.real : (is_fixnum(args[i]) ? (double)args[i]->as.fixnum : bignum_to_double(args[i]));
        res = make_real(v1 / v2);
    }
    return res;
}

static Value* prim_le(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(args[i], args[i+1]) > 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_ge(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs < 2) return make_boolean(true);
    for (int i = 0; i < nargs - 1; i++) {
        if (num_compare(args[i], args[i+1]) < 0) return make_boolean(false);
    }
    return make_boolean(true);
}

static Value* prim_quotient(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) return make_fixnum(0);
    if (is_fixnum(args[0]) && is_fixnum(args[1])) {
        if (args[1]->as.fixnum == 0) return make_fixnum(0);
        return make_fixnum(args[0]->as.fixnum / args[1]->as.fixnum);
    }
    // Fallback to double for now
    double v1 = is_real(args[0]) ? args[0]->as.real : (is_fixnum(args[0]) ? (double)args[0]->as.fixnum : bignum_to_double(args[0]));
    double v2 = is_real(args[1]) ? args[1]->as.real : (is_fixnum(args[1]) ? (double)args[1]->as.fixnum : bignum_to_double(args[1]));
    return make_fixnum((long)(v1 / v2));
}

static Value* prim_remainder(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) return make_fixnum(0);
    if (is_fixnum(args[0]) && is_fixnum(args[1])) {
        if (args[1]->as.fixnum == 0) return make_fixnum(0);
        return make_fixnum(args[0]->as.fixnum % args[1]->as.fixnum);
    }
    return make_fixnum(0);
}

static Value* prim_modulo(VM* vm, int nargs, Value** args) {
    (void)vm;
    if (nargs != 2) return make_fixnum(0);
    if (is_fixnum(args[0]) && is_fixnum(args[1])) {
        long a = args[0]->as.fixnum;
        long b = args[1]->as.fixnum;
        if (b == 0) return make_fixnum(0);
        long r = a % b;
        if ((r > 0 && b < 0) || (r < 0 && b > 0)) r += b;
        return make_fixnum(r);
    }
    return make_fixnum(0);
}

void vm_register_primitives(VM* vm) {
    // Core keywords
    set_global(vm, make_symbol("if"), make_symbol("if"));
    set_global(vm, make_symbol("define"), make_symbol("define"));
    set_global(vm, make_symbol("set!"), make_symbol("set!"));
    set_global(vm, make_symbol("lambda"), make_symbol("lambda"));
    set_global(vm, make_symbol("quote"), make_symbol("quote"));
    set_global(vm, make_symbol("begin"), make_symbol("begin"));
    set_global(vm, make_symbol("let"), make_symbol("let"));
    set_global(vm, make_symbol("cond"), make_symbol("cond"));

    set_global(vm, make_symbol("+"), make_primitive(prim_add));
    set_global(vm, make_symbol("-"), make_primitive(prim_sub));
    set_global(vm, make_symbol("*"), make_primitive(prim_mul));
    set_global(vm, make_symbol("/"), make_primitive(prim_div));
    set_global(vm, make_symbol("="), make_primitive(prim_num_eq));
    set_global(vm, make_symbol("<"), make_primitive(prim_lt));
    set_global(vm, make_symbol(">"), make_primitive(prim_gt));
    set_global(vm, make_symbol("<="), make_primitive(prim_le));
    set_global(vm, make_symbol(">="), make_primitive(prim_ge));
    set_global(vm, make_symbol("quotient"), make_primitive(prim_quotient));
    set_global(vm, make_symbol("remainder"), make_primitive(prim_remainder));
    set_global(vm, make_symbol("modulo"), make_primitive(prim_modulo));
    set_global(vm, make_symbol("not"), make_primitive(prim_not));
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
    set_global(vm, make_symbol("eq?"), make_primitive(prim_eq_p));
    set_global(vm, make_symbol("eqv?"), make_primitive(prim_eqv_p));
    set_global(vm, make_symbol("equal?"), make_primitive(prim_equal_p));
    set_global(vm, make_symbol("memq"), make_primitive(prim_memq));
    set_global(vm, make_symbol("memv"), make_primitive(prim_memv));
    set_global(vm, make_symbol("append"), make_primitive(prim_append));
    set_global(vm, make_symbol("string->symbol"), make_primitive(prim_string_to_symbol));
    set_global(vm, make_symbol("symbol->string"), make_primitive(prim_symbol_to_string));

    set_global(vm, make_symbol("make-string"), make_primitive(prim_make_string));

    set_global(vm, make_symbol("string-length"), make_primitive(prim_string_length));
    set_global(vm, make_symbol("string-ref"), make_primitive(prim_string_ref));
    set_global(vm, make_symbol("string-set!"), make_primitive(prim_string_set));
    set_global(vm, make_symbol("make-vector"), make_primitive(prim_make_vector));
    set_global(vm, make_symbol("vector-length"), make_primitive(prim_vector_length));
    set_global(vm, make_symbol("vector-ref"), make_primitive(prim_vector_ref));
    set_global(vm, make_symbol("vector-set!"), make_primitive(prim_vector_set));
    set_global(vm, make_symbol("char?"), make_primitive(prim_char_p));
    set_global(vm, make_symbol("char->integer"), make_primitive(prim_char_integer));
    set_global(vm, make_symbol("integer->char"), make_primitive(prim_integer_char));
    set_global(vm, make_symbol("char-alphabetic?"), make_primitive(prim_char_alphabetic_p));
    set_global(vm, make_symbol("char-numeric?"), make_primitive(prim_char_numeric_p));
    set_global(vm, make_symbol("char-whitespace?"), make_primitive(prim_char_whitespace_p));
    set_global(vm, make_symbol("char-upper-case?"), make_primitive(prim_char_upper_case_p));
    set_global(vm, make_symbol("char-lower-case?"), make_primitive(prim_char_lower_case_p));
    set_global(vm, make_symbol("display"), make_primitive(prim_display));
    set_global(vm, make_symbol("write"), make_primitive(prim_write));
    set_global(vm, make_symbol("newline"), make_primitive(prim_newline));
}
