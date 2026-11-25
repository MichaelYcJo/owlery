# Review round 1: 1795632147-216-the-window-reads-the-lists-again

```seal
target: 76171cfd against release/v0.0.5
```

The base is `release/v0.0.5` at `943b1bfd`, which the branch merged at `f6151c0e` (executed: `git fetch origin` and `git merge-base HEAD origin/release/v0.0.5`). No earlier round stands, so no fact is carried: each coordinate below was opened at `76171cfd`.

## Findings

### 1. The pull request's body shows none of the six screenshots, though the policy asks the body to show each

```seal
severity: must
location: `seal/threads/1795632147-216-the-window-reads-the-lists-again/gaps.md:15`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/plan.md:40`
evidence: executed the plugin's `skills/code-review/scripts/pr_body.py seal/threads/1795632147-216-the-window-reads-the-lists-again --body <scratch>/body.md` at `76171cfd`, then `grep -c "raw=true" <scratch>/body.md`, which printed 0; read `docs/design.md:515`, `frame/plan.md:40`, `trail/phases/phase-2.md:54`
```

Why it matters: `docs/design.md:515` states that "the pull request's body shows each as `![what it shows](../blob/<commit>/<path>?raw=true)`". The plan's phase 2 *Verified by* cell (`frame/plan.md:40`) asks for the shots to be "committed under the work item's directory, linked as `docs/design.md` *A pull request that changes the window carries its screenshots* says". The six files are committed at `7336a3a1`, but no record holds a link to them. The body is what `seal pr-body` composes from the records, and the run above composed it at the target with no image in it. So the owner reading the pull request sees no screenshot of the head row, which the issue's last *Done when* item asks for ("The PR carries screenshots of the head row in every theme"). `pr.md` cannot carry the links, since it holds only `Closes` lines, quotes and the attribution line (the plugin's `skills/code-review/orchestration.md` *Orchestrator: the pull request opens once the sealer seals*). `gaps.md` `## Not done` is copied whole into the body, and the changelog fragment also feeds the release notes, where a `../blob/` link resolves elsewhere. So the links belong in `gaps.md`, under the paragraph that already names the shots. The search on "linked" (`git grep -n -F "linked" -- seal/threads/1795632147-216-the-window-reads-the-lists-again`) printed `frame/plan.md:40` as the one statement of the link, which the fix below makes true; it is a sample of the fact's statements. The set of shots depends on the question in `## Not judged` row 1; the fix covers the six that stand.

```markdown
**Only the inbox's shots are committed.** Every view of the screenshot run shows the sidebar's head, and the head row draws nothing that depends on the view. So the six shots of the inbox, one for each theme and appearance, show the row the work changes. The other 72 shots of the run stand in the crafter's scratch directory and are not committed. Grounds: `docs/design.md` *A pull request that changes the window carries its screenshots* asks for a shot of each view the pull request changed, and what this work changes in each view is the row these shots hold.

![The sidebar's head in Night watch, dark](../blob/7336a3a1f4fd764e7ba9485e9458734fd3240445/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/night-watch-dark-inbox.png?raw=true)

![The sidebar's head in Night watch, light](../blob/7336a3a1f4fd764e7ba9485e9458734fd3240445/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/night-watch-light-inbox.png?raw=true)

![The sidebar's head in Register, dark](../blob/7336a3a1f4fd764e7ba9485e9458734fd3240445/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/register-dark-inbox.png?raw=true)

![The sidebar's head in Register, light](../blob/7336a3a1f4fd764e7ba9485e9458734fd3240445/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/register-light-inbox.png?raw=true)

![The sidebar's head in Desk, dark](../blob/7336a3a1f4fd764e7ba9485e9458734fd3240445/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/desk-dark-inbox.png?raw=true)

![The sidebar's head in Desk, light](../blob/7336a3a1f4fd764e7ba9485e9458734fd3240445/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/desk-light-inbox.png?raw=true)
```

### 2. The frame and the phase 2 record say `refresh.ts` exports the four sentences of the words table, and it exports three

