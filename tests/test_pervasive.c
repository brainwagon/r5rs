#include <unity.h>
#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
#include <bignum.h>
#include <stdlib.h>
#include <string.h>

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
    Value* proto = compile(expr, make_nil(), vm->syntax_env, -1, false);
    return vm_run(vm, proto);
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

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_pervasive_placeholder);
    return UNITY_END();
}
