# Implementation Plan: core_vm_20260302

## Phase 1: Foundation and Data Structures [checkpoint: 5ce6e89]
- [x] **Task 1: Project Scaffolding** [c77ce58]
  - Setup directory structure (src, include, tests).
  - Create the initial Makefile for compilation and testing.
  - Integrate the Unity testing framework.
- [x] **Task 2: Core Scheme Values** [d1c7133]
  - Design the `Value` type (tagged union or similar).
  - Implement primitive constructors for Fixnums, Booleans, and Nil.
  - Implement the `Symbol` registry and `Pair` (Cons) structure.
- [x] **Task 3: Basic Memory Management** [1db6e68]
  - Implement a basic allocator for Scheme objects.
  - Implement a simple mark-and-sweep garbage collector.
  - Write unit tests to verify allocation and basic collection.
- [x] **Task 4: Conductor - User Manual Verification 'Phase 1: Foundation and Data Structures [checkpoint: 5ce6e89]' (Protocol in workflow.md)** [5ce6e89]

## Phase 2: Virtual Machine and Compiler Core
- [x] **Task 1: Instruction Set Design** [78604a6]
  - Define the bytecode instruction set (Load, Store, Call, Jump, etc.).
- [x] **Task 2: Bytecode Compiler** [febf9ad]
  - Implement the S-expression parser (Lexer and Parser).
  - Implement the recursive compiler to generate bytecode for basic expressions.
  - Support lexical environment management (nested scopes).
- [x] **Task 3: VM Execution Engine** [e3e4c24]
  - Implement the VM interpreter loop (dispatch loop).
  - Support stack operations and procedure calls.
  - Implement Tail Call Optimization (TCO).
- [~] **Task 4: Conductor - User Manual Verification 'Phase 2: Virtual Machine and Compiler Core' (Protocol in workflow.md)**

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
