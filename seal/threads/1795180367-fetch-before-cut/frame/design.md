# Design: fetch a remote's branch before a work item is cut from it (#96)

The ticket is issue #96.

## Grounding

The tree as read at `a12a1a4`. Every path below is under `apps/desktop/` unless it starts with `docs/` or `seal/`. A base is the branch a work item starts from, and a remote's branch is named `<remote>/<branch>`, such as `origin/main`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/roadmap.md` *Milestones*, row 1, "Creating a work item, which gets its own branch and its own worktree" | A work item keeps one branch and one worktree of its own. The clause does not say where the branch starts or whether a remote is asked, so this work decides it |
| `docs/architecture.md` *State lives in three places* | The clause keeps the daemon's state out of the person's repository. A fetch writes one ref of a remote's branch in the clone, no file of the tree and no commit (*Scope* item 1), so the clause keeps holding |
| `docs/architecture.md` *Rules that keep it portable*, rule 1 | The messages this work adds to the protocol carry no vendor-specific field |
| `docs/product.md` *What we deliberately don't do* | Nothing there forbids the daemon to ask a git remote |
| The plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* | The subject of this work is the code, so a rule it changed would stand in `## Rule changes`. It changes none |

What the reading and the probe gave. Each fact is labelled as it was got.

- `executed`: `gh issue view 96 --json title,body,comments,labels,milestone` on 2026-11-20 gave an open issue of the milestone "release: 0.0.1" with no comment. Its *Done when* holds four lines. A work item that starts from a remote's branch is cut after that remote is fetched, and so is the plan the form shows. Where the fetch fails, the form says that the branch is as last fetched and when, and the person can still create the work item. A work item that starts from a local branch fetches nothing. The fetch never changes a local branch or the checkout of the person's repository.
- `read`, `seal/threads/1795180367-fetch-before-cut/routing.md`: Planning is `framer`, Implementation `crafter`, Review "straight to the PR", Automation "yes".
- `read`, the spawn's points for this frame: when the fetch runs, what one fetch fetches, how long it may take, what the form says when it fails, that a fetch moves no local branch and no checkout, and that the cases use temporary repositories with a local remote and never the network. The spawn carried no line on the issue's comments, and `gh` read the issue here: it has none.
- `read`, `seal/threads/1795130485-new-work-item-form/frame/design.md` *Out of scope*, `frame/plan.md` *Alternatives considered* and `frame/questions.md` Q1 of the same work item: issue #85 put a fetch before the cut out of scope, on the owner's answer to Q1 that Owlery does not fetch. Its plan named the cost of a fetch: a creation waits on the network, fails or falls back without one, and can ask for credentials in a daemon that has no terminal. Issue #96 says the owner put the fetch into release 0.0.1 on 2026-11-20, so this work takes the decision up and answers each of those costs (*Scope* items 1, 2, 3 and 5). `seal/threads/1795130485-new-work-item-form/changelog.md` holds the bullet "**Owlery does not fetch.**", which the same release's notes will carry.
- `read`, `src/daemon/worktrees.ts`, whole:
  - `git` (`:41-48`) runs git with `execFile` and no time limit.
  - `baseRef` (`:236-250`) reads a base's name as the local branch of that name where one exists, and as the remote's branch otherwise.
  - `basesOf` (`:271-309`) and `planWorktree` (`:316-320`) read the clone's refs and configuration alone. The comment at `:258-260` says "nothing is fetched and no remote is asked", which the issue cites at the place it had before a later merge moved it.
  - `createWorktree` (`:333-347`) resolves the base, then runs `git worktree add --quiet --no-track -b <branch> <worktree> <ref>`. A remote's branch is therefore cut where the clone last fetched it. This is the cause of the issue, read in the code.
  - `planBranchRename` (`:366`) and `readLoss` (`:583`) each say that nothing is fetched. This work changes neither.
