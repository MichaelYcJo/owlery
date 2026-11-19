# Phase 1: 1795130485-new-work-item-form

## What this phase found

Every path below is under `apps/desktop`. Every command ran from that folder, and the phase's scratch is `<scratchpad>/1795130485-new-work-item-form/phase-1/`.

**The frame holds, with one row that needed a step first.** `read` at `ecca288`: each coordinate of `frame/plan.md` *Technical context* that this phase builds on stands where the row says, and `frame/design.md` *Grounding* reads `src/daemon/worktrees.ts`, `src/daemon/daemon.ts` and `src/shared/protocol.ts` as they are. The worktree held no `node_modules`, so no case could run. `pnpm install --frozen-lockfile` from the worktree's root built them (`executed`, exit 0, `pnpm-install.txt` in the scratch). It starts no app: its one script rebuilds `node-pty`.

**`frame/questions.md` Q2 is decided: two lists of 64 words, 4,096 names.** `src/shared/names.ts` holds `FIRST_WORDS`, 64 words that describe, from `amber` to `witty`, and `SECOND_WORDS`, 64 names of animals and of things of a landscape, from `badger` to `zephyr`. The grounds, judged against Q2's own cell and `frame/design.md` *Scope* item 1:

- Every word is plain English of the letters `a-z`, and none is a word a person would not want in a branch's name. The longest word of each list has 7 letters, so the longest name has 15 characters, under `slugFor`'s 40.
- 4,096 pairs make two equal names in one repository rare while a person holds tens of work items. The loop that appends a number covers the rest, which the case "names a work item nobody named" shows with two creations of one draw.
- The function is `generateName(random = Math.random)`. A draw of 1, which `Math.random` never gives, still names the last word.

**Decisions the frame left to the code.** Each is judged against `frame/design.md` *Scope*, the item named.

- A remote's branch whose name a local branch bears is never the default base (item 4). Item 4 reads a base's name as the local branch first, so such a name would cut at the local branch, and item 6 keeps it out of the remote list. The default base is therefore chosen among the names of the two lists, and the order's next step is taken. The case "is no remote's branch whose name a local branch bears" holds it.
- A remote's `HEAD` that names a branch the clone does not hold is passed over, and the order goes on (item 4, "the first of these that exists").
- The remotes are the ones `git remote` lists, so a remote whose name holds a slash is read as one remote. A ref under `refs/remotes` of no listed remote can be chosen as a base and is never the default.
- A base's name is read with one `git for-each-ref` over `refs/heads/<name>` and `refs/remotes/<name>`, and a line counts only where its ref is the whole of one of the two. Git matches a pattern against the refs under it too, so `feat` would otherwise be read as `feat/login`. A name git reads as a pattern, such as `ma*`, and an empty name are refused the same way. Any ref under `refs/remotes` that names another ref is no base, which is how a remote's `HEAD` entry is told (item 4).
- A `name` that is no string is refused with "a work item's name, where one is sent, is a string", in a creation and in a plan. The frame names no answer for it. Without the refusal the daemon would answer with a `TypeError`'s text.
- A `base` that is no string is refused with "a work item starts from a branch's name, and `<the value>` is none", `null` among the values. A base that is none of the repository's is refused with "`<repository>` has no branch `<base>` to start a work item from" (item 5).
- A work item nobody named is called by the last part of its worktree's folder, which is the name with its appended number (item 3).
- The read of the repository's branches takes the output limit the reads of a log and a diff have, 256 MB, in place of Node's megabyte. A creation without a `base` reads every branch, and at `47c4f61` a creation read none, so a repository with some ten thousand branches would otherwise fail a creation that worked before.

**Departures from the frame.**

