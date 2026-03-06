# Handoff: Web Interpreter — Phase 5 Testing

**Date:** Thursday, March 5, 2026
**Track:** `conductor/tracks/web_interpreter_20260305/`
**Status:** Phase 5, Task 2 in progress — "Conduct thorough testing of R5RS compliance and error handling in the web environment"

## What Was Done This Session

### Diagnosis: `equal?` hangs in Emscripten/Node.js

The `tests/test_web.js` error handling test (`(equal? 1)`) hangs indefinitely. Investigation revealed:

1. **`equal?` is a closure, not a primitive.** The prelude (`prelude.scm:123`) redefines `equal?` as a Scheme closure using `cond`, `eqv?`, `pair?`, etc.

2. **Individual building blocks work fine.** All of these return correct results in the web build:
   - `(eqv? 1 2)` → `#f`
   - `(cond ((eqv? 1 2) #t) (else #f))` → `#f`
   - `(and #t #f)` → `#f`
   - `(pair? 1)` → `#f`

3. **But calling `(equal? 1 2)` hangs** — even with correct arguments (not just the arity-error case). This means the closure itself infinite loops or gets stuck. The `(define (my-eq ...) ...)` incremental reconstruction approach was started but not completed.

4. **`setjmp`/`longjmp` DOES work** in the Emscripten build for direct VM errors (e.g., `(undefined-var)` correctly returns `"Error: Undefined global: undefined-var\n"`).

5. **Makefile was updated** with `-s SUPPORT_LONGJMP=1 -s DISABLE_EXCEPTION_CATCHING=0` flags. These didn't fix the `equal?` hang since the root cause is different.

### What to Investigate Next

The most likely cause: the prelude's `equal?` closure, when called in the web build, enters an infinite loop. Debug approach:

1. **Incrementally rebuild `equal?`** in the REPL to find which `cond` clause or sub-expression causes the hang. Start simple:
   ```scheme
   (define (eq1 a b) (cond ((eqv? a b) #t) (else #f)))
   (eq1 1 2)  ;; does this work?
   ```
   Then add clauses one at a time until it hangs.

2. **Check if `string?` or `vector?` predicates hang** — the prelude's `equal?` calls these, and if any predicate is broken in the web build, it could loop.

3. **Check if the issue is the `named let` (`loop`)** in the vector branch — this uses tail recursion which might behave differently in the web build.

4. **Alternative fix:** If the prelude `equal?` can't be made to work, remove it and rely on the C primitive (`prim_equal_p` at `src/primitives.c:256`) which handles pairs, strings, vectors, and delegates to `eqv?`.

### Remaining Phase 5 Tasks

Per `conductor/tracks/web_interpreter_20260305/plan.md`:

- `[~]` Conduct thorough testing of R5RS compliance and error handling in the web environment
- `[ ]` Perform final manual verification against `spec.md`
- `[ ]` Conductor - User Manual Verification

## Key Files

| File | Role |
|---|---|
| `src/web_main.c` | Emscripten bridge: `init_scheme()`, `exec_scheme()` with setjmp error recovery |
| `src/web_worker.js` | Web Worker hosting the interpreter |
| `src/web_client.js` | Main-thread Promise-based client |
| `src/index.html` | UI with xterm.js, example loaders, history |
| `web/` | Build output directory (`make web`) |
| `tests/test_web.js` | Node.js tests — hangs on error handling test |
| `prelude.scm:123` | Scheme `equal?` override — suspected cause of hang |
| `src/primitives.c:256` | C `equal?` primitive (works but is shadowed by prelude) |

## How to Test

```bash
make web                          # Build web output
timeout 10 node tests/test_web.js # Hangs on error handling test
# Quick manual test:
timeout 10 node -e "
const Module = require('./web/scheme.js');
Module.onRuntimeInitialized = function() {
    const init = Module.cwrap('init_scheme', 'void', []);
    const exec = Module.cwrap('exec_scheme', 'string', ['string']);
    init();
    console.log(exec('(+ 1 2)'));     // works
    console.log(exec('(equal? 1 2)')); // hangs
    process.exit(0);
};
"
```

## Duplicate Output Symptom

When `exec_scheme` hangs in Node.js, output before the hang appears duplicated (printed twice). This is likely Emscripten's `NO_EXIT_RUNTIME=1` interaction with `exit()` — if the process eventually falls through to exit, the runtime may re-invoke initialization. This is a symptom, not the root cause.
