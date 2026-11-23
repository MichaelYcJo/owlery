# Design: 1795396351-seal-breaks-after-a-commit

Issue #44: a commit pushed after the seal leaves the inbox and the pull request saying sealed.

This frame keeps the words of the three frames it builds on in the sense they give them: the **chain**, a **stage** and the **step owed** of `seal/threads/1795388700-review-rounds/frame/design.md`; the **gate's commit**, the **closing records** and a **seal** of `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md`; and the **pull request stage**, the **seal section** and the **seal check** of `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md`. It adds four, each used in one sense. The **sealed commit** is the commit that the `target:` line of a seal names. The **head reading** is the values the order's function takes, each read from the commit at the branch's head and from nothing else. A seal **holds at the head** where the order's function, given the head reading, answers that the chain is `sealed`. A seal is **broken** where the newest verdict block of `guarantee.md` at the branch's head commit is a seal and that seal does not hold at the head.

## Grounding

The tree as read at `40a50bf`. Each row is labelled `read` where a file was opened and `executed` where a command gave the fact. The frames and the code of the release's other work items are read on their branches, with `git show`: #41's at `158f62c`, #42's at `0cff3e9`, #43's at `3c13a7a`, #46's at `9be0035` and #27's at `182fa8c`. None of them has merged into `release/v0.0.2`. #42 and #43 hold a frame and no code.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *What we promise*, its first sentence (read) | The seal is bound to one commit, and it breaks if any commit lands after it. Under `agentic` no question holds the run |
| `docs/product.md` *Foundation*, the paragraph on a work item's line and the item "The app reads only what the inbox needs" (read) | A line shows `sealed` or `broken`. Git shows whether a branch got new commits. Wherever the work happens, a commit that lands after the seal breaks it |
| `docs/product.md` *The seal*, item 2 (read) | The seal on the pull request turns to broken when a commit lands after it, the check on the pull request makes the same judgment, and the app puts it on screen |
| `docs/product.md` *The seal belongs to the product and looks the same everywhere* (read) | The inbox, the pull request's body and GitHub's check are displays, and all of them read the same record |
| `docs/product.md` *File explorer and editor*, the items on a person's edit and on files git ignores (read) | An edit becomes a commit, and an edit after the seal breaks it. A file git ignores becomes no commit and breaks nothing. After a break, one review round and the sealer read only the part that changed |
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the sentence "The PR check stays" (read) | A colleague who does not use the app gets the same verdict on the pull request |
| `docs/architecture.md` *State lives in three places* and *Records are committed to the repository* (read) | The seal record is the repository's. Progress is the daemon's state. A record that is not committed supports no seal |
| `docs/architecture.md` *What we take from AgenticSeal*, the row of the scripts (read) | `pr-check/` is Owlery's own copy, which Owlery adapts. The daemon runs no Python |
| `docs/architecture.md` *What a session survives* and *Rules that keep it portable*, as #42's frame reads them (read on its branch) | No message carries a session's id, and no field of the protocol names a vendor |
| `docs/design.md` *Principles* 1, 4, 5 and 8, *Components and their states*, the row "The seal's place" and the sentence under the table, and *The voice of the window's words* (read) | A red on the screen says that an independent party judged this commit. A state is said by a shape, a colour and words. A theme is its tokens. A form is stated in the document before the window draws it. "The drawing of a broken seal is that milestone's." A state is two words at most |
| `docs/roadmap.md` *Milestones* row 2 and *Why this order*, item 2 (read) | This work is part of milestone 2. The merge button that asks whether the seal holds and the editor's offer are milestone 4's |

The unsettled designs' `## Rule changes` name neither paragraph this work changes. Executed: an `awk` over every `seal/threads/*/frame/design.md` at `40a50bf` printed each operation's `file:` and `section:` line, and none names `docs/product.md` *The seal* or `docs/architecture.md` *Records are committed to the repository*. Read on their branches: #46's frame changes item 1 of *The seal*, and this work changes item 2. #42's and #43's frames each add a paragraph to *Records are committed to the repository*, and this work adds one more. `docs/README.md` does not stand (executed: `ls docs`), so each `file:` below is a document of `docs/` read at this commit, and each has a `.ko.md` edition that carries the same operation. `seal/follow-up.md` does not stand (executed: `ls seal`). No release holds a process change. Executed: `gh release view --json tagName,body` gave `v0.0.1` with no `Process changes` heading, and `grep -l 'Process changes' seal/threads/*/changelog.md` named no file.

What earlier work items decided, which this frame does not argue again:

