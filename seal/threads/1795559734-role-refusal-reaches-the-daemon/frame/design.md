# Design: 1795559734-role-refusal-reaches-the-daemon

## Grounding

The tree as read at `92f94607`.

In this file, the **hand check** is the second case of `apps/desktop/test/role-session.test.ts`, which `pnpm run role:refusal` and `pnpm run role:refusal:sealer` start. The **stand-in model** is a server on the loopback that the hand check starts and that answers the CLI's requests to the model's API in the model's place. The **wrapper script** is `claude-copying`, the script the hand check already puts in the CLI's place (`role-session.test.ts:92`).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *What changes because Owlery is not a plugin*, row "Each party judges only its own subject" (read) | The daemon refuses each command of a proofer and a sealer that asks for permission, and every permission request reaches the daemon on the session's own streams. This is what the hand check shows against the real CLI. |
| `docs/architecture.md` *Options for launching Claude Code*, row `--permission-prompt-tool stdio` (read) | `claude --help` of 2.1.330 did not list the option and the CLI read it. So only a run of the real CLI shows that a later version still brings the request to the daemon. |
| `docs/architecture.md` *Role sessions run detached from the user's environment* (read) | The daemon passes a session five variables and a config folder (`claude.ts#claudeEnv`). A variable that points the CLI at the stand-in model therefore enters in the wrapper script, in the test, and no code of the daemon changes. |
| `apps/desktop/src/daemon/role-grants.ts#verdictOn` (read) | The rule answers a command by the role alone and reads no command's text. A proofer at a round and a sealer at the seal hold `runs: false`, and the reason is "Owlery gives the `<role>` no command that asks for permission." |
| `apps/desktop/role-bundle/agents/proofer.md` *Job* and *A round reads, and runs nothing*; `apps/desktop/role-bundle/agents/sealer.md:27` (read) | **The cause of the failure.** Each definition tells its role to run no command that asks for permission. The hand check's prompt (`role-session.test.ts#REFUSAL_PROMPT`) asks the role for such a command. A role that holds to its definition declines, so the check passes only where the model breaks the rule the product gives it. |
| #181's phase 4 record, read with `git show origin/feat/181-a-claude-code-pane-carries-none-of-owlerys-chain:seal/threads/1795497826-pane-carries-the-chain/trail/phases/phase-4.md` (executed) | Session 3 on Claude Code 2.1.331: the first two assertions passed, the proofer "answered that a proofer writes no file and runs nothing in a round", and no request reached the daemon. The record agrees with the cause above. |
| `apps/desktop/test/claude-adapter.test.ts:981` and `:1060` to `:1099`; `apps/desktop/test/daemon.test.ts:5711` (read) | The suite already holds the adapter's reading of a `can_use_tool` request, the answer it writes, and the daemon's rule, each against a scripted CLI or a fake adapter. None runs the real CLI. |
| `apps/desktop/test/role-session.test.ts:92` to `:100`; `apps/desktop/src/daemon/adapters/claude.ts:116` to `:123` and `:484` (read) | The hand check's stand-in shell prints no `__owlery_config` line, so the session is given no `CLAUDE_CONFIG_DIR` and the CLI keeps its default folder, the person's own. The spawn prompt said the hand check already sets the app's own folder or a temporary one. The tree does not show that. |
| `apps/desktop/vitest.config.ts` (read) | A test file that imports `buildApp` from `./built-app` runs in the project `app`. `role-session.test.ts` imports it and starts no app: it calls `buildApp` for the bundle alone. |
| `gh issue view 191 --json title,body,comments,milestone,labels` (executed) | The issue holds no comment. The settle of 0.0.3 added nothing to it. |
| `ls -l` of the `claude` the shell finds, and the probe's `init` line (executed) | The installed Claude Code is 2.1.331, above the minimum 2.1.326 of `docs/architecture.md` *Options for launching Claude Code*. |

### The probe

One probe ran, once, on 2026-11-25 against Claude Code 2.1.331 (executed). It was the file `test_tmp_standin_model.mjs` under the framer's scratch directory, run as `node test_tmp_standin_model.mjs`. It used no login and none of the person's usage. It saw only the requests its own server received: whether the CLI contacted another host was not measured.

