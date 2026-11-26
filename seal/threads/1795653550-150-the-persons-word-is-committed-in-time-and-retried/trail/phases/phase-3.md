# Phase 3: 1795653550-150-the-persons-word-is-committed-in-time-and-retried

## What this phase found

**The frame holds for this phase.** Each coordinate that phase 3 builds on was opened at `3caf2e1f` before the first edit: `shared.ts#detail`, the `decided` part of `list.ts`'s line, `view.ts#decisionMark` and `#unreadLines`, the `.line .decided` and `.decisions .unread` rules of `index.html`, `WorkItem.wordOwed` and `WordOwed` in `protocol.ts`, the row "A row of a list of records" in both editions of `docs/design.md`, and `describe("the decisions made without asking")` in `test/view.test.ts`. Each stands as `frame/design.md` *Data & interfaces* and *Scope* items 10 and 11 say. Phase 2's record says `why` of a `retry` ends with no period, and the code of phase 2 gives it so (`read`, `daemon.ts#failedWhy`), so the sentence adds its own.

**Decisions settled while writing the code.**

- The two functions are `view.ts#wordOwedSays`, which gives `{ text, failed }` or null, and `view.ts#wordOwedMark`, which gives "word not committed" for `retry` and an empty string otherwise. A `wordOwed` that is absent reads as null through `?? null`. Judged against *Data & interfaces*, the `view.ts` item, and scenario O.
- The sentence is an element of its own, the part `word-owed`, which `detail` puts after the approval line and before the decisions' section. It is not drawn inside that section, because the section is drawn only where a decision or an unread line stands, and a work item that owes an answer alone may hold neither. *Scope* item 10 says "above the decisions", and the sentence stands above them wherever they are drawn. In the preview's grid it spans every column, as the decisions do.
- The line's words join the decisions' count in its one part, `decided`, with ", ", as `decisionMark` joins its own two counts: "1 reversed, word not committed". They take that part's ink, `--ink-faint`, and `--ink-muted` on a selected line. *Data & interfaces* says `list.ts` appends the words to the part that holds the count, and *Scope* item 11 states an ink for the sentence alone. The join is in `list.ts` and no case pins it; `gaps.md` carries it.
- The sentence is plain text, wrapped, and the person can select it, as the unread line under the decisions is, since git's reason in it can be long. The row of `docs/design.md` and of `docs/design.ko.md` says so beside the place and the ink that *Scope* item 11 names. Judged against `docs/design.md` *Principles*, 8, which has every form stated there.

**The two editions of the row were read against each other** (`read`). Each states the same four facts: the sentence stands above the decisions in the preview and in the work item's view, it is wrapped and can be selected, it is in `--ink-muted` while the word waits for a session, and it is in `--state-failed` where its commit failed. Each edit stays inside the row's cell, so neither edition gains a heading or a table row. The broad gate's count of both is the orchestrator's.

**Seen red.** The three new cases of `describe("a word of the person's that no commit holds")` ran first against `3caf2e1f` with the code not yet written, and each failed with `TypeError: wordOwedSays is not a function` or `wordOwedMark is not a function` (`executed`, exit 1). Then each guard was broken alone with `seal mutate` over `94acfe34`, running the three cases (`executed`, every verdict `red`, exit 0). The failing case and its line were read for each run (`read`).

| Break of `view.ts` | Case that failed | At |
|---|---|---|
| the `retry` sentence loses "Owlery tries again." | the sentence | `toEqual` of the `retry` sentence |
| the `session` sentence loses "Owlery commits it once that has ended." | the sentence | `toEqual` of the first `session` sentence |
| a `retry` is not a failure | the sentence | `toEqual` of the `retry` sentence |
| a `session` is a failure | the sentence | `toEqual` of the first `session` sentence |
| no return of null where nothing is owed | nothing owed | `TypeError` at `null.waits` |
| an absent `wordOwed` is not read as null | nothing owed | `TypeError` at `undefined.waits`, the earlier build's work item |
| the `retry` and `session` sentences swapped | the sentence | `toEqual` of the first `session` sentence |
| the line is marked for any `wordOwed` | the line's words | `expected 'word not committed' to be ''`, the `session` line |

`shared.ts`, `list.ts` and `index.html` changed with no case of their own, since no unit case loads the page. `gaps.md` names who answers each.

**The phase boundary.** The *Verified by* cell names `test/view.test.ts`. `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* also asks for each test file that reads a changed path. Read as the files that import `view.ts`, and the files that read `index.html`, `docs/design.md` or `docs/design.ko.md`, that adds `test/themes.test.ts`, which reads all three as text, and the built-app files `test/theme-controls.test.ts`, `test/terminal-basics.test.ts` and `test/work-item-menu.test.ts`, which import a constant of `view.ts`. `test/decisions-and-questions.test.ts` imports none, but it reads the text of the line's `decided` part, which `list.ts` now composes, so it ran too. No test file imports `shared.ts` or `list.ts`. The six files ran in one command through the repository's runner with `OWLERY_BACKGROUND=1`, at `94acfe34`, and every case passed (`executed`, exit 0, 633 cases). `tsc --noEmit` passed at `94acfe34` (`executed`, exit 0). The repository configures no linter and no formatter.

The other built-app files load the page too, and they did not run. None of them sends a reversal or an answer (`read`: a search of each for `reverseDecision`, `answerQuestions` and `reversed` found none), so no work item of theirs owes a word. The sentence and the line's words are then drawn in none of them, and the `decided` part's text for a `wordOwed` that is null or absent is the decisions' count alone, as before. `test/screenshots.test.ts` belongs to phase 4.

**For phase 4.** The line's words are in `#inbox-lines button[data-work-item="<id>"] .second .decided`, after the count of the decisions: for the parked work item of the scene, with one reversal and a failed commit, "1 reversed, word not committed". The sentence is the element `.detail .word-owed.failed` in the preview and in the view, and its text is "The record holds a word of yours that was not committed: " with the hook's first line that is not empty, its periods and its colon at the end cut off, then ". Owlery tries again.".
