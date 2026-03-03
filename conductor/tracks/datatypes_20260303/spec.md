# Specification: datatypes_20260303

## Objective
Implement core R5RS datatypes: Strings, Vectors, and Characters within the Scheme VM.

## Scope
- Implement exact types for String (`"..."`), Vector (`#( ... )`), and Character (`#\x`).
- Add corresponding lexical parsing to `src/reader.c`.
- Update `Value` representation, garbage collector, and REPL print formatting.
- Implement standard R5RS primitive procedures for these types (e.g. `make-string`, `string-ref`, `string-set!`, `make-vector`, `vector-ref`, `vector-set!`, type predicates).

## Success Criteria
- Automated unit tests covering all new parsing formats and VM primitives.
- Code coverage maintained above 80%.
- GC accurately reclaims unused strings and vector arrays.