# Review round 2: 1795341002-settle-reads-decisions

```seal
target: 79bac46dc5769f80a4c21251cb373776dc37b4e5, fixes a71c67e..79bac46
```

This is a verifying round. It read the diff `git diff a71c67e 79bac46`, the fixes since round 1's record, and the merge `a063552` of `b8c1190` within it. It answers round 1's seven closes. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `79bac46`, and `trail/phases/phase-2.md` again; the fold row of `frame/plan.md` says the phase records keep the facts of their own commits. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The round worked in the clone `1795341002-settle-reads-decisions/round-2/clone` of the scratch directory, at `79bac46`. It ran round 1's probe cases A to E again, written anew with the closes' edges, from round 1's `## Probes` row.

Carried and not re-established: the frame's *Grounding* facts that plugin 0.38.4's settle removes in the working tree alone and moves no `HEAD`. The caller forbade running AgenticSeal's own `seal settle --apply`, and this round did not run it. Every case and probe ran a stand-in named `seal` instead.

The fix pass's `seal mutate` runs were not repeated, except one. A probe broke the `HEAD` reading of `readSettle` alone. Under it, the killed-run case of `apps/desktop/test/settle.test.ts` killed the test runner and printed no report. Finding 1 is that case.

## Findings

### 1. The killed-run case reruns `--apply` in the test runner's own process with the stand-in that sends SIGKILL to its process group, so the regression it guards kills the runner instead of failing the case

```seal
severity: should
location: `apps/desktop/test/settle.test.ts:562`, `apps/desktop/test/settle.test.ts:571-576`
evidence: executed `OWLERY_BACKGROUND=1 python3 -c 'import os,sys; os.setsid(); os.execvp(sys.argv[1], sys.argv[1:])' node scripts/test-in-electron.mjs test/settle.test.ts -t "leaves on the screen"` in the clone's `apps/desktop`, with the `HEAD` reading broken at `apps/desktop/src/daemon/settle.ts:212`, then with the snippet below applied, then with `settle.ts` restored; read `apps/desktop/test/settle.test.ts:420-427`, `apps/desktop/test/settle.test.ts:560-577`
regression: round-1#2
```

Why it matters: the unit is the case at `settle.test.ts:560`, which `9a20d96` added for round 1's finding 2. *Scope* item 5 of `frame/design.md` says a kept directory that a killed run left removed is refused as differing from `HEAD`. The fix pinned that by rerunning `--apply` after the killed run. That rerun reuses the stand-in that line 562 installed for the script's run. The defect came from that reuse.

Line 562 puts first on the path a stand-in that ends with `kill -s KILL 0`, which sends SIGKILL to the stand-in's whole process group. The first run is safe: `scriptApply` starts the script with `detached: true`, so the script leads a group of its own. The rerun at line 571 is `run(repo, "--apply")`, which calls `command` inside the test runner's process. That stand-in is still first on the path there. Where the refusal holds, the stand-in never runs, so the case passes. The case exists to catch the refusal failing. Then `--apply` spawns the stand-in with `spawnSync`, and the stand-in shares the test runner's group: vitest, Electron, `test-in-electron.mjs` and the shell that started them.

This round broke the `HEAD` reading alone. The case was run in a session of its own, which a group kill cannot cross. The run exited 137 and printed no test result. Earlier, the same mutation run without a session of its own ended this round's shell command with no output at all. Under the broad gate, `pnpm -r run check`, that regression would surface as a killed run that names no failing case, and it would end the caller's process group with it. With the snippet below, the same mutation fails the case at the new `seal.ran()` line, and the code as it stands passes all 24 cases of the file (executed).

The class is every stand-in in the file that sends a signal, listed by `grep -n kill` over the file. Line 469 kills only itself (`kill -9 $$`). Line 551 sends its signal to a group that `scriptApply` made. Line 562 is the only one that a run in the test runner's process can reach. The snippet covers it. The case's title stays true.

