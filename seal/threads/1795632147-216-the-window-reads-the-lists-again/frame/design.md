# Design: 1795632147-216-the-window-reads-the-lists-again

## Grounding

The tree as read at `8c7eb798`, the work item's branch, which is `release/v0.0.5` at `f3194f99` plus the commit that declares `routing.md`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/design.md` *Principles*, item 8 | Every form is stated in *Components and their states*, and the pull request that draws a form writes its row in both editions and leaves none to the release's settle. So the build writes the head row's row in place (*Scope* item 8), and it is not a `## Rule changes` operation. |
| `docs/design.md` *Principles*, item 5 | The one duration of motion belongs to no theme. The refresh button's working state turns at the 1.1s that the working mark already uses (`apps/desktop/src/renderer/index.html:128-129`), and the page's reduced-motion rule (`index.html:619-620`) stops it as it stops every animation. |
| `docs/design.md` *Components and their states*, the row "An icon's button" | The refresh is an icon's button, with that row's forms under the pointer, pressed and focused. The table holds no row for the sidebar's head (read: lines 436 to 461), so *Scope* item 8 adds one. |
| `docs/design.md` *The voice of the window's words* | A button is the act it does, in a whole sentence and in sentence case, with no first person. The words of *Data & interfaces* follow it. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | The screenshots are made by `pnpm run screenshots` in `apps/desktop`, with `OWLERY_SCREENSHOT_THEMES=all` for every theme, and committed under the work item's directory. The list of views does not change, since every view shows the sidebar's head. |
| `docs/architecture.md` *Code runs the order, the orchestrator judges*, the paragraph on the pull request stage | The daemon reads an open pull request again on a timer with one call of `gh`, while a client is connected. A refresh's read of the pull requests is that same call, made at once. |
| `docs/architecture.md` *Screen framework: Electron*, and the `add` in work item #242's `frame/design.md` (merged, unsettled) | A daemon message that changes the lists is drawn through the hold, `draws.draw(drawLists)`, so a press held at its arrival keeps its click. The refresh's answer is an `inbox`, which `renderer.ts#takeLists` already draws that way (`renderer.ts:1595`). |
| `docs/architecture.md` *Overall layout*, "The daemon stays alive while the app restarts or updates" | The daemon outlives the window for days, so what it read from outside can stand stale for as long as its timers allow. That is why a person needs a press that reads it now. |

Facts this frame rests on, each labelled:

