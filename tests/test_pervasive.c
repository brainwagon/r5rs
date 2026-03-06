#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
#include <bignum.h>
#include <stdlib.h>
#include <string.h>

/**
 * Pervasive Language Tests Mapping (r5rs_pitfall.scm):
 * 
 * 1.1 Proper letrec implementation -> test_pervasive_letrec_reentry (Fails/Segfaults)
 * 2.1 call/cc and procedure application -> test_pervasive_callcc_app (Passes)
 * 3.1 Hygienic macros (let-syntax) -> test_pervasive_hygiene_plus (Fails - unhygienic)
 * 4.1 No identifiers are reserved -> test_pervasive_identifier_shadowing (Passes)
 * 5.1-5.3 #f/() distinctness -> test_pervasive_f_null_distinct (Passes)
 * 6.1 string->symbol case sensitivity -> test_pervasive_symbol_case (Passes)
 * 7.1 Captured continuation modification -> test_pervasive_cont_mutation (Fails - stack capture)
 * 7.4 Terminating Yin-Yang puzzle -> test_pervasive_yinyang (Passes)
 * 8.1 Named let shadowing -> test_pervasive_named_let_shadow (Passes)
 * 8.2 append sharing tail -> test_pervasive_append_sharing (Passes)
 */

struct VM* global_vm_ptr = NULL;

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

static Value* read_str(const char* s) {
    return read_sexpr_str(&s);
}

static Value* run_scheme(VM* vm, const char* code) {
    Value* expr = read_str(code);
    gc_push_root(expr);
    Value* nil = make_nil();
    gc_push_root(nil);
    Value* proto = compile(expr, nil, vm->syntax_env, -1, false);
    gc_push_root(proto);
    Value* result = vm_run(vm, proto);
    gc_pop_root(); // proto
    gc_pop_root(); // nil
    gc_pop_root(); // expr
    return result;
}

// Initial placeholder test to verify infrastructure
void test_pervasive_placeholder(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    Value* result = run_scheme(&vm, "(+ 1 2 3)");
    TEST_ASSERT_EQUAL(6, result->as.fixnum);
}

// 1.1 Proper letrec implementation
void test_pervasive_letrec_reentry(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    const char* code = 
        "(let ((cont #f)) "
        "  (letrec ((x (call-with-current-continuation (lambda (c) (set! cont c) 0))) "
        "           (y (call-with-current-continuation (lambda (c) (set! cont c) 0)))) "
        "    (if cont "
        "        (let ((c cont)) "
        "          (set! cont #f) "
        "          (set! x 1) "
        "          (set! y 1) "
        "          (c 0)) "
        "        (+ x y))))";
    
    Value* result = run_scheme(&vm, code);
    TEST_ASSERT_EQUAL(0, result->as.fixnum);
}

// 3.1 Hygienic macros (let-syntax)
void test_pervasive_hygiene_plus(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    const char* code = 
        "(let-syntax ((foo "
        "              (syntax-rules () "
        "                ((_ expr) (+ expr 1))))) "
        "  (let ((+ *)) "
        "    (foo 3)))";
    
    Value* result = run_scheme(&vm, code);
    TEST_ASSERT_EQUAL(4, result->as.fixnum);
}

// 4.1 No identifiers are reserved
void test_pervasive_identifier_shadowing(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    // ((lambda lambda lambda) 'x) -> (x)
    Value* result = run_scheme(&vm, "((lambda lambda lambda) 'x)");
    TEST_ASSERT_TRUE(is_pair(result));
    TEST_ASSERT_EQUAL_STRING("x", result->as.pair.car->as.symbol);
    TEST_ASSERT_TRUE(is_nil(result->as.pair.cdr));
}

// 2.1 call/cc and procedure application
void test_pervasive_callcc_app(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    // (call/cc (lambda (c) (0 (c 1)))) => 1
    Value* result = run_scheme(&vm, "(call-with-current-continuation (lambda (c) (0 (c 1))))");
    TEST_ASSERT_EQUAL(1, result->as.fixnum);
}

