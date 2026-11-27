# Review round 3: 1795701355-257-a-store-it-cannot-read-is-kept

```seal
target: dda95d14, fixes bbed3c09..dda95d14
```

This is a verifying round. Round 2 (`bbed3c09`) named no finding, so no close stands to answer and this record holds no `confirms:` line. Its target is what came after round 2: the handoff `128ff100`, the merge `61361a38` of `origin/release/v0.1.0` (`e7737b7e`, which is also the tag `v0.0.5`), the memo and changelog change `ac4abd09`, the handoff's removal `39908199`, and the orchestrator's fold `dda95d14`. The code the round reviewed is what the merge resolved and what it set beside this work: `git show --remerge-diff 61361a38`, the merged tree where the two works meet, and the work's own diff against the new base set beside its diff against the old one. The round read every record of the work item whole at `dda95d14`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, both phase records, and rounds 1 and 2. No `pr.md` stands yet, and `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

Carried from rounds 1 and 2, and not searched again: where the store's refusal branch, `keepAside`, the `ready` send, the window's two lines and the built-app case stand. Each verdict below was reached again at the target. The narrow runs this round made are in *Probes*. The suite is `unverified`, and the orchestrator answers it at the broad gate.

The axes of this round, beyond the table: what each side of the merge sends in `ready` and what the other side's pins expect of it; the window's handling of a `ready` that carries both `storeNotice` and `answersUnknown`; #216's refresh, which reads the lists again without a `ready`; and every sentence of the records that the merge's new base, or the settle of release 0.0.5 it brought in, makes false.

## Findings

### 1. `frame/plan.md:63` sends the reader to #217's changelog fragment, and the target holds no such file

```seal
severity: should
location: `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/plan.md:63`
evidence: executed `git grep -n -F "217-a-new-work-item-picks-its-branch" dda95d14`, which prints `frame/plan.md:63` and `trail/rounds/round-1.md:154`; `git ls-tree -r --name-only dda95d14 seal/threads`, which lists this work item's directory alone; `git cat-file -e 7bd83831:seal/threads/1795610869-217-a-new-work-item-picks-its-branch/changelog.md`, exit 0; `git log --oneline e7737b7e -- seal/threads/1795610869-217-a-new-work-item-picks-its-branch/changelog.md`, whose latest commit is the settle `a7d194f9` (#302); `gh release view v0.0.5 --json body`, read for #217's section
```

Why it matters: *Operational impact* tells a person running an earlier build how to keep the file safe. It names #217's way round and cites where it is written: `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/changelog.md`. That file stood at round 2's target, `7bd83831`. The settle of release 0.0.5 (`a7d194f9`, #302) removed every record of that release, and the merge `61361a38` brought the settle into this branch. At `dda95d14` the file does not stand, so the sealer, or a person who follows the citation, opens nothing. The fold `dda95d14` edited this very line, changing `v0.0.4` to `v0.0.5`, and left the citation as it was. The way round now stands in the release notes of `v0.0.5`, at the last bullet of #217's section: "A person who may run an earlier build copies `repositories.json` aside first."

The search on the directory's name printed two lines. `trail/rounds/round-1.md:154` is a round record, which states its own target, so it stays. The search is a sample under contract rule 12, since a citation of #217's records in other words would escape it.

```markdown
- The protection holds for a move back to this build or a later one alone. `v0.0.5` and earlier builds write over a file they refuse, so #217's way round stands for them: copy `repositories.json` before running such a build (the release notes of `v0.0.5`, the last bullet of #217's section: "A person who may run an earlier build copies `repositories.json` aside first."). The changelog fragment of this work says both.
```

### 2. Line coordinates in the frame's present-tense sections, and one in the memo, name lines that hold something else at the target

```seal
severity: should
location: `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:48`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:49`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:57`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:70`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:76`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:117`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:119`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/plan.md:20`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/plan.md:25`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/plan.md:26`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/plan.md:27`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/plan.md:44`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/gaps.md:8`
evidence: executed `grep -n -o` for every backticked `path:line` and `:line` coordinate over `frame/design.md` and `frame/plan.md` at `dda95d14`; then `sed -n` of each cited line at `dda95d14` and `git show 7bd83831:<path> | sed -n` of the same line, for each coordinate outside *Grounding*, *Technical context* and *Removes* and not dated in its own sentence; `grep -n` at `dda95d14` for the unit each coordinate names: `case "createWorkItem"` (`apps/desktop/src/daemon/daemon.ts:1065`), `case "readLedger"` (`:1707`), `dropGateOutput` (`:4321`), `pullRequestBodyFile` (`:4259`), `greet` (`:989`), `readAgentNotice` (`:4820`), the `ready` comment (`apps/desktop/src/shared/protocol.ts:983`), `statusNotice` (`apps/desktop/src/renderer/view.ts:1034`), `showStatus` (`apps/desktop/src/renderer/sidebar.ts:103`), the key pins (`apps/desktop/test/daemon.test.ts:601`, `:7612`), the log's last line (`apps/desktop/src/daemon/main.ts:122`), `daemon.log` (`apps/desktop/src/main/daemon-client.ts:91`); read `.github/workflows/check.yml:22-23`
```

