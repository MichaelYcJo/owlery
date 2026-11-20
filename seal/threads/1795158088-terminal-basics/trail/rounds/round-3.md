# Review round 3: 1795158088-terminal-basics

```seal
target: 987d4de against release/v0.0.1
```

This round reads the range `a6dd62c..987d4de`. It holds five things. The orchestrator's fold of a rule sentence (`7b427d7`). The framer's fold of phases 3 and 4 into the frame, with its Judgments rows (`54607e9`) and one wording fix (`ca371e6`). The merge of `release/v0.0.1` at `02dea83` (`a7a9dd7`). Phase 3, `c6ff5c9` to `a471cc8`. The orchestrator's fold of the five statements phase 3 named (`987d4de`). The base is now `release/v0.0.1` at `02dea83`, which is the branch's merge base with it. Phase 3 is a build phase, so its units were reviewed as new code on every axis. Round 2's one finding, closed `fixed de70c50` before this range, is answered as a verifying round answers it.

The records read whole at `987d4de`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-3.md`, and `trail/rounds/round-1.md` and `round-2.md`. `pr.md` does not stand yet. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. The statements of the frame about *Scope* items 16 to 19 describe phase 4, which is not built, and were not read as contradicted by the target.

Facts carried from rounds 1 and 2 and not established again: where `renderer.ts` registers `onCommandKey` on the capture phase, what `closePane` and `closeFront` are for, and what the debugging port sends past the system's menu. Each verdict below was reached again at `987d4de`.

The axes walked were the table's ten and five of this change's own. The first is a link on the disk: whether the act Finder is asked for reads the link or what it leads to. The second is the card's place, from the row's height, the pointer and the card's own size. The third is the order of the card's timers against the terminal's `hover` and `leave` and the card's own `mouseenter` and `mouseleave`. The fourth is which clipboard a start reaches, and whether issue #93's channel of the same name still fits. The fifth is what a merge resolved as a union may have dropped from either side.

## Findings

### 1. A Command click on a link to an app's bundle opens it, and so starts the app, where the link's own name holds no dot

```seal
severity: should
location: `apps/desktop/src/main/paths.ts:82-89`, `apps/desktop/test/paths.test.ts:139-145`, `seal/threads/1795158088-terminal-basics/frame/design.md:111`
evidence: read `apps/desktop/src/main/paths.ts:10-18`, `apps/desktop/src/main/paths.ts:59-62`, `apps/desktop/src/main/paths.ts:82-89`, `apps/desktop/src/main/main.ts:39-50`, `seal/threads/1795158088-terminal-basics/frame/design.md:89`, `seal/threads/1795158088-terminal-basics/frame/design.md:111`, `seal/threads/1795158088-terminal-basics/changelog.md:9`, `seal/threads/1795158088-terminal-basics/trail/phases/phase-3.md:26`, `apps/desktop/test/paths.test.ts:16`, `apps/desktop/test/paths.test.ts:53-55`
```

Why it matters: the frame shows a bundle selected and never opens it, because "a bundle is a folder, and opening one starts an app that a pane's output named" (`frame/design.md:89`). `changelog.md:9` tells the person the same: a folder whose name holds a dot, "such as an app's bundle: that one is shown selected". `showInFinder` decides the act from three inputs, and they do not read the same thing. `kindAt` reads the disk through `stat` (`paths.ts:12`), which follows a link, so a link to a folder is a folder. The `.git` test at `:87` joins onto the link's path, which `stat` also follows. The name handed to `finderAct` at `:88` is `basename(whole)`, the link's own name. A pane that prints `/tmp/calc`, where `calc` is a link to `/System/Applications/Calculator.app`, therefore gets the act `open`. `main.ts:44-48` then hands `/tmp/calc` to `shell.openPath`. The phase record names the link reading as a decision (`phase-3.md:26`: "`paths.ts#standsAt` reads a link as what it leads to"), and only the name stays the link's.

