#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

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
            print_value(result, true);
            printf("\n");
        }
        gc_collect();
    }
    free(content);
}

static void repl(VM* vm) {
    char line[4096];
    char* buffer = NULL;
    size_t buffer_size = 0;
    welcome();
    while (1) {
        if (buffer == NULL || buffer[0] == '\0') {
            printf(COLOR_BOLD COLOR_GREEN "scheme> " COLOR_RESET);
        } else {
            printf(COLOR_BOLD COLOR_GREEN "     > " COLOR_RESET);
        }
        
        if (!fgets(line, sizeof(line), stdin)) break;
        
        size_t line_len = strlen(line);
        buffer = realloc(buffer, buffer_size + line_len + 1);
        strcpy(buffer + buffer_size, line);
        buffer_size += line_len;
        
        const char* p = buffer;
        while (p && *p) {
            while (*p && isspace(*p)) p++;
            if (!*p) break;
            
            const char* start_p = p;
            Value* expr = read_sexpr_str(&p);
            if (!expr) {
                // If we couldn't parse but p advanced, it's a partial expression or comment
                // If it's a partial expression (like "(define x"), we need more input
                // Reset p to start_p so we keep the partial content in buffer
                p = start_p;
                break;
            }
            
            Value* proto = compile(expr, make_nil(), vm->syntax_env, -1, false);
            Value* result = vm_run(vm, proto);
            
            printf(COLOR_CYAN);
            print_value(result, true);
            printf(COLOR_RESET "\n");
            
            gc_collect();
            
            // Move the remaining unparsed content to the front of the buffer
            size_t remaining = strlen(p);
            memmove(buffer, p, remaining + 1);
            buffer_size = remaining;
            p = buffer;
        }
    }
    free(buffer);
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
    
    return 0;
}
