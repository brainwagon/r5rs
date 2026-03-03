# Implementation Plan: std_library_20260303

## Phase 1: Core Primitives for Library
- [x] **Task 1: Implement apply** [20260303]
  - Add `OP_APPLY` opcode.
  - Fix stack/return-info bug in `OP_CALL`/`OP_TCALL`.
- [x] **Task 2: Basic I/O** [20260303]
  - Implement `display`, `write`, `newline`, `read`, `read-char` in `src/primitives.c`.

## Phase 2: Prelude Implementation
- [x] **Task 1: Standard Library in Scheme** [20260303]
  - Create `prelude.scm`.
  - Implement `map`, `for-each`, `append`, `reverse`, etc.
  - Added string/vector/char procedures.
- [x] **Task 2: Automatic Loading** [20260303]
  - Update `src/main.c` to load `prelude.scm` at startup.

## Phase 3: Verification
- [x] **Task 1: Comprehensive Library Testing** [20260303]
  - Verify all library functions in REPL and via scripts.
  - Fixed multiple VM bugs discovered during library development.
