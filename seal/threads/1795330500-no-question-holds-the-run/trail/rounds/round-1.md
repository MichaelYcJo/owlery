# Review round 1: 1795330500-no-question-holds-the-run

```seal
target: 8db471d against release/v0.0.2
```

The range is `git diff 6f10cd0...8db471d`, where `6f10cd0` is the merge base with `origin/release/v0.0.2`. The local ref `release/v0.0.2` stands at `78bb2b9`, behind the remote, and was not used. This is the first round, so no coordinate was carried from an earlier one: every fact below was read or run at `8db471d`.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the four phase records. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. Read beside them: issue #119 with its one comment (Q1 and Q2 at their defaults), the comments the orchestrator left on #50, #51 and #53 on 2026-11-22, and AgenticSeal 0.38.4's `skills/implement/orchestration.md` *Orchestrator: what needs a person is asked in one batch, before the first edit*, the rule the work ports. No `seal/parity.json` is declared.

The axes walked, beside the table's: the lifetime of the two new stores against the store of the repositories, whose ids they are keyed by; what a park leaves served in the parked work item and in the others; the window beside a daemon of an earlier build; keyboard focus across the redraws an `inbox` causes; and the Korean of the four new paragraphs.

## Findings

### 1. A work item created after `repositories.json` is lost takes over the decisions and the park left under its id

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:197-202`, `apps/desktop/src/daemon/decisions.ts:65-76`, `apps/desktop/src/daemon/asked.ts:76-87`, `apps/desktop/src/daemon/repositories.ts:194-205`, `apps/desktop/test/daemon.test.ts`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_orphan2.test.ts` in `apps/desktop`, once (probe below); read `apps/desktop/src/daemon/repositories.ts:194-205`, `apps/desktop/src/daemon/daemon.ts:197-202`, `apps/desktop/src/daemon/daemon.ts:943-960`
```

Why it matters: `decisions.json` and `asked.json` key their entries by a work item's id, and that id is given by `repositories.json`, a file each store does not read. `RepositoryStore` starts its count at 1 when `repositories.json` is absent or is read as no repository (`repositories.ts:194-205`). `frame/plan.md` *Alternatives considered* names that case as a real one: "A file this build wrote, read after a field's type changed, is 'read as no repository'". The two stores are read whole at start (`decisions.ts:65-76`, `asked.ts:76-87`), and the daemon drops their entries only in `dropWorkItems` at a delete or a repository's removal (`daemon.ts:943-960`). So the entries outlive the work item list they belonged to, and the next work item given the same id inherits them. The probe wrote a decision and an unanswered park under id 1, started a daemon with no `repositories.json`, and created one work item. The new work item got id 1, carried the old decision, and was parked with the old question. Its line would then wait under "Waiting for you" with a question nobody asked about it, and the summary would count a decision nobody made for it.

`frame/design.md` scenario 9 says "a work item created afterwards holds none" and pins it for the delete path alone, which holds (`daemon.test.ts`, "lists an archived work item under `archived` with its decisions, and takes …"). No case covers a start on stores that hold ids the repositories do not, so the regression case is owed too.

The fix drops, at the daemon's start, every entry of a work item the repositories do not hold. It assumes `this.store` is built before the two stores, as `daemon.ts:197-202` has it. Its write goes through `keptChange`, so a run folder that cannot be written is logged and does not stop the start.

```ts
// apps/desktop/src/daemon/decisions.ts and apps/desktop/src/daemon/asked.ts, in each store class:
  /** The ids of the work items the store holds entries of. */
  workItemIds(): number[] {
    return [...this.workItems.keys()];
  }

// apps/desktop/src/daemon/daemon.ts, in the constructor, after `this.asked = new AskedStore(options.runDir);`:
    // The stores are keyed by a work item's id, which `repositories.json` gives. An entry of a work item that file does not hold is dropped, since the id can be given again to a new work item where the file was lost or read as no repository.
    const kept = new Set(this.store.workItems().map(({ item }) => item.id));
    const gone = (ids: readonly number[]): number[] => ids.filter((id) => !kept.has(id));
    this.keptChange("decisions", () => this.decisions.drop(gone(this.decisions.workItemIds())));
    this.keptChange("questions", () => this.asked.drop(gone(this.asked.workItemIds())));