- `read`, `src/daemon/daemon.ts`: the case `createWorkItem` (`:303-326`) runs each creation behind `Daemon#changing` (`:144-145`), one after another. The case `planWorkItem` (`:327-340`) answers at once and waits behind nothing. The `default` case (`:671-672`) ignores a message of a type the daemon does not know. `Daemon#close` (`:211-222`) ends the panes and the headless sessions. `DaemonOptions` (`:73-106`) takes `now` and the waits a case replaces.
- `read`, `src/shared/protocol.ts:228-231` and `:277-278`: `createWorkItem` carries an optional `base`. `planWorkItem` carries no base, and `workItemPlan` carries the branch, the folder, the lists of bases and the default base. No message carries a commit of a base.
- `read`, the form, in `src/renderer/`:
  - `renderer.ts#askPlan` (`:1042-1056`) sends a plan when the form opens, when the repository changes, and 150 ms after the last key in the name (`askPlanSoon`, `:1059-1062`, `PLAN_WAIT_MS`, `:86-87`). A fetch tied to the plan would therefore be asked while a person types.
  - `renderer.ts#showPlan` (`:1015-1039`) draws the menu `work-item-base` from `view.ts#baseMenu` (`view.ts:1412-1421`), and the listener at `renderer.ts:1312-1314` keeps the person's choice.
  - `renderer.ts#createWorkItem` (`:1075-1089`) turns the button off until the daemon answers. The case `workItemCreated` (`:1134-1146`) empties the status line with `tell("")` and closes the form.
  - `renderer.ts:77`: a daemon of an earlier build answers no plan, and the form then shows no branch.
  - `index.html:575-581` holds the plan's paragraph and the label "Starts from". `view.ts#ageOf` (`:549-558`) words an age, such as "3 days".
- `read`, `src/main/daemon-client.ts:50-54`: the app starts the daemon detached, with no terminal, with the app's environment.
- `read`, `test/repositories.ts#temporaryClone` (`:41-48`): a temporary folder with a repository `origin` and a clone of it. `test/work-item-form.test.ts`, whole: one start of the built app on such a clone, which drives the form, creates one work item from the local branch `feature`, and opens the form again.
- `read`, `test/worktrees.test.ts:131`: a case's name says a work item is cut at the remote's branch "as the clone holds it". Its remote does not move, so its assertions hold after this work. `test/worktrees.test.ts:160-164`: the cases of the default base add remotes at folders that do not exist and plant their branches, so a fetch for them fails as the probe's fact 6 does.
- `executed`, the probe `test_tmp_fetch_one_branch.sh` in the framer's scratch, run once on 2026-11-20 with git 2.50.1, on temporary repositories under that scratch, with a local bare remote and with the global and the system configuration files set to `/dev/null`. The fetch it ran is `git fetch --quiet --no-tags --no-recurse-submodules --no-auto-maintenance --no-write-fetch-head --refmap= <remote> +refs/heads/<branch>:refs/remotes/<remote>/<branch>`:
  1. After the remote's `main` and `side` each gained a commit, a tag was pushed and a branch appeared, the fetch of `main` exited 0 in 73 ms. `git for-each-ref` before and after differed in `refs/remotes/origin/main` alone, and in `refs/remotes/origin/HEAD`, which names it. No local branch, no other branch of the remote and no tag changed, `git status --porcelain` printed nothing, and no `FETCH_HEAD` was written.
  2. `git log -g -1 --date=unix --format=%gd refs/remotes/origin/main` printed nothing in a fresh clone, and `origin/main@{<seconds>}` with the time of the fetch after the fetch moved the ref. A second fetch that moved nothing left that time as it was. A ref whose reflog was emptied printed nothing, with exit 0. The reflog therefore gives when the clone's ref last moved, not when the clone last asked, and gives nothing for a ref that never moved in the clone.
  3. With `+refs/heads/*:refs/heads/*` added to the remote's configured refspecs, the fetch above moved `refs/remotes/origin/side` alone. A plain `git fetch --no-tags origin side` moved the local branch `side` as well. `--refmap=` with an explicit refspec is what keeps a fetch off a local branch.
  4. A plain fetch run in a linked worktree wrote `.git/worktrees/<name>/FETCH_HEAD`, apart from the main checkout's `.git/FETCH_HEAD`. That file's time is therefore not the time of the clone's last fetch.
  5. For a branch the remote no longer holds, the fetch exited 128 with "fatal: couldn't find remote ref refs/heads/fresh" and left the clone's ref.
  6. With the remote's folder moved away, the fetch exited 128 in 43 ms. The first line git printed was "fatal: '<folder>' does not appear to be a git repository", and the clone's ref stayed.
  7. For a remote whose `core.sshCommand` was a script that sleeps, `execFile` with `timeout: 1000` ended git after 1005 ms with `killed: true`, `signal: "SIGTERM"` and an empty stderr. The script's process was still alive after git ended, until the probe stopped it by its recorded id. No `.lock` file was left, and the clone's ref stayed.
