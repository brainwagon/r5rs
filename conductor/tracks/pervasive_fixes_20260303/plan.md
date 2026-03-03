# Implementation Plan: Fix Pervasive Test Failures and R5RS Compliance

## Phase 1: VM Continuation Robustness (Priority 1)
- [ ] Task: Investigate `test_pervasive_cont_mutation` failure in `src/vm.c`. Trace stack capture and restoration to identify the source of the garbage value.
- [ ] Task: Attempt to fix the continuation bug if it's an implementation error (e.g., incorrect pointer arithmetic or missing GC root during capture).
- [ ] Task: If the failure is due to the flat stack architecture, document the technical constraints and stop implementation for this phase.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: VM Continuation Robustness' (Protocol in workflow.md)

## Phase 2: Macro Hygiene Improvement
- [ ] Task: Investigate `test_pervasive_hygiene_plus` failure in `src/macro.c`.
- [ ] Task: Enhance the macro expansion system to improve identifier renaming or implement a simplified form of syntactic closures to avoid local variable interference.
- [ ] Task: Verify the fix with `test_pervasive_hygiene_plus` and ensure no regressions in existing macro tests.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Macro Hygiene Improvement' (Protocol in workflow.md)

## Phase 3: Compliance Audit and Architectural Mapping
- [ ] Task: Identify and run any remaining tests from `r5rs_pitfall.scm` that are not yet integrated into `tests/test_pervasive.c`.
- [ ] Task: Create a comprehensive "Architectural Map" (report) documenting the current VM's status against the R5RS pitfall suite.
- [ ] Task: If major rearchitecting is required (e.g., heap-allocated frames), draft a detailed implementation plan for that effort.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Compliance Audit and Architectural Mapping' (Protocol in workflow.md)

## Phase 4: Final Cleanup and Documentation
- [ ] Task: Update project-level documentation (`product.md`, `tech-stack.md`) if any architectural decisions were made or if the compliance status significantly improved.
- [ ] Task: Ensure all 10 tests in `tests/test_pervasive.c` are passing or have documented exceptions.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Cleanup and Documentation' (Protocol in workflow.md)
