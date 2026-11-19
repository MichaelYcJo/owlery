# Design: a Claude Code pane that waits before its session starts

The ticket is issue #23. It has no comments (`gh issue view 23 --json body,comments`, `executed`).

## Grounding

The tree as read at `ba22934`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Overall layout*, the bullet "Agent state is judged from events, never guessed from what the terminal screen prints" | The daemon does not read the pane's output to find the question. The bullet's last sentence, "When the app puts a decision in front of a person, it must never do so by mistake", bounds how soon a silent pane may be called waiting |
| `docs/architecture.md` *The phone: the terminal session as a chat*, the bullet "Hooks are added only to the sessions Owlery launches. The user's own settings files are not changed" | Owlery does not write the trust record, which Claude Code keeps in `~/.claude.json`, and does not read it either |
| `docs/roadmap.md` *Milestones*, row 1: "a notification arrives when the session waits", and "Owlery never turns a permission check off" | The line and the notification are owed for a pane that waits at the question. The pane is not opened past the question by an option that bypasses the CLI's checks |
| `docs/product.md` *Foundation*, the bullet "The sessions a person drives open in a terminal": every feature of the CLI works as it does outside the app | The person answers the trust question in the pane, as in any terminal |
| `docs/architecture.md` *Rules that keep it portable*, and the head of `apps/desktop/src/shared/protocol.ts` | The protocol gains no vendor field. The rule the daemon gains names no CLI and no question |

The policy root has no `README.md` index, so each `file:` of `## Rule changes` is named directly. `seal/follow-up.md` does not exist. The repository has published no GitHub Release (`gh release view` printed "release not found", `executed`), and no changelog fragment under `seal/threads/` holds the words "Process changes" (`grep -l`, `executed`).

**What Claude Code sends at the trust question, from three probes run on 2026-11-19 (`executed`).** Each probe started `claude` 2.1.327 in a pseudo-terminal with the command `claudePaneCommand` gives (`/bin/zsh -l -i -c "exec claude --settings <file>"`), the settings file `writeHookSettings` wrote, the environment `terminalEnv` leaves, and `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET` set, and listened on the hook socket, whose path was 47 bytes. The settings register the events of `HOOK_EVENTS`, eight of them, so "none" in the table means none of these. The probes and their output are under the session's scratchpad, in `1795048706-trust-question/frame/`: `test_tmp_trust_probe.py`, `test_tmp_trust_probe_2.py` and `test_tmp_trust_probe_3.py`, with the `probe-log.txt`, `probe-2-log.txt` and `probe-3-log.txt` they wrote.

| Folder the pane started in | What was on screen | Events |
|---|---|---|
| A new worktree of this repository, which `~/.claude.json` lists as trusted (probe 1) | The prompt, 1.1 s after the pane's start. No trust question | `SessionStart` at +1.09 s |
| The first worktree of a clone Claude Code had never seen (probe 2, launch A) | The trust question at +1.15 s: "Quick safety check: Is this a project you created or one you trust?", with "No, exit" selected and "Yes, I trust this folder" under it | None in 75 s with no key pressed |
| The same pane, Enter pressed at +75 s | "No, exit" was taken, and `claude` closed the terminal 0.66 s later | None |
| The same worktree started again, and a second worktree of that clone (launches B and C) | The trust question again, at +1.19 s and +1.96 s | None in 35 s each |
| The first worktree again, Down then Enter pressed at +4.99 s (probe 3, launch D) | The prompt | `SessionStart` 0.17 s after Enter, and no other event in the 75 s after it, with nothing typed |
| The second worktree of the clone after that answer (launch E) | The prompt. No trust question | `SessionStart` at +1.42 s |

