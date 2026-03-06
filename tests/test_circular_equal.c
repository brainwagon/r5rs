#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
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

void test_circular_list_self(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // This should NOT hang/crash once fixed
    const char* code = 
        "(let ((a (list 1 2))) "
        "  (set-cdr! (cdr a) a) "
        "  (equal? a a))";
    
    TEST_ASSERT_TRUE(run_scheme(&vm, code)->as.boolean);
}

void test_circular_lists_equivalent(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    const char* code = 
        "(let ((a (list 1 2)) "
        "      (b (list 1 2))) "
        "  (set-cdr! (cdr a) a) "
        "  (set-cdr! (cdr b) b) "
        "  (equal? a b))";
    
    TEST_ASSERT_TRUE(run_scheme(&vm, code)->as.boolean);
}

void test_circular_vectors(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    const char* code = 
        "(let ((v (vector 1 2))) "
        "  (vector-set! v 0 v) "
        "  (equal? v v))";
    
    TEST_ASSERT_TRUE(run_scheme(&vm, code)->as.boolean);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_circular_list_self);
    RUN_TEST(test_circular_lists_equivalent);
    RUN_TEST(test_circular_vectors);
    return UNITY_END();
}
