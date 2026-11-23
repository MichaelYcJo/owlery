# Design: 1795342001-progress-through-roles

Issue #46: a work item's view does not show how far it has come through the roles. This work draws the approval line of `docs/product.md` *The seal* in a work item's view and its preview, and names a running stage on the work item's line of the inbox. The line has two sources. The daemon reads what the work item's records say and sends it with the work item. The chain's state is issue #41's `WorkItem.chain`, which this work reads as #41 merged it.

## Grounding

The tree as read at `b6cd259`, which is `41e8aa4` of `release/v0.0.2` and this work item's `routing.md`. A row's last word says how the fact was got: `read` for a file opened, `executed` for a command run, with the command.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *The seal*, item 1 | The app shows the seal in three places, and the first is "an approval line per work item", which "shows how far one work item has come through framer, crafter, proofer and sealer". The line has the four roles, in that order. Read. |
| `docs/design.md` *Components and their states*, the row "The approval line", and *The themes*, the row "The approval line" | The form: "The four roles in the order framer, crafter, proofer, sealer, each with the mark of how far it came, in the form *The themes* gives for the theme. The sealer's place holds the seal." Night watch and Desk draw the roles' names in a row, each after its mark, joined by rules. Register draws a ruled block of four boxes. The sentence under the table, at line 443, says the app draws no approval line yet and that "the milestone that builds the seal draws both in the forms above". Read. |
| `docs/design.md` *Principles* 4, 5 and 8 | A state is said by a shape, a colour and words. A theme is its tokens, and no selector and no module names a theme. A change that needs a form the document does not state adds it there first, in the same pull request. Read. |
| `docs/design.md` *The voice of the window's words* | "A state is two words at most", a label begins with one capital, and the window speaks in no first person. Read. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | This pull request commits a screenshot of each view it changes, made by `pnpm run screenshots`, under this work item's directory. Read. |
| `docs/architecture.md` *What each session loads* | The role bundle holds no hook, and "Drawing the seal becomes the daemon's job: it reads the records and draws them on screen". The line reads no hook of a role session. Read. |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2 | No field of the protocol names a vendor. Read. |
| `docs/architecture.md` *State lives in three places* | Progress is the daemon's state, and the records are the repository's. The line has both sources. Read. |
| `docs/architecture.md` *What a session survives* | An update keeps the daemon an earlier build started, and "the window reads a field the daemon does not send as a feature that is off". A window that gets no record of the chain from its daemon draws no line. Read. |
| `docs/architecture.md` *Authentication of the Claude adapter*, the row "Original screen", and *What a session survives* | A role session opens in a terminal with `claude --resume <session ID>`. The store of session ids and the resume by id are issue #61's, in milestone 4. Read. |
| `docs/roadmap.md` *Milestones*, rows 2 and 3 | The approval line is part of milestone 2, whose chain starts at the review. Row 3 adds the framer and crafter sessions. Read. |

What the tree and the release's other frames hold, and what was run to learn it.

