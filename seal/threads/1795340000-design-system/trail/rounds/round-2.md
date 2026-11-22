# Review round 2: 1795340000-design-system

```seal
target: bfb25f2, fixes f41bd67..bfb25f2
```

This is a verifying round. It answers the five findings round 1 closed, reviews the new units of the fix diff `f41bd67..bfb25f2` as code, and reads the work item's records whole at `bfb25f2`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` stands, because `Commit and pull request language` is English. No `seal/parity.json` is declared. The phase records `trail/phases/phase-1.md` to `phase-5.md` are unchanged since `f41bd67` (executed: `git diff --stat f41bd67..HEAD` names none of them), so round 1's reading of them is carried and not made again. The coordinates carried from round 1 are its probe `contrast.py`, run again here on the tree at `bfb25f2`, and the places of the states' words its finding 2 listed, each opened again. No verdict of round 1 was carried.

The code under review was cloned with `git clone --no-local` at `bfb25f2` into the round's scratch directory. The work tree of the branch holds only this record as a change.

## Findings

### 1. In Register the rule under a fact of a view breaks into two where the value runs past one line

```seal
severity: should
location: `apps/desktop/src/renderer/index.html:338`, `apps/desktop/src/renderer/index.html:339`, `apps/desktop/src/renderer/index.html:341`, `apps/desktop/test/theme-controls.test.ts:165`
evidence: read `apps/desktop/src/renderer/index.html:338-342`, `apps/desktop/test/theme-controls.test.ts:165-191`, `seal/threads/1795340000-design-system/screenshots/register-dark-view.png`, `seal/threads/1795340000-design-system/screenshots/register-light-view.png`; executed `sips -c 110 400 --cropOffset 140 1030` on both views, then `sips -z 330 1200`, and read the two enlarged crops
regression: round-1#1
```

Why it matters: the unit is the fact list of a view in `apps/desktop/src/renderer/index.html:338-342`, which `82ea412` changed. `frame/plan.md` *Judgments of the run*, the row on round 1, item (2), and `frame/design.md` *What each theme is*, the row on edges and rules, say that Register draws a rule under each row of a list of records, a view's facts among them. The fix put `--line-edge` on the term (`dt`) and on the value (`dd`) one by one. The grid still sets `align-items: start` (`index.html:339`), so each of the two boxes is only as high as its own text. Where a value runs past one line, the term's rule stands under the term's one line and the value's rule under the value's last line. The defect came from that: the edge was split over two boxes of different heights. The comment at `index.html:338` says "so the rule under a fact runs unbroken", and that does not hold.

The screenshots show it on every view. The Worktree fact of `register-dark-view.png` and `register-light-view.png` runs to three lines. Enlarged, the crop of the right column shows a rule under "Worktree" at the height of the value's first line. A second rule starts at the value's left edge, two lines lower. A path of the system's temporary folder makes the value long in the screenshots, but a real worktree's path at that column's width runs past one line too. So the fact a person reads first in a view is the one row whose rule is broken.

The case at `theme-controls.test.ts:165` puts an empty term and an empty value into the list and reads each `box-shadow` alone. Its two boxes are each one line high, so it passes on the broken rule. Night watch and Desk give `--line-edge: none` and draw nothing there, so the fix changes nothing they show.

```css
/* index.html:339. A term and a value are block boxes whose text starts at their top, so stretching them to the row's height moves no word. It assumes no other rule sets `align-self` on a `dt` or `dd` of this list, and none does. */
#view-fact-list { display: grid; grid-template-columns: calc(var(--fact-label) + 10px) minmax(0, 1fr); align-items: stretch; font-size: var(--size-second); }
```

The fix pass owes a case as well, since the snippet alone pins nothing. In the fourth case of `apps/desktop/test/theme-controls.test.ts`, with a work item's view open in Register, a check reads every term of `#view-fact-list` and the value after it. It holds that the two `getBoundingClientRect().bottom` values are equal, for a fact whose value runs past one line. It is seen red with `align-items: start` put back. The comment at `index.html:338` then holds as written. The Register views are made again for `pr.md`, since the fact's rule changes on them.

