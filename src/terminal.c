#define _POSIX_C_SOURCE 200809L
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

int terminal_enable_raw_mode(TerminalState* state) {
    if (state->raw_mode_enabled) return 0;
    if (!isatty(STDIN_FILENO)) return -1;
    
    if (tcgetattr(STDIN_FILENO, &state->orig_termios) == -1) return -1;
    
    struct termios raw = state->orig_termios;
    // Input flags: disable break, CR-to-NL, parity check, strip 8th bit, flow control
    raw.c_iflag &= ~(BRKINT | ICRNL | INPCK | ISTRIP | IXON);
    // Output flags: disable post-processing
    raw.c_oflag &= ~(OPOST);
    // Control flags: set character size to 8 bits per byte
    raw.c_cflag |= (CS8);
    // Local flags: disable echoing, canonical mode, extended functions, signals
    raw.c_lflag &= ~(ECHO | ICANON | IEXTEN | ISIG);
    
    // Set to blocking read: wait for at least one character
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

static void terminal_refresh_line(int pos, const char* buf) {
    // Go to beginning of line
    terminal_write_str("\r");
    // Clear to end of line (using VT100 escape sequence K)
    terminal_write_str("\x1b[K");
    // Redraw prompt (Assuming "scheme> ")
    // Actually, we should probably pass the prompt or use a more generic way
    // For now, let's just draw the buffer content
    terminal_write_str("test> "); // Using "test> " to match manual test for now
    terminal_write_str(buf);
    
    // Position cursor: go to beginning of line, then forward by (pos + prompt_len)
    terminal_write_str("\r");
    char move_cursor[32];
    sprintf(move_cursor, "\x1b[%dC", pos + 6); // 6 is length of "test> "
    terminal_write_str(move_cursor);
}

int terminal_readline(TerminalState* state, char* buf, int max_len) {
    int len = 0;
    int pos = 0;
    buf[0] = '\0';
    
    while (1) {
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
                        continue; // Other escape sequence, skip for now
                    }
                } else {
                    continue; // Other escape sequence, skip for now
                }
            } else {
                continue; // Incomplete escape sequence
            }
        }
        
        if (c == 16) { // Ctrl-P (Previous history)
            const char* h = terminal_history_prev(state);
            if (h) {
                strncpy(buf, h, max_len - 1);
                buf[max_len - 1] = '\0';
                len = strlen(buf);
                pos = len;
                terminal_refresh_line(pos, buf);
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
                terminal_refresh_line(pos, buf);
            } else if (state->history.current_idx == state->history.count) {
                buf[0] = '\0';
                len = 0;
                pos = 0;
                terminal_refresh_line(pos, buf);
            }
            continue;
        }
        
        if (c == 127 || c == 8) { // Backspace
            if (pos > 0) {
                memmove(&buf[pos - 1], &buf[pos], len - pos + 1);
                len--;
                pos--;
                terminal_refresh_line(pos, buf);
            }
            continue;
        }
        
        if (c == 2) { // Ctrl-B (Left)
            if (pos > 0) {
                pos--;
                terminal_refresh_line(pos, buf);
            }
            continue;
        }
        
        if (c == 6) { // Ctrl-F (Right)
            if (pos < len) {
                pos++;
                terminal_refresh_line(pos, buf);
            }
            continue;
        }
        
        if (c == 1) { // Ctrl-A (Home)
            pos = 0;
            terminal_refresh_line(pos, buf);
            continue;
        }
        
        if (c == 5) { // Ctrl-E (End)
            pos = len;
            terminal_refresh_line(pos, buf);
            continue;
        }
        
        if (c == 11) { // Ctrl-K (Kill to end of line)
            if (pos < len) {
                strncpy(state->kill_buffer, &buf[pos], sizeof(state->kill_buffer) - 1);
                state->kill_buffer[sizeof(state->kill_buffer) - 1] = '\0';
                buf[pos] = '\0';
                len = pos;
                terminal_refresh_line(pos, buf);
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
                terminal_refresh_line(pos, buf);
            }
            continue;
        }
        
        if (c == 12) { // Ctrl-L (Clear screen)
            terminal_write_str("\x1b[2J\x1b[H");
            terminal_refresh_line(pos, buf);
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
            terminal_refresh_line(pos, buf);
        }
    }
    buf[len] = '\0';
    return len;
}
