# Review round 1: 1795341002-settle-reads-decisions

```seal
target: ef72a61532d653042c05ab1febe76c09945b6868 against origin/release/v0.0.2
```

This round read the whole diff `git diff origin/release/v0.0.2...ef72a61`, whose merge base is `cc0b938`, the commit the branch took in at `9e415bd`. The base has since moved to `b8c1190` (#143). `git merge-tree --write-tree ef72a61 b8c1190` exits 1 on one conflict, in `apps/desktop/package.json`: the branch adds the `settle` script after `role:run`, and #143 adds the `screenshots` script at the same place (executed). Both lines are kept; the merge is the orchestrator's. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md` to `phase-3.md`, each whole at `ef72a61`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. No earlier round exists, so no verdict was carried. Two facts were carried from the frame's *Grounding* and not re-established, since the caller forbade running AgenticSeal's own `seal settle --apply`: that plugin 0.38.4's settle removes in the working tree alone and moves no `HEAD`. This round read `settle.py:2050` (`shutil.rmtree`) and nothing more of it. Compliance came first, then quality, in the clone `1795341002-settle-reads-decisions/round-1/clone` of the scratch directory, at `ef72a61`.

Axes named for this change beyond the table: what `--apply` can remove that a person needs, a run that is interrupted part way and the run after it, the user's git configuration as an input to the guard, a link where a directory or a record should stand, the order of `--list` against `--apply`, Markdown rendering of record text, and the policy's two paragraphs on a block the daemon cannot read, read side by side.

## Findings

### 1. `--apply` does not refuse a kept directory that holds a file not committed where the repository sets `status.showUntrackedFiles` to `no`, and the settle removes that file for good

```seal
severity: should
location: `apps/desktop/src/daemon/settle.ts:214`, `apps/desktop/test/settle.test.ts:372-387`, `seal/threads/1795341002-settle-reads-decisions/changelog.md:10`, `seal/threads/1795341002-settle-reads-decisions/pr.md:11`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the clone's `apps/desktop`, case A; read `apps/desktop/src/daemon/settle.ts:214`, `apps/desktop/src/daemon/settle.ts:240`
```

Why it matters: the guard before the run is `git status --porcelain -- <directory>/` printing a line (`settle.ts:214`). `git status --porcelain` follows the repository's `status.showUntrackedFiles`, and with `no` it prints nothing for a file that is not committed. Case A set that key in a temporary repository whose kept directory `1-a` held a committed `decisions.md` and a `notes.md` not committed. The stand-in removed every directory, and `--apply` exited 1 with an empty error stream. `decisions.md` was put back, and `notes.md` no longer stood. The changelog says "`--apply` refuses before anything runs where a put-back could lose something" (`changelog.md:10`), and `pr.md:11` says the same. Both are untrue under that key. `gaps.md` *Not done* names a file git ignores as the one file the guard does not see; this is a second one, and it is no ignored file. The case at `settle.test.ts:372` holds the file not committed only under git's default configuration.

The fix names the untracked mode on the command line, so the repository's key cannot change the answer. It assumes nothing of the platform beyond git reading `--untracked-files` over its configuration. The case gains a third variant, shown red against the current line (case A of this round's probe is that red).

```ts
// apps/desktop/src/daemon/settle.ts:213-214
/** Whether the directory in the working tree differs from `HEAD`, a file `HEAD` does not hold among it, whatever `status.showUntrackedFiles` the repository sets. */
const differs = (top: string, directory: string): boolean => git(top, "status", "--porcelain", "--untracked-files=all", "--", `${directory}/`) !== "";

// apps/desktop/test/settle.test.ts, a third entry of the `change` list at line 373
      (repo: string) => {
        git(repo, "config", "status.showUntrackedFiles", "no");
        write(repo, "seal/threads/1-a/notes.md", "# Notes\n");
      },
```

The case's title at `settle.test.ts:372` then names the key too. `frame/design.md:46` gives the guard as `git status --porcelain -- <directory>`, and the fix pass owes that sentence the flag.

