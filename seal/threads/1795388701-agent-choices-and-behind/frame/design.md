# Design: 1795388701-agent-choices-and-behind

## Grounding

The tree as read at `9fe0c0c`.

Issue #27 is the request. Its body was read whole from the orchestrator's copy, which holds no comment. Its *Done when* leaves three lines for this work: the choices an agent offers with its question, on a waiting line and in the preview, read from the hook's payload; how many commits a branch is behind its base, beside "ahead" in the preview and the view's facts; and no new protocol field that names a vendor. `seal/follow-up.md` does not exist, and the repository declares no `seal/parity.json`. The policy root `docs/` has no `README.md`, so no index names its documents: each `file:` of *Rule changes* is a document read at `9fe0c0c`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Overall layout*: "Agent state is judged from events, never guessed from what the terminal screen prints" | The question and its choices come from an event's payload. Nothing reads the pane's output |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2 | The protocol carries the shapes the daemon's reader produces. The question tool's name and its input's field names stand in the daemon alone: `apps/desktop/src/daemon/agent-events.ts` reads them, beside the map of that agent's events. The two readings of a tool's name that stood before this work stay, as *Data & interfaces* names them |
| `docs/architecture.md` *The phone: the terminal session as a chat*: "the daemon's WebSocket protocol is not fitted only to the desktop UI, and no state lives on the UI side" | The questions and the count are the daemon's values, sent with the session and the work item. The window computes neither |
| `docs/architecture.md` *The phone*: "Hooks are added only to the sessions Owlery launches", and `apps/desktop/src/daemon/hooks.ts#HOOK_EVENTS` | The daemon already receives `PreToolUse` and `PermissionRequest` for every tool, with the matcher `*`. This work adds no hook and changes no hook setting |
| `docs/design.md` *Principles* 2: "The window reports, and does not converse. … It draws no chat bubble, no prompt box" | The window shows the choices and takes no answer. No choice is a button and the card gains no field |
| `docs/design.md` *Principles* 8: "Every form is stated here" | The form of the choices is stated in *Components and their states*, through *Rule changes* |
| `docs/design.md` *What every theme shares* and *The voice of the window's words* | One set of words for every theme, in sentence case, with a state named by its own words |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | The pull request carries the screenshots of the inbox and of a work item's view, made by `pnpm run screenshots` and committed under this work item's directory |
| `docs/product.md` *Foundation*: "A parked work item … its line says the first question it waits on", and the order `apps/desktop/src/renderer/view.ts#lineText` keeps | A parked work item's question and a headless session's call keep their place before what a pane's agent says. The agent's question stands where the agent's words stand today |
| `docs/roadmap.md` *Releases and the tracker*: the first pull request of a release moves the version | This work moves no version |

Facts the frame rests on, each with how it was established.