| Fact | How it was got |
|---|---|
| The daemon holds no chain and no stage at `b6cd259`. What it knows of a role's work is a headless session's `role`, `state` and `startedAt` (`apps/desktop/src/shared/protocol.ts:342-383`), which it keeps in memory, a bounded count of the ended ones (`apps/desktop/src/daemon/daemon.ts:1388-1407`). | read |
| Issue #41's frame, committed at `624874c` on its branch, gives a work item its chain. `WorkItem.chain` is a `Chain` or null: `state`, one of `running`, `parked`, `stopped` and `reviewed`; `says`, a sentence the window shows as it is; and `stages`, the oldest first. A `ChainStage` holds `kind`, one of `round`, `fix-pass` and `judgment` at that commit; `round`; `state`, one of `working`, `finished` and `failed`; `failure`; `startedAt` and `endedAt`. As #41 merged, `CHAIN_STAGE_KINDS` holds a fourth kind, `ruling`, the orchestrator's decision of a question a stage asked (`apps/desktop/src/shared/protocol.ts#CHAIN_STAGE_KINDS`). The chain is stored with its work item and outlasts the daemon. Its *Scope* item 27 gives the work item's line its state from the chain, and its *Out of scope* says: "The approval line, the running stage's age on a line, and opening a stage's conversation. #46 draws them from `WorkItem.chain`." | read: `seal/threads/1795388700-review-rounds/frame/design.md` *Scope* items 15, 25 and 27, *Out of scope* and *Data & interfaces*, on its branch at `624874c`; the fourth kind read in the protocol as merged into this branch at `0dc13e8` |
| That frame parks a work item "with the asking role as `by`" (its *Scope* item 11), and writes a round's record to `trail/rounds/round-<N>.md` (item 6). `Daemon#park` keeps `by` in the question's block (`daemon.ts:351-380`, `record-blocks.ts:390`). | read |
| A role session's permission request never reaches the person: `role-grants.ts#verdictOn` answers `allow` or `refuse` for every role (`role-grants.ts:123-134`). So no stage waits on a permission request. | read |
| The daemon reads each open work item's `decisions.md` from its worktree at every pass, 3 seconds apart while a client is connected (`daemon.ts:417-447`, `1727-1770`), and finds the work item's directory by the `Branch` row of its `routing.md` (`decision-record.ts#workItemDirectory`). | read |
| The daemon's block reader holds the kinds of the gate's run and of the sealer's verdict, and nothing in `src/` reads a file with them (`record-blocks.ts:336-351`). | read; executed `grep -n 'VERDICT_BLOCK\|RUN_BLOCK' -r src test` |
| That reader reads the gate record and the guarantee of every work item this repository holds, with no refusal and no notice. A guarantee there holds up to four verdict blocks and a gate record up to two run blocks, and the last block is the newest. The round records are files named `round-<N>.md` under `trail/rounds/`, and no other file stands there. | executed `node test_tmp_records_probe.mts` in the scratch directory, against a `git clone --no-local` of this worktree at `b6cd259`. It printed one line for each directory under `seal/threads/` |
| The pull request check takes the last run block and the last verdict block (`pr-check/skills/code-review/scripts/chain_check.py:66-70`, `1704`, `1745`). | read |
| The daemon keeps no id of a headless session's conversation, and no code passes `--resume`. | executed `grep -n -i 'session_id\|sessionId\|--resume\|--session-id' -r apps/desktop/src`, which printed nothing |
| `shared.ts#detail` draws what the preview and the view's right column say of a work item alike (`apps/desktop/src/renderer/shared.ts:286-348`), and `shared.ts#sealPlace` draws the seal's blank place (`shared.ts:124-133`). `view.ts#inboxLine`, `lineSince` and `lineText` give a line its state, its age and its second row (`apps/desktop/src/renderer/view.ts:147-171`, `996-1009`). | read |
| The view's right column is 420px wide with 16px of padding (`docs/design.md` *The layout's measures*, `index.html:366`). The mock-up of the design system's work item draws each role's note after its name in one row, and in Night watch the row runs past the column's right edge: the sealer's place is cut (`seal/threads/1795340000-design-system/frame/images/b-night-watch-night-desk-view.png`). Register's four boxes hold each note under its mark and fit (`a-register-letter-view.png`). | read |
| The artboards #22 names are in the owner's design study, kept outside the tree under `etcs/design/inbox-first-mockups/`. C2, "Work item, sealed", draws a large seal, the seal's record and the back of the seal, and no approval line. A2 and B2 draw the approval line as four rows, each a role's name and a note in words: "Design written", "Built in 3 commits", "2 rounds, 2 findings fixed", "Not started". The owner then chose the three themes of `docs/design.md`, on 2026-11-22 (`seal/threads/1795340000-design-system/frame/design.md` *The themes*). | read |
| The earlier frame of this work item, of 2026-11-22, left a comment on each of #46, #47 and #22. On #46: the fifth *Done when* line is carried to #61. On #47: the line shows each role's state and a short note, and leaves the cost of a stopped chain, the count of findings per round and the refused calls per stage to the seal's back. On #22: the summary can say that a work item moved from review to its seal, from the state this line draws. | executed `gh issue view 47 --json body,comments` and `gh issue view 22 --json body,comments`; the comment on #46 read in the spawn's `issue.md` |
| That frame's probe of Claude Code 2.1.330 (`session_id` on the `init` and `result` lines, and `-p --resume <id>` continuing a conversation) is the earlier framer's claim. This frame ran no `claude`, by the owner's rule for this run. | unverified. Answered by issue #61's build |
| The frames of #45 and #27 stand committed on their branches, #45's at `1a028b3` and #27's at `29781fe`. Each names this work as the one that merges after it. #41's `frame/plan.md` *Judgments of the run* records that #45 merges before #41. | read |
| The spawn's line on #46's comments is the orchestrator's reading of 2026-11-23: one comment, the one above. | the orchestrator's finding, in `issue.md` |

