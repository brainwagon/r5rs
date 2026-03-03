#ifndef VM_H
#define VM_H

#include <scheme.h>

typedef struct {
    Value** stack;
    int stack_cap;
    int sp;
    Value* globals;
} VM;

void vm_init(VM* vm);
void vm_register_primitives(VM* vm);
Value* vm_run(VM* vm, Value* proto);
void set_global(VM* vm, Value* sym, Value* val);

#endif /* VM_H */
