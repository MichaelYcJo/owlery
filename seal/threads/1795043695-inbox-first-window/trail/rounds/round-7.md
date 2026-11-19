# Review round 7: 1795043695-inbox-first-window

```seal
target: 9050bc4, fixes 9baf6b7..9050bc4
```

This is a verifying round. Its target is the diff `9baf6b7..9050bc4`, which holds three commits. `f1f1932` rewrote the comment at `apps/desktop/src/daemon/whole-file.ts:1-6` for round 6's finding 1. `4054860` rewrote `frame/design.md:282` for round 6's finding 2. `9050bc4` committed round 6's record with its two close blocks. `git diff --stat 9baf6b7 9050bc4` names those three files and no other (executed). The fix diff changes no line of code: the one change under `apps` is six comment lines in place of four.

The work item's records were read whole at `9050bc4`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`, together with `trail/gate.md` and `trail/rounds/round-6.md`. No `pr.<lang>.md` stands, because `seal/config.json` names English for both language keys. The repository declares no `seal/parity.json`. The phase records, rounds 1 to 5 and `guarantee.md` are not in the fix diff, so this round did not read them again. It carried round 6's coordinates for them.

Facts carried from round 6 and not established again: the callers of the four writers and how each one handles a thrown error (`daemon.ts:237-256`, `:297-306`, `src/daemon/main.ts:69-72`, `src/main/main.ts:56`); the mutation run over `whole-file.ts`; and the probe of a refused removal. The fix diff changed none of the code those facts rest on. Round 6 judged that `guarantee.md:36`, which cites the old "except that", is the sealer's record of its run at `67f270d`, and that the sealer's next run rewrites it. That judgment is carried as well: `guarantee.md` is not among the records this round holds to the target. Every verdict below is this round's own.

There are no findings. Both of round 6's closes hold. The fix diff adds no new unit: it changes a comment and a frame sentence, and its third commit is a round record. Nothing is left open, so the orchestrator owes the broad run at `9050bc4`, and the sealer's spawn comes after that run.

## Findings

## Confirmations

```seal
confirms: round-6#1
```
What holds: round 6's replacement block for the comment is the first six lines of `apps/desktop/src/daemon/whole-file.ts` at `9050bc4`, word for word. This round compared the fenced `ts` block of `round-6.md` with those lines, and they were equal (executed, `## Probes`). The comment no longer claims that the helper is the one way any lasting file is written. It names the four files the helper writes, and each one checks out at the target:

- The discovery file is written at `discovery.ts:17`.
- The list of work items is written at `work-items.ts:74`.
- The last look is written at `last-look.ts:124`.
- The theme's file is written at `appearance.ts:31`.

A search for `writeWholeFile` lists those four calls and no other (executed). The four files are the same ones `frame/design.md:282` and `frame/plan.md:168` name. The comment's other claims hold too:

- "whose three writers use it" matches the three imports under `src/daemon`.
- "as it imports the discovery file's reader" matches `src/main/daemon-client.ts:5`.
- "nothing the page loads imports it" holds after `node build.mjs`, which exited 0. The bundle `dist/renderer.js` holds no `node:fs` and no `writeWholeFile`, and neither does `dist/preload.js`. Both names are in `dist/main.js` and `dist/daemon.js` (executed, `## Probes`).

The writes this round found that do not go through the helper are the two round 6 named. `hooks.ts:55` writes `claude-hooks.json` directly, and `src/daemon/main.ts:26` writes it before that process starts its hook server or any pane. `daemon-client.ts:47` opens `daemon.log` for appending. The comment now leaves both outside its list. The fix diff makes no claim about whether `claude-hooks.json` needs a partial file, and that write did not change.

