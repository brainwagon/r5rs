#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <stdlib.h>

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

void test_read_fixnum(void) {
    const char* input = "42";
    const char* p = input;
    Value* v = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_fixnum(v));
    TEST_ASSERT_EQUAL(42, v->as.fixnum);
}

void test_read_boolean(void) {
    const char* input = "#t #f";
    const char* p = input;
    Value* vt = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(vt);
    TEST_ASSERT_TRUE(is_boolean(vt));
    TEST_ASSERT_TRUE(vt->as.boolean);

    Value* vf = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(vf);
    TEST_ASSERT_TRUE(is_boolean(vf));
    TEST_ASSERT_FALSE(vf->as.boolean);
}

void test_read_symbol(void) {
    const char* input = "foo + - * /";
    const char* p = input;
    Value* v1 = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v1);
    TEST_ASSERT_TRUE(is_symbol(v1));
    TEST_ASSERT_EQUAL_STRING("foo", v1->as.symbol);

    Value* v2 = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v2);
    TEST_ASSERT_TRUE(is_symbol(v2));
    TEST_ASSERT_EQUAL_STRING("+", v2->as.symbol);
}

void test_read_nil(void) {
    const char* input = "()";
    const char* p = input;
    Value* v = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_nil(v));
}

void test_read_list(void) {
    const char* input = "(1 2 3)";
    const char* p = input;
    Value* v = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_pair(v));
    
    Value* v1 = v->as.pair.car;
    TEST_ASSERT_TRUE(is_fixnum(v1));
    TEST_ASSERT_EQUAL(1, v1->as.fixnum);
    
    Value* v2 = v->as.pair.cdr->as.pair.car;
    TEST_ASSERT_TRUE(is_fixnum(v2));
    TEST_ASSERT_EQUAL(2, v2->as.fixnum);
}

void test_read_quote(void) {
    const char* input = "'foo";
    const char* p = input;
    Value* v = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_pair(v));
    TEST_ASSERT_EQUAL_STRING("quote", v->as.pair.car->as.symbol);
    TEST_ASSERT_EQUAL_STRING("foo", v->as.pair.cdr->as.pair.car->as.symbol);
}

void test_read_dotted_pair(void) {
    const char* input = "(1 . 2)";
    const char* p = input;
    Value* v = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_pair(v));
    TEST_ASSERT_EQUAL(1, v->as.pair.car->as.fixnum);
    TEST_ASSERT_EQUAL(2, v->as.pair.cdr->as.fixnum);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_read_fixnum);
    RUN_TEST(test_read_boolean);
    RUN_TEST(test_read_symbol);
    RUN_TEST(test_read_nil);
    RUN_TEST(test_read_list);
    RUN_TEST(test_read_quote);
    RUN_TEST(test_read_dotted_pair);
    return UNITY_END();
}
