# Review round 1: 1795340000-design-system

```seal
target: f41bd67 against release/v0.0.2
```

The range is `a3e4e7a..f41bd67`, where `a3e4e7a` is the merge base with `origin/release/v0.0.2`. The base branch now stands at `cbb2e69`, one commit past the merge base, which changes `docs/architecture.md`, `docs/architecture.ko.md` and another work item's directory. Executed: `git merge-tree --write-tree HEAD origin/release/v0.0.2` exited 0, so a merge meets no conflict, in `docs/` or elsewhere. This is round 1, so no earlier round's coordinates were carried. The reads of the records were made whole at `f41bd67`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md` to `phase-5.md`. No `pr.<lang>.md` stands, because `Commit and pull request language` is English. No `seal/parity.json` is declared.

The orchestrator decided three items the phase 5 crafter raised, and findings 1, 2 and 3 carry them so the fix pass builds them. The grounds below are this round's own reading of the code, not the decision alone.

## Findings

### 1. Register draws no rule under the rows of a view's commits and changed files

```seal
severity: must
location: `apps/desktop/src/renderer/index.html:152`, `apps/desktop/src/renderer/index.html:163`, `apps/desktop/src/renderer/index.html:247`, `docs/design.md:47`, `docs/design.md:66`, `docs/design.md:427`, `docs/design.ko.md:66`, `docs/design.ko.md:427`, `apps/desktop/test/theme-controls.test.ts:159`, `seal/threads/1795340000-design-system/gaps.md:30`
evidence: read `docs/design.md:47`, `apps/desktop/src/renderer/index.html:152`, `apps/desktop/src/renderer/index.html:163`, `apps/desktop/src/renderer/index.html:247`, `apps/desktop/src/renderer/themes.css:287`, `seal/threads/1795340000-design-system/screenshots/register-light-view.png`, `seal/threads/1795340000-design-system/screenshots/register-dark-inbox.png`
```

Why it matters: `docs/design.md:47` gives Register "A rule under each line and each row of a list". The page reads `--line-edge` on `.line` alone (`index.html:247`). The rule `.commit` at `index.html:152` and the rule `.file` at `index.html:163` set no edge, so the commits and the changed files in the preview and in a view's right column stand on bare ground in Register. The screenshots `register-light-view.png`, `register-dark-view.png` and both Register inboxes show it: the inbox's lines carry the rule, and the four rows under *Commits* and *Changes* carry none. The phase 5 record names the gap and `gaps.md:30` keeps it as not done. The orchestrator decided that Register draws the rule on those rows.

The class was enumerated from the page's style, by taking each rule that lays out a row of a list in `index.html`. The rows are `.line` (it reads `--line-edge`), `.commit` and `.file` (they read nothing, which is this finding), `#summary-lines button` at `index.html:226` and `#headless li` at `index.html:347` (they draw `--rule-soft` under each row in every theme already), the sidebar's item of a work item (phase 1 decided it takes no rule in Register), and the fact list `#view-fact-list` (a list of terms, not of rows). The sidebar's item and the fact list are not covered by the orchestrator's decision, and they stand in *Not judged*.

`--line-edge` is a whole shadow drawn under the box (`themes.css:287`, `0 1px 0 var(--rule-soft)`), and `none` in Night watch and Desk. A commit's row and a file's row can read it as they are, so no new token is needed. Desk and Night watch then draw what they draw now.

```css
/* index.html, after the rule `.commit { … }` at line 152 and the rule `.file { … }` at line 163 */
/* A row of a list carries the edge the theme gives a line: a rule under it in Register, nothing in the others. */
.commit, .file { box-shadow: var(--line-edge); }
```

The fix pass owes the other statements of the fact as well. `docs/design.md:66` (the line that says what `--line-edge*` is for) becomes "the edges of a line of the inbox at rest and selected, and the edge under a row of a list, a commit and a changed file". *Components and their states* gains a row after `docs/design.md:427`, "A row of a list (a commit, a changed file) | No ground, with `--line-edge`. | — | — | — | — | —". The same two changes go into `docs/design.ko.md` at the same lines, so the two editions keep the same count of table rows that the `Broad gate` command compares. The fourth case of `apps/desktop/test/theme-controls.test.ts` (the `forms` reader at line 159) reads the shadow of a commit's row and of a file's row in Register and in Desk, and is seen red with the new rule removed. `gaps.md:30` leaves *Not done*. The screenshots are made again at the fix's commit, because the view changes.

