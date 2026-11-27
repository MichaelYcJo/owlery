# Review round 1: 1795739977-244-207-runner-cases-wait-on-what-they-read

```seal
target: dbe6a8c9 against origin/release/v0.1.0
```

The round reviewed the branch against its merge base with `origin/release/v0.1.0`, `e7737b7e`. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and the three phase records whole at `dbe6a8c9`; no `pr.md` stands yet. This is the first round, so no coordinate was carried from an earlier one, and every fact below was read or run this round. No `seal/parity.json` stands.

## Findings

### 1. The closing memo hands the orchestrator a cascade in `daemon-restart.test.ts` that the file's second case already prevents

```seal
severity: should
location: `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/gaps.md:16`, `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/trail/phases/phase-3.md:75`
evidence: read `apps/desktop/test/daemon-restart.test.ts:89-210`; executed `git grep -n -F 'reaches the two cases after it' -- seal/threads/` and `git grep -n -F 'daemon-restart' -- seal/threads/` at `dbe6a8c9`
```

Why it matters: the memo asks the orchestrator to decide whether to change the frame and register the hook in `daemon-restart.test.ts`. It states the reason for that decision as a fact: "a dialog the first case leaves open when it fails still reaches the two cases after it". The orchestrator reads that sentence and acts on it.

The claim does not hold. `daemon-restart.test.ts:116` is the first case, and it opens the daemon dialog. The second case, `daemon-restart.test.ts:169`, first reads `daemon.json` and writes it again, then calls `app.cdp("Page.reload")` at `daemon-restart.test.ts:175`. Only after that does it read the window, and at `daemon-restart.test.ts:183` it asserts that no dialog stands open. A reload replaces the document, so a dialog the first case left open is gone before the second case reads anything. The third case, `daemon-restart.test.ts:189`, runs after that reload. So the decision the memo puts to the orchestrator rests on a false premise. With the file as it stands, leaving the hook out costs nothing that the reload does not already cover.

The search for the sentence printed `gaps.md:16` and `trail/phases/phase-3.md:75`. The search for `daemon-restart` also printed `changelog.md:7`, which says only that the file does not register the hook, and that sentence holds. A search on words is a sample: a statement of the same claim in other words would not show up in it.

The paste-ready fix replaces the paragraph under `gaps.md` `## Not done`. Nothing is left to do for this file, so the fix pass may decide whether the paragraph stays under that heading:

```markdown
`apps/desktop/test/daemon-restart.test.ts` does not register *Scope* item 4's helper, since item 4 leaves out a file whose cases end the app, and its first describe's last case quits the app. A dialog that describe's first case leaves open when it fails does not reach the cases after it: the second case reloads the page (`apps/desktop/test/daemon-restart.test.ts:175`) before it reads the window, and the third runs after that reload. `trail/phases/phase-3.md` *Item 4, by file* gives each file's decision.
```

The row of `trail/phases/phase-3.md` *Item 4, by file*:

```markdown
| `daemon-restart.test.ts` | Left out. The first describe's last case quits the app, and *Scope* item 4 leaves out a file whose cases end the app. Its first describe's cases share the app and the first opens the daemon dialog, but the second reloads the page (`daemon-restart.test.ts:175`) before it reads the window, so a dialog the first leaves open when it fails is gone before a later case reads the window. `gaps.md` *Not done* names it. `a1ad6511` registered the hook there behind a check that the app's process still runs, and `6bf50a2c` took it back to build to the frame. |
```

