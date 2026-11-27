# Review round 2: 1795739977-244-207-runner-cases-wait-on-what-they-read

```seal
target: 8199f124, fixes dbe6a8c9..8199f124
```

This is a verifying round. The range `dbe6a8c9..8199f124` holds the release merge `c96548f3`, so the round reviewed two things. The first is the branch's own commits, which `git log --no-merges -p dbe6a8c9..8199f124 ^origin/release/v0.1.0` prints: the records commits `ae5079ab`, `822b0e61`, `623ce81e`, `e11cf2b3`, `19751f44` and `42c789b5`, and phase 4 (`7b2600e3`, `368c9999`, `8199f124`). The second is the merge's resolution, and `git show --cc c96548f3` prints no hunk, so git resolved no conflict by hand. The one file of this work that git merged on its own is `apps/desktop/test/role-bundle.test.ts`. `git diff e11cf2b3 c96548f3 -- apps/desktop/test/role-bundle.test.ts` (executed) adds #257's describe below the old-CLI case and changes nothing of that case's stand-in, rename or wait. The round reviewed none of the text the merge brought in from the base, and held this work's diff and records against the merged tree.

The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/gate.md`, `guarantee.md`, the four phase records and `trail/rounds/round-1.md` whole at `8199f124`. `seal/config.json` sets `Commit and pull request language` to English, so no `pr.<lang>.md` is owed. No `seal/parity.json` stands.

Carried from round 1 and not re-derived: what `built-app.ts#atRestAfterFailure` does after a passing case and after a failed one, and how `@vitest/runner` 4.1.12 orders `afterEach` hooks. `git diff --name-only dbe6a8c9 8199f124 -- apps/desktop/test/built-app.ts` printed nothing (executed), and `apps/desktop/node_modules/vitest` still links to 4.1.12, so those coordinates still point at the same code.

## Findings

### 1. The closing memo sends the reader to phase 3's table for each file's decision on the hook, and that table still leaves `records-dialog.test.ts` out

```seal
severity: should
location: `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/gaps.md:16`
evidence: read `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/trail/phases/phase-3.md:76`, `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/trail/phases/phase-4.md:5`, `apps/desktop/test/records-dialog.test.ts:45`; executed `git grep -n -F 'Item 4, by file' -- seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/` at `8199f124`
```

Why it matters: `gaps.md` states the present, and its paragraph under `## Not done` ends with "`trail/phases/phase-3.md` *Item 4, by file* gives each file's decision." A sealer or an orchestrator who follows that pointer reads `phase-3.md:76`: "`records-dialog.test.ts`, `screenshots.test.ts` | Left out. One case each". At `8199f124` that is no longer the decision for `records-dialog.test.ts`. The file registers the hook at `apps/desktop/test/records-dialog.test.ts:45`, and `trail/phases/phase-4.md` *The census, at HEAD `7b2600e3`* holds the decision for every file left out after the merge. Phase 4 chose to leave `phase-3.md` as written and carry the correction in its own record (`phase-4.md:5`). A phase record states what its phase found at its commit, so that choice holds for `phase-3.md`. The memo's pointer is present tense, though, and it now names one record where the decision stands in two.

The search printed `gaps.md:16` and `trail/phases/phase-3.md:69`, the heading the pointer names, and three lines of `trail/rounds/round-1.md`, which is a record of round 1's target and stays as written. A search on words is a sample: a pointer to phase 3's table written in other words would not show up in it. The paste-ready fix replaces the last sentence of the paragraph at `gaps.md:16`:

```markdown
`trail/phases/phase-3.md` *Item 4, by file* gives each file's decision at `a1ad6511`, and `trail/phases/phase-4.md` *The census, at HEAD `7b2600e3`* gives it for each file left out after the release merge `c96548f3`, where `records-dialog.test.ts` registers the helper.
```

```seal
verdict: fixed 7354b3c8
answer: The orchestrator replaced the last sentence of the paragraph at `gaps.md:16` with the round's text, so the pointer names phase 3's table at `a1ad6511` and phase 4's census for the files left out after the release merge. The fix touched the records alone.
```

### 2. Phase 4's census says `role-session.test.ts` holds no case, and it holds two

```seal
severity: should
location: `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/trail/phases/phase-4.md:27`
evidence: read `apps/desktop/test/role-session.test.ts:41-47`, `apps/desktop/test/role-session.test.ts:62-72`, `apps/desktop/test/role-session.test.ts:121`, `apps/desktop/test/role-session.test.ts:160`, `apps/desktop/test/role-session.test.ts:175`; executed `grep -n -E '^\s*(describe|it|test)(\.\w+)?\(' apps/desktop/test/role-session.test.ts` and `git grep -n -F 'holds no case' -- seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/` at `8199f124`
```

