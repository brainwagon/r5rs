#include <scheme.h>
#include <vm.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#define MAX_ROOTS 16384

static Value* all_objects = NULL;
static Value** roots[MAX_ROOTS];
static int roots_count = 0;

static Value*** stack_root_ptr = NULL;
static int* stack_sp_ptr = NULL;

extern void reset_symbol_registry(void);

static Value* protection_stack[MAX_ROOTS];
static int protection_sp = 0;

void gc_push_root(Value* v) {
    if (protection_sp >= MAX_ROOTS) {
        fprintf(stderr, "GC Protection Stack Overflow\n");
        exit(1);
    }
    protection_stack[protection_sp++] = v;
}

void gc_pop_root(void) {
    if (protection_sp > 0) protection_sp--;
}

void gc_init(void) {
    all_objects = NULL;
    roots_count = 0;
    protection_sp = 0;
    stack_root_ptr = NULL;
    stack_sp_ptr = NULL;
    reset_symbol_registry();
}

void gc_shutdown(void) {
    Value* v = all_objects;
    while (v) {
        Value* next = v->next;
        if (v->type == VAL_SYMBOL) {
            free((void*)v->as.symbol);
        } else if (v->type == VAL_PROTOTYPE) {
            free(v->as.proto.code);
            free(v->as.proto.constants);
        } else if (v->type == VAL_CONTINUATION) {
            free(v->as.cont.stack);
        } else if (v->type == VAL_STRING) {
            free(v->as.string.str);
        } else if (v->type == VAL_VECTOR) {
            free(v->as.vector.elements);
        } else if (v->type == VAL_BIGNUM) {
            free(v->as.bignum.digits);
        }
        free(v);
        v = next;
    }
    all_objects = NULL;
}

void gc_add_root(Value** root) {
    if (roots_count < MAX_ROOTS) {
        roots[roots_count++] = root;
    }
}

void gc_remove_root(Value** root) {
    for (int i = 0; i < roots_count; i++) {
        if (roots[i] == root) {
            roots[i] = roots[--roots_count];
            return;
        }
    }
}

void gc_set_stack_root(Value*** stack, int* sp) {
    stack_root_ptr = stack;
    stack_sp_ptr = sp;
}

Value* gc_alloc(ValueType type) {
    static int alloc_count = 0;
    if (alloc_count++ % 10000 == 0) gc_collect();
    Value* v = malloc(sizeof(Value));
    if (!v) {
        vm_error(global_vm_ptr, "Out of memory");
    }
    v->type = type;
    v->marked = false;
    v->next = all_objects;
    all_objects = v;
    return v;
}

int gc_get_object_count(void) {
    int count = 0;
    Value* v = all_objects;
    while (v) {
        count++;
        v = v->next;
    }
    return count;
}

static void mark_object(Value* v) {
    if (!v || v->marked) return;
    v->marked = true;
    switch (v->type) {
        case VAL_PAIR:
            mark_object(v->as.pair.car);
            mark_object(v->as.pair.cdr);
            break;
        case VAL_PROTOTYPE:
            for (int i = 0; i < v->as.proto.num_constants; i++) {
                mark_object(v->as.proto.constants[i]);
            }
            break;
        case VAL_CLOSURE:
            mark_object(v->as.closure.proto);
            mark_object(v->as.closure.env);
            break;
        case VAL_CONTINUATION:
            for (int i = 0; i < v->as.cont.sp; i++) {
                mark_object(v->as.cont.stack[i]);
            }
            mark_object(v->as.cont.env);
            mark_object(v->as.cont.proto);
            break;
        case VAL_VECTOR:
            for (int i = 0; i < v->as.vector.len; i++) {
                mark_object(v->as.vector.elements[i]);
            }
            break;
        case VAL_MACRO:
            mark_object(v->as.macro.literals);
            mark_object(v->as.macro.rules);
            break;
        default:
            break;
    }
}

static void sweep(void) {
    Value** p = &all_objects;
    while (*p) {
        if (!(*p)->marked) {
            Value* unreached = *p;
            *p = unreached->next;
            
            if (unreached->type == VAL_SYMBOL) {
                free((void*)unreached->as.symbol);
            } else if (unreached->type == VAL_PROTOTYPE) {
                free(unreached->as.proto.code);
                free(unreached->as.proto.constants);
            } else if (unreached->type == VAL_CONTINUATION) {
                free(unreached->as.cont.stack);
            } else if (unreached->type == VAL_STRING) {
                free(unreached->as.string.str);
            } else if (unreached->type == VAL_VECTOR) {
                free(unreached->as.vector.elements);
            } else if (unreached->type == VAL_BIGNUM) {
                free(unreached->as.bignum.digits);
            }
            memset(unreached, 0xEE, sizeof(Value));
            free(unreached);
        } else {
            (*p)->marked = false;
            p = &((*p)->next);
        }
    }
}

void gc_collect(void) {
    for (int i = 0; i < roots_count; i++) {
        mark_object(*roots[i]);
    }
    for (int i = 0; i < protection_sp; i++) {
        mark_object(protection_stack[i]);
    }
    if (stack_root_ptr && stack_sp_ptr) {
        Value** stack = *stack_root_ptr;
        int sp = *stack_sp_ptr;
        for (int i = 0; i < sp; i++) {
            mark_object(stack[i]);
        }
    }
    sweep();
}