```seal
verdict: fixed 82ea412
answer: The paste-ready rule was applied as written, `.commit, .file { box-shadow: var(--line-edge); }`, and the fix went one list further, as `frame/plan.md` *Judgments of the run* decides for round 1: a fact of a view carries the edge too, on its term and its value, with the space between the two moved into the term so the rule runs unbroken. The sidebar's items carry none. `docs/design.md` and `docs/design.ko.md` say which rows are ruled in *The themes*, in the line on `--line-edge*` and in a new row of *Components and their states*. The fourth case of `apps/desktop/test/theme-controls.test.ts` reads the edge of a commit, a changed file, a term and a value in Desk and in Register, and an item of the sidebar in Register; it was seen red before the rule, on "expected 'none' to match /0px 1px 0px 0px$/", and `seal mutate` removed each row's rule in turn and put the line's edge on a sidebar's item, four mutants, each red. The row left `gaps.md` *Not done*. The screenshots made after the fixes are in `e974e84`.
```

### 2. The inbox's head, the summary and the bell say "waiting for you" where the window names the state "Needs you"

```seal
severity: must
location: `apps/desktop/src/renderer/view.ts:100`, `apps/desktop/src/renderer/view.ts:104`, `apps/desktop/src/renderer/view.ts:520`, `apps/desktop/src/renderer/view.ts:587`, `apps/desktop/src/renderer/sidebar.ts:144`, `apps/desktop/test/view.test.ts:250`, `apps/desktop/test/view.test.ts:254`, `apps/desktop/test/view.test.ts:884`, `apps/desktop/test/view.test.ts:961`, `apps/desktop/test/view.test.ts:1971`, `docs/design.md:449`, `seal/threads/1795340000-design-system/frame/design.md:120`, `seal/threads/1795340000-design-system/gaps.md:31`, `seal/threads/1795340000-design-system/changelog.md:9`
evidence: executed `git grep -n -i -e 'waiting for you' -e 'no agent' -- apps/desktop/src apps/desktop/test docs` and `grep -rn -i 'wait'` over the modules and the page of `apps/desktop/src/renderer`, kept to string literals; read `apps/desktop/src/renderer/view.ts:100`, `apps/desktop/src/renderer/view.ts:520`, `apps/desktop/src/renderer/view.ts:587`, `apps/desktop/src/renderer/sidebar.ts:144`, `seal/threads/1795340000-design-system/screenshots/night-watch-dark-inbox.png`
```

Why it matters: `docs/design.md:449` says "A state is two words at most. The four states are "Needs you", "Working", "Finished" and "Asleep"". Every screenshot's inbox shows "1 waiting for you, 1 working, 1 finished" over a group headed "Needs you". One screen gives the state two names. The phase 5 record and `gaps.md:31` name it. They keep the sentence because `frame/design.md` *The words* changes two texts. The orchestrator decided that the two-word rule meant the state's words and not two strings. So "Needs you" is the window's name for the state everywhere it names it.

The class was built from what produces the words: every place in `apps/desktop/src/renderer` that turns the state `waiting` into text a person reads. A search for the spelling was joined to it.

- `view.ts:100`, `STATE_IN_SENTENCE.waiting` is "waiting for you". It feeds `inboxSummary` (the inbox's head), `summarySentence` and `summaryHead` (the summary's head). Its doc comment at `view.ts:104` quotes "1 waiting for you, 2 working".
- `view.ts:520`, `STATE_IN_CHANGE.waiting` is "Waits for you.", the sentence of a change in the summary.
- `view.ts:587`, the hint "Enter opens the first that waits."
- `sidebar.ts:144`, the bell's title and accessible name: "N waiting for you. Show them alone." and "Show the work items that wait for you alone."
- Already right: `stateHeading` at `view.ts:117`, `stateWithAge`, `notificationFor` at `view.ts:1425`, and the "asks" of `stateSays` at `view.ts:659`. The last says what the agent does, not the state's name.

