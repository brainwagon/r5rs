# Specification: derived_exprs_20260303

## Objective
Implement R5RS derived expressions in the Scheme compiler.

## Scope
- Implement `and`, `or`, `cond`, `let`, `let*`, `letrec`, `case`.
- Add `eqv?` and `memv` primitives.
- Ensure proper single-evaluation of expressions in `or`, `cond`, and `case`.

## Success Criteria
- All derived forms pass functional tests.
- Code coverage remains >80%.
