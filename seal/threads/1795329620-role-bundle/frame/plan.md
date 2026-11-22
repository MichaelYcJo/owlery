# Implementation Plan: 1795329620-role-bundle

## Technical context

The tree as read at `ce17009`, and the branch of #26 at `7374426`.

`apps/desktop`. This work builds on the headless adapter as #26 leaves it, so every coordinate below is on #26's branch. The adapter interface is `src/daemon/adapters/adapter.ts` (`RoleEvent`, `RoleRun`, `RoleAdapter.start` at line 31). The Claude adapter is `src/daemon/adapters/claude.ts`: `claudeArgs` (35-55), `claudeEnv` (63-71), the lookup through the login shell (79-100, 154-165), `eventsForLine` (118-143), and `claudeAdapter` (150-237), which spawns the CLI at line 178 and reads its lines at 190-193. The fake adapter is `src/daemon/adapters/fake.ts`. The daemon's headless sessions are in `src/daemon/daemon.ts`: `DaemonOptions` (84-125), `greet` (310-321), the `ask` case (688-709), `stopHeadless` (905-912) and `startHeadless` (915-957). `src/daemon/main.ts` builds the adapter at line 52 and knows its own script as `process.argv[1]` (line 27). The protocol is `src/shared/protocol.ts` (`HeadlessInfo` at 210-226, `ask` at 304, `ready` at 316). The window's status line is `showStatus` in `src/renderer/sidebar.ts`, which reads `held.daemonNotice` (`src/renderer/shared.ts`), and its sentence comes from a function of `src/renderer/view.ts`, as `daemonNotice` does (line 166). `build.mjs` copies the files `dist/` needs beside the four scripts it bundles. `src/daemon/whole-file.ts` writes a file a reader must never find half-written.

The cases are `test/claude-adapter.test.ts` (script CLIs found through a script `SHELL`), `test/daemon.test.ts` and `test/fake-adapter.test.ts` (the fake adapter) and `test/view.test.ts`. A test file that imports `buildApp` from `test/built-app.ts` runs in the `app` project of `vitest.config.ts`, one file at a time, after the rest. A case that needs a person's machine or usage is gated on an environment variable and has a package script, as `test/memory.test.ts` and `korean:typed` are.

The source of the bundle is AgenticSeal at the tag `v0.38.4`, commit `0eca6e7`, which the installed copy `/Users/yc/.claude/plugins/cache/agenticseal/agentic/0.38.4` equals (`frame/design.md` *Grounding*). The build copies from either.

**The failure scenario of the chosen approach.** In six months the bundle's texts still tell a role to run a command the bundle does not hold, because a stage's issue rewrote the steps it built and left the rest. A role then reports the missing command at each such step, as the head tells it to, and the report is the signal: nothing is worked around in silence. The second failure: a release of Claude Code that drops `agents` from the `init` line, or renames a plugin's agent. Every role launch then fails with the text of `frame/design.md` *Scope* item 9, loudly and before any verdict, and the adapter's one check is the place to change. The third: a release whose `--version` prints no three numbers. The notice is then never raised, and an old CLI fails at its first launch with the CLI's own error on the error stream. The fourth: the login shell the daemon asks at its start takes seconds, and each start of the built app in the suite now starts one more (Q6).

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Take a named set of AgenticSeal's files as they are, with a closed list of changes the launch forces (chosen) | Sentences that name a script or the orchestrator stay untrue for Owlery until the stage's issue rewrites them | Chosen: the difference from the source is a short list a reviewer can read against the tag, and a later release is carried over file by file. The premise is that no stage runs for real before its own issue, which holds: #41, #42 and #43 build the stages |
| Rewrite the definitions and the skills for Owlery now | The rewrite guesses the mechanisms #40 to #43 have not designed: who writes a round record, what replaces `chain_check`, when the pull request body is composed. Each guess is rewritten again by the issue that builds the mechanism, and a review of about 150 KB of new rule text has no run to hold it against | Rejected. `docs/architecture.md` *What we take from AgenticSeal* leaves the scripts undecided, and #40 decides them |
| Take the whole plugin, scripts and `lib/` among it | The app then needs `python3` on the person's Mac, and ships the hooks and the stamp it must not hold | Rejected: it decides #40's question by default |
| Start from 0.38.2, the copy the spawn named | The bundle's first carry-over would be due on the day it ships | Rejected for 0.38.4, the latest release, whose core and `implement` skill already state the batch's scope |
| Append the head, the core, the contract and the documents a role opens first; the rest is read in the bundle's folder (chosen) | A session that cannot read the bundle's folder misses the forms and the templates (Q4) | Chosen. `docs/architecture.md` *What each session loads* has the rules appended, and its test of 2026-11-17 found that a session does not read rules it was only pointed at. The documents a later step opens are named by that step |
| Append every document a stage cites | A crafter's fix pass would carry about 100 KB on every launch, most of it the Korean half of the writing rules and a form it reads two paragraphs of | Rejected: `docs/architecture.md` *State lives in three places* counts every byte an agent reads |
| Append the core and the contract alone | The method a role follows from its first step arrives only if the session opens it, which the test of 2026-11-17 says it may not | Rejected for the documents of step 1 |
| Keep the taken files at their paths under `skills/`, where Claude Code lists them as the plugin's skills (keeps the structure) | The session's skill list holds entries the appended file already gave it, and a role may call one and read it twice | Kept: the premise is that every citation in the texts names these paths, checked by the probe that followed them. A list entry costs one description |
| Move the rule files to a folder Claude Code does not read as skills | Every `skills/…` citation in the taken texts turns false, and each is a change against the source | Rejected for the premise above |
| One `RoleAdapter.start` with an optional role (keeps the structure) | A caller forgets the role and gets a plain session where it meant a proofer | Kept: the premise is that the daemon's handling of a run, the limit, the stop and the bound of #26, is the same for both, checked in `startHeadless`. #41's callers pass a `RoleStage` typed value |
| A second method `startRole` on the adapter | Two entry points whose event handling must stay the same, in two adapters | Rejected for the premise above |
| `ask` carries the role over the protocol (chosen) | A client can launch any role on any work item | Chosen: the daemon writes no record from a session, so a stray role session changes nothing, and the suite and the one real run need an entry before #41 adds its own. #41 may narrow it |
| A daemon method no message reaches | The suite's cases, which drive the daemon over its socket, and the real run would each need a second way in | Rejected |
| The table of each stage's documents in the adapter's code (chosen) | A bundle file renamed without the table is found only by the case that reads both | Chosen: the case of scenario 1 holds every name the table carries against the bundle |
| A manifest file in the bundle that the adapter parses | A file format to read, refuse and keep in step with the type `RoleStage` | Rejected |
| Read the version at the daemon's start, and again at a hello while a notice stands (chosen) | The login shell runs at every daemon start (Q6) | Chosen: the issue asks for the start, and the daemon outlives the app for days, so a notice read once would stay after the person updated |
| Read the version at each launch only | A person learns of an old CLI only when a chain already failed, while away | Rejected |
| Refuse a launch below the minimum | The minimum is the oldest version checked, not the oldest that works, so a working CLI would be refused | Rejected. The notice tells, and the CLI's own error says what failed |
| 2.1.326 as the minimum (chosen) | An option changed between 2.1.326 and the version a person runs | Chosen: it is the version `docs/architecture.md` confirmed the options and the detachment at. 2.1.330, the one probed today, would tell a person on a checked version to update |
| A `version` in the bundle's manifest | A second number to keep equal to the app's | Rejected: the bundle ships inside the app, and the validator accepts a manifest without one |
| The real role session as a gated case (chosen) | Nobody runs it again, and a later CLI changes what a role launch does | Chosen: the suite cannot spend the owner's usage, and the runner has no `claude`. The fixture of the run's lines keeps the `init` line's shape in the suite |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 10 and 13, with their parts of *Data & interfaces* | Scenarios 1 to 8 as cases, each seen red before its code. Scenario 12, by the one run of `role:run` under Q1's default, its result in the phase record. The comparison of scenario 2 with the tag, made by the builder and named in the phase record | |
| 2 | *Scope* items 11 and 12, with their parts of *Data & interfaces* | Scenarios 9 to 11 as cases, each seen red before its code, and the one drive of the built app that reads the status line | |

