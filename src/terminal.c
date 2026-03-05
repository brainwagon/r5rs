#define _POSIX_C_SOURCE 200809L
#define _DEFAULT_SOURCE
#include <terminal.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include <errno.h>
#include <stdio.h>

void terminal_init(TerminalState* state) {
    memset(state, 0, sizeof(TerminalState));
    state->raw_mode_enabled = 0;
    state->history.count = 0;
    state->history.current_idx = 0;
}

void terminal_history_add(TerminalState* state, const char* line) {
    if (line[0] == '\0') return;
    
    // Deduplication: don't add if identical to previous entry
    if (state->history.count > 0 && strcmp(state->history.entries[state->history.count - 1], line) == 0) {
        state->history.current_idx = state->history.count;
        return;
    }
    
    if (state->history.count == HISTORY_MAX) {
        // Remove oldest
        free(state->history.entries[0]);
        memmove(&state->history.entries[0], &state->history.entries[1], sizeof(char*) * (HISTORY_MAX - 1));
        state->history.count--;
    }
    
    state->history.entries[state->history.count] = strdup(line);
    state->history.count++;
    state->history.current_idx = state->history.count;
}

const char* terminal_history_prev(TerminalState* state) {
    if (state->history.current_idx > 0) {
        state->history.current_idx--;
        return state->history.entries[state->history.current_idx];
    }
    return NULL;
}

const char* terminal_history_next(TerminalState* state) {
    if (state->history.current_idx < state->history.count) {
        state->history.current_idx++;
        if (state->history.current_idx == state->history.count) {
            return NULL;
        }
        return state->history.entries[state->history.current_idx];
    }
    return NULL;
}

void terminal_history_free(TerminalState* state) {
    for (int i = 0; i < state->history.count; i++) {
        free(state->history.entries[i]);
    }
    state->history.count = 0;
    state->history.current_idx = 0;
}

int terminal_history_save(TerminalState* state, const char* filename) {
    FILE* f = fopen(filename, "w");
    if (!f) return -1;
    
    for (int i = 0; i < state->history.count; i++) {
        fprintf(f, "%s\n", state->history.entries[i]);
    }
    
    fclose(f);
    return 0;
}

int terminal_history_load(TerminalState* state, const char* filename) {
    FILE* f = fopen(filename, "r");
    if (!f) return -1;
    
    terminal_history_free(state);
    
    char line[1024];
    while (fgets(line, sizeof(line), f)) {
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }
        terminal_history_add(state, line);
    }
    
    fclose(f);
    return 0;
}

int terminal_find_matching_paren(const char* buf, int pos) {
    if (pos < 0 || buf[pos] != ')') return -1;
    
    int depth = 0;
    for (int i = pos - 1; i >= 0; i--) {
        if (buf[i] == ')') {
            depth++;
        } else if (buf[i] == '(') {
            if (depth == 0) return i;
            depth--;
        }
    }
    return -1;
}

int terminal_is_balanced(const char* buf) {
    int depth = 0;
    for (int i = 0; buf[i]; i++) {
        if (buf[i] == '(') {
            depth++;
        } else if (buf[i] == ')') {
            if (depth > 0) depth--;
        }
    }
    return depth == 0;
}

int terminal_enable_raw_mode(TerminalState* state) {
    if (state->raw_mode_enabled) return 0;
    if (!isatty(STDIN_FILENO)) return -1;
    
    if (tcgetattr(STDIN_FILENO, &state->orig_termios) == -1) return -1;
    
    struct termios raw = state->orig_termios;
    raw.c_iflag &= ~(BRKINT | ICRNL | INPCK | ISTRIP | IXON);
    raw.c_oflag &= ~(OPOST);
    raw.c_cflag |= (CS8);
    raw.c_lflag &= ~(ECHO | ICANON | IEXTEN | ISIG);
    raw.c_cc[VMIN] = 1;
    raw.c_cc[VTIME] = 0;
    
    if (tcsetattr(STDIN_FILENO, TCSAFLUSH, &raw) == -1) return -1;
    
    state->raw_mode_enabled = 1;
    return 0;
}

int terminal_disable_raw_mode(TerminalState* state) {
    if (!state->raw_mode_enabled) return 0;
    
    if (tcsetattr(STDIN_FILENO, TCSAFLUSH, &state->orig_termios) == -1) return -1;
    
    state->raw_mode_enabled = 0;
    return 0;
}

int terminal_read_char(TerminalState* state) {
    (void)state;
    char c;
    int nread;
    while ((nread = read(STDIN_FILENO, &c, 1)) != 1) {
        if (nread == -1) {
            if (errno == EAGAIN || errno == EINTR) continue;
            return -1;
        }
        if (nread == 0) return 0; // EOF
    }
    return c;
}

int terminal_write_char(char c) {
    if (write(STDOUT_FILENO, &c, 1) != 1) return -1;
    return 0;
}

int terminal_write_str(const char* s) {
    size_t len = strlen(s);
    if (write(STDOUT_FILENO, s, len) != (ssize_t)len) return -1;
    return 0;
}

static void terminal_refresh_line(const char* prompt, int pos, const char* buf) {
    // 1. Move to beginning of line
    terminal_write_str("\r");
    // 2. Clear entire line
    terminal_write_str("\x1b[2K");
    // 3. Write prompt
    terminal_write_str(prompt);
    // 4. Write buffer up to 'pos'
    for (int i = 0; i < pos; i++) {
        terminal_write_char(buf[i]);
    }
    // 5. Save cursor position
    terminal_write_str("\x1b[s");
    // 6. Write rest of buffer
    terminal_write_str(&buf[pos]);
    // 7. Restore cursor position
    terminal_write_str("\x1b[u");
    
    tcdrain(STDOUT_FILENO);
}