| Record | What it fixes for this work |
|---|---|
| `seal/threads/1795388700-review-rounds/frame/design.md` *Scope* items 4, 14, 15, 17, 25, 26 and 27 (read at `158f62c`) | The step owed is a function of the records and git. A commit after the last round's target that changes a path outside the work item's directory owes a verifying round on the commits after that target. A later `getSeal` runs the step owed. The chain's state is stored with its work item. The "Get a seal" button stands by the seal's place. A stopped chain makes the line wait and raises a notification |
| `seal/threads/1795393338-broad-gate-and-sealer/frame/design.md` *Scope* items 1, 2, 13, 15, 19, 22 and 25, and *Out of scope*, the second item (read at `0cff3e9`) | The order's function answers `sealed` where the gate holds at the head and the newest verdict block is a seal whose `target:` names the gate's commit. Whether the gate holds is read from the paths that differ between two trees. The closing records are `trail/gate.md`, `guarantee.md` and `trail/refusals.md`. The newest verdict is read through `chain-records.ts#lastVerdict`. `Chain.state` gains `sealed`. Whether a seal still holds at the head, a broken seal, a lit seal and "Get a new seal" are this work's |
| `seal/threads/1795393338-broad-gate-and-sealer/frame/plan.md` *Alternatives considered*, the row "Whether the gate holds is read from the paths that differ between two trees" (read at `0cff3e9`) | A commit taken back by the next one leaves the tree the gate passed on, and the check's walk of commits skips a merge commit, which changes the tree. This frame takes the rule of two trees as decided |
| `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md` *Scope* items 1, 9, 12, 13, 15, 19, 22 and 29, and *Out of scope*, the first item (read at `3c13a7a`) | The pull request stage is owed once a chain ends `sealed` at a later head. The seal section copies the newest verdict block. `WorkItem.pullRequest` holds what GitHub last answered. One function gives the check's outcome, and the posted check `Owlery seal` carries it. The body arm reads the seal section alone. A seal's validity at the head and a broken seal are this work's |
| `seal/threads/1795342001-progress-through-roles/frame/design.md` *Scope* items 2, 5 and 6, and *Out of scope*, the item "A lit seal" (read at `9be0035`) | `Recorded.verdict` is the last verdict block as the worktree holds it, committed or not. The sealer's place says the verdict and calls `shared.ts#sealPlace`. This work compares the verdict's commit with the head, lights the seal and draws a broken one, in one function for the line, the preview and the view's foot |

What the tree holds, at `40a50bf`:

- **The daemon reads each branch's head from the repository, on a timer, while a client is connected.** Read: `apps/desktop/src/daemon/daemon.ts#readBranch` calls `worktrees.ts#branchHead`, which asks git for `refs/heads/<branch>` in the repository. `daemon.ts#scheduleCommitRead` repeats the read every `commitPollMs`, 3 seconds when absent, and a client's hello starts it. So the read sees a commit whoever made it and wherever: in a pane of the app, in the person's own shell, or in another checkout that moves the branch.
- **Nothing compares a head with a sealed commit.** Read: `apps/desktop/src/shared/protocol.ts#WorkItem` holds no field for a seal. `apps/desktop/src/renderer/shared.ts:124` `sealPlace` sets `data-seal` to `none` for every work item and says "No seal yet". Executed: `git grep -n -e 'dataset.seal' -e 'data-seal' 40a50bf -- apps/desktop/src` printed line 127 of `shared.ts` as the one line that sets the value, its comment at line 122, and the rules of `index.html` at lines 134 to 144.
- **The page already holds the form of a sealed place, and none of a broken one.** Read: `apps/desktop/src/renderer/index.html` lines 143 and 144 draw `data-seal="sealed"` from `owl-icon-cream.svg` and `owl.svg` under `--seal-light`. No rule names a broken place, and `docs/design.md` leaves its drawing to this milestone.
- **The page's style may write no filter of its own, and every token stands in both editions of `docs/design.md`.** Read: `apps/desktop/test/themes.test.ts`, the cases "writes no shadow, no light, no gradient and no corner of its own in its style" and "names every property of every block and every measure of the page's :root with the value the style holds, in both editions, and no other token". So a broken seal that loses the wax's red needs a token, and the token needs its rows in `docs/design.md` and `docs/design.ko.md` in the commit that adds it.
- **A person's reversal of a decision is committed.** Read: `daemon.ts:799` records a reversal through `personWrote`, which commits `decisions.md` with `commitWord`. `decisions.md` is no closing record, so a reversal after a seal is a commit that breaks it.
- **The window raises a notification from a comparison of two lists.** Read: `apps/desktop/src/renderer/view.ts#parkNotifications` gives one notification for each work item that is parked now and was not in the lists the window held before, leaves out a muted work item and the one whose view is in front, and `renderer.ts#takeLists` raises each.
- **The order's function reads its round records at the head commit, and its record of decisions in the worktree.** Read at `158f62c`: `chain.ts#standingOf` reads each round record with `worktrees.ts#fileAt` at the head, and `decisions.md` with `repository-file.ts#repositoryFileText`, committed or not. #42's frame has the gate's record and the guarantee read through `repository-file.ts` too (its *Scope* item 22). So the chain's own reading is not yet a reading of the head commit alone.

What the probe gave. It ran `pr-check/` of a `git clone --no-local` of this worktree at `40a50bf` against a repository made under the framer's scratch directory, under a payload that says the pull request is ready and holds no body. The repository held one commit of source, a routing record, round 1 with no finding, a run block and a seal whose `target:` names the gate's commit. No real `claude` ran, nothing reached a remote, and no check of this repository ran. Executed: `sh test_tmp_seal_after_commit.sh`.

- **The sealed head passes.** The check exited 0.
- **A plain commit after the seal fails the rounds arm, the gate arm and the guarantee arm, with or without the trailer.** A commit that changes `src.txt` exited 1. The rounds arm said "the last round's `target:` is behind HEAD", the gate arm "the newest gate run is behind HEAD", and the guarantee arm "the guarantee is behind HEAD: commit d433a636 after it touches `src.txt`, outside the closing records; the sealer runs again".
- **A merge of the base after the seal passes the check.** The base gained a commit that changes `other.txt`, the branch merged the base, and the check exited 0. `git diff --name-only` between the sealed commit and the head printed `other.txt` beside the two closing records.
- **A merge commit that also edits a source file by hand passes the check.** The merge of the base was committed with `src.txt` changed in the merge commit itself, and the check exited 0. `git diff --name-only` between the sealed commit and the head printed `src.txt`. Read: `pr-check/skills/code-review/scripts/chain_check.py:1021` `follows` walks `git rev-list --no-merges HEAD ^<sha> ^<base>`, so it reads no merge commit and no commit the base holds. A change that reaches the branch in a merge commit after the seal is read by no arm.
- **A change taken back by a second commit fails the check, and leaves the sealed tree.** Two commits, the second restoring `src.txt`, exited 1 on the same arms, and `git diff --name-only` between the seal's commit and the head printed nothing. So the check's rounds arm, like #41's row of the verifying round, reads the commits and not the trees.
- **A commit that changes `guarantee.md` alone, below its block, passes.** The check exited 0.
- **A branch reset to the commit before the guarantee has no seal.** The check exited 1: "git carries no guarantee file".