```seal
verdict: fixed 91b89f6
location: `seal/threads/1795340000-design-system/screenshots/register-dark-view.png`, `seal/threads/1795340000-design-system/screenshots/register-light-view.png`
answer: The paste-ready rule was applied as written, `align-items: stretch` on `#view-fact-list`, after reading it against the page: a term and a value are block boxes whose text starts at their top, and no rule of the page sets `align-self` on either. The comment over the rule now says each box is as high as the row. The fourth case of `apps/desktop/test/theme-controls.test.ts` opens Alpha's view in Register, holds that the value of "Worktree" runs to more than one line, and compares the bottom of each term with the bottom of its value. It was seen red before the rule, on "Worktree" with the term ending at 193.73 and the value at 225.40, and `seal mutate` put `align-items: start` back, red on the same line. Register's two screenshots of a work item were made again at `91b89f6` and are in `b6201b295b5d76b478063c3378bd3db66e4096a3`, paths this finding's location does not name; an enlarged crop of each shows one rule from the term to the value's end under the three lines of the worktree's folder. The other fourteen files stand as `e974e84` holds them, so `pr.md` links those two at the new commit, which is the orchestrator's edit.
```

### 2. The ninth principle's last sentence has more than one reading, and none of them is the exemption the case and the closing memo keep

```seal
severity: should
location: `docs/design.md:19`, `docs/design.ko.md:19`
evidence: read `docs/design.md:19`, `docs/design.ko.md:19`, `apps/desktop/test/themes.test.ts` (the comment over `WORDS`: "A ground under a press lasts as long as the press, and is in no list"), `seal/threads/1795340000-design-system/gaps.md` *Not done* (the row on `--pressed`); executed `python3 -I test_tmp_grounds.py apps/desktop/src/renderer/themes.css` (see *Probes*)
regression: round-1#4
```

Why it matters: `546dc8d` wrote principle 9 to close round 1's finding 4. Its last sentence is "A part that takes no press is held to no floor." The Korean edition says the same: "누를 수 없는 부분에는 이 기준을 적용하지 않습니다." The sentence has three readings, and an agent that reads the principle to judge the next change has to pick one:

- a disabled control, which `button:disabled` draws at 45% and WCAG exempts;
- every part a person does not press, such as a hint, a count, an age, the term of a fact or what a field asks for, which would exempt the very words finding 4 raised;
- a ground under a press, which is the exemption the build keeps.

The third reading is what the case and the memo keep. The comment over `WORDS` in `themes.test.ts` says "A ground under a press lasts as long as the press, and is in no list". `gaps.md` *Not done* says the floor "is not held on a ground under a press". The probe of this round measured the faint ink at 4.18 to 1 on a pressed item of the sidebar in Register and Desk dark, and at 4.32 to 4.53 in the other blocks. The principle as written does not exempt that ground. Its sentence before says "The ground is the one drawn there". So the code ships under a floor the ratified document sets, or the document says something its writer did not mean. A rule an agent reads and acts on has one reading (`skills/writing-style/SKILL.md`). The second reading would let a later change lower `--ink-faint` under a hint and cite principle 9.

The fix below states the two exemptions the build keeps and nothing more. Another fix would raise the dark faint inks until a pressed ground holds 4.5 too, and drop the exemption. Choosing between the two is the orchestrator's call. `frame/plan.md` *Judgments of the run*, the row on round 1, says nothing of a press.

```markdown
<!-- docs/design.md:19, the last sentence of principle 9 -->
A ground drawn only while a part is pressed, `--pressed`, `--control-pressed` and `--main-pressed`, is held to no floor, and neither is a disabled part, which takes no press.

