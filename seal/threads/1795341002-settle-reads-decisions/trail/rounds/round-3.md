# Review round 3: 1795341002-settle-reads-decisions

```seal
target: 8e5cf32be5fc0a9637a69f651b5f3a7ba10b4971, fixes 79bac46..8e5cf32
```

This is a verifying round. It read the diff `git diff 79bac46 8e5cf32`, which holds the fixes since round 2's target. These are `7107e7f` (the orchestrator's `pr.md`), `5efbf83` (the killed-run case), `a72454a` (`changelog.md` and the module comment of `settle.ts`), and the record commits `d03b9ed` and `8e5cf32`. It answers round 2's two closes. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `8e5cf32`, with `trail/phases/` and `trail/rounds/round-1.md` and `round-2.md` for their coordinates. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. No `seal/parity.json` stands. The round worked in the clone `1795341002-settle-reads-decisions/round-3/clone` of the scratch directory, at `8e5cf32`. Every run that could reach a stand-in that kills its process group ran in a session of its own, through `os.setsid`.

Carried and not re-established: the frame's *Grounding* facts that plugin 0.38.4's settle removes in the working tree alone and moves no `HEAD`. Also carried is round 2's probe showing that the old case, under the broken `HEAD` reading, killed the runner with exit 137. This round did not rerun the old case. The caller forbade running AgenticSeal's own `seal settle --apply`, and this round did not run it. No built-app test file ran.

## Findings

None. The fix diff changes three lines of one case, one paragraph of the module comment, one sentence of `changelog.md` and one paragraph of `pr.md`. This round found no defect in any of them.

## Confirmations

```seal
confirms: round-2#1
```
What holds: the rerun in the case at `apps/desktop/test/settle.test.ts:560` now installs `standIn(REMOVE_ALL)` at `:572`. That stand-in removes and kills nothing. The case then asserts `seal.ran()` false at `:574` (read). `standIn` puts its own folder first on `PATH` and no other (`settle.test.ts:420-427`), so the earlier stand-in, which ends with `kill -s KILL 0`, is off the path for the rerun (read). The fix pass claimed the case goes red with only the `HEAD` reading broken, at `:574`, with no runner killed. This round broke the same guard in the clone: `rows.length > 0` became `rows.length < 0` at `apps/desktop/src/daemon/settle.ts:216`, in the loop over the records `HEAD` holds that the working tree lacks. It ran the whole of `test/settle.test.ts` in a session of its own. The run exited 1 and the runner printed its report: 22 passed and 2 failed. The killed-run case failed at `test/settle.test.ts:574` on `expected true to be false`. The case at `:211`, which covers the same guard, failed at `:219` (executed). Under round 2's old case, the same mutation ended the run with exit 137 and no report. Then `settle.ts` was restored with `git checkout`, and the narrow run passed. The class is every stand-in in the file that sends a signal, listed by `grep -n kill` over the file. Line 469 kills only its own shell (`kill -9 $$`). Line 551 runs only under `scriptApply`, whose child leads a group of its own, and no in-process run follows it in that case. Line 562 now reaches only the `scriptApply` run (read). The new comment at `:571` says what the change does.

```seal
confirms: round-2#2
```
What holds: the paragraph at `seal/threads/1795341002-settle-reads-decisions/pr.md:13` equals round 2's snippet string for string. The sentence round 2 gave stands once in the bullet at `changelog.md:6` (executed, a comparison in Python of the lines against the snippets in `trail/rounds/round-2.md`). The four link stops the two texts and the module comment at `apps/desktop/src/daemon/settle.ts:9-13` name are the ones the code has. A work item's directory that is a link stops the reading at `settle.ts:103`. A `threads/` or a `decisions.md` that links to nothing stops it through `nothingStands` (`settle.ts:78-85`, called at `:99` and `:117`). A directory or a `decisions.md` that `HEAD` holds as a link stops it in `rowsAtHead` (`settle.ts:194-200`, the throw at `:196`), which runs only where the working tree lacks the record (`:205` and `:215`). `headOf` adds both kinds of link (`settle.ts:150` and `:152`). *Scope* item 1 at `frame/design.md:42` lists the same four (read). `git grep` on "links to nothing", "link to nothing", "as a link", "exits 2" and "exit 2" over the tree at `8e5cf32`, outside the round records, finds no other statement of these stops that the code contradicts (executed). That search is a sample, made from wordings.

