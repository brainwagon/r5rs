# Handoff: Fix Pervasive Test Failures and R5RS Compliance

## Current Status
Implementation is in progress for the `pervasive_fixes_20260303` track. The primary focus has been on diagnosing `test_pervasive_cont_mutation` failures and improving core spec compliance.

### Test Results (`make test-pervasive`):
- **PASS**: `test_pervasive_placeholder`
- **PASS**: `test_pervasive_identifier_shadowing` (Fixed: core keywords are now bound globally)
- **PASS**: `test_pervasive_callcc_app`
- **PASS**: `test_pervasive_yinyang`
- **PASS**: `test_pervasive_f_null_distinct`
- **PASS**: `test_pervasive_symbol_case`
- **PASS**: `test_pervasive_named_let_shadow`
- **PASS**: `test_pervasive_append_sharing`
- **FAIL**: `test_pervasive_hygiene_plus` (Expected 4 Was 3; known macro hygiene limitation)
- **FAIL**: `test_pervasive_cont_mutation` (Blocker: **Stack underflow at OP_RET**)

## Key Changes & Fixes
1. **VM OP_CALLCC Fix**: Removed a redundant `push(vm, cont)` that was leaking continuations onto the stack and corrupting arguments for subsequent primitive calls.
2. **Keyword Handling**: 
   - Updated `src/compiler.c` to handle core keywords used as values (identifiers).
   - Updated `src/primitives.c` to bind keywords (`if`, `lambda`, etc.) to themselves in the global environment.
3. **Arithmetic Robustness**: 
   - Added `bignum_to_double` to `src/bignum.c`.
   - Integrated `is_number` helper and strict type checks in `src/primitives.c` (later reverted to clean state for Valgrind, but logic verified).
4. **Infrastructure**: Created `tests/test_pervasive.c` and integrated a subset of `r5rs_pitfall.scm`.

## Blockers & Identified Issues
- **OP_RET Stack Underflow**: In `test_pervasive_cont_mutation`, the VM encounters a stack underflow at the end of the `let` body. `sp` is 3 (likely just the return info), but `OP_RET` expects 4 (result + return info). This suggests an extra `OP_POP` or a missing result push in the `cond` or `let` expansion.
- **Macro Hygiene**: Our `syntax-rules` implementation lacks syntactic closures, causing local bindings to interfere with macro-introduced identifiers.

## Recommended Next Steps
1. **Trace `test_pervasive_cont_mutation` Bytecode**: Inspect the exact sequence of `OP_POP` and pushes around the `cond` expression.
2. **Debug `OP_RET`**: Use GDB to verify the stack state at the moment of underflow.
3. **Fix Internal `define`**: Address the `TODO` in `src/compiler.c` regarding internal definitions being treated as globals.
4. **Implement Syntactic Closures**: If required for compliance, rearchitect macro renaming to track scope.