- **The issue's symptom holds, and is narrower than the issue states.** A pane at the trust question sends no event, so its session keeps `state: null`, and the window's line shows no state and no notification. The question is not asked in "every new work item". Claude Code keeps the answer for the repository: before launch D `~/.claude.json` held no entry under the scratch, and after it one entry, for the clone's own folder, with `hasTrustDialogAccepted: true` (`jq`, `executed`). So the question is asked in the first work item of a repository the person never trusted in Claude Code, and in none after the person answers yes. A repository the person already works in with Claude Code is not asked at all. `frame/questions.md` Q1 asks whether the work is still wanted.
- **The drive of issue #7 met the question because its repository was new.** `seal/threads/1795019054-inbox/trail/phases/phase-2.md` at `3627642` says the repository was `repos/alpha` under the scratch, with one commit (`read`).
- **A started session reports within two seconds.** The `SessionStart` events of the table arrived 1.09 s and 1.42 s after the pane's start, and 0.17 s after the answer. The time from the pane's start includes the login shell's own start.
- **Nothing in the tree reads the time before a pane's first event.** `git grep -n -i -e 'first event' -e firstEvent -e silent -- apps` at `ba22934` printed one line, the comment at `apps/desktop/src/shared/protocol.ts:52` (`executed`). `Daemon#agentEvent` (`apps/desktop/src/daemon/daemon.ts:110`) changes a session's state only when an event arrives, and `agentStateAfter` (`apps/desktop/src/daemon/agent-state.ts`) judges from one event (`read`).
- **`claude --help` names no option that passes the question in a terminal** (`executed`). Its lines on trust are under `-p`, which skips the question where the output is not a terminal, and under `doctor`. The options that bypass checks are `--dangerously-skip-permissions` and `--allow-dangerously-skip-permissions`, which the roadmap's row rules out.
- **The window already shows `waiting` and notifies for it** (`read`). `inboxLine` (`apps/desktop/src/renderer/view.ts:41`) reads the state of the work item's most recent live pane that reports state, and `notificationFor` (`view.ts:68`) gives "Waiting for you" when a pane that is not in front becomes `waiting`. On `feat/18-the-app-opens-on-a-pane-of-terminals` at `6509bae`, `stateHeading` of `view.ts` puts a `waiting` line under "Waiting for you" and a line with no state under "No agent".
- **No case of the suite can keep a pane for 10 seconds** (`read`). `apps/desktop` has no vitest configuration, and `scripts/test-in-electron.mjs` passes vitest no time limit, so vitest's own limit of 5 seconds per case stands.
- **The user's files across the probes.** `shasum -a 256` of every file directly in `~/.claude` and in `~/.claude/plugins`, and of `~/.claude.json`, was taken before the first probe and after the last (`executed`). `settings.json`, `settings.local.json`, `CLAUDE.md` and `keybindings.json` were the same byte for byte. Five files differed, each one Claude Code writes itself: `history.jsonl`, `remote-settings.json.synced-at`, `plugins/known_marketplaces.json`, `plugins/plugin-directory-cache-v2.json` and `~/.claude.json`. Other Claude Code sessions ran on the machine meanwhile, so the differences are not all the probes'. Of `~/.claude.json`'s, the clone's entry named above is the probes': Claude Code wrote it when launch D answered "Yes, I trust this folder".

## Scope

1. **A pane that says nothing after its start is shown as waiting.** For a pane of a kind that reports state (`PaneKindInfo.reportsState`), the daemon waits a fixed time from the pane's start. Where the pane is still alive, is still on the daemon's lists, and no event has arrived under its id, the daemon sets the session's state to `waiting` and sends the inbox, as any change of state does.
2. **The time is 10 seconds by default**, held in `DaemonOptions` as `silentStartMs`, so a case sets a short one. `apps/desktop/src/daemon/main.ts` passes none. Ten seconds is seven times the slowest report seen (*Grounding*), which keeps a slow start from being called waiting, and a person who walked away is still notified within the minute.
3. **The first event ends the wait for good.** Any event `Daemon#agentEvent` receives under the pane's id cancels the timer, whichever hook it names. The timer is also cancelled when the pane's process exits, when a client closes the pane, and in `Daemon#close`. It runs once for a pane and is never started again.
4. **A state set by silence is replaced as any state is.** The next event `agentStateAfter` maps gives the session its state. After the person answers the question, the session's start gives no state, and a prompt gives `working`. A pane whose process exits gives its line no state, as today.
5. **The comment on `SessionInfo.state` says the new fact** (`apps/desktop/src/shared/protocol.ts:52`): the state is null until the agent's first event or until the silent start is over, whichever comes first.
6. Out of scope:
   - Saying on the line why the pane waits. The daemon does not know whether the CLI asks about trust, a login or something else, and the person reads it in the pane.
   - Answering the question for the person, opening the pane past it, and reading or writing `~/.claude.json`.
   - A change to the window. The line, its group and the notification read `SessionInfo.state`, which already carries `waiting`.
   - A change to `agentStateAfter` or to the events Owlery listens to.
   - What a session sends when it sits idle for longer than 75 seconds or compacts its conversation, which `seal/threads/1795019054-inbox/gaps.md` *Not verified* leaves to a person.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A real pane at the trust question is listed as waiting | Given the built app's daemon and a repository Claude Code has never seen, when a work item is created with a Claude Code pane and no key is pressed, then the daemon lists the pane with no state at first and `waiting` once the silent start is over, and the window's line for the work item says it waits | The built app driven once: a probe reads the daemon's lists as a second client and the line's text through the debugging port. The probe then presses Enter in the pane, which takes "No, exit" in Claude Code 2.1.327, so Claude Code writes no trust record. `shasum -a 256` of `~/.claude/settings.json` and `~/.claude/settings.local.json` is taken before and after and compared |
