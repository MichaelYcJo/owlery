# Questions for the planner: a release takes its number when it is cut (issue #278)

The judgments the ticket left open that the tree answered:

- The goal "v0.1" is renamed "the first version": `frame/plan.md` *Alternatives considered*, the first three rows.
- The release table keeps rows only for numbered releases, and a second table holds the goal milestones: `frame/plan.md` *Alternatives considered*, rows 4 to 6.
- Until rule 5 lands, a release's number is proposed and approved when its branch is cut, and stays: `frame/plan.md` *Alternatives considered*, rows 7 to 9, and `frame/design.md` *Grounding*, the row on `apps/desktop/src/daemon/records-place.ts`.
- #78's operations on *Releases and the tracker* are carried in this rewrite: `frame/plan.md` *Alternatives considered*, rows 10 and 11, and `frame/design.md` *Grounding*, the row on #78's design.
- The goal milestone table follows the order the orchestrator's spawn listed the milestones in, and states no order beyond *Why this order*'s for milestones 1 to 5: `frame/design.md` *Scope* item 3. Another order would change no rule.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Does the Korean diagram line in `docs/architecture.ko.md:20` keep the box's right edge in its column once "(v0.2)" becomes its Korean "later"? Hangul takes two columns in a fixed-width font, and the width depends on the words the crafter picks, which this frame does not fix. | the work | Pad with spaces so the edge stays in its column / leave the edge where the new words put it | Pad, as the line is padded now | open |
