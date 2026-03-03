# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

R5RS Scheme interpreter in C (~2,600 LOC). Features a bytecode compiler, stack-based VM with 17 opcodes, mark-and-sweep GC, hygienic macros (syntax-rules), first-class continuations (call/cc), tail call optimization, and a numeric tower (fixnums → bignums → reals).

## Build & Test Commands

```bash
make              # Build scheme executable + all test binaries
make scheme       # Build just the interpreter
make test         # Build and run all unit tests
make clean        # Remove all build artifacts
```

Build a single test and run it:
```bash
make tests/test_vm && ./tests/test_vm
```

Run the interpreter:
```bash
./scheme                    # REPL
./scheme examples/nqueens.scm  # Run a script
```

Compiler flags: `-std=c99 -Wall -Wextra -Werror` — all warnings are errors.

## Architecture

```
Source text → Reader → S-expressions → Compiler → Bytecode → VM → Result
                                          ↑                    ↑
                                     Macro expander        GC (mark-sweep)
```

### Pipeline

1. **Reader** (`src/reader.c`) — Parses text into `Value*` S-expressions (atoms, pairs, vectors, quoted forms)
2. **Macro expander** (`src/macro.c`) — Applies `syntax-rules` transformers before compilation
3. **Compiler** (`src/compiler.c`) — Walks S-expressions, emits bytecode into `Prototype` values with constant pools. Handles special forms (`define`, `lambda`, `if`, `set!`, `begin`, `let`/`let*`/`letrec`, `cond`, `and`/`or`, `case`). Tracks tail position for TCO.
4. **VM** (`src/vm.c`) — Stack-based bytecode interpreter. Lexical environments are linked lists of frames. Supports closures, continuations, and tail calls (OP_TCALL reuses frames).
5. **Primitives** (`src/primitives.c`) — 40+ built-in procedures registered as C functions (`Value* (*)(VM*, int, Value**)`)
6. **Values** (`src/values.c`) — Tagged union `Value` type with 16 variants. Symbols are interned.
7. **GC** (`src/gc.c`) — All `Value*` objects live in a single linked list. Mark phase walks from registered roots + VM stack. Sweep frees unmarked objects.
8. **Bignums** (`src/bignum.c`) — Arbitrary-precision integers using 32-bit digit arrays. Auto-promoted from fixnums on overflow.

### Key types (include/scheme.h)

- `Value` — Tagged union: fixnum, boolean, nil, symbol, pair, closure, prototype, primitive, continuation, string, vector, char, bignum, real, macro, raw
- `VM` — Stack, globals (alist), syntax_env (macro bindings), PC, lexical env chain, current prototype

### Standard library

`prelude.scm` is loaded automatically at startup. It defines derived list operations (map, filter, assoc, member, cXXXr), string utilities, and numeric predicates in Scheme.

## Testing

Tests use the [Unity](https://github.com/ThrowTheSwitch/Unity) C test framework (vendored in `tests/unity/`). Each test file covers one module: `test_reader`, `test_compiler`, `test_vm`, `test_gc`, `test_values`, `test_symbols`, `test_vm_data`, `test_macro`, `test_bignum`, `test_scaffold`.

Test pattern — compile and run an expression through the full pipeline:
```c
VM vm; vm_init(&vm);
Value* expr = read_str("(+ 1 2)");
Value* proto = compile(expr, make_nil(), make_nil(), -1, false);
Value* result = vm_run(&vm, proto);
TEST_ASSERT_EQUAL(3, result->as.fixnum);
```
