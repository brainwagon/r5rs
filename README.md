# R5RS Scheme Implementation

> **Note:** This entire implementation—from core VM and compiler to bignums, hygienic macros, and standard library—was developed using **Gemini CLI** in less than three and a half hours (started at 10:00 PM, finalized and committed by 1:30 AM).

A fast, small, and feature-complete R5RS Scheme implementation in C, featuring a bytecode VM, hygienic macros, and a robust standard library.

## Features

### Core VM & Language
- **Bytecode VM**: Efficient stack-based execution with specialized opcodes.
- **Tail Call Optimization (TCO)**: Mandatory tail calls are optimized to allow infinite recursion.
- **First-Class Continuations**: Full support for `call-with-current-continuation` (`call/cc`) as both a special form and a first-class procedure.
- **Lexical Scoping**: Proper lexical environments with support for closures, nested scopes, and rest-argument shadowing.
- **Hygienic Macros**: Robust implementation of `syntax-rules` with a renaming mechanism that prevents unintentional capturing of global identifiers.

### Data Types & Numeric Tower
- **Numeric Tower**: Consistent behavior across Fixnums, Bignums, and Reals with full support for mixed-type arithmetic.
- **Bignums**: Automatic promotion from 64-bit integers to arbitrary-precision bignums.
- **Reals**: Floating-point numeric support.
- **Standard Types**: Pairs, Lists, Symbols, Strings, Vectors, Booleans, and Characters.

### REPL & Command Line Editing
- **Advanced Editing**: Full support for cursor navigation (arrows, `Ctrl-B`/`Ctrl-F`), home/end (`Ctrl-A`/`Ctrl-E`), and kill/yank (`Ctrl-K`/`Ctrl-Y`).
- **Persistent History**: Searchable command history that persists across sessions in `~/.r5rs_history`.
- **Parenthesis Matching**: Visual "cursor jump" feedback when typing closing parentheses.
- **Multi-line Input**: Automatic detection of unbalanced expressions with continuation prompts.
- **Error Recovery**: Robust error handling that returns to the REPL instead of aborting, ensuring terminal state integrity.

### Memory Management
- **Garbage Collection**: Mark-and-sweep GC with root management and stack safety.
- **Interned Symbols**: Efficient symbol comparison and storage.

### Standard Library (`prelude.scm`)
A comprehensive Scheme prelude is automatically loaded at startup, providing:
- **List Manipulation**: `map`, `for-each`, `filter`, `append`, `reverse`, `length`, `list-ref`, `list-tail`.
- **Association Lists**: `assq`, `assv`, `assoc`, `memq`, `memv`, `member`.
- **String & Vector Procedures**: `string-append`, `substring`, `string->list`, `list->vector`, etc.
- **Case-Insensitive Comparisons**: `string-ci=?`, `char-ci=?`, and related predicates.
- **Numeric Predicates**: `positive?`, `negative?`, `odd?`, `even?`, `abs`, `max`, `min`.

### Primitives
Over 40 built-in primitives in `src/primitives.c`, including:
- Arithmetic: `+`, `-`, `*`, `=`, `<`, `>`, `quotient`, `remainder`, `modulo`.
- I/O: `display`, `write`, `newline`, `read-char`, `read`.
- Type Predicates: `pair?`, `symbol?`, `number?`, `procedure?`, `string?`, `vector?`.
- Conversions: `char->integer`, `integer->char`, `string->list`, etc.

## Building and Running

### Prerequisites
- GCC (C99 support)
- Make

### Build
```bash
make clean && make
```

### Usage
Run the REPL:
```bash
./scheme
```

Run a Scheme script:
```bash
./scheme my-script.scm
```

### Testing
Run the comprehensive test suite (powered by Unity):
```bash
make test
```

## Implementation Details
The compiler translates Scheme source into a linear sequence of VM instructions. The VM manages a dynamic stack, a lexical environment (linked list of frames), and a global symbol table. Primitives are implemented in C for performance, while higher-level R5RS procedures are implemented in the Scheme-based prelude for portability and ease of extension.
