# Implementation Plan: 1795342001-progress-through-roles

## Technical context

The tree as read at `b6cd259`.

**What the work builds on.**

- `apps/desktop/src/shared/protocol.ts:242-290` is `WorkItem`, which the daemon sends whole in `ready` and `inbox`. Each field that came after the first build carries a sentence on what a client reads where a daemon of an earlier build sends none. `apps/desktop/test/daemon.test.ts:29` lists every field of a work item.
- `apps/desktop/src/daemon/daemon.ts:417-447` is `readRecord`, which the pass `readCommits` (`daemon.ts:1761-1770`) calls for each open work item, 3 seconds apart while a client is connected, and whose answer says whether the lists are sent. `daemon.ts:1579-1593` is `workItemOf`, which composes what a client is sent.
- `apps/desktop/src/daemon/record-blocks.ts:336-351` holds `VERDICT_BLOCK` and `RUN_BLOCK`, in the grammar of `pr-check/lib/fields.py`, and `decision-record.ts:143-159` finds a work item's directory. `repository-file.ts#repositoryFileText` reads a file of a worktree and refuses a link, a file that is not plain and one over its bound.
- `apps/desktop/src/renderer/view.ts:147-171` gives a line's state and its age, and `view.ts:996-1009` its second row. `shared.ts:286-348` is `detail`, drawn in the preview (`list.ts:117`) and in the view (`work-item-view.ts:913`). `shared.ts:199-216` draws a state's mark from the theme's shapes by the state's class.
- `apps/desktop/test/themes.test.ts` holds the design system's rules: one set of names in every block of `themes.css`, no theme named in a selector or a module, and every property named in both editions of `docs/design.md` with its value.
- Issue #41's frame, at `624874c` on its branch, gives `WorkItem.chain`, the message `getSeal` and the "Get a seal" button, in its phases 2 and 4. Phase 3 of this plan reads the field as it stands once #41 is merged into `release/v0.0.2`.
- `apps/desktop/test/fixtures/sample-cli.sh` is the stand-in for the CLI in the screenshot run. A role launch stays `working` while the stand-in holds its prompt and prints nothing: the adapter fails a role launch only on an `init` line without the agent or on a `result` (`adapters/claude.ts:280-293`, `420-436`), and the build ships the bundle the launch names (`build.mjs:55-57`). Read, not run.

**Constraints.**

- The owner's rules for this run bind the build's cases: no real `claude` starts, each start of the built app goes through `test/built-app.ts` `BuiltApp.start` under `OWLERY_BACKGROUND=1`, and scenarios 10, 11 and 12 share one start.
- The page's style names no theme, so the row form and the box form differ by custom properties alone, and each new property stands in every block of `themes.css` and in both editions of `docs/design.md`.
- Phases 1 and 2 use nothing of #41 and are built on this branch as it stands. Phase 3 starts once #41 is merged into `release/v0.0.2` and that branch is merged into this one. The branch is never rebased.

