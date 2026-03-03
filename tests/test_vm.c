#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
#include <bignum.h>
#include <stdlib.h>

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

static Value* read_str(const char* s) {
    return read_sexpr_str(&s);
}

void test_vm_const(void) {
    VM vm;
    vm_init(&vm);
    Value* expr = read_str("42");
    Value* proto = compile(expr, make_nil(), -1);
    Value* result = vm_run(&vm, proto);
    TEST_ASSERT_EQUAL(42, result->as.fixnum);
}

void test_vm_define_ref(void) {
    VM vm;
    vm_init(&vm);
    vm_run(&vm, compile(read_str("(define x 42)"), make_nil(), -1));
    Value* r2 = vm_run(&vm, compile(read_str("x"), make_nil(), -1));
    TEST_ASSERT_EQUAL(42, r2->as.fixnum);
}

void test_vm_if(void) {
    VM vm;
    vm_init(&vm);
    Value* r1 = vm_run(&vm, compile(read_str("(if #t 1 2)"), make_nil(), -1));
    TEST_ASSERT_EQUAL(1, r1->as.fixnum);
    Value* r2 = vm_run(&vm, compile(read_str("(if #f 1 2)"), make_nil(), -1));
    TEST_ASSERT_EQUAL(2, r2->as.fixnum);
}

void test_vm_call(void) {
    VM vm;
    vm_init(&vm);
    vm_run(&vm, compile(read_str("(define identity (lambda (x) x))"), make_nil(), -1));
    Value* r2 = vm_run(&vm, compile(read_str("(identity 42)"), make_nil(), -1));
    TEST_ASSERT_EQUAL(42, r2->as.fixnum);
}

void test_vm_tco(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    vm_run(&vm, compile(read_str("(define count (lambda (n) (if (zero? n) #t (count (- n 1)))))"), make_nil(), -1));
    Value* r2 = vm_run(&vm, compile(read_str("(count 1000)"), make_nil(), -1));
    TEST_ASSERT_TRUE(r2->as.boolean);
}

void test_vm_primitives(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    Value* r1 = vm_run(&vm, compile(read_str("(* 2 3 4)"), make_nil(), -1));
    TEST_ASSERT_EQUAL(24, r1->as.fixnum);
    Value* r2 = vm_run(&vm, compile(read_str("(= 42 42)"), make_nil(), -1));
    TEST_ASSERT_TRUE(r2->as.boolean);
    Value* r3 = vm_run(&vm, compile(read_str("(= 42 43)"), make_nil(), -1));
    TEST_ASSERT_FALSE(r3->as.boolean);
}

void test_vm_callcc(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // (define r (call/cc (lambda (k) (k 42) 1)))
    // r should be 42
    vm_run(&vm, compile(read_str("(define r (call/cc (lambda (k) (k 42) 1)))"), make_nil(), -1));
    Value* r = vm_run(&vm, compile(read_str("r"), make_nil(), -1));
    TEST_ASSERT_EQUAL(42, r->as.fixnum);
}

void test_vm_lset(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // ((lambda (x) (set! x 42) x) 1) -> 42
    const char* p = "((lambda (x) (set! x 42) x) 1)";
    Value* r = vm_run(&vm, compile(read_str(p), make_nil(), -1));
    TEST_ASSERT_EQUAL(42, r->as.fixnum);
}

void test_vm_list_primitives(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    Value* r1 = vm_run(&vm, compile(read_str("(car (cons 1 2))"), make_nil(), -1));
    TEST_ASSERT_EQUAL(1, r1->as.fixnum);

    Value* r2 = vm_run(&vm, compile(read_str("(cdr (cons 1 2))"), make_nil(), -1));
    TEST_ASSERT_EQUAL(2, r2->as.fixnum);

    Value* r3 = vm_run(&vm, compile(read_str("(pair? (cons 1 2))"), make_nil(), -1));
    TEST_ASSERT_TRUE(r3->as.boolean);

    Value* r4 = vm_run(&vm, compile(read_str("(null? '())"), make_nil(), -1));
    TEST_ASSERT_TRUE(r4->as.boolean);

    Value* r5 = vm_run(&vm, compile(read_str("(list 1 2 3)"), make_nil(), -1));
    TEST_ASSERT_TRUE(is_pair(r5));
    TEST_ASSERT_EQUAL(1, r5->as.pair.car->as.fixnum);
}

