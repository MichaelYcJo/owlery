# Review round 3: 1795340000-design-system

```seal
target: bf984af, fixes 22920e3..bf984af
```

This is a verifying round. It answers the four findings round 2 closed, reviews the new units of the fix diff `22920e3..bf984af` as code, and reads the work item's records whole at `bf984af`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` stands, because `Commit and pull request language` is English. No `seal/parity.json` is declared. The phase records are unchanged since `f41bd67` (executed: `git diff --stat f41bd67..HEAD -- seal/threads/1795340000-design-system/trail/phases` printed nothing), so round 1's reading of them is carried. `routing.md` and `frame/questions.md` are unchanged since round 2 (executed: `git diff --stat 22920e3..HEAD` names neither). `themes.css` is unchanged since `bfb25f2` (executed: `git diff --quiet bfb25f2 HEAD -- apps/desktop/src/renderer/themes.css` exited 0), so the values round 2's two probes measured are carried as coordinates and not measured again. No verdict of round 2 was carried.

The code under review was cloned with `git clone --no-local` at `bf984af` into the round's scratch directory. The work tree of the branch holds only this record as a change.

## Findings

### 1. Principle 9's sentence on a disabled part says every disabled part is drawn at 45%, and the two editions exempt different parts

```seal
severity: should
location: `docs/design.md:19`, `docs/design.ko.md:19`, `seal/threads/1795340000-design-system/frame/design.md:93`
evidence: read `docs/design.md:19`, `docs/design.ko.md:19`, `docs/design.md:433`, `apps/desktop/src/renderer/index.html:70`, `apps/desktop/src/renderer/index.html:364`, `apps/desktop/src/renderer/index.html:377`, `apps/desktop/src/renderer/renderer.ts:1066`, `apps/desktop/src/renderer/renderer.ts:1100`, `seal/threads/1795340000-design-system/frame/design.md:93`, `seal/threads/1795340000-design-system/frame/plan.md:84`
regression: round-2#2
```

Why it matters: the unit is the last sentence of principle 9, which `98b594c` wrote. `frame/plan.md:84`, the row on round 2, accepts the fix pass's addition of "a disabled part, drawn at 45% of its strength", and `frame/design.md:93` repeats it. The fix pass wrote the sentence from `button:disabled { opacity: 0.45; }` (`index.html:70`) and applied it to every disabled part. That is where the defect came from: only a button is drawn at 45%.

The English sentence is "A disabled part, drawn at 45% of its strength, is outside them too." The phrase between the commas describes every disabled part, so the sentence makes two claims. It says every disabled part is drawn at 45%. It also says every disabled part is outside the floors. The first claim is false in the tree. A field can be disabled (`renderer.ts:1066`, `:1100`), and `docs/design.md:433` gives its disabled state as "As the system draws a field that takes nothing". The page keeps its words in `--ink-strong` (`index.html:364`). The label of a disabled check is drawn in `--ink-faint` at full strength (`index.html:377`).

The Korean sentence is "쓸 수 없어 세기의 45%로 그리는 부분에도 이 기준을 적용하지 않습니다." It exempts only the parts drawn at 45%. So the two editions disagree on a disabled field and a disabled check's label. The Korean edition holds them to the floor, and the English one leaves them outside it. An agent that reads the English edition to judge a later change could fade a disabled field's words under 4.5 to 1 and cite principle 9. Round 2's finding 2 was about this kind of fault in the same principle: a rule an agent acts on has one reading (`skills/writing-style/SKILL.md`).

What the build holds matches the Korean reading. The case holds `--ink-faint` on a card and `--ink-strong` on a field (`WORDS` in `apps/desktop/test/themes.test.ts`), so the label of a disabled check and a disabled field's words already meet the floor. Only a button is under it. This round's probe measures a disabled button's words at 2.54 to 4.27 to 1 (see *Probes*).

