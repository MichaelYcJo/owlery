# Review round 1: 1795498003-interrupted-turn-stays-working

```seal
target: 9380d1f against c82c611
```

The target is the branch `fix/182-an-interrupted-turn-leaves-its-session-working` at `9380d1f`, against `release/v0.0.3` at the commit it was cut from, `c82c611`. The base has since gained `09ff5ad`, which is not merged in. Read: `git diff --name-only c82c611 09ff5ad` and the same over `c82c611..9380d1f` share no path, and `09ff5ad` moves `apps/desktop/package.json` to `0.0.3`, as `frame/plan.md` *Operational impact* says #183's work does. This is the first round, so no earlier round's coordinate is carried and every fact below was established here.

Stage 1 read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `9380d1f`, then the three phase records. No `pr.<lang>.md` stands, and `seal/config.json` sets `Commit and pull request language` to English, so none is owed. Stage 2 read every source file the diff changes and every new case, and followed each new call into `daemon.ts`.

## Findings

### 1. The comment and the closing memo misstate where the guard of `SessionLogWatch#fail` is reached, and claim that no case can reach it

```seal
severity: should
location: `apps/desktop/src/daemon/session-log.ts:121`, `seal/threads/1795498003-interrupted-turn-stays-working/gaps.md:11`, `seal/threads/1795498003-interrupted-turn-stays-working/trail/phases/phase-2.md:32`
evidence: executed `node --no-warnings test_tmp_session_log_guard.mts` in the round's clone, over `session-log.ts` transpiled by the worktree's esbuild (see Probes); read `apps/desktop/src/daemon/session-log.ts:43-58`, `apps/desktop/src/daemon/session-log.ts:121-126`, `apps/desktop/test/ledger.test.ts:10-23`, `apps/desktop/src/daemon/daemon.ts:1900-1903`
```

Why it matters: `gaps.md` hands this guard to the proofer, and its only grounds are the comment at `session-log.ts:121` and the row at `gaps.md:11`. Both state the wrong path. The next person who edits the watch will read them to decide whether the guard can go.

The claim: the comment says "a log that stands at once but cannot be watched is read once more, and that read can fail too". The row says the guard "is reached only where `fs.watch` refuses a file that stands, which no case can cause". `phase-2.md:32` says the same.

What the code does: where the log stands when the watch starts, the constructor calls `watch()` and returns (`session-log.ts:45-48`). No read follows, so a refused `fs.watch` calls `fail` once and the guard is not reached. Only the wait path calls `watch()` and then `read()` (`session-log.ts:52-54`), for a log that came to stand after the watch began. There, a refused watch followed by a refused read is the one way the guard is reached. The probe showed both paths. With `fs.watch` and `openSync` refused, a log that stood at once gave one failure and no guard hit. A log written after the watch began gave one failure and one guard hit.

"No case can cause" is also false. `apps/desktop/test/ledger.test.ts:10-23` replaces exports of `node:fs` with `vi.mock` for the module under test. A case in `session-log.test.ts` can refuse `watch` and `openSync` the same way. The probe did this through `syncBuiltinESMExports` and reached the guard.

The guard's effect at the daemon is read as well. The daemon's own `logUnread` (`daemon.ts:1900-1903`) already says the failure once a pane. So without the guard, the daemon's log would not change. Only the module's own promise at `session-log.ts:26`, "calls `failed` once", would break. The guard was added at `0e6ff37`, after the `seal mutate` run over `session-log.ts` at `a795981`, so no mutant has ever tested it.

The fix rewrites the comment and the row. Where the fix pass keeps the guard, it pins the guard with the case below. The case must be seen red with the guard's first line removed: the failures then read `["EMFILE: too many open files, watch", "EMFILE: too many open files, open"]`. The snippet was not typechecked or run under vitest. Only its mechanism was run, under Node v26.13.1, through `syncBuiltinESMExports` rather than `vi.mock`. The account at `phase-2.md:32` is a phase record. The fix pass may leave it as history, since the row at `gaps.md:11` is what states the present.