```seal
confirms: round-6#2
```
What holds: round 6's replacement block is `frame/design.md:282` at `9050bc4`, word for word. This round compared the fenced `markdown` block of `round-6.md` with that line, and they were equal (executed, `## Probes`). The paragraph no longer gives the theme's file an exception. It says that `appearance.json` is written the way the daemon's three files are: to a partial file that is then renamed, with the partial file removed when the write or the rename fails. Both halves hold at the target. All four files go through `writeWholeFile` (`whole-file.ts:15-28`). Its `catch` removes the partial file and then throws the original error again (`:20-27`). Some other sentences in the tree state the same fact, and this round searched for them with `git grep` on "except that", "as `work-items.json` is written", "as the daemon writes", "half-written" and "outlives its writer" over `apps` and the work item's records, leaving out the round records and `guarantee.md` (executed). Each sentence that search printed agrees with the new paragraph:

- `appearance.ts:28` says "as the daemon writes its list of work items", which is true with no exception.
- The comments at `discovery.ts:14`, `work-items.ts:73` and `last-look.ts:123` each say that a failed write removes its partial file.
- `frame/plan.md:167` describes what phase 9 built at the time, and it is still true of that time.

`frame/design.md:221` and `gaps.md:99` cover the case round 5 added, a removal that fails too. The new paragraph does not contradict them, because it says the removal is tried and makes no promise that it succeeds.

What matched, against the records read whole at `9050bc4`:

- **`9050bc4` commits round 6's record, with a close block under each finding.** Finding 1's verdict is `fixed f1f1932`, and that commit changes `whole-file.ts`, the path the finding's `location:` names. Finding 2's verdict is `fixed 4054860`, and that commit changes `frame/design.md`, the path its `location:` names. Each close block's answer says the change was the round's block word for word, which the comparisons above confirm.
- **No sentence of the records step 3 reads is contradicted by the target.** The fix diff changed no code, and the only line numbers it moved are in `whole-file.ts`. A search for `whole-file` over the tree at `9050bc4`, leaving out the round records, finds the four imports, `frame/design.md:282` and `gaps.md:99`. None of them cites a line of the file (executed). `frame/design.md:58` and `:271` say that `work-items.json` and `last-look.json` are written to a partial file that is then renamed. `:58` is *Grounding* dated `1d5b49f`, and both still hold.
- **`pr.md`, `changelog.md`, `routing.md`, `frame/questions.md`, `frame/plan.md` and `gaps.md` are unchanged in the fix diff** (`git diff --stat 9baf6b7 9050bc4`, executed). Round 6 checked their quotes and rows at `9baf6b7`, and nothing they cite moved.
- **The suite's label.** The fix pass hands over no run of the broad gate, so the label `unverified` is honest. The newest run in `trail/gate.md` is at `56e730b`. The code has changed since then: `5b15ff7` changed code, and `f1f1932` changed a comment in a code file. This round ran only the narrow command over the four case files the writers reach, and all four passed (`## Probes`). That run is not the broad gate.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' checks at `9050bc4` | `seal/config.json` `Broad gate` | the orchestrator, through the broad run now that the rounds have settled |

## Probes

| Command | Result |
|---|---|
| `python3` comparing the fenced `ts` block of `trail/rounds/round-6.md` with lines 1 to 6 of `apps/desktop/src/daemon/whole-file.ts`, and the fenced `markdown` block with line 282 of `frame/design.md`, in the worktree at `9050bc4` | both comparisons printed `True` |
| `node build.mjs` in `apps/desktop` of a `git clone --no-local` at `9050bc4` under `<scratchpad>/1795043695-inbox-first-window/round-7/clone`, with the worktree's `node_modules` linked in, then `grep -c` for `node:fs` and for `writeWholeFile` over `dist/renderer.js`, `main.js`, `daemon.js` and `preload.js` | build exit 0. `renderer.js` and `preload.js` gave 0 for both names. `main.js` gave 5 and 2, and `daemon.js` gave 8 and 4. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-7/build.txt` |
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/last-look.test.ts test/work-items.test.ts test/appearance.test.ts` in `apps/desktop` of the same clone, run once | 4 files and 108 cases passed, exit 0. This was the narrow run, not the broad gate. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-7/narrow.txt` |