Why it matters: the sealer reads the frame against the tree, and a coordinate is what it opens to do so. `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* dates only *Grounding* and *Technical context* to the commit the framer read. Every other section is read against the target. The merge changed 221 lines of `daemon.ts` and moved the other files of the window and the protocol, so lines that the sentences of *Scope* item 8 and the key pins named correctly at round 2's target now name other code. *Scope* item 8 is the list of places that key on a work item's id. At `dda95d14`, its `daemon.ts:1025-1026` and `:1028` fall in `answerReadLists`, its `:1637-1638` in `handle`'s `detach` case, its `:4103-4108` in the gate's run, and its `:4165-4171` in the docstring of the pull request's stage. Others were already wrong at `7bd83831`, where phases 1 and 2 had moved them: *Scope* item 7's `sidebar.ts:85` is a closing brace there, and `:7130` is a comment in a keep-awake case. `skills/core/SKILL.md` *The rule a mechanism is kept against* keeps nothing beside the tree to stay in step with it, a coordinate among them. So the fix names each unit in place of its line, and the next merge leaves the name true.

The class was listed by taking the two frame files apart into every coordinate they hold (the `grep -n -o` of the `evidence:` line), so the list is whole for the backticked `path:line` and `:line` spellings. A coordinate written in other words, such as "the comment at the end of the constructor", escapes the list. These coordinates were left out of it: those in *Grounding* and *Technical context*; those dated in their own sentence (`at 5370d534`, `at 2cf16eb4`); the *Removes* rows, which name where a removed thing stood; `built-app.ts:197-208` and `role-bundle.test.ts` `:495` (`design.md:47`), which still cover `BuiltApp.start`'s `writeRun` and the comment that opens the old-CLI case; and `ledger.ts:136`, `last-look.ts:169`, `heavy-runs.ts:25`, `accounts.ts:109-116` and `whole-file.ts:17-36`, which hold what they name. The memo's `gaps.md:8` was read the same way: `.github/workflows/check.yml:23` is `timeout-minutes: 30`, and `runs-on: macos-latest` stands at `:22`. No other coordinate of `gaps.md`'s open rows names a line.

The replacements, each a whole coordinate, in the line that holds it:

```text
frame/design.md:48  (Scope item 7)
  `statusNotice` (`view.ts:914-919`)            ->  `statusNotice` (`apps/desktop/src/renderer/view.ts#statusNotice`, its docstring)
  `showStatus` (`sidebar.ts:85`)                ->  `showStatus` (`apps/desktop/src/renderer/sidebar.ts#showStatus`)
  `held.agentNotice` (`shared.ts:25`)           ->  `held.agentNotice` (`apps/desktop/src/renderer/shared.ts`, its docstring)
  The `ready` comment in `protocol.ts:957`      ->  The comment over the `ready` member of `ServerMessage` in `apps/desktop/src/shared/protocol.ts`
  (the comment at `daemon.ts:1020` stays: it is the line the dated `git grep` at `5370d534` printed)

