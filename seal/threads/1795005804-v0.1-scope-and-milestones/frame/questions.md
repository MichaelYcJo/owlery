# Questions for the planner: the v0.1 scope and its milestones

Judgments the ticket (#1) left open that the tree answered. None is a question any more.

- The order of the milestones, which the owner handed to the framer: `frame/plan.md` *Alternatives considered*, the rows for orders A, B and C.
- Whether each milestone is a release of its own (the ticket's item 7): `frame/plan.md` *Alternatives considered*, the two rows on `release:` milestones and version numbers.
- Which document holds the order, and what stays in `docs/architecture.md` *Build order*: `frame/plan.md` *Alternatives considered*, the three rows on the stage table and the heading.
- Whether this pull request edits the policy root directly: `frame/design.md` *Grounding*, the paragraph above the table.
- How a reviewer checks that no competitor product is named: `frame/design.md` *User scenarios & acceptance*, scenario 6.
- Whether a third place waits on Anthropic's answer besides the two the ticket's item 8 names: `frame/design.md` *Grounding*, the row on lines 57, 334 and 344.
- What the new document is named, and why not after the one version: `frame/plan.md` *Alternatives considered*, the three rows on the document's name.
- What v0.1 is called in the committed documents: `frame/design.md` *Grounding*, the row on "the first version".

What is undecided about v0.1 itself is not asked here. Each such matter is a row of the new document's *Open decisions* (`frame/design.md` *Data & interfaces*), and the document is complete with those rows open, so no answer changes what this work builds.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Which command is the `Broad gate` of `seal/config.json` for this repository? The key is unset, and the repository holds no code and no suite. The tree cannot answer it and no probe can, because it is a value the owner chooses, and the owner said on 2026-11-18 that they will name it during this work. | a person | A command that checks the documents, such as a Markdown link check: the seal then guarantees that check passed at HEAD. A command the owner picks for later code: it may have nothing to run on a tree of documents. Either way the answer changes no file this work's phases write. It holds the broad run and the seal, not the build. | None. The framer and the build choose no command, and the phases proceed without it. | answered 2026-11-18 by the owner: a documents check (each English document under `docs/` and `README.md` has a Korean edition with the same counts of headings and table rows, and the ruled-out Korean word for seal appears nowhere), written into `seal/config.json` at `7a45bfb` |
| Q2 | Which Korean words does `docs/roadmap.ko.md` use for the terms the existing Korean editions do not hold yet, "milestone" and "done criteria" among them? No committed document uses them, so reading cannot settle it. | the work | Phase 3 decides when it writes the translation and records the words in its phase record. It reuses every term the existing editions already translate (`frame/design.md` C4). | 마일스톤 for milestone, and 완료 기준 for done criteria. | open |
