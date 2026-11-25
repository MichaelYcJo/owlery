# Design: the broad gate run from an owl chain pane hands the pane's OWLERY_* variables to the suite

## Grounding

Read at `d4a63f35`.

- `paneCommands` (`apps/desktop/src/daemon/hooks.ts`) sets four variables in a pane's own environment: `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET` for every pane, and `OWLERY_CHAIN` and `OWLERY_BASE` for a Claude Code pane on the owl chain. `setupPaneCommand` sets `OWLERY_PANE_ID`.
- `spawnPane` (`apps/desktop/src/daemon/daemon.ts`) starts a pane in `{ ...process.env, ...env }`, and a sign-in pane in its command's `env` alone, and `TerminalSession.spawn` (`apps/desktop/src/daemon/pty.ts`) filters that environment through `terminalEnv`. A daemon whose own environment holds the four variables therefore hands `OWLERY_CHAIN` and `OWLERY_BASE` to every pane other than a sign-in pane whose command sets none, and a daemon started in an Owlery pane holds them.
- `gateEnvironment` (`apps/desktop/src/daemon/gate.ts`) gives the broad gate's command the pane's environment through `terminalEnv`, without `TERM` and `COLORTERM`. The chain command's `gate` runs in a pane, so the suite and every daemon a case starts inherit the four variables.
- `OWLERY_RUN_DIR` is not a pane's: the app sets it for the daemon it starts (`apps/desktop/src/main/daemon-client.ts`), each pane other than a sign-in pane inherits it, and the chain command reads it (`apps/desktop/src/daemon/chain-command.ts`).
- Read at `282e3eab`, the merge of `release/v0.0.4` that brought issue #226: `paneCommands` and `setupPaneCommand` also set `OWLERY_RUN`, the runner of heavy commands, for each shell, Claude Code pane and worktree setup pane where the daemon wrote a runner, and the chain command finds the daemon's turn socket through it (`apps/desktop/src/daemon/chain-command.ts`).
- Executed in the pane of `balmy-bison` (issue #176), at `e098fc7a`: `test/daemon.test.ts`'s group "a Claude Code pane and the owl chain" failed 6 of 17 cases under the pane's environment, and passed 17 with the four variables and `OWLERY_RUN_DIR` unset. Executed in the same pane, in this work item's worktree at `5cb81763`: the group passed 17 with the four variables unset and `OWLERY_RUN_DIR` kept.

## Scope

1. A pane holds the pane variables, its id, hook socket, runner of heavy commands, chain command and base, only where its own command sets them: `spawnPane` takes them out of the daemon's environment before the command's own go over it.
2. The broad gate's command holds none of the pane variables of the pane the chain command runs in.
3. One constant names the pane variables, and `paneCommands`, `setupPaneCommand` and both cuts read their names from it, so a variable a pane's command sets later is cut with the rest.

Out: `OWLERY_RUN_DIR`, `OWLERY_BACKGROUND` and every other variable of Owlery's stay where they are. `CLAUDE_CONFIG_DIR`, which a shell's command sets where the pane's account names a folder, stays too: a person may set it in their own environment, and under System default Owlery leaves it as they set it. A sign-in pane, which runs in its command's environment alone, is unchanged.

## User scenarios & acceptance *(mandatory)*

| # | Scenario | Verifiable how |
|---|---|---|
| 1 | A daemon started in an Owlery pane launches a Claude Code pane on the owl chain and a shell. The first carries its own chain, base, id and socket. The shell carries no chain and no base, its own id and socket, and both keep the daemon's run folder. | check: apps/desktop/test/daemon.test.ts |
| 2 | The broad gate's environment, built from a pane's, holds none of the pane variables, whichever of a shell, a Claude Code pane on the chain or off it and a worktree setup pane it was started in, and keeps `OWLERY_RUN_DIR` and `OWLERY_BACKGROUND`. | check: apps/desktop/test/gate.test.ts |
| 3 | `test/daemon.test.ts`'s group "a Claude Code pane and the owl chain" passes when the suite runs in a pane that holds the four variables. | The session's run of the group in the pane of `balmy-bison`, which holds the four variables (`gaps.md` *Not verified*). The broad gate cannot hold this row: `gateEnvironment` takes the four variables out before the suite starts (`apps/desktop/src/daemon/gate.ts`), so under the gate the group runs without them. What the gate runs of this condition is scenario 1's case, which sets the four variables in the suite's own process. |

## Rule changes

- change
  file: docs/architecture.md
  section: What each session loads
  from: Its environment gains `OWLERY_CHAIN`, the path of the launcher `owl-chain` in the run folder, and `OWLERY_BASE`, the work item's base.
  to: Its environment gains `OWLERY_CHAIN`, the path of the launcher `owl-chain` in the run folder, and `OWLERY_BASE`, the work item's base. A pane holds these, its id, its hook socket and its runner of heavy commands only where its own command sets them: a daemon started in an Owlery pane, and a broad gate the chain command starts there, take none of them from that pane, and keep the daemon's run folder.
- change
  file: docs/architecture.ko.md
  section: 세션마다 싣는 것
  from: 칸의 환경에는 `OWLERY_CHAIN`과 `OWLERY_BASE`가 더해집니다.
  to: 칸의 환경에는 `OWLERY_CHAIN`과 `OWLERY_BASE`가 더해집니다. 칸은 이 둘과 자기 id, 훅 소켓, 무거운 명령의 runner 를 자기 명령이 넣어 줄 때만 갖습니다. Owlery 칸 안에서 시작한 daemon 과, 체인 명령이 거기서 시작한 전체 검사는 그 칸의 것을 하나도 물려받지 않고, daemon 의 실행 폴더는 그대로 둡니다.

## Removes

- nothing
  why: The work adds a list and two cuts, and takes no file, case or sentence out of the tree.

Framed 2026-11-25 by the session, after the build.
Reframed 2026-11-25 by the session after round 5, on the owner's word: the runner of heavy commands joins the pane variables.
