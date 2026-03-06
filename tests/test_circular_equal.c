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
        "(let ((v (make-vector 2 1))) "
        "  (vector-set! v 0 v) "
        "  (equal? v v))";
    
    TEST_ASSERT_TRUE(run_scheme(&vm, code)->as.boolean);
}

#include <time.h>

void test_performance_circular_100(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // Create two circular lists of 100 elements
    const char* code = 
        "(letrec ((make-list (lambda (n) (if (= n 0) '() (cons n (make-list (- n 1))))))) "
        "  (let ((a (make-list 100)) "
        "        (b (make-list 100))) "
        "    (letrec ((last (lambda (l) (if (null? (cdr l)) l (last (cdr l)))))) "
        "      (set-cdr! (last a) a) "
        "      (set-cdr! (last b) b) "
        "      (equal? a b))))";
    
    clock_t start = clock();
    Value* res = run_scheme(&vm, code);
    clock_t end = clock();
    double time_ms = (double)(end - start) * 1000.0 / CLOCKS_PER_SEC;
    
    TEST_ASSERT_TRUE(res->as.boolean);
    printf("Circular equal 100 elements took: %f ms\n", time_ms);
    TEST_ASSERT_TRUE(time_ms < 1.0);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_circular_list_self);
    RUN_TEST(test_circular_lists_equivalent);
    RUN_TEST(test_circular_vectors);
    RUN_TEST(test_performance_circular_100);
    return UNITY_END();
}
