#include <scheme.h>
#include <reader.h>
#include <compiler.h>
#include <vm.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define COLOR_RESET  "\x1b[0m"
#define COLOR_BOLD   "\x1b[1m"
#define COLOR_CYAN   "\x1b[36m"
#define COLOR_GREEN  "\x1b[32m"
#define COLOR_RED    "\x1b[31m"

static void welcome(void) {
    printf(COLOR_BOLD COLOR_CYAN "Welcome to R5RS Scheme VM\n" COLOR_RESET);
    printf("Type expressions at the prompt. Press Ctrl+D to exit.\n\n");
}

static void repl(VM* vm) {
    char line[1024];
    welcome();
    while (1) {
        printf(COLOR_BOLD COLOR_GREEN "scheme> " COLOR_RESET);
        if (!fgets(line, sizeof(line), stdin)) break;
        
        const char* p = line;
        Value* expr = read_sexpr_str(&p);
        if (!expr) continue;
        
        Value* proto = compile(expr, make_nil(), -1);
        Value* result = vm_run(vm, proto);
        
        printf(COLOR_CYAN);
        print_value(result);
        printf(COLOR_RESET "\n");
        
        gc_collect();
        // printf("[GC: %d objects]\n", gc_get_object_count());
    }
    printf("\nGoodbye!\n");
}

static void load_file(VM* vm, const char* filename) {
    FILE* f = fopen(filename, "r");
    if (!f) {
        perror("fopen");
        exit(1);
    }
    
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char* content = malloc(size + 1);
    fread(content, 1, size, f);
    content[size] = '\0';
    fclose(f);
    
    const char* p = content;
    while (*p) {
        Value* expr = read_sexpr_str(&p);
        if (!expr) break;
        Value* proto = compile(expr, make_nil(), -1);
        Value* result = vm_run(vm, proto);
        print_value(result);
        printf("\n");
        gc_collect();
        // printf("[GC: %d objects]\n", gc_get_object_count());
    }
    free(content);
}

int main(int argc, char** argv) {
    gc_init();
    VM vm;
    vm_init(&vm);
    vm_register_primitives(&vm);
    
    if (argc > 1) {
        for (int i = 1; i < argc; i++) {
            load_file(&vm, argv[i]);
        }
    } else {
        repl(&vm);
    }
    
    return 0;
}
