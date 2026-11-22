Part of #131. The issue closes when `release/v0.0.2` reaches `main`.

A work item's `decisions.md` holds the decisions made for it without asking you, and the questions it was parked with. A release's records were cleared by AgenticSeal's `seal settle --apply`, which does not read `decisions.md`, so it removed a work item's directory even where it held a reversal nobody took in, and nothing listed the release's decisions made without asking for its pull request and note.

| Done when | What holds now |
|---|---|
| The release's settle keeps every work item directory whose `decisions.md` holds a `reversed` decision or an `open` question, and names each | `pnpm --filter @owlery/desktop run settle` reads every work item's `decisions.md` with the daemon's own reader. It keeps a directory for a `reversed` decision, an `open` question, and a block the reader cannot read, and names each directory and each row that keeps it. `--apply` runs AgenticSeal's settle and puts back from `HEAD` each kept directory that the settle removed or changed |
| It lists the release's decisions made without asking, for the release's pull request and note (#49) | `--list` prints, as Markdown, one line per kind of decision with its count and those you reversed, then each work item's decisions with its pull request where one is known. The release's work items are the directories the previous release's tag does not hold |
| It runs from Owlery, reading the blocks with #40's reader, and the release's procedure names it | The command is a script of the repository on the daemon's reader. `docs/roadmap.md` *Releases and the tracker* names it, and `docs/architecture.md` points at that procedure in place of a `git grep` of two states, in both languages |

**`--apply` refuses before anything runs where a put-back could lose something**: a kept directory that differs from `HEAD` (untracked files counted whatever `status.showUntrackedFiles` says), or no `seal` on the path. It prints each directory it keeps before AgenticSeal's settle runs, holds Ctrl-C, `SIGTERM` and `SIGHUP` until its put-back ends, and puts nothing back where `HEAD` moved meanwhile. A later run reads from `HEAD` a record the working tree lacks, so a run killed outright still keeps what it kept.

**Run `--list` before `--apply`**, as the release's procedure now says: `--list` reads the directories that stand in the working tree, and `--apply` removes every directory it does not keep. `--list` names a block the reader cannot read on the error stream and exits 1. It escapes what Markdown reads as markup in each record value and keeps the record's code spans, so the list shows each value as the record holds it. The reading stops with exit 2 and names the link where a work item's directory is a link, where a `threads/` or a `decisions.md` links to nothing, and where `HEAD` holds a directory or a `decisions.md` as a link that the working tree lacks.

**A file that git ignores inside a kept directory is not put back**: AgenticSeal's settle removes it with the directory, and `HEAD` does not hold it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
