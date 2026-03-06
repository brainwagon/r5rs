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

static void usage(const char* prog) {
    printf("Usage: %s [options] [file ...]\n", prog);
    printf("Options:\n");
    printf("  -e, --eval <expr>  Evaluate expression and print result\n");
    printf("  -h, --help         Display this help message\n");
    printf("  -v, --version      Display version information\n");
}

static void eval_str(VM* vm, const char* str, bool print) {
    if (setjmp(vm->error_jmp) != 0) {
        vm->jmp_buf_set = false;
        return;
    }
    vm->jmp_buf_set = true;

    const char* p = str;
    while (p && *p) {
        while (*p && isspace(*p)) p++;
        if (!*p) break;
        
        Value* expr = read_sexpr_str(&p);
        if (!expr) break;
        
        Value* proto = compile(expr, make_nil(), vm->syntax_env, -1, false);
        Value* result = vm_run(vm, proto);
        
        if (print) {
            fprint_value(vm->out, result, true);
            fprintf(vm->out, "\n");
        }
        
        gc_collect();
    }
    vm->jmp_buf_set = false;
}

int main(int argc, char** argv) {
    gc_init();
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    global_vm_ptr = &vm;
    
    // Load prelude
    load_file(&vm, "prelude.scm", true);
    
    int arg_idx = 1;
    bool ran_something = false;
    
    while (arg_idx < argc) {
        const char* arg = argv[arg_idx];
        if (strcmp(arg, "-e") == 0 || strcmp(arg, "--eval") == 0) {
            if (arg_idx + 1 >= argc) {
                fprintf(stderr, "Error: %s requires an argument\n", arg);
                return 1;
            }
            eval_str(&vm, argv[++arg_idx], true);
            ran_something = true;
        } else if (strcmp(arg, "-h") == 0 || strcmp(arg, "--help") == 0) {
            usage(argv[0]);
            return 0;
        } else if (strcmp(arg, "-v") == 0 || strcmp(arg, "--version") == 0) {
            printf("R5RS Scheme VM v0.1.0\n");
            return 0;
        } else if (arg[0] == '-') {
            fprintf(stderr, "Error: Unknown option %s\n", arg);
            usage(argv[0]);
            return 1;
        } else {
            load_file(&vm, arg, true);
            ran_something = true;
        }
        arg_idx++;
    }
    
    if (!ran_something) {
        repl(&vm);
    }
    
    vm_cleanup(&vm);
    gc_shutdown();
    
    return 0;
}