void test_vm_string_vector_primitives(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // String test
    Value* r1 = vm_run(&vm, compile(read_str("(make-string 5 #\\a)"), make_nil(), -1));
    TEST_ASSERT_TRUE(is_string(r1));
    TEST_ASSERT_EQUAL_STRING("aaaaa", r1->as.string.str);
    
    vm_run(&vm, compile(read_str("(define s \"hello\")"), make_nil(), -1));
    Value* r2 = vm_run(&vm, compile(read_str("(string-ref s 1)"), make_nil(), -1));
    TEST_ASSERT_TRUE(is_char(r2));
    TEST_ASSERT_EQUAL('e', r2->as.character);
    
    vm_run(&vm, compile(read_str("(string-set! s 1 #\\a)"), make_nil(), -1));
    Value* r3 = vm_run(&vm, compile(read_str("s"), make_nil(), -1));
    TEST_ASSERT_EQUAL_STRING("hallo", r3->as.string.str);

    // Vector test
    Value* r4 = vm_run(&vm, compile(read_str("(make-vector 3 42)"), make_nil(), -1));
    TEST_ASSERT_TRUE(is_vector(r4));
    TEST_ASSERT_EQUAL(3, r4->as.vector.len);
    TEST_ASSERT_EQUAL(42, r4->as.vector.elements[0]->as.fixnum);
    
    vm_run(&vm, compile(read_str("(define v #(1 2 3))"), make_nil(), -1));
    Value* r5 = vm_run(&vm, compile(read_str("(vector-ref v 2)"), make_nil(), -1));
    TEST_ASSERT_EQUAL(3, r5->as.fixnum);
    
    vm_run(&vm, compile(read_str("(vector-set! v 2 99)"), make_nil(), -1));
    Value* r6 = vm_run(&vm, compile(read_str("(vector-ref v 2)"), make_nil(), -1));
    TEST_ASSERT_EQUAL(99, r6->as.fixnum);
}

void test_vm_and_or_cond(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // and
    TEST_ASSERT_TRUE(vm_run(&vm, compile(read_str("(and #t #t)"), make_nil(), -1))->as.boolean);
    TEST_ASSERT_FALSE(vm_run(&vm, compile(read_str("(and #t #f)"), make_nil(), -1))->as.boolean);
    TEST_ASSERT_EQUAL(42, vm_run(&vm, compile(read_str("(and 1 2 42)"), make_nil(), -1))->as.fixnum);
    
    // or
    TEST_ASSERT_TRUE(vm_run(&vm, compile(read_str("(or #f #t)"), make_nil(), -1))->as.boolean);
    TEST_ASSERT_EQUAL(1, vm_run(&vm, compile(read_str("(or 1 2)"), make_nil(), -1))->as.fixnum);
    TEST_ASSERT_FALSE(vm_run(&vm, compile(read_str("(or #f #f)"), make_nil(), -1))->as.boolean);
    
    // cond
    TEST_ASSERT_EQUAL(1, vm_run(&vm, compile(read_str("(cond (#t 1) (else 2))"), make_nil(), -1))->as.fixnum);
    TEST_ASSERT_EQUAL(2, vm_run(&vm, compile(read_str("(cond (#f 1) (else 2))"), make_nil(), -1))->as.fixnum);
    TEST_ASSERT_EQUAL(42, vm_run(&vm, compile(read_str("(cond (42))"), make_nil(), -1))->as.fixnum);
    
    // cond =>
    vm_run(&vm, compile(read_str("(define identity (lambda (x) x))"), make_nil(), -1));
    TEST_ASSERT_EQUAL(42, vm_run(&vm, compile(read_str("(cond (42 => identity) (else 1))"), make_nil(), -1))->as.fixnum);
}

