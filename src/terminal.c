#include <terminal.h>
#include <string.h>

void terminal_init(TerminalState* state) {
    memset(state, 0, sizeof(TerminalState));
    state->raw_mode_enabled = 0;
}

int terminal_enable_raw_mode(TerminalState* state) {
    (void)state;
    return 0;
}

int terminal_disable_raw_mode(TerminalState* state) {
    (void)state;
    return 0;
}
