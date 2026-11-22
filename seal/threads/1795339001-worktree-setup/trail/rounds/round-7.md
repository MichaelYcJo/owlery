# Review round 7: 1795339001-worktree-setup

```seal
target: 82537e1, fixes 10c478c..82537e1
```

This round verifies the closes of round 6. Its code is the diff since round 6's record `10c478c`: `b573c3b` (finding 2), `59ef441` (finding 1), `613ffd5` (the screenshots made again), `45d6aae` (the closes), the orchestrator's `144d8f8` (principle 4 of `docs/design.md` in both editions, and `pr.md`'s seven links), `d1be724` (the frame's fold of finding 3) and `82537e1` (its close). `origin/release/v0.0.2` stands at `b8c1190`, and it is the merge base of HEAD. No `seal/parity.json` and no `Pact` key stand.

The records read whole at `82537e1` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. After them came `trail/phases/` and `trail/rounds/round-1.md` to `round-6.md`, read for their coordinates. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The diff of `gaps.md` since `10c478c` rewords rows 14 and 21 in place (two lines removed, two added). No row or memo left it.

Carried from rounds 1 to 6, not established again: the copy's semantics and cleanup, the volumes' behaviour, the merge's resolution at `543fb9f`, and the eight `from` of *Rule changes* each standing once. The fix diff touches no file of `apps/desktop/src/daemon/` and no `docs/` section that a `from` names (`git diff --stat 10c478c 82537e1`). Round 5's findings 1 and 2 stay deferred to #144.

The caller said that the built app's windows appear over the owner's screen, and asked for no built-app file unless a close cannot be verified otherwise. So `theme-controls.test.ts`, which holds the new case of finding 1, was not run. Each close was verified by reading the style and the case, by the seven screenshots `613ffd5` holds, and, for finding 2, by running the unit file `themes.test.ts`.

The new case of `theme-controls.test.ts` (line 205) was read against its group. It is the one case that reads the form of a not-copied row. The case before it (line 158) reads only that row's edge. It does not duplicate any other case. Its `face` field compares the error's face with the path's, and holds the fixed-width face only because the global `.path` (`index.html:166`) sets `--font-mono`. That is enough to turn the case red when `.not-copied .why` loses its `font-family`, and it is no finding.

## Findings

### 1. The frame's fold names three edits of `docs/design.md` and leaves out the fourth, the rewording of *Principles* rule 4

```seal
severity: should
location: `seal/threads/1795339001-worktree-setup/frame/design.md:67`, `seal/threads/1795339001-worktree-setup/frame/design.md:233`, `seal/threads/1795339001-worktree-setup/frame/plan.md:77`
evidence: executed `git diff -U0 b8c1190 82537e1 -- docs README.md`, `git show --stat 144d8f8 d1be724`; read `seal/threads/1795339001-worktree-setup/frame/design.md:67`, `seal/threads/1795339001-worktree-setup/frame/design.md:233`, `seal/threads/1795339001-worktree-setup/frame/plan.md:62-77`, `docs/design.md:14`, `docs/design.ko.md:14`
reopens: round-6#3
```

Why it matters: round 6's finding 3 was that the frame did not say which documents of `docs/` this pull request edits. Its close holds for three of the four edits and not for the fourth. The branch's diff of `docs/` against `b8c1190` has five hunks in each edition: line 14, line 48, line 185, line 375 and line 431. *Scope* item 12 (`frame/design.md:67`) and the last row of *Removes* (`frame/design.md:233`) name lines 48, 431, 185 and 375: Register's "Edges and rules", the row "A row of a list of records", and the two token tables. Line 14 is *Principles* rule 4. The orchestrator's `144d8f8` rewrote its last sentence in both editions, from "In Night watch a wait and a failure share the yellow and differ by their shapes and their words." to a sentence that says the two are a shade apart in the light appearance. `d1be724` came after `144d8f8`, and its fold names neither the old sentence nor the new one. The settle reads *Scope* and *Removes* for what the work changed in the policy, so it would not see that a principle changed. The sealer reads the frame against the tree and finds a principle changed with no grounds in the frame. `frame/plan.md` *Judgments of the run* holds no row for the rewording either, and the core asks that a judgment be written down with its grounds and the document it was judged against.

The rewording itself is right. In Night watch light, `--state-waiting` stays `#846000` and `--state-failed` is now `#7f5b00` (`themes.css:199`, `themes.css:204`). In the dark appearance both are `#f2c033`. So the old sentence no longer held, and the new one does.

The snippets replace *Scope* item 12 and the last row of *Removes*, and add a row after `frame/plan.md:77`. They leave every other statement of the frame as it stands.

