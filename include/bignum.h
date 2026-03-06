#ifndef BIGNUM_H
#define BIGNUM_H

#include <scheme.h>

Value* bignum_add(Value* a, Value* b);
Value* bignum_sub(Value* a, Value* b);
Value* bignum_mul(Value* a, Value* b);
int bignum_compare(Value* a, Value* b);
Value* bignum_from_long(long n);
char* bignum_to_string(Value* v);
double bignum_to_double(Value* v);
Value* bignum_div_long(Value* a, long b, long* rem);
void bignum_div_rem(Value* a, Value* b, Value** q, Value** r);

#endif /* BIGNUM_H */
