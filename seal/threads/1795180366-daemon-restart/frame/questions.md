# Questions for the planner: restart the daemon, or quit it with its sessions, from the app's menu (#101)

Judgments the issue left open that the tree or a probe answered. Nobody reopens them here:

- How the app stops a daemon it attached to, one of an earlier build among them: `frame/plan.md` *Alternatives considered*, rows A, B and J.
- How the app knows the build of the daemon it attached to, and its own: `frame/plan.md` *Alternatives considered*, rows C, D and E.
- Whether #93's sentence stays beside a new one: `frame/plan.md` *Alternatives considered*, row F, and `frame/design.md` *Removes*.
- Where the confirmation is drawn, and how it names the sessions: `frame/plan.md` *Alternatives considered*, row G, and `frame/design.md` *Grounding*, the row on #93's dialog.
- How the window attaches to the new daemon: `frame/plan.md` *Alternatives considered*, row H.
- How a case proves that the app stops no daemon but its own run folder's: `frame/design.md` scenarios 2, 3 and 10.
- How long a daemon takes to stop, and what it leaves: `frame/design.md` *Grounding*, the row on the probe.
- Whether a stopped daemon leaves #102's block of sleep behind: `frame/plan.md` *Overlap with the release*, the row of #102.

The words of the dialog, of the refusal and of the status line are in `frame/design.md` *Scope* items 1, 5 and 10. Other words change no structure, so they are written down as an assumption and asked of nobody. The same holds for the entries' place in the menu.

No row below is a person's decision, and none blocks the build. Q1 is a measurement the framer could not take: the run's rules let no probe and no case start a real `claude`.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Does the process of a real Claude Code pane end when its daemon stops? The daemon ends a pane with the pseudo-terminal's hangup signal and exits without waiting, and the probe's pane that ignored that signal outlived the daemon (`frame/design.md` *Grounding*). | a measurement, which the owner takes at the hand run: after "Restart Daemon…" with a Claude Code pane open, `pgrep -lf claude` lists no process of that pane | It ends: the design stands. It lives on: a restart leaves an agent running that no window lists, and the same holds for a pane's close and for an archive today. An issue then has the daemon end a pane's process group with a stronger signal after a wait, for all three. | It ends, and the design is built as written. `gaps.md` *Not verified* carries the row until the hand run. | open |