**The reader the check uses parses this design's `## Rule changes`.** Executed: `python3 -B test_tmp_rule_changes.py` and `python3 -B test_tmp_rule_changes_2.py`, two probes under the framer's scratch directory that load `pr-check/skills/settle/scripts/rule_changes.py` of the same clone and call `parse` on this file with the policy root `docs`. The reader returned every operation of the section, no error and nothing unread. Each `section:` stands once as a heading of the file its operation names, and each `from:` stands in its file with runs of white space collapsed.

The search this frame's cells state, run at `40a50bf` (executed): `git grep -n -e 'only=' 40a50bf -- pr-check/skills/code-review/scripts/chain_check.py` printed line 1021, the declaration of `follows`, and line 1747, its one call that passes `only`, in the guarantee arm. *Scope* item 9 removes both.

The ticket as handed over. The issue was read whole with `gh issue view 44 --json title,body,comments` on 2026-11-23 (executed). Its body is not folded, and it holds no comment. Issues #22, #64, #48 and #67 were read for their titles the same way, and the scope of each is left to it.

Not shown by anything in this frame: a push of a commit that breaks a seal to GitHub, and the check that GitHub then posts. The owner's rules of this run let no probe reach a real remote and none create anything on GitHub. `frame/questions.md` Q2 names what the first real chain measures. #42's and #43's code does not stand, so every coordinate of the gate's, the seal's and the pull request's code below is named by their frames and has no line yet.

## Scope

### The seal's state

1. **A work item carries the state of its seal, as neutral values.** `WorkItem` gains `seal`, a `Seal` or null. A `Seal` holds its state, `sealed` or `broken`, the sealed commit, and, where it is broken, one sentence that says why. *Data & interfaces* gives the type. The value is null where the head commit holds no seal and where the daemon has read none yet. The field travels in `ready` and `inbox`, and no message is added.
2. **The daemon decides the state from the head reading alone.** For a work item whose directory `decision-record.ts#workItemDirectory` finds, the daemon reads at the branch's head commit: each round record, as `chain.ts#standingOf` reads it, and `decisions.md`, `trail/gate.md` and `guarantee.md`, each with `worktrees.ts#fileAt`. `standingOf` gains a parameter that says where it reads those three files: in the worktree, as the chain's run passes it, or at the head commit. The daemon gives the head reading to the order's function. It reads no file of the worktree for the state, no stored chain, no output of a pane and no event of a session.
3. **The state is one of three answers, and the first that holds decides.**

   | What the head commit holds | `seal` |
   |---|---|
   | No `guarantee.md`, a `guarantee.md` with a line the reader refuses or with no verdict block, or a newest verdict block that reads `withheld` or `undecided` | null |
   | A newest verdict block that is a seal, and the order's function answers that the chain is `sealed` | `sealed`, with the sealed commit |
   | A newest verdict block that is a seal, and the order's function owes a step, answers `parked`, or cannot read a record | `broken`, with the sealed commit and the sentence of item 4 |

   So a commit after the seal that changes a file of the source, a round record, `decisions.md` or any path that is no closing record breaks the seal, and so does a merge of the base. A commit that changes closing records alone leaves it. A change in the worktree that no commit holds changes nothing: a file git ignores, an edit not yet committed and a `guarantee.md` that is written and not committed are each read by no part of the head reading.
4. **A broken seal says why in one sentence.** The sentence names the first path that is no closing record and differs between the sealed commit and the head. Where no such path differs, it says which step the order owes. Where a record does not read or the sealed commit is no ancestor of the head, it says that. The window shows the sentence as it is.
5. **The state is read when a branch's head moves and when the daemon starts, and is stored nowhere.** `daemon.ts#readBranch` reads it where the head is another commit than the one the state was last read at, and where none was read since the daemon started. The daemon keeps the answer in memory beside the branch's commits, and `workItemOf` sends it. A chain's run asks for the read when the chain rests or stops, so the window does not wait one interval for the seal its own stage wrote. An archived work item is not read, as its branch is not.
6. **No stored value says that a work item is sealed.** `Chain.state` loses `sealed` and gains `rested`: the chain's run ended and owes no stage. Whether a seal holds is `WorkItem.seal` alone. The step the order's function answers keeps its name. A stored chain whose state is `sealed` is read as no chain, as #42's frame has a state the store does not know read. No release has shipped a build that stores one.

### The check

