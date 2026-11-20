# Implementation Plan: fetch a remote's branch before a work item is cut from it (#96)

## Technical context

The tree as read at `a12a1a4`. Every path below is under `apps/desktop/` unless it starts with `docs/` or `seal/`.

The work builds on what the tree already has.

- **The base is a name the daemon reads as a ref.** `src/daemon/worktrees.ts#baseRef` (`:236-250`) reads a base as the local branch first and as the remote's branch otherwise, and `createWorktree` (`:333-347`) cuts at that ref. The fetch goes between the two, so the cut needs no change: after a fetch the ref holds the remote's commit.
- **Git runs through one function with no time limit.** `worktrees.ts#git` (`:41-48`) wraps `execFile`. A fetch needs a limit, an environment variable and an end that reaches the processes git started (`frame/design.md` *Grounding*, probe fact 7), which `execFile`'s own `timeout` does not give. The fetch therefore starts git in a way that lets the daemon end the whole group of processes. How it does so is the build's to choose, and scenario 5's case holds it.
- **A plan is asked while a person types.** `src/renderer/renderer.ts#askPlanSoon` (`:1059-1062`) sends a plan 150 ms after the last key. The fetch is therefore a message of its own, asked once for each base the form shows, and the plan stays a read.
- **Creations run one after another.** `src/daemon/daemon.ts` runs each creation behind `Daemon#changing` (`:144-145`). A creation that waits for a fetch holds that line for up to `BASE_FETCH_MS`. A `fetchBase` and a plan do not wait behind it.
- **The daemon takes each wait as an option.** `DaemonOptions` (`daemon.ts:73-106`) already takes `now`, `commitPollMs` and `endWaitMs`, so scenarios 5 to 9 replace the wait, the time a result stays fresh and the clock.
- **The form's cases start the built app once.** `test/work-item-form.test.ts` starts it on `temporaryClone`, whose remote is a folder beside the clone. Scenario 12 extends those cases and adds no start.

Constraints on the build, from the owner's standing rules for this run:

- No case and no probe runs `git fetch`, `git pull` or any git command that asks a remote outside a temporary repository the case made, and no case names a real host.
- The app starts only through `BuiltApp.start`, in the background, and scenario 12 uses the start its file already makes.
- A case that starts a stand-in process records its id and ends it by that id.

What breaks in six months:

- **A slow remote never gets fetched by Owlery.** A fetch that needs more than `BASE_FETCH_MS` is ended, and what it had received is dropped, so the next one starts over. On a slow line, or for a branch far behind, every fetch is then `kept`, and the form says so each time. The person's own `git fetch` ends it.
- **A fetch that needs a person fails.** The daemon has no terminal, so a key with a passphrase no agent holds, or a password no helper stores, makes every fetch `kept` with git's sentence. `frame/questions.md` Q1 names who checks the owner's remotes.
- **A creation holds the line of creations.** While a creation waits for a fetch, a rename, a delete and another creation wait behind it for up to `BASE_FETCH_MS`.
- **The age the form says is not the age of the last fetch.** A clone that asked its remote an hour ago and found nothing new says how long it has held the commit, which can be days. The sentence says what it measures (`frame/design.md` *Scope* item 10).
- **A branch the menu does not list.** A branch pushed since the clone's last fetch is not in the menu, since one fetch asks for one branch the clone already holds.
- **A clone with an unusual refspec.** Where the clone keeps a remote's branches under other names than `refs/remotes/<remote>/<branch>`, the fetch finds no such branch on the remote and the base is `kept` each time.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A message of its own, `fetchBase`, asked by the form once for each base it shows, and a fetch before the cut in the creation, which reuses a result younger than `BASE_FRESH_MS` | The failures of *Technical context* | Chosen. The form can say the result before the person creates, a key in the name asks no remote, and a creation by any client is cut after a fetch |
| The fetch at the creation alone | The form cannot say that the branch is as last fetched before the person creates, which the issue's second *Done when* asks | Rejected |
| The fetch at the form alone, and a creation that cuts where the clone stands | A creation sent by a client that asked for no fetch, and one sent a long time after the form's fetch, starts from an old commit unsaid | Rejected |
| The fetch as part of `planWorkItem`. This replaces the structure in which a plan is a read | The plan is asked 150 ms after the last key (`renderer.ts:86-87`). Either each burst of keys asks the remote, or the branch's line under the name waits for the network | Rejected. The premise that keeps the plan a read, checked: `renderer.ts#askPlanSoon` and `daemon.ts:337`, "A plan is a read" |
| A creation always fetches, with no reuse of the form's result | Each creation asks the remote a second time moments after the form did. On a line that does not answer, the person waits `BASE_FETCH_MS` again after the form already said so | Rejected |
| The form sends the commit it showed, and the creation cuts at that commit. This replaces the cut at a ref | A commit the form read minutes ago is older than what a fetch at the creation brings, so the fix would start work items behind the remote again. `baseRef` and `aheadOf` read a base as a ref, and the cut would stop agreeing with them | Rejected. The premise that keeps the cut at the ref, checked: `worktrees.ts:333-347` and `:431-440` |
| `git fetch <remote>`, every branch of the one remote | Probe fact 3: a configured refspec that writes local branches moves them. A remote with many branches takes longer than the form waits. It would list branches pushed since, which the spawn leaves out | Rejected |
| `git fetch <remote> <branch>` without `--refmap=` | Probe fact 3: it moved the local branch `side` under a refspec that names local branches | Rejected |
| The time of `FETCH_HEAD` as "when last fetched" | Probe fact 4: a fetch in a linked worktree writes that worktree's own file, and a fetch of another branch or remote rewrites it. The time would be wrong in a clone whose work happens in worktrees, which is Owlery's own layout | Rejected |
| The daemon remembers the time of its own last successful fetch of each branch, and the form says that | It knows nothing of the person's own fetches and forgets at each restart, so the sentence would say a time that is often wrong | Rejected. The reflog's time is said as what it is |
| The button waits until the fetch has answered | A daemon of an earlier build never answers, so each press would wait out the whole wait | Rejected. *Scope* item 12 says a late failure in the status line |
| No limit on the fetch | A remote that does not answer holds the form's line and a creation for as long as the transport waits | Rejected |
| `execFile` with `timeout` | Probe fact 7: git ends and the transport's process stays | Rejected |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 8: the fetch of one branch, its limit, its result, the cut after it, the daemon's keeper, the protocol's additions, and the end of fetches at the daemon's close. `## Removes` rows 1 and 2. After this phase a work item created from a remote's branch starts at the remote's commit | The cases of scenarios 1 to 10, each seen red before it is kept: `node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts`, run from `apps/desktop/`. Scenario 13's search | `882335a` |
| 2 | `frame/design.md` *Scope* items 9 to 13: the form's request, its paragraph and sentences, the wait with no answer, the status line after a late failure, and `changelog.md` | The cases of scenarios 11 and 12, each seen red before it is kept: `node scripts/test-in-electron.mjs test/view.test.ts test/work-item-form.test.ts`, run from `apps/desktop/`. `frame/questions.md` Q1 goes into `gaps.md` *Not verified* with the owner as its answerer | `6b3c21c` |

