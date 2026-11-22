# Review round 6: 1795339001-worktree-setup

```seal
target: 674094e, fixes 0639627..674094e
```

This round reads the merge of the moved base and the screenshots. Its code is what the branch changed after round 5's target `0639627`: the frame's fold `f71ff5c` and the close `6013623`, the merge `543fb9f` of `origin/release/v0.0.2` at `b8c1190`, and the eight commits after the merge (`a4403ef`, `80b8d38`, `a5d4c8e`, `ed06c4c`, `15db0db`, `14d2d0e`, `6956b76`, `674094e`). `origin/release/v0.0.2` stands at `b8c1190`, and it is the merge base of HEAD. `b8c1190` holds #40's merge `cc0b938` (#142) and #130's merge (#143). No `seal/parity.json` and no `Pact` key stand.

The records read whole at `674094e` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. After them came `trail/phases/` and `trail/rounds/round-1.md` to `round-5.md`, read for their coordinates. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The diff of `gaps.md` since `6013623` rewords row 14 and the *Not done* paragraph on `uchg` in place, and adds rows 20 and 21. No row or memo left it.

Carried from rounds 1 to 5, not established again: the matcher's semantics, the copy's cleanup and its probes, and the volumes' behaviour. `apps/desktop/src/daemon/worktree-setup.ts` and `apps/desktop/test/worktree-setup.test.ts` are the same at `674094e` as at `0639627` (`git diff --stat` printed nothing), so no verdict on them is reopened. Round 5's findings 1 and 2 stand deferred to #144, as their closes say. Established again this round: each `from` of *Rule changes* stands once in its document at HEAD, and each section the rule changes name stands, after #40 and #130 changed `docs/architecture.md`, `docs/product.md` and both Korean editions (`grep -c -F` on each `from`, each 1).

The merge's resolution was read with `git show --remerge-diff 543fb9f`. Its four conflicts keep both sides. `daemon.ts` and `view.test.ts` import both `RecordsPlace` or `RecordsPlan` and `WorktreeSetup`. `daemon.test.ts` imports both `records-place` and `worktree-setup`. `view.test.ts` keeps `RUNNING_SETUP` and gives `PROJECT` #40's `records` field. `index.html` keeps the setup's styles and adds `.copied, .not-copied` to #130's edge of a row of a list of records. The merge also edits two cells of `docs/design.md` and of `docs/design.ko.md` (finding 3). The `createWorkItem` case at HEAD runs `beginSetup` after `createWorktree` and before `addWorkItem`, beside #40's `readRecords` of the new repository. The window's register-only path (`renderer.ts:1684`) calls `registerRepository` and never `createWorkItem`, so #40's records dialog meets no plan wait. Each case name of `view.test.ts`, `daemon.test.ts` and `work-item-menu.test.ts` at `6013623` and at `b8c1190` stands at HEAD. The three names that differ are renames, and HEAD holds the newer name of each side. Executed: a `comm` of the names at the three commits.

The axes of this round, beyond the table's: the floors of `docs/design.md` *Principles* rule 9 on the grounds the new words stand on, the forms of *Components and their states*, the voice of *The voice of the window's words*, the merge's keeping of both sides, and the screenshots against `docs/design.md` *A pull request that changes the window carries its screenshots*.

The crafter's three notes on the screenshots are judged here.

- A not-copied path reads "ce…" in the preview and "cer…" in the view. This is finding 1.
- The why is Node's raw `EACCES … copyfile '/private/var/…'` text. It is the system's text, not a sentence of the window. The window already shows a program's error under its own sentence: the Ask section draws `error-output` whole, wrapped and in the fixed-width face (`index.html:371`, `work-item-view.ts:647`). The setup's why is drawn as if it were the window's sentence: in the sans face, cut to one line, in the failure colour. Finding 1's fix gives it the `error-output` form. The section's sentence ("The command ended with code 1.") stays the window's own words.
- The form draws `.worktreeinclude` and the command in the sans face. This is judged no finding. `.worktreeinclude` stands inside a sentence, and the window's sentences name files in the sans face elsewhere, as "No command runs: .worktreesetup names none." does. The command after "Then runs:" reads the same in either face, and no sentence of `docs/design.md` gives a command's face. The view draws the same command in the fixed-width face (`.setup-command`). That is a difference of two faces, and it tells the person nothing wrong.