```seal
verdict: fixed 822b0e61
answer: The orchestrator replaced the paragraph under `gaps.md` `## Not done` and the `daemon-restart.test.ts` row of `trail/phases/phase-3.md` *Item 4, by file* with the finding's paste-ready text. The paragraph stays under `## Not done` as the record of a file the helper does not reach. The decision the memo handed the orchestrator falls away: the hook stays out, as *Scope* item 4 says. Records alone change, so the sealer reads the close.
```

### 2. The changelog gives #207 a cause that the daemon's code rules out

```seal
severity: should
location: `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/changelog.md:3`
evidence: read `apps/desktop/src/daemon/daemon.ts:966-968`, `apps/desktop/src/daemon/daemon.ts:4816-4825`, `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/frame/design.md:32`, `seal/threads/1795739977-244-207-runner-cases-wait-on-what-they-read/trail/phases/phase-2.md:15-21`; executed `git grep -n -F 'after the page loaded anew' -- seal/threads/ apps/desktop/test` and `git grep -n -F 'begun before' -- seal/threads/` at `dbe6a8c9`
```

Why it matters: the fragment goes into the release notes. Its last sentence of the opening paragraph says the old-CLI case "lost its notice where a read of the CLI's version, begun before the case rewrote the version, ended after the page loaded anew". A person who reads that sentence learns a mechanism that cannot fail the case.

When the reloaded window says hello and a notice stands, `daemon.ts:968` starts a new read. That read raises `noticeAsks` before its first `await` (`daemon.ts:4817`). A read that ends after that point is dropped at `daemon.ts:4822` (`ask !== this.noticeAsks`), so it cannot take the notice away. The read that fails the case passed the hold before the case wrote it and read the version after the rewrite. It took the notice away before the reloaded window connected, and that window's hello then started no read. `frame/design.md` *Grounding*, cause 3, says this. Phase 2's probe shows it too: in the copy with the old stand-in, "The notice went before the reload" (`trail/phases/phase-2.md`, the first row of the table). "Begun before the case rewrote the version" is also too broad. A read begun after the hold was written is held, and that is the read the case relies on.

The two searches printed `changelog.md:3` alone, and they are a sample on words. The paste-ready fix replaces the last sentence of the opening paragraph of `changelog.md`:

```markdown
The old-CLI case of `role-bundle.test.ts` lost its notice where a read of the CLI's version passed the case's hold before the case wrote it, read the version the case had just rewritten, and ended before the page loaded anew connected to the daemon.
```

```seal
verdict: fixed 822b0e61
answer: The orchestrator replaced the last sentence of the opening paragraph of `changelog.md` with the finding's paste-ready sentence, which matches `frame/design.md` *Grounding*, cause 3. Records alone change, so the sealer reads the close.
```

## Confirmations

What matched: *Scope* item 1, the removal case's wait (`apps/desktop/test/work-item-menu.test.ts:1038-1040`), read. `renderer.ts#showRemove` (`apps/desktop/src/renderer/renderer.ts:1189-1243`) draws one `h3.work-item` and one `p.says` for each work item `#remove-work-items` lists. It writes `deleteSays(null, known)` under a loss still awaited, and `view.ts:1295` returns the same sentence whatever the work item is, so the case's `deleteSays(null)` matches it. The wait ends only once every loss is drawn, which is what `kept()` then depends on. A loss refused by the daemon leaves the sentence in place, so the wait fails rather than passes. The case keeps every assertion it had.

What matched: *Scope* item 2, the register case (`apps/desktop/test/work-item-menu.test.ts:694-697`), read. `renderer.ts#openRecords` clears `recordsDrawn` and draws the dialog with no plan before the case's `dialogOpen` returns. `view.ts`'s `recordsDialog` gives no files for a null plan, so no `.path` from an earlier opening can end the wait. `second` holds no `package.json`, so `records-place.ts#proposedBroadGate` returns null and `takeRecordsPlan` asks no second plan that would draw the files again.

What matched: `built-app.ts#formPlanOf` waits on what Create's place depends on, read. `renderer.ts#openWorkItemForm` sets `formPlan` to null before `showModal`, so `#work-item-worktree` is empty at each opening. `askPlanSoon` keeps the plan it holds until the next answer, and `view.ts#planAnswer` draws only the latest ask's answer. So the regex matches only once the plan of the title typed is drawn. `slugFor` gives only `[a-z0-9-]`, so the title cannot put a regex character into the expression. A title whose slug is empty would make the wait run out, and none of the callers passes one. The place of Create does not decide whether Create creates: `renderer.ts#createWorkItem` checks the plan by folder alone (`shownSetup`). So the wait guards the press's aim, which is what the census says it is for.

What matched: the two Cancel waits of the form (`apps/desktop/test/work-item-menu.test.ts:711`, `:723`) and the two Cancel waits of the delete dialog (`apps/desktop/test/machine-dialog.test.ts:443`, `apps/desktop/test/terminal-basics.test.ts:492`), read. At each opening the form draws an empty `#work-item-branch`, and `readDeleteLoss` writes `deleteSays(null)` into `#delete-says` before the dialog's lists are read. So each wait ends on the answer that the opening asked for. Phase 3 reports that the delete dialog's wait and `formPlanOf` survived their mutants on this Mac, because the answer was already drawn. Phase 3 says that and `gaps.md` hands it to `frame/questions.md` Q1. A survived mutant here shows that this Mac does not meet the race. It does not show that the wait is idle, and the code read above shows what each wait ends on.

What matched: case 7 of `apps/desktop/test/work-item-form.test.ts:241-252`, read. `askPlanSoon` clears its timer at each `input` event (`renderer.ts:1837-1840`), and one `evaluate` gives no timer a turn, so no plan of the text with the slash is asked. The assertion holds the same two values.

