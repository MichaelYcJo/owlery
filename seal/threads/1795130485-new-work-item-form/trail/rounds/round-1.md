# Review round 1: 1795130485-new-work-item-form

```seal
target: 82dfaa9 against release/v0.0.1
```

The diff reviewed is `origin/release/v0.0.1...82dfaa9`, merge base `365dafd`, read in a `git clone --no-local` of the branch in the round's scratch. The merge `82dfaa9` resolves no conflict: `git show --cc 82dfaa9` prints no hunk. This is round 1, so no fact is carried from an earlier round; every coordinate below was opened this round.

The records were read whole at `82dfaa9`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. No `pr.md` stands yet, and `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. No `seal/parity.json` and no `Pact` key stand, so neither the parity read nor the pact read applies.

## Findings

### 1. A local branch that names another ref is listed and chosen as the default base, and every creation from it is refused

```seal
severity: should
location: `apps/desktop/src/daemon/worktrees.ts:182`, `apps/desktop/src/daemon/worktrees.ts:146`, `apps/desktop/src/daemon/worktrees.ts:199`, `apps/desktop/test/worktrees.test.ts:222`, `seal/threads/1795130485-new-work-item-form/frame/design.md:73`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts` in the scratch clone's `apps/desktop`, with the global and the system git configuration set to `/dev/null`; read `apps/desktop/src/daemon/worktrees.ts:140-148`, `apps/desktop/src/daemon/worktrees.ts:180-201`, `apps/desktop/src/daemon/worktrees.ts:225-232`
```

Why it matters: `basesOf` and `baseRef` disagree about a symbolic ref under `refs/heads`, such as an alias `main` that an old repository on `master` keeps for compatibility. `basesOf` puts every `refs/heads/` line into the local list whatever its second word (`worktrees.ts:182`). `baseRef` accepts a local name only where its line has no second word (`worktrees.ts:146`), so it reads the alias as no base at all. The menu therefore offers a base the creation refuses. Where the alias bears a candidate name, `firstIn(candidates, locals)` (`worktrees.ts:199`) makes it the default base. The form then preselects it, and a creation that sends no `base` is refused as well. The person sees "has no branch main to start a work item from" for the form's own default and has to find another entry in the menu.

The probe made a repository on `main` with `refs/heads/master` as a symbolic ref to `refs/heads/main`, and `init.defaultBranch` set to `master`. `planWorktree` answered `localBases: ["main","master"]` and `defaultBase: "master"`. `createWorktree` with `base: "master"` was refused with "`<repo>` has no branch master to start a work item from". `createWorktree` with no `base` was refused with the same message. A repository on `master` with a `main` alias reaches the same refusal with no configuration, since `main` is the first candidate name.

Phase 1 decided that "any ref under `refs/remotes` that names another ref is no base" (`trail/phases/phase-1.md:20`) and left `refs/heads` out of that decision. *Scope* item 6 has the plan list the local branches, and item 5 refuses "a `base` ... that is none of the bases item 6 lists". So the build breaks item 5 for this one kind of ref: the plan lists a base that the creation refuses. No case holds a symbolic ref under `refs/heads`. The cases of `describe("the default base")` plant symbolic refs under `refs/remotes` alone.

The fix makes the list agree with `baseRef`, so an alias is listed by its target alone:

```ts
    if (ref.startsWith("refs/heads/")) {
      // A local branch that names another ref, as an alias `main` of `master` does, is no base: `baseRef` reads a base's name as a branch of its own, and its target stands in the list.
      if (symref === "") local.push(ref.slice("refs/heads/".length));
    } else if (!ref.startsWith("refs/remotes/")) continue;
    else if (symref === "") remote.push(ref.slice("refs/remotes/".length));
    else if (symref.startsWith("refs/remotes/")) heads.set(ref.slice("refs/remotes/".length), symref.slice("refs/remotes/".length));
```

The regression test belongs in `apps/desktop/test/worktrees.test.ts`, under `describe("the default base")`. Without the fix it fails on the plan's list and on the creation's refusal:

```ts
    it("is no local branch that names another ref, which a base's name never reads", async () => {
      const made = repository();
      // An old repository on `master` that keeps `main` as an alias of it.
      git(made.repo, "branch", "--quiet", "-m", "main", "master");
      git(made.repo, "symbolic-ref", "refs/heads/main", "refs/heads/master");
      const plan = await planWorktree({ folder: made.repo, title: "Alias", root: made.root });
      expect([plan.localBases, plan.defaultBase]).toEqual([["master"], "master"]);
      expect((await createWorktree({ folder: made.repo, title: "Alias", root: made.root })).baseBranch).toBe("master");
    });
```

