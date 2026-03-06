#include <emscripten.h>
#include <scheme.h>
#include <vm.h>
#include <reader.h>
#include <compiler.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

static VM global_vm;
VM* global_vm_ptr = &global_vm;

EMSCRIPTEN_KEEPALIVE
void init_scheme() {
    gc_init();
    vm_init(&global_vm);
    vm_register_primitives(&global_vm);
    
    // Attempt to load prelude if it exists in the virtual filesystem
    FILE* f = fopen("prelude.scm", "r");
    if (f) {
        fclose(f);
        // We'll use a simplified version of load_file here or refactor load_file
        // For now, let's just assume it will be loaded by the worker
    }
}

EMSCRIPTEN_KEEPALIVE
const char* exec_scheme(const char* input) {
    static char* output_buffer = NULL;
    if (output_buffer) free(output_buffer);
    
    char* mem_buf;
    size_t mem_size;
    FILE* out = open_memstream(&mem_buf, &mem_size);
    
    if (setjmp(global_vm.error_jmp) != 0) {
        global_vm.jmp_buf_set = false;
        fprintf(out, "Error occurred during execution.");
        fclose(out);
        output_buffer = mem_buf;
        return output_buffer;
    }
    global_vm.jmp_buf_set = true;
    
    const char* p = input;
    bool first = true;
    while (p && *p) {
        while (*p && isspace(*p)) p++;
        if (!*p) break;
        
        Value* expr = read_sexpr_str(&p);
        if (!expr) break;
        
        Value* proto = compile(expr, make_nil(), global_vm.syntax_env, -1, false);
        Value* result = vm_run(&global_vm, proto);
        
        if (!first) fprintf(out, "\n");
        fprint_value(out, result, true);
        first = false;
        
        gc_collect();
    }
    
    global_vm.jmp_buf_set = false;
    fclose(out);
    output_buffer = mem_buf;
    return output_buffer;
}
