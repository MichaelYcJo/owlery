# Review round 3: 1795701355-127-role-sessions-run-in-a-sandbox

```seal
target: c9180500, fixes 3aa85152..c9180500
```

This is a verifying round. It reviewed the fix pass of round 2, `7d98980c` to `cebde4c8`, with its close block at `cff01936`. It also reviewed what followed in the range: the framer's two folds `7a6c8c74` and `28fe556d`, phase 6 (`479cb62d`, `9ca6f586`), and the orchestrator's record commits `70c266c6` and `c9180500`. The code under review is the fix diff. Phase 6's two commits and `cebde4c8` change code in comments alone (executed: `git show` of each, with comment lines filtered out, printed no changed line under `apps/`). The round read `routing.md`, the three frame files, `gaps.md`, `changelog.md` and every phase record whole at `c9180500`, and read the diff of each against `3aa85152`. No `pr.md` stands. The round ran its probe and its narrow cases in its own `git clone --no-local` of the branch at `c9180500`, under the round's scratch directory, with the worktree's installed dependencies linked in and nothing installed. Every run used the stand-in model, on the installed Claude Code 2.1.332 and with `OWLERY_ROLE_CLI` at 2.1.329.

Carried from rounds 1 and 2, not established again: where the launch, the grants and the daemon's rule stand (`claude.ts#claudeArgs`, `claude.ts#launchOf`, `role-grants.ts#verdictOn`, `daemon.ts#commandsOf`). Also carried is round 1's check that each `from:` of `## Rule changes` stands in its file: the range changes no `from:`, `file:` or `section:` line (executed, `git diff -U0` of `frame/design.md` filtered on those keys), and neither the range nor the base's new commits change `docs/architecture.md` or its Korean edition. Phase 6's measurement of the linked `shell-snapshots` form is carried from its outputs in the session's scratchpad, read and not run again: each names its version, an `allowRead` that holds the scratch folder and `<run>/config/shell-snapshots`, the function's line, and 1 passed and 1 skipped. Every verdict below was reached at this target.

The base has moved. A `git fetch` showed `origin/release/v0.1.0` at `fbd20166`, two commits past `450c6e09` (`b5444f57`, `fbd20166`), and `c9180500` does not descend from it. Those commits change `daemon.ts`, `daemon.test.ts`, `role-bundle.test.ts` and `view.test.ts`, which this branch also changes (executed, `git diff --name-only` of both ranges, intersected). The merge of the base before the broad gate is the orchestrator's, as `routing.md` says, and no round has read it yet.

The caller asked for two things. Round 2's finding 1 is closed: the committed case tries every file tool's read of the run folder for every role, and it passed on both versions. The `shell-snapshots` entry gives back that folder alone on both versions: this round's probe found the login file, a sibling folder, the config folder's listing, `.claude.json` and `daemon.json` refused, and a write into the snapshots refused. Two sentences of the frame that came with the entry do not hold, which are findings 1 and 2. The frame's and `gaps.md`'s statement of the orchestrator's decision on the linked form holds, as *Confirmations* states.

## Findings

### 1. The records say the refused read keeps an added account's login from a command, but on macOS the login is in the Keychain and not in the folder, and a sandboxed command reached the Keychain service on both versions

```seal
severity: should
location: `apps/desktop/src/daemon/adapters/claude.ts:545-546`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:86`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:103`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:168`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:173`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:53`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:89`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:110`
evidence: executed `OWLERY_ROLE_REFUSAL=1 node scripts/test-in-electron.mjs test/test_tmp_snapshot_alone.test.ts` once on 2.1.332 and once with `OWLERY_ROLE_CLI` at 2.1.329, in the clone through the lock (*Probes*); executed `strings -n 8` of the 2.1.332 binary, searched for `add-generic-password` and `find-generic-password`; executed `git grep -n -o -e "login among it" -e "account's login" -e "the login refused" -e "로그인을 포함해" c9180500 -- seal/threads/1795701355-127-role-sessions-run-in-a-sandbox apps/desktop/src apps/desktop/test`; read `docs/architecture.md:116`, `docs/architecture.md:256`, `apps/desktop/test/accounts.test.ts:931-932`
regression: round-2
```

Why it matters: the fix pass of round 2 gave a role's commands back the read of `shell-snapshots` of the session's config folder. Its comment says that the rest of that folder, "its login among it, stays refused" (`claude.ts:546`; `e3f86d0d`'s message says the same). The fold `7a6c8c74` copied the sentence into *Scope* item 4, into both editions of the `## Rule changes` add, and into three rows of `frame/plan.md`. The settle would write it into `docs/architecture.md` *Agent adapters*.

