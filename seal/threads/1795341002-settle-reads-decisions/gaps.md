# Closing memo: 1795341002-settle-reads-decisions

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite and the typecheck of the package at the head of the branch, after the merge of `origin/release/v0.0.2` (`9e415bd`), which brought #40's changes into this branch | The orchestrator's broad gate, after the review rounds |
| The list's Markdown as GitHub renders it in a pull request's body and a release's note: the cases compare the text, and no case renders it | #49, which places the list |
| `--apply` with AgenticSeal's own `seal settle --apply`: the cases run a stand-in that removes in the working tree and writes nothing to git, as the frame's probe of plugin 0.38.4 found (`frame/design.md` *Grounding*), and no run of this work started the plugin's settle | The release's settling session (#49), whose `settle --apply` is the first run against the plugin |

## Not done

A `decisions.md` that stands and cannot be read stops the whole settle with exit 2. It does not keep its own directory as a kept row and let the settle go on. A kept row names a line, and such a file has none. A stop removes nothing, and the person sees the file's path and the system's error. `trail/phases/phase-1.md` gives the grounds.

A file that git ignores inside a kept directory is not protected by `--apply`. `git status --porcelain` does not print it, so the refusal before the run does not see it. AgenticSeal's settle removes it with the directory, and `git checkout HEAD` does not bring it back, since `HEAD` does not hold it. Adding `--ignored` to the probe would refuse a settle for a `.DS_Store` that Finder wrote. Losing a file the repository chose not to commit costs less than that refusal. A work item's directory holds records that are committed (`docs/architecture.md` *Records are committed to the repository*).
