# Implementation Plan: datatypes_20260303

## Phase 1: Data Structures and Garbage Collection
- [ ] **Task 1: Extend Type System**
  - Add `VAL_STRING`, `VAL_VECTOR`, `VAL_CHAR` to `include/scheme.h`.
  - Update `Value` union to hold specific data structures.
  - Add constructors (`make_string`, `make_vector`, `make_char`) and predicates to `src/values.c`.
  - Update `print_value` to support formatting the new types.
- [ ] **Task 2: Garbage Collection**
  - Update `mark_object` in `src/gc.c` to recursively mark vector elements.
  - Update `sweep` in `src/gc.c` to free string data and vector arrays.

## Phase 2: Reader Support
- [ ] **Task 1: Character Parsing**
  - Update `read_sexpr_str` to support `#\a`, `#\space`, `#
ewline`.
- [ ] **Task 2: String Parsing**
  - Update `read_sexpr_str` to support double-quoted strings `"..."` including escape sequences (`"`, ``, `
`).
- [ ] **Task 3: Vector Parsing**
  - Update `read_sexpr_str` to support vector syntax `#(a b c)`.

## Phase 3: Primitives and Verification
- [ ] **Task 1: Type Primitives**
  - Implement R5RS primitives in `src/primitives.c` (e.g., `make-string`, `string-ref`, `string-set!`, `make-vector`, `vector-ref`, `vector-set!`, `char?`, `string?`, `vector?`).
  - Register new primitives in `vm_register_primitives`.
- [ ] **Task 2: Testing and Cleanup**
  - Add C unit tests for all new datatypes, reader extensions, and primitive procedures.
  - Run Valgrind or GC counts to verify memory stability.
  - Final test run and coverage check.
