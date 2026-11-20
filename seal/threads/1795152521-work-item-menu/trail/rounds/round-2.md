# Review round 2: 1795152521-work-item-menu

```seal
target: a5b8dd1 against release/v0.0.1
```

The round reads three things at `a5b8dd1`. The first is the fix pass of round 1: `6f7a15c`, `749af84` and `8a27255`, with the close blocks committed at `7154a17`, and the framer's `e0cc7bf`, which finding 2's close names. The second is phase 2 of `frame/plan.md` *Phases*: the code of `64c9d05` to `6d9246a` and its record in `a6ff91f` (`trail/phases/phase-2.md`, `gaps.md` and the plan's status cell). The third is the frame folds `e0cc7bf`, `ad2f240` and `a5b8dd1`, read against issue #93 and its three comments of 2026-11-20. Phases 3 to 6 are not built, and their absence is no finding. `seal/parity.json` does not exist, so no comparison with an original was owed.

Read whole at `a5b8dd1`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `trail/phases/phase-1.md` in the lines the fix pass changed, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. No `changelog.md`, `pr.md` or `pr.en.md` stands yet; the fragment is phase 6's.

Carried from round 1, and not searched again: where a folder's repository is read (`apps/desktop/src/daemon/worktrees.ts`, `repositoryOf`), the three refusals of a relative folder, and the list of test files that start the built app. Each verdict below was reached again at `a5b8dd1`. The list of built-app files was run again with `git grep` because phase 2 added one.

## Findings

### 1. A press inside an open menu that lands on no item leaves the menu deaf to Escape and to the arrows

```seal
severity: should
location: `apps/desktop/src/renderer/menu.ts:71`, `apps/desktop/src/renderer/menu.ts:90`, `apps/desktop/src/renderer/index.html:359`, `apps/desktop/test/work-item-menu.test.ts:142`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_menu_gap.test.ts` from `apps/desktop` (exit 0, see `## Probes`); read `apps/desktop/src/renderer/menu.ts:20-41`, `apps/desktop/src/renderer/menu.ts:64-99`, `seal/threads/1795152521-work-item-menu/frame/design.md:84`
```

Why it matters: `frame/design.md:84`, *Scope* item 5, says "Escape closes the menu and returns the keyboard to where it was". After one press inside the menu that misses an item, Escape no longer closes it. The window also reads none of its own keys while the menu is open. So J, K, M and the Command keys do nothing either, and only a press outside the menu ends it.

The grounds. `apps/desktop/src/renderer/menu.ts:90` reads the menu's keys in a listener on the menu element. A key reaches that listener only while the keyboard is on an element inside the menu. The menu element itself cannot take the keyboard: it has no `tabIndex`, and neither has the rule between two parts. A press on either of those makes Chromium take the keyboard to the page's body. `onPress` (`:39`) sees that the press was inside the menu and leaves it open. From then on no key reaches `onKey`. The probe showed this in the built app: before the press the keyboard was on "Rename". The press at the middle of the rule hit the element with the role `separator`. After it, `document.activeElement` was the body, and the menu was still drawn 500 ms after Escape. The gap is easy to hit, because the rule's margins make it `var(--space-2)` tall on each side, between Copy branch name and Pin among other places.

The phase's account names the menu's rules (`trail/phases/phase-2.md`, *The menu's own rules*). It says nothing of a press inside the menu on no item. No case of `apps/desktop/test/work-item-menu.test.ts` presses there.

The fix makes the menu element take the keyboard, so a press on no item puts the keyboard on the menu, where `onKey` still reads it. `onKey`'s arrows then start from the first item, since `indexOf` gives -1 for the menu itself.

```ts
// apps/desktop/src/renderer/menu.ts:71, after the menu's label
// A press inside the menu that lands on no item, on a rule or on the menu's edge, puts the keyboard on the menu itself, where its keys are still read. Without it the keyboard falls to the page's body, and Escape no longer closes the menu.
menu.tabIndex = -1;
```

```css
/* apps/desktop/src/renderer/index.html:359, beside the rule of .menu: the menu itself draws no ring when it takes the keyboard */
.menu:focus { outline: none; }
```

```ts
// apps/desktop/test/work-item-menu.test.ts, a case after the one at :142
it("keeps the keyboard in the menu after a press inside it on no item, its rule, so Escape still closes it", async () => {
  await rightPress(line(SIDEBAR, 1));
  await menuShown();
  const at = await middleOf(`document.querySelector('${MENU} [role="separator"]')`);
  await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
  await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
  expect(await value<boolean>(`document.activeElement?.closest('${MENU}') != null`)).toBe(true);
  await escape();
  await menuGone();
});
```

The snippet leaves two statements for the fix pass. The docstring of `onPress` (`menu.ts:38`) says the press goes on to what it was made on; it then also says that a press inside on no item keeps the keyboard in the menu. The bullet *The menu's own rules* of `trail/phases/phase-2.md` names the menu's rules and owes the same sentence.

```seal
verdict: fixed 81839c2
location: `seal/threads/1795152521-work-item-menu/trail/phases/phase-2.md`
answer: The finding holds, and the fix is the proposed one: the menu element takes the keyboard (`menu.tabIndex = -1`) and draws no ring when it does. The case is the proposed one with one more step, an ArrowDown after the press, which puts the keyboard on "Rename". Against the code without the fix it failed on the keyboard's place, "expected false to be true", in one start of the built app, and the other eight cases of the file passed. With the fix the nine pass. That red run is the tree a mutant of the one new line would be, so no `seal mutate` run, which is two more starts, was made for it. The docstring of `onPress` says the new rule. The bullet *The menu's own rules* of `trail/phases/phase-2.md` says it too, in `3cd4b24`, which is why this block names that path.
```

### 2. The main process opens any absolute path in Finder, so a path to an app's bundle or a file opens an app not of its list

```seal
severity: should
location: `apps/desktop/src/main/openers.ts:64`, `apps/desktop/src/main/openers.ts:54-61`, `apps/desktop/src/main/main.ts:83`, `apps/desktop/test/openers.test.ts:86`
evidence: read `apps/desktop/src/main/openers.ts:62-73`, `apps/desktop/src/main/main.ts:27-35`, `apps/desktop/src/main/main.ts:83`, `apps/desktop/src/preload/preload.ts:29`, `seal/threads/1795152521-work-item-menu/frame/design.md:86`; executed `git grep -n -e innerHTML -e insertAdjacentHTML -- apps/desktop/src/renderer` (no line)
```

Why it matters: `frame/design.md:86`, *Scope* item 7, says "The main process opens only an app of its list" and "The folder is a work item's worktree or a repository's folder." The main process is where that rule can hold, because the window that sends the folder is a process boundary away. As built, it holds for the apps of the list and not for Finder.

The grounds. `apps/desktop/src/main/main.ts:83` hands the window's `folder` to `openFolder` unread. `apps/desktop/src/main/openers.ts:63` refuses a folder that is no string or is not absolute, and `:64` then hands every other path to `shell.openPath` when no app is named. Electron's `shell.openPath` opens a path in the application the system gives it. A path to a file opens that file's app. A path to a `.app` bundle starts that app, though a bundle is a folder on disk. So `openFolder("/Applications/Calculator.app", null)` starts an app that `KNOWN_APPS` does not hold. This was read, not run: no case may open an app on the owner's Mac. The phase's account (`trail/phases/phase-2.md`, *What the main process refuses*) names the dash and the unknown app, and says nothing of a path that is not a folder.

Who can reach it: today only the window's own code sends the channel. It sends a work item's `worktree` (`apps/desktop/src/renderer/view.ts`, `workItemMenu`), and the renderer writes no HTML from data (the search above). So the gap matters only once the window sends a wrong path, through a defect or through code injected into the page. The main process's own guards are written for that case. The absolute-path guard has the same precondition.

The fix holds the folder to what the frame names. A work item's worktree and a repository's folder each hold `.git` at their top: a file in a linked worktree, a folder in a main checkout (a bare main checkout is refused by *Scope* item 3).

```ts
// apps/desktop/src/main/openers.ts:63-64, in openFolder
if (typeof folder !== "string" || !isAbsolute(folder)) return "A folder is opened by its whole path.";
// The folder is a work item's worktree or a repository's folder (frame/design.md Scope item 7), each with `.git` at its top. Any other path is opened nowhere: Finder would open a file, or an app's bundle, in the app the system gives it, which is no app of the list.
// Precondition: `exists` follows a symlink at the path, as `existsSync` does.
if (!openers.exists(join(folder, ".git"))) return "Owlery opens a work item's folder or a repository's folder, and nothing else.";
if (app === null) return (await openers.openPath(folder)) || null;
```

The snippet changes a sentence a person reads in the status line, so the fix pass owes a case that pins it in `apps/desktop/test/openers.test.ts`, by contract rule 14: an absolute path with no `.git`, in Finder and in an installed app, opened nowhere and answered with the sentence. The existing cases hand `mac()` the bundles alone, so each that expects a folder to open, and the case at `:77` whose refusals of an app come first, owes the `.git` path of its folder in that list. The snippet also leaves the docstring of `openFolder` (`openers.ts:54-61`), the doc of `OwleryApi.openFolder` in `apps/desktop/src/shared/ipc.ts` and the bullet *What the main process refuses* of `trail/phases/phase-2.md`. Each states what the main process refuses, and each owes the new refusal.

```seal
verdict: fixed 9664a0b
location: `apps/desktop/src/shared/ipc.ts`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-2.md`
answer: The finding holds. `openFolder` opens a path only where `.git` stands at its top, in Finder and in an app, and answers any other with the proposed sentence. The fix is in the fix pass's own words in one point: a path nothing stands at is answered first, with "<folder> is gone.". A person can remove a worktree's folder by hand, and the proposed sentence alone would tell that person that Owlery opens no such folder. `apps/desktop/src/main/main.ts` is unchanged, since it already hands `existsSync` in. Two new cases of `apps/desktop/test/openers.test.ts` pin the two sentences, and failed against the code before the fix on "expected null to be" each sentence. Three mutants of the two refusals are red (`seal mutate`, exit 0). The cases that expect a folder to open now hand a worktree and a repository's folder with their `.git`. The docstring of `openFolder`, the doc of `Openers.exists` and the doc of `OwleryApi.openFolder` in `apps/desktop/src/shared/ipc.ts` state the refusal, and so does the bullet *What the main process refuses* of `trail/phases/phase-2.md`, in `3cd4b24`. This block names those two paths because the finding's own line does not. That Finder starts an app for a bundle's path was read by the round and run by nobody, and the fix was run against a disk the cases made up alone.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `seal/threads/1795152521-work-item-menu/gaps.md:26` now says "no entry can be removed before phase 3" and cites `frame/plan.md` *Phases* row 3. The bullet of `trail/phases/phase-1.md` names phase 3 and what a reused id would break, a repository's id and the window's fold among it. `frame/plan.md:79`, row 3, holds "the counts that keep an id from being given twice, before the first removal from the store". `git grep -n -i "phase 5" -- seal/threads/1795152521-work-item-menu/gaps.md seal/threads/1795152521-work-item-menu/trail/phases/phase-1.md` printed no line that hands the point to phase 5. Read and executed.

```seal
confirms: round-1#2
```
What holds: `frame/design.md:194` says `done` "answers each of them that has no answer of its own, which is every one but `planRename` and `readLoss`", and names the request `renamePlan` and `workItemLoss` each answer. The code agrees: `apps/desktop/src/daemon/daemon.ts`, the case `planRename`, sends a `renamePlan` and no `done`, and the case of the eight files below holds it (`daemon.test.ts`, "answers a `planRename`", whose message types are four `renamePlan` and two `error`). Read and executed.

```seal
confirms: round-1#3
```
What holds: `6f7a15c` refuses a folder that is not absolute in `addRepository` (`apps/desktop/src/daemon/daemon.ts:308`), and a `repo` that is not absolute in a creation and in a plan (`checkNaming`, `:36`). Each case first stands the suite's process in a temporary repository (`standingIn`), so `"."` and `"src"` name a real repository and the refusal is what stops them. The creation's case also holds that no `owlery/` branch was cut and no repository stored. `8a27255` says the same in the protocol's comments. The bullet of `trail/phases/phase-1.md` reads as round 1 proposed, with the creation and the plan. I ran the cases with the eight files below, exit 0. The `seen red` and the `seal mutate` runs of the close are read, not run again.

What matched: *Scope* items 5 to 11 and 23, walked from the frame to the code. The menu is an element with the role `menu` whose items are `menuitem` buttons (`apps/desktop/src/renderer/menu.ts`). It opens at `contextmenu` on a line of the sidebar or of a list, and never on a line of the summary (`apps/desktop/src/renderer/renderer.ts#lineOf`). It also opens at M alone or F10 with Shift, which are read in no field, no terminal, no open dialog and no open menu (`view.ts#menuKey`, `renderer.ts#onMenuKey`). A work item's items stand in the order of item 6 without the groups, the archive and the delete, as `trail/phases/phase-2.md` reads row 2 (`view.ts#workItemMenu`). The window asks for the installed apps once at load. Copy writes through the main process. A pin stands first in a repository's work items, in the inbox's state group and on the history screen (`view.ts#pinnedFirst`, `sidebarTree`, `historyLines`, `list.ts`). A muted work item raises no notification (`view.ts#notificationFor`). The rename's conditions run in the order item 11 gives (`apps/desktop/src/daemon/worktrees.ts#planBranchRename`). The rename of a branch runs on `Daemon#changing` behind a creation, and a git failure changes neither the name nor the branch. Executed for the functions and the daemon with the eight files below, read for the window.

What matched: the response's shape. `renamePlan` carries `requestId`, `branch` and `blocked`, as `frame/design.md` *Data & interfaces* gives it. `setWorkItem` and `renameWorkItem` are answered with `done` before the `inbox` that carries the change, and with no `inbox` where nothing changed. `setWorkItem` carries no `groupId` yet, which the fold `a5b8dd1` gives to *Scope* item 22. The window is sent each app's name and kind, and never its bundle's path. Read, and executed in `daemon.test.ts`.

What matched: the folds against issue #93. The first comment asks for a short description on hover of every icon-only control and every item of both menus. *Scope* item 24 and scenario 21 hold it, and `frame/plan.md` row 3 builds it. The second and third comments take the sidebar's add-repository button away and keep adding a repository with no work item as a choice in the "New work item" form. *Scope* items 3 and 4, scenario 7 and `## Removes` row 8 hold that. `## Removes` row 8 says `SidebarActions.pickFolder` is called by the button's listener alone. `git grep -n pickFolder -- apps/desktop/src` shows it at `apps/desktop/src/renderer/sidebar.ts:65` alone; the form's own folder button calls `window.owlery.pickFolder` (`renderer.ts:621`), so the channel stays. The Grounding line of the fold names `index.html:410` and `:413` with the titles "Add a repository" and "New work item", and both stand there. The five statements the fold corrected match the code: scenario 7's two work items, item 11's conditions and their order, `setWorkItem`'s `groupId`, `Daemon#changing` and `## Removes` row 5. Read.

What matched: the phase record's runs and claims. Claimed: eight case files, 417 cases, all passed. I ran the same command at `a5b8dd1`: 8 files, 417 passed, exit 0. Claimed: the files of the mutation table did not change between the commit each row names and `6d9246a` but for comments. `git diff` over each pair printed comment lines in `view.ts` and `renderer.ts` alone, and `6d9246a..a5b8dd1` changes nothing under `apps`. The fourteen source files and six test files of the `tsc` claim are the `.ts` files the phase changed. Executed and read.

What matched: the label of the suite. `gaps.md:7` labels the suite, the typecheck and the broad gate as not verified and names the orchestrator. The list of built-app files the phase did not run, at `gaps.md:9`, is whole. `git grep -l -e BuiltApp -e '"./korean-pane"' -e '"./memory"' -e '"./built-app"' -- apps/desktop/test` lists `korean-input.test.ts`, `memory.test.ts`, `work-item-form.test.ts` and `work-item-menu.test.ts` as case files. The phase ran the fourth and the row names the other three. No test file imports a module of the window, the preload or the main process the phase changed, by `git grep`. `gaps.md` loses no row of `## Not verified`: the diff of `a6ff91f` rewrites three rows in place and adds eight.

What matched: the twelve mutants of the window's modules, read and not run. `trail/phases/phase-2.md` names what each breaks, and each has an assertion in `apps/desktop/test/work-item-menu.test.ts` that the mutant fails on its own line. For `menu.ts`: the first item (`itemInFocus` "Rename"), the arrows ("Open in Finder" after ArrowDown), Escape (`menuGone`), the press outside (the click on `#inbox-word`), the return of the keyboard and its return to a line drawn anew (the two `activeElement` checks of the F10 case). For `renderer.ts`: the list's keys under an open menu (J leaves the selection on 1), the branch choice sent (the `git branch` list after "Third name"), the late `close` event (the second `renameTo`, whose `says("rename-plan")` waits on the plan), and the close at `done`. For `list.ts`: the inbox's order `[2, 1]` and the marks on the inbox's line. A mutant that left the keyboard off the menu also fails every later case, so its red says nothing of which line failed first. The rows' red is sound as a red. Running each of the twelve alone would take twelve starts of the app, and reading answered what they would show. One more point: the late `close` event's red rests on Chromium's timing of that event in a background window, which the phase saw in two runs of two. Its case pins the guard only while the event arrives late.

Not findings, and named here once. `gaps.md:12` asks the owner to press the sidebar's "Add a repository" button, which stands at `a5b8dd1` and which `## Removes` row 8 takes away in phase 3; phase 3 owes the row the word `closed`. `frame/plan.md:115` quotes the owner's "저장소만 등록" and cites issue #93's comments, where the words stand in English, "register the repository only"; the meaning is the same.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck of the whole app and the broad gate. This round ran the eight case files the phase names and one probe of the built app | `apps/desktop` | the orchestrator, at the broad run |
| The three built-app files phase 2 did not run, `work-item-form.test.ts`, `memory.test.ts` and `korean-input.test.ts`, against the window, preload and main process phase 2 changed. This round did not run `work-item-menu.test.ts` either: the claim was read, and `6d9246a..a5b8dd1` changes nothing under `apps` | `apps/desktop/test` | the orchestrator, at the broad run |
| Which line each of the twelve mutants of the window's modules failed on. This round judged by reading that each named rule has its own assertion, and ran none of them | `trail/phases/phase-2.md`, *Each unit that adds behaviour was broken once* | the orchestrator, should it want the lines read at the cost of twelve starts |
| How the menu, the marks of a pin and of a mute, and the rename dialog look when drawn, in the two themes | `apps/desktop/src/renderer/index.html` | the owner, as `gaps.md` names |
| That Finder, an editor and a terminal open a work item's folder, and that the clipboard holds the copied text. No case presses either item | `apps/desktop/src/main/main.ts:83` | the owner, in the hand run of issue #24 |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/repositories.test.ts test/worktrees.test.ts test/view.test.ts test/openers.test.ts test/last-look.test.ts test/names.test.ts test/themes.test.ts`, from `apps/desktop` | 8 files, 417 cases passed, exit 0 |
| `node scripts/test-in-electron.mjs test/test_tmp_menu_gap.test.ts`, from `apps/desktop`, run once: one start through `BuiltApp.start`, under `OWLERY_BACKGROUND=1`, on a temporary clone with one work item. It opened the work item's menu with the right button, pressed the left button at the middle of the menu's first rule, pressed Escape and waited 500 ms. It pressed no "Open in" and no "Copy" item. The file was removed from the tree after the run, and a copy stays in the round's scratch | 1 passed, exit 0. The case asserted that the keyboard was on "Rename" before the press, the press hit the element with the role `separator`, the keyboard was on the body after it, and the menu was still drawn after Escape. A press on `#inbox-word` then closed it |
| `git grep -n -e innerHTML -e insertAdjacentHTML -- apps/desktop/src/renderer` | no line |
