# Specification: hygienic_macros_20260303

## Objective
Implement a hygienic macro system based on `syntax-rules` as specified in R5RS.

## Scope
- Implement `define-syntax` and `let-syntax`/`letrec-syntax`.
- Implement `syntax-rules` pattern matcher (including ellipsis `...`).
- Implement `syntax-rules` template expander.
- Ensure hygiene using a renaming or marking algorithm.
- Integrate macro expansion into the compiler.

## Success Criteria
- Ability to define and use macros in the REPL and files.
- Correct handling of ellipsis in patterns and templates.
- Hygiene verified by tests where macros introduce bindings that do not clash with user code.
