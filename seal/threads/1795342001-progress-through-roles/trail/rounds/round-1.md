# Review round 1: 1795342001-progress-through-roles

```seal
target: 17deb2b against origin/release/v0.0.2
```

The range is `origin/release/v0.0.2...17deb2b`, with the merge base at `71d035e`. This round read issue #46 and its one comment, then `docs/design.md`, `docs/product.md` and `docs/architecture.md` where the build touches them, then the work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the three phase records, each whole at `17deb2b`. No `pr.<lang>.md` stands: `Commit and pull request language` is English. There is no earlier round, so no fact was carried. Every fact below was opened at `17deb2b`. `seal/parity.json` is not declared.

## Findings

### 1. The line under the places for a failed stage is a clause with no capital and no full stop

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:456`, `apps/desktop/test/view.test.ts:1382`, `apps/desktop/test/view.test.ts:1385`, `apps/desktop/test/approval-line.test.ts:228`, `apps/desktop/src/shared/protocol.ts:315`, `seal/threads/1795342001-progress-through-roles/frame/design.md:98`, `seal/threads/1795342001-progress-through-roles/frame/design.md:157`, `seal/threads/1795342001-progress-through-roles/changelog.md:7`
evidence: read `apps/desktop/src/renderer/view.ts:456`, `apps/desktop/src/renderer/view.ts:473-484`, `apps/desktop/src/daemon/daemon.ts:2176-2190`, `apps/desktop/src/daemon/chain.ts:817`, `docs/design.md:458-467`, `apps/desktop/test/view.test.ts:1377-1385`, `apps/desktop/test/approval-line.test.ts:226-228`
```

Why it matters: `docs/design.md` *The voice of the window's words* opens with "A whole sentence that names the thing". The line under the places is a sentence the window speaks, and for a failed stage it reads "Proofer: the session was stopped at a request before it finished", with no full stop. `view.ts:456` passes the stage's `failure` through unchanged. The daemon writes that value as a clause with no capital and its full stop stripped (`daemon.ts:2176-2190`, `chain.ts:817`), because #41 wraps it in its own sentence: "Review round 1 failed: the session was stopped at a request before it finished." The same section holds lines that are whole sentences. A question reads "Proofer: Which base does the hotfix merge into?". A verdict's reason reads "Sealer: The broad gate did not run at the head." So the one line a person reads to learn why a stage failed is the one that breaks the window's voice. The frame chose to show the clause as it is (`frame/design.md:157`). That sentence is the frame's, and the policy outranks it. Its grounds cite the protocol's comment at `protocol.ts:315`, which calls `failure` "a sentence the window shows as it is". The daemon at `daemon.ts:2176-2190` does not write a sentence, so that comment is wrong.

The fix makes the window turn the clause into a sentence where it puts the clause under the places. The fix pass also owes the statements the snippet does not reach. Those are the expectations at `view.test.ts:1382` and `:1385` and at `approval-line.test.ts:228`, and the comment at `protocol.ts:315`, which no longer holds once the window changes the text. In the work item's records they are the example in `frame/design.md:157`, scenario 12 at `frame/design.md:98`, and the example in `changelog.md:7`. `trail/phases/phase-3.md` is history and stays as it is.

```ts
// apps/desktop/src/renderer/view.ts, beside `counted`
/** A clause the daemon wrote with no capital and no full stop, as the window says it under the places: its first letter in capital and a full stop at its end where it ends with none. */
function asSentence(clause: string): string {
  const text = clause.trim();
  if (text === "") return text;
  const opened = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.?!]$/u.test(opened) ? opened : `${opened}.`;
}

// apps/desktop/src/renderer/view.ts:456, in `byChain`
if (newest.state === "failed") return { state: "failed", note: "Failed", label: `${marks.label(newest.round)} failed`, since: null, text: newest.failure === null ? null : asSentence(newest.failure) };

// apps/desktop/test/view.test.ts:1382 and :1385
expect(under(round)).toEqual(["Proofer: The session reached its time limit and was stopped."]);
expect(under(fix)).toEqual(["Crafter: The session reached its time limit and was stopped."]);

// apps/desktop/test/approval-line.test.ts:228
expect(await app.evaluate(`[...document.querySelectorAll("#view-detail section.approval .under")].map((under) => [under.className, under.textContent])`)).toEqual([["under failed", "Proofer: The session was stopped at a request before it finished."]]);

// apps/desktop/src/shared/protocol.ts:315
/** Why the stage `failed`, as a clause with no capital and no full stop, which the daemon's sentence of the chain wraps and the approval line says as a sentence, and null in the other two states. */
```

