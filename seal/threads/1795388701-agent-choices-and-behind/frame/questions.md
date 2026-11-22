# Questions for the planner: 1795388701-agent-choices-and-behind

The issue and the routing left these judgments open, and the tree, a document or a probe answered each. Their grounds stand where named, and none is a question:

- Which field of a hook's payload carries the choices an agent offers: `frame/design.md` *Grounding*, the fact "Which field carries the choices".
- Which event begins the wait of a session that asks: `frame/plan.md` *Alternatives considered*, the chosen row and the row on `PermissionRequest` alone.
- Which field of a `Notification` holds its text, which the frame of issue #18 left open: `frame/design.md` *Grounding*, the fact on a `Notification`.
- How the daemon counts "behind" without asking a remote: `frame/design.md` *Grounding*, the facts on how ahead is counted and on the one git command, and `frame/plan.md` *Alternatives considered*, the rows on `aheadOf` and on fetching the base.
- Whether "behind" is said at 0: `frame/plan.md` *Alternatives considered*, the row "Leave "behind" out where it is 0".
- Whether a base that moved is a change since the last look: `frame/design.md` *Grounding*, the fact "Neither count is a change since the last look".
- Whether the window answers a question: `frame/design.md` *Grounding*, the row of `docs/design.md` *Principles* 2.
- Whether the choices are numbered: `frame/plan.md` *Alternatives considered*, the row "List the choices without numbers".
- Whether this pull request writes `docs/`: `frame/plan.md` *Alternatives considered*, the last row.
- Where this work meets #46, #41 and #45, and which merges first: `frame/plan.md` *Overlap with the release*.

No row below is a person's to decide, so none blocks the build.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Which hook events does a real interactive Claude Code send when its agent calls `AskUserQuestion`, in which order, and does its own dialog list the choices in the payload's order under the same numbers? The reference and the executable's text answer the shape of `PreToolUse` and are silent on `PermissionRequest` for this tool. No probe can run here: it needs a logged-in interactive `claude` that reaches a question, which no subagent can drive and which the owner's rule for this run forbids | a measurement | (a) `PreToolUse`, then `PermissionRequest`, then a `Notification` after some seconds: the build holds as it is, and the later events change nothing. (b) `PreToolUse` and no `PermissionRequest`: the build holds as it is, since the first event begins the wait. (c) No `PreToolUse` before the dialog, or a `tool_input` of another shape: the line says what it says today, and a follow-up issue changes `agent-events.ts` alone. (d) The dialog orders or numbers the choices otherwise: a follow-up issue drops the numbers of *Scope* item 8. The measurement is one run by a person at the built app, started with `OWLERY_DEBUG_HOOKS=1`, in a Claude Code pane whose agent is asked to offer a choice: `daemon.log` names each event in its order, and the work item's line shows whether the choices were read | The build reads `PreToolUse` and `PermissionRequest` of the tool as the reference gives the shape, and numbers the choices in the payload's order | open |
| Q2 | Does the app that `apps/desktop/test/notification-click.test.ts` starts serve the case of scenario 11, with its `feed` taking a payload, or does another built-app file's start serve it better? It is known only when the case is written against that file's panes and fixtures | the work | That file: its `feed` gains the event's fields, and the case reads the line, the preview and the view there. Another file that starts the app with an agent's pane: the case stands there. A new file with a start of its own is the last choice, since each start costs the suite time and the owner's rule asks for as few starts as the question needs | `apps/desktop/test/notification-click.test.ts` | open |