`theme-controls.test.ts` was judged from the code. The failing case waits for `data-appearance` to turn light after `Emulation.setEmulatedMedia`. The page turns it in a `matchMedia` listener (`apps/desktop/src/renderer/theme.ts:25`). The branch changes neither that file nor `preload.ts`, nor anything of the main process's appearance (`git diff --stat b8c1190 674094e -- apps`). Its change to the file is a wait for the form's plan in `beforeAll` (`theme-controls.test.ts:71`). That wait only delays the creation, and it is the same wait the branch gives each built-app file that presses Create. The next case's failure on Desk's `--radius-line` follows from the first: that case leaves the appearance under Match the system in the dark, where it expects Desk light's 5px. So this change does not make the file flaky. A media query's change is evaluated as the page renders, and a page whose window draws no frames, as under a sleeping display or with the window covered, may not render. That stands at the base as well, which the gaps row's run at `b8c1190` cannot rule out. The file passed once at HEAD in the round's scratch clone, with the display held awake. The two Electron apps that `gaps.md` row 20 names, pids 48323 and 62468, were no longer running when this round looked.

The case `80b8d38` adds to `theme-controls.test.ts` was read against the cases of the edge under a row of a list of records. It adds `.copied` and `.not-copied` to the rows the case builds. Without the selector's two classes, `getComputedStyle(row).boxShadow` reads `none`, which fails `toMatch(/0px 1px 0px 0px$/)` in Register. So it holds the merge's two classes, which no other case reads. Read. The new case of `screenshots.test.ts` for `createdPane` holds the screenshot run's own helper, a fact no *Scope* item states. It claims no more than it pins (`apps/desktop/test/screenshots.test.ts:128`).

## Findings

### 1. A path the setup could not copy is cut to its first letters, and its error to one line, so the "Setup" section names neither

```seal
severity: must
location: `apps/desktop/src/renderer/index.html:174-175`, `seal/threads/1795339001-worktree-setup/pr.md:20-26`, `seal/threads/1795339001-worktree-setup/gaps.md:21`
evidence: read `seal/threads/1795339001-worktree-setup/screenshots/night-watch-dark-inbox.png`, `seal/threads/1795339001-worktree-setup/screenshots/night-watch-dark-view.png`, `seal/threads/1795339001-worktree-setup/screenshots/night-watch-light-view.png`, `seal/threads/1795339001-worktree-setup/screenshots/register-light-view.png` at `14d2d0e`, `apps/desktop/src/renderer/index.html:166`, `apps/desktop/src/renderer/index.html:174-175`, `apps/desktop/src/renderer/index.html:371`, `apps/desktop/src/renderer/shared.ts:317`, `seal/threads/1795339001-worktree-setup/frame/design.md:64`, `docs/design.md:448`
```

Why it matters: `frame/design.md` *Scope* item 9 (line 64) says the section "lists the copied paths and each path that was not copied with why". In every screenshot the path that was not copied, `certs/localhost-key.pem`, reads "ce…" in the preview and "cer…" in the view. Its why reads "EACCES: permission denied, copyfile '/private/var/folders/xc/…" and stops there. A failed copy is the one case the rows exist for, and a person can read neither which path failed nor why. `docs/design.md` *The voice of the window's words* (line 448) asks for "A whole sentence that names the thing", and the row names no thing.

The cause is the layout, not the screenshot run. `shared.ts:317` makes a not-copied row of a `.path` and a `.why` side by side. `.not-copied` is a flex row (`index.html:174`). The global `.path` (`index.html:166`) and `.not-copied .why` (`index.html:175`) both take `min-width: 0`, `overflow: hidden`, `text-overflow: ellipsis` and `white-space: nowrap`. Flex shrinks each child in proportion to its width. Node's error for a copy names the source and the stage by their absolute paths, so it is always far longer than the path, and the path is cut almost whole. This happens wherever a copy fails with an error from the system, which is every failed copy but `LEADS_OUT` and `APPEARED`.

The window already has a form for a program's error under its own sentence. That is the Ask section's `error-output` (`index.html:371`): whole, wrapped, in the fixed-width face and selectable. The snippet replaces lines 174 and 175 so that the path stands whole and the why stands under it in that form. It touches no OS boundary.

```css
      .copied { display: flex; align-items: center; gap: var(--space-5); min-height: var(--detail-line); }
      /* A path the setup could not copy stands whole, and under it the error the system gave, whole and in the fixed-width face, as a failed prompt's output stands under its sentence. */
      .not-copied { display: flex; flex-direction: column; justify-content: center; gap: var(--space-2); min-height: var(--detail-line); padding: var(--space-3) 0; }
      .not-copied .path { overflow: visible; white-space: normal; overflow-wrap: anywhere; }
      .not-copied .why { font-family: var(--font-mono); font-size: var(--size-caption); color: var(--state-failed); white-space: pre-wrap; overflow-wrap: anywhere; user-select: text; }
```

