# Questions for the planner: fetch a remote's branch before a work item is cut from it (#96)

The issue left these open, and the tree or the probe answered each. The grounds stand where each line points, and nobody needs to answer them again.

- When the fetch runs: at the form, once for each base it shows, and at the creation, which reuses a fresh result. `frame/plan.md` *Alternatives considered*, rows 1 to 5.
- How the form and the cut agree: `frame/design.md` *Scope* item 5 and scenario 7, and `frame/plan.md` *Alternatives considered*, the row on a creation that cuts at a commit the form sends.
- What one fetch asks for, and that it moves no local branch and no checkout: `frame/design.md` *Grounding*, probe facts 1 and 3, and *Scope* item 1.
- How long a fetch may take: `frame/design.md` *Scope* item 2. The ten seconds are the framer's assumption, taken from the wait the app gives a daemon it started (`apps/desktop/src/daemon/worktrees.ts:168-174`). Another value changes one constant, and scenario 5's case replaces it.
- How long a result stays fresh for a creation: `frame/design.md` *Scope* item 5. The sixty seconds are the framer's assumption. Another value changes one constant, and scenario 7's case replaces it.
- What "when" the form says: `frame/design.md` *Grounding*, probe facts 2 and 4, and *Scope* item 10. The sentence says how long the clone has held the commit and not when it last fetched, since git keeps the first and not the second.
- What happens with a remote that needs a person: `frame/design.md` *Scope* items 1 to 3 and *Out of scope*.
- What the cases fetch from: `frame/design.md` *User scenarios & acceptance*, the paragraph above the table.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | Does a fetch run by the daemon reach the owner's remotes, with the app started as the owner starts it, from Finder and through `pnpm`? The tree cannot answer it: the answer depends on the keys, the agent and the stored passwords of the owner's machine. No probe could either: the run forbids every git command that asks a real remote, and a subagent cannot start the app as Finder does. | a measurement: the owner's hand run of the built app, which opens the form on a repository with a private remote and reads the line under "Starts from" | (a) The line reads "Fetched: …": nothing to do. (b) The line reads "… could not be fetched (…)": git's sentence names the cause, and a follow-up issue gives the daemon what its environment lacks, such as the agent's socket. | The form says git's sentence and the work item starts as last fetched (`frame/design.md` *Scope* items 3 and 10). The build records this row in `gaps.md` *Not verified* with the owner as its answerer. | open |