- `createWorktree` and `planWorktree` also take `random`. `frame/design.md` *Data & interfaces* gives the source of randomness to `DaemonOptions` alone, and the name is drawn in `worktrees.ts`, so the daemon hands it on.
- Scenario 1's case reads the work item's branch with `git for-each-ref refs/heads/owlery` and not with `git branch --list`, which the scenario's cell names. `git branch --list` prints "+ " before a branch that another worktree has checked out, and every work item's branch is one (`executed`: the case's first run failed on "+ owlery/keen-maple").
- Scenario 5's cases plant the remotes' branches with `git update-ref` and `git symbolic-ref` under `refs/remotes`, beside remotes added with `git remote add` and never fetched. The order reads refs, and one creation for each step would otherwise need a clone and a fetch each. Scenarios 4, 6, 7 and 13 run on a clone that `git clone` made, through the new `test/repositories.ts#temporaryClone`.
- `test/repositories.ts` gains `temporaryClone` and `commitFile`. The frame names neither. Phase 2's `test/work-item-form.test.ts` needs the same clone.
- Scenario 13's case in `test/view.test.ts` was green when written, since `src/renderer/view.ts#ahead` is not changed. It was shown red by a mutant, below.

**What the next phase needs.**

- The local list holds every local branch, so it holds the work items' own branches, such as `owlery/fix-the-login-bug`. A plan after one creation in a repository with `main` alone answers `localBases` as `main`, `owlery/fix-the-login-bug` (`executed`, the case "answers a plan with the branch and the folder a creation would get"). The menu of *Scope* item 9 therefore shows them under "Local". Leaving them out is a product choice the frame does not make, and `gaps.md` holds it.
- A plan runs `git rev-parse` once, then four reads at once (`for-each-ref`, `symbolic-ref`, `config`, `remote`) beside one `show-ref` for each name tried. How long that takes in a repository with many branches was not measured, and `frame/questions.md` Q3 is phase 2's.
- A plan without `name` and with a title that leaves no slug answers a name the daemon draws, which is not the name a later creation draws. The window always sends `name` (*Scope* item 7), so the form never shows such a branch.
- The answer to a plan is `{ type: "workItemPlan", requestId, branch, worktree, localBases, remoteBases, defaultBase }`, and a plan that fails is answered with `error` and the plan's `requestId`.

**Each new case was seen red before its code.** All three runs are `executed`, with exit 1.

- `node scripts/test-in-electron.mjs test/names.test.ts`, before `src/shared/names.ts` existed: 0 cases ran, and the file failed with "Cannot find module '../src/shared/names'". The file's cases had no failing line of their own, so the three mutants of `names.ts` below are their red.
- `node scripts/test-in-electron.mjs test/worktrees.test.ts`, against `src/daemon/worktrees.ts` of `ecca288`: 9 failed and 26 passed of 35.
  - `slugFor` failed on "expected 'work-item' to be ''", the base named with slashes on "expected 'main' to be 'feat/login'", scenario 2 on "expected [ 'owlery/work-item', … ]", and scenario 4 on "expected 'feature' to be 'origin/trunk'".
  - The four cases of the default base failed on "planWorktree is not a function", a line that names the plan and not the order. Scenario 13's case on `aheadOf` failed on "expected 'main' to be 'origin/main'", the creation's line and not the count's. The mutants below show each step of the order and each read of `aheadOf` red on its own.
  - The rewritten case "gives no base branch, and cuts at the checkout's commit" passed, since the code of `ecca288` gives a detached checkout no base. The mutant `let start = "HEAD~1"` shows it red.
- `node scripts/test-in-electron.mjs test/daemon.test.ts -t "work items|the inbox"`, against `src/daemon/daemon.ts` of `ecca288` with the new `worktrees.ts`: 8 failed and 44 passed, with 50 skipped by the filter.
  - Scenario 1 failed on "expected { id: 1, title: '', … } to match object { title: 'keen-maple', … }", and scenario 6's bases on "expected [ 'origin/main', … ] to deeply equal [ 'feature', … ]".
  - Six cases ended at the 5 seconds a case has, each waiting for an answer the old daemon never sends: the four of a plan, the refusal of a base, and the refusal of a `name` that is no string.
  - Scenario 13's case in the daemon and the rewritten case of no count passed, since `worktrees.ts` already held the change. The mutant of `aheadOf` below shows the first red.

**Each unit that adds behaviour was broken once, after the commit `cdcedfc`.** Every run is `seal mutate`, `executed`, and every mutant is red. The outputs are `mutate-*.txt` in the scratch.

| File mutated | Cases run | Mutants | What they break |
|---|---|---|---|
| `src/shared/names.ts` | `test/names.test.ts` | 3 red | the bound at a draw of 1, the second word's list, the dash |
| `src/daemon/worktrees.ts` | `test/worktrees.test.ts` | 19 red | `slugFor`'s empty result; the order title, name, generated name; the slug of `name`; the draw handed on; `--no-track`; the local branch read first; a remote's `HEAD` as a base; each of the four steps of the default base, origin first, the remotes before the names, the order of the names; a remote's branch under a local branch's name; a `base` sent; `aheadOf`'s read of a remote's branch; and one badly aimed break, an early return from a creation without a `base`, which the first case of `createWorktree` caught |
| `src/daemon/worktrees.ts` | `test/worktrees.test.ts`, one mutant a run | 2 red | a remote's branch read before the local branch of its name: red in the case on `aheadOf`, "expected +0 to be 1". `let start = "HEAD~1"`: red in the case of no base, "fatal: invalid reference: HEAD~1" |
| `src/daemon/worktrees.ts` | `test/daemon.test.ts -t 'work items\|the inbox'` | 7 red | a name that only begins a branch's; the checkout's branch first; newest commit first; a remote's `HEAD` in the list; the refusal of a base; a shadowed remote's branch in the list; `aheadOf` in the daemon's read |
| `src/daemon/daemon.ts` | `test/daemon.test.ts -t 'work items'` | 10 red | the title's trim; the name as the title; `random` in a creation and in a plan; the refusals of a `base` and of a `name` that is no string; a plan chained behind the creations; `name` in a creation and in a plan; a key more in the plan's answer |
| `src/renderer/view.ts` | `test/view.test.ts` | 1 red | a base printed without its remote: red in the new case alone, 1 failed and 169 passed |

The batches print each mutant's verdict and not its failing case. The times of the 19 follow the order of the cases in the file, and the three run alone were read to their failing lines.

One line has no mutant. `basesOf` sorts the remotes other than `origin` by name, and `git remote` of git 2.50.1 already prints them in that order (`executed`, in a repository of the scratch with `beta`, `origin` and `alpha` added in that order). A mutant without the sort would pass. `gaps.md` holds the row.

**The phase's cases at `cdcedfc`.** `executed`, exit 0: `node scripts/test-in-electron.mjs test/names.test.ts test/worktrees.test.ts test/daemon.test.ts test/view.test.ts` ran 4 files and 310 cases, all passed (`boundary.txt`). `tsc --noEmit` with the options of `tsconfig.json` over the four source files and the five test files the phase changed exited 0 (`tsc-files.txt`). Scenario 12's search, `git grep -n -e '"work-item"' -- apps`, printed nothing and exited 1.

The builder also ran `pnpm exec tsc --noEmit` over the whole package twice while building, exit 0 both times, before the last edits of `test/daemon.test.ts`. That run is the whole typecheck, which is the orchestrator's, and it stands for nothing at `cdcedfc`.

No app was started. Every branch and worktree was made in a temporary repository under the system's temporary folder, which each case removes.
