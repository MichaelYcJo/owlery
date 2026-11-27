# Review round 4: 1795701355-127-role-sessions-run-in-a-sandbox

```seal
target: 8ad9538c, fixes 14187e21..8ad9538c
```

This is a verifying round. It answers the two findings round 3 closed and reviews the range `14187e21..8ad9538c`. The branch's own commits in that range are `769cb20e`, which changes a comment of `claude.ts`, `9dd71aba`, the close of finding 1, `0780cfcd`, the framer's fold of the frame, and `1fb75ef6`, the close of finding 2 with one new row of `frame/plan.md` *Judgments of the run* (executed, `git log --no-merges 14187e21..8ad9538c ^origin/release/v0.1.0`). The range ends in the merge `8ad9538c` of `origin/release/v0.1.0` at `06222134`. The code the round reviewed is those four commits and the merge's resolution, which `git show 8ad9538c` prints as two hunks: the import lines of `daemon.ts`, where the branch's `grantOf` and the release's `refusedAt` both stand, and `apps/desktop/test/view.test.ts` *statusNotice*. What the merge brought in was not reviewed. The round read `routing.md`, the three frame files, `gaps.md`, `changelog.md` and every phase record whole at `8ad9538c`. No `pr.md` stands. The runs below were made in the round's own `git clone --no-local` of the branch at `8ad9538c`, under the round's scratch directory, with the worktree's installed dependencies linked in and nothing installed, through the session's lock, against the stand-in model.

The caller's account of the merge was checked against the tree. The merge brought in `450c6e09` (#311), `b5444f57` (#315), `fbd20166` (#312) and `06222134` (#316). The caller's list also names #308, but `7c6cba4a` (#308) is the merge base, and the branch took it at `559ee2de`, before round 1 (executed, `git merge-base 1fb75ef6 06222134` and `git log --merges --first-parent 1fb75ef6`). The resolution of `view.test.ts` is as the caller says: the release's `STORE` notice and its four-argument cases of `statusNotice`, with this branch's `AGENT` sentence naming 2.1.329.

Carried from rounds 1 to 3, not established again: where the launch, the grants and the daemon's rule stand (`claude.ts#claudeArgs`, `#launchOf`, `#claudeAdapter`, `role-grants.ts#verdictOn`, `daemon.ts#commandsOf`). Also carried is round 1's check that each `from:` of `## Rule changes` stands once in its file. Neither the branch's commits nor the merge change `docs/architecture.md` or its Korean edition (executed, `git diff --name-only 1fb75ef6 8ad9538c -- docs/architecture.md docs/architecture.ko.md` printed nothing), and the fold changed no `from:`, `file:` or `section:` line. Round 3's probe of what the `shell-snapshots` entry gives back is carried from its *Probes* row, since the range changes no code but a comment. Every verdict below was reached at this target.

The fold closes round 3's finding 2 at every place it named. The fix of finding 1 holds in the code's comment and in each frame line the fold rewrote. One row it named, the orchestrator's row at `frame/plan.md:110`, still says the entry leaves the login refused, which is finding 1. The work's cases and claims hold beside #257's store notice, #312's pin and #308's descriptor fix in the merged tree, as *Confirmations* states.

## Findings

### 1. A row of the run's judgments still says the `shell-snapshots` entry leaves the login refused, and the correction stands as a second row the settle groups apart

```seal
severity: should
location: `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:110`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:113`
evidence: executed `git grep -n -o -i -E ".{0,80}(login|sign-in|credential|키체인|로그인).{0,60}" 8ad9538c -- seal/threads/1795701355-127-role-sessions-run-in-a-sandbox ':!*/trail/rounds/*' apps/desktop/src/daemon/adapters/claude.ts`; executed `git grep -n -o -i -E ".{0,100}(added account|더한 계정|계정을 더할).{0,80}" 8ad9538c -- seal/threads/1795701355-127-role-sessions-run-in-a-sandbox ':!*/trail/rounds/*' apps/desktop/src apps/desktop/test`; read `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:110`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:113`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/trail/rounds/round-3.md`, the plugin's `skills/implement/orchestration.md` and `skills/settle/scripts/settle.py#judgments`
reopens: round-3#1
```

Why it matters: round 3's finding 1 named `frame/plan.md:110` among its places, and its paste-ready text rewrote that row's "the entry leaves the login refused". Its close, `fixed 769cb20e`, left the frame lines to the framer to fold "as the paste-ready text gives them". The framer writes no row of *Judgments of the run* (the plugin's `skills/implement/fold-and-reframe.md`), so the fold `0780cfcd` could not reach the row. Then `1fb75ef6` added a row at `:113` and left `:110` as it was. Finding 2's close says so: "The dated row at `frame/plan.md:110` stays, and a new *Judgments of the run* row corrects it." The close of finding 1 holds at `claude.ts:546-547` and at each frame line the fold rewrote. It does not hold at `:110`.

Row `:110` states what the entry does: "the entry leaves the login refused". The policy keeps the login in the Keychain on macOS and in no file of the folder (`docs/architecture.md` *Agent adapters*, **The daemon keeps the accounts**), and the row at `:113`, the code's comment and *Scope* item 4 now say so. Row `:110` also opens "An added account's session is given back the read", the wording of round 3's finding 2, where the fold now writes a session whose config folder stands in the run folder. So the row states what the target contradicts.

A row beside it does not correct it for the readers of the section. `seal settle`'s dry run lists every row of *Judgments of the run* grouped by its `Judged against` cell exactly as written (`skills/settle/scripts/settle.py#judgments`). Row `:110` is judged against "`frame/plan.md` *Alternatives considered*, the three rows on `shell-snapshots`" and row `:113` against "`docs/architecture.md` *Agent adapters*, the paragraphs on accounts; …", so the dry run prints them in two groups, and row `:110` there carries its grounds with nothing beside it. Row `:113` names the row it corrects as "the row on the `shell-snapshots` entry", which also fits the *Alternatives considered* row at `:52`. The plugin's orchestration rule has the orchestrator correct its own row where the framer names a defect in it (`skills/implement/orchestration.md`, the paragraph before **A decision the framer rejects stands as its judgment**), which is a correction made in the row and not beside it, and contract rule 19 says a correction written beside the sentence it corrects leaves both for the next reader to choose between.

