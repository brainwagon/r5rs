# Specification: numeric_tower_20260303

## Objective
Implement the R5RS numeric tower including Fixnums, Bignums (Exact Integers), and Reals (Inexact Floats) using a homegrown bignum implementation.

## Scope
- Implement `VAL_BIGNUM` and `VAL_REAL` types.
- Homegrown bignum implementation for basic arithmetic (+, -, *, <, =, >).
- Automatic "upgrading" from fixnum to bignum on overflow.
- Floating point support for inexact numbers.
- Basic numeric primitives (+, -, *, /, <, =, >, zero?, etc.) updated to handle the tower.
- String-to-number and number-to-string conversion for all types.

## Success Criteria
- Arithmetic operations work across fixnums, bignums, and reals.
- Large integer calculations (e.g., (fact 50)) return correct results.
- No memory leaks in bignum allocations.
