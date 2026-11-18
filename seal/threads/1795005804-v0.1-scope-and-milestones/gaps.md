# Closing memo: the v0.1 scope and its milestones

## Not verified

| Item | Who must answer |
|---|---|
| The `Broad gate` command of `seal/config.json` at the head of the branch. Phase 3 ran it once as a narrow check at `21cdd85`, where it prints nothing and exits 0. The commits after that one touch the work item's records alone | The orchestrator, in the broad run after the review rounds settle |
| That each anchor in the two editions of `docs/roadmap` and `docs/architecture` and in the README pair resolves on GitHub's rendered page, the Korean anchors among them. The three phases compared the anchors with the target files' headings by a rule of their own | The proofer, by opening each link's target heading as scenario 4 of `frame/design.md` asks |
| That `docs/roadmap.ko.md` and the changed parts of `docs/architecture.ko.md` say what the English editions say. Phase 3 wrote the translation and compared structure and links by command, and its own reading of its own translation is no check | The proofer, by the reading scenario 2 of `frame/design.md` asks |
| closed That Anthropic's two published documents say what `docs/roadmap.md` *Work that runs beside the milestones* and `docs/architecture.md` *Authentication of the Claude adapter* rest on | Phase 2 fetched both pages on 2026-11-18. The Agent SDK overview came back as the page's text, which holds the sentence on claude.ai login and rate limits and nothing on another product launching the user's logged-in CLI. The support article came back as a model's answer that quoted its title and its two dated updates, and said the article does not address that launch. The orchestrator's earlier fetch, in `frame/design.md` *Grounding*, read the same |

## Not done

Phase 2 left three things within reach, each for a reader to weigh.

- **One sentence of the old *Build order* has no home now.** The section's opening paragraph said that AgenticSeal already shows the value of its process inside Claude Code, so what Owlery must establish first is the experience of an app a person hands work to and steps away from. `frame/design.md` *Removes* sends that paragraph to `docs/roadmap.md` *Milestones* and *Why this order*, and neither holds the sentence. Phase 2 removed it as *Removes* states and did not add it to `docs/roadmap.md`, because a fifth ground in *Why this order* is a change to what phase 1 delivered and to the four grounds the frame fixes.
- **The reason for the skeleton stands in two documents.** `docs/architecture.md` *Build order* says the structure need not be redone when the process is built on the shell, and `docs/roadmap.md` *Why this order*, ground 1, says the same in its second sentence. *Scope* item 8 keeps the rule in the architecture document, milestone 1 of the roadmap cites *Build order* "for the reason" it gives, and the frame's ground 1 holds the same reason. Phase 2 did not edit `docs/roadmap.md`, which is outside its plan row. Scenario 4 of `frame/design.md` reads this pair.
- **`README.md` still lists "the build order" among what `docs/architecture.md` holds.** The section keeps its heading and now holds the skeleton rule and what follows v0.1. *Scope* item 12 asks for one new row and no change to that one.

Phase 3 translated the English as it stands, so each of the three stands in the Korean editions too: the sentence without a home is gone from `docs/architecture.ko.md` *만드는 순서*, the reason for the skeleton is in that section and in ground 1 of `docs/roadmap.ko.md`, and `README.ko.md` still lists 만드는 순서 in its row for the architecture document. Phase 3 left one more thing.

- **The Status cell of `frame/questions.md` Q2 still reads `open`.** Phase 3 answered Q2 in `trail/phases/phase-3.md` *The words chosen for Q2*. `agents/crafter.md` *Job* does not list `frame/questions.md` among the crafter's writes, so the cell is the orchestrator's to fold.
