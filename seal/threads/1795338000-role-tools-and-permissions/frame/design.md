# Design: each role's tools, and permission requests that reach the daemon

The ticket is issue #39. Every headless session is launched with the same tools, and a call that needs permission is answered by nobody. This work gives each role its own tools, brings each permission request to the daemon as a neutral event, and has the daemon answer it by a rule or pass it to the person.

## Grounding

The tree as read at `98f10be`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the row "Each party judges only its own subject" | The daemon sets each role's tools. A proofer and a sealer receive no tool that edits source. The daemon receives and answers every other permission request |
| `docs/architecture.md` *Overall layout*, the bullet "Permission requests are handled as first-class events" | The daemon learns of a role session's request first and passes it on. The bullet names the orchestrator agent and the person as the two it passes to. No orchestrator agent session exists in the tree, so this work has two answerers, the daemon's rule and the person, and the orchestrator agent's answer is #51's |
| `docs/architecture.md` *Overall layout*, the bullet "Agent state is judged from events" | "When the app puts a decision in front of a person, it must never do so by mistake." A request shown to the person is one a session still waits on, so a request leaves the list when its session ends or withdraws it |
| `docs/architecture.md` *Agent adapters*, the table | "Answers to permission requests" go from the daemon to the agent, "permission requests" come from the agent, and the adapter declares its list of supported features |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 to 3 | The request crosses the adapter and the protocol in a neutral shape. A feature that differs by vendor is read from the feature list. The fake adapter raises a request as the Claude adapter does |
| `docs/architecture.md` *Options for launching Claude Code*, the rows of `--tools` and of `--permission-prompt-tool` | The options this work passes. The rows also name `--allowedTools` and `--permission-prompts host`, which this work does not pass, and *Rule changes* rewrites both rows |
| `docs/architecture.md` *Role sessions run detached from the user's environment*, the row "Permission mode" | "The daemon must set it and pass it for each role." |
| `docs/roadmap.md` *Milestones*, row 1 | "Owlery never turns a permission check off." |
| `docs/architecture.md` *Memory design*, the fourth rule of its table | A role session's process is ended when its stage finishes. A session that waits for the person holds its process, so the wait is bounded by the session's time limit |
| `docs/architecture.md` *State lives in three places*, the row "The daemon" | A request that waits for the person is the daemon's state. It is written nowhere in the person's repository |
| `seal/threads/1795268972-headless-failure-and-limit/frame/design.md` *Rule changes*, the first `add` | A headless run ends at its limit of 60 minutes, counted from its start. The limit runs on while a session waits for the person |
| `seal/threads/1795329620-role-bundle/frame/design.md` *Rule changes*, the first `add` on *What each session loads* | The head of a role's rules file says that a step naming what the bundle does not hold is reported and not worked around. This work adds the session's tools to the same head |
| `seal/threads/1795329620-role-bundle/frame/design.md` *Scope* item 14 | The issue that builds each stage rewrites its role's text in the bundle. So the sentences of `agents/proofer.md` and `agents/sealer.md` on writing a record stay for #41 and #42 |

The issue has no comment. Executed: `gh issue view 39 --json title,body,comments`. The spawn carried no line of the orchestrator's on its comments. `routing.md` stands in the work item's directory and was read. The tree holds no `seal/follow-up.md`. Executed: `ls seal`.

The rule of #119, "under the routing answer `agentic`, no question holds the run", is not in this branch's `docs/`. It was read on #119's branch `feat/119-no-question-holds-an-agentic-run` at `e94d523`, in `docs/product.md` *What we promise* and `docs/architecture.md` *Code runs the order, the orchestrator judges*. *Scope* item 8 is written so that it holds under that rule.

The scratch directory is `/private/tmp/claude-501/-Users-yc-Documents-GitHub-owlery/d0446fb9-f77c-425f-bd37-d22bad5c7878/scratchpad/1795338000-role-tools-and-permissions/frame/`.

What the tree holds, each fact labelled:

- **Every headless session gets the same arguments, and a role adds no tool option.** `claudeArgs` (`apps/desktop/src/daemon/adapters/claude.ts:51-73`) passes `--permission-mode default` and, for a role, `--plugin-dir`, `--agent` and `--append-system-prompt-file`. Read.
- **The adapter ends the session's input straight after the prompt.** `child.stdin.end(promptLine(prompt))` at `claude.ts:310`. Read. So nothing can be answered on the input stream today.
- **The adapter reports text, a result and the exit, and drops every other line.** `RoleEvent` (`adapters/adapter.ts:8-14`) and `eventsForLine` (`claude.ts:155-180`). Read.
- **No adapter declares a feature, and nothing reads the list.** `features: []` in `claude.ts:267` and `fake.ts:24`. Executed: `git grep -n features 98f10be -- apps/desktop/src` prints those two lines and the interface's.
- **Nothing in the tree handles a headless session's permission request.** Executed: `git grep -n -e can_use_tool -e control_request -e permission-prompt -e answerPermission 98f10be -- apps/desktop/src` prints nothing. The word `permission` in `apps/desktop/src` names the launch's mode and a pane's hook event (`agent-events.ts`, `agent-state.ts`, `hooks.ts`), which a person answers in the pane's terminal. Executed: `git grep -n -i permission 98f10be -- apps/desktop/src`.
- **A work item's line in the inbox reads panes alone.** `inboxLine` (`apps/desktop/src/renderer/view.ts:73`) takes its state from `lineSession`, the work item's most recent live pane, and no headless session changes it. Read. The window raises a notification from a pane's state in `notificationFor` (`view.ts:1409`), called by `takeLists` (`renderer.ts:1037`). Read.
- **A look holds the panes and the work items, and no headless session.** `lookOf` (`apps/desktop/src/daemon/last-look.ts:83`). Read.
- **A real role session of 2.1.330 holds tools that write.** The `init` line of the recorded proofer session lists `Edit`, `Write`, `NotebookEdit`, `Bash` and `Task` among its tools, and `permissionMode` `default`. Executed: a read of `apps/desktop/test/fixtures/claude-role-stream.jsonl` with `python3`.
- **That session read a file of the bundle with no permission request.** `seal/threads/1795329620-role-bundle/trail/phases/phase-1.md` *The real role session*. Read, not run again.

