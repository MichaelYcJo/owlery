# Implementation Plan: the new work item form (#85)

## Technical context

The tree as read at `47c4f61`.

The work builds on the desktop package `apps/desktop`. Every path below is under it.

- `src/daemon/worktrees.ts:25-29`, `slugFor`, and `:85-106`, `createWorktree`: the name, the loop that appends a number, and the cut at `HEAD` (`:102`). `:130-137`, `aheadOf`, reads the base as `refs/heads/<baseBranch>`.
- `src/daemon/daemon.ts:249-269`, the case `createWorkItem`: creations are chained on `Daemon#creating` (`:101-102`), and a failure is answered with `error` and the request's id.
- `src/shared/protocol.ts:134-149`, `ClientMessage`, and `:151-169`, `ServerMessage`.
- `src/renderer/renderer.ts:161-187`, the form's opening and `createWorkItem`; `:238-248`, the case `error`; `:326-335`, the form's listeners. `src/renderer/view.ts:728-738`, `workItemFields`. `src/renderer/index.html:500-526`, the dialog, and `:336-342`, its styles.
- `test/built-app.ts`, `BuiltApp`, and `test/repositories.ts#temporaryRepository`: what a case that drives the window starts from.

Constraints the tree sets.

- Git runs in the daemon alone, through `execFile` with arguments and never a shell (`src/daemon/worktrees.ts:1-3`). A `base` reaches git only as a full ref, `refs/heads/<base>` or `refs/remotes/<base>`, and only where it is one of the bases the daemon listed (`frame/design.md` *Scope* items 4 to 6).
- The daemon outlives the app, so a window of this build can meet a daemon of an earlier one. That daemon ignores `planWorkItem` and the two new fields of `createWorkItem` (`src/daemon/daemon.ts:333`, the `default` case). The form therefore works with no answer to a plan (`frame/design.md` *Scope* items 8 and 9).
- The window shows an `error` whose request it does not know in its status line (`src/renderer/renderer.ts:238-248`). The window therefore keeps the id of its latest plan and takes that request's `error` into the form.
- A plan reads git several times for each change of the name. How long the window waits after a key before it asks is `frame/questions.md` Q3.

**The failure scenario of the chosen approach.** The default base is read from the refs of the person's clone, with no fetch. A work item that starts from `origin/main` starts where the person's last fetch left that branch, so on a machine that fetches rarely it starts behind the remote, and nothing in the form says how old the branch is. It also starts without the commits a person made on the local `main` and did not push, which the person gets by choosing `main` in the menu. A repository whose remote renamed its default branch keeps the old name under `refs/remotes/origin/HEAD` until a fetch or `git remote set-head origin --auto` corrects it, and a new work item starts from the old branch while the clone still holds it. A base that names a remote's branch gives no count once that branch is deleted on the remote and pruned from the clone. A base's name is read as a local branch first, so a local branch named `origin/main` stands in front of the remote's branch of that name, which the menu then cannot offer. The menu holds every local branch and every remote's branch, so a repository with thousands of them gives a menu nobody can read, and the menu then needs a search. A plan is a read made before the creation, so a creation that another client makes between the two takes the name, and the work item gets the next number. The work item's view shows the branch it got.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The window works the branch out by itself, from a `slugFor` moved into `src/shared/` | The window cannot see which branches and folders exist, so it shows `owlery/fix-login` where the creation gives `owlery/fix-login-2`. The list of bases still needs a request to the daemon | Rejected |
| **The daemon answers a plan: the branch, the folder, the bases and the default base in one message, chosen** | See *Technical context* | Chosen. One function names a creation and a plan, so the form shows what the creation computes |
| Two messages, one for the name and one for the repository's branches | The branches are read once for each repository and not at each key, at the cost of a second message, a second answer to order against the first and a second failure to show | Rejected. `frame/questions.md` Q3 bounds how often a plan is asked |
| Keep the title required and add a line of help under it | The owner's words of 2026-11-20 ask for the opposite, and the first *Done when* line is not met | Rejected |
| Keep `slugFor`'s `work-item`, so an unnamed work item is `work-item`, `work-item-2` and so on. This keeps the structure at `47c4f61` | Every work item nobody named, and every one titled in Korean, differs from the others by a number alone, in the list, in the branch and in the folder. The owner asked for something random. The premise that would keep the structure is that a number tells work items apart well enough, and the owner's words refuse it | Rejected for the replacement below |
| **A generated name of two random words replaces `work-item`, chosen** | Two work items of one repository can draw the same pair. The loop that appends a number then tells them apart, as it does for two equal titles | Chosen |
| A name made of the date and the time | Unique without a list of words, and no person can tell two of them apart at a glance or say one aloud | Rejected |
| A branch field of its own that the person edits, beside the name. This replaces the structure in which the title names the branch | Two fields have to be kept in step, a typed branch needs git's own check of a branch name, and the `owlery/` prefix becomes the person's to keep or drop. Nothing in the issue asks to edit the branch | Rejected. The structure is kept on the premise that the issue asks the form to show the branch, and its second *Done when* line says "shows" (`gh issue view 85`, `executed`) |
| The default branch asked of the remote, with `git ls-remote --symref origin HEAD` or `git remote show origin` | The form waits on the network each time it opens, hangs without one, and can raise a credential prompt in a daemon that has no terminal | Rejected |
| **The default base read from the refs of the person's clone in the order of `frame/design.md` *Scope* item 4, chosen** | See *Technical context* | Chosen. The probes in `frame/design.md` *Grounding* show each read |
| A base is a local branch alone, option (a) of `frame/questions.md` Q1 and the framer's default. This keeps the structure at `47c4f61`, where `aheadOf` reads `refs/heads/<baseBranch>` (`src/daemon/worktrees.ts:132`) | A work item starts where the local default branch stands, behind the remote where the person has not pulled, and a branch that exists on the remote alone cannot be chosen until the person checks it out | Rejected by the owner's answer to Q1 on 2026-11-20 |
| **A base is a local branch or a remote's branch, with the remote's default branch as the default and no fetch, option (b) of Q1, chosen.** This replaces the structure in which a base is a local branch | See *Technical context* | Chosen by the owner's answer to Q1. `aheadOf` reads a remote's branch too, and the cut is made with `--no-track`, without which the new branch gets the remote's branch as its upstream (the probes, `executed`) |
| A fetch from the remote before the cut, option (c) of Q1 | A creation waits on the network, fails or falls back without one, and can ask for credentials in a daemon that has no terminal to ask in | Rejected by the owner's answer to Q1 |
| A base carried as a full ref, `refs/heads/main` or `refs/remotes/origin/main`, in the protocol and in `work-items.json` | No name is read two ways, but every stored `baseBranch` at `47c4f61` is a short name that has to be read as before, and the window has to shorten the ref wherever it prints the base | Rejected for the short name read as a local branch first, which leaves stored work items and `view.ts#ahead` as they are |
| One list of bases in the plan's answer, local and remote together | The window can tell a remote's branch from a local branch named with a slash only by guessing at the name | Rejected for two lists |
| The form's parts driven once by the builder and held by no case | The code that asks for a plan and fills the menu stands in `renderer.ts`, which no case reaches without the window. The next change of the form breaks it unseen | Rejected |
| The form's cases added to `test/korean-input.test.ts`, which already starts the app | No second start of the app in the suite, but a failure of the form fails the Korean input test, which `docs/roadmap.md` *Done criteria* reads by its own result | Rejected for a file of its own with one start, in the background |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 6 and 10, in `src/shared/names.ts`, `src/shared/protocol.ts`, `src/daemon/worktrees.ts` and `src/daemon/daemon.ts`, with `## Removes` rows 3 to 7 | Scenarios 1 to 7 and 13 as cases, each seen red before its code. Scenario 12's search | `cdcedfc` |
| 2 | `frame/design.md` *Scope* items 7 to 9, in `src/renderer/index.html`, `src/renderer/view.ts` and `src/renderer/renderer.ts`, with `## Removes` rows 1 and 2, and the changelog fragment `changelog.md` | Scenario 8 as cases, each seen red before its code. Scenario 9 as the new file, run by itself, which starts the app once in the background. Scenario 10's case run by itself and its `git diff --stat`. Scenario 11's search |`769ccc5` |

