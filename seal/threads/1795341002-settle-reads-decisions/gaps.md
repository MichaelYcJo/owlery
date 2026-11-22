# Closing memo: 1795341002-settle-reads-decisions

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite and the typecheck of the package at the head of the branch, after the merges of `origin/release/v0.0.2` at `9e415bd`, which brought #40's changes into this branch, and at `a063552`, which brought `b8c1190` | The orchestrator's broad gate, after the review rounds |
| The list's Markdown as GitHub renders it in a pull request's body and a release's note: the cases compare the text, and no case renders it | #49, which places the list |
| `--apply` with AgenticSeal's own `seal settle --apply`: the cases run a stand-in that removes in the working tree and writes nothing to git, as the frame's probe of plugin 0.38.4 found (`frame/design.md` *Grounding*), and no run of this work started the plugin's settle | The release's settling session (#49), whose `settle --apply` is the first run against the plugin |
| The broad gate's heading and table counts over every pair of `docs/` and the READMEs, and its search for `도장`: phase 3 ran them over the four policy files it changed alone (`trail/phases/phase-3.md`) | The orchestrator's broad gate, after the review rounds |
| A Ctrl-C typed in a terminal during `--apply`, through `pnpm --filter @owlery/desktop run settle`: the cases send each held signal to a process group the script leads, and one probe sent SIGINT to a group that pnpm 10.33.0 led, where pnpm returned at once and the script, holding the signal, ran its child to its end; no run typed Ctrl-C in a terminal | The release's settling session (#49) |
| The links R1 and R2 add, in both editions, as GitHub resolves their anchors: they were read against the headings' text and not rendered | The proofer, at the first round |

## Not done

A `decisions.md` that stands and cannot be read stops the whole settle with exit 2. It does not keep its own directory as a kept row and let the settle go on. A kept row names a line, and such a file has none. A stop removes nothing, and the person sees the file's path and the system's error. `trail/phases/phase-1.md` gives the grounds.

A file that git ignores inside a kept directory is not protected by `--apply`. `git status --porcelain` does not print it, so the refusal before the run does not see it. AgenticSeal's settle removes it with the directory, and `git checkout HEAD` does not bring it back, since `HEAD` does not hold it. Adding `--ignored` to the probe would refuse a settle for a `.DS_Store` that Finder wrote. Losing a file the repository chose not to commit costs less than that refusal. A work item's directory holds records that are committed (`docs/architecture.md` *Records are committed to the repository*).

A record written between the settle's reading and AgenticSeal's removal is not read again before the removal, such as a reversal the person makes while `--apply` runs. The settle runs once a release, in the owner's settling session, and the refusal before the run already covers a kept directory that differs from `HEAD`. The orchestrator accepted this limit after review round 1 (`frame/plan.md` *Judgments of the run*, its last row).

SIGKILL cannot be held. A run killed by it puts nothing back. It leaves on the screen each `keeping` line, and the next run keeps each directory it left removed by the record `HEAD` holds, so `--apply` refuses it until it is put back. The record `HEAD` holds decides only whether a directory is kept: `--list` does not read `HEAD` for a directory `--apply` removed, and the release's procedure runs `--list` first (`docs/roadmap.md` *Releases and the tracker*).