```seal
severity: should
location: `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:96`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/trail/phases/phase-2.md:13`
evidence: executed `grep -n "export const" apps/desktop/src/renderer/refresh.ts`, which printed lines 13, 15, 17 and 19; executed `git grep -n -F -e "four sentences" -e "exports the words" -e "exports all" -- seal/threads/1795632147-216-the-window-reads-the-lists-again apps/desktop`, which printed `frame/design.md:96` and `trail/phases/phase-2.md:13`; read `apps/desktop/src/daemon/daemon.ts:923`
```

Why it matters: `frame/design.md:96` says of `refresh.ts` "It exports the words below", and the table below it (`frame/design.md:102-107`) holds four sentences, the last being the daemon's refusal. `trail/phases/phase-2.md:13` says "The module still exports all four sentences". At the target, `refresh.ts` exports `REFRESH_ANSWER_MS` and three sentences: `REFRESH_SAYS` (line 15), `REFRESHING_SAYS` (line 17) and `NO_ANSWER_SAYS` (line 19). The refusal's sentence is built in the daemon, at `daemon.ts:923` inside `answerReadLists`, and the window shows it as the daemon sends it. The settle and the sealer read these two sentences, and a later edit that looks for the refusal's words in `refresh.ts` finds none. The grep above is a sample; it found these two statements.

```markdown
In `frame/design.md` *Data & interfaces*, the bullet of `refresh.ts`:
It exports the window's three sentences of the table below, and the daemon's refusal is written in `daemon.ts#answerReadLists`; the tests pin them as literals, and import only `REFRESH_ANSWER_MS` and `NO_ANSWER_SAYS`, the second to check it against its literal.

In `trail/phases/phase-2.md`, the paragraph "Departure: the tests pin the words as literals":
The module still exports the window's three sentences, and `sidebar.ts` reads the two sentences of the button from it.
```

### 3. The plan says the no-answer sentence stands beside the notice of a daemon of another build, and it replaces that notice

```seal
severity: should
location: `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/plan.md:55`
evidence: read `apps/desktop/src/renderer/view.ts:904-916`, `apps/desktop/src/renderer/sidebar.ts:88-104`, `apps/desktop/src/renderer/refresh.ts:60-65`, `apps/desktop/src/renderer/renderer.ts:1944-1948`; executed `git grep -n -F -e "beside the notice" -e "Restart Daemon" -- seal/threads/1795632147-216-the-window-reads-the-lists-again`, which printed `frame/plan.md:55` alone
```

Why it matters: `frame/plan.md:55` says that against a daemon of an earlier build, "After 15 s its status line says that the daemon did not answer, beside the notice it already shows for a daemon of another build, which names "Restart Daemon…"". The status line shows one notice. `sidebar.ts#showStatus` draws `statusNotice(notice, held.daemonNotice, held.agentNotice)`, and `view.ts:915-916` returns `own || daemon || agent`. The wait's end calls `world.tell(NO_ANSWER_SAYS)` (`refresh.ts:60-65`), which sets the window's own notice. So the sentence "Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it." (`view.ts:905`) leaves the status line. It comes back only at the next `tell("")`, such as the `done` of another request (`renderer.ts:1946`). The person this case is written for is the one with an old daemon, and the press takes the restart hint away from that person. The paste-ready fix states what the code does. The other repair keeps the restart hint in view, for example by ending `NO_ANSWER_SAYS` with the restart sentence where `held.daemonNotice` stands. That is a change to what a person reads, so it owes a case in `apps/desktop/test/refresh.test.ts` and the frame's words table, and the orchestrator chooses between the two.

```markdown
The protocol gains one client message, `readLists`, and one daemon option, `listsWaitMs`. A window of this build against a running daemon of an earlier build gets no answer to a press. After 15 s its status line says that the daemon did not answer, in place of the notice it shows for a daemon of another build, which names "Restart Daemon…" (`docs/architecture.md` *Overall layout*). That notice comes back at the window's next request that the daemon answers with `done`, since the status line shows the window's own notice first (`view.ts#statusNotice`). No migration, no environment variable, no dependency and no move of the version.
```

### 4. `frame/plan.md` *Judgments of the run* holds no row, so `pr.md` quotes no reason for the title's prefix

```seal
severity: should
location: `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/plan.md:61`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/pr.md`
evidence: read `frame/plan.md:57-61`, `pr.md:1-10`, the plugin's `skills/commit-pr-convention/SKILL.md` *Pull request bodies* and `skills/code-review/orchestration.md` *Orchestrator: the pull request opens once the sealer seals*
```

