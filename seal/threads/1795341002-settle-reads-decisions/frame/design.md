# Design: 1795341002-settle-reads-decisions

The ticket is issue #131. #40 puts a work item's decisions made without asking and its questions in `decisions.md`, as `seal` blocks with a state. A `reversed` decision and an `open` question are open rows of the record. The settle that clears a release's records is AgenticSeal's `seal settle --apply`, which does not read `decisions.md`, so it removes a directory whose reversal nobody took in. The issue asks for three things. The release's settle keeps each such directory and names it. It lists the release's decisions made without asking for the release's pull request and note (#49). It runs from Owlery and reads the blocks with #40's reader, and `docs/roadmap.md` names it in the release's procedure.

## Grounding

The tree as read at `2379a6f`, this branch's head, cut from `release/v0.0.2` at `cbb2e69`. #40 has not merged. Its branch `feat/40-connecting-a-repository-creates-no-records-place` was read at `85b6c50`, and every coordinate below that names #40's text or code is a claim about that commit. The branch moved to `1832417` while this frame was written, and the build reads #40 as merged (`frame/plan.md` *Overlap with the release*).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Records are committed to the repository*, the paragraphs #40 writes as P9 and P10 (lines 211 and 214 at `85b6c50`, the same lines of `docs/architecture.ko.md`) | A `reversed` decision and an `open` question are open rows of the record, and a settle keeps the work item's directory while one stands. A release's pull request lists the decisions made without asking in that release, read from the same blocks. A block the daemon cannot read is named, and the daemon takes no value from it (P9 as R3 words it). P10 states the keep as a `git grep` of two states, which this work replaces with the command (*Scope* item 8) |
| `docs/architecture.md` *What we take from AgenticSeal*, the row on the scripts behind the `seal` commands as #40 writes it (P2) | The daemon runs no Python. It reads and writes the records in its own code, and the issue that builds each of the other commands' work decides how. This issue builds the settle's reading of the decisions, so it decides it: in TypeScript, with #40's reader |
| `docs/architecture.md` *What we take from AgenticSeal*, the paragraph #40 writes as P1 | Owlery follows no release of AgenticSeal, and a copy Owlery took is Owlery's to change. AgenticSeal's settle is not changed to read `decisions.md`, which is Owlery's format (`frame/plan.md` *Alternatives considered*) |
| `docs/roadmap.md` *Releases and the tracker* | The release's procedure: squash merges into the release branch, one merge into `main`, a tag, and a note built from the release's changelog fragments. It names no settle step yet. The issue's third line asks that it name this one |
| `docs/roadmap.md` *Why this order*, ground 4 | Until milestone 2 is done, Owlery's own pull requests are sealed by the AgenticSeal plugin. So this repository's process, the closing memos `gaps.md` and their `## Not verified` rows among it, runs on the plugin, and the plugin's settle stays the remover of this repository's records for release 0.0.2 |
| The plugin's `skills/core/SKILL.md` *The rule a mechanism is kept against* | A fact has one source. A script holds a gate only on a fact it reads exactly, and it names what it did not read. This rules out a second statement of the decision grammar, a Python one or a regular expression over the states |
| The plugin's `skills/settle/SKILL.md` *What `--apply` does* | The plugin keeps a directory whose record holds an open row or cannot be read. This work keeps a directory whose `decisions.md` holds a block the reader refuses, on the same ground: a record that cannot be read is not a record with nothing open |

**Facts of the tree and of probes.** The probes ran under the scratch directory `1795341002-settle-reads-decisions/frame/` of the session's scratchpad, in clones made there with `git clone --no-local`, and never in a checkout of Owlery.