- **Which field carries the choices.** A `PreToolUse` hook's input for the tool `AskUserQuestion` holds `tool_input.questions`, an array whose entries hold `question`, `header`, `options` and `multiSelect`, and each option holds `label` and `description`. `read` on 2026-11-23 in Claude Code's hooks reference (`https://code.claude.com/docs/en/hooks`, the `tool_input` table of `AskUserQuestion`). `executed`: `strings -n 8` over the installed CLI's executable, 2.1.330, then `grep -o '.\{300\}multiSelect.\{400\}'`, printed the tool's schema with those names and `options` with `.min(2).max(4)`, and `grep -o 'questions:[A-Za-z$_]*([A-Za-z$_()]*)\.min([0-9]*)\.max([0-9]*)'` printed `min(1).max(4)` twice and `min(1).max(7)` once. No `claude` process was started.
- **`PreToolUse` is sent before the person answers.** `read` in the same reference: `PreToolUse` runs "before every tool call, whether or not it needs permission", and a `PreToolUse` hook may answer the question itself by returning `updatedInput` with `answers`. Owlery's relay returns nothing, so the CLI's own dialog asks.
- **Whether `PermissionRequest` is also sent for that tool is not established.** The reference says the event runs "when Claude Code is about to ask you for permission to use a tool" and does not name this tool. `executed`: the same `strings` output names the dialog `AskUserQuestionPermissionDialog`, which suggests the permission path and does not show it. *Scope* item 3 is built so that either answer gives the same line (`frame/questions.md` Q1).
- **A `Notification` carries `message`, `title` and `notification_type`.** `executed`: `grep -o '.\{250\}hook_event_name:"Notification".\{250\}'` over the same output printed `hook_event_name:"Notification",message:y,title:k,notification_type:R`. The notification of a permission prompt says `Claude needs your permission to use <tool>` and is sent after a timer, and the idle one says `Claude is waiting for your input`. This answers which field holds the text, which the frame of issue #18 left open as its Q11 (`git show c128acb3:seal/threads/1795043695-inbox-first-window/frame/questions.md`). The order of the events in a real session stays unmeasured.
- **What a waiting question says today.** `read`: `agent-events.ts#agentSaid` reads `tool_name` of a `PermissionRequest`, `message` of a `Notification` and `last_assistant_message` of a `Stop`, and nothing of a `PreToolUse`. `agent-state.ts#agentStateAfter` maps `tool-start` to `working`. So a session whose agent asks a question is `working` until a `PermissionRequest` or a `Notification` arrives, and its line then says "Asks to use AskUserQuestion" or the notification's sentence, never the question.
- **An event that leaves the state as it was changes nothing of the session.** `read`: `daemon.ts#agentEvent` returns before it writes `stateSince`, `stateText` and `stateTool` where the state is unchanged (`apps/desktop/src/daemon/daemon.ts:292`).
- **Ahead is counted at every read against the base as the clone holds it.** `read`: `worktrees.ts#aheadOf` runs `git rev-list --count <base>..<head>` with the ref `baseRef` gives, and `daemon.ts#readBranch` calls it at every read, "since the base moves by itself". No fetch runs for a count.
- **One git command gives both counts.** `executed`, `test_tmp_behind.sh` in the framer's scratch directory, git 2.50.1: on a branch two commits ahead of `main` and three behind, `git rev-list --left-right --count refs/heads/main...<head> --` printed `3<TAB>2`, the base's side first; `git rev-list --count main..HEAD` printed `2` and `HEAD..main` printed `3`; after `main` was merged into the branch the command printed `0<TAB>3`; for a base that does not exist it failed with `fatal: bad revision`.
- **Neither count is a change since the last look.** `executed`: `git grep -n 'aheadOfBase\|stateText' -- apps/desktop/src/renderer` at `9fe0c0c` printed two lines, `view.ts:966` in `saidBy` and `view.ts:1040` in `ahead`. No function that compares a work item with the look reads either field.
- **A look's file refuses an entry that lacks a field, but for the fields named as late.** `read`: `last-look.ts#isSession` requires every field of a session, and `CameLater` lists the work item's fields a look may lack.
- **The daemon keeps 2000 characters of a text and adds no mark.** `read`: `daemon.ts#cutText` (line 28).
- **The searches of *User scenarios & acceptance* and of *Removes*.** `executed` at `9fe0c0c`: `git grep -n 'AskUserQuestion\|tool_input\|tool_name' -- apps/desktop/src/shared apps/desktop/src/renderer apps/desktop/src/main` printed nothing and exited 1. `git grep -n -w 'aheadOf' -- apps/desktop` printed lines of three files, `src/daemon/daemon.ts`, `src/daemon/worktrees.ts` and `test/worktrees.test.ts`, and *Removes* names each.
- **The release's process changes.** `executed`: `gh release view --json body` gave a body with no `### Process changes` heading, and `grep -n 'Process changes' seal/threads/*/changelog.md` printed nothing.
- **The mockup the owner chose draws the choices numbered.** `read`: the frame of issue #18 records the preview of direction B as "a card with what the agent asks, two numbered choices and a field for a reply" (`git show c128acb3:seal/threads/1795043695-inbox-first-window/frame/design.md`, line 81). The field for a reply is what *Principles* 2 of `docs/design.md`, written after it, refuses.

## Scope

In scope, each item one thing the build delivers.

