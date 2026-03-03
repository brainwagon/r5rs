#include <terminal.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>

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
    
    // Set timeout for read
    raw.c_cc[VMIN] = 0;
    raw.c_cc[VTIME] = 1; // 100ms
    
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
