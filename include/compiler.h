#ifndef COMPILER_H
#define COMPILER_H

#include <scheme.h>

Value* compile(Value* expr, Value* env, Value* syntax_env, int num_args, bool has_rest);

#endif /* COMPILER_H */
