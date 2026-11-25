# Review round 2: 1795565280-owl-icon-from-the-seal

```seal
target: 1a7267ae, fixes 0da3ce58..1a7267ae
```

This is a verifying round. It reviews the fix diff from round 1's record at `0da3ce58` to `1a7267ae`, which is four commits: `766649d4` (`pr.md`), `4c951add` (the frame's fold of finding 3), `47d916ad` (the case and `TRADEMARKS.md`) and `1a7267ae` (the closes). The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md` at `1a7267ae`. `git diff --stat 3e268fc3..1a7267ae` shows that `frame/design.md`, `frame/plan.md`, `pr.md` and `round-1.md` changed after round 1's target and nothing else did. The changed lines were read here. The unchanged text is the text round 1 read whole, and it is carried from that read. No `pr.<lang>.md` is owed, and no `seal/parity.json` stands.

## Findings

No finding. The three closes hold, and the fix diff adds no unit that carries a defect.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `apps/desktop/test/emblem.test.ts:36` now leaves out every archived name that opens with a dot, `filesOf(EARLIER).filter((file) => !basename(file).startsWith("."))`, and `basename` is imported at `:6`. That is round 1's snippet as written (read). With a `.DS_Store` fixture planted in `apps/desktop/assets/icon/earlier-2026-11-19/`, the case run alone passed, 1 file and 1 test. The fixture was then removed (executed). The guard the frame asks for still stands. An emptied folder gives `[]` against the three names, and a moved one makes `readdirSync` throw (read). The close says the crafter saw the unchanged case go red on the same fixture. This round did not run that red, and it reads the claim as consistent with round 1's reading of `:35-36` at `3e268fc3`.

```seal
confirms: round-1#2
```
What holds: every quote of `pr.md` at `1a7267ae` was searched for with `grep -F` at its coordinate, and each one appeared exactly once (executed). That covers *Judgments of the run*, *Scope* items 1 to 6, Q1's two *Question* sentences and its *Default until answered* sentence, and Q2's *Question* and "Taken as yes.". The quotes of *Scope* items 2 and 3 are now whole sentences. In the source, a bold marker closes before "L without" and before "drawn by". The quotes leave those markers out, which changes no word. `pr.md` now shows the owner that the small drawing is a variant they have not seen, and that the Dock is taken to show L. Its coordinates name the cell of each row, so they are sharper than in round 1.

```seal
confirms: round-1#3
```
What holds: `TRADEMARKS.md:38-40` now says that the emblem case fails after the copy and that the change which puts the emblem back also rewrites that case and the list (read). `frame/design.md:49` and `:100` state the same in their own words, and `frame/plan.md` row 5a now points to *Scope* item 4 for it (read). A `git grep -i` for "earlier emblem back", "put back", "puts the earlier" and "putting the earlier", outside the round records, found the restore stated only at `TRADEMARKS.md:38` and `frame/design.md:49` and `:100` (executed). Scenario 5's row title, "The earlier icon can be put back", names no way to restore and so needs no added sentence. One point in the close does not match the commit. The close calls `4c951add` the orchestrator's fold, but that commit carries the framer's co-author line, and the orchestrator's message to this round calls it the framer's fold. The sentence records history and nobody acts on it, so it is no finding.

What matched: no new unit in the fix diff calls into code that the branch did not already call. The test's change adds one `node:path` import and one filter over the list it already built (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the lint and the typecheck at `1a7267ae`. Only the emblem case ran in this round | the repository's `Broad gate` | the orchestrator, through the broad run |
| Round 1's three rows that the owner answers: whether L still reads as a skull, the small drawing at 16 pixels (Q1), and the Dock at a person's start (Q2). The fix diff touches none of them | `frame/questions.md` Q1 and Q2 | the owner |

This round leaves nothing open. The orchestrator's broad run comes next, and the sealer's spawn follows it.

## Probes

| Command | Result |
|---|---|
| `grep -c -F` of each `pr.md` quote against `frame/questions.md`, `frame/design.md` and `frame/plan.md` | 1 for each of the twelve quotes |
| `git grep -n -i -e 'earlier emblem back' -e 'put back' -e 'puts the earlier' -e 'putting the earlier' -- . ':!seal/threads/*/trail/rounds'` | the restore is stated at `TRADEMARKS.md:38`, `frame/design.md:49` and `:100`; scenario 5's row title; the other hits are lines of `apps/desktop/src/daemon/settle.ts` and its tests, which are about another thing |
| a `.DS_Store` fixture written into `apps/desktop/assets/icon/earlier-2026-11-19/`, then `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/emblem.test.ts` in `apps/desktop` after waiting for no `vitest` to run, then the fixture removed | 1 file and 1 test passed; the folder holds its three files again, and `git status` is clean |
