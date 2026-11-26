# Closing memo: 1795636143-213-a-panes-tab-has-a-menu

## Not verified

| Item | Who must answer |
|---|---|
| closed A press of the right button on the back's tab opens no menu and keeps the system's menu away (`work-item-view.ts#backTab`). No case reaches the back's tab: `terminal-basics.test.ts` draws no back, and `seal-back-view.test.ts` presses nothing on it with the right button | answered: review round 1 read `backTab` (`trail/rounds/round-1.md:167`), and the sealer found no `context-menu` handler in the main process (`guarantee.md:25`) |
| closed `terminal-basics.test.ts` whole at `f8cc50e4` or later, where only its five close cases ran, and the built-app files outside the phase's batch that build `index.html`, `work-item-view.ts` and `view.ts` into the app they start | `terminal-basics.test.ts` passed whole at `cff754a6`, 40 cases, in phase 2 (`trail/phases/phase-2.md`); the other built-app files stand in the row below |
| closed The built-app files outside phase 2's batch of `terminal-basics.test.ts`, `work-item-menu.test.ts` and `screenshots.test.ts`, which start the app built from the sources phase 2 changed: `apps/desktop/vitest.config.ts` lists them, as the test files that import `buildApp` | answered: the broad gate passed at `9123e62b`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 9123e62b 3da05835` outside its directory prints nothing); the `check` workflow passed on pull request #294 at `3da05835`, the head it merged from |
| closed `daemon.test.ts` whole: phase 2 ran `-t setPane` and, by name, the cases whose assertions of a whole session gained `NO_MARKS` | answered: the broad gate passed at `9123e62b`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 9123e62b 3da05835` outside its directory prints nothing); the `check` workflow passed on pull request #294 at `3da05835`, the head it merged from |
| closed The two refusals of `setPane` the window shows: the rename dialog's under its field (`work-item-view.ts#takePaneName`, which `renderer.ts` asks for both `done` and `error`), and a swatch's in the sidebar, as `renderer.ts` tells every refusal no dialog claims. No case reaches either from the window: the field takes 60 characters at most, and a pane that is gone closes the dialog before anything is sent | answered: review round 1 read both paths (`trail/rounds/round-1.md:165`) |
| closed The full suite, the repository-wide lint and the typecheck at the work item's head | answered: the broad gate passed at `9123e62b`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 9123e62b 3da05835` outside its directory prints nothing); the `check` workflow passed on pull request #294 at `3da05835`, the head it merged from |

## Not done

In the `tabs` screenshots the open menu covers part of the blue tab's bar and of the pink one's, since the menu opens at the pointer, which stands on the tab. The `rename` shots of the same scene show the three bars whole, so no further view was added to show the bars without a menu.

**The shots of the two views this work adds are committed.** The screenshot run gains `tabs` (the tabs carry each colour and the blue tab's menu is open) and `rename` (the rename dialog over the coloured tabs); their twelve shots, one for each theme and appearance, are committed under `screenshots/`. Grounds: `docs/design.md` *A pull request that changes the window carries its screenshots*.

![A pane's tabs in each colour, with the blue tab's menu open, in Night watch, dark](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/night-watch-dark-tabs.png?raw=true)

![A pane's tabs in each colour, with the blue tab's menu open, in Night watch, light](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/night-watch-light-tabs.png?raw=true)

![A pane's tabs in each colour, with the blue tab's menu open, in Register, dark](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/register-dark-tabs.png?raw=true)

![A pane's tabs in each colour, with the blue tab's menu open, in Register, light](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/register-light-tabs.png?raw=true)

![A pane's tabs in each colour, with the blue tab's menu open, in Desk, dark](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/desk-dark-tabs.png?raw=true)

![A pane's tabs in each colour, with the blue tab's menu open, in Desk, light](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/desk-light-tabs.png?raw=true)

![The rename dialog of a pane, in Night watch, dark](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/night-watch-dark-rename.png?raw=true)

![The rename dialog of a pane, in Night watch, light](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/night-watch-light-rename.png?raw=true)

![The rename dialog of a pane, in Register, dark](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/register-dark-rename.png?raw=true)

![The rename dialog of a pane, in Register, light](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/register-light-rename.png?raw=true)

![The rename dialog of a pane, in Desk, dark](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/desk-dark-rename.png?raw=true)

![The rename dialog of a pane, in Desk, light](../blob/0fa29bac5c9a23b6891e8714b8ad5a6e3d812ccd/seal/threads/1795636143-213-a-panes-tab-has-a-menu/screenshots/desk-light-rename.png?raw=true)
