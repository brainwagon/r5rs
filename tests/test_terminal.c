#include <unity.h>
#include <terminal.h>
#include <string.h>
#include <unistd.h>
#include <termios.h>
#include <errno.h>
#include <stdio.h>

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
    
    int res = terminal_enable_raw_mode(&state);
    TEST_ASSERT_EQUAL(0, res);
    TEST_ASSERT_EQUAL(1, state.raw_mode_enabled);
    
    struct termios current;
    tcgetattr(STDIN_FILENO, &current);
    TEST_ASSERT_FALSE(current.c_lflag & ECHO);
    TEST_ASSERT_FALSE(current.c_lflag & ICANON);
    
    res = terminal_disable_raw_mode(&state);
    TEST_ASSERT_EQUAL(0, res);
    TEST_ASSERT_EQUAL(0, state.raw_mode_enabled);
}

void test_terminal_read_char(void) {
    int fds[2];
    if (pipe(fds) == -1) TEST_FAIL_MESSAGE("pipe failed");
    
    int old_stdin = dup(STDIN_FILENO);
    dup2(fds[0], STDIN_FILENO);
    
    write(fds[1], "a", 1);
    TerminalState state;
    terminal_init(&state);
    
    int c = terminal_read_char(&state);
    TEST_ASSERT_EQUAL('a', c);
    
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
    
    close(fds[1]);
    
    TerminalState state;
    terminal_init(&state);
    
    int c = terminal_read_char(&state);
    TEST_ASSERT_EQUAL(0, c);
    
    dup2(old_stdin, STDIN_FILENO);
    close(old_stdin);
    close(fds[0]);
}

// Helper for testing readline with redirection
static int run_readline_test(const char* input, char* out_buf, int max_len) {
    int in_fds[2], out_fds[2];
    if (pipe(in_fds) == -1 || pipe(out_fds) == -1) return -1;
    
    int input_len = strlen(input);
    write(in_fds[1], input, input_len);
    close(in_fds[1]); // Close write end so read returns EOF when done
    
    int old_stdin = dup(STDIN_FILENO);
    int old_stdout = dup(STDOUT_FILENO);
    
    dup2(in_fds[0], STDIN_FILENO);
    dup2(out_fds[1], STDOUT_FILENO);
    
    TerminalState state;
    terminal_init(&state);
    int res = terminal_readline(&state, out_buf, max_len);
    
    dup2(old_stdin, STDIN_FILENO);
    dup2(old_stdout, STDOUT_FILENO);
    close(old_stdin);
    close(old_stdout);
    close(in_fds[0]);
    close(out_fds[0]);
    close(out_fds[1]);
    
    return res;
}