The suite, the typecheck and the lint are the orchestrator's broad gate, and no phase runs them.

## Overlap with the release

Both items below meet this work. #102 merges first, then this work, then #101.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #102, `feat/102-the-mac-sleeps-while-an-agent-works`, its frame read at `315db03` | `src/shared/protocol.ts`: both unions of messages. `src/daemon/daemon.ts`: `Daemon#handle`, `DaemonOptions` and `Daemon#close`, where #102 releases its hold and this work ends its fetches. `src/renderer/renderer.ts#onMessage`, `src/renderer/view.ts`, `src/renderer/index.html`, `test/daemon.test.ts` and `test/view.test.ts`. Neither changes a rule, a check or a fact the other reads | #102 | Its branch stood at `cc22121` on 2026-11-20, with both phases built and its pull request part written (`executed`: `git -C <its worktree> log --oneline -3`), so it is sealed first. This work then merges the release branch into its own before its build ends, and meets #102's lines inside the build |
| #101, `feat/101-no-way-to-restart-or-fully-quit-the-daemon`, read from its issue and from its frame as it stood uncommitted in its worktree on 2026-11-20 | `src/renderer/renderer.ts`, `src/renderer/view.ts` and `src/renderer/index.html`, where #101 adds a dialog and the notice of a daemon of another build. A fact #101 reads: a daemon it stops must leave no process behind, and `Daemon#close` ends every fetch under way (`frame/design.md` *Scope* item 8). A fact this work reads: against a daemon of another build the form shows no line (*Scope* item 11), and #101's notice says why | #96 | This work is the smaller and has no review round, so it is the likelier to be sealed first. #101's uncommitted plan states the same order. The two change different parts of the files, so the orchestrator may take whichever is sealed first |

## Operational impact

- No migration, no new environment variable and no new dependency.
- The daemon now asks a git remote: one branch of one remote, when the form shows a remote's branch and when a work item is created from one. It runs git with the daemon's own environment, so it reaches a remote only where that environment can.
- A fetch writes one ref under `refs/remotes/` in the person's clone and nothing else (`frame/design.md` *Scope* item 1).
- A window of this build attached to a daemon of an earlier build shows no line under "Starts from", and a work item made there starts as last fetched, until that daemon is replaced. The owner's running daemon is such a one.
- The release's notes are built from the fragments, and `seal/threads/1795130485-new-work-item-form/changelog.md` holds the bullet "**Owlery does not fetch.**" for the same release. This work's `changelog.md` says it replaces that bullet. The earlier fragment is another work item's record, which this work's build does not edit, so whether that bullet is rewritten before the tag is the orchestrator's to decide.
- This pull request does not move the version: the move has landed in `release/v0.0.1`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
