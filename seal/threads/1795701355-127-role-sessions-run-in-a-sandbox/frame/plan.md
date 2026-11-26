# Implementation Plan: 1795701355-127-role-sessions-run-in-a-sandbox

## Technical context

The tree as read at `88ad5244`.

The work builds on #39's grants and the Claude adapter's launch. `role-grants.ts:31-36` holds the four grants and `:135-145` the daemon's rule; `adapters/claude.ts:80-104` builds a role launch's arguments, and its `--settings` value is a JSON string the adapter already writes; `daemon.ts:2342-2397` starts a role session with `cwd` the worktree and answers each request by `verdictOn`; `daemon.ts:2440-2470` makes the session, where the scratch folder is made; `chain.ts:641-743` builds the round's and the seal's prompts. The bundle's `agents/proofer.md` and `agents/sealer.md` are read by both launches, the daemon's role session and a pane's subagent, so their text states both cases. `test/role-session.test.ts` already runs the real CLI against a stand-in model at no cost, which is where the system's refusal is shown.

Constraints the build meets:

- Claude Code's macOS sandbox is `sandbox-exec` underneath (`frame/design.md` *Grounding*, the row on the OS mechanism), and a `sandbox-exec` cannot start inside another (the same *Grounding*, the probe's row: `sandbox_apply: Operation not permitted`, exit 71). So the daemon cannot both wrap `claude` and let Claude Code sandbox its commands.
- A commit in a linked worktree writes the repository's git common dir (the commit probe's row), so the crafter's place is two folders.
- `filesystem.denyWrite` takes precedence over `allowWrite`, so the scratch folder must sit under no refused folder. The run folder is refused nothing, and its other files stay unwritable because no allowed place holds them.
- `--add-dir` takes every argument after it as a folder (`claude.ts:100`), so the scratch folder joins the end.
- The scratch folder's path is the daemon's to know only when it makes the session, after the chain built the prompt, so the daemon appends the paragraph that names it, and the chain's prompts say nothing of a path.

The failure scenario of the chosen approach, six months on: a Claude Code release changes what its sandbox writes by default, for example lets every `--add-dir` folder be written, or renames a key, and the `--settings` value no longer bounds what it bounded. The deny entries of *Scope* item 4 keep the worktree and the bundle refused whatever the default, and `failIfUnavailable` keeps a session that cannot sandbox from starting. A renamed key is the case nothing catches at launch: Claude Code ignores a key it does not know. The three `role:refusal` scripts are what catches it, run when `MIN_CLAUDE_VERSION` moves or the launch changes.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Claude Code's own sandbox, turned on in the `--settings` value the launch passes, with the places per role as `allowWrite` and `denyWrite` | A release changes a default or a key's name (*Technical context*, the failure scenario). Claude Code writes the profile, so Owlery cannot read the exact rules applied; the runs of `role:refusal` are its evidence | Chosen. It is `sandbox-exec` on macOS, the mechanism the issue names, with the profile written by the tool that already wraps each command; it adds the built-in protections of `.git/hooks`, `.git/config` and shell rc files; it holds `dangerouslyDisableSandbox` shut (`allowUnsandboxedCommands: false`); it rides on an option the launch already owns, so nothing of the person's is read or written |
| The daemon runs `claude` itself under `sandbox-exec` with a profile of Owlery's | The profile must let the CLI write its own state: the config folder with `settings.json`, the conversations, `~/.claude.json`. Every command inherits the profile, so a command could then write the person's `settings.json` and plant a hook in every later session. Claude Code's own sandbox cannot start inside it (`sandbox_apply: Operation not permitted`, probed) | Rejected: the hole is the person's settings, which `docs/roadmap.md` row 1 requires unchanged |
| `CLAUDE_CODE_SHELL_PREFIX` naming an Owlery script that runs each command under `sandbox-exec -f <profile of the role>` | Owlery owns a Seatbelt profile whose language Apple does not document, and keeps it working against how Claude Code applies a prefix to a compound command and its environment, which the 2.1.332 binary names as a cause of commands it refuses to run (`frame/design.md` *Grounding*, the strings row). Claude Code's own sandbox would then have to stay off | Rejected: the same `sandbox-exec`, with more of it Owlery's to keep |
| Replace the daemon's answer to commands by the sandbox: `autoAllowBashIfSandboxed: true`, and drop `runs` from the grants | The orchestrator at a judgment, which needs no command, would run commands unasked; the daemon's refusal and its `refusals` record of commands would go; Claude Code's own ask rules would decide what reaches the daemon. `docs/roadmap.md` row 1 says Owlery never turns a permission check off | Rejected. The structure kept is `RoleGrant.runs` with `verdictOn`'s `run` branch. The premise that keeps it, checked: the orchestrator's grant answers `runs: false` (`role-grants.ts:35`), so the branch still decides a role's commands after the lift |
| Keep #39's rule and sandbox the crafter alone | The issue's second and third *Done when* are not met: a round stays read-only and a proofer clones nothing | Rejected |
| The scratch folder inside the worktree, such as `.owlery/scratch/` | Writes land in the tree the role judges; `git status` shows them; a proofer's write there is a write to the worktree, which its bound refuses | Rejected |
| The scratch folder under the system's temporary folder, `$TMPDIR/owlery-scratch-*` | A folder outside the daemon's run folder outlives a daemon that ended before it removed it, and nothing finds it again | Rejected where a run folder exists; kept as the fallback of a daemon that has none, the tests' |
| Commands reach the hosts a package manager and GitHub need | The crafter could install a package or call `gh`; so could a proofer, whose prompt is shaped by the branch it reviews, and a read file could leave the machine. Which hosts a role reaches is a product choice | Not taken here: `frame/questions.md` Q1, default no host but the loopback, and an issue for the allowlist |
| Prompting for each host, Claude Code's default network handling | What a headless session does with a host it would ask about is not read, and no probe of the frame could show it without a session | Rejected: `strictAllowlist: true` refuses a host with no request, which leaves no unread behaviour |
| The grant's `writes` field names the commands' place as well | `writes` answers the file tools: `nowhere` for a proofer, whose commands now write in the scratch folder. One field cannot hold both | Rejected: a field `commands` of its own |
| A feature `command-sandbox` in the adapter's list, which the daemon requires before it launches a role | It catches nothing today: the Claude adapter is the one real adapter and always sandboxes. The bound is carried by `start`'s options and its documented contract | Rejected: the contract of *Scope* item 6 instead |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 6 | `frame/design.md` *User scenarios* rows 1 to 5, as cases in `test/claude-adapter.test.ts`, `test/daemon.test.ts` and `test/fake-adapter.test.ts`, run narrow by the crafter with `node scripts/test-in-electron.mjs <those files>` in `apps/desktop`, as the `role:run` script passes a file, each new case seen red | `bab4c40f` |
| 2 | *Scope* items 7 and 8 | Rows 6 to 8, as cases in `test/chain.test.ts`, `test/role-bundle.test.ts` and `test/claude-adapter.test.ts`, run narrow; and row 8's `git grep`, whose expected output that row states | |
| 3 | *Scope* item 9 | Rows 9 to 11: `pnpm --filter @owlery/desktop run role:refusal`, `role:refusal:sealer` and `role:refusal:crafter`, each run once at the phase's close against the stand-in model, their printed JSON read into `trail/phases/phase-3.md`, and `frame/questions.md` Q3, Q4 and Q5 answered from it | |