<!-- docs/design.ko.md:19, the last sentence of principle 9 -->
누르는 동안에만 그려지는 바탕(`--pressed`, `--control-pressed`, `--main-pressed`)과, 꺼져서 누를 수 없는 부분에는 이 기준을 적용하지 않습니다.
```

No case reads the principle's words, so this sentence is pinned by nothing. The cases hold what the principle says, and the comment over `WORDS` already matches the new sentence.

```seal
verdict: fixed 98b594c
location: `seal/threads/1795340000-design-system/gaps.md`
answer: The last sentence of principle 9 is rewritten in both editions as `frame/plan.md` *Judgments of the run*, the row on round 2, decides: a ground drawn only while a part is pressed is outside the floors, since it lasts as long as the press and the part's words were read before it. The words are the fix pass's own in two places. The paste-ready sentence named `--pressed` as outside the floor, and `index.html:296` also draws `--pressed` under a button of the stage that stays turned on (`#side-by-side[aria-pressed="true"]`), a ground that lasts, so the sentence names the ground by when it is drawn and names no token. The disabled part has a sentence of its own, "A disabled part, drawn at 45% of its strength, is outside them too": the judgment row does not name it, and without it the principle would hold a disabled button's words, which `button:disabled` draws at 45%, to a floor the build does not keep. The row of `gaps.md` *Not done* on the press, a path this finding's location does not name, now cites the principle and the judgment row, names `--main-pressed` with the other two, and gives round 2's measure of 4.18 to 1. No case reads the principle's words. `frame/design.md:93`, *Contrast*, states the floors without either exemption, and its fold is the orchestrator's.
```

### 3. The pull request text and the changelog say every word and every theme meets the floor, and the closing memo lists where it does not

```seal
severity: should
location: `seal/threads/1795340000-design-system/pr.md:16`, `seal/threads/1795340000-design-system/changelog.md:7`
evidence: read `seal/threads/1795340000-design-system/pr.md:16`, `seal/threads/1795340000-design-system/changelog.md:7`, `seal/threads/1795340000-design-system/gaps.md` *Not done*, `docs/design.md:19`; executed `python3 -I test_tmp_grounds.py apps/desktop/src/renderer/themes.css` and `python3 -I contrast.py apps/desktop/src/renderer/themes.css` (see *Probes*)
regression: round-1#4
```

Why it matters: `pr.md:16` says "**Every theme meets WCAG AA**: text 4.5:1 against its ground, a state's mark and a focus ring 3:1, held by cases of the suite. The faint inks of every theme, Desk's among them, were raised to meet it." `changelog.md:7` says "Every word now stands at 4.5 to 1 or more against the ground it is drawn on, a selected line's and one under the pointer among them". Three rows of `gaps.md` *Not done* say otherwise:

- the faint ink under a press, measured by this round at 4.18 to 1 in Register and Desk dark;
- a menu's item under the keyboard, told apart by `--hover` alone at about 1.1 to 1, where WCAG 2.2's 1.4.11 asks 3 to 1 for the state of a control;
- the edges of a field and of a button, held to no floor.

WCAG AA is more than the floors `docs/design.md` principle 9 states, so "Every theme meets WCAG AA" claims more than the cases hold. The owner reads the pull request text as the account of what the release does. The sealer reads it against the tree.

The second sentence of `pr.md:16` is short too. The fix pass raised `--ink-muted` in every block, and the colours of a finished, a sleeping and a failed work item, beside the faint inks. Executed: `contrast.py` prints the muted inks `#a3a097`, `#53514d`, `#aea697` and `#564d43`, each changed from `f41bd67`.

```markdown
<!-- pr.md:16 -->
**Every word meets WCAG AA's contrast where it rests, under the pointer and on a selected line**: text 4.5:1 against its ground, and a state's mark and a focus ring 3:1, held by cases of the suite. The muted and faint inks of every theme, Desk's among them, and the colours of a finished, a sleeping and a failed work item were raised to meet it. Not held, and named in the work item's closing memo: a ground under a press, a menu's item under the keyboard, and the edges of a field and of a button.
```

```markdown
<!-- changelog.md:7, the second sentence -->
Every word now stands at 4.5 to 1 or more against the ground it is drawn on, where it rests, under the pointer and on a selected line, and a state's mark and the ring of the keyboard's focus at 3 to 1 or more.
```

Whichever reading finding 2's fix gives principle 9, these two sentences name the same exemptions it names.

```seal
verdict: fixed 7282b7c
answer: `changelog.md:7` now says where every word stands at 4.5 to 1, at rest, under the pointer and on a selected line, in the paste-ready words, and its heading says "where it rests". The item goes further than the paste-ready sentence, as the finding's own grounds ask: it says the muted and the faint ink of every theme were raised and the colours of the states with them (a finished and a sleeping work item's in every appearance, and in a light appearance a waiting, a working or a failed one's, read from `git diff f41bd67..HEAD` of `themes.css`), and it names the three things `gaps.md` *Not done* leaves: the ground drawn only while a part is pressed, outside the floor by principle 9, a menu's item under the keyboard, and the edges of a field and of a button. `changelog.md:6` said Desk's "two quieter inks" were made stronger and now names the colours of some states too. `pr.md:16` is not changed by this commit: it follows from the orchestrator.
```

