#include <unity.h>
struct VM* global_vm_ptr = NULL;
#include <scheme.h>
#include <stdbool.h>

void setUp(void) {}
void tearDown(void) {}

void test_make_fixnum(void) {
    Value* v = make_fixnum(42);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_fixnum(v));
    TEST_ASSERT_EQUAL_INT(42, v->as.fixnum);
}

void test_make_boolean(void) {
    Value* vt = make_boolean(true);
    TEST_ASSERT_NOT_NULL(vt);
    TEST_ASSERT_TRUE(is_boolean(vt));
    TEST_ASSERT_TRUE(vt->as.boolean);

    Value* vf = make_boolean(false);
    TEST_ASSERT_NOT_NULL(vf);
    TEST_ASSERT_TRUE(is_boolean(vf));
    TEST_ASSERT_FALSE(vf->as.boolean);
}

void test_make_nil(void) {
    Value* v = make_nil();
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_nil(v));
}

void test_make_pair(void) {
    Value* car = make_fixnum(1);
    Value* cdr = make_fixnum(2);
    Value* p = make_pair(car, cdr);
    
    TEST_ASSERT_NOT_NULL(p);
    TEST_ASSERT_TRUE(is_pair(p));
    TEST_ASSERT_EQUAL_PTR(car, p->as.pair.car);
    TEST_ASSERT_EQUAL_PTR(cdr, p->as.pair.cdr);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_make_fixnum);
    RUN_TEST(test_make_boolean);
    RUN_TEST(test_make_nil);
    RUN_TEST(test_make_pair);
    return UNITY_END();
}