- **AgenticSeal's settle removes a directory whose `decisions.md` holds a `reversed` decision.** Executed: `sh test_tmp_settle_apply2.sh repo`, in a clone of `2379a6f` with that file committed in `seal/threads/1795341002-settle-reads-decisions/`. P10's search printed the file's `state: reversed` line, then `settle.py --apply --released-at HEAD` of plugin 0.38.4 printed `removed seal/threads/1795341002-settle-reads-decisions/` and exited 1.
- **That removal is in the working tree alone.** Executed, the same probe: `git rev-parse HEAD` was the same before and after, `git diff --cached --name-only` printed nothing, and `git checkout HEAD -- <the directory>` exited 0 and put back both files, after which `git status --short -- <the directory>` printed nothing. Read: `settle.py#apply` removes with `shutil.rmtree` and runs no git command that writes.
- **At `2379a6f` the plugin's settle keeps eight of the nine directories for rows of their closing memos.** Executed, the first run of the same probe (`test_tmp_settle_apply.sh`): eight `kept` lines and `removed 1 directory; kept 8 with a row to close`. The release's settle (#49) closes those rows, and this work does not touch them.
- **`settle.py` is not in `pr-check/`.** Executed: `git ls-files pr-check` at #40's branch lists `skills/settle/scripts/passages.py` and `rule_changes.py`, which `chain_check.py` loads, and no `settle.py`. Read: #40's design *Scope* item 1 takes the files `chain_check.py` loads and changes none of them. So extending an owned `settle.py` would first mean taking its 2,231 lines (`wc -l` of plugin 0.38.4's copy) into the repository.
- **#40's reader runs on the Node that runs pnpm, outside Electron, once bundled.** Executed: esbuild bundled a probe entry importing `apps/desktop/src/daemon/decision-record.ts` of a clone of #40's branch, and `node` v22.14.0 ran it on the probe's `decisions.md`, printing `{"d":[[1,"default","reversed"]],"q":[],"refusals":0}`, and printed the same for the file with every line ending in a carriage return and a line feed. Read: `decision-record.ts` imports `node:fs`, `node:path`, `record-blocks.ts`, `records-place.ts` and `whole-file.ts`, and those import Node's own modules and types alone. The daemon's files import without extensions (`tsconfig.json`, `"moduleResolution": "Bundler"`), so Node cannot run them unbundled.
- **The desktop package runs its tools as `.mjs` scripts and has no TypeScript runner.** Read: `apps/desktop/package.json` *scripts* and its devDependencies, `esbuild` 0.28.2 and no `tsx`; `build.mjs` bundles the daemon with esbuild.
- **`seal` is on the path of a command the session's shell starts.** Executed: `sh -c 'command -v seal'` printed the plugin's `bin/seal`.
- **`pnpm run` hands the flags after the script's name to the script.** Executed: with pnpm 10.33.0, in a package made in the scratch directory, `pnpm run settle --apply --released-at HEAD` gave the script the arguments `["--apply","--released-at","HEAD"]`, with no `--` between.
- **The newest release tag is `v0.0.1`, and it holds no work item directory.** Executed: `git describe --tags --abbrev=0 --match 'v[0-9]*'` printed `v0.0.1`, and `git ls-tree --name-only v0.0.1 seal/threads/` printed nothing.
- **A work item's pull request is named by the subject of the commit that added its `routing.md`.** Executed: `git log --diff-filter=A --format='%h %s' -- seal/threads/1795329620-role-bundle/routing.md` printed `a3e4e7a … (#126)`. On a work item's own branch the adding commit names none, as this branch's `2379a6f` shows.
- **Nothing in the tree walks every work item's `decisions.md`.** Executed: `git grep -n -i 'decisions.md\|threads' 2379a6f -- apps` prints only lines of the role bundle's agent texts. At #40's branch, `git grep -l '"threads"' 1832417 -- apps/desktop/src` names `decision-record.ts` alone, whose `workItemDirectory` finds the one directory whose `routing.md` names a branch. The settle needs every directory, so this work reuses `rootOf` and `readDecisionRecord` and adds the walk.
- **No other open work item edits `docs/roadmap.md`.** Executed: `git diff --stat cbb2e69 -- docs/roadmap.md docs/roadmap.ko.md` printed nothing in each of the worktrees of #119, #130, #39, #40, #41, #45 and #97.
- **The absence search of scenario 11 was run.** Executed: `git grep -n -F "git grep -n -E '^state: (reversed|open)" 2379a6f -- docs apps` printed nothing and exited 1. At `85b6c50` the same search prints three lines: `docs/architecture.md:214` and `docs/architecture.ko.md:214`, which *Scope* item 8 rewrites, and `apps/desktop/test/decision-record.test.ts:403`, the case `## Removes` names. The pathspec leaves out `seal/`, where this frame quotes the pattern.
- **The issue has no comment, there is no `seal/follow-up.md`, and no `### Process changes` table stands in the latest release or in a fragment.** Executed: `gh issue view 131 --json body,comments`; `ls seal/follow-up.md`; `gh release view --json body` (`v0.0.1`) and `git grep '### Process changes' -- 'seal/threads/*/changelog.md'`.

**`routing.md`** stands (read): `Planning | framer`, `Automation | yes`, and the owner's words that nothing is posted on an issue.

## Scope

**In.** Items 1 to 4 are the reading, items 5 and 6 the removal, and items 7 and 8 the policy text. The shapes are in *Data & interfaces*.

1. **`apps/desktop/src/daemon/settle.ts` reads a repository's records for a settle, and writes nothing.** Given a folder, it finds the records root with `rootOf`, walks each directory under `<root>/threads/` in the working tree, and reads its `decisions.md` with `readDecisionRecord`, committed or not. A directory without the file holds nothing, unless `HEAD` holds the file. Where the working tree lacks a record that `HEAD` holds, removed with its directory or alone, as a killed `--apply` leaves it, the record `HEAD` holds is read with the same reader, and it decides whether the directory is kept and nothing else: the list and the notices are read from the working tree alone. A link stops the reading with exit 2, and the error names it: a link where a work item's directory stands, a `threads/` or a `decisions.md` that links to nothing, and, where the working tree lacks the record, a directory or a `decisions.md` that `HEAD` holds as a link. A record may stand behind each, so none is read as nothing.
2. **A directory is kept where its record holds a `reversed` decision, an `open` question or a block the reader refuses, and the reading names each.** Each kept directory comes with each such row: the block's id and line with the decision's text and the reversal's message, or with the question's text, or the refusal's line and reason. A notice of the reader names its line and keeps nothing, as P9 says of a line the daemon cannot read.
3. **The reading lists the release's decisions made without asking.** The release's directories are those the working tree holds and the previous release's tag does not. That tag is `--since`, and by default the newest tag reachable from `HEAD` that `git describe --tags --abbrev=0 --match 'v[0-9]*'` names; where no tag is reachable, every directory is the release's. A directory kept from an earlier release stands at that tag, so its open rows are named and its decisions are not listed again. The list groups the decisions by work item, in the order of the directories' names, which is the order they were created, and names each work item's pull request where the subject of the commit that added its `routing.md` ends with `(#N)`. Each decision gives its kind, what was decided, its grounds, who decided where the block says, and its state with the reversal's message and the commit or the home. The list opens with one line per kind that occurs, counting that kind's decisions and those the person reversed. A block of the release's records that the reader refuses cannot be listed, so a line after those counts the refused blocks and names each by its record and line. Each value the list takes from a record is written so that Markdown shows it as the record holds it: a code span stands as it is, and each other markup character is escaped with a backslash.
4. **`pnpm --filter @owlery/desktop run settle` prints the reading.** `apps/desktop/scripts/settle.mjs` bundles `src/daemon/settle-main.ts` with esbuild, as `build.mjs` bundles the daemon, in memory with `write: false`, and runs the bundle in its own process on the Node that runs pnpm. It writes no file, so a run that is killed leaves nothing on the disk. With no flag it prints each kept directory with its rows, each notice, and then the list, and exits 1 where it keeps a directory and 0 where it keeps none. `--list` prints the list alone, as Markdown, for the release's pull request and note. It names each block of the release the reader refuses on the error stream, as `settle: not listed <record>:<line>: <the reader's reason>`, and exits 1 where it names one and 0 where it names none. `--since <ref>` names the previous release.
5. **`--apply` runs AgenticSeal's settle and puts back each directory it kept.** Before anything runs, it refuses where a kept directory differs from `HEAD`, which `git status --porcelain --untracked-files=all -- <directory>/` shows by printing a line, and names it, because the directory is put back from `HEAD`. The untracked mode is named on the command line, so a repository that sets `status.showUntrackedFiles` to `no` cannot hide a file the settle would remove for good, and a kept directory that a killed run left removed is refused as differing. It refuses where `seal` is not found on the path. Before the settle runs, it prints each notice, and then each kept directory as a `keeping <dir>/` line followed by the rows that keep it, so a run that is killed leaves on the screen what it would have put back. From then until the put-back ends it holds SIGINT, SIGTERM and SIGHUP: a signal from the terminal reaches AgenticSeal's settle and ends it, and this process stays to put back. SIGKILL cannot be held. It records `HEAD`, runs `seal settle --apply` with the `--released-at <ref>` it was given, and lets that command's output through as printed. After it, it puts nothing back where `HEAD` moved, and names each kept directory as not put back. Otherwise it puts back, with `git checkout HEAD -- <directory>/`, each kept directory that differs from `HEAD` after the settle (removed whole, in part, or with its removal staged), and prints a `put back <dir>/` line for each; a directory whose checkout fails is named on the error stream as `settle: not put back <dir>/:` with git's error, and the next goes on. Neither line carries the rows, which the `keeping` lines printed.
6. **`--apply`'s exit says the worse of the two.** It exits 2 where it refused, where `HEAD` moved, where a put-back failed, and where AgenticSeal's settle exited 2 or with any code but 0 and 1, ended by a signal or could not start; 1 where either kept a directory; and 0 otherwise. Its last line counts the directories it put back.
7. **`docs/roadmap.md` *Releases and the tracker* names the settle in the release's procedure, in both languages.** Entry R1 of *Data & interfaces*.
8. **P10's sentence on the settle names the release's settle in place of the search, and P9's clause on a block the daemon cannot read agrees with it, in both languages.** Entries R2 and R3. The case that pins the search leaves `apps/desktop/test/decision-record.test.ts` (`## Removes`).

**Out, each with its home.**

9. **Removing the records without AgenticSeal's settle**, with the closing memos' open rows and the published note's check read by Owlery. This repository's closing memos are written by the plugin's process until Owlery seals its own pull requests (`docs/roadmap.md` *Why this order*, ground 4). No issue carries it, and the report names this (`frame/plan.md` *Alternatives considered*, row 3).
10. **Writing the list into the release's pull request and its note.** #49 runs `--list` and places what it prints. This work prints it.
11. **Closing an open row at the settle**: writing `carried` with an issue, or an answer. A reversal and an answer are the person's or a stage's, through #40's writers, and the settling session decides what each kept row needs, as it decides each open row of a closing memo.
12. **The daemon calling the reading**, for a view of what a settle would keep. The module takes a folder and stands under `src/daemon/` so the daemon can call it; nothing calls it there yet (*What the daemon could do beyond the issue*).

**Where each line of the issue's *Done when* lands.** The lines are numbered in the issue's order.

| Line | Lands |
|---|---|
| 1, the settle keeps every directory with a `reversed` decision or an `open` question, and names each | Items 1, 2, 5 and 6 |
| 2, it lists the release's decisions made without asking for the pull request and the note | Items 3 and 4; #49 places the list (item 10) |
| 3, it runs from Owlery with #40's reader, and `docs/roadmap.md` names it | Items 4 and 7, and item 8 for P10 |

### What the daemon could do beyond the issue

The owner asked on 2026-11-22 to think past the request with what the daemon can do. Each idea is marked in scope or follow-up.

- **In scope: the list opens with a count per kind of the decisions and of those the person reversed** (item 3). The plugin's core says the settle is where the guidance is rewritten where a kind of judgment keeps costing more than it returns. The count shows that to the settling session in one line per kind, from the blocks the list already reads.
- **In scope: the reading is daemon code that takes a folder** (items 1 and 12), so a later caller in the daemon reads the same function and no second walk is written.
- **Follow-up, #136: reading the person's reversals across releases to rewrite the orchestrator's defaults.** An earlier settle removed its directories, and their `decisions.md` files are read at that release's tag (`git show v<X.Y.Z>:<path>`). #136's fourth line names this settle as where that reading runs, and #136 is in `release: 0.0.3`.
- **Follow-up, #136: listing the questions the person answered beside the decisions.** An answer is the person's word, and #136's third line gives it to the orchestrator before a question of the same kind is asked again.
- **Follow-up, no issue: the repository's view shows what a settle would keep**, by calling item 1's function for each connected repository, so a reversal nobody took in shows before the settle and not at it.
- **Follow-up, no issue: Owlery settles a connected repository by itself** (item 9), once Owlery's own process writes the closing memos.
- **Follow-up, no issue: a kept `reversed` decision is offered a home.** The daemon could draft the issue a reversal would be carried to and write `carried` once the person opens it. Owlery posts nothing on an issue by itself (the owner, 2026-11-22), so the person opens it.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A reversal nobody took in is kept | Given a temporary repository whose records root holds a directory with a `decisions.md` holding a `reversed` decision, when `settle` runs, then it names the directory, the decision's id and line, and the reversal's message, and exits 1. The same holds for the file with every line ending in a carriage return | A case in `apps/desktop/test/settle.test.ts` |
| 2. An open question is kept | The same with an `open` question: the directory, the question's id and its text, exit 1 | A case in `settle.test.ts` |
| 3. A block the reader refuses keeps its directory | Given a `decisions.md` with a decision block whose `state:` value is no state, then the directory is kept and the refusal's line and reason are named | A case in `settle.test.ts` |
| 4. A notice keeps nothing | Given a `decisions.md` whose only fence opens with `seal` and is not the opener, then the notice's line is named, no directory is kept, and the exit is 0 | A case in `settle.test.ts` |
| 5. Closed rows keep nothing | Given decisions `decided`, `applied <commit>` and `carried <home>`, and an `answered` question, then nothing is kept and the exit is 0 | A case in `settle.test.ts` |
| 6. The list holds the release's decisions and no earlier release's | Given one directory present at a tag `v0.0.1` and two added after it, one added by a commit whose subject ends `(#12)`, when `settle --list` runs, then it prints the two later directories' decisions with their kind, text, grounds and state, names `#12` for the one, and opens with one line per kind. With `--since` naming a commit before the first directory, the first is listed too | Cases in `settle.test.ts` |
| 7. `--apply` puts back what it kept | Given a kept directory and a closed one, and a script named `seal` first on the path that removes every directory under `threads/`, when `settle --apply` runs, then the kept directory is put back with `git status --short -- <it>` printing nothing, the closed one stays removed, the script's output is printed, and the exit is 1 | A case in `settle.test.ts` |
| 8. `--apply` refuses a kept directory that differs from `HEAD` | Given a kept directory whose `decisions.md` was edited and not committed, then `--apply` exits 2, names it, and the script never ran | A case in `settle.test.ts`; the script writes a file when it runs, and the case reads that no such file stands |
| 9. `--apply` puts nothing back where `HEAD` moved | Given a script that commits, then `--apply` exits 2 and names each kept directory as not put back | A case in `settle.test.ts` |
| 10. `--apply` refuses where `seal` is not found | Given a path without `seal`, then the exit is 2 and nothing is removed | A case in `settle.test.ts` |
| 11. The policy names the release's settle and not the search | Given both editions of `docs/roadmap.md` and `docs/architecture.md`, then R1, R2 and R3 stand | The broad gate. `git grep -n -F "git grep -n -E '^state: (reversed|open)" -- docs apps` prints nothing |
| 12. It runs in this repository | Given the build's head, when `pnpm --filter @owlery/desktop run settle` runs, then it exits 0 or 1, not 2, and prints the list | The crafter runs it once and records the output in the phase record. It is not a case, since the repository's records change |

## Data & interfaces

### The module, `apps/desktop/src/daemon/settle.ts`

```ts
export interface KeptRow { line: number; why: string }                 // a reversed decision, an open question, or a refusal
export interface KeptDirectory { directory: string; rows: KeptRow[] }  // relative to the folder, e.g. "seal/threads/<id>"
export interface ListedWorkItem { id: string; pullRequest: number | null; decisions: DecisionBlock[]; refused: KeptRow[] }  // refused: each block the reader refuses
export interface SettleReading {
  root: string | null;                 // null where the folder holds no records root
  kept: KeptDirectory[];
  notices: { directory: string; line: number; why: string }[];
  since: string | null;                // the ref the release is read from, or null where none is reachable
  release: ListedWorkItem[];
}
export function readSettle(folder: string, since?: string): SettleReading;
export function listMarkdown(reading: SettleReading): string;
```

`readSettle` asks git for four things alone: the default `since` (`git describe`), the directories the `since` tree holds (`git ls-tree -z --name-only <since> <root>/threads/`), each release directory's adding commit's subject (one `git log` per directory), and each record `HEAD` holds that the working tree lacks (`git ls-tree -r -z HEAD -- <root>/threads/` once, then `git cat-file blob <object>` per such record). A `since` git cannot resolve is an error the command reports with exit 2, never an empty release.

### The command, `apps/desktop/src/daemon/settle-main.ts` and `apps/desktop/scripts/settle.mjs`

The command's function, `command(args, cwd, print)`, and its `Printer` are exported by `settle.ts`, beside the reader, so a case can import them; `settle-main.ts` is the entry point that calls it and does nothing else (phase 1, folded by the orchestrator).

```
pnpm --filter @owlery/desktop run settle                  kept directories, notices, then the list; exit 1 where it keeps one
pnpm --filter @owlery/desktop run settle --list           the list alone, as Markdown
pnpm --filter @owlery/desktop run settle --since <ref>    the release read from <ref> in place of the newest v tag
pnpm --filter @owlery/desktop run settle --apply [--released-at <ref>]
                                                          run `seal settle --apply`, then put back each kept directory
```

The command reads the repository's top from `git rev-parse --show-toplevel` in the folder pnpm starts it in, and runs every git command with `git -C <top>`.

### The policy documents' text

Each entry is written in the English edition and, in the Korean given, in the Korean edition. No heading and no table row is added or removed, so the broad gate's two counts stay equal.

**R1.** `docs/roadmap.md` *Releases and the tracker* and `docs/roadmap.ko.md` *릴리스와 트래커*: a bullet after the bullet on the release's note.

> - **A release's records are settled with `pnpm --filter @owlery/desktop run settle --apply`.** The command reads every work item's `decisions.md` with the daemon's reader. It keeps each directory that holds a `reversed` decision, an `open` question or a block it cannot read, and names each row that keeps it. It runs AgenticSeal's `seal settle --apply`, which removes the directories whose closing memo holds no open row, and puts back each directory it kept. This repository settles with AgenticSeal's settle until Owlery seals its own pull requests ([Why this order](#why-this-order), ground 4). `pnpm --filter @owlery/desktop run settle --list` prints the decisions made without asking in the release, which the release's pull request and its note carry. It reads the directories that stand in the working tree, and `--apply` removes every directory it does not keep, so `--list` runs before `--apply`.
>   check: apps/desktop/test/settle.test.ts

> - **릴리스의 기록은 `pnpm --filter @owlery/desktop run settle --apply`로 정리합니다.** 이 명령은 모든 작업의 `decisions.md`를 데몬의 리더로 읽습니다. `reversed`인 결정이나 `open`인 질문, 읽지 못한 블록이 있는 작업 폴더는 남겨 두고, 그 폴더를 남긴 줄을 하나하나 밝힙니다. 그다음 AgenticSeal의 `seal settle --apply`를 실행해 마감 메모에 열린 줄이 없는 작업 폴더를 지우게 하고, 남겨 둔 폴더는 되돌려 놓습니다. Owlery가 자기 PR에 인장을 찍기 전까지 이 저장소는 AgenticSeal의 settle로 기록을 정리합니다([이 순서인 까닭](#이-순서인-까닭), 넷째 근거). `pnpm --filter @owlery/desktop run settle --list`는 그 릴리스에서 묻지 않고 내린 결정을 찍고, 릴리스의 PR과 노트가 그것을 싣습니다. 이 명령은 작업 트리에 있는 폴더를 읽고 `--apply`는 남기지 않은 폴더를 모두 지우므로, `--list`는 `--apply`보다 먼저 실행합니다.
>   check: apps/desktop/test/settle.test.ts

The crafter writes the Korean link's anchor as `docs/roadmap.ko.md` spells its heading.

**R2.** `docs/architecture.md` *Records are committed to the repository* and `docs/architecture.ko.md` *기록은 저장소에 커밋합니다*, the paragraph #40 writes as P10, as it stands once #40 has merged. The English sentence that opens "A `reversed` decision and an `open` question are open rows of the record" and ends "prints a line of it." becomes the first sentence below. The two Korean sentences that open "`reversed`인 결정과" and end "폴더를 남겨 둡니다." become the two below. The sentence after them, on the release's pull request, stays in both editions, and the paragraph's check line gains `apps/desktop/test/settle.test.ts`.

> A `reversed` decision and an `open` question are open rows of the record, and so is a block the daemon cannot read: a release's settle keeps the work item's directory while its record holds one ([Releases and the tracker](roadmap.md#releases-and-the-tracker)).

> `reversed`인 결정과 `open`인 질문, 데몬이 읽지 못한 블록은 기록의 열린 줄입니다. 릴리스의 settle은 그 작업의 기록에 열린 줄이 있는 동안 작업 폴더를 남겨 둡니다([릴리스와 트래커](roadmap.ko.md#릴리스와-트래커)).

**R3.** `docs/architecture.md` *Records are committed to the repository* and `docs/architecture.ko.md` *기록은 저장소에 커밋합니다*, the paragraph #40 writes as P9. Its clause on a block the daemon cannot read agrees with R2: the daemon takes no value from such a block, and R2 keeps the work item's directory for it. The English sentence that opens "The daemon reads the file" and the Korean sentence that opens "데몬은 작업의 워크트리에서" become the two below. The rest of the paragraph, its counts and its check line stay.

> The daemon reads the file in the work item's worktree, whether or not it is committed, and names a block it cannot read without taking any value from it.

> 데몬은 작업의 워크트리에서 이 파일을 커밋 여부와 상관없이 읽고, 읽지 못한 블록은 읽지 못했다고 밝힐 뿐 그 블록의 값은 하나도 쓰지 않습니다.

## Rule changes

- nothing
  why: This work item writes its rules into the policy root in its own pull request (*Scope* items 7 and 8). The issue's third *Done when* line names `docs/roadmap.md` as what the work writes, and the release's settle (#49) runs the procedure it names, so the procedure has to stand before that settle starts. #40 writes P10, which this work amends, directly, and merges first. No other open work item of the release edits `docs/roadmap.md` (*Grounding*). The work moves no document and no section, so no operation of an unsettled design needs re-pointing.

## Removes

The work adds a command, a module and a bullet of the release's procedure. In return it takes out the search P10 gives a settle and the case that pins it. That search is a second statement of which states are open, written as a regular expression: it matches a `state:` line in any fenced block of the file, a block the reader refuses among them, and it stays whole only while its patterns stay in step with the grammar.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The words "a settle keeps the work item's directory while `git grep -n -E '^state: (reversed\|open)[[:space:]]*$' -- '*/threads/*/decisions.md'` prints a line of it", and the same in Korean | `docs/architecture.md` *Records are committed to the repository* and `docs/architecture.ko.md` *기록은 저장소에 커밋합니다*, P10 as #40 writes it | R2. The command reads the blocks with the reader, the grammar's one statement in TypeScript |
| The case that runs that search on a reversed decision and an open question | `apps/desktop/test/decision-record.test.ts`, the case "writes a reversed decision and an open question so that the search the policy document gives a settle prints each, and prints nothing once each is closed, in a record whose lines end with a carriage return too" (line 402 at `85b6c50`) | Scenarios 1, 2 and 5 hold what it held, through the reader, the carriage return among it. Its catch on record is its own pattern's: #40's `7cb7a5b` widened the search for a record whose lines end with a carriage return, which the reader reads as it reads a line feed (*Grounding*) |
| The settling session's hand-run search that #40's design leaves as the guard | `seal/threads/1795338001-records-place-and-pr-check/frame/design.md` *Scope* item 24, a record and no rule | The command. The record leaves with its directory at the settle, and nothing in it needs editing |

Framed 2026-11-22 by framer, before the build.