```ts
// apps/desktop/src/daemon/session-log.ts:121
  /** Ends the watch and calls `failed`, unless it ended already. A log that stood only after the watch began is watched and then read at once, so where `fs.watch` refuses it, the read that follows can fail too. */
```

```ts
// apps/desktop/test/session-log.test.ts, beside the imports: `vi` joins the import from "vitest".
// A case refuses `fs.watch` and the read's open, as a full table of watches would.
const refuse = vi.hoisted(() => ({ on: false }));
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  const refused = (call: string) => Object.assign(new Error(`EMFILE: too many open files, ${call}`), { code: "EMFILE" });
  return {
    ...actual,
    watch: ((...args: Parameters<typeof actual.watch>) => {
      if (refuse.on) throw refused("watch");
      return actual.watch(...args);
    }) as typeof actual.watch,
    openSync: ((...args: Parameters<typeof actual.openSync>) => {
      if (refuse.on) throw refused("open");
      return actual.openSync(...args);
    }) as typeof actual.openSync,
  };
});

// in describe("SessionLogWatch"):
  it("fails once where a log that stood only after it began can be neither watched nor read", async () => {
    const { log, lines, failures, watch } = watched(null);
    const made = watch();
    writeFileSync(log, '{"one":1}\n');
    refuse.on = true;
    cleanups.push(() => {
      refuse.on = false;
    });
    await pause(250);
    expect([lines, failures.map(({ message }) => message), made.open]).toEqual([[], ["EMFILE: too many open files, watch"], false]);
  });
```

The row at `gaps.md:11` then reads:

```markdown
| closed That a watch whose log stands but cannot be watched says its failure once. Where the log stands when the watch starts, a refused `fs.watch` calls `SessionLogWatch#fail` once and no read follows. Where the log stood only after the watch began, the read that follows a refused watch can fail too, and the guard at the head of `SessionLogWatch#fail` keeps that second failure unsaid | read by round 1 (`trail/rounds/round-1.md`, finding 1), and pinned by the case in `apps/desktop/test/session-log.test.ts` that refuses `node:fs`'s `watch` and `openSync` |
```

### 2. `frame/design.md` *Scope* item 1 says an assistant's log line stands as written with its paths replaced, and the fixture also replaces its thinking block's signature

```seal
severity: should
location: `seal/threads/1795498003-interrupted-turn-stays-working/frame/design.md:48`
evidence: executed `python3` over `apps/desktop/test/fixtures/claude-interrupted-turn.json`, listing each line that holds `<signature>`; read `seal/threads/1795498003-interrupted-turn-stays-working/frame/design.md:48`
```

Why it matters: *Scope* item 1 states what the committed fixture holds. Scenario 8 has the review and the sealer read the fixture against it. The sentence reads "A line whose `type` is `user` or `assistant` stands as written, with its paths replaced." The fixture's assistant line at `at` 7905 holds `"signature":"<signature>"` in its thinking block. The fixture's own `steps` say the signature is replaced. So the target contradicts the frame sentence, and the next reader who checks the fixture against the frame finds a line that is not "as written". Replacing the signature is the right choice for a public repository. The fix is to the sentence, not to the fixture.

```markdown
A line whose `type` is `user` or `assistant` stands as written, with its paths replaced and each thinking block's signature replaced by `<signature>`.
```

## Confirmations

What matched: *Scope* item 3. `isInterruptionEntry` (`apps/desktop/src/daemon/agent-events.ts:54`) refuses a line that does not parse, a non-object, a `type` other than `user`, `isSidechain: true` and `interruptedBySendNow: true`. It accepts only an array `message.content` holding a `text` block whose trimmed text is one of the two markers at `agent-events.ts:44`. A typed prompt stands in the log with a string `content`, as the fixture's two prompts at `at` 4872 and 10725 show. So a person who types a marker as their prompt is not read as an interruption, and the case at `apps/desktop/test/agent-events.test.ts:128` pins that. Read.

What matched: *Scope* items 4 and 5. `Daemon#interruptedTurn` (`apps/desktop/src/daemon/daemon.ts:1920`) ends the watch, broadcasts `agent` with `event: "interrupted"` and `tool: null`, and sets `waiting` with the text at `daemon.ts:105`, no tool and no questions. `agentStateAfter` gives `waiting` for a tool's end or failure while `interrupted` is true (`apps/desktop/src/daemon/agent-state.ts:22`). `agentEvent` clears the flag only where the state changes. So a `notification` that arrives after the interruption keeps the flag, and a later `PostToolUse` still leaves the session waiting. Read.

