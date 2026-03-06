#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
#include <bignum.h>
#include <stdlib.h>

struct VM* global_vm_ptr = NULL;

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

static Value* run_scheme(VM* vm, const char* code) {
    const char* p = code;
    Value* expr = read_sexpr_str(&p);
    gc_push_root(expr);
    Value* proto = compile(expr, make_nil(), vm->syntax_env, -1, false);
    gc_push_root(proto);
    Value* result = vm_run(vm, proto);
    gc_pop_root(); // proto
    gc_pop_root(); // expr
    return result;
}

void test_equal_basic(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? 1 1)")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? 1 2)")->as.boolean);
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? \"abc\" \"abc\")")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? \"abc\" \"abd\")")->as.boolean);
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? '(1 2 3) '(1 2 3))")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? '(1 2 3) '(1 2 4))")->as.boolean);
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? #(1 2 3) #(1 2 3))")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? #(1 2 3) #(1 2 4))")->as.boolean);
}

void test_equal_nested(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? '(1 (2) 3) '(1 (2) 3))")->as.boolean);
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? #(1 (2) 3) #(1 (2) 3))")->as.boolean);
}

void test_equal_types(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? '(1 2) \"12\")")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? #\\a \"a\")")->as.boolean);
}

void test_equal_bignums(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // Test bignums
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? 1000000000000000000000 1000000000000000000000)")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? 1000000000000000000000 1000000000000000000001)")->as.boolean);
}

void test_equal_reals(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? 1.5 1.5)")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? 1.5 1.6)")->as.boolean);
}

void test_equal_booleans(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? #t #t)")->as.boolean);
    TEST_ASSERT_TRUE(run_scheme(&vm, "(equal? #f #f)")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? #t #f)")->as.boolean);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_equal_basic);
    RUN_TEST(test_equal_nested);
    RUN_TEST(test_equal_types);
    RUN_TEST(test_equal_bignums);
    RUN_TEST(test_equal_reals);
    RUN_TEST(test_equal_booleans);
    return UNITY_END();
}