| 2. A silent pane becomes waiting | Given a daemon with a short `silentStartMs` and a pane of a kind that reports state whose process prints nothing, when the time passes, then every client receives an inbox that lists the pane `waiting`, and one such inbox | A case |
| 3. A pane that reported is never called waiting by silence | Given the same daemon, when an event arrives under the pane's id before the time passes, then the pane's state after the time has passed is the one the event gave | Cases: one with the session's start, which leaves no state, and one with a hook name `agentEventFor` does not map |
| 4. The answer clears the waiting | Given a pane made `waiting` by silence, when the session's start arrives, then the pane has no state, and a prompt after it gives `working` | A case |
| 5. A kind that reports no state stays without one | Given a shell pane that prints nothing, when the time passes, then its state is null and no inbox was sent for it | A case |
| 6. A pane that is gone is not called waiting | Given a pane whose process exited, or one a client closed, before the time passed, then no inbox lists it `waiting` afterwards | Cases, one for each |
| 7. The default leaves the existing cases as they are | The cases of `apps/desktop/test/daemon.test.ts` that start a pane of a kind that reports state and expect no state pass unchanged, because none can last 10 seconds (*Grounding*) | The suite, which the broad run answers |

## Data & interfaces

- `apps/desktop/src/daemon/daemon.ts`: `DaemonOptions` gains `silentStartMs?: number`, how long a pane of a kind that reports state may send no event after its start before it is listed as waiting, 10 000 where absent. `Daemon` holds one timer per such pane, started in `startSession` and cancelled as *Scope* item 3 says.
- `apps/desktop/src/shared/protocol.ts`: no type changes. `SessionInfo.state` keeps the type `AgentState | null`, and its comment changes (*Scope* item 5).
- `apps/desktop/test/daemon.test.ts`: the cases of scenarios 2 to 6.

## Rule changes

- add
  file: docs/architecture.md
  section: Overall layout
  to: - **A CLI that reports through hooks and has sent no event 10 seconds after its pane started is shown as waiting for the person.** A CLI asks its first questions before its session starts and sends no event while it asks. Claude Code 2.1.327, run on 2026-11-19, sent none of its hook events while it asked whether to trust the folder, which it asks in the first worktree of a repository the person has not trusted in Claude Code, and it sent its session's start within two seconds wherever it did not ask. The daemon judges this from the missing event and never from what the pane prints, and the session's first event replaces the state.
    check: apps/desktop/test/daemon.test.ts

- add
  file: docs/architecture.ko.md
  section: 전체 구성
  to: - **훅으로 상태를 알리는 CLI가 창을 연 지 10초가 지나도록 이벤트를 하나도 보내지 않으면, 사람을 기다리는 것으로 보여 줍니다.** CLI는 세션을 시작하기 전에 먼저 물어볼 것을 묻고, 묻는 동안에는 이벤트를 보내지 않습니다. 2026-11-19에 Claude Code 2.1.327을 띄워 보니, 폴더를 신뢰하는지 묻는 동안에는 훅 이벤트를 하나도 보내지 않았습니다. 이 질문은 사람이 Claude Code에서 신뢰한 적 없는 저장소의 첫 워크트리에서 나옵니다. 묻지 않는 곳에서는 2초 안에 세션 시작을 알렸습니다. 데몬은 이벤트가 오지 않았다는 사실로 판정하고 창에 찍히는 글자로는 판정하지 않으며, 세션의 첫 이벤트가 오면 그 상태로 바꿉니다.
    check: apps/desktop/test/daemon.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The sentence that a session's state is null until the agent's first event | `apps/desktop/src/shared/protocol.ts#SessionInfo` (the comment on `state`) | Rewritten in place with the silent start (*Scope* item 5) |

The work adds one rule to the daemon and takes no mechanism out in return, because none stands in its place today: no gate, check or mark watches a pane's start. The rule is weighed by what it shows a person, which scenario 1 runs against the real question.

Framed 2026-11-19 by framer, before the build.