7. **The seal check's outcome names a broken seal.** In the function that gives the check's outcome (#43's *Scope* item 19), one row is added before the row "Ready, and the guarantee arm refused". It holds where the pull request is ready, the newest verdict block of a judged work item is a seal, and the rounds arm, the gate arm or the guarantee arm refuses a record as behind HEAD or as naming a commit HEAD does not descend from. The conclusion is `failure` and the exit code is 1, as today. The title says that the seal is broken and names the sealed commit. The summary holds the newest verdict block and each refused line. A draft is judged as #43's rows have it.
8. **The printed line of the guarantee arm says the same.** The sentence the arm prints for a seal that does not hold says that the seal is broken, names the first differing path and the sealed commit, and says that a new seal is owed at HEAD. It names no `seal` command.
9. **The guarantee arm reads two trees, as the daemon does.** In `chain_check.py#guarantee`, the call of `follows` with `only=CLOSING_RECORDS` is replaced. The arm refuses where the sealed commit does not resolve, where HEAD does not descend from it, and where `git diff --name-only` between that commit and HEAD prints a path that is no closing record of the work item's directory. `follows` loses its parameter `only`, which no other call passes. So a merge commit after the seal, and a change made in one, fails the check. The rounds arm and the gate arm keep `follows`.
10. **The seal section says that a seal binds one commit.** The fixed sentence of the seal section that `github.ts` composes (#43's *Data & interfaces*) is replaced by the sentence *Data & interfaces* gives below. It says that the seal binds the commit it names and that the check `Owlery seal` says whether it holds at the pull request's head commit. So a body that nobody rewrote after a later push says nothing untrue. The section on the seal check in `README.md` and `README.ko.md` (#43's *Scope* item 29) each gain one sentence: a commit pushed after the seal fails the check until a new seal is given.
11. **The daemon and the check give one answer for one history.** One case builds each history of scenario 9 in a temporary repository, asks the daemon's reading for the state and runs `chain_check.py` on the same repository. The check exits 0 where the state is `sealed`, and 1 where it is `broken` or null.

### A new seal

12. **A broken seal turns the button's words to "Get a new seal".** The button that sends `getSeal` (#41's *Scope* item 26) says "Get a new seal" where the work item's `seal.state` is `broken`. It sends the same message, and the daemon runs the step the order owes: a verifying round on the commits after the last round's target where one is owed, then the gate, then the seal.
13. **A seal stage that follows a broken seal is handed the part that changed since that seal.** Where the newest verdict block at the stage's start is a seal whose sealed commit is an ancestor of the gate's commit, the sealer's prompt (#42's *Scope* item 13) names that earlier run and its sealed commit. In place of the paths and the diff since the base, it holds the paths that differ between the earlier sealed commit and the gate's commit, and their diff as far as `PROMPT_DIFF_CHARS` allows. The `target:` line the verdict must carry stays `<gate's commit> against <base>`. Where the earlier sealed commit is no ancestor, the prompt is #42's whole.
14. **The bundle's sealer says how it judges after an earlier seal.** `apps/desktop/role-bundle/agents/sealer.md` gains one paragraph, and `docs/forms/the-guarantee.md` of the bundle one sentence. Where the prompt names an earlier seal, the sealer checks the claims of the records written after that seal and the changed part against the tree, reads the earlier run's section as that run's claim, and says in its own section which run it stands on. Its verdict is still a verdict on the whole branch against its base.

### The window

15. **The seal's place is drawn from the work item's seal, in one function.** `shared.ts#sealPlace` takes the work item's `seal` beside the place. It sets `data-seal` to `none`, `sealed` or `broken`, and says the place's words to a pointer and to a screen reader. Each caller passes the seal: a line of the inbox, the preview, a line of the summary, the view's foot and the sealer's place of the approval line.
16. **A sealed place is lit, and a broken one is the seal parted in two with its red taken out.** The sealed form is the one `docs/design.md` states and `index.html` holds. The broken form is the seal as it is drawn, parted along one slanted break with a gap between its two halves, under a new token `--seal-broken-light`, a filter that takes the wax's red out and lays the theme's shadow. The break is the same in every theme. The token stands in every block of `themes.css`. `frame/questions.md` Q1 holds the drawing as a person's choice, and the build proceeds on this form.
17. **`docs/design.md` and `docs/design.ko.md` state the two forms before the window draws them, in this pull request.** The row "The seal's place" of *Components and their states* gains the broken form and the words of each state. The sentence under that table says that the app lights a seal that holds at the head and draws a broken one, and no longer leaves the drawing to a milestone. The token tables of the three themes gain `--seal-broken-light`, and *What the names say* names it in the line of `--seal-*`. *A pull request that changes the window carries its screenshots* says what the scene now holds (item 22). `frame/plan.md` *Alternatives considered* holds why these two files change here and not at the settle.
18. **A broken seal makes the work item's line wait.** In `view.ts#inboxLine`, a work item whose `seal.state` is `broken` has the state `waiting`, in the order's place just after a stopped chain: a question, a permission request, a running chain and a stopped chain say more, and a pull request's result and a pane that finished say less. The line's second row says "Seal broken". A work item whose `seal.state` is `sealed`, and that holds no pull request, has the state `finished` and the second row "Sealed", where no pane and no chain says more.
19. **A seal that breaks raises a notification.** A new function of `view.ts`, beside `parkNotifications`, gives one notification for each work item whose seal is `broken` now and was `sealed` in the lists the window held before. It is titled with the work item's title and says "Seal broken". None is given for a muted work item, nor for the one whose view is in front of a focused window. `renderer.ts#takeLists` raises it, and a click opens the work item's view. A work item first seen broken, as at the window's start, raises none.
20. **The sealer's place of the approval line reads the seal.** In the table of `view.ts` that gives a place its state (#46's *Data & interfaces*), the row that marks the sealer's place finished at a `sealed` verdict reads `seal.state` instead of `recorded.verdict`: `sealed` marks it finished. A new row before it marks the place as waiting where `seal.state` is `broken`, with the note "Seal broken" and the seal's sentence under the line. A verdict that reads `sealed` in the worktree while `seal` is null marks the place as not started. The rows of a running stage, a failed stage, a `withheld` verdict and an `undecided` one stay.
21. **The view's foot says the seal's fact.** Under the seal's place at the view's foot, one line says "Sealed at `<commit>`" where the seal holds, and the seal's sentence where it is broken. It stands above the pull request's facts (#43's *Scope* item 26).
22. **The pull request carries the screenshots, and the scene holds a sealed work item and a broken one.** The screenshot run commits the records of a seal in two work items' worktrees and one more commit in the second, so one line shows the lit seal and one the broken seal with the waiting state, and the view of the second shows "Get a new seal". The crafter runs `pnpm run screenshots` in `apps/desktop` and commits the files under this work item's `screenshots/`.
23. **The changelog says what ships, and the earlier bullets are made true.** This work writes its `changelog.md`. Where a fragment of `seal/threads/1795393338-broad-gate-and-sealer/`, of `seal/threads/1795395059-pull-request-and-seal-check/` or of `seal/threads/1795342001-progress-through-roles/` says that a chain rests `sealed` as a state, that the app lights no seal, or that a merge after the seal passes the check, the crafter rewrites that bullet in this pull request.

### Out of scope

- **The summary's sentence for a seal that was given or broke while the person was away.** #22 builds it. It can read `WorkItem.seal` of every work item in `ready` and `inbox`: the state and the sealed commit. A look keeps no `seal`, since no comparison of this work reads one, and #22 adds to the look what it compares.
- **The editor's offer of "Get a new seal" on the spot, and a merge button that asks whether the seal holds.** They are milestone 4's (`docs/roadmap.md` *Why this order*, item 2), and #67 builds the merge button. This work gives them the state they read.
- **The daemon pushing a commit, or rewriting a pull request's body, when a seal breaks.** The pull request stage has one caller, a chain that ended `sealed` (#43's *Scope* item 2). The check on GitHub says that the seal is broken, with or without the app (`frame/plan.md` *Alternatives considered*).
- **A seal that the branch's head no longer holds.** Where a reset or a forced move takes `guarantee.md` out of the head commit, the state is null, as the check says that git carries no guarantee. The daemon remembers no seal that the repository does not hold.
- **The walks of the check's rounds arm and gate arm.** They keep `follows`. The guarantee arm's two trees catch what a merge commit brings, and the rounds arm goes on reading each commit.
- **The neutral result for a hotfix branch.** #64 adds its outcome to the same function.
- **A real push and a real posted check.** No case and no probe of this work reaches GitHub. `frame/questions.md` Q2 holds what the first real chain measures.
- **A signature on the seal record.** `docs/product.md` *Open decisions*, the row "Signing the seal record".