The policy places the login elsewhere: "on macOS its login is in the Keychain under an entry keyed to the folder, so no file Owlery writes holds a token" (`docs/architecture.md:256`). The 2.1.332 binary keeps and reads that entry through the `security` tool: its strings hold `security add-generic-password -U -a "` and `security find-generic-password -a "`. On macOS, then, the folder holds no login file, and the refused read does nothing for the login. The refused read does hold a `.credentials.json` where the CLI keeps one, which `accounts.test.ts:932` counts among the account's own names: this round's probe planted one and the command was refused it.

The probe ran `security find-generic-password -s owlery-round-3-absent-item` as a proofer's command. On 2.1.332 and on 2.1.329 it printed "The specified item could not be found in the keychain." and exited 44. That is the Keychain's own answer and no sandbox refusal, so a role's command reaches the Keychain service. Whether `security find-generic-password -w` of an account's entry prints its login without a prompt was not run, because it would read the person's credential. An entry the `security` tool made usually lets that tool read it back, so the read is likely open. That route is the class of #285, credentials a command reads. *Out*'s row on what a command reads names files alone.

The frame asks for one entry, `shell-snapshots` of the config folder, and says nothing of the login (`frame/design.md:135`, *Data & interfaces*). The fix pass built that entry, which this round measured giving back that folder alone, and added the sentence on the login. The defect came from reading the policy's list of what belongs to the account, "its sign-in" (`docs/architecture.md:116`), as a file of the folder, where `:256` places the login in the Keychain. A person or an agent who reads the policy after the settle would take the refused read as what keeps an account's login from a role's command.

The search printed the eight places in *location* and `trail/rounds/round-2.md:87`, the close block of round 2, which states that pass and stays. The search is a sample of spellings: a statement of the claim in other words escapes it. The issue #285 gaining the Keychain is the orchestrator's to file, as it filed the rows of *Out*.

```text
apps/desktop/src/daemon/adapters/claude.ts:545-546, in the comment of `start`, "the rest
// of the config folder, its login among it, stays refused." becomes:
      // names, so `allowRead` names that one folder of the config folder, by its real path as `denyRead` names the run folder; the rest
      // of the config folder stays refused, its `.claude.json` among it and a `.credentials.json` where the CLI keeps one. On macOS the
      // CLI keeps the login in the Keychain, which no read of a folder holds. In such a folder `shell-snapshots` is a link into the person's own config

frame/design.md:86, Scope item 4, "The rest of that config folder, its login among it, stays refused." becomes:
The rest of that config folder stays refused, its `.claude.json` among it and a `.credentials.json` where the CLI keeps one. On macOS the CLI keeps the account's login in the Keychain through the `security` tool, which the refused read does not hold, and a command reached the Keychain service on 2.1.332 and 2.1.329 (`trail/rounds/round-3.md`, finding 1; *Out*, the row on what a command reads).

frame/design.md:103, Out, the row "What a command reads", after "such as `~/.ssh` or a cloud CLI's credentials.":
A command also reaches the Keychain service, where Claude Code keeps each account's login through the `security` tool, and whether a command's `security find-generic-password -w` prints a login was not run.
and the row's last sentence ends "..., which gains the services on the loopback and the Keychain."

frame/design.md:168, the English add, "The rest of that config folder, its login among it, stays refused." becomes:
The rest of that config folder stays refused, its `.claude.json` among it. On macOS the CLI keeps the account's login in the Keychain, which the refused read does not hold.

frame/design.md:173, the Korean add, "그 설정 폴더의 나머지는 로그인을 포함해 여전히 읽지 못합니다." becomes:
그 설정 폴더의 나머지는 `.claude.json`을 포함해 여전히 읽지 못합니다. macOS에서 CLI는 계정의 로그인을 키체인에 두며, 거절된 읽기는 키체인을 막지 않습니다.

frame/plan.md:53: "its login among it, which the entry keeps refused" becomes "its `.claude.json` among it, which the entry keeps refused".
frame/plan.md:89: "such as an added account's login" becomes "such as an added account's `.claude.json`".
frame/plan.md:110: "the entry leaves the login refused" becomes "the entry leaves the rest of the folder refused".
```

