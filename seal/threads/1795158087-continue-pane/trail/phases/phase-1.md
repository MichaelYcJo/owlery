# Phase 1: 1795158087-continue-pane

## What this phase found

Measured on 2026-11-20, between 16:14 and 16:20 KST, with `claude --version` printing `2.1.329 (Claude Code)`, on macOS. Every claim below is `executed` unless it says `read`. The phase's scratch is `<scratchpad>/1795158087-continue-pane/phase-1/`, called `$S` below. It holds each run's raw terminal bytes, its rendered screen and its exit code under `runs/`, and the hook events in `hook-events.jsonl`.

**The frame holds.** `read` at `d304ccc`: `claudePaneCommand` stands at `apps/desktop/src/daemon/hooks.ts:83-86` and `commandFor` at `apps/desktop/src/daemon/main.ts:48-51`, as `frame/plan.md` *Technical context* says. This phase builds on nothing else of the frame's account of the tree.

**The four answers.**

| Question | Answer | Against the row's default |
|---|---|---|
| Q1 | An interactive `claude --continue` opens the latest conversation of its own worktree and not the other's. | The default holds. |
| Q2 | Where the worktree holds no conversation, it prints the one line `No conversation found to continue` and ends with exit code 1. | The default holds. *Scope* item 6 builds nothing. |
| Q3 | It does not open a `-p` session written after the conversation. Where a `-p` session is the only one in the worktree, it prints `No conversation found to continue` and ends with exit code 1. | *Scope* item 7 builds nothing. |
| Q4 | The hooks of `--settings <file>` arrive from a continued session. `SessionStart` carries `source: "resume"` and the continued conversation's own `session_id`. | The default holds. |

No answer returns to the framer.

**How the runs were set up.** `$S/repo` is a temporary repository with one empty commit and four linked worktrees, `$S/wt-a` to `$S/wt-d`. The frame asks for two. The third and fourth were added so that a worktree with no conversation exists beside the two that hold one. Each interactive run was started as `commandFor` starts a pane: `/bin/zsh -l -i -c "exec claude --settings '$S/hooks/claude-hooks.json' ..."` in a pseudo-terminal of 120 columns and 50 rows, with the worktree as its working directory and `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET` in its environment. The rest of the environment was `HOME`, `USER`, `LOGNAME`, `SHELL`, `TERM`, `COLORTERM`, `LANG` and a `PATH` of the four system folders, so no variable of the session that ran the probe reached the CLI. The settings file was written by the repository's own `writeHookSettings`, and the socket was served by the repository's own `HookServer`, both bundled from `apps/desktop/src/daemon/hooks.ts` into `$S/hooks-built.mjs` with the package's `esbuild`. The CLI ran logged in, with the owner's own configuration, which shows `auto mode on` in its status line. No run passed a flag that skips permissions.

**The runs, in order.** The number of each run is also its `OWLERY_PANE_ID`.

| Run | Folder | Command after `exec`, or what ran | What was seen | Exit |
|---|---|---|---|---|
| 1 | `wt-a` | `claude --settings '<file>' --model haiku` | The question "Is this a project you created or one you trust?" with `No, exit` selected. After `Yes, I trust this folder`, the prompt `say alpha` was answered `alpha`. Session `d80b3162`. Ended with `/exit`. | 0 |
| 2 | `wt-b` | the same | No trust question. `say bravo` was answered `브라보! 👏`. Session `b665b3c3`. Ended with `/exit`. | 0 |
| 3 | `wt-a` | `claude --settings '<file>' --continue` | The screen opened on `❯ say alpha` and `⏺ alpha`, and the status line named `d80b3162`. The prompt `say again` was answered `alpha`. Ended with `/exit`. | 0 |
| 4 | `wt-b` | the same | The screen opened on `❯ say bravo` and `⏺ 브라보! 👏`, and the status line named `b665b3c3`. No prompt. Ended with `/exit`. | 0 |
| 5 | `wt-c`, never opened | the same | `No conversation found to continue`, in red, and the process ended. No trust question. | 1 |
| 6 | `wt-d` | `claude --settings '<file>' --model haiku` | A new session, `3dacb003`. No prompt. Ended with `/exit`. | 0 |
| 7 | `wt-d` | `claude --settings '<file>' --continue` | `No conversation found to continue`, and the process ended. | 1 |
| 8 | `wt-b` | `claude` with the arguments of `claudeArgs` and the environment of `claudeEnv` (`apps/desktop/src/daemon/adapters/claude.ts:17-52`), plus `--model haiku`, with the one line of `promptLine("say papa")` on its input | The result `Papa`. Session `3ff1b10b`. | 0 |
| 9 | `wt-b` | `claude --settings '<file>' --continue` | The screen opened on `❯ say bravo` and `⏺ 브라보! 👏`, and the status line named `b665b3c3`. Nothing of run 8 was shown. Ended with `/exit`. | 0 |
| 10 | `wt-c` | the same as run 8, with `say kilo` | A result. Session `2ff45212`. | 0 |
| 11 | `wt-c` | `claude --settings '<file>' --continue` | `No conversation found to continue`, and the process ended. | 1 |