What matched: *Scope* item 6 and the closing memo's account of `Daemon#dropWorkItems`. The watch ends where the state leaves `working` (`daemon.ts:479`), at the daemon's close (`daemon.ts:660`), at a pane's close (`daemon.ts:1261`) and at its exit (`daemon.ts:1808`). `dropWorkItems` (`daemon.ts:1486`) runs after a removal or a delete only once `endSessions` (`daemon.ts:1569`) found no pane alive, and it throws otherwise. So every pane it drops has exited, and its exit ended the watch. An archive passes `null` as `late` and does not call `dropWorkItems`. A pane that outlives an archive keeps its session, and its exit ends the watch later. The only other writers of a pane's state are `silentStartOver` (`daemon.ts:1879`), which no live watch can meet because any event clears the silent start first, and headless sessions, which hold no watch. So the comment at `daemon.ts:1917-1918`, which says the pane is working when an interruption is read, holds. Read.

What matched: `gaps.md` *Not verified*, the row on the 16 KB bound (`gaps.md:10`). In `SessionLogWatch#take` (`apps/desktop/src/daemon/session-log.ts:100`), `held` grows only where `held` and the unfinished rest together stay within `LINE_BYTES` (`session-log.ts:115`). Otherwise it drops to empty and the watch skips to the next line end. The check at `session-log.ts:111` skips a longer line whole either way. So the row's account holds: with the bound replaced by `false`, the lines handed on are the same, and only the bytes held differ. Executed in the probe: after 40,000 bytes of a line with no end, the watch held 0 bytes with `skipping` true, and the next line, `{"after":1}`, was handed on alone. That is read and probed, not pinned: no case shows the bytes held, as the row says. The row's answerer was the proofer, and this paragraph is that answer.

What matched: `gaps.md:11`, the row's own question. A watch whose log stands but cannot be watched says its failure once on both paths, as finding 1's probe showed. Finding 1 is about the row's grounds, not this answer.

What matched: *Scope* item 7 and *Grounding*'s readers of `working`. `renderer.ts:1619` draws nothing for an `agent` message, so the new `interrupted` value reaches no reader in the window. `git grep` over `apps` outside the tests finds no other `switch` on `AgentEvent`. Executed.

What matched: scenario 8, the recording. The fixture names `claudeCode` `2.1.331`, `recordedAt` `2026-11-24`, and steps that name both Esc presses. `grep -c -E` over it for `/Users/`, `claude-501`, the login name, `accountUuid`, `organizationUuid`, `emailAddress` and `/private/` counted 0. Each line of a type *Scope* item 1 keeps out stands as its type, its `isSidechain` and `redactedCharacters`. The raw lines of the other types (`last-prompt`, `mode`, `permission-mode`, `atis-latch`, `file-history-snapshot`, `ai-title`, `tools-used`) hold ids and settings words, and nothing of the person's. Executed.

What matched: `pr.md`. Each of its seven quotes stands word for word at the coordinate it names: *Scope* items 2, 4, 5 and 7, *Out of scope*'s first item, and `gaps.md`'s second and third rows. Read.

What matched: `changelog.md`. Each item agrees with the code. The 16 KB skip, the 10-second wait, the failure said once a pane, the text of the state and the `interrupted` event with no tool each match a coordinate above. Its item on what the release does not cover names the unrecorded Esc during a running command and during a first reply, as `gaps.md` does. Read.

