#ifndef TERMINAL_H
#define TERMINAL_H

#include <termios.h>

#define HISTORY_MAX 100

typedef struct {
    char* entries[HISTORY_MAX];
    int count;
    int current_idx; // Used for navigation
} TerminalHistory;

typedef struct {
    struct termios orig_termios;
    int raw_mode_enabled;
    char kill_buffer[1024];
    TerminalHistory history;
} TerminalState;

void terminal_init(TerminalState* state);
void terminal_history_add(TerminalState* state, const char* line);
const char* terminal_history_prev(TerminalState* state);
const char* terminal_history_next(TerminalState* state);
void terminal_history_free(TerminalState* state);
int terminal_history_save(TerminalState* state, const char* filename);
int terminal_history_load(TerminalState* state, const char* filename);
int terminal_find_matching_paren(const char* buf, int pos);
int terminal_enable_raw_mode(TerminalState* state);
int terminal_disable_raw_mode(TerminalState* state);
int terminal_read_char(TerminalState* state);
int terminal_write_char(char c);
int terminal_write_str(const char* s);
int terminal_readline_basic(TerminalState* state, char* buf, int max_len);
int terminal_readline(TerminalState* state, char* buf, int max_len);

#endif /* TERMINAL_H */
