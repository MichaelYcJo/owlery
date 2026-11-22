Part of #26. The issue closes when `release/v0.0.2` reaches `main`.

A question asked in a work item's "Ask" section runs as a headless Claude session. A session whose CLI died before a result said only its exit code, because the adapter dropped the CLI's error stream. A CLI that never finished kept its session working and the daemon alive, and nothing could stop it. The daemon kept every session it ever ran. Milestone 2's role sessions (#38 on) run on this adapter while the person is away, so each of these would become a work item stuck with nobody watching.

| Done when | What holds now |
|---|---|
| A failed session shows the last of what the CLI printed on its error stream | The Claude adapter keeps the last 2,000 characters of the error stream (`ERROR_OUTPUT_CHARS`), the `exit` event carries them as `errorOutput`, and the window shows them under the error with their line breaks kept |
| A run ends at a stated limit or by a client's message, and a process that ignores the signal is killed | A run ends 60 minutes after its start (`HEADLESS_LIMIT_MS`), or at the new client message `stopHeadless`, which the window's "Stop" button sends. The stop signals the CLI's whole process group with SIGTERM, then with SIGKILL 2 seconds later (`KILL_AFTER_MS`) where the CLI has not exited by then, and settles when the CLI has exited. `HeadlessInfo.stopped` reads `"limit"` or `"request"` |
| The number of finished sessions the daemon keeps is bounded | The daemon keeps the 50 sessions that ended last and every working one (`HEADLESS_KEPT`), and sends `headlessDropped` when the bound drops one. The window takes it out of its list |

**What the CLI prints when it fails** was recorded first, at no cost to the owner's usage, with the adapter's own arguments under an empty `HOME`. Not logged in and a refused API key come back as a result with `is_error`, which the adapter already mapped, and the not-logged-in turn is now a fixture. A bad input line and an unknown option print to the error stream alone, which is what the kept tail shows. What the CLI prints over a usage limit is not recorded; #74 needs it.

**Quitting the daemon, archiving and deleting a work item wait for the runs they stop**, within the waits they already had, so a delete does not judge what it would lose while a stopped CLI can still write in the worktree.

**The window's "Stop" button, its error output and the drop of a session** are held by `apps/desktop/test/ask-section.test.ts`, which drives the built app with a script CLI (review round 1, finding 3). The decisions behind them are cases of `view.ts`.

**The limit counts from the start, not from the last output.** Counting idle time would miss a run that loops while printing, and would stop a long tool call that prints nothing. `--max-budget-usd` was not used, because it cannot end a CLI that hangs; #41 and #42 choose budgets per stage.

**A daemon of an earlier build** ignores `stopHeadless`, and its failed sessions show no error output, until a person restarts it from the app menu, as the status line asks.

Not verified, as the records state:

- **A real Claude Code under the group kill during a turn**: how long it takes to exit, and whether a tool's process stays in its group (`frame/questions.md` Q2 and Q3). The cases use script CLIs, and no real `claude` turn was run.
- **The cases that run against time** were run on the owner's Mac. This pull request's `check` run on the macOS runner reads them there.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
