# Review round 2: 1795497941-night-watch-marks-as-moons

```seal
target: 68a6292, fixes 6f7aa9f..68a6292
```

This is the verifying round. The fix diff is `6f7aa9f..68a6292`: the fix pass's `ad38439` and `d7abdc9`, the record commit `a67c0b7`, the orchestrator's fold `36aca5e` and its repair of `pr.md` at `68a6292`. Every hunk of it was read. `seal/parity.json` is not declared. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

The records were read whole at `68a6292`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. That reading is the method for the work item's own files, so the list of statements found there is whole for those files. Outside them the list rests on a search, which is a sample (*Probes*).

Carried from round 1 and not opened again, since the fix diff does not touch them: the colours of Night watch's light block at `apps/desktop/src/renderer/themes.css:207-209` (`--state-working` `#26262a`, `--state-finished` and `--state-no-agent` `#62605c`), the page's parts at `apps/desktop/src/renderer/index.html:117-128`, and round 1's reading of the screenshots committed at `1bbe951`. Every verdict below is this round's own.

## Findings

### 1. The fold and the fix pass leave the moons' filled part called lit, and the asleep mark called a dark disc, in three files

```seal
severity: should
location: `seal/threads/1795497941-night-watch-marks-as-moons/frame/questions.md:15`, `seal/threads/1795497941-night-watch-marks-as-moons/gaps.md:9`, `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-1.md:7`, `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-1.md:13`, `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-1.md:19`
evidence: executed `git grep -n -I -i -w -e lit HEAD -- . ':!seal/threads/1795497941-night-watch-marks-as-moons/trail/rounds'` and `git grep -n -I -i -E -e 'lit edge|lit part|dark disc|dark moon|dark half|빛나|어두운 원판|보름달|반달' HEAD -- . ':!seal/threads/1795497941-night-watch-marks-as-moons/trail/rounds'`; read `seal/threads/1795497941-night-watch-marks-as-moons/frame/questions.md:15`, `seal/threads/1795497941-night-watch-marks-as-moons/frame/design.md:60`, `seal/threads/1795497941-night-watch-marks-as-moons/gaps.md:9`, `seal/threads/1795497941-night-watch-marks-as-moons/trail/phases/phase-1.md:7-19`, `apps/desktop/test/theme-controls.test.ts:271-291`
reopens: round-1#1
```

Why it matters: round 1, finding 1, found that the light appearance draws a moon's filled part in a colour darker than the ground. So a sentence that calls the filled part lit, or calls the asleep mark a dark disc, is false of the light appearance. Round 1 listed `frame/questions.md:15` among the statements the fix owed a judgment on. The close of round-1#1 holds where the finding located it: both cells of `docs/design.md:51` and `docs/design.ko.md:51`, and the bullets at `changelog.md:5-6` (*Confirmations*). It does not hold for the whole class, which contract rule 12 asks of the fix, because statements in three files remain.

- `frame/questions.md:15`, Q1 option (a): "The outline of a dark disc with a thin filled edge at its right". The fold `36aca5e` changed "lit" to "filled" in this cell and kept "dark disc". Option (a) is the built default. In the light appearance the asleep mark is a dark ring with a dark edge around the light ground, so the disc inside is not dark. *Scope* item 1 at `frame/design.md:60` now calls the same mark "a ring with a thin filled edge at its right", so the frame names one mark two ways. The owner judges Q1 on the pull request (`pr.md:7` points there), and the settle decides the row. The fold of `skills/implement/orchestration.md` *A decision made after the frame is committed* reads each file whole and rewrites every statement HEAD contradicts. Claimed by the fold's commit: the frame takes the fix's wording "at the statements the pass named". Found: the pass named this line, and one of its two false words stands.
- `gaps.md:9`, the first cell of the closed row: "whether the thin lit edge of the asleep mark stays apart from its outline". Claimed by the fix pass's close of round-1#1: the second cell of this row now says "filled edge". Found: `d7abdc9` changed the second cell and left "lit edge" in the first, so one row says both. The cell cites `frame/plan.md` *Technical context*, whose sentence at `frame/plan.md:17` now says "the thin filled edge".
- `trail/phases/phase-1.md:13` and `19`: "nothing of the asleep mark is lit", "the guard of asleep's lit part", and the mutant row "292, asleep is lit". `phase-1.md:7`: "the width a person sees lit". The case these lines describe measures Night watch in the light appearance alone (`apps/desktop/test/theme-controls.test.ts:271-275`), where the filled part is the dark one. So each line names the guard by a word false of what the guard measures. The fix pass changed the same words in `phase-2.md` and not in `phase-1.md`.

