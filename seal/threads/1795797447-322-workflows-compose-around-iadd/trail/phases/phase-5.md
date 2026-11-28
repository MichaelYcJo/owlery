# Phase 5: 1795797447-322-workflows-compose-around-iadd

## What this phase found

**The frame holds, but for two things it states.** I judged it against `frame/design.md` *Scope* items 1 and 12, *Data & interfaces*, `## Removes` and *User scenarios & acceptance*, against `frame/plan.md` row 5, *Overlap with the release* and *Operational impact*, and against `frame/questions.md` Q1, Q2, Q3, Q4 and Q7.

- **No version moves here.** The plan's row 5 asks for the changelog fragment "with the version move *Operational impact* states". `frame/questions.md` Q1's answer says that #323's pull request, the release's first, moved `apps/desktop/package.json`, so this phase moved nothing, as the spawn said.
- **The two acceptance searches print lines outside the files their rows list.** `docs/iadd.md` and its Korean edition hold "Merge on Seal" in the names set aside, which *Scope* item 1 asks for. Code comments, a prompt string and many case titles outside this phase's Delivers print too. `gaps.md` *Not done* lists each and names the orchestrator.

**What stays in the earlier words, and why.** Each was judged against *Scope* item 12 and `routing.md` *Records format of this repository*.

- **Shipped releases.** The rows of `docs/roadmap.md` *Releases and the tracker* for 0.0.2 to 0.1.0 are unchanged. So is milestone 2's row, which those releases shipped. Its one link moved to the renamed section *The inspection* of `docs/product.md`, since a link to a heading that is gone opens nothing.
- **This repository's own process.** The sentences that state how this repository's records, check and settle run keep the plugin's names: `seal/`, `owlery-seal.yml` and its check `seal`, its pin at 0.1.0, and `seal settle --apply`. They stand in `docs/roadmap.md` ground 4, the settle bullet and the first done criterion, and in `docs/architecture.md` *Where Owlery started*.
- **The plugin as it is.** The first column of the table in *Where Owlery started*, the table of *What changes because Owlery is not a plugin*, and two dated measurements in *Measure before building* name the plugin's seal, sealer and `seal` commands, since they state what the plugin has.
- **A dated probe.** `docs/architecture.md` *What each session loads* keeps that the probe of 2026-11-24 listed the skill `owlery:seal`, and now says that this was the skill's name before the rename.

**What went, and what took its place.** Judged against `## Removes`, its row on the sections that state Owlery by AgenticSeal.

- `docs/architecture.md` *Compatibility with AgenticSeal* and *Taking in AgenticSeal's changes* went, in both editions. Their one true sentence of process, the pin of this repository's check, moved with its `check:` line into a paragraph of *Where Owlery started*, which also holds that this repository's records stay in the plugin's forms until its move. Their sentence that Owlery's check still reads records in the plugin's form went, since `pr-check/` reads `iadd/` alone (*Scope* item 3). The sentence that the bundle is released with the app joined the paragraph on what Owlery took.
- `README.md` *Relationship to AgenticSeal* went, in both editions, for *Where Owlery started*, which says that AgenticSeal is a Claude Code plugin of the same method and that the owner set on 2026-11-28 that it becomes `iadd`.
- The renamed sections are `docs/product.md` *The inspection*, *The inspection belongs to the product and looks the same everywhere*, *What an inspection guarantees and what it doesn't* and the foundation's heading, `docs/architecture.md` *Where Owlery started*, and `README.md` *The inspection check on GitHub*. Each link to them was rewritten. A script that builds GitHub's anchor from each heading found no link between the documents that opens nothing.

**Where #323's rules stand.** #323 handed rules 31 to 34 and 39 of the merged list in issue #323's body (`frame/plan.md` *Overlap with the release*). This phase wrote each:

- Rule 31, composable workflows with the Owl Chain as the default system setting: `docs/iadd.md` *Workflows*, and the paragraph of `docs/product.md` *What we promise*, which also says the app reads no workflow but the Owl Chain yet.
- Rule 32, Owlery follows IADD under *Zero Self-Approval* and its five principles, as one tool that runs it: `docs/iadd.md` *The concept* and *The principles*, `docs/product.md` *What we promise*, and `README.md`.
- Rule 33, the rule the names follow and the names set aside: `docs/iadd.md` *Names*.
- Rule 34, the part of 2026-11-28: `docs/name.md` *Why this name*, its bullet on IADD and Owlery, and the table of `docs/iadd.md` *The names*.
- Rule 39, the missing part, one vocabulary and one records folder with no table of names: the opening of `docs/iadd.md` and of `docs/architecture.md` *Where Owlery started*.

**Q7 stands in two documents.** The broad gate is the Owl Chain's inspector module's own check, in `docs/iadd.md` *What is the Owl Chain's alone*, and `docs/product.md` *What an inspection guarantees and what it doesn't* states its guarantee of the Owl Chain.

**The Korean words.** The Korean editions use Q2's words: 검수자, 검수, 검수 통과, 검수 실효 and 검수 없음. "Inspection sheet" is 검수 시트, and the mark is 검수 표식, the word phase 2 gave the `--inspection-*` sentence of `docs/design.ko.md`. The Korean documents' own words stay: 전체 검사 for the broad gate, 역할 묶음 for the role bundle and 칸 for a pane. The Owl Chain is written as a name, in Latin letters, in both editions. The Korean editions name the plugin's seal 인장 where an English sentence keeps the plugin's seal.

**A sentence the tree no longer held.** `README.md` *Run it* said that no seal exists yet and that review rounds come with milestone 2. It now says that they came with milestone 2. The README's new paragraph on the Owl Chain says that milestone 3 has the daemon run it for a handed-over issue, since no handed-over issue runs a chain today (`docs/roadmap.md` *Milestones*).

**The closing memo.** The paragraphs of `gaps.md` *Not done* that left the prose to this phase went, since this phase wrote it: `docs/roadmap.md`'s `--apply`, `docs/architecture.md` on the check and the move, the lines `:161`, `:167`, `:270`, `:302` and `:325` the earlier phases named, the documents' prose on `owlery-seal.yml` and `seal/` as the product's, and `docs/design.md`'s quoted window words. The read account of the fix pass after the built-app run at `155f7be6` now says that this phase rewrote `docs/architecture.md:325` in both editions.

**No process table.** `docs/layout/the-record-layout.md` *A change writes fragments, never a shared file* asks for `### Process changes` where a diff changes the plugin's `skills/core/SKILL.md`, `CLAUDE.md`, an `agents/*.md` file or one of the listed orchestration files. Those paths are the plugin's (contract rule 11), and this work item's diff changes none of them or this repository's `CLAUDE.md`. The role bundle's `agents/inspector.md` is the product's file. So `changelog.md` holds no table, and the hand-back names this reading.

**Checks run, and none that a case runs.** This phase changed documents alone and added no behaviour, so no case was written and no unit was mutated.

- The docs leg of the broad gate, the loop over `docs/*.md` and `README.md` and the search for the forbidden word, exited 0 at `88b42a8b`.
- Each `check:` line of `docs/` names a file that exists, by a loop over the lines at `88b42a8b`.
- The two acceptance searches ran at `88b42a8b`. `gaps.md` *Not done* holds what they print outside their rows.
- `role-bundle.test.ts` and `themes.test.ts` were not run, since the spawn ran no case. `gaps.md` *Not verified* names them.
