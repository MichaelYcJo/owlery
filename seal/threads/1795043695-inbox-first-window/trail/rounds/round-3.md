# Review round 3: 1795043695-inbox-first-window

```seal
target: a0742bc against 277eb35
```

This round answers the first row of `trail/rounds/round-1.md` `## Not judged` and the second row of `trail/rounds/round-2.md` `## Not judged`, which `guarantee.md` withheld on at `ad975f3`. Its target is the branch at `a0742bc` against `277eb35`, the commit `release/v0.0.1` resolves to. Its code is the part of that diff those two rows name, each read in full at `a0742bc`: `apps/desktop/src/renderer/sidebar.ts`, `shared.ts` whole, `view.ts` from line 460 to its end at line 597, `index.html`, `themes.css`, and every case of `apps/desktop/test/view.test.ts` and `apps/desktop/test/themes.test.ts`.

Round 1's account of what it read names neither `apps/desktop/src/renderer/theme.ts` nor `apps/desktop/build.mjs` nor the two drawings under `apps/desktop/assets/seals/`, and its `## Not judged` row does not list them either. So no round had read them. This round read `theme.ts` and the diff of `build.mjs` whole, and ran `shasum -a 256` over both drawings. Each gave the hash `frame/design.md` *Grounding* gives: `9548f411…` for `owl.svg` and `fa8ffa5d…` for `owl-icon-cream.svg` (executed). Outside the scope, the round opened the following for the calls the scope's code makes, and did not review them again: `renderer.ts`, `work-item-view.ts`, `summary.ts`, `list.ts:86-190`, `src/shared/appearance.ts`, `src/main/appearance.ts`, `src/preload/preload.ts` and `src/shared/ipc.ts`. The daemon and the protocol were not reviewed again.

The work item's records were read whole at `a0742bc`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `guarantee.md`. Of `trail/phases/`, `phase-6.md`, `phase-8.md` and `phase-9.md` were read whole, `phase-7.md` to the end of its account of the mutants, and phases 1 to 5 not at all. No `pr.<lang>.md` stands, since `seal/config.json` names English for both language keys. The repository declares no `seal/parity.json`.

Facts carried from earlier rounds and not established again: the verdicts of rounds 1 and 2 on the daemon, the protocol, the main process and the preload; and round 1's finding that the renderer draws every text from the daemon with `textContent` or `Option`. This round saw the same in `sidebar.ts` and `shared.ts`, which build text with `textContent` and `append` of strings. Every verdict below is this round's own.

The five findings are apart from one another. Findings 1 and 2 are places where the page does not do what `frame/design.md` *Scope* item 13 says. Findings 3 to 5 are sentences or behaviour that tell a person or a reader something that is not so.

## Findings

### 1. A tab has no style for the press, and the tab in front and a tab's close control none for the pointer either

