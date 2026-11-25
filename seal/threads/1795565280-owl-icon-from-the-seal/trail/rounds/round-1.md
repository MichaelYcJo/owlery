# Review round 1: 1795565280-owl-icon-from-the-seal

```seal
target: 3e268fc3 against release/v0.0.4
```

This is the first round, so no fact is carried from an earlier record: every coordinate below was opened in this round. The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md` whole at `3e268fc3`. No `pr.<lang>.md` stands, and none is owed, since `seal/config.json` names English for both language keys. No `seal/parity.json` stands.

## Findings

### 1. The emblem case fails on a correct tree once Finder writes a `.DS_Store` into the archive folder

```seal
severity: should
location: `apps/desktop/test/emblem.test.ts:35-36`
evidence: read `apps/desktop/test/emblem.test.ts:16-27`, `apps/desktop/test/emblem.test.ts:35-36`, `.gitignore:164`
```

Why it matters: the case lists every file in `assets/icon/earlier-2026-11-19/` with `filesOf`, which keeps every name `readdirSync` returns, dotfiles among them (`emblem.test.ts:16-27`). Line 36 then asserts that the list is exactly the three archived names. macOS Finder writes a `.DS_Store` into a folder a person opens and changes the view of, and the repository expects that file, since `.gitignore:164` ignores it. The owner asked for the archive so that the earlier icon can be put back, so the folder is one a person is likely to open. After that, the case fails on a tree that is correct, with `expected [ '.DS_Store', 'app-icon-small.svg', ... ] to deeply equal [...]`. A suite that goes red on a person's own checkout and stays green in CI tells the person something false about the archive.

The frame asks only that the case fail where the archive is emptied or moved (`frame/design.md` *Data & interfaces*, the paragraph on `test/emblem.test.ts`). Leaving out names that open with a dot keeps that guard. An emptied folder still gives `[]`, and a moved one still throws `ENOENT`.

```ts
import { basename, join, relative } from "node:path";
// ...
    // The archive holds the three files of the earlier emblem, so the search below has something to find.
    // A name that opens with a dot, such as the .DS_Store Finder writes into a folder a person opened, is no file of the archive.
    const earlier = filesOf(EARLIER).filter((file) => !basename(file).startsWith("."));
    expect(earlier).toEqual(["app-icon-small.svg", "app-icon.png", "app-icon.svg"]);
```

The snippet has no precondition beyond `readdirSync` listing dotfiles, which it does on macOS and Linux. It changes only the archive's side. A `.DS_Store` under `dist/` matches no archived file's bytes, so the search of `dist/` needs no change.

```seal
verdict: fixed 47d916ad
answer: The paste-ready fix was read against frame/design.md *Data & interfaces* and applied as written: the archive's listing leaves out a name that opens with a dot, so an emptied archive still gives an empty list and a moved one still throws. Red first, executed: with a .DS_Store planted in assets/icon/earlier-2026-11-19/ and the case unchanged, the case failed at emblem.test.ts:36, "expected [ '.DS_Store', …(3) ] to deeply equal [ 'app-icon-small.svg', …(2) ]". With the fix and the .DS_Store still there, the case passed, and the planted file was then removed. At 47d916ad, with no .DS_Store, the case passed once more, run alone with OWLERY_BACKGROUND=1.
```

### 2. `pr.md` cuts two *Scope* quotes mid-sentence and quotes neither default the build took for Q1 and Q2

```seal
severity: should
location: `seal/threads/1795565280-owl-icon-from-the-seal/pr.md:5`, `seal/threads/1795565280-owl-icon-from-the-seal/pr.md:6`, `seal/threads/1795565280-owl-icon-from-the-seal/pr.md:11-12`
evidence: read `seal/threads/1795565280-owl-icon-from-the-seal/pr.md:1-14`, `seal/threads/1795565280-owl-icon-from-the-seal/frame/design.md:47-48`, `seal/threads/1795565280-owl-icon-from-the-seal/frame/questions.md:13-14`, the plugin's `skills/code-review/orchestration.md` *Orchestrator: the pull request opens once the sealer seals*
```

Why it matters: every quote of `pr.md` stands word for word at its coordinate, which this round checked line by line. That includes the orchestrator's *Judgments of the run* row, quoted on line 3. Three of the quotes still leave out what the owner needs at the pull request.

- Line 5 quotes *Scope* item 2 up to its colon: "`assets/icon/app-icon-small.svg` is L drawn for 32 pixels and under:". The words after the colon, "L without its chest rows and wing ticks, each line 3 times the seal's", say that the small icon is not the drawing the owner chose. The quote as it stands tells the reader that the small icon is owl L.
- Line 6 quotes *Scope* item 3 up to a comma, and drops "drawn by the command `TRADEMARKS.md` documents". This reads badly but is not wrong, and it is listed here only because the same repair reaches it.
- Lines 11 and 12 quote the two questions and nothing else from their rows. Under `Automation` `yes`, the plugin's orchestration guide names "a default taken ... from its `frame/questions.md` row" as what the owner must see before the fold. Q1's default is that the build ships a small drawing the owner has not seen. Q2's default is that the Dock is taken to show L. The body, as written, shows the owner two open questions and says nothing about what the tree now holds for either of them.

The quotes below are word for word at their coordinates. No other record quotes these lines, so the repair changes only `pr.md`.

```markdown
- "`assets/icon/app-icon-small.svg` is L drawn for 32 pixels and under: L without its chest rows and wing ticks, each line 3 times the seal's." (`frame/design.md` *Scope*, item 2)
- "`assets/icon/app-icon.png` is `app-icon.svg` at 1024 pixels, drawn by the command `TRADEMARKS.md` documents." (`frame/design.md` *Scope*, item 3)