```seal
verdict: fixed 769cb20e
answer: The comment of `claude.ts#claudeAdapter`'s `start` now reads "the rest of the config folder stays refused, its `.claude.json` among it and a `.credentials.json` where the CLI keeps one. On macOS the CLI keeps the login in the Keychain, which no read of a folder holds." Comments only, so `tsc --noEmit` ran (exit 0) and no suite. `git grep -n -i` on "login" with "its login", "keeps refused" and "refused" near it over `apps/desktop/src` and `apps/desktop/test`, and the same over `changelog.md` and `gaps.md` for "login", "sign-in" and "credential", printed no other place that says the refused read keeps a login; the other hits are the accounts code on a login standing in a folder. A sample of spellings. Not written, since a crafter writes no line of the frame: `frame/design.md` lines 86, 103, 168 and 173 and `frame/plan.md` lines 53, 89 and 110, which the framer folds as the paste-ready text gives them. The issue #285 gaining the Keychain is the orchestrator's to file.
```

### 2. The frame states that an added account's config folder stands in the run folder, while the policy keeps a folder the person hands over where it stood

```seal
severity: should
location: `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:86`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:91`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:168`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:173`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:14`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:52`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:89`
evidence: executed `git grep -n -i -e "added account" -e "더한 계정" c9180500 -- seal/threads/1795701355-127-role-sessions-run-in-a-sandbox apps/desktop/src apps/desktop/test`; read `docs/architecture.md:113`, `docs/architecture.md:256`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/trail/phases/phase-6.md:25-29`, `apps/desktop/src/daemon/adapters/claude.ts:544`
```

Why it matters: the policy gives two ways to add an account. "Owlery makes a folder in the daemon's run folder", or "the person hands over a folder that exists, which Owlery neither links into nor deletes" (`docs/architecture.md:113`). "The folders Owlery makes stand in `accounts/` of the run folder" (`:256`). A handed-over folder stands where the person keeps it.

Phase 6 found this class in the texts a crafter writes and corrected them: `claude.ts:544` now says "The folder the daemon makes for an added account stands in the run folder", and `changelog.md:9` says the same (`phase-6.md:25-29`). The frame's copies, which the fold `7a6c8c74` wrote and the fold `28fe556d` after phase 6 left, still state it of every added account. The English add would write "An added account's config folder stands in the run folder, so without the entry a session of an added account runs its commands without the person's aliases and functions" into *Agent adapters*, the section that holds `:113`. A session of a handed-over folder outside the run folder lost nothing without the entry. A reader of the policy would then hold two statements of where an account's folder stands.

The search printed the seven places in *location*. It also printed `frame/design.md:52`, a *Grounding* row dated to `a99f40dc` that lists "the added accounts' config folders" among what the run folder holds, which is the folders Owlery made and stays; `frame/plan.md:53`, which names "the folders the daemon makes" and holds; and the rows of earlier records. The search is a sample of spellings.

```text
frame/design.md:86, Scope item 4: "..., and an added account's config folder stands in the run folder." becomes:
..., and the folder Owlery makes for an added account stands in the run folder, while a folder the person hands over stands where it stood.

frame/design.md:91, Scope item 9: "puts the session's config folder inside it, as an added account's folder stands." becomes:
puts the session's config folder inside it, as the folder Owlery makes for an added account stands.

frame/design.md:168, the English add: "An added account's config folder stands in the run folder, so without the entry a session of an added account runs its commands without the person's aliases and functions." becomes:
The folder Owlery makes for an added account stands in the run folder, so without the entry a session of such an account runs its commands without the person's aliases and functions; a folder the person handed over stands where it stood.

frame/design.md:173, the Korean add: "사람이 더한 계정의 설정 폴더는 실행 폴더 안에 있으므로, 이 항목이 없으면 그 계정의 세션은 사람의 별칭과 함수 없이 명령을 돌립니다." becomes:
사람이 계정을 더할 때 Owlery가 만드는 설정 폴더는 실행 폴더 안에 있으므로, 이 항목이 없으면 그런 계정의 세션은 사람의 별칭과 함수 없이 명령을 돌립니다. 사람이 넘겨준 폴더는 원래 있던 곳에 그대로 있습니다.

frame/plan.md:14: "An added account's config folder stands in the run folder, so the refused read took ..." becomes:
The folder Owlery makes for an added account stands in the run folder, so the refused read took ...

frame/plan.md:52: "The structure kept is an added account's config folder inside the run folder." becomes:
The structure kept is the folder Owlery makes for an added account, inside the run folder.

frame/plan.md:89: "where that folder stands in the run folder as an added account's does." becomes:
where that folder stands in the run folder, as the one Owlery makes for an added account does.
```