Runs 1, 2, 3, 8 and 10 each spent one short turn of the owner's account on Haiku. The other runs sent no prompt.

**Q1 was measured so that a wrong answer would show.** Before run 3, `wt-b`'s conversation was the newer of the two, and `~/.claude.json` named it as `lastSessionId`. Run 3 still opened `wt-a`'s. Before run 4, `wt-a`'s was the newer, after run 3's prompt, and run 4 opened `wt-b`'s. A continued session writes into the file of the conversation it continues: run 3 left one file in `wt-a`'s folder, grown from 533,597 to 553,294 bytes, under the same session id.

**Q2's line reaches the pane, and nothing reaches the daemon.** The 186 bytes run 5 wrote are the line, a carriage return and a line feed, and sequences that set the terminal back. Runs 5, 7 and 11 sent no hook event: no `SessionStart` arrives from a `--continue` that finds no conversation. The daemon learns of such a pane only through its exit, which is the path `frame/design.md` *Scope* item 6 names. A session that was opened and closed without a prompt leaves no conversation: run 6 wrote no folder for `wt-d`, and run 7 found none.

**Q3's ground is the kind of the log.** Run 8's file in `wt-b`'s folder was written at 16:18, after the conversation's file at 16:17, and each of its lines is marked `"entrypoint":"sdk-cli"`. Each line of the conversation's file is marked `"entrypoint":"cli"`. Run 9 opened the conversation. Run 11 shows the same from the other side: with one `sdk-cli` log in the folder and nothing else, `--continue` found no conversation. `read`: the mark is the only difference this phase saw between the two kinds of file, and Owlery reads neither, so the design rests on the behaviour and not on the mark.

**Q4's events.** The listener wrote, for each event, its name, its `source`, its `session_id` and the names of its fields.

| Run | Events that arrived, in order |
|---|---|
| 1 | `SessionStart` with `source: "startup"`, `UserPromptSubmit`, `Stop` |
| 2 | `SessionStart` with `source: "startup"`, `UserPromptSubmit`, `Stop` |
| 3 | `SessionStart` with `source: "resume"` and session `d80b3162`, `UserPromptSubmit`, `Stop` |
| 4 | `SessionStart` with `source: "resume"` and session `b665b3c3` |
| 6 | `SessionStart` with `source: "startup"` |
| 9 | `SessionStart` with `source: "resume"` and session `b665b3c3` |

No prompt of these runs used a tool or asked permission, so no `PreToolUse`, `PostToolUse`, `PermissionRequest` or `Notification` was seen from a continued session. They are set by the same file that delivered the three events above.

**Trust is asked once for the repository, and its record is the main checkout's.** This is outside the four questions and bears on what a pane shows. Run 1 asked the trust question in `wt-a`. No later run asked it, in `wt-b`, `wt-c` or `wt-d`. `~/.claude.json` gained one entry under `projects`, keyed by `$S/repo`, the main checkout, where no run took place. It held `hasTrustDialogAccepted: true` and a `lastSessionId` that followed the latest session of any worktree. Conversations are kept per worktree all the same: `~/.claude/projects/` gained one folder for each of `wt-a`, `wt-b` and `wt-c`, and one for `repo` that held an empty `memory` folder. The failure scenario of `frame/plan.md` *Technical context*, one list for every worktree of a repository, is therefore one field away in the CLI's own state, and this version's `--continue` does not read that field.