void test_vm_bindings(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // let
    TEST_ASSERT_EQUAL(3, vm_run(&vm, compile(read_str("(let ((x 1) (y 2)) (+ x y))"), make_nil(), -1))->as.fixnum);
    
    // named let
    const char* named_let = "(let loop ((n 5)) (if (zero? n) 42 (loop (- n 1))))";
    TEST_ASSERT_EQUAL(42, vm_run(&vm, compile(read_str(named_let), make_nil(), -1))->as.fixnum);
    
    // let*
    TEST_ASSERT_EQUAL(3, vm_run(&vm, compile(read_str("(let* ((x 1) (y (+ x 1))) (+ x y))"), make_nil(), -1))->as.fixnum);
    
    // letrec
    const char* letrec_test = "(letrec ((even? (lambda (n) (if (zero? n) #t (odd? (- n 1))))) (odd? (lambda (n) (if (zero? n) #f (even? (- n 1)))))) (even? 10))";
    TEST_ASSERT_TRUE(vm_run(&vm, compile(read_str(letrec_test), make_nil(), -1))->as.boolean);
}

void test_vm_case(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    const char* case_test = "(case (* 2 3) ((2 3 5 7) 'prime) ((1 4 6 8 9) 'composite))";
    TEST_ASSERT_EQUAL_STRING("composite", vm_run(&vm, compile(read_str(case_test), make_nil(), -1))->as.symbol);
    
    const char* case_else = "(case 42 ((1 2) 'small) (else 'large))";
    TEST_ASSERT_EQUAL_STRING("large", vm_run(&vm, compile(read_str(case_else), make_nil(), -1))->as.symbol);
}

void test_vm_numeric_tower(void) {
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    // Fixnum overflow to bignum
    // 2^62 + 2^62 = 2^63
    const char* add_overflow = "(+ 4611686018427387904 4611686018427387904)";
    Value* r1 = vm_run(&vm, compile(read_str(add_overflow), make_nil(), -1));
    TEST_ASSERT_TRUE(is_bignum(r1));
    char* s1 = bignum_to_string(r1);
    TEST_ASSERT_EQUAL_STRING("9223372036854775808", s1);
    free(s1);
    
    // Real operations
    Value* r2 = vm_run(&vm, compile(read_str("(+ 1.5 2.5)"), make_nil(), -1));
    TEST_ASSERT_TRUE(is_real(r2));
    TEST_ASSERT_EQUAL_FLOAT(4.0, r2->as.real);
    
    // Factorial with bignums
    const char* fact_def = "(define fact (lambda (n) (if (zero? n) 1 (* n (fact (- n 1))))))";
    vm_run(&vm, compile(read_str(fact_def), make_nil(), -1));
    
    Value* r3 = vm_run(&vm, compile(read_str("(fact 30)"), make_nil(), -1));
    TEST_ASSERT_TRUE(is_bignum(r3));
    char* s3 = bignum_to_string(r3);
    TEST_ASSERT_EQUAL_STRING("265252859812191058636308480000000", s3);
    free(s3);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_vm_const);
    RUN_TEST(test_vm_define_ref);
    RUN_TEST(test_vm_if);
    RUN_TEST(test_vm_call);
    RUN_TEST(test_vm_tco);
    RUN_TEST(test_vm_primitives);
    RUN_TEST(test_vm_callcc);
    RUN_TEST(test_vm_lset);
    RUN_TEST(test_vm_list_primitives);
    RUN_TEST(test_vm_string_vector_primitives);
    RUN_TEST(test_vm_and_or_cond);
    RUN_TEST(test_vm_bindings);
    RUN_TEST(test_vm_case);
    RUN_TEST(test_vm_numeric_tower);
    return UNITY_END();
}