```seal
verdict: fixed 0780cfcd
answer: The framer's fold `0780cfcd` writes the round's texts into `frame/design.md` *Scope* items 4 and 9, *Out* and both adds of *Rule changes*, and `frame/plan.md` lines 14, 52, 53, 54 and 89, so the frame names the folder Owlery makes for an added account as the one in the run folder and keeps a folder the person hands over where it stood. The dated row at `frame/plan.md:110` stays, and a new *Judgments of the run* row corrects it. The fix touched `frame/` alone.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: the committed stand-in case tries each file tool's read of the run folder for every role. `role-session.test.ts#fileReads` gives a `Read` of `daemon.json` by its path, a `Read` through the link the command makes in the role's own place, a `Grep` and a `Glob`, and `model-stand-in.ts#startModelStandIn` makes them one a turn through `after`. The case asserts that each reached the daemon as a request, that the daemon refused each by the role's rule, counted once by the call it answers, and that no tool result holds the token (`role-session.test.ts:344-356`). Executed at the target, in the clone through the lock: `role:refusal`, `role:refusal:sealer` and `role:refusal:crafter` each read 1 passed and 1 skipped on 2.1.332, and again with `OWLERY_ROLE_CLI` at 2.1.329, the version line naming each. Each output's tool results held the command's refusal of `daemon.json` and four refusals with the sentence of the role's rule, and no output held the token. The close's three departures from round 2's paste-ready text each hold against the code: refusals counted by `tool_use_id`, the link made before the `cat`, and all three file tools tried. The statements the close left to the fold are folded: `frame/plan.md:19`, *Scope* item 9 and *User scenarios* rows 9 to 11 name the four reads (read).

What matched: the `shell-snapshots` entry gives back that folder alone, on 2.1.332 and on 2.1.329 (executed, *Probes*). The `--settings` value's `allowRead` held the scratch folder and `<run>/config/shell-snapshots`. The command listed the snapshot and read its bytes, and the home's function printed its line. The command was refused a planted `.credentials.json` of the config folder, the same file reached as `shell-snapshots/../.credentials.json`, a file of a sibling folder `shell-snapshots-x` whose name opens with the entry's, the config folder's listing, its `.claude.json`, a write into `shell-snapshots`, and `daemon.json`. The planted write left no file. So the entry matches by path component and names no wider place.

What matched: the adapter case pins the entry and its real path. With the entry taken out of `claudeAdapter`'s `start`, "bounds each role's commands to the places it was given…" (`claude-adapter.test.ts:882`) failed its `sandbox` line, which expected `<folder>/run/accounts/a/shell-snapshots`. With `realpathSync.native` replaced by the folder as given, it failed the same line, which received `<folder>/run-link/accounts/a/shell-snapshots` (executed, each mutant once through the lock, and the clone restored). The stand-in case gives its config folder through the login shell, so the branch where `accountDir` is absent is the one it runs, and the adapter case runs the `accountDir` branch. `claude-adapter.test.ts` and `fake-adapter.test.ts` read 130 passed at the target (executed).

What matched: the frame's and `gaps.md`'s statement of the orchestrator's decision on the linked form. `frame/plan.md:112` records it: the committed case keeps a plain folder, and a case of the linked form with a run that removes the entry is #317, after the launch. `gaps.md:21` keeps the open row with #317 as who answers, `frame/plan.md:19` and `:52` state the gap a release that resolves links would open, *Scope* item 4 says item 9's case does not try the linked form, and the English add says the linked form's run is one the `role:refusal` scripts do not repeat. #317 is open in the milestone the *Grounding* row read at `9ca6f586` names, and its *Done when* holds both the linked case and the run with the entry removed (executed, `gh issue view 317`). One coordinate is loose and no defect: `gaps.md:21` cites `trail/phases/phase-6.md` for "the orchestrator decided", and phase 6 records the crafter's choice on the spawn's word (`phase-6.md:19`), while the decision itself stands in `frame/plan.md:112`.

