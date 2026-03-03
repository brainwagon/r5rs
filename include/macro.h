#ifndef MACRO_H
#define MACRO_H

#include <scheme.h>

Value* macro_expand(Value* expr, Value* syntax_env);
Value* macro_expand_with_transformer(Value* transformer, Value* expr);
Value* macro_test_match_expand(Value* literals, Value* pattern, Value* input, Value* template);

#endif /* MACRO_H */
