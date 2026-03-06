# Implementation Plan: `circular_equal_20260306`

**Phase 1: Research and Scaffolding**
- [x] **Task 1: Identify existing `equal?` implementation** [5f4a855]
    - [x] Locate `prim_equal_p` in `src/primitives.c`.
- [x] **Task 2: Create a reproduction test case for circularity** [b7c7174]
    - [x] Create `tests/test_circular_equal.c` following the existing `test_equal.c` structure.
    - [x] Add tests for circular lists and circular vectors.
    - [x] Confirm that running these tests causes a crash or infinite loop.

**Phase 2: Core Logic Implementation**
- [x] **Task 1: Design the Tortoise and Hare comparison logic** [9f2d652]
    - [x] Create a helper function `equal_circular_p(Value* a, Value* b)` that implements the two-pointer approach (Note: implemented using visited set instead).
    - [x] Ensure it handles both pairs and vectors recursively.
- [x] **Task 2: Update `prim_equal_p` in `src/primitives.c`** [9f2d652]
    - [x] Replace or extend `prim_equal_p` to call the circular-aware comparison.
- [x] **Task 3: Implement and test the topology comparison** [9f2d652]
    - [x] Verify that topologies match (e.g., cycles of the same length).

**Phase 3: Verification and Completion**
- [ ] **Task 1: Performance Verification**
    - [ ] Run benchmark tests to ensure it meets the <1ms target for 100 elements.
- [ ] **Task 2: Regression Testing**
    - [ ] Run all existing tests in `tests/` (especially `test_equal.c` and `test_pervasive.c`).
- [ ] **Task: Conductor - User Manual Verification 'circular_equal_20260306' (Protocol in workflow.md)**