The snippet leaves three statements of the same fact, and the fix pass owes them too. They are the sentence "A remote's `HEAD` entry is no base." of `frame/design.md` *Scope* item 4 (line 73), the comment on `WorktreePlan.localBases` (`apps/desktop/src/daemon/worktrees.ts:74`), and the comment on `workItemPlan` in `apps/desktop/src/shared/protocol.ts:170`. Each says "the local branches" and would then also say that a local branch naming another ref is not among them. The other way to close the finding is to let `baseRef` accept such a line and cut at the ref. That keeps the alias in the menu and stores the alias's name as `baseBranch`. That choice is open to the fix pass, provided the list and the read agree.

### 2. Against a daemon of an earlier build, an empty name gives a work item with an empty title, and the changelog says it is called `work-item`

```seal
severity: should
location: `seal/threads/1795130485-new-work-item-form/changelog.md:13`, `seal/threads/1795130485-new-work-item-form/frame/plan.md:69`, `apps/desktop/src/renderer/renderer.ts:251-264`
evidence: read `apps/desktop/src/renderer/renderer.ts:251-264`, `apps/desktop/src/renderer/view.ts:744-748`, `apps/desktop/src/main/daemon-client.ts:42-44`, and at `365dafd` `apps/desktop/src/daemon/daemon.ts:252-254` and `apps/desktop/src/daemon/worktrees.ts:28`
```

Why it matters: the claim is in `changelog.md:13`: "A work item created against it starts from the checkout's commit, as before, and one left without a name is called `work-item` there". `frame/plan.md:69` says the same: "names an unnamed work item `work-item`". The code does something else. The window now sends an empty `title` for an empty name: `workItemFields` trims it to `""` (`view.ts:744-748`) and `createWorkItem` sends it (`renderer.ts:264`). The daemon of `365dafd` accepts any string title. It names the branch `owlery/work-item` (`worktrees.ts:28` at `365dafd`), and it stores `title: message.title` (`daemon.ts:254` at `365dafd`), which is the empty string. The `name` the window sends is a field that daemon never reads. So the work item is listed with an empty title in the sidebar, in the list and in its view, and `work-items.json` keeps it so. The branch and the folder are `work-item`, and the work item itself is called nothing.

The case is reachable. `ensureDaemon` keeps any daemon that answers a `hello` (`daemon-client.ts:42-44`), and no version check replaces a daemon of an earlier build. Before this work the window refused an empty title, so an earlier daemon never received one. This build is the first to send it.

The sentence of the changelog is the one a person reads after an update, and it tells them something false. The fix corrects both statements. The window's behaviour stays as *Scope* item 7 sets it, since item 7 has the window send the field's text as `title`:

```markdown
- **After an update, the form shows no branch, and its menu "Starts from" stays empty, until Owlery's background process restarts.** A process started by the build before this one answers no plan. A work item created against it starts from the checkout's commit, as before. One left without a name gets the branch `owlery/work-item` and no title, and stands in the list as an empty line, so give a work item a name until that process restarts.
```

and in `frame/plan.md:69`:

```markdown
A daemon that was started by an earlier build and is still alive answers no plan, so the form shows no branch and no base until that daemon exits, and a creation there starts from the checkout's commit and gives an unnamed work item the branch `owlery/work-item` and an empty title.
```

The fix pass can choose to change the code instead. For example, the window could send `title: formName` where it holds no answer to any plan of this opening. That departs from *Scope* item 7 and item 3: a new daemon would store `amber-heron` where the branch got `amber-heron-2`. The fix pass would have to argue that departure against the frame, and the changelog sentence would then change to match.

## Confirmations

What matched: `frame/design.md` *Scope* items 1 to 10 against the code at `82dfaa9`, read in `apps/desktop/src/shared/names.ts`, `apps/desktop/src/daemon/worktrees.ts`, `apps/desktop/src/daemon/daemon.ts:257-294`, `apps/desktop/src/shared/protocol.ts:71-85` and `:142-171`, `apps/desktop/src/renderer/view.ts:736-813`, `apps/desktop/src/renderer/renderer.ts:180-264` and `:300-330` and `:409-428`, and `apps/desktop/src/renderer/index.html:340-374`. The exception is finding 1. The fields of `workItemPlan` are the seven *Data & interfaces* names. The `base` reaches git only inside `refs/heads/` or `refs/remotes/`, after `baseRef` compares the whole line, so a pattern, a revision suffix such as `main~1`, or `..` reaches no ref. The `name` reaches git only through `slugFor`. The refusal of a base comes before `placeFor` and `mkdirSync` (`worktrees.ts:225-238`). Read.

What matched: `gaps.md:14`, the form against a daemon of an earlier build. With no answer, `formPlan` stays null. `planLine` then gives an empty branch, and `baseMenu` gives the value null, so `showPlan` disables the menu (`renderer.ts:198-215`). `workItemFields` with a null base sends no `base` key (`view.ts:748`). The daemon of `365dafd` ignores `planWorkItem` in its `default` case. The three claims hold, read. What the row leaves out is finding 2.

