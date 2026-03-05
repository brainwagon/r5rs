#include <unity.h>
#include <terminal.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>

void* global_vm_ptr = NULL;

void setUp(void) {}
void tearDown(void) {}

void test_history_init(void) {
    TerminalState state;
    terminal_init(&state);
    TEST_ASSERT_EQUAL(0, state.history.count);
    TEST_ASSERT_EQUAL(0, state.history.current_idx);
}

void test_history_add(void) {
    TerminalState state;
    terminal_init(&state);
    
    terminal_history_add(&state, "test1");
    TEST_ASSERT_EQUAL(1, state.history.count);
    TEST_ASSERT_EQUAL_STRING("test1", state.history.entries[0]);
    
    terminal_history_add(&state, "test2");
    TEST_ASSERT_EQUAL(2, state.history.count);
    TEST_ASSERT_EQUAL_STRING("test2", state.history.entries[1]);
    
    terminal_history_free(&state);
}

void test_history_navigation(void) {
    TerminalState state;
    terminal_init(&state);
    
    terminal_history_add(&state, "test1");
    terminal_history_add(&state, "test2");
    
    // current_idx is at count (2) after adding
    TEST_ASSERT_EQUAL(2, state.history.current_idx);
    
    // Prev
    TEST_ASSERT_EQUAL_STRING("test2", terminal_history_prev(&state));
    TEST_ASSERT_EQUAL(1, state.history.current_idx);
    
    TEST_ASSERT_EQUAL_STRING("test1", terminal_history_prev(&state));
    TEST_ASSERT_EQUAL(0, state.history.current_idx);
    
    // No more prev
    TEST_ASSERT_NULL(terminal_history_prev(&state));
    TEST_ASSERT_EQUAL(0, state.history.current_idx);
    
    // Next
    TEST_ASSERT_EQUAL_STRING("test2", terminal_history_next(&state));
    TEST_ASSERT_EQUAL(1, state.history.current_idx);
    
    // Next back to current line (NULL)
    TEST_ASSERT_NULL(terminal_history_next(&state));
    TEST_ASSERT_EQUAL(2, state.history.current_idx);
    
    terminal_history_free(&state);
}

void test_history_limit(void) {
    TerminalState state;
    terminal_init(&state);
    
    for (int i = 0; i < HISTORY_MAX + 10; i++) {
        char buf[32];
        sprintf(buf, "cmd%d", i);
        terminal_history_add(&state, buf);
    }
    
    TEST_ASSERT_EQUAL(HISTORY_MAX, state.history.count);
    // Oldest should be cmd10
    TEST_ASSERT_EQUAL_STRING("cmd10", state.history.entries[0]);
    // Newest should be cmd109
    TEST_ASSERT_EQUAL_STRING("cmd109", state.history.entries[HISTORY_MAX-1]);
    
    terminal_history_free(&state);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_history_init);
    RUN_TEST(test_history_add);
    RUN_TEST(test_history_navigation);
    RUN_TEST(test_history_limit);
    return UNITY_END();
}
