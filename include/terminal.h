#ifndef TERMINAL_H
#define TERMINAL_H

#include <termios.h>

typedef struct {
    struct termios orig_termios;
    int raw_mode_enabled;
} TerminalState;

void terminal_init(TerminalState* state);
int terminal_enable_raw_mode(TerminalState* state);
int terminal_disable_raw_mode(TerminalState* state);

#endif /* TERMINAL_H */