### 2. A run interrupted while AgenticSeal's settle runs leaves each kept directory removed and names none, and the next run reads the removal as nothing kept

```seal
severity: should
location: `apps/desktop/src/daemon/settle.ts:247-281`, `apps/desktop/src/daemon/settle.ts:127`, `seal/threads/1795341002-settle-reads-decisions/frame/plan.md:27`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the clone's `apps/desktop`, case B; read `apps/desktop/src/daemon/settle.ts:247-281`, `apps/desktop/src/daemon/settle.ts:127`
```

Why it matters: `--apply` prints the kept directories only after the put-back (`settle.ts:262`, `:274`, `:278`). It holds no signal while `spawnSync` waits on the plugin's settle (`settle.ts:250`). A Ctrl-C in the terminal reaches the whole foreground process group. It ends the plugin's settle part way through and ends this command before it puts anything back. Case B ran `scripts/settle.mjs --apply` with a stand-in that removed every directory and then sent `SIGTERM` to its parent. The command ended on `SIGTERM` with nothing on either stream, and the kept directory `1-a`, which holds a reversed decision, no longer stood. The person then has no list of what to restore. Running the command again does not find it either, because `readSettle` reads the directories that stand in the working tree (`settle.ts:127`). The run with no flag printed `Kept no directory.` and exited 0. A second `--apply` printed `Put back no directory.` and exited 0. `git status --porcelain` then showed ` D seal/threads/1-a/decisions.md` beside the closed directory's removal. A settling session that commits that state removes the reversal nobody took in, which is what issue #131 exists to stop. `frame/plan.md:27` rejects moving the directories aside because "a process killed between the two moves leaves the directories outside the tree", and it calls the put-back from `HEAD` lossless. The bytes are in `HEAD`, but no output and no later run says which directory to take back. The killed run also left its bundle folder, `owlery-settle-*` under the system's temporary directory, because the `finally` of `scripts/settle.mjs:18-20` did not run. Phase 1 says no such folder is left (`trail/phases/phase-1.md:29`). This round removed the two its probe runs left.

The fix has three parts, and the snippet covers the first two. First, the command holds SIGINT, SIGTERM and SIGHUP from the plugin's run until the put-back ends. The terminal's signal still ends the plugin's settle, and this process stays to put back. Second, it names each kept directory before the run, so a `SIGKILL`, which no process can hold, still leaves the list on the screen. The precondition is that the terminal sends its signal to the process group. This round did not probe how pnpm passes a signal to the script it starts. Third, a later `--apply` must see a kept directory that an earlier run left removed. The snippet does not cover this part. One way: for each directory that `git ls-tree HEAD <root>/threads/` names and the working tree does not hold, `readSettle` reads `git show HEAD:<directory>/decisions.md` with the same reader. It keeps that directory where the record holds an open row, and the guard at `settle.ts:240` then refuses it as differing from `HEAD`. The fix pass owes a case for each part. It also owes `frame/plan.md:27` and *Scope* item 5 (`frame/design.md:46`) the sentences that say so, and the phase 2 decision that each kept directory is printed once (`trail/phases/phase-2.md:21`) changes with the second part.

```ts
// apps/desktop/src/daemon/settle.ts, in `apply`, replacing lines 247-281
  for (const notice of reading.notices) print.out(`notice ${notice.directory}/${RECORD_FILE}:${notice.line}: ${notice.why}\n`);
  // Named before the settle runs, so a run that is killed leaves the list of what it would have put back.
  for (const kept of reading.kept) print.out(keptLines(`keeping ${kept.directory}/`, kept));

  // A signal from the terminal reaches AgenticSeal's settle and ends it; this process stays to put back. SIGKILL cannot be held.
  const hold = (): void => {};
  const held: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];
  for (const signal of held) process.on(signal, hold);
  try {
    const head = git(top, "rev-parse", "HEAD").trim();
    // ... lines 250-281 as they stand
  } finally {
    for (const signal of held) process.off(signal, hold);
  }
```

### 3. `--list` run after `--apply` lists only the kept directories, and the release's procedure does not say to run it first

