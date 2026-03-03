#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <macro.h>
#include <stdlib.h>
struct VM* global_vm_ptr = NULL;

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

static Value* read_str(const char* s) {
    return read_sexpr_str(&s);
}

void test_macro_basic(void) {
    Value* literals = read_str("()");
    Value* pattern = read_str("(my-let ((var val)) body)");
    Value* input = read_str("(my-let ((x 1)) x)");
    Value* template = read_str("((lambda (var) body) val)");
    
    Value* result = macro_test_match_expand(literals, pattern, input, template);
    TEST_ASSERT_NOT_NULL(result);
    // Expected: ((lambda (x) x) 1)
    TEST_ASSERT_EQUAL_STRING("lambda", result->as.pair.car->as.pair.car->as.symbol);
}

void test_macro_ellipsis(void) {
    Value* literals = read_str("()");
    Value* pattern = read_str("(my-list x ...)");
    Value* input = read_str("(my-list 1 2 3)");
    Value* template = read_str("(list x ...)");
    
    Value* result = macro_test_match_expand(literals, pattern, input, template);
    TEST_ASSERT_NOT_NULL(result);
    // Expected: (list 1 2 3)
    TEST_ASSERT_EQUAL_STRING("list", result->as.pair.car->as.symbol);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_macro_basic);
    RUN_TEST(test_macro_ellipsis);
    return UNITY_END();
}
