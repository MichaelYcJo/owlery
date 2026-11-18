# Closing memo: 1795042041-headless-session

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them: phase 1 ran four test files of `apps/desktop` in one command at `86cb04d`, and `tsc --noEmit` over the files it changed and the files that import the protocol, not `pnpm -r run check`. It also ran the package's own `tsc --noEmit` once, before its first commit, at a tree that two later edits changed. No workflow under `.github/workflows/` runs the suite (`seal deferrals . --kind all`) | the orchestrator, by the broad run after the last phase |
| The daemon process starts headless sessions through the Claude adapter: `src/daemon/main.ts` passes `claudeAdapter(process.env)` to `Daemon`, which was read and not run | phase 2's builder, by scenario 1 of `frame/design.md` in the built app |
| A daemon started by the app opened from the Finder finds `claude`: the probe gave the adapter the environment such a daemon has (`HOME`, `USER`, `SHELL`, the system `PATH`, no `LANG`), from a process started in a terminal, and the app itself was not opened from the Finder | a person who opens the packaged app from the Finder and asks once |
| A tool call that needs permission is refused in a headless session (`frame/design.md` *Scope* item 7, last sentence): the probe's prompt called no tool | a measurement: one run of the adapter with a prompt that asks for a file to be written, reading `permission_denials` of the `result` line |
| What the CLI prints where the user is not logged in, is over a usage limit, or the turn ends in an error: the fixture holds one good turn, and the mapping of an error result (`is_error`, `result`) was written from the fields of the good one | a person whose `claude` is logged out, or a recorded line of such a run |
| What the growing answer holds where the agent calls a tool or a subagent: the mapping gives every text block of every `assistant` line, a subagent's among them, and no such line was recorded | a measurement: one run of the adapter with a prompt that makes the agent read a file |
| Whether each of the 51 mutants `seal mutate` reported red in calls of several mutants failed on the line that watches its unit: those calls print the verdict and the exit code, not the failing line | a reader re-running one pair alone, as `trail/phases/phase-1.md` did for seven |

## Not done

- **A failed session does not say what the CLI printed on its error stream.** The adapter drains that stream and drops it, and the neutral `exit` event carries the exit code alone. A process that dies before a result shows `the session exited with code <N> and gave no result` and nothing more. `frame/design.md` *Scope* item 1 names the three events and their fields.
- **The pieces of text are joined with nothing between them.** The growing answer of a turn with a tool call runs two texts together until the result replaces it. The frame names `text` as a piece of the answer, in order.
- **No headless session ever leaves the list.** Each stays in the daemon's memory, whole, until the daemon exits, and `ready` carries all of them. Removing one, and keeping them across a restart, are out of scope (*Scope* item 8).
- **Nothing bounds a run.** A CLI that never prints a result and never exits keeps its session `working` and the daemon alive. No client can stop a run (*Scope* item 8), and the daemon has no time limit of its own. Nothing bounds how many run at once either.
- **`stop` sends the process the termination signal and does not wait.** A CLI that ignores the signal outlives the daemon.
- **A found CLI path is kept for the daemon's life.** Where the user moves or removes `claude` afterwards, the next ask fails with Node's own spawn message, and only a new daemon looks again.
- **The adapter's feature list goes nowhere.** Both adapters declare none, and the protocol carries no field for it. `docs/architecture.md` *Rules that keep it portable* rule 2 has the window read it once a feature differs by vendor.
- **The CLI's version is not read.** The flags were run against 2.1.327 alone. Checking the minimum version is out of scope (*Scope* item 8).
