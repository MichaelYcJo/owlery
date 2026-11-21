# Closing memo: the desktop suite in CI (#30)

## Not verified

| Item | Who must answer |
|---|---|
| Whether a failed `check` keeps a pull request from merging. The workflow makes the check fail, as runs 44909892650, 44910365847, 44911168018 and 44912086303 of this pull request show. What stops the merge is a branch protection rule or a ruleset on `main` and `release/**` that requires `check`, and that is a setting of the repository, outside the tree | the owner, in the repository's settings on GitHub |
| The case of `apps/desktop/test/work-item-menu.test.ts` that opens the Open in submenu with the pointer failed four times on the runner, each time at the first `expect(await submenuStands()).toBe(true)`: in run 44911168018 and in the first attempt of run 44914578391 (the whole suite, the tree as it is handed back), and in the first measuring run of 44912086303 and of 44912693366. Each failure came at the first start of the built app in its job. It passed at every later start in those jobs, in the second attempt of 44914578391, in the runs 44913122661, 44913631354 and 44914077600, and at every local run. About half of a job's first starts failed it Recorded pointer and focus events of passing runs show no event the case did not send, and the runner's cursor stands at (10, 10), outside the window. What removes the submenu in a failing run was not found. It can fail any pull request's run | the orchestrator, by re-running a failed `check` and reading which case failed; the cause stays open for whoever next works on the menus |
| The suite as a whole on a person's Mac at this HEAD. The crafter ran `test/terminal-basics.test.ts` and `test/work-item-menu.test.ts` with the window shrunk to 1024 by 743, `test/work-item-menu.test.ts` at the full window, and the one changed case of `test/daemon.test.ts`. The whole suite ran on the runner | the orchestrator, by the broad gate of `seal/config.json` |
| How the app looks and works for a person whose window is smaller than 1440 by 900. The suite no longer reads the app at such a size. On the runner's 1024 by 674 window the tab strip clipped a second pane's tab under the buttons beside it, and the removal dialog's buttons stood below the page's foot until the dialog is scrolled | the owner, at the hand check of the built app on a small screen |

## Not done

The app's own layout in a window smaller than 1440 by 900 was left as it is. The tab strip does not bring the tab in front into view, and the sidebar and the facts column keep their widths, so a pane in a 1024-wide window has about 42 columns. Issue #30 asks for the checks to run and to fail where the suite fails, not for a layout at that size, and `src/main/main.ts` names 1440 by 900 the size the screens are drawn for.

The Open in case above was left unchanged. No cause tied to the runner was found, so there is no ground to loosen or skip it.