### Where each line of the issue's *Done when* lands

| *Done when* | Where it lands |
|---|---|
| 1. A work item's view shows the approval line: each stage, which one runs, which ended, and how | *Scope* items 1 to 8 |
| 2. The inbox line shows the running stage in short, with how long it has run | *Scope* item 9 |
| 3. A stage that waits for the person is marked on the line as waiting | *Scope* item 4, for a stage that asked a question. No stage waits on a permission request (*Grounding*). A stage that failed or was stopped is marked as failed, and #41 makes its work item's line wait. A failed gate is out of scope, with its reason |
| 4. The line is drawn from the daemon's progress and the committed records, and from no hook | *Scope* items 1 to 5, and scenario 9. The daemon reads the records in the worktree, committed or not (*Scope* item 2), where the issue names the committed records |
| 5. A person opens a role session's screen from the line, or the issue records why that waits | Out of scope. The issue's comment of 2026-11-22 records it, and the first table above gives the policy it rests on |
| 6. The layout is checked against the sealed work item's view the owner chose | *Scope* items 6 to 8, and scenarios 10 and 14 |

## Scope

In scope, by number.

1. **A work item carries what its records say of the chain.** `WorkItem.recorded` holds whether the frame stands, the count of the rounds recorded, the gate's last run and the sealer's last verdict. *Data & interfaces* gives the type. A daemon of an earlier build sends no such field, and the window then draws no line.
2. **The daemon reads those records at every pass, beside the work item's record of decisions.** In the work item's directory it reads whether `frame/design.md` is a file, how many files of `trail/rounds/` are named `round-<N>.md`, the last run block of `trail/gate.md` and the last verdict block of `guarantee.md`. It reads the working tree, committed or not, as it reads `decisions.md`. A `frame/design.md` or a round file counts only where it is a plain file, and a `trail/rounds` that is no folder of the worktree counts no round. `trail/gate.md` and `guarantee.md` are read through `repository-file.ts`, so each gives nothing where it is a link, no plain file or over that module's bound. A gate record or a guarantee with a line the reader refuses gives nothing, wherever that line stands, as the pull request check reads them (`chain_check.py`, its broad gate and guarantee arms). The daemon sends the lists when what it read differs from what it last sent.
3. **The window composes the line's four places from the facts the daemon sends**, in `view.ts`, as it composes a work item's line of the inbox. A place's state has one order: it waits where an open question names its role, it works where the chain runs a stage of its role, it failed where the chain's last stage is of its role and failed, and otherwise the records say it. *Data & interfaces* gives the table. The first and the last of the four are built in phase 2, and the two that read the chain in phase 3.
4. **A place is marked as waiting where its role asked the person.** An open question of the work item whose `by` is exactly a role's name marks that role's place, with the question's text under the line.
5. **The records say how a place ended.** The framer's place is finished where the frame stands. The crafter's place is finished where the branch holds a commit after its base, and counts them. The proofer's place is finished where a round is recorded, and counts the rounds. The sealer's place is finished at a `sealed` verdict, failed at a `withheld` one and waiting at an `undecided` one, each with the verdict's commit, and its reason or question under the line. Where no verdict stands and a gate's run is read, the sealer's place says so.
6. **`shared.ts#detail` draws the approval line in the preview and in the view's right column alike**, after what the agent says and before the decisions. The section has the heading "Approval line", the four places, and under them one line of text for each place that has something to say: a question, a failure's reason, a verdict's reason. Each place holds its mark, the role's name with one capital, and a note of two words at most under the name. The mark says the place's whole words to a pointer and to a screen reader. The sealer's place also holds the seal's place, as `sealPlace` draws it on a line.
7. **The two forms of `docs/design.md` differ by tokens alone.** Night watch and Desk draw the places in a row joined by rules, and Register draws four ruled boxes. The page's style names no theme, so `themes.css` gains the properties that make the difference, the same names in each of its blocks. Their names open with `--approval-`, and the build chooses them.
8. **`docs/design.md` and `docs/design.ko.md` state the form before the window draws it, in this pull request.** The row "The approval line" of *Components and their states* gains the note under each name, the words of a place that has not started and of one that failed, the line of text under the places and the seal's place in the sealer's place. In phase 3 the same row gains the words of a place at work, "Round 2" and "Fix pass", the word "Failed" of a place whose stage failed, the mark of a place at work, and why a stage failed among the texts under the places. The row of *The themes* says where the note stands in each theme. The sentence under the components' table says that the app draws the approval line and draws no lit seal yet. The token tables and *What the names say* gain the new properties. *A pull request that changes the window carries its screenshots* says what the screenshot run's scene now holds. `frame/plan.md` *Alternatives considered* holds why these two files change here and not at the settle.
9. **A work item's line of the inbox names the running stage.** Where the chain runs a stage, no question and no permission request makes the line wait, and the pane the line reads does not wait, the line's second row is the stage in short, as in "Proofer, round 2", and its age counts from the stage's start. Only a pane that waits is left out: where the pane works, the line still names the stage and counts its age from the stage's start. The age is `view.ts#lineSince`'s, which the sidebar, the summary and the preview's state read too, so the stage's age stands in each. The line's state stays #41's to give.
10. **The screenshot run's scene holds six work items and two chains.** The work item the view shows waits on its pane's question and on a call to allow, so its line of the inbox names no stage (item 9). A sixth work item, "Sort the history by date", holds the chain whose stage its line of the inbox names. The shown work item holds a second chain, which draws its approval line with a finished place, a working place and two not started, in the view and in the inbox's preview. Each chain stays at its first round, which the run's stand-in for the CLI holds. The run asks for the shown work item's seal before it asks that work item's prompts, since the daemon starts no chain in a work item a session works in. It writes two round records into the parked work item's directory as it writes that work item's questions, so the parked work item's approval line counts the rounds and its sealer's place waits on the questions. The view's shot scrolls its right column until the approval line is the last thing in it.