```seal
severity: must
location: `apps/desktop/src/renderer/index.html:266-271`, `apps/desktop/src/renderer/work-item-view.ts:188-207`
evidence: executed `grep -n ":active" apps/desktop/src/renderer/index.html` and `grep -n 'createElement("button")' apps/desktop/src/renderer/*.ts`; read `apps/desktop/src/renderer/index.html:258-271`, `apps/desktop/src/renderer/work-item-view.ts:188-207`
```

Why it matters: `frame/design.md` *Scope* item 13, *States of a control*, says "A line, a sidebar's item, a tab and a button each have a style for the pointer over it, for the press, for the keyboard's focus, which is a ring, and for the disabled control." A tab is a `span.tab` holding two buttons, `.label` and `.close` (`work-item-view.ts:188-207`). The page's style gives the tab no style for the press. It also gives the tab in front no style for the pointer, and the close control no pointer style of its own:

- No rule under `#tabs` names `:active`. The grep listed seven `:active` rules, for `.primary`, `.quiet`, `.icon-button`, `.side-item`, `#summary-lines button`, `.line` and `#pane-buttons button`, and none for a tab or its close control.
- `#tabs .tab:hover` (`index.html:267`) and `#tabs .tab.active` (`:268`) weigh the same, one id and two classes, and the second stands later. So the tab in front keeps the terminal's ground under the pointer.
- `#pane-bar button:hover` (`:262`) weighs less than `#tabs .tab .close` (`:271`), which sets the close control's colour. So the close control keeps `--ink-faint` under the pointer and when pressed. On a tab not in front, only the tab's own ground changes under it.

The method was to list every control the page draws. The 13 `button` elements of `index.html` and the seven places a module makes a button come from the grep. Each was then checked against the rules of `index.html` for the pointer, the press, the focus and the disabled state. Every other control has all four that apply to it: the ring is `button:focus-visible` (`:71`) and the disabled state is `button:disabled` (`:66`). The tab's label and close control are the ones that lack a style. Scenario 35's drive read a line, a sidebar's item and a button, and no tab (`trail/phases/phase-8.md`, *Scenario 35*), so nothing showed it.

```css
      /* index.html, after `#tabs .tab .close`: a tab, and its close control, answer the pointer and the press. */
      #tabs .tab:not(.active):active { background: var(--pressed); }
      #tabs .tab .close:hover { color: var(--ink); }
      #tabs .tab .close:active { color: var(--ink-strong); }
      /* The tab in front stands on the terminal's ground, which is dark in both themes. */
      #tabs .tab.active .close:hover { color: var(--terminal-ink); }
      #tabs .tab.active .close:active { color: var(--terminal-strong); }
```

Precondition: none beyond the properties both blocks of `themes.css` already define. The snippet leaves the label of the tab in front without a pointer or press style. Pressing that label shows again what is already in front. The fix pass owes either a rule for it or a line of `gaps.md` *Not done* that says why it has none, since *Scope* item 13 names every tab.

### 2. Five shadows, a gradient and a radius stand written in `index.html`, where *Scope* item 13 has every shadow, texture and radius a property of the theme

```seal
severity: must
location: `apps/desktop/src/renderer/index.html:89`, `apps/desktop/src/renderer/index.html:121`, `apps/desktop/src/renderer/index.html:127`, `apps/desktop/src/renderer/index.html:185`, `apps/desktop/src/renderer/index.html:268`, `apps/desktop/src/renderer/index.html:307`, `apps/desktop/src/renderer/index.html:10`, `apps/desktop/src/renderer/themes.css:1-8`, `seal/threads/1795043695-inbox-first-window/gaps.md:54`
evidence: executed `grep -n -o -E "(box-shadow|border-radius|filter|background): [^;]*" apps/desktop/src/renderer/index.html`, filtered to the values that are not one `var()`; read `apps/desktop/src/renderer/themes.css:1-170`, `apps/desktop/src/renderer/index.html:10`, `seal/threads/1795043695-inbox-first-window/gaps.md:54`
```

Why it matters: `frame/design.md` *Scope* item 13, *Tokens*, says "Every colour, typeface, texture, radius and shadow the page draws with is a custom property named for its role and not for its colour, defined once per theme in `src/renderer/themes.css`". The same item says a theme may change "the radii, and how the seal is lit (its shadow, its rim and the tones of the blank place)". The build follows that for the card's, a control's and a selected line's edges, which are `--card-edge`, `--control-edge` and `--selected-edge` in both blocks. It writes the same kind of edge in the page's own rules in five places, and with them the blank seal's light and a corner:

| `index.html` | What stands written there |
|---|---|
| `:89` | the corner of a search's mark, `border-radius: var(--space-1)`, a step of the page's spacing; and its edge, `box-shadow: 0 0 0 1px var(--mark)` |
| `:121` | a line's blank seal: its light, `radial-gradient(circle at 40% 35%, …)`, and its edge, `inset 0 0 0 1px var(--seal-blank-ring)` |
| `:127` | the drawn blank seal's light, the same gradient |
| `:185` | the edge of the bell's dot, `0 0 0 1.5px var(--ground-side)` |
| `:268` | the edge of the tab in front, `1px 0 0 var(--rule), -1px 0 0 var(--rule)` |
| `:307` | a field's edge, `inset 0 0 0 1px var(--rule)` |

The method was to take the page's style apart into every declaration of a shadow, a radius, a filter or a ground and keep the values that are not one `var()`. The grep listed these and three more. Those three are the `50%` of a circle at `:120`, `:147` and `:185` and the `0` at `:122`, which are shapes the same in any theme. A theme therefore cannot change these edges, this light or this corner, though the frame says it may. Three sentences of the tree say that it can: the comment at `index.html:10` ("Every colour, typeface, texture, radius and shadow is a property of the theme in use, in themes.css"), the head of `themes.css` ("A block holds every colour, typeface, texture, radius and shadow the page draws with"), and `gaps.md:54` ("Every colour, typeface, radius and shadow is one, in the theme's block"). `test/themes.test.ts` reads colours alone, so no case refuses a shadow written in the page.

In each block of `themes.css`, after `--dialog-shadow`:

```css
  /* The edges the page draws as a shadow, the corner of a search's mark, and the light on a blank seal. */
  --field-edge: inset 0 0 0 1px var(--rule);
  --tab-edge: 1px 0 0 var(--rule), -1px 0 0 var(--rule);
  --dot-edge: 0 0 0 1.5px var(--ground-side);
  --mark-edge: 0 0 0 1px var(--mark);
  --radius-mark: 2px;
  --seal-blank-edge: inset 0 0 0 1px var(--seal-blank-ring);
  --seal-blank-ground: radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep));
