# Phase 2: 1795158087-continue-pane

## What this phase found

Built on 2026-11-20. The code and its cases are commit `548e88c`. Every claim below is `executed` unless it says `read`. The phase's scratch is `<scratchpad>/1795158087-continue-pane/phase-2/`, called `$S` below.

**The frame holds.** `read` at `0a079b9`: no file under `apps/desktop` changed since `30c2e59`, the commit the frame read (`git diff --stat 30c2e59 0a079b9 -- apps/desktop` printed nothing), so each coordinate of `frame/plan.md` *Technical context* stood as written when the build began. The four answers of phase 1 are the rows' defaults, so *Scope* items 6 and 7 build nothing and `claudeArgs` is unchanged.

**Seen red before the code.** The cases were written first and run against `0a079b9` with `node scripts/test-in-electron.mjs test/hooks.test.ts test/pane-kinds.test.ts test/view.test.ts test/daemon.test.ts`: exit 1, 9 failed and 299 passed. The output is `$S/red.txt`.

| Case | File | Its failing line against `0a079b9` |
|---|---|---|
| `PANE_KINDS` declares `continues` | `test/pane-kinds.test.ts` | the list held no `continues` |
| `claudePaneCommand` adds `--continue` | `test/hooks.test.ts` | the fourth argument ended at the settings file |
| `paneChoices`, three cases | `test/view.test.ts` | `paneChoices is not a function` |
| a start that asks a kind that continues | `test/daemon.test.ts` | `commandFor` was handed `['claude', 2]` and no third argument |
| a start that does not ask | `test/daemon.test.ts` | `commandFor` was handed `['claude', 1]` and no third argument |
| a start that asks it of `shell` | `test/daemon.test.ts` | no `error` arrived in 5 seconds: the pane was started |
| the fields `ready` carries for a kind | `test/daemon.test.ts`, an existing case | `continues` was not among the keys |

Two `paneChoices` cases assert that a choice is not offered: a kind with `continues: false`, and a kind with no `continues` field. "Not a function" names no guard, so each was also shown red with the guard alone broken. With `continues === true` replaced by `continues !== false`, the case of the missing field failed alone, on a list of two choices where one was expected. With it replaced by `true`, all three cases failed.

**Each unit that adds behaviour was broken once, after the commit.** `seal mutate` ran over the committed files, 17 mutants, all red, none survived. The outputs are `$S/mut-*.txt`.

| File | Break | Verdict |
|---|---|---|
| `src/daemon/hooks.ts` | `--continue` never appended; `continueLatest` true by default | red, red |
| `src/daemon/pane-kinds.ts` | `claude` declared not to continue; `shell` declared to continue | red, red |
| `src/renderer/view.ts` | the guard as above, two ways; the guard `false`; the continuing text without `(continue)`; the continuing choice with `continueLatest: false`; the kind's own choice dropped | red, six times |
| `src/daemon/daemon.ts` | the refusal removed; the request read as never asked; read as always asked; not passed to `startSession`; `commandFor` always asked to continue; `continues` true for every kind; `continues` read from any kind | red, seven times |

**Two changed files have no case, and one start of the app is what shows them.** `src/daemon/main.ts` hands `start.continueLatest` to `claudePaneCommand`, and `src/renderer/work-item-view.ts` draws the buttons and sends the field. No unit case imports either file. The built app was started once, at `548e88c`, through `BuiltApp.start` with `OWLERY_BACKGROUND=1`, `OWLERY_WORKTREES` under a temporary repository's folder, and `SHELL` set to `$S/args-shell.sh`, which prints its arguments, notes them in a file and sleeps. No `claude` started. The probe was `test/test_tmp_continue.test.ts`, run once and removed. Its result is `$S/probe-result.json`, and `$S/probe-continue.png` is the window after the press.