Out of scope, each with its reason.

- **Opening a role session's own conversation from the line** (*Done when* 5). The daemon keeps no session id, and issue #61 builds the store of ids and the resume by id. A second store here would be two homes for one fact. The issue's comment of 2026-11-22 records it.
- **The chain's state, the "Get a seal" button, the state of a work item's line and the notification of a chain that stops.** They are #41's (*Grounding*). This work adds no second source of a stage that runs.
- **The gate and the sealer as running stages, and a failed gate marked as waiting.** No gate and no sealer runs in a chain until issue #42, which adds its kinds of stage and the place each marks (`frame/plan.md` *Overlap with the release*). The sealer's place reads the records until then.
- **The orchestrator's stages on a place.** A judgment and a ruling are stages of #41's chain, and each belongs to none of the four roles. No place marks either. The line of the inbox names each while it runs, as "Orchestrator, judgment" or "Orchestrator, ruling", and #41's sentence by the button says how it ended.
- **A lit seal, and whether a verdict still holds at the branch's head.** The sealer's place says the verdict and the commit it names, as the record states them. Issue #44 compares that commit with the head, lights the seal and draws a broken one.
- **The findings of each round, the cost of each stage and the refused calls.** They are the seal's back, issue #47, as the earlier frame's comment there says.
- **The summary's sentence for a work item that moved from review to its seal.** Issue #22 builds it, and keeps in the look what it compares.
- **The framer's and the crafter's sessions as running stages.** Issue #56 adds them in milestone 3, and the places stand ready.

## User scenarios & acceptance *(mandatory)*

