#ifndef VM_H
#define VM_H

#include <scheme.h>

typedef struct VM {
    Value** stack;
    int stack_cap;
    int sp;
    Value* globals;
    
    // Execution state for call/cc
    unsigned char* pc;
    Value* env;
    Value* top_proto;
    bool running;
} VM;

void vm_init(VM* vm);
void vm_register_primitives(VM* vm);
Value* vm_run(VM* vm, Value* proto);
Value* lookup_global(VM* vm, Value* sym);
void set_global(VM* vm, Value* sym, Value* val);

#endif /* VM_H */