1. **The protocol carries what an agent asks.** `SessionInfo` gains `stateQuestions`: the questions the event that began `state` asks the person, each with the choices the agent offers, or `null` where that event asked none and where no event began the state. A question is an `AskedQuestion`: `asks`, the question's text; `options`, each with `label` and `implies`, named as `Question.options` names them; and `multiple`, true where the person may choose more than one. A daemon of an earlier build sends no such field, and a client reads its absence as `null`.
2. **The daemon reads the questions from the agent's own event.** `agent-events.ts#agentSaid` also gives `questions`. For Claude Code it reads them from a `PreToolUse` or a `PermissionRequest` whose `tool_name` is `AskUserQuestion`, in `tool_input.questions`. An entry gives a question where its `question` is text with something to read in it. An option is kept where its `label` is such text. Its `description` is its `implies`, or the empty text where the description is no text. `multiSelect` gives `multiple` true only where it is `true`. The reader keeps the first 8 questions and the first 8 options of each, which is over the CLI's own limits of *Grounding*. Where the payload gives no question, `questions` is `null` and the event says what it says today. Where it gives one, the event's `text` is the first question's text. The question's `header` and an option's `preview` are not read.
3. **An event that asks leaves the session waiting.** Where an event carries questions, the session's state after it is `waiting`, whatever the event's neutral name is. The daemon keeps `stateQuestions` with the state as it keeps `stateText`: each text cut as `cutText` cuts one, set when the state begins, `null` again when the next state begins, and unchanged by an event that leaves the state as it was. So a question tool's `PreToolUse` begins the wait with the question, a `PermissionRequest` or a `Notification` that follows changes nothing, and the tool's end begins `working`.
4. **The protocol carries how far a branch is behind its base.** `WorkItem` gains `behindBase`: how many commits `baseBranch` holds that the work item's branch does not, or `null` where `aheadOfBase` is `null`. A daemon of an earlier build sends no such field, and a client reads its absence as `null`.
5. **The daemon counts ahead and behind in one read.** `worktrees.ts#baseDistance(repo, baseBranch, head)` runs `git rev-list --left-right --count <base>...<head> --` with the ref `baseRef` gives, and answers both counts, or `null` where `baseRef` gives none or git gives no two counts. It takes the place of `aheadOf`. `daemon.ts#readBranch` calls it at every read, as it calls `aheadOf` today, and a read after which either count differs sends an `inbox`. A work item just cut is ahead by none and behind by none. No remote is asked and nothing is fetched for a count.
6. **A look carries both fields.** `last-look.ts` copies `stateQuestions` and `behindBase` into a look and refuses a file whose value of either is of another type. A look written before this work holds neither, and is read with each at `null`.
7. **A waiting line says the question and its choices.** `view.ts#lineText` gives, where the line's pane carries questions, the first question's text, then the labels of its choices with " · " between them, then, where the agent asks more, how many more questions, as a parked work item's line says it: "Which library formats the dates? date-fns · dayjs (and 1 more question)". The row keeps its order: a parked work item's question first, then a headless session's call, then this, then the newest commit, then the branch, and the branch alone while a search is typed.
8. **The preview and the view list the choices.** `view.ts#stateSays` also gives the questions. Where it gives one or more, the card of what the agent says, drawn by `shared.ts#detail` in the preview and in a view's right column alike, shows under its head each question's text and under it a numbered list of its choices, in the payload's order: the label, and what it leads to where the agent said it. Under a question that takes more than one stand the words "More than one may be chosen." The card keeps the waiting edge it has today. No choice is a button, and the card holds no field.
9. **The preview and the view's facts say "behind" beside "ahead".** `view.ts#ahead` gives the sentence "6 commits ahead of main, 2 behind" and the fact "main · 6 ahead · 2 behind". Behind is said wherever the daemon sent a count, 0 among them, and left out where it sent none and where no base branch is recorded.
10. **The screenshot run shows the choices.** In `test/screenshots.test.ts` the work item that needs the person waits through the question tool's event, with one question and two choices, in place of its `Notification`. The run's inbox step opens that work item's view before the inbox and waits until the preview's title is that work item's, since the inbox selects the work item whose view it leaves (`renderer.ts#openList`) and the run shoots another view between the two appearances. The pull request carries the screenshots of the inbox and of that work item's view in Night watch's two appearances, committed under this work item's `screenshots/`, as `docs/design.md` asks.
11. **The changelog fragment.** `changelog.md` of this work item says the two things a person now sees. No version moves.
12. **The rules.** *Rule changes* below, which the settle writes.

Out of scope, each with why.