Each case named below is new, and the build shows each red before it is planted (contract rule 15). A file runs through `node scripts/test-in-electron.mjs <file>` in `apps/desktop`. Scenarios 7, 8, 11 and 12 need #41 merged, and are phase 3's.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A work item with no directory | Given a work item whose worktree holds no directory of its own, when the daemon lists it, then its `recorded` says no frame, 0 rounds, no gate and no verdict, and `daemon.test.ts#WORK_ITEM_FIELDS` names the field | `test/daemon.test.ts`, a case under a new `describe("what a work item's records say of its chain")` |
| 2. The records are read, the last block of each | Given a work item's directory in its worktree with `frame/design.md`, three round records, a gate record with two run blocks and a guarantee with a `withheld` block then a `sealed` one, when the daemon's pass reads it, then `recorded` says the frame stands, 3 rounds, the second run's commit and `sealed` with the second block's commit, and every client is sent the lists. The files are not committed, and the result is the same once they are. A pass that reads the same sends nothing | `test/chain-records.test.ts` for the reader, on texts and on a temporary folder; `test/daemon.test.ts` for the pass |
| 3. A record that cannot be read gives nothing | Given a `guarantee.md` that is a link out of the worktree, a `trail/rounds` that is a link, a round file named `round-01.md` or `round-2.txt`, and a verdict block the reader refuses, then the verdict is null and the count of rounds is 0 | `test/chain-records.test.ts` |
| 4. The records fill the places | Given a work item with one commit after its base and the records of scenario 2, then the framer's place is finished with the note "Framed", the crafter's finished with "1 commit", the proofer's finished with "3 rounds", and the sealer's finished with "Sealed" and a label that names the commit. Given no directory and no commit, then each place is not started | `test/view.test.ts`, a new `describe("the approval line")` |
| 5. A withheld and an undecided verdict, and a gate | Given a last verdict `withheld` with a reason, then the sealer's place is failed with the note "Withheld" and the reason stands under the line. Given `undecided` with a question, then it is waiting with "Undecided" and the question. Given no verdict and a gate's run, then it is not started with the note "Gate passed" | `test/view.test.ts` |
| 6. A stage that asked the person | Given an open question whose `by` is `proofer`, then the proofer's place is waiting with the note "Needs you", its label says the age from the question's `since`, and the question's text stands under the line. Given a question by `orchestrator`, or one by `Proofer`, then no place waits. Given the question answered, then the place is as the records give it | `test/view.test.ts` |
| 7. A running stage and a failed one | Given a chain that is `running` whose last stage is a `round` 2 that is `working`, then the proofer's place is working with the note "Round 2" and a label with the age from the stage's `startedAt`. Given a `fix-pass` that works, then the crafter's place is working with "Fix pass". Given a chain that is `stopped` whose last stage is a `round` 2 that `failed`, then the proofer's place is failed with "Failed", a label "Round 2 failed", and the stage's `failure` under the line. Given a last stage that is a `judgment` or a `ruling`, working or failed, then the places are as the records give them. Given a last stage that finished, or a stage that works or failed and is not the last, then the places are as the records give them. Given a chain stored `running` that a restarted daemon reads as `stopped`, with a last stage still `working`, then no place works. Given an open question by the stage's role, then the place waits | `test/view.test.ts` |
| 8. The line of the inbox | Given a chain that runs a round 2, then `lineText` gives "Proofer, round 2" with `says: "stage"` and `lineSince` the stage's `startedAt`, whether the line's pane is finished, works or is absent. Given a fix pass, "Crafter, fix pass". Given a judgment, "Orchestrator, judgment". Given a ruling, "Orchestrator, ruling". Given also an open question, a waiting permission request or a pane that waits, then the second row and the age are as they are without this work. Given a running chain whose last stage has ended, then the second row is as it is without a chain, and the line has no age unless its pane works or waits. Given a search typed, then the second row is the branch | `test/view.test.ts`, in #41's `describe("a work item's chain")`. Two of #41's cases stated the earlier rule, that a running chain's line says what it says without a chain and takes its age from a pane that works, and are rewritten in place |
| 9. No hook and no session without a role changes the line | Given two lists that differ only in a pane's state and in a headless session with no role, then the places are the same for both. The function that composes them takes a work item and nothing else | `test/view.test.ts` |
| 10. The view and the preview draw the line | Given the built app, started once through `BuiltApp.start` under `OWLERY_BACKGROUND=1`, on a repository whose branch holds `seal/README.md` committed, since a chain starts only in a worktree whose place for work records is committed, and a work item whose worktree holds two round records and whose branch holds a commit, then the view's right column and the inbox's preview each hold one section with the heading "Approval line" and four places in order, the crafter's and the proofer's with the finished mark and the notes "1 commit" and "2 rounds", the framer's and the sealer's with the note "Not started", and the sealer's place holds a seal's place with `data-seal="none"`. In each theme and each appearance the section is no wider than its column: its `scrollWidth` is at most its `clientWidth` | `test/approval-line.test.ts`, a new file that imports `buildApp` |
| 11. A running stage in the built app | Given the same start, a second work item with a commit, a stand-in for the CLI that holds a round's prompt, and a `getSeal` for that work item, then the proofer's place has the working mark and the note "Round 1", the crafter's note reads "2 commits", the case's commit and the one in which the chain declares the work item's routing, the work item's line of the inbox has "Proofer, round 1" in its second row and an age in its first, and the mark's label names the role, the note and the age | `test/approval-line.test.ts`, in the same start |
| 12. A stage that failed in the built app | Given scenario 11's chain, when a second client stops the round's session with `stopHeadless`, then the proofer's place has the failed mark, the note "Failed" and the label "Proofer: Round 1 failed", and the line under the places reads "Proofer: the session was stopped at a request before it finished", in the colour of a failure | `test/approval-line.test.ts`, in the same start |
| 13. A daemon of an earlier build | Given a work item without `recorded`, then the function that composes the places gives none and `detail` draws no approval section. Given a work item with `recorded` and without `chain`, then the places are as the records and the questions give them | `test/view.test.ts` |
| 14. The screenshots show the line | Given the screenshot run with every theme, then each view file shows the approval line in its theme's form with a finished, a working and a not-started place, its right column scrolled down until the line is the last thing in it, and each inbox file shows one line that names a running stage. No committed file shows a place that waits or failed with its line of text under the places (`gaps.md` *Not done*) | `OWLERY_SCREENSHOT_THEMES=all pnpm run screenshots`, run in phase 3 at `6443819`, and the inbox's and the view's files of each theme and appearance committed at `64274a7` under `seal/threads/1795342001-progress-through-roles/screenshots/`. The proofer reads them against `docs/design.md` |
| 15. The style keeps the design system's rules | Given the new properties and the new style, then every block of `themes.css` defines the same names, the page names no theme and no colour of its own, and both editions of `docs/design.md` name every new property with its value | `test/themes.test.ts`, which holds these rules at `b6cd259` and needs no new case |

