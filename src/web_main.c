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

static void silent_load_file(VM* vm, const char* filename) {
    FILE* f = fopen(filename, "r");
    if (!f) return;
    
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char* content = malloc(size + 1);
    fread(content, 1, size, f);
    content[size] = '\0';
    fclose(f);
    
    // We don't use setjmp here because we want to know if it fails during init
    // but we also don't want it to crash the worker.
    // For now, assume prelude.scm is correct.
    
    const char* p = content;
    while (p && *p) {
        while (*p && isspace(*p)) p++;
        if (!*p) break;
        
        Value* expr = read_sexpr_str(&p);
        if (!expr) break;
        
        Value* proto = compile(expr, make_nil(), vm->syntax_env, -1, false);
        vm_run(vm, proto);
        
        gc_collect();
    }
    free(content);
}

EMSCRIPTEN_KEEPALIVE
void init_scheme() {
    gc_init();
    vm_init(&global_vm);
    vm_register_primitives(&global_vm);
    silent_load_file(&global_vm, "prelude.scm");
}

int main() {
    return 0;
}

EMSCRIPTEN_KEEPALIVE
const char* get_output() {
    return "";
}

static char* last_result = NULL;

EMSCRIPTEN_KEEPALIVE
const char* exec_scheme(const char* input) {
    if (last_result) {
        free(last_result);
        last_result = NULL;
    }

    char* mem_buf = NULL;
    size_t mem_size = 0;
    FILE* out = open_memstream(&mem_buf, &mem_size);
    if (!out) return "Error: failed to open memstream";
    
    global_vm.out = out;
    
    if (setjmp(global_vm.error_jmp) != 0) {
        global_vm.jmp_buf_set = false;
        fflush(out);
        fclose(out);
        global_vm.out = stdout;
        last_result = mem_buf;
        return last_result;
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
        
        fputc('\n', out);
        fprint_value(out, result, true);
        fputc('\n', out);
        
        gc_collect();
    }
    
    global_vm.jmp_buf_set = false;
    fflush(out);
    fclose(out);
    global_vm.out = stdout;
    last_result = mem_buf;
    return last_result;
}