```ts
// apps/desktop/test/settle.test.ts, in the case at line 560, replacing lines 570-571
    expect(existsSync(join(repo, "seal/threads/1-a"))).toBe(false);
    // The run in this process gets a stand-in that kills nothing: one that sent SIGKILL to its group here would end the test runner's group, not fail the case.
    const seal = standIn(REMOVE_ALL);
    const again = run(repo, "--apply");
    expect(seal.ran()).toBe(false);
```

```seal
verdict: fixed 5efbf83
answer: The snippet stands as the round gave it, at `apps/desktop/test/settle.test.ts:571-574`. The rerun of `--apply` in the test runner's process now gets a stand-in that removes and kills nothing, and the case asserts that it did not run. The case was seen red with only the guard it names removed: `seal mutate` broke the `HEAD` reading of `readSettle` (`rows.length > 0` to `rows.length < 0` in the loop over the records `HEAD` holds), and ran the case through a script that starts it in a child leading a session of its own, so a group kill could not reach the caller. The verdict was `red`, failing at `test/settle.test.ts:574` on `expected true to be false`, with no runner killed. The class is the one the round listed by `grep -n kill` over the file. At `5efbf83`, line 469 kills only itself, line 551 runs only under `scriptApply`, and line 562's stand-in now reaches only the `scriptApply` run.
```

### 2. `pr.md` says every link inside the records stops the reading and every record value is written as text, and the code stops on three kinds of link and keeps the record's code spans as Markdown

```seal
severity: should
location: `seal/threads/1795341002-settle-reads-decisions/pr.md:13`, `seal/threads/1795341002-settle-reads-decisions/changelog.md:6`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts -t "D: links"` in the clone's `apps/desktop`, case D; executed `PYENV_VERSION=3.13.5 markdown-it probe-list.md` on case H's list; read `apps/desktop/src/daemon/settle.ts:76-121`, `apps/desktop/src/daemon/settle.ts:192-198`, `apps/desktop/src/daemon/settle.ts:228-233`
regression: round-1
```

Why it matters: the unit is the paragraph `a20f63a` added to `pr.md` to say what round 1's fixes made true. *Scope* items 1 and 3 of `frame/design.md` name which links stop the reading and say a code span stands as it is. The paragraph widened both. `pr.md` is the pull request's body, and the sealer and the reviewer read it as the account of the change.

The paragraph says "A link inside the records stops the reading, named, with exit 2". Case D committed a `decisions.md` that links to a file holding a reversed decision. The run exited 1 and kept the directory for that decision, since `recordText` reads through a link that leads to a file (`settle.ts:110-120`). A `notes.md` that links to nothing, beside a closed record, gave `Kept no directory.` and exit 0. The stops are those *Scope* item 1 lists. They are a link where a work item's directory stands (`settle.ts:100`), a `threads/` or a `decisions.md` that links to nothing (`settle.ts:76-83`), and a directory or a `decisions.md` that `HEAD` holds as a link where the working tree lacks the record (`settle.ts:193-195`).

The paragraph also says `--list` "writes every record value as text, not Markdown". `literal` keeps each code span of a value as it stands (`settle.ts:228-233`), and a `carried` home goes through `code`. Case H's list, rendered by markdown-it-py's CommonMark parser, shows each of those spans as `<code>`. Each value reads as the record holds it, which is what the changelog says at `changelog.md:7`.

The colon after "as the release's procedure now says" leads into these two facts, and neither is the reason the order matters. The reason is that `--list` reads the directories in the working tree, and `--apply` removes those it does not keep. The snippet gives it.

`changelog.md:6` lists the exits 2 for records it cannot read, and the list leaves out the link `HEAD` holds. The snippet adds it. The module comment at `settle.ts:9-11` leaves it out too, and only a person who edits the code reads it.

The paragraph at `pr.md:13` becomes:

```markdown
**Run `--list` before `--apply`**, as the release's procedure now says: `--list` reads the directories that stand in the working tree, and `--apply` removes every directory it does not keep. `--list` names a block the reader cannot read on the error stream and exits 1. It escapes what Markdown reads as markup in each record value and keeps the record's code spans, so the list shows each value as the record holds it. The reading stops with exit 2 and names the link where a work item's directory is a link, where a `threads/` or a `decisions.md` links to nothing, and where `HEAD` holds a directory or a `decisions.md` as a link that the working tree lacks.
```

The second sentence of the bullet at `changelog.md:6` becomes:

```markdown
It exits 2 where it cannot read the records: a `decisions.md` that cannot be opened, a link where a work item's directory stands, a `decisions.md` or a `threads/` that links to nothing, a directory or a `decisions.md` that `HEAD` holds as a link where the working tree lacks the record, or a `--since` ref that git cannot resolve.
```

```seal
verdict: fixed a72454a
answer: Both snippets stand as the round gave them. The orchestrator wrote the paragraph at `pr.md:13` in `7107e7f`. This pass wrote the sentence at `changelog.md:6` in `a72454a`, and each line matches its snippet exactly (executed, a comparison of the strings). The same commit names the link `HEAD` holds in the module comment of `settle.ts`, lines 9-14, which the round named as leaving it out. That comment and *Scope* item 1 of `frame/design.md` now list the same four stops. The other statements of the link stops and of how a value is written were found by `git grep` on their words over the tree outside the round records: `settle.ts`, `test/settle.test.ts`, `changelog.md`, `pr.md` and `frame/design.md:42`. None of them contradicts the code at `a72454a`. That search is a sample.
location: `seal/threads/1795341002-settle-reads-decisions/changelog.md`, `apps/desktop/src/daemon/settle.ts`
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `differs` passes `--untracked-files=all` (`apps/desktop/src/daemon/settle.ts:311`). Case A set `status.showUntrackedFiles` to `no` and left a `notes.md` uncommitted in the kept directory `1-a`. `--apply` exited 2 and named `seal/threads/1-a/ differs from HEAD`, then `settle: --apply ran nothing.`. The stand-in did not run, and `notes.md` still stood (executed). The refusal case at `apps/desktop/test/settle.test.ts:490` holds the third variant and passed in the narrow run. `frame/design.md:46` names the flag (read).