void test_terminal_readline(void) {
    char buf[128];
    int res = run_readline_test("hello\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(5, res);
    TEST_ASSERT_EQUAL_STRING("hello", buf);
}

void test_terminal_readline_ctrl_d(void) {
    char buf[128];
    int res = run_readline_test("abc\x04", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(3, res);
    TEST_ASSERT_EQUAL_STRING("abc", buf);
}

void test_terminal_readline_backspace(void) {
    char buf[128];
    int res = run_readline_test("abc\x7f" "d\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(3, res);
    TEST_ASSERT_EQUAL_STRING("abd", buf);
}

void test_terminal_readline_cursor_nav(void) {
    char buf[128];
    int res = run_readline_test("abc\x02\x02X\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(4, res);
    TEST_ASSERT_EQUAL_STRING("aXbc", buf);
}

void test_terminal_readline_cursor_nav_right(void) {
    char buf[128];
    int res = run_readline_test("abc\x02\x02\x06X\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(4, res);
    TEST_ASSERT_EQUAL_STRING("abXc", buf);
}

void test_terminal_readline_arrow_left(void) {
    char buf[128];
    int res = run_readline_test("abc\x1b[D\x1b[DX\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(4, res);
    TEST_ASSERT_EQUAL_STRING("aXbc", buf);
}

void test_terminal_readline_arrow_right(void) {
    char buf[128];
    int res = run_readline_test("abc\x1b[D\x1b[D\x1b[CX\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(4, res);
    TEST_ASSERT_EQUAL_STRING("abXc", buf);
}

void test_terminal_readline_ctrl_a(void) {
    char buf[128];
    // Write "abc", then Ctrl-A (\x01), then "X\n" -> "Xabc"
    int res = run_readline_test("abc\x01X\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(4, res);
    TEST_ASSERT_EQUAL_STRING("Xabc", buf);
}

void test_terminal_readline_ctrl_e(void) {
    char buf[128];
    // Write "abc", then Ctrl-A, then Ctrl-E (\x05), then "X\n" -> "abcX"
    int res = run_readline_test("abc\x01\x05X\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(4, res);
    TEST_ASSERT_EQUAL_STRING("abcX", buf);
}

void test_terminal_readline_kill_yank(void) {
    char buf[128];
    // Write "abc-def", then Ctrl-A, Move Right 4 times, then Ctrl-K (\x0b), then Ctrl-A, then Ctrl-Y (\x19), then "\n"
    // "abc-def" -> Move pos to 4 (after '-') -> Kill "def" (buffer "def") -> Yank "def" at pos 0 -> "defabc-"
    int res = run_readline_test("abc-def\x01\x06\x06\x06\x06\x0b\x01\x19\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(7, res);
    TEST_ASSERT_EQUAL_STRING("defabc-", buf);
}

void test_terminal_readline_ctrl_l(void) {
    char buf[128];
    // Write "abc", then Ctrl-L (\x0c), then "\n"
    int res = run_readline_test("abc\x0c\n", buf, sizeof(buf));
    TEST_ASSERT_EQUAL(3, res);
    TEST_ASSERT_EQUAL_STRING("abc", buf);
}

void test_terminal_readline_history_nav(void) {
    TerminalState state;
    terminal_init(&state);
    terminal_history_add(&state, "first");
    terminal_history_add(&state, "second");
    
    // Test with Ctrl-P (\x10) and Ctrl-N (\x0e)
    int in_fds[2], out_fds[2];
    pipe(in_fds);
    pipe(out_fds);
    
    int old_stdin = dup(STDIN_FILENO);
    int old_stdout = dup(STDOUT_FILENO);
    dup2(in_fds[0], STDIN_FILENO);
    dup2(out_fds[1], STDOUT_FILENO);
    
    // Ctrl-P (second), Ctrl-P (first), Ctrl-N (second), \n
    write(in_fds[1], "\x10\x10\x0e\n", 4);
    close(in_fds[1]);
    
    char buf[128];
    int res = terminal_readline(&state, buf, sizeof(buf));
    
    TEST_ASSERT_EQUAL(6, res);
    TEST_ASSERT_EQUAL_STRING("second", buf);
    
    dup2(old_stdin, STDIN_FILENO);
    dup2(old_stdout, STDOUT_FILENO);
    close(old_stdin);
    close(old_stdout);
    close(in_fds[0]);
    close(out_fds[0]);
    close(out_fds[1]);
    terminal_history_free(&state);
}

void test_terminal_readline_history_nav_arrows(void) {
    TerminalState state;
    terminal_init(&state);
    terminal_history_add(&state, "first");
    terminal_history_add(&state, "second");
    
    int in_fds[2], out_fds[2];
    pipe(in_fds);
    pipe(out_fds);
    
    int old_stdin = dup(STDIN_FILENO);
    int old_stdout = dup(STDOUT_FILENO);
    dup2(in_fds[0], STDIN_FILENO);
    dup2(out_fds[1], STDOUT_FILENO);
    
    // Up (\x1b[A), Up (\x1b[A), Down (\x1b[B), \n
    write(in_fds[1], "\x1b[A\x1b[A\x1b[B\n", 10);
    close(in_fds[1]);
    
    char buf[128];
    int res = terminal_readline(&state, buf, sizeof(buf));
    
    TEST_ASSERT_EQUAL(6, res);
    TEST_ASSERT_EQUAL_STRING("second", buf);
    
    dup2(old_stdin, STDIN_FILENO);
    dup2(old_stdout, STDOUT_FILENO);
    close(old_stdin);
    close(old_stdout);
    close(in_fds[0]);
    close(out_fds[0]);
    close(out_fds[1]);
    terminal_history_free(&state);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_terminal_state_structure);
    RUN_TEST(test_terminal_raw_mode_lifecycle);
    RUN_TEST(test_terminal_read_char);
    RUN_TEST(test_terminal_read_char_eof);
    RUN_TEST(test_terminal_readline);
    RUN_TEST(test_terminal_readline_ctrl_d);
    RUN_TEST(test_terminal_readline_backspace);
    RUN_TEST(test_terminal_readline_cursor_nav);
    RUN_TEST(test_terminal_readline_cursor_nav_right);
    RUN_TEST(test_terminal_readline_arrow_left);
    RUN_TEST(test_terminal_readline_arrow_right);
    RUN_TEST(test_terminal_readline_ctrl_a);
    RUN_TEST(test_terminal_readline_ctrl_e);
    RUN_TEST(test_terminal_readline_kill_yank);
    RUN_TEST(test_terminal_readline_ctrl_l);
    RUN_TEST(test_terminal_readline_history_nav);
    RUN_TEST(test_terminal_readline_history_nav_arrows);
    return UNITY_END();
}
