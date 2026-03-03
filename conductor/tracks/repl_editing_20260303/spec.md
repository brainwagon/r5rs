# Specification: Improved REPL Command Line Editing

## Overview
Enhance the Scheme interpreter's Read-Eval-Print-Loop (REPL) with a custom, POSIX-compliant line editor. This will provide a more modern and productive interactive environment while maintaining minimal external dependencies.

## Functional Requirements
1. **Custom Line Editor (POSIX termios)**
   - Implement a raw mode terminal interface using `termios`.
   - Support standard Emacs-style keybindings:
     - `Ctrl-A`: Move cursor to the beginning of the line.
     - `Ctrl-E`: Move cursor to the end of the line.
     - `Ctrl-B` / `Left Arrow`: Move cursor back one character.
     - `Ctrl-F` / `Right Arrow`: Move cursor forward one character.
     - `Ctrl-K`: Kill (delete) from the cursor to the end of the line.
     - `Ctrl-Y`: Yank (paste) the last killed text.
     - `Ctrl-L`: Clear the screen and redraw the current line.
     - `Ctrl-D`: Exit the REPL (EOF).
     - `Backspace` / `Ctrl-H`: Delete the character before the cursor.

2. **Command History**
   - **Persistent History**: Save and load history from `~/.r5rs_history`.
   - **Navigation**: Use `Up Arrow` / `Ctrl-P` and `Down Arrow` / `Ctrl-N` to scroll through previous commands.
   - **Deduplication**: Do not add identical consecutive commands to the history.
   - **Multi-line Integration**: Multi-line expressions should be treated as a single entry in history.

3. **Parenthesis Matching**
   - **Visual Feedback**: When a closing parenthesis `)` is typed, if a matching opening parenthesis `(` exists, the cursor momentarily jumps to the position of the `(` for approximately 200ms before returning to the `)` position.
   - **Supported Symbols**: Focus on `(` and `)`.

4. **Multi-line Input**
   - **Automatic Detection**: Detect unbalanced parentheses to allow multi-line input.
   - **Indented Prompt**: Change the prompt from `scheme> ` to `     > ` for continuation lines to indicate the REPL is waiting for more input.

## Non-Functional Requirements
- **Standard Compliance**: Use only standard C99 and POSIX headers (`termios.h`, `unistd.h`, `sys/ioctl.h`, etc.).
- **Minimal Dependencies**: No external libraries like `readline`, `editline`, or `ncurses`.
- **Robustness**: Gracefully handle terminal resizing (using `SIGWINCH` if possible) and unexpected exits.

## Acceptance Criteria
- [ ] Users can navigate and edit the current line using arrow keys and Ctrl-shortcuts.
- [ ] Command history persists across sessions (stored in the user's home directory).
- [ ] Typing `)` triggers a cursor jump to the matching `(`.
- [ ] Entering an incomplete expression (e.g., `(define x`) prompts for more input with a continuation prompt.
- [ ] Multi-line expressions can be recalled from history as a single unit.

## Out of Scope
- Tab completion for symbols or filenames.
- Syntax highlighting (colors) for Scheme code.
- Mouse support.
- Vi-style keybindings.