```seal
severity: should
location: `docs/roadmap.md:52`, `docs/roadmap.ko.md:52`, `apps/desktop/src/daemon/settle.ts:127`, `seal/threads/1795341002-settle-reads-decisions/changelog.md:8`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the clone's `apps/desktop`, case C; read `docs/roadmap.md:52`, `docs/roadmap.ko.md:52`
```

Why it matters: the list reads the directories that stand in the working tree (`settle.ts:127`). `--apply` leaves standing only the directories it kept. Most of the release's decisions made without asking are in closed directories, and those are the ones the settle removes. Case C ran `--list` on a repository with a kept directory and a closed one, and it listed both decisions. After `--apply` with the removing stand-in, `--list` printed only the kept directory's decision and the count line of its kind. R1 names `--apply` first and `--list` after it (`docs/roadmap.md:52`), and its Korean edition does the same. A settling session that follows it in that order (#49) puts a short list into the release's pull request and note, and nothing warns it. `changelog.md:8` says `--list` is "for the release's pull request and its note", with no order either.

The fix states the order in both editions. The broad gate's two counts stay equal, since no heading and no table row changes. The fix pass owes R1 in `frame/design.md:136` and `:139` the same sentence, and a bullet of `changelog.md` the same order.

The last sentence of the bullet at `docs/roadmap.md:52` becomes these two:

```markdown
`pnpm --filter @owlery/desktop run settle --list` prints the decisions made without asking in the release, which the release's pull request and its note carry. It reads the directories that stand in the working tree, and `--apply` removes every directory it does not keep, so `--list` runs before `--apply`.
```

The last sentence of the bullet at `docs/roadmap.ko.md:52` becomes these two:

```markdown
`pnpm --filter @owlery/desktop run settle --list`는 그 릴리스에서 묻지 않고 내린 결정을 찍고, 릴리스의 PR과 노트가 그것을 싣습니다. 이 명령은 작업 트리에 있는 폴더를 읽고 `--apply`는 남기지 않은 폴더를 모두 지우므로, `--list`는 `--apply`보다 먼저 실행합니다.
```

### 4. `--list` leaves out a decision block the reader refuses and says nothing, so its count lines are short with exit 0

```seal
severity: should
location: `apps/desktop/src/daemon/settle.ts:142`, `apps/desktop/src/daemon/settle.ts:163-181`, `apps/desktop/src/daemon/settle.ts:330-332`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the clone's `apps/desktop`, case E; read `apps/desktop/src/daemon/settle.ts:142`, `apps/desktop/src/daemon/settle.ts:330-332`
```

Why it matters: a release's work item enters the list with `got.decisions` alone (`settle.ts:142`). A block the reader refuses is not among them, and `--list` prints only `listMarkdown` (`settle.ts:330-332`). Case E held one decided decision and one decision block with `state: undone`. `--list` exited 0 with an empty error stream and printed `` - `default`: 1 decision, 0 reversed by the person `` and the one decision. The refused block is a decision made without asking that the release's note does not carry and does not mention. `docs/architecture.md:211` says the daemon "names a block it cannot read". The run with no flag names it as a kept row, but `--list` is the run #49 places in the note, and it does not name it.

The fix names each such block in the list itself, so the note says what it leaves out. `SettleReading.release` gains a field, so the fix pass owes `frame/design.md:102` the same field, and a case shown red against the current code.

```ts
// apps/desktop/src/daemon/settle.ts:37-41
export interface ListedWorkItem {
  id: string;
  pullRequest: number | null;
  decisions: DecisionBlock[];
  /** The 1-based line of each block the reader refuses, which the list names and does not list. */
  refused: number[];
}

// apps/desktop/src/daemon/settle.ts:142
    if (!before.has(directory)) release.push({ id, pullRequest: pullRequestOf(folder, `${directory}/routing.md`), decisions: got.decisions, refused: got.refusals.map((refusal) => refusal.line) });

// apps/desktop/src/daemon/settle.ts:164-172, in `listMarkdown`
  const items = reading.release.filter((item) => item.decisions.length > 0);
  const refused = reading.release.flatMap((item) => item.refused.map((line) => `\`${reading.root}/threads/${item.id}/${RECORD_FILE}:${line}\``));
  if (items.length === 0 && refused.length === 0) return "No decision was made without asking in this release.\n";
  const all = items.flatMap((item) => item.decisions);
  const lines: string[] = [];
  for (const kind of KINDS) {
    // ... the count lines as they stand
  }
  if (refused.length > 0) lines.push(`- Not listed, a block the reader cannot read: ${refused.join(", ")}`);
