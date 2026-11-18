# Implementation Plan: the v0.1 scope and its milestones

## Technical context

The tree as read at `9aa6d7c`.

The repository holds no code. The work is text in the policy root: three pairs of documents under `docs/` (`architecture`, `product`, `name`, each with a `.ko.md` edition of the same structure) and the README pair, whose *Documents* table lists them. `docs/architecture.md` *Build order* (lines 225 to 237) holds a three-stage table and three bullets, and `docs/architecture.ko.md` *만드는 순서* holds the same at the same lines. `docs/product.md` line 27 and `docs/product.ko.md` line 27 cite that section by its heading, and `docs/architecture.md` line 343 names its stages.

Constraints the build works under are C1 to C5 of `frame/design.md` *Scope*. The private notes name competitor products on most lines, so the build carries each capability over in its own words and copies no sentence from them.

**The failure scenario of the chosen approach.** `docs/v0.1.md` is named after one version. When 0.1.0 ships, its milestones are history, and a policy document must still be true in six months. The work item that plans v0.2 then has to settle what the document becomes. The order's third ground also rests on a judgment that can change: if Anthropic's published documents come to forbid headless launches, milestone 2 is built on role sessions in terminals, and its row and the first milestone's headless session are rewritten.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| **Order A, chosen:** shell, "Get a seal", "Hand over an issue", the person's hands on the work, after the PR and limits | The workspace capabilities a person uses by hand arrive fourth, so for three milestones the owner stages, commits and opens PRs in the terminal | Chosen. It keeps the committed order of `docs/architecture.md` *Build order*, builds the person's review tools once, against a seal that exists, and meets a change in the judgment on headless launches while little stands on the daemon. `frame/design.md` *Data & interfaces*, "Why this order", holds the four grounds |
| **Order B, daily use first** (the ticket's second candidate): shell, the workspace baseline, the process and the ledger, after the PR and limits | Line comments, staging by hunk, hand commits and the merge button are each defined by `docs/product.md` *File explorer and editor* in terms of the seal. Built before it, each ships without that behaviour and is reworked in the next milestone. The back of the seal arrives third, and the committed section says what a late one costs | Rejected. The daily use it buys early is mostly in milestone 1 already, and Owlery's PRs are sealed by the plugin meanwhile |
| **Order C, evidence first as one step** (the ticket's first candidate): shell, the whole process and the ledger, the workspace baseline, after the PR and limits | The second milestone holds the role bundle, the daemon's order, the records, the PR check, the question screen, the depth judgment and the tracker at once. It is the largest step of v0.1, and no number reaches the back of the seal until all of it works | Rejected in favour of A, which is the same order with that milestone cut in two at the line `docs/product.md` *Foundation* already draws between the two paths to a seal |
| **Keep the stage table in `docs/architecture.md` as the home, and have the new document link to it** (keeps the structure) | The stages are Shell, Port, Extend, and v0.1 needs five milestones of which two fall outside any stage. Either the architecture document grows a second, v0.1-only table, or the two documents each hold a part of one order | Rejected. The premise that would keep the table is that its stages are the units of v0.1, and Grounding shows they are not |
| **Replace the table and keep the heading**, chosen: *Build order* keeps the skeleton rule and what follows v0.1, and links to `docs/v0.1.md` | A reader who opens *Build order* for the order of v0.1 finds a link and one more click | Chosen. The premise for keeping the heading is checked: two files outside this work's edits cite it by name (executed: the `git grep` in `frame/design.md` Grounding) |
| **Remove *Build order* whole** and re-point its citations | `docs/product.md` and `docs/product.ko.md` enter the diff for a citation alone, and the fact about branches built by other agents needs a new home that is not about v0.1 | Rejected |
| **One document for every version**, such as a roadmap | The scope of v0.2 and later exists only in the notes and is not decided. The document would state it as settled or carry it all as open rows | Rejected. A later work item can widen the document when those versions are decided |
| **One `release: 0.1.0` for all of v0.1** (the ticket's item 7) | Every issue of v0.1 sits in one milestone whose description cannot state their order, no tracker event marks a milestone done, and the owner dogfoods builds that were never released | Rejected for one `release:` milestone per v0.1 milestone. `frame/design.md` *Data & interfaces*, "Releases and the tracker", holds the grounds |
| **Keep "Anthropic's answer" as the criterion and send the question** (the structure the committed text has) | The owner judges that such an inquiry goes unanswered, so the row would stay open with no date and the commercial launch would wait on it | Rejected by the owner's decision of 2026-11-18 (#1, item 8). The premise that would keep it, that an answer arrives, is the one the owner rejected |
| **Milestones released as 0.1.0 to 0.5.0** | `docs/product.md` and `docs/architecture.md` already use v0.2 and v0.3 for the phone and for other companies' models | Rejected |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1, 3, 4, 5, 6, 7 and 17: `docs/v0.1.md` whole | `frame/design.md` scenarios 1, 3, 8 and 10, read. Scenario 6's two commands and scenario 7's command, run over the tree after the commit, each printing nothing | |
| 2 | *Scope* items 8, 9, 10, 13, 14 and 15, and item 12 for `README.md`: the English edits to `docs/architecture.md` | Scenario 4, read, with each link's target opened. `git grep -n -e 'check with Anthropic' -e "Anthropic's answer" -- docs README.md` prints nothing, and the three rewritten places are read against items 13 to 15. `git grep -n -e 'port stage' -e 'extension stage' -- docs README.md` prints nothing. `git grep -n 'Build order' -- docs` still prints the heading at `docs/architecture.md` and the citation at `docs/product.md` line 27 | |
| 3 | *Scope* items 2, 11 and 16, and item 12 for `README.md`'s Korean edition: `docs/v0.1.ko.md`, `docs/architecture.ko.md` and `README.ko.md` | Scenarios 2, 5, 7, 9 and 11 as written. Scenario 6's second command again over the whole tree. `grep -c '^#' docs/architecture.md docs/architecture.ko.md` and `grep -c '^|' docs/architecture.md docs/architecture.ko.md` each print two equal counts | |

The English is finished before it is translated, so a change in phase 2 does not have to be made twice. No phase has a test to run, because the repository has no code and no suite. The broad gate is the orchestrator's, and its command is not named yet (`frame/questions.md` Q1).

## Overlap with the release

The spawn names no other open work item of the release, and `seal/threads/` holds this one alone (executed: `ls seal/threads`), so none meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

None for a deployer: no code, no dependency and no setting changes. The pull request moves no version. The document it adds commits the owner to one `release:` milestone per v0.1 milestone on the tracker, and creating those milestones is outside this pull request.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
