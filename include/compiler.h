#ifndef COMPILER_H
#define COMPILER_H

#include <scheme.h>

Value* compile(Value* expr, Value* env, int num_args);

#endif /* COMPILER_H */
