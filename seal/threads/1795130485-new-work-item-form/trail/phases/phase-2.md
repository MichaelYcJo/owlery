# Phase 2: 1795130485-new-work-item-form

## What this phase found

Every path below is under `apps/desktop`. Every command ran from that folder, and the phase's scratch is `<scratchpad>/1795130485-new-work-item-form/phase-2/`. Every run that started the app set `TMPDIR=/private/tmp/claude-501`, so `test/built-app.ts#BuiltApp.start` put the app's user data folder there, and `BuiltApp.start` sets `OWLERY_BACKGROUND=1`.

**The frame holds.** `read` at `d174c56`: the form's ids, `src/renderer/view.ts#workItemFields`, the case `error` of `src/renderer/renderer.ts#onMessage` and the two drivers stand as `frame/design.md` *Grounding* reads them, and the protocol of phase 1 stands in `src/shared/protocol.ts` as `trail/phases/phase-1.md` records it. The coordinates of `frame/plan.md` *Technical context* are of `47c4f61` and moved with phase 1.

**`frame/questions.md` Q3 is decided: the form waits 150 ms after the last key, and does not wait otherwise.** `executed`, the probe `test_tmp_plan_time.test.ts` of the scratch, which timed `src/daemon/worktrees.ts#planWorktree` seven times in a temporary clone at each size (`probe-plan-time-numbers.txt`):

| The clone holds | One plan |
|---|---|
| one branch | 27 to 28 ms |
| 1,000 more local and 1,000 more remote branches, loose refs | 127 to 138 ms |
| 6,000 and 6,000, loose refs | 652 to 869 ms |
| the same, packed refs | 417 to 443 ms |

A plan in a repository of some thousand branches takes as long as the gap between two keys, so a request at every key would queue reads of git behind each other. `renderer.ts#PLAN_WAIT_MS` is 150: keys closer together than that ask once, after the last. The form asks at once when it opens and when "Browse…" fills the folder, where there is no next key to wait for. Judged against Q3's own cell. The probe ran twice: the first run printed its numbers with `console.log`, which the runner did not show, so the second wrote them to a file. The probe's copy in `test/` is removed.

**Decisions the frame left to the code.** Each is judged against `frame/design.md` *Scope*, the item named.

- The form holds its plan with the repository field's text it was asked for, and shows it only while the field holds that text (`view.ts#planLine`, `#baseMenu`). When the repository's text changes, the branch, the folder and the menu leave the form at that key and come back with the new answer. Item 8 says the form shows only the answer to its latest request, and another repository's bases in the menu could be sent as a creation's `base`. When the name changes, the form keeps the last branch until the new answer arrives, so the line does not blink at each key.
- The plan's refusal stands in the branch's place, in the colour of a failure, and the menu is disabled (item 8). An error that answers an earlier plan is shown nowhere: without that, the status line would show the refusal of a folder's path half typed. `view.ts#planAnswer` tells the three kinds of answer apart, and the window keeps the ids of the plans not yet answered.
- With no repository folder the form asks no plan. `view.ts#workItemFields` refuses an empty folder for a plan as for a creation, because the daemon would run git in its own folder.
- Where the repository has no default base and the answer lists a base, the menu's value is the first base listed, and the creation sends it (item 9). Phase 1 found that a ref under `refs/remotes` of no listed remote is such a base. The menu then shows what the creation sends. Item 9 names the default base as the choice and does not name this case.
- An empty group has no label in the menu. In a clone whose only remote's branch is the default base, the menu holds that base and the group "Local" (item 9).
- The branch is drawn in the monospace type and the folder under it in the faint ink, with the variables `themes.css` defines. `test/themes.test.ts` holds the page to those variables. It was `read`, not run.

**Departures from the frame.**

- A person's choice of a base lasts for one opening of the form. Item 9 keeps it "while the repository field's text stays the same and the answer still lists that base", which read alone would carry the choice into the next work item of the same repository. The issue's third *Done when* line makes the repository's default branch the default, so each opening starts from it. Within one opening the choice is kept as item 9 says. The built-app case "opens again on the same repository with the default base" holds it.
- `workItemFields` takes the generated name and the menu's choice and returns `name` and `base` with the folder and the title. Scenario 8 names "the fields of a creation", and the same function gives a plan's fields with no base. The window's own code then decides nothing about what is sent.
- `test/work-item-form.test.ts` holds four cases and not the three steps of scenario 9: it also types a folder outside any repository and reads the refusal under the name and no notice in the status line, and it opens the form a second time. Both run in the one start of the app.
- The case empties the name with a Backspace key over the selected text, and sets the two menus' values on their fields with a `change` event for the base. The menus are the system's own, which the debugging port does not reach, as `test/korean-pane.ts#openReceiverPane` says of the kind's menu.

