Part of #131. The issue closes when `release/v0.0.2` reaches `main`.

A work item's `decisions.md` holds the decisions made for it without asking you, and the questions it was parked with. A release's records were cleared by AgenticSeal's `seal settle --apply`, which does not read `decisions.md`, so it removed a work item's directory even where it held a reversal nobody took in, and nothing listed the release's decisions made without asking for its pull request and note.

| Done when | What holds now |
|---|---|
| The release's settle keeps every work item directory whose `decisions.md` holds a `reversed` decision or an `open` question, and names each | `pnpm --filter @owlery/desktop run settle` reads every work item's `decisions.md` with the daemon's own reader. It keeps a directory for a `reversed` decision, an `open` question, and a block the reader cannot read, and names each directory and each row that keeps it. `--apply` runs AgenticSeal's settle and puts back from `HEAD` each kept directory that the settle removed or changed |
| It lists the release's decisions made without asking, for the release's pull request and note (#49) | `--list` prints, as Markdown, one line per kind of decision with its count and those you reversed, then each work item's decisions with its pull request where one is known. The release's work items are the directories the previous release's tag does not hold |
| It runs from Owlery, reading the blocks with #40's reader, and the release's procedure names it | The command is a script of the repository on the daemon's reader. `docs/roadmap.md` *Releases and the tracker* names it, and `docs/architecture.md` points at that procedure in place of a `git grep` of two states, in both languages |

**`--apply` refuses before anything runs where a put-back could lose something**: a kept directory that differs from `HEAD`, or no `seal` on the path. It puts nothing back where `HEAD` moved while AgenticSeal's settle ran.

**A file that git ignores inside a kept directory is not put back**: AgenticSeal's settle removes it with the directory, and `HEAD` does not hold it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