**What the runs left, and what was removed.** The SHA-256 of the two settings files was taken before the first run and after the cleanup, and both pairs are equal.

| File | Before | After |
|---|---|---|
| `~/.claude/settings.json` | `f77bd55e8bc2ede747e54efe8f29cfec2b601c2eb64e704c9ed7826094914809` | `f77bd55e8bc2ede747e54efe8f29cfec2b601c2eb64e704c9ed7826094914809` |
| `~/.claude/settings.local.json` | `a4cc84a862d481d44d58d693695cfe705d8c073ad04ed406ff3afe3ddf6f2114` | `a4cc84a862d481d44d58d693695cfe705d8c073ad04ed406ff3afe3ddf6f2114` |

Removed, under the owner's permission of 2026-11-20:

- Four folders of `~/.claude/projects/`, each named after `$S` with `-repo`, `-wt-a`, `-wt-b` or `-wt-c` at its end. They held an empty `memory` folder, the file of session `d80b3162`, the files of sessions `b665b3c3` and `3ff1b10b`, and the file of session `2ff45212`. The list of `~/.claude/projects/` after the removal is equal to the list taken before the first run (`diff` exit 0).
- One entry of `~/.claude.json`, the key `$S/repo` under `projects`. The file was read, the key deleted, the result written to `~/.claude.json.tmp-continue-pane` with the original's mode, parsed again, and renamed over the original after a check that the original had not changed since the read. Afterwards the file parses, holds the 146 keys under `projects` that it held before the first run, and holds the same top-level keys.

Left in place, because the permission names the two places above and no other file of `~/.claude/`:

- Nine lines of `~/.claude/history.jsonl` that name `$S`: the three prompts and six `/exit`.
- Three folders of `~/.claude/session-env/`, named `d80b3162-abeb-4bff-b404-7fdde73d82a1`, `b665b3c3-8b3c-4da2-8597-365e6547b7d0` and `3dacb003-1ef3-42df-8cc3-6573d61fce4f`.
- Four files of `~/.claude/backups/` that the CLI wrote during the runs and that hold the removed key: `.claude.json.backup.1795158979214`, `.claude.json.backup.1795159041888`, `.claude.json.backup.1795159107705` and `.claude.json.backup.1795159171365`.

The temporary repository, its worktrees and the run files stay under `$S`. The hook listener, the only process left running between runs, was stopped by its recorded PID.

**Decisions of this phase.**

- New sessions and the two headless runs carried `--model haiku`. The grounds are the owner's permission, which asks for a cheap model where the CLI takes a flag. The continuing runs carried no flag beyond the pane's own command with `--continue`, so runs 3, 4, 5, 7, 9 and 11 are the command `frame/design.md` *Scope* item 4 states.
- The headless runs used the adapter's own arguments and environment and not a bare `claude -p`. The grounds are Q3's own words, "as Ask runs one": `--setting-sources ""` and the `--settings` JSON could have changed where the log is written or how it is marked.
- Run 10 and run 11 were added to Q3. The question asks about a `-p` session after a conversation. A person who uses "Ask" before any conversation and then presses the continuing button meets the other case, and one more short turn answered it.
- `frame/plan.md` *Phases*, row 1, has each answer written into `frame/questions.md` by the party that measured. The crafter's definition lets it write the Status cell of `frame/plan.md` and no other line of the frame. The answers are in the table at the head of this record and in the hand-back, for the orchestrator to fold into `frame/questions.md`. Judged against the plugin's `agents/crafter.md` *Job*.
- The probe is three files under `$S`, `drive.py`, `hook-listener.mjs` and `send.sh`, and none is named `test_tmp_*`. A terminal that a second process types into, and a listener that outlives one run, did not fit one file run once. Each stays under the scratch, and nothing of them stands in the worktree.
- The rendered screen of runs 5, 7 and 11 shows a `u` on the line after the message. It is the renderer of the probe, `pyte`, printing the last byte of the sequence `ESC [ < u`, which the CLI sends as it ends. The raw bytes hold no printed `u`. What the app's terminal draws for that sequence was not seen (`gaps.md`).
- The phase ran no case. It changes no file under `apps/`, the plan's row names no case, and no test file reads `seal/` (`git grep -l -e 'seal/' -- 'apps/**/test/*' '*.test.ts'` printed nothing).
