# Specification: std_library_20260303

## Objective
Implement the R5RS standard library in Scheme, loaded via a `prelude.scm` file.

## Scope
- Create `prelude.scm` with standard procedures:
    - List manipulation: `append`, `reverse`, `length`, `list-ref`, `list-tail`, `memq`, `memv`, `member`, `assq`, `assv`, `assoc`.
    - Higher-order functions: `map`, `for-each`, `filter`.
    - Numeric: `max`, `min`, `abs`.
- Implement `apply` as a VM primitive or opcode.
- Update the C interpreter to automatically load `prelude.scm` on startup.
- Add `display`, `newline`, and basic I/O primitives.

## Success Criteria
- The REPL starts with the standard library available.
- `map`, `apply`, and other library functions pass functional tests.
- Total code coverage remains >80%.