The act this round read; what macOS does with that call was not run. `shell.openPath` goes to the system's launcher, and that this launcher follows the link to the bundle and starts the app is a recollection this round did not run (see `## Not judged`). Either way, the code does not do what the frame and the changelog say: it hands a bundle to `openPath`. Rule 12's class was listed by taking `finderAct`'s inputs apart: the name reads the link, while whether it is a folder and whether it is a checkout read what the link leads to. The name is the one input that reads something else. A link whose own name holds a dot and that leads to a plain folder is the same defect in the harmless direction: it is selected where the folder would be opened.

`paths.test.ts:16` makes a link to a folder, and `:53-55` reads it through `standsAt` alone. No case of `showInFinder` hands it a link. The case below belongs in `describe("showInFinder")`, after the case at `:139-145`, and is the regression test this finding owes. Contract rule 15: it is shown red against `987d4de`, where `opened` holds the link.

`apps/desktop/src/main/paths.ts`, the import at line 4 and lines 75 to 89. No precondition beyond what `kindAt` has: `realpath` follows every link on the path, and fails where the path went away after `kindAt` read it, and then nothing is shown.

```ts
import { realpath, stat } from "node:fs/promises";
```

```ts
/**
 * Has `finder` show a path a person chose in a pane, and answers whether it
 * was shown. The disk is read again here, since the path comes from the
 * window: nothing is shown where the path is no text, does not open with
 * `/`, or has neither a file nor a folder at it. A link is read as what it
 * leads to, its name too, so a link to an app's bundle is a bundle. The act
 * is `finderAct`'s, and it is handed the whole path.
 */
export async function showInFinder(path: unknown, finder: Finder): Promise<boolean> {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  const whole = resolve(path);
  const kind = await kindAt(whole);
  if (kind === null) return false;
  const real = await realpath(whole).catch(() => null);
  if (real === null) return false;
  const checkout = kind === "folder" && (await kindAt(join(real, ".git"))) !== null;
  return finder[finderAct(basename(real), kind === "folder", checkout)](whole);
}
```

`apps/desktop/test/paths.test.ts`, one line after line 16, and one case after line 145:

```ts
symlinkSync(join(base, "Thing.app"), join(base, "link-to-thing"));
```

```ts
  it("reads a link by what it leads to, its name too: a link to a folder named as a bundle is selected", async () => {
    const { selected, opened, finder } = noting();
    expect(await showInFinder(join(base, "link-to-thing"), finder)).toBe(true);
    expect({ selected, opened }).toEqual({ selected: [join(base, "link-to-thing")], opened: [] });
  });
```

The snippet stops at the code and its case. *Scope* item 14 (`frame/design.md:111`) says "a folder whose name holds a dot". The fix pass owes it the words that the name is that of what a link leads to, so the item states what the code then does. `changelog.md:9` and the `to` lines of *Rule changes* state the outcome, that a bundle is shown selected, and the fix makes that true without a change to them.

```seal
verdict: fixed 4eceb2c
answer: The finding holds. The snippet was read against `frame/design.md` *Scope* item 14 and against each input `showInFinder` hands `finderAct`: whether a folder stands there and whether it is a checkout both read what a link leads to, and the name alone read the link. `4eceb2c` takes the name from `realpath`, as the snippet does, and still hands the act the link's own path. The case is in the pass's own words, because it also reads the other direction the finding names: a link whose own name holds a dot and that leads to a plain folder is opened. It was seen red at `2a4493d` before the code, with the two paths in each other's place. `f5df7d4` then follows the links before `kindAt` reads the disk, because a mutant without the snippet's `real === null` line passed every case; a link that leads nowhere and `/dev/null` each have a case now, and four mutants of the unit are red at `f5df7d4`. One line stays unwatched by any case: without `if (real === null) return false`, `kindAt` fails on the null inside its own `try` and answers the same. The words the finding says *Scope* item 14 is owed are not written: `frame/design.md` is not a file the crafter writes, and the hand-back names the sentence for the orchestrator to fold. What macOS does with `shell.openPath` on a link was not run.
```