```markdown
12. **The rules of *Rule changes* are written into the policy documents at the settle, and `docs/design.md` with its Korean edition changes in this pull request.** This work's subject is the code, so it states the rules of *Rule changes* for the settle. `docs/design.md` *Principles* asks that a change to the window change that document in the same pull request. So Register's cell "Edges and rules" in *The themes* and the row "A row of a list of records" of *Components and their states* name the paths the setup copied or could not copy and the form of a path not copied. Night watch light and Desk light raise `--state-failed` to the floor on a selected line. *Principles* rule 4 says that Night watch's wait and failure, which share the yellow, are a shade apart in the light appearance. Each change stands in both editions (`frame/plan.md` *Judgments of the run*, the row of the merge and the row of review round 6).
```

```markdown
| The lists of a list of records' rows, which name a commit, a changed file and a fact, with the same lists of the Korean edition; the light values of `--state-failed` in Night watch and Desk; the sentence of *Principles* rule 4 "In Night watch a wait and a failure share the yellow and differ by their shapes and their words.", with the same sentence of the Korean edition | `docs/design.md` *Principles* rule 4, *The themes*, Register's "Edges and rules", *Components and their states*, the row "A row of a list of records", and the token tables | Rewritten in this pull request with the paths the setup copied or could not copy, the raised values, and a wait and a failure a shade apart in Night watch's light appearance (*Scope* item 12) |
```

```markdown
| 2026-11-22 | Review round 6's finding 2 raises Night watch light's `--state-failed` to `#7f5b00`, so it no longer equals that block's `--state-waiting`, `#846000`. *Principles* rule 4 said the two share the yellow, so it is rewritten in both editions to say they are a shade apart in the light appearance, where a word on a selected line needs the failure darker. The fold of round 6 names the rewording in *Scope* item 12 and *Removes* | `trail/rounds/round-6.md` finding 2; `apps/desktop/src/renderer/themes.css` lines 199 and 204 at `b573c3b`; `144d8f8` | `docs/design.md` *Principles* rules 4 and 9 |
```

```seal
verdict: fixed 8bd9b9f
answer: *Scope* 12, *Removes*' last row and a *Judgments of the run* row now name *Principles* rule 4's rewording, as the round gives them.
```

### 2. `gaps.md` row 21 says the error stands over eight lines in each screenshot, and the inbox's preview draws it over nine

```seal
severity: should
location: `seal/threads/1795339001-worktree-setup/gaps.md:21`
evidence: read `seal/threads/1795339001-worktree-setup/screenshots/night-watch-dark-inbox.png`, `seal/threads/1795339001-worktree-setup/screenshots/night-watch-light-inbox.png`, `seal/threads/1795339001-worktree-setup/screenshots/night-watch-dark-view.png`, `seal/threads/1795339001-worktree-setup/screenshots/night-watch-light-view.png`, `seal/threads/1795339001-worktree-setup/screenshots/register-light-view.png`, `seal/threads/1795339001-worktree-setup/screenshots/night-watch-dark-dialog.png`, `seal/threads/1795339001-worktree-setup/screenshots/night-watch-light-dialog.png` at `613ffd5`, `seal/threads/1795339001-worktree-setup/gaps.md:21`
regression: round-6#1
```

Why it matters: the unit is `gaps.md` row 21, which `613ffd5` reworded in the fix pass of round 6. `frame/design.md` *Scope* item 9 asks that the section list each path that was not copied with why. Round 6's finding 1 asked the fix pass to reword row 21 to the new screenshots. The rewording counted the error's lines in the view and said the same of every screenshot. The row says: "In each, the path the setup could not copy, `certs/localhost-key.pem`, stands whole, and under it the error Node gave, … stands whole over eight lines". The three screenshots of a view draw the error over eight lines. The two of the inbox draw it in the preview over nine, since the preview's column is narrower. The two of the form do not show the section: the dialog covers it. The sealer reads this row to know what the screenshots were checked to show, so the row should say what each one shows.

```markdown
In each screenshot of the inbox and of the view, the path the setup could not copy, `certs/localhost-key.pem`, stands whole. Under it the error Node gave, `EACCES: permission denied, copyfile '…' -> '…'`, stands whole in the fixed-width face and the failure's colour, over nine lines in the inbox's preview and eight in the view. The form's two screenshots show no "Setup" section, since the dialog covers it. In Night watch light, "Setup failed" stands on the selected line in the darkened `#7f5b00`
```

```seal
verdict: fixed 8bd9b9f
answer: `gaps.md` row 21 now says nine lines in the inbox's preview and eight in the view, and that the form's screenshots show no "Setup" section.
```

## Confirmations

```seal
confirms: round-6#1
```
What holds: a path the setup could not copy stands whole, and under it the system's error stands whole. `index.html:174-178` at HEAD draws `.not-copied` as a column. In that column `.path` wraps (`white-space: normal`, `overflow-wrap: anywhere`), and `.why` is in `--font-mono` and `--size-caption`, `pre-wrap`, wrapped anywhere, selectable, and in `--state-failed`. This is the form of the Ask section's `error-output` (`index.html:371`), apart from the colour, which the close explains. `.copied` keeps the flex row. The five screenshots of the inbox and the view at `613ffd5` show `certs/localhost-key.pem` whole and the error whole under it. Register light rules each copied path. The new case (`theme-controls.test.ts:205`) builds the row as `shared.ts:317` does, inside a `ul` in `#view-detail`, with a path and an error that hold no space where they could break. It reads six fields. Against the rules at `10c478c` (a flex row, both parts `nowrap` with an ellipsis, the error in the sans face, no `user-select`), each of the six reads wrong, as the close says. That was read, not run. The case was not run, by the caller's limit on built-app files. Both editions of `docs/design.md:431` state the form and say the same. `changelog.md:11` and `gaps.md` row 14 say it. `pr.md`'s seven links each name `613ffd53e5247d906a840b931556b234af76fb9d`. `git cat-file -e` finds each path at that commit, each file is the same blob at HEAD, and `git diff --stat 613ffd5 82537e1 -- apps` prints nothing, so the screenshots show the code at HEAD. Executed and read.

