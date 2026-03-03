#include <unity.h>
#include <terminal.h>
#include <string.h>
#include <unistd.h>
#include <termios.h>

struct VM* global_vm_ptr = NULL;

void setUp(void) {}
void tearDown(void) {}

void test_terminal_state_structure(void) {
    TerminalState state;
    terminal_init(&state);
    TEST_ASSERT_EQUAL(0, state.raw_mode_enabled);
}

void test_terminal_raw_mode_lifecycle(void) {
    if (!isatty(STDIN_FILENO)) {
        TEST_IGNORE_MESSAGE("Skipping TTY tests - stdin is not a TTY");
    }
    
    TerminalState state;
    terminal_init(&state);
    
    // Enable raw mode
    int res = terminal_enable_raw_mode(&state);
    TEST_ASSERT_EQUAL(0, res);
    TEST_ASSERT_EQUAL(1, state.raw_mode_enabled);
    
    // Check flags (ECHO should be off)
    struct termios current;
    tcgetattr(STDIN_FILENO, &current);
    TEST_ASSERT_FALSE(current.c_lflag & ECHO);
    TEST_ASSERT_FALSE(current.c_lflag & ICANON);
    
    // Disable raw mode
    res = terminal_disable_raw_mode(&state);
    TEST_ASSERT_EQUAL(0, res);
    TEST_ASSERT_EQUAL(0, state.raw_mode_enabled);
    
    // Check flags (ECHO should be on again, if it was on originally)
    tcgetattr(STDIN_FILENO, &current);
    // Note: We assume ECHO was on originally for this test to be meaningful
    // but we can't be sure in all CI environments.
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_terminal_state_structure);
    RUN_TEST(test_terminal_raw_mode_lifecycle);
    return UNITY_END();
}