What matched: `gaps.md`'s diff over the range takes no *Not verified* row out. The row on the file tools' reach of the scratch folder is reworded in place, and the rows on round 2's broad gate, on Q8 and on the linked form are added, Q8's as closed. The paragraph of *Not done* that the range removes said no committed case tries a file tool's read, which the case now does. The suite stays labelled unverified in the rows that name the orchestrator's broad gate, and no phase or fix pass claims the suite.

The fix diff adds no test case. It extends the stand-in case and the adapter case of each role's bound, and each was read against its group.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a role's command that runs `security find-generic-password -w` for an account's entry prints its login without a prompt. This round showed only that a command reaches the Keychain service, since the read would take the person's credential | `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:103` | the orchestrator, through #285 |
| The merge of `origin/release/v0.1.0` at `fbd20166`, whose two new commits change `daemon.ts`, `daemon.test.ts`, `role-bundle.test.ts` and `view.test.ts` | the branch at `c9180500` | the orchestrator, before the broad gate, and the round that reads the merge's resolution |
| Whether a role session's file tools still read a file that exists in the scratch folder and the worktree under `denyRead`, carried from round 2 | `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/gaps.md:17` | the orchestrator, as that row says |
| Whether a model follows the head's sentence on its commands and the scratch paragraph, carried from round 1 | `apps/desktop/src/daemon/adapters/claude-roles.ts:101`, `apps/desktop/src/daemon/daemon.ts#withScratch` | the orchestrator, at the first daemon-launched round on a real model |
| The suite, the lint and the typecheck at this target, which contract rule 2 gives to the broad gate | the branch at `c9180500` | the orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `OWLERY_ROLE_REFUSAL=1`, then `sealer`, then `crafter`, of `node scripts/test-in-electron.mjs test/role-session.test.ts --reporter=default`, in the clone, through the lock, on 2.1.332 | Each read 1 passed and 1 skipped, and exited 0. Each output held the refusal of `daemon.json`, the line `the shell setup of the home ran`, and four refusals by the role's rule; none held the token |
| The same three with `OWLERY_ROLE_CLI` at 2.1.329 | The same: each 1 passed and 1 skipped, the version line naming 2.1.329, no token |
| `OWLERY_ROLE_REFUSAL=1 node scripts/test-in-electron.mjs test/test_tmp_snapshot_alone.test.ts --reporter=default`, a copy of the stand-in case for a proofer, run once on 2.1.332 and once with `OWLERY_ROLE_CLI` at 2.1.329. Before the session the copy planted `<run>/config/.credentials.json` and `<run>/config/shell-snapshots-x/f`, each holding a marker. Its command ran `ls` and `wc -c` of `shell-snapshots`, the home's function, `cat` of the planted file directly and through `shell-snapshots/..`, `cat` of the sibling's file, `ls -a` of the config folder, `wc -c` of its `.claude.json`, a `printf` into `shell-snapshots/planted`, `security find-generic-password -s owlery-round-3-absent-item`, and `cat` of `daemon.json` | The same on both versions, each 1 passed and 1 skipped. `ls` listed one `snapshot-zsh-*.sh`, `wc -c` read 4185 bytes, and the function printed its line. Every other read and the write failed with `Operation not permitted`, and no `planted` file stood afterwards. `security` printed "The specified item could not be found in the keychain." and exited 44. No marker and no token reached a tool result |
| `node scripts/test-in-electron.mjs test/claude-adapter.test.ts -t "bounds each role"` against two mutants of `claude.ts#claudeAdapter`'s `start`, in the clone, through the lock: the entry left out, and the real path replaced by the folder as given | Each read 1 failed and 104 skipped, on the `sandbox` line, as *Confirmations* states. The clone was restored after each |
| `node scripts/test-in-electron.mjs test/claude-adapter.test.ts test/fake-adapter.test.ts`, in the clone, through the lock | 2 files and 130 cases passed, exit 0. Nothing else of the suite was run |

The probe file ran once on each version and stands in the round's scratch directory. The two folders its runs kept under the system's temporary folder were removed by their paths. The six folders the committed runs kept stand there, as the case keeps them by design.