### Where each line of the issue's *Done when* lands

| The issue's line | Scope items |
|---|---|
| A work item whose head commit is the sealed commit shows `sealed` on its inbox line, in the place #18 left for the seal | 1, 2, 3, 15, 16 and 18. The head is the sealed commit or holds only closing records after it, as #42's frame has the records committed after the gate's commit |
| A commit that lands on the branch after the seal, from the app's terminal or from outside it, turns the line to `broken` without a restart, and a notification arrives | 3, 4, 5, 15, 16, 18 and 19, and scenarios 3 and 13 |
| The same commit, once pushed, fails the seal check on the pull request, read by a person without the app | 7, 8, 9 and 10. The run on GitHub is `frame/questions.md` Q2 |
| The daemon decides sealed or broken from git and the committed record, and never from what a terminal prints | 2, 3 and 6, and scenarios 4 and 5 |
| A sealed or broken state survives a restart of the daemon, because it is read again from the repository | 5 and 6, and scenario 6 |
| The states `sealed` and `broken` travel in the protocol as neutral values, and the summary of #22 can read them | 1, and *Out of scope*, the first item |

## User scenarios & acceptance *(mandatory)*

Every case of the daemon runs on a temporary repository whose records the case commits in the forms #42's *Data & interfaces* gives, or whose chain the fake adapter runs to a seal. No case reaches GitHub, and none starts a real `claude`. The cases of the check run `python3` as `test/pr-check.test.ts` does today. `test/seal-state.test.ts` is a new file of `apps/desktop/test/`. `chain.test.ts` and `get-a-seal.test.ts` are #41's. The crafter shows each new case red before it is planted (contract rule 15).

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A sealed head | Given a branch whose head commit holds round 1 with no finding, a run block and a seal whose `target:` names the gate's commit, with only closing records committed after that commit. Then the state is `sealed` and its commit is the sealed commit. Given the same branch with one more commit that changes `guarantee.md` below its block. Then the same | Cases of `test/seal-state.test.ts` |
| 2. Each commit that breaks a seal | Given scenario 1's branch and one more commit: one that changes a source file; one that changes `decisions.md`; one that adds a round record; a merge of a base that gained a commit; a merge commit that itself changes a source file; two commits of which the second takes the first back. Then the state is `broken` with the sealed commit, and the sentence names the first path that differs, or the step owed where no path differs | Cases of `test/seal-state.test.ts`, one for each history |
| 3. The line turns without a restart, whoever commits | Given a daemon with a connected client and a work item whose seal is `sealed`. When a commit is made with git in the worktree, and in a second case when the branch is moved from the repository's main checkout with `git update-ref`. Then, within the daemon's read interval, an `inbox` carries the work item with `seal.state` `broken`, and no message of a client asked for it | Cases of `test/daemon.test.ts`, with `commitPollMs` set by the case |
| 4. Only what a commit holds counts | Given a worktree whose `guarantee.md` holds a seal that no commit holds. Then `seal` is null. Given a sealed work item whose worktree gains an edit of a tracked file, an untracked file and a file git ignores, none committed. Then the state stays `sealed`. Given a sealed work item whose `decisions.md` gains an open question in the worktree, not committed. Then the state stays `sealed` | Cases of `test/seal-state.test.ts` |
| 5. No output and no stored state says sealed | Given a work item with no seal at its head, a pane of it that prints `Verdict: sealed`, and a stored chain whose state is `rested`. Then `seal` is null. Given a run folder whose stored chain has the state `sealed`. When a daemon starts on it. Then the work item's chain is null | Cases of `test/daemon.test.ts` and of `test/chain.test.ts` |
| 6. The state survives a restart | Given a sealed work item and a broken one, and a daemon that ended. When a second daemon starts on the same run folder and a client says hello. Then the first `inbox` after the read carries `sealed` for the one and `broken` for the other, with the same commits and the same sentence. The run folder holds no file that names either state | A case of `test/daemon-restart.test.ts`, which reads each file of the run folder for the two words |
| 7. No seal | Given a head with no `guarantee.md`; one whose newest block reads `withheld reason: x`; one whose `guarantee.md` holds a line the reader refuses; a branch reset to the commit before the guarantee; a work item with no directory. Then `seal` is null | Cases of `test/seal-state.test.ts` |
| 8. A seal whose commit the head does not hold | Given a seal whose `target:` names a commit that is no ancestor of the head, and one that names no commit of the repository. Then the state is `broken` and the sentence says so | Cases of `test/seal-state.test.ts` |
| 9. The daemon and the check agree | Given each history of scenarios 1, 2, 7 and 8 that holds a work item's directory, in a temporary repository. When the daemon's reading gives the state and `chain_check.py --baseline main` runs under a payload that says ready and holds no body. Then the check exits 0 where the state is `sealed`, and 1 where it is `broken` or null | One case of `test/pr-check.test.ts`, over a table of the histories |
| 10. A merge after the seal fails the check | Given scenario 1's branch, a base that gained a commit and a merge of it into the branch, and in a second case a merge commit that changes a source file. Then the check exits 1 and the guarantee arm's line says that the seal is broken and names the differing path and the sealed commit | Two cases of `test/pr-check.test.ts`. `git grep -n -e 'only=' -- pr-check/skills/code-review/scripts/chain_check.py` prints nothing. *Grounding* lists the two lines it prints at `40a50bf`, each of which *Scope* item 9 removes. The pathspec names that one file, so the search reads no file of this work item's directory. The search can fail: a build that keeps the parameter prints its line |
| 11. The check's outcome for a broken seal | Given a ready pull request whose head is scenario 2's first history. When `chain_check.py --baseline main --post` runs against the case's server. Then the request holds the conclusion `failure` and a title that says the seal is broken and names the sealed commit, and the script exits 1. Given the same head as a draft. Then the conclusion is `neutral`. Given a head with no guarantee. Then the title is #43's "No seal at the head commit" | Cases of `test/pr-check.test.ts` |
| 12. The seal section's sentence | Given the body the pull request stage composes. Then the seal section holds the sentence of *Data & interfaces*, and the check of #43's scenario 2 still exits 0 on it | A case of `test/pull-request.test.ts` and the case of `test/pr-check.test.ts` that reads that body |
| 13. A notification at the break, and only there | Given lists in which a work item's seal is `sealed`, then lists in which it is `broken`. Then one notification is given, titled with the work item's title, saying "Seal broken". Given `broken` in both lists; null and then `broken`; a muted work item; the work item whose view is in front. Then none | Cases of `test/view.test.ts` |
| 14. The line | Given a work item whose seal is `broken`, alone; with a running chain; with a stopped chain; with an open question; with a pull request whose check failed. Then the state and the second row are as *Scope* item 18 orders them. Given a sealed work item with no pull request. Then the state is `finished` and the second row is "Sealed" | Cases of `test/view.test.ts` |
| 15. The seal's place and the sealer's place | Given a seal of each state and null. Then `sealPlace` sets `data-seal` and the words of *Data & interfaces* for each of its callers' places. Given a work item whose `recorded.verdict` reads `sealed`, with `seal` `sealed`, `broken` and null. Then the sealer's place is finished, waiting with the note "Seal broken", and not started | Cases of `test/view.test.ts`, and of `test/approval-line.test.ts` for the drawn places |
| 16. The token and the document | Given `themes.css`. Then every block defines `--seal-broken-light`, and both editions of `docs/design.md` name it with the value each block holds | The cases of `test/themes.test.ts` that stand at `40a50bf`: "defines the same names in every block" and the case of `docs/design.md` |
| 17. A new seal reads the part that changed | Given scenario 2's first history and a chain started by `getSeal`. Then a verifying round runs on the commits after round 1's target, the gate runs, and the sealer's prompt names run 1 and its sealed commit and holds the paths that differ since that commit and no other path of the source. The second seal's `target:` names the new gate's commit against the base, and the state is `sealed` again. Given a seal whose sealed commit is no ancestor of the gate's commit. Then the prompt is the whole one | Two cases of `test/chain.test.ts` |
| 18. The bundle's sealer | Given the bundle. Then `agents/sealer.md` holds the paragraph on an earlier seal, and names no command | A case of `test/role-bundle.test.ts` |
| 19. The break in the window | Given the built app, started once through `BuiltApp.start` in the background, and a work item whose branch the case seals by committing the records. When the case makes one more commit with git in the worktree. Then the work item's line shows the broken seal and the waiting state with "Seal broken", and its view shows the button "Get a new seal" and the seal's sentence at its foot | One case of `test/get-a-seal.test.ts`, in the start that file makes |
| 20. The screenshots | Given the change of the window. Then the committed screenshots show a lit seal on one line and a broken seal on another, and the view of the broken one, in each theme and appearance the run makes | `pnpm run screenshots`, and the review reads the files against `docs/design.md` |

