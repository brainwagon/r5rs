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

void test_read_string(void) {
    const char* input = "\"hello world\\n\"";
    const char* p = input;
    Value* v = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_string(v));
    TEST_ASSERT_EQUAL_STRING("hello world\n", v->as.string.str);
}

void test_read_char(void) {
    const char* input = "#\\a #\\space #\\newline";
    const char* p = input;
    
    Value* v1 = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v1);
    TEST_ASSERT_TRUE(is_char(v1));
    TEST_ASSERT_EQUAL('a', v1->as.character);
    
    Value* v2 = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v2);
    TEST_ASSERT_TRUE(is_char(v2));
    TEST_ASSERT_EQUAL(' ', v2->as.character);
    
    Value* v3 = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v3);
    TEST_ASSERT_TRUE(is_char(v3));
    TEST_ASSERT_EQUAL('\n', v3->as.character);
}

void test_read_vector(void) {
    const char* input = "#(1 2 3)";
    const char* p = input;
    Value* v = read_sexpr_str(&p);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_TRUE(is_vector(v));
    TEST_ASSERT_EQUAL(3, v->as.vector.len);
    TEST_ASSERT_EQUAL(1, v->as.vector.elements[0]->as.fixnum);
    TEST_ASSERT_EQUAL(2, v->as.vector.elements[1]->as.fixnum);
    TEST_ASSERT_EQUAL(3, v->as.vector.elements[2]->as.fixnum);
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
    RUN_TEST(test_read_string);
    RUN_TEST(test_read_char);
    RUN_TEST(test_read_vector);
    return UNITY_END();
}
