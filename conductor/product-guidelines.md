# Product Guidelines

## Documentation Style
- **Concise Reference**: Documentation should focus on a clear and efficient reference manual for the Scheme API and internal C interfaces.
- **R5RS-Aware**: The documentation should complement the R5RS specification, providing implementation-specific details.

## User Interface (REPL)
- **Interactive & Colorful**: The REPL should provide a modern command-line experience using ANSI colors to distinguish between prompts, input, and output.
- **Clear Feedback**: Use colors to highlight syntax errors and execution results for improved readability.

## Error Handling
- **Detailed Feedback**: Errors should be descriptive, providing context such as the source of the error, the failing expression, and a relevant stack trace or location info where possible.
- **Informative**: The goal is to help users quickly diagnose and fix issues in their Scheme code.

## Development Principles
- **KISS (Keep It Simple, Stupid)**: Prioritize simplicity and clarity in the C implementation. Avoid unnecessary complexity or premature optimizations.
- **Self-Contained**: Minimize external dependencies. Rely on the standard C library (C99/C11) and POSIX functions.
- **Modular & Extensible**: The design should allow for easy extension of both the Scheme built-in procedures and the underlying C virtual machine.
- **Embeddable Design**: Maintain a clean API boundary for integration into other C applications.
