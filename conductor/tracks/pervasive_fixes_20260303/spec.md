# Track Specification: Fix Pervasive Test Failures and R5RS Compliance

## Overview
This track aims to resolve the remaining failures identified in the `test-pervasive` suite, specifically targeting VM stack capture issues (`call/cc` robustness) and macro hygiene limitations. The focus is on achieving stability and documented compliance with the R5RS pitfall tests. If a fix requires significant architectural changes to the Virtual Machine, the goal shifts to producing a detailed rearchitecting plan for user approval before implementation.

## Functional Requirements
- **VM Stability (Priority 1)**: Diagnose and fix the garbage value failure in `test_pervasive_cont_mutation`. This involves ensuring that `call/cc` correctly captures and restores the execution state, even when multiple continuations coexist.
- **Macro Hygiene (Priority 2)**: Address the `test_pervasive_hygiene_plus` failure. Improve the macro expansion system to correctly handle renaming or syntactic closures so that local bindings do not interfere with macro-introduced identifiers.
- **Compliance Audit**: Perform a targeted review of the full `r5rs_pitfall.scm` suite to identify any other gaps in the current implementation.
- **Architectural Planning**: For any issues requiring a fundamental shift in the VM's design (e.g., moving from a flat stack to heap-allocated frames), produce a technical design document and implementation plan.

## Non-Functional Requirements
- **Correctness**: Prioritize spec-compliant behavior over performance for these edge cases.
- **Maintainability**: Ensure fixes are integrated into the existing modular structure of `src/vm.c`, `src/compiler.c`, and `src/macro.c`.
- **Auditability**: Maintain clear documentation mapping pitfall tests to implementation status.

## Acceptance Criteria
- [ ] `test_pervasive_cont_mutation` passes (or a detailed architectural plan for the fix is submitted and approved).
- [ ] `test_pervasive_hygiene_plus` passes (or a detailed architectural plan for the fix is submitted and approved).
- [ ] All 10 tests in `tests/test_pervasive.c` pass.
- [ ] A final report provides an "Architectural Map" of the VM's compliance with the `r5rs_pitfall.scm` suite.

## Out of Scope
- Implementation of major VM architectural shifts (e.g., full heap-allocated frame system) without prior plan approval.
- Integration of non-R5RS test suites.
- Performance optimization of the resulting fixes.
