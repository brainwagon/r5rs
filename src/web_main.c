#define _POSIX_C_SOURCE 200809L
#include <emscripten.h>
#include <scheme.h>
#include <vm.h>
#include <reader.h>
#include <compiler.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <unistd.h>

static VM global_vm;
VM* global_vm_ptr = &global_vm;

EMSCRIPTEN_KEEPALIVE
void init_scheme() {
    gc_init();
    vm_init(&global_vm);
    vm_register_primitives(&global_vm);

    // Redirect stdout to a file in the virtual filesystem
    freopen("/stdout.txt", "w", stdout);
}

int main() {
    return 0;
}

EMSCRIPTEN_KEEPALIVE
const char* get_output() {
    static char* output_buf = NULL;
    if (output_buf) free(output_buf);

    fflush(stdout);
    FILE* f = fopen("/stdout.txt", "r");
    if (!f) return "";

    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    output_buf = malloc(size + 1);
    if (!output_buf) return "";
    fread(output_buf, 1, size, f);
    output_buf[size] = '\0';
    fclose(f);

    // Clear the file for next time
    freopen("/stdout.txt", "w", stdout);

    return output_buf;
}

EMSCRIPTEN_KEEPALIVE
const char* exec_scheme(const char* input) {
    static char* result_buffer = NULL;
    if (result_buffer) {
        free(result_buffer);
        result_buffer = NULL;
    }

    char* mem_buf = NULL;
    size_t mem_size = 0;
    FILE* out = open_memstream(&mem_buf, &mem_size);
    if (!out) return "Error: failed to open memstream";
    
    if (setjmp(global_vm.error_jmp) != 0) {
        global_vm.jmp_buf_set = false;
        fprintf(out, "Error occurred during execution.");
        fclose(out);
        result_buffer = mem_buf;
        return result_buffer;
    }
    global_vm.jmp_buf_set = true;
    
    const char* p = input;
    while (p && *p) {
        while (*p && isspace(*p)) p++;
        if (!*p) break;
        
        Value* expr = read_sexpr_str(&p);
        if (!expr) break;
        
        Value* proto = compile(expr, make_nil(), global_vm.syntax_env, -1, false);
        Value* result = vm_run(&global_vm, proto);
        
        fprint_value(out, result, true);
        fprintf(out, "\n");
        
        gc_collect();
    }
    
    global_vm.jmp_buf_set = false;
    fclose(out);
    result_buffer = mem_buf;
    return result_buffer;
}