The fix keeps the count's agreement, so one work item "needs you" and two "need you".

```ts
// view.ts:99-100
/** Each agent state as the inbox's sentence says it, after its count: the state's own words, "Needs you", agreeing with the count. */
const STATE_IN_SENTENCE: Record<AgentState, (count: number) => string> = { waiting: (count) => (count === 1 ? "needs you" : "need you"), working: () => "working", finished: () => "finished" };
// view.ts:104, in the doc comment: "1 needs you, 2 working"
// view.ts:110
    .map(({ state, count }) => `${count} ${STATE_IN_SENTENCE[state](count)}`)
// view.ts:520
const STATE_IN_CHANGE: Record<AgentState, string> = { waiting: "Needs you.", working: "Is working.", finished: "Finished." };
// view.ts:587
  return { main: { label: "Answer the first question", opens: waits.workItem.id }, second: inbox, hint: "Enter opens the first that needs you." };
// sidebar.ts:144
  bell.title = waiting > 0 ? `${waiting} ${waiting === 1 ? "needs" : "need"} you. Show them alone.` : "Show the work items that need you alone.";
```

The fix pass owes these statements too. The cases at `view.test.ts:250`, `:254`, `:884`, `:961` and `:1971`, and the case of the change's sentence, take the new words, and each is seen red against the old one. One case pins the plural "2 need you". The bell's title has no case in the suite (executed: `grep -n bell apps/desktop/test/*.ts` finds two lines, in `daemon.test.ts` and `work-item-menu.test.ts`, and neither reads the title), so one is added where the sidebar's other built-app cases stand. `frame/design.md:120` *The words* gains rows for the inbox's sentence, the summary's sentences, the change's sentence, the hint and the bell, and the sentence "Two texts change" is corrected. That is the orchestrator's fold, since the crafter does not write the frame. `changelog.md:9` names the inbox's head and the bell among the places that now say "Needs you". `gaps.md:31` leaves *Not done*. The screenshots are made again, because the inbox's head changes.

```seal
verdict: fixed 8d7f33f
location: `apps/desktop/test/notification-click.test.ts`
answer: The words are the paste-ready ones, and the code is the fix pass's own: one function, `needsYou`, gives "needs you" or "need you" by the count to `STATE_IN_SENTENCE` and to a new exported `bellSays`, which the sidebar calls for the bell's title and its accessible name, so the bell's words have unit cases. `STATE_IN_CHANGE.waiting` is "Needs you." and the hint is "Enter opens the first that needs you." "No agent is running." and the status line's count stay. The cases at the lines the finding names took the new words and were seen red against the old ones, 11 of 383 failing; the plural stands in "2 need you, 1 working" and in the case of `bellSays`. A new case of `apps/desktop/test/notification-click.test.ts`, a path the finding does not name, reads the bell's title, its `aria-label` and its count in the built app with no work item waiting and with one; it was seen red against the old source on the old sentence. `seal mutate` broke each wording and the bell's wiring, seven mutants, each red. `docs/design.md` and `docs/design.ko.md` *The voice of the window's words* say the words follow a count, `changelog.md` names the places, and the row left `gaps.md` *Not done*. `frame/design.md` *The words* still says "Two texts change": the fold is the orchestrator's.
```

### 3. The keyboard's focus ring cannot be seen on the main button, in every theme

```seal
severity: must
location: `apps/desktop/src/renderer/index.html:75`, `apps/desktop/src/renderer/index.html:79`, `apps/desktop/src/renderer/themes.css:73`, `apps/desktop/src/renderer/themes.css:191`, `docs/design.md:424`, `docs/design.ko.md:424`, `seal/threads/1795340000-design-system/gaps.md:9`
evidence: executed `python3 -I contrast.py apps/desktop/src/renderer/themes.css` (the round's scratch directory, see *Probes*); read `apps/desktop/src/renderer/index.html:75`, `apps/desktop/src/renderer/index.html:79`, `apps/desktop/src/renderer/themes.css:67`, `apps/desktop/src/renderer/themes.css:73`, `apps/desktop/src/renderer/themes.css:186`, `apps/desktop/src/renderer/themes.css:191`
```

