#include <unity.h>
#include <terminal.h>
#include <string.h>

struct VM* global_vm_ptr = NULL;

void setUp(void) {}
void tearDown(void) {}

void test_terminal_state_structure(void) {
    TerminalState state;
    terminal_init(&state);
    TEST_ASSERT_EQUAL(0, state.raw_mode_enabled);
}

void test_terminal_raw_mode_stubs(void) {
    TerminalState state;
    terminal_init(&state);
    TEST_ASSERT_EQUAL(0, terminal_enable_raw_mode(&state));
    TEST_ASSERT_EQUAL(0, terminal_disable_raw_mode(&state));
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_terminal_state_structure);
    RUN_TEST(test_terminal_raw_mode_stubs);
    return UNITY_END();
}
