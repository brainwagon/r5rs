#include <bignum.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#define BASE 1000000000

Value* bignum_from_long(long n) {
    int sign = (n < 0) ? -1 : 1;
    unsigned long val = (n < 0) ? -n : n;
    
    uint32_t digits[4]; // Long is 64-bit max, so 20 digits max, 3 base-10^9 digits enough
    int len = 0;
    if (val == 0) {
        digits[len++] = 0;
    } else {
        while (val > 0) {
            digits[len++] = val % BASE;
            val /= BASE;
        }
    }
    return make_bignum(sign, digits, len);
}

static int compare_abs(Value* a, Value* b) {
    if (a->as.bignum.len > b->as.bignum.len) return 1;
    if (a->as.bignum.len < b->as.bignum.len) return -1;
    for (int i = a->as.bignum.len - 1; i >= 0; i--) {
        if (a->as.bignum.digits[i] > b->as.bignum.digits[i]) return 1;
        if (a->as.bignum.digits[i] < b->as.bignum.digits[i]) return -1;
    }
    return 0;
}

int bignum_compare(Value* a, Value* b) {
    if (a->as.bignum.sign > b->as.bignum.sign) return 1;
    if (a->as.bignum.sign < b->as.bignum.sign) return -1;
    int abs_cmp = compare_abs(a, b);
    return (a->as.bignum.sign == 1) ? abs_cmp : -abs_cmp;
}

static Value* add_abs(Value* a, Value* b, int sign) {
    int max_len = (a->as.bignum.len > b->as.bignum.len ? a->as.bignum.len : b->as.bignum.len);
    uint32_t* res_digits = malloc(sizeof(uint32_t) * (max_len + 1));
    uint64_t carry = 0;
    int i = 0;
    for (; i < max_len || carry; i++) {
        uint64_t sum = carry;
        if (i < a->as.bignum.len) sum += a->as.bignum.digits[i];
        if (i < b->as.bignum.len) sum += b->as.bignum.digits[i];
        res_digits[i] = sum % BASE;
        carry = sum / BASE;
    }
    Value* res = make_bignum(sign, res_digits, i);
    free(res_digits);
    return res;
}

static Value* sub_abs(Value* a, Value* b, int sign) {
    // Assumes |a| >= |b|
    uint32_t* res_digits = malloc(sizeof(uint32_t) * a->as.bignum.len);
    int64_t borrow = 0;
    int i = 0;
    for (; i < a->as.bignum.len; i++) {
        int64_t diff = (int64_t)a->as.bignum.digits[i] - borrow;
        if (i < b->as.bignum.len) diff -= b->as.bignum.digits[i];
        if (diff < 0) {
            diff += BASE;
            borrow = 1;
        } else {
            borrow = 0;
        }
        res_digits[i] = diff;
    }
    // Trim leading zeros
    while (i > 1 && res_digits[i - 1] == 0) i--;
    Value* res = make_bignum(sign, res_digits, i);
    free(res_digits);
    return res;
}

Value* bignum_add(Value* a, Value* b) {
    if (a->as.bignum.sign == b->as.bignum.sign) {
        return add_abs(a, b, a->as.bignum.sign);
    }
    if (compare_abs(a, b) >= 0) {
        return sub_abs(a, b, a->as.bignum.sign);
    } else {
        return sub_abs(b, a, b->as.bignum.sign);
    }
}

Value* bignum_sub(Value* a, Value* b) {
    if (a->as.bignum.sign != b->as.bignum.sign) {
        return add_abs(a, b, a->as.bignum.sign);
    }
    if (compare_abs(a, b) >= 0) {
        return sub_abs(a, b, a->as.bignum.sign);
    } else {
        return sub_abs(b, a, -a->as.bignum.sign);
    }
}

Value* bignum_mul(Value* a, Value* b) {
    int res_len = a->as.bignum.len + b->as.bignum.len;
    uint32_t* res_digits = calloc(res_len, sizeof(uint32_t));
    for (int i = 0; i < a->as.bignum.len; i++) {
        uint64_t carry = 0;
        for (int j = 0; j < b->as.bignum.len || carry; j++) {
            uint64_t cur = res_digits[i + j] + carry + (uint64_t)a->as.bignum.digits[i] * (j < b->as.bignum.len ? b->as.bignum.digits[j] : 0);
            res_digits[i + j] = cur % BASE;
            carry = cur / BASE;
        }
    }
    int i = res_len;
    while (i > 1 && res_digits[i - 1] == 0) i--;
    Value* res = make_bignum(a->as.bignum.sign * b->as.bignum.sign, res_digits, i);
    free(res_digits);
    return res;
}

char* bignum_to_string(Value* v) {
    int cap = v->as.bignum.len * 9 + 2;
    char* str = malloc(cap);
    char* p = str;
    if (v->as.bignum.sign == -1) *p++ = '-';
    
    p += sprintf(p, "%u", v->as.bignum.digits[v->as.bignum.len - 1]);
    for (int i = v->as.bignum.len - 2; i >= 0; i--) {
        p += sprintf(p, "%09u", v->as.bignum.digits[i]);
    }
    return str;
}

double bignum_to_double(Value* v) {
    double res = 0;
    double factor = 1;
    for (int i = 0; i < v->as.bignum.len; i++) {
        res += (double)v->as.bignum.digits[i] * factor;
        factor *= BASE;
    }
    return res * v->as.bignum.sign;
}
