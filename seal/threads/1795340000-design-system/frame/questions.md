# Questions for the planner: 1795340000-design-system

What the issue left open and the tree answered, so that nobody reopens it:

- Whether the work states its rules in `## Rule changes` or writes the policy root directly: `frame/design.md` *Rule changes*.
- Where a token's value stands, in the document or in the style sheet: `frame/plan.md` *Alternatives considered*, rows 1 to 3.
- How a pull request comes to carry screenshots, and whether a gate holds it: `frame/plan.md` *Alternatives considered*, rows 4 to 7.
- Whether a failure may be red: `frame/design.md` *Grounding*, the first row.
- Whether the brand research fixes a visual direction: `frame/design.md` *Grounding*, the row of `etcs/research/brand.md`.
- Whether a theme may change the layout: `frame/design.md` *Scope*, out of scope.

What the owner's answer to Q1 left open and the policy and the tree answered:

- Whether the rule of a theme lets Register and Night watch be themes: `frame/design.md` *Scope* item 2, which rewrites the rule.
- What the themes and the appearances are called, and how a person chooses: `frame/design.md` *The names, and how a person chooses*, and `frame/plan.md` *Alternatives considered*, the rows on two choices, six themes in one list, and the names "Night desk" and "Letter".
- Which words become the window's: `frame/design.md` *The words*, and `frame/plan.md` *Alternatives considered*, the row on the status line.
- Whether every block loads with the page: `frame/plan.md` *Alternatives considered*, the rows on one file and on a file for each theme, and the probe of `frame/design.md` *Data & interfaces*.
- Where a state's shapes stand: `frame/plan.md` *Alternatives considered*, the two rows on a state's shapes.
- What Register keeps of the study's direction: `frame/design.md` *Scope*, out of scope.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Which direction of the study, each now a theme of `frame/design.md` *The themes*, is Owlery's style: A, Register; B, Night watch; or C, Desk? The tree cannot answer it and no probe can, because it is the owner's taste, and `routing.md` names it as the one question this work puts to the owner. | a person | **A, Register.** The themes' colours and typefaces stay as chosen on 2026-11-19. The form changes: square corners, rules between lines, facts in fixed-width columns, a seal's column down the inbox, box marks, and the approval line as a ruled block of boxes. Titles in the list lose about 66px of width. **B, Night watch.** Every colour of both themes changes to the emblem's black and bone, the serif goes, and the owl's yellow eye becomes the one signal colour, with eye marks for the states and the night's words ("Needs you", "Asleep"). It overturns the choice of 2026-11-19 and moves the window into the neutral black camp of Orca, Conductor and Linear. **C, Desk.** Nothing changes but the mark of a wait. The build writes down what stands. The window stays nearest to Claude's and Cursor's warm ground with cream ink. **A mix the owner names**, such as A's form in B's colours: the framer folds it into the frame as the owner states it. Each option's mock-ups are under `frame/images/`, and `frame/images/mock.html` shows each live. | A, Register, which the framer recommended for keeping the colours chosen on 2026-11-19 and changing only the form. No phase of the build starts before the answer. | answered 2026-11-22 by the owner: "default는 B로 하고 나머지 2개도 우리 고를수있는 theme로 하면되지않아?" (Night watch is the default theme; Register and Desk are themes the person can choose) |
| Q2 | How does the pull request's body show an image committed in the work item's directory, so that GitHub draws it? The repository is public (`gh repo view --json visibility` printed `PUBLIC`, executed), so a link to the file at its commit is expected to draw. No probe can settle it at the frame: it needs a pushed commit and an open pull request, and no agent pushes. | the work | A link to the file at the commit that holds it, by the repository's own address. Or a link relative to the pull request, `../blob/<commit>/<path>?raw=true`, the form GitHub's *Basic writing and formatting syntax* gives for a repository's pull requests. Phase 4 decides it when the first body is composed, and records it in its phase record. | The link to the file at its commit. | answered 2026-11-22 by phase 4 (`trail/phases/phase-4.md` *Decisions*): `![…](../blob/<commit>/<path>?raw=true)`, with the commit's full id; that it renders in this repository's pull request is checked when the pull request opens |