```seal
confirms: round-1#2
```
What holds, executed through the package's script. Case B sent SIGTERM to the script alone while the stand-in ran, as round 1 did. The script printed `keeping seal/threads/1-a/` with its row before the settle's output. It then printed `put back seal/threads/1-a/` and `Put back 1 directory.`, exited 1, and left `1-a` as `HEAD` holds it and `2-b` removed. In round 1 the same run ended on SIGTERM with nothing printed. Case B2 sent SIGKILL. The `keeping` line stood on the output. The run with no flag then printed `kept seal/threads/1-a/` from the record `HEAD` holds and exited 1, and `--apply` refused `1-a` as differing and exited 2. After `git checkout HEAD -- seal/threads/1-a/`, `--apply` ran and put it back. In round 1 the second run printed `Kept no directory.` and exited 0. With `TMPDIR` set to an empty folder, cases B, B2 and B3 (a plain `--list`) left it empty. The script bundles with `write: false` and runs the bundle through `runInThisContext` (`apps/desktop/scripts/settle.mjs:13-17`). None of the modules it bundles uses `import.meta`, `__dirname` or `__filename` (executed, `grep`). The held signals are `HELD` at `settle.ts:362`. They are held from just after the `keeping` lines to the end of the put-back (`settle.ts:350-358`). The case at `settle.test.ts:548` passed for each of the three. Finding 1 is a defect in the case this fix added, not in the fix.

```seal
confirms: round-1#3
```
What holds: R1 in `docs/roadmap.md:52` and `docs/roadmap.ko.md:52` ends with the two sentences round 1 gave, and they match `frame/design.md:136` and `:139` (read, a comparison of the lines). `changelog.md:8` says `--list` runs before `--apply` (read).