- **Answering a question from the window.** `docs/design.md` *Principles* 2 refuses a field for a reply, and the person answers in the agent's pane, which the view shows. An answer from another client is the phone's, in v0.2 (`docs/product.md` *The phone: the same session as a chat*).
- **The choices of a permission prompt**, such as allowing a call once or for the session. A `PermissionRequest` carries `permission_suggestions`, which are changes of permission rules and not the words the CLI's dialog offers, and nobody has measured what a real session sends there.
- **A form an MCP server opens.** No event Owlery listens to carries it.
- **A question of a headless session.** A session without a role is launched with `AskUserQuestion` disallowed (`apps/desktop/src/daemon/adapters/claude.ts:94`), and a role holds its role's tools. What such a session needs from the person is a permission request or a parked question, which #119 and #159 built.
- **Fetching a base so that "behind" is current.** A count asks no remote. The count against a remote's branch moves at the person's fetch, as "ahead" does.
- **Counting a base that moved as a change since the last look.** The work item did not change. *Grounding* shows that "ahead" is not such a change today.
- **The text of the notification macOS shows.** `view.ts#notificationFor` says the state's words, and this work leaves it.
- **Running a real `claude` to see which events a question sends, and in which order.** The owner's rule for this run forbids it. `frame/questions.md` Q1 holds it for a person.

## User scenarios & acceptance *(mandatory)*

The line numbers this section gives are read at `9fe0c0c`; the earlier phases have moved them.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The reader gives the questions an event asks | Given a `PreToolUse` whose `tool_name` is `AskUserQuestion` and whose `tool_input.questions` holds two questions, the first with two options and the second with `multiSelect: true`, then `agentSaid` gives the first question's text as `text` and both questions, each with its options' labels and descriptions, and with `multiple` false and true. Given the same payload as a `PermissionRequest`, then the same questions and the tool's name | Cases in `apps/desktop/test/agent-events.test.ts` |
| 2. The reader reads nothing it was not given | Given a `PreToolUse` of another tool, or of the question tool with a `tool_input` that is no record, or with `questions` that is no array or holds no entry with a text, then `questions` is `null` and `text` is `null`. Given an entry without a text among entries with one, an option without a label, a description that is no text and a `multiSelect` that is not `true`, then the entry and the option are left out, `implies` is empty and `multiple` is false. Given 9 questions, or 9 options of one, then 8 are kept | Cases in `apps/desktop/test/agent-events.test.ts` |
| 3. A question begins the wait, and what follows it leaves it | Given a pane whose agent works, when its `PreToolUse` of the question tool arrives, then the session is `waiting` since that moment, with the first question as `stateText` and the questions as `stateQuestions`. When a `PermissionRequest` of the same tool and then a `Notification` arrive, then the session's state, its time, its text, its tool and its questions are as they were. When the tool's `PostToolUse` arrives, then the session is `working` and `stateQuestions` is `null`. Given a `PreToolUse` of `Bash`, then the session is `working` with `stateQuestions` `null` | Cases in `apps/desktop/test/daemon.test.ts`, beside the cases of `stateText` near its line 2823, with the daemon's clock set through its options |
| 4. A long question is cut as a long text is | Given a question, a label and a description each longer than 2000 characters, then each arrives with its first 2000 characters | A case in `apps/desktop/test/daemon.test.ts`, beside the case of a long `stateText` at its line 2842 |
| 5. Both counts are read together | Given a work item just cut from `main`, then `baseDistance` gives ahead 0 and behind 0. When its branch gains a commit, then 1 and 0. When `main` gains two, then 1 and 2. When `main` is merged into the branch, then 2 and 0. When `main` takes the branch, then 0 and 0. Given a remote's branch as the base, when the remote gains a commit, then behind is unchanged until the clone fetches. Given a base or a repository that is gone, then `null` | The cases of `aheadOf` in `apps/desktop/test/worktrees.test.ts`, rewritten to read both counts |
| 6. A work item carries "behind", and an `inbox` follows a base that moved | Given a work item cut from `main`, then its `behindBase` is 0. When `main` gains a commit and the branch's head stays, then the next read sends an `inbox` with `behindBase` 1. Given a work item with no base branch, or whose base branch is gone, then `behindBase` is `null` | Cases in `apps/desktop/test/daemon.test.ts`, beside the cases of `aheadOfBase` near its line 3166. `WORK_ITEM_FIELDS` and `SESSION_FIELDS` of that file gain the two names |
| 7. A look keeps both, and an earlier look still reads | Given a look whose session carries questions and whose work item carries `behindBase`, then the file read again gives the same look. Given a file written without `stateQuestions` or without `behindBase`, then the look is read with that field `null`. Given a file whose `stateQuestions` is a text or whose `behindBase` is a text, then it is no look | Cases in `apps/desktop/test/last-look.test.ts` |
| 8. The line says the question and its choices | Given a waiting pane with one question and two choices, then `lineText` gives `state` and "Which library formats the dates? date-fns · dayjs". Given two questions, then the text ends with " (and 1 more question)". Given a question with no choice, then its text alone. Given the work item also parked, or with a headless session's call, then that row's text as today. Given a search, then the branch. Given a session without the field, as an earlier daemon sends it, then the state's text as today | Cases in `apps/desktop/test/view.test.ts`, in its `lineText` blocks |
| 9. The card's content | Given a waiting pane with questions, then `stateSays` gives the head "Claude Code asks", `waiting` true and the questions with their options and `multiple`. Given a pane with a text and no question, then no question and the text, as today | Cases in `apps/desktop/test/view.test.ts`, in its `stateSays` block |
| 10. Ahead and behind in words | Given ahead 6 and behind 2 of `main`, then the sentence "6 commits ahead of main, 2 behind" and the fact "main · 6 ahead · 2 behind". Given behind 0, then "…, 0 behind" and "… · 0 behind". Given `behindBase` `null` or absent, or no base branch, then the sentence and the fact of today | The cases of `ahead` in `apps/desktop/test/view.test.ts` near its line 3063, with the new ones beside them |
| 11. The window draws them | Given the built app with a work item whose agent pane was fed the question tool's `PreToolUse` with two questions, the first with two choices and the second taking more than one of its two, then the work item's line stands under "Needs you" and its second row says the first question, its two labels and " (and 1 more question)"; the preview's card says "Claude Code asks", both questions, and two numbered lists of two items, each with its label and what it leads to, with the words "More than one may be chosen." under the second question and none under the first; the card holds no button and no field; and the work item's view shows the same card in its right column | One case in a built-app file that already starts the app with an agent's pane and feeds its hook, which `apps/desktop/test/notification-click.test.ts` does today, so that the case adds no start of the app. The payload is fed through the hook socket, and no `claude` runs |
| 12. No vendor's name reaches the protocol or the window | Given the built tree, then the question tool's name and its input's field names stand in the daemon alone, and no file of `src/shared`, `src/renderer` or `src/main` names either | `git grep -n 'AskUserQuestion\|tool_input\|tool_name' -- apps/desktop/src/shared apps/desktop/src/renderer apps/desktop/src/main` prints nothing, as it does at `9fe0c0c`. The review reads the names of the two new fields and of `AskedQuestion` |
| 13. The screenshots | Given `pnpm run screenshots` in `apps/desktop`, then the inbox's preview and the view of the work item that needs the person show the card with its two choices, in Night watch dark and light | The PNG files committed under `seal/threads/1795388701-agent-choices-and-behind/screenshots/`, read by the review against `docs/design.md` |