The first search printed `:110` and no other sentence of the work item's records, outside the round records, that says the entry or the refused read keeps a login. Round 3's close block quotes the old text and stays. The second search printed `:110` as the one place where a judgment or a claim still speaks of every added account's session. The searches are a sample of spellings: a statement of the same fact in other words escapes them.

```text
frame/plan.md:110, rewritten in place:
| 2026-11-27 | A session whose config folder stands in the run folder, as the one Owlery makes for an added account does, is given back the read of its config folder's `shell-snapshots` alone, and the account folders do not move | The refused read failed the snapshot's `source` without an error, so aliases and functions were lost (`PATH` kept); the entry leaves the rest of the config folder refused, its `.claude.json` among it. `e3f86d0d`, `44ff11f8` | `frame/plan.md` *Alternatives considered*, the three rows on `shell-snapshots` |

frame/plan.md:113, the Judgment cell's first clause, "Round 3's findings 1 and 2 correct the row on the `shell-snapshots` entry:" becomes:
Round 3's findings 1 and 2 correct the row above on the read of `shell-snapshots`, rewritten in place:
```

```seal
verdict: fixed c20768b5
answer: The orchestrator rewrote its own row at `frame/plan.md:110` in place with the round's text, so it names a session whose config folder stands in the run folder and says the entry leaves the rest of the config folder refused, its `.claude.json` among it, with no claim on the login; and the first clause of the row at `:113` now reads the round's text. The fix touched `frame/plan.md` alone.
```

## Confirmations

```seal
confirms: round-3#2
```
What holds: the frame now names the folder Owlery makes for an added account as the one in the run folder, and keeps a folder the person hands over where it stood. The fold rewrote each place round 3 named: *Scope* items 4 and 9 (`frame/design.md:96`, `:101`), the English and Korean adds of `## Rule changes` (`:178`, `:183`), and `frame/plan.md:14`, `:52` and `:89`. It also rewrote `frame/plan.md:53` and `:54` and the index line of `frame/questions.md:20` (read: `git diff --word-diff 9dd71aba 1fb75ef6 -- <the frame>`). The search of finding 1 printed no other sentence of the class outside `:110`, which round 3's finding 2 did not name and finding 1 above now carries. The policy sentences the fold quotes stand in `docs/architecture.md`, each once: "Owlery makes a folder in the daemon's run folder", "hands over a folder that exists, which Owlery neither links into nor deletes", "stand in `accounts/` of the run folder" and "its login is in the Keychain under an entry keyed to the folder" (executed, `grep -c -F` of each). `accounts.test.ts:931-932` holds the two names the new *Grounding* row cites (read).

What matched: the comment of `claude.ts#claudeAdapter`'s `start` (`claude.ts:546-547`) says the rest of the config folder stays refused, its `.claude.json` among it and a `.credentials.json` where the CLI keeps one, and that on macOS the CLI keeps the login in the Keychain. Round 3's probe found both files refused (carried). The comment is the one code change of the range. Its line 547 runs to 152 characters where its neighbours wrap near 136, and the package configures no formatter or linter, so that is no defect.

What matched: the *Grounding* rows the fold dated to `14187e21`. The 2.1.332 binary holds `security find-generic-password -a "` three times and `security delete-generic-password -a` twice, and its `strings` print the form `security find-generic-password -a "${…}" -w -s "${…}"` (executed, `grep -a -c -F` and `strings -n 8`). Issue #285 is open in the milestone "after launch: first findings and conveniences", and a comment on it now adds the Keychain with a *Done when* of its own (executed, `gh issue view 285`). So *Out*'s statement that #285 "gains the services on the loopback and the Keychain" holds.

