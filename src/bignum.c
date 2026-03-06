#define _POSIX_C_SOURCE 200809L
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

static Value* schoolbook_mul(Value* a, Value* b) {
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

static Value* bignum_shift(Value* a, int k) {
    if (k == 0) return a;
    if (bignum_is_zero(a)) return a;
    
    int new_len = a->as.bignum.len + k;
    uint32_t* res_digits = calloc(new_len, sizeof(uint32_t));
    memcpy(res_digits + k, a->as.bignum.digits, a->as.bignum.len * sizeof(uint32_t));
    
    Value* res = make_bignum(a->as.bignum.sign, res_digits, new_len);
    free(res_digits);
    return res;
}

Value* bignum_mul(Value* a, Value* b) {
    int n = (a->as.bignum.len > b->as.bignum.len ? a->as.bignum.len : b->as.bignum.len);
    
    // Threshold for Karatsuba
    if (n < 32) {
        return schoolbook_mul(a, b);
    }
    
    int k = n / 2;
    
    // x = x1 * B^k + x0
    // y = y1 * B^k + y0
    
    Value* x0 = make_bignum(1, a->as.bignum.digits, (a->as.bignum.len < k ? a->as.bignum.len : k));
    gc_push_root(x0);
    Value* x1;
    if (a->as.bignum.len <= k) {
        x1 = bignum_from_long(0);
    } else {
        x1 = make_bignum(1, a->as.bignum.digits + k, a->as.bignum.len - k);
    }
    gc_push_root(x1);
    
    Value* y0 = make_bignum(1, b->as.bignum.digits, (b->as.bignum.len < k ? b->as.bignum.len : k));
    gc_push_root(y0);
    Value* y1;
    if (b->as.bignum.len <= k) {
        y1 = bignum_from_long(0);
    } else {
        y1 = make_bignum(1, b->as.bignum.digits + k, b->as.bignum.len - k);
    }
    gc_push_root(y1);
    
    // z2 = x1 * y1
    Value* z2 = bignum_mul(x1, y1);
    gc_push_root(z2);
    
    // z0 = x0 * y0
    Value* z0 = bignum_mul(x0, y0);
    gc_push_root(z0);
    
    // z1 = (x1 + x0) * (y1 + y0) - z2 - z0
    Value* x1x0 = bignum_add(x1, x0);
    gc_push_root(x1x0);
    Value* y1y0 = bignum_add(y1, y0);
    gc_push_root(y1y0);
    
    Value* z1 = bignum_mul(x1x0, y1y0);
    gc_push_root(z1);
    z1 = bignum_sub(z1, z2);
    gc_pop_root(); gc_push_root(z1);
    z1 = bignum_sub(z1, z0);
    gc_pop_root(); gc_push_root(z1);
    
    // res = z2 * B^(2k) + z1 * B^k + z0
    Value* z2_shifted = bignum_shift(z2, 2 * k);
    gc_push_root(z2_shifted);
    Value* z1_shifted = bignum_shift(z1, k);
    gc_push_root(z1_shifted);
    
    Value* res = bignum_add(z2_shifted, z1_shifted);
    gc_push_root(res);
    res = bignum_add(res, z0);
    
    res->as.bignum.sign = a->as.bignum.sign * b->as.bignum.sign;
    
    // Pop all roots
    gc_pop_root(); // res
    gc_pop_root(); // z1_shifted
    gc_pop_root(); // z2_shifted
    gc_pop_root(); // z1
    gc_pop_root(); // y1y0
    gc_pop_root(); // x1x0
    gc_pop_root(); // z0
    gc_pop_root(); // z2
    gc_pop_root(); // y1
    gc_pop_root(); // y0
    gc_pop_root(); // x1
    gc_pop_root(); // x0
    
    return res;
}

char* bignum_to_string(Value* v) {
    if (v->as.bignum.len == 0) return strdup("0");
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

Value* bignum_div_long(Value* a, long b, long* rem) {
    int sign = (b < 0) ? -a->as.bignum.sign : a->as.bignum.sign;
    unsigned long divisor = (b < 0) ? -b : b;
    
    uint32_t* res_digits = malloc(sizeof(uint32_t) * a->as.bignum.len);
    uint64_t remainder = 0;
    
    for (int i = a->as.bignum.len - 1; i >= 0; i--) {
        uint64_t cur = a->as.bignum.digits[i] + remainder * BASE;
        res_digits[i] = cur / divisor;
        remainder = cur % divisor;
    }
    
    if (rem) *rem = (long)remainder * a->as.bignum.sign;
    
    int len = a->as.bignum.len;
    while (len > 1 && res_digits[len - 1] == 0) len--;
    
    Value* res = make_bignum(sign, res_digits, len);
    free(res_digits);
    return res;
}

// Full bignum division (Knuth's Algorithm D or simplified for now)
// For Machin's formula, divisor is usually small, but let's implement at least 
// division by bignum that fits in uint64_t
void bignum_div_rem(Value* a, Value* b, Value** q, Value** r) {
    if (bignum_is_zero(b)) {
        // Division by zero - should probably be handled by the VM
        return;
    }

    if (b->as.bignum.len == 1) {
        long rem;
        Value* quotient = bignum_div_long(a, (long)b->as.bignum.digits[0] * b->as.bignum.sign, &rem);
        if (q) *q = quotient;
        if (r) *r = bignum_from_long(rem);
        return;
    }

    int cmp = compare_abs(a, b);
    if (cmp < 0) {
        if (q) *q = bignum_from_long(0);
        if (r) *r = a;
        return;
    }

    // Algorithm D implementation
    int n = b->as.bignum.len;
    int m = a->as.bignum.len - n;

    // Normalization: shift left so the most significant digit of b is >= BASE/2
    uint32_t d = BASE / (b->as.bignum.digits[n - 1] + 1);
    
    // We can use schoolbook multiplication by d as a way to "shift"
    Value* v_val = make_bignum(1, b->as.bignum.digits, b->as.bignum.len);
    gc_push_root(v_val);
    if (d > 1) {
        Value* d_val = bignum_from_long(d);
        gc_push_root(d_val);
        v_val = schoolbook_mul(v_val, d_val);
        gc_pop_root(); gc_pop_root(); gc_push_root(v_val);
    }

    Value* u_val = make_bignum(1, a->as.bignum.digits, a->as.bignum.len);
    gc_push_root(u_val);
    if (d > 1) {
        Value* d_val = bignum_from_long(d);
        gc_push_root(d_val);
        u_val = schoolbook_mul(u_val, d_val);
        gc_pop_root(); gc_pop_root(); gc_push_root(u_val);
    }

    // Ensure u has m+n+1 digits (might already have if d > 1)
    if (u_val->as.bignum.len == a->as.bignum.len) {
        uint32_t* new_u = calloc(u_val->as.bignum.len + 1, sizeof(uint32_t));
        memcpy(new_u, u_val->as.bignum.digits, u_val->as.bignum.len * sizeof(uint32_t));
        Value* next_u = make_bignum(1, new_u, u_val->as.bignum.len + 1);
        free(new_u);
        gc_pop_root(); u_val = next_u; gc_push_root(u_val);
    }

    uint32_t* q_digits = calloc(m + 1, sizeof(uint32_t));
    uint32_t* u = u_val->as.bignum.digits;
    uint32_t* v = v_val->as.bignum.digits;

    for (int j = m; j >= 0; j--) {
        // Estimate q_hat
        uint64_t u_top = (uint64_t)u[j + n] * BASE + u[j + n - 1];
        uint64_t q_hat = u_top / v[n - 1];
        uint64_t r_hat = u_top % v[n - 1];

        while (q_hat >= BASE || q_hat * v[n - 2] > BASE * r_hat + u[j + n - 2]) {
            q_hat--;
            r_hat += v[n - 1];
            if (r_hat >= BASE) break;
        }

        // Multiply and subtract
        int64_t borrow = 0;
        for (int i = 0; i < n; i++) {
            uint64_t prod = q_hat * v[i];
            int64_t diff = (int64_t)u[j + i] - (prod % BASE) - borrow;
            if (diff < 0) {
                u[j + i] = diff + BASE;
                borrow = (prod / BASE) + 1;
            } else {
                u[j + i] = diff;
                borrow = (prod / BASE);
            }
        }
        int64_t diff = (int64_t)u[j + n] - borrow;
        if (diff < 0) {
            // Add back if q_hat was too large
            q_hat--;
            u[j + n] = diff + BASE; // effectively adding BASE^n is handled by borrow chain
            // But Algorithm D says add v back to u[j..j+n]
            uint64_t carry = 0;
            for (int i = 0; i < n; i++) {
                uint64_t sum = (uint64_t)u[j + i] + v[i] + carry;
                u[j + i] = sum % BASE;
                carry = sum / BASE;
            }
            u[j + n] = (u[j + n] + carry) % BASE;
        } else {
            u[j + n] = diff;
        }
        q_digits[j] = (uint32_t)q_hat;
    }

    if (q) {
        int q_len = m + 1;
        while (q_len > 1 && q_digits[q_len - 1] == 0) q_len--;
        *q = make_bignum(a->as.bignum.sign * b->as.bignum.sign, q_digits, q_len);
    }
    if (r) {
        // Denormalize u to get remainder
        Value* rem_val = make_bignum(1, u, n);
        if (d > 1) {
            long dummy;
            rem_val = bignum_div_long(rem_val, d, &dummy);
        }
        rem_val->as.bignum.sign = a->as.bignum.sign;
        *r = rem_val;
    }

    free(q_digits);
    gc_pop_root(); // u_val
    gc_pop_root(); // v_val
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

bool bignum_is_zero(Value* v) {
    return v->as.bignum.len == 1 && v->as.bignum.digits[0] == 0;
}

bool bignum_is_odd(Value* v) {
    return v->as.bignum.digits[0] % 2 != 0;
}

bool bignum_is_negative(Value* v) {
    return v->as.bignum.sign < 0;
}

Value* bignum_expt(Value* base, Value* exp) {
    // Both base and exp are bignums. exp is assumed non-negative.
    if (bignum_is_zero(exp)) return bignum_from_long(1);
    
    Value* res = bignum_from_long(1);
    gc_push_root(res);
    
    Value* b = base;
    gc_push_root(b);
    
    Value* e = exp;
    gc_push_root(e);
    
    while (!bignum_is_zero(e)) {
        if (bignum_is_odd(e)) {
            res = bignum_mul(res, b);
            gc_pop_root(); gc_push_root(res);
        }
        
        long rem;
        e = bignum_div_long(e, 2, &rem);
        gc_pop_root(); gc_pop_root(); // pop res, e
        gc_push_root(e); gc_push_root(res);
        
        if (!bignum_is_zero(e)) {
            b = bignum_mul(b, b);
            gc_pop_root(); gc_pop_root(); gc_pop_root(); // pop res, e, b
            gc_push_root(b); gc_push_root(e); gc_push_root(res);
        }
    }
    
    Value* final_res = res;
    gc_pop_root(); gc_pop_root(); gc_pop_root();
    return final_res;
}
