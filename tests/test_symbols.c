#include <unity.h>
#include <scheme.h>
#include <stdbool.h>

void setUp(void) {}
void tearDown(void) {}

void test_intern_symbol(void) {
    Value* s1 = make_symbol("foo");
    Value* s2 = make_symbol("foo");
    Value* s3 = make_symbol("bar");
    
    TEST_ASSERT_NOT_NULL(s1);
    TEST_ASSERT_NOT_NULL(s2);
    TEST_ASSERT_NOT_NULL(s3);
    
    TEST_ASSERT_TRUE(is_symbol(s1));
    TEST_ASSERT_TRUE(is_symbol(s2));
    
    // Symbols with same name should be pointer-equal (interned)
    TEST_ASSERT_EQUAL_PTR(s1, s2);
    TEST_ASSERT_FALSE(s1 == s3);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_intern_symbol);
    return UNITY_END();
}