## Overlap with the release

The spawn names #26 as the work this builds on, and #39 to #43 as the issues the bundle serves. None of #39 to #43 has a branch or a frame yet, so each row reads the issue's text. The spawn also names the worktrees of #121 and #117. #121 edits `docs/` in its own pull request and names none of the sections `frame/design.md` *Rule changes* names, and this work's pull request does not touch `docs/`. #117 changes two built-app cases and the retry of `vitest.config.ts`, and this work adds test files of its own and changes neither. Neither meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #26, `1795268972-headless-failure-and-limit` | `apps/desktop/src/daemon/adapters/adapter.ts`, `claude.ts` and `fake.ts`, `src/daemon/daemon.ts` (`startHeadless`, the `ask` case), `src/shared/protocol.ts` (`HeadlessInfo`), and the three test files of the adapters and the daemon | #26 | Its guarantee is being written, so it is the likelier to be sealed first. This work's check of the `init` line stops the CLI through `RoleRun.stop`, and its failed launches are told through `errorOutput`, both of which #26 adds. The build of this work starts from a branch that holds #26, merged from `release/v0.0.2` once #26 is there |
| #39, tools and permission requests per role | `claudeArgs` and `RoleAdapter.start` in the same two files, and the adapter's events | #38 | #39's issue says it depends on #38. It sets tools through the `role` this work adds to `start`, and it reads that the bundle's folder is among the session's folders |
| #40, connecting a repository | No file. #40 decides whether AgenticSeal's scripts are taken or rewritten, and the bundle's sentences that name a script read that decision | #38 | The bundle ships no script either way, so this work does not wait for the decision, and #40 changes the sentences once it has made it |
| #41, review rounds and fix passes | `apps/desktop/role-bundle/agents/proofer.md` and `crafter.md`, the documents of their stages, `ROLE_STAGES`, and `startHeadless` | #38 | #41 depends on #39 and #40, and it rewrites the two roles' texts for the records the daemon commits. It needs the bundle and the launch to exist |
| #42, the gate and the sealer | `apps/desktop/role-bundle/agents/sealer.md` and `docs/forms/the-guarantee.md` of the bundle | #38 | #42 depends on #41 |
| #43, the pull request and the seal check | The sealer's step that checks the pull request body, in `apps/desktop/role-bundle/agents/sealer.md` | #38 | #43 depends on #42 |

## Operational impact

No dependency is added. One environment variable is new, `OWLERY_ROLE_RUN`, read by one test file alone. The built app gains the folder `dist/bundle/`, and the daemon's run folder gains `roles/`. The protocol gains `role` on `ask` and on `HeadlessInfo`, `agentNotice` on `ready`, and the message `agentNotice`. A window of this build reads a `ready` without `agentNotice` as no notice, and the status line already names a daemon of another build. Each daemon start now runs the person's login shell once, in the background, and the CLI with `--version`. A role session adds an entry to Claude Code's own `~/.claude.json` (`frame/design.md` *Grounding*, Q2). The version does not move: `apps/desktop/package.json` reads `0.0.2` since #30.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