```

In `index.html`, the six declarations read them:

```css
      mark { border-radius: var(--radius-mark); background: var(--mark); box-shadow: var(--mark-edge); color: inherit; }
      .seal[data-seal="none"] { background: var(--seal-blank-ground); box-shadow: var(--seal-blank-edge); }
      .seal.drawn[data-seal="none"]::before { background: var(--seal-blank-ground); }
      #bell.ringing::after { content: ""; position: absolute; left: 14px; top: 3px; width: var(--dot); height: var(--dot); border-radius: 50%; background: var(--ink-strong); box-shadow: var(--dot-edge); }
      #tabs .tab.active { background: var(--terminal-ground); box-shadow: var(--tab-edge); }
      input, select { box-sizing: border-box; height: var(--control-height); padding: 0 var(--space-4); border: 0; border-radius: var(--radius-control); background: var(--ground-sunken); box-shadow: var(--field-edge); color: var(--ink-strong); font: inherit; }
```

Precondition: a custom property of a theme block may read another of the same block, which `--seal-blank-ground` and the edges do. The seven names pass the four cases of `test/themes.test.ts` over the blocks as written: none holds a word of a measure, none holds a red, and each block defines all seven. With the snippet, the comment at `index.html:10`, the head of `themes.css` and `gaps.md:54` say what holds, and the fix pass owes none of them a change. Where the fix pass keeps the page as it is, those three sentences and *Scope* item 13 are the statements it owes instead.

### 3. Before the daemon's `ready`, the sidebar's "+" opens a form whose "Create" does nothing, and two lines of `gaps.md` say the sidebar does nothing then

```seal
severity: should
location: `apps/desktop/src/renderer/sidebar.ts:57-63`, `apps/desktop/src/renderer/renderer.ts:161-162`, `apps/desktop/src/renderer/renderer.ts:179`, `seal/threads/1795043695-inbox-first-window/gaps.md:81`, `seal/threads/1795043695-inbox-first-window/gaps.md:82`
evidence: read `apps/desktop/src/renderer/sidebar.ts:42-65`, `apps/desktop/src/renderer/renderer.ts:85-90`, `:96-101`, `:161-185`, `:204`, `:266-271`, `apps/desktop/src/renderer/index.html:490`, `seal/threads/1795043695-inbox-first-window/gaps.md:81-82`
```

Why it matters: `frame/design.md` *Scope* item 1 has the sidebar displayed before `ready` and no screen. `openScreen` refuses a screen then (`renderer.ts:87`). Nothing else of the sidebar waits for `ready`:

- The "+" (`sidebar.ts:57`) and N with the Command key call `openWorkItemForm`, which checks only whether the dialog is open (`renderer.ts:162`). The form opens with its "Open" choice empty. The `select` at `index.html:490` has no option until `ready` fills it (`renderer.ts:204`). "Create" then finds no kind (`renderer.ts:178`) and returns at `:179` with no message, and the button stays enabled.
- The control that adds a repository opens the system's folder dialog and then that same form (`sidebar.ts:58-63`).
- The bell sets the filter (`sidebar.ts:56`, `renderer.ts:98-101`), and the sidebar draws its filter control as on.

The window is in this state for as long as the daemon takes to answer, and for the rest of the page's life where no daemon could be reached. In that case `connect` tells the error and returns (`renderer.ts:268-270`). A person who sees the window, presses "+" and fills in the form gets no work item and no word of why. `gaps.md:82` says "A press on the sidebar before `ready` does nothing", which these three presses contradict. `gaps.md:81` says "The status line says nothing between the page's load and `ready`", and it says the daemon's error where no daemon could be reached.

The method was to take `initSidebar` (`sidebar.ts:42-65`) apart into each listener it adds and follow each to the act it calls. The three above act before `ready`. The three screens' items refuse. The fold controls do not exist before `ready`, and the search field and the filter keep what is typed and chosen.

```ts
// apps/desktop/src/renderer/renderer.ts
/** Opens the "New work item" form, with `folder` as its repository where one is given. Before the daemon's `ready` the form has no kind of pane to offer, so it does not open. */
function openWorkItemForm(folder?: string): void {
  if (!held.ready || workItemDialog.open) return;
```

```ts
// apps/desktop/src/renderer/sidebar.ts, in initSidebar
  byId("add-repository").addEventListener("click", () => {
    // Before the daemon's `ready` the form does not open, so neither does the folder dialog.
    if (!held.ready) return;
    // The repository stands in the sidebar once the form made a work item in it: the daemon keeps work items and no list of repositories.
    void actions.pickFolder().then((folder) => {
      if (folder) actions.openForm(folder);
    });
  });
```

```markdown
- **The status line says nothing of the daemon's state between the page's load and `ready`.** *Scope* item 12 gives it "Daemon running" where it has nothing else to say, and before `ready` the window has not heard from a daemon. Where no daemon could be reached, it says why, and no `ready` follows.
- **Before `ready` a press on the sidebar opens no screen and no form,** and its controls are not drawn as disabled. "Inbox" has no count until then. What is typed in the search field and chosen in the filter or by the bell is kept, and narrows the lists once they arrive.
```

The two lines replace `gaps.md:81` and `:82`. The precondition is that `held.ready` turns true at `ready` alone (`renderer.ts:192`), which holds. N with the Command key reaches `openWorkItemForm` too, so the first snippet covers it. No case covers `renderer.ts` or `sidebar.ts`: the frame has the page shown by the drive (`frame/plan.md` *Technical context*). The fix pass says how it showed the form not opening before `ready`.

### 4. A theme choice saved after one that could not be saved leaves "The theme could not be saved." in the status line

```seal
severity: should
location: `apps/desktop/src/renderer/theme.ts:37`, `apps/desktop/src/renderer/renderer.ts:309-313`, `apps/desktop/src/renderer/sidebar.ts:73-77`, `seal/threads/1795043695-inbox-first-window/gaps.md:97`
evidence: read `apps/desktop/src/renderer/theme.ts:9-42`, `apps/desktop/src/renderer/renderer.ts:209-222`, `:309-313`, `apps/desktop/src/renderer/sidebar.ts:37-38`, `:73-82`
```

Why it matters: `theme.ts:37` calls `actions.save(choice).catch(actions.notSaved)`, and `notSaved` puts "The theme could not be saved." in the status line (`renderer.ts:312`). The line keeps a notice until a later `tell` replaces it (`sidebar.ts:74-81`). A successful save calls nothing, so it takes nothing back. Only an answer the daemon sends to a pane or a work item clears the line (`renderer.ts:214`, `:220`). So after one failed save and one that succeeds, the status line still says the theme could not be saved, in the ochre of a notice, while `appearance.json` holds the theme now chosen. A person reads that the next window will not open in this theme, and it will. `gaps.md:97`'s "The status line says so once" is true of one failed choice and silent on a later choice that is saved.

```ts
// apps/desktop/src/renderer/theme.ts
export interface ThemeActions {
  /** Has the main process keep the choice. */
  save(choice: ThemeChoice): Promise<void>;
  /** Called once the page is in another theme, for what takes its colours outside the page's style: the terminals. */
  changed(): void;
  /** Called where the choice was kept, so the notice that an earlier one was not is taken back. */
  saved(): void;
  /** Called where the choice could not be kept: the window is in the theme chosen, and the next one opens in the theme saved before. */
  notSaved(): void;
}
// in initTheme, the listener of `change`
    actions.save(choice).then(actions.saved, actions.notSaved);
```

```ts
// apps/desktop/src/renderer/sidebar.ts
/** Takes `text` back from the status line, where the line still says it, and leaves any other notice. */
export function untell(text: string): void {
  if (notice === text) tell("");
}
```

```ts
// apps/desktop/src/renderer/renderer.ts, with `untell` imported from ./sidebar
const THEME_NOT_SAVED = "The theme could not be saved.";
initTheme(window.owlery.appearance, {
  save: (choice) => window.owlery.saveAppearance(choice),
  changed: showTerminalColours,
  saved: () => untell(THEME_NOT_SAVED),
  notSaved: () => tell(THEME_NOT_SAVED),
});
```

Precondition: none. `untell` compares the notice's text, so it leaves a refusal the daemon sent in between. The snippet leaves `gaps.md:97` to the fix pass, which owes it "The status line says so until a later choice is saved". The rest of that line holds as it is.

### 5. Two sentences of the records say the theme cases catch any colour outside a theme, and the cases read four colour functions

```seal
severity: should
location: `seal/threads/1795043695-inbox-first-window/gaps.md:55`, `seal/threads/1795043695-inbox-first-window/frame/plan.md:40`, `apps/desktop/test/themes.test.ts:68`
evidence: read `apps/desktop/test/themes.test.ts:40-71`, `:116-132`; executed a Python listing of every word in the colour, background, border, shadow, outline, fill and stroke declarations of `apps/desktop/src/renderer/index.html`, and `grep -n -o -E "(hwb|lab|lch|oklab|oklch|color-mix|color)\(" apps/desktop/src/renderer/index.html apps/desktop/src/renderer/themes.css apps/desktop/src/renderer/*.ts`
```

Why it matters: `gaps.md:55` says "`test/themes.test.ts` reads hexadecimal numbers and colour functions", and `frame/plan.md:40` says "The cases over `themes.css` catch a colour outside it". The case reads `FUNCTION`, `/\b(?:rgba?|hsla?)\(([^)]*)\)/gi` (`themes.test.ts:41`). That is four of CSS's colour functions. It does not read `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()` or `color-mix()`, nor a system colour. The measure of red, `isRed` (`:63-66`), takes the numbers of a hexadecimal colour and of `rgb()` or `rgba()` alone (`:50-54`), so a red written with `hsl()` in a theme's block passes scenario 31's case. A reader who adds a colour in one of those forms to the page, or an `hsl()` red to a theme, takes the two sentences to mean a case will refuse it, and none will. The case's docstring at `:68`, "as a hexadecimal number or a colour function", says the same.

The sentence's last clause, "the page uses none today", holds. The listing found only `currentColor`, `inherit`, `none` and words that are not colours in the page's colour declarations, and the grep printed nothing. Its other reason, "The names are a list no case could close", does not hold as written: CSS Color 4 defines a closed list of named colours, which a case could carry. Not carrying it is a cost the builder may weigh, and the sentence below says it so.

```markdown
- **A colour written as a name or a system colour, or with a colour function other than `rgb()`, `rgba()`, `hsl()` and `hsla()`, is not held out of the page by a case.** `test/themes.test.ts` reads hexadecimal numbers and those four functions, and measures red in a hexadecimal number, `rgb()` or `rgba()` alone, so a red written with `hsl()` in a theme's block passes its measure. Holding the names would put CSS's list of them in the case; the page uses none of them and no other function today.
```

```markdown
- Two themes double what a person must look at: every screen is read in both, and a rule that reads a colour by its value in place of a property looks right in one theme and wrong in the other. The cases over `themes.css` catch a colour written as a hexadecimal number or with `rgb()`, `rgba()`, `hsl()` or `hsla()` outside it, and a name one block lacks; nothing but an eye catches a colour written another way, or a property used for the wrong role.
```

```ts
// apps/desktop/test/themes.test.ts:68
/** Whether a text names a colour of its own, as a hexadecimal number or with `rgb()`, `rgba()`, `hsl()` or `hsla()`. */
```

The first block replaces `gaps.md:55`, the second `frame/plan.md:40`, and the third the docstring at `themes.test.ts:68`. Widening `FUNCTION` and `isRed` to every function instead would make the two sentences true as they stand. Such a widening is a change to the cases, owes a red run, and is the fix pass's to choose. No other statement in the tree says what the cases catch. `git grep -n -i -e "themes.test" -e "cases over" -e "colour function" -e "colour outside"` over the work item's records, `trail/` aside, printed these two lines and scenarios 31 and 32, which state what is required. The finding is located in the work item's records and in one docstring of a case.

## Confirmations

```seal
confirms: round-2#1
```
What holds: `changelog.md:26` and `gaps.md:71` at `a0742bc` each equal round 2's replacement block for them, line for line (a Python comparison, executed). `git show --stat 310e3a9` names `changelog.md`, `frame/plan.md` and `gaps.md` alone, and no commit after it touches either line. Round 2's executed evidence was run again: the four files passed, 258 cases, exit 0, the case at `apps/desktop/test/daemon.test.ts:747` among them. That case waits for `1,1`, then `2,3` after a merge of the base, then `0,3` (`:757`, `:761`, `:764`), which is what the new `changelog.md:26` says. `list.ts:90` sets the preview's sentence from `ahead(...).sentence`, empty where the count is `null`, which is what the new `gaps.md:71` says (read).

```seal
confirms: round-2#2
```
What holds: `frame/plan.md:92` at `a0742bc` equals round 2's replacement block (the same comparison, executed). `daemon.ts:493` reads the count ahead at every read for a work item with a base branch. So the rejected alternative runs two counts, a log and a diff, four git runs, one more than the chosen read of two counts and a head (read).

What matched, each read against `frame/design.md` unless it says otherwise:

- `view.ts` from line 460: `selectedLine`, `moveSelection` and `inboxKey` are *Scope* item 17's selection and keys, with the keys read by `KeyboardEvent.code`, none read in a field, a dialog or with a modifier, and Enter left to a focused control. `commandKey` reads K and N with the Command key on macOS and with the Control key elsewhere, and neither while a dialog is open or another modifier is held (items 17 and 21). `paneTabs` and `paneInFront` are item 5's tabs and the tab in front. `askButton` is disabled with "Type what to ask." for a prompt of white space (item 9). `headlessLines` gives one work item's sessions, the most recent first. `notificationFor` decides as at `277eb35`, and its one change is the new `tabLabel` (`git show 277eb35:apps/desktop/src/renderer/view.ts`, executed).
- `sidebar.ts`: the three screens' items, the counts, the bell that sets the filter to "Waiting for you", the filter shown in the sidebar and the list alike, the repositories by folder with the folder as title, a fold kept by folder and none folded at load, a work item marked with `aria-current` while its view is open, and Escape that empties the field and returns the keyboard to the list (items 12, 20 and 21).
- `shared.ts`: `sealPlace` gives every place `data-seal="none"`, `role="img"`, and the name and the title "No seal yet" (item 15). `marked` puts the places `markRanges` gives into `mark` elements and the text between them as text nodes.
- `index.html` and `themes.css`: the widths and heights of items 2, 4, 15, 19 and 20 (404, 46, 420, 64, 112, 18, 38, 256 and 28 pixels); the type sizes of item 13 (15, 20, 20 and 34, the terminal 12); 59 names in each block, the same in both (a Python count, executed), as `trail/phases/phase-9.md` says; no red but in `--seal-light`, whose two values are read as red by the case; the main button's fills; a focus ring and a mark built from the ink and the ochre; a 120-millisecond transition; the reduced-motion rule; and the content security policy, which is line 5 of `index.html` at `277eb35` unchanged (executed).
- `theme.ts` and `build.mjs`: a choice sets `data-theme` alone and calls `showTerminalColours` only where the theme changed; "Match the system" follows `prefers-color-scheme` while the window is open (item 24). `build.mjs` copies `themes.css` and the two drawings into `dist/` (*Data & interfaces*).
- `pr.md`: each quote compared, whitespace collapsed, with the Judgment cell of the row it cites in `frame/plan.md` *Judgments of the run*. Rows 8, 9, 10 and 1 match word for word, and rows 11 and 12 as their cells' leading parts (executed).

The new cases were read against their groups: each `describe` of `test/view.test.ts` and of `test/themes.test.ts`, and the cases of the functions a case's function calls, `lastHere` beside `ageOf` and `inboxLine` beside `lineSession` and `workItemEntries`. Each new case holds an input or a result its group does not. The empty list of `paneTabs`, `selectedLine` and `moveSelection` is one such input. Another is `ageOf`'s `null` and `undefined`, which `lastHere` never passes. No case covers only what its group already covers. One gap holds no fact the frame names beyond scenario 32's words. The case "defines no width, no height, no spacing and no size of type" (`themes.test.ts:103-108`) reads a property's name, and a font's value alone. A measure under a name without one of its words, as `--list: 404px` would be, passes it, and no property of either block is one today.

The suite's label: `trail/gate.md` records the broad run at `bc16b45`, and the commits since touch `trail/gate.md` and `guarantee.md` alone, so the code at `a0742bc` is the code that run passed. The label is honest. Findings 1 to 4 change code, so the broad run is owed again after the fix pass, and the orchestrator answers it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the typecheck and the documents' checks after the fix pass of this round | `seal/config.json` `Broad gate` | the orchestrator, by the broad run after the rounds settle |
| Whether *Scope* item 21's "The letters that match are marked in the title and in the branch" reaches the sidebar's titles. The list marks them (`list.ts:114`, `:118`), and the sidebar draws its titles plain (`sidebar.ts:90`). The mockup's search, as `frame/design.md` *Grounding* gives it, reads either way | `apps/desktop/src/renderer/sidebar.ts:90`, `seal/threads/1795043695-inbox-first-window/frame/design.md:204` | the orchestrator, by a fold or a question to the owner |
| Whether a repository's count under a search or a filter is *Scope* item 20's "the count of its work items". The sidebar counts the work items it lists (`view.ts:134`, fed the narrowed list at `sidebar.ts:127`). `trail/phases/phase-6.md` calls that a decision, and no document above the account states it | `apps/desktop/src/renderer/sidebar.ts:126-131`, `seal/threads/1795043695-inbox-first-window/frame/design.md:199` | the orchestrator, by a fold or a question to the owner |
| The screens beside the polish mockups, the seal's place and the states of a control by eye (scenarios 17, 30, 31 and 35). This round launched no app and read no screenshot | `gaps.md` rows 37, 38, 42 and 43 | the owner |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/themes.test.ts` in `apps/desktop`, once | 2 files, 152 cases passed, exit 0. A narrow run of the two case files in this round's scope, not the broad gate. Output kept at `<scratchpad>/1795043695-inbox-first-window/round-3/narrow.txt` |
| `node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts test/last-look.test.ts test/view.test.ts` in `apps/desktop`, once | 4 files, 258 cases passed, exit 0: round 2's finding 1 evidence run again for its confirmation. No `test_tmp_*` probe was written, and no file was added to the worktree but this record |