// 7.4 Terminating Yin-Yang puzzle
void test_pervasive_yinyang(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    const char* code = 
        "(let ((x '()) (y 0)) "
        "  (call/cc (lambda (escape) "
        "    (let* ((yin ((lambda (foo) "
        "                   (set! x (cons y x)) "
        "                   (if (= y 10) (escape x) (begin (set! y 0) foo))) "
        "                 (call/cc (lambda (bar) bar)))) "
        "           (yang ((lambda (foo) (set! y (+ y 1)) foo) "
        "                  (call/cc (lambda (baz) baz))))) "
        "      (yin yang)))))";

    Value* result = run_scheme(&vm, code);
    TEST_ASSERT_TRUE(is_pair(result));
    // Should be (10 9 8 7 6 5 4 3 2 1 0)
    int expected[] = {10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0};
    Value* p = result;
    for (int i = 0; i < 11; i++) {
        TEST_ASSERT_TRUE(is_pair(p));
        TEST_ASSERT_EQUAL(expected[i], p->as.pair.car->as.fixnum);
        p = p->as.pair.cdr;
    }
    TEST_ASSERT_TRUE(is_nil(p));
}

// 5.1-5.3 #f/() distinctness
void test_pervasive_f_null_distinct(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    TEST_ASSERT_FALSE(run_scheme(&vm, "(eq? #f '())")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(eqv? #f '())")->as.boolean);
    TEST_ASSERT_FALSE(run_scheme(&vm, "(equal? #f '())")->as.boolean);
}

// 6.1 string->symbol case sensitivity
void test_pervasive_symbol_case(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    TEST_ASSERT_FALSE(run_scheme(&vm, "(eq? (string->symbol \"f\") (string->symbol \"F\"))")->as.boolean);
}

// 8.1 Named let shadowing
void test_pervasive_named_let_shadow(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    Value* result = run_scheme(&vm, "(let - ((n (- 1))) n)");
    TEST_ASSERT_EQUAL(-1, result->as.fixnum);
}

// 8.2 append sharing tail
void test_pervasive_append_sharing(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    Value* result = run_scheme(&vm, "(let ((ls (list 1 2 3 4))) (append ls ls '(5)))");
    // Should be (1 2 3 4 1 2 3 4 5)
    int expected[] = {1, 2, 3, 4, 1, 2, 3, 4, 5};
    Value* p = result;
    for (int i = 0; i < 9; i++) {
        TEST_ASSERT_TRUE(is_pair(p));
        TEST_ASSERT_EQUAL(expected[i], p->as.pair.car->as.fixnum);
        p = p->as.pair.cdr;
    }
    TEST_ASSERT_TRUE(is_nil(p));
}

// 7.1 Captured continuation should be unmodified by invocation of other continuations
void test_pervasive_cont_mutation(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;

    const char* code = 
        "(let () "
        "  (define r #f) (define a #f) (define b #f) (define c #f) (define i 0) "
        "  (set! r (+ 1 (+ 2 (+ 3 (call/cc (lambda (k) (set! a k) 4)))) "
        "             (+ 5 (+ 6 (call/cc (lambda (k) (set! b k) 7)))))) "
        "  (if (not c) (set! c a)) "
        "  (set! i (+ i 1)) "
        "  (cond "
        "    ((= i 1) (a 5)) "
        "    ((= i 2) (b 8)) "
        "    ((= i 3) (a 6)) "
        "    ((= i 4) (c 4))) "
        "  r)";

    Value* result = run_scheme(&vm, code);
    TEST_ASSERT_EQUAL(28, result->as.fixnum);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_pervasive_placeholder);
    RUN_TEST(test_pervasive_letrec_reentry);
    RUN_TEST(test_pervasive_hygiene_plus);
    RUN_TEST(test_pervasive_identifier_shadowing);
    RUN_TEST(test_pervasive_callcc_app);
    RUN_TEST(test_pervasive_yinyang);
    RUN_TEST(test_pervasive_f_null_distinct);
    RUN_TEST(test_pervasive_symbol_case);
    RUN_TEST(test_pervasive_named_let_shadow);
    RUN_TEST(test_pervasive_append_sharing);
    RUN_TEST(test_pervasive_cont_mutation);
    return UNITY_END();
}