## Data & interfaces

The line numbers this section gives are read at `9fe0c0c`; the earlier phases have moved them.

`apps/desktop/src/shared/protocol.ts`:

```ts
/** One question an agent asks the person in its own pane, with the choices it offers. */
export interface AskedQuestion {
  asks: string;
  /** The choices in the agent's order, each with what the agent says it leads to, which may be empty. It may hold none. */
  options: { label: string; implies: string }[];
  /** True where the person may choose more than one. */
  multiple: boolean;
}
```

- `SessionInfo.stateQuestions: AskedQuestion[] | null`, after `stateTool`.
- `WorkItem.behindBase: number | null`, after `aheadOfBase`.
- `ClientMessage` and `ServerMessage` gain no message and no field of their own.

`apps/desktop/src/daemon/agent-events.ts`: `agentSaid(hookName, payload)` returns `{ text, tool, questions }`. The names of the question tool's input fields stand in this file and in no other of `src/`. Two readings of a tool's name stood before this work and stay: `daemon.ts#agentEvent` reads `payload.tool_name` for the `agent` message, and `adapters/claude.ts` reads `request.tool_name` and names `AskUserQuestion` in `--disallowedTools`.

`apps/desktop/src/daemon/agent-state.ts`: the state after an event takes whether the event asks, and gives `waiting` where it does.

