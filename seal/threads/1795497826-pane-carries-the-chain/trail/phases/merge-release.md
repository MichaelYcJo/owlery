# Merge of release/v0.0.3: 1795497826-pane-carries-the-chain

## What this phase found

**The frame held for the merge, and two of its sentences on #182 and #183 no longer match the tree.** `frame/plan.md` *Overlap with the release* names one conflict of content, in `apps/desktop/src/daemon/daemon.ts`, and one port, in `apps/desktop/test/chain.test.ts`. Executed: `git merge origin/release/v0.0.3` at `61ee6a1` stopped on that one file and merged every other file by itself. The port is the one the row names. What the merged tree contradicts in the frame is under *What the frame says that the merged tree does not* below.

### The merge

**`release/v0.0.3` at `18f9158` is merged at `f46c100`, with no rebase.** It brought #183 (`09ff5ad`, Night watch's marks) and #182 (`18f9158`, the watch of a pane's session log).

**The one conflict was at the imports of `daemon.ts`.** Phase 2 of this work replaced the import of `record-blocks.ts` with the import of `stage-records.ts`, because the code that used `THE_SESSION` and `isSessionId` moved into that module. #182 added the import of `session-log.ts` on the line above the one phase 2 replaced. The merge keeps the import of `session-log.ts` and the import of `stage-records.ts`, and drops the import of `record-blocks.ts`. Executed: `grep` for `THE_SESSION` and `isSessionId(` in the merged `daemon.ts` prints nothing, so no code there reads either name. Every other hunk of #182 in `daemon.ts` merged by itself: the watch's start and end in `agentEvent`, `followLog`, `endLog`, `interruptedTurn`, and the end of a watch at the daemon's close, at a pane's close and at its exit.

**Both sides also changed six other files, and git merged each by itself.** Executed, `git diff --name-only` of each side against `c82c611`: with #183 they are `apps/desktop/package.json`, `docs/design.md` and `docs/design.ko.md`, and with #182 they are `apps/desktop/src/shared/protocol.ts`, `apps/desktop/test/chain.test.ts` and `apps/desktop/test/daemon.test.ts`. `package.json` now reads version 0.0.3, which #183 moved. This work's pull request still moves no version, as `frame/plan.md` *Operational impact* says.

**The merge commit does not typecheck in `chain.test.ts`, and the next commit repairs it.** Executed at the merged tree before the commit: `tsc --noEmit` in `apps/desktop` printed two errors, both in the case #182 added, and none elsewhere. The merge commit holds the conflict's resolution alone, so that the port reads as a change of its own at `fb99e91`. The work item's pull request merges by squash, so no commit of the base holds that state.

### The port of #182's case

**#182's case under "a start that is refused" now starts its chain through `chain-run.ts`'s `startChain`.** The case is "starts the chain of a work item whose one working pane's turn the person interrupted, read from its session log, where the start was refused while the pane worked". It called the client's `getSeal`, which phase 1 removed, and handed `refusedWith` a request id, which that helper no longer takes. It pinned the refusal as "Get a seal once the session has finished." It now pins the sentence phase 1 wrote, "Its chain can start once the session has finished.", and expects `startChain` to answer `done` after the interruption. The case stays in its group, after the case that refuses a start while a pane works. That neighbour pins the refusal alone, and no other case of the group starts a chain after an interruption. The port is commit `fb99e91`.

**The ported case, seen red with the log's reading removed.** The case pins behaviour #182 built, so it passes against the merged tree. Executed, `seal mutate` over `apps/desktop/src/daemon/daemon.ts` at `fb99e91`, with `-t` naming the case alone. Each mutant ran once in a batch and once alone, since the batch prints no output of the cases and the failing line had to be read.

| Mutant | Verdict | Where the case failed |
|---|---|---|
| `followLog` calls nothing at an interruption's entry: the line `if (isInterruptionEntry(line)) this.interruptedTurn(session);` removed | red | At the wait for the pane to be listed as waiting (`chain.test.ts:1412`), which timed out with the pane still working. This is the log's reading removed, as #182's phase 3 removed it |
| `works` counts a pane in any state: `info.state !== null` for `info.state === "working"` | red | At the case's last line (`chain.test.ts:1413`): `startChain` answered the sentence that names a working session where `done` was expected |
| The refusal's sentence ends "once the session has ended." | red | In `refusedWith` (`chain.test.ts:1357`), on the sentence the case pins |

The first mutant shows that the case depends on the log's reading. It fails before the line the scenario's *Then* names, as it did in #182's own run. The second keeps the interruption and breaks the reader, and shows that the last line fails on its own. The third shows that the case holds the reworded sentence. Each run ended `red`, and `seal mutate` restored the file and compared its hash.

### #182's changelog fragment

**One bullet of #182's fragment said a chain can start in the work item, and this work makes that untrue for a person.** `docs/roadmap.md` *Releases and the tracker* has a work item rewrite, in its own pull request, a bullet of an earlier fragment of the same release that it makes untrue. The bullet "Everything that waited for the session to stop working stops waiting." of `seal/threads/1795498003-interrupted-turn-stays-working/changelog.md` now says that the daemon's own chain is no longer refused a start for that session, and that nothing in the window starts that chain in this release. The commit is `f3967a4`. Read: `daemon.ts#whyNoChain` still refuses a start while `works` holds, and no client message reaches a start (`frame/design.md` scenario 9), so the sentence states the tree.

