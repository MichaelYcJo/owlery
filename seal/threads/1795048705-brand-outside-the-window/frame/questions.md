# Questions for the planner: the brand outside the window

Judgments the ticket (#21) left open that the tree answered. None is a question any more.

- How the icon is drawn from the emblem: `frame/plan.md` *Alternatives considered*, the first five rows.
- Where the command that draws it lives: `frame/plan.md` *Alternatives considered*, the row on a script of `package.json`.
- What "the built app" is, and whether this work packages it: `frame/design.md` *Grounding*, the row of `docs/roadmap.md`, and `frame/plan.md` *Alternatives considered*, the row on packaging.
- Whether the app has a window icon: `frame/design.md` *Grounding*, the bullet on `app.dock.setIcon`.
- Whether `docs/name.md` changes in this pull request or at the settle: `frame/plan.md` *Alternatives considered*, the row on editing `docs/name.md`.
- What the issue's sentence on "the build order" asks for: `frame/design.md` *Grounding*, the bullet on the *Documents* table.
- What the brand's one-line description says: `frame/design.md` *Grounding*, the row of `docs/product.md` *What we promise*.
- How the work follows the palette #18 settles: `frame/design.md` *Scope* item 9.
- Whether the README keeps its structure: `frame/plan.md` *Alternatives considered*, the row on replacing it.

These assumptions are written down and not asked, because either answer of each changes a line or two of the build:

- The emblem stands 120 pixels wide, centred, above the title of each README.
- The new section is named "Run it", and "실행" in the Korean edition.
- The READMEs name the Node.js version the builder ran the commands with, and no minimum.
- The owner reads the READMEs' sentences at the pull request, as `routing.md` says of their voice.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Does the name "Owlery" stay? The tree cannot answer it and no probe can: the issue leaves it to the owner, to decide with the design study in hand, and it is a decision about what the product is called. | a person | It stays: the work is as framed, and the two `add` operations of `frame/design.md` *Rule changes* record it in `docs/name.md` at the settle. It changes: this work item is reframed. The new name goes into both READMEs, `TRADEMARKS.md`, the window's title and bar, and the packages' names; `docs/name.md` is rewritten whole, in a work item whose subject is that document; the trademark search of its *What to keep in mind* comes first; and the repository's own name and the folder the app keeps its data in are decided with it. | The name stays. Both phases build on it. The issue's last *Done when* line is this answer, so the orchestrator has it before the pull request opens, and the fold then dates the two `add` operations with the owner's decision. | open |
| Q2 | Is the app's icon the wax seal alone on a transparent ground, or the seal on a tile? The tree cannot answer it and no probe can: the look of the icon is the owner's to judge (`routing.md`, *Automation*), and no document of the tree draws it. | a person | The seal alone: the icon is the emblem and nothing else, holds no colour of the window, and stands round among the rounded squares of other apps. The seal on a rounded tile: the icon has the outline of its neighbours, the tile's ground is the window's ground as #18 has settled it, and the PNG is drawn again from a second SVG that this work then commits and lists in `TRADEMARKS.md`. | The seal alone, 824 pixels wide on a canvas of 1024 (`frame/design.md` *Scope* item 1). Phase 1 builds on it. | open |
| Q3 | Does the macOS Dock draw the image `app.dock.setIcon` is given as it is, and can the builder see it? The framer's one probe did not answer it: it set the icon without an error and captured the main display, and the capture showed no Dock (`frame/design.md` *Grounding*). A probe runs once, and the tile to judge is the built app's, which exists after phase 1. | a measurement | Phase 1's drive captures the screen while the built app runs and reads the Dock's tile. Where no capture shows the Dock, the owner looks at it. Where macOS draws a backing of its own behind the seal, that is a fact for Q2. | Scenario 1 of `frame/design.md`, with `gaps.md` *Not verified* and the owner as the answerer where the capture shows no Dock. | open |