What matched: the records at the target. Round 2 read each of the seven files whole, and since then only `pr.md:13` and `changelog.md:6` changed. This round read each whole again against `8e5cf32`. It found no sentence the target contradicts (read). `pr.md` quotes no source by coordinate, so no quote needed checking. The links R1 and R2 add go to `#why-this-order`, `#이-순서인-까닭`, `roadmap.md#releases-and-the-tracker` and `roadmap.ko.md#릴리스와-트래커`. They match the headings at `docs/roadmap.md:32` and `:45` and at `docs/roadmap.ko.md:32` and `:45` by GitHub's rule: lowercase, and a hyphen for each space (read). That answers the row at `gaps.md:12` by reading again. The row stays open by its own words, since nothing rendered the links.

What matched: `gaps.md` and `frame/` have no diff in the range (executed, `git diff --stat 79bac46 8e5cf32`), so no row left the closing memo.

What matched: the narrow run. `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts test/decision-record.test.ts` ran in the clone's `apps/desktop`, in a session of its own. It exited 0: 2 files and 80 cases (executed).

Seen and not raised. At `settle.ts:13` the module comment's reflow leaves a short line, "nothing. A notice of the reader is". That only reads badly. The list of exits 2 at `changelog.md:6` does not name a `HEAD` that git cannot read. Round 2's case I showed that a records root in a repository with no commit exits 2 for that. A release's settle runs on a repository whose records are committed, so no settling session meets it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| `--apply` run with AgenticSeal's own `seal settle --apply`. The caller forbade that run, and this round ran only stand-ins | `seal/threads/1795341002-settle-reads-decisions/gaps.md:9` | The release's settling session (#49) |
| A Ctrl-C typed in a terminal through `pnpm --filter @owlery/desktop run settle --apply`. This round sent no signal at all | `seal/threads/1795341002-settle-reads-decisions/gaps.md:11` | The release's settling session (#49) |
| The list and the links of R1 and R2 as GitHub renders them. They were read, not rendered | `seal/threads/1795341002-settle-reads-decisions/gaps.md:8`, `seal/threads/1795341002-settle-reads-decisions/gaps.md:12` | #49, which places the list |
| The whole suite, the typecheck and the broad gate at the target. The suite stands `unverified`, as `gaps.md:7` and `:10` label it, and the label is honest: no record claims the broad gate passed | `seal/threads/1795341002-settle-reads-decisions/gaps.md:7`, `seal/threads/1795341002-settle-reads-decisions/gaps.md:10` | The orchestrator's broad gate, after the review rounds |

This round leaves nothing open. What comes due is the orchestrator's broad run, and then the sealer's spawn.

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts test/decision-record.test.ts`, in the clone's `apps/desktop`, in a session of its own | exit 0; 2 files, 80 cases passed |
| `settle.ts:216` changed from `rows.length > 0` to `rows.length < 0`; `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts`, in a session of its own | exit 1; 22 passed, 2 failed, at `test/settle.test.ts:574` (`expected true to be false`) and `:219`; the runner printed its report. `settle.ts` was then restored with `git checkout`, and `git status --porcelain` printed nothing |
| A comparison in Python of `pr.md:13` and `changelog.md:6` against round 2's two snippets | equal, and contained once |
| `git grep -n` on the link stops' and exits' words over `8e5cf32`, outside the round records | no statement the code contradicts |