```seal
confirms: round-1#4
```
What holds: case E held one decided decision and one block with `state: undone`. `--list` exited 1. It printed ``- Not listed: 1 block the reader cannot read (`seal/threads/1-a/decisions.md:14`)`` after the count line, and put `settle: not listed seal/threads/1-a/decisions.md:14: the reader refuses the line: …` on the error stream (executed). `listMarkdown` gives a release whose only block is refused the not-listed line and not `No decision was made without asking in this release.` (`settle.ts:258-269`, read). The case at `settle.test.ts:342` pins both. `frame/design.md:102` gives `refused: KeptRow[]` (read).

```seal
confirms: round-1#5
```
What holds: case D. A `decisions.md` that links to nothing exited 2 with `seal/threads/1-a/decisions.md cannot be read: it is a link to nothing`. A work item's directory that is a link to a directory holding a reversal exited 2 with `seal/threads/2-b is a link, and the settle reads a work item's directory only where one stands` (executed). In round 1 both read as nothing and exited 0. The case at `settle.test.ts:149` holds these two and a `threads/` that links to nothing. The case at `:211` holds the links `HEAD` holds. Finding 2 is about the account in `pr.md`, not this close.

```seal
confirms: round-1#6
```
What holds: P9 reads "names a block it cannot read without taking any value from it" at `docs/architecture.md:211`, and "읽지 못한 블록은 읽지 못했다고 밝힐 뿐 그 블록의 값은 하나도 쓰지 않습니다" at `docs/architecture.ko.md:211`. P10 at `:214` of each keeps the directory for such a block, and the two paragraphs now agree in both editions. R3 at `frame/design.md:150-154` gives both sentences (read).

```seal
confirms: round-1#7
```
What holds: case H wrote five values into one record. They held an HTML tag, an entity, emphasis, a link, an image, strikethrough, a pipe, a hash, a backslash at the end, several code spans, a run of backticks that never closes, a backslash before a backtick, an autolink, an HTML comment, and the openers of a list, a quote and a heading underline. markdown-it-py's CommonMark parser (Python 3.13.5) rendered the list. In every value, the visible text is what the record holds, and each code span the parser found renders as `<code>`. The escaper's code-span pattern and the parser read the same spans, the third value's spans among them (executed). The case at `settle.test.ts:362` pins the text.

What matched: the merge `a063552`. `git show --remerge-diff a063552` shows one conflict, in `apps/desktop/package.json`. It was resolved by keeping both the `settle` line and the `screenshots` line, as round 1 expected. Every other file `git diff b8c1190 a063552` names is the branch's own, and each has the same blob as at `a71c67e` (executed).

What matched: the narrow run. `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts test/decision-record.test.ts` in the clone's `apps/desktop` exited 0, 2 files and 80 cases (executed). No built-app file ran.

What matched: scenario 12 at the target. `pnpm --filter @owlery/desktop run settle` and `settle --list` in the clone each exited 0 and printed `No decision was made without asking in this release.`. `git status --porcelain` showed only this round's probe file after them (executed).

What matched, the frame's fold at `0ede583` against the code: *Scope* items 1, 3, 4 and 5 and the four git questions of *Data & interfaces* (`frame/design.md:114`) say what `settle.ts` and `settle.mjs` do at the target (read).

What matched: `gaps.md`. Its diff since `a71c67e` rewords the first row in place and adds the row on a Ctrl-C typed through pnpm. It adds two paragraphs to *Not done*. No row leaves (executed, `git diff`). The row that names the proofer for the anchors of R1's and R2's links stands open. Round 1 answered it by reading, and its words, "read against the headings' text and not rendered", stay true.

What matched: each case the fixes add covers what no other case of its group covers. These are the link stops (`settle.test.ts:149`), the record `HEAD` holds (`:211`), the refused block in the list (`:342`), the escaping (`:362`), the held signals (`:548`), the killed run (`:560`), and the third variant of the refusal (`:490`) (read).

Seen and not raised. `readSettle` now asks `git ls-tree HEAD` on every run, so a records root in a repository with no commit exits 2 with `git ls-tree -r -z HEAD -- seal/threads/ failed` (case I, executed). The docstring at `settle.ts:176` says it throws where git cannot read `HEAD`. A repository with no commit holds no released work item. A Ctrl-C typed during the put-back reaches `git checkout` too, since it is in the same group. That checkout fails, its directory is named as not put back with exit 2, and the next run keeps it from `HEAD` (read, not probed). Nothing is lost without a name.

## Not judged

| What | Location | Who answers |
|---|---|---|
| `--apply` run with AgenticSeal's own `seal settle --apply`. The caller forbade that run, and this round ran only stand-ins. The facts that it removes in the working tree alone and moves no `HEAD` are carried from the frame's probe of plugin 0.38.4 | `seal/threads/1795341002-settle-reads-decisions/gaps.md:9` | The release's settling session (#49) |
| A Ctrl-C typed in a terminal through `pnpm --filter @owlery/desktop run settle --apply`, and a SIGHUP from a closed terminal while the put-back still writes its lines to that terminal. This round sent signals to process groups alone | `seal/threads/1795341002-settle-reads-decisions/gaps.md:11`, `apps/desktop/src/daemon/settle.ts:350-362` | The release's settling session (#49) |
| The list as GitHub renders it, beyond the CommonMark parser of finding 7's confirmation. GitHub's own extensions are outside the escaped set: `@name` mentions, which notify, `#N` references, `:name:` emoji codes and `$` math | `seal/threads/1795341002-settle-reads-decisions/gaps.md:8`, `apps/desktop/src/daemon/settle.ts:228` | #49, which places the list |
| The whole suite, the typecheck and the broad gate at the target. The suite stands `unverified`, as `gaps.md:7` and `:10` label it, and the label is honest: no record claims the broad gate passed | `seal/threads/1795341002-settle-reads-decisions/gaps.md:7`, `seal/threads/1795341002-settle-reads-decisions/gaps.md:10` | The orchestrator's broad gate, after the review rounds |