Each phase leaves the app working. After phase 1 the form of `47c4f61` still creates a work item, which then starts from the default base, and it still refuses an empty title in the window.

## Overlap with the release

The spawn names no other open work item of `release/v0.0.1`. `gh issue list --state open` on 2026-11-20 listed issue #85 alone under the milestone "release: 0.0.1", and `gh pr list` listed no open pull request (`executed`), so none meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

The protocol gains the client message `planWorkItem`, the server message `workItemPlan`, and the optional fields `name` and `base` of `createWorkItem`. A client that sends none of them still creates a work item.

A work item made without a `base` starts from the repository's default base and no longer from the branch the person's checkout stands on. In a repository with a remote that is the remote's default branch as the last fetch left it, such as `origin/main`, and Owlery does not fetch. A person who relied on the old start chooses the checkout's branch in the form's menu. A work item's branch has no upstream, whatever its base. A `baseBranch` can now name a remote's branch, and a client prints it as it stands.

A daemon that was started by an earlier build and is still alive answers no plan, so the form shows no branch and no base until that daemon exits, and a creation there starts from the checkout's commit and gives an unnamed work item the branch `owlery/work-item` and an empty title.

No environment variable and no dependency is added, and `work-items.json` keeps its fields. The version does not move. Phase 2's commit adds `changelog.md`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-20 | A work item can start from a local branch or a remote's branch, both in the form's menu, and the default is the remote's default branch, such as `origin/main`, or a local branch in a repository without a remote (`frame/design.md` *Scope* item 4); Owlery does not fetch before it cuts (`frame/questions.md` Q1, option b) | The owner chose option (b) when the orchestrator asked Q1 in one batch on 2026-11-20, with (a) marked as recommended; the reference dialog the owner pointed at shows `origin/main` | `frame/design.md` *Scope*, item 4 |
| 2026-11-20 | Release work merges into `release/v0.0.1` by squash, and the release into `main` by a merge commit; GitHub rulesets enforce both, with the repository's admins allowed to bypass | The owner asked for it on 2026-11-20 ("release에 배포할때는 squash로 하고 main으로 갈때만 3-way로 머지") and chose the rulesets with a bypass for themself | `docs/roadmap.md` *Releases and the tracker* |