frame/design.md:49  (Scope item 8)
  (`daemon.ts:1025-1026`)                       ->  (`daemon.ts#handle`, its `createWorkItem` case, `this.times.drop`)
  (`daemon.ts:1028`, `:4165-4171`)              ->  (the same case's `this.dropGateOutput`, and `daemon.ts#dropGateOutput`)
  (`daemon.ts:1637-1638`, `ledger.ts:136`)      ->  (`daemon.ts#handle`, its `readLedger` case, and `ledger.ts:136`)
  (`daemon.ts:4103-4108`)                       ->  (`daemon.ts#pullRequestBodyFile`)

frame/design.md:57  (Out of scope)
  (`repositories.ts:274`)                       ->  (the comment in `repositories.ts#RepositoryStore`'s constructor)

frame/design.md:70  (User scenarios, "A file the store reads, and no file")
  the key pins of `daemon.test.ts:581` and `:7130`
    ->  the key pins of `apps/desktop/test/daemon.test.ts`, in the cases *carries only the fields the protocol names, none of them a vendor's* and *sends no `keepAwake` in `ready`, and takes no choice, where it is given no holder*

frame/design.md:76  (Data & interfaces)
  (`repositories.ts:258-262`)                   ->  (`repositories.ts#RepositoryStore`'s constructor)

frame/design.md:117  (What the daemon could do beyond the issue)
  (`repositories.ts:274-289`)                   ->  (`repositories.ts#RepositoryStore`'s constructor, the copy under "Only the fields of the store")

frame/design.md:119
  (`main/daemon-client.ts:46`)                  ->  (`main/daemon-client.ts#ensureDaemon`, where it opens `daemon.log`)

frame/plan.md:20
  (`daemon/main.ts:110-111`)                    ->  (`main/daemon-client.ts#lastLine`, and the comment of `daemon/main.ts`'s `main().catch`)

frame/plan.md:25
  the refusal is one `return` (`repositories.ts:272`), which this work replaces
    ->  the refusal was one `return` in `repositories.ts#RepositoryStore`'s constructor at `5370d534`, which this work replaces

frame/plan.md:26
  at the daemon's listen and at each window's connection (`daemon.ts:648`, `:935`, `:4651-4660`)
    ->  at the daemon's listen, at each window's connection and at each `readLists` (`daemon.ts#listen`, `daemon.ts#readOutside`, `daemon.ts#readAgentNotice`)

frame/plan.md:27
  `daemon.test.ts:581` and `:7130` pin the exact keys of `ready`
    ->  the cases *carries only the fields the protocol names, none of them a vendor's* and *sends no `keepAwake` in `ready`, and takes no choice, where it is given no holder* of `daemon.test.ts` pin the exact keys of `ready`
  (`daemon.ts:974`)                             ->  (`daemon.ts#greet`, the `ready` send)

frame/plan.md:44  (Phases, row 2)
  item 7's comment at `daemon.ts:1024`          ->  item 7's comment in `daemon.ts#handle`'s `createWorkItem` case
  the key pins at `daemon.test.ts:581` and `:7130` unchanged and passing
    ->  the key pins of the two cases named in `frame/design.md` *User scenarios & acceptance* unchanged and passing

gaps.md:8
  (read: `.github/workflows/check.yml:23`)      ->  (read: `.github/workflows/check.yml:22`)
```

`frame/plan.md:26`'s added words "and at each `readLists`" are #216's: at the target the daemon asks the adapter again in `readOutside`, which a hello and a `readLists` both run (`apps/desktop/src/daemon/daemon.ts:970-972`). The rejection stands either way, since a third reader of the slot only sooner replaces the store's sentence.

## Confirmations

What matched: the two resolutions keep both sides. In `daemon.ts`'s `greet`, the `ready` send holds this work's `...(this.storeNotice === null ? {} : { storeNotice: this.storeNotice })` after `agentNotice` and #133's `answersUnknown: true` at its end (`apps/desktop/src/daemon/daemon.ts:1001`). In `protocol.ts`, the `ready` member holds `storeNotice?: string` and `answersUnknown?: true`, the comment holds this work's `storeNotice` sentence where it stood and #133's `answersUnknown` sentence at its end, and the `inbox` comment is #216's (`apps/desktop/src/shared/protocol.ts:983-985`). Read, from `git show --remerge-diff 61361a38`, which shows no other hunk of the merge differing from git's own merge.

What matched: the merge changed nothing else of this work. The lines this work adds and removes under `apps/` against `e7737b7e` are the lines it added and removed against `c80b900a`, except the two resolved lines, which now carry `answersUnknown` as well (executed: `git diff -U0` of each range, its `+` and `-` lines compared with `diff`). The files both sides changed are `daemon.ts`, `renderer.ts`, `shared.ts`, `sidebar.ts`, `view.ts`, `protocol.ts`, `daemon.test.ts` and `view.test.ts` (executed: `comm -12` of the two `git diff --name-only` lists), which is the list `gaps.md:13` names.

What matched: the pins of `ready`'s keys. Both cases expect `answersUnknown` and no `storeNotice` (`apps/desktop/test/daemon.test.ts:601`, `:7612`), which is *Scope* item 5's rule for a daemon that read its file and the acceptance row that says the pins stay as this work found them. The case that keeps aside a refused file still reads `storeNotice` in two `ready`s (`apps/desktop/test/daemon.test.ts:1504-1526`). Read, and run (*Probes*).

What matched: the window. The `ready` handler runs #133's `waits.ready(message)` first and sets `held.storeNotice` from the message before it draws a screen (`apps/desktop/src/renderer/renderer.ts:1901-1940`). `showStatus` passes `held.storeNotice` third (`apps/desktop/src/renderer/sidebar.ts:104`), and `statusNotice` keeps the form of four arguments and *Scope* item 6's order (`apps/desktop/src/renderer/view.ts:1034-1036`). `showStatus` is the one caller of `statusNotice` outside `view.test.ts` (executed: `grep -rn "statusNotice("` over `apps/desktop/src` and `apps/desktop/test`).

What matched: #216's refresh leaves the store's notice as it stands. A press sends `readLists`, and the answer's lists come in an `inbox`, which `takeLists` draws (`apps/desktop/src/renderer/refresh.ts`, `apps/desktop/src/shared/protocol.ts:985`). Only the `ready` handler sets `held.storeNotice` (executed: `grep -rn storeNotice` over `apps/desktop/src`). A refresh that gets no answer, or an `error`, says its sentence through `tell`, the window's own notice, which *Scope* item 6 puts first. That sentence goes at the next `tell("")`, at a `done` or a `started` (`apps/desktop/src/renderer/renderer.ts:1985`, `:2032`), and the store's notice shows again. #216 adds the notice of a daemon of another build after its no-answer sentence (`refresh.ts#refresher`), and adds no such tail for the store's notice. The frame orders the window's own notice first and asks no tail, so this is no finding.

What matched: the record changes. `routing.md:22`'s base: `origin/release/v0.1.0` is `e7737b7e`, the tag `v0.0.5` is the same commit, and none of this work's commits is in `v0.0.5` (executed: `git rev-parse`, `git merge-base --is-ancestor 1344ca6b v0.0.5`, exit 1). `changelog.md:10`, `frame/design.md:54` and `frame/plan.md:63` say that `v0.0.5` and earlier write over a refused file: `v0.0.5`'s `repositories.ts` holds no `keepAside` and no `setAside` (executed: `git show v0.0.5:apps/desktop/src/daemon/repositories.ts`, searched). `ac4abd09` adds a row to `gaps.md` and removes none. `39908199` removes `handoff.md`, which holds no row of `## Not verified`, and a handoff the next session reads and removes is no closing memo.

What matched: the rule changes against the policy after the settle. *State lives in three places* stands at `docs/architecture.md:236`, and *상태는 세 곳에 둡니다* at `docs/architecture.ko.md:236`. The settle wrote release 0.0.5's sentences into it, and none of them meets the repositories paragraph or the sentence this work adds at the section's end. No other work item's frame stands under `seal/threads/` at the target (executed: `git ls-tree`), so no unsettled design changes the section. Read.

What matched: `changelog.md` whole against the merged tree. The order it gives, the window's own notice and the other build's before the store's and the agent's after it, is `statusNotice`'s. "It stands while that daemon runs, in every window that connects to it" holds with #133: a window reloads on a closed socket, so a restart's new daemon sends its own `ready`. Read.

`gaps.md:13` says the merge ran the cases of `daemon.test.ts` under the key pins, `answersUnknown`, `readLists`, `repositories` and the kept file, `view.test.ts` and `refresh.test.ts` whole, and the built-app case. The row names no output to open, so it is a claim. This round ran those sets again (*Probes*), and its own runs are what this record rests on.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: every other file that loads `daemon.ts` or the window's files, every other built-app file, the typecheck of the package after the merge, and the `docs/` heading and row counts. This round ran narrow sets only. | `gaps.md:7`, `gaps.md:10`, `gaps.md:12`, `gaps.md:13` | the orchestrator, at the broad gate |
| The cases of a file of mode `000` and a folder of mode `0500`, which fail when run as root; no CI run of them has been seen. Carried from round 2. | `gaps.md:8` | the orchestrator, from the CI's run of the pull request |
| Two daemons on one run folder at once, round 1's fourth row. Carried, and not read again. | `apps/desktop/src/daemon/repositories.ts#keepAside`, `apps/desktop/src/main/daemon-client.ts#ensureDaemon` | the orchestrator, as a follow-up issue where it holds |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "says in .ready. that it answers a request it does not know\|carries only the fields the protocol names\|keeps aside a .repositories.json. it cannot read\|readLists\|sends no .keepAwake. in .ready."` in `apps/desktop`, at `dda95d14`, through the session's lock script, with `ELECTRON_OVERRIDE_DIST_PATH` set to the main checkout's Electron | exit 0: 1 file, 12 passed and 425 skipped: #133's `answersUnknown` case, both key pins of `ready`, the case that keeps aside a refused file, and the `readLists` cases of #216 |
| `node scripts/test-in-electron.mjs test/view.test.ts test/refresh.test.ts test/repositories.test.ts` in `apps/desktop`, at `dda95d14`, the same lock and Electron | exit 0: 3 files, 659 passed |
| `node scripts/test-in-electron.mjs test/role-bundle.test.ts -t "notice of a kept repositories file"` in `apps/desktop`, at `dda95d14`, the same lock and Electron, under the system `TMPDIR` | exit 0: 1 file, 1 passed and 20 skipped: the built app's status line says the kept file, drawn as a notice |