What matched: the merge's resolution of `view.test.ts` *statusNotice*. It keeps the release's four arguments, its `STORE` sentence and its order, the window's notice, the daemon's, the store's and then the agent's, and its `AGENT` sentence is the one `versionNotice` gives this branch's minimum, 2.1.329. `view.test.ts`, `claude-adapter.test.ts` and `fake-adapter.test.ts` read 3 files and 745 cases passed at the target (executed).

What matched: the work against the merged tree. `git grep -n -F '2.1.326' 8ad9538c -- apps/desktop` prints one line, `claude-adapter.test.ts:565`, which lists 2.1.326 among the older versions `versionNotice` names, and every pin of the minimum reads 2.1.329 (executed). #257's kept file, `repositories-unread-<stamp>.json`, stands in the run folder, which a role's commands read nothing of, and the release's new case of the built app's status line starts no role session. The release's new cases of `daemon.test.ts` start no role session, so none of them meets this work's wait for git at a role's start (read: the cases its diff adds). #312's reading of the check's version runs in the daemon's process and in no role session. No other work item's `## Rule changes` names a section this work's names (executed, each design's `file:` and `section:` lines listed). The one other frame that cites a section of this work's is #257's, whose *Grounding* row quotes the minimum as 2.1.326 at its own dated read, and that frame is #257's.

What matched: the three `role:refusal` scripts at the target, on Claude Code 2.1.332 and with `OWLERY_ROLE_CLI` at 2.1.329. Each of the six runs read 1 passed and 1 skipped, and its version line named the version it ran (executed, *Probes*). In each, the command's refusals were printed with `Operation not permitted`, the line of the home's function was printed, and the daemon's sentence for the role's rule refused the stand-in's later calls. The case asserts that no tool result holds the token, and it passed.

What matched: `gaps.md` and `changelog.md` are unchanged in the range, and each holds against the merged tree. The changelog's sentence that a command reads nothing of the run folder but its scratch folder and the shell snapshots holds with #257's kept file there. `gaps.md` keeps the rows that name the orchestrator's broad gate open, and no commit of the range claims the suite.

The range adds no test case. The merge's resolution rewrites three cases of `statusNotice`, and each keeps the release's assertions with this branch's sentence.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the lint and the typecheck at this target, `daemon.test.ts` and `role-bundle.test.ts` among them, which git merged on its own, which contract rule 2 gives to the broad gate | the branch at `8ad9538c` | the orchestrator's broad gate |
| Whether #317's milestone follows the rule the merge brought into `docs/roadmap.md`, "A new issue takes the first milestone below whose test it meets". #317 was opened on 2026-11-27 at 05:27 UTC, after `450c6e09` stood on the release branch, in "after launch: first findings and conveniences", whose test is a gap a person met in what has shipped. The gap it holds was found by a phase and no person has met it, which is the test of `hardening: boundaries and edge cases`. A milestone is no sentence of the branch, and the records name #317's milestone as a dated read | `docs/roadmap.md` *Milestones*, the list under **A new issue takes the first milestone below whose test it meets**; `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:76` | the orchestrator |
| Whether a role's command that runs `security find-generic-password -w` for an account's entry prints its login without a prompt, carried from round 3 | `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:113` | the orchestrator, through #285 |
| Whether a role session's file tools still read a file that exists in the scratch folder and the worktree under `denyRead`, carried from round 2 | `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/gaps.md:17` | the orchestrator, as that row says |
| Whether a model follows the head's sentence on its commands and the scratch paragraph, carried from round 1 | `apps/desktop/src/daemon/adapters/claude-roles.ts:101`, `apps/desktop/src/daemon/daemon.ts#withScratch` | the orchestrator, at the first daemon-launched round on a real model |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/claude-adapter.test.ts test/fake-adapter.test.ts`, in the clone at `8ad9538c`, through the lock | 3 files and 745 cases passed, exit 0. Nothing else of the suite was run |
| `OWLERY_ROLE_REFUSAL=1`, then `sealer`, then `crafter`, of `node scripts/test-in-electron.mjs test/role-session.test.ts --reporter=default`, in the clone, through the lock, on the installed 2.1.332 | Each read 1 passed and 1 skipped, and exited 0. Each version line named 2.1.332. Each output printed `Operation not permitted` for the command's refusals, the line `the shell setup of the home ran`, and the sentence of the role's rule for the later calls |
| The same three with `OWLERY_ROLE_CLI` at `~/.local/share/claude/versions/2.1.329` | The same: each 1 passed and 1 skipped, exit 0, the version line naming 2.1.329 |
| `grep -a -c -F` of `security find-generic-password -a "`, `security delete-generic-password -a` and `" -w -s "` in the 2.1.332 binary, and `strings -n 8` of it filtered on `security find-generic-password` | 3, 2 and 3 lines, and the command forms the *Grounding* row quotes |
| `gh issue view 285` and `gh issue view 317`, with their milestones, dates and comments | #285 open in "after launch: first findings and conveniences", with a comment that adds the Keychain. #317 open in the same milestone, opened 2026-11-27 05:27 UTC |

No probe file was written. The clone and each run's output stand in the round's scratch directory. The folders the committed runs kept under the system's temporary folder stand there, as the case keeps them by design.
