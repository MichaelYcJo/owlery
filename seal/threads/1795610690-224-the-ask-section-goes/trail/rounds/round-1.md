# Review round 1: 1795610690-224-the-ask-section-goes

```seal
target: bf1e81fb against release/v0.0.5
```

This round reviewed the branch at `bf1e81fb` against its base `release/v0.0.5`, which the branch was cut from at `ab7a5730`. It is the first round, so no earlier record gave a coordinate and every fact below was established here. The round read whole, at the target, `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`, then `trail/phases/phase-1.md` to `phase-3.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English, and the repository declares no `seal/parity.json`. The diff edits no file of `docs/`: its policy rewrite stands as operations under `frame/design.md` *Rule changes* for the settle.

## Findings

### 1. Comments and a case title still name a session a person asked and a permission request, which Scope item 9 says are rewritten

```seal
severity: must
location: `apps/desktop/src/renderer/view.ts:3354`, `apps/desktop/test/view.test.ts:1669`, `apps/desktop/test/view.test.ts:1675`
evidence: executed `git grep -n -i -E "person asked|asked prompt|an ask\b|the ask's|the ask\b|asked a prompt|asks a prompt|prompt (was|is) asked|request of it|waits on a call|call that waits|waits for the person to allow" -- apps/desktop/test apps/desktop/src apps/desktop/scripts` at `bf1e81fb`; read `apps/desktop/src/renderer/view.ts:3245-3259`, `apps/desktop/src/renderer/view.ts:3354`, `apps/desktop/test/view.test.ts:1669-1683`
```

Why it matters: `frame/design.md` *Scope* item 9 says that every comment naming the "Ask" section, its field, a session a person asked or a call a session asks the person to allow is rewritten in the commit that changes its code. Three members of that class still stand at the target.

- `view.ts:3354`, the doc comment of `headlessKey`, says the key "differs where the broad gate's line, a session's line or a request of it differs". The request is the permission request that `HeadlessLine.asks` carried. Phase 3 removed `asks` from `HeadlessLine` (`view.ts:3245-3259`), so no request is part of the key any more. Phase 2 rewrote the rest of this comment, from the "Ask" section to the list of the daemon's chain, and left this clause. The case that pins the key was renamed to "differs where a line or the work item differs" (`view.test.ts:3005`), so the comment and its case now disagree.
- `view.test.ts:1669`, the title of the case on `stageAhead` and `chainSays`, says the foot "keeps the stage's sentence while only a session a person asked waits". `view.test.ts:1675`, a comment in it, says "a question a person asked in the work item waits". The diff rewrote both functions' doc comments for the same fact: "A session of the work item that no stage of its chain names counts for nothing here" (`view.ts`, `stageAhead`), and "a waiting session of the work item that no stage of its chain names leaves the stage's sentence" (`view.ts`, `chainSays`). The case was left on the old words.

Phase 2 and phase 3 each listed this class with a search on a few wordings (`trail/phases/phase-2.md` line 15, `trail/phases/phase-3.md` line 6) and called it a sample. "a person asked" and "request of it" are wordings neither search held. The search on `evidence:` above is a sample under contract rule 12 too: it reaches the wordings it names. It printed these three lines and other lines that name a pane, a fetch, a plan or a menu a person asked for, which are not this class. A statement of the class in other words escapes it.

```ts
// apps/desktop/src/renderer/view.ts:3354
/** What tells one drawing of a work item's list of the daemon's chain from the next: it differs where the broad gate's line or a session's line differs, and between two work items. The list is drawn again only where it differs, so a button the keyboard is on stays through every `inbox` that changes nothing the list shows. */

