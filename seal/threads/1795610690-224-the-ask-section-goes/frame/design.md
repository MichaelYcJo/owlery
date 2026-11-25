# Design: 1795610690-224-the-ask-section-goes

## Grounding

The tree as read at `d38f77a4` (the routing commit on `release/v0.0.5` at `ab7a5730`).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Agent adapters*, the paragraph opening **A permission request of a headless session with no role waits for the person, on its work item's line.** | The only source of a call that waits for the person is a session with no role, and "A person started that session from the work item's view". `apps/desktop/src/daemon/role-grants.ts#verdictOn` answers `person` only where `role === null` (read, line 137), and every role session's call is allowed or refused by its grant. Once the view starts no session, this paragraph describes a path nothing reaches. |
| `docs/roadmap.md` *Milestones*, row 3 | Milestone 3 (release 0.0.6, issues #54 and #55) adds "The framer and crafter role sessions" and has the daemon start its chain. Its questions go through "the question screen". No row of the roadmap names a session with no role for milestone 3. This is the ground for removing the role-less path rather than keeping it for milestone 3. |
| `docs/design.md` *Components and their states*, rows "A call a headless session asks the person to allow", "The seal's place" and "The Machine dialog" | The call's card lives only in the Ask section's list. The seal's place at a view's foot already carries "the sentence of the daemon's chain". The Machine dialog names a waiting session "a question by its prompt after "Asked:"". |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | The scene's view work item needs the person through a prompt asked in the section and a call to allow. The parked work item "lists that gate under "Ask"". A pull request that changes the window carries the screenshots in every theme that draws the changed part differently. |
| `docs/architecture.md` *Memory design*, the paragraph opening **A headless session over the cap on agents waits in a queue** | The queue has three ranks, "A session a person asked for" first (`apps/desktop/src/daemon/agent-queue.ts`, `QueueRank`). |
| The plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* | This work item's subject is the code. Its rule changes go into `## Rule changes` for the settle, and its pull request edits no document of `docs/`. The issue's line "rewritten in both editions" is met by the operations below, which the settle writes. |

Facts the frame stands on, each with the command that gave it:

- executed, `git grep -n -E 'type: "ask(ed)?"|case "ask(ed)?"|"asked" \||\["asked"|, "asked",' -- apps/desktop/src`: `agent-queue.ts:11,13`, `daemon.ts:1498,1530`, `renderer.ts:1909`, `work-item-view.ts:1368`, `protocol.ts:928,979`. The window's `work-item-view.ts:1368` is the only sender of `ask` in `src`.
- executed, `git grep -c -E 'type: "ask"' -- apps/desktop/test` at `d38f77a4`: `accounts.test.ts` 4, `ask-section.test.ts` 2, `chain.test.ts` 2, `daemon.test.ts` 81, `machine-dialog.test.ts` 2, `role-bundle.test.ts` 1, `role-session.test.ts` 1, `screenshots.test.ts` 1. Each case was read by its `it(` title (an `awk` listing over those files). They test the daemon's headless machinery (a session's states, its limit, a stop, the bound on ended sessions, error output, usage, the ledger, the queue, accounts, a role's launch) and the role-less permission path. `ask-section.test.ts`, `machine-dialog.test.ts`, `role-bundle.test.ts`, `role-session.test.ts` and `screenshots.test.ts` import `buildApp` and run in the `app` project (`vitest.config.ts:14,27`). `role-bundle.test.ts` and `machine-dialog.test.ts` reach a built daemon over its socket. `role-session.test.ts` builds a `Daemon` in its own process (line 121), and runs only under `OWLERY_ROLE_RUN` or `OWLERY_ROLE_REFUSAL`.
- read, `apps/desktop/test/chain-run.ts:101`: "No client message starts a chain, so the case holds the daemon." The cases already reach `Daemon#startChain` in their own process. Executed, `git grep -n 'startChain(' -- apps/desktop/src`: no caller in `src`, only the definition at `daemon.ts:2944`.
- read, `daemon.ts:3211-3220`: `runStage` passes a `RoleStage`, never null, to `beginHeadless`. With the `ask` handler gone, no code in `src` starts a session with no role. A refresh of an account's usage has no role, and it launches through the adapter's `refresh` branch (`adapters/claude.ts:98`), not through `beginHeadless`.
- read, `daemon.ts:1276` and `daemon.ts:2989`: answering the last open question of a work item whose chain is `parked` resumes that chain (`resumeChain`), and its next stage launches through `beginHeadless` under the cap on agents. This is the one path in the product by which a built daemon launches a role session today. The built-app cases take it in place of `ask` (Scope item 7).
- read, `daemon.ts:1701`: the daemon's `handle` drops a message whose `type` it does not list, and answers nothing.
- read, `renderer/view.ts:3285-3368` and `work-item-view.ts:788-900`: the section's list draws, from `held.headless`, every headless session of the work item, the chain's stage sessions among them. Each line has its state, prompt, "Stop", answer or error, and error output. Before them stands the line of the newest broad gate of the daemon's chain (`gateLine`), with "Stop", "Show output" and what the command printed. Nothing else in the window draws a session's error output, a stage session's "Stop" or the gate's output. The approval line says "Broad gate", "Gate failed" or "Gate passed" at the sealer's place and draws neither control.
- read, `index.html:781-790`: the section is `#ask` with an `h2` "Ask", `#ask-form` (`#ask-prompt`, `#ask-account`, `#ask-submit`) and `#headless`, between `#view-scroll` and `#view-seal` at the right column's foot (`index.html:457`).
- read, `chain-command.ts:340-349`: the owl chain's broad gate runs in the pane through the chain command, and the daemon's chain stages (`gateLine`'s source) hold no run of it. The gate line has served only the daemon's chain.
- executed, `git grep -n -E 'Ask|headless|역할 없이|Asked' -- docs/product.md docs/product.ko.md | wc -l`: 0. No line of `docs/product.md` names the section. That search missed the path of a call that waits for the person. The fold's search, `git grep -n -E 'to allow|allows or refuses|Allow"|허락할|허락하거나|permission request|권한 요청|asks? (the person )?to allow|Asks to use' -- docs README.md README.ko.md` (executed at `d88328c3`, whose `docs/` is `d38f77a4`'s), lists the members of that class in the policy: `docs/product.md:47` ("a call to allow"), `docs/design.md:28` ("the text of a call a session asks to make"), `docs/architecture.md:348` ("by a rule or through the person"), and the lines below. It also lists `docs/architecture.md:35`, `78-79`, `88`, `104`, `425`, `433-435`, `501-503`, `520-521` and `docs/product.md:117`. Those state the adapter's events, a role session's grant, or a pane's request answered in its terminal or from the phone, which this work keeps. Each line has the same line in its `.ko.md` edition. The search is a sample by contract rule 12: it reaches the wordings it names.
- executed, the docs search in the *Removes* row "Policy sentences": it lists `docs/architecture.md:91,177,247,347,348,469`, `docs/design.md:28,452,457,507,517`, `docs/product.md:47` and the same lines of each `.ko.md` edition. An operation under `## Rule changes` names each of them.
- executed, a probe under the scratch directory (`test_tmp_rule_changes_fold.py`, run for the fold after phase 1) that reads this design with the plugin's `skills/settle/scripts/rule_changes.py#parse` and places each operation with `#apply_op` in copies of the six documents it names, as they stand at `d88328c3` (`git diff --quiet d38f77a4 d88328c3 -- docs` exits 0): the reader names no line it did not read and refuses none, every operation is placed, and each edition keeps its English edition's count of headings (`architecture` 27, `design` 15, `product` 15) and of table rows (`architecture` 124, `design` 383, `product` 36), which the broad gate compares. The docs search of *Removes* prints nothing over the copies.
- executed, `gh issue view 224 --json title,body,comments` (2026-11-25): the one comment, by the owner, says the section's built-app case `takes a session the daemon dropped from its list out of the section` failed once on CI and that "Removing the section removes the case". It changes nothing of the request.
- executed, `gh release view --json body`: the latest release is `v0.0.3`, and its body holds no `### Process changes` heading. Executed, `ls seal`: `seal/follow-up.md` does not exist, and no earlier work item's directory stands under `seal/threads/`.
- executed, `ls docs`: `docs/README.md` does not exist, so the policy root has no index. Each `file:` below is a document of `docs/` that the issue names or that holds a line the search found.

## Scope

In:

1. The view's right column loses the "Ask" section's heading, its field, its account menu, its button and its empty text "Nothing asked yet".
2. The list the section held stays at the view's foot, above the seal's place, with no heading, as `#view-chain` (the prefix of the column's other parts at its foot, `#view-scroll`, `#view-seal` and `#view-pull-request`) with the accessible name "The daemon's chain". It holds the line of the broad gate the work item's daemon chain ran last and the line of each headless session the daemon lists for the work item, each drawn as today. It is not drawn where it holds no line, so a work item whose panes run the owl chain shows the seal's place alone at its foot.
3. The protocol loses the client message `ask` and the server message `asked`.
4. The path of a call that waits for the person goes: `ClientMessage` `answerPermission`, `PermissionAsk`, `WorkItem.permissions`, the daemon's held calls (`HeadlessSession.asks`, `nextPermissionId`, the `answerPermission` handler), the `person` answer of `role-grants.ts#verdictOn`, the call's card and its buttons in the view, a work item's line and preview that wait on a call, the window's notification of a call, the field in the window's last look (`last-look.ts`), and the Claude adapter's launch of a session with neither a role nor a refresh (`claudeArgs`'s `--disallowedTools` branch). A look file an earlier daemon wrote with `permissions` still reads.
5. The queue on agents loses its rank `asked`: a stage of a running chain starts first, then a chain's first stage.
6. The cases that sent `ask` to a daemon in their own process start a session through a public method of `Daemon` that takes a role, as they already start a chain through `Daemon#startChain`. A case that tested the role-less path or the protocol message itself goes.
7. The built-app cases that sent `ask` to a built daemon reach a role session through a parked chain that the case stores and answers, which the daemon resumes (`daemon.ts#resumeChain`): the Machine dialog's case of a session that waits for the machine, the role bundle's case of what the built daemon launches a role with, and the screenshot run's session that waits for the machine.
8. The screenshot run's view work item needs the person through a chain stored stopped where its broad gate failed, in place of the failed prompt and the call to allow, so the shots still show the mark of a failure.
9. The window's words that name a session a person asked are rewritten: the Machine dialog's "Asked: <prompt>", the archive's, the removal's and the daemon end's "Asked: <prompt>" and "Asked in <title>: <prompt>", the daemon end's "the answers to what was asked", and the refusal "A session asked in a work item keeps the account it started under. Ask again under the other account." A session is named by its stage there. Where a chain stage holds no id of the session yet, as between the `machine` that queues the stage and the `inbox` that carries it, the Machine dialog names the session by its role and stage from `HeadlessInfo.role`, and never by its prompt (`view.ts#machineQueue`'s fallback, which phase 1's record leaves to phase 3). Every comment that names the "Ask" section, its field, a session a person asked or a call a session asks the person to allow is rewritten in the commit that changes its code.
10. `apps/desktop/test/ask-section.test.ts` goes whole.
11. The rule changes below, in both editions, for the settle.
12. An open Machine dialog is drawn again at every `inbox`, as the window's other open dialogs that name what the daemon lists are (`apps/desktop/src/renderer/renderer.ts#takeLists`). The daemon sends `headless`, then `machine`, then the `inbox` whose chain holds the stage's session (`daemon.ts#beginHeadless` broadcasts before `runStage` calls `chainSet`), and the dialog was drawn again only at `machine` and `heavyRuns`. So a stage that waits for the machine kept the fallback words while the dialog stayed open. The same stale row stands on the base where a second window answers a parked work item's questions (phase 1's record). After issue #242 the draw goes through that work item's hold, as *Overlap with the release* in `frame/plan.md` states.

Out, each with why:

- `README.md` line 15, "one question can be put to a headless Claude session": it opens with "Release 0.0.1 runs this much", a claim about a named release, which rule 19 of the agent contract keeps.
- `docs/roadmap.md` *Milestones* row 1: it states what milestone 1 built.
- The ledger's entries with no stage that a daemon of an earlier release wrote, and the back of the seal's line of the sessions outside the chain (`shared/seal-back.ts#composeBack`): no delete takes an entry out of the ledger (`docs/architecture.md` *State lives in three places*), so the back still reads them. Only the policy sentence that says a role-less session writes one changes.
- `changeAccount`'s `headless` field: it refuses a change of a headless session's account, which still holds for a role session. Only its sentence changes (Scope item 9).
- `ClientMessage` `stopHeadless`, `stopGate`, `readGateOutput` and `ServerMessage` `headless`, `headlessDropped`, `gateOutput`: the list of Scope item 2 sends and reads them.
- A question put to a work item that runs with no pane: the issue leaves it to milestone 3, and *What the daemon could do beyond the issue* proposes it as an issue.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| The view has no Ask section | Given any work item, when its view is on screen, then the right column holds no heading "Ask", no field, no account menu and no button that starts a session. | A built-app case asserts that the view holds no `#ask`, `#ask-form`, `#ask-prompt`, `#ask-account` or `#ask-submit` and no `h2` reading "Ask". `git grep -n -E 'ask-(form\|prompt\|account\|submit)\|id="ask"\|#ask\b\|#headless\|id="headless"' -- apps/desktop/src` prints nothing; at `d38f77a4` it prints `index.html:518-539,781-789` and `work-item-view.ts:167-170`, which Scope items 1 and 2 remove or rename. |
| A work item with no daemon chain shows the seal's place alone | Given a work item whose daemon lists no headless session and whose chain holds no gate's run, when its view is on screen, then no list stands above the seal's place and it takes no height. | A `view.test.ts` case on `view.ts#chainList`, which gives the list's lines and whether it is drawn, and the built-app case of `apps/desktop/test/approval-line.test.ts` that reads `#view-chain` hidden and of no height in a view with no headless session and no chain. In the screenshot run the broken work item ("Cache the user avatars"), made with no chain, shows the seal's place alone at its foot. The finished work item does not: its stored chain holds a gate stage (`screenshots.test.ts`, `FINISHED_STAGES`), so its view draws the passed gate's line. |
| The gate's output keeps its place | Given the screenshot run's parked work item, whose chain's broad gate passed, when its view is on screen, then its foot shows the gate's line with the finished mark, the gate's command and "Show output", and a press shows what the command printed. | `screenshots.test.ts`, its parked view's assertion moved from `#headless li.gate` to `#view-chain li.gate`, and the cases that pin "Show output" in `view.test.ts` kept. |
| A failed gate shows its failure | Given the screenshot run's view work item, stored with a chain stopped where its broad gate failed, when its view is on screen, then the gate's line shows the mark and the words of a failure and, after the run's press of "Show output", what the gate's command printed under it; the sealer's place says "Gate failed"; and its inbox line needs the person with the chain's sentence in its second row. | `screenshots.test.ts`, the view shot's `until` condition rewritten from the asked prompts to these parts. |
| No client starts a session by hand | Given a connected client, when it sends `{ "type": "ask", ... }`, then the daemon lists no new headless session and answers nothing for it. | A `daemon.test.ts` case, seen red against the tree before Scope item 3. `git grep -n -E 'type: "ask(ed)?"\|case "ask(ed)?"' -- apps/desktop/src apps/desktop/test` prints only that case's line. |
| No call waits for the person | Given any session the daemon starts, when its agent asks to make a call, then the daemon allows or refuses it by the role's grant, and no work item's line, preview or notification waits on a call. | `role-grants.ts#verdictOn` takes a `RoleStage` and gives `allow` or `refuse`, which its existing cases read. `git grep -n -E 'PermissionAsk\|answerPermission\|permissionsOf\|\.permissions\|permissions: \[\|permissions: \(' -- apps/desktop/src` prints nothing; at `d38f77a4` it prints lines of `daemon.ts`, `last-look.ts`, `view.ts`, `work-item-view.ts` and `protocol.ts`, each of which Scope item 4 removes. The pattern leaves out `records-place.ts:83`, the `permissions:` key of a GitHub workflow, by needing `[` or `(` after the colon. A `last-look.test.ts` case reads a look file holding `permissions` as before, less that field. |
| A queued stage is named by its stage | Given the cap on agents reached and the Machine dialog open, when a resumed chain's stage waits for the machine, then the dialog, without being opened again, lists it under "Waiting for the machine" with its work item's name and the stage's name, once the `inbox` that carries the stage arrives; before that `inbox` it names the session by its role and stage, never by its prompt. | `machine-dialog.test.ts`, its case reaching the queue through a stored parked chain the case answers while the dialog stays open (Scope item 12; the case was red at `3b85b13d` before the line of `renderer.ts`, phase 1's record). `view.test.ts` on `machineQueue`, its fallback among it (Scope item 9). |
| The built daemon launches a role with the bundle | Given a built daemon and a work item whose stored parked chain the case answers, when the daemon resumes the chain, then the CLI is given the bundle beside the built script, the role's agent and a rules file in the run folder. | `role-bundle.test.ts`, its first case reaching the launch through the resumed chain, with the role and the tools of the stage the chain owes. |
| The window says no "Asked" | Given a session of a chain's stage runs, when the archive, the removal, the daemon's end or the Machine dialog names it, then it is named by its stage and not by "Asked". | `view.test.ts` cases on `archivalOf`, `removalOf`, `runningSessions`, `daemonEnding` and `machineQueue`. `git grep -n -E '"Ask"\|(^\|[^A-Za-z])Asked( in [^:]*)?: \|Nothing asked\|what was asked\|Ask again' -- apps/desktop/src` prints nothing; at `d38f77a4` it prints `daemon.ts:1853`, `index.html:457,539`, `view.ts:482,1001,1033,1043,1049,1070,1071,1583,3229,3317,3366` and `work-item-view.ts:6,107,109,113,212,770,788,840,1255,1382,1388`, each of which Scope items 1, 2 and 9 remove or rewrite. The pattern leaves out the identifiers `chainAsked` (`renderer.ts:690`) and `backAsked` (`work-item-view.ts:128`) by needing no letter before `Asked`. |
| The screenshots in every theme | Given the change, when `OWLERY_SCREENSHOT_THEMES=all pnpm run screenshots` runs in `apps/desktop`, then each view the change touched is captured in every theme and in both of Night watch's appearances. | The pull request's body carries the files as `docs/design.md` *A pull request that changes the window carries its screenshots* states. |

## Data & interfaces

- `apps/desktop/src/shared/protocol.ts`: `ClientMessage` loses `{ type: "ask" }` (line 928) and `{ type: "answerPermission" }` (line 936). `ServerMessage` loses `{ type: "asked" }` (line 979). `WorkItem` loses `permissions` (line 304), and `PermissionAsk` (line 522) goes. `HeadlessInfo` keeps `role: RoleStage | null`, since a window of the new build can be connected to a daemon of the earlier build until that daemon restarts.
- `apps/desktop/src/daemon/daemon.ts`: the `case "ask"` handler (lines 1498-1532) and `case "answerPermission"` go. A public method starts a headless session in a work item's worktree for the cases, with a prompt, a role and an optional account. It rejects, with the sentence the `ask` handler answered with, where it cannot start one: no work item, an empty prompt, an account the daemon keeps none under, an adapter that cannot launch a role. It starts the session outside any chain, at the queue's last rank. Its doc comment says that no client message starts a session and that the cases hold the daemon, as `startChain`'s says. The crafter names it.
- `apps/desktop/src/daemon/agent-queue.ts`: `QueueRank` is `"running-chain" | "first-stage"`.
- `apps/desktop/src/daemon/role-grants.ts#verdictOn`: takes a `RoleStage`, and its `Verdict` has no `person` answer.
- `apps/desktop/src/daemon/adapters/claude.ts#claudeArgs`: a launch is a role's or a refresh's. The crafter decides what `start` does when given neither, and pins it with a case.
- `apps/desktop/src/renderer/index.html`: `#ask` and its children go. The list stands where `#ask` stood, as `#view-chain`, with `aria-label="The daemon's chain"`, and `hidden` while it holds no line (`view.ts#chainList` gives `drawn`). The styles of `#headless` stand under `#view-chain`, and `#headless:empty::after` is gone (phase 2). The permission card's styles, `#view-chain .permission`, `.call` and `.answers`, go with the card (Scope item 4).

## What the daemon could do beyond the issue

The orchestrator takes what is cheap and in scope and files an issue for the rest.

- **A question to the session that knows the work, for a work item with no pane.** The issue's ground is that a fresh session knows nothing of the work. The daemon already keeps each stage session's own conversation id (`daemon.ts:376`, `named`) and sends it nowhere. In milestone 3, a question put to a work item that runs with no pane could resume the last stage's conversation (`claude -p --resume <id>`; `docs/architecture.md` *Agent adapters* already names `--resume` for a pane's change of account), under that stage's role and grant, so the answer knows what the stage read and wrote. It needs no path for a call that waits for the person. An issue for milestone 3.
- **The owl chain's broad gate output.** A pane's session runs the broad gate through the chain command, which prints into the pane, and the daemon keeps none of its output, so "Show output" serves only the daemon's chain. The daemon could keep the end of a pane chain's gate output beside its heavy-run record and offer it on the same line. An issue.
- **A failed stage's cause on the approval line.** The error output of a failed stage's session stands only in the list at the view's foot, while the approval line and the back of the seal say only why the stage failed. Where the CLI died before its result, the cause is in the last lines of its error stream (`docs/architecture.md` *Agent adapters*, **A headless session carries the last 2,000 characters its CLI printed on its error stream**). The daemon could carry the last line of that output into the stage's failure sentence. An issue.
- **An answer to a message the daemon does not know.** After this change a client of an earlier build that sends `ask` gets no answer, since `handle` drops an unknown type silently (`daemon.ts:1701`). Answering an unknown message that carries a `requestId` with an `error` would let an old window say why nothing happened. Cheap, but outside this issue's subject. An issue.

## Rule changes

- remove
  file: docs/architecture.md
  section: Agent adapters
  from: **A permission request of a headless session with no role waits for the person, on its work item's line.** A person started that session from the work item's view, and no role's grant covers it. The adapter reports the request as a neutral event: the tool's name, whether the call reads a file, writes one, runs a command or does something else, and the path or the command. The daemon holds the call and sends the request with its work item. The work item's line in the inbox then says it waits, and the window raises the notification a waiting session raises. The person allows or refuses the call in the work item's view, and an allowance covers that one call. A request ends unanswered when its session ends, at its limit among other ends, and the daemon keeps none across its own restart, because the session that asked is gone by then.
- remove
  file: docs/architecture.ko.md
  section: 에이전트 어댑터
  from: **역할 없이 뜬 headless 세션의 권한 요청은 그 작업의 줄에서 사람을 기다립니다.** 그 세션은 사람이 작업 화면에서 직접 띄운 것이고, 어느 역할의 허락도 적용되지 않습니다. 어댑터는 요청을 특정 회사에 묶이지 않은 이벤트로 알립니다. 이벤트에는 도구의 이름, 그 호출이 파일을 읽는지, 쓰는지, 명령을 실행하는지, 그 밖의 일을 하는지, 그리고 경로나 명령이 담깁니다. 데몬은 그 호출을 붙잡아 두고 요청을 그 작업과 함께 보냅니다. 그러면 작업함에서 그 작업의 줄이 기다리는 중이라고 말하고, 창은 기다리는 세션이 띄우는 것과 같은 알림을 띄웁니다. 사람은 작업 화면에서 그 호출을 허락하거나 거절하고, 허락은 그 호출 한 번에만 적용됩니다. 세션이 끝나면 요청도 답 없이 끝나며, 한도에 이르러 끝나는 경우도 같습니다. 데몬은 다시 시작한 뒤까지 요청을 간직하지 않습니다. 요청한 세션이 그때는 없기 때문입니다.
- change
  file: docs/architecture.md
  section: Role sessions run detached from the user's environment
  from: The daemon passes `default` for every headless session, with a role and without, so each call Claude Code would ask a person about reaches the daemon.
  to: The daemon passes `default` for every headless session, so each call Claude Code would ask a person about reaches the daemon, which answers a role session's call by the role's grant.
- change
  file: docs/architecture.ko.md
  section: 역할 세션은 사용자 환경에서 떼어 띄웁니다
  from: 데몬은 역할이 있든 없든 모든 headless 세션에 `default`를 넘기고, 그래서 Claude Code가 사람에게 물었을 호출이 모두 데몬으로 옴.
  to: 데몬은 모든 headless 세션에 `default`를 넘기고, 그래서 Claude Code가 사람에게 물었을 호출이 모두 데몬으로 오며, 데몬은 역할 세션의 호출에 그 역할의 허락에 따라 답함.
- change
  file: docs/architecture.md
  section: State lives in three places
  from: A headless session with no role gets an entry with no stage, because it spends from the same account.
  to: An entry with no stage is one a daemon before release 0.0.5 wrote for a session a person asked in the work item's view, and the back of the seal counts it among the sessions outside the chain.
- change
  file: docs/architecture.ko.md
  section: 상태는 세 곳에 둡니다
  from: 역할 없이 뜬 headless 세션도 같은 계정에서 쓰므로, 단계가 없는 항목으로 적습니다.
  to: 단계가 없는 항목은 릴리스 0.0.5 전의 데몬이 사람이 작업 화면에서 물은 세션에 적은 것이고, 인장의 뒷면은 그 항목을 체인 밖의 세션으로 셉니다.
- change
  file: docs/architecture.md
  section: Options for launching Claude Code
  from: | `--tools`, `--disallowedTools` | `--tools` names the built-in tools a role session holds, and no other reaches it. A session with no role keeps Claude Code's default tools, less the three the CLI adds where a host answers its prompts (`--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode`) |
  to: | `--tools` | `--tools` names the built-in tools a role session holds, and no other reaches it. A refresh of an account's usage has no role and holds no tool (`--tools ""`) |
- change
  file: docs/architecture.ko.md
  section: Claude Code를 띄우는 옵션
  from: | `--tools`, `--disallowedTools` | `--tools`는 역할 세션이 가질 내장 도구를 이름으로 정하고, 그 밖의 도구는 그 세션에 들어가지 않습니다. 역할 없이 뜬 세션은 Claude Code의 기본 도구를 그대로 가지되, 호스트가 프롬프트에 답할 때 CLI가 더하는 세 도구는 뺍니다(`--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode`) |
  to: | `--tools` | `--tools`는 역할 세션이 가질 내장 도구를 이름으로 정하고, 그 밖의 도구는 그 세션에 들어가지 않습니다. 계정의 사용량을 새로 읽는 세션은 역할이 없고 도구도 하나도 가지지 않습니다(`--tools ""`) |
- change
  file: docs/architecture.md
  section: Memory design
  from: A session a person asked for starts first, then a stage of a chain that is already running, then a chain's first stage.
  to: A stage of a chain that is already running starts first, then a chain's first stage.
- change
  file: docs/architecture.ko.md
  section: 메모리 설계
  from: 사람이 요청한 세션이 먼저 시작하고, 그다음이 이미 도는 체인의 단계, 그다음이 체인의 첫 단계입니다.
  to: 이미 도는 체인의 단계가 먼저 시작하고, 그다음이 체인의 첫 단계입니다.
- remove
  file: docs/design.md
  section: Components and their states
  from: | A call a headless session asks the person to allow | The card of what an agent says, with `--said-edge-waiting`. Its head names the tool, as in "Asks to use Bash", and under it the call's text, a path, a command or the call's input, stands whole and wrapped in the fixed-width face and `--ink-strong`, and the person can select it. "Allow" and "Refuse" stand at the card's right foot as two buttons, and neither is the main button, since either answer is the person's. | — | — | — | Each button takes the ring. | — |
- remove
  file: docs/design.ko.md
  section: 부분과 그 상태
  from: | headless 세션이 사람에게 허락을 구하는 호출 | 에이전트가 한 말의 카드이고 가장자리가 `--said-edge-waiting`입니다. 머리에는 "Asks to use Bash"처럼 도구의 이름이 나옵니다. 그 아래에는 호출의 글, 곧 경로나 명령이나 호출의 입력이 고정폭 글꼴과 `--ink-strong`으로 잘리지 않고 줄을 바꿔 가며 놓이고, 사람이 그 글을 선택할 수 있습니다. "Allow"와 "Refuse"는 카드의 오른쪽 아래에 단추 두 개로 놓입니다. 어느 답이든 사람이 고르는 것이므로, 둘 다 주 단추가 아닙니다. | — | — | — | 단추마다 고리가 생깁니다. | — |
- change
  file: docs/design.md
  section: Components and their states
  from: what it waits to run in `--ink-muted`, a chain's stage by its name and a question by its prompt after "Asked:".
  to: what it waits to run in `--ink-muted`, a chain's stage by its name.
- change
  file: docs/design.ko.md
  section: 부분과 그 상태
  from: 체인의 단계는 그 이름으로 적고, 질문은 "Asked:" 뒤에 그 프롬프트로 적습니다.
  to: 기다리는 일은 체인의 단계이고, 그 이름으로 적습니다.
- add
  file: docs/design.md
  section: Components and their states
  to: | The lines of the daemon's chain | At a view's foot, above the seal's place, a list with no heading of its own, which a screen reader names "The daemon's chain". First stands the line of the broad gate the work item's chain ran last, then a line for each session of the chain's stages the daemon still lists, the latest first. A line is a row of a list of records: the mark and the word of its state, then "Broad gate" with the gate's command in the fixed-width face, or the stage's prompt as the daemon shows it, with "Stop" while the gate's command or the session runs and "Show output" where the daemon kept what the gate printed. Under it stand a session's answer, or the error of a gate or a session that failed, in `--ink-muted`, and what a failed session's process printed on its error stream, or what the gate's command printed, whole and wrapped in the fixed-width face at `--size-caption` in `--ink-muted`, and the person can select it. Where the daemon lists no session of the work item and its chain holds no gate's run, no list is drawn and the foot holds the seal's place alone. | — | — | — | Each button takes the ring. | — |
- add
  file: docs/design.ko.md
  section: 부분과 그 상태
  to: | 데몬 체인의 줄들 | 작업 화면의 아래쪽, 인장의 자리 위에 놓이는 목록입니다. 제목은 따로 없고, 화면 낭독기에는 "The daemon's chain"이라는 이름으로 읽힙니다. 맨 앞에는 그 작업의 체인이 마지막으로 돌린 전체 검사의 줄이 오고, 그 뒤에 데몬이 아직 목록에 두고 있는 체인 단계의 세션마다 줄이 하나씩, 최근 것부터 옵니다. 줄 하나는 기록 목록의 행입니다. 상태의 표시와 낱말, 그다음에 "Broad gate"와 고정폭 글꼴의 검사 명령, 또는 데몬이 보여 주는 단계의 프롬프트가 옵니다. 검사 명령이나 세션이 도는 동안에는 "Stop"이, 데몬이 검사의 출력을 간직한 곳에는 "Show output"이 함께 놓입니다. 그 아래에는 세션의 답, 또는 실패한 검사나 세션의 오류가 `--ink-muted`로 놓이고, 실패한 세션의 프로세스가 오류 출력에 쓴 것이나 검사 명령이 출력한 것이 고정폭 글꼴, `--size-caption`, `--ink-muted`로 잘리지 않고 줄을 바꿔 가며 놓이며, 사람이 그 글을 선택할 수 있습니다. 데몬이 그 작업의 세션을 하나도 두고 있지 않고 체인에 전체 검사의 실행도 없으면 목록은 그려지지 않고, 아래쪽에는 인장의 자리만 놓입니다. | — | — | — | 단추마다 고리가 생깁니다. | — |
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: A prompt asked in it has failed, and the session of a second prompt waits for the person to allow a command, so the screens show the mark and the words of every state, and the card of a call to allow. It carries no decision made without asking and no words of its setup, so its line's second row gives its whole width to the call.
  to: The run stores it with a chain that stopped where its broad gate failed, so the gate's line at the view's foot shows the mark and the words of a failure, and the screens show the mark and the words of every state. The run presses "Show output" on that line before the view's shot, so the shot shows what the gate's command printed, in the fixed-width face, under the line. It carries no decision made without asking and no words of its setup, so its line's second row gives its whole width to the chain's sentence.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 거기서 물은 프롬프트 하나는 실패해 있고, 두 번째로 물은 프롬프트의 세션은 명령 하나를 허락해 달라며 사람을 기다립니다. 그래서 스크린샷에는 모든 상태의 표시와 문구가 나오고, 허락을 구하는 호출의 카드도 나옵니다. 그 작업에는 묻지 않고 내린 결정도, 셋업의 문구도 없어서, 줄의 둘째 행은 폭을 모두 그 호출에 씁니다.
  to: 실행은 그 작업을 전체 검사가 실패한 곳에서 멈춘 체인과 함께 저장합니다. 그래서 화면 아래쪽의 그 검사 줄에 실패의 표시와 문구가 나오고, 스크린샷에는 모든 상태의 표시와 문구가 나옵니다. 실행은 작업 화면을 찍기 전에 그 줄의 "Show output"을 눌러, 검사 명령이 출력한 내용이 줄 아래에 고정폭 글꼴로 찍히게 합니다. 그 작업에는 묻지 않고 내린 결정도, 셋업의 문구도 없어서, 줄의 둘째 행은 폭을 모두 그 체인의 문장에 씁니다.
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: The run starts no chain and none runs: its chains stand recorded.
  to: The run starts no chain itself, and no stage of a chain starts: its chains stand recorded, but for the one the daemon resumes once the run answers its question, which runs while its first stage waits for the machine and never starts.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 실행은 체인을 시작하지 않고, 도는 체인도 없습니다. 체인은 기록으로만 있습니다.
  to: 실행은 스스로 체인을 시작하지 않고, 시작하는 체인의 단계도 없습니다. 체인은 기록으로만 있습니다. 다만 실행이 질문에 답해 데몬이 다시 잇는 체인 하나는 도는 중이고, 그 첫 단계는 기계를 기다리기만 하고 시작하지 않습니다.
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: It also stores two chains in the daemon's run folder before the app starts, as a daemon that ran them stored them.
  to: It also stores the chains of the parked work item, of the finished one, of the view's work item and of the work item whose stage waits for the machine in the daemon's run folder before the app starts, as a daemon that ran them stored them.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 그리고 앱을 띄우기 전에 체인 둘을 데몬의 실행 폴더에 저장합니다.
  to: 그리고 앱을 띄우기 전에, 질문 때문에 멈춘 작업, 끝난 작업, 작업 화면에 뜨는 작업, 단계가 기계를 기다리는 작업의 체인을 데몬의 실행 폴더에 저장합니다.
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: The view's work item holds its routing and one round's record, so its approval line shows two finished places and two not started,
  to: The view's work item holds its routing and one round's record, so its approval line shows two finished places, one not started and the sealer's place, which says that the broad gate failed,
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 작업 화면에 뜨는 작업에는 routing과 회차 하나의 기록이 있어서, 그 승인 줄에 끝난 자리 둘과 시작하지 않은 자리 둘이 나옵니다.
  to: 작업 화면에 뜨는 작업에는 routing과 회차 하나의 기록이 있어서, 그 승인 줄에 끝난 자리 둘, 시작하지 않은 자리 하나, 그리고 전체 검사가 실패했다고 말하는 sealer의 자리가 나옵니다.
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: No shot shows a stage at work: the daemon reads a chain stored as running as stopped when it starts, and nothing in the app starts a chain until issue #55.
  to: No shot shows a stage at work: the daemon reads a chain stored as running as stopped when it starts, and the stage of the chain it resumes waits for the machine.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 단계가 일하는 중인 모습은 어느 스크린샷에도 없습니다. 데몬은 시작할 때 실행 중이라고 저장된 체인을 멈춘 체인으로 읽고, 이슈 #55 전에는 앱에 체인을 시작하는 것이 없기 때문입니다.
  to: 단계가 일하는 중인 모습은 어느 스크린샷에도 없습니다. 데몬은 시작할 때 실행 중이라고 저장된 체인을 멈춘 체인으로 읽고, 다시 잇는 체인의 단계는 기계를 기다리기 때문입니다.
- change
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  from: The view of the parked work item lists that gate under "Ask", with the finished mark, the gate's command and the button that shows what the command printed.
  to: The view of the parked work item shows that gate's line at its foot, above the seal's place, with the finished mark, the gate's command and the button that shows what the command printed.
- change
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  from: 그 작업의 화면은 "Ask" 아래에 그 전체 검사를 올리고, 끝난 상태의 표시, 검사 명령, 명령이 출력한 내용을 보여 주는 단추를 함께 보입니다.
  to: 그 작업의 화면은 아래쪽, 인장의 자리 위에 그 전체 검사의 줄을 올리고, 끝난 상태의 표시, 검사 명령, 명령이 출력한 내용을 보여 주는 단추를 함께 보입니다.
- change
  file: docs/product.md
  section: Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call
  from: A line that waits on a question, on a call to allow or on its pane keeps saying so while a stage runs.
  to: A line that waits on a question or on its pane keeps saying so while a stage runs.
- change
  file: docs/product.ko.md
  section: 바탕: 작업함, AgenticSeal 프로세스, 인장의 뒷면, 그리고 불러 쓰는 터미널
  from: 질문이나 허락할 호출이나 자기 pane 때문에 기다리는 줄은 단계가 도는 동안에도 기다린다고 말합니다.
  to: 질문이나 자기 pane 때문에 기다리는 줄은 단계가 도는 동안에도 기다린다고 말합니다.
- change
  file: docs/design.md
  section: What every theme shares
  from: the fixed-width face for a branch, a commit's hash, a path, a count of lines, the text of a call a session asks to make and the terminal.
  to: the fixed-width face for a branch, a commit's hash, a path, a count of lines and the terminal.
- change
  file: docs/design.ko.md
  section: 모든 테마가 함께 가진 것
  from: 문구는 산세리프로, 브랜치, 커밋의 해시, 경로, 줄 수, 세션이 허락을 구하는 호출의 글, 터미널은 고정폭 글꼴로 씁니다.
  to: 문구는 산세리프로, 브랜치, 커밋의 해시, 경로, 줄 수, 터미널은 고정폭 글꼴로 씁니다.
- change
  file: docs/architecture.md
  section: Options for launching Claude Code
  from: The daemon receives each permission request on the session's output stream and answers it on the session's input stream, by a rule or through the person.
  to: The daemon receives each permission request on the session's output stream and answers it on the session's input stream, by the role's grant.
- change
  file: docs/architecture.ko.md
  section: Claude Code를 띄우는 옵션
  from: 데몬은 권한 요청을 세션의 출력 스트림에서 받고, 규칙으로 또는 사람을 거쳐 세션의 입력 스트림으로 답합니다.
  to: 데몬은 권한 요청을 세션의 출력 스트림에서 받고, 그 역할의 허락에 따라 세션의 입력 스트림으로 답합니다.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The section's heading, field, account menu, button and empty text | `apps/desktop/src/renderer/index.html#ask` (lines 517-521, 539, 781-788) | Nothing: no session is started by hand (Scope item 1). The list, `#headless` before, stands as `#view-chain` in the same place (Scope item 2). |
| The view's state and code of the field | `apps/desktop/src/renderer/work-item-view.ts#ask`, `#showAsk`, `askingIn`, `askRequest`, `askField`, `askSubmit`, `askAccount`, `askForm`, the account menu's part of `#showAccountMenus`, and the field's parts of `#enterView`, `#takeHeadless` and `#requestRefused` | Nothing. `showAccountMenus` keeps the pane buttons' tooltips. |
| The button's rule | `apps/desktop/src/renderer/view.ts#askButton` and its cases in `apps/desktop/test/view.test.ts` | Nothing. |
| The protocol message that starts a session, and its answer | `apps/desktop/src/shared/protocol.ts` `ClientMessage` `ask` and `ServerMessage` `asked`; `apps/desktop/src/daemon/daemon.ts` `case "ask"`; `apps/desktop/src/renderer/renderer.ts` `case "asked"` | The cases start a session through the public method of *Data & interfaces*. A stage's session starts inside the daemon (`runStage`), as before. |
| The path of a call that waits for the person | `protocol.ts` `PermissionAsk`, `WorkItem.permissions`, `ClientMessage` `answerPermission`; `daemon.ts` `HeadlessSession.asks`, `nextPermissionId`, `case "answerPermission"`, the `permissions` of the lists (line 2800); `role-grants.ts#verdictOn`'s `person`; `last-look.ts#isPermissionAsk` and its field; `view.ts#permissionsOf` and its readers (lines 180, 262, 285, 825-828, 1474, 1760, 3286); `work-item-view.ts#answerButton` and the card; `index.html` `#view-chain .permission`, `.call`, `.answers` (`#headless` until phase 2) | Nothing: no session without a role is started (Grounding, the `docs/roadmap.md` row). A role session's calls are answered by its grant, as before. |
| The launch of a session with neither a role nor a refresh | `apps/desktop/src/daemon/adapters/claude.ts#claudeArgs`, the `--disallowedTools` branch; the cases of `apps/desktop/test/claude-adapter.test.ts` that launch with no role (lines 29, 91, 371), which keep what they pin through a role's or a refresh's launch | Nothing launches it once Scope item 4 lands. |
| The queue's first rank | `apps/desktop/src/daemon/agent-queue.ts` `QueueRank` `asked` and its place in `RANKS` | Nothing: no session a person asked waits. `chain.test.ts:972` keeps the order of the two ranks left. |
| The words "Asked" and "what was asked" | `view.ts#archivalOf`, `#removalOf` (line 1001), `#runningSessions`, `#daemonEnding`, `#machineQueue`; `daemon.ts#changeAccount` (line 1853) | A session is named by its stage (Scope item 9). |
| The section's built-app cases | `apps/desktop/test/ask-section.test.ts`, whole | The section goes. The owner's comment on the issue says that removing the section removes its flaky case. The list's drop of a session the daemon took off its list is pinned by a `view.test.ts` case. |
| The cases of the role-less path and of the `ask` message | `apps/desktop/test/daemon.test.ts`: the cases of `describe("permission requests")` (line 5689) that hold a call for the person, from line 5832 to line 5999, and the cases at lines 5011 and 5027, which test the role pair and the fields a client sends with `ask` | Nothing: the path and the message go. The cases of the headless machinery move to the public method (Scope item 6), and the case at line 6014 keeps the refusal of an adapter that cannot launch a role. |
| Policy sentences | `git grep -n -E 'under "Ask"\|"Ask" 아래\|after "Asked:"\|"Asked:" 뒤에\|A permission request of a headless session with no role\|역할 없이 뜬\|with a role and without\|역할이 있든 없든\|A session a person asked for starts first\|사람이 요청한 세션이 먼저\|A session with no role keeps\|A headless session with no role gets\|asks the person to allow \\\|\|허락을 구하는 호출 \\\|\|A prompt asked in it\|거기서 물은 프롬프트\|on a call to allow\|허락할 호출이나\|the text of a call a session asks to make\|세션이 허락을 구하는 호출의 글\|by a rule or through the person\|규칙으로 또는 사람을 거쳐' -- docs`, executed at `d88328c3`, whose `docs/` is `d38f77a4`'s: `docs/architecture.md:91,177,247,347,348,469`, `docs/design.md:28,452,457,507,517`, `docs/product.md:47` and the same lines of both `.ko.md` editions | The operations under `## Rule changes`, which the settle writes. After the settle the search prints nothing. |

The public method of *Data & interfaces* is the one mechanism this work adds. It replaces the protocol message `ask`, which goes, and no client reaches it. Scope item 12 adds no mechanism and removes nothing: it draws an open dialog at a message that already changes what the dialog shows, as `takeLists` draws the window's other open dialogs.

Framed 2026-11-25 by framer, before the build.