- `executed`: `git help git` of the installed git, under `GIT_TERMINAL_PROMPT`: "If this Boolean environment variable is set to false, git will not prompt on the terminal".
- `executed`, the searches the cells below cite, each run at `a12a1a4`:
  - `git grep -n -e '"fetch"' a12a1a4 -- apps/desktop/src` printed nothing and exited 1. `git grep -c 'worktree' a12a1a4 -- apps/desktop/src` printed counts for files there, so the path is searched. No source file runs a fetch.
  - `git grep -n -e 'fetchBase' -e 'baseFetched' -e 'work-item-base-state' -e 'BASE_FETCH_MS' a12a1a4 -- apps docs README.md` printed nothing and exited 1, so the names this work adds are free.
- `executed`, `ls` at `a12a1a4`: no index stands at `docs/README.md`, and `seal/follow-up.md` does not exist. `gh release view --json body --jq .body` printed "release not found". `git grep -n '### Process changes' -- 'seal/threads/*/changelog.md'` printed nothing.
- `executed`: `git grep -n -i -e 'network' -e 'offline' -- docs/product.md docs/architecture.md docs/roadmap.md` printed lines of `docs/architecture.md` about the phone's connection alone. `git grep -n -h -A4 -e '^- \(add\|change\|remove\)' -- 'seal/threads/*/frame/design.md'`, cut to its `file:` and `section:` lines, listed the sections the unsettled designs change. None of them states where a work item's branch starts or whether Owlery asks a remote.
- The framer ran no check of the repository's: no test, no typecheck, no lint and no broad gate. The app was not started, and no command reached a real remote.

## Scope

In scope, as numbered items.

1. **One fetch asks one remote for one branch and writes one ref.** For a base that `baseRef` reads as a remote's branch, the daemon runs in the repository the fetch of the probe: `git fetch --quiet --no-tags --no-recurse-submodules --no-auto-maintenance --no-write-fetch-head --refmap= <remote> +refs/heads/<branch>:refs/remotes/<remote>/<branch>`, with `GIT_TERMINAL_PROMPT=0` added to the daemon's environment. The remote is the one of `git remote` whose name, followed by a slash, opens the base's name, the longest such name where several do, and the branch is the rest of the base's name. The fetch names no other remote and no other branch, writes no tag, no `FETCH_HEAD` and no local branch, and touches no checkout. Precondition: the clone keeps the remote's branch `<branch>` as `refs/remotes/<remote>/<branch>`, as git's default refspec does. Under another mapping the fetch fails, and item 3's `kept` holds.
2. **A fetch ends within `BASE_FETCH_MS`.** `src/shared/protocol.ts` exports `BASE_FETCH_MS`, 10,000. A fetch that has not ended by then is ended by the daemon, together with every process git started for it, such as the transport's process of the probe's fact 7. The daemon takes the wait as an option a case replaces.
3. **What a fetch gives.** The result names the base, the commit the clone's ref of it holds once the fetch has ended, and one of these states:
   - `none`: the base is a local branch, and nothing was asked of any remote.
   - `fetched`: git exited 0, so the commit is the remote's.
   - `kept`: the fetch failed or was ended, and the commit is the one the clone held. The result then carries `failure` and `since`. `failure` is the first line git printed that is not empty, or "`<remote>` did not answer in `<n>` seconds" for a fetch the daemon ended, or "the clone has no remote for `<base>`" where item 1 finds no remote. `since` is the time, in milliseconds, of the newest entry of the reflog of the clone's ref, or `null` where that reflog holds none.
4. **A local base fetches nothing.** Where `baseRef` reads the base as a local branch, a local branch that bears the name of a remote's branch among them, no git command that asks a remote runs.
5. **A creation is cut after the fetch.** `createWorktree` resolves the base as at `a12a1a4`, and for a remote's branch waits for a fetch of it before `git worktree add`. The daemon keeps the fetches in one place, by the repository and the ref:
   - A creation joins a fetch of the same branch that is under way, and starts no second one.
   - A creation uses the result of a fetch of that branch that ended less than `BASE_FRESH_MS` ago, 60,000, read from the daemon's clock (`DaemonOptions.now`), and fetches otherwise. The daemon takes this time as an option a case replaces.
   - A creation whose fetch is `kept` is cut at the commit the clone holds, and is not refused.
   - `createWorktree` called without the daemon's keeper, as a case of `test/worktrees.test.ts` calls it, runs one fetch of its own.

   The cut is at the ref, as at `a12a1a4`. `baseBranch` and `baseCommit` keep their meanings.
6. **A client asks for a fetch.** A new client message `fetchBase` names a repository's folder and a base. The daemon answers with `baseFetched`, which carries item 3's result under the request's id. A `fetchBase` joins a fetch of the same branch that is under way and otherwise starts one, whatever ended before it, so a person who opens the form again asks the remote again. It is answered outside `Daemon#changing`, as a plan is. A folder that is no absolute path or names no repository, and a base that is none of the repository's, are answered with `error` under the request's id.
7. **A plan stays a read.** `planWorkItem`, `basesOf` and `planWorktree` are not changed, so a key in the name asks no remote. The menu lists the remotes' branches the clone holds.
8. **A daemon that closes ends its fetches.** `Daemon#close` ends every fetch under way, as item 2 ends one.
9. **The form asks once for each base it shows.** The window sends `fetchBase` when the menu `work-item-base` comes to hold a value that the plan lists among `remoteBases`, and the form has not asked for that repository field's text and that base since it opened. That is at the plan's first answer for a repository and at the person's choice of another base. It asks nothing for a local base, nothing while "Register the repository only" is chosen, and nothing at a key in the name. Each opening of the form forgets what the last one asked.
10. **The form says what it starts from.** A new paragraph `work-item-base-state`, with `aria-live="polite"`, stands under the menu "Starts from". For the menu's value it holds one of these, where `<commit>` is the first seven characters of the commit and `<age>` is `view.ts#ageOf` of `since`:
    - while the answer is awaited: "Fetching origin/main…"
    - `fetched`: "Fetched: origin/main is at `<commit>`."
    - `kept` with a `since`: "origin/main could not be fetched (`<failure>`). It starts as last fetched, at `<commit>`, which the clone has held for `<age>`."
    - `kept` with no `since`: "origin/main could not be fetched (`<failure>`). It starts as last fetched, at `<commit>`."
    - an `error`: the error's message.
    - a local base, no repository, or "Register the repository only": nothing.

    `since` is when the clone's ref last moved (probe, fact 2). The sentence says how long the clone has held the commit, which git records, and names no time of the last fetch, which git records in no place the clone's worktrees share (probe, facts 2 and 4).
11. **Where no answer comes.** The form stops saying "Fetching…" once `BASE_FETCH_MS` and two seconds more have passed with no answer, as with a daemon of an earlier build, which ignores the message. The paragraph is then empty, and an answer that comes later is shown.
12. **Create stays on.** The form's button does not wait for the fetch. A creation sent while the fetch is under way joins it in the daemon (item 5). Where the form's answer is `kept` and arrived after the person pressed Create, the window's status line says item 10's sentence once the creation is answered, so no work item made in the form starts from an old commit unsaid.
13. **The changelog says the change.** This work's `changelog.md` says that Owlery now fetches the one branch before it cuts, what the form says when it cannot, that this replaces the bullet "Owlery does not fetch" of issue #85's entry in the same release, that a window attached to a daemon of an earlier build shows no line and starts as last fetched until that daemon is replaced, and the messages a client of the daemon gains.

Out of scope.

- A fetch of the remote's other branches, of another remote, or with pruning. A branch that appeared on the remote since the clone's last fetch is not in the menu. The spawn sets one remote and one branch.
- A fetch for the repository's settings dialog, for a rename's plan and for a delete's loss. `planBranchRename` and `readLoss` keep reading the clone.
- Bringing a local branch up to its remote's. A work item from the local `main` starts where `main` stands, by the issue's third *Done when*.
- A fetch that needs a person to type a password or a passphrase. The daemon has no terminal, so such a fetch fails or is ended, and item 3's `kept` holds.
- The commit of a local base in the form.
- An edit of `seal/threads/1795130485-new-work-item-form/changelog.md`. It is another work item's record, and `frame/plan.md` *Operational impact* names it for the orchestrator.
- Asking the remote again for the counts of work items that already exist. `aheadOf` reads the clone at each read, so a count moves at the read after a fetch.

## User scenarios & acceptance *(mandatory)*

Every case below runs on temporary repositories that `test/repositories.ts` makes, with a remote that is a folder beside the clone. No case names a URL of a real host. The one remote with an `ssh://` URL has `core.sshCommand` set to a stand-in script in the temporary repository's own configuration, so no `ssh` starts.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A creation from a remote's branch is cut at the remote's commit | Given a clone whose `origin` gained a commit on `main` that the clone did not fetch, when `createWorktree` runs with the base `origin/main`, and again with no base in a clone whose default base is `origin/main`, then `baseCommit` is the remote's new commit and `refs/remotes/origin/main` holds it | A case in `test/worktrees.test.ts` on `temporaryClone` |
| 2. A local base asks no remote | Given the same clone, when a creation names the local `main`, and when it names a local branch `origin/shadow` beside the remote's `shadow`, then `baseCommit` is the local branch's and `git for-each-ref refs/remotes` prints what it printed before | A case in `test/worktrees.test.ts` |
| 3. A fetch moves no local branch and no checkout | Given a clone with a changed file in its checkout, a local `side` behind the remote's `side`, a tag on the remote's new commit, a second remote that also moved, and `+refs/heads/*:refs/heads/*` added to `origin`'s refspecs, when a creation names `origin/main`, then `git for-each-ref` differs from before in `refs/remotes/origin/main`, in `refs/remotes/origin/HEAD` and in the new work item's branch alone, `git symbolic-ref HEAD` and `git status --porcelain` in the checkout print what they printed before, and the clone's git directory holds no `FETCH_HEAD` it did not hold | A case in `test/worktrees.test.ts` |
| 4. A fetch that fails keeps the clone's commit and says why and since when | Given a clone that fetched once so that `refs/remotes/origin/main` moved, and whose `origin` folder was then renamed, when a fetch of `origin/main` runs, then the result is `kept`, `failure` is the first line git printed, `since` is within the case's own time, and a creation from `origin/main` is made at the commit the clone holds. Given a fresh clone, `since` is `null`. Given a branch the remote deleted, the result is `kept` | Cases in `test/worktrees.test.ts` |
| 5. A remote that does not answer is given up within the wait | Given a remote whose URL is `ssh://owlery.invalid/x.git` and a `core.sshCommand` that records its process id and sleeps, when a fetch runs with a wait of some hundred milliseconds, then the result is `kept` with a `failure` that names the remote and the wait, the recorded process no longer runs, and the git directory holds no `.lock` file | A case in `test/worktrees.test.ts`, which ends the recorded process itself where the assertion fails |
| 6. The daemon answers a fetch | Given a daemon and a clone whose `origin` moved, when a client sends `fetchBase` for `origin/main`, then `baseFetched` carries `fetched` and the remote's commit. For the local `main` it carries `none`. For a folder outside any repository and for a base the repository does not hold, the answer is `error` under the request's id | A case in `test/daemon.test.ts` |
| 7. A creation soon after the form's fetch starts where the form said | Given scenario 6's answer at commit X, when `origin` gains a commit Y and a creation from `origin/main` arrives before `BASE_FRESH_MS` has passed on the daemon's clock, then the work item's `baseCommit` is X. When the clock has moved past it and another creation arrives, then its `baseCommit` is Y | A case in `test/daemon.test.ts` with `now` replaced |
| 8. A creation joins the fetch under way | Given scenario 5's remote, with a stand-in that also appends a line to a file at each start, when a client sends `fetchBase` and at once a `createWorkItem` for the same base, then `workItemCreated` arrives after `baseFetched`, and the file holds one line | A case in `test/daemon.test.ts` |
| 9. A daemon that closes leaves no fetch | Given scenario 5's remote and a wait longer than the case, when a `fetchBase` is under way and the daemon closes, then the recorded process no longer runs | A case in `test/daemon.test.ts`, which ends the recorded process itself where the assertion fails |
| 10. A plan asks no remote | Given a clone whose `origin` moved, when a client sends `planWorkItem` and reads `workItemPlan`, then `git for-each-ref refs/remotes` prints what it printed before | A case in `test/daemon.test.ts` |
| 11. The form's sentences | For each state of *Scope* item 10, the function that words the paragraph gives that item's sentence, with the commit cut to seven characters and the age from `ageOf`. The function that says whether the form asks gives true for a base of `remoteBases` not yet asked under the repository's text, and false for a local base, for one already asked and under "Register the repository only" | Cases in `test/view.test.ts` |
| 12. The form in the built app | Given the clone of `test/work-item-form.test.ts`, whose `origin` gained a commit before the form opened, when the repository is typed and the menu holds `origin/main`, then `work-item-base-state` reads "Fetched: origin/main is at `<commit>`." with the remote's new commit. When the menu is set to `feature`, the paragraph is empty. When the form opens again after `origin`'s folder was renamed, the paragraph opens with "origin/main could not be fetched (" and holds "It starts as last fetched, at `<commit>`", and a press of Create makes a work item whose branch stands at that commit | The cases of `test/work-item-form.test.ts`, extended, under its one `BuiltApp.start` |
| 13. One file runs a fetch | The source names git's `fetch` in `src/daemon/worktrees.ts` alone | `git grep -n -e '"fetch"' -- apps/desktop/src` prints at least one line, and every line it prints is of `apps/desktop/src/daemon/worktrees.ts`. Run at `a12a1a4` it printed nothing (`## Grounding`), and *Scope* item 1 adds what it prints |

Not automated, and named in `frame/questions.md` Q1: a fetch from the app as a person starts it, against a remote that needs a key or a stored password.

## Data & interfaces

`src/shared/protocol.ts`:

- `export const BASE_FETCH_MS = 10_000`, with a comment that says what it bounds and that the window's own wait is derived from it.
- A type for *Scope* item 3's result: `base: string`, `commit: string`, `fetch: "none" | "fetched" | "kept"`, `failure: string | null`, `since: number | null`. `failure` and `since` are `null` unless `fetch` is `kept`.
- `ClientMessage` gains `{ type: "fetchBase"; requestId: number; repo: string; base: string }`.
- `ServerMessage` gains `{ type: "baseFetched"; requestId: number }` with the fields of that type.
- The comments on `createWorkItem` and on `WorkItem.baseCommit` say that a remote's branch is fetched before the cut, and what the cut is where the fetch fails.

`src/daemon/worktrees.ts`: a function that runs *Scope* items 1 to 4 for a repository and a base, and a keeper of fetches that holds items 5, 6 and 8: the fetches under way and each branch's last result with its time. `createWorktree` takes the keeper as an option, as it takes `chosenBase`. Its comment says what item 5 says. The comment of `basesOf` keeps its sentence, which stays true of a plan.

`src/daemon/daemon.ts`: `Daemon#handle` gains the case `fetchBase`. `DaemonOptions` gains the wait of item 2 and the time of item 5. `Daemon#close` ends the fetches.

`src/renderer/`: `index.html` gains the paragraph `work-item-base-state` and its style. `view.ts` holds the functions scenario 11 names. `renderer.ts` holds the request, its answer, the wait of item 11 and the status line of item 12.

`src/daemon/repositories.ts`, `src/shared/ipc.ts`, `src/preload/preload.ts` and `src/main/` are not changed: a stored work item and a `WorkItem` keep their fields, and the window reaches git through the daemon alone.

## Rule changes

- nothing
  why: no section of `docs/` states where a work item's branch starts or whether Owlery asks a remote, and the work keeps what `docs/roadmap.md` *Milestones* row 1 and `docs/architecture.md` *State lives in three places* state. What a person newly sees is named in `changelog.md`.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| 1. The cut of a remote's branch at the commit the clone last fetched, with no remote asked, as what every creation does | `apps/desktop/src/daemon/worktrees.ts#createWorktree`, its step from `baseRef` straight to `git worktree add` | *Scope* item 5. The cut at the clone's commit stays for a fetch that is `kept` alone |
| 2. The words "as the clone holds it" in a case's name | `apps/desktop/test/worktrees.test.ts`, the case "cuts a work item no base was sent for at the branch the remote's HEAD names, as the clone holds it, and at neither local branch, and gives the new branch no upstream" | Scenario 1's case states the new rule. This case keeps its assertions under a name without those words: its remote does not move |

The work adds no gate, check, hook or mark of the workflow, and no start of the built app: scenario 12 extends the cases under the one start `test/work-item-form.test.ts` already makes.

Framed 2026-11-20 by framer, before the build.