### 2. The work item says the tests hold the colour of a failed place's line, and the cases hold only its class

```seal
severity: should
location: `apps/desktop/test/approval-line.test.ts:228`, `seal/threads/1795342001-progress-through-roles/gaps.md:23`, `seal/threads/1795342001-progress-through-roles/pr.md:9`
evidence: read `apps/desktop/test/approval-line.test.ts:208-229`, `apps/desktop/test/view.test.ts:1376-1400`, `apps/desktop/src/renderer/index.html:167-168`, `apps/desktop/src/renderer/shared.ts:284`; executed `git grep -n getComputedStyle -- apps/desktop/test/approval-line.test.ts apps/desktop/test/view.test.ts`, which printed nothing
```

Why it matters: `gaps.md:23` says "The cases of `test/view.test.ts` and the last case of `test/approval-line.test.ts` hold the words and the colour of that line of text". `pr.md:9` tells the owner "The tests hold their words and their colour". The last case of `approval-line.test.ts` asserts the element's `className`, `"under failed"`, and its text (`:228`). `view.test.ts` asserts the data that `approvalPlaces` returns and draws nothing. No case reads a computed colour. The colour comes from one rule, `.approval .under.failed { color: var(--state-failed); }` at `index.html:168`. A build with that rule removed passes every case, and the failed line then shows in the muted ink of a question. Scenario 12 and `docs/design.md`'s row "The approval line" each state that colour, and no screenshot shows the line (`gaps.md` *Not done*). A test is the only thing that could hold it, and none does. That rule also colours a withheld verdict's reason, so one assertion holds both.

The fix adds the assertion, which makes both sentences true. Per contract rule 15 it is shown red with only the rule at `index.html:168` removed. Where the fix pass chooses not to add it, `gaps.md:23` and `pr.md:9` are rewritten to say that the cases hold the class and that nothing holds the colour.

```ts
// apps/desktop/test/approval-line.test.ts, after line 228
// The line takes the colour of a failure as the theme resolves `--state-failed`, and not the muted ink of a note.
expect(
  await app.evaluate(`(() => {
    const under = document.querySelector("#view-detail section.approval .under");
    const probe = document.createElement("span");
    probe.style.color = "var(--state-failed)";
    under.parentElement.append(probe);
    const failed = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(under).color === failed, failed !== getComputedStyle(document.querySelector("#view-detail section.approval .note")).color];
  })()`),
).toEqual([true, true]);
```

The probe span takes its colour from the page's custom property and nothing else. It assumes only that the section is drawn, which the lines above already wait for.

### 3. The pull request part answers the issue's "committed records" with a read that also takes what is not committed, and does not say so

```seal
severity: should
location: `seal/threads/1795342001-progress-through-roles/pr.md:10`, `seal/threads/1795342001-progress-through-roles/frame/design.md:51`
evidence: read `apps/desktop/src/daemon/chain-records.ts:87-97`, `apps/desktop/src/daemon/daemon.ts:509-539`, `apps/desktop/test/daemon.test.ts:4072-4103`, `seal/threads/1795342001-progress-through-roles/frame/design.md:60`; executed `gh issue view 46 --json title,body,comments`
```

Why it matters: the fourth *Done when* line of issue #46 reads "The line is drawn from the daemon's progress and the committed records." The daemon reads `frame/design.md`, `trail/rounds/`, `trail/gate.md` and `guarantee.md` from the worktree whether or not they are committed. This is in `chain-records.ts:87-97`, called from `daemon.ts:535`, and the case at `daemon.test.ts:4072-4103` asserts it while the files are untracked. So the sealer's place can read "Sealed" from a `guarantee.md` that the sealer has written and nobody has committed yet. The pull request check would not read that file. `frame/design.md:60` chose this read on purpose, to match how `decisions.md` is read, and `changelog.md:6` says "committed or not". The two places that set the build against the issue's line do not say it. The frame's table puts *Done when* 4 on *Scope* items 1 to 5 (`frame/design.md:51`). `pr.md:10` answers the line with "The daemon reads the work item's records in its worktree every few seconds". Rows 3 and 5 of the same table say where the build departs from the issue, and this row does not. The owner and the sealer read this row to decide whether the line holds. The departure has to stand in words for them to weigh it.

