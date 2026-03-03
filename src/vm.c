#include <vm.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

void vm_init(VM* vm) {
    vm->stack_cap = 1024;
    vm->stack = malloc(sizeof(Value*) * vm->stack_cap);
    vm->sp = 0;
    vm->globals = make_nil();
    gc_add_root(&vm->globals);
}

static void push(VM* vm, Value* v) {
    if (vm->sp == vm->stack_cap) {
        vm->stack_cap *= 2;
        vm->stack = realloc(vm->stack, sizeof(Value*) * vm->stack_cap);
    }
    vm->stack[vm->sp++] = v;
}

static Value* pop(VM* vm) {
    if (vm->sp == 0) {
        fprintf(stderr, "Stack underflow\n");
        exit(1);
    }
    return vm->stack[--vm->sp];
}

Value* lookup_global(VM* vm, Value* sym) {
    Value* current = vm->globals;
    while (is_pair(current)) {
        Value* entry = current->as.pair.car;
        if (entry->as.pair.car == sym) {
            return entry->as.pair.cdr;
        }
        current = current->as.pair.cdr;
    }
    return NULL;
}

void set_global(VM* vm, Value* sym, Value* val) {
    Value* current = vm->globals;
    while (is_pair(current)) {
        Value* entry = current->as.pair.car;
        if (entry->as.pair.car == sym) {
            entry->as.pair.cdr = val;
            return;
        }
        current = current->as.pair.cdr;
    }
    Value* entry = make_pair(sym, val);
    vm->globals = make_pair(entry, vm->globals);
}

Value* vm_run(VM* vm, Value* top_proto) {
    unsigned char* pc = top_proto->as.proto.code;
    Value* env = make_nil();

    while (1) {
        OpCode op = (OpCode)(*pc++);
        // printf("OP: %d, SP: %d\n", op, vm->sp);
        switch (op) {
            case OP_HALT:
                return pop(vm);
            case OP_CONST: {
                int idx = (*pc << 8) | *(pc + 1);
                pc += 2;
                push(vm, top_proto->as.proto.constants[idx]);
                break;
            }
            case OP_LREF: {
                int depth = *pc++;
                int idx = (*pc << 8) | *(pc + 1);
                pc += 2;
                Value* e = env;
                for (int d = 0; d < depth; d++) e = e->as.pair.cdr;
                Value* frame = e->as.pair.car;
                for (int i = 0; i < idx; i++) frame = frame->as.pair.cdr;
                push(vm, frame->as.pair.car);
                break;
            }
            case OP_GREF: {
                int idx = (*pc << 8) | *(pc + 1);
                pc += 2;
                Value* sym = top_proto->as.proto.constants[idx];
                Value* val = lookup_global(vm, sym);
                if (!val) {
                    fprintf(stderr, "Undefined global: %s\n", sym->as.symbol);
                    exit(1);
                }
                push(vm, val);
                break;
            }
            case OP_DEF: {
                int idx = (*pc << 8) | *(pc + 1);
                pc += 2;
                Value* sym = top_proto->as.proto.constants[idx];
                Value* val = pop(vm);
                set_global(vm, sym, val);
                push(vm, val);
                break;
            }
            case OP_JF: {
                int offset = (*pc << 8) | *(pc + 1);
                pc += 2;
                Value* cond = pop(vm);
                // In Scheme, only #f is false
                if (is_boolean(cond) && !cond->as.boolean) {
                    pc += offset;
                }
                break;
            }
            case OP_JUMP: {
                int offset = (*pc << 8) | *(pc + 1);
                pc += 2;
                pc += offset;
                break;
            }
            case OP_CALL:
            case OP_TCALL: {
                int nargs = *pc++;
                Value* proc = pop(vm);
                
                // POP ARGS FIRST
                Value* frame = make_nil();
                for (int i = 0; i < nargs; i++) {
                    frame = make_pair(pop(vm), frame);
                }

                if (is_primitive(proc)) {
                    Value** args = malloc(sizeof(Value*) * nargs);
                    Value* p = frame;
                    for (int i = 0; i < nargs; i++) {
                        args[i] = p->as.pair.car;
                        p = p->as.pair.cdr;
                    }
                    Value* result = proc->as.primitive(nargs, args);
                    free(args);
                    if (op == OP_TCALL) {
                        top_proto = pop(vm);
                        env = pop(vm);
                        pc = (unsigned char*)pop(vm);
                    }
                    push(vm, result);
                } else if (is_closure(proc)) {
                    if (op == OP_CALL) {
                        push(vm, (Value*)pc);
                        push(vm, env);
                        push(vm, top_proto);
                    }
                    env = make_pair(frame, proc->as.closure.env);
                    top_proto = proc->as.closure.proto;
                    pc = top_proto->as.proto.code;
                } else {
                    fprintf(stderr, "Cannot call non-procedure\n");
                    exit(1);
                }
                break;
            }
            case OP_RET: {
                Value* result = pop(vm);
                top_proto = pop(vm);
                env = pop(vm);
                pc = (unsigned char*)pop(vm);
                push(vm, result);
                break;
            }
            case OP_CLOSURE: {
                int idx = (*pc << 8) | *(pc + 1);
                pc += 2;
                Value* sub_proto = top_proto->as.proto.constants[idx];
                push(vm, make_closure(sub_proto, env));
                break;
            }
            case OP_POP: {
                pop(vm);
                break;
            }
            default:
                fprintf(stderr, "Unknown opcode: %d\n", op);
                exit(1);
        }
    }
}