## Data & interfaces

**`apps/desktop/src/shared/protocol.ts`.** No field names a vendor, and none holds a session's id.

```ts
/** The seal the branch's head commit holds, as the daemon read it from git and the committed records. */
export interface Seal {
  /** `sealed` where the seal holds at the head. `broken` where the head holds a seal that a later commit broke. */
  state: "sealed" | "broken";
  /** The sealed commit, whole: the commit the newest verdict block's `target:` names. */
  commit: string;
  /** Why the seal is broken, as a sentence the window shows as it is, 2,000 characters of it at most. Null where it holds. */
  why: string | null;
}
```

- `WorkItem` gains `seal?: Seal | null`. It is optional because `Look.workItems` is a `WorkItem[]` and a look keeps no `seal`. The daemon sends it with every work item. Null says that the head commit holds no seal or that the daemon has read none yet. A daemon of an earlier build sends no such field, and a client reads its absence as null.
- `Chain.state: "running" | "parked" | "stopped" | "rested"`. The store reads a stored chain whose state is none of these as no chain.

**`apps/desktop/src/daemon/`.**

- `seal-state.ts`, new: one function that takes a worktree, the work item's directory, the head and the base, and answers a `Seal` or null by the table of *Scope* item 3. It reads the newest verdict through `chain-records.ts#lastVerdict`, the head reading through `chain.ts#standingOf`, and the step through the order's function. It holds no rule of its own on what follows a seal. It stores nothing.
- `chain.ts`: `standingOf` takes where `decisions.md`, `trail/gate.md` and `guarantee.md` are read, the worktree or the head commit. The sealer's prompt of *Scope* item 13. The state `rested`.
- `daemon.ts`: `readBranch` reads the state where the head moved, the map that keeps it by work item, `workItemOf`, which sends it, and the chain's run, which asks for the read when the chain rests or stops.
- `github.ts`: the sentence of the seal section.

