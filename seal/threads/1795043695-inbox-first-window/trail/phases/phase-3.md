# Phase 3: 1795043695-inbox-first-window

## What this phase found

**The frame holds for this phase, and one sentence of phase 4's part does not hold after a daemon starts again.** Every path `frame/design.md` *Data & interfaces* names for *Scope* item 18 was opened at `b23ba97` and is where the frame says: `apps/desktop/src/shared/protocol.ts`, `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/daemon/work-items.ts` and `apps/desktop/test/daemon.test.ts`. `seal/follow-up.md` does not exist. `git diff --stat ed91bb6..b23ba97 -- apps/desktop/src/daemon apps/desktop/src/shared apps/desktop/test/daemon.test.ts` printed nothing, so the daemon and the protocol were as issue #8 left them. The sentence that does not hold is in *Scope* item 19, and it is the first entry of the last section below.

**What the daemon and the protocol are now.** The build is `24c2204`.

- `src/shared/protocol.ts` has the three additions *Data & interfaces* gives, with those names: `Look`, the client's message `{ type: "looked" }`, and `lastLook: Look | null` in `ready`.
- `src/daemon/last-look.ts` is the module of its own. Its class `LastLook` has `get()`, which gives the look or `null`, and `record(at, sessions, workItems)`, which replaces it. The file is `last-look.json` in the run folder, written with mode `0600` to a partial file that is then renamed, as `work-items.ts` writes its list. The frame names neither the class nor the file.
- `src/daemon/daemon.ts` builds a `LastLook` on the run folder beside the list of work items, handles `looked`, and sends `lastLook` in `ready`.

**Departures from the frame and decisions made while building, each with its grounds.** Each was judged against `frame/design.md` *Scope* item 18 and *Data & interfaces*.

- *The diff names two files *Data & interfaces* does not.* `src/daemon/main.ts` changed in two comments, which said that the run folder holds the list of work items and now say that it holds the look as well. `test/last-look.test.ts` is new and holds the module's cases, as `test/work-items.test.ts` holds those of `work-items.ts`. *Data & interfaces* puts the cases of scenario 19 in `test/daemon.test.ts`, and they are there.
- *A `looked` is answered with nothing and sent to no client.* Item 18 says the daemon "keeps one record" and names no answer. The window sends the message as it loses focus, and it draws its lists whole at every `inbox` (`gaps.md` *Not done*), so an `inbox` sent here would redraw every window at that moment. A client learns of a look in its next `ready` and nowhere else.
- *The look's time is read from the daemon's clock option,* `DaemonOptions.now`, which already gives a work item's `createdAt`. The cases set it.
- *The look holds copies.* The daemon's list of sessions gives the objects it goes on changing, so a look that kept them would change with the agent's next event. `LastLook` copies each session and each work item, field by field. The same copy drops whatever a file's entry carries beyond the protocol's fields, as `work-items.ts` does for its file.
- *A file that is not a look reads as no look.* The whole file is refused where the time is no number, a list is missing, or one entry is not a session or a work item. A look with an entry dropped would show its work item as new. The file is always written by a build that records a base commit, so a work item without that field is refused, where `work-items.ts` reads one.
- *A session's kind is checked as text and not against the two kinds.* A look written by a build that offers a third kind still reads.
- *A write that fails leaves the daemon up, with the look in memory.* `looked` carries no request id, so no `error` can answer it, and an exception thrown inside the handler of a client's message would end the daemon's process. `LastLook#record` holds the look before it writes and lets the write throw. The daemon catches it and writes "the last look was not written: " with the error's message to its error output, which the app appends to `daemon.log`. The frame says nothing of a failed write. A person reads the line in that log alone.
- *`ready` is typed with `lastLook` always there.* Item 18 has the window read a `ready` without the field as `null`. That reading is the window's, in phase 4.
- *The package's whole `tsc --noEmit` ran before the build's commit* and exited 0. The repository configures no linter and no formatter.

**Seen red.** The cases were written first and run against the tree as `b23ba97` holds it (`pnpm run test test/last-look.test.ts test/daemon.test.ts`, exit 1). `test/last-look.test.ts` did not load: "Cannot find module '../src/daemon/last-look'". Six cases of `test/daemon.test.ts` failed, and 57 passed.

