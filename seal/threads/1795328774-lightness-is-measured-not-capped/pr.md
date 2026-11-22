Part of #121. The issue closes when `release/v0.0.2` reaches `main`.

The design documents stated the about 500 MB the app read with four terminals visible as a target the app had to stay under. They also fixed the panes a work item's view shows at once at four on every machine, because four is the count that scene was measured at. Read as a limit, that number stopped every feature from here on, and an in-app preview (#120) was first weighed against it. On 2026-11-22 the owner set the rule this pull request writes: spend as little memory as possible, keep limits fitted to the person's machine, and build a feature first and make it efficient after.

| Before | After |
|---|---|
| "The app itself aims to stay under about 500 MB" (`docs/architecture.md` *Memory design*), and the same in `docs/product.md` *Foundation* | Owlery spends as little memory as it can, and a feature costs nothing while nobody uses it. What a scene costs is measured and published beside comparable products, and no number of a reference scene is a limit on a feature. The four-terminal scene keeps its numbers, 491.1 to 503.4 MB, as a measurement |
| A view shows at most four panes, "the count the 500 MB target is measured at" | The limits Owlery keeps (agents and worktrees running at once, panes a view shows at once) are defaults read from the person's machine, which the person sees and changes. #32 builds them; until then four panes stay fixed in code (`STAGE_PANES`, whose comment now says so) |
| Nothing said in which order cost and features come | A feature is built first with ordinary care, so it holds nothing while unused; its cost is measured; efficiency work follows where the measurement shows the cost, as #9 did. A tight number set before a feature is built is not a design input |
| The roadmap's done criterion "the app itself stays under about 500 MB", and its open row "The numbers of lightness beyond 500 MB" | The done criterion is that the reference scenes are measured and published beside comparable products, and the open row asks which scenes to measure beside the four-terminal one. Milestones rows 1 and 5 say the same |

Each English section was rewritten with its Korean twin. `apps/desktop/measurements/memory.md` keeps its numbers and no longer calls the scene a target it was over.

**Left, and where it lives.** Nothing measures the reference scenes again as features land (`pnpm run measure:memory` exists, and no check runs it), and no comparable product has been measured in the same scene. Both are on #75. The sentence "There is no built-in browser" and the product's "We do not build … a built-in browser" stay, since #120 weighs exactly those. No behaviour of the app changes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
