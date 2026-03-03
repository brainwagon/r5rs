#include <unity.h>
#include <scheme.h>
#include <bignum.h>
#include <stdlib.h>
#include <string.h>

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

void test_bignum_basic(void) {
    Value* a = bignum_from_long(123456789);
    Value* b = bignum_from_long(987654321);
    
    Value* sum = bignum_add(a, b);
    char* s = bignum_to_string(sum);
    TEST_ASSERT_EQUAL_STRING("1111111110", s);
    free(s);
    
    Value* prod = bignum_mul(a, b);
    s = bignum_to_string(prod);
    TEST_ASSERT_EQUAL_STRING("121932631112635269", s);
    free(s);
}

void test_bignum_large(void) {
    // (fact 20) = 2432902008176640000
    Value* res = bignum_from_long(1);
    for (int i = 1; i <= 20; i++) {
        Value* v = bignum_from_long(i);
        res = bignum_mul(res, v);
    }
    char* s = bignum_to_string(res);
    TEST_ASSERT_EQUAL_STRING("2432902008176640000", s);
    free(s);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_bignum_basic);
    RUN_TEST(test_bignum_large);
    return UNITY_END();
}
