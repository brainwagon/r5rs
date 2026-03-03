#include <unity.h>
#include <scheme.h>
#include <stdbool.h>

void setUp(void) {
    gc_init();
}
void tearDown(void) {}

void test_gc_alloc(void) {
    Value* v = gc_alloc(VAL_FIXNUM);
    TEST_ASSERT_NOT_NULL(v);
    TEST_ASSERT_EQUAL_INT(VAL_FIXNUM, v->type);
}

void test_gc_collect(void) {
    Value* v = gc_alloc(VAL_FIXNUM);
    gc_add_root(&v);
    gc_collect();
    TEST_ASSERT_EQUAL_INT(VAL_FIXNUM, v->type);
}

void test_gc_sweep(void) {
    // Allocation without root should be swept
    Value* v1 = gc_alloc(VAL_FIXNUM);
    Value* v2 = gc_alloc(VAL_FIXNUM);
    (void)v2;
    gc_add_root(&v1);
    gc_collect();
    // v2 should be gone, but we can't easily check it without 
    // internal access. We just check if it doesn't crash.
    TEST_ASSERT_EQUAL_INT(VAL_FIXNUM, v1->type);
}

void test_gc_mark_pair(void) {
    Value* car = gc_alloc(VAL_FIXNUM);
    Value* cdr = gc_alloc(VAL_FIXNUM);
    Value* p = make_pair(car, cdr);
    gc_add_root(&p);
    gc_collect();
    TEST_ASSERT_EQUAL_INT(VAL_PAIR, p->type);
    TEST_ASSERT_EQUAL_INT(VAL_FIXNUM, p->as.pair.car->type);
    TEST_ASSERT_EQUAL_INT(VAL_FIXNUM, p->as.pair.cdr->type);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_gc_alloc);
    RUN_TEST(test_gc_collect);
    RUN_TEST(test_gc_sweep);
    RUN_TEST(test_gc_mark_pair);
    return UNITY_END();
}
