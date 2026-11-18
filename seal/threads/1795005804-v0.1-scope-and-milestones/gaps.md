# Closing memo: the v0.1 scope and its milestones

## Not verified

| Item | Who must answer |
|---|---|
| The `Broad gate` command of `seal/config.json` at the head of the branch. Phase 2 ran it once as a narrow check at `73d3850`, where it exits 1 with `table rows differ: docs/architecture.md docs/architecture.ko.md`. The stage table left the English edition in phase 2, and the Korean edition and `docs/roadmap.ko.md` are phase 3's | The orchestrator, in the broad run after the review rounds settle |
| That each anchor in `docs/roadmap.md`, `docs/architecture.md` and `README.md` resolves on GitHub's rendered page. Phases 1 and 2 compared the anchors with the target files' headings by a rule of their own | The proofer, by opening each link's target heading as scenario 4 of `frame/design.md` asks |
| closed That Anthropic's two published documents say what `docs/roadmap.md` *Work that runs beside the milestones* and `docs/architecture.md` *Authentication of the Claude adapter* rest on | Phase 2 fetched both pages on 2026-11-18. The Agent SDK overview came back as the page's text, which holds the sentence on claude.ai login and rate limits and nothing on another product launching the user's logged-in CLI. The support article came back as a model's answer that quoted its title and its two dated updates, and said the article does not address that launch. The orchestrator's earlier fetch, in `frame/design.md` *Grounding*, read the same |

## Not done

Phase 2 left three things within reach, each for a reader to weigh.

- **One sentence of the old *Build order* has no home now.** The section's opening paragraph said that AgenticSeal already shows the value of its process inside Claude Code, so what Owlery must establish first is the experience of an app a person hands work to and steps away from. `frame/design.md` *Removes* sends that paragraph to `docs/roadmap.md` *Milestones* and *Why this order*, and neither holds the sentence. Phase 2 removed it as *Removes* states and did not add it to `docs/roadmap.md`, because a fifth ground in *Why this order* is a change to what phase 1 delivered and to the four grounds the frame fixes.
- **The reason for the skeleton stands in two documents.** `docs/architecture.md` *Build order* says the structure need not be redone when the process is built on the shell, and `docs/roadmap.md` *Why this order*, ground 1, says the same in its second sentence. *Scope* item 8 keeps the rule in the architecture document, milestone 1 of the roadmap cites *Build order* "for the reason" it gives, and the frame's ground 1 holds the same reason. Phase 2 did not edit `docs/roadmap.md`, which is outside its plan row. Scenario 4 of `frame/design.md` reads this pair.
- **`README.md` still lists "the build order" among what `docs/architecture.md` holds.** The section keeps its heading and now holds the skeleton rule and what follows v0.1. *Scope* item 12 asks for one new row and no change to that one.