```markdown
<!-- seal/threads/1795342001-progress-through-roles/pr.md:10, the second cell -->
The daemon reads the work item's records in its worktree every few seconds, committed or not, as it reads the work item's questions: whether a design stands, the round records, the gate's last run and the sealer's last verdict. The issue's line names the committed records. A record written and not yet committed, such as a guarantee before its commit, shows on the line too. It sends them with the work item, beside the chain #41 keeps. The window composes the four places from those facts, the branch's commits and the open questions. A case holds that a pane's state and a session with no role change no place

<!-- seal/threads/1795342001-progress-through-roles/frame/design.md:51, the second cell -->
*Scope* items 1 to 5, and scenario 9. The daemon reads the records in the worktree, committed or not (*Scope* item 2), where the issue names the committed records
```

## Confirmations

What matched: the merge `0dc13e8` keeps both sides in each of the six files that conflicted. Read: `git show --remerge-diff 0dc13e8`. The daemon's protocol import is the release's list with `Recorded` added. The release's `decision-record.ts` import holds every name this branch imported. `index.html` holds both blocks of rules. `shared.ts#detail` draws the agent's questions through #41's `askedPart` and then the approval line. The view's protocol import takes `Recorded`, and `68b5fd4` later adds `ChainStage` and `ChainStageKind`. In `daemon.test.ts`, `WORK_ITEM_FIELDS` names `behindBase`, `chain` and `recorded`, and the two look cases take the release's `stateQuestions` with this branch's `asLooked`. The merge also changes one assertion, in `view.test.ts`, to `expect(RECORDED.chain).toBeNull()`, and its commit message names that change.

What matched: phase 3 rewrites two of #41's cases in place at `apps/desktop/test/view.test.ts:1454-1472` and `:1490-1503`. Read. The new cases state the rule of `frame/design.md` *Scope* item 9 and the `add` on `docs/product.md` in *Rule changes*. A running chain's line names its stage and counts its age from the stage's start where the line's pane works, finishes or is absent. It keeps the question, the call to allow or the pane's question where one waits. Between two stages the line is as #41 left it. The rewritten cases keep #41's other expectations: a search gives the branch, and a reviewed or parked chain gives what the line says without a chain. `runningStage` at `view.ts:139` reads only the newest stage of a running chain. A chain that a restarted daemon reads as stopped, whose newest stage still says `working`, therefore names no stage and marks no place. The expectation in the rewritten case covers it.

What matched: no unsettled design's *Rule changes* lost its `from` text to the two editions of `docs/design.md` changing in place. Executed: `grep -cF` of each `from` that `seal/threads/1795343000-background-window-unseen` and `1795388701-agent-choices-and-behind` give for those two files. Each text stands once at `17deb2b`. #41's `from` on the row "The seal's place" stands too, because this branch does not touch that row. Phase 3 changed the row "The approval line" directly and not through *Rule changes*. That has grounds in the repository's own policy. `docs/design.md` *Principles* 8 has a form stated "here first, so that no work item draws its own". The head of *Principles* asks for the document to change "in the same pull request". `test/themes.test.ts` fails a property the document does not name. `frame/plan.md` records the choice in *Alternatives considered* and in *Judgments of the run* against *Principles* 8. Both editions hold 15 headings and 375 table rows. Executed: `grep -c '^#'` and `grep -c '^|'`.

What matched: the screenshots show what the built app draws. All twelve were viewed, the four that phase 3 did not read among them (`gaps.md:16`). Each view file shows Framer "Not started", Crafter "3 commits" with the finished mark, Proofer "Round 1" with the mark of work, and Sealer "Not started" with the seal's place. Each is in the theme's form: rules in Night watch and Desk, four ruled boxes in Register. Each inbox file shows "Proofer, round 1" under "Sort the history by date" with an age, and the same approval line in the preview. The view's work item has a running chain, a failed prompt and a prompt that waits on a call to allow. No single step of the daemon makes that state. The run reaches it through messages a window sends, in an order a person can follow: `getSeal` first, then two `ask` messages. The `ask` handler at `apps/desktop/src/daemon/daemon.ts:1154-1175` refuses nothing while a chain runs, and *Not judged* asks whether it should. The view files also list the round's own prompt, "Review round 1 of the work item ...", among the view's prompts. That is how #41 draws a role session's prompt, and this diff does not change it.

