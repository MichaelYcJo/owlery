# Changelog: the rules of how work runs here live in the repository

Issue #323. Many rules for how work runs in this repository stood only in one machine's agent memory, so a session on another machine or a contributor's did not know them.

- **A `CLAUDE.md` at the repository's top holds the rules every session here follows.** Before each step of a work item the orchestrator reads the remote, and after each step it pushes the branch, so another session or machine can take the work over. `routing.md` quotes the owner's delegation verbatim with its date. A framer's design says what the daemon could do beyond the issue, a comparison with another product inventories every surface a person touches, and a reported gap is filed, never answered with a workaround. For the rules the policy documents hold, the file links to their sections.
- **The roadmap states four more tracker rules.** What a release holds is read from what merged into its branch, and what a milestone holds from GitHub, an issue labelled `owner runs` is the owner's alone, a decision that shapes an open issue goes into that issue's body, and the release note is built from the fragments as they stood before the settle removed them.
- **A choice only a study can raise is asked once the study's result stands**, not in the batch at the start (`docs/architecture.md`).
- **An icon candidate is judged at the Dock's size, and a brand name is searched against written criteria** (`docs/name.md`).
- **The desktop app's version is 0.2.0.** This is the first pull request of release 0.2.0, so it moves `apps/desktop/package.json`. This repository's own pull requests are still checked by Owlery's check at 0.1.0, which `.github/workflows/owlery-seal.yml` pins, until the AgenticSeal plugin takes IADD's names (#322).

### Process changes

| Date | Change | Why | Source |
|---|---|---|---|
| 2026-11-28 | A repository `CLAUDE.md` holds the session rules of how work runs here: read the remote before each step, push after each step, the owner's delegation quoted in `routing.md`, and the framing and research rules | They stood in one machine's agent memory, so a session elsewhere did not know them | https://github.com/MichaelYcJo/owlery/issues/323 |