Why it matters: the census is the ground the sealer reads for *Scope* item 4 at HEAD, and the prompt for this round asks whether that census is right. Its row for `role-session.test.ts` reads "Left out. It holds no case, and the same search prints nothing for it." The file holds two cases, `it.skipIf(!RUN)` at `role-session.test.ts:160` and `it.skipIf(!REFUSAL)` at `:175`, in a describe that runs where `OWLERY_ROLE_RUN` is `1` or the refusal's stand-in is named (`:41-47`, `:62`). Each case drives a `Daemon` the file starts itself (`:121`) and opens no window. So the decision stands on the row's second ground: the search `git grep -n -E 'dialog|Dialog|menu'` prints nothing for the file (executed). The first ground is false, and a reader who checks it against the file finds a census that did not open the file.

The search for the sentence printed `phase-4.md:27` alone, and it is a sample on words. The paste-ready fix replaces the row:

```markdown
| `role-session.test.ts` | Left out. Its two cases (`:160`, `:175`) run only where the environment asks for a real role session or for the refusal's stand-in model, each drives a daemon the file starts with no window, and the same search prints nothing for it. |
```

```seal
verdict: fixed 7354b3c8
answer: The orchestrator replaced the row for `role-session.test.ts` at `trail/phases/phase-4.md:27` with the round's text, which names its two cases and the ground that holds. The fix touched the records alone.
```

### 3. The closing memo says no phase typechecked more than its files, and phase 4 ran `tsc --noEmit` over the project

```seal
severity: should
location: `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/gaps.md:9`, `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/trail/phases/phase-4.md:34`
evidence: read `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/frame/plan.md:38`, `apps/desktop/package.json:14`; executed `git grep -n -F 'nothing else' -- seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/` and `git grep -n -i -F 'typecheck' -- seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/` at `8199f124`
```

Why it matters: the row at `gaps.md:9` reads "each phase typechecked the files it changed and some of the files that import them, as *The phase boundary* of its record names, and nothing else". Phase 4's boundary (`phase-4.md:34`) says "`tsc --noEmit` over the project exited 0". That is the package's own `typecheck` script (`apps/desktop/package.json:14`), the typecheck that contract rule 2 and `frame/plan.md:38` give the orchestrator. So the two records state the same fact two ways, and the memo's "nothing else" is false. Phase 4 states its run honestly. The memo is the file the orchestrator reads for what is still owed, so the memo is what the fix changes. The row's answerer stays the broad gate. `7b2600e3` changed test code after the gate's run at `c96548f3` (`trail/gate.md`), so the broad gate is owed again at HEAD whatever phase 4 ran.

The two searches printed `gaps.md:9`, `frame/plan.md:38`, a `## Not judged` row of `trail/rounds/round-1.md`, and an unrelated "nothing else" in `frame/design.md:5`. `frame/plan.md:38` states the rule and stays. The searches are a sample on words. The paste-ready fix replaces the row at `gaps.md:9`:

```markdown
| The typecheck of the whole project at HEAD: phases 1 to 3 each typechecked the files it changed and some of the files that import them, and phase 4 ran `tsc --noEmit` over `apps/desktop` at `7b2600e3`, as *The phase boundary* of each record names. That run took the orchestrator's typecheck early and stands in place of none of it | the orchestrator's broad gate |
```

```seal
verdict: fixed 7354b3c8
answer: The orchestrator replaced the row at `gaps.md:9` with the round's text, which names phase 4's `tsc --noEmit` over `apps/desktop` and keeps the broad gate as the answerer. The fix touched the records alone.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the paragraph under `gaps.md` `## Not done` (`gaps.md:16`) and the `daemon-restart.test.ts` row of `trail/phases/phase-3.md` *Item 4, by file* hold round 1's paste-ready text word for word (read). `apps/desktop/test/daemon-restart.test.ts:175` is still the second case's `Page.reload`, before that case reads the window. `git diff --name-only dbe6a8c9 8199f124 -- apps/desktop/test/daemon-restart.test.ts` printed nothing (executed). This round's finding 1 is on the last sentence of the same paragraph. Phase 4 made that sentence incomplete. `822b0e61` did not.

```seal
confirms: round-1#2
```
What holds: `changelog.md:3` holds round 1's sentence (read). The mechanism it states still stands after the merge. The merge changed `apps/desktop/src/daemon/daemon.ts` around the notice read and did not change the read: `readOutside` starts `readAgentNotice` at a hello while a notice stands (`daemon.ts:972`), and the read raises `noticeAsks` before its first `await` and drops a stale answer (`daemon.ts:4857`, `daemon.ts:4862`). Read, together with `git diff e7737b7e 06222134 -- apps/desktop/src/daemon/daemon.ts`, which adds `storeNotice` beside `noticeAsks` and leaves `readAgentNotice` as it was (executed).

What matched: the phase 4 registration (`apps/desktop/test/records-dialog.test.ts:13`, `:15`, `:45`), read and executed. It is `afterEach(atRestAfterFailure(() => app))` inside the file's one describe, after the `beforeAll` that assigns `app` (`:39`), the same form as the other files. Escape closes the records dialog. No handler in the renderer prevents it: `grep -n -E "addEventListener\(\"(cancel|close|keydown)\"" apps/desktop/src/renderer/*.ts` prints no `cancel` listener and no `keydown` listener on a dialog, and for `records-dialog` only its `close` listener (`renderer.ts:2379`). No line of `renderer.ts` names `Escape` (executed). That agrees with phase 4's probe, where the hook closed the dialog the failed first case left open. The file ran once in this round's clone at `8199f124` and passed its 2 cases (*Probes*).