Why it matters: `index.html:75` draws the ring as `outline: 2px solid var(--focus); outline-offset: -2px`, which puts it inside the button's edge. `index.html:79` fills `.primary` with `--main`. In Night watch `--focus` and `--main` are the same colour in both appearances: `#f3efe6` at `themes.css:67` and `:73`, and `#0f0f10` at `:186` and `:191`. So the ring is drawn in the fill's own colour inside the fill, a contrast of 1.00. A person who moves with the keyboard cannot see that the main button of a dialog, or "Open the work item", has the focus. `gaps.md:9` asks the proofer exactly this.

The class is wider than Night watch. The same probe measured `--focus` against `--main` in every block: Register dark 1.37, Register light 1.81, Desk dark 1.37, Desk light 1.43. Each is under the 3 to 1 that a mark a person must see needs (WCAG 2.2, 1.4.11). Desk's is the window as it stood at the merge base, and it is the same defect. The orchestrator decided that a focus ring must be visible on every control in every theme. The probe found the ring clear on every other control: against `--control` over `--ground-raised` it measures 7.80 to 18.04, and the icon buttons and fields stand on the ground.

A ring drawn outside the main button stands on the ground around it. Against `--ground` the probe measured 8.25 to 16.70, and against `--ground-raised` (a dialog) 9.15 to 18.04. That holds in every block with no change of value, and it leaves the signal colour alone, as `docs/design.md:13` asks.

```css
/* index.html, after the rule `.primary { … }` at line 79. Assumes the main button is never clipped by an ancestor with `overflow: hidden` within 4px of its edge: it stands in a dialog's foot and in a list's foot, each with padding. */
/* The main button is filled, so its ring stands outside its edge, on the ground around it, where the fill cannot hide it. */
.primary:focus-visible { outline-offset: 2px; }
```

The fix pass owes these statements as well. `docs/design.md:424` and `docs/design.ko.md:424` say "A ring of 2px in `--focus`, 2px outside its edge". A case of `apps/desktop/test/themes.test.ts` holds, for every block, that `--focus` against `--ground` and against `--ground-raised` is at least 3 to 1, and that the page's style gives `.primary:focus-visible` an `outline-offset` that is not negative. It is seen red with the new rule removed. `gaps.md:9` is marked `closed` with the fix's coordinate. A screenshot with the focus on a main button would show it, but the run puts the focus on the form's field, so no file shows it.