## Data & interfaces

**`apps/desktop/src/shared/protocol.ts`.** No field names a vendor.

```ts
/** What a work item's records say of its chain, as the daemon last read them in its worktree, committed or not. */
export interface Recorded {
  /** Whether `frame/design.md` stands in the work item's directory. */
  framed: boolean;
  /** How many round records the directory holds. */
  rounds: number;
  /** The commit the last run block of the gate's record names, or null. */
  gate: string | null;
  /** The last verdict block of the guarantee: the verdict's word, the commit it names, and the reason or the question, 2,000 characters of it at most, or null. */
  verdict: { is: "sealed" | "withheld" | "undecided"; commit: string; says: string | null } | null;
}
```

`WorkItem` gains `recorded?: Recorded`, optional because `Look.workItems` is a `WorkItem[]` and the look keeps no `recorded`. The daemon sends it with every work item. A daemon of an earlier build sends none, and a client reads its absence as a work item it draws no approval line for. No message is added: the field travels in `ready` and `inbox`. The look does not keep it, since no comparison of the summary reads it.

**`apps/desktop/src/daemon/chain-records.ts`, new.** `readChainRecords` reads a work item's directory and returns a `Recorded`, and `NOTHING_RECORDED` is the value of a work item with no directory. `lastRun` and `lastVerdict` read the last block of a text. It reads the two files through `repository-file.ts#repositoryFileText` and `record-blocks.ts#read` with `RUN_BLOCK` and `VERDICT_BLOCK`, and takes the last block of each. A round is a plain file of `trail/rounds/` whose name is `round-`, then a whole number from 1 with no leading zero, then `.md`. It parses no round record.

**`apps/desktop/src/daemon/daemon.ts`.** The pass reads the chain's records where it reads `decisions.md`, and `workItemOf` adds `recorded`. A work item with no directory has the empty value.

**`apps/desktop/src/renderer/view.ts`.** One function, `approvalPlaces`, gives the places of a work item, or none where the work item carries no `recorded`. It reads `recorded`, `newCommits`, `questions` and `chain`. It takes no session and no pane's state. The state of a place is given by the first row that holds. The chain's last stage is the newest of `chain.stages`. `runningStage` gives the stage a chain runs: the last stage, where the chain is `running` and that stage is `working`. The approval line and the line of the inbox both read it. A `round` is the proofer's and a `fix-pass` the crafter's. A `judgment` and a `ruling` are the orchestrator's and mark no place. The mapping is `STAGES`, a table with one row for each of #41's `CHAIN_STAGE_KINDS`, typed so that a kind with no row does not compile. A row holds who runs the kind and what it is in short, as the line of the inbox names it, and the place the kind marks with its note and its mark's words, or no place.