Phase 3 spends no usage: the CLI talks to the stand-in on the loopback with a key that is no key. It is the one place the system's refusal is shown, and it needs `pnpm run build`'s bundle, which `buildApp` makes. The broad gate is the orchestrator's after the rounds (contract rule 2).

## Overlap with the release

Read: each branch's diff against `origin/release/v0.0.5` at its head after `git fetch` on 2026-11-26 (executed, `git diff --name-only origin/release/v0.0.5...origin/<branch>`), and the hunks of `daemon.ts` and `docs/architecture.md` where both change them. #257's branch holds only its `routing.md`, so its frame was not read; its issue names `apps/desktop/src/daemon/repositories.ts`, which this work does not change. #213 and #215 change the renderer, `docs/design.md` and their tests, and no file of this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #223 | `apps/desktop/src/daemon/daemon.ts` (its hunks at 528, 2066, 2626 and 2946 at the base; this work's are `beginHeadless` and `startHeadless`, 2342-2470) and `apps/desktop/test/daemon.test.ts` | #223 | Release 0.0.5's, already past phase 1, and smaller; the files meet at no hunk, so this work's rebase is mechanical |
| #133 | `daemon.ts` (its hunk at 98 sits beside the import of `verdictOn`; its others at 358, 592, 931-1793, 2837 and 4426-4557) and `daemon.test.ts` | #133 | Release 0.0.5's, past two rounds; no hunk meets `beginHeadless` or `startHeadless` |
| #216 | `daemon.ts` and `daemon.test.ts` | #216 | Release 0.0.5's, past two rounds; it adds a request the window sends and does not touch a role session's launch |
| #132 | `daemon.ts` and `daemon.test.ts` | #132 | Past round 1 and of the same milestone; it changes the records' place and the seal check's pin, and not a role session's launch |
| #278 | `docs/architecture.md` and `docs/architecture.ko.md`, which #278 edits in place as a work item whose subject is the policy root | #278 | Docs alone, past two rounds. It changes the *Agent adapters* opening paragraph and others, and none of the sentences this work's `## Rule changes` quote; it renames no heading this work names (executed: its diff holds no heading line), so nothing of this design is re-pointed |

## Operational impact

- No migration, no new dependency, no environment variable. The run folder gains `scratch/`, which the daemon makes and empties.
- A role session now fails to start where Claude Code's sandbox cannot start (`failIfUnavailable: true`). On macOS that is a Claude Code too old for the keys or a broken install, and the adapter already shows the CLI's error output for a failed launch.
- A crafter's commands reach no host but the loopback: a fix pass that needs to install a package or call `gh` is refused by the system and says so in its report (`frame/questions.md` Q1).
- No version move: the release's version is the release branch's to set.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
