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
    vm->syntax_env = make_nil();
    gc_add_root(&vm->syntax_env);
    gc_set_stack_root(&vm->stack, &vm->sp);
    vm->running = false;
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
        fprintf(stderr, "Stack underflow at PC offset %ld\n", (long)(vm->pc - vm->top_proto->as.proto.code));
        exit(1);
    }
    return vm->stack[--vm->sp];
}

Value* lookup_global(VM* vm, Value* sym) {
    Value* current = vm->globals;
    while (is_pair(current)) {
        Value* entry = current->as.pair.car;
        if (entry->as.pair.car == sym) return entry->as.pair.cdr;
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
    vm->pc = top_proto->as.proto.code;
    vm->env = make_nil();
    vm->top_proto = top_proto;
    vm->running = true;

    while (vm->running) {
        OpCode op = (OpCode)(*vm->pc++);
        int nargs = 0;
        switch (op) {
            case OP_HALT:
                vm->running = false;
                return pop(vm);
            case OP_CONST: {
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                push(vm, vm->top_proto->as.proto.constants[idx]);
                break;
            }
            case OP_LREF: {
                int depth = *vm->pc++;
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* e = vm->env;
                for (int d = 0; d < depth; d++) e = e->as.pair.cdr;
                Value* frame = e->as.pair.car;
                for (int i = 0; i < idx; i++) frame = frame->as.pair.cdr;
                push(vm, is_pair(frame) ? frame->as.pair.car : frame);
                break;
            }
            case OP_LSET: {
                int depth = *vm->pc++;
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* val = pop(vm);
                Value* e = vm->env;
                for (int d = 0; d < depth; d++) e = e->as.pair.cdr;
                Value* frame = e->as.pair.car;
                for (int i = 0; i < idx; i++) frame = frame->as.pair.cdr;
                if (is_pair(frame)) frame->as.pair.car = val;
                push(vm, val);
                break;
            }
            case OP_GREF: {
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* sym = vm->top_proto->as.proto.constants[idx];
                Value* val = lookup_global(vm, sym);
                if (!val) {
                    fprintf(stderr, "Undefined global: %s\n", sym->as.symbol);
                    exit(1);
                }
                push(vm, val);
                break;
            }
            case OP_GSET: {
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* sym = vm->top_proto->as.proto.constants[idx];
                Value* val = pop(vm);
                set_global(vm, sym, val);
                push(vm, val);
                break;
            }
            case OP_DEF: {
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* sym = vm->top_proto->as.proto.constants[idx];
                Value* val = pop(vm);
                set_global(vm, sym, val);
                push(vm, val);
                break;
            }
            case OP_JF: {
                int offset = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* cond = pop(vm);
                if (is_boolean(cond) && !cond->as.boolean) {
                    vm->pc += offset;
                }
                break;
            }
            case OP_JUMP: {
                int offset = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                vm->pc += offset;
                break;
            }
            case OP_CALLCC: {
                Value* proc = pop(vm);
                Value* cont = make_continuation(vm->stack, vm->sp, vm->env, vm->top_proto, vm->pc);
                push(vm, cont);
                if (is_primitive(proc)) {
                    Value* args[1] = {cont};
                    Value* result = proc->as.primitive(vm, 1, args);
                    push(vm, result);
                } else if (is_closure(proc)) {
                    push(vm, make_raw(vm->pc));
                    push(vm, vm->env);
                    push(vm, vm->top_proto);
                    vm->env = make_pair(make_pair(cont, make_nil()), proc->as.closure.env);
                    vm->top_proto = proc->as.closure.proto;
                    vm->pc = vm->top_proto->as.proto.code;
                } else {
                    fprintf(stderr, "call/cc expects procedure\n");
                    exit(1);
                }
                break;
            }
            case OP_APPLY: {
                Value* arg_list = pop(vm);
                Value* proc = pop(vm);
                nargs = 0;
                Value* p = arg_list;
                while (is_pair(p)) {
                    push(vm, p->as.pair.car);
                    nargs++;
                    p = p->as.pair.cdr;
                }
                push(vm, proc);
                op = OP_CALL;
                goto execute_call;
            }
            case OP_CALL:
            case OP_TCALL: {
                nargs = *vm->pc++;
            execute_call: ;
                Value* proc = pop(vm);
                
                if (is_primitive(proc)) {
                    Value** args = malloc(sizeof(Value*) * nargs);
                    for (int i = nargs - 1; i >= 0; i--) args[i] = pop(vm);
                    Value* result = proc->as.primitive(vm, nargs, args);
                    free(args);
                    if (op == OP_TCALL) {
                        vm->top_proto = pop(vm);
                        vm->env = pop(vm);
                        vm->pc = (unsigned char*)pop(vm)->as.raw;
                    }
                    push(vm, result);
                } else if (is_closure(proc)) {
                    Value* proto = proc->as.closure.proto;
                    if (proto->as.proto.has_rest) {
                        int fixed = proto->as.proto.num_args;
                        int rest_count = nargs - fixed;
                        Value* r = make_nil();
                        for (int i = 0; i < rest_count; i++) {
                            Value* v = pop(vm);
                            push(vm, r); // protect r for GC
                            r = make_pair(v, r);
                            pop(vm); // remove old r
                        }
                        push(vm, r);
                        nargs = fixed + 1;
                    }
                    
                    // 1. Pop arguments into a frame FIRST
                    Value* frame = make_nil();
                    for (int i = 0; i < nargs; i++) {
                        Value* v = pop(vm);
                        push(vm, frame); // protect frame for GC
                        frame = make_pair(v, frame);
                        pop(vm); // remove old frame
                    }

                    // 2. Handle return information
                    if (op == OP_CALL) {
                        push(vm, make_raw(vm->pc));
                        push(vm, vm->env);
                        push(vm, vm->top_proto);
                    } else { // OP_TCALL
                        // We skip pushing new return info, so the NEW function will return 
                        // to the same place the CURRENT one would.
                        // The return info is already on the stack.
                    }
                    
                    // 3. Set up new environment
                    vm->env = make_pair(frame, proc->as.closure.env);
                    vm->top_proto = proto;
                    vm->pc = vm->top_proto->as.proto.code;
                } else if (is_continuation(proc)) {
                    if (nargs != 1) { fprintf(stderr, "Continuation expects 1 argument\n"); exit(1); }
                    Value* result = pop(vm);
                    vm->sp = proc->as.cont.sp;
                    memcpy(vm->stack, proc->as.cont.stack, sizeof(Value*) * vm->sp);
                    vm->env = proc->as.cont.env;
                    vm->top_proto = proc->as.cont.proto;
                    vm->pc = proc->as.cont.pc;
                    push(vm, result);
                } else {
                    fprintf(stderr, "Cannot call non-procedure: ");
                    print_value(proc);
                    fprintf(stderr, "\n");
                    exit(1);
                }
                break;
            }
            case OP_RET: {
                Value* result = pop(vm);
                vm->top_proto = pop(vm);
                vm->env = pop(vm);
                vm->pc = (unsigned char*)pop(vm)->as.raw;
                push(vm, result);
                break;
            }
            case OP_CLOSURE: {
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* sub_proto = vm->top_proto->as.proto.constants[idx];
                push(vm, make_closure(sub_proto, vm->env));
                break;
            }
            case OP_POP: {
                pop(vm);
                break;
            }
            case OP_DUP: {
                Value* v = vm->stack[vm->sp - 1];
                push(vm, v);
                break;
            }
            default:
                fprintf(stderr, "Unknown opcode: %d\n", op);
                exit(1);
        }
    }
    return NULL;
}
