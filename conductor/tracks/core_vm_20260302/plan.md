# Implementation Plan: core_vm_20260302

## Phase 1: Foundation and Data Structures
- [ ] **Task 1: Project Scaffolding**
  - Setup directory structure (src, include, tests).
  - Create the initial Makefile for compilation and testing.
  - Integrate the Unity testing framework.
- [ ] **Task 2: Core Scheme Values**
  - Design the `Value` type (tagged union or similar).
  - Implement primitive constructors for Fixnums, Booleans, and Nil.
  - Implement the `Symbol` registry and `Pair` (Cons) structure.
- [ ] **Task 3: Basic Memory Management**
  - Implement a basic allocator for Scheme objects.
  - Implement a simple mark-and-sweep garbage collector.
  - Write unit tests to verify allocation and basic collection.
- [ ] **Task 4: Conductor - User Manual Verification 'Phase 1: Foundation and Data Structures' (Protocol in workflow.md)**

## Phase 2: Virtual Machine and Compiler Core
- [ ] **Task 1: Instruction Set Design**
  - Define the bytecode instruction set (Load, Store, Call, Jump, etc.).
- [ ] **Task 2: Bytecode Compiler**
  - Implement the S-expression parser (Lexer and Parser).
  - Implement the recursive compiler to generate bytecode for basic expressions.
  - Support lexical environment management (nested scopes).
- [ ] **Task 3: VM Execution Engine**
  - Implement the VM interpreter loop (dispatch loop).
  - Support stack operations and procedure calls.
  - Implement Tail Call Optimization (TCO).
- [ ] **Task 4: Conductor - User Manual Verification 'Phase 2: Virtual Machine and Compiler Core' (Protocol in workflow.md)**

## Phase 3: Advanced Features and Interface
- [ ] **Task 1: First-Class Continuations**
  - Implement continuation capture and re-invocation (`call/cc`).
  - Update the stack and VM state to handle non-local control flow.
- [ ] **Task 2: Built-in Procedures**
  - Implement essential R5RS primitives (Arithmetic, List manipulation, Predicates).
- [ ] **Task 3: REPL and File Loader**
  - Implement the interactive Read-Eval-Print-Loop with ANSI color support.
  - Support loading and executing Scheme files from the command line.
- [ ] **Task 4: Final Verification and Cleanup**
  - Perform comprehensive testing against the R5RS core requirements.
  - Run Valgrind to ensure no memory leaks and perform final refactoring.
- [ ] **Task 5: Conductor - User Manual Verification 'Phase 3: Advanced Features and Interface' (Protocol in workflow.md)**