## Probes

| Command | Result |
|---|---|
| `git show --remerge-diff a063552`; `git diff --name-only b8c1190 a063552` against `git diff --name-only cc0b938 a71c67e`, and each file's blob at `a063552` against `a71c67e` | One conflict, in `apps/desktop/package.json`, resolved with both lines; the same files, and every blob but `package.json` the same |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts test/decision-record.test.ts`, in the clone's `apps/desktop` | exit 0; 2 files, 80 cases passed |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts`, in the clone's `apps/desktop` | exit 1, 7 of 8 cases. Case D failed on the probe's own fixture, which made a link in a `threads/` that did not stand. Its fixture was corrected, and it ran alone with `-t "D: links"`, exit 0. The results are under each confirmation: A, B, B2, B3, D, E, H, and I (a repository with no commit exits 2) |
| `PYENV_VERSION=3.13.5 markdown-it probe-list.md`, on case H's list | Each value's visible text is the record's; each code span renders as `<code>` |
| `pnpm --filter @owlery/desktop run settle` and `settle --list`, in the clone | exit 0 each; `No decision was made without asking in this release.` |
| The `HEAD` reading broken at `settle.ts:212` together with two other mutations, the untracked flag removed and SIGHUP taken out of `HELD`; `test/settle.test.ts` run in this round's shell | The shell command ended with no output: the killed-run case's rerun spawned the stand-in that kills its group. No result of the other two mutations was read |
| The `HEAD` reading broken alone; `-t "leaves on the screen"`, run in a session of its own through `os.setsid` | exit 137, no test result printed |
| The same, with finding 1's snippet applied to the case; then `settle.ts` restored and the whole file run | exit 1, failing at the new `seal.ran()` line; then exit 0, 24 cases. The clone's `settle.ts` and `settle.test.ts` were restored with `git checkout` |

The probe file stands at `1795341002-settle-reads-decisions/round-2/clone/apps/desktop/test/test_tmp_round2.test.ts` under the scratch directory. It was removed after the runs by mistake and written back from the round's copy.