What matched: *Scope* item 4 and `changelog.md:7` hold at `8199f124` for every built-app file, executed and read. This round listed the `app` project's files by the regex `apps/desktop/vitest.config.ts` itself uses, `grep -l -E 'import \{[^}]*\bbuildApp\b[^}]*\} from "\./built-app"' apps/desktop/test/*.test.ts`. That gives 20 files, and each stands in phase 4's census list, `git grep -l -E 'BuiltApp|buildApp' -- test`. That list is a superset, since it also names helpers and a fixture. The files that register the hook are `chain-choice.test.ts`, `decisions-and-questions.test.ts`, `machine-dialog.test.ts`, `notification-click.test.ts`, `records-dialog.test.ts`, `terminal-basics.test.ts`, `theme-controls.test.ts`, `work-item-form.test.ts` and `work-item-menu.test.ts` (`git grep -l atRestAfterFailure -- test`, executed). For each file left out, the round read where it starts the app and how its describes hold their cases. `approval-line.test.ts` and `seal-back-view.test.ts` share one app, and they press no control of any of the window's 20 `dialog` elements: the ids they reference are `#view-detail`, `#inbox-lines`, `#back`, `#tabs`, `#repositories` and the like (executed, a `grep -o` of `#`-ids over them). `korean-input.test.ts` opens the form in `beforeAll` alone. `role-bundle.test.ts` starts a window only inside a case, one app for each (`:517`, and `:556` in the describe the merge added). `keep-awake.test.ts` starts its own app inside its one case. `screenshots.test.ts` holds one case in its built-app describe (`:1094`), and the merge added its move view (`:755-756`, `:834`) to that one case. `launch.test.ts` and `memory.test.ts` launch an app for each run inside a case, and only under their measuring variables. `daemon-restart.test.ts` is the frame's stated exception. Phase 4's census is right in every decision. Finding 2 is one false ground beside a true one.

What matched: *Scope* item 3 on the merged tree, read. Phase 3's census is dated to `a1ad6511`, and the merge brought two new places that press in the records dialog after `planRecords`. In `records-dialog.test.ts:132`, the second case waits until `#records-submit` is enabled before it reads or presses. The new move view of `screenshots.test.ts` waits on the same thing, with the move's text, at `:756`, before its leave presses Cancel at `:834`. `view.ts:2845` gives `submit: off` for a null plan, so the button is enabled only once the plan is drawn. Each new place therefore waits on the answer as drawn, as item 3 requires. No phase record lists them, and no reader is misled by that, because `changelog.md` says the census in `phase-3.md` covers the places that census found. `git diff e7737b7e 06222134 -- apps/desktop/src/renderer | grep -E '^[+-].*send\('` printed nothing (executed), so the merge added no request that item 3's list would have to hold.

What matched: the history phase 4 states (`phase-4.md:5`), executed. `git show a1ad6511:apps/desktop/test/records-dialog.test.ts` holds one case, and `fbd20166` (#312) is the commit of the base that changed the file.

What matched: `pr.md` and `frame/plan.md` row 4, executed and read. Each of the six quotes of `pr.md` is found once in `frame/design.md` (`grep -c -F`). Row 4's *Delivers* and *Verified by* cells name what `phase-4.md` records, and its Status cell names `7b2600e3`, the commit that registers the hook. `gaps.md:8` names the `app` project's files that no phase ran, and it matches the phase boundaries: the 20 files less those that phases 1 to 4 ran.

The suite's label is honest. `gaps.md` hands the files no phase ran and the typecheck to the orchestrator's broad gate. `trail/gate.md` names a run at `c96548f3`, and `7b2600e3` changed a test file after it. The broad gate is therefore owed again at HEAD. That run comes after the fix pass that closes the three findings above, and the sealer's spawn comes after it. All three findings sit in the work item's records alone.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether first attempts of `check` on the hosted runner stop failing the removal case, the register case, the old-CLI case and the presses phase 3 made wait | `frame/questions.md` Q1 | a measurement: the first attempts of later pull requests' `check` |
| Whether a press on a disabled control raises a `pointerdown` in the page | `apps/desktop/test/built-app.ts`, `gaps.md` *Not verified* | a measurement, as `gaps.md` states |
| The whole suite, the typecheck and the broad gate at the tree after `7b2600e3` | `seal/config.json` `Broad gate` | the orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| In a `git clone --no-local` of the branch at `8199f124` under the round's scratch directory, with the worktree's installed dependencies linked in: `cd apps/desktop && OWLERY_BACKGROUND=1 sh <scratchpad>/heavy.sh node scripts/test-in-electron.mjs test/records-dialog.test.ts`, with `ELECTRON_OVERRIDE_DIST_PATH` set as the spawn gives it | Exit 0: 1 file, 2 cases passed. This is a narrow run of the file phase 4 changed, not a probe of a claim of absence. No `test_tmp_*` file was written. |