- "carries only the fields the protocol names, none of them a vendor's", an existing case that now asks for `lastLook` among the keys of `ready`: `expected [ 'headless', 'paneKinds', …(3) ] to deeply equal [ 'headless', 'lastLook', …(4) ]`.
- "gives a client no look where no client ever sent `looked`": `expected undefined to be null`.
- "keeps the time and both lists of the moment a client sends `looked`, and gives them to a client that connects afterwards": `expected undefined to be null`, on its first reading.
- "replaces the look with the one of a later `looked`, from whichever client": `expected undefined to deeply equal { Object (at, sessions, ...) }`.
- "gives after a restart the look taken before it, from a file the user alone can read": `ENOENT` at the `stat` of `last-look.json`.
- "stays up and holds the look where its run folder cannot be written, and says so in its log": `expected undefined to deeply equal { at: 1234, sessions: [], …(1) }`.

"tells a client of the look only in its `ready`: a `looked` is answered with nothing and sent to nobody" passed against the old daemon, which ignores the message. It asserts that something is not sent, so it was shown red three ways at `24c2204`, each a break run alone. With `broadcastInbox()` added after the look is recorded, and with an `inbox` sent to the asking client alone, it failed on the asking client's line: `expected [ 'ready', 'inbox', 'error' ] to deeply equal [ 'ready', 'error' ]`. With an `inbox` sent to every client but the asking one, it failed on the other client's line: `expected [ 'ready', 'inbox' ] to deeply equal [ 'ready' ]`.

After the code the same command exited 0 with 73 passing.

A red that says a module is missing names no guard. Seven mutants of `last-look.ts` were therefore run alone at `24c2204`, without `--bail`, and the failing lines read.

- The time not checked: "holds no look where the file is not one" failed on its line for a time written as text, `expected { at: '1234', …(2) } to be null`.
- A session's state not checked: the same case failed on its line for the state `sealed`.
- A work item's count not checked: the same case failed on its line for a count written as text.
- The sessions kept as given, uncopied: "keeps the lists as they stood, though a session or a work item it was given changes afterwards" failed, and so did "reads only the fields of a look, whatever else the file carries".
- The sessions copied whole, with every field: "reads only the fields of a look" failed alone.
- The look held only after the write: "holds the look it was given though the file cannot be written, and says that it was not" failed with `expected null to deeply equal { at: 1234, …(2) }`.
- A look with no run folder written into the working folder: "keeps the look in memory alone where it is given no run directory" failed with `expected true to be false`.

One break of `daemon.ts` run alone, the error thrown again in place of the line written to the log: "stays up and holds the look where its run folder cannot be written" timed out, and the run reported the `ENOENT` as an unhandled error.

**`seal mutate`, at `24c2204`.** Two calls, each with `--bail 1` and a passing baseline.

- `src/daemon/last-look.ts` against `test/last-look.test.ts`: 26 mutants, 26 red. They were: the time not checked; the entries of each list not checked; each of the five checks of a session and of the eight checks of a work item removed; each list copied whole and each kept uncopied; the look held only after the write; the file's mode `0644`; the file's name changed; the look with no run folder written into the working folder; the reader keeping only a file that is not a look; and the time recorded as zero.
- `src/daemon/daemon.ts` against the six cases of "the last look" and the case on the protocol's fields: 9 mutants, 9 red. They were: `ready` sending `null`; the look built without the run folder; the time read from the system's clock; the sessions recorded as none; the work items recorded as none; the log line's words changed; the log line not written; an `inbox` sent to every client after the look; and the message's name changed.

A call of many prints each verdict and exit code and neither the failing line nor whether the mutant parsed. One break first written for this phase did not parse, read `red` with "no tests", and was written again; its second form is the third of the three breaks above. `gaps.md` carries what the two calls leave unshown.

**Two guards no case can fail alone.** `isLook` and `isSession` each open with a check that the value is an object and not `null`. With that check removed, reading a field of `null` throws, the reader's `catch` takes it, and the look is `null` as before. The lines for a file that holds `null` and for a list that holds `null` pass either way. The checks stay because they say what the function accepts, and no mutant of them was run.

**Scenario 19.** Its three clauses are the cases "keeps the time and both lists of the moment a client sends `looked`", "gives after a restart the look taken before it" and "gives a client no look where no client ever sent `looked`", in `describe("the last look")` of `test/daemon.test.ts`. The first also changes the agent's state after the look and reads the look unchanged beside the new list.