What matched: `atRestAfterFailure` (`apps/desktop/test/built-app.ts:418-437`), read. After a case that passed, it returns at its first line, so it slows no passing case. After a failed case it can only add an error to that case. In `@vitest/runner` 4.1.12, `failTask` appends the error, and the case's first error stays first (`dist/chunk-artifact.js:2966-2980`), so the hook cannot hide a failure. Vitest resolves `sequence.hooks` to `"stack"` (`vitest/dist/chunks/coverage.DM_a_rWm.js:479`), and `getSuiteHooks` reverses `afterEach` (`chunk-artifact.js:2569`). So in `terminal-basics.test.ts` the hook runs before the file's own hook, as phase 3 says. One cost goes unnamed in the records. `callSuiteHook` runs the hooks in a loop that stops at the first throw (`chunk-artifact.js:2628-2630`). So where Escape closes nothing, or the window does not answer, the file's own hook, which closes the failed case's panes, no longer runs. The later cases then meet a modal dialog that stays open, and they fail on it as they would without the hook, so this round opens no finding for it. The hook also runs under Vitest's default 10-second hook timeout (`coverage.DM_a_rWm.js:539`), which ten presses of two seconds each could exceed only where every press changes what stands open and none clears it.

What matched: *Scope* item 4's registrations, read. Every file that registers the hook starts its app in a `beforeAll` and stops it in an `afterAll`, and no case in those files ends the app or starts another. The files left out each hold one built-app case, open no dialog or menu, or, in `daemon-restart.test.ts`, end the app in a case, which *Scope* item 4 leaves out. The crafter's note that `daemon-restart.test.ts` stands without the hook complies with item 4. Finding 1 is about the reason the memo gives, not about the decision.

What matched: *Scope* items 5 and 6, read. The stand-in at `apps/desktop/test/role-bundle.test.ts:510` reads the version before it looks at the hold, and the case renames `version.next` over `version` in one folder, so the rewrite reaches a read whole. The `.catch` on the reload's wait reads the status line and throws the wait's own error unchanged where the page cannot be read. `BuiltApp.click` adds a capture listener for `pointerdown` that stops nothing, and `missedPress` returns nothing where the page cannot be read, so item 6 changes no case's result. `git grep -n 'never showed' -- apps/desktop/test` finds no case that asserts on the message (executed).

What matched: the census of *Scope* item 3, read and executed. `grep -n 'send(' apps/desktop/src/renderer/*.ts` (executed) lists, besides the requests item 3 names, two senders that the frame's search does not print, `renderer.ts:459` (`ask`) and `renderer.ts:923` (`askAccounts`). Both send what a dialog's button writes, and the answer closes the dialog or shows a refusal. Neither fills a dialog's content, so neither is in the class. Every `showModal` in the renderer was read for a request at its opening, and none outside item 3's list sends one. Over the test files, `grep -n -E 'click\(.#(delete|remove|records|rename|settings)-'` and `grep -n -E 'work-item-(create|cancel)'` (executed) print two presses that the census tables do not name: `apps/desktop/test/chain-choice.test.ts:144` and `apps/desktop/test/work-item-menu.test.ts:576`. Each follows a press in the same case that waited on its answer (`chain-choice.test.ts:120`, `work-item-menu.test.ts:574`), and no request is open in between, since the chain dialog's Cancel sends none. The tables cite the wait that precedes a group of presses, so the round reads these two as covered and opens no finding.

What matched: `gaps.md` *Not verified*, the second row, executed. `grep -l -E 'import \{[^}]*\bbuildApp\b[^}]*\} from "\./built-app"' apps/desktop/test/*.test.ts` lists the `app` project's files. The files the row names are those the phase records did not run. Three files of the `unit` project also import `built-app.ts`, now with its import of `src/daemon/worktrees`: `gate.test.ts`, `chain.test.ts` and `daemon-client.test.ts`. No phase ran them, and the row restricts itself to the `app` project, so they stand with the broad gate like the rest. The suite stays labelled `unverified` in each phase's boundary and in `gaps.md`, and that label is honest.

What matched: the release, executed. `git diff --name-only e7737b7e origin/release/v0.1.0` and the branch's own list share no file. The base has moved to `7c6cba4a` since the branch was cut. It now holds the records of `1795732582-300-202-258-241-timed-cases-hold-under-load` and `1795739989-304-a-new-issue-is-placed-by-a-written-rule`, and their `frame/design.md` changes nothing this item cites. `frame/plan.md` *Overlap with the release* is dated to `e7737b7e` and holds at that commit. Every run the phases name was taken at the old base. That base lacks #308's change to `pnpm-lock.yaml` and to the node-pty patch.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether first attempts of `check` on the hosted runner stop failing the removal case, the register case, the old-CLI case and the presses phase 3 made wait | `frame/questions.md` Q1 | a measurement: the first attempts of later pull requests' `check` |
| Whether a press on a disabled control raises a `pointerdown` in the page, which decides whether a click that follows such a press is named against the wrong press | `apps/desktop/test/built-app.ts:299-320` | a measurement, as `gaps.md` *Not verified* states |
| The whole suite, the typecheck and the broad gate, at a tree that holds the moved base | `seal/config.json` `Broad gate` | the orchestrator's broad run |

## Probes

No probe ran this round. Reading settled each question above, and the commands named on the `evidence:` lines and in *Confirmations* are searches, not runs of the suite.