**The failure scenario of the chosen approach.** The mapping from a kind of stage to a role's place lives in the window. Issue #42 adds the gate's and the sealer's kinds, and a kind added without its row would mark no place. The mapping is typed over #41's list of kinds so that such a build does not compile, and that guard is what the approach rests on. The second weak point is the asker's name: a caller that parks with `by: "the proofer"` marks no place, and nothing says so. The third is the verdict's commit: until issue #44 compares it with the branch's head, the sealer's place says "Sealed" for a branch that has moved, with the commit in the mark's label as the only sign.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The line reads #41's `WorkItem.chain` for the stage that runs and the one that failed, and #41 merges first (chosen) | Phase 3 waits for the release's largest item | Chosen. The chain's state is #41's subject, it is stored with the work item, and it carries the round's number. #41's frame names this work as its reader. Phases 1 and 2 need none of it and are built meanwhile |
| This work merges first, and reads the stage that runs from the daemon's headless sessions with a role | A failed stage's mark is lost when its session is dropped or the daemon starts again, the round's number is a guess from the count of records, and #41 then replaces the source and reworks two files of this work in its own rounds | Rejected. It was this frame's first draft. A fact has one source, and at `b6cd259` the daemon keeps a role's session in memory alone (`daemon.ts:1388-1407`) |
| The daemon sends the facts, and the window composes the places (chosen) | A second client, such as the phone, composes them again | Chosen. `WorkItem.chain` already carries the stages, so a composed line in the protocol would say the same facts twice. The window composes a work item's line of the inbox from the facts the same way (`view.ts:147-171`) |
| The daemon composes the places and sends them as one more field | The protocol holds a stage in `chain` and again in the composed place, and the two can differ between two sends | Rejected |
| Four places, one for each role, each with a short note (chosen) | A chain of six rounds reads as "6 rounds" and no more | Chosen. `docs/design.md` *Components and their states* states four roles in order, and the artboards A2 and B2 draw a role's name with a note. The detail of each round is the seal's back, #47 |
| Replace the four places: a list of the chain's stages, one row for each round, fix pass and judgment | The view shows the rounds twice once #47 draws the seal's back, a record-only work item has no stage to list, and the form `docs/design.md` states is dropped in the release that first draws it | Rejected. The premise that keeps the four places: the policy states them, and the line must also read a work item whose chain the daemon never ran, as this repository's own are, checked by the probe of `frame/design.md` *Grounding* |
| Three places in this release, with no framer | The form of `docs/design.md` is broken, and #56 changes the layout again in milestone 3 | Rejected. Policy ranks above the issue's sentence "no framer stage". The framer's place stands as "Not started", or "Framed" where the records hold a frame, and no framer stage runs |
| The crafter's place filled from the branch's commits (chosen) | A branch with one commit reads as built while a person still builds | Chosen. The issue fills the builder's place by the session that built the branch, and its commits are what that session left. The line reads no pane's state, so it cannot say the builder still works |
| The crafter's place filled from the `Implementation` row of `routing.md` | A work item with no directory, as every one is before "Get a seal", shows nothing built | Rejected. No script reads that row (`pr-check/lib/routing.py:164-174`), and the commits are a fact the daemon already reads |
| The note under each name, in every theme (chosen) | The row is two lines high where the mock-up drew one | Chosen. The mock-up's one row with the notes after the names runs past the 420px column in Night watch (`frame/design.md` *Grounding*). Scenario 10 holds the width in each theme |
| The notes left to the mark's label, shown on hover | How a role ended is said by a shape alone until the pointer rests on it, against principle 4 of `docs/design.md` | Rejected |
| The line drawn for every work item whose daemon sends its records (chosen) | A work item with no commit shows four places not started | Chosen. The line says how far the work item came, and "nowhere" is an answer. The mock-ups draw it on a work item with two places not reached |
| The line hidden until a record or a chain exists | The section appears and leaves as a branch gains its first commit, and a person cannot tell a hidden line from a daemon that sends none | Rejected |
| The round records parsed for their findings | The count of findings per round is the seal's back, and #41 builds the reader of a round record, so a second one here would be two readers of one grammar | Rejected. The count of the files is exact |
| The sealer's place decided by whether the verdict's commit is the branch's head | This work decides sealed and broken, which #44 frames | Rejected. The place says the record's fact with its commit |
| The look keeps `recorded` | The look file grows, and nothing reads the field there | Rejected. The summary compares a line's state, its commits and its decisions (`view.ts:837-862`), and this work changes none of the three. #22 keeps what its sentence compares |
| An asker matched to a role by its exact name (chosen) | A caller that spells the role another way marks no place | Chosen. The daemon's own callers write the field, #41's frame writes the asking role there, and a list of spellings would be a guess from words. The work item's line still waits |
| `docs/design.md` and `docs/design.ko.md` changed in this pull request (chosen) | Another work item of the release changes the same rows, and a merge resolves both | Chosen. Principle 8 has a form written there first, `test/themes.test.ts` fails a property the document does not name, and #155, #119 and #39 did the same. #27 leaves its rows to the settle, so the two do not meet there. The rules of `docs/product.md` stay in *Rule changes* for the settle |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1. The daemon sends what the records say | `frame/design.md` *Scope* items 1 and 2 | Scenarios 1, 2 and 3: `test/chain-records.test.ts`, `test/daemon.test.ts` | `45cd4bb` |
| 2. The view and the preview draw the line from the records and the questions | *Scope* items 4 to 7, of item 3 the rows the table of *Data & interfaces* gives to phase 2, and of item 8 the form's rows, the sentence under the components' table and the tokens. The two editions of `docs/design.md` change in the commit that adds the properties to `themes.css` | Scenarios 4, 5, 6, 9, 10, 13 and 15: `test/view.test.ts`, `test/approval-line.test.ts`, `test/themes.test.ts` | |
| 3. The line reads the chain, the inbox names the running stage, and the screenshots show both. It starts once #41 is merged into this branch through the release branch | *Scope* items 9 and 10, of item 3 the rows given to phase 3, and of item 8 the paragraph on the screenshot run. The screenshots are committed under this work item's directory, and `gaps.md` and `changelog.md` are written | Scenarios 7, 8, 11, 12 and 14: `test/view.test.ts`, `test/approval-line.test.ts`, and `OWLERY_SCREENSHOT_THEMES=all pnpm run screenshots` | |