- **The issue has no comments** (executed: `gh issue view 216 --json title,body,comments`, 2026-11-26).
- **The triage's coordinates hold.** The head row is `index.html:647-658` (`#repositories-head`: the caption, `#bell` at 649, the filter at 653, `#new-work-item` at 657). The window sends its `hello` at `renderer.ts:2031`. The daemon refuses anything but a `hello` first at `daemon.ts:830`, and sends `ready` with `this.lists()` at `daemon.ts:878` (read).
- **What a hello has the daemon read again from outside**, at `daemon.ts#accept` (lines 838 to 842) and `#greet` (871 to 876): the notice of its agent where one stands (`readAgentNotice`), every open pull request it watches (`pullRequestDue.clear()` and `scheduleWatch()`), git through `readCommitsNow()`, raced against `readyWaitMs` (500 ms), and the machine (`readMachineNow`) (read).
- **What `readCommits` reads** (`daemon.ts:4130-4139`): each work item's record from its worktree, each branch's counts, head, commits, changes and seal from git (`readBranch`), and each repository's records place from its working tree (`readRecords`). It broadcasts an `inbox` only where something changed (read).
- **How often the daemon reads them by itself.** `readCommits` runs `commitPollMs` (3000 ms) after the last read while a client is connected (`daemon.ts:4026-4036`). The watch reads a pull request again after `PR_POLL_MS` (30 s) while its checks run, and after `PR_REST_POLL_MS` (5 minutes) otherwise (`github.ts:32-35`, `daemon.ts:4087-4105`) (read).
- **The daemon holds no list of worktrees on disk.** Every work item is one the store holds. `git worktree list` is read only for the main checkout and for a delete's loss (`worktrees.ts:115`, `worktrees.ts:723`). No daemon code lists the linked worktrees to find new ones (executed: `git grep -n '"worktree", "list"\|worktree list' -- apps/desktop/src`).
- **A message the daemon does not know is dropped with no answer** (`daemon.ts:1701`, `default: return`) (read). So a daemon of an earlier build sends nothing back to a `readLists`.
- **The window draws the screen in front, the view and the filter from what it holds at each `inbox`.** `takeLists` replaces the lists and calls `draws.draw(drawLists)`. `drawLists` draws the sidebar, the list or the view in front and each open dialog that names the lists. It changes neither `front` nor the view's pane nor `held.filter` (`renderer.ts:1543-1557`, `sidebar.ts:131-147`) (read).
- **The `ready` handler opens the summary or the inbox** (`renderer.ts:1817-1818`), and a closed socket drops every pane the client had attached (`daemon.ts:849-853`) (read). So a refresh cannot be a second hello without losing what the person had in front.
- **A call of `gh pr view` with the watch's fields took 0.67 s, 0.51 s and 0.64 s** on this machine, for pull request #243 of this repository (executed: `/usr/bin/time -p gh pr view 243 --json number,url,state,isDraft,headRefOid,mergedAt,statusCheckRollup`, three runs, 2026-11-26). `gh` may run `GITHUB_LIMIT_MS` (60 s) before the daemon ends it (`github.ts:29`, read).
- **Git's reads of one branch took about 22 ms a call.** Three calls of the kinds `readBranch` makes, for each of the 12 local branches of the main checkout, one after another, took 780 ms (executed: a loop of `git rev-list --count`, `git rev-parse --verify` and `git rev-list --left-right --count` over `git for-each-ref refs/heads`, 2026-11-26). The daemon makes these reads for its work items in parallel. The owner's own store holds one repository and one work item that is not archived, with no open pull request (executed: a count of `~/Library/Application Support/@owlery/desktop/run/repositories.json`, read-only, 2026-11-26). So the window's 15 s wait (*Scope* item 7) stands far above a git read the owner's daemon makes today.
- **The suite's stand-in for `gh` can hang** (`gh.answer(kind, { hangs: true })`, `apps/desktop/test/chain-run.ts:140-146`, read), so the case of the daemon's wait on the pull requests can fail.
- **Whether Electron's `viewMenu` role, which `main/menu.ts:68` puts in the menu bar, offers a reload is unverified.** The installed Electron 45.3.3's typings name the role and not its items (read: `node_modules/electron/electron.d.ts:10350`). A reload would open the window on the summary or the inbox anyway (`renderer.ts:124`), so the answer does not change what gets built.
- **The policy root has no index.** `docs/` holds no `README.md` (executed: `ls docs`), so each `file:` below is the document that holds the section, as the release's earlier work items name them.
- `seal/follow-up.md` and `seal/parity.json` do not exist (executed: `ls`). Neither the latest release's notes (`v0.0.4`) nor any changelog fragment under `seal/threads/` holds a `### Process changes` heading (executed: `gh release view`, `grep`).
- **The searches of *User scenarios & acceptance* and of `plan.md`'s *Verified by* cells were run at `8c7eb798`** (executed). `git grep -n 'pullRequestDue.clear()' -- apps/desktop/src` prints `daemon.ts:841`, inside `accept`, which `## Removes` row 1 moves. `git grep -n 'readAgentNotice()' -- apps/desktop/src` prints `daemon.ts:569` (the daemon's start, which stays), `daemon.ts:839` (inside `accept`, which `## Removes` row 1 moves) and `daemon.ts:4222` (the definition, which stays). `git grep -n 'id="refresh-lists"\|readLists' -- apps/desktop/src docs` prints nothing. Each pathspec leaves out `seal/`, so this frame's own quotes of the patterns are not matched.

## Scope

In:

1. **A client message `readLists`, with a `requestId`.** The daemon answers the client that sent it with an `inbox` holding the four lists whole, whether or not anything changed, and then a `done` with the request's id. Where a read throws, it answers with an `error` whose sentence is "The work items were not read again: <the read's sentence>.", with the read's trailing full stops cut, and sends no `inbox`. The thrown message names no subject, so the daemon wraps it in a whole sentence, as *The voice of the window's words* asks.
2. **One daemon method, `Daemon#readOutside`, holds what a client's hello has the daemon read again from outside**, and both the hello and `readLists` call it. It reads the agent's notice where one stands, makes every watched pull request due now, and reads git. It gives the read of git, and a promise that settles once the watch's turn that reads those pull requests has ended, or at once where the watch reads none. The hello keeps its race of the git read against `readyWaitMs`, and its read of the machine, which `ready` carries.
3. **Everything a `readLists` asks for starts after the message arrived.** Where a read of git is under way, the daemon waits for it to end and only then calls `readOutside`, so a commit made just before the press is in the answer. The notice and the pull requests are asked for after that wait too.
4. **The answer waits for the reads of the pull requests that the press asked for, up to `listsWaitMs`, 5 s by default, counted from the call of `readOutside`.** A pull request whose read ends after the wait reaches every client in the watch's own `inbox`, as it does today. The bound is about eight times the slowest call measured (0.67 s), and far under the 60 s that `gh` may run.
   **A read of a pull request that was under way when `readOutside` made every pull request due leaves its pull request due**, so the watch's next turn reads it again at once. The daemon counts the calls of `readOutside` (`pullRequestAsks`), and `readPullRequest` sets the next read only where no call came after its read began. Without the count, a turn under way at the press would end by setting that pull request's next read `PR_REST_POLL_MS` away. The press would then read it again not at all, and the answer would wait the whole `listsWaitMs` for a turn that does not come. What waits on the next turn is kept in `turnWaits` and settled at the end of that turn.
   **The hello shares this.** Since the hello calls the same method, a hello that arrives while the watch asks `gh` for a pull request has that pull request read once more after the turn ends, where at `8c7eb798` it was not. That costs one more call of `gh` for each pull request whose read was under way, and the hello reads the same list as before.
5. **The sidebar's head holds a refresh button after the bell**, in the order bell, refresh, filter, "+". It is an icon's button. It does nothing before the daemon's `ready`.
6. **A press sends one `readLists`, and the button shows it is working until the answer ends.** While it works, its arrows turn, it says the working words to a pointer and to a screen reader, it carries `aria-busy="true"`, and a second press sends nothing. `takeLists` draws the answer's `inbox` through the hold of #242, so the screen in front, the view's pane in front and the filter stay.
7. **A refusal and a missing answer are said in the status line.** A refusal shows the daemon's sentence. Where no `done` and no `error` arrives within 15 s, the button stops working and the status line says that the daemon did not answer. A daemon of an earlier build, which drops the message, is told this way. An answer that arrives after the wait is drawn as any `inbox` is.
8. **`docs/design.md` and `docs/design.ko.md` each gain a row "The sidebar's head" in *Components and their states***, written in place by the build. Its English text is under *Data & interfaces*.
9. **The pull request carries screenshots of the head row in every theme**, made by `OWLERY_SCREENSHOT_THEMES=all pnpm run screenshots`.

Out:

- **Reading the worktrees on disk.** The daemon holds no list of them to read again (*Grounding*). Issue #227 adds the read that finds a worktree Owlery did not make. That read joins `readOutside`, so a press reads it from then on with no change here.
- **The machine and the accounts.** Neither is in the four lists. The Machine dialog reads the machine at its opening (`readMachine`), and an account's usage has its own button, which spends a session.
- **A key for the press.** Command-R may already be the menu's reload (*Grounding*, unverified), and the issue asks for no key.
- **What #215 changes in the head row**, the filter's mark and the empty sidebar's sentence. `plan.md` *Overlap with the release* says how the two rows meet.

## User scenarios & acceptance *(mandatory)*