```markdown
<!-- docs/design.md:19, the last sentence of principle 9 -->
A disabled button, which `button:disabled` draws at 45% of its strength, is outside them too.

<!-- docs/design.ko.md:19, the last sentence of principle 9 -->
꺼져 있어서 `button:disabled`가 세기의 45%로 그리는 단추에도 이 기준을 적용하지 않습니다.

<!-- frame/design.md:93, Contrast, the last clause -->
and a disabled button, which `button:disabled` draws at 45% of its strength.
```

The two rows of `frame/plan.md` *Judgments of the run* that name "a disabled part" (`:84`, `:85`) are dated records of a decision. Whether they are reworded is the orchestrator's call. Finding 2's sentences follow whichever wording this fix gives. No case reads the principle's words, so the sentence is pinned by nothing, as round 2 found for its last sentence.

### 2. The pull request text and the changelog list three things outside the contrast floor, and principle 9 names a fourth, which the screenshots show

```seal
severity: should
location: `seal/threads/1795340000-design-system/pr.md:16`, `seal/threads/1795340000-design-system/changelog.md:7`
evidence: read `seal/threads/1795340000-design-system/pr.md:16`, `seal/threads/1795340000-design-system/changelog.md:7`, `docs/design.md:19`, `apps/desktop/src/renderer/index.html:70`, `apps/desktop/src/renderer/index.html:575`, `apps/desktop/src/renderer/work-item-view.ts:619`, `apps/desktop/src/renderer/view.ts:1631`, `seal/threads/1795340000-design-system/screenshots/register-dark-view.png`, `seal/threads/1795340000-design-system/screenshots/register-light-view.png`; executed `python3 -I test_tmp_lasting_and_disabled.py apps/desktop/src/renderer/themes.css` (see *Probes*)
reopens: round-2#3
```

Why it matters: round 2's finding 3 asked that the two sentences "name the same exemptions" principle 9 names, "whichever reading finding 2's fix gives" it. That close does not hold. Finding 2's fix gave principle 9 two exemptions: a ground drawn only while a part is pressed, and a disabled part. `changelog.md:7` (`7282b7c`) says "Three things are not held to it" and `pr.md:16` (`f419b4b`) says "Three things are outside that floor". Each names the pressed ground, the menu's item under the keyboard and the edges of a field and a button. Neither names a disabled button.

A disabled button is on screen in this pull request's own screenshots. "Ask" in a view's right column is a quiet button (`index.html:575`). It is disabled while its field is empty (`view.ts:1631`, `work-item-view.ts:619`), so a view at rest shows it disabled, and it is drawn faded in both Register views. Executed: a quiet button's words at 45% stand at 2.54 to 3.62 to 1 over the window, and the main button's at 2.61 to 4.27 over a card. So "Every word of the window can be read where it rests" claims more than the tree holds, and its list of exceptions has a gap. The sealer reads `pr.md` against principle 9 and finds two lists that differ.

The commit `98b594c` claims "The closing memo's row says the same" of the principle's two exemptions. The row of `gaps.md` *Not done* (`gaps.md:34`) names the pressed ground alone.

```markdown
<!-- pr.md:16, the last sentence -->
Four things are outside that floor: the ground drawn only while a part is pressed, a disabled button, drawn at 45% of its strength, the menu's item under the keyboard, and the edges of fields and buttons.

<!-- changelog.md:7, from "Three things are not held to it." to "stands at 4.18 to 1 at its lowest." -->
Four things are not held to it. Two are outside the floor by that principle: the ground drawn only while a part is pressed, where the faint ink on a pressed item of the sidebar stands at 4.18 to 1 at its lowest, and a disabled button, drawn at 45% of its strength.
```

The rest of `changelog.md:7` stands. Where finding 1's fix words the exemption another way, these two sentences take its words. `pr.md` is the orchestrator's file, and `changelog.md` is the fix pass's.

## Confirmations