Why it matters: the plugin's `skills/commit-pr-convention/SKILL.md` says "Why the title takes its prefix, and the kind that came closest where one did, is one row of `frame/plan.md` *Judgments of the run*, which `pr.md` quotes. The orchestrator writes that row before it writes `pr.md`." At the target the table holds one empty row (`frame/plan.md:61`), and `pr.md` quotes no judgment of the run. `pr.md` is committed, so the row was due before it. The body the owner reads therefore does not say why the title is `feat:`. The row and the quote are the orchestrator's to write. The words below are a draft for the orchestrator to check against its own judgment.

```markdown
In `frame/plan.md` *Judgments of the run*, in place of the empty row:
| 2026-11-26 | The pull request's title takes the prefix `feat:`. | The work adds a control to the window and a client message to the daemon, which let a person do what the window did not offer before. `fix:` came closest, since the issue names a window that looks wrong, but nothing that existed was broken. | the plugin's `skills/commit-pr-convention/SKILL.md` |

In `pr.md`, after the quote of `frame/questions.md` Q1:
- "The pull request's title takes the prefix `feat:`." (`frame/plan.md` *Judgments of the run*)
```

## Confirmations

What matched: *Scope* items 1 to 4 against `apps/desktop/src/daemon/daemon.ts`. `handle` routes `readLists` to `answerReadLists` (`daemon.ts:1742`). `answerReadLists` (`daemon.ts:912-931`) awaits the read of git under way, then calls `readOutside`, then waits for git and for the race of the watch's turn against `listsWaitMs` (5000 by default). It sends the asker alone an `inbox` and then `done`, or an `error` whose text cuts the trailing full stops and sends no `inbox`. Executed: `node scripts/test-in-electron.mjs test/daemon.test.ts -t "readLists|hello"` in `apps/desktop` passed 14 cases, the 7 new ones and the 7 whose names hold "hello".

What matched: *Scope* item 2 and `## Removes` row 1. `readOutside` (`daemon.ts:867-876`) holds the notice, the clearing of the due times, the count and the read of git, and `accept` calls it once (`daemon.ts:844`). Executed: `git grep -n 'pullRequestDue.clear()' -- apps/desktop/src` printed `daemon.ts:871` alone, and `git grep -n 'readAgentNotice()' -- apps/desktop/src` printed lines 575, 869 and 4285, as `trail/phases/phase-1.md:7` states.

What matched: the axis *Concurrency & atomicity*, walked by reading `daemon.ts:4091-4168`. A `readOutside` during a turn pushes its wait after that turn spliced its own (`daemon.ts:4116`). That turn's reads began before the ask, so `readPullRequest` sets no due time for them (`daemon.ts:4151`, `:4165`). The turn's `finally` then calls `scheduleWatch`, which arranges the next turn at once, and that turn reads every watched pull request and settles the new wait. A watch left empty settles every wait at once (`daemon.ts:4107-4109`). Two `readLists` that arrive together await the same read of git, and the second's `readCommitsNow` gives the read the first started after both arrived. A daemon that closes meanwhile leaves the wait on the turn unsettled, but the bound's timer still ends the wait, and `answerReadLists` then sends nothing (`daemon.ts:928`). The daemon's `main.ts:61-64` exits the process after `close`, so that timer holds nothing.

What matched: the axis *Security*. `readLists` is handled only after the hello's token matched (`daemon.ts:833-845`). Its one field, `requestId`, is only echoed back. The message reaches `gh` and git only through the watch and `readCommits`, which run on their timers today, and the window sends nothing for a second press while its first is under way (`refresh.ts:58`).

What matched: `gaps.md:8`, the client that leaves while its `readLists` is answered. `answerReadLists` checks `!this.closed && this.clients.has(socket)` before the `error` (`daemon.ts:923`) and before the `inbox` and `done` (`daemon.ts:928`), and the socket's `close` handler deletes it from `clients` (`daemon.ts:850-853`). The two sends after the check are synchronous. Read.

What matched: `gaps.md:9`, the refusal's route. The `error` case calls `requestRefused`, which clears only the ask and the gate request of the same id (`work-item-view.ts:1389-1392`). It then calls `refreshing.refused` (`renderer.ts:1999`), whose `end` stops the wait and draws the button at rest, and which then calls `tell(message)` with the daemon's sentence (`refresh.ts:71-75`). Read.

What matched: `gaps.md:10`, the arrows. `#refresh-lists[aria-busy="true"] svg { animation: turn 1.1s linear infinite; }` stands at `index.html:251`, beside the working mark's 1.1s at `index.html:128-129`. The rule at `index.html:629-631` sets `animation: none !important` on every element under the system's setting for less motion. That the outer `svg` turns about its centre with the default `transform-origin` is read, not seen.