```seal
verdict: fixed 546dc8d
location: `apps/desktop/test/themes.test.ts`
answer: The paste-ready rule was applied as written, `.primary:focus-visible { outline-offset: 2px; }`. The class held one more instance, which the fix pass found by listing every ground a control with a ring stands on: a tab of a pane on the stage stands on `--terminal-ground`, dark in both appearances, where `--focus` measured 1.00 in Night watch light and 1.77 in Register and Desk light, so `#tabs .tab.shown button:focus-visible` now draws the ring in `--terminal-strong`. The case "draws the ring of the keyboard's focus at 3 to 1 or more" of `apps/desktop/test/themes.test.ts`, a path the finding's location does not name, holds that every ring of the page's style is in `--focus` or `--terminal-strong`, each at 3 to 1 against every ground around it in every block, and that the main button's offset is above zero. It was seen red before the rules, and `seal mutate` turned the offset negative, the tab's ring to `--focus`, the ring's token to another and `--focus` to a card's colour, each red. `docs/design.md` and `docs/design.ko.md` state both forms in *Components and their states*. A probe run once in the built app at `e974e84` took the focus to "Create" with the Tab key, and its capture shows the ring apart from the fill in Night watch dark and light; `gaps.md` *Not verified* marks the earlier row closed and keeps one row for the main buttons outside a dialog, read and not seen. Not done, and in `gaps.md` *Not done*: a menu's item under the keyboard is drawn by `--hover` alone, with no ring, as the document states for a menu.
```

### 4. The faint ink and the words of a finished or sleeping work item fall under the contrast body text needs, in all six blocks, and no rule of the design system states a floor

```seal
severity: should
location: `apps/desktop/src/renderer/themes.css:46`, `apps/desktop/src/renderer/themes.css:82`, `apps/desktop/src/renderer/themes.css:83`, `apps/desktop/src/renderer/themes.css:168`, `apps/desktop/src/renderer/themes.css:199`, `apps/desktop/src/renderer/themes.css:278`, `apps/desktop/src/renderer/themes.css:309`, `apps/desktop/src/renderer/themes.css:388`, `apps/desktop/src/renderer/themes.css:419`, `apps/desktop/src/renderer/themes.css:498`, `apps/desktop/src/renderer/themes.css:608`, `docs/design.md:13`, `docs/design.md:156`, `docs/design.md:251`, `docs/design.md:346`, `docs/design.ko.md:13`
evidence: executed `python3 -I contrast.py apps/desktop/src/renderer/themes.css` (see *Probes*); executed `git grep -n -i -e contrast -e WCAG -- docs`, which found no rule; read `apps/desktop/src/renderer/index.html:87`, `apps/desktop/src/renderer/index.html:95`, `apps/desktop/src/renderer/index.html:160`, `apps/desktop/src/renderer/index.html:333`, `apps/desktop/src/renderer/index.html:358`
```

Why it matters: `--ink-faint` sets text a person reads and acts on. That text is a hint (`index.html:87`), every count and age (`index.html:95`), a commit's hash and a line count (`index.html:160`), the labels of a view's facts (`index.html:333`) and what a field asks for (`index.html:358`), at 11px and 12px. Its contrast with the ground it stands on is 3.49 and 3.29 in Night watch dark, 3.34 and 3.05 in Night watch light, 3.44 and 3.10 in Register and Desk dark, and 3.48 and 3.17 in Register and Desk light (ground, sidebar). WCAG AA asks 4.5 to 1 for text of that size. `--state-finished` and `--state-no-agent` colour the words "Finished" and "Asleep" beside the mark (`.state-words`) and measure 3.05 to 3.86. `docs/design.md:13` and its principle 4 make the words one of a state's three sayings, so words a person struggles to read weaken the rule this PR states. Night watch's and Register's values are new in this PR. Desk's are the window as it stood, which `frame/design.md` *Scope* item 5 keeps.

It is `should` and not `must`: no ratified document states a contrast floor (the search found none), so the code breaks no written rule. The release would still ship text a person cannot read well in every theme, and `docs/design.md` gives the next change no floor to be held against.

```markdown
<!-- docs/design.md, a ninth principle after line 18, and the same in docs/design.ko.md -->
9. **Words can be read.** A token that sets words stands at 4.5 to 1 or more against each ground it is drawn on, and a mark, a rule a person must see and the focus ring at 3 to 1 or more. A value that falls under it changes, in every theme.
```

The values follow from that principle, and the source of a value is `docs/design.md` (`docs/design.md:156`, `:251` and `:346`, with `docs/design.ko.md` and `themes.css` in the same commit). Night watch dark `--ink-faint` near `#85827b` (about 4.6 on `--ground-side`). Night watch light near `#6e6b64`. Register and Desk dark near `#8c8477`. Register and Desk light near `#6f6556`. `--state-finished` and `--state-no-agent` follow the same steps. Each value is to be measured, not taken from this line. A case of `apps/desktop/test/themes.test.ts` holds the floor for the text tokens in every block. Changing Desk's values departs from *Scope* item 5's "Desk's two blocks draw the window as it stands". So the orchestrator either folds that departure into the frame, or keeps Desk as it stood and states the exception in the principle.

