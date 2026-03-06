#include <unity.h>
#include <scheme.h>
#include <vm.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

VM* global_vm_ptr = NULL;

void setUp(void) {
    gc_init();
}

void tearDown(void) {
    gc_shutdown();
}

void test_fprint_fixnum(void) {
    Value* v = make_fixnum(123);
    char* buf;
    size_t size;
    FILE* f = open_memstream(&buf, &size);
    fprint_value(f, v, true);
    fclose(f);
    TEST_ASSERT_EQUAL_STRING("123", buf);
    free(buf);
}

void test_fprint_string(void) {
    Value* v = make_string("hello");
    char* buf;
    size_t size;
    FILE* f = open_memstream(&buf, &size);
    fprint_value(f, v, true);
    fclose(f);
    TEST_ASSERT_EQUAL_STRING("\"hello\"", buf);
    free(buf);
    
    f = open_memstream(&buf, &size);
    fprint_value(f, v, false);
    fclose(f);
    TEST_ASSERT_EQUAL_STRING("hello", buf);
    free(buf);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_fprint_fixnum);
    RUN_TEST(test_fprint_string);
    return UNITY_END();
}