**Each new case was seen red before its code, except the two added later, which mutants show red.** All runs are `executed`.

- `node scripts/test-in-electron.mjs test/view.test.ts` against `view.ts` of `d174c56`, exit 1: 14 failed and 168 passed (`red-view.txt`). The three changed cases of `workItemFields` failed on their values, the empty name on "expected { Object (error) } to deeply equal { repo: '/r/project', title: '', …(2) }". The eleven cases of `planAnswer`, `planLine` and `baseMenu` failed on "is not a function", a line that names the function and not its rule, so the sixteen mutants below are their red.
- `node scripts/test-in-electron.mjs test/work-item-form.test.ts` against the window of `d174c56`, exit 1: 3 failed of 3 (`red-form.txt`). The first failed on "expected 'Title' to be 'Name'", and the other two on the element `work-item-branch`, which the page did not hold.
- The steps of the refusal under the name and the fourth case, the second opening, were written after the window's code and were green at once. Mutants 6, 7 and 8 of the window's batch below are their red.

**Each unit that adds behaviour was broken once, after the commit `769ccc5`.** Every run is `seal mutate`, `executed`, and every mutant is red.

| File mutated | Cases run | Mutants | What they break |
|---|---|---|---|
| `src/renderer/view.ts` | `test/view.test.ts` | 16 red | the name sent; the base sent; the refusal of an empty folder; an id the form never asked; an earlier plan told from the latest; the trim of the repository's text; a plan of another repository's text; the mark of a refusal, and of no plan; the default base left out of each of the two groups; a choice of another repository's text; a choice the answer does not list; the choice itself; the default base first; no value where there is no plan |
| `src/renderer/view.ts` | `test/view.test.ts`, one mutant a run | 2 red | a choice of another repository's text: "expected 'feature' to be 'origin/main'". An id the form never asked: "expected 'earlier' to be 'other'" |
| `src/renderer/renderer.ts` | `test/work-item-form.test.ts` | 8 red | the placeholder; the plan asked when the repository changes; the plan asked when the name changes; the menu's choice sent as `base`; the choice kept at a `change`; a plan's refusal kept out of the status line; the choice dropped at each opening; the plan asked when the form opens |

The batches print each mutant's verdict and not its failing case (`mutate-view.txt`, `mutate-renderer.txt`). The window's batch started the app nine times, the baseline among them, each in the background. Mutants 2, 3 and 8 took 16 to 18 seconds, the 15 seconds a wait for the branch lasts, and the others failed within 3.

Two lines of the window have no mutant, because no case reads them. `PLAN_WAIT_MS`: a case would have to count requests against a clock. The redraw at a key of the repository field, which takes a plan of the earlier text off the form: `planLine` and `baseMenu` hold the rule, and the built-app case never types over a repository whose plan it holds. `gaps.md` holds both rows.

**The phase's cases at `769ccc5`.** `executed`, exit 0.

- `node scripts/test-in-electron.mjs test/view.test.ts test/work-item-form.test.ts` ran 2 files and 186 cases, all passed (`boundary.txt`). The app started once.
- Scenario 10: `node scripts/test-in-electron.mjs test/korean-input.test.ts -t "opens one pane through the form, of the shell kind"` ran 1 case, passed, with 32 skipped by the filter (`scenario-10.txt`). From the repository's root, `git diff --stat 47c4f61 -- apps/desktop/test/memory.ts apps/desktop/test/korean-pane.ts` printed nothing, and the same command over `apps/desktop/test/view.test.ts` printed "1 file changed", so the path is read.
- Scenario 11: `git grep -n -e 'Give the work item a title' -- apps` printed nothing and exited 1. `git grep -c -e 'Choose the repository folder' -- apps` printed four files, so the path is searched.
- `tsc --noEmit` with the options of `tsconfig.json` over `src/renderer/renderer.ts`, `src/renderer/view.ts`, `test/view.test.ts` and `test/work-item-form.test.ts` exited 0 (`tsc-files.txt`), before the commit.

The app started fourteen times in all, each in the background with its user data under `/private/tmp/claude-501/`: once red, twice green while building, nine times for the mutants, once for scenario 10 and once for the last run. No screen was captured. Every pane ran `test/fixtures/receiver.sh` as its shell, so no `claude` started. After the last run no `owlery-*` folder stood under `/private/tmp/claude-501/`.

The spawn narrowed the phase's run to the test files the phase changed, so `test/themes.test.ts`, `test/memory.test.ts` and the other cases of `test/korean-input.test.ts`, which read a path the phase changed, were not run. `gaps.md` holds the row.