```seal
verdict: fixed 546dc8d
location: `apps/desktop/src/renderer/index.html`, `apps/desktop/test/themes.test.ts`
answer: The principle is the ninth of `docs/design.md` and `docs/design.ko.md`, in the fix pass's own words: the paste-ready one named a rule a person must see, which `frame/plan.md` *Judgments of the run* does not hold, and that row decides that Desk's values are raised too. Two cases of `apps/desktop/test/themes.test.ts` compute WCAG 2's ratio for every block: each token the page's style sets words in against each ground its words stand on at 4.5 to 1, a ground under the pointer and a selected one among them, and each state's mark at 3 to 1. Both were seen red on the values as they stood, and `seal mutate` put six values back, each red. Values raised in all six blocks, in the documents and the style sheet together, each measured: `--ink-faint` to `#908e87` and `#62605c` in Night watch and `#9b9385` and `#655c51` in Register and Desk, `--state-finished` and `--state-no-agent` with it, `--state-failed` to `#846000` in Night watch light, with `--state-waiting`, and to `#8f550b` in Register and Desk light. Three departures from the finding's proposal, each the fix pass's judgment. First, `--ink-muted` is raised too, to `#a3a097`, `#53514d`, `#aea697` and `#564d43`, with `--removed` and the light `--state-working` that equal it: it fell under 4.5 on a selected item of the sidebar in three blocks, and a faint ink raised to the floor stood within 1.1 of it, so it keeps a step of 1.25 over the faint one. Second, three rules of the page's style, a path the finding's location does not name: an age and a count on a selected ground take the muted ink, the letters a search matched take the strong one, and the close mark of a tab on the terminal's ground takes the terminal's ink. Third, Night watch light's failure has a line around its fill, `--shape-failed`, because the bright fill alone stood at 1.64 to 1. Not held, and in `gaps.md` *Not done*: a ground under a press, and the edges of a field and of a button. Which word stands on which ground is a list the case holds by hand, a row of `gaps.md` *Not verified* for the proofer.
```

### 5. The pull request's body shows eight of the sixteen screenshots the frame names for it

```seal
severity: must
location: `seal/threads/1795340000-design-system/pr.md:18`, `seal/threads/1795340000-design-system/pr.md:27`, `seal/threads/1795340000-design-system/frame/design.md:151`, `seal/threads/1795340000-design-system/frame/design.md:176`
evidence: read `seal/threads/1795340000-design-system/pr.md:18`, `seal/threads/1795340000-design-system/frame/design.md:151`, `seal/threads/1795340000-design-system/frame/design.md:176`; executed `git cat-file -e 41b3ab4acbab7ab3db3ab29333dcec517583a964:<path>` for each linked path, all present
```

Why it matters: `frame/design.md` *Scope* item 9 says "This pull request carries the inbox and a view in every theme and appearance, and the menu and the dialog in Night watch". Its acceptance row "A pull request that changes the window shows it" (`frame/design.md:176`) is verified by "this work item's own pull request body shows the ones item 9 names for it". That is sixteen images. `pr.md` *Screenshots* shows eight: Night watch's inbox and view in both appearances, and the inbox alone of Register and Desk. The views of Register and Desk, and Night watch's menu and dialog, are committed under `screenshots/` and not shown. Register's view is the screen where finding 1's defect shows, so the body hides from its reader the one screenshot the review needed most.

The eight links resolve. Each names `41b3ab4acbab7ab3db3ab29333dcec517583a964`, which holds the file and is an ancestor of HEAD. Findings 1 and 2 change the window, so the screenshots are made again and committed. The body then names that later commit, not `41b3ab4`.

```markdown
### Screenshots

Night watch, dark and light:

![Night watch dark, inbox](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/night-watch-dark-inbox.png?raw=true)
![Night watch light, inbox](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/night-watch-light-inbox.png?raw=true)
![Night watch dark, a work item](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/night-watch-dark-view.png?raw=true)
![Night watch light, a work item](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/night-watch-light-view.png?raw=true)
![Night watch dark, a menu](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/night-watch-dark-menu.png?raw=true)
![Night watch light, a menu](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/night-watch-light-menu.png?raw=true)
![Night watch dark, a dialog](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/night-watch-dark-dialog.png?raw=true)
![Night watch light, a dialog](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/night-watch-light-dialog.png?raw=true)

Register and Desk, dark and light:

![Register dark, inbox](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/register-dark-inbox.png?raw=true)
![Register light, inbox](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/register-light-inbox.png?raw=true)
![Register dark, a work item](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/register-dark-view.png?raw=true)
![Register light, a work item](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/register-light-view.png?raw=true)
![Desk dark, inbox](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/desk-dark-inbox.png?raw=true)
![Desk light, inbox](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/desk-light-inbox.png?raw=true)
![Desk dark, a work item](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/desk-dark-view.png?raw=true)
![Desk light, a work item](../blob/<commit>/seal/threads/1795340000-design-system/screenshots/desk-light-view.png?raw=true)
```

Here `<commit>` is the full id of the commit that holds the screenshots made after the fixes, written forty hex digits long, as `docs/design.md` *A pull request that changes the window carries its screenshots* states.

```seal
verdict: fixed 0a6b067
answer: `pr.md` now shows all sixteen screenshots the frame names (Night watch's inbox, a work item, its menu and the New work item dialog in both appearances; Register's and Desk's inbox and a work item in both), each linked at `e974e843d0ea2567f5f79bd82229d68cf3b562af`, the commit that holds the PNGs made after round 1's fixes (`git cat-file -e` of one path at that commit, executed). The sentence on the state's words now names every place the window calls the state "Needs you", and a line states the contrast floor.
```

## Confirmations

What matched: the earlier form of `appearance.json` in the running app (`gaps.md` *Not verified*, the row addressed to the proofer). Both reads of the main process go through `readAppearance`: the window's ground at `apps/desktop/src/main/main.ts:125` and the preload's channel at `main.ts:177`. `readAppearance` hands the parsed file to `lookChoice` (`apps/desktop/src/main/appearance.ts:23`), which maps `night-desk`, `letter` and `system` to Night watch in the dark, the light and the system's appearance (`apps/desktop/src/shared/appearance.ts:54`). The save path `main.ts:179` passes the renderer's value through `lookChoice` too, so a crafted value from the page writes only a known pair. An earlier build reading the new file finds a `theme` its `themeChoice` does not know and opens in Night desk (read at `a3e4e7a`), as `changelog.md` says. Read.

What matched: no selector of the page and no module of the renderer names a theme or an appearance (*Scope* item 5, `docs/design.md` principle 5). Executed: `git grep -n -e '\[data-theme' -e '\[data-appearance' -- apps/desktop/src/renderer/index.html 'apps/desktop/src/renderer/*.ts'` printed nothing and exited 1. A search of the same files for the six names in quotes found only the markup's first-run attributes at `index.html:2`, which a case of `themes.test.ts` pins to `lookChoice(undefined)`.

What matched: the three remaining proofer rows of `gaps.md` *Not verified*, each read. The capture's scale is `1 / devicePixelRatio` at `apps/desktop/test/screenshots.test.ts` (`capture`), so a screen of density 1 captures at scale 1 and 1440 by 900; not executed on such a screen. The working mark keeps its turn at `apps/desktop/src/renderer/index.html:122`, unchanged in form. A mark takes no shape from a parent in another state. `.state-icon` sets every `--part-*` to `none` on itself (`index.html:118`), and the mark's own `.state.<state>` (specificity 0,2,0) outranks it (0,1,0), so only the mark's own class sets its parts.

What matched: the sixteen screenshots, each opened as an image and read against `docs/design.md`. Night watch draws the black and bone grounds, the yellow on the waiting mark and its words, on the left edge of what the agent asks and on the failure, and on nothing else. The marks are an open eye with its pupil, a turning ring, a closed eye, a crescent and a filled triangle. A wait and a failure share the yellow and are told apart by shape and words, as principle 4 says. Register draws square corners, a rule under each inbox line, ruled group heads, the strong rule at the left of the selected line and item, mono facts, and what the agent asks between two rules in the serif. Desk draws the earlier Night desk and Letter, with the filled disc for a wait. Findings 1 and 2 are what does not read as the document says. The remaining values of Night watch and Register that phase 1 filled in read as their theme's. Finding 4 is the one judgment on them.

What matched: the cost of "Asleep" and of yellow for both a wait and a failure. Both are the frame's accepted costs (`frame/design.md` *What each theme is*, the row on costs, and `frame/plan.md` *Judgments of the run*, decision 2). The screenshots show "Asleep" in the inbox while the status line says "keeping the Mac awake", the pairing for which the framer refused "2 agents awake". No ratified rule makes that a defect, so it stands as a cost and not a finding. `docs/design.md` *The themes* names the yellow's cost and principle 4 names the shared yellow. Read.

What matched: the stored choice's migration is pinned. Each of the three earlier values has a case, and so does the file left as it is at a read and rewritten at the next save (`apps/desktop/test/appearance.test.ts`). Executed in the round's clone: `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts test/appearance.test.ts test/view.test.ts test/screenshots.test.ts` passed, 4 files, 418 cases, 1 skipped. `OWLERY_BACKGROUND=1 pnpm run test test/theme-controls.test.ts` passed alone, 5 cases. Both exited 0.

What matched: every quote of `pr.md` stands at its source word for word. The owner's answer "default는 B로 하고 나머지 2개도 우리 고를수있는 theme로 하면되지않아?" stands in `frame/questions.md` row Q1. Each opening sentence of `changelog.md`'s items is read against the code: the first-run theme, the migration, Desk as the earlier look, the two controls, the marks, `appearance.json`, the token case and the command. The item "Two states have new words" (`changelog.md:9`) is true of the places it names, and finding 2 widens it. Read.

The new cases were read against their groups. Each new case of `themes.test.ts`, `appearance.test.ts`, `theme-controls.test.ts` and `screenshots.test.ts` holds a fact a *Scope* item or an acceptance row states, and none repeats another case of its file. No case was found that holds no fact of the frame.

The implementer's account was read as a claim. Phase 5 claims that "every file shows the four states" and that Register "reads as described, but for one form". The screenshots bear out the first claim. The second missed none of the forms this round found, and its two named gaps are findings 1 and 2. The suite is labelled unverified in `gaps.md:7`, with the orchestrator as its answerer. That label is honest: no phase claims the broad gate.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether Register's "a rule under each line and each row of a list" also reaches the sidebar's items of work items and the fact list of a view, which finding 1's enumeration found without a rule in Register. Phase 1 decided the sidebar item takes none. | `docs/design.md:47`, `apps/desktop/src/renderer/index.html:181`, `apps/desktop/src/renderer/index.html:332` | the orchestrator |
| Whether "No agent is running." in a change's sentence, and "no agent" in the status line, name the state "Asleep" under the decision of finding 2. The frame keeps the status line. The change's sentence is a fact, not the state's name, so this round raised no finding on it. | `apps/desktop/src/renderer/view.ts:534`, `apps/desktop/src/renderer/view.ts:593` | the orchestrator |
| The Korean edition's wording, beyond the principles, *What every theme shares* and the opening of *The themes*, which this round read and found to say what the English says. | `docs/design.ko.md` | the sealer |
| Whether GitHub draws the `../blob/<commit>/<path>?raw=true` images in this repository's pull request, and after a squash merge and the branch's deletion. | `seal/threads/1795340000-design-system/gaps.md` *Not verified* | the orchestrator, once the pull request is open |
| The whole suite, the typecheck and the `Broad gate` command. This round ran five test files narrowly. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate; then the sealer's spawn |

## Probes

| Command | Result |
|---|---|
| `python3 -I contrast.py apps/desktop/src/renderer/themes.css`, a script in the round's scratch directory that parses each block, resolves `var()` and composites `rgba` over the ground, then gives the WCAG 2 contrast ratio | Night watch `--focus` against `--main` 1.00 in both appearances; Register 1.37 and 1.81; Desk 1.37 and 1.43. `--focus` against `--ground` 8.25 to 16.70, against `--ground-raised` 9.15 to 18.04. `--ink-faint` 3.05 to 3.87 against every ground of every block. `--state-finished` and `--state-no-agent` 3.05 to 3.86. Night watch light `--state-waiting` 4.69 on the ground, 4.28 on the sidebar. The first run failed on `transparent`, which the script then read as no colour. |
| `git merge-tree --write-tree HEAD origin/release/v0.0.2` | exit 0: no conflict with `cbb2e69` |
| `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts test/appearance.test.ts test/view.test.ts test/screenshots.test.ts`, in a `git clone --no-local` at `f41bd67` | 4 files passed, 418 cases, 1 skipped, exit 0 |
| `OWLERY_BACKGROUND=1 pnpm run test test/theme-controls.test.ts`, alone, in the same clone | 1 file passed, 5 cases, exit 0 |
