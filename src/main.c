#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
#include <terminal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <unistd.h>
#include <setjmp.h>

#define COLOR_RESET  "\x1b[0m"
#define COLOR_BOLD   "\x1b[1m"
#define COLOR_CYAN   "\x1b[36m"
#define COLOR_GREEN  "\x1b[32m"
#define COLOR_RED    "\x1b[31m"

VM* global_vm_ptr = NULL;

static void welcome(void) {
    printf(COLOR_BOLD COLOR_CYAN "Welcome to R5RS Scheme VM\n" COLOR_RESET);
    printf("Type expressions at the prompt. Press Ctrl+D to exit.\n\n");
}

static void load_file(VM* vm, const char* filename, bool silent) {
    FILE* f = fopen(filename, "r");
    if (!f) {
        if (!silent) perror("fopen");
        return;
    }
    
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char* content = malloc(size + 1);
    fread(content, 1, size, f);
    content[size] = '\0';
    fclose(f);
    
    if (setjmp(vm->error_jmp) != 0) {
        vm->jmp_buf_set = false;
        free(content);
        return;
    }
    vm->jmp_buf_set = true;
    
    const char* p = content;
    while (p && *p) {
        while (*p && isspace(*p)) p++;
        if (!*p) break;
        const char* old_p = p;
        Value* expr = read_sexpr_str(&p);
        if (!expr) {
            if (p == old_p) p++; // Ensure advancement
            continue;
        }
        Value* proto = compile(expr, make_nil(), vm->syntax_env, -1, false);
        Value* result = vm_run(vm, proto);
        if (!silent) {
            fprint_value(vm->out, result, true);
            fprintf(vm->out, "\n");
        }
        gc_collect();
    }
    vm->jmp_buf_set = false;
    free(content);
}

static char* get_history_path(void) {
    char* home = getenv("HOME");
    if (!home) return NULL;
    char* path = malloc(strlen(home) + 16);
    sprintf(path, "%s/.r5rs_history", home);
    return path;
}

static void repl(VM* vm) {
    TerminalState term;
    terminal_init(&term);
    
    char* history_path = get_history_path();
    if (history_path) {
        terminal_history_load(&term, history_path);
    }
    
    welcome();
    
    if (terminal_enable_raw_mode(&term) == -1) {
        printf("Warning: Failed to enable raw mode. Falling back to basic REPL.\n");
    }
    
    char buf[4096];
    while (1) {
        if (setjmp(vm->error_jmp) != 0) {
            // Error occurred, reset state for next command
            vm->sp = 0;
            vm->running = false;
            // Ensure we are not in the middle of a multi-line read
            // (though setjmp here is outside terminal_read_sexpr)
        }
        vm->jmp_buf_set = true;

        const char* prompt = COLOR_BOLD COLOR_GREEN "scheme> " COLOR_RESET;
        const char* cont_prompt = COLOR_BOLD COLOR_GREEN "     > " COLOR_RESET;
        
        int res = terminal_read_sexpr(&term, prompt, cont_prompt, buf, sizeof(buf));
        if (res <= 0 && buf[0] == '\0') break; // EOF or Error
        
        // Add to history
        terminal_history_add(&term, buf);
        if (history_path) {
            terminal_history_save(&term, history_path);
        }
        
        const char* p = buf;
        while (p && *p) {
            while (*p && isspace(*p)) p++;
            if (!*p) break;
            
            Value* expr = read_sexpr_str(&p);
            if (!expr) break;
            
            Value* proto = compile(expr, make_nil(), vm->syntax_env, -1, false);
            Value* result = vm_run(vm, proto);
            
            terminal_write_str(COLOR_CYAN);
            fflush(stdout);
            fprint_value(vm->out, result, true);
            fflush(vm->out);
            terminal_write_str(COLOR_RESET "\r\n");
            fflush(stdout);
            tcdrain(STDOUT_FILENO);
            
            gc_collect();
        }
    }
    
    vm->jmp_buf_set = false;
    terminal_disable_raw_mode(&term);
    terminal_history_free(&term);
    if (history_path) free(history_path);
    
    printf("\nGoodbye!\n");
}

int main(int argc, char** argv) {
    gc_init();
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;
    
    // Load prelude
    load_file(&vm, "prelude.scm", true);
    
    if (argc > 1) {
        for (int i = 1; i < argc; i++) {
            load_file(&vm, argv[i], true);
        }
    } else {
        repl(&vm);
    }
    
    vm_cleanup(&vm);
    gc_shutdown();
    
    return 0;
}
