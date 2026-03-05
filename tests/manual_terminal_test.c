#include <terminal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// Mock symbols for linking with compiler/vm objects
void* global_vm_ptr = NULL;
void setUp(void) {}
void tearDown(void) {}

int main(void) {
    TerminalState state;
    terminal_init(&state);
    
    printf("Enabling raw mode. Press 'q' to quit, Backspace to delete, Ctrl-D for EOF.\n");
    if (terminal_enable_raw_mode(&state) == -1) {
        perror("terminal_enable_raw_mode");
        return 1;
    }
    
    char buf[128];
    while (1) {
        int res = terminal_readline(&state, "test> ", buf, sizeof(buf));
        if (res <= 0 && buf[0] == '\0') {
            terminal_write_str("\r\nEOF detected.\r\n");
            break;
        }
        if (strcmp(buf, "q") == 0) break;
        
        terminal_history_add(&state, buf);
        
        terminal_write_str("\r\nYou entered: [");
        terminal_write_str(buf);
        terminal_write_str("]\r\n");
    }
    
    terminal_disable_raw_mode(&state);
    printf("Raw mode disabled. Goodbye!\n");
    return 0;
}
