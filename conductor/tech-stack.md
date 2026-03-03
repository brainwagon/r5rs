# Technology Stack

## Core Language
- **C99 (ISO/IEC 9899:1999)**: The project will be implemented in standard POSIX-compliant C99, ensuring high portability and compatibility with various systems and compilers.

## Build and Project Management
- **GNU Make**: A simple and ubiquitous build system used to manage compilation, testing, and other development tasks.

## Testing and Quality Assurance
- **Unity**: A lightweight, single-file unit testing framework for C, ideal for embedding within the project for core C tests.
- **Valgrind (Memcheck)**: Critical for verifying the custom garbage collector and ensuring no memory leaks occur in the interpreter's VM.
- **Clang-Tidy**: For static analysis to enforce code style and catch potential bugs early.
- **Gcov / LCOV**: To measure and track test coverage, ensuring a robust and well-tested codebase.

## Development Platform
- **POSIX**: Targeting POSIX-compliant systems (Linux, macOS, etc.) for filesystem and REPL interactions.
- **Vanilla C**: Minimizing external dependencies to maintain the project's goal of being small and embeddable.