**The fragment's opening paragraph is left as it is.** It says that before the fix "A chain could not start in its work item". That is a sentence about the release before, where the button stood, and it is true of it. Judged against the same paragraph of `docs/roadmap.md`, which asks for a bullet that became untrue.

### The screenshots

**The twelve committed images are taken again from the merged tree, in one commit, `aa96283`.** Executed at `f3967a4`: `OWLERY_BACKGROUND=1 pnpm run screenshots` in `apps/desktop`, once, with `OWLERY_SCREENSHOT_DIR` naming a folder of this pass's scratch directory. It wrote twenty files and its one case passed. The twelve files the work item's `screenshots/` already held were replaced by the files of the same names, and the other eight are not committed, as `gaps.md` *Not done* says of the first run. Read, two of the twelve, `night-watch-dark-finished.png` and `night-watch-light-view.png`: the marks of a state are #183's moons, and the seal's place holds no button. The other ten were not opened.

### Scenario 9's search

**The search of `frame/design.md` scenario 9 prints its two lines and no other at the merged tree.** Executed at `fb99e91` and unchanged by the later commits, which touch no file the search reads but for records under `seal/threads`, which it leaves out: `git grep -n -e 'Get a seal' -e 'Get a new seal' -e 'getSeal' -e 'get-seal' -e 'get-a-seal' -e '인장 받기' -- . ':!seal/threads'` prints `docs/roadmap.md:22` and `docs/roadmap.ko.md:22`, the rows of milestone 2. So the merge brought no line that names the button outside the records. Executed: over the merge commit's tree, `git grep -n -e 'Get a seal' -e 'getSeal' f46c100 -- apps` prints the two lines of #182's case, `chain.test.ts:1409` and `chain.test.ts:1413`, so the patterns find a line where one stands, and the port is what removed both. Under `seal/threads`, a second search over every `changelog.md` and `pr.md` prints this work item's own fragment alone, where the bullets say the button is gone.

### What ran

**Executed at `aa96283`, in one command through `apps/desktop/scripts/test-in-electron.mjs`: 527 cases of five files passed.** The files are `apps/desktop/test/chain.test.ts`, `daemon.test.ts`, `session-log.test.ts`, `agent-events.test.ts` and `agent-state.test.ts`, each whole. The run took 364 seconds. `gaps.md` was edited while it ran, and no source or test file was. `apps/desktop/test/theme-controls.test.ts`, which the merge also changed and which imports the built app's helper, then ran alone with `OWLERY_BACKGROUND=1`: its 6 cases passed. Executed before the port's commit: `tsc --noEmit` in `apps/desktop` passed. That typecheck has no mode for single files, so it read the whole package.

**No other file ran.** The merge changed `daemon.ts`, `agent-state.ts`, `agent-events.ts`, `protocol.ts` and `themes.css`, which the files that start the built app load. `skills/verify/SKILL.md` *The narrow command still has to be able to fail* gives a merge to the broad gate, since what breaks is outside what was edited. The suite, the repository-wide typecheck and the document counts are the orchestrator's (`gaps.md` *Not verified*). No real `claude` was started, and the app was started for the screenshot run and for `theme-controls.test.ts` alone, each in the background.

### What the frame says that the merged tree does not

No line of the frame is the crafter's to write but its Status cell, so each of these is named for the fold.

- `frame/plan.md` *Overlap with the release*, the opening paragraph: #183 "meets this work at the screenshots alone". At the merged tree both also changed `docs/design.md`, `docs/design.ko.md` and `apps/desktop/package.json`. Git merged the three by itself.
- `frame/plan.md` *Overlap with the release*, the row of #182, the cell *Where both change*: it names `daemon.ts` at "the sentence of `whyNoChain` on a working session". #182 left that sentence as it was in `daemon.ts` and pinned it in `chain.test.ts`. What both changed in `daemon.ts` is the imports, where the conflict stood. Both also changed `protocol.ts`, `chain.test.ts` and `daemon.test.ts`.
- `frame/plan.md` *Overlap with the release*, the same row's *Grounds*, and *Judgments of the run*, the row on the merge order: "#182 is a bounded fix in `agent-state.ts`". As merged at `18f9158`, #182 adds `apps/desktop/src/daemon/session-log.ts` and changes `daemon.ts`, `agent-events.ts`, `agent-state.ts` and `protocol.ts`. The judgment's row is dated and records what was known then. The *Grounds* cell is not dated.
- `frame/design.md` *Scope*, the first paragraph, and `frame/plan.md` *Alternatives considered*, the row on `## Rule changes`: each counts #182 among the release's items that read or are framed against the documents this work rewrites. #182 was framed and merged before this work's documents. Its design is unsettled and its `## Rule changes` names `docs/architecture.md` *Overall layout* and `docs/product.md` *Foundation*, with their Korean editions, each by a `from:` sentence.
- `frame/design.md` *Rule changes*, the `why:` line, still holds, and was checked because of the item above. Executed: each of #182's four `from:` sentences stands once in its document at the merged tree, and the four section headings stand, so this work moved no section and no sentence that design names, and re-points nothing.
