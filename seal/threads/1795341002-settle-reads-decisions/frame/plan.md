# Implementation Plan: 1795341002-settle-reads-decisions

## Technical context

The tree as read at `2379a6f`, with #40's branch read at `85b6c50`.

**The build starts after #40 merges into `release/v0.0.2`.** The work reads #40's `apps/desktop/src/daemon/decision-record.ts` (`readDecisionRecord`, `RECORD_FILE`, the `DecisionBlock` and `QuestionBlock` types), `records-place.ts#rootOf`, and P10 in `docs/architecture.md` line 214 and in `docs/architecture.ko.md` line 214, none of which stands at `2379a6f`. The first phase's crafter merges `origin/release/v0.0.2` into this branch once #40 is on it, and does not rebase. Where #40's names or lines differ from those read here, the merged tree decides and the phase record says so.

What the work builds on:

- `decision-record.ts#readDecisionRecord(text)` gives decisions, questions, refusals and notices, each with its line. `#workItemDirectory` walks `<root>/threads/` for one branch, and this work's walk takes every directory instead.
- `records-place.ts#rootOf(folder)` names `seal` or `agentic-seal` by the marker line of its `README.md`.
- `apps/desktop/build.mjs` bundles `src/daemon/main.ts` with esbuild for Node. `scripts/settle.mjs` bundles one entry the same way. The bundle imports nothing native, so the Node that runs pnpm runs it (*Grounding*, the probe of #40's reader).
- `apps/desktop/scripts/test-in-electron.mjs` runs vitest in Electron's Node. The cases of `test/settle.test.ts` call `readSettle` and run the command's entry in temporary git repositories, as `test/pr-check.test.ts` does in #40. A case of `--apply` puts a script named `seal` first on the path of the process it starts.
- The plugin's `skills/settle/scripts/settle.py#apply` removes each released directory with `shutil.rmtree` and writes nothing to git, and its exit is 0, 1 or 2 (read, and executed in the probe of *Grounding*).

**The failure scenario of the chosen approach, six months on.** AgenticSeal's settle starts committing its removal, or removes a directory some other way than in the working tree. The put-back then reads a `HEAD` that no longer holds the kept directory. Item 5's check that `HEAD` did not move stops that case with exit 2, and names each directory as not put back. A removal that moves no `HEAD` and stages the deletion is put back by `git checkout HEAD -- <directory>` all the same, since that command writes the index and the working tree. The approach also ends when this repository stops settling with the plugin, which *Scope* item 9 leaves to a later issue.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| **A TypeScript command reads the records with #40's reader, runs AgenticSeal's `seal settle --apply`, and puts back from `HEAD` each directory it kept** | AgenticSeal's settle changes how it removes, and a kept directory is not where the put-back looks. The check that `HEAD` did not move stops the case where it commits, and a kept directory that differs from `HEAD` is refused before anything runs | **Chosen.** It reads the blocks with the reader #40 builds, as the issue's third line and P2 ask. It keeps the plugin as the one remover while this repository's closing memos are the plugin's (`docs/roadmap.md` *Why this order*, ground 4). It adds no second statement of the decision grammar. The removal it reverses is in the working tree alone (*Grounding*, executed) |
| Take `settle.py` into `pr-check/` as Owlery's copy, and extend its open rows to read `decisions.md` with decision and question kinds added to `pr-check/lib/fields.py` | A state #42 or #119 adds to `record-blocks.ts` is not added to `fields.py`, and the settle removes a directory whose record holds it. The copy is 2,231 lines that the daemon can never call, and #136 would read the reversals across releases in a second language | Rejected. `settle.py` is not in `pr-check/` (*Grounding*, executed), so this takes a new copy and does not extend an owned one. P2 says the daemon reads the records in its own code, and the issue asks for #40's reader |
| Owlery's command removes the directories itself and leaves AgenticSeal's `--apply` out, with the closing memos' `## Not verified` rows and the published note's check ported into TypeScript | The plugin's process writes this repository's closing memos. A later plugin changes the memo's grammar, the port reads a row as closed, and the settle removes a directory with an open row | Rejected for now. It replaces the remover while the plugin still writes the records the remover reads. The premise that keeps the plugin's remover, that this repository's process runs on the plugin until Owlery seals its own pull requests, is checked in `docs/roadmap.md` *Why this order*, ground 4. It is the follow-up of *Scope* item 9 |
| The command prints what it keeps, and the procedure tells the settling session to run `seal settle --apply` and then put each kept directory back by hand | A session runs the removal, forgets the put-back, and commits the removal of a reversal. The guard is a person's memory, which is what #40's design *Scope* item 24 already was | Rejected. A step the command can take for itself is not left to a reader of the procedure |
| The command moves each kept directory out of `threads/` before AgenticSeal's settle and moves it back after | A process killed between the two moves leaves the directories outside the tree, where `git status` shows them only as deleted, and nothing in the tree says where they went | Rejected. A put-back from `HEAD` leaves nothing outside the tree, and the guard before it makes it lossless |
| AgenticSeal's settle learns to read `decisions.md` | AgenticSeal's release cycle decides when Owlery's settle holds, and a format Owlery owns is read in a tool Owlery does not | Rejected. Owlery follows no release of AgenticSeal, and `decisions.md` is Owlery's format (P1, P4 of #40) |
| The command refuses the whole settle while any directory holds an open row | One reversal nobody carried holds back every other record of the release, and the settle waits on a row it could keep | Rejected. The issue asks that the settle keep and name the directory, and the plugin's settle keeps a directory for an open row the same way |
| Keep P10's `git grep` beside the command, as a check a person can run without Node | Two readers of which states are open, one a regular expression over every fenced line and one the block reader, answer differently on a refused block or a `state:` line in another fence | Rejected (`frame/design.md` `## Removes`). The command is the one reader |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 4, with the module and the command of *Data & interfaces* | Scenarios 1 to 6 as cases of `test/settle.test.ts`, each seen red before its code, and scenario 12 run once at the phase's head | `92856b2` |
| 2 | *Scope* items 5 and 6 | Scenarios 7 to 10 as cases of `test/settle.test.ts`, each seen red before its code | |
| 3 | *Scope* items 7 and 8, with entries R1 and R2 and the rows of `frame/design.md` `## Removes` | The search of scenario 11 printing nothing, run at the phase's head; the broad gate is the orchestrator's | |

## Overlap with the release

The spawn names #40, whose frame and code were read on its branch at `85b6c50`, and #49 and #136, read as issues. The worktrees of #119, #130, #39, #41, #45 and #97 were read for edits of `docs/roadmap.md` and found none (`frame/design.md` *Grounding*).

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #40, `1795338001-records-place-and-pr-check` | This work reads `decision-record.ts`, `record-blocks.ts` and `records-place.ts#rootOf`, which #40 adds. It rewrites a sentence of P10 in `docs/architecture.md` *Records are committed to the repository* and the Korean edition, which #40 writes. It removes a case of `test/decision-record.test.ts`, which #40 adds | #40 | This work cannot build without #40's modules, and R2 amends text #40 writes. #40 merged into `release/v0.0.2` at `cc0b938` (#142), and this branch took it in at `9e415bd`, before this work's first phase. #40's design *Scope* item 24 names this gap, and this work closes it |
| #49, the release's pull request | #49's settle runs `settle --apply` and its pull request and note carry what `settle --list` prints | #131 | #49 is the release's last pull request, and its settle runs the procedure R1 writes |
| #119, `1795330500-no-question-holds-the-run` | No file. #119 writes decision blocks and question blocks through #40's writers, which this work reads | Either | This work reads the blocks as #40's grammar holds them, whoever writes them. #119 edits no file this work edits |
| #136, release 0.0.3 | Its fourth line reads the person's reversals across releases at this settle | #131 | #136 is in `release: 0.0.3`, and it extends `settle.ts` (`frame/design.md` *What the daemon could do beyond the issue*) |

## Operational impact

A new script, `pnpm --filter @owlery/desktop run settle`, needs Node, esbuild from the desktop package's devDependencies, git, and for `--apply` AgenticSeal's `seal` on the path. It adds no dependency, no environment variable and no migration, and the app ships none of it. This pull request does not move the version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
| 2026-11-22 | Fold phase 1: `settle.ts` exports `command` and `Printer` beside the reader, and `settle-main.ts` is the entry point alone; #40 is merged. The crafter's eight choices stand as recorded in `trail/phases/phase-1.md` | The phase 1 crafter's hand-back | the plugin's `skills/implement/orchestration.md` *A decision made after the frame is committed is folded* |
