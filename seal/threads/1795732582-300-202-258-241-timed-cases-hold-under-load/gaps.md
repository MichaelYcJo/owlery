# Closing memo: 1795732582-300-202-258-241-timed-cases-hold-under-load

## Not verified

| Item | Who must answer |
|---|---|
| The hosted runner's `pnpm install --frozen-lockfile` builds the patched `pty.cc` for Electron, and `pty.test.ts` "leaves no pseudo-terminal open in this process…" passes there; the packaging job's install does the same (`frame/questions.md` Q3). Phase 1 ran the frozen install in a fresh clone of the branch on this Mac only. | the orchestrator, from the pull request's `check` job and the next run of `.github/workflows/package.yml` |
| The account-change group passes in a whole run of the suite beside another test run, now that panes leave no pseudo-terminal open (`frame/questions.md` Q1). Phase 2 ran the group, filtered, beside eight `yes` loops and no other test run, since the machine's lock lets one run at a time. | the orchestrator, at this work item's broad gate and at the gates of #132, #257 and #127 |
| The changed cases of phase 2 (the two fetch cases, #258's `it.each`, the inbox cases) hold on the hosted runner. Phase 2 measured them on this Mac only. | the orchestrator, from the pull request's `check` job |

## Not done

Phase 1: the patch closes the slave and the spare terminals at `done:` alone. Where `pty_posix_spawn` returns before the spawn (the master, `grantpt`, `unlockpt`, the slave's name or open, `tcsetattr` or the window size fails), the spare terminal stays open, and the master too after it was opened, as in node-pty 1.1.0. Those paths are reached only where a start fails, at the machine's limit of pseudo-terminals for one, and the caller then throws `posix_spawnp failed.`. node-pty 1.2.0-beta.18 sends every such path to `done:` after moving the setup of the spawn's file actions above the first failure; that restructuring is a larger patch than `frame/design.md` *Scope* item 1 asks, and the move to node-pty 1.2.0, which `frame/design.md` *Scope* puts out of scope, brings it.

Phase 2: the hello's wait was set only in `describe("the inbox")`, which `frame/design.md` *Scope* item 6 names. The same cause can reach a case elsewhere in `daemon.test.ts` whose hello comes while the store lists a work item, under the default wait of 500 ms, and that compares what `ready` carries or the list of message types after it. `grep -n 'messages.map((m) => m.type)).toEqual(\["ready"' apps/desktop/test/daemon.test.ts` and `grep -n 'message("ready")).workItems' apps/desktop/test/daemon.test.ts` list candidates, and on 2026-11-27 they printed lines in blocks other than `describe("the inbox")`, `describe("what a person sets on a work item")` and `describe("repositories")` among them. That list is a sample built from two spellings, and no case on it was judged or run under a slowed read. Each needs the reading the inbox cases had: whether its daemon lists a work item with a base commit at that hello. Widening the change to them is past the item's scope and goes to the orchestrator as a leftover.