No case reads the row's layout. By contract rule 14 the fix pins it. The case below goes in `apps/desktop/test/theme-controls.test.ts`, after the view of Alpha opens at line 197, where `#view-detail` is laid out. It builds a row as `shared.ts` does and takes it away. Against HEAD it reads `pathCut: true`, by the layout above. This round did not run it in this form.

```ts
    // A path the setup could not copy stands whole beside the system's error, however long the error is, and the error is read whole.
    const notCopied = await app.evaluate<{ pathCut: boolean; whyCut: boolean }>(
      `(() => { const row = document.createElement("div"); row.className = "not-copied"; const path = document.createElement("span"); path.className = "path"; path.textContent = "certs/localhost-key.pem"; const why = document.createElement("span"); why.className = "why"; why.textContent = "EACCES: permission denied, copyfile '" + "/private/var/folders/xc/abc/T/owlery/".repeat(4) + "certs/localhost-key.pem'"; row.append(path, why); document.querySelector("#view-detail").append(row); const found = { pathCut: path.scrollWidth > path.clientWidth, whyCut: why.scrollWidth > why.clientWidth }; row.remove(); return found; })()`,
    );
    expect(notCopied).toEqual({ pathCut: false, whyCut: false });
```

The snippets leave three statements of the drawing, which the fix pass owes too. The seven screenshots at `14d2d0e` show the old drawing, so `pnpm run screenshots` is run again at the fix and the files are committed in their place. `pr.md` lines 20 to 26 then name the commit that holds the new files, since `docs/design.md` *A pull request that changes the window carries its screenshots* has each link name the commit that holds its file. `gaps.md` row 21, which says the path is cut, is closed or reworded to the new screenshots.

### 2. "Setup failed" on a selected line stands under the 4.5 to 1 floor in Night watch light and in Desk light

```seal
severity: must
location: `apps/desktop/src/renderer/index.html:274`, `apps/desktop/test/themes.test.ts:228`, `apps/desktop/src/renderer/themes.css:204`, `apps/desktop/src/renderer/themes.css:644`, `docs/design.md:185`, `docs/design.md:375`, `docs/design.ko.md:185`, `docs/design.ko.md:375`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/themes.test.ts` in `apps/desktop` of the round's scratch clone at `674094e`, with `...UNDER_THE_POINTER, ...SELECTED` added to the grounds of `--state-failed` at line 228; read `docs/design.md:19`, `apps/desktop/test/themes.test.ts:196-228`, `apps/desktop/src/renderer/index.html:274`, `seal/threads/1795339001-worktree-setup/screenshots/night-watch-light-inbox.png`
```

Why it matters: `docs/design.md` *Principles* rule 9 (line 19) holds words at 4.5 to 1 against "the ground under them", and names "a selected line's, and one under the pointer, as much as the window's own". `.line .setup.failed` (`index.html:274`) sets "Setup failed" in `--state-failed`. Those words stand on the inbox's line at rest, under the pointer and selected. The Night watch light screenshot of the inbox shows them on the selected line. Before this branch, `--state-failed` set no word on a line. So `themes.test.ts` holds it on the window, the column, the sidebar and a card alone (line 228), and the merge left that list as #130 wrote it. The test's own comment says the lists name which word stands on which ground, since no style sheet says so in a form a text reads.

The probe added the line's grounds to that list and ran the module. On the line's own grounds, two blocks fall under the floor:
- Night watch light, `--state-failed` on `--ground` under `--selected`: 4.20 to 1.
- Desk light, `--state-failed` on `--ground` under `--selected`: 4.26 to 1.

Under the pointer, `--ground` under `--hover` passed in every block. The probe's other six lines were on `--ground-side`, where no setup word stands.

Rule 9 also says "A value that falls under a floor changes, in every theme, and no theme keeps a value because it had it." So the fix pins the line's grounds in the test and changes the two values. *Tokens* says a value changes in `docs/design.md`, its Korean edition and the style sheet in one commit. The two values below are the first that reach 4.5 by the WCAG formula over the selected ground. They were worked out with the floor's formula, and were not run through `themes.test.ts`. Register light keeps `#8f550b`, which passes on its own fainter `--selected`. Every other word `--state-failed` sets, such as the sidebar's notice and a dialog's refusal, grows darker and stays above its floor.

```ts
  // A failure's colour also sets the sidebar's notice, what a dialog refuses, and a line's "Setup failed", on a line at rest, under the pointer and selected.
  "--state-failed": [[WINDOW], [COLUMN], [SIDE], [CARD], [WINDOW, "--hover"], [WINDOW, "--selected"]],
```