What Claude Code 2.1.330 does with the options. Two probes ran `/Users/yc/.local/bin/claude` with the arguments of `claudeArgs` and one option set each, with `HOME` set to an empty scratch folder, so no login was read and every run ended `Not logged in · Please run /login` with `total_cost_usd` 0. Executed on 2026-11-22: `test_tmp_tools_probe.mjs` with its output `probe-tools.txt`, and `test_tmp_host_tools.mjs` with its output `probe-host-tools.txt`, all in the scratch directory.

| Arguments beside the launch's own | The `init` line, the control lines and the exit |
|---|---|
| `--permission-mode default` | `permissionMode` is `default`. `tools` holds `Task`, `Bash`, `Edit`, `NotebookEdit`, `Read`, `Skill`, `WebFetch`, `WebSearch`, `Write` and others, and neither `Glob` nor `Grep` |
| `--permission-mode manual` | `permissionMode` is `default` |
| `--permission-mode bogus` | No line. The error stream says the allowed choices are `acceptEdits`, `auto`, `bypassPermissions`, `manual`, `dontAsk` and `plan`. So the help lists `manual` and the CLI still reads `default` |
| `--tools Bash,Read,Edit,Write,Skill,Task` | `tools` is exactly those six |
| `--tools Read,Bash,Glob,Grep,NoSuchTool` | `tools` is `Bash`, `Glob`, `Grep`, `Read`. A name the CLI does not know is dropped with no error |
| `--disallowedTools Edit,Write,NotebookEdit` | `tools` is the default list without the three |
| `--allowedTools "Write(/seal/**)"` with `--disallowedTools "Bash(git push *)"` | `tools` is the default list. The line shows nothing of a rule with a pattern |
| `--permission-prompt-tool stdio`, the input held open, a `control_request` of subtype `initialize` written before the prompt | The CLI answers with a `control_response` of subtype `success` that echoes the `request_id`. `tools` gains `AskUserQuestion`, `EnterPlanMode` and `ExitPlanMode`. The result arrived after 304 ms and the process did not exit. The probe ended the input 3,000 ms later, and the process exited 372 ms after that |
| `--permission-prompt-tool stdio` with `--tools Read,Glob,Grep,Bash` | `tools` is exactly those four |
| `--permission-prompt-tool stdio` with `--tools Read,Glob,Grep,Bash,Edit,Write` | `tools` is exactly those six |
| `--permission-prompt-tool stdio` with `--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode` | `tools` is the default list of the first row |
| `--permission-prompt-tool stdio`, a `control_request` of a subtype the CLI does not know | A `control_response` of subtype `error` that echoes the `request_id`, with `error` `Unsupported control request subtype: no_such_subtype` |

What the CLI's executable says of the request and its answer. Read on 2026-11-22 in `/Users/yc/.local/share/claude/versions/2.1.330`, by a search of the file for each name with `python3`; the extract is `cli-strings.txt` in the scratch directory. None of it was run, because a permission request needs a model's tool call.

- `--permission-prompt-tool <tool>` is an option the help hides. Its own text is "MCP tool to use for permission prompts (only works with --print)", and the launcher inside the executable passes `--permission-prompt-tool=stdio`.
- The request is `{ "type": "control_request", "request_id", "request": { "subtype": "can_use_tool", "tool_name", "input", "tool_use_id", "blocked_path"?, "decision_reason"?, "permission_suggestions"? } }`.
- The answer is `{ "type": "control_response", "response": { "subtype": "success", "request_id", "response": R } }`, where `R` is `{ "behavior": "allow", "updatedInput"? }` or `{ "behavior": "deny", "message" }`.
- `{ "type": "control_cancel_request", "request_id" }` withdraws a request.
- The executable holds the sentence "tool permission stream closed before response received" as a reason for a refusal.
- `--permission-prompts none` denies at once every call that would prompt, and the host is not asked.

Three behaviours no probe of this frame could show, because each needs a model's turn on the owner's login. Each is a row of `frame/questions.md`: that a `can_use_tool` request arrives and a `deny` holds (Q3), which commands the CLI runs without asking in the mode `default` (Q4), and what 2.1.326 to 2.1.329 do with the two options (Q5).

The searches a cell of this frame states a result for, each run at `98f10be`. Executed:

- `git grep -n -e dangerously-skip-permissions -e bypassPermissions -e allow-dangerously 98f10be -- apps/desktop/src apps/desktop/role-bundle` printed nothing and exited 1. The same patterns over `apps/desktop/test` print one line, `claude-adapter.test.ts:80`, the case that refuses them, so the search of scenario 3 names the two source folders alone.
- `git grep -n -i -e claude -e anthropic 98f10be -- apps/desktop/src/shared/protocol.ts` printed lines 6 and 7, the comment and the type of `PaneKind`.
- `git grep -n -e 'no adapter declares one yet' -e 'and no feature' -e 'One message, then the end of input' 98f10be -- apps/desktop` printed four lines: `adapters/adapter.ts:26`, `adapters/claude.ts:309`, `test/claude-adapter.test.ts:177` and `test/fake-adapter.test.ts:21`. Each is a row of *Removes*.

## Scope