**`pr-check/skills/code-review/scripts/chain_check.py`.** `guarantee` compares two trees (*Scope* item 9). `follows` takes no `only`. The function of the outcome gains the row below, before the row "Ready, and the guarantee arm refused".

| Outcome | Exit | Conclusion | Title |
|---|---|---|---|
| Ready, the newest verdict block is a seal, and the rounds arm, the gate arm or the guarantee arm refuses a record as behind HEAD or off it | 1 | `failure` | "Seal broken: a commit landed after `<the first 7 characters of the sealed commit>`" |

**The seal section's sentence**, in place of "The newest verdict of `<path>`, as this pull request's head commit holds it:".

```
The newest verdict of `<path>`. A seal binds the commit it names, and the check `Owlery seal` says whether it holds at this pull request's head commit:
```

**`apps/desktop/src/renderer/`.** `shared.ts#sealPlace(where, seal)`. `index.html` gains the rules of `data-seal="broken"`: on a line the small mark, and in the preview and at a view's foot the drawing, each parted in two by a clip of the page's own and lit by `--seal-broken-light`. `themes.css` gains `--seal-broken-light` in every block.

**The words of the window.** A state is two words at most, by `docs/design.md` *The voice of the window's words*. A commit is shown by its first seven characters. `frame/questions.md` Q3 leaves the wording of the sentences to the build.

| Where | Words |
|---|---|
| The seal's place with no seal | "No seal yet", as today |
| The seal's place, sealed | "Sealed at `3f2a9c1`" |
| The seal's place, broken | "Seal broken, sealed at `3f2a9c1`" |
| The second row of a line, sealed, with no pull request | "Sealed" |
| The second row of a line, broken | "Seal broken" |
| The notification | The work item's title, and "Seal broken" |
| The button at a broken seal | "Get a new seal" |
| The sealer's place, broken | The waiting mark, the note "Seal broken", the label "Seal broken, sealed at `3f2a9c1`", and the seal's sentence under the line |
| The line at the view's foot | "Sealed at `3f2a9c1`", or the seal's sentence |
| The seal's sentence, as this frame reads it | "`src/app.ts` changed after the sealed commit `3f2a9c1`." and "The branch no longer holds the sealed commit `3f2a9c1`." |

## Rule changes

- change
  file: docs/product.md
  section: The seal
  from: **The seal on the PR.** When a commit lands after the seal, the seal turns to broken. AgenticSeal's `chain_check` already makes the same judgment on the PR. If the HEAD of a ready PR has no `Verdict: sealed`, that check fails. The app puts this on screen.
  to: **The seal on the PR.** A seal holds at a branch's head commit where nothing but the closing records differs between the sealed commit and that head, and a round read every commit that changed anything else. Any other commit that lands after the seal breaks it, and a merge of the base is such a commit. The work item's line shows the seal lit where it holds and parted in two where it is broken. A seal that breaks makes the line wait, raises a notification, and turns the work item's button to "Get a new seal", after which one review round and the sealer read the part that changed. On the pull request the check `Owlery seal` makes the same judgment by the same rule, with or without the app: the commit that breaks a seal fails the check once it is pushed, and the check's title says that the seal is broken.
    check: apps/desktop/test/seal-state.test.ts apps/desktop/test/pr-check.test.ts apps/desktop/test/view.test.ts apps/desktop/test/chain.test.ts
- change
  file: docs/product.ko.md
  section: 인장
  from: **PR의 인장.** 인장 뒤에 커밋이 들어오면 인장이 깨진 상태로 바뀝니다. 같은 판정을 AgenticSeal의 `chain_check`가 이미 PR에서 하고 있습니다. 준비된 PR의 HEAD에 `Verdict: sealed`가 없으면 그 검사가 실패합니다. 앱은 이것을 화면으로 옮깁니다.
  to: **PR의 인장.** 인장이 찍힌 커밋과 브랜치의 head 커밋 사이에 마감 기록 말고는 다른 것이 없고, 그 밖의 것을 바꾼 커밋을 리뷰 회차가 모두 읽었으면 인장은 그 head에서 유효합니다. 인장 뒤에 들어온 그 밖의 커밋은 모두 인장을 깨고, 베이스를 머지한 커밋도 그런 커밋입니다. 작업의 줄은 인장이 유효하면 불이 든 인장을, 깨졌으면 둘로 갈라진 인장을 보입니다. 인장이 깨지면 그 줄은 사람을 기다리는 상태가 되고, 알림이 오고, 작업의 단추가 "Get a new seal"로 바뀝니다. 그 단추를 누르면 리뷰 한 회차와 sealer가 바뀐 부분을 읽습니다. PR에서는 `Owlery seal` 검사가 같은 규칙으로 같은 판정을 하고, 앱이 있든 없든 같습니다. 인장을 깬 커밋이 올라가면 그 검사가 실패하고, 검사의 제목이 인장이 깨졌다고 말합니다.
    check: apps/desktop/test/seal-state.test.ts apps/desktop/test/pr-check.test.ts apps/desktop/test/view.test.ts apps/desktop/test/chain.test.ts
