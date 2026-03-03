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
    return UNITY_END();
}
