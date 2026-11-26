# Review round 1: 1795651593-231-pane-output-is-searched-and-opens-paths

```seal
target: 5a9e1951 against release/v0.0.5
```

The base is `release/v0.0.5` at `9f9ba1da`, the branch's cut. The base has moved since to hold #262 and #263, and the orchestrator merges it in before the gate; this round reviewed the diff `9f9ba1da..5a9e1951` alone. It is the first round, so no earlier round hands over a coordinate or a close, and every fact below was established in this round.

The round read whole, at `5a9e1951`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md` to `phase-3.md`. `seal/config.json` gives English for both the records and the pull request, so no `pr.<lang>.md` is owed, and none stands. No `seal/parity.json` stands, so no parity comparison was made. The source diff was read in full: daemon, shared, main, preload, renderer, `index.html` and both editions of `docs/design.md`. The test diff was read in full too.

## Findings

### 1. The find bar says "More than 1,000 matches" for a match the pane printed after the bar last counted, where a handful matched

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:618`, `apps/desktop/src/renderer/view.ts:2047-2057`, `apps/desktop/test/terminal-basics.test.ts:653`, `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/trail/phases/phase-2.md:16`
evidence: read `apps/desktop/src/renderer/view.ts:2055-2059`, `apps/desktop/src/renderer/work-item-view.ts:581-638`, the installed `@xterm/addon-search` 0.16.0 at `src/SearchAddon.ts:60-73`, `:101-104`, `:144`, `:176-179`, `src/SearchState.ts:83-90`, `src/SearchResultTracker.ts:56-58`, `:100-110`; executed `git grep -n -F "resultIndex: -1" -- apps/desktop`
```

Why it matters: the count is the one sentence the bar gives the person about the search, and *Scope* item 8 of `frame/design.md` reserves "More than 1,000 matches" for the add-on's stop at 1,001. The bar shows those words for 12 matches, and leaves the match in front without the mark every match carries.

The grounds:

- `findCount` reads `resultIndex < 0` as past the limit, whatever the count (`view.ts:2057`). The unit case pins it: `findCount({ resultIndex: -1, resultCount: 12 })` is "More than 1,000 matches" (`view.test.ts:4171`). Phase 2's Decision 1 claims -1 comes "where the match in front is not among those counted". The add-on gives -1 in a second case as well.
- The add-on counts and marks its matches in `_highlightAllMatches` alone, which keeps the list it found (`SearchResultTracker.ts:56-58`, called at `SearchAddon.ts:144`). `findNext` and `findPrevious` run it only where `shouldUpdateHighlighting` holds (`SearchAddon.ts:103`, `:178`): no cached term, another term, or other options. The options are stored just before that comparison (`:101`, `:176`), so a step with the same term never counts again.
- What counts again after a print is `_updateMatches`, a timer of 200 ms that every `onWriteParsed` restarts (`SearchAddon.ts:60`, `:65-73`). A pane whose program prints more often than every 200 ms is never counted again while it prints. That includes an agent's CLI drawing its working line. A step within 200 ms of any print isn't counted again either.
- A step lands on the next match in the terminal as it stands. Where that match was printed since the last count, or where a full scrollback shifted the counted rows, the add-on finds it in no counted row and fires `resultIndex` -1 with the old count (`SearchResultTracker.ts:100-110`). The bar then says "More than 1,000 matches". The likeliest path: the bar is open over a working agent's pane, and "Previous match" passes the newest counted match onto a line the agent printed since.
- `find` in `work-item-view.ts:618` steps and keeps no count of its own, so nothing corrects it until the program stops printing for 200 ms.

The case A3 (`terminal-basics.test.ts:693`) reaches "More than 1,000 matches" only through 1,001 lines printed before the search. No case steps onto a match printed after it. Neither the frame nor the phase records state the second source of -1, so this is new behaviour of the build, not a departure the frame took. Contract rule 12: the class is "a count the add-on gave from a list made before the last print". The bar reads it in one place, the listener in `searchOf` (`work-item-view.ts:581-590`). The fix below reaches it there through `find`, the one caller that steps.

The fix: where a step leaves the match in front outside what the add-on counted, search again from that match with the term dropped. The add-on then widens from the selection first (`SearchEngine.ts:187-192` of 0.16.0), which finds that same match, and counts every match afresh. Both calls run in one task, so the count the first one fires is replaced before the page draws, and `findCount` itself can stay. Its docstring (`view.ts:2047-2054`) and phase 2's Decision 1 (`phase-2.md:16`) owe the second source of -1. A built-app case in `terminal-basics.test.ts` beside A2 (`:653`) has the pane print a line holding the term after the search, then steps onto it while the pane keeps printing, or within 200 ms of the print. It reads the count as the right ordinal of the new total, and is seen red without the search again below. The unit case at `view.test.ts:4171` may stay as a pin of `findCount`; after the fix the bar no longer shows what it pins for a count under the limit.

```ts
// work-item-view.ts, in `Screen`:
  /** What the add-on last said of its results on this screen (`searchOf`). */
  results?: { resultIndex: number; resultCount: number };   // NAME NOT IN TREE: a new field