```

The fix pass also owes a case in `apps/desktop/test/daemon.test.ts` that starts a daemon on a run folder whose `decisions.json` and `asked.json` hold entries under id 1 and whose `repositories.json` holds no work item, creates a work item, and reads `decisions: []` and `asked: null` on it and neither id in the two files. The case is shown red against `8db471d`, where the probe above passed. The docstrings of `DecisionStore` and `AskedStore` and the `dropWorkItems` docstring name the delete and the removal as the only ways out, and gain this third. The sentence "A delete and the removal of a repository take them out" in `frame/design.md` *Scope* item 15 is the orchestrator's to fold.

### 2. The policy documents say a decision shows on its line with its grounds, and the line shows only a count

```seal
severity: should
location: `docs/product.md:11`, `docs/product.ko.md:11`, `docs/architecture.md:148`, `docs/architecture.ko.md:148`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:202`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:207`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:259`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:264`
evidence: read `docs/product.md:11`, `docs/product.md:35`, `docs/architecture.md:148`, `apps/desktop/src/renderer/view.ts:188-191`, `apps/desktop/src/renderer/list.ts:138-142`, `apps/desktop/src/renderer/shared.ts:224-242`; executed `grep -n "line with its grounds\|근거와 함께 그 작업의 줄" docs/*.md`
```

Why it matters: `docs/product.md:11` says "What the orchestrator decides in place of asking shows on the work item's line with its grounds", and `docs/architecture.md:148` says "A decision made in place of asking shows on its work item's line with its grounds". The Korean lines 11 and 148 say the same ("근거와 함께 그 작업의 줄에 보이고", "근거와 함께 그 작업의 줄에 보입니다"). The code puts a count on the line and nothing else: `decisionMark` (`view.ts:188-191`) gives "2 decisions without asking", and `list.ts:138-142` draws it in the line's second row. The grounds stand in the preview and the view (`shared.ts:224-242`). `docs/product.md:35`, the paragraph this work added to *Foundation*, says so itself: "The line says how many decisions stand, and the work item's view lists each with its grounds." So one policy document states the line two ways, and `frame/design.md` *Scope* item 5 agrees with the second. The framers of #41, #22 and #53 judge against these sections (`frame/plan.md` *Overlap with the release*), and a framer that reads the first sentence would build grounds into the line.

The sentences come from the frame's own entries, so the fix rewrites the four documents' sentences and the four `to:` entries of `frame/design.md` *Data & interfaces* that hold them, in place. The Korean wording below assumes finding 3's verb as well.

```text
docs/product.md:11, and frame/design.md:202
- What the orchestrator decides in place of asking shows on the work item's line with its grounds, and the person can reverse it when they come back.
+ What the orchestrator decides in place of asking is counted on the work item's line and listed with its grounds in the work item's preview and view, where the person can reverse it when they come back.

docs/product.ko.md:11, and frame/design.md:207
- orchestrator가 묻지 않고 내린 결정은 근거와 함께 그 작업의 줄에 보이고, 돌아온 사람이 뒤집을 수 있습니다.
+ orchestrator가 묻지 않고 내린 결정은 그 작업의 줄에 개수로 보이고, 미리보기와 작업 화면에는 근거와 함께 하나씩 나옵니다. 돌아온 사람은 작업 화면에서 결정을 뒤집을 수 있습니다.

docs/architecture.md:148, and frame/design.md:259
- A decision made in place of asking shows on its work item's line with its grounds
+ A decision made in place of asking is counted on its work item's line, and the work item's preview and view list it with its grounds