```seal
confirms: round-2#1
```
What holds: `#view-fact-list` sets `align-items: stretch` (`apps/desktop/src/renderer/index.html:339`), and the comment at `:338` now says each box is as high as the row. The fourth case of `apps/desktop/test/theme-controls.test.ts` (`:193` to `:200`) opens Alpha's view in Register. It holds that "Worktree" runs past one line, and that each term ends at its value's height. Executed: `OWLERY_BACKGROUND=1 pnpm run test test/theme-controls.test.ts`, alone, passed 5 cases. With `align-items: start` put back in the clone, the same run failed on `theme-controls.test.ts:200` alone, on "Worktree", with the term ending at 193.73 and the value at 225.40. The fix pass's account of its red run says the same. The two re-shot views were opened as images, and enlarged crops of the fact list were read. In each, one rule runs from the term to the value's end under the three lines of the worktree's folder. The views were made from the code at HEAD (executed: `git diff --stat b6201b2 HEAD -- apps/` printed nothing).

```seal
confirms: round-2#2
```
What holds: the sentence on a press now has one reading in both editions. "A ground drawn only while a part is pressed is outside these floors: it lasts as long as the press, and the part's words were read before it" (`docs/design.md:19`) says the same as "부분을 누르는 동안에만 그려지는 바탕에는 이 기준을 적용하지 않습니다. 그 바탕은 누르는 동안에만 있고, 그 부분의 글자는 누르기 전에 이미 읽었기 때문입니다." (`docs/design.ko.md:19`). It names a ground by when it is drawn, not by its token, so the `--pressed` under "Side by side" while it is turned on (`index.html:296`) stays inside the floor, as the fix pass's answer says. The comment over `WORDS` in `themes.test.ts`, the row of `gaps.md:34` and `frame/plan.md:84` agree with it. Executed: `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts` passed 16 cases, so the token case still reads both editions. The sentence on a disabled part, which the same commit added, is finding 1.

```seal
confirms: round-2#4
```
What holds: `frame/design.md:148`, *Scope* item 5, names exactly the values Desk's blocks changed. Executed: `test_tmp_changed_values.py` compared each block of Desk and Register at HEAD with the block it stands on at `0d65470`. Desk dark changed `--ink-muted`, `--ink-faint`, `--state-finished`, `--state-no-agent` and `--removed`. Desk light changed those five, `--state-working` and `--state-failed`, and no other value. The Register and Desk cells of *Palette, dark* and *Palette, light* (`frame/design.md:100`, `:101`) give each changed colour its value as the probe printed it. Register's other changed values are the form's: its rules, the selected ground and edge, the controls, the corners and the tab's edge, which the rows *Edges and rules*, *Selected* and *Corners* state, and in the light block the main button's ink. `frame/plan.md:83` now names finding 4, and `:85` records this fold. *Removes* (`frame/design.md:209`) says "the inks raised to the contrast floor (*Scope* item 5)", which holds through its citation.

What matched: the sixteen images of `pr.md`. Executed, for each link: `git cat-file -e <commit>:<path>` exited 0, `git merge-base --is-ancestor <commit> HEAD` exited 0, and the blob at the linked commit is the blob at HEAD (`git rev-parse` of both printed the same id). Fourteen are linked at `e974e843d0ea2567f5f79bd82229d68cf3b562af` and the two Register views at `b6201b295b5d76b478063c3378bd3db66e4096a3`, each by its full id. `git diff e974e84 HEAD -- apps/` changes a comment of `themes.css`, the new case, and the fact list's rule. That rule shows only in a view, and only in Register, since Night watch and Desk set `--line-edge: none`. So the fourteen earlier files draw the code at HEAD.

What matched: the new case read against its group. The fourth case already read a term's and a value's edge on an empty row, one line high, which a broken rule passes. The added lines are the only check in the file of a fact that runs past one line. The case asserts that such a fact is present, so it cannot pass on a short path.

What matched: the records read whole against the target. `changelog.md:6` and `:7` name the state colours the probe of round 2 and `git diff f41bd67 HEAD -- themes.css` show changed. That includes, in a light appearance, Night watch's waiting colour (`#8a6400` to `#846000`) and the working and failed colours of Desk and Register. The owner's quote at `pr.md:8` stands word for word in `frame/questions.md` row Q1. `frame/design.md:93`, *Contrast*, states the two exemptions in principle 9's words, so finding 1's fix reaches it. The one row of `gaps.md` the range changed is an item of *Not done* reworded in place, and no row of *Not verified* left. The suite stays labelled unverified in `gaps.md`, with the orchestrator named, and no commit of the range claims the broad gate. That label is honest.

