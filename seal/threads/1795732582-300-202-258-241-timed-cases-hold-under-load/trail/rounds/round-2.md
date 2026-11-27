# Review round 2: 1795732582-300-202-258-241-timed-cases-hold-under-load

```seal
target: 66ab4a96, fixes 728b98cb..66ab4a96
```

This is a verifying round. It reviewed the diff from round 1's target `728b98cb` to HEAD `66ab4a96` on the branch `test/300-202-258-241-timed-cases-fail-under-load`, whose base is `57449b14` of `release/v0.0.5`. The diff holds the orchestrator's fold of round 1 (`460cc44f`), the fix pass (`a31708dc`, the patch, the lock file and a second case of `pty.test.ts`; `1b68e3ae`, `gaps.md` and a new `changelog.md`), round 1's close (`7b3b1019`) and two more folds (`735d7b3e`, `66ab4a96`). It worked in the branch's worktree, which holds the install of the patch at HEAD, and kept its probe and its captured output under its own scratch directory, `<scratchpad>/1795732582-300-202-258-241-timed-cases-hold-under-load/round-2/`.

What this round carried from round 1 and did not establish again: where node-pty's `pty_posix_spawn` and `PtyFork` stand, that node-pty 1.2.0-beta.18 closes the master in `PtyFork` (opened again in the framer's unpacked copy of the beta, `src/unix/pty.cc:408-414`, to answer the patch's comment), and round 1's verdicts on the code outside the fix diff: the fetch cases, #258's case, the inbox cases and the comments of *Scope* item 7. No line of those cases changed in this range (executed: `git diff --stat 728b98cb..HEAD`, which lists `apps/desktop/test/pty.test.ts` as the one test file). Every verdict below was reached at this target.

The work item's records were read whole at `66ab4a96`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, both phase records and round 1. No `pr.md` or `pr.<lang>.md` stands yet. `changelog.md` is new in this range, so this round is its first reader, and finding 1 is the one defect found in it.

## Findings

### 1. `changelog.md` tells the release note's reader that no failed start leaves a pseudo-terminal open, and that every case of `describe("the inbox")` gives its hello 5 seconds