docs/architecture.ko.md:148, and frame/design.md:264
- 묻지 않고 내린 결정은 근거와 함께 그 작업의 줄에 보입니다
+ 묻지 않고 내린 결정은 그 작업의 줄에 개수로 보이고, 미리보기와 작업 화면에 근거와 함께 나옵니다
```

The first bullet of `changelog.md` says "shows on its work item with its grounds", which the preview and the view hold, and needs no change.

### 3. The Korean editions call a park `세우다`, which the same documents also use for "build"

```seal
severity: should
location: `docs/product.ko.md:11`, `docs/product.ko.md:35`, `docs/architecture.ko.md:148`, `docs/architecture.ko.md:194`, `docs/architecture.ko.md:198`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:207`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:217`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:227`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:254`, `seal/threads/1795330500-no-question-holds-the-run/frame/design.md:264`
evidence: executed `git grep -n "세워\|세우\|세웁\|세울" 6f10cd0 -- docs README.ko.md` and `grep -n -o ".\{0,25\}세[우웁워울].\{0,15\}" docs/product.ko.md docs/architecture.ko.md`; read `docs/roadmap.ko.md:36`
```

Why it matters: `gaps.md` *Not verified* hands this round "Whether the Korean paragraphs read as natural Korean to a person". The paragraphs are complete sentences in the plain register and keep the English meaning, with one exception. They render "park" as `세우다` / `세워 두다` twelve times. Outside a car, `작업을 세우다` reads first as "set up a work item", the sense of `계획을 세우다`. The Korean edition already uses the verb that way: `docs/roadmap.ko.md:36` says "Owlery가 먼저 세울 것은 사람이 일을 맡기고 자리를 비우는 앱이기 때문입니다", where `세울` means "build". So "그 질문이 속한 작업 하나만 세웁니다" (`docs/product.ko.md:11`) can read as "it sets up only the one work item". "작업 하나만 세웁니다" in the bold sentence of `docs/architecture.ko.md:198` can be read the same way. The plugin's `skills/writing-style/SKILL.md` *용어는 실물을 확인하고 고른다* names this case ("그 분야 밖에서 다른 뜻이 먼저 떠오르는 말은 피한다"), and agents read these documents and judge against them. The paragraph's own last sentence already says `멈춥니다` for the same act.

The replacements are listed in full, every occurrence by its line. Each is applied to the document and to the `to:` entry of `frame/design.md` that holds the same sentence (lines 207, 217, 227, 254, 264).

```text
docs/product.ko.md:11
- 어떤 질문도 실행 전체를 세우지 않습니다.
+ 어떤 질문도 실행 전체를 멈추지 않습니다.
- 그 뒤에 생긴 질문은 그 질문이 속한 작업 하나만 세웁니다.
+ 그 뒤에 생긴 질문은 그 질문이 속한 작업 하나만 멈춰 둡니다.

docs/product.ko.md:35
- 세워 둔 작업의 줄에는 그 질문이 보입니다.
+ 멈춰 둔 작업의 줄에는 그 질문이 보입니다.
- 세워 둔 작업은 사람을 기다리는 작업들과 함께 놓이고
+ 멈춰 둔 작업은 사람을 기다리는 작업들과 함께 놓이고
- 결정은 아무것도 세우지 않습니다.
+ 결정은 아무것도 멈추지 않습니다.

docs/architecture.ko.md:148
- 묶음 뒤에 생긴 질문은 그 작업 하나만 세우고
+ 묶음 뒤에 생긴 질문은 그 작업 하나만 멈춰 두고

docs/architecture.ko.md:194
- 늦게 생긴 질문에 기본값을 택할지 그 작업을 세울지
+ 늦게 생긴 질문에 기본값을 택할지 그 작업을 멈춰 둘지

docs/architecture.ko.md:198
- 그 뒤에는 스스로 결정하거나 작업 하나만 세웁니다.
+ 그 뒤에는 스스로 결정하거나 작업 하나만 멈춰 둡니다.
- 기본값이 없으면 데몬이 그 작업 하나를 질문과 함께 세워 둡니다.
+ 기본값이 없으면 데몬이 그 작업 하나를 질문과 함께 멈춰 둡니다.
- 세워 둔 작업이 다른 작업에 번지지 않게 하는 것은 데몬의 코드입니다.
+ 작업 하나를 멈춘 것이 다른 작업으로 번지지 않게 하는 것은 데몬의 코드입니다.
- 작업 하나를 세워도 다른 작업에서는
+ 작업 하나를 멈춰 두어도 다른 작업에서는
- 사람이 앱에서 답하면 세워 둔 것이 풀립니다.
+ 사람이 앱에서 답하면 멈춰 둔 것이 풀립니다.
```

The 세워 둔 작업이 replacement also fixes a second fault of that sentence: it said the parked work item itself spreads to the others, where the English says the park is kept to one work item. The other Korean sentences read as Korean, so this round opens no finding for them. Two sentences keep an English inanimate subject that the Korean rules ask to recast: "약속이 없애려는 것이 바로 그 기다림입니다" and "그 요청이 맡긴 모든 작업" (`docs/product.ko.md:11`). They read correctly, and whether they are the product's voice is the owner's call.

## Confirmations

What matched: *Scope* items 3 and 8 and the rule's "a park starts nothing, stops nothing and refuses nothing in any other work item" (`docs/architecture.md:198`). `Daemon#decided` (`daemon.ts:261`) and `Daemon#park` (`daemon.ts:290`) touch no session, start no timer, and write only their own store before one `broadcastInbox`. The `start` case (`daemon.ts:415`) and the `ask` case (`daemon.ts:824`) read no record of a park, so the parked work item's own panes and "Ask" are served as before. `git grep` of `asked` and `parkedWith` over `apps/desktop/src/daemon` prints no other reader. Executed: `node scripts/test-in-electron.mjs test/daemon.test.ts -t "the questions a work item is parked with|the decisions made without asking|carries only the fields the protocol names"` in `apps/desktop`, exit 0, 17 passed. Scenario 5's case is among them, with a pane started in A and in B, an `ask` in A, a third work item created, and B's headless session finishing after the `inbox` that carries the park.