**In.** Items 1 to 3 and 7 are what a session holds at its launch, items 4 to 6 the request's way through the adapter, items 8 to 13 the daemon's answer, items 14 and 15 the fake adapter and the rules file, item 16 the window, and item 17 the one real run. The exact shapes and texts are in *Data & interfaces*.

1. **Each role has a grant, and the grant is neutral.** A grant says where the role may write a file and whether it may run a command that reaches the daemon as a request. A crafter at a fix pass writes inside the work item's worktree and runs commands. A proofer at a round and a sealer at the seal write nowhere and run no such command. The grants stand in one module of the daemon, and each adapter and the daemon's rule read them there.
2. **The Claude adapter names a role session's tools from its grant.** A role launch passes `--tools` with `Read`, `Glob`, `Grep` and `Bash`, and with `Edit` and `Write` where the grant names a place to write. No other built-in tool reaches a role session: no `Task`, no `NotebookEdit`, no `Skill`, no tool of the web. A launch with no role keeps Claude Code's default tools and passes `--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode`, the three tools the CLI adds where a host answers.
3. **Every launch runs in the permission mode `default`, with a role and without.** No launch names another mode, `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions`, `--bare` or `--permission-prompts none`. One mode for every role is the design: each call Claude Code would ask a person about then reaches the daemon, and the daemon's rule is the one place a role's calls are allowed or refused.
4. **Every launch passes `--permission-prompt-tool stdio`, and the adapter keeps the session's input open until the result.** The adapter writes a `control_request` of subtype `initialize`, then the prompt, and ends the input when the `result` line arrives. A stop signals the process group as before.
5. **The adapter reports a request as a neutral event.** A `can_use_tool` line becomes a `permission` event: an id, the tool's name, what the call does, the path where it reads or writes a file, and a text a person reads. `Edit`, `Write` and `NotebookEdit` write, `Read` reads, `Bash` runs, and every other tool is `other`. A `control_cancel_request` line becomes a `permission-withdrawn` event with the same id. The adapter answers a `control_request` of any other subtype with a `control_response` of subtype `error`, so the CLI never waits for an answer the adapter does not give, and it reports no `control_response` line.
6. **A run takes the answer.** `RoleRun.answer` allows the call, or refuses it with a reason the agent is told. An id the run does not wait on is ignored.
7. **Both adapters declare `role-tools` and `permission-requests`, and the daemon starts a role session only through an adapter that declares both.** An `ask` with a role through an adapter that lacks either is answered with an `error`, and nothing starts. A session with no role starts through any adapter.
8. **The daemon answers a role session's request by its role's grant, and never passes it to the person.** A write inside the grant's place is allowed and a write anywhere else is refused. A command is allowed where the grant runs commands and refused where it does not. A read and a call of any other kind are refused. Each refusal tells the agent why and tells it to name the step in its report. So no request of a stage the daemon runs holds anything, which is what #119's rule asks of a run.
9. **A path is inside the worktree where its real location is.** The daemon resolves a relative path against the worktree, follows symbolic links on the part of the path that exists, and compares the result with the worktree's own real path. A path that leaves through `..` or through a link is outside.
10. **A request of a session with no role waits for the person.** The daemon keeps it with its session, gives it an id of the daemon's own, and sends it with its work item: `WorkItem` gains `permissions`. The session's state stays `working`. The client message `answerPermission` allows or refuses one request, the daemon passes the answer to the run, and the request leaves the list. An answer for a request the daemon does not hold is an `error`, and nothing changes.
11. **A person's allowance covers that one call.** The daemon stores no allowance, and the same call asks again.
12. **A request ends unanswered with its session.** Where a session's state leaves `working`, by its result, its exit, a stop, its limit, an archive or a delete, its requests leave the list and every client is told. The session's limit counts from its start, as before, whether or not it waits. The daemon writes no request to disk: a headless session lives in memory alone, and after a restart no session is left to answer.
13. **A look holds the requests, and a look written before them is still a look.** `lookOf` copies `permissions`, and a look's file whose work items lack the field is read with none on each.
14. **The fake adapter raises requests and waits for each answer.** Given a list of requests, it reports each as a `permission` event before its text, waits for `answer`, and puts the answer into its text, so a case reads what the daemon decided. It can withdraw a request, and it can be told to declare other features.
15. **The head of a role's rules file names the session's tools.** It lists them from the grant and says that a call the daemon refuses is not worked around and is named in the report.
16. **The window shows a waiting request on its work item's line, raises the notification, and takes the answer.** A work item that holds a request has the line state `waiting`, with the request as the line's text and its age counted from the oldest request. The window raises one notification for each request it did not hold before, with the words a waiting pane's notification has, and none for a muted work item or for the work item whose view is in front of a focused window. In the work item's view, the line of the session that asks shows each request with "Allow" and "Deny", both reached by the keyboard.
17. **One real proofer session shows a refused edit.** The suite's file of real role sessions gains one case, run by a script of its own and never by the suite. It asks a proofer at a round to append to a file with one shell command, and reads the stream for the session's tools, the request and the refusal, and the file for its bytes.

**Out, each with its home.**

