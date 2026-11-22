Closes #148.

While agents ran the desktop suite and the screenshot command, the built app's windows kept appearing over the person's screen. `OWLERY_BACKGROUND=1` showed the window without the keyboard and let the pointer through, so it took no focus and no click, but it was still drawn in front of the person's windows.

| Done when | What holds now |
|---|---|
| An app started with `OWLERY_BACKGROUND=1` draws nothing the person can see, while its page still renders, so every built-app case, `pnpm run screenshots` and `measure:memory` behave as today | The window is made fully transparent before it is shown (`setIgnoreMouseEvents(true)`, `setOpacity(0)`, `showInactive()`). Under the switch the folder dialog is not opened either (`chooseFolderDialog`), so no sheet shows over the person's screen. A probe of the window server read the app's windows at alpha 0 in every sample while shown, over six runs. `theme-controls`, `terminal-basics`, `notification-click` and the screenshot command ran as before, and a screenshot holds the page |
| Whether macOS counts the window occluded and throttles its page is measured | Measured on this Mac: a window at opacity 0 under another app's window keeps its page visible at about 145 frames a second, with `matchMedia` change events and captures; the same window at opacity 1 was hidden at 0 frames a second. So no `backgroundThrottling` change is needed, and the earlier opaque window was being throttled whenever a person's window covered it |
| A person's start of the app is unchanged | The change runs only under the switch (`main.ts`'s `if (background)`); a person's start was not run, as it would show a window on the owner's screen |

🤖 Generated with [Claude Code](https://claude.com/claude-code)
