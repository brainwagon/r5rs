#ifndef VM_H
#define VM_H

#include <scheme.h>
#include <setjmp.h>

typedef struct VM {
    Value** stack;
    int stack_cap;
    int sp;
    Value* globals;
    Value* syntax_env;
    
    // Execution state for call/cc
    unsigned char* pc;
    Value* env;
    Value* top_proto;
    bool running;

    // Error recovery
    jmp_buf error_jmp;
    bool jmp_buf_set;
} VM;

extern VM* global_vm_ptr;

void vm_init(VM* vm);
void vm_cleanup(VM* vm);
void vm_register_primitives(VM* vm);
Value* vm_run(VM* vm, Value* proto);
Value* lookup_global(VM* vm, Value* sym);
void set_global(VM* vm, Value* sym, Value* val);
void vm_error(VM* vm, const char* fmt, ...);

#endif /* VM_H */