```css
/* apps/desktop/src/renderer/themes.css:204, Night watch light */
  --state-failed: #7f5b00;
/* apps/desktop/src/renderer/themes.css:644, Desk light */
  --state-failed: #8b5107;
```

```markdown
docs/design.md:185 and docs/design.ko.md:185, Night watch:
| `--state-failed` | `#f2c033` | `#7f5b00` |
docs/design.md:375 and docs/design.ko.md:375, Desk:
| `--state-failed` | `#dba545` | `#8b5107` |
```

The other way out is to draw the words in another token on a selected line, which changes no value. That way still owes the test's row, and a sentence in `docs/design.md` *Components and their states* for the form.

### 3. The frame says this work edits no document of `docs/`, and the branch edits `docs/design.md` and its Korean edition

```seal
severity: should
location: `seal/threads/1795339001-worktree-setup/frame/design.md:67`, `seal/threads/1795339001-worktree-setup/frame/design.md:222-232`
evidence: executed `git diff --stat b8c1190 674094e -- docs README.md`; read `seal/threads/1795339001-worktree-setup/frame/design.md:54`, `seal/threads/1795339001-worktree-setup/frame/design.md:67`, `seal/threads/1795339001-worktree-setup/frame/plan.md:77`, `docs/design.md:9`, `docs/design.md:18`, `docs/design.md:48`, `docs/design.md:431`
```

Why it matters: *Scope* item 12 (`frame/design.md:67`) says "This work's subject is the code, so it states them and edits no document of `docs/`." The branch's diff against its base changes two lines of `docs/design.md` and two of `docs/design.ko.md`. The merge `543fb9f` made them. Register's cell "Edges and rules" (line 48) and the row "A row of a list of records" of *Components and their states* (line 431) now name the paths the setup copied or could not copy. The edit is right by `docs/design.md` itself. *Principles* says that a change to the window "changes this document in the same pull request" (line 9), and rule 8 that a form a change needs is added there first (line 18). `frame/plan.md` *Judgments of the run* (line 77) accepts it. The frame still says the opposite. The sealer reads the frame against the tree. The settle reads *Scope* and *Removes* for what the work changed in the policy, and finds no word of `docs/design.md` there.

The snippet replaces *Scope* item 12. The second snippet is a row for the end of *Removes*. *Rule changes* gains nothing, since the two cells are already written and the settle would write them twice.

```markdown
12. **The rules of *Rule changes* are written into the policy documents at the settle, and `docs/design.md` with its Korean edition changes in this pull request.** This work's subject is the code, so it states the rules of *Rule changes* for the settle. `docs/design.md` *Principles* asks that a change to the window change that document in the same pull request, so Register's cell "Edges and rules" in *The themes* and the row "A row of a list of records" of *Components and their states* name the paths the setup copied or could not copy, in both editions (`frame/plan.md` *Judgments of the run*, the row of the merge).
```

```markdown
| The lists of a list of records' rows, which name a commit, a changed file and a fact, with the same lists of the Korean edition | `docs/design.md` *The themes*, Register's "Edges and rules", and *Components and their states*, the row "A row of a list of records" | Rewritten in this pull request with the paths the setup copied or could not copy (*Scope* item 12) |
```

Line 54 ("item 12 the policy documents' text") still holds with the snippet. Finding 2's fix, where it changes two tokens, adds two more cells of `docs/design.md` and of its Korean edition to this item and to the row.

## Confirmations

```seal
confirms: round-5#3
```
What holds: `frame/design.md` line 57 now says the exception as round 5 gave it. The copy of a folder the source kept read-only gets its write bit back and is removed. The staging folder stays only where a file under `uchg` refuses the removal again. Line 107 says `removeStaging` removes `copy/` through `removeCopy` and the folder through `rm`, after each copy. It also says that nothing names a staging folder left after a copy that succeeded. Each sentence was read against `worktree-setup.ts` at HEAD (`removeStaging` at lines 183 to 186, `removeCopy` at lines 164 to 170), which `git diff --stat 0639627 674094e` shows unchanged. "or `EPERM`" stays, as the close says, while #144 decides the branch. Read.

What matched: `pr.md`'s seven image links each name `14d2d0ef9bfc1a3405ef6e8afe498664f4b2ba1e`, which is `14d2d0e` whole. Each names a path that `git cat-file -e` finds at that commit, in the form `![…](../blob/<commit>/<path>?raw=true)` that `docs/design.md` *A pull request that changes the window carries its screenshots* gives. Each file is the same blob at HEAD. The set holds what that section asks of a change to the window: the inbox and a work item's view, and the dialog the work changed, the "New work item" form, each in Night watch dark and light. It also holds Register light's view, the one other theme whose form of the changed part differs, by its rules. The menu is unchanged by this work. Executed: `git cat-file -e` and `git rev-parse` on each link.

What matched: the screenshots' other words and forms. "Setting up" stands in the muted ink and "Setup failed" in the failure colour, after the line's text and before its seal's place. The setup pane's tab reads "Setup". "Run setup again" stands in the view's "Setup" head and not in the preview's. The section's sentence, "The command ended with code 1.", and its command line, "Command: pnpm install", are in the fixed-width face. The copied paths carry Register's rule and no rule in Night watch. Each word is in sentence case, and no word sells. The form says "Copies the ignored files .worktreeinclude names from the main checkout. Then runs: pnpm install" under the folder, as *Scope* item 7 and `view.ts#planLine` give it. Read, at `14d2d0e`.