Round 1's own search, run again at `6f7aa9f`, prints `gaps.md:9` and `phase-1.md:13` and `19` beside the lines round 1 listed, so round 1's list left them out. The fix pass reached past that list to the second cell of `gaps.md:9` and to `phase-2.md`, and its close names no method that would have reached the rest of the row or `phase-1.md`. Its list was a sample handed back as the whole.

Option (b) of Q1 says "a new moon: the dark moon". That names the sky's new moon and not the mark's colour, and option (b) was not built, so it stays. `frame/design.md:45` stands in *Grounding*, which the frame dates to `523a5fb`, and says what the framer's probe drew there, so it is not folded. The identifiers `Lit` and `lit` at `apps/desktop/test/theme-controls.test.ts:227-291` name the same filled part. They are names read by whoever next edits the case, and the docstring at line 226 calls it "the filled part", so they open no finding.

The route: `frame/questions.md` is the orchestrator's to fold, since no crafter writes a frame file. `gaps.md` and `trail/phases/phase-1.md` are the fix pass's. In `frame/questions.md:15`, the first sentence of Q1's options cell:

```markdown
(a) A ring with a thin filled edge at its right: the thin moon, the same size as the other marks and on the line's centre.
```

In `gaps.md:9`, the first cell, the phrase:

```markdown
and whether the thin filled edge of the asleep mark stays apart from its outline
```

In `trail/phases/phase-1.md:13`, the last two sentences, and in line 19, the first row of the mutant table:

```markdown
the crescent that stood has no filled part, so nothing of the asleep mark is filled. Line 292 is the guard of asleep's filled part, the first of the new assertions.
```

```markdown
| `--shape-no-agent-fill` to `none` | 292, asleep has a filled part: `expected 0 to be greater than 0` |
```

In `trail/phases/phase-1.md:7`, the phrase "the width a person sees lit" becomes:

```markdown
the width a person sees filled
```

`pr.md` quotes none of these sentences, so no quote follows them.

## Confirmations

```seal
confirms: round-1#2
```
What holds: `gaps.md` *Not verified* holds the row at `gaps.md:12`, the sixth of the seven rows at lines 7 to 13, before the broad gate's row. `pr.md:12` quotes it with the coordinate "the sixth row", and its words stand at `gaps.md:12` word for word (executed, `grep -cF` of the quote's text without its final period against `gaps.md`, one match). The quote ends with a period where the row goes on with its coordinate in parentheses; no word differs, so this round reads it as the quote's end. The paragraph at `trail/phases/phase-2.md:19` names the row. Its words follow finding 1's term, the state's colour, which `docs/design.md:51` now uses (read).

```seal
confirms: round-1#3
```
What holds: `trail/phases/phase-2.md:10` holds the placeholder of `frame/plan.md:40`. The search of round 1's `evidence: executed` line, run again at HEAD, prints four lines, each in `trail/rounds/round-1.md` and each that record's own quote of the search (lines 84, 87, 97 and 133). The fix pass's second search, `git grep -n -I -F -e 'owlery-183' -e '/private/tmp' -e 'Documents/GitHub'`, exits 1 at `d7abdc9`, as its close says. At HEAD it prints `trail/rounds/round-1.md:97` alone, the close's own quote of that search, added by `a67c0b7` (all executed). No record holds the worktree's path.

What matched: Night watch's cell of the row "A state's marks" in `docs/design.md:51` is the text of `frame/design.md:110`, and the cell in `docs/design.ko.md:51` is the text of `frame/design.md:111` (executed, `grep -cF` of each text against both editions, one match each in its own edition and none in the other). The cell says the filled part is the darker one in the light appearance and that a finished work item is a dark disc there, which is what the colours carried from round 1 draw. The fix pass's change of "the state's ink" to "the state's colour" matches the term the cell's neighbours use (read).

What matched: `changelog.md:5-6` call the marks a ring with a thin filled edge, a half-filled disc and a wholly filled disc, and say the filled part is the darker one in the light appearance (read).

What matched: `ad38439` changes two comments of `apps/desktop/test/theme-controls.test.ts`, at lines 290 and 295, and no assertion. Each comment states what the assertions below it hold, in the light appearance the case measures (read). No test is new in the fix diff, so none is read against its group.