What matched: `gaps.md:11`, the 15-second wait. `press` asks `world.after(REFRESH_ANSWER_MS, …)` (`refresh.ts:60-65`), and `renderer.ts:124-133` gives `after` as a `setTimeout` that the answer clears. The sentence is pinned by the unit case at `test/refresh.test.ts:68-83`. Executed: `node scripts/test-in-electron.mjs test/refresh.test.ts` passed 4 cases. Finding 3 names what that sentence does to the status line.

What matched: *Scope* items 5 and 6, and the words. The button stands after `#bell` (`index.html:663-665`). `initSidebar` wires it and draws it at rest (`sidebar.ts:66-67`). `showRefresh` sets the `title`, the `aria-label` and `aria-busy` (`sidebar.ts:81-87`). The words match `frame/design.md:104-107` letter for letter, `REFRESHING_SAYS` with the ellipsis U+2026. Read.

What matched: the *Figure against its text* axis. The six PNG files under `screenshots/` each show the head row at rest with the bell and its count 3, the two arrows, the filter's lines and "+", in that order, as `docs/design.md:444` and `docs/design.ko.md:444` state and as `trail/phases/phase-2.md:54` says. Read: each image opened.

What matched: the axis *Record against another work item's frame*. #242's `add` to `docs/architecture.md` *Screen framework: Electron* (`seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md:88-91`) holds the draw until the release, and this work's `add` to the same section says the answer is drawn through that hold. The two texts agree. #214's row "The delete dialog" and this work's row "The sidebar's head" are separate additions to *Components and their states*. Executed: `grep -n -F "Screen framework: Electron" seal/threads/*/frame/design.md`, `grep -n -F "Components and their states" seal/threads/*/frame/design.md`.

What matched: the new cases read against their groups. Each new case of `daemon.test.ts` holds a behaviour no earlier case holds. The notice's case (`test/daemon.test.ts:6169-6186`) also pins that the answer does not wait for the adapter, since the press's ask is still unanswered when `done` arrives. The new id in `test/work-item-menu.test.ts:602` adds the button to the case of icon-only buttons. `test/refresh.test.ts` is a new group. Read.

What matched: the label of the suite. `gaps.md:7` names the full suite, the typecheck, the lint and the count of table rows across the two editions as unverified, with the orchestrator's broad gate as their answerer. The label is honest: neither phase record claims a run of any of them.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether six shots of the inbox satisfy "a screenshot of each view it changed" (`docs/design.md:507`), when every view shows the changed head row. The grounds stand in the build's account alone (`gaps.md:15`), so this round does not pass them | `seal/threads/1795632147-216-the-window-reads-the-lists-again/gaps.md:15` | the orchestrator |
| The merge order with #215. `frame/plan.md:48` says #215 merges first, so the shots show the filter's form as it ships. At the target #215 has no pull request (executed: `gh pr list --state all`), and `origin/release/v0.0.5` holds none of its commits | `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/plan.md:48` | the orchestrator |
| The full suite, the typecheck, the lint, the count of table rows across the two editions of `docs/design.md`, and the built-app files `test/notification-click.test.ts`, `test/work-item-menu.test.ts` and `test/screenshots.test.ts`, which this round did not run | `seal/threads/1795632147-216-the-window-reads-the-lists-again/gaps.md:7` | the orchestrator's broad gate |
| How the arrows look while they turn, and that they turn about their centre | `apps/desktop/src/renderer/index.html:251` | a person's look at the built app |

## Probes

No probe file was written. The runs below are this round's, in the branch worktree at `76171cfd`.

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/refresh.test.ts`, in `apps/desktop` | exit 0: 4 cases passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "readLists\|hello"`, in `apps/desktop` | exit 0: 14 cases passed, 377 skipped |
| the plugin's `skills/code-review/scripts/pr_body.py seal/threads/1795632147-216-the-window-reads-the-lists-again --body <scratch>/body.md`, then `grep -c "raw=true"` on the body | the body was written; 0 lines hold an image link |
| `git grep -n 'pullRequestDue.clear()' -- apps/desktop/src` and `git grep -n 'readAgentNotice()' -- apps/desktop/src` | `daemon.ts:871`; `daemon.ts:575`, `:869`, `:4285` |
