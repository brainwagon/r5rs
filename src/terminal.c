#include <terminal.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include <errno.h>

void terminal_init(TerminalState* state) {
    memset(state, 0, sizeof(TerminalState));
    state->raw_mode_enabled = 0;
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

int terminal_readline_basic(TerminalState* state, char* buf, int max_len) {
    int len = 0;
    while (len < max_len - 1) {
        int c = terminal_read_char(state);
        if (c <= 0) break; // EOF or Error
        if (c == 4) break; // Ctrl-D
        if (c == '\n' || c == '\r') {
            terminal_write_str("\r\n");
            break;
        }
        if (c == 127 || c == 8) { // Backspace or Ctrl-H
            if (len > 0) {
                len--;
                terminal_write_str("\b \b");
            }
            continue;
        }
        
        // Basic echo
        terminal_write_char((char)c);
        buf[len++] = (char)c;
    }
    buf[len] = '\0';
    return len;
}