What matched: the fold `36aca5e` reads true against HEAD at *Scope* item 1 (`frame/design.md:60`), the cell texts at `frame/design.md:110-111`, the *Removes* row at `frame/design.md:130`, `frame/plan.md:17` and `27-29`, and Q2 at `frame/questions.md:16`. Finding 1 names the one statement of the fold that does not (read).

What matched: `pr.md:4` is *Scope* item 1 at `frame/design.md:60` word for word (executed, `grep -cF`, one match). The other quotes, `pr.md:3` and `5-11`, stand where they stood, and the fold left the text of each question Q1 to Q5 unchanged (read). `pr.md:13` quotes the first sentence of the fifth row, `gaps.md:11` (read).

What matched: both editions hold 15 lines that begin with `#` and 379 that begin with `|`, and the search of scenario 6 at HEAD prints nothing and exits 1 (executed).

What matched: the rows of `gaps.md` *Not verified* at `6f7aa9f` all stand at HEAD. The row at line 9 was reworded in place, and one row was added (read, `git diff 6f7aa9f..68a6292 -- gaps.md`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The built-app case files at `68a6292`, `test/theme-controls.test.ts` and `test/themes.test.ts` among them. The fix diff changes two comments of one case and no code, and this round ran no file, since other builds share the machine | `apps/desktop/test/` | the orchestrator, at the broad gate |
| The broad gate over the branch. The suite is labelled `unverified` | `seal/config.json`, the key `Broad gate` | the orchestrator |
| Whether a person reads a finished place in the light appearance as done, and how a screen of density 1 draws the asleep mark | `seal/threads/1795497941-night-watch-marks-as-moons/gaps.md:11-12` | the owner, on the pull request |

## Probes

| Command | Result |
|---|---|
| `git grep -n -I -i -w -e lit HEAD -- . ':!seal/threads/1795497941-night-watch-marks-as-moons/trail/rounds'` | Lines of the seal's lit wax in `docs/`, `apps/desktop/src/renderer/` and `apps/desktop/test/screenshots.test.ts`, which are not the moons. The identifiers of `apps/desktop/test/theme-controls.test.ts:227-291`. `frame/design.md:45`, `gaps.md:9`, `trail/phases/phase-1.md:7`, `13` and `19`, and `trail/phases/phase-2.md:25` |
| `git grep -n -I -i -E -e 'lit edge\|lit part\|dark disc\|dark moon\|dark half\|빛나\|어두운 원판\|보름달\|반달' HEAD -- . ':!seal/threads/1795497941-night-watch-marks-as-moons/trail/rounds'` | Both editions' line 51, `frame/design.md:45`, `110` and `111`, `frame/questions.md:15` and `18`, `gaps.md:9` and `12`, `pr.md:12`, `trail/phases/phase-1.md:13` and `31`, `trail/phases/phase-2.md:19` |
| Round 1's search of finding 1, `git grep -n -I -e 'lit edge' -e 'dark disc' -e 'lit part' -e 'lit at its right' -e 'is lit' -e '빛나' -e '어두운 원판' -e 'dark half' -e 'filled half' 6f7aa9f -- .` | Among its lines, `gaps.md:9` and `trail/phases/phase-1.md:13` and `19`, which round 1's list did not name |
| `git grep -n -I -F -e '/Users/' -- seal` at HEAD | Four lines, each in `trail/rounds/round-1.md` |
| `git grep -n -I -F -e 'owlery-183' -e '/private/tmp' -e 'Documents/GitHub' d7abdc9 -- .` and the same at HEAD | Exit 1 at `d7abdc9`. At HEAD one line, `trail/rounds/round-1.md:97` |
| `grep -cF` of `frame/design.md:110` and `111` against both editions, of `pr.md:4` against `frame/design.md`, and of `pr.md:12` against `gaps.md` | One match each where the quote names its source |
| `grep -c '^#'` and `grep -c '^\|'` on both editions; scenario 6's search at HEAD | 15 and 379 in each; the search printed nothing, exit 1 |
| `python3 skills/code-review/scripts/chain_check.py --baseline release/v0.0.3 --root <the worktree> --worktree`, before this record was written | Exit 0. It names round 1's closes as owed a verifying round, the gate record and the guarantee as not yet written, and prints no notice on `frame/design.md` |