### 2. The rule the settle writes into `docs/architecture.md` says a Command click on a path shows it in Finder, and on another work item's worktree it puts that view in front

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/frame/design.md:220`, `seal/threads/1795158088-terminal-basics/frame/design.md:232`
evidence: read `seal/threads/1795158088-terminal-basics/frame/design.md:109`, `seal/threads/1795158088-terminal-basics/frame/design.md:220`, `seal/threads/1795158088-terminal-basics/frame/design.md:232`, `apps/desktop/src/renderer/view.ts:656-669`, `apps/desktop/src/renderer/view.ts:680-685`, `apps/desktop/src/renderer/work-item-view.ts:141-146`, `apps/desktop/test/terminal-basics.test.ts`, the case "puts another work item's view in front at a click on its worktree with the Command key held"; executed `git grep -n -i "in Finder" HEAD -- seal/threads/1795158088-terminal-basics apps/desktop/src`
```

Why it matters: the first rule change's `to` line says "A path a pane prints is a link only where the main process finds a file or a folder at it. A click on it with the Command key held shows it in Finder" (`frame/design.md:220`). The Korean line at `:232` says the same: "Command 키를 누른 채 클릭하면 Finder에서 보여 줍니다." *Scope* item 12 (`:109`) and the code say otherwise for one kind of path. `LINK_ROWS.workItem` gives the click with the key the act `workItem` (`view.ts:661-664`), `linkClick` answers it (`:680-685`), and `act` puts that work item's view in front (`work-item-view.ts:144`). Scenario 20's case clicks the second work item's worktree with the Command key and reads the second view in front and nothing handed to the opener. The settle writes the `to` line into `docs/architecture.md` *Screen framework: Electron*, a policy document that outranks the code. A later round that reads the code against that sentence would then find the work item's click a violation. The search over the thread and `apps/desktop/src` lists every other statement of what that click does: `changelog.md:9-10` names the worktree's click in its own item, and `frame/design.md:109` and `:110` state it as the code does. The two `to` lines are the ones that leave it out.

`seal/threads/1795158088-terminal-basics/frame/design.md`, the sentence in the `to` line at 220:

```md
A click on it with the Command key held puts the view of another work item in front where the path is that work item's worktree, and shows it in Finder otherwise: a file is shown selected in its folder and is never opened in an app, and a folder is opened unless its name holds a dot and it is no checkout.
```

The same, the sentence in the `to` line at 232:

```md
Command 키를 누른 채 클릭하면, 다른 작업의 worktree는 그 작업의 화면을 앞으로 가져오고, 그 밖의 경로는 Finder에서 보여 줍니다.
```

### 3. The fold says `chooseOpener` is called after the disk is read, and `main.ts` calls it once when it loads; `gaps.md` quotes the design's words from before the fold

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/frame/design.md:203`, `seal/threads/1795158088-terminal-basics/gaps.md:34`
evidence: read `seal/threads/1795158088-terminal-basics/frame/design.md:203`, `seal/threads/1795158088-terminal-basics/gaps.md:34`, `apps/desktop/src/main/main.ts:30`, `apps/desktop/src/main/main.ts:39-50`, `apps/desktop/src/main/paths.ts:71-73`, `apps/desktop/src/main/paths.ts:82-89`, `seal/threads/1795158088-terminal-basics/trail/phases/phase-3.md:15`; executed `git show 987d4de -- seal`
```

Why it matters: `987d4de` rewrote the sentence of *Data & interfaces* at `frame/design.md:203` to "`paths.ts#chooseFinder` chooses each act of Finder through `apps/desktop/src/main/links.ts#chooseOpener`, called once for each act, after the disk is read and before the act is chosen". At the target, `main.ts:39` calls `chooseFinder` once, at the module's load, and `chooseFinder` calls `chooseOpener` for both acts then (`paths.ts:71-73`). The disk is read later, at each request, in `showInFinder` (`paths.ts:85-87`). So `chooseOpener` is called before any disk is read. What phase 3 reported (`phase-3.md:15`) is that the act is chosen after the disk is read, which is why both acts need the named program. The fold put that order on `chooseOpener` instead.

`gaps.md:34` still says "`frame/design.md` *Data & interfaces* has it called once more, with Finder's two acts as its system opener". That was the design's sentence before `987d4de`. At the target the design no longer says it, so the bullet cites words that no longer stand at its coordinate.

`seal/threads/1795158088-terminal-basics/frame/design.md`, the last two sentences of line 203:

```md
`paths.ts#chooseFinder` chooses each act of Finder through `apps/desktop/src/main/links.ts#chooseOpener`, called once for each act when `main.ts` loads. `paths.ts#showInFinder` chooses which act to call only after it has read the disk, so a program named in `OWLERY_OPENER` stands in for either act. `chooseOpener` itself is not changed but for its comment.
```

`seal/threads/1795158088-terminal-basics/gaps.md`, the bullet at line 34:

```md
- **`links.ts#chooseOpener` was not given a second kind of opener.** `paths.ts#chooseFinder` calls it once for each of Finder's two acts when `main.ts` loads, as `frame/design.md` *Data & interfaces* states. The disk is read before the act is chosen, so the program `OWLERY_OPENER` names has to stand in for either act. `chooseOpener` itself is unchanged.
```

### 4. The changelog says the card shows under the link, and at the window's foot it shows above it

```seal
severity: should
location: `seal/threads/1795158088-terminal-basics/changelog.md:11`
evidence: read `seal/threads/1795158088-terminal-basics/changelog.md:11`, `apps/desktop/src/renderer/work-item-view.ts:193-197`, `seal/threads/1795158088-terminal-basics/frame/design.md:110`, `apps/desktop/test/terminal-basics.test.ts`, the case "shows the card above a link that stands at the foot of the window, where no room is under it"
```

Why it matters: `changelog.md:11` tells a person "It shows after a moment, under the link". `showCard` puts the card above the row where the window has no room under it (`work-item-view.ts:197`). `987d4de` folded that departure into *Scope* item 13 (`frame/design.md:110`), and a case of the built app reads it. The pane's newest output stands on its last rows, so that is where a person most often meets the card above its link. The fragment is what the release notes are built from.

`seal/threads/1795158088-terminal-basics/changelog.md`, the second sentence of line 11:

```md
It shows after a moment, under the link, or above it where the window has no room under it, with the whole address or path and a row for each thing you can do: "Open in browser" and "Copy link" for an address, "Show in Finder" and "Copy path" for a path, "Open work item" and "Open in Finder" for another work item's worktree.
```

```seal
verdict: fixed 204639d
answer: The finding holds. The sentence was read against `work-item-view.ts#showCard`, which puts the card above the row where the window has no room under it, and against the case "shows the card above a link that stands at the foot of the window, where no room is under it". `204639d` applies it to `changelog.md:11` as written. The same commit rewrites the last sentence of that line for the change `frame/plan.md` *Phases* assigns to this pass: the card stays at a press of the Command, Shift, Control or Option key by itself.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `de70c50` applies round 2's comment to `takesDrops` (`apps/desktop/src/renderer/work-item-view.ts:302-305`). It names `navigateOnDragDrop` being `false` as what stops a drop's navigation, and not the guard. `main.ts#createWindow` still sets no such option, and `electron.d.ts:20450` still has the option (executed: `grep -n navigateOnDragDrop` over `main.ts`, `work-item-view.ts`, `gaps.md` and the typings). `gaps.md:30` gives Electron's default as the ground and says the guard is not it. `gaps.md:14` is the new row of *Not verified*, and it cites round 2 for the one run with the option on. `7b427d7` then stopped the rule's `to` line from deriving a drop's outcome from the guard: `frame/design.md:220` now says "the window does not navigate on a drop", and `:232` says the same in Korean. No unit `de70c50` changed was changed again in this range in a way that undoes it (read).

What matched: the merge `a7a9dd7` dropped nothing from either side. For each side, the lines that side changed against `85c381a` were compared, sorted, with the lines the merge changed against the other parent. The only lines that differ are the comments at the top of `main.ts` and `ipc.ts` and the import line of `work-item-view.ts`, each written as a union of both sides' words (executed: `git diff -U0` four times over `apps`, then `diff` of the sorted line sets). By reading, the joins also meet: `renderer.ts:413` hands `initView` the `openView` that issue #31's work gave an optional pane, and `work-item-view.ts:695` takes it as `(workItemId: number) => void`.

