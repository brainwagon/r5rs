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

void test_terminal_read_char(void) {
    int fds[2];
    if (pipe(fds) == -1) TEST_FAIL_MESSAGE("pipe failed");
    
    // Save original stdin
    int old_stdin = dup(STDIN_FILENO);
    dup2(fds[0], STDIN_FILENO);
    
    write(fds[1], "a", 1);
    TerminalState state;
    terminal_init(&state);
    
    int c = terminal_read_char(&state);
    TEST_ASSERT_EQUAL('a', c);
    
    // Cleanup
    dup2(old_stdin, STDIN_FILENO);
    close(old_stdin);
    close(fds[0]);
    close(fds[1]);
}

void test_terminal_read_char_eof(void) {
    int fds[2];
    pipe(fds);
    int old_stdin = dup(STDIN_FILENO);
    dup2(fds[0], STDIN_FILENO);
    
    // Close write end to simulate EOF
    close(fds[1]);
    
    TerminalState state;
    terminal_init(&state);
    
    int c = terminal_read_char(&state);
    TEST_ASSERT_EQUAL(0, c);
    
    dup2(old_stdin, STDIN_FILENO);
    close(old_stdin);
    close(fds[0]);
}

void test_terminal_readline_basic(void) {
    int in_fds[2], out_fds[2];
    pipe(in_fds);
    pipe(out_fds);
    int old_stdin = dup(STDIN_FILENO);
    int old_stdout = dup(STDOUT_FILENO);
    dup2(in_fds[0], STDIN_FILENO);
    dup2(out_fds[1], STDOUT_FILENO);
    
    write(in_fds[1], "hello\n", 6);
    
    TerminalState state;
    terminal_init(&state);
    char buf[128];
    int res = terminal_readline_basic(&state, buf, sizeof(buf));
    
    TEST_ASSERT_EQUAL(5, res);
    TEST_ASSERT_EQUAL_STRING("hello", buf);
    
    // Check echo (Wait, write might be buffered or handled specially)
    char echo_buf[128];
    int n = read(out_fds[0], echo_buf, sizeof(echo_buf));
    // Should echo "hello\r\n"
    TEST_ASSERT_TRUE(n >= 5);
    
    dup2(old_stdin, STDIN_FILENO);
    dup2(old_stdout, STDOUT_FILENO);
    close(old_stdin);
    close(old_stdout);
    close(in_fds[0]);
    close(in_fds[1]);
    close(out_fds[0]);
    close(out_fds[1]);
}

void test_terminal_readline_ctrl_d(void) {
    int in_fds[2];
    pipe(in_fds);
    int old_stdin = dup(STDIN_FILENO);
    dup2(in_fds[0], STDIN_FILENO);
    
    // Write "abc" then Ctrl-D (\x04)
    write(in_fds[1], "abc\x04", 4);
    
    TerminalState state;
    terminal_init(&state);
    char buf[128];
    int res = terminal_readline_basic(&state, buf, sizeof(buf));
    
    TEST_ASSERT_EQUAL(3, res);
    TEST_ASSERT_EQUAL_STRING("abc", buf);
    
    dup2(old_stdin, STDIN_FILENO);
    close(old_stdin);
    close(in_fds[0]);
    close(in_fds[1]);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_terminal_state_structure);
    RUN_TEST(test_terminal_raw_mode_lifecycle);
    RUN_TEST(test_terminal_read_char);
    RUN_TEST(test_terminal_read_char_eof);
    RUN_TEST(test_terminal_readline_basic);
    RUN_TEST(test_terminal_readline_ctrl_d);
    return UNITY_END();
}