```seal
severity: should
location: `seal/threads/1795732582-300-202-258-241-timed-cases-hold-under-load/changelog.md:5-6`
evidence: executed `git grep -n -e "start that fails" -e "neither does a start" -e "failed start" -- seal/threads/1795732582-300-202-258-241-timed-cases-hold-under-load/` at `66ab4a96`, and a Python listing of the cases of `describe("the inbox")` in `apps/desktop/test/daemon.test.ts` with whether each calls `expect(inboxes(` and sets `readyWaitMs`; read the installed patched `src/unix/pty.cc:370-379`, `:713-746`, `:783-799`, and `gaps.md:13`
regression: round-1#1
```

Why it matters: the unit is `changelog.md`, which the fix pass added in `1b68e3ae` while closing round 1's finding 1. The frame and the closing memo say what the patch leaves open (`frame/design.md` *Scope* item 1 closes the master where the spawn failed, and `gaps.md:13` names the returns before the spawn that still leave the spare, and the slave after it was opened). The fix pass wrote the fragment's opening sentence wider than that, so the defect came from the fragment and not from the patch.

The fragment is what the release note is built from at the tag, and its first part stands unfolded at the top of the pull request body. Its sentences are read by people who act on them. The fragment was taken apart sentence by sentence and each was read against the target. Two of them state a universal that the target contradicts.

1. `changelog.md:5` opens with "A pane that ends leaves no pseudo-terminal open in the daemon, and neither does a start that fails." A start that fails before its spawn still leaves the spare terminal open. Every `return;` of `pty_posix_spawn` after its spare loop (`pty.cc:715`, `:720`, `:728`, `:733`, `:739`, `:746`) skips the closes at `done:` (`:793-799`). The two returns after the slave's open (`:739`, `:746`, the `tcsetattr` and the window size) leave the slave open too. `PtyFork` closes the master on all of them, since `err` stays at the `-1` it was given (`:370-379`). The bullet's last sentence, "A start that fails before its spawn can still leave the spare terminal open.", narrows the opening sentence. It names the spare and leaves out the slave, which `gaps.md:13` names.
2. `changelog.md:6` says "The cases of `describe("the inbox")` give their daemon's hello 5 seconds for the first read of the commits." The listing found the option in the cases that compare a whole list of inboxes after a hello that finds a work item, as *Scope* item 6 asks. Most cases of the block do not set it, among them the three that compare inboxes and need no wait, by round 1's reading (`daemon.test.ts:3612`, `:3765`, `:3978`).

The search on the failed start's words printed `changelog.md:5` and `:6`, `frame/plan.md:66`, `frame/questions.md:15` and round 1's own lines. `changelog.md:6` says "`pty.test.ts` pins what a pane and a failed start leave open", which holds, since the case's start is one whose spawn fails. `frame/plan.md:66` and `frame/questions.md:15` say what a failed spawn leaves, and they hold. That search is a sample: a statement of the fact in other words would escape it. The fix below covers both sentences of the fragment and leaves nothing else for the fix pass to repair.

```markdown
- **A pane that ends leaves no pseudo-terminal open in the daemon, and neither does a start whose spawn fails.** The repository patches node-pty 1.1.0 (`patches/node-pty@1.1.0.patch`), as node-pty's later source does. The daemon now closes the pane's slave and the spare terminal node-pty opens at each start, and the master of a start whose spawn failed. A start that fails before its spawn can still leave the spare terminal open, and the pane's slave too where it was already open.
- **For a contributor:** every checkout and worktree needs `pnpm install` once after this change, which builds node-pty again; until then it runs the build that leaks. `pty.test.ts` pins what a pane and a failed start leave open. The fetch cases of `worktrees.test.ts` and `daemon.test.ts` run the fetch again with a longer wait where git had not started its transport in time. The stand-in CLI of the Claude adapter's role launch case writes its error text before its first line. The cases of `describe("the inbox")` that compare the whole list of inboxes after a hello that finds a work item give that hello 5 seconds for the first read of the commits.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: a start whose spawn fails leaves no pseudo-terminal open in the process, and `gaps.md:13` now says what the patch still leaves open. `PtyFork` closes `master` where `err` is not 0, before it throws `posix_spawnp failed.` (installed patched `src/unix/pty.cc:370-379`), as node-pty 1.2.0-beta.18 does (its `pty.cc:408-414`). The close cannot reach a descriptor that is not the master. `pty_posix_spawn` sets `*master` at `:713` before its first `return;` (`:715`), and none of its paths closes the master itself, so `PtyFork` closes it once. Every early return leaves `err` at `-1`, so the same close also takes the master off those paths, as `gaps.md:13` says. The probe of round 1's *Probes* row was written again against the build of the patch at HEAD. Five native `fork` calls with a spawn helper that does not exist each threw `posix_spawnp failed.` and left no descriptor, where round 1 found five `/dev/ptmx` left. Forty sessions of `seq 1 5000` each held line 5000 at their exit, and nothing was left after them. The new case "leaves no pseudo-terminal open in this process after a start whose spawn fails" (`apps/desktop/test/pty.test.ts:89-102`) passed in this round's run with the whole file, 15 cases. Its red form stands in the fix pass's scratch output (read). Against the previous patch's build it failed at `pty.test.ts:101`, the `toEqual([])` line, listing `19 /dev/ptmx`, `20 /dev/ptmx` and `21 /dev/ptmx`. Under `seal mutate`, with the new `close(master);` replaced, it failed on the same line with the same three descriptors. So the case watches the close it names. It covers a path the other case of its group does not reach: that case starts sessions that spawn and end, and no case of `pty.test.ts` failed a spawn before. The patch file's SHA-256 is `8bbdff1a…`, the hash `pnpm-lock.yaml` records, and the install's folder carries the same hash (executed: `shasum -a 256`). The comment round 1 found wrong is corrected: "`count` reaches 3 where no open of the spare loop gave a descriptor of 2 or above, each failing or taking 0 or 1, so the loop stops at index 2." The loop breaks at a descriptor of 2 or above (`low_fds[count] >= STDERR_FILENO`), so the comment now agrees with the code. Executed and read.

What matched: the folds against the code at the target. `frame/design.md` *Scope* item 1 names the close in `PtyFork` beside the closes in `pty_posix_spawn`, and *Scope* item 2 names the two cases, which stand in `pty.test.ts` in the order the item gives (`:69-87` in the `TerminalSession` block, then `:89-102`). `frame/plan.md` *Judgments of the run*, its third row, agrees with the patch and the case. `frame/questions.md` Q3's Status leaves the hosted runner open and reports the fix pass's packaging measurement on this Mac. The fix pass's scratch output agrees with the part of that measurement this round could read: the app's binary as Node mapped the `.app`'s `node-pty/build/Release/pty.node` alone, and it left nothing after three failed starts and eight ended sessions. `gaps.md:7`'s rewrite names the two cases by the words both names open with. Read.

What matched: `frame/plan.md` *Technical context* and *Scope*'s *Out of scope* still say "*Scope* item 2's case", and Q3 says "where *Scope* item 2's case runs", in the singular. Both of item 2's cases stand in `pty.test.ts`, and either one fails on a build that holds the leak, so no reader acts differently on those sentences. This is no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the repository-wide lint and the typecheck, `unverified`. This round ran `pty.test.ts` alone and the probe under *Probes*. Nothing stays open for the code once finding 1 closes, so the orchestrator's broad run and then the sealer's spawn come due. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |
| The `LC_UUID` comparison of `frame/questions.md` Q3's Status. The packaged `.app` no longer stands in the worktree, so this round could not compare its `pty.node` with the patched build and the prebuilt binary. Whether the hosted runner and the packaging job build the patched source is still open. | `frame/questions.md:15`, `gaps.md:7` | the orchestrator, from the pull request's `check` job and the next run of `.github/workflows/package.yml` |
| Whether the account-change group passes in a whole run of the suite beside another test run. | `frame/questions.md` Q1, `gaps.md:8` | the orchestrator, at this work item's broad gate and at the gates of #132, #257 and #127 |

## Probes

| Command | Result |
|---|---|
| `ELECTRON_RUN_AS_NODE=1 sh <scratchpad>/heavy.sh <electron> <scratch>/round-2/test_tmp_failed_start_and_drain.cjs <worktree>`, run once, against the install folder of hash `8bbdff1a…` | exit 0: five native `fork` calls with the spawn helper `/nonexistent/spawn-helper` each threw `posix_spawnp failed.`, and no pseudo-terminal descriptor was left; 40 of 40 sessions of `seq 1 5000` held line 5000 at their exit; nothing was left at the end |
| `cd apps/desktop && OWLERY_BACKGROUND=1 sh <scratchpad>/heavy.sh node scripts/test-in-electron.mjs test/pty.test.ts` | exit 0: 1 file, 15 cases passed |