18. **How a proofer's round record and a sealer's guarantee reach the tree.** Neither role holds a tool that writes a file after this work, and `agents/proofer.md` and `agents/sealer.md` still tell each to write its record. #41 and #42 decide how the record comes back and rewrite those sentences (`seal/threads/1795329620-role-bundle/frame/design.md` *Scope* item 14). Until then a proofer session's record is its answer.
19. **A folder of a role's own, and probes a proofer runs.** A proofer's definition has it clone the repository and run narrow tests in the clone. After this work a proofer's command that reaches the daemon is refused, so a round reads and does not execute. #41 names the folders a stage works in. A bound on what a command writes needs the operating system's sandbox, and no issue holds that work: the orchestrator opens one. `frame/questions.md` Q1 asks the owner whether the default stands until then.
20. **A bound on a crafter's commands.** The daemon bounds a crafter's file tools to the worktree and allows its commands, and a command can still write elsewhere or push. The same sandbox work holds it.
21. **The orchestrator agent as an answerer.** #51 builds the orchestrator session.
22. **A record of the calls a rule refused.** The agent is told the reason and its answer says what it could not do. What a stage's record keeps of them is #41's.
23. **The phone.** `answerPermission` and `permissions` name no window, and the phone app of v0.2 sends and reads the same.
24. **A pane's permission request.** It is answered in the pane's terminal, and nothing of it changes.
25. **The sentences of the bundle that the structure now holds.** A proofer's "you review and never fix" and the contract's "spawn no agent" stay in the taken files. `docs/architecture.md` *Measure before building*, the bullet on startup tokens, is where they are sorted and cut.
26. **The third line of #110's *Done when*,** "a headless session's tool call that needs permission is refused, and the window says so". After this work such a call of a session with no role waits for the person. The run of item 17 gives the measurement #110's carried row names, and the line's wording is the orchestrator's to bring up on #110.

**Where each line of the issue's *Done when* lands.** The lines are numbered in the issue's order.

| Line | Lands |
|---|---|
| 1, the daemon sets the tools and the mode for each role, and a proofer or sealer that tries to edit a source file is refused, shown by a run | Items 1 to 3, 8 and 9. The run: item 17, for a proofer. A sealer holds the proofer's grant, and #42's last line asks for its own run |
| 2, a request arrives as a neutral event and is answered by a stated rule or passed to the person | Items 4 to 6 and 8 to 10 |
| 3, a request passed to the person shows on the inbox line as waiting, and the notification of #7 arrives | Items 10 and 16 |
| 4, no launch uses an option that skips permission checks | Item 3 |
| 5, the fake adapter raises a request and the suite runs both answers | Item 14, with scenarios 9 and 10 |
| 6, the feature list names what the adapter supports, and no new protocol field names a vendor | Item 7, and *Data & interfaces* |

## User scenarios & acceptance *(mandatory)*