int terminal_readline(TerminalState* state, const char* prompt, char* buf, int max_len) {
    int len = 0;
    int pos = 0;
    buf[0] = '\0';
    
    while (1) {
        terminal_refresh_line(prompt, pos, buf);
        
        int c = terminal_read_char(state);
        if (c <= 0 || c == 4) break; // EOF, Error, or Ctrl-D
        
        if (c == '\n' || c == '\r') {
            terminal_write_str("\r\n");
            break;
        }
        
        if (c == 27) { // Escape sequence
            char seq[2];
            if (read(STDIN_FILENO, &seq[0], 1) == 1 && read(STDIN_FILENO, &seq[1], 1) == 1) {
                if (seq[0] == '[') {
                    if (seq[1] == 'D') { // Left arrow
                        c = 2; // Map to Ctrl-B
                    } else if (seq[1] == 'C') { // Right arrow
                        c = 6; // Map to Ctrl-F
                    } else if (seq[1] == 'A') { // Up arrow
                        c = 16; // Map to Ctrl-P
                    } else if (seq[1] == 'B') { // Down arrow
                        c = 14; // Map to Ctrl-N
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
            } else {
                continue;
            }
        }
        
        if (c == 16) { // Ctrl-P (Previous history)
            const char* h = terminal_history_prev(state);
            if (h) {
                strncpy(buf, h, max_len - 1);
                buf[max_len - 1] = '\0';
                len = strlen(buf);
                pos = len;
            }
            continue;
        }
        
        if (c == 14) { // Ctrl-N (Next history)
            const char* h = terminal_history_next(state);
            if (h) {
                strncpy(buf, h, max_len - 1);
                buf[max_len - 1] = '\0';
                len = strlen(buf);
                pos = len;
            } else if (state->history.current_idx == state->history.count) {
                buf[0] = '\0';
                len = 0;
                pos = 0;
            }
            continue;
        }
        
        if (c == 127 || c == 8) { // Backspace
            if (pos > 0) {
                memmove(&buf[pos - 1], &buf[pos], len - pos + 1);
                len--;
                pos--;
            }
            continue;
        }
        
        if (c == 2) { // Ctrl-B (Left)
            if (pos > 0) {
                pos--;
            }
            continue;
        }
        
        if (c == 6) { // Ctrl-F (Right)
            if (pos < len) {
                pos++;
            }
            continue;
        }
        
        if (c == 1) { // Ctrl-A (Home)
            pos = 0;
            continue;
        }
        
        if (c == 5) { // Ctrl-E (End)
            pos = len;
            continue;
        }
        
        if (c == 11) { // Ctrl-K (Kill to end of line)
            if (pos < len) {
                strncpy(state->kill_buffer, &buf[pos], sizeof(state->kill_buffer) - 1);
                state->kill_buffer[sizeof(state->kill_buffer) - 1] = '\0';
                buf[pos] = '\0';
                len = pos;
            }
            continue;
        }
        
        if (c == 25) { // Ctrl-Y (Yank)
            int yank_len = strlen(state->kill_buffer);
            if (yank_len > 0 && len + yank_len < max_len - 1) {
                memmove(&buf[pos + yank_len], &buf[pos], len - pos + 1);
                memcpy(&buf[pos], state->kill_buffer, yank_len);
                len += yank_len;
                pos += yank_len;
            }
            continue;
        }
        
        if (c == 12) { // Ctrl-L (Clear screen)
            terminal_write_str("\x1b[2J\x1b[H");
            continue;
        }
        
        if (len < max_len - 1 && c >= 32 && c <= 126) {
            if (pos < len) {
                memmove(&buf[pos + 1], &buf[pos], len - pos);
            }
            buf[pos] = (char)c;
            len++;
            pos++;
            buf[len] = '\0';
            
            if (c == ')') {
                int match = terminal_find_matching_paren(buf, pos - 1);
                if (match >= 0) {
                    terminal_refresh_line(prompt, pos, buf);
                    int back = pos - 1 - match;
                    if (back > 0) {
                        char move_back[32];
                        sprintf(move_back, "\x1b[%dD", back);
                        terminal_write_str(move_back);
                        tcdrain(STDOUT_FILENO);
                        usleep(500000);
                        char move_forward[32];
                        sprintf(move_forward, "\x1b[%dC", back);
                        terminal_write_str(move_forward);
                        tcdrain(STDOUT_FILENO);
                    }
                }
            }
        }
    }
    buf[len] = '\0';
    return len;
}

int terminal_read_sexpr(TerminalState* state, const char* prompt, const char* cont_prompt, char* buf, int max_len) {
    int total_len = 0;
    buf[0] = '\0';
    
    const char* current_prompt = prompt;
    
    while (1) {
        char line[1024];
        int res = terminal_readline(state, current_prompt, line, sizeof(line));
        
        if (res < 0) return res;
        if (res == 0 && total_len == 0) return 0;
        
        if (total_len + res + 2 > max_len) return -1; // Overflow
        
        if (total_len > 0) {
            strcat(buf, "\n");
            total_len++;
        }
        
        strcat(buf, line);
        total_len += res;
        
        if (terminal_is_balanced(buf)) {
            break;
        }
        
        current_prompt = cont_prompt;
    }
    
    return total_len;
}