What matched: the stores survive a restart and drop as stated for a delete and a repository's removal. Both removal paths reach `dropWorkItems` (`daemon.ts:541` for a removal that keeps the folders, and `daemon.ts:1006` for each delete, which a removal that deletes runs per work item). `dropWorkItems` drops both stores (`daemon.ts:959-960`). Archiving touches neither store, so `archived` lists both. Both stores write through `writeWholeFile`, readable by the user alone, which the daemon's restart cases read as mode `0600` (executed in the run above). The gap is the start on ids the repositories no longer hold, finding 1.

What matched: the rule and AgenticSeal 0.38.4's. The source says the batch covers every issue a request names, asked once before the first edit of its first work item. It says an issue's "a person decides" is checked against the policy root, the config, the code and the earlier work items' records before it enters the batch, and that an answer found there is written down with its coordinate. `docs/architecture.md:198` and the two new rows at `docs/architecture.md:193-194` state the same, and add Owlery's two steps beyond the plugin: a later question parks one work item, and a decision shows in the inbox. Read: `skills/implement/orchestration.md` lines 194 to 248 of the installed plugin. The heading and table-row counts of each document and its Korean edition change by the same numbers (two rows, no heading, read from the diff). The broad gate's comparison of them is the orchestrator's run.

What matched: the window reads a daemon of an earlier build. `parkedWith`, `askedSection` and `decisionsOf` (`view.ts`) read a missing field as none, and `isWorkItem` in `last-look.ts` takes a look without either field. Read, and held by the view and last-look cases that phases 2 to 4 report as run.

What matched, answering the four rows of `gaps.md` *Not verified* that name the proofer, each `read`:

- The preview's list and the line's mark on the history and the archived screen. `renderer.ts:215-217` builds all three screens from one `listScreen`. Its preview calls `detail` (`list.ts:116`), and its lines call the one `lineElement` (`list.ts:131-143`), so the three screens draw what the inbox's line and the view draw, which the built-app case reads. How they look stays the owner's.
- The notification at a park and its click (`renderer.ts:1060-1080`). `heldBefore` is taken before the lists are replaced, with the archived ones among it, and `parkNotifications` (`view.ts:299`) leaves out a muted one and the one in front of a focused window. The click brings the window forward and opens the view only where the work item is still listed. The age from the park is `lineSince` (`view.ts:103`), and every drawing of an age reads it: `list.ts:110` and `list.ts:138`, `sidebar.ts:181`, `summary.ts:50`, and `work-item-view.ts:848`.
- A choice and a typed answer through an `inbox`. The section `#questions` stands outside `#view-detail` and `#view-fact-list` (`index.html:583-593`), which are the only parts `showView` replaces (`work-item-view.ts:855`, `work-item-view.ts:865`). `showQuestions` returns before it redraws the questions where the key is unchanged (`work-item-view.ts:691`). A redraw comes only for another work item, another park, or the answer.
- The summary with a count of decisions. `held.changes` is `changesSince(...)` (`renderer.ts:1273`), whose entries carry `decided`, and `summary.ts:42` draws `summaryHead(look !== null, held.changes)` and each line's `sentence`. So the summary draws what scenario 15's cases read.