// apps/desktop/test/view.test.ts:1669
  it("says at the view's foot that a running chain waits for the machine while the session of the stage it begins is queued, with how many go before it, and keeps the stage's sentence while only a session of the work item that no stage of its chain names waits (scenario 4)", () => {

// apps/desktop/test/view.test.ts:1675
    // The stage works, and a session of the work item that no stage of its chain names waits: the foot keeps the stage's sentence.
```

### 2. The closing memo says the frame names none of the permission request's text, and the frame names it and gives it to issue #254

```seal
severity: should
location: `seal/threads/1795610690-224-the-ask-section-goes/gaps.md:18`
evidence: executed `grep -rn -F 'names none of' seal/threads/1795610690-224-the-ask-section-goes/` and `grep -rn -F '#254' seal/threads/1795610690-224-the-ask-section-goes/` at `bf1e81fb`; executed `gh issue view 254 --json title,state`; read `seal/threads/1795610690-224-the-ask-section-goes/frame/design.md:59`
```

Why it matters: `gaps.md` *Not done*, second paragraph, ends "`frame/design.md` names none of it, so it is left to the orchestrator, here or as an issue." The fold after phase 3 (`a325d32e`) added the bullet at `frame/design.md:59` under *Scope*, *Out*. That bullet names `RoleEvent`'s `text`, `firstOf`, `PERMISSION_TEXT_CHARS` and `PERMISSION_CUT_MARK`, and says "Issue #254 takes it". Issue #254 stands open, titled "refactor: a permission request's text has no reader once the role-less path is gone". So the memo says the decision is still open, while the frame records it as made. The sealer and the settle read the memo for what is still owed, and this paragraph sends them to decide something already decided.

The first search printed this line and `trail/phases/phase-3.md:35`. The phase record states what the frame held when phase 3 ended, before the fold, so it stays. The second search printed only `frame/design.md:59`. Both searches are a sample under contract rule 12. The fix rewrites the last sentence of the paragraph alone.

```markdown
The text a permission request carries for a person has no reader left since phase 3: `RoleEvent`'s `text` on a `permission` event, and `adapters/claude.ts#firstOf` with `PERMISSION_TEXT_CHARS` and `PERMISSION_CUT_MARK`, which cut it. The daemon now reads a request's action and path for the grant, and its tool and action for a refusal's row. Taking the text out changes the adapter's event, which the fake adapter, its cases and the Claude adapter's cases share. `frame/design.md` *Scope*, the list *Out*, leaves it to issue #254.
```

### 3. The changelog says every session the daemon starts has a role, and the refresh of an account's usage has none

```seal
severity: should
location: `seal/threads/1795610690-224-the-ask-section-goes/changelog.md:6`
evidence: executed `grep -rn -F 'Every session the daemon starts' seal/threads/1795610690-224-the-ask-section-goes/` at `bf1e81fb`; read `apps/desktop/src/daemon/adapters/claude.ts:100-102`, `apps/desktop/src/daemon/adapters/adapter.ts:44`, `apps/desktop/src/shared/protocol.ts:869`, `seal/threads/1795610690-224-the-ask-section-goes/frame/design.md:21`, `seal/threads/1795610690-224-the-ask-section-goes/frame/design.md:129`
```

Why it matters: `changelog.md:6` says "Every session the daemon starts has a role, and its role's grant allows or refuses each call." The daemon still starts one session with no role, the refresh of an account's usage. `claude.ts:102` launches it as `"refresh"` when the adapter is given no role, and `protocol.ts:869` says the daemon starts that session "with no role, no tool, one turn and no transcript". The work item's own records say so as well: `frame/design.md:21` says "A refresh of an account's usage has no role", and the `to` of the *Options for launching Claude Code* operation at `frame/design.md:129` says "A refresh of an account's usage has no role and holds no tool". The changelog fragment becomes the release notes, so a person reads the false universal there. The refresh holds no tool and asks for no call, so what the bullet means is that no session waits for the person on a call. The fix says that, and names the one session with no role.

The search printed only this line. It is a sample under contract rule 12.

```markdown
- **No session waits for the person to allow a call.** Every session of a chain's stage has a role, and its role's grant allows or refuses each call; the refresh of an account's usage, which has no role, holds no tool. The card with "Allow" and "Refuse", the line in the inbox that waited on a call, and the notification of a call are gone.
```

### 4. An acceptance row names `view.test.ts` cases on `sessionName`, and no case calls it

```seal
severity: should
location: `seal/threads/1795610690-224-the-ask-section-goes/frame/design.md:73`
evidence: executed `grep -c "sessionName" apps/desktop/test/*.ts` at `bf1e81fb`, which printed 0 for every file; read `apps/desktop/test/view.test.ts:805-811`, `apps/desktop/test/view.test.ts:866-871`, `apps/desktop/test/view.test.ts:3630-3634`
```

Why it matters: the *Verifiable how* cell of the row "The window says no "Asked"" names "`view.test.ts` cases on `sessionName`, `archivalOf`, `removalOf`, `runningSessions`, `daemonEnding` and `machineQueue`". No test file imports or calls `sessionName`. Its words are pinned through the other functions' cases: "Proofer, round" in the cases of `archivalOf` (`view.test.ts:805`, `811`), "Session 5" in the case of `runningSessions` (`view.test.ts:866`), and "Crafter, fix pass" and "Session 9" in the case of `machineQueue` (`view.test.ts:3630-3631`). A sealer that checks this row looks for cases of `sessionName`, and finds none. What holds the fallback is only these cases, which is worth saying. `trail/phases/phase-3.md` line 26 states the six `view.ts` mutants this rests on, and does not name a case of `sessionName`. The fix rewrites the cell's first clause alone.

```markdown
`view.test.ts` cases on `archivalOf`, `removalOf`, `runningSessions`, `daemonEnding` and `machineQueue`, which read the names `sessionName` gives (no case calls `sessionName` itself), and the `accounts.test.ts` cases of the refusals that read `daemon.ts#runningUnder` (lines 769 and 1018 at `f5a6c07f`).
```

## Confirmations

What matched: the view's foot. `index.html:771-772` holds `<ul id="view-chain" aria-label="The daemon's chain" hidden>` between `#view-scroll` and `#view-seal`, and no `#ask`, `#ask-form`, `#ask-prompt`, `#ask-account`, `#ask-submit` or `#headless`. `view.ts#chainList` gives `drawn` as `gate !== null || lines.length > 0`, and `work-item-view.ts#showChainList` sets `hidden` from it inside the draw that `headlessKey` guards. The permission card's styles are gone. This was executed with the first search of *User scenarios & acceptance*, which printed nothing, and with `test/view.test.ts`, which passed. The built-app case of `approval-line.test.ts` was read, not run.

What matched: the protocol and the daemon. `ask`, `asked`, `answerPermission`, `PermissionAsk` and `WorkItem.permissions` are gone, and so are the handlers of the two messages (`daemon.ts`, the removed `case "ask"` and `case "answerPermission"`). `handle` drops an unknown type at `daemon.ts:1643-1644`. `beginHeadless` takes a `RoleStage` and no `first`. `HeadlessSession.role` is what `verdictOn` reads at `daemon.ts:2156` and what the adapter is given at `daemon.ts:2180`. `verdictOn` takes a `RoleStage` and has no `person` answer. The acceptance searches of "No client starts a session by hand" and "No call waits for the person" print what their cells say. This was executed with `git grep` and with `test/daemon.test.ts -t "headless sessions|the caps on the machine"`, where 74 cases passed.

What matched: `Daemon#startRoleSession` at `daemon.ts:2860-2887`. It is public and no client message reaches it. It refuses an empty prompt, an adapter that lacks `role-tools` or `permission-requests`, an account the daemon keeps none under, and a work item `whyNoRun` refuses, and it starts nothing on any of them. It begins the session outside any chain at the rank `first-stage`, and its doc comment says that no client message starts a session, as *Data & interfaces* says. The `ask` handler read `whyNoRun` through `worktreeFor`, and this method reads it directly. So a work item nothing runs in is refused as before, and the cases of an archived work item and of one being deleted pin it (`daemon.test.ts`, `ARCHIVED` and `DELETING`).

What matched: the Claude adapter. `start` throws before `located()` where it is given neither a role nor a refresh (`claude.ts:101`), and `claudeArgs` takes a role's launch or `"refresh"`, with the `--disallowedTools` branch gone. Where a role and a refresh are both given, the role wins, as it did before the diff. This was executed with `test/claude-adapter.test.ts`.

What matched: the queue and the window's words. `QueueRank` is `"running-chain" | "first-stage"` (`agent-queue.ts:11`). `runningUnder` says `the <role>'s session in "<title>"`. `view.ts#sessionName` names a session by its chain's stage, then by `ROLE_STAGE_SAYS`, then as "Session <n>". This was executed with `test/accounts.test.ts test/machine.test.ts`, where 82 cases passed, and with the queue case of `test/chain.test.ts`, which passed. The fallback names the `ruling` stage "Orchestrator, judgment" between `machine` and `inbox`, since `runRuling` launches it as `ORCHESTRATOR` (`daemon.ts:3299`). That is the role and the stage `ROLE_STAGES` pairs it with, as Scope item 9 states, and Scope item 12 draws the dialog again at the `inbox` that names it "Orchestrator, ruling".

What matched: the rule changes. Every operation under `frame/design.md` *Rule changes* was placed by the plugin's `skills/settle/scripts/rule_changes.py#apply_op` into copies of the six documents as they stand at the target. Each edition kept its English edition's count of headings and of table rows, and the docs search of *Removes* "Policy sentences" printed nothing over the copies. This was executed (*Probes*).

What matched: the last look. `last-look.ts` no longer reads `permissions`, and a look holding the field, valid or `"none"`, reads as the work item without it. This was executed with `test/last-look.test.ts`.

The new tests were read against their groups. Each holds a fact the frame states. "starts no session at a message of a client" holds the acceptance row "No client starts a session by hand". "launches nothing given neither a role nor a refresh" holds the `claude.ts` item of *Data & interfaces*. The `chainList` case and the `approval-line.test.ts` case hold the row "A work item with no daemon chain shows the seal's place alone". "takes back nothing at a request its session withdrew" holds the *Removes* row of the role-less cases. No earlier case of `daemon.test.ts` covers an unknown message type, nor does any case of `claude-adapter.test.ts` cover a launch given neither a role nor a refresh.

One gap names no frame fact and is no finding. The loop over `WORK_ITEMS` in `apps/desktop/test/screenshots.test.ts:668-676` types the setup's end code for a made work item whose setup is `succeeded`, and no made work item has that value now. `gaps.md` *Not done*, first paragraph, says so, and narrowing the type of `WORK_ITEMS`' `setup` to what a made work item can take would remove the branch.

One coordinate of `frame/plan.md` *Overlap with the release* changes once the base is merged. The row "#237 and #235" says "None" for where both change. At the target that holds. `release/v0.0.5` has since taken #235 (`f5ee5ba7`), which changes `daemon.ts`, `test/role-bundle.test.ts` and `test/chain.test.ts`, three files this work changes. `git merge-tree --write-tree` of the target and `origin/release/v0.0.5` exited 0 with no conflict (executed). #235's design changes only *Code runs the order, the orchestrator judges* in `docs/architecture.md` and its Korean edition, which no operation of this work names (executed, `git show` of its `frame/design.md`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The built-app files this work changes: `test/machine-dialog.test.ts`, `test/role-bundle.test.ts`, `test/approval-line.test.ts` and the screenshot run. This round read them and ran none, since no close needed them | `apps/desktop/test/machine-dialog.test.ts`, `apps/desktop/test/role-bundle.test.ts`, `apps/desktop/test/approval-line.test.ts`, `apps/desktop/test/screenshots.test.ts` | the orchestrator's broad gate |
| The screenshots of the view's right column in every theme, which the issue's last *Done when* line and the acceptance row "The screenshots in every theme" ask the pull request to carry | `gaps.md` *Not verified*, first row | the orchestrator, before the pull request's body carries the files |
| The suite, the typecheck and the documents' check: the crafter handed over with the broad gate labelled unverified (`gaps.md` *Not verified*, second row), and that label is honest | `seal/config.json` `Broad gate` | the orchestrator's broad gate |
| The tree once `release/v0.0.5`, which took #235 and #245 since `ab7a5730`, is merged: the merge is clean, and no case ran on it | `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/test/role-bundle.test.ts`, `apps/desktop/test/chain.test.ts` | the orchestrator's broad gate, after the merge |
| The phases' `seal mutate` and seen-red claims (`trail/phases/phase-1.md` lines 16-19, `phase-2.md` lines 20-22, `phase-3.md` lines 22-27): read, and none re-executed | `trail/phases/` | the sealer, who weighs them as the crafter's account |
| Whether a built-app case of a stage session's line, its "Stop" and its error output, is owed now that `test/ask-section.test.ts` is gone | `gaps.md` *Not verified*, sixth row | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `python3 -I test_tmp_rule_changes.py <clone>`, in the round's scratch directory, which parses `frame/design.md` with `rule_changes.py#parse` and applies each operation with `#apply_op` to copies of `docs/architecture.md`, `docs/design.md`, `docs/product.md` and their `.ko.md` editions | no parse error, every operation placed, and headings and table rows equal across editions (`architecture` 27 and 124, `design` 15 and 383, `product` 15 and 36). The *Removes* "Policy sentences" search over the copies exited 1, with no line |
| `node scripts/test-in-electron.mjs test/view.test.ts test/last-look.test.ts test/claude-adapter.test.ts`, in `apps/desktop` of the branch worktree | exit 0, 3 files, 663 passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "headless sessions\|the caps on the machine"` | exit 0, 74 passed, 298 skipped |
| `node scripts/test-in-electron.mjs test/accounts.test.ts test/machine.test.ts` | exit 0, 2 files, 82 passed |
| `node scripts/test-in-electron.mjs test/chain.test.ts -t "starts the sessions that wait for the machine in their order\|already running"` | exit 0, 1 passed, 168 skipped |
| `git merge-tree --write-tree --name-only HEAD origin/release/v0.0.5`, in the branch worktree | exit 0, no conflicted path |
