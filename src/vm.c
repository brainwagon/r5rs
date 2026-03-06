#include <vm.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdarg.h>

void vm_init(VM* vm) {
    vm->stack_cap = 1024;
    vm->stack = malloc(sizeof(Value*) * vm->stack_cap);
    vm->sp = 0;
    vm->globals = make_nil();
    gc_add_root(&vm->globals);
    vm->syntax_env = make_nil();
    gc_add_root(&vm->syntax_env);
    vm->env = make_nil();
    gc_add_root(&vm->env);
    vm->top_proto = NULL;
    gc_add_root(&vm->top_proto);
    gc_set_stack_root(&vm->stack, &vm->sp);
    vm->running = false;
    vm->jmp_buf_set = false;
}

void vm_cleanup(VM* vm) {
    if (vm->stack) {
        free(vm->stack);
        vm->stack = NULL;
    }
}

void vm_error(VM* vm, const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    fprintf(stderr, "Error: ");
    vfprintf(stderr, fmt, args);
    fprintf(stderr, "\n");
    va_end(args);

    if (vm->jmp_buf_set) {
        longjmp(vm->error_jmp, 1);
    } else {
        exit(1);
    }
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
        vm_error(vm, "Stack underflow at PC offset %ld", (long)(vm->pc - vm->top_proto->as.proto.code));
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
    gc_add_root(&sym);
    gc_add_root(&val);
    Value* current = vm->globals;
    while (is_pair(current)) {
        Value* entry = current->as.pair.car;
        if (entry->as.pair.car == sym) {
            entry->as.pair.cdr = val;
            gc_remove_root(&val);
            gc_remove_root(&sym);
            return;
        }
        current = current->as.pair.cdr;
    }
    Value* entry = make_pair(sym, val);
    gc_add_root(&entry);
    vm->globals = make_pair(entry, vm->globals);
    gc_remove_root(&entry);
    gc_remove_root(&val);
    gc_remove_root(&sym);
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
                frame->as.pair.car = val;
                push(vm, val);
                break;
            }
            case OP_GREF: {
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* sym = vm->top_proto->as.proto.constants[idx];
                Value* val = lookup_global(vm, sym);
                if (!val) {
                    vm_error(vm, "Undefined global: %s", sym->as.symbol);
                }
                push(vm, val);
                break;
            }
            case OP_GSET: {
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* val = pop(vm);
                Value* sym = vm->top_proto->as.proto.constants[idx];
                set_global(vm, sym, val);
                push(vm, val);
                break;
            }
            case OP_DEF: {
                int idx = (vm->pc[0] << 8) | vm->pc[1];
                vm->pc += 2;
                Value* val = pop(vm);
                Value* sym = vm->top_proto->as.proto.constants[idx];
                set_global(vm, sym, val);
                push(vm, make_nil());
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
                gc_add_root(&proc);
                Value* cont = make_continuation(vm->stack, vm->sp, vm->env, vm->top_proto, vm->pc);
                gc_add_root(&cont);
                if (is_primitive(proc)) {
                    Value* args[1] = {cont};
                    Value* result = proc->as.primitive(vm, 1, args);
                    push(vm, result);
                } else if (is_closure(proc)) {
                    Value* raw_pc = make_raw(vm->pc);
                    gc_add_root(&raw_pc);
                    push(vm, raw_pc);
                    gc_remove_root(&raw_pc);
                    push(vm, vm->env);
                    push(vm, vm->top_proto);
                    vm->env = make_pair(make_pair(cont, make_nil()), proc->as.closure.env);
                    vm->top_proto = proc->as.closure.proto;
                    vm->pc = vm->top_proto->as.proto.code;
                } else {
                    vm_error(vm, "call/cc expects procedure");
                }
                gc_remove_root(&cont);
                gc_remove_root(&proc);
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
                gc_add_root(&proc);
                
                if (is_primitive(proc)) {
                    Value** args = malloc(sizeof(Value*) * nargs);
                    for (int i = nargs - 1; i >= 0; i--) {
                        args[i] = pop(vm);
                        gc_add_root(&args[i]);
                    }
                    Value* result = proc->as.primitive(vm, nargs, args);
                    for (int i = 0; i < nargs; i++) gc_remove_root(&args[i]);
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
                        gc_add_root(&r);
                        for (int i = 0; i < rest_count; i++) {
                            Value* v = pop(vm);
                            gc_add_root(&v);
                            r = make_pair(v, r);
                            gc_remove_root(&v);
                        }
                        push(vm, r);
                        gc_remove_root(&r);
                        nargs = fixed + 1;
                    }
                    
                    // 1. Pop arguments into a frame FIRST
                    Value* frame = make_nil();
                    gc_add_root(&frame);
                    for (int i = 0; i < nargs; i++) {
                        Value* v = pop(vm);
                        gc_add_root(&v);
                        frame = make_pair(v, frame);
                        gc_remove_root(&v);
                    }

                    // 2. Handle return information
                    if (op == OP_CALL) {
                        Value* raw_pc = make_raw(vm->pc);
                        gc_add_root(&raw_pc);
                        push(vm, raw_pc);
                        gc_remove_root(&raw_pc);
                        push(vm, vm->env);
                        push(vm, vm->top_proto);
                    }
                    
                    // 3. Set up new environment
                    vm->env = make_pair(frame, proc->as.closure.env);
                    gc_remove_root(&frame);
                    vm->top_proto = proto;
                    vm->pc = vm->top_proto->as.proto.code;
                } else if (is_continuation(proc)) {
                    if (nargs != 1) { vm_error(vm, "Continuation expects 1 argument"); }
                    Value* result = pop(vm);
                    gc_add_root(&result);
                    if (proc->as.cont.sp > vm->stack_cap) {
                        vm->stack_cap = proc->as.cont.sp;
                        vm->stack = realloc(vm->stack, sizeof(Value*) * vm->stack_cap);
                    }
                    vm->sp = proc->as.cont.sp;
                    memcpy(vm->stack, proc->as.cont.stack, sizeof(Value*) * vm->sp);
                    vm->env = proc->as.cont.env;
                    vm->top_proto = proc->as.cont.proto;
                    vm->pc = proc->as.cont.pc;
                    push(vm, result);
                    gc_remove_root(&result);
                } else {
                    vm_error(vm, "Cannot call non-procedure");
                }
                gc_remove_root(&proc);
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
                vm_error(vm, "Unknown opcode: %d", op);
        }
    }
    return NULL;
}