`apps/desktop/src/daemon/daemon.ts`: `agentEvent` (line 283) keeps `stateQuestions`; a pane's start (line 1423) holds it `null`, and `silentStartOver` (line 1515) writes nothing of it, since it fires only where no event came after that start; `aheadCounts` (line 219) holds both counts for each work item, set at a creation (line 581), read in `readBranch` (line 1792) and sent with the work item (line 1586).

`apps/desktop/src/daemon/worktrees.ts`: `baseDistance(repo: string, baseBranch: string, head: string): Promise<{ ahead: number; behind: number } | null>`.

`apps/desktop/src/daemon/last-look.ts`: `isSession`, `isWorkItem`, `CameLater` and `lookOf`.

`apps/desktop/src/renderer/view.ts`: `stateSays` gains `questions` in what it returns, an empty list where the session carries none. `choiceNote(question)` gives the sentence the card shows under a question that takes more than one choice, "More than one may be chosen.", and an empty string under one that takes one. `lineText` and `ahead` keep their signatures. `apps/desktop/src/renderer/shared.ts#detail` draws the list, and `apps/desktop/src/renderer/index.html` holds its style, drawn with the tokens the card and the parked questions' options use today. No theme gains a token.

## Rule changes

- add
  file: docs/architecture.md
  section: Overall layout
  to: **A session whose agent asks the person a question is shown as waiting, with the question and the choices the agent offers, read from the event that asks.** An agent asks through an event of its own, as Claude Code does through the call of its question tool, and that event carries each question with its choices. The daemon reads them there and sends them as neutral values, and reads none of them from what the pane prints. The event that asks is sent before the person answers, so the session waits from that event on, whichever event the CLI sends after it.
    check: apps/desktop/test/agent-events.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 전체 구성
  to: **에이전트가 사람에게 질문하는 세션은 사람을 기다리는 것으로 보여 주고, 질문과 에이전트가 내놓은 선택지를 그 질문을 알리는 이벤트에서 읽어 함께 보여 줍니다.** 에이전트는 자기 이벤트로 질문합니다. Claude Code는 질문 도구를 호출하는 이벤트로 묻고, 그 이벤트에 질문과 선택지가 하나씩 들어 있습니다. 데몬은 거기서 읽어 중립적인 값으로 보내고, 칸에 찍힌 글자에서는 하나도 읽지 않습니다. 질문을 알리는 이벤트는 사람이 답하기 전에 오므로, CLI가 그 뒤에 어떤 이벤트를 보내든 세션은 그 이벤트부터 사람을 기다립니다.
    check: apps/desktop/test/agent-events.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.md
  section: The phone: the terminal session as a chat
  to: | A question the agent asks, with its choices | The `PreToolUse` hook of the tool `AskUserQuestion`, whose `tool_input.questions` holds each question as `question`, `header`, `options` and `multiSelect`, and each option as `label` and `description`. Read from Claude Code's hooks reference and from the 2.1.330 executable on 2026-11-23, and not run |
- add
  file: docs/architecture.ko.md
  section: 휴대폰: 터미널 세션을 채팅 모양으로
  to: | 에이전트가 묻는 질문과 선택지 | `AskUserQuestion` 도구의 `PreToolUse` 훅입니다. `tool_input.questions`에 질문마다 `question`, `header`, `options`, `multiSelect`가 있고, 선택지마다 `label`과 `description`이 있습니다. 2026-11-23에 Claude Code의 훅 문서와 2.1.330 실행 파일에서 읽었고, 띄워 보지는 않았습니다 |
