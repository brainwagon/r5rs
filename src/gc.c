#include <scheme.h>
#include <stdlib.h>
#include <stdio.h>

#define MAX_ROOTS 1024

static Value* all_objects = NULL;
static Value** roots[MAX_ROOTS];
static int roots_count = 0;

void gc_init(void) {
    all_objects = NULL;
    roots_count = 0;
}

Value* gc_alloc(ValueType type) {
    Value* v = malloc(sizeof(Value));
    if (!v) {
        perror("malloc failed");
        exit(1);
    }
    v->type = type;
    v->marked = false;
    v->next = all_objects;
    all_objects = v;
    return v;
}

void gc_add_root(Value** root) {
    if (roots_count < MAX_ROOTS) {
        roots[roots_count++] = root;
    }
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
    if (v->type == VAL_PAIR) {
        mark_object(v->as.pair.car);
        mark_object(v->as.pair.cdr);
    } else if (v->type == VAL_PROTOTYPE) {
        for (int i = 0; i < v->as.proto.num_constants; i++) {
            mark_object(v->as.proto.constants[i]);
        }
    } else if (v->type == VAL_CLOSURE) {
        mark_object(v->as.closure.proto);
        mark_object(v->as.closure.env);
    } else if (v->type == VAL_CONTINUATION) {
        for (int i = 0; i < v->as.cont.sp; i++) {
            mark_object(v->as.cont.stack[i]);
        }
        mark_object(v->as.cont.env);
        mark_object(v->as.cont.proto);
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
            }
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
    sweep();
}