| Order | Where | State | Phase |
|---|---|---|---|
| 1 | An open question's `by` is the role's name, exactly | waiting | 2 |
| 2 | The chain is `running`, and its last stage is of the role's kind and `working` | working | 3 |
| 3 | The chain's last stage is of the role's kind and `failed` | failed | 3 |
| 4 | Framer: the frame stands. Crafter: the branch holds 1 commit or more after its base. Proofer: 1 round or more is recorded. Sealer: the verdict is `sealed` | finished | 2 |
| 5 | Sealer: the verdict is `withheld` | failed | 2 |
| 6 | Sealer: the verdict is `undecided` | waiting | 2 |
| 7 | Otherwise | not started | 2 |

The words, one set for every theme. A role's name is the role with one capital. A commit is shown by its first seven characters, and an age as `ageOf` gives it.

| The place | Note | The mark's label, after the role's name and a colon |
|---|---|---|
| Waiting on a question | "Needs you" | "Needs you", then the age where the question's `since` gives one, as in "Needs you, 12 min" |
| Proofer, working | "Round 2" | "Round 2, 4 min" |
| Crafter, working | "Fix pass" | "Fix pass on round 1, 4 min" |
| Proofer, failed by a stage | "Failed" | "Round 2 failed" |
| Crafter, failed by a stage | "Failed" | "Fix pass on round 1 failed" |
| Framer, finished | "Framed" | "Framed" |
| Crafter, finished | "1 commit", "3 commits" | the note |
| Proofer, finished | "1 round", "3 rounds" | the note |
| Sealer, finished | "Sealed" | "Sealed at `<commit>`" |
| Sealer, failed by the verdict | "Withheld" | "Withheld at `<commit>`" |
| Sealer, waiting by the verdict | "Undecided" | "Undecided at `<commit>`" |
| Sealer, not started, where a gate's run is read | "Gate passed" | "Gate passed at `<commit>`" |
| Not started otherwise | "Not started" | "Not started" |

The line of text under the places is the role's name, a colon and the text: the first such question's `asks`, a failed stage's `failure`, and the verdict's `says`. A `failure` is a clause the daemon writes with no capital and no full stop, and the line shows it as it is: "Proofer: the session was stopped at a request before it finished". The line is plain text, never markup.

The line of the inbox, from phase 3. Where the chain is `running` and its last stage is `working`, no question is open, no permission request waits and the pane the line reads does not wait, `lineText` gives `{ says: "stage", text }` and `lineSince` the stage's `startedAt`. A pane that works changes neither. The text is "Proofer, round 2", "Crafter, fix pass", "Orchestrator, judgment" or "Orchestrator, ruling". Where a running chain's last stage has ended, the line is as #41 left it: its second row is what it is without a chain, and it has no age unless its pane works or waits. `lineSince` also gives the age the sidebar, the summary and the preview's state show. `inboxLine` is not changed by this work.

**`apps/desktop/src/renderer/shared.ts`, `index.html`, `themes.css`.** `detail` adds one section of the class `approval` where the function gives places. Each place is an element with `data-role` and the state's class of the marks, `no-agent` for a place not started, so it takes the theme's shapes and colours as every state's mark does. The sealer's place appends `sealPlace("line")`. A failed place's line of text takes `--state-failed`, and the others `--ink-muted`. In the preview the section spans the columns, as what the agent says does.

**`apps/desktop/test/fixtures/sample-cli.sh` and `test/screenshots.test.ts`**, in phase 3. The stand-in holds a prompt that holds "Review round " and prints nothing, so the first round of each of the scene's two chains stays at work. The run starts each chain as a second client of the daemon, with `getSeal`, and commits `seal/README.md` on the branch its work items are cut from.

## Rule changes

- change
  file: docs/product.md
  section: The seal
  from: **An approval line per work item.** It shows how far one work item has come through framer, crafter, proofer and sealer.
  to: **An approval line per work item.** It shows how far one work item has come through framer, crafter, proofer and sealer, in the work item's view and in its preview. Each role has a place, with a mark, the role's name and a short note: not started, at work, waiting for the person, or how it ended. The line is drawn from the work item's records and from the state of its chain, and from no hook. The records give the frame, the commits of the branch, the rounds recorded, the gate's last run and the sealer's last verdict, and the chain gives the stage that runs and the one that failed. A place that waits or failed says why under the line.
    check: apps/desktop/test/chain-records.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts
