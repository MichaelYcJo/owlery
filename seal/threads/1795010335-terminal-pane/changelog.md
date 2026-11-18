# Changelog: the terminal pane

Issue #3. The repository held no code, so there was no app to open a terminal in.

- **The desktop app opens one window with one terminal pane.** The pane runs the user's login shell through a pseudo-terminal, so `claude` and the user's other CLIs run in it as they do in a terminal, with the shell prompt's icons drawn by the user's Nerd Font.
- **Korean input works in the pane on macOS.** A person typed Korean with the Dubeolsik layout into the shell and into Claude Code, and it arrived as typed, in UTF-8. The pane gives its process a UTF-8 locale where the app inherited none, as an app opened from the Finder does.
- **A `claude` in the pane behaves as a fresh session.** The pane drops the markers of any Claude Code session the app was started from, so the CLI no longer takes itself for that session's child and turns off its transcript, and that session's messaging token does not reach the pane.
- **The broad gate runs the desktop app's typecheck and tests** before the documents check.