**How the cases wait for a message that has no answer.** A case sends `looked` and then a `start` that names work item 999, which the daemon refuses with an `error`. The daemon handles one client's messages in order, so the refusal arrives after the look is recorded, and it starts nothing. The case on the protocol's fields sends an `attach` in the same place and waits for its `replay`.

**Scenarios 13 and 14, executed at `24c2204`.**

- 13: `git grep -n -i -e claude HEAD -- apps/desktop/src/renderer` printed nothing and exited 1. The phase changed no file there.
- 14: `git diff --stat ed91bb6..HEAD -- apps/desktop/src/daemon apps/desktop/src/shared apps/desktop/test/daemon.test.ts` named five files: `src/daemon/daemon.ts`, `src/daemon/last-look.ts`, `src/daemon/main.ts`, `src/shared/protocol.ts` and `test/daemon.test.ts`. Read against *Data & interfaces*: four are the ones it names, and `main.ts` is the two comments of the first departure above. Nothing in the five serves another item than 18.

**The phase boundary run.** `pnpm run test test/daemon.test.ts test/last-look.test.ts test/view.test.ts` at `24c2204` with a clean tree: 3 files, 128 passed, exit 0. The first two are the test files the phase changed. `test/view.test.ts` imports the protocol's types, and `src/renderer/view.ts`, which imports them too. No other test file names `shared/protocol`, `daemon/daemon`, `daemon/main` or `last-look` (`grep -l` over `test/*.ts`). The repository's contribution guide names no tree-wide test file.

**No process was started outside the test runner,** and the phase made no drive. The cases' daemons and run folders are closed and removed by the cases. The phase's scratch holds the captured runs and `mutate.py`, which calls `seal mutate` with each pair as an argument of its own.

**What phase 4 needs from the protocol.**

- *After a daemon starts again, its `ready` carries no count of new commits, and the look does.* The daemon keeps the counts in memory and reads them from git after a client's hello, so every work item of that first `ready` has `newCommits: null`, which `inboxLine` reads as no new commit. The existing case "lists after a restart the work items made before it" asserts the `null`, and the look in `last-look.json` holds the counts as they were read. *Scope* item 19 has the window work the changes out "once, at `ready`", from a difference in the count. Built to the letter, every work item whose look holds one or more new commits reads as changed at the first load after the daemon went away, with no rise to name. The daemon exits a minute after the last client leaves where no pane is alive, so this is the load of a person who closed the app and came back. The counts arrive in the `inbox` that follows the daemon's first read from git, which it starts at that hello. What settles it is the frame's: the window may hold the comparison until a count is no longer `null`, or the daemon may read the counts before it answers a hello. Neither is built.
- *A session's id is the daemon's count, which starts again at 1 with the daemon.* A session of the look and a session of the present lists with one id are the same pane only where the daemon did not start again. `changesSince` as *Data & interfaces* gives it calls `inboxLine` once over the look's two lists and once over the present two, and matches work items by id, which the run folder keeps. It must match no session of one against the other.
- *The look's sessions and work items are whole entries of the protocol,* an exited session and a session with no work item among them, so `inboxLine(workItem, look.sessions, paneKinds)` takes them as they are. The look holds no kind of pane: the window uses the `paneKinds` of the present `ready`.
- *`looked` has no field and no answer, and changes nothing a connected client is sent.* The window that sent it reads the new look at its next load. A `looked` sent before `hello` closes the connection with the code 4001, as any message does, so the window sends it only while it is connected (item 18).
- *A daemon of an earlier build sends a `ready` without `lastLook`.* The type says the field is always there, so the window reads `message.lastLook ?? null` or the type is loosened there. Such a daemon drops `looked` in the `default` branch of its `handle`, read at `ed91bb6` and not run.
- *Whether a `looked` sent while the page unloads reaches the daemon is not known.* The message travels on the page's WebSocket, which closes with the page. Scenario 22 reads the look after the window lost focus, not after it closed.
- *The look's time is the daemon's clock in milliseconds,* as `Date.now()` gives it, for `lastHere(at, now)`.
- *The cases' way of waiting,* a refused `start` after `looked`, serves a probe's second client as well, where the drive must know the look is recorded before it loads the window.
