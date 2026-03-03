#include <unity.h>
#include <scheme.h>
#include <stdlib.h>

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

void test_make_proto(void) {
    unsigned char* code = malloc(5);
    Value** constants = malloc(sizeof(Value*) * 2);
    constants[0] = make_fixnum(42);
    constants[1] = make_boolean(true);
    
    Value* proto = make_proto(code, 5, constants, 2, 1);
    TEST_ASSERT_NOT_NULL(proto);
    TEST_ASSERT_EQUAL(VAL_PROTOTYPE, proto->type);
    TEST_ASSERT_EQUAL(code, proto->as.proto.code);
    TEST_ASSERT_EQUAL(5, proto->as.proto.code_len);
    TEST_ASSERT_EQUAL(constants, proto->as.proto.constants);
    TEST_ASSERT_EQUAL(2, proto->as.proto.num_constants);
    TEST_ASSERT_EQUAL(1, proto->as.proto.num_args);
    TEST_ASSERT_TRUE(is_proto(proto));
}

void test_make_closure(void) {
    Value* proto = make_proto(NULL, 0, NULL, 0, 0);
    Value* env = make_nil();
    Value* closure = make_closure(proto, env);
    
    TEST_ASSERT_NOT_NULL(closure);
    TEST_ASSERT_EQUAL(VAL_CLOSURE, closure->type);
    TEST_ASSERT_EQUAL(proto, closure->as.closure.proto);
    TEST_ASSERT_EQUAL(env, closure->as.closure.env);
    TEST_ASSERT_TRUE(is_closure(closure));
}

Value* dummy_primitive(int nargs, Value** args) {
    (void)nargs; (void)args;
    return make_nil();
}

void test_make_primitive(void) {
    Value* prim = make_primitive(dummy_primitive);
    TEST_ASSERT_NOT_NULL(prim);
    TEST_ASSERT_EQUAL(VAL_PRIMITIVE, prim->type);
    TEST_ASSERT_EQUAL(dummy_primitive, prim->as.primitive);
    TEST_ASSERT_TRUE(is_primitive(prim));
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_make_proto);
    RUN_TEST(test_make_closure);
    RUN_TEST(test_make_primitive);
    return UNITY_END();
}
