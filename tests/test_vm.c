#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
#include <stdlib.h>

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

void test_vm_const(void) {
    VM vm;
    vm_init(&vm);
    
    const char* input = "42";
    const char* p = input;
    Value* expr = read_sexpr_str(&p);
    Value* proto = compile(expr, make_nil(), -1);
    
    Value* result = vm_run(&vm, proto);
    TEST_ASSERT_NOT_NULL(result);
    TEST_ASSERT_TRUE(is_fixnum(result));
    TEST_ASSERT_EQUAL(42, result->as.fixnum);
}

void test_vm_define_ref(void) {
    VM vm;
    vm_init(&vm);
    
    const char* p1 = "(define x 42)";
    vm_run(&vm, compile(read_sexpr_str(&p1), make_nil(), -1));
    
    const char* p2 = "x";
    Value* r2 = vm_run(&vm, compile(read_sexpr_str(&p2), make_nil(), -1));
    TEST_ASSERT_NOT_NULL(r2);
    TEST_ASSERT_EQUAL(42, r2->as.fixnum);
}

void test_vm_if(void) {
    VM vm;
    vm_init(&vm);
    
    const char* p1 = "(if #t 1 2)";
    Value* r1 = vm_run(&vm, compile(read_sexpr_str(&p1), make_nil(), -1));
    TEST_ASSERT_EQUAL(1, r1->as.fixnum);

    const char* p2 = "(if #f 1 2)";
    Value* r2 = vm_run(&vm, compile(read_sexpr_str(&p2), make_nil(), -1));
    TEST_ASSERT_EQUAL(2, r2->as.fixnum);
}

void test_vm_call(void) {
    VM vm;
    vm_init(&vm);
    
    const char* p1 = "(define identity (lambda (x) x))";
    vm_run(&vm, compile(read_sexpr_str(&p1), make_nil(), -1));
    
    const char* p2 = "(identity 42)";
    Value* r2 = vm_run(&vm, compile(read_sexpr_str(&p2), make_nil(), -1));
    TEST_ASSERT_EQUAL(42, r2->as.fixnum);
}

void test_vm_tco(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    const char* p1 = "(define count (lambda (n) (if (zero? n) #t (count (- n 1)))))";
    vm_run(&vm, compile(read_sexpr_str(&p1), make_nil(), -1));
    
    const char* p2 = "(count 1000)";
    Value* r2 = vm_run(&vm, compile(read_sexpr_str(&p2), make_nil(), -1));
    TEST_ASSERT_TRUE(r2->as.boolean);
}

void test_vm_primitives(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    const char* p1 = "(* 2 3 4)";
    Value* r1 = vm_run(&vm, compile(read_sexpr_str(&p1), make_nil(), -1));
    TEST_ASSERT_EQUAL(24, r1->as.fixnum);

    const char* p2 = "(= 42 42)";
    Value* r2 = vm_run(&vm, compile(read_sexpr_str(&p2), make_nil(), -1));
    TEST_ASSERT_TRUE(r2->as.boolean);

    const char* p3 = "(= 42 43)";
    Value* r3 = vm_run(&vm, compile(read_sexpr_str(&p3), make_nil(), -1));
    TEST_ASSERT_FALSE(r3->as.boolean);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_vm_const);
    RUN_TEST(test_vm_define_ref);
    RUN_TEST(test_vm_if);
    RUN_TEST(test_vm_call);
    RUN_TEST(test_vm_tco);
    RUN_TEST(test_vm_primitives);
    return UNITY_END();
}