```

### 5. A link under `threads/` is read as nothing: a `decisions.md` that links to no file reads as no record, and a work item's directory that is a link is skipped without a word

```seal
severity: should
location: `apps/desktop/src/daemon/settle.ts:71-92`, `apps/desktop/src/daemon/settle.ts:8-9`, `seal/threads/1795341002-settle-reads-decisions/changelog.md:6`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the clone's `apps/desktop`, case D; read `apps/desktop/src/daemon/settle.ts:71-92`
```

Why it matters: the module says "a `decisions.md` that stands and cannot be opened stops the reading" (`settle.ts:8-9`). `recordText` reads `ENOENT` as no file (`settle.ts:89`), and a link whose target does not stand gives `ENOENT`. `directoriesIn` keeps an entry only where `isDirectory()` holds (`settle.ts:74`), and a link to a directory is a link and no directory. Case D committed `1-a/decisions.md` as a link to a file that does not stand, and `2-b` as a link to a directory whose `decisions.md` holds a reversed decision. `readSettle` threw nothing and returned no kept directory and no notice. The release listed `1-a` alone. The run with no flag printed `Kept no directory.` and exited 0. So the reversal behind `2-b` is neither kept nor named, and the record at `1-a` that stands and cannot be read is read as one with nothing open. Phase 1's decision rules that reading out (`trail/phases/phase-1.md:13`). Git commits a link as a link, so a work item's records can hold one.

The fix stops the reading on either, as it stops on a record that cannot be opened. It assumes `lstat` reports a link without following it, as it does on macOS and Linux.

```ts
// apps/desktop/src/daemon/settle.ts:19
import { accessSync, constants, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";

// apps/desktop/src/daemon/settle.ts:70-81, called as `directoriesIn(folder, threads)` at line 127
/** The names of the directories under `threads` in the folder, in order, or none where it does not stand. A link there stops the reading, naming it: it is no directory, and a work item's record may stand behind it. */
function directoriesIn(folder: string, threads: string): string[] {
  let entries;
  try {
    entries = readdirSync(join(folder, threads), { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const link = entries.find((entry) => entry.isSymbolicLink());
  if (link !== undefined) throw new Error(`${threads}/${link.name} is a link, and the settle reads a work item's directory only where one stands`);
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

// apps/desktop/src/daemon/settle.ts:89, in `recordText`
    if (code === "ENOENT") {
      try {
        lstatSync(join(folder, path));
      } catch {
        return null;
      }
      throw new Error(`${path} cannot be read: it is a link to nothing`);
    }
```

`changelog.md:6` names "a `decisions.md` that cannot be opened" as a stop, and with the fix it holds. The fix pass owes a case for each link, each shown red against the current code (case D of this round's probe is that red).

### 6. The new P10 sentence keeps a directory for a block the daemon cannot read, and P9, the paragraph above it, says the daemon decides nothing on such a block

```seal
severity: should
location: `docs/architecture.md:211`, `docs/architecture.md:214`, `docs/architecture.ko.md:211`, `docs/architecture.ko.md:214`
evidence: read `docs/architecture.md:211`, `docs/architecture.md:214`, `docs/architecture.ko.md:211`, `docs/architecture.ko.md:214`, `seal/threads/1795341002-settle-reads-decisions/frame/design.md:11`
```

Why it matters: P9 says the daemon "names a block it cannot read without deciding anything on it" (`docs/architecture.md:211`). The Korean edition says "읽지 못한 블록은 읽지 못했다고 밝힐 뿐 그것으로 아무것도 정하지 않습니다" (`docs/architecture.ko.md:211`). R2 now says such a block is an open row, and "a release's settle keeps the work item's directory while its record holds one" (`:214` of each). Keeping a directory is a decision made on the block. An agent that builds the next reader of these blocks, as #136 does, reads two answers in adjacent paragraphs. The frame's *Grounding* row (`frame/design.md:11`) quotes P9 as "is named and decides nothing" and then keeps on a refused block, so the tension was in the frame and not written out of the policy. What the build means is that the daemon takes no value from such a block.

The fix rewrites P9's clause in both editions so that both paragraphs hold. Neither the counts nor the check lines change. This edits a paragraph the frame's `## Data & interfaces` does not name, so the fix pass owes the frame an entry R3 for it.

The sentence of `docs/architecture.md:211` that opens "The daemon reads the file" becomes:

```markdown
The daemon reads the file in the work item's worktree, whether or not it is committed, and names a block it cannot read without taking any value from it.
```

The sentence of `docs/architecture.ko.md:211` that opens "데몬은 작업의 워크트리에서" becomes:

```markdown
데몬은 작업의 워크트리에서 이 파일을 커밋 여부와 상관없이 읽고, 읽지 못한 블록은 읽지 못했다고 밝힐 뿐 그 블록의 값은 하나도 쓰지 않습니다.
```

### 7. The list writes each value of the record into Markdown as it stands, so text the record holds literally, such as a placeholder in angle brackets, is rendered as markup in the pull request and the note

```seal
severity: should
location: `apps/desktop/src/daemon/settle.ts:154`, `apps/desktop/src/daemon/settle.ts:176-178`
evidence: read `apps/desktop/src/daemon/settle.ts:150-155`, `apps/desktop/src/daemon/settle.ts:176-178`, `apps/desktop/src/daemon/decision-record.ts:186-205`
```

Why it matters: in `decisions.md` each value stands inside a `seal` fence, where a renderer shows it as typed. `listMarkdown` writes `decided`, `grounds`, `by` and the person's message into list items with nothing escaped (`settle.ts:176-178`, `:154`). By the CommonMark and GitHub Flavored Markdown specifications, `<ref>` there is a raw inline HTML tag, and GitHub's sanitiser drops a tag it does not allow, so the word vanishes. `*a*` becomes emphasis. A person's reversal message is free text, and an agent's `decided` line in this repository often names a placeholder in angle brackets. The release's note then says something other than what the record holds. This round did not render the list; it is read from the specifications. `gaps.md:8` leaves rendering to #49, but the text the command prints is this work's.

The fix escapes, outside code spans, each character the specifications read as markup. It keeps the code spans the records already use, as the case at `settle.test.ts:113` shows (`` `origin` ``). The code-span pattern takes a run of backticks to the next run of the same length, as the specifications do. A run that never closes is escaped like any other character. The case at `settle.test.ts:235` still holds, since its values hold no such character and the home stays inside the state's code span. The fix pass owes a case with `<ref>` and `*a*` in a `decided` line and a message, shown red against the current code.

```ts
// apps/desktop/src/daemon/settle.ts, beside `stateOf`
/** A run of backticks to the next run of the same length, or one character the Markdown specifications read as markup. */
const MARKUP = /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)|[\\`*_[\]<>&~|#]/g;

/** A record's value as Markdown that shows what the record holds: its code spans as they stand, and each other markup character escaped with a backslash. */
function literal(value: string): string {
  return value.replace(MARKUP, (match: string, ticks: string | undefined) => (ticks === undefined ? `\\${match}` : match));
}

// apps/desktop/src/daemon/settle.ts:154
  return `\`${word}\`: ${literal(state.message)}`;

// apps/desktop/src/daemon/settle.ts:176-177
      lines.push(`- Decision ${decision.id}, \`${decision.kind}\`: ${literal(decision.decided)}`, `  - Grounds: ${literal(decision.grounds)}`);
      if (decision.by !== null) lines.push(`  - By: ${literal(decision.by)}`);
```

## Confirmations

What matched: scenarios 1 to 10 of `frame/design.md:82-91` each stand as a case of `apps/desktop/test/settle.test.ts`, at lines 77, 106, 123, 149, 167, 225 and 262, 320, 372, 389, 419 (read). `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts test/decision-record.test.ts` in the clone's `apps/desktop` exited 0, 2 files and 74 cases (executed). That matches phase 3's boundary run (`trail/phases/phase-3.md:23`).

What matched: scenario 12 at the target. `pnpm --filter @owlery/desktop run settle` in the clone exited 0 and printed `Kept no directory.`, `The release's work items are those added since v0.0.1.` and `No decision was made without asking in this release.`. `git status --porcelain` printed nothing after it (executed). Phase 1 ran it at `7f2c20e` alone (`trail/phases/phase-1.md:62`); this is its first run after phase 2.

What matched: scenario 11. `git grep -n -F "git grep -n -E '^state: (reversed|open)" -- docs apps` printed nothing and exited 1 at the target (executed).

What matched: R1 in `docs/roadmap.md:52` and `docs/roadmap.ko.md:52` is, line for line, the text `frame/design.md:136` and `:139` give. R2's sentences stand in `docs/architecture.md:214` and `docs/architecture.ko.md:214` as `frame/design.md:146` and `:148` give them (executed, a comparison of each line). Each P10 check line gains `apps/desktop/test/settle.test.ts` (read).

What matched, the row of `gaps.md:11` that names this round: the links' anchors. `docs/roadmap.md:32` is `### Why this order` and `:45` is `### Releases and the tracker`. `docs/roadmap.ko.md:32` is `### 이 순서인 까닭` and `:45` is `### 릴리스와 트래커`. No heading of either file repeats those words, so GitHub gives no numbered suffix. The tree already links a Korean heading the same way, as `roadmap.ko.md#마일스톤` at `docs/architecture.ko.md:219`. "Ground 4" and "넷째 근거" name the ground on the AgenticSeal plugin sealing Owlery's pull requests until milestone 2 (`docs/roadmap.md:39`, `docs/roadmap.ko.md:39`) (read). The links were read and not rendered.

What matched: `seal rules --check --root .` in the clone printed `seal rules: all 30 check lines in 8 rule files hold.` and exited 0. `seal rules docs/roadmap.md` reads R1's indented check line at line 53 under *Releases and the tracker* (executed). That bears out phase 3's reading of an indented check line (`trail/phases/phase-3.md:7`).

What matched: phase 3's claim that the removed case's carriage-return guard is still held. The case "keeps the line ends of a record whose lines end with a carriage return and a line feed" stands at `apps/desktop/test/decision-record.test.ts:353`, and its line 356 asserts no stray line end (read). The mutation phase 3 ran was not run again.

What matched: the exits of *Scope* item 6. `exitOf` reads an error as 2, a signal as 2, and an exit other than 0 and 1 as 2 (`settle.ts:217-227`). A moved `HEAD`, or one git cannot read, puts nothing back and exits 2 (`settle.ts:255-265`). A failed checkout is named, and the loop goes on to the next (`settle.ts:268-279`). The exit is `Math.max` of the settle's exit and the reading's (`settle.ts:281`) (read; the cases at `settle.test.ts:336`, `:389` and `:402` passed in the run above, executed).

What matched: a large record. Case G of the probe read a `decisions.md` of 9,177,816 bytes holding 100,000 decision blocks in 520 ms, and listed all 100,000 (executed). No finding comes from size.

What matched: the account in `changelog.md` and `pr.md` against the code, findings 1, 3 and 5 aside. The wording of a kept row and of each refusal is as `changelog.md:5`, `:10` and `:11` quote it (`settle.ts:133-138`, `:240-244`, `:262`). A repository without a records root prints `The repository holds no records root.` and exits 0 (`settle.ts:335`, `:345`). `--list` exits 0 (`settle.ts:330-332`) (read).

Seen and not raised. `exitOf` prints "did not run" for any `ran.error` (`settle.ts:219`). That includes `ENOBUFS`, where the plugin's settle ran and was killed after printing more than the 64 MiB buffer (`settle.ts:250`). That much output is not plausible from the plugin's settle. `scripts/settle.mjs` exits 1 where esbuild or the bundle throws. Exit 1 is the code *Scope* item 4 gives to a run that kept a directory, and the stack trace on the error stream tells them apart. Neither is a defect the release would ship.

## Not judged

| What | Location | Who answers |
|---|---|---|
| `--apply` run with AgenticSeal's own `seal settle --apply`. The caller forbade that run, and this round ran only the suite's stand-in. The facts that it removes in the working tree alone and moves no `HEAD` are carried from the frame's probe of plugin 0.38.4 | `seal/threads/1795341002-settle-reads-decisions/frame/design.md:21-22`, `seal/threads/1795341002-settle-reads-decisions/gaps.md:9` | The release's settling session (#49) |
| How pnpm passes a terminal's signal to the script it starts, which finding 2's fix assumes reaches the process group | `apps/desktop/package.json`, `apps/desktop/scripts/settle.mjs` | The fix pass for finding 2 |
| A write to a `decisions.md` between `readSettle`'s reading and the plugin's removal, such as a reversal the person makes during the settle. The reading and the guard run before the plugin's settle, and nothing reads the records again before it removes | `apps/desktop/src/daemon/settle.ts:324-325`, `apps/desktop/src/daemon/settle.ts:240-250` | The orchestrator, who decides whether a settle runs while sessions write records |
| The list as GitHub renders it in a pull request body and a release note, beyond finding 7's reading of the specifications | `seal/threads/1795341002-settle-reads-decisions/gaps.md:8` | #49, which places the list |
| The merge with `b8c1190`: one conflict in `apps/desktop/package.json`'s scripts, where both sides add a line after `role:run` | `apps/desktop/package.json:17-18` | The orchestrator |
| The whole suite, the typecheck and the broad gate at the target. The suite stands `unverified`, as `gaps.md:7` and `:10` label it, and that label is honest: no phase claims the broad gate passed | `seal/threads/1795341002-settle-reads-decisions/gaps.md:7`, `seal/threads/1795341002-settle-reads-decisions/gaps.md:10` | The orchestrator's broad gate, after the review rounds |

## Probes

| Command | Result |
|---|---|
| `git merge-tree --write-tree ef72a61 b8c1190` | exit 1; `CONFLICT (content): Merge conflict in apps/desktop/package.json` |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/settle.test.ts test/decision-record.test.ts`, in the clone's `apps/desktop` | exit 0; 2 files, 74 cases passed |
| `pnpm --filter @owlery/desktop run settle`, in the clone | exit 0; `Kept no directory.`, the release since `v0.0.1`, no decision; `git status --porcelain` empty after |
| `git grep -n -F "git grep -n -E '^state: (reversed\|open)" -- docs apps`, in the clone | exit 1; nothing printed |
| `seal rules --check --root .`, in the clone | exit 0; `all 30 check lines in 8 rule files hold.` |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts`, in the clone's `apps/desktop` | The first run wrote its reports to the console, which the runner does not show, so the reports were redirected to a file and the file ran a second time. Exit 0, 6 cases. A: under `status.showUntrackedFiles=no`, `--apply` exited 1 with no refusal, and the file not committed in the kept directory was gone. B: `scripts/settle.mjs --apply` killed by `SIGTERM` from the stand-in printed nothing, `1-a` was gone, the run with no flag printed `Kept no directory.` (exit 0), a second `--apply` printed `Put back no directory.` (exit 0), and `git status --porcelain` showed ` D seal/threads/1-a/decisions.md`. C: `--list` listed two directories before `--apply` and one after it. D: a `decisions.md` linked to nothing and a linked directory holding a reversal gave no kept directory, no notice and no throw, and exit 0. E: `--list` with a refused decision block exited 0, with an empty error stream and a count of 1. G: 9,177,816 bytes, 100,000 decisions, read in 520 ms. The probe file stands in the clone under the scratch directory `1795341002-settle-reads-decisions/round-1/` |
