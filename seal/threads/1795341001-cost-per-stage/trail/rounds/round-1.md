# Review round 1: 1795341001-cost-per-stage

```seal
target: 75fc841 against release/v0.0.2
```

The branch was read whole against its merge base `41e8aa4`, the code first against `frame/design.md` and the `docs/architecture.md` clauses its *Grounding* cites, and then for quality. No earlier round exists, so no fact is carried from one: every coordinate below was opened at `75fc841`. No `seal/parity.json` is declared. The frame cites no reference root.

The axes walked: the neutral shape against *Data & interfaces*, field by field from the frame to the code; the login's mark against *Scope* item 4; each end of a headless session against *Scope* items 9 and 10 (result, error result, exit, rejected start, stop at the limit, stop at a request, the stops a delete, an archive and a removal make, the daemon's close); the store's file handling (torn line, empty file, a folder in the file's place, a file that cannot be written, no run directory); the read's filter by work item and by `createdAt`; the new request's error path; the mode of the file; and resource lifetime of the held entries. Two axes this change adds: a write that fails part way, and the clock the two times and `createdAt` are read from (one option, `daemon.ts:130`).

## Findings

### 1. An append that fails part way writes a held entry a second time at the next append

```seal
severity: should
location: `apps/desktop/src/daemon/ledger.ts:93-104`, `apps/desktop/test/ledger.test.ts`
evidence: read `apps/desktop/src/daemon/ledger.ts:93-104`, `apps/desktop/src/daemon/ledger.ts:51-69`
```

Why it matters: the ledger is what #47 sets beside each round's catch and what #76 publishes. An entry written twice reads as a stage that ran twice, and its cost is counted twice. Nothing reads the file for duplicates, so the error is silent.

The grounds. `add` joins every held entry and the new one into one text and appends it in one call (`ledger.ts:97-99`). It clears `held` only when that call returns (`:100`). A write to a full disk writes the bytes that fit and then throws, so the call can leave whole lines of the first held entries in the file and still throw. All of them then stay in `held`, and the next append that succeeds writes them again after those lines. For example, the first append of A fails with nothing written, so `held` is `[A]`. The append of B then writes `A\n` whole and part of `B` before it throws, so `held` is `[A, B]`. The append of C then writes `\nA\nB\nC\n`, and `read` gives A twice. The frame's *Scope* item 8 asks that a failed entry is "written before the next entry's line", and the plan's row on `ledger.jsonl` rests on "no write can lose one that was written". Neither allows a write to give one entry twice. No case of `test/ledger.test.ts` fails an append part way: the folder case and the read-only case each fail an append before any byte is written.

The fix appends one entry at a time, and each leaves `held` once its own append returns. A failure then keeps only the entries whose line is not whole in the file. A torn line it leaves is counted as unread, and its entry is written again on a line of its own, which `endsInsideALine` already provides. The precondition is that `appendFileSync` throws only where its line is not whole in the file. A close that fails after a whole write breaks that precondition, and the fix does not cover it.

```ts
  /** Appends one entry, after the entries held since an append failed. */
  add(entry: LedgerEntry): void {
    this.held.push(entry);
    if (this.file === undefined) return;
    try {
      // One append for each held entry, which leaves the held list once its line is written: an append that fails part way
      // keeps only the entries whose line is not whole in the file, so no entry is written twice.
      while (this.held.length > 0) {
        const line = `${JSON.stringify(this.held[0])}\n`;
        // A line a crash or a failed append cut stays, and the next entry starts a line of its own after it.
        appendFileSync(this.file, endsInsideALine(this.file) ? `\n${line}` : line, { mode: 0o600 });
        this.held.shift();
      }
    } catch (error) {
      console.error(`an entry of the ledger was not written: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