- add
  file: docs/product.md
  section: Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call
  to: **A line whose agent asks a question says the question and the choices the agent offers, and the window takes no answer.** The preview and the work item's view list each choice with what the agent says it leads to. The person answers in the agent's own pane, where the CLI asks: the window reports and does not converse ([Principles](design.md#principles)). The question and its choices come from the agent's event and never from the terminal ([Overall layout](architecture.md#overall-layout)).
    check: apps/desktop/test/view.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/product.ko.md
  section: 바탕: 작업함, AgenticSeal 프로세스, 인장의 뒷면, 그리고 불러 쓰는 터미널
  to: **에이전트가 질문하는 작업의 줄에는 그 질문과 에이전트가 내놓은 선택지가 보이고, 창은 답을 받지 않습니다.** 미리보기와 작업 화면에는 선택지마다 그것을 고르면 어떻게 되는지 에이전트가 적은 말이 함께 나옵니다. 사람은 CLI가 묻고 있는 에이전트의 칸에서 답합니다. 창은 알려 줄 뿐 대화하지 않기 때문입니다([원칙](design.ko.md#원칙)). 질문과 선택지는 에이전트의 이벤트에서 읽고, 터미널에서는 읽지 않습니다([전체 구성](architecture.ko.md#전체-구성)).
    check: apps/desktop/test/view.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/product.md
  section: Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call
  to: **A work item says how far its branch is ahead of its base branch and how far behind it.** Behind is how many commits the base branch holds that the work item's branch does not, so a person sees that the base moved before they ask for a seal or a merge. Both are counted against the base as the person's clone holds it. Owlery asks no remote for the count, so the count against a remote's branch moves at the person's fetch. A base that moved is not counted as a change of the work item since the person last looked.
    check: apps/desktop/test/worktrees.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/product.ko.md
  section: 바탕: 작업함, AgenticSeal 프로세스, 인장의 뒷면, 그리고 불러 쓰는 터미널
  to: **작업은 자기 브랜치가 기준 브랜치보다 커밋 몇 개만큼 앞서 있고 몇 개만큼 뒤처져 있는지를 보여 줍니다.** 뒤처진 개수는 기준 브랜치에는 있고 작업의 브랜치에는 없는 커밋의 수입니다. 그래서 사람은 인장을 받거나 병합하기 전에 기준이 움직였다는 것을 압니다. 두 수 모두 사람의 클론이 가진 기준을 놓고 셉니다. Owlery는 이 수를 세려고 원격에 묻지 않으므로, 원격의 브랜치를 기준으로 한 수는 사람이 fetch할 때 바뀝니다. 기준이 움직인 것은 사람이 마지막으로 본 뒤 그 작업이 바뀐 것으로 세지 않습니다.
    check: apps/desktop/test/worktrees.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/design.md
  section: Components and their states
  from: A question's grounds and what an option implies are in `--ink-muted`.
  to: A question's grounds and what an option implies are in `--ink-muted`. The choices an agent offers with its question stand under the question as a numbered list, each choice's label in `--ink-strong` and what it leads to in `--ink-muted`. Under a question that takes more than one choice stand the words "More than one may be chosen.", in `--size-caption` and `--ink-faint`. No choice is a button and the card holds no field, since the person answers in the agent's pane.
- change
  file: docs/design.ko.md
  section: 부분과 그 상태
  from: 질문의 근거와 선택지가 뜻하는 바는 `--ink-muted`입니다.
  to: 질문의 근거와 선택지가 뜻하는 바는 `--ink-muted`입니다. 에이전트가 질문과 함께 내놓은 선택지는 질문 아래에 번호를 붙인 목록으로 놓이고, 선택지의 이름은 `--ink-strong`, 그것을 고르면 어떻게 되는지는 `--ink-muted`입니다. 여러 개를 고를 수 있는 질문 아래에는 "More than one may be chosen."이라는 말이 `--size-caption`과 `--ink-faint`로 놓입니다. 사람은 에이전트의 칸에서 답하므로, 어느 선택지도 단추가 아니고 카드에는 입력 칸이 없습니다.

## Removes

This work adds no gate, check, hook, mark or label, so nothing is owed in return for one. It takes out one function, which the function of *Scope* item 5 replaces, and one fed event of the screenshot run.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The function that counts ahead alone, with its import and its call in the daemon | `apps/desktop/src/daemon/worktrees.ts#aheadOf`, and `apps/desktop/src/daemon/daemon.ts` lines 23 and 1792 | `worktrees.ts#baseDistance`, which gives the same count as `ahead` from one git command that also gives `behind` |
| The cases that pin `aheadOf` | `apps/desktop/test/worktrees.test.ts`, the cases at its lines 829 to 881 and the import at line 5 | The same cases, rewritten to read both counts of `baseDistance` (scenario 5). Each count of ahead they pin today stays pinned |
| The `Notification` the screenshot run feeds the work item that needs the person | `apps/desktop/test/screenshots.test.ts`, the entry "Fix the login redirect" of `WORK_ITEMS` | The question tool's event with the same question and two choices (*Scope* item 10). A notification's text on a line stays pinned by the cases of `stateText` in `apps/desktop/test/daemon.test.ts` and of `lineText` in `apps/desktop/test/view.test.ts` |

Framed 2026-11-23 by framer, before the build.
