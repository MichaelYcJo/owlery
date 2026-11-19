# Questions for the planner: a Claude Code pane that waits before its session starts

Judgments the ticket (#23) left open that the tree or a probe answered. None is a question any more.

- What Claude Code sends while it asks the trust question, and after each answer: `frame/design.md` *Grounding*, the table of the probes' launches.
- Where the question is asked at all: `frame/design.md` *Grounding*, the bullet "The issue's symptom holds, and is narrower than the issue states".
- Whether the line says the pane waits or the pane opens past the question: `frame/plan.md` *Alternatives considered*, the row on writing the trust record or bypassing the CLI's checks, and `frame/design.md` *Grounding*, the bullet on `claude --help`.
- How the daemon learns of the wait without reading the screen: `frame/plan.md` *Alternatives considered*, the first row, and the rows on `~/.claude.json` and on the pane's output.
- Whether the protocol gains a state: `frame/plan.md` *Alternatives considered*, the row that replaces the structure.
- Whether the window changes: `frame/design.md` *Grounding*, the bullet "The window already shows `waiting` and notifies for it".
- How this work meets issues #18 and #9: `frame/plan.md` *Overlap with the release*.

One assumption is written down and not asked, because another answer changes one number and nothing else that is built: the silent start lasts 10 seconds (`frame/design.md` *Scope* item 2, with its grounds).

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | The run shows that Claude Code asks the trust question only in the first work item of a repository the person never trusted in Claude Code, and not in "every new work item" as issue #23 says. Is the daemon's change still wanted in milestone 1? No document weighs how much that first work item matters, so the tree cannot answer it. | a person | (a) Build it as framed: a pane silent for 10 seconds is listed as waiting, which also covers every other question a CLI asks before its session starts. (b) Build nothing in the daemon: the issue closes on the recorded run, and the line of a first work item in a new repository stays without a state until the person opens its pane. | (a) | open |