What matched: `gaps.md:15`, the two lines no case reads. `askPlanSoon` (`renderer.ts:235-238`) clears the timer at each key and sets a new one of `PLAN_WAIT_MS`, so keys closer than 150 ms ask once, after the last. `askPlan` (`renderer.ts:218-232`) clears the timer too, so an opening or a "Browse…" asks at once and drops a wait still running. The `input` listener of the repository field (`renderer.ts:417-421`) calls `showPlan` at once. `showPlan` reads `planLine` and `baseMenu` against the field's new text, and `planOf` (`view.ts:771-773`) compares that text with the plan's `repo`, so the earlier text's branch and bases leave the form at that key. A Create pressed inside the 150 ms then sends no `base`, and the daemon takes the new repository's default base. Both lines do what `trail/phases/phase-2.md:22` and `:52` say. Read.

What matched: `gaps.md:10`, the sort of the remotes other than `origin`. `worktrees.ts:195` puts `origin` first and the others after it in `Array.prototype.sort` order, which is the order of their names by UTF-16 code unit. That is the order *Scope* item 4 names. Read.

What matched: scenario 9 at `82dfaa9`, after the merge. `node scripts/test-in-electron.mjs test/work-item-form.test.ts`, with `TMPDIR` set to the session's own temporary folder, ran 4 cases in the scratch clone, and all 4 passed, exit 0. The app started once in the background through `BuiltApp.start`, with its user data in that folder. No `owlery-*` folder stood there afterwards. Executed.

What matched: scenarios 10, 11 and 12 at `82dfaa9`. `git grep -n -e 'Give the work item a title' 82dfaa9 -- apps` and `git grep -n -e '"work-item"' 82dfaa9 -- apps` each printed nothing and exited 1. `git grep -c` on "Choose the repository" over the same path printed three files, so the path is searched. `git diff --stat 47c4f61 82dfaa9 -- apps/desktop/test/memory.ts apps/desktop/test/korean-pane.ts` printed nothing. The same command over `work-items.ts`, `last-look.ts`, `ipc.ts` and `preload.ts` printed nothing, which matches *Data & interfaces*. Executed.

What matched: `frame/plan.md` *Phases* names `cdcedfc` and `769ccc5`, and both stand in `git log origin/release/v0.0.1..82dfaa9`. `769ccc5` adds `changelog.md`, as *Operational impact* says. `trail/phases/phase-1.md:9-11` claims 64 words in each list and 7 letters for the longest word, and `names.ts:7-28` holds 8 rows of 8 words in each list, the longest 7 letters. Read.

What matched: `docs/` states no rule this work changes. `git grep -n -i` on "title", "base branch", "checkout", "cut at" and "owlery/" over `docs` and the READMEs found no sentence that the form or the base contradicts. `docs/product.md:71` speaks of "the base branch", which a remote's branch still is. Executed.

The new cases were read against their groups. Each case `daemon.test.ts`, `worktrees.test.ts`, `view.test.ts` and `names.test.ts` adds holds a fact of a *Scope* item or a scenario that no older case holds. One gap is named here and is no finding: in `apps/desktop/test/names.test.ts:26` the assertion `names.size` greater than 1 holds nothing that line 25 does not already hold.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the whole typecheck and the broad gate at `82dfaa9`. This round ran `test/work-item-form.test.ts` and the probe, nothing else. The label `unverified` in `gaps.md:7-8` is honest: the orchestrator's post-merge run of six files and `pnpm run typecheck`, as the spawn states it, was not opened by this round, and `test/themes.test.ts`, `test/memory.test.ts`, `test/last-look.test.ts` and the other cases of `test/korean-input.test.ts` stand unrun at `82dfaa9` | `gaps.md:7-8` | the orchestrator's broad run |
| How the form looks when drawn: the negative top margin of `#work-item-plan`, the failed colour, the menu's two groups | `apps/desktop/src/renderer/index.html:343-346` | the owner, as `gaps.md:13` names |
| Whether the menu should list the work items' own `owlery/*` branches among the local bases | `gaps.md:20` | the owner |
| The cost of `aheadOf`'s added `for-each-ref`. Each read of commits, every 3 seconds by default, now runs one more git process for each work item. Nothing was measured | `apps/desktop/src/daemon/worktrees.ts:265-266`, `apps/desktop/src/daemon/daemon.ts:517` | the owner, where many work items are open |

## Probes

| Command | Result |
|---|---|
| `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts`, in the scratch clone's `apps/desktop` | Run twice. The runner showed none of the first run's `console.error` lines, so the file was changed to write them to `PROBE_OUT` and run again, with the same repository and the same calls. The second run gave `localBases: ["main","master"]` and `defaultBase: "master"` for a repository on `main` with `refs/heads/master` a symbolic ref to it and `init.defaultBranch` `master`. `createWorktree` with `base: "master"`, and with no `base`, were each refused with "has no branch master to start a work item from". Exit 0, 1 case |
| `node scripts/test-in-electron.mjs test/work-item-form.test.ts` with `TMPDIR` set to the session's temporary folder, in the scratch clone's `apps/desktop` | 4 passed of 4, exit 0. The app started once in the background, and no `owlery-*` folder was left in that folder |
