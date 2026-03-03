# Implementation Plan: numeric_tower_20260303

## Phase 1: Data Structures and Bignum Core
- [x] **Task 1: Type Extension** [ef3307e]
  - Add `VAL_BIGNUM` and `VAL_REAL` to `include/scheme.h`.
  - Update `Value` union.
  - Implement GC support in `src/gc.c`.
- [~] **Task 2: Bignum Implementation**
  - Create `src/bignum.c` with a simple "digit array" (base 2^32 or 10^9).
  - Implement addition, subtraction, and multiplication.
  - Implement comparison and string conversion.

## Phase 2: Reader and Dispatch
- [ ] **Task 1: Lexical Support**
  - Update `src/reader.c` to handle floats (e.g. `3.14`) and large integers.
- [ ] **Task 2: Numeric Dispatch**
  - Refactor `src/primitives.c` to use a generic numeric dispatch system.
  - Implement "coercion" (fixnum -> bignum -> real).

## Phase 3: Verification
- [ ] **Task 1: Testing**
  - Unit tests for large integer arithmetic.
  - Verification of numeric tower semantics.