What matched: issue #93's channel. `ipc.ts` at the target has `copyText: "owlery:copy-text"` and `copyText(text: string): Promise<void>`. #93's branch at `45fc971` has the same name at its `ipc.ts:20` and the same signature at `:55` (executed: `git show feat/93-a-work-item-cannot-be-renamed-archived-or-deleted:apps/desktop/src/shared/ipc.ts`). The two handlers then meet in `main.ts`, which `frame/plan.md` *Overlap with the release*, row #93, leaves to #93's merge.

What matched: a start in the background never reaches the system's clipboard. `chooseClipboard` (`apps/desktop/src/main/clipboard.ts:19-35`) holds its own text where `background` is true and never calls `system`. `main.ts:51` hands it Electron's `clipboard`, and the two handlers at `main.ts:110-111` reach only `held`. No module under `apps/desktop/src` other than `clipboard.ts` and `main.ts` names the clipboard. Electron 45.3.3's `readText` and `writeText` answer by promise (`electron.d.ts:7465` and `:7475`), as phase 3's departure says (read, and executed: `test/clipboard.test.ts` below).

What matched: *Scope* items 10 and 11 against `paths.ts` and `view.ts`. `standsAt` reads a text from `/` as it stands, from `~/` against the home folder, and any other from a worktree only where one is named and is a whole path (`paths.ts:30-39`). A text such as `~notes/a` is read from the worktree, and `..` that leaves the worktree is resolved and read like any other path. The design asks for nothing more there. `pathCandidates` (`view.ts:614-628`) cuts quotes, brackets, closing punctuation and `:12:5`, and leaves out a run of slashes, dots and tildes alone, which is the fold's wording at `frame/design.md:107`. `webTarget` and `pathTarget` hold item 11's three targets. The window sends the main process only what the main process answered: `act` hands `showInFinder` and `copyText` the `path` that `pathsOf` gave (`work-item-view.ts:141-146`, `:278-292`). So a pane cannot make the main process show a path it did not print, beyond how `..` and `~/` resolve (read).

What matched: *Scope* items 12, 13 and 15 against the code. `linkClick` and `linkCard` read the one table `LINK_ROWS` (`view.ts:656-669`). The card shows 300 milliseconds after `hover` and leaves 200 milliseconds after the pointer is on neither the link nor the card (`work-item-view.ts:78-79`, `:154-166`, `:201-211`, `:700-701`). It leaves at once at any key and at any press outside it, through two listeners on the document's capture phase (`:712-719`). A press on it keeps the keyboard where it was, because its `mousedown` default is stopped (`:703`). Phase 3's cases read the keyboard still in the pane after a row is pressed. The `removes` row 2 holds: `linkOpens` and its cases are gone (executed: `git grep -n linkOpens HEAD -- apps` printed nothing).

What matched: the five statements `987d4de` folded, except the one of finding 3. Item 10's wording on slashes, dots and tildes matches `view.ts:623`. Item 13's "or above it" matches `work-item-view.ts:197`. Item 15's promise matches `clipboard.ts:6-9`. *Data & interfaces* naming `webTarget` and `pathTarget` matches `view.ts:637-652`. `frame/plan.md` *Phases* row 3, "the new functions", matches the five functions. `ca371e6`'s Judgments row says phase 2's link handling is where a click is read, and that a path needs a provider of its own. That is what `work-item-view.ts:149-151` and `:252-294` do (read).

What matched: phase 3's counts and runs. `test/view.test.ts` holds 27 new cases, `test/paths.test.ts` 33 and `test/clipboard.test.ts` 5, as `phase-3.md:44-45` says (read). The four files of the main process and the view ran green at the target, with 320 cases (executed: the run below). No commit after `fe75f53` changes a file under `apps` (executed: `git diff --stat fe75f53 987d4de -- apps` printed nothing).

What matched: `gaps.md`. Every row of *Not verified* that stood at `a6dd62c` still stands, so no row left (executed: `git diff a6dd62c 987d4de -- seal/threads/1795158088-terminal-basics/gaps.md`). Its new rows say what phase 3 left unrun, each with an answerer. The *Not done* bullet on a dialog holds by reading. The page's two `showModal` calls (`renderer.ts:212` and `work-item-view.ts:534`) are reached only from a key, a click, or a folder picked after a click (`sidebar.ts:57-63`), and each of those passes the listeners at `work-item-view.ts:712-719` first.