What matched: `gaps.md` row 18, the style rule `.setup-command`, which names the round after the fix pass as its answerer. It sets the command in the fixed-width face, wrapped and selectable, as `error-output` does (`index.html:173`, `index.html:371`). The screenshots draw it so. Read.

What matched: the screenshot run's fixture (`15db0db`). `sample-pane.sh` takes a setup pane by its `-c` argument that does not open with `exec claude`. It prints the command and two lines of an install, and exits with the code the run types. So no setup command runs. The run names the setup before each form opens, so the form's plan and the creation carry the same command. The work item whose setup fails is made after `certs/localhost-key.pem` loses its read bits. Its setup then fails by the copy as well as by the code 1 the run types. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the documents' checks of the `Broad gate` key at HEAD, labelled `unverified`. This round ran `themes.test.ts` once, as a probe with one line changed, and `theme-controls.test.ts` once | `seal/config.json` `Broad gate` | the orchestrator's broad run |
| The built-app test files other than `theme-controls.test.ts`, which this round did not run, among them `records-dialog.test.ts` and `screenshots.test.ts` from the base, and the rows of `gaps.md` that name the broad gate | `seal/threads/1795339001-worktree-setup/gaps.md` | the orchestrator's broad run |
| Whether `theme-controls.test.ts` fails at the base under a sleeping display or a covered window, which would place its two failures at #130's file | `apps/desktop/test/theme-controls.test.ts:151-152` | the orchestrator's broad run, which runs it at HEAD and at the base (`gaps.md` row 20) |
| Whether GitHub draws the seven images in the pull request's body. `14d2d0e` is on no remote branch yet, so no link resolves on GitHub until it is pushed | `seal/threads/1795339001-worktree-setup/pr.md:20-26` | the orchestrator, once the branch is pushed |
| Q2 and Q3, carried from rounds 1 to 5 | `seal/threads/1795339001-worktree-setup/frame/questions.md` | a measurement by the owner or the orchestrator |

The round leaves three findings open: two `must` and one `should`. Findings 1 and 2 change what the window draws. So the fix pass makes the screenshots again at its commit and repoints `pr.md`'s links. A verifying round then reads the fix diff and the new screenshots. After it, the orchestrator's broad run and the sealer's spawn come due.

## Probes

| Command | Result |
|---|---|
| `git show --remerge-diff 543fb9f` in the branch's worktree | the four conflicts and how each was resolved, the two cells of each edition of `docs/design.md`, and the paragraph of `gaps.md` on `uchg` |
| A `comm` of the case names of `view.test.ts`, `daemon.test.ts` and `work-item-menu.test.ts` at `6013623`, `b8c1190` and `674094e` | no case of either side is missing at HEAD; three names differ, each a rename that HEAD holds in its newer form |
| `grep -c -F` of each `from` of *Rule changes* in its document at HEAD | 1 for each of the eight |
| `git cat-file -e 14d2d0ef9bfc1a3405ef6e8afe498664f4b2ba1e:<path>` for each of `pr.md`'s seven links | exit 0 for each; `git rev-parse` gives each file the same blob at `14d2d0e` and at HEAD |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/themes.test.ts` in `apps/desktop` of the round's scratch clone at `674094e`, with `...UNDER_THE_POINTER, ...SELECTED` added to `--state-failed` at line 228 | 1 failed, 15 passed. Under 4.5 to 1: Night watch light on `--ground` under `--selected` 4.20, Desk light on `--ground` under `--selected` 4.26, and six pairs on `--ground-side`, where no setup word stands |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/theme-controls.test.ts` in the same clone, unchanged at that file, under `caffeinate -d -u -t 900` | 5 passed |