The new test files `frame/design.md` *Rule changes* names in its `check:` lines are made under those names: `test/chain-records.test.ts` in phase 1 and `test/approval-line.test.ts` in phase 2.

## Overlap with the release

The frames of #41, #45 and #27 stand committed on their branches, at `624874c`, `1a028b3` and `29781fe`. Each was read, and each names this work as the one that merges after it. #42, #43, #44, #47 and #22 are not started.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #41, review rounds | The fact this work reads: `WorkItem.chain`, which #41 adds to `protocol.ts`. `view.ts#lineText` and `lineSince`, where #41 gives a stopped chain's sentence and this work the running stage and its age. `work-item-view.ts`, `index.html`, `test/view.test.ts`, `test/screenshots.test.ts` and the paragraph of `docs/design.md` on the screenshot run. `record-blocks.ts`, where #41 adds a round record's kinds and this work reads two kinds that stand | #41 | This work reads a field #41 adds, so it reads it merged, and #46's issue depends on #42, which depends on #41. What this work needs of #41's protocol: `Chain.state`; of the newest `ChainStage` its `kind`, `round`, `state`, `failure` and `startedAt`; `CHAIN_STAGE_KINDS` as a list a table can be typed over; a park that names the asking role in `by`, exactly; a round's record at `trail/rounds/round-<N>.md`. What #41 needs of this work's protocol: nothing. Phases 1 and 2 are built before #41 merges, and phase 3 takes the merge in commits it makes anyway. Where #41's build departs from its frame in one of the fields named here, phase 3 reads the field as merged (`frame/questions.md` Q4) |
| #45, cost per stage | `protocol.ts` and `test/daemon.test.ts`, by lines alone | #45 | Neither reads a rule or a fact of the other. #41's plan records that #45 merges before #41, and this work merges after #41 |
| #27, agent choices and the behind count | `view.ts#lineText`, the "says" card of `shared.ts#detail`, `protocol.ts` for a new field of a work item, `test/daemon.test.ts#WORK_ITEM_FIELDS`, `test/screenshots.test.ts` and its scene, `test/view.test.ts` | #27 | It is the smaller diff and reads nothing this work adds. Both change the scene of the screenshot run, so this work makes its screenshots after the merge, in phase 3 |
| #42, gate and sealer, not started | The table in `view.ts` that gives each kind of stage its place, to which #42 adds the gate's and the sealer's kinds, and the words of each. `trail/gate.md` and `guarantee.md`, which #42 writes and this work reads | #46 | #42 is not started. The third *Done when* line of #46 names a failed gate, and `frame/design.md` *Scope* puts it out with this reason |
| #44, sealed and broken, not started | `shared.ts#sealPlace`, which the sealer's place calls, and `Recorded.verdict`, whose commit #44 compares with the branch's head | #46 | #44 is not started. It lights the seal in one function for the line, the preview and the view's foot |
| #43, the pull request, not started | `view.ts#lineText`, where #43 shows the result of a pull request's checks on the work item's line | #46 | #43 is not started. The line has no place for the pull request |
| #47, the seal's back, not started | The view's right column, and the records #47 reads beside `chain-records.ts` | #46 | #47 is not started |
| #22, the summary, not started | `view.ts#changesSince` and `last-look.ts`, where #22 keeps what its sentence compares | #46 | #22 is not started |

The items merged into `release/v0.0.2` are the base this work is cut from: #130 gave the form and the tokens' rules, #119 `Daemon#park` and its `by`, #39 the role sessions and their grants, and #38 the bundle.

## Operational impact

No migration, no environment variable and no dependency. The version does not move: `apps/desktop/package.json` reads `0.0.2`, which the release's first pull request set. The protocol gains one field of a work item. A daemon an earlier build started sends none until it is replaced, and the window then draws no line (`docs/architecture.md` *What a session survives*). The rules of `docs/product.md` and its Korean edition are in `frame/design.md` *Rule changes*, for the settle of release 0.0.2. `docs/design.md` and `docs/design.ko.md` change in phases 2 and 3, and the pull request carries the screenshots phase 3 commits.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