A line number in this section is the line at `8c7eb798`, the tree *Grounding* names. The build and the merges of the release moved them, so a case is found at HEAD by its name.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A press reads again and keeps what is in front | Given a window with a work item's view in front, a pane of it in front and a state chosen in the filter. When the person presses the refresh button. Then the button works and then rests, the sidebar is drawn again from the answer, and the view, its pane in front and the filter are those the person had. | A built-app case in `apps/desktop/test/notification-click.test.ts` presses `#refresh-lists`. It reads `aria-busy` going to `true` and back, reads that the sidebar's sections are new elements, and reads the view, the pane in front and the filter's value against those before the press. Seen red with the button's click handler removed. |
| A press sends one request | Given the window after `ready`. When the person presses twice while the first answer is on its way. Then the window sent one `readLists` with a new `requestId`, and nothing for the second press. | A unit case in `apps/desktop/test/refresh.test.ts` drives the module of *Data & interfaces* with a recording `send`, as `press.test.ts` drives `press.ts`. |
| The answer is the lists, then `done` | Given a daemon with one client. When the client sends `readLists`. Then it receives an `inbox` with the four lists and then a `done` with the same `requestId`, though nothing changed. | A case in `apps/desktop/test/daemon.test.ts`. Seen red against the tree before *Scope* item 1, where the daemon drops the message. |
| A press reads git now | Given a daemon whose `commitPollMs` is longer than the case, and a commit made on a work item's branch after the client's `ready`. When the client sends `readLists`. Then the answer's `inbox` holds the new count. | A case in `apps/desktop/test/daemon.test.ts`. |
| A press reads the pull requests now | Given the watch's fixture of `daemon.test.ts` (`watched`, line 7339) with `prRestPollMs` of a minute, after its first read. When the client sends `readLists`. Then `gh` is called once more before the `done`, and the answer's `inbox` holds what that call gave. | A case in the describe "the watch of an open pull request" of `daemon.test.ts`. |
| A slow `gh` does not hold the answer | Given the same fixture, a `gh` that hangs (`hangs: true`) and a short `listsWaitMs`. When the client sends `readLists`. Then the `done` arrives after `listsWaitMs`, with the pull request as the last read gave it. | A case in the same describe of `daemon.test.ts`. |
| A press during a read of `gh` reads that pull request again | Given the watch's fixture, and a `readLists` that arrives while the watch's call of `gh` for the pull request is under way. When that call ends. Then the next turn reads the pull request again at once, `gh` is called twice in all, and the answer holds what the second call gave. | The case "reads the pull request again after the read under way where a `readLists` arrives while gh is asked" of `daemon.test.ts`, seen red with `pullRequestAsks` not counted, and with the next read set though `readOutside` came after the read began (`trail/phases/phase-1.md`). |
| A read that throws is refused | Given a daemon whose read throws once `ready` has gone. When the client sends `readLists`. Then it receives an `error` with the request's id, whose sentence is "The work items were not read again: <the read's sentence>.", and no `inbox`. | The case "answers a `readLists` whose read throws" of `daemon.test.ts`, which pins the whole text. |
| A refusal is said | Given the window after a press. When the daemon answers with an `error`. Then the button rests and the status line shows the error's sentence as the daemon sent it. | A unit case in `refresh.test.ts` for the module's end of the request, and the review's reading of the `error` case of `renderer.ts#onMessage`. |
| A daemon that does not answer is said | Given the window after a press, and no answer. When 15 s pass. Then the button rests and the status line says "The daemon did not answer in 15 seconds, so the lists stand as they were." | A unit case in `refresh.test.ts` with a stand-in schedule, which pins the sentence. |
| The hello reads as before | Given a client's hello. Then the daemon reads the same list as at `8c7eb798`: the agent's notice, the pull requests and git. Where the hello arrives while the watch asks `gh` for a pull request, that pull request is read once more after the turn ends, which at `8c7eb798` it was not (*Scope* item 4). | The existing cases of `daemon.test.ts` whose names hold "hello", the agent's notice at line 6084 and the pull request at line 7369 among them. `git grep -n 'pullRequestDue.clear()' -- apps/desktop/src` prints one line, inside `readOutside`. |
| The button is named | Given the window. Then the refresh button says its act to a pointer and to a screen reader. | The case at `work-item-menu.test.ts:598`, which requires a title on every button that shows an icon alone, names `refresh-lists` among the ids it expects. |
| The form is stated | Given the pull request. Then both editions of `docs/design.md` hold the row "The sidebar's head", and the pull request's body shows the head row in every theme. | The broad gate's count of table rows across the two editions (the orchestrator's), and the review's reading of the row and the screenshots. |

## Data & interfaces

A line number in this section is the line at `8c7eb798`, the tree *Grounding* names, beside which the build was to make its change. The build and the merges of the release moved them.

**Protocol (`apps/desktop/src/shared/protocol.ts`).**

- `ClientMessage` gains `| { type: "readLists"; requestId: number }`, beside `readMachine` (line 948), with a comment that says what *Scope* items 1 to 4 say.
- The comment of `inbox` (line 957) adds that the daemon also sends it to the client that sent a `readLists`, as the answer, before that request's `done`.
- The comment of `done` keeps that it comes before the `inbox` that carries what a request changed, and adds that a `readLists`'s `done` follows the `inbox` that answers it.

**Daemon (`apps/desktop/src/daemon/daemon.ts`).**

- `DaemonOptions` gains `listsWaitMs?: number`, beside `readyWaitMs` (line 292), 5000 by default.
- `handle` gains a `readLists` case beside `readMachine` (line 1685), which calls `answerReadLists(socket, requestId)`. That method waits for the read of git under way, calls `readOutside`, and waits as *Scope* items 3 and 4 say. It then sends `{ type: "inbox", ...this.lists() }` and `{ type: "done", requestId }` to that socket alone, or the `error` of *Scope* item 1. A socket that closed meanwhile is sent nothing.
- `readOutside(): { commits: Promise<void>; pullRequests: Promise<void> }` takes the lines `accept` held at 838 to 842. `accept` passes its `commits` to `greet`, which races them against `readyWaitMs` as before. The name avoids the word "look", which names the person's last look (`last-look.ts`).
- The watch gains `pullRequestAsks`, the count of the calls of `readOutside`. `readPullRequest` reads the count at its start and compares it at its end before it sets the next read. The watch also gains `turnWaits`, what waits on its next turn. `scheduleWatch` settles the waits at the end of the turn that started after they were added, and at once where no pull request is watched.

**Window.**

- `apps/desktop/src/renderer/index.html`: `<button id="refresh-lists" class="icon-button">`, after `#bell` in `#repositories-head`. Its icon is two arrows round a circle, in the 16-unit `viewBox` the other icons use. A rule turns the icon at 1.1s while the button carries `aria-busy="true"`, with the page's `@keyframes turn`.
- `apps/desktop/src/renderer/refresh.ts`, a module that touches no page when it is imported, as `press.ts` does, so the unit project imports it. It holds the request's life: a press sends one `readLists` where none is under way, the request ends at its `done` or its `error`, and it ends after `REFRESH_ANSWER_MS`, 15 000, with the sentence of no answer. It exports the window's three sentences of the table below, and the daemon's refusal is written in `daemon.ts#answerReadLists`; the tests pin them as literals, and import from `refresh.ts` only `REFRESH_ANSWER_MS` and `NO_ANSWER_SAYS`, the second to check it against its literal.
- `apps/desktop/src/renderer/sidebar.ts`: `SidebarActions` gains `refresh()`, wired in `initSidebar`, and the module gains a function that draws the button at rest or working.
- `apps/desktop/src/renderer/renderer.ts`: the `done` and `error` cases of `onMessage` end the refresh's request where the id is its own. The `error` case already says an unclaimed refusal in the status line (`tell(message.message)`, line 1995).

**The words.**

| Where | Words |
|---|---|
| The button at rest, as its `title` and its `aria-label` | "Read the work items again from git and GitHub." |
| The button while it works | "Reading the work items again…" |
| The status line where no answer came | "The daemon did not answer in 15 seconds, so the lists stand as they were." |
| The status line where no answer came and the daemon is of another build | "The daemon did not answer in 15 seconds, so the lists stand as they were." followed, after one space, by the notice of a daemon of another build (`view.ts#daemonNotice`), so the press does not take "Restart Daemon…" out of the status line |
| The daemon's refusal, which the status line shows as it is | "The work items were not read again: <the read's sentence>." |

**The row of *Components and their states*, English edition**, after the row "A group's head":

| Part | At rest | Under the pointer | Pressed | Selected | Focused by the keyboard | Disabled |
|---|---|---|---|---|---|---|
| The sidebar's head | The caption "Repositories", and at the row's end four icon's buttons in this order: the bell, the refresh, the filter and "+". The refresh is two arrows round a circle, and says "Read the work items again from git and GitHub." to a pointer and to a screen reader. While its answer is on its way, its arrows go round once in 1.1s, it says "Reading the work items again…", and a press sends nothing. | As an icon's button. | As an icon's button. | As an icon's button: the filter, where it narrows the sidebar. | The ring. | — |

The Korean edition's row says the same under the edition's own heading *부분과 그 상태*. The window's words stay English in both editions, as the edition's other rows quote them.

## What the daemon could do beyond the issue

The daemon is always on and reads git and GitHub for every window, so a press is the one moment the person says that the window looks wrong. It could do four things with that moment. This work builds none of them.

- **Say what the press found.** The daemon already knows whether each read changed something: `readCommits` gathers `moved` and `placed`, and `readPullRequest` answers whether the stored pull request changed. The answer could carry which sources changed, and the status line could say "Nothing had changed" or "2 pull requests had changed". That tells the person whether the window or the daemon was behind. A line in the daemon's log at each press would give the next issue evidence of which reader lags. Proposed as a follow-up issue.
- **Watch `.git` in place of the three-second poll.** A watch of each repository's `refs/heads`, `packed-refs` and `worktrees/` would let the daemon read a branch when it moves, and find a worktree made outside Owlery when it appears, which #227's frame weighs. It would also stop the poll's git processes while nothing moves. Proposed to #227's frame, which decides when the worktrees are read again.
- **Read again when the window comes forward.** The window already tells the daemon when it stops being in front (`looked`). A message at the window's focus could start the same reads as a hello, so a person who comes back to the window after an hour sees fresh checks with no press. Proposed as a follow-up issue, since it spends one `gh` call for each open pull request at each focus.
- **Serve the phone with the same message.** `readLists` names no window, so the phone, which comes after the first version (`docs/product.md` *The phone: the same session as a chat*), can offer a pull to refresh with nothing new in the daemon. This work keeps the message neutral to that end, and builds nothing for the phone.

## Rule changes

- add
  file: docs/architecture.md
  section: Screen framework: Electron
  to: **A press of the sidebar's refresh button has the daemon read again what a client's hello has it read from outside, and the window draws the lists the daemon sends back, keeping what the person had in front.** The daemon outlives the window for days, and between its timers what it read can stand behind git and GitHub: an open pull request whose checks have ended is read again only every `PR_REST_POLL_MS`. The window sends `readLists`. The daemon takes what to read from one list in its code, which the hello reads too. At release 0.0.5 that list is the notice of its agent where one stands, every open pull request it watches, through `gh`, and from git each work item's branch, or the commit its worktree's `HEAD` stands at where it has no branch yet, and its record, whether a commit holds each word of the person's its record holds, and each repository's records place. Every read the press asks for starts after the message arrived, once a read of git under way has ended, and a read of a pull request that was under way leaves that pull request to be read again at once. The daemon answers the window that asked with the four lists in an `inbox`, and then `done`, once git has been read and the reads of the pull requests have ended or 5 seconds have passed. A pull request read after that reaches every window in the watch's own `inbox`. The window draws the answer as it draws any `inbox`, so the screen in front, the view's pane in front and the filter stay, and a press held at its arrival delays the draw until the release. While the answer is on its way, the button's arrows turn and a second press sends nothing. A refusal is said in the status line in the daemon's words. Where no answer comes within 15 seconds, the status line says so, and a daemon of an earlier build, which does not know the message, is told that way.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/refresh.test.ts apps/desktop/test/notification-click.test.ts
- add
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  to: **사이드바의 새로 고침 버튼을 누르면, 데몬은 클라이언트가 인사할 때 밖에서 읽는 것을 다시 읽고, 창은 데몬이 돌려보낸 목록을 그립니다. 사람이 앞에 두었던 것은 그대로 둡니다.** 데몬은 창보다 며칠씩 오래 살고, 타이머 사이에는 데몬이 읽어 둔 것이 git과 GitHub보다 뒤처질 수 있습니다. 검사가 끝난 열린 풀 리퀘스트는 `PR_REST_POLL_MS`마다 한 번만 다시 읽습니다. 창은 `readLists`를 보냅니다. 데몬은 무엇을 읽을지 코드 안의 목록 하나에서 정하고, 인사도 같은 목록을 읽습니다. 릴리스 0.0.5에서 그 목록은 에이전트의 알림이 서 있을 때의 그 알림, `gh`로 지켜보는 열린 풀 리퀘스트 모두, 그리고 git에서 읽는 작업마다의 브랜치(아직 브랜치가 없는 작업이면 그 워크트리의 `HEAD`가 선 커밋)와 기록, 그 기록이 담은 사람의 말을 커밋이 담았는지, 그리고 저장소마다의 기록 자리입니다. 누름이 부르는 읽기는 모두 메시지가 도착한 뒤에, 진행 중이던 git 읽기가 끝난 다음 시작합니다. 진행 중이던 풀 리퀘스트 읽기가 있으면, 그 풀 리퀘스트는 곧바로 한 번 더 읽힙니다. 데몬은 git을 다 읽고, 풀 리퀘스트 읽기가 끝나거나 5초가 지나면, 요청한 창에 네 목록을 담은 `inbox`를 보내고 이어서 `done`을 보냅니다. 그 뒤에 읽힌 풀 리퀘스트는 지켜보기가 보내는 `inbox`로 모든 창에 갑니다. 창은 그 답을 다른 `inbox`처럼 그립니다. 그래서 앞에 있던 화면과 작업 화면에서 앞에 있던 창과 필터는 그대로이고, 답이 올 때 누르고 있던 것이 있으면 그리기는 뗄 때까지 미룹니다. 답이 오는 동안 버튼의 화살표가 돌고, 한 번 더 눌러도 아무것도 보내지 않습니다. 거절은 데몬의 문장 그대로 상태 줄에 나옵니다. 15초 안에 답이 오지 않으면 상태 줄이 그렇다고 말하고, 이 메시지를 모르는 이전 빌드의 데몬도 그렇게 알립니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/refresh.test.ts apps/desktop/test/notification-click.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The hello's own list of what it reads again from outside: the agent's notice, the pull requests made due and the watch scheduled | `apps/desktop/src/daemon/daemon.ts#accept`, lines 838 to 842 at `8c7eb798` | `readOutside`, the method of *Scope* item 2, which the hello and `readLists` both call. Two copies of the list would part the first time a read joins one of them, as #227's read of the worktrees will. |

The work adds a rule, a protocol message and the watch's count of `readOutside` calls, and nothing else can go in return. The count replaces no structure of the watch: without it a press during a read of `gh` would leave that pull request a rest interval away (*Scope* item 4). The hello's reads stay, since a window that connects needs them. The three-second read of git and the watch of the pull requests stay, since they serve every window nobody presses in, and the notifications of a pull request's checks come from the watch's `inbox` (`renderer.ts#takeLists`, `pullRequestNotifications`). The menu's reload, where Electron's `viewMenu` gives one, is Electron's and not Owlery's, so this work does not touch it.

Framed 2026-11-26 by framer, before the build.