What matched: the *Done when* lines that `pr.md` says hold in part or are not built say so accurately. Read: issue #46, `pr.md:9` and `:11`, and `apps/desktop/src/daemon/role-grants.ts:126-147`. `verdictOn` answers every role session's request by its grant, so no stage waits on a call to allow. No gate stage runs until #42. A failed stage shows "Failed" and not as waiting. The fifth line allows "or the issue records why that waits", and the issue's comment of 2026-11-22 records it, so "Not built" with that reason meets the line. The first row says openly that the line has one place per role and not one per stage. The policy row of `docs/design.md` and `docs/product.md` *The seal* gives that form. Whether the owner takes it is `frame/questions.md` Q1, which stays open.

What matched: `gaps.md:15`, read. `approval-line.test.ts:201` waits until the second row of Beta's line reads "Proofer, round 1". With the stage taken out of `view.ts:1213`, Beta's line has no live pane, because its shell pane ends at once, so its second row falls to the subject of its newest commit. That commit is the chain's routing commit. The wait therefore times out, and the case goes red on the line's assertion.

What matched: `gaps.md:18`, read. `apps/desktop/test/fixtures/sample-cli.sh` reads the prompt as the second line of its input. A round's prompt holds "Review round 1 of the work item" (`apps/desktop/src/daemon/chain.ts:372`). Without the new arm that prompt falls through to `exit 1`, the session fails, the round fails, and the run's wait for "Round 1" at `apps/desktop/test/screenshots.test.ts` times out after 20 seconds.

What matched: `apps/desktop/src/renderer/view.ts:397` types `STAGES` as a `Record` over `ChainStageKind`, so a kind with no row does not compile. Read. The places' texts reach the page through `shared.ts#part`, which sets `textContent`, so a question, a reason or a failure is never markup. Read. Each line under the places is a flex item of `.detail section` (`index.html:149`), so two such lines stand on two rows. Read. `chain-records.ts` treats a link and anything that is not a plain file as no frame, no round and no record, and reads the two record files through `repositoryFileText`. It returns nothing for a record whose reader refuses any line, as the pull request check does. Read, and executed in the narrow run below.

A case that holds no fact of the frame: the name of the last case of `apps/desktop/test/approval-line.test.ts:208` says "in the colour of a failure", and the case pins the class. Finding 2 is about that same gap, so this sentence opens no finding of its own.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the owner takes the line's form and words: the note under each name, "Not started", "Gate passed" and the other words, and Night watch's and Desk's rules, which are a few pixels long in the 387px column of the view files | `seal/threads/1795342001-progress-through-roles/frame/questions.md` Q1, the committed screenshots | the owner, on the pull request |
| Whether the daemon should refuse an `ask` in a work item whose chain runs, as it refuses a chain in a work item where a session works. The screenshot scene depends on it. It is #41's behaviour and outside this diff | `apps/desktop/src/daemon/daemon.ts:1154-1175` | the orchestrator, against #41's frame |
| The whole suite, the typecheck of every package and the document checks of the broad gate at `17deb2b`, after the merge `0dc13e8`. The suite is `unverified` here, as the crafter labelled it, and the label is honest: `gaps.md` names each run that was not made, with the orchestrator as the one who answers | `seal/threads/1795342001-progress-through-roles/gaps.md:7-14` | the orchestrator, at the broad gate |
| The thirteen test files that start the built app and load the changed page, which no phase ran | `seal/threads/1795342001-progress-through-roles/gaps.md:14` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/chain-records.test.ts test/themes.test.ts` in `apps/desktop`, under `OWLERY_BACKGROUND=1`, through the electron lock | exit 0, 3 files, 477 cases passed. No built app started |
| `git show --remerge-diff 0dc13e8 -- apps/desktop` | each of the six conflicted files shows the two sides kept, as Confirmations states |
| `grep -c '^#'` and `grep -c '^\|'` over `docs/design.md` and `docs/design.ko.md` | 15 headings and 375 table rows in each |
| `grep -cF` of each unsettled `from` on the two editions of `docs/design.md` | each stands once at `17deb2b` |
| `git grep -n getComputedStyle -- apps/desktop/test/approval-line.test.ts apps/desktop/test/view.test.ts` | printed nothing |
| `gh issue view 46 --json title,body,comments` | the issue's six *Done when* lines and its one comment, of 2026-11-22 |
