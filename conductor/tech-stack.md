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

## Web Environment (Web Interpreter Track)
- **Emscripten**: A toolchain for compiling C/C++ to WebAssembly (Wasm), used to port the Scheme interpreter to the web.
- **xterm.js**: A front-end component that provides a fully-functional terminal in the browser for the REPL experience.
- **Web Workers**: To run the Scheme interpreter in a background thread, keeping the main UI responsive.
- **LocalStorage**: For persisting REPL history and virtual files in the browser.
