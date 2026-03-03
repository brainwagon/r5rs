# Track Specification: Integrate Pervasive Language Tests

## Overview
This track focuses on enhancing the testing suite for the Scheme interpreter by integrating pervasive language tests from well-established sources. Specifically, we will start with the classic `r5rs_pitfall.scm` test suite by Aubrey Jaffer. These tests will be translated into the project's existing Unity-based C testing framework to ensure consistent reporting and integration with the VM's internal state checks.

## Functional Requirements
- **Test Suite Source**: `r5rs_pitfall.scm` (or similar R5RS compliance tests).
- **Translation Strategy**: Manually translate a subset of tests from the Scheme source into C-based Unity tests. These tests should exercise the VM and compiler by loading and executing Scheme code fragments.
- **Test Runner**: Implement or extend a test runner that can execute these translated tests.
- **Reporting**: Create a new Makefile target `test-pervasive` to run these tests independently of the core unit tests.

## Non-Functional Requirements
- **Consistency**: Use the same Unity assertions as existing tests.
- **Maintainability**: Document the mapping between original Scheme tests and their C counterparts.
- **Robustness**: Ensure tests cover both success and expected failure/error conditions where applicable.

## Acceptance Criteria
- [ ] A new test file `tests/test_pervasive.c` is created.
- [ ] At least 10-15 key tests from `r5rs_pitfall.scm` (e.g., lexical scoping, proper tail recursion, basic arithmetic) are implemented in `tests/test_pervasive.c`.
- [ ] `make test-pervasive` correctly builds and runs these tests, reporting passes/fails via Unity.
- [ ] The tests successfully pass against the current implementation of the VM (or identify known gaps).

## Out of Scope
- Full R5RS compliance (only the selected subset is covered in this track).
- Automatic translation of `.scm` files to C tests.
- Integration with other test suites (Guile, SCM, etc.) at this stage.