- "Is the small icon's drawing the one the owner wants?" (`frame/questions.md` Q1, *Question*)
- "The owner chose L at full size and has seen no small drawing of it." (`frame/questions.md` Q1, *Question*)
- "Nothing in the app reads the file (`frame/design.md` *Grounding*), so the default reaches no person's screen before the owner looks." (`frame/questions.md` Q1, *Default until answered*)
- "Does the macOS Dock show owl L when a person starts the app?" (`frame/questions.md` Q2, *Question*)
- "Taken as yes." (`frame/questions.md` Q2, *Default until answered*)
```

```seal
verdict: fixed 766649d4
answer: `766649d4` puts this record's replacement quotes into `pr.md` word for word: *Scope* items 2 and 3 are quoted whole, and Q1 and Q2 are each quoted with the sentence of their row that says what the tree now holds, Q1's that the owner has seen no small drawing and that nothing in the app reads the file, Q2's "Taken as yes.". Each quote was found at its coordinate with `grep -F` before the commit.
```

### 3. Following `TRADEMARKS.md`'s way to put the earlier emblem back turns the emblem case red, and nothing says so

```seal
severity: should
location: `TRADEMARKS.md:37-38`, `seal/threads/1795565280-owl-icon-from-the-seal/frame/design.md:49`, `seal/threads/1795565280-owl-icon-from-the-seal/frame/design.md:100`
evidence: read `TRADEMARKS.md:33-38`, `apps/desktop/test/emblem.test.ts:33-42`, `apps/desktop/build.mjs:65`, `seal/threads/1795565280-owl-icon-from-the-seal/trail/phases/phase-1.md:19`
```

Why it matters: `TRADEMARKS.md:37-38` tells a person that copying the archive's files over the files of the same names in `apps/desktop/assets/icon/` puts the earlier emblem back. After that copy, `assets/icon/app-icon.png` has the archive PNG's bytes. `build.mjs:65` copies it to `dist/app-icon.png`, and the emblem case's search at `emblem.test.ts:42` fails. The phase record shows this exact red as its "Before the redraw" row (`trail/phases/phase-1.md:19`). The owner asked for the archive so that the icon can be put back. Whoever does that, a person or an agent working from this sentence, meets a red suite that the sentence does not mention. They then have to work out whether the case or the restore is wrong. The frame states the restore in the same words, at *Scope* item 4 (`frame/design.md:49`) and in the *Data & interfaces* entry for `TRADEMARKS.md` (`frame/design.md:100`). The fix pass also owes both of those frame lines the added sentence, since each says what `TRADEMARKS.md` says.

```markdown
  Copying them over the files of the same names in `apps/desktop/assets/icon/`
  puts the earlier emblem back. The case of `apps/desktop/test/emblem.test.ts`
  then fails, because the build ships a file with the archive's bytes, so the
  change that puts the emblem back also rewrites that case and this list.