### 4. The fold of round 1 lists fewer of Desk's and Register's changed values than the style sheet changed, and names the wrong finding for the raise

```seal
severity: should
location: `seal/threads/1795340000-design-system/frame/design.md:148`, `seal/threads/1795340000-design-system/frame/design.md:100`, `seal/threads/1795340000-design-system/frame/design.md:101`, `seal/threads/1795340000-design-system/frame/plan.md:83`
evidence: executed `git show 0d65470:apps/desktop/src/renderer/themes.css | grep -n -e '--state-' -e '--removed' -e '--ink-'` and `python3 -I contrast.py apps/desktop/src/renderer/themes.css` at `bfb25f2`; read `seal/threads/1795340000-design-system/frame/design.md:100`, `seal/threads/1795340000-design-system/frame/design.md:101`, `seal/threads/1795340000-design-system/frame/design.md:148`, `seal/threads/1795340000-design-system/frame/plan.md:83`, `seal/threads/1795340000-design-system/trail/rounds/round-1.md` (finding 4's close)
regression: round-1#4
```

Why it matters: *Scope* item 5 (`frame/design.md:148`) says "Desk's two blocks draw the window as it stands at `0d65470`, but for the mark of a wait and the inks raised to the contrast floor: `--ink-muted` and `--ink-faint` in both appearances, and in the light one `--state-failed`." The colon makes the list read as whole, and the target holds more. Executed against `0d65470`:

- Desk dark `--state-finished` was `#7d766a` and is `#a39b8c`;
- Desk dark `--state-no-agent` was `#756e63` and is `#9b9385`;
- Desk light `--state-finished` and `--state-no-agent` were `#857a6b` and are `#655c51`;
- Desk light `--state-working` was `#665c50` and is `#564d43`;
- `--removed` was `#a39b8d` and `#665c50` and is `#aea697` and `#564d43`.

The rows *Palette, dark* and *Palette, light* of *What each theme is* (`frame/design.md:100`, `:101`) say the same of Register and Desk: "with the muted and faint inks raised to …", and in the light one the failure's ochre. The same values changed in Register's blocks. The sealer reads *Scope* against the tree and finds blocks that the frame says stand as they stood.