```

The case belongs in `test/ledger.test.ts`. It mocks `node:fs`'s `appendFileSync` so that the first call throws, the second writes its first line and throws, and the third writes through. It asserts that `read` gives each entry once and the file holds each whole line once. The case is seen red against the code at `75fc841`.

```seal
verdict: fixed 98fa06b
answer: The finding holds, and `add` now takes the paste-ready code: one append for each held entry, which leaves `held` once its own append returns. The case is written in this pass's own words. The mock the record describes, a second call that writes its first line and throws, would write the whole of a one-line append and then throw under the fix, which is the failed close the fix does not cover. So the case gives the disk a room in characters instead: an append writes what fits and throws where the rest does not fit, as a write to a full disk does. The case "writes each entry once where an append fails part way, as on a full disk, and leaves the line it cut" fails the first append with no room, gives the second room for the first entry's line and 10 characters of the second's, and lets the third through. It was seen red against the code at `472a98a` at its file assertion (`apps/desktop/test/ledger.test.ts:226`), where the first entry's line stood twice (executed). `seal mutate src/daemon/ledger.ts` with 3 mutants over `test/ledger.test.ts` went 3 red: `held` emptied after the first line, the entry taken from `held` before its append, and the line break after a cut line dropped (executed). The narrow set `test/ledger.test.ts test/daemon.test.ts test/role-session.test.ts` passed at `98fa06b`, 314 passed and 2 skipped, exit 0 (executed). `dce89e5` then names a failed append beside a crash in the docstring of `endsInsideALine` and in `changelog.md`, and adds two rows to `gaps.md`: the files that import `test/built-app.ts`, which this pass did not run, and the fix's precondition that an append throws only where its line is not whole.
```

### 2. The pull request body says the sealer has no stage yet, while a sealer session gets its entry today

```seal
severity: should
location: `seal/threads/1795341001-cost-per-stage/pr.md:7`
evidence: read `seal/threads/1795341001-cost-per-stage/pr.md:7`, `apps/desktop/src/shared/protocol.ts:342-346`, `apps/desktop/src/daemon/daemon.ts:1443-1448`, `seal/threads/1795341001-cost-per-stage/frame/design.md:68`
```

Why it matters: the pull request body is what a reader of the merge takes as what the change does. It tells the reader that a sealer stage gets no entry and that #42 still has to build its stage. Someone framing #42 or #47 from that sentence would plan an entry the daemon already writes.

The grounds. `pr.md:7` says "The gate and the sealer have no stage yet: #42 builds them, and the entry's shape already holds the gate". `ROLE_STAGES` lists `{ role: "sealer", stage: "seal" }` beside the round and the fix pass (`protocol.ts:345`). `enter` writes `stage: info.role` for any role session (`daemon.ts:1447`). So a sealer session asked today gets its entry exactly as a round does. The frame says the same: "The sealer is a role session, so item 9 gives it an entry" (`frame/design.md:68`). The sentence sets the sealer apart from the round and the fix pass, and nothing in the target does. None of the three is launched by the chain yet, because #41 and #42 launch them. The gate alone has no session. The same cell's "an error" also reads as covering a start the adapter rejected, which gets no entry (`daemon.ts:1401-1402`), so the fix names the kind of error.

The fix replaces the cell's first and last sentences. The middle sentence stays.

```md
| The daemon writes one ledger entry per stage of a work item, with the cost, the tokens per model and the stage's duration | Each headless session that ends, by its result, an error result, an exit with no result, a stop at its limit or at a request, or the daemon's own stop, appends one entry to `ledger.jsonl` in the daemon's run folder. A session whose agent never started gets none. The entry names the work item, its repository and branch, the role and stage, the start and end, how it ended, and the cost with each model's input, output and cache tokens. A round, a fix pass and the sealer are role sessions, so each gets its entry with no call of its own once #41 and #42 launch them. The gate is no session: #42 writes its entry, and the entry's shape already holds it |
```

```seal
verdict: fixed 472a98a
answer: The orchestrator's `472a98a` replaces the cell at `pr.md:7` with the record's paste-ready text, word for word (read: `git show 472a98a`). It holds at HEAD: `ROLE_STAGES` still lists the sealer's pair (`apps/desktop/src/shared/protocol.ts:345`), and a start the adapter rejected still sets `entered` before it fails the session (`apps/desktop/src/daemon/daemon.ts:1402`), so such a session gets no entry (read). This pass changed nothing of `pr.md`.
```

### 3. The rule text the settle writes says a failed entry is held until the next append, while it is held until an append writes it

```seal
severity: should
location: `seal/threads/1795341001-cost-per-stage/frame/design.md:177`, `seal/threads/1795341001-cost-per-stage/frame/design.md:182`
evidence: read `seal/threads/1795341001-cost-per-stage/frame/design.md:177`, `seal/threads/1795341001-cost-per-stage/frame/design.md:182`, `apps/desktop/src/daemon/ledger.ts:93-104`
```

Why it matters: the `to` of these two rule changes becomes the text of `docs/architecture.md` *State lives in three places* and of its Korean counterpart at the settle. An implementer later reads it as the ledger's memory rule.

The grounds. The English `to` says "except an entry whose append failed, which it holds until the next append". The Korean `to` says "다만 덧붙이기에 실패한 항목은 다음 덧붙이기까지 메모리에 남습니다". The code empties `held` only after an append returns (`ledger.ts:100`). Where the next append fails too, the entry is still held after it, and the sentence says it is not. This text came in with the fold `9655c77`, which the orchestrator wrote from phase 2's hand-back. The comment at `daemon.ts:214`, the docstring at `ledger.ts:71-82` and *Scope* item 8 state the fact correctly, and the fix leaves them as they are.

```md
  to: ... The daemon holds no entry in memory between two reads, except an entry whose append failed, which it holds until an append writes it. ...
  to: ... 데몬은 장부를 읽을 때가 아니면 항목을 메모리에 두지 않습니다. 다만 덧붙이기에 실패한 항목은 덧붙이기가 성공할 때까지 메모리에 남습니다. ...
