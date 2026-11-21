# Questions for the planner: 1795268972-headless-failure-and-limit

The ticket left these judgments open, and the tree or a probe answered each. They are not to be reopened without opening their grounds:

- How much of the error stream is kept, and which part: `frame/design.md` *Scope* item 1, on the probe table of *Grounding*.
- What the run's limit is, what it counts and where it is stated: `frame/design.md` *Scope* item 3 and *Rule changes*, and `frame/plan.md` *Alternatives considered*, the rows on the limit.
- Which client message ends a run: `frame/design.md` *Scope* item 4.
- How long the daemon waits before it kills a process that ignores the signal: `frame/design.md` *Scope* item 2, on `frame/plan.md` *Technical context*, second paragraph.
- How many finished sessions the daemon keeps, and in which order they leave: `frame/design.md` *Scope* item 7, and `frame/plan.md` *Alternatives considered*, the row on a bound per work item.
- What the CLI prints with no login or a refused key, the row #26 carries from the settle of release 0.0.1: `frame/design.md` *Grounding*, the probe table's first two rows.

No row below needs a person, and none blocks the build.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | What does Claude Code print, on each stream, for a turn refused because the account is over its usage limit? #74 tells a stage the usage limit ended from a failed one by it. The tree holds no such line, and no probe reaches it without an account over its limit, which the owner's is not | a measurement: the lines of one `claude -p` run made while the account is over its limit, recorded as `frame/design.md` *Grounding* recorded the run with no login | An error `result` on the output stream: the session fails with the result's text, as no login does, and #74 reads the result's fields. Text on the error stream: the session fails with the exit's text, and the tail of *Scope* item 1 carries it | The mapping this work leaves stands for the line whatever it is: either stream reaches the person | open |
| Q2 | How long does Claude Code take to exit at SIGTERM while a turn is in flight? The probe measured 389 ms before the first message, and a turn's run costs the owner's usage, which the spawn asked to keep down | a measurement: one stop of a run during a turn, the time from the signal to the exit | Under 2 seconds: the kill never fires for a well-behaved CLI. Over 2 seconds: a CLI that would have ended by itself is killed, and what it was writing at the end is lost | `KILL_AFTER_MS` of 2,000 ms, under the daemon's 3-second wait and the app's 5-second wait | open |
| Q3 | Does a tool's process that Claude Code starts, such as a Bash tool's shell, stay in the CLI's process group? A probe would run a turn with a tool call, which costs usage | a measurement: one run whose turn starts a long tool command, then a stop, reading whether the tool's process is still there | In the group: the group kill of *Scope* item 2 ends it. In a group of its own: it outlives a CLI that was killed, and #41, whose crafter runs tools, needs another way to end it | The group kill, which ends what stays in the group and costs nothing where nothing does | open |
| Q4 | Does one limit of 60 minutes fit every stage of the chain? No role session runs yet, so no stage's length can be measured | a measurement: the lengths of the stages #41 and #42 run, read from their runs | Every stage under 60 minutes: one limit stands. A stage longer: #41 gives each stage its own limit through `startHeadless` | `HEADLESS_LIMIT_MS` of 60 minutes for every run | open |