- add
  file: docs/architecture.md
  section: Records are committed to the repository
  to: **Whether a seal holds is read from the branch's head commit alone, by one rule that the daemon and the check share.** The daemon reads the round records, `decisions.md`, `trail/gate.md` and `guarantee.md` as the head commit holds them, and gives them to the function that decides the step a chain owes. The seal holds where that function owes nothing. It is broken where the newest verdict block is a seal and a step is owed. A file of the worktree that no commit holds, a pane's output and a stored state decide nothing. The daemon stores neither answer: it reads them again when a branch's head moves and when it starts, so a restart changes none. The two states travel in the protocol as `sealed` and `broken`, with the sealed commit. The check's guarantee arm compares the tree of the sealed commit with HEAD's, as the daemon's gate does, so a merge commit after the seal is read as any other commit.
    check: apps/desktop/test/seal-state.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/daemon-restart.test.ts apps/desktop/test/pr-check.test.ts
- add
  file: docs/architecture.ko.md
  section: 기록은 저장소에 커밋합니다
  to: **인장이 유효한지는 브랜치의 head 커밋만 읽어서 정하고, 데몬과 검사가 같은 규칙 하나를 씁니다.** 데몬은 회차 기록, `decisions.md`, `trail/gate.md`, `guarantee.md`를 head 커밋에 담긴 대로 읽어, 체인이 다음에 할 단계를 정하는 함수에 넘깁니다. 그 함수가 할 단계가 없다고 답하면 인장은 유효합니다. 가장 새 판정 블록이 인장인데 할 단계가 있으면 인장은 깨진 것입니다. 커밋되지 않은 워크트리의 파일, pane의 출력, 저장해 둔 상태는 아무것도 정하지 않습니다. 데몬은 두 답을 어디에도 저장하지 않고, 브랜치의 head가 움직일 때와 데몬이 시작할 때 다시 읽으므로, 데몬을 다시 시작해도 답은 바뀌지 않습니다. 두 상태는 프로토콜에서 `sealed`와 `broken`으로 다니고, 인장이 찍힌 커밋이 함께 갑니다. 검사의 guarantee 부분은 데몬의 전체 검사 단계와 마찬가지로 인장이 찍힌 커밋의 트리와 HEAD의 트리를 비교하므로, 인장 뒤의 머지 커밋도 다른 커밋과 똑같이 읽습니다.
    check: apps/desktop/test/seal-state.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/daemon-restart.test.ts apps/desktop/test/pr-check.test.ts

## Removes

This work adds mechanisms: one field of the protocol, one notification, one row of the check's outcomes and one token. In return it takes out the walk of commits behind the guarantee arm, and the stored state that said `sealed`. The catch record of what goes: the walk passed a merge commit that changes a source file after the seal (*Grounding*, the probe), and a stored `sealed` stays as it is after the branch moves, which is the defect the issue names.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The walk of the commits after the sealed commit, in the guarantee arm, and the parameter that named which files may follow | `pr-check/skills/code-review/scripts/chain_check.py#guarantee`, the call of `follows` at line 1747, and `#follows`, its parameter `only` with the lines of its body and its docstring that read it | `chain_check.py#guarantee`, which compares the tree of the sealed commit with HEAD's (*Scope* item 9). No other call passes `only` (*Grounding*, the search) |
| The resting state that said a chain is sealed | `apps/desktop/src/shared/protocol.ts#Chain`, the state `sealed`, which #42 adds | The chain rests `rested`, and `WorkItem.seal` alone says whether a seal holds (*Scope* items 1 and 6) |
| The seal's place that is blank for every work item, with the comment that says no work item can be sealed | `apps/desktop/src/renderer/shared.ts#sealPlace`, the fixed `none`, and the sentence of its comment that opens "No work item can be sealed yet" | `sealPlace` reads the work item's seal (*Scope* item 15) |
| The comment that says nothing sets a sealed place | `apps/desktop/src/renderer/index.html`, the comment above the rules of `data-seal="sealed"`, its sentence "Nothing sets it before a work item can be sealed." | The rules are in use, and the comment says what sets them |
| The sentences that say the app lights no seal and that leave a broken seal's drawing to a milestone | `docs/design.md` *Components and their states*, the two last sentences under the table as #46 leaves them, and the same sentences of `docs/design.ko.md` | The same place, saying what the app draws (*Scope* item 17) |
| The row that marks the sealer's place finished from the verdict the worktree holds | `apps/desktop/src/renderer/view.ts`, the row "Sealer: the verdict is `sealed`" of the table #46 adds | The row reads `seal.state` (*Scope* item 20). `Recorded.verdict` stays for the `withheld` and the `undecided` rows |
| The seal section's sentence that says the head commit holds the verdict | `apps/desktop/src/daemon/github.ts`, the fixed sentence #43 gives | The sentence of *Data & interfaces*, which stays true after a later push (*Scope* item 10) |

Framed 2026-11-23 by framer, before the build.