Each case named below is shown failing before its code is written.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A role's tools come from its grant | Given each pair of `ROLE_STAGES`, when the adapter builds its arguments, then `--tools` is followed by one value: `Read,Glob,Grep,Bash` for the proofer and the sealer, and `Read,Glob,Grep,Bash,Edit,Write` for the crafter | Cases in `apps/desktop/test/claude-adapter.test.ts` over every pair |
| 2. A session with no role keeps its tools | Given no role, then the arguments hold no `--tools`, and hold `--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode` | A case in the same file |
| 3. No launch turns a check off | Given each pair and no role, then the value after `--permission-mode` is `default`, and the arguments hold none of `bypassPermissions`, `acceptEdits`, `auto`, `dontAsk`, `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions`, `--bare` and `--permission-prompts` | The case of `claude-adapter.test.ts` that holds this today, over every pair. `git grep -n -e dangerously-skip-permissions -e bypassPermissions -e allow-dangerously -- apps/desktop/src apps/desktop/role-bundle` prints nothing |
| 4. The adapter writes the handshake, then the prompt, and ends the input at the result | Given a script in the CLI's place that copies its input to a file and exits only at the end of its input, when it prints a result, then the file holds the `initialize` request on its first line and the prompt on its second, and the run reports its exit | A case in `claude-adapter.test.ts` |
| 5. A request becomes a neutral event | Given a script that prints a `can_use_tool` line for `Edit`, for `Write`, for `Bash`, for `Read` and for a tool of another name, then each `permission` event holds the line's `request_id` as its id, the tool's name, the action of *Scope* item 5, the path where the call names a file, and the text, cut at 2,000 characters | Cases in `claude-adapter.test.ts` |
| 6. An answer reaches the CLI | Given a reported request, when the run is answered with an allowance, then the script's input gains the `control_response` of *Data & interfaces* with `behavior` `allow` and the request's own input. When it is answered with a refusal, the response holds `behavior` `deny` and the reason. An answer for an id the run does not wait on writes nothing | Cases in the same file |
| 7. A withdrawn request and an unknown control request | Given a `control_cancel_request` line, then the run reports `permission-withdrawn` with its id. Given a `control_request` of another subtype, then the script's input gains a `control_response` of subtype `error` with that `request_id`, and no event is reported | Cases in the same file |
| 8. A crafter's request is answered by its grant | Given a fake adapter that raises a write of a file inside the worktree, a write outside it, a write that leaves through `..`, a write through a symbolic link that points outside, a write in the role bundle's folder and a command, when a crafter's session runs, then the answers are an allowance, four refusals and an allowance, and no `inbox` holds a request | Cases in `apps/desktop/test/daemon.test.ts` |
| 9. A proofer's and a sealer's request is refused | Given a fake adapter that raises a write inside the worktree, a command, a read and a call of another kind, when a proofer's session and a sealer's session run, then every answer is a refusal whose reason names the role and says to name the step in the report, and no `inbox` holds a request | Cases in `daemon.test.ts` |
| 10. A request of a session with no role waits for the person, and both answers are run | Given a fake adapter that raises one request, when a session with no role runs, then an `inbox` carries the request on its work item, with the session's id, and the session stays `working`. When a client sends `answerPermission` with `allow` true, then the daemon answers `done`, the fake adapter's text says the call was allowed, and an `inbox` carries the work item with no request. With `allow` false the text says it was refused, with the sentence of a person's refusal | Cases in `daemon.test.ts`, one for each answer |
| 11. An answer for a request the daemon does not hold | When `answerPermission` names an id no session waits on, a request of another work item, or a request already answered, then the daemon answers `error` and no list changes | Cases in `daemon.test.ts` |
| 12. A request ends with its session | Given a session that waits, when it is stopped by a client, reaches its limit, exits, or its work item is archived, then an `inbox` carries the work item with no request | Cases in `daemon.test.ts` |
| 13. A withdrawn request leaves the list | Given a waiting request, when the fake adapter withdraws it, then an `inbox` carries the work item with no request, and a later `answerPermission` for it is an `error` | A case in `daemon.test.ts` |
| 14. A role session needs both features | Given a fake adapter told to declare one feature alone, when a client asks with a role, then the daemon answers `error` with the sentence of *Data & interfaces* and starts nothing. An `ask` with no role starts | Cases in `daemon.test.ts`. Cases in `claude-adapter.test.ts` and `apps/desktop/test/fake-adapter.test.ts` read each adapter's two features |
| 15. A look holds the requests | Given a waiting request, when a client sends `looked`, then a `ready` sent afterwards holds the request in the look's work item. A look's file whose work items have no `permissions` is read, with none on each | Cases in `apps/desktop/test/last-look.test.ts` and `daemon.test.ts` |
| 16. The head names the tools | Given each pair, then the head of its rules file lists the tools of scenario 1 and holds the sentence of *Data & interfaces* | A case in `claude-adapter.test.ts` |
| 17. The line of a work item with a waiting request | Given a work item with one request and no pane, then its line's state is `waiting`, it stands in the inbox's first group, its text is "Asks to use Bash: " and the command, and its age counts from the request. With a second request the text ends " (and 1 more)". A work item parked with a question keeps the question as its text | Cases in `apps/desktop/test/view.test.ts` |
| 18. The notification | Given the lists the window held, when an `inbox` brings a request whose id they did not hold, then one notification is raised, titled with the work item's title, with the body "Waiting for you". None is raised for a muted work item, for the work item whose view is in front of a focused window, or for a request the window already held. A click on it opens the work item's view | Cases in `view.test.ts`, and one case in a built-app file that reads the recorded notification |
| 19. The answer in the view | Given the view of a work item whose session asks, then the session's line says it waits for the person and shows the tool, the text, "Allow" and "Deny". A press of either sends `answerPermission` with that request's id. Both are reached with the Tab key, and a redraw of the section while the keyboard is on one of them leaves it there | Cases in `view.test.ts` for the lines, and one case in a built-app file for the press and the keyboard |
| 20. A real proofer is refused an edit | Given a daemon with the Claude adapter, the built bundle and a scratch repository, when a proofer at a round is asked to run `printf x >> README.md` with its shell tool, then the stream's `init` line lists exactly `Bash`, `Glob`, `Grep` and `Read`, the stream holds a `can_use_tool` request for `Bash`, `README.md` holds the bytes it held before, the session ends `finished`, and no `inbox` held a request | `pnpm --filter @owlery/desktop run role:refusal`, once, at the close of phase 2 (`frame/plan.md` *Phases*). Where the model makes no call, the case fails on the request's line, the scenario stays `unverified` with the owner as its answerer, and no second run is made |
| 21. The new fields name no vendor | Then `PermissionAsk`, `permissions`, `answerPermission`, the two events and `RoleRun.answer` hold no name of an agent's vendor or of its CLI | Read at review in `apps/desktop/src/shared/protocol.ts` and `adapters/adapter.ts`. `git grep -n -i -e claude -e anthropic -- apps/desktop/src/shared/protocol.ts` prints the two lines of `PaneKind` it prints at `98f10be`, and no other |
| 22. A window beside a daemon of an earlier build | Given a work item with no `permissions` field, then its line and its view are drawn as for one with no request | A case in `view.test.ts` |

## Data & interfaces

All in `apps/desktop`. No field names a vendor.

**`src/daemon/role-grants.ts`**, new.

```ts
/** What a role may do at a stage: where it may write a file, and whether a command of its session that asks permission is allowed. */
export interface RoleGrant {
  writes: "worktree" | "nowhere";
  runs: boolean;
}

/** The grant of each pair of `ROLE_STAGES`. */
export function grantOf(role: RoleStage): RoleGrant;

/** What the daemon answers a request with: an allowance, a refusal with the reason the agent is told, or the person. */
export type Verdict = { answer: "allow" } | { answer: "refuse"; reason: string } | { answer: "person" };

/** The daemon's rule: the answer to a request of a session launched as `role`, or with none, that works in `worktree`. */
export function verdictOn(role: RoleStage | null, request: { action: PermissionAction; path: string | null }, worktree: string): Verdict;
```

| Session | A write inside its place | A write elsewhere | A command | A read, or another call |
|---|---|---|---|---|
| The crafter at a fix pass | allow | refuse | allow | refuse |
| The proofer at a round, the sealer at the seal | it has no place: refuse | refuse | refuse | refuse |
| No role | the person | the person | the person | the person |

The reasons, where `<role>` is the role's name and `<path>` the path as the request gave it:

- A write by a role with no place: `Owlery gives the <role> no call that writes a file. Do not work around it: say in your report which step needed the write.`
- A write outside the place: `Owlery lets the <role> write only inside the work item's worktree, and <path> is outside it. Do not work around it: say in your report which step needed the write.`
- A command: `Owlery gives the <role> no command that asks for permission. Do not work around it: say in your report which step needed the command.`
- A read, or another call: `Owlery's rule for the <role> does not allow this call. Do not work around it: say in your report which step needed it.`
- A person's refusal: `The person refused this call.`

**`src/daemon/adapters/adapter.ts`.**

