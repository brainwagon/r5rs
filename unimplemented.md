# Unimplemented R5RS Primitives

This list contains R5RS procedures and features that are currently unimplemented in this Scheme implementation.

## 6.1 Equalities
- `equal?` - Partially implemented (handles pairs, strings, vectors, and atoms, but may not handle circular structures or all cases correctly).

## 6.2 Numbers
- `complex?`, `rational?`, `integer?` - Predicates for the numeric tower.
- `exact?`, `inexact?` - Exactness predicates.
- `numerator`, `denominator` - For rational numbers (not yet implemented).
- `floor`, `ceiling`, `truncate`, `round` - Rounding functions.
- `exp`, `log`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan` - Transcendental functions.
- `sqrt` - Square root.
- `make-rectangular`, `make-polar`, `real-part`, `imag-part`, `magnitude`, `angle` - Complex number support.
- `exact->inexact`, `inexact->exact` - Exactness conversions.
- `string->number` - Parsing numbers from strings.

## 6.3 Other data types
- `char-ci=?`, `char-ci<?`, `char-ci>?`, `char-ci<=?`, `char-ci>=?` - Case-insensitive character comparisons (partially implemented in prelude via `char-downcase` which is missing).
- `char-upcase`, `char-downcase` - Character case conversion.

## 6.4 Control features
- `dynamic-wind` - For non-local exits and re-entries.
- `eval` - Evaluation of expressions.
- `scheme-report-environment`, `null-environment`, `interaction-environment` - Environment specifiers for `eval`.

## 6.6 Input and output
- `call-with-input-file`, `call-with-output-file` - File I/O with automatic closing.
- `with-input-from-file`, `with-output-to-file` - Rebinding standard ports.
- `open-input-file`, `open-output-file`, `close-input-port`, `close-output-port` - Basic file I/O.
- `input-port?`, `output-port?` - Port predicates.
- `current-input-port`, `current-output-port` - Port accessors.
- `read-char`, `peek-char`, `eof-object?`, `char-ready?` - Character-level input.
- `write-char` - Character-level output.
- `transcript-on`, `transcript-off` - Session logging.

## Macros
- `let-syntax`, `letrec-syntax` - Local macro definitions.
