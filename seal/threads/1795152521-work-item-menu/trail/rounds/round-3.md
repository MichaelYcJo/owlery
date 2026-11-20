# Review round 3: 1795152521-work-item-menu

```seal
target: bb7e314 against release/v0.0.1
```

The round reads four things at `bb7e314`. The first is phase 3 of `frame/plan.md` *Phases*: the code of `142ee12` to `285a014` and its record in `0746caf` (`trail/phases/phase-3.md`, `gaps.md` and the plan's status cell). The second is the orchestrator's fold `5b0b595`. The third is the merge `bb7e314` of `release/v0.0.1` at `02dea83`, read as its combined diff. The fourth is the fix pass of round 2, `81839c2` and `9664a0b`, with `3cd4b24`, `761920c` and the fold `734251e`, which no round had read yet and which this round answers under `## Confirmations`. Phases 4 to 6 are not built, and their absence is no finding. `seal/parity.json` does not exist, so no comparison with an original was owed.

Read whole at `bb7e314`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `trail/phases/phase-3.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. `trail/phases/phase-1.md` and `phase-2.md` were read in the lines round 2's fix pass changed. No `changelog.md`, `pr.md` or `pr.en.md` stands yet: the fragment is phase 6's.

Carried from rounds 1 and 2, and not searched again: where a folder's repository is read (`apps/desktop/src/daemon/worktrees.ts`, now `repositoryOf` and `repositoryOfSync`), the list of test files that start the built app, and that the renderer writes no HTML from data. Each verdict below was reached again at `bb7e314`. The last of the three was searched again, because round 2's finding 2 rests on it.

**The start's read of `work-items.json`, which the orchestrator asked this round to judge, is an accepted cost and no finding.** The grounds are these.

- No release shipped `work-items.json`. `git tag --list` printed nothing and `gh release list` listed no release, so the read meets only the run folders of builds made from this repository's branches, the owner's among them.
- A folder git reads costs one `git worktree list` of about 14 ms, and a folder that is gone fails in about 2 ms (`test_tmp_start_read.mjs`, `## Probes`). A store of tens of old folders therefore starts in well under a second, at each start until the first change.
- A folder where git hangs and dies at the signal the timeout sends costs 2 seconds, as `frame/plan.md:29` says. Five of them pass the 10 seconds of `apps/desktop/src/main/daemon-client.ts:42`. The app then says the daemon did not start. The daemon it spawned is detached, keeps starting and writes its discovery file, and the next load finds it. Nothing is written at a start, so nothing is lost.
- The 2 seconds are a bound only for a child that ends at the signal. The probe ran a child that ignores it, and `execFileSync` returned after the child's own 4 seconds, not after 2. A git the kernel holds on a stalled mount may behave that way. `gaps.md` already leaves the measurement on such a folder to the orchestrator, and this probe is its coordinate. The plan's sentence holds as far as anything ran.
- If the orchestrator wants the worst case to stop growing with the count, the daemon's `main.ts` can read the folders with `execFile` in parallel before `new Daemon` and hand the store the answers. The wait is then 2 seconds in all, and the store stays synchronous. That is an option with a cost, not a defect.

**The window's code that phase 3 left unmutated, and the mutant that survived, are no finding.** The ten new cases of `apps/desktop/test/work-item-menu.test.ts` failed against the window of `a7d2f64` (`red-menu.txt`, read in `trail/phases/phase-3.md:66`, not re-run). Each one names a behaviour of *Scope* items 3, 4, 12 to 16 and 24 that the reading above found in its assertion. Three window guards stand that no case can fail on. One is the late-answer guard of `apps/desktop/src/renderer/renderer.ts#answered`, which ignores an answer for a dialog that closed meanwhile. One is the refusal path of `#takeSettingsPlan`. One is the redraw of the removal's dialog when a headless session changes, in `#takeHeadlessSession`. The frame states none of the three, so they are no `should`. The surviving mutant gave a repository's Copy path the description of a work item's. *Scope* item 24 states that a description is a sentence of what a press does, in other words than the label. It states no description's words, so the case of `apps/desktop/test/view.test.ts` "a description on hover" holds what the frame states. The shipped words at `apps/desktop/src/renderer/view.ts`, `repositoryMenu`, are right.

**The change to `test/daemon.test.ts#heldGit` keeps what its three default users hold.** Before phase 3 a creation's first `git worktree` was `git worktree add`, since `repositoryOf` ran `git rev-parse`. Phase 3's `repositoryOf` runs `git worktree list` first. So the old default would hold a creation before it chose its branch, and would hold a plan as well. Holding `worktree add` alone puts the hold where it stood. The three users are "answers a plan while a creation is still under way" (`:585`), the chain of a removal (`:1232`) and the rename behind a creation (`:1494`), whose comment names `git worktree add`. They passed in the run of `daemon.test.ts` below. The narrowing weakens none of them: none of the three ever needed `git worktree list` held.

## Findings

### 1. A folder in a submodule's checkout, or in a repository whose git directory stands apart, names that git directory as the repository

```seal
severity: should
location: `apps/desktop/src/daemon/worktrees.ts:111`, `apps/desktop/src/daemon/worktrees.ts:138`, `apps/desktop/test/worktrees.test.ts:308`, `seal/threads/1795152521-work-item-menu/frame/design.md:74`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_submodule.test.ts` from `apps/desktop` of the round's clone at `bb7e314`, and `sh test_tmp_main_checkout.sh` (see `## Probes`); read `apps/desktop/src/daemon/worktrees.ts:92-146`, `apps/desktop/src/main/openers.ts:70`, `apps/desktop/src/daemon/repositories.ts:336`, `seal/threads/1795152521-work-item-menu/frame/design.md:74`
```

Why it matters: *Scope* item 3 (`frame/design.md:74`) says the repository of a folder is "the top-level folder of its main checkout". It then names the read: "the first worktree `git worktree list --porcelain` prints". The two agree for a plain repository and for a linked worktree. They part where git keeps the checkout's git directory somewhere other than `<checkout>/.git`. There git lists the git directory itself first.

- In a submodule's checkout `super/sub`, git lists `super/.git/modules/sub`.
- In a repository made with `--separate-git-dir`, checked out at `apart`, git lists `apart.git`.

So `repositoryOf` and `repositoryOfSync` give a git directory, and a creation stores its work item under it. The probe ran both reads and a creation at `bb7e314`. Each gave `<base>/super/.git/modules/sub` for the submodule and `<base>/apart.git` for the other. The creation's `repo` was the git directory too.

The diff changed this behaviour. At `95decb6` the read was `git rev-parse --show-toplevel`, which printed `super/sub` and `apart` (the probe printed both). A work item made in a submodule had its checkout as its repository. Now it has the git directory. The start from an old `work-items.json` maps such a `repo` the same way (`repositories.ts:336`).

What a person sees at `bb7e314`:

- The repository's row is named `apart.git` in the second case.
- Copy path on the repository's menu copies the git directory.
- Open in Finder and every Open in item on that menu answer "Owlery opens a work item's folder or a repository's folder, and nothing else." The guard of round 2's finding 2 (`openers.ts:70`) finds no `.git` at the top of a git directory.

What comes next: *Scope* item 16 has phase 5 move "the repository's folder" to the Trash. For a submodule that folder would be `super/.git/modules/sub`, inside the superproject's own git directory, while the checkout stays where it is.

The framer's probe `test_tmp_main_checkout_probe.sh` (`frame/design.md` *Grounding*) tried a main checkout, a linked worktree and a bare repository. It tried no submodule and no separate git directory. The phase built the read the frame names.

The fix asks git first whether the folder is in a linked worktree. `git rev-parse --path-format=absolute --show-toplevel --git-dir --git-common-dir` prints one git directory twice in the main checkout, in a submodule's checkout and in a separate git directory's checkout, and there `--show-toplevel` is the checkout. It prints two git directories in a linked worktree, and only then is the first worktree of `git worktree list` read. A submodule's linked worktree lists a git directory first, with no `.git` at its top, and is refused with a sentence of its own. The round applied this patch in its clone (`fix-read.diff` in the round's scratch). With it, the probe gave `super/sub` and `apart` for both reads and for the creation's `repo`, and refused the submodule's linked worktree. `test/worktrees.test.ts` and `test/repositories.test.ts` passed 70 cases, and the cases of `test/daemon.test.ts` matching "linked worktree|bare repository|repositories" passed 19. Precondition: `--path-format` needs git 2.31 or later. `existsSync` follows a symlink at the path.

```ts
// apps/desktop/src/daemon/worktrees.ts:103-121, in place of repositoryOf and its docstring
/**
 * The repository a folder is inside: the top-level folder of its main
 * checkout. Where the folder is in the main checkout, git names that
 * checkout's folder, though its git directory stands elsewhere, as a
 * submodule's does. Where it is in a linked worktree, the main checkout is
 * the first worktree git lists, so the folder names the repository the
 * worktree belongs to, and never a repository of its own. A folder outside
 * any git repository is refused, and so is a linked worktree whose main
 * checkout is bare, which has no folder to keep, or is a git directory with
 * no checkout git names, as a submodule's linked worktree's is.
 */
export async function repositoryOf(folder: string): Promise<string> {
  let where: string;
  try {
    where = await git(folder, WHERE);
  } catch {
    throw new Error(`${folder} is not inside a git repository`);
  }
  const checkout = checkoutOf(where);
  if (checkout !== null) return checkout;
  let listed = "";
  try {
    listed = await git(folder, MAIN_CHECKOUT);
  } catch {
    // Read as a list that names no worktree.
  }
  return mainOf(folder, mainCheckout(listed));
}

/** What git prints of a folder, a line each: the top-level folder of the checkout it is in, that checkout's git directory, and the repository's common git directory. Git 2.31 or later. */
const WHERE = ["rev-parse", "--path-format=absolute", "--show-toplevel", "--git-dir", "--git-common-dir"];

/**
 * The folder of the main checkout, where `WHERE` printed one git directory
 * twice: a main checkout's, a submodule's checkout's and one whose git
 * directory stands apart among them, which git names by its top-level folder
 * and `git worktree list` by its git directory. Null in a linked worktree.
 */
function checkoutOf(where: string): string | null {
  const [top = "", gitDir = "", common = ""] = where.trim().split("\n");
  return top !== "" && gitDir !== "" && gitDir === common ? top : null;
}

/** The main checkout of a linked worktree, from the first worktree git lists. A bare one, and one git names by a git directory with no `.git` at its top, as a submodule's, is refused. */
function mainOf(folder: string, main: { folder: string; bare: boolean } | null): string {
  if (main === null) throw new Error(`${folder} is not inside a git repository`);
  if (main.bare) throw new Error(`${folder} belongs to a bare repository, which has no checkout to keep`);
  // Precondition: `existsSync` follows a symlink at the path.
  if (!existsSync(join(main.folder, ".git"))) throw new Error(`${folder} is a worktree of a repository whose checkout git does not name`);
  return main.folder;
}
```

```ts
// apps/desktop/src/daemon/worktrees.ts:132-146, in place of repositoryOfSync and its docstring. A linked worktree's folder runs two git commands, and the deadline keeps the wait for the folder to START_READ_MS in all.
/**
 * The repository a folder is inside, as `repositoryOf` reads it, read
 * without a turn of the event loop: the daemon's store reads each folder of
 * `work-items.json` this way at its start, before the daemon listens. Null
 * where `repositoryOf` refuses the folder and where git does not answer
 * within `START_READ_MS` for the folder.
 */
export function repositoryOfSync(folder: string): string | null {
  const until = Date.now() + START_READ_MS;
  const read = (args: string[]): string => execFileSync("git", args, { cwd: folder, encoding: "utf8", timeout: Math.max(1, until - Date.now()), stdio: ["ignore", "pipe", "ignore"] });
  try {
    return checkoutOf(read(WHERE)) ?? mainOf(folder, mainCheckout(read(MAIN_CHECKOUT)));
  } catch {
    return null;
  }
}
```

```ts
// apps/desktop/test/worktrees.test.ts, a case in describe("the repository of a folder") at :308
it("is the checkout's folder where git keeps its git directory elsewhere, a submodule's and one made with a separate git directory, and refuses a submodule's linked worktree, whose checkout git does not name", async () => {
  const made = repository("super");
  const lib = repository("lib");
  git(made.repo, "-c", "protocol.file.allow=always", "submodule", "add", "--quiet", lib.repo, "sub");
  const sub = join(made.repo, "sub");
  const apart = join(made.base, "apart");
  git(made.base, "init", "--quiet", "--initial-branch=main", "--separate-git-dir", join(made.base, "apart.git"), apart);
  for (const folder of [sub, apart]) {
    expect(await repositoryOf(folder)).toBe(folder);
    expect(repositoryOfSync(folder)).toBe(folder);
  }
  expect((await createWorktree({ folder: sub, title: "In the submodule", root: made.root })).repo).toBe(sub);
  const subLinked = join(made.base, "sub-linked");
  git(sub, "worktree", "add", "--quiet", "-b", "side", subLinked);
  await expect(repositoryOf(subLinked)).rejects.toThrow(`${subLinked} is a worktree of a repository whose checkout git does not name`);
  expect(repositoryOfSync(subLinked)).toBeNull();
});
```

The case fails at `bb7e314` on its first assertion: the probe read `super/.git/modules/sub` for `sub`. It pins the new refusal sentence, as contract rule 14 asks.

The snippets leave statements that the fix pass and the orchestrator owe too.

- The comment on `MAIN_CHECKOUT` (`worktrees.ts:92`) says it reads "the main checkout's top-level folder". It now holds for a linked worktree alone.
- *Scope* item 3 (`frame/design.md:74`) names `git worktree list` as the whole read, and gives no sentence for a submodule's linked worktree. That sentence is the orchestrator's fold. A replacement: "The repository of a folder is the top-level folder of its main checkout: the checkout's own top-level folder where the folder is in the main checkout, a submodule's and one whose git directory stands apart among them, and the first worktree `git worktree list --porcelain` prints where the folder is in a linked worktree. A linked worktree whose first listed worktree has no `.git` at its top, as a submodule's linked worktree's has none, is refused with "<folder> is a worktree of a repository whose checkout git does not name"."
- A folder that is a bare repository's own git directory was refused with the bare sentence. With the fix it gets "is not inside a git repository", because `--show-toplevel` fails there. No case sends that folder, and *Scope* item 3 names a bare repository's worktree. The fix pass keeps or words this as it judges.

```seal
verdict: fixed c9b9416
location: `apps/desktop/src/shared/protocol.ts`, `apps/desktop/test/daemon.test.ts`, `seal/threads/1795152521-work-item-menu/gaps.md`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-3.md`
answer: The finding holds. The new case of `apps/desktop/test/worktrees.test.ts` failed against `apps/desktop/src/daemon/worktrees.ts` of `8215272` on its first assertion, where `repositoryOf` gave the submodule's git directory. The fix is in the fix pass's own words in three points. First, where `git rev-parse` fails, the read goes on to `git worktree list` and does not refuse at once. A bare repository's own folder therefore keeps the sentence it had, "belongs to a bare repository, which has no checkout to keep", and a line added to the case of the refusals pins it. Second, the new refusal reads "<folder> is a worktree of a repository whose main checkout git does not name", and the case sends it a linked worktree of a submodule and one of a repository made with `--separate-git-dir`. Third, the read at the daemon's start shares the 2 seconds of `START_READ_MS` between its two commands, as the round's snippet has it and its patch file does not, and a new case in `3dc5367` runs a git that answers nothing and ends at the timeout's signal. Eight mutants of `apps/desktop/src/daemon/worktrees.ts` are red (`seal mutate`, exit 0). The mutant without the shared wait failed on "expected 4004 to be less than 3000", and the mutant that refuses at once failed on the bare folder's sentence. The lines of the other six were not read. This block names four paths the finding's line does not. The doc of `addRepository` in `apps/desktop/src/shared/protocol.ts` states the new refusal. The comment on `heldGit` in `apps/desktop/test/daemon.test.ts` no longer names `git worktree list` as the one read. `trail/phases/phase-3.md` says which commands the start's read runs. `gaps.md` gains a row for a git older than 2.31, which was read and not run, rewrites the row on a git that does not answer, and says under `## Not done` that such a linked worktree is refused and its checkout not looked for. *Scope* item 3 of `frame/design.md:74` and the "one git call" of `frame/plan.md:113` are the orchestrator's to fold.
```

### 2. A headless session that a refused removal stopped says the repository was removed, while the repository stays

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:380`, `apps/desktop/test/daemon.test.ts:1227`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-3.md:31`
evidence: read `apps/desktop/src/daemon/daemon.ts:380`, `apps/desktop/src/daemon/daemon.ts:574-596`, `apps/desktop/test/daemon.test.ts:1227`, `apps/desktop/test/daemon.test.ts:1252-1275`, `seal/threads/1795152521-work-item-menu/trail/phases/phase-3.md:10`
```

Why it matters: `Daemon#endSessions` (`daemon.ts:574`) marks each working headless session `failed` with the text it is handed, before it waits for the panes (`:585`). The removal hands it "ended when the repository was removed" (`:380`). The removal is then refused in two ways after that mark: a pane that outlives the wait (`:595`), and a session that started meanwhile. Each refusal leaves the repository listed. The phase states this itself: "The sessions that did end stay ended" (`trail/phases/phase-3.md:10`). So the work item's view shows a stopped question with the words "ended when the repository was removed", under a repository that stands in the sidebar. The refusal at the same time says "nothing was removed". A person who reads both cannot tell whether the removal half happened. The gaps row on an agent's slow exit (`gaps.md`, "How long an agent's CLI takes to exit") makes the first refusal a plausible path for a Claude Code pane.

The fix gives the session words that are true whether the removal goes on or is refused.

```ts
// apps/desktop/src/daemon/daemon.ts:380
await this.endSessions(ids, running as Running, "ended when a removal of its repository began");
```

```ts
// apps/desktop/test/daemon.test.ts:1227
expect(c.messages.flatMap((m) => (m.type === "headless" && m.headless.state === "failed" ? [m.headless.error] : []))).toEqual(["ended when a removal of its repository began"]);
```

The snippets leave the quote in `trail/phases/phase-3.md:31`, which the fix pass owes the same words. Phase 5's delete meets the same order of a stop and then a refusal, and owes its own words the same care.

```seal
verdict: fixed 150b3e5
answer: The finding holds, and the fix is the proposed one. A headless session a removal stops is `failed` with "ended when a removal of its repository began". The case at `apps/desktop/test/daemon.test.ts:1227` pins the words and failed against the old ones, with the old sentence as what it received. The bullet of `trail/phases/phase-3.md` on what a removal takes off the lists quotes the new words and says why they hold for a refused removal. No frame file states the removal's words. `frame/design.md:107` gives an archive its own, "ended when the work item was archived", and *Scope* item 21 refuses no archive after the stop, so they stand.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `apps/desktop/src/renderer/menu.ts:74` gives the menu `tabIndex = -1`, and `apps/desktop/src/renderer/index.html:373` draws no ring on it. The docstring of `onPress` and the bullet *The menu's own rules* of `trail/phases/phase-2.md` say the rule. The case at `apps/desktop/test/work-item-menu.test.ts:176` presses the menu's rule and then ArrowDown and Escape, as round 2 proposed with one step more. Phase 3 changed `menu.ts` by one line, the item's `title` (`git diff 734251e..bb7e314`), which leaves the fix as it was. Read. The case ran green in phase 3's run of the file on the tree of `8cdb9ec` (`trail/phases/phase-3.md:92`, read). This round did not start the app to run it again: the prompt allows a start only where a finding needs one, and this round took a confirmation to be no such need.

```seal
confirms: round-2#2
```
What holds: `apps/desktop/src/main/openers.ts:68-70` answers a path nothing stands at with "<folder> is gone." and a path with no `.git` at its top with "Owlery opens a work item's folder or a repository's folder, and nothing else.", before Finder or an app is reached. The two cases of `apps/desktop/test/openers.test.ts` pin both sentences for a file, an app's bundle and a plain folder, and passed in this round's run. The doc of `OwleryApi.openFolder` in `apps/desktop/src/shared/ipc.ts` and the bullet *What the main process refuses* of `trail/phases/phase-2.md` state the refusal. Phase 3's repository menu hands the repository's folder to the same function (`view.ts#openEntries`), and a main checkout holds `.git` at its top. Finding 1 above is where that fails, and the cause lies in the read of a folder's repository, not in this close. `git grep -n -e innerHTML -e insertAdjacentHTML -- apps/desktop/src/renderer` printed no line again. Executed and read.

What matched: *Scope* items 12 to 15, walked from the frame to the code. A repository's menu holds Settings, Change icon, Show archived work items, New group, Open in Finder and the installed apps, Copy path, Hide from sidebar and Remove, in that order (`view.ts#repositoryMenu`, and its case). It opens at the right button on the row, at the "…" button and at M on the row (`renderer.ts#onContextMenu`, `#onMenuKey`, `sidebar.ts`). A name is stored without the white space at its ends, an empty one as null, and the work items' `repoName` follows. A base a person chose is the default of a plan and of a creation while the repository lists it, and is passed over where it does not (`worktrees.ts#basesOf`). An icon is counted by grapheme, so an emoji of several code points is one character. A hidden repository stays in `repositories` with its work items in `workItems`, and a button under the sidebar's repositories says how many are hidden and opens their list. Executed in `daemon.test.ts`, `repositories.test.ts`, `worktrees.test.ts` and `view.test.ts`, and read for the window.

What matched: *Scope* items 16, 21 and 23 for a removal with neither checkbox. The removal runs on `Daemon#changing` behind a creation. It refuses a work item or a running session it was not told of, and ends nothing then. It kills each pane, waits up to `END_WAIT_MS`, 3 seconds, and refuses where one lives on, or where a session started meanwhile. It takes the repository, its work items, the archived among them, their panes and headless sessions off the lists, and touches nothing on disk. The case at `daemon.test.ts` that compares every file's bytes, `git for-each-ref` and `git worktree list` before and after holds the last point. The counts of *Scope* item 1 give no id twice across a removal and across a new read of the file. Executed.

What matched: *Scope* items 3, 4 and 24 in the window. The form's checkbox "Register the repository only" turns off the name, the base and the kind, hides the plan, sets the button to "Register", sends `addRepository` and shows a refusal in the form (`renderer.ts#showFormMode`, `#registerRepository`). It is unchecked at each opening. The `add-repository` button is gone from `index.html`, with `SidebarActions.pickFolder` and `addRepository`. `NEW_WORK_ITEM_SAYS`, `REGISTER_ONLY_SAYS` and the row's "+" sentence are those of *Scope* item 24, and the case of `view.test.ts` pins them. Read, and executed for the functions.

What matched: the merge `bb7e314`. The combined diff of `main.ts`, `preload.ts`, `ipc.ts`, `protocol.ts`, `renderer.ts` and `test/daemon.test.ts` keeps both sides whole. The three channels of #93 and `comeForward` of #31 stand in the channel list, the API, the preload and the handlers. The `start` message carries `continueLatest` of #94 beside the folder comment of #93. `renderer.ts` imports `notificationOpens` with #93's names, and `takeLists` raises a notification that answers a click while `notificationFor` still returns none for a muted work item. The daemon's key list in `test/daemon.test.ts` holds `continues`, `repositories` and `archived` together. A `start` with `continueLatest` in a work item whose repository is being removed meets the same second read of the running sessions as any `start`. Read, and executed in `daemon.test.ts` and `view.test.ts`.

What matched: the phase record's runs and claims. Claimed: eight case files, 454 cases, all passed at `285a014`. The same eight files at `bb7e314` passed 464 in this round, the merge's cases among them: 205 in three files and 259 in five. The seen-red runs and the mutation table are read, not run again. `gaps.md` loses no row of `## Not verified`: four rows are rewritten in place, the row of the sidebar's "Add a repository" button is marked `closed` as round 2 said phase 3 owed, and seven are added. The paragraphs `## Not done` loses describe work phase 3 built, the "…" button's menu, the counts and the "+" button's case. The fold `5b0b595` says what the code does: the refusal of an unnamed work item (`daemon.ts`, `removeRepository`), the removal under item 21's wait and on item 23's chain, *Removes* row 8 with `SidebarActions.addRepository`, and Q2's answer, `END_WAIT_MS` of 3 seconds. One sentence of that fold reads twice over, at `frame/plan.md:24`: "always with arguments and no shell with arguments and never a shell". Its meaning holds, so it is no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck of the whole app and the broad gate. This round ran eight case files and three probes | `apps/desktop` | the orchestrator, at the broad run |
| `work-item-menu.test.ts` at `bb7e314`. The merge changed `renderer.ts`, `main.ts`, `preload.ts` and `ipc.ts`, which the built app loads, and the file last ran on the tree of `8cdb9ec`. This round started no app, by the prompt's bound | `apps/desktop/test/work-item-menu.test.ts` | the orchestrator, at the broad run |
| Whether git on a stalled macOS mount ends at the signal `execFileSync`'s timeout sends. Where it does not, the 2 seconds of `START_READ_MS` do not bound the wait (`test_tmp_start_read.mjs`) | `apps/desktop/src/daemon/worktrees.ts:130` | the orchestrator, who names who measures it, as the row of `gaps.md` says |
| How the repository's menu, the settings, icon, hidden and removal dialogs and the form's checkbox look when drawn, in the two themes | `apps/desktop/src/renderer/index.html` | the owner, as `gaps.md` names |
| That Finder, an editor and a terminal open a repository's folder, and that the clipboard holds it after Copy path. No case presses either item | `apps/desktop/src/main/main.ts` | the owner, in the hand run of issue #24 |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/repositories.test.ts test/worktrees.test.ts`, from `apps/desktop` of a `git clone --no-local` of the worktree at `bb7e314`, in the round's scratch, with the worktree's `node_modules` linked in | 3 files, 205 cases passed, exit 0 |
| `node scripts/test-in-electron.mjs test/view.test.ts test/openers.test.ts test/last-look.test.ts test/names.test.ts test/themes.test.ts`, the same clone | 5 files, 259 cases passed, exit 0 |
| `sh test_tmp_main_checkout.sh`, in the round's scratch, run once with git 2.50.1 and the global and system configuration set to `/dev/null` | In a submodule's checkout and in a folder inside it, `git worktree list --porcelain` listed `super/.git/modules/sub` first, where `git rev-parse --show-toplevel` printed `super/sub`. In a repository made with `--separate-git-dir`, it listed `apart.git` first, where `--show-toplevel` printed `apart` |
| `node test_tmp_start_read.mjs`, in the round's scratch, run once with the system's Node 26.13.1, with the options of `repositoryOfSync` | `git worktree list` on a repository: 13.8, 14.4 and 13.5 ms. On a folder that is gone: 1.7 ms, ENOENT. A child that ends at SIGTERM and would sleep 4 seconds: 2002 ms, ETIMEDOUT. A child that ignores SIGTERM and sleeps 4 seconds: 4022 ms, ETIMEDOUT |
| `node scripts/test-in-electron.mjs test/test_tmp_submodule.test.ts`, the clone at `bb7e314`, on temporary repositories. The first run printed its answers to the console, which the runner did not show. The file was changed to write them to the round's scratch and run again | 1 passed, exit 0. `repositoryOf` and `repositoryOfSync` gave `<base>/super/.git/modules/sub` for `super/sub` and `<base>/apart.git` for `apart`, and neither has `.git` at its top. A creation in `super/sub` stored `repo` as `<base>/super/.git/modules/sub` |
| `sh test_tmp_fix_read.sh`, run once on the repositories of the first shell probe | `git rev-parse --path-format=absolute --show-toplevel --git-dir --git-common-dir` printed one git directory twice in a main checkout, a folder inside it, a submodule's checkout and a separate git directory's checkout, each with the checkout's folder first. In a linked worktree, a plain one and a submodule's, it printed two. Outside a repository it failed. The bare clone's worktree was not made, because its branch name was taken; the bare case stands in the existing cases |
| The fix of finding 1 applied to `worktrees.ts` in the clone, then `node scripts/test-in-electron.mjs test/test_tmp_submodule.test.ts` with a submodule's linked worktree and a plain linked worktree added, then `test/worktrees.test.ts test/repositories.test.ts`, then `test/daemon.test.ts -t "linked worktree\|bare repository\|repositories"`. The patch stays in the round's scratch as `fix-read.diff`, and the clone's file was restored after | The probe gave `<base>/super/sub` and `<base>/apart` for both reads and for the creation, refused the submodule's linked worktree with the new sentence, and gave `<base>/super` for the plain linked worktree. 70 cases passed, exit 0. 19 passed and 116 skipped, exit 0 |
| `git grep -n -e innerHTML -e insertAdjacentHTML -- apps/desktop/src/renderer`, at `bb7e314` | no line |
| `git tag --list` and `gh release list --limit 5` | no tag and no release |
