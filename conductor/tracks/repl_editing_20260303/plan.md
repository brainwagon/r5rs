# Implementation Plan: Improved REPL Command Line Editing

## Phase 1: Terminal Raw Mode and Basic Input [checkpoint: 8a09913]
*Goal: Establish the foundation for a custom terminal interface using POSIX termios.*

- [x] Task: Research and define `TerminalState` structure and `termios` configuration for raw mode. b0e78f8
- [x] Task: Implement `terminal_enable_raw_mode()` and `terminal_disable_raw_mode()` with proper error handling. cbd9ad5
- [x] Task: Create a basic input loop that reads characters and echoes them back, handling `Ctrl-D` for EOF. 6f27585, 8469dce
- [x] Task: Implement basic character deletion (Backspace/Ctrl-H) in the raw input loop. 269f9c9
- [x] Task: Conductor - User Manual Verification 'Terminal Raw Mode and Basic Input' (Protocol in workflow.md)

## Phase 2: Advanced Line Editing and Keybindings [checkpoint: b4fd4f0]
*Goal: Implement standard line editing capabilities and cursor navigation.*

- [x] Task: Implement cursor navigation (Left/Right arrow keys, `Ctrl-B`/`Ctrl-F`). d775960
- [x] Task: Add support for jumping to beginning/end of line (`Ctrl-A`/`Ctrl-E`). 46676b7
- [x] Task: Implement "Kill and Yank" functionality (`Ctrl-K` to kill end of line, `Ctrl-Y` to yank). 7cecfa0
- [x] Task: Implement `Ctrl-L` to clear the screen and redraw the current line. 19bca7f
- [x] Task: Conductor - User Manual Verification 'Advanced Line Editing and Keybindings' (Protocol in workflow.md) b4fd4f0

## Phase 3: Persistent Command History
*Goal: Add a history system that persists across sessions.*

- [x] Task: Implement an in-memory history structure (doubly-linked list or circular buffer). 0524c4d
- [x] Task: Add functions to save and load history from `~/.r5rs_history`. 6ba1767
- [x] Task: Implement history navigation using `Up`/`Down` arrows and `Ctrl-P`/`Ctrl-N`. cd0d2fd
- [x] Task: Implement deduplication for consecutive identical history entries. 86cc292
- [~] Task: Conductor - User Manual Verification 'Persistent Command History' (Protocol in workflow.md)

## Phase 4: Parenthesis Matching and Multi-line Prompt
*Goal: Enhance the user experience with visual feedback and multi-line support.*

- [ ] Task: Implement parenthesis matching logic to find the corresponding `(` for a `)`.
- [ ] Task: Implement visual "Cursor Jump" feedback when a closing parenthesis is typed.
- [ ] Task: Integrate multi-line detection logic into the custom editor.
- [ ] Task: Implement the continuation prompt (`     > `) for unbalanced expressions.
- [ ] Task: Conductor - User Manual Verification 'Parenthesis Matching and Multi-line Prompt' (Protocol in workflow.md)

## Phase 5: REPL Integration and Cleanup
*Goal: Replace the existing simple REPL with the new custom editor.*

- [ ] Task: Refactor `src/main.c` to use the new `custom_readline` interface instead of `fgets`.
- [ ] Task: Ensure multi-line expressions are stored as a single entry in history.
- [ ] Task: Final code review, documentation of public functions, and memory leak check with Valgrind.
- [ ] Task: Conductor - User Manual Verification 'REPL Integration and Cleanup' (Protocol in workflow.md)