```seal
confirms: round-6#2
```
What holds: "Setup failed" on a selected line reaches 4.5 to 1 in Night watch light and Desk light. `themes.test.ts:228` holds `--state-failed` on `[WINDOW, "--hover"]` and `[WINDOW, "--selected"]`. `themes.css:204` is `#7f5b00` and `themes.css:644` is `#8b5107`, and both editions of `docs/design.md` (lines 185 and 375) give the same values. Executed: `themes.test.ts` at HEAD passed 16 of 16. With the two old values put back in the clone, the floor case failed on exactly "night-watch light --state-failed on --ground under --selected: 4.20 to 1" and "desk light --state-failed on --ground under --selected: 4.26 to 1", and the case of the documents failed too. So the close's red is reproduced, and the test pins both the values and the documents. `changelog.md:9` names the two values. The Night watch light screenshot of the inbox shows "Setup failed" on the selected line in the darker colour.

What matched: the two editions of `docs/design.md` say the same, and they have the same counts. Executed: `grep -c '^#'` gives 15 in each, and `grep -c '^|'` gives 365 in each. The diff of each edition since `b8c1190` has the same five lines (14, 48, 185, 375, 431). In principle 4, the Korean edition says that the failure is one step darker in the light appearance so that a word on a selected line keeps the floor. The English edition says the two are "a shade apart in the light appearance where a word on a selected line needs it darker". The two say the same. Line 51's "a line of the darkened yellow" around Night watch light's failure mark still holds at `#7f5b00`. Read.

What matched: the error's colour on its grounds. The error stands in the preview on `--ground` and in the view's right column on `--ground-column`. `themes.test.ts` holds `--state-failed` on both, and both passed in the run above. Executed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| `theme-controls.test.ts` at HEAD, which holds finding 1's new case, and every other built-app file. The caller asked that none be run while the owner is at the Mac (#148). This round ran none | `apps/desktop/test/theme-controls.test.ts:205` | the orchestrator's broad run |
| The suite, the typecheck and the documents' checks of the `Broad gate` key at HEAD, labelled `unverified`. This round ran `themes.test.ts` twice, once as a probe with two values changed | `seal/config.json` `Broad gate` | the orchestrator's broad run |
| Whether GitHub draws the seven images in the pull request's body. `613ffd5` is on no remote branch yet (`git branch -r --contains 613ffd5` printed nothing) | `seal/threads/1795339001-worktree-setup/pr.md:20-26` | the orchestrator, once the branch is pushed |
| Q2 and Q3, carried from rounds 1 to 6 | `seal/threads/1795339001-worktree-setup/frame/questions.md` | a measurement by the owner or the orchestrator |

This round leaves two `should` findings open, both in the work item's records, `frame/design.md` with `frame/plan.md` and `gaps.md`. Neither changes the code or the window. After their fix the orchestrator's broad run and the sealer's spawn come due.

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/themes.test.ts` in `apps/desktop` of the round's clone at `82537e1` | 16 passed |
| The same, with `themes.css:204` set back to `#846000` and `themes.css:644` to `#8f550b`, then restored by `git checkout` | 2 failed, 14 passed: the floor case on Night watch light 4.20 and Desk light 4.26 on `--ground` under `--selected`, and the case that compares the documents with the style |
| `git cat-file -e 613ffd53e5247d906a840b931556b234af76fb9d:<path>` and `git rev-parse` at `613ffd5` and HEAD for each of `pr.md`'s seven links | exit 0 for each, and the same blob at both commits |
| `git diff -U0 b8c1190 82537e1 -- docs README.md` | five hunks in each edition of `docs/design.md`, at lines 14, 48, 185, 375 and 431 |
| `grep -c '^#'` and `grep -c '^\|'` on `docs/design.md` and `docs/design.ko.md` | 15 and 365 for each |
