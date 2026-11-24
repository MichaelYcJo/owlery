# Questions for the planner: an interrupted turn leaves its session not working

The judgments the issue left open that the tree and Claude Code's published reference answered, each with where its grounds stand. Nobody needs to reopen them.

- Which state "not working" is, `waiting` or `finished`: `frame/plan.md` *Alternatives considered*, the rows on `finished` and on a state of its own.
- Whether the daemon may read a file where no hook event comes: `frame/design.md` *Grounding*, the row on *The phone: the terminal session as a chat*.
- What the daemon reads where Claude Code sends no event: `frame/plan.md` *Alternatives considered*, the rows on the key, the tail read every second, the pane's output, the silent time and `idle_prompt`.
- Whether each thing that waits for the session needs a change of its own: `frame/design.md` *Grounding*, the entry on the readers of a pane's `working` state.
- Whether the person who pressed Esc is notified: `frame/design.md` *Grounding*, the entry on `notificationFor`.
- How many interruptions the one session records: `frame/plan.md` *Alternatives considered*, the last row.
- Whether the recording runs through the built app: `frame/plan.md` *Alternatives considered*, the row on the built app.

No row below is a person's. Q1 and Q2 are answered by running something the framer could not run: Q1 needs the one real `claude` session the owner allowed, which is the build's first step and which no other agent of the run may start, and Q2 needs the repository's code run under Electron's Node, where the framer's probe ran a script of its own under another Node.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | What does Claude Code send and write when a person interrupts a turn with Esc: which hook events arrive after the key, and does the session log gain an entry of `frame/design.md` *Scope* item 3's shape, for a tool call and for a reply? | a measurement: the recording of phase 1 | (a) The log gains such an entry at both interruptions: phases 2 and 3 are built as framed, and where a tool's event arrives after the entry, *Scope* item 5 already holds it. (b) One hook event names the interruption at both interruptions: the orchestrator routes a fold to the framer, the event replaces the log's reading, and the watch is not built. (c) The log gains no such entry, or gains it only when the next message is sent, and no event names the interruption: phase 2 is not built, and the orchestrator routes the recording to the framer | (a), from the reference's statement that no `Stop` runs and from the entries read in this machine's logs | open |
| Q2 | Does `fs.watch` report an append to the session log to the daemon as the framer's probe saw it, under Electron 45's Node? | a measurement: the first case of phase 2, run by the crafter | It does: the watch is built as framed. It does not, or it reports late or twice: the crafter reads the log's size on a timer while the pane works, in place of the watch, says so in the phase record with the interval it chose, and *Scope* item 6 holds as written | It does | open |
| Q3 | How many bytes of one appended line does the daemon parse before it leaves the line unread? | the work: phase 2 | A bound under an entry's length reads no interruption, and no bound parses a tool result of megabytes at every append. The crafter picks the bound from the longest interruption entry the recording holds | 16 KB, over twenty times the longest entry read at framing | open |