```ts
/** What a call does, as its adapter reads it: it reads or writes the file at a path, runs a command, or does something else. */
export type PermissionAction = "read" | "write" | "run" | "other";

export type RoleEvent =
  | { type: "text"; text: string }
  | { type: "result"; text: string; isError: boolean; costUsd: number | null }
  | { type: "exit"; exitCode: number; errorOutput: string }
  // The agent asks to make one call, and makes none of it before `RoleRun.answer` is called with this `id`. `path` is the file a read or a write names, and null otherwise. `text` is what a person reads of the call: the path, the command, or the call's input, 2,000 characters at most.
  | { type: "permission"; id: string; tool: string; action: PermissionAction; path: string | null; text: string }
  // The agent no longer waits for an answer to the request `id`.
  | { type: "permission-withdrawn"; id: string };

export interface RoleRun {
  stop(): Promise<void>;
  /** Answers the request `id`: the call runs, or the agent is told `reason`. An id the run does not wait on is ignored. */
  answer(id: string, answer: { allow: true } | { allow: false; reason: string }): void;
}

/** A feature an adapter can declare: it sets a session's tools by its role, and it reports permission requests and takes their answers. */
export type RoleFeature = "role-tools" | "permission-requests";
```

`RoleAdapter.features` becomes `readonly RoleFeature[]`, and its comment says what the list holds. An event is never reported before the promise of `start` has resolved, as today, so the daemon holds the run when a request arrives.

**`src/daemon/adapters/claude-roles.ts`.** `toolsOf(role)` gives the names of *Scope* item 2 from `grantOf(role)`. `rulesHead` gains one paragraph after the list of documents: `You hold these tools and no other: <the names, joined by a comma and a space>. The daemon answers every call that asks for permission by the rule of your role, and no person is asked. Where it refuses a call, do not work around it: say in your report which step needed the call.`

**`src/daemon/adapters/claude.ts`.** `claudeArgs(cwd, role?)`, whose `role` gains `tools`:

- After `--permission-mode default`, every launch passes `--permission-prompt-tool stdio`.
- A role launch then passes `--tools` and the names joined by commas as one value, before `--plugin-dir`.
- A launch with no role then passes `--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode`.
- `--add-dir` stays last.

The lines the adapter writes and reads:

- First, `{"type":"control_request","request_id":"owlery-initialize","request":{"subtype":"initialize"}}`, then the line of `promptLine`.
- A request: a line whose `type` is `control_request` and whose `request.subtype` is `can_use_tool`. The event's `id` is `request_id`, its `tool` is `request.tool_name`. For `Edit`, `Write` and `Read` the path is `request.input.file_path`, and for `NotebookEdit` `request.input.notebook_path`. For `Bash` the text is `request.input.command`. For any other tool the text is `request.input` as JSON.
- An allowance: `{"type":"control_response","response":{"subtype":"success","request_id":<id>,"response":{"behavior":"allow","updatedInput":<the request's input, unchanged>}}}`.
- A refusal: the same line with `"response":{"behavior":"deny","message":<reason>}`.
- To another `control_request`: `{"type":"control_response","response":{"subtype":"error","request_id":<id>,"error":"Owlery answers no control request of the subtype <subtype>"}}`.

**`src/daemon/adapters/fake.ts`.** `FakeAdapterOptions` gains `asks`, the requests a session raises, each `{ tool, action, path, text, withdraw? }`, given the prompt and the role as `pieces` is, and `features`, the list it declares in place of both. For a request it was answered, its text holds `allowed: <tool>` or `refused: <tool>: <reason>` before its pieces.

**`src/shared/protocol.ts`.**

```ts
/** One call a headless session waits for the person to allow or refuse. */
export interface PermissionAsk {
  /** Given once by the daemon since it started. */
  id: number;
  /** The headless session that asks. */
  headlessId: number;
  /** The tool's name, as the session's agent names it. */
  tool: string;
  /** What the call does: it reads or writes a file, runs a command, or does something else. */
  action: "read" | "write" | "run" | "other";
  /** What a person reads of the call: the path, the command, or the call's input, 2,000 characters at most. */
  text: string;
  /** The daemon's clock when the request arrived. */
  at: number;
}
```

- `WorkItem` gains `permissions: PermissionAsk[]`, the requests of its headless sessions that wait for the person, the oldest first. A daemon of an earlier build sends no such field, and a client reads its absence as none.
- `ClientMessage` gains `{ type: "answerPermission"; requestId: number; workItemId: number; id: number; allow: boolean }`, answered with `done` before the `inbox` that carries the change, or with `error`: `no permission request <id> waits in this work item`.
- No server message is added. `ready`, `inbox` and the look carry `permissions` with each work item.
- The `error` of *Scope* item 7: `the <adapter's name> adapter cannot launch a role: it does not declare <the missing features, joined by " and ">`.

**`src/daemon/daemon.ts`.** `HeadlessSession` gains the requests it waits on, by the adapter's id. `startHeadless`'s listener takes the two new events: it asks `verdictOn`, answers the run, or keeps the request and sends an `inbox`. `headlessChanged` drops a session's requests where its state is no longer `working`, and sends an `inbox` where it dropped one. `workItemOf` adds `permissions`. `handle` gains the `answerPermission` case, in `stopHeadless`'s shape. The `ask` case reads the adapter's features before it starts a role session.

**`src/daemon/last-look.ts`.** `lookOf` copies `permissions`, and `isWorkItem` accepts a work item without the field.

**`src/renderer/view.ts`**, the functions the window's words come from. `inboxLine` gives `waiting` to a work item that holds a request. The line's text is `Asks to use <tool>: <text>`, followed by ` (and 1 more)` or ` (and <n> more)`, and it stands after a parked work item's question and before a pane's state. The line's age counts from the oldest request's `at`. New functions, named by the builder, give the notifications of scenario 18 and the lines of scenario 19. `headlessLines` gains each session's requests. `src/renderer/work-item-view.ts`, `renderer.ts`, `shared.ts` and `index.html` draw them.