`frame/plan.md:83` says "The fix pass's broader raise of `--ink-muted` (and `--ink-faint`) in every block and its three page rules are accepted as the answer to finding 1". Round 1's finding 1 is Register's rule under a commit and a file. The raise and the three rules close finding 4 (`round-1.md`, finding 4's close: "Three departures from the finding's proposal"). A reader who opens finding 1 to see what was accepted finds another subject.

The fold's sentences state what the work does, so they are read against the target (`skills/implement/SKILL.md` *Document layout — two roots, three lifetimes*). That is the fold's file and the orchestrator's to correct.

```markdown
<!-- frame/design.md:148, Scope item 5, the last sentence -->
Desk's two blocks draw the window as it stands at `0d65470`, but for the mark of a wait and the colours raised to the contrast floor: `--ink-muted`, `--ink-faint`, `--state-finished`, `--state-no-agent` and `--removed` in both appearances, and in the light one `--state-working` and `--state-failed`.

<!-- frame/design.md:100, the cells of Register and Desk in "Palette, dark": after "raised to `#aea697` and `#9b9385`" -->
, and the words of a finished and a sleeping work item to `#a39b8c` and `#9b9385`, and `--removed` with the muted ink

<!-- frame/design.md:101, the cells of Register and Desk in "Palette, light": after "the failure's ochre to `#8f550b`" -->
, the words of a finished and a sleeping work item to `#655c51`, and the working mark and `--removed` with the muted ink

<!-- frame/plan.md:83, the second sentence -->
The fix pass's broader raise of `--ink-muted` (and `--ink-faint`) in every block, with the colours of a state that equal them, and its three page rules are accepted as the answer to finding 4, and round 2 reads them
```

The *Removes* row on the blocks `night-desk` and `letter` cites *Scope* item 5 and needs no change of its own.

```seal
verdict: fixed fbd4f5b
answer: The four paste-ready edits were applied in the frame's words, read against `git diff 0d65470 HEAD -- apps/desktop/src/renderer/themes.css`, whose changes to Desk's blocks are exactly the values the finding lists and no others. `frame/design.md:148` (*Scope* 5) names `--ink-muted`, `--ink-faint`, `--state-finished`, `--state-no-agent` and `--removed` in both appearances, and in the light one `--state-working` and `--state-failed`. `frame/design.md:100` and `:101` (the Register and Desk cells of the Palette rows) name the finished and sleeping words and `--removed`, and in the light row the working mark. `frame/plan.md:83` names finding 4 and the colours of a state that equal the inks. The fold also rewrote `frame/design.md:93` (*Contrast*) to state principle 9's two exemptions, a ground drawn only while a part is pressed and a disabled part drawn at 45%, and `frame/plan.md:84` names the disabled part, which the fix pass added and the orchestrator accepts. A row of `frame/plan.md` *Judgments of the run* names this fold.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: a commit and a changed file carry `--line-edge` (`apps/desktop/src/renderer/index.html:169`, `.commit, .file { box-shadow: var(--line-edge); }`). Register draws a rule under each of them in the preview and in a view's right column, and Night watch and Desk draw none. The sidebar's items carry none. Read on all eight inbox and view screenshots. Executed: `OWLERY_BACKGROUND=1 pnpm run test test/theme-controls.test.ts`, alone, passed 5 cases. Its fourth case reads the edge of a commit, a file, a term and a value in Desk and in Register, and an item of the sidebar in Register. `docs/design.md:431` and `docs/design.ko.md:431` add the row "A row of a list of records". `gaps.md` *Not done* no longer holds the row, as the finding asked. The facts of a view are finding 1 of this round, which is why the same finding is named twice.

```seal
confirms: round-1#2
```
What holds: every place that turns the state `waiting` into words says "Needs you", and the plural follows the count. The class was rebuilt from what produces the words: `git grep` for each literal of the states' words over `apps/desktop/src/renderer`, `src/main` and `src/shared`. It found one source each: `stateHeading` (`view.ts:120`), `needsYou` (`view.ts:100`), `STATE_IN_CHANGE` (`view.ts:525`), `bellSays` (`view.ts:572`) and the hint (`view.ts:597`). The places built on `stateHeading` are `stateWithAge`, `filterChoices`, `notificationFor`, and the spoken name of a mark (`shared.ts:222`). The cases, each opened, are `view.test.ts:251` and `:255` for the inbox's sentence with "2 need you", `:270` and `:273` for the heading, `:285` and `:301` for a group's head, `:885`, `:962` and `:1972` for the summary, `:902` for a change's sentence, `:1957` for the hint, `:1986` to `:1991` for the bell's words, `:1290` for a notification's body, `:1920` for the filter's choices, and `:2422` and `:2428` for the state with its age. The bell's title and accessible name are read in the built app by `notification-click.test.ts:151` and `:154`. Executed: `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts test/view.test.ts` passed, 2 files, 399 cases, and `OWLERY_BACKGROUND=1 pnpm run test test/notification-click.test.ts`, alone, passed 3 cases. All sixteen screenshots show "1 needs you, 1 working, 1 finished" over the group headed "Needs you". "No agent is running." and the status line's "no agent" stay, as `frame/plan.md` *Judgments of the run* decides. The spoken name of a mark has no case of its own. It is the pinned `stateHeading` with a clause after it, so this is no gap a case leaves.

```seal
confirms: round-1#3
```
What holds: `.primary:focus-visible { outline-offset: 2px; }` (`index.html:82`) outranks `button:focus-visible` (0,2,0 against 0,1,1), so the main button's ring stands outside its fill. Executed with round 1's `contrast.py` at `bfb25f2`: `--focus` stands at 8.25 to 16.70 against `--ground` and 9.15 to 18.04 against `--ground-raised`, in every block. The ring of a tab on the terminal's ground is `--terminal-strong` (`index.html:313`), which `themes.test.ts` holds at 3 to 1. The closing memo's row for the proofer was read: the main button outside a dialog is not clipped within 4px. `#summary-foot` (`index.html:234`) is 60px high with the button centred, inside `#summary-screen`'s 36px side padding. `.preview-foot` (`index.html:279`) has 8px and 28px of padding and lies outside the scrolling `.preview-body`. `#close-pane-dialog .row` stands inside a dialog with 20px of padding. Read, not seen: no screenshot puts the focus on a main button. The fix pass's probe that saw it in the New work item dialog is its own claim.

```seal
confirms: round-1#4
```
What holds: every ink that sets words stands at 4.5 to 1 or more against the four grounds of every block. Executed: `contrast.py` at `bfb25f2` gives a lowest of 4.56 (`--state-failed` and `--added` on Register and Desk light's sidebar), and `--ink-faint` 4.95 to 5.84. Round 1 measured 3.05 to 3.87. The case "sets every word at 4.5 to 1 or more" of `themes.test.ts` passed in the run above. The three rules of the page's style the fix pass added are each in the style and each held by that case. They are an age and a count on a selected ground in `--ink-muted` (`index.html:258`), the letters a search matched in `--ink-strong` (`index.html:94`), and the close mark of a tab on the terminal's ground in `--terminal-ink` (`index.html:311`). `docs/design.md` *Components and their states* states all three. Night watch light's failure has `--shape-failed`, the triangle's line, in `#846000` at 5.01 against the ground. Night watch light's two screenshots of a view show it apart from the ground, and `docs/design.md` and `frame/design.md` *What each theme is* both state it. The muted ink raised in every block keeps its order over the faint one. Findings 2, 3 and 4 of this round are about what the documents say of the raise, not about the values.

```seal
confirms: round-1#5
```
What holds: `pr.md` shows sixteen images, one for each file *Scope* item 9 names, each linked at `e974e843d0ea2567f5f79bd82229d68cf3b562af`. Executed: `git cat-file -e e974e843d0ea2567f5f79bd82229d68cf3b562af:<path>` exited 0 for each of the sixteen paths. `git merge-base --is-ancestor e974e84 HEAD` exited 0. `git diff --quiet e974e84 HEAD -- seal/threads/1795340000-design-system/screenshots` exited 0, so the files at HEAD are the linked ones. `git diff e974e84 HEAD -- apps/` changes one comment of `themes.css`, so the images draw the code at HEAD.

What matched: the sixteen screenshots, each opened as an image and read against `docs/design.md`. Night watch draws its black and bone grounds, with the yellow on the waiting mark and its words, the edge of what the agent asks, and the failure. The light appearance's failure triangle now carries its darker line. Register draws square corners, the strong rule at the left of the selected line and item, a rule under each line of the inbox and under each commit and file, ruled group heads, and mono ages. Desk draws the earlier looks with the raised inks. The selected item of the sidebar shows its age in the muted ink. The tab in front on the terminal's ground shows its close mark in the terminal's ink in both Night watch appearances. The menu and the dialog read as *Components and their states* gives them. What does not read as the document says is this round's finding 1.

What matched: the lists `WORDS`, `AROUND_A_MARK` and `AROUND_THE_RING` of `themes.test.ts`, read against each rule of `index.html` that sets a `background` or a `color` (executed: `grep -n -e background -e 'color:' -e '--state:'` over the page). This is the closing memo's row for the proofer. One ground is missing. The words of a quiet button, in `--ink`, stand on `--control` over the window, a card and the right column, and no list names those grounds. The probe of this round measured them at 7.95 to 14.95 in every block, so nothing ships under the floor. The case's name, "against each ground it stands on", claims more than its lists hold (`apps/desktop/test/themes.test.ts`, `WORDS`). The diff changed neither `--control` nor a button's words, so this is no finding.

What matched: the new cases read against their groups. `bellSays` in `view.test.ts` covers the plural and the empty bell, which no other case of the summary's words holds. The built-app case of `notification-click.test.ts` holds the wiring of the title and the accessible name, which the unit case cannot. The three cases of "what a theme draws can be seen" in `themes.test.ts` hold facts *What every theme shares*, *Contrast*, states, and none repeats another case of the file. The extension of the fourth case of `theme-controls.test.ts` is finding 1's coordinate.

What matched: the implementer's account, read as a claim. The fix pass claims each new case was seen red and that `seal mutate` killed each mutant. This round did not run those. Read: each case's assertions fail against `f41bd67`'s values or text, as `git diff f41bd67..HEAD` of `themes.css`, `view.ts` and `sidebar.ts` shows. Two items left `gaps.md` *Not done* without the word `closed`: the rows on the commits' and files' rules and on "waiting for you". Round 1's findings 1 and 2 asked for exactly that, and they are items of *Not done*, not rows of *Not verified*. One row of *Not verified* is marked `closed` and kept. The suite stays labelled unverified in `gaps.md`, with the orchestrator named, and no commit of the fix range claims the broad gate. That label is honest.

What matched: `frame/questions.md` and `routing.md` are unchanged since round 1. The owner's quote in `pr.md` stands word for word in `frame/questions.md` row Q1. The other sentences of `frame/design.md` the fold changed were read against the target and hold: *The words*, *Scope* item 8, the Night watch inks in *What each theme is*, the edged triangle, *Contrast* in *What every theme shares*, and *Removes*. The exceptions are finding 4's.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a ground under a press is held to no floor, as the build keeps it, or the dark faint inks are raised until it holds. Finding 2 gives a sentence for the first choice. | `docs/design.md:19`, `frame/plan.md` *Judgments of the run* | the orchestrator |
| A menu's item under the keyboard, told apart at about 1.1 to 1, which `docs/design.md` states as the form of a menu. Whether that form stands against principle 9 and WCAG 2.2's 1.4.11 is a decision of the policy, not a defect of this diff. | `docs/design.md` *Components and their states*, the row of a menu; `gaps.md` *Not done* | the orchestrator |
| The Korean edition's wording beyond principle 9 and the rows this round compared. | `docs/design.ko.md` | the sealer |
| Whether GitHub draws the sixteen `../blob/<commit>/<path>?raw=true` images in the pull request, and after a squash merge. | `gaps.md` *Not verified* | the orchestrator, once the pull request is open |
| The whole suite, the typecheck and the `Broad gate` command. This round ran four test files narrowly, the built-app ones one at a time. Contract rule 2 keeps the broad gate the orchestrator's. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate; then the sealer's spawn |

## Probes

| Command | Result |
|---|---|
| `python3 -I contrast.py apps/desktop/src/renderer/themes.css`, round 1's script from its scratch directory, on the clone at `bfb25f2` | Every ink against `--ground`, `--ground-side`, `--ground-column` and `--ground-raised` is 4.56 or more in every block. `--ink-faint` is 4.95 to 5.84. `--focus` against `--ground` is 8.25 to 16.70. `--focus` against `--main` is still 1.00 in Night watch, which the outside ring makes harmless. Exit 0. |
| `python3 -I test_tmp_grounds.py apps/desktop/src/renderer/themes.css`, written for this round in its scratch directory and run once | `--ink` on `--control` over the window, a card and the right column, and on `--control-hover` over a card: 7.95 to 14.95. `--ink-faint` on `--pressed` over the sidebar: 4.18 (Register and Desk dark), 4.32 (Night watch light), 4.37 (Register and Desk light), 4.53 (Night watch dark); over the window 4.71 to 4.91. `--ink-faint` on `--hover` over a card: 4.56 to 5.55. Exit 0. |
| `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts test/view.test.ts`, in `apps/desktop` of the clone | 2 files passed, 399 cases, exit 0 |
| `OWLERY_BACKGROUND=1 pnpm run test test/theme-controls.test.ts`, alone | 1 file passed, 5 cases, exit 0 |
| `OWLERY_BACKGROUND=1 pnpm run test test/notification-click.test.ts`, alone | 1 file passed, 3 cases, exit 0; `pgrep -fl` on the clone's path afterwards printed nothing |
| `sips -c 110 400 --cropOffset 140 1030` and `sips -z 330 1200` on `register-dark-view.png` and `register-light-view.png`, written to the scratch directory | The fact list enlarged three times: the rule under "Worktree" stands under the value's first line, and the value's rule two lines lower, starting at the value's left edge |