**What it started.** A server on `127.0.0.1` in the model's place, and the real CLI with the arguments of `claude.ts#claudeArgs` for a proofer: `--tools Read,Glob,Grep,Bash`, `--plugin-dir` with `apps/desktop/role-bundle` of a `git clone --no-local` at `92f9460`, `--agent owlery:proofer`, `--append-system-prompt-file`, `--permission-mode default` and `--permission-prompt-tool stdio`. The CLI's environment held `HOME` and `CLAUDE_CONFIG_DIR` as two empty temporary folders, `USER`, `PATH`, `LANG`, `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`, `ANTHROPIC_BASE_URL` naming the server, `ANTHROPIC_API_KEY` as a placeholder that is no key, and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`. The probe answered the permission request itself, with the refusal `verdictOn` writes for a proofer.

**What it showed.**

- The session started with no login. Its `init` line named `apiKeySource` as `ANTHROPIC_API_KEY`, the tools `Read`, `Glob`, `Grep`, `Bash`, the permission mode `default`, the agent `owlery:proofer` among its agents, and `claude_code_version` as `2.1.331`.
- The CLI made two requests of the server and no other: each `POST /v1/messages?beta=true` with `stream: true`, an `x-api-key` header, and a system prompt that held the appended rules file.
- The server answered the first with one `tool_use` block, `Bash` with the command `printf x >> README.md`. The CLI then wrote a `control_request` of the subtype `can_use_tool` for `Bash` with that command.
- After the refusal, the CLI's second request carried a `tool_result` with `is_error: true` whose content was the refusal's reason, word for word. The output stream held the same `tool_result` in a `user` line.
- `README.md` kept its bytes, `a repository\n`. The `result` line had the subtype `success` and listed the call under `permission_denials`. The CLI exited with 0, 250 ms after its start.

**Where the probe differs from the hand check.** The rules file was a short head and the three documents, not `claude-roles.ts#rulesText`. The probe wrote the answer to the request, where the hand check has the daemon write it. The variables reached the CLI from the probe's own `spawn`, where the hand check sets them in the wrapper script.

### The search a cell states

`git grep -n 'REFUSAL_PROMPT' -- apps/desktop` at `92f94607` printed two lines, `apps/desktop/test/role-session.test.ts:54` and `:153` (executed). *Removes* row 1 names both. The pathspec excludes this work item's directory.

## Scope

In:

1. **The hand check's session is the real CLI, launched by the daemon as today, with the stand-in model behind it.** The case starts the stand-in model before it launches the session and closes it when the case ends.
2. **The wrapper script points every run of the CLI in the hand check at the stand-in model and at temporary folders.** It sets `ANTHROPIC_BASE_URL` to the stand-in model's address, `ANTHROPIC_API_KEY` to a placeholder that is no key, `HOME` and `CLAUDE_CONFIG_DIR` to two folders the case makes under its kept folder, and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`. It sets them before its `--version` branch, so the daemon's read of the version takes them too. The hand check therefore reads and writes nothing of the person's Claude Code folder and spends none of the person's usage.
3. **The stand-in model issues the refused call.** *Data & interfaces* states its answers. The first request of the session is answered with one `Bash` call whose command is `role-session.test.ts#APPEND`.
4. **The case asserts what the daemon's refusal leaves, in this order.** The `init` line's tools and permission mode, as today, and its `apiKeySource`, which is `ANTHROPIC_API_KEY`. A `can_use_tool` request for `Bash` whose command is `APPEND`, on the session's output stream. A `tool_result` among the requests the stand-in model received whose content holds the reason `verdictOn` writes for the pair and whose `is_error` is true. The bytes of `README.md`. The session's state, error and role as the daemon holds them. No permission waiting for the person.
5. **A failure names its cause.** Where the stand-in model received no request, the case fails on an assertion whose message says that the CLI did not reach the stand-in model. Where it received a request and the stream holds no `can_use_tool` request, the case fails on the request's assertion. Neither failure reads as the daemon not refusing.
6. **The case prints the CLI's version**, `claude_code_version` of the `init` line, beside what it prints today.
7. **`pnpm run role:run` keeps a real model on the person's login.** `launched` takes the stand-in model as an optional argument. Without it, the wrapper script's text and the launch are what they are at `92f94607`.
8. **The file's text says what each case is.** The comment that opens `role-session.test.ts`, the `describe` title and the hand check's `it` title say that the first case is a real session on the person's login and that the second runs the real CLI against a stand-in model and costs nothing.
9. **The hand check is run three times in a row for each pair**, `pnpm run role:refusal` and `pnpm run role:refusal:sealer`, and the phase record names each run's result and the CLI's version each run printed.

Out:

- **The hand check as a case of the suite.** It now costs no usage, so it could run in the broad gate wherever a `claude` is installed. The issue does not ask for it, CI holds no `claude`, and the suite would then fail on an update of the person's CLI. That is a decision about what the broad gate guarantees.
- **`pnpm run role:run` and `pnpm run pane:run`.** Each asks a real model a question its definition allows, and neither failed.
- **The daemon, the adapter and the role bundle.** The rule, the launch and the definitions are correct as they stand: the role declined a call its definition forbids.
- **Issue #110's line "the window says so".** A person sees the window, in the walk of #184.
- **`apps/desktop/package.json`.** The three scripts keep their names and their variables.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The proofer's call is refused | Given the built bundle and an installed `claude`. When `pnpm run role:refusal` runs. Then the case passes, three runs in a row. | The runs of *Scope* item 9, in `trail/phases/phase-1.md` with the version each printed. |
| 2. The sealer's call is refused | Given the same. When `pnpm run role:refusal:sealer` runs. Then the case passes, three runs in a row, and the reason names the sealer. | The same record. |
| 3. The check fails where the daemon does not refuse | Given `role-grants.ts#GRANTS` edited so that a proofer at a round holds `runs: true`, uncommitted. When `pnpm run role:refusal` runs. Then the case fails on the reason's assertion, and `README.md` of the scratch repository holds `a repository\nx`. | Seen red once by the builder, then the edit is reverted. The phase record quotes the failing line. |
| 4. The check does not pass where no call is made | Given the stand-in model edited to answer its first request with text and no call, uncommitted. When `pnpm run role:refusal` runs. Then the case fails on the assertion of the `can_use_tool` request. | Seen red once by the builder, then the edit is reverted. The phase record quotes the failing line. |
| 5. The hand check touches nothing of the person's | Given a run of scenario 1. Then the CLI's `HOME` and config folder are the two folders under the case's kept folder, and the `init` line's `apiKeySource` is `ANTHROPIC_API_KEY`. | The case asserts `apiKeySource`. The wrapper script's text is read. |
| 6. The real session's case is as it was | Given `OWLERY_ROLE_RUN=1` and no `OWLERY_ROLE_REFUSAL`. Then the wrapper script's text and the launch are those of `92f94607`. | Read in the diff. The case is not run by the build: `frame/questions.md` Q1. |
| 7. The old prompt is gone | After the build, `git grep -n 'REFUSAL_PROMPT' -- apps/desktop` prints nothing. | The search of *Grounding*, run again at the phase's commit. |

## Data & interfaces

No schema, protocol message or endpoint of the app changes. The work adds one helper of the tests and changes one test file.

**`apps/desktop/test/model-stand-in.ts`, new.** It exports one function that starts a server of `node:http` on `127.0.0.1` at a port the system gives, and returns the server's address, the requests it received, and a function that closes it. It takes the command of the call it issues. Its answers:

| Request | Answer |
|---|---|
| `POST /v1/messages…` whose `tools` name `Bash` and whose `messages` hold no `tool_result` | One assistant message with one `tool_use` block: `name` `Bash`, `input` `{ command, description }`, and `stop_reason` `tool_use` |
| `POST /v1/messages…` whose `messages` hold a `tool_result` | One assistant message with one line of text and `stop_reason` `end_turn` |
| Any other `POST /v1/messages…`, such as one whose `tools` name no `Bash` | The same line of text |
| `POST /v1/messages/count_tokens…` | `{ "input_tokens": 1 }` |
| Anything else | Status 404 with an error body |

A request with `stream: true` is answered as server-sent events, in the order the probe sent them: `message_start`, `content_block_start`, `content_block_delta` (an `input_json_delta` holding the whole input for the call, a `text_delta` for text), `content_block_stop`, `message_delta` with the `stop_reason`, `message_stop`. A request without it is answered with the message as one JSON body. Each answer names the model the request named. The server keeps, for each request, its method, its path and its parsed body.

**`apps/desktop/test/role-session.test.ts#launched`.** It gains an optional third argument, the stand-in model's address. With it, the wrapper script opens with one `export` line for each variable of *Scope* item 2. Without it, the script is unchanged.

## Rule changes

- nothing
  why: No policy document names a hand check, and the daemon's rule, the launch and the role definitions keep their text.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The prompt that asks the role to run a command its definition forbids, and its one use | `apps/desktop/test/role-session.test.ts#REFUSAL_PROMPT` | The stand-in model issues the call, so no sentence asks the model for it. The session's message is one short line the case writes in place. |
| The assertion that reads the reason anywhere in the stream's text | `apps/desktop/test/role-session.test.ts:165` | *Scope* item 4 reads the reason in the `tool_result` the stand-in model received, which is what the model is told. |
| The sentences that say every case of the file costs the person's usage and runs on the person's login | `apps/desktop/test/role-session.test.ts:1` to `:17`, and the `describe` title at `:56` | *Scope* item 8 rewrites them in place. |

The work adds no gate, check, hook or rule. It adds one helper to a check that exists, and the helper replaces the check's dependence on the model's turn.

Framed 2026-11-25 by framer, before the build.