What matched: `phase-3.md`'s census of the moved definitions. Run again at `9380d1f`, the census also lists `apps/desktop/test/view.test.ts:1276`, an unrelated `const RECORDED`, and `apps/desktop/src/renderer/view.ts:2458`, `replayStep`, which the pattern `function replay` matches. Neither is a definition of the recording's play, so the account's conclusion holds. The account still handed back its list without these two hits. Executed.

Two weak points stand outside the findings. First, `apps/desktop/test/agent-events.test.ts:106` parses the fixture on its own, beside `apps/desktop/test/interrupted-turn.ts:12`. The case holds no fact the frame states beyond the parse, and `gaps.md` *Not done* gives the reason. So the duplicate parse is named here and opens no finding. Second, after an interruption ends the watch in the middle of a read, `SessionLogWatch#read` (`session-log.ts:88`) still reads to the log's end, and `take` puts the unfinished rest into `held` after `end()` cleared it. No line is handed on after the end, and the daemon drops the watch at once, so nothing the person sees changes.

Two axes were walked and gave no finding. On concurrency, an Esc followed by a new prompt that the daemon receives before it reads the interruption's entry would list a pane that works on the new prompt as waiting, until its next tool event. Claude Code wrote the entry 187 ms after each Esc in the recording (`phase-1.md:56-57`), which is shorter than a person needs to type and send a prompt, so no finding is opened. On security, `transcript_path` arrives over the hook socket, which only the person's own processes can write (`frame/plan.md` *The constraints*). A path naming a FIFO would block the daemon's synchronous read. Only a process that could already end the daemon can send one, so no trust boundary is crossed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a hook event fired inside a subagent names the main session's log as `transcript_path` or the subagent's own log. `followLog` follows whatever path the latest working event names (`daemon.ts:1891`), and a subagent's own log holds only `isSidechain: true` entries. Where subagent events name their own log, an Esc during a subagent's tool call would go unread. The recording held no subagent, and this round starts no real `claude` | `apps/desktop/src/daemon/daemon.ts:1891` | the orchestrator, who may add an Esc during a subagent to the owner's walk of release 0.0.3 (#184) |
| The full suite, the typecheck and the lint at `9380d1f`. Rule 2 leaves the broad gate to the orchestrator, and the phase records label the suite `unverified` beside narrow runs | the whole package | the orchestrator's broad run |
| The `seal mutate` results that `phase-2.md` and `phase-3.md` report. This round did not run them again | `apps/desktop/src/daemon/` | the sealer |
| Whether finding 1's case typechecks and runs under vitest in Electron's Node. Only its mechanism was probed, under Node v26.13.1 | `apps/desktop/test/session-log.test.ts` | the fix pass |

## Probes

| Command | Result |
|---|---|
| In the round's clone at `9380d1f` (`<scratchpad>/1795498003-interrupted-turn-stays-working/round-1/clone/apps/desktop`): the worktree's `esbuild` transpiled `src/daemon/session-log.ts` to `test_tmp_session_log.mjs`, then `node --no-warnings test_tmp_session_log_guard.mts` ran once under Node v26.13.1. The probe replaced `fs.watch` and `fs.openSync` through `syncBuiltinESMExports` and counted each call of `fail` that met an ended watch | A log that stood at once, with watch and open refused: `failures` `["EMFILE: probe refuses watch"]`, guard hits 0. A log written after the watch began, with both refused: `failures` `["EMFILE: probe refuses watch"]`, guard hits 1. A 40,000-byte line with no end and no refusal: `held` 0, `skipping` true, and then `lines` `["{\"after\":1}"]` |
| `git grep -n -E` with phase 3's census pattern over `apps` at `9380d1f` | The module's definitions once each. Also `agent-events.test.ts:106`, `session-log.ts:6`, `interrupted-turn.ts:2`, and the two unrelated hits named under Confirmations |