**`package.json`.** A script `role:refusal` runs `test/role-session.test.ts` with `OWLERY_ROLE_REFUSAL=1`. The file's first case runs only under `OWLERY_ROLE_RUN=1` and its new case only under `OWLERY_ROLE_REFUSAL=1`, so each script spends one session.

## Rule changes

- change
  file: docs/architecture.md
  section: What changes because Owlery is not a plugin
  from: The daemon sets each role's tool permissions. proofer and sealer do not receive tools that edit source (`--tools`, `--allowedTools`, `--disallowedTools`). The daemon receives and answers any other permission request (`--permission-prompts host`, `--permission-prompt-tool`)
  to: The daemon sets each role's tools (`--tools`). proofer and sealer receive no tool that writes a file, and the daemon refuses each of their commands that asks for permission. Every permission request reaches the daemon on the session's own streams (`--permission-prompt-tool stdio`), and the daemon answers it by the role's rule ([Agent adapters](#agent-adapters))
- change
  file: docs/architecture.ko.md
  section: 플러그인이 아니라서 달라지는 것
  from: 역할마다 도구 권한을 데몬이 정합니다. proofer와 sealer는 소스를 고치는 도구를 받지 못합니다(`--tools`, `--allowedTools`, `--disallowedTools`). 그 밖의 권한 요청은 데몬이 받아 답합니다(`--permission-prompts host`, `--permission-prompt-tool`)
  to: 역할마다 쓸 도구를 데몬이 정합니다(`--tools`). proofer와 sealer는 파일을 쓰는 도구를 받지 못하고, 이 둘의 명령 가운데 권한을 묻는 것은 데몬이 모두 거절합니다. 권한 요청은 모두 그 세션의 입출력 스트림으로 데몬에 오고(`--permission-prompt-tool stdio`), 데몬은 그 역할의 규칙으로 답합니다([에이전트 어댑터](#에이전트-어댑터))
- add
  file: docs/architecture.md
  section: Agent adapters
  to: **A role session holds only the tools its role is granted, and the daemon answers its permission requests by that grant, never through the person.** A crafter at a fix pass holds the tools that read, search, run a command and write a file. The daemon allows its writes inside the work item's worktree, refuses its writes anywhere else, the role bundle's folder among them, and allows its commands. A proofer at a round and a sealer at the seal hold no tool that writes a file, and the daemon refuses each of their commands that reaches it as a request, so neither changes the tree it judges through a call the daemon answers. Every other request of a role session is refused. A refusal tells the agent why, and tells it to name the step that needed the call in its report. The head of a role's rules file names the tools the session holds. A written rule can be broken, and a refused call is not made. The daemon does not read a command to judge what it changes: it answers by the role alone, so a crafter's command can still write outside the worktree, and a bound on that needs the operating system's sandbox, which no launch sets yet. The daemon starts a role session only through an adapter whose feature list names `role-tools` and `permission-requests`.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/claude-adapter.test.ts apps/desktop/test/fake-adapter.test.ts
- add
  file: docs/architecture.ko.md
  section: 에이전트 어댑터
  to: **역할 세션은 그 역할이 허락받은 도구만 가지고, 그 세션의 권한 요청은 데몬이 그 허락에 따라 답하며 사람에게 넘기지 않습니다.** 수정 패스의 crafter는 읽기, 찾기, 명령 실행, 파일 쓰기 도구를 가집니다. 데몬은 crafter가 작업의 워크트리 안에 쓰는 것을 허락하고, 역할 묶음의 폴더를 포함해 그 밖에 쓰는 것은 거절하며, 명령은 허락합니다. 라운드의 proofer와 인장 단계의 sealer는 파일을 쓰는 도구가 없고, 이 둘의 명령 가운데 요청으로 데몬에 온 것은 데몬이 모두 거절합니다. 그래서 둘 다 데몬이 답하는 호출로는 자기가 판정하는 트리를 바꾸지 못합니다. 역할 세션의 그 밖의 요청은 모두 거절합니다. 거절할 때는 에이전트에게 까닭을 알리고, 그 호출이 필요했던 단계를 보고에 적으라고 알립니다. 역할의 규칙 파일 머리말은 그 세션이 가진 도구를 밝힙니다. 글로 적은 규칙은 어길 수 있지만, 거절된 호출은 실행되지 않습니다. 데몬은 명령을 읽어서 무엇을 바꾸는지 판단하지 않고 역할만으로 답합니다. 그래서 crafter의 명령은 여전히 워크트리 밖에 쓸 수 있고, 이를 막으려면 운영체제의 샌드박스가 필요한데 아직 어떤 실행에도 걸려 있지 않습니다. 데몬은 기능 목록에 `role-tools`와 `permission-requests`가 있는 어댑터로만 역할 세션을 띄웁니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/claude-adapter.test.ts apps/desktop/test/fake-adapter.test.ts
- add
  file: docs/architecture.md
  section: Agent adapters
  to: **A permission request of a headless session with no role waits for the person, on its work item's line.** A person started that session from the work item's view, and no role's grant covers it. The adapter reports the request as a neutral event: the tool's name, whether the call reads a file, writes one, runs a command or does something else, and the path or the command. The daemon holds the call and sends the request with its work item. The work item's line in the inbox then says it waits, and the window raises the notification a waiting session raises. The person allows or refuses the call in the work item's view, and an allowance covers that one call. A request ends unanswered when its session ends, at its limit among other ends, and the daemon keeps none across its own restart, because the session that asked is gone by then.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/last-look.test.ts
- add
  file: docs/architecture.ko.md
  section: 에이전트 어댑터
  to: **역할 없이 뜬 headless 세션의 권한 요청은 그 작업의 줄에서 사람을 기다립니다.** 그 세션은 사람이 작업 화면에서 직접 띄운 것이고, 어느 역할의 허락도 적용되지 않습니다. 어댑터는 요청을 특정 회사에 묶이지 않은 이벤트로 알립니다. 이벤트에는 도구의 이름, 그 호출이 파일을 읽는지, 쓰는지, 명령을 실행하는지, 그 밖의 일을 하는지, 그리고 경로나 명령이 담깁니다. 데몬은 그 호출을 붙잡아 두고 요청을 그 작업과 함께 보냅니다. 그러면 작업함에서 그 작업의 줄이 기다리는 중이라고 말하고, 창은 기다리는 세션이 띄우는 것과 같은 알림을 띄웁니다. 사람은 작업 화면에서 그 호출을 허락하거나 거절하고, 허락은 그 호출 한 번에만 적용됩니다. 세션이 끝나면 요청도 답 없이 끝나며, 한도에 이르러 끝나는 경우도 같습니다. 데몬은 다시 시작한 뒤까지 요청을 간직하지 않습니다. 요청한 세션이 그때는 없기 때문입니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/last-look.test.ts
- change
  file: docs/architecture.md
  section: Role sessions run detached from the user's environment
  from: With user settings removed, it becomes `default`. The daemon must set it and pass it for each role
  to: With user settings removed, it becomes `default`. The daemon passes `default` for every headless session, with a role and without, so each call Claude Code would ask a person about reaches the daemon. `claude --help` of 2.1.330 lists the mode as `manual`, and the CLI still reads `default` (probed 2026-11-22)
- change
  file: docs/architecture.ko.md
  section: 역할 세션은 사용자 환경에서 떼어 띄웁니다
  from: 사용자 설정을 떼면 `default`가 됨. 역할마다 데몬이 정해 넘겨야 함
  to: 사용자 설정을 떼면 `default`가 됨. 데몬은 역할이 있든 없든 모든 headless 세션에 `default`를 넘기고, 그래서 Claude Code가 사람에게 물었을 호출이 모두 데몬으로 옴. 2.1.330의 `claude --help`는 이 모드를 `manual`로 적지만 CLI는 `default`도 그대로 읽음(2026-11-22 실험)
- change
  file: docs/architecture.md
  section: Options for launching Claude Code
  from: `--tools`, `--allowedTools`, `--disallowedTools` | Sets which tools each role can use
  to: `--tools`, `--disallowedTools` | `--tools` names the built-in tools a role session holds, and no other reaches it. A session with no role keeps Claude Code's default tools, less the three the CLI adds where a host answers its prompts (`--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode`)
- change
  file: docs/architecture.ko.md
  section: Claude Code를 띄우는 옵션
  from: `--tools`, `--allowedTools`, `--disallowedTools` | 역할마다 쓸 수 있는 도구를 정합니다
  to: `--tools`, `--disallowedTools` | `--tools`는 역할 세션이 가질 내장 도구를 이름으로 정하고, 그 밖의 도구는 그 세션에 들어가지 않습니다. 역할 없이 뜬 세션은 Claude Code의 기본 도구를 그대로 가지되, 호스트가 프롬프트에 답할 때 CLI가 더하는 세 도구는 뺍니다(`--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode`)
- change
  file: docs/architecture.md
  section: Options for launching Claude Code
  from: `--permission-prompts host`, `--permission-prompt-tool` | The daemon receives permission requests and answers them through a person or a rule
  to: `--permission-prompt-tool stdio` | The daemon receives each permission request on the session's output stream and answers it on the session's input stream, by a rule or through the person. `claude --help` of 2.1.330 does not list the option, and the CLI reads it (probed 2026-11-22). `--permission-prompts` stays at its default, `host`
- change
  file: docs/architecture.ko.md
  section: Claude Code를 띄우는 옵션
  from: `--permission-prompts host`, `--permission-prompt-tool` | 권한 요청을 데몬이 받아 사람이나 규칙으로 답합니다
  to: `--permission-prompt-tool stdio` | 데몬은 권한 요청을 세션의 출력 스트림에서 받고, 규칙으로 또는 사람을 거쳐 세션의 입력 스트림으로 답합니다. 2.1.330의 `claude --help`에는 이 옵션이 나오지 않지만 CLI는 이 옵션을 읽습니다(2026-11-22 실험). `--permission-prompts`는 기본값 `host` 그대로 둡니다

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The clause "no adapter declares one yet" of the comment on `features` | `apps/desktop/src/daemon/adapters/adapter.ts#RoleAdapter` | Both adapters declare features after this work, and the comment says what the list holds |
| The end of the session's input straight after the prompt, with its comment "One message, then the end of input, so the session ends after one turn" | `apps/desktop/src/daemon/adapters/claude.ts#claudeAdapter` | The input ends at the `result` line (*Scope* item 4). A session still takes one prompt |
| The pin "declares a name and no feature" | `apps/desktop/test/claude-adapter.test.ts`, the group "the Claude adapter's run" | A case that reads the adapter's two features (scenario 14) |
| The pin "declares a name and no feature" | `apps/desktop/test/fake-adapter.test.ts`, the group "the fake adapter" | A case that reads the fake adapter's two features, and the list it was told to declare (scenario 14) |

The work adds a rule to `docs/architecture.md` and takes no written rule out in return. The sentences its structure now holds stand in files the bundle takes from AgenticSeal byte for byte, and item 25 of *Scope* names where they are cut.

Framed 2026-11-22 by framer, before the build.
