#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <stdlib.h>
struct VM* global_vm_ptr = NULL;

void setUp(void) {
    gc_init();
}

void tearDown(void) {
}

void test_compile_const(void) {
    const char* input = "42";
    const char* p = input;
    Value* expr = read_sexpr_str(&p);
    Value* proto = compile(expr, make_nil(), make_nil(), -1, false);
    
    TEST_ASSERT_NOT_NULL(proto);
    TEST_ASSERT_TRUE(is_proto(proto));
    TEST_ASSERT_EQUAL(4, proto->as.proto.code_len); // OP_CONST(1) + idx(2) + OP_HALT(1)
    TEST_ASSERT_EQUAL(OP_CONST, proto->as.proto.code[0]);
    TEST_ASSERT_EQUAL(OP_HALT, proto->as.proto.code[3]);
    TEST_ASSERT_EQUAL(1, proto->as.proto.num_constants);
    TEST_ASSERT_EQUAL(42, proto->as.proto.constants[0]->as.fixnum);
}

void test_compile_if(void) {
    const char* input = "(if #t 1 2)";
    const char* p = input;
    Value* expr = read_sexpr_str(&p);
    Value* proto = compile(expr, make_nil(), make_nil(), -1, false);
    
    TEST_ASSERT_NOT_NULL(proto);
    // Code should look like:
    // 0: CONST #t
    // 3: JF 7 (to else: CONST 2)
    // 6: CONST 1
    // 9: JUMP 3 (to end: HALT)
    // 12: CONST 2
    // 15: HALT
    
    // Total len: 3 + 3 + 3 + 3 + 3 + 1 = 16
    TEST_ASSERT_EQUAL(16, proto->as.proto.code_len);
}

void test_compile_call(void) {
    const char* input = "(foo 1 2)";
    const char* p = input;
    Value* expr = read_sexpr_str(&p);
    Value* proto = compile(expr, make_nil(), make_nil(), -1, false);
    
    TEST_ASSERT_NOT_NULL(proto);
    // CONST 1
    // CONST 2
    // GREF foo
    // CALL 2
    // HALT
    // 3 + 3 + 3 + 2 + 1 = 12
    TEST_ASSERT_EQUAL(12, proto->as.proto.code_len);
    TEST_ASSERT_EQUAL(OP_CALL, proto->as.proto.code[9]);
    TEST_ASSERT_EQUAL(2, proto->as.proto.code[10]);
}

void test_compile_define(void) {
    const char* input = "(define x 42)";
    const char* p = input;
    Value* expr = read_sexpr_str(&p);
    Value* proto = compile(expr, make_nil(), make_nil(), -1, false);
    
    TEST_ASSERT_NOT_NULL(proto);
    // CONST 42
    // DEF x
    // HALT
    // 3 + 3 + 1 = 7
    TEST_ASSERT_EQUAL(7, proto->as.proto.code_len);
    TEST_ASSERT_EQUAL(OP_DEF, proto->as.proto.code[3]);
}

void test_compile_lambda(void) {
    const char* input = "(lambda (x) x)";
    const char* p = input;
    Value* expr = read_sexpr_str(&p);
    Value* proto = compile(expr, make_nil(), make_nil(), -1, false);
    
    TEST_ASSERT_NOT_NULL(proto);
    // CLOSURE <proto>
    // HALT
    // 3 + 1 = 4
    TEST_ASSERT_EQUAL(4, proto->as.proto.code_len);
    TEST_ASSERT_EQUAL(OP_CLOSURE, proto->as.proto.code[0]);
    
    Value* subproto = proto->as.proto.constants[0];
    TEST_ASSERT_TRUE(is_proto(subproto));
    TEST_ASSERT_EQUAL(1, subproto->as.proto.num_args);
    // LREF 0 0
    // HALT
    // 4 + 1 = 5
    TEST_ASSERT_EQUAL(5, subproto->as.proto.code_len);
    TEST_ASSERT_EQUAL(OP_LREF, subproto->as.proto.code[0]);
}

void test_compile_define_func(void) {
    const char* input = "(define (foo x) x)";
    const char* p = input;
    Value* expr = read_sexpr_str(&p);
    Value* proto = compile(expr, make_nil(), make_nil(), -1, false);
    
    TEST_ASSERT_NOT_NULL(proto);
    // CLOSURE <proto>
    // DEF foo
    // HALT
    // 3 + 3 + 1 = 7
    TEST_ASSERT_EQUAL(7, proto->as.proto.code_len);
    TEST_ASSERT_EQUAL(OP_CLOSURE, proto->as.proto.code[0]);
    TEST_ASSERT_EQUAL(OP_DEF, proto->as.proto.code[3]);
    
    Value* lambda_proto = proto->as.proto.constants[0];
    TEST_ASSERT_TRUE(is_proto(lambda_proto));
    TEST_ASSERT_EQUAL(1, lambda_proto->as.proto.num_args);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_compile_const);
    RUN_TEST(test_compile_if);
    RUN_TEST(test_compile_call);
    RUN_TEST(test_compile_define);
    RUN_TEST(test_compile_define_func);
    RUN_TEST(test_compile_lambda);
    return UNITY_END();
}
