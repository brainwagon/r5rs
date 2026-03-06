# Specification: `modify equal? to support circular structures`

**Overview:**
The current implementation of `equal?` in `src/primitives.c` does not handle circular data structures, which can lead to infinite recursion and stack overflow. This track aims to update `equal?` to correctly handle circularity in both lists (pairs) and vectors, returning `#t` if the structures have the same topology (same infinite unfolding).

**Functional Requirements:**
- **Cycle Detection**: Use the "Tortoise and Hare" (two-pointer) algorithm to detect cycles during the recursive comparison.
- **Support for Pairs and Vectors**: Both circular lists and circular vectors must be correctly compared for equality.
- **Topology Equality**: Two circular structures are considered `equal?` if they represent the same (possibly infinite) tree structure. For example, if both `a` and `b` are lists where `(set-cdr! a a)` and `(set-cdr! b b)`, then `(equal? a b)` should return `#t`.
- **Termination**: The `equal?` procedure must terminate for all valid Scheme structures, including those with cycles.

**Non-Functional Requirements:**
- **Performance**: The implementation should handle structures with up to 100 elements in less than 1ms.
- **Memory**: The Tortoise and Hare approach is preferred to keep memory overhead low.
- **Correctness**: Adhere to the R5RS specification for `equal?` regarding circularity (which typically implies topology equality).

**Acceptance Criteria:**
- `(equal? '(1 2) '(1 2))` returns `#t` (existing functionality).
- `(let ((a (list 1 2))) (set-cdr! (cdr a) a) (equal? a a))` returns `#t`.
- `(let ((a (list 1)) (b (list 1))) (set-cdr! a a) (set-cdr! b b) (equal? a b))` returns `#t`.
- `(let ((v (vector 1))) (vector-set! v 0 v) (equal? v v))` returns `#t`.
- `equal?` does not crash or hang when given any circular structure.
- All existing `equal?` tests in `tests/test_equal.c` continue to pass.

**Out of Scope:**
- Performance optimization for extremely large structures (>10,000 elements).
- Handling circularity in other potential future data types (like hash tables, if they were added later).
