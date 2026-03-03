# Initial Concept\n\nI want to build a small interpreter for the Scheme language as specified in r5rs.md. It should implement all the required features of the language as specified, and be written in vanilla C using as few non-standard libraries as possible. The user should be able to load scheme programs from files, and interact with the read-eval-print-loop as well. Code should be compiled to a straight forward virtual machine and executed. Emphasis should be placed on simplicity and conciseness rather than performance.

# Product Guide

## Vision
To build a small, embeddable Scheme interpreter conforming to the R5RS specification, written in vanilla POSIX C99/C11. The project prioritizes simplicity and conciseness, providing a robust virtual machine-based execution environment and a functional read-eval-print-loop (REPL).

## Core Objectives
- **Embeddability**: Designed to be easily integrated as a scripting engine into other C-based applications.
- **R5RS Compliance**: Implementing all required features of the Revised 5 Report on Scheme, including syntax-rules macros and complex numbers.
- **Robustness**: A built-in garbage collector and rigorous verification against pervasive R5RS pitfall test suites to ensure edge-case reliability.
- **Portability**: Targeting standard POSIX-compliant C (C99/C11).

## Key Features
- **Virtual Machine**: Compiles Scheme code into a straightforward bytecode for execution.
- **REPL**: Interactive environment for development and testing.
- **File Loading**: Support for loading and executing Scheme programs from external files.
- **Language Core**: Full support for R5RS essential procedures and syntax.
- **Pervasive Testing**: Integrated suite of R5RS compliance tests (e.g., pitfalls) to verify complex lexical and control flow behavior.

## Target Audience
- Developers needing an embeddable Lisp/Scheme scripting engine.
- Researchers and students studying language implementation and virtual machines.
- Users looking for a lightweight, spec-compliant Scheme environment.
