# Implementation Plan: derived_exprs_20260303

## Phase 1: Logical and Conditional Expressions
- [x] **Task 1: Implement and/or/cond** [2887512]
  - Implement `and` rewriting.
  - Implement `or` with single-evaluation logic.
  - Implement `cond` including `else` and `=>` forms.

## Phase 2: Binding Constructs
- [x] **Task 1: Implement let/let*/letrec** [2887512]
  - Implement standard and named `let`.
  - Implement `let*` via nesting.
  - Implement `letrec` via `set!`.

## Phase 3: Selection and Primitives
- [x] **Task 1: Selection and Primitives** [2887512]
  - Add `eqv?` and `memv` primitives to `src/primitives.c`.
  - Implement `case` rewriting.
  - Final verification and coverage check.