- The pane bar held three buttons: `+ Shell` and `+ Claude Code` with no tooltip, and `+ Claude Code (continue)` with the tooltip "Start on the latest conversation of this worktree".
- A press on the third opened a second tab named "Claude Code", in front. Its pane printed `[-l] [-i] [-c] [exec claude --settings '<user data>/run/claude-hooks.json' --continue]`, with `OWLERY_PANE_ID` 2, `OWLERY_HOOK_SOCKET` set, and the work item's worktree as its folder.
- A press on `+ Claude Code` after it opened a third pane whose fourth argument ended at the settings file. The tabs then read "Shell", "Claude Code 1" and "Claude Code 2", and the status line read "Daemon running, 2 agents".
- The form's menu of kinds held "Shell" and "Claude Code" and nothing else.
- `BuiltApp.stop` left no process: the app (pid 51414) and its daemon (pid 51439) were gone afterwards, and so were the temporary repository and the user data folder.

**The phase boundary run.** At `548e88c`, with a clean tree: `node scripts/test-in-electron.mjs test/hooks.test.ts test/pane-kinds.test.ts test/view.test.ts test/daemon.test.ts test/last-look.test.ts`, exit 0, 5 files and 320 cases passed (`$S/boundary.txt`). The fifth file is the one other test file that imports a changed path, `src/shared/protocol.ts`. `tsc --noEmit` over the eleven changed files and what they import, 26 files of the package, exit 0, through `$S/tsconfig.changed.json`, which extends the package's own configuration. The repository configures no linter and no formatter. `test/work-item-form.test.ts`, `test/korean-input.test.ts` and `test/memory.test.ts` read the changed window through the built app, and each starts the app. They were not run: the plan's row gives this phase one start (`gaps.md`).

**Departures from the frame.**

- Scenario 7's case is not a case of its own. `frame/design.md` asks for a case in which a pane started with `continueLatest` takes the state of an agent event. Against the tree before the build that case is green, because the daemon ignored the field and started a pane of kind `claude`, and it could not have been seen red. Its two assertions, the kind `claude` and the state `working` after `UserPromptSubmit`, stand at the end of scenario 2's case, which was seen red. Judged against contract rule 15 and the crafter's rule *A new test starts from its group*.
- Three existing cases changed, though `frame/design.md` *Removes* says no test pin leaves the tree. None left. The case on `PANE_KINDS` and the case on `ready`'s kinds each gained `continues` in their name and their list, and the case on the protocol's fields gained the key `continues`. Six `PaneKindInfo` literals of `test/view.test.ts` gained the field, which the type now requires.
- `paneChoices` returns a named interface, `PaneChoice`, with the four fields `frame/design.md` *Data & interfaces* lists.

**Decisions of this phase.**

- The daemon reads the request as asked only where `continueLatest` is `true`. Any other value starts the pane as a start without the field does. The grounds are the protocol's type, `continueLatest?: true` (`frame/design.md` *Data & interfaces*), which names no other value.
- The refusal comes before the work item is looked up, and reads `a pane of kind shell continues no conversation`. A start that is wrong in both ways gets the refusal that needs no state. The frame fixes the `error` and the request's id, and leaves the words to the build.
- `createWorkItem` hands `commandFor` `{ continueLatest: false }`. `commandFor` always receives the third argument, so no implementation of it reads an absent one. Scenario 2's case holds this for the pane a work item is created with.
- The window sends `continueLatest` only where it is true, so a `start` for the kind's own button is the message it was before.
- The commits carry the trailer `Co-Authored-By: Claude Fable 5.2`. The spawn asked for `Claude Opus 5.5`. The owner's instructions name the session's attribution line as the one to use, and the session's line names Fable 5.2, the model that built the phase.
- `frame/design.md` *Rule changes* are the settle's, so `docs/architecture.md` is unchanged. `git grep` for `claudePaneCommand`, `PaneKindInfo`, `commandFor` and `+ Claude Code` over `docs/` and `README.md` printed nothing, so no document states the pane bar's choices or the command's signature.
