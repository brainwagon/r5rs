#ifndef MACRO_H
#define MACRO_H

#include <scheme.h>

Value* macro_expand(Value* expr, Value* env);
Value* macro_test_match_expand(Value* literals, Value* pattern, Value* template, Value* input);

#endif /* MACRO_H */