```

```seal
verdict: fixed 47d916ad
answer: TRADEMARKS.md:38-40 now carries the record's sentence word for word, after "puts the earlier emblem back". The two frame lines this finding names, frame/design.md:49 and :100, are the framer's and not the crafter's to write. The orchestrator folded them at 4c951add, and both now state the same thing, as does plan.md row 5a. A git grep for "earlier emblem back" across the tree finds no other statement of the restore.
```

## Confirmations

What matched: the frame's scenarios 1 to 7, each run by the command its row gives, scenarios 1 to 3 in `apps/desktop` and 5 to 7 at the top of the repository, with librsvg 2.58.4 (executed; see *Probes*). Scenario 1 printed `26f41562...f3f9`, scenario 2's `cmp` exited 0, scenario 3 printed `dcf1f066...19d2`, and scenario 5 printed the three blobs *Grounding* names, in order. Scenario 6's search exited 1, and its control search printed `TRADEMARKS.md:33` with `apps/desktop/test/emblem.test.ts:12` and `:42`. Scenario 7 exited 0, and exited 1 with `TRADEMARKS.md` added. This round's runs match the phase record's account of the same commands (`trail/phases/phase-1.md:7`).

What matched: the owner's candidate. The file the orchestrator names as the one the owner chose has the SHA-256 that `frame/design.md:27` gives, `8d15618c...b32c`, and drawn at 1024 pixels it gives the same hash as `app-icon.svg` does (executed). So the committed emblem is the candidate's picture, pixel for pixel, though not its bytes. *Data & interfaces* leaves layout and comments free.

What matched: the frame's rule, derived independently of the crafter's script. The probe `test_tmp_rule.py` read the owl group of `apps/desktop/assets/seals/owl.svg` and found 119 elements: 50 forehead paths, 18 eye-feather paths, 24 chest paths and 8 circles. It applied *Data & interfaces*' rule at 1.8 and, for the small drawing, without the chest paths and wing ticks at 3.0. It compared each kept element, attribute by attribute, with the mask of each committed file. Both matched, 51 of 51 and 21 of 21. Every element the rule keeps carries no `transform` (executed).

What matched: the archive. The three files under `apps/desktop/assets/icon/earlier-2026-11-19/` have the blobs of the icon at `4a005ebf`, at `71e7d23`, and at each of `v0.0.1`, `v0.0.2` and `v0.0.3` (executed: `git rev-parse` at each). So `TRADEMARKS.md:35`, "as releases 0.0.1 through 0.0.3 showed it", holds.

What matched: the built app. The emblem case passed when run alone with `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/emblem.test.ts`, 1 file and 1 test (executed). `apps/desktop/vitest.config.ts:14` puts the file in the `app` project, since its import matches `startsTheApp` (read). The archive assertion at `emblem.test.ts:36` was never seen red alone, which `trail/phases/phase-1.md:11` discloses. Reading settles that it can fail: an emptied folder gives `[]` against three names, and a moved one makes `readdirSync` throw (read).

What matched: scenario 8. `git ls-files apps/desktop/assets` lists eight files. Five are named by their own entries of `TRADEMARKS.md:11-32`, and the archive's three are named by the folder entry at `:33-38`. Each entry names a file that stands (executed and read).

What matched: the policy sentences that the frame says hold for L. `docs/name.md:12` calls the emblem "the little owl of AgenticSeal's seal, taken out of its wax". In the plugin's `assets/seals/README.md` *The little owl — from 0.25.1*, "the little owl" is the owl of `owl.svg`, the owl L is drawn from. `README.md:1` and `:11`, `README.ko.md:1` and `:11`, and the comment at `build.mjs:64` hold as they read (read).

What matched: the implementer's account in `gaps.md:7`. It claims that no test file other than the emblem case reads a path the phase changed. A search of every test path in the repository for `TRADEMARKS`, `assets/icon` and `app-icon` found only `apps/desktop/test/emblem.test.ts` (executed). Every file of the `app` project builds through `build.mjs:65`, which reads the new PNG, and the emblem case's build succeeded on it.

What matched: the orchestrator's *Judgments of the run* row (`frame/plan.md:60`). It weighs the plugin's `skills/commit-pr-convention/SKILL.md` *Commit messages* table. `fix:` needs a rule the base stated, and none at `4a005ebf` states what the emblem's owl looks like. `TRADEMARKS.md` described the drawing that stood, and `docs/name.md:12` names the owl's source. Issue #201's title and the branch both take `feat:` (read; `gh issue view 201`, executed).

The six record-only commits of the branch take `docs:`, where the convention's table gives `chore:` to "a work item's records committed alone". The squash merge into `release/v0.0.4` removes them, and the repository's log uses both prefixes for such commits, so this round opens no finding on it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether owl L still reads as a skull to people outside the project. This round drew it at 256, 64, 32 and 16 pixels and saw a round-headed owl with ringed eyes, a beak, feathered chest and wings, standing on a branch. That reading is the reviewer's, and the issue's question is how other people read it | `apps/desktop/assets/icon/app-icon.svg` | the owner |
| The small drawing at 16 pixels. At 32 pixels it shows two dark eye rings, and at 16 pixels it is a pale shape with no face. The same holds for the earlier small icon. `TRADEMARKS.md` describes it as drawn "for 32 pixels and under" | `apps/desktop/assets/icon/app-icon-small.svg`, `frame/questions.md` Q1 | the owner, under Q1 |
| That the macOS Dock shows owl L at a person's start of the app | `gaps.md:8`, `frame/questions.md` Q2 | the owner, at the next start of the app by hand |
| The whole suite, the lint and the typecheck. The crafter's hand-over labels them `unverified` (`gaps.md:7`), and the label is honest: the crafter ran only the emblem case, and so did this round | the repository's `Broad gate` | the orchestrator, through the broad run |

## Probes

| Command | Result |
|---|---|
| `rsvg-convert --version`; scenarios 1 to 3 in `apps/desktop` as the frame's rows give them | librsvg 2.58.4; `26f41562...f3f9`; `cmp` exit 0; `dcf1f066...19d2` |
| `rsvg-convert -w 1024 -h 1024` over the owner's candidate, piped to `shasum -a 256`, and `shasum -a 256` over the candidate's file | `26f41562...f3f9`, the same as scenario 1; the file's hash is `8d15618c...b32c` |
| Scenarios 5, 6 and 7 at the top of the repository as the frame's rows give them, with scenario 6's control search and scenario 7 with `TRADEMARKS.md` added | the three blobs of *Grounding*, in order; exit 1, then `TRADEMARKS.md:33`, `apps/desktop/test/emblem.test.ts:12` and `:42`; exit 0, then exit 1 |
| `git rev-parse` of the three icon paths at `4a005ebf`, `71e7d23`, `v0.0.1`, `v0.0.2` and `v0.0.3`, beside the archive's three at `HEAD` | the same three blobs at every commit |
| `python3 -I test_tmp_rule.py apps/desktop`, run once from the round's scratch directory | 119 elements in the group (50, 18, 24 and 8 by part); `app-icon.svg` 51 of 51 match; `app-icon-small.svg` 21 of 21 match; no kept element has a `transform` |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/emblem.test.ts` in `apps/desktop`, after waiting for no `vitest` to run | 1 file and 1 test passed, in 336 ms |
| `git grep -n -i -e 'TRADEMARKS' -e 'assets/icon' -e 'app-icon' -- '*test*' ':!seal/threads'` | lines of `apps/desktop/test/emblem.test.ts` only |
| `rsvg-convert` of `app-icon.svg`, `app-icon-small.svg` and the archive's `app-icon.svg` at 256, 64, 32 and 16 pixels, enlarged without smoothing into one sheet in the scratch directory | the readings in `## Not judged` |
