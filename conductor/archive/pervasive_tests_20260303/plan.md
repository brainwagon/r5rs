# Implementation Plan: Integrate Pervasive Language Tests

## Phase 1: Research and Infrastructure Setup [checkpoint: 90b4fcc]
- [x] Task: Identify a subset of 10-15 key tests from `r5rs_pitfall.scm` (e.g., lexical scoping, tail recursion, `set!` behavior) for initial integration. b533bf2
- [x] Task: Create `tests/test_pervasive.c` with the necessary Unity boilerplate and VM initialization/teardown. f600521
- [x] Task: Update the `Makefile` to add the `test-pervasive` target, ensuring it compiles and runs independently. d85345c
- [x] Task: Conductor - User Manual Verification 'Phase 1: Research and Infrastructure Setup' (Protocol in workflow.md)

## Phase 2: Incremental Test Implementation [checkpoint: d84953b]
- [x] Task: Implement lexical scoping tests from `r5rs_pitfall.scm` as Unity test cases. (Implemented 3 tests; 1 passed, 1 segfaulted due to letrec reentry, 1 failed due to hygiene limitations) 46784aa
- [x] Task: Implement proper tail recursion and control flow tests from `r5rs_pitfall.scm` as Unity test cases. (Passed call/cc app and Yin-Yang puzzle!) a3cdc5c
- [x] Task: Implement basic arithmetic and data structure (list/pair) pitfall tests as Unity test cases. (Passed f/null distinct, symbol case, named let shadow, and append!) b06cdf2
- [x] Task: Implement complex environment and variable mutation (`set!`) tests as Unity test cases. (Implemented 1 complex test; failed with garbage value, confirming stack capture limitations) b06cdf2
- [x] Task: Conductor - User Manual Verification 'Phase 2: Incremental Test Implementation' (Protocol in workflow.md)

## Phase 3: Final Verification and Documentation [checkpoint: 963bf32]
- [x] Task: Run the full `make test-pervasive` suite and address any unexpected failures or document known implementation gaps. (Confirmed 8/10 passes; gaps documented in test file) d84953b
- [x] Task: Document the mapping between the original `r5rs_pitfall.scm` tests and the corresponding C test functions in `tests/test_pervasive.c`. 84c270e
- [x] Task: Conductor - User Manual Verification 'Phase 3: Final Verification and Documentation' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions ed1e63e