Two gaps in phase 3's cases are named here and are no findings. The cases read that the card is not shown at once and that it does not leave at once. No case pins the 300 and the 200 milliseconds, which stand as two named constants at `work-item-view.ts:78-79`. The comment on `OwleryApi.showInFinder` (`apps/desktop/src/shared/ipc.ts:56`) says "a folder opened", and a folder named as a bundle is selected.

The suite's label is honest. `gaps.md:7` names the suite, the typecheck and the `Broad gate` command of `seal/config.json` as the orchestrator's. It adds that a merge breaks outside what a phase edits. This round ran none of the three, and started no app. Once the four findings are closed, what comes due is a verifying round over the fix pass and then phase 4's build. The orchestrator's broad run and the sealer come after the last phase's rounds.

The chain check over this worktree printed no notice at `frame/design.md`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether `shell.openPath` on a link to an app's bundle starts the app on macOS. Finding 1 rests on the act the code chooses, which was read. The launcher's handling of a link was not run, since no probe may open Finder or start an app on the owner's screen | `apps/desktop/src/main/main.ts:44-48` | The owner's hand run of `frame/questions.md` Q5, if finding 1 is not fixed. The fix makes it moot |
| Whether the card stands apart from its row after a narrower card. `showCard` measures the card before it sets the new left edge (`work-item-view.ts:193-195`), so the width and height it reads are those at the last card's place. Where that place was narrower, the new card renders wider and lower than it was measured. Above a row at the window's foot it then stands with a gap under it. Read and not run | `apps/desktop/src/renderer/work-item-view.ts:193-197` | The orchestrator, who decides whether a start of the app is worth a probe of it |
| The built-app cases at the target. Phase 3 ran `test/terminal-basics.test.ts` and the boundary run at `fe75f53`, and only records changed after it. This round started no app | `seal/threads/1795158088-terminal-basics/gaps.md:7` | The orchestrator, in the broad run after the review rounds settle |
| Whether a held Command+W should close one pane or several, carried from round 1 unchanged | `apps/desktop/src/renderer/renderer.ts:127-135` | The owner, at the hand run of `frame/questions.md` Q4 |
| The suite, the typecheck and the broad gate at the head of the branch | `seal/threads/1795158088-terminal-basics/gaps.md:7` | The orchestrator, in the broad run after the review rounds settle |

## Probes

No probe file was written. The commands below ran in the branch's worktree, and the test run in `apps/desktop`.

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/paths.test.ts test/clipboard.test.ts test/view.test.ts test/links.test.ts` | Exit 0: 4 files and 320 cases passed |
| `git diff -U0 85c381a 54607e9 -- apps` against `git diff -U0 02dea83 a7a9dd7 -- apps`, and `git diff -U0 85c381a 02dea83 -- apps` against `git diff -U0 54607e9 a7a9dd7 -- apps`, each as sorted changed lines through `diff` | Only the union-written comments at the top of `main.ts` and `ipc.ts` and the `./view` import line of `work-item-view.ts` differ |
| `git show feat/93-a-work-item-cannot-be-renamed-archived-or-deleted:apps/desktop/src/shared/ipc.ts`, searched for `copy` | `copyText: "owlery:copy-text"` at line 20, and `copyText(text: string): Promise<void>` at line 55 |
| `git grep -n linkOpens HEAD -- apps` | Nothing printed |
| `git diff --stat fe75f53 987d4de -- apps` | Nothing printed: only the work item's records changed after phase 3's last case |
| `git grep -n -i "in Finder" HEAD -- seal/threads/1795158088-terminal-basics apps/desktop/src` | The two `to` lines at `frame/design.md:220` and `:232` are the only statements of a Command click on a path that leave out another work item's worktree |
| `python3 skills/code-review/scripts/chain_check.py --baseline 02dea83 --root <the worktree> --worktree`, before the record was written | Exit 0. It named round 2's finding 1 as owed a verifying round, and printed no notice at `frame/design.md` |