What matched: the renderer mutant that survived in phase 4, `reverseMessage.focus()` taken out of `openReverse` (`renderer.ts:718`). `opened` calls `showModal` (`renderer.ts:337-344`). The dialog's first focusable element is the field `reverse-message` (`index.html:790-796`), ahead of "Cancel" and "Reverse", so the dialog's focusing steps put the keyboard there with or without the line. The break changes no behaviour while the markup keeps the field first, and the phase 4 record's account holds. The line is the file's own pattern: `openGroup` ends with `groupName.focus()` the same way. The score licenses *tested* for the other two breaks of `renderer.ts`, not *safe* for the file.

What matched: the account's claims that were checked against the code. They are the phase 2 departures (the dialog for "Reverse", `CameLater`, the cut through `cutText`), the phase 3 departures (the section in the page's markup, the three further refusals of `park`, the two of `answerQuestions`, `lineSince`), and the phase 4 departures (`Change.decided`, `writeRun`). Each stands at the coordinate its record names, and the fold at the end of `frame/design.md` *Data & interfaces* names them. Each quote of `pr.md` stands at its source: the strings "Waiting for you", "Waiting for your answer", "Decided without asking", "Reverse" and "1 waiting for you. 3 decisions made without asking." in `view.ts` and its cases, "Get a seal" at `docs/roadmap.md:22`, and the comments carried to #50, #51 and #53 on 2026-11-22.

Two small observations open no finding. The texts are trimmed before they are cut at 2000 characters (`daemon.ts:264`, `daemon.ts:295-305`, `daemon.ts:617`, `daemon.ts:644`), so a text whose 2000th character is white space is stored ending in it, against the letter of *Data & interfaces* "A text is stored without the white space at its ends". No reader acts on the difference. "Reverse" is redrawn with the right column at every `inbox`, so a person who reached it by Tab loses the keyboard at the next `inbox`. The headless list's "Stop" button behaves the same way (`work-item-view.ts:640-667`), and no scenario names the keyboard for "Reverse".

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite at HEAD, the typecheck and the documents' heading and row comparison: labelled `unverified` by every phase record, and honestly so. This round ran one narrow command of `daemon.test.ts` and no other file | `seal/config.json`, key `Broad gate` | the orchestrator, by the broad gate after the rounds settle |
| The branch does not merge cleanly with `origin/release/v0.0.2` at `c3cf61c` (#125): `git merge-tree --write-tree --name-only HEAD c3cf61c` reports a content conflict in `apps/desktop/src/renderer/work-item-view.ts`, where #125 moved `CARD_SHOW_MS` and `CARD_LEAVE_MS` into `view.ts` beside the lines this work added. `view.ts`, `built-app.ts` and the two `docs/architecture` editions merge without a conflict. The broad gate and the sealer read a HEAD that holds the merge | `apps/desktop/src/renderer/work-item-view.ts:79-91` | the orchestrator, before the broad gate |
| How the decisions' list, the mark, the dialog and the questions' section look in both themes, and whether their words are the product's | `apps/desktop/src/renderer/index.html` | the owner, in the running app, as `gaps.md` names it |
| Whether "약속이 없애려는 것이 바로 그 기다림입니다" and "그 요청이 맡긴 모든 작업" are the product's voice in Korean | `docs/product.ko.md:11` | the owner |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_orphan.test.ts` in `apps/desktop`, once | The probe wrote `decisions.json` and `asked.json` with entries under id 1 into a run folder with no `repositories.json`, started a `Daemon` on it and created one work item. Exit 0. It printed the work item's fields through `console.log`, which the runner did not show, so it settled only that the new work item took id 1. The file was removed from the worktree |
| `node scripts/test-in-electron.mjs test/test_tmp_orphan2.test.ts` in `apps/desktop`, once | The same setting, asserting the defect. Exit 0, 1 passed: the new work item, id 1, held the decision `{ id: 1, kind: "route", says: "Old.", … }` and an unanswered park by "sealer" asking "An old question?". This is finding 1. The file was removed from the worktree, and `git status --short` printed nothing afterwards |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "the questions a work item is parked with\|the decisions made without asking\|carries only the fields the protocol names"` in `apps/desktop` | Exit 0, 17 passed, 214 skipped |
| `git merge-tree --write-tree --name-only HEAD c3cf61c` | Exit 1, with a content conflict in `apps/desktop/src/renderer/work-item-view.ts` |
