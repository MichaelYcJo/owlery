# Changelog: a window started in the background draws while the displays sleep

Issue #164. Two cases of the window's theme failed on every run while the Mac's displays slept, so no broad gate of release 0.0.2 could pass.

- **A window started in the background keeps drawing its page while the displays sleep.** With every display asleep, macOS counts every window as unseen, and the page of a window started with `OWLERY_BACKGROUND=1` drew no frame. A change of the system's appearance then never reached the page, since the page hears it only when it draws. The window now asks to keep drawing at each page it loads. A window a person starts is unchanged.