- change
  file: docs/product.ko.md
  section: 인장
  from: **작업마다 승인 줄.** 작업 하나가 framer, crafter, proofer, sealer를 거쳐 어디까지 왔는지 보여 줍니다.
  to: **작업마다 승인 줄.** 작업 하나가 framer, crafter, proofer, sealer를 거쳐 어디까지 왔는지를 작업 화면과 미리보기에서 보여 줍니다. 역할마다 자리가 있고, 자리에는 표시와 역할 이름, 그리고 짧은 메모가 있습니다. 메모는 시작하지 않았는지, 일하는 중인지, 사람을 기다리는지, 어떻게 끝났는지를 말합니다. 이 줄은 작업의 기록과 체인의 상태로 그리고, 훅은 읽지 않습니다. 기록에서는 설계가 있는지, 브랜치의 커밋, 기록된 리뷰 회차, 전체 검사의 마지막 실행, sealer의 마지막 판정을 읽고, 체인에서는 지금 도는 단계와 실패한 단계를 읽습니다. 기다리거나 실패한 자리는 줄 아래에 그 까닭을 말합니다.
    check: apps/desktop/test/chain-records.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts
- add
  file: docs/product.md
  section: Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call
  to: **A work item's line names the stage that runs for it.** While a chain runs a stage and nothing on the line needs the person, the line's second row says the stage in short, as in "Proofer, round 2", and the line's age counts from the stage's start. A line that waits on a question, on a call to allow or on its pane keeps saying so while a stage runs.
    check: apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts
- add
  file: docs/product.ko.md
  section: 바탕: 작업함, AgenticSeal 프로세스, 인장의 뒷면, 그리고 불러 쓰는 터미널
  to: **작업의 줄은 그 작업에서 돌고 있는 단계를 말합니다.** 체인이 단계를 돌리고 있고 그 줄에 사람이 필요한 것이 없는 동안, 줄의 둘째 행은 "Proofer, round 2"처럼 단계를 짧게 말하고, 줄의 나이는 단계가 시작한 때부터 셉니다. 질문이나 허락할 호출이나 자기 pane 때문에 기다리는 줄은 단계가 도는 동안에도 기다린다고 말합니다.
    check: apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts

- change
  file: docs/architecture.md
  section: Options for launching Claude Code
  from: | `--mcp-config` | Gives the agent the app's tools through MCP servers the daemon launches. For example: updating the approval line, recording cost |
  to: | `--mcp-config` | Gives the agent the app's tools through MCP servers the daemon launches. The approval line is drawn from the work item's records and the cost from the session's result, so neither is such a tool |
    check: apps/desktop/test/chain-records.test.ts apps/desktop/test/approval-line.test.ts
- change
  file: docs/architecture.ko.md
  section: Claude Code를 띄우는 옵션
  from: | `--mcp-config` | 데몬이 띄운 MCP 서버로 에이전트에게 앱의 도구를 줍니다. 예: 승인 줄 갱신, 비용 기록 |
  to: | `--mcp-config` | 데몬이 띄운 MCP 서버로 에이전트에게 앱의 도구를 줍니다. 승인 줄은 작업의 기록에서, 비용은 세션의 결과에서 그리므로 둘 다 그런 도구가 아닙니다 |
    check: apps/desktop/test/chain-records.test.ts apps/desktop/test/approval-line.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The sentences "The app draws no approval line and no lit seal yet, because no work item can be sealed. The milestone that builds the seal draws both in the forms above.", with the same sentences of the Korean edition | `docs/design.md` *Components and their states*, under the table, and `docs/design.ko.md` at the same place | Rewritten in place in phase 2: the app draws the approval line, and draws no lit seal until a work item can be sealed in the app. The sentence on the broken seal's drawing stays |
| The sentence "No agent and no stage runs: a pane's process is a fixture, a state is what the run tells the daemon, and a question is a block the run writes into the parked work item's record.", with the same sentence of the Korean edition, and the words "No stage runs either" of the run's head comment | `docs/design.md` *A pull request that changes the window carries its screenshots*, `docs/design.ko.md` at the same place, and `apps/desktop/test/screenshots.test.ts:15` | Rewritten in place in phase 3, at `68b5fd4`. #41's merge had left them as they stood. No agent runs, the run starts two chains whose first rounds the stand-in for the CLI holds, and the round records are files the run writes beside the parked work item's questions |

The work adds one field to the protocol, one module to the daemon and the detail of one form to `docs/design.md`. It adds no gate, check, hook or mark, so it owes no removal in return, and the line replaces nothing that drew progress before it.

Framed 2026-11-23 by framer, before the build.