```

The fix changes only the clause after "which" in line 177 and the sentence that opens with "다만" in line 182. Every other word of the two lines stays.

```seal
verdict: fixed 472a98a
answer: The orchestrator's `472a98a` takes both lines of the paste-ready text, and changes no other word of lines 177 and 182 (read: `git show 472a98a`). The English clause "which it holds until an append writes it" still holds once `98fa06b` stands: an entry leaves `held` when its own append returns, and an append that cuts its line keeps it held (read: `apps/desktop/src/daemon/ledger.ts#add`). The Korean "덧붙이기가 성공할 때까지" can now be read two ways. Read as the entry's own append, it holds. Read as any append, it does not: where the append of a first held entry succeeds and the second one's fails, the second is still held after an append succeeded. Before `98fa06b` one append wrote every held entry, so the two readings agreed. The same class stands in `trail/phases/phase-2.md:5`, "until the next append writes it". The hand-back names both lines for the orchestrator. This pass changed nothing of the frame or of the phase records.
```

### 4. Two coordinates of the frame point at the daemon's stop where they mean the guard that drops events after an end

```seal
severity: should
location: `seal/threads/1795341001-cost-per-stage/frame/questions.md:21`, `seal/threads/1795341001-cost-per-stage/frame/plan.md:28`
evidence: executed a `grep -n` for a colon and digits after a path or a backtick over `seal/threads/1795341001-cost-per-stage/*.md` and `frame/*.md`, `sed -n 1331,1334p apps/desktop/src/daemon/daemon.ts`, `grep -n 'nothing that arrives after it changes the session' apps/desktop/src/daemon/daemon.ts`; read `seal/threads/1795341001-cost-per-stage/frame/questions.md:21`, `seal/threads/1795341001-cost-per-stage/frame/plan.md:28`
```

Why it matters: Q2 goes on to issue #141, and its framer and the sealer open the coordinate to see what the daemon does after a stop. At `75fc841`, `daemon.ts:1333` is the line `session.info.state = "failed";` inside `stopHeadless`. The guard the sentence describes is at `daemon.ts:1358-1359`.

The grounds. `questions.md:21` says "The daemon takes nothing after a stop today (`apps/desktop/src/daemon/daemon.ts:1333`)". `plan.md:28` says "The daemon ignores every event after a stop (`daemon.ts:1333`)". At `e262835`, line 1333 was `if (info.state !== "working") return;`. The branch's own lines in `daemon.ts` moved it to 1359. `questions.md` names no tree it was read at. The plan's *Alternatives considered* table is outside its *Technical context* section, which alone says "The tree as read at `e262835`". So neither sentence is dated to the framer's commit, and the target contradicts both. The list was made whole by the search above over every `file:line` of the work item's records. The other two outside a dated section hold at the target: `plan.md:37` cites `record-times.ts:27-34`, which the branch does not change, and `plan.md:67` cites `test/view.test.ts:176`, which is still the builder of a headless session. The design's coordinates stand in *Grounding*, which is dated `e262835`. Phase 2's record checked only the coordinates of *Technical context* (`trail/phases/phase-2.md:5`). It made no claim to have read the other sections, so this round reads the drift as the frame's and not as a miss of the crafter's method.

The fix names the function, so the coordinate survives the next edit of the file.

```md
questions.md:21: ... The daemon takes nothing after a stop today (`apps/desktop/src/daemon/daemon.ts#startHeadless`, whose listener drops every event once the session is no longer working), and what the CLI prints then was not run: ...
plan.md:28: ... Chosen. The daemon ignores every event after a stop (`startHeadless` in `daemon.ts`), and whether ...
```

```seal
verdict: fixed 472a98a
answer: The orchestrator's `472a98a` takes the paste-ready text at `frame/questions.md:21` and `frame/plan.md:28`, and changes nothing else of either line (read: `git show 472a98a`). At HEAD, `startHeadless` is at `apps/desktop/src/daemon/daemon.ts:1341`, and its listener's guard `if (info.state !== "working") return;` stands at `:1359` (read). One limit of the new words, which the finding did not raise: an `exit` event is handled before that guard, so after a stop the listener still copies the exit's error output and tells the clients again (`daemon.ts:1349-1356`). It takes no usage and no result, which is what Q2 and the plan row are about. The hand-back names it for the orchestrator. This pass changed nothing of the frame.
```

## Confirmations

What matched: the neutral shape. `ModelUsage`, `Usage`, `LedgerStage` and `LedgerEntry` at `apps/desktop/src/shared/protocol.ts:358-399` carry each field of *Data & interfaces* under its name and type, and no other field. So do `readLedger` and `ledger` at `protocol.ts:519-520` and `:544-545`, the `result` event at `adapters/adapter.ts:15`, the option `usage` at `adapters/fake.ts:32-33`, and `Ledger`'s constructor, `add` and `read` at `daemon/ledger.ts:83-139` (read, walked from the frame to the code).

What matched: the login's mark. `keyedLogin` at `adapters/claude.ts:244-248` is true only for the three key values, and false for `none`, another value or a value that is no string. The handler at `claude.ts:483` and `:497` takes the first `init` line and passes false before one (read). The cases at `test/claude-adapter.test.ts` cover the three key values, `none`, an unknown value, a value that is no number and a missing value, a result before any `init` line, a later `init` line, and the role launch's `init` line (read).

What matched: the entries. `headlessChanged` enters a session once, at its first change out of `working` (`daemon.ts:1422-1425`). `close` enters each working session as `failed` and `daemon` before it stops the run (`daemon.ts:480`). The rejected start sets `entered` before it fails the session (`daemon.ts:1401-1402`). A delete, an archive and a removal stop their sessions through `endSessions`, which calls `stopHeadless` with `request` (`daemon.ts:1310`), so their entries say `request` (read). A session stopped while its adapter is still starting is entered at the stop, and its usage is null. *Scope* items 9 and 10 both cover that case and agree on the entry, so it is no finding.

What matched: the read. `readLedger` filters by the work item's `createdAt` (`daemon.ts:1116-1117`), which is read from the same clock option as a session's `startedAt` (`daemon.ts:130`, `repositories.ts:290`). An id the daemon does not list, a string id among them, is answered with `no work item <id>` (read; `test/daemon.test.ts` "answers a read of an archived work item ...").

What matched: the scenario "No vendor's field crosses the protocol". The search of `frame/design.md:87` printed nothing and exited 1, and the same patterns count 8 lines in `adapters/claude.ts` (executed). The window still reads no cost: `git grep -n -i 'cost\|usage'` over `src/renderer`, `src/main` and `src/preload` printed nothing and exited 1 (executed). `startHeadless` has the one caller the plan names, at `daemon.ts:1096` (executed: `git grep -n 'startHeadless('`).

What matched: the label of the suite. `gaps.md:8-9` labels the full suite, the package's typecheck and the broad gate unverified, with the orchestrator as their answerer. The twelve built-app files `gaps.md:9` leaves are, with the three it ran and `test/role-session.test.ts`, every test file that names `built-app` (executed: `grep -ln 'built-app' test/*.ts`). The list is whole, and the label is honest.

What matched: the records. `changelog.md`, `routing.md`, `gaps.md` and `frame/plan.md` *Operational impact* were read whole against the target, and no sentence of them that states the present is contradicted except at the locations of findings 2 to 4. `pr.md` quotes nothing in quotation marks, and its *Done when* cells shorten the issue's lines without changing what they ask (read: `gh issue view 45`). No `pr.<lang>.md` is owed, since `Commit and pull request language` is English. The issue's fourth line went to #140 and Q2 to #141, as #45's comment and `plan.md:85` say. The phase records' notes on what the frame left open (phase 1's first `init` line and the order of models, phase 2's torn line, unreadable file and protocol-only fields) each settle what *Scope* items 3, 4 and 8 leave open, and the code does what each says (read).

What matched: the new cases against their groups. Each new case of `test/ledger.test.ts`, of the group "the ledger" in `test/daemon.test.ts`, of `test/fake-adapter.test.ts` and of `test/claude-adapter.test.ts` holds a fact a *Scope* item or an acceptance row states, and no two hold the same fact (read). The repository declares no duplicate check and no `TARGET`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the package's typecheck and the broad gate at HEAD, the twelve built-app test files among them | `seal/threads/1795341001-cost-per-stage/gaps.md:8-9` | the orchestrator, at the broad gate after the rounds settle |
| The seen-red runs and the mutation runs the phase records report, read as claims and not re-run | `seal/threads/1795341001-cost-per-stage/trail/phases/phase-1.md:13-20`, `seal/threads/1795341001-cost-per-stage/trail/phases/phase-2.md:23-29` | the sealer, where it weighs them |
| Whether a key login names one of the three values, and whether its cost equals the bill (Q1) | `seal/threads/1795341001-cost-per-stage/frame/questions.md:20` | issue #140 |
| Whether Claude Code reports a usage after a stop (Q2) | `seal/threads/1795341001-cost-per-stage/frame/questions.md:21` | issue #141 |

## Probes

| Command | Result |
|---|---|
| `env -u OWLERY_ROLE_RUN -u OWLERY_ROLE_REFUSAL OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/ledger.test.ts test/fake-adapter.test.ts test/daemon.test.ts -t 'the ledger\|Ledger\|usage\|fake adapter'` in `apps/desktop`, through the run's lock | 3 files, 40 passed and 292 skipped, exit 0. It started no built app and no `claude`. |
| `git grep -n -e 'apiKeySource' -e 'modelUsage' -e 'total_cost_usd' -e 'costBasis' -- apps/desktop/src ':!apps/desktop/src/daemon/adapters/claude.ts'` | no output, exit 1; the same patterns count 8 lines of `adapters/claude.ts` |
| `python3 skills/code-review/scripts/chain_check.py --baseline 41e8aa4 --root` (the branch worktree) `--worktree`, from the plugin's root, before this record stood | exit 0; it names the missing round, gate and guarantee records, and prints no notice on a line of `frame/design.md` |