// in `searchOf`, first line of the listener:
  search.onDidChangeResults((results) => {
    screen.results = results;
    if (findScreen !== screen) return;
    ...

// in `find`, after the step and before `findSelected` is taken:
  if (step === "newer") search.findNext(query.term, findOptions(query));
  else search.findPrevious(query.term, findOptions(query));
  // The add-on counts its matches again only where the term or a choice changed, or 200 ms after the pane last printed, so a step can land on a match printed since, outside what it counted. The match in front is then searched for again with the term dropped, which finds that same match and counts every match afresh.
  const counted = screen.results;
  if (step !== "fresh" && counted !== undefined && counted.resultIndex < 0 && counted.resultCount > 0 && counted.resultCount <= FIND_LIMIT) {
    search.clearDecorations();
    search.findPrevious(query.term, findOptions(query));
  }
  findSelected = screen.term.getSelectionPosition();

// view.ts, the docstring of `findCount`, its last sentence:
 * `FIND_LIMIT` at most, and names no match in front where that match is not
 * among those it counted, past the limit or printed since it last counted.
 * Past the limit the bar says "More than 1,000 matches"; a match printed
 * since is counted again by the bar before the page draws (./work-item-view,
 * `find`).
```

The snippet assumes the selection the step made still stands when `find` searches again. That holds because both calls run in one task, and no print is parsed between them. Its precondition is the add-on's version: 0.16.0 is pinned in `apps/desktop/package.json`, and `SearchEngine.ts:187-192` is read from that version. Phase 2's Decision 1 states the old reading ("or where the match in front is not among those counted (`resultIndex` -1)"), and gains "or printed since the add-on last counted, which `find` counts again".

```seal
verdict: fixed f99803f1
answer: The finding holds: the add-on 0.16.0 recounts only at a changed term or choice, or 200 ms after the last print (`SearchAddon.ts:60-73`, `:101-104`, `:176-179`, read), and fires `resultIndex` -1 with the old count for a match outside its list. `find` in `work-item-view.ts` now searches again from the match in front with the term dropped where a step leaves it outside the count and the count is under the limit, as the record's snippet gives; `searchOf`'s listener keeps the add-on's last results on the `Screen`, whose `results` field is a change to the body of an interface the tree holds, so it waits for no fold. `findCount`'s docstring and phase 2's Decision 1 give the second source of -1. The new case "counts a match the pane printed after the search once a step lands on it, while the pane keeps printing (scenario A2)" in `terminal-basics.test.ts` prints into the pane's terminal device after the search, keeps printing every 50 ms, and steps with Shift+Enter. It failed without the search again (executed, exit 1, with the fix set aside): a probe of the same step read "More than 1,000 matches" where "1 of 3" was due. With the fix it passed among the six cases of `-t 'scenario A'` (exit 0). `seal mutate` putting `false` in place of `counted.resultIndex < 0` was red on the same line (executed, exit 0). `findCount` itself and its unit case at `view.test.ts:4171` stay. `git grep` of "resultIndex" and "More than 1,000" over the frame, `changelog.md`, `docs` and `apps/desktop/src` (executed after `1ef33033`, a sample) printed the code, the rows of both editions of `docs/design.md`, *Scope* item 8 and the find bar's paragraph of `frame/design.md`. Each states the words the bar says and none states when -1 comes, so none stands contradicted, and no frame statement needs a fold.
```

### 2. No case holds that a pasted image's path is dropped where the screen took another pane while the main process wrote the file (mutant P8)

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:694-699`, `apps/desktop/test/terminal-basics.test.ts:1260`
evidence: read `apps/desktop/src/renderer/work-item-view.ts:487-499`, `:694-699`, `:886-908`, `apps/desktop/test/terminal-basics.test.ts:1260-1307`, `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/trail/phases/phase-3.md:107`; executed `git grep -n -F "pasted-image" -- apps/desktop/test`
```

Why it matters: `pasteImage` is a unit this work made. Its guard `turns.pane === pane` (`work-item-view.ts:698`) is what keeps an image's path from being typed into another agent's prompt. That happens where a pooled screen passes to another pane while the main process writes the PNG. Phase 3's mutant P8 removed the guard and survived (`phase-3.md:107`), and `gaps.md` *Not done* states it.

This round answers the orchestrator's question: the case is this work's to write. The guard is new code of this diff, reached from both ways in, the paste event (`takesPastes`, `work-item-view.ts:886-908`) and the menu's "Paste" (`:494-495`). The frame's D1 hands the path to "the pane's program", the one the paste was made in. `skills/code-review/SKILL.md` *The record* makes a behaviour the diff changed that no case holds a `should`.

The absence was read by a complete method, not by search alone. In a background start, the clipboard holds no image (`clipboard.ts`, `chooseClipboard`). So a case can reach the guard only by replacing the handler of `owlery:pasted-image`, and the grep lists the one case that does so (`terminal-basics.test.ts:1268-1269`). That case answers at once, and moves no pane during the request.

The text guard of the menu's "Paste" predates this work. The diff kept its behaviour when it moved the check to `:494`, so it is not owed here.

The window is small: a person must take the screen to another pane within the few milliseconds the main process takes to write the file. The fix pass may weigh that against the cost of the case and answer `rejected` with that reason. The record says so here so the choice is made on its grounds.

The fix, in sentences, since which pooled screen a pane takes is `screenMoves`'s choice (`view.ts:2751`) and a snippet would have to guess it. Add a step to the paste case at `terminal-basics.test.ts:1260`, before the Control+V step:

1. Replace the handler of `owlery:pasted-image` with one that holds its answer until the case releases it, through a global of the main process, as the case already counts through `globalThis.__pasted`.
2. Dispatch an image paste into the pane in front.
3. Make a second pane take that same screen. One way: close every other pane first, so the pool's screen is the one reused. Another: read which screen element the second pane's terminal stands in.
4. Release the answer. Read through `handedMeanwhile()`, and the second pane's `Received`, that neither process was handed the path.
5. Show the step red with `turns.pane === pane` removed from `pasteImage`, as P8 removed it, and read the failing line for that guard.

Once it stands, `gaps.md` *Not done*'s paragraph on P8 goes. Its sentence on the menu's text guard stays.

```seal
verdict: fixed f911a919
location: `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/gaps.md`, `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/trail/phases/phase-3.md`
answer: The finding holds, and the case was written rather than rejected: the guard is what keeps an image's path out of another agent's prompt, and the case costs one step. The paste case in `terminal-basics.test.ts` gains a step at its end, after the Control+V step, so the counts it already reads stay. The main process's handler holds its answer through a global. A second pane is opened and its screen marked; an image paste goes into it; the second pane is closed from a second client of the daemon; a third pane opens and the step waits until the keyboard is in it on the marked screen (`screenMoves` gives a pane the first free screen). The answer is then released, and neither the third pane's process nor the first pane's is handed anything. The step passed with the guard (executed, exit 0). `seal mutate` with P8's mutation, `turns.pane === pane` removed from `pasteImage`, was red at the third pane's bytes, `expected '1b5b3230307e2f707269766174652f7661722…' to be ''`, the bracketed path (executed, exit 0). In `1ef33033` the paragraph of `gaps.md` *Not done* on P8 goes, and its sentence on the menu's "Paste" stands alone, since no case reads that guard. Phase 3's table now reads P8 as red after `f911a919`, and its Decision 6 cites the `gaps.md` paragraph for the menu's guard alone.
```

### 3. The memory measurement and phase 1 set the cells of 5,000 lines, 11.8 MB, against the 33 MB the renderer grew, where the lines added hold 9.4 MB, as the frame says

```seal
severity: should
location: `apps/desktop/measurements/memory.md:131`, `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/trail/phases/phase-1.md:68`
evidence: read `apps/desktop/measurements/memory.md:22`, `:131`, `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/frame/design.md:151`; executed `git grep -n -F -e "11.8" -e "9.4 MB" -e "12 × 49" -- seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths apps/desktop/measurements`
```

Why it matters: `docs/architecture.md` *Memory design* makes a feature efficient "where a measurement shows its cost". `apps/desktop/measurements/memory.md` is the record the next work item reads to decide what holds the renderer's 33 MB. The scene of 2026-11-19 already held 1,000 lines a terminal: each pane prints about 300 lines a second from before the first sample to the last (`memory.md:22`), so 1,000 and 5,000 lines both fill. The cells this work added are 4,000 lines × 49 columns × 12 bytes × 4 terminals, which is 9.4 MB. The total of 5,000 lines, 11.8 MB, is not.

`memory.md:131` sets that total in a bullet about the growth, and leaves "the rest" at 21 MB where it is 24 MB. `phase-1.md:68` states the growth wrongly outright: "the cells of four terminals account for about 11.8 MB of the renderer's 33 MB". `frame/design.md:151`, folded by the orchestrator, gives 9.4 MB. So two records of the work item state two figures for one fact.

The search above printed these three statements and no other. It is a sample under contract rule 19, since a statement in other words escapes it. The snippet covers both wrong ones.

```md
<!-- apps/desktop/measurements/memory.md:131 -->
- The renderer process holds 116.4 to 120.1 MB at 30 s, where it held 82.7 to 86.9 MB, so about 33 MB more. Each terminal holds 4,000 lines more than it held then, and at 49 columns and 12 bytes a cell they come to about 2.4 MB for each terminal and 9.4 MB for four. These tables do not say what holds the rest.

<!-- seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/trail/phases/phase-1.md:68, its last two sentences -->
By arithmetic the 4,000 lines each of the four terminals holds beyond the 1,000 it held before account for about 9.4 MB of the renderer's 33 MB. The measurement does not say what holds the rest.
```

```seal
verdict: fixed c3486212
answer: The finding holds: the scene of 2026-11-19 printed about 300 lines a second (`memory.md:22`, read), so its terminals already held 1,000 lines, and 4,000 × 49 × 12 × 4 is 9.4 MB. Both replacement sentences were applied as the record gives them. The finding's command, `git grep -n -F -e "11.8" -e "9.4 MB" -e "12 × 49"` with "2.9 MB" added, over the work item's records, `apps/desktop/measurements` and `docs`, run after `1ef33033` (executed), prints `memory.md:131` and `phase-1.md:68` at 9.4 MB, `frame/design.md:151` at 9.4 MB, `memory.md:99` (an unrelated 18 MB), and this record's own lines. No 11.8 MB or 2.9 MB is left. The read of the range, for the pass as a whole: after `1ef33033` the pass read every hunk of `git diff b960acf6..HEAD` over `apps/desktop/src` and `apps/desktop/measurements`, and the fold of the frame since phase 3 (`git diff a3abfa39..HEAD` over `frame/`, read), which holds no statement these fixes change. `gaps.md` and `changelog.md` were read whole after `1ef33033`; no fix changes what the changelog states, so it is not touched. The row of `gaps.md` *Not verified* on `screenTurns` dropping typed keys until the replay is drawn is closed, as this round's *Confirmations* answer it with `view.ts:2818-2858` and `work-item-view.ts:805-808`: the row is removed in `1ef33033`, since `gaps.md` holds only what went out unproved. The narrow set after `1ef33033` passed: the typecheck (exit 0), `view.test.ts` and `themes.test.ts` with 586 cases (exit 0), and `terminal-basics.test.ts` with 35 (exit 0), all executed through the machine's runner of heavy commands in one command. The broad gate stays `unverified`, for the orchestrator.
```

## Confirmations

What matched, each checked against the code at `5a9e1951`:

- The frame's *Rule changes* `from:` texts hold the policy as it stands. Each of the six (three in `docs/architecture.md`, three in `docs/architecture.ko.md`) was found whole by `git grep -n -F` at the target, exit 0 each (executed). Their sections stand at `docs/architecture.md:437` and `:478` and `docs/architecture.ko.md:437` and `:478` (read). `docs/architecture.md:489` still says a file "is never opened in an app", which the settle replaces.
- The facts the rule changes replace are stated nowhere else that the settle would leave standing. `git grep -n -i` on "1,000 lines", "256K", "log on disk", "disk log", "never opened", "opened in an app" and "scrollback" over `docs`, `README.md` and `apps/desktop/src` (executed, a sample under contract rule 19) printed the two rows the rule changes name. It also printed `apps/desktop/src/main/paths.ts:54`, "A file is selected and never opened", which is Finder's act and still true, and the new code.
- The plan's two census searches hold. `git grep -n -e 'bufferChars' -- apps/desktop` printed nothing (exit 1), and `git grep -n -e 'scrollback: 1000' -- apps/desktop/src` printed `sign-in-pane.ts:35` alone (executed). Phase 1 claimed both; `daemon.ts:3954-3957` is the renamed `outputLimit`.
- Every quote of `pr.md` stands verbatim in `frame/design.md` or `frame/questions.md`: 13 of 13, by `grep -F` (executed).
- `gaps.md` *Not verified* asks a proofer whether a key typed while a returned pane's replay is drawn is dropped and not sent. It is. `screenTurns` answers `receiver()` as undefined while `unreplayed` holds (`view.ts:2818-2858`), and `term.onData` sends nothing where the receiver is undefined (`work-item-view.ts:805-808`). `take` sets `unreplayed` for a pane this window drew before (`work-item-view.ts:853`). So the first key the process receives in the case *holds again the 3,000 lines* marks the drawn replay, plus up to 25 ms of the case's pacing, as phase 1 says (read). The fix pass may mark that row `closed` with this coordinate.
- Phase 3's Departure 1 holds. Electron 45.3.3's `Clipboard` has no `readImage`. It has `read(): Promise<ClipboardItem[]>`, and `ClipboardItem.getType` resolves a `Blob` (the installed `electron.d.ts:7441-7480`, `:7505-7530`, read). `main.ts:67-75` reads that.
- Phase 3's Decision 6 holds: the menu's "Paste" returns before either paste where the screen's pane changed (`work-item-view.ts:494`, read).
- `openInEditor` (`openers.ts:134-159`) refuses a path that is not whole, a path nothing stands at, and a folder, an app's bundle among them. It also refuses an editor that is not chosen, not of the list or not installed, before it runs anything. It runs the editor's own command with no shell (`main.ts:96-99`, `execFile`). A path the window hands is absolute, so it cannot be read as an option by any of the five commands. The editor is read from `editor.json` by the main process, never from the window (`main.ts:244`). Read.
- The Machine dialog's buttons below a window 900 pixels high come from older code, though this work's row is what pushed them out in the screenshot scene; the orchestrator asked for this judgement. In `night-watch-dark-machine.png` the row "Scrollback lines" takes about 112 px. The dialog's scroll bar shows about 0.89 of its content in view, so about 107 px of content stand past the window. Without the row, the scene's dialog would just fit, which is why the base's run passed (read, measured from the shot). But the dialog's height grows with its lists, the queue of heavy commands and "What ran", which have no bound. A scene with one more such row would have pushed the buttons out at the base too. The page's modal dialog scrolls (the shot shows its scroll bar), and the dialog keeping its scroll between two openings is the `dialog` element's own behaviour, which this work did not touch. So the work owes no fix for it. `gaps.md` keeps the question of opening at the heading for the owner's walk. Phase 3's change to the screenshot run (`c04395be`) is a test of the run and changes nothing a person sees.
- The work item's records, read against the target: `changelog.md`'s list items each match the code (read: `view.ts` `fileOpener`, `linkRows`, `pasteAct`; `work-item-view.ts` `takesPastes`, `menuAct`; `clipboard.ts` `pastedImage`; `menu.ts` `OPEN_ACCOUNTS`). So do `frame/design.md` *Scope* items 1 to 22 and *Data & interfaces*, as folded in `88148160`, `a8ded84b` and `0ac0047e`. This round found no sentence of them the target contradicts, apart from finding 3 and the reading of -1 in finding 1.
- *Record against another work item's frame*: `grep -n -F` of "Memory design", "Screen framework: Electron", "Machine dialog", "Components and their states" and "A pull request that changes the window carries its screenshots" over the other items' `frame/design.md` found only `add` rule changes there (#242 in *Screen framework: Electron*; #214 in the screenshots section). Neither touches a `from:` text this work changes (executed).
- *Figure against its text*: `night-watch-light-find.png` shows the bar over the top right corner of the pane's screen. It holds the field, "Aa", ".*", "1 of 3", the two step buttons and Close. Three matches are outlined, and the newest, on `login.test.ts`, is selected. `desk-dark-app-settings.png` shows the heading "Settings", "Open files in" on "Visual Studio Code", the sentence of *Data & interfaces*, "Cancel" and "Save". `night-watch-dark-machine.png` shows "Scrollback lines" after "Panes side by side" at 5000, with the sentence of *Data & interfaces*. Each matches the rows written in both editions of `docs/design.md` (read).

The test groups were read against each other. No new case covers only what its group already covers. The case "opens a file in the chosen editor by the command inside its bundle" in `openers.test.ts` overlaps the case that hands each editor its arguments, but alone holds the null answer of a person's start. No test file of the diff declares the pairs `seal layout --pairs` would print.

## Not judged

| What | Location | Who answers |
|---|---|---|
| While the bar is open, the add-on searches again 200 ms after the pane stops printing, from the terminal's selection (`SearchAddon.ts:65-73` of 0.16.0). It then replaces a selection the person made in the pane with the nearest match. Phase 2's Departure 6 reads the re-search as finding the same match, which holds only where the selection is still the bar's. Whether a person selecting text around a match while an agent prints should keep their selection is a question of the product, not of the frame | `apps/desktop/src/renderer/work-item-view.ts:581` | the owner's walk of release 0.0.5 |
| Whether Control+V in a Claude Code pane attaches an image on the clipboard (Q3) | `frame/questions.md` Q3 | the owner, at the machine |
| What a real paste holds after a copy in Finder and after a screenshot (Q5), and whether Electron's `clipboard.read()` lists `image/png` for a clipboard that holds a TIFF image alone. Where it does not, the window stops the paste, and the main process answers null, so nothing is pasted and nothing is said | `apps/desktop/src/main/main.ts:67-75`, `apps/desktop/src/renderer/work-item-view.ts:886-908` | the owner's walk of release 0.0.5 |
| A real editor opening the file at its line and column; the commands of Cursor, Zed and Sublime Text (Q4) | `apps/desktop/src/main/openers.ts:97-104` | the owner's walk; a measurement on a Mac that holds them |
| Whether a person can name an editor outside the list (Q1) | `frame/questions.md` Q1 | the owner |
| Whether the Mac of CI holds an editor of the list, which the built-app case of C1 to C3 needs to run (`it.runIf(EDITORS.length > 0)`) | `apps/desktop/test/terminal-basics.test.ts:284` | the orchestrator, at the pull request's checks |
| The full suite, the repository's typecheck and the broad gate. This round ran no test: the suite stays `unverified`, as the crafter labelled it, and that label is honest (`gaps.md` *Not verified*, first row) | the whole tree | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `git grep -n -F -e "<each from: text>" -- docs/architecture.md` and `docs/architecture.ko.md`, six runs | exit 0 for each of the six |
| `git grep -n -e 'bufferChars' -- apps/desktop`; `git grep -n -e 'scrollback: 1000' -- apps/desktop/src` | exit 1 with no line; `apps/desktop/src/renderer/sign-in-pane.ts:35` alone |
| `grep -F` of each quote of `pr.md` in `frame/design.md` and `frame/questions.md` | 13 of 13 found |
| `git grep -n -F "pasted-image" -- apps/desktop/test` | `apps/desktop/test/terminal-basics.test.ts:1268` and `:1269` alone |
| `git grep -n -F "resultIndex: -1" -- apps/desktop` | `apps/desktop/test/view.test.ts:4168`, `:4170`, `:4171` |
| `git grep -n -F -e "11.8" -e "9.4 MB" -e "12 × 49"` over the work item's records and `apps/desktop/measurements` | `apps/desktop/measurements/memory.md:131`, `frame/design.md:151`, `trail/phases/phase-1.md:68` (and `memory.md:99`, an unrelated 18 MB) |
| `git grep -n -i` on the old facts over `docs`, `README.md` and `apps/desktop/src` | the rows the rule changes name, `apps/desktop/src/main/paths.ts:54` (Finder's act), and the new code |
