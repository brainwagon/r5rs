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

/**
 * @brief Initializes the terminal state.
 * @param state Pointer to TerminalState to initialize.
 */
void terminal_init(TerminalState* state);

/**
 * @brief Adds a line to the command history with deduplication.
 * @param state Pointer to TerminalState.
 * @param line The command line string to add.
 */
void terminal_history_add(TerminalState* state, const char* line);

/**
 * @brief Retrieves the previous entry from history.
 * @param state Pointer to TerminalState.
 * @return Pointer to history string or NULL if at beginning.
 */
const char* terminal_history_prev(TerminalState* state);

/**
 * @brief Retrieves the next entry from history.
 * @param state Pointer to TerminalState.
 * @return Pointer to history string or NULL if at end.
 */
const char* terminal_history_next(TerminalState* state);

/**
 * @brief Frees all memory allocated for history entries.
 * @param state Pointer to TerminalState.
 */
void terminal_history_free(TerminalState* state);

/**
 * @brief Saves the history to a file.
 * @param state Pointer to TerminalState.
 * @param filename Path to the history file.
 * @return 0 on success, -1 on failure.
 */
int terminal_history_save(TerminalState* state, const char* filename);

/**
 * @brief Loads history from a file.
 * @param state Pointer to TerminalState.
 * @param filename Path to the history file.
 * @return 0 on success, -1 on failure.
 */
int terminal_history_load(TerminalState* state, const char* filename);

/**
 * @brief Finds the index of the matching opening parenthesis for a closing one.
 * @param buf The string buffer.
 * @param pos The index of the closing parenthesis.
 * @return The index of the matching '(' or -1 if not found.
 */
int terminal_find_matching_paren(const char* buf, int pos);

/**
 * @brief Checks if parentheses in the buffer are balanced.
 * @param buf The string buffer.
 * @return 1 if balanced, 0 otherwise.
 */
int terminal_is_balanced(const char* buf);

/**
 * @brief Enables raw mode for the terminal (disables echo and canonical mode).
 * @param state Pointer to TerminalState.
 * @return 0 on success, -1 on failure.
 */
int terminal_enable_raw_mode(TerminalState* state);

/**
 * @brief Disables raw mode and restores original terminal settings.
 * @param state Pointer to TerminalState.
 * @return 0 on success, -1 on failure.
 */
int terminal_disable_raw_mode(TerminalState* state);

/**
 * @brief Reads a single character from stdin.
 * @param state Pointer to TerminalState.
 * @return The character read, 0 on EOF, or -1 on error.
 */
int terminal_read_char(TerminalState* state);

/**
 * @brief Writes a single character to stdout.
 * @param c The character to write.
 * @return 0 on success, -1 on failure.
 */
int terminal_write_char(char c);

/**
 * @brief Writes a string to stdout.
 * @param s The string to write.
 * @return 0 on success, -1 on failure.
 */
int terminal_write_str(const char* s);

/**
 * @brief Reads a line of input with full editing support (arrows, history, etc.).
 * @param state Pointer to TerminalState.
 * @param prompt The prompt to display.
 * @param buf The buffer to store the line.
 * @param max_len Maximum length of the buffer.
 * @return Number of characters read, or -1 on error.
 */
int terminal_readline(TerminalState* state, const char* prompt, char* buf, int max_len);

/**
 * @brief Reads a complete S-expression, possibly spanning multiple lines.
 * @param state Pointer to TerminalState.
 * @param prompt The initial prompt.
 * @param cont_prompt The prompt for continuation lines.
 * @param buf The buffer to store the S-expression.
 * @param max_len Maximum length of the buffer.
 * @return Total length of S-expression read, or -1 on error/overflow.
 */
int terminal_read_sexpr(TerminalState* state, const char* prompt, const char* cont_prompt, char* buf, int max_len);

#endif /* TERMINAL_H */