What matched: the grounds a case leaves out, the closing memo's row for the proofer (`gaps.md:12`). "Side by side", while turned on, sets its words in `--ink-strong` on `--pressed` over the window (`index.html:296`, `:297`). That ground lasts, so it is inside the floor, and no list of `WORDS` names it. Executed: 12.23 to 14.45 to 1 in every block, so nothing ships under the floor. The diff did not change that rule (executed: `git diff a3e4e7a HEAD -- apps/desktop/src/renderer/index.html` names no line of it), so this gap is no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a disabled `select` is drawn at full strength in the built app. The page sets its words in `--ink-strong`, and the engine's own style for a disabled field was not read or probed. Finding 1's fix does not depend on it. | `apps/desktop/src/renderer/index.html:364`, `docs/design.md:433` | the orchestrator, if finding 1's fix is worded to cover a field |
| Whether GitHub draws the sixteen `../blob/<commit>/<path>?raw=true` images in the pull request, and after a squash merge. | `gaps.md` *Not verified* | the orchestrator, once the pull request is open |
| The whole suite, the typecheck and the `Broad gate` command. This round ran two test files narrowly, the built-app one alone. Contract rule 2 keeps the broad gate the orchestrator's. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate; then the sealer's spawn |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 pnpm run test test/theme-controls.test.ts`, alone, in `apps/desktop` of the clone, first run | 2 failed, 3 passed, exit 1. The third case waited for the light appearance after `Emulation.setEmulatedMedia` and timed out. The fourth then found Desk dark's corner (6px) where it expects light's (5px). `pmset -g log` showed the display turned off at 21:54:25, before this run started. `caffeinate -d` keeps an awake display from sleeping, but it does not wake one that is already off. The run's failure is the display's, not the code's. |
| `caffeinate -u -t 2`, then the same command | The display turned on at 21:55:55. 1 file passed, 5 cases, exit 0. `pgrep -fl` on the clone's path afterwards printed nothing. |
| The same command with `align-items: start` put back at `index.html:339` in the clone through the `Edit` tool, run once, and the line restored | 1 failed, 4 passed, exit 1, at `theme-controls.test.ts:200` on "Worktree": expected bottom 225.40, received 193.73. `git status --short` in the clone printed nothing after the restore. |
| `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts` | 1 file passed, 16 cases, exit 0 |
| `python3 -I test_tmp_lasting_and_disabled.py apps/desktop/src/renderer/themes.css`, written for this round in its scratch directory and run once | `--ink-strong` on `--pressed` over the window: 12.23 to 14.45. A quiet button's `--ink` on `--control` at 45% over the window: 2.54 (Register light) to 3.62 (Register dark), and over a card 2.60 to 3.50. The main button's `--on-main` on `--main` at 45% over a card: 2.61 (Desk light) to 4.27 (Night watch dark). Exit 0. |
| `python3 -I test_tmp_changed_values.py themes-0d65470.css apps/desktop/src/renderer/themes.css`, written for this round and run once, the first file from `git show 0d65470:apps/desktop/src/renderer/themes.css` | Desk dark: 5 values changed. Desk light: 7 values changed. Register dark: 19 changed. Register light: 22 changed. Each block adds 24 new properties and drops none. The lists are quoted under *Confirmations*. Exit 0. |
| `sips -c 110 400 --cropOffset 140 1030` and `sips -z 330 1200` on `register-dark-view.png` and `register-light-view.png`, written to the scratch directory | The fact list enlarged three times. One rule runs under "Worktree" and its three-line value, at one height, in both appearances. |
| For each of the sixteen links of `pr.md`: `git cat-file -e`, `git merge-base --is-ancestor`, and `git rev-parse` at the link and at HEAD | Every link: 0, 0, and the same blob |
