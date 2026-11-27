# Phase 1: 1795739989-304-a-new-issue-is-placed-by-a-written-rule

## What this phase found

The frame held against the tree at `d2474f15`. The hardening row stood at line 65 of both editions and the paragraph on release 0.0.3 at line 69, as `frame/plan.md` *Technical context* states. The anchors the new text links to exist: `#milestones` and `#after-the-first-version` in `docs/roadmap.md`, `#마일스톤` and `#첫-버전-다음` in `docs/roadmap.ko.md`. No departure from the frame.

The text of *Scope* items 1 to 3 went in word for word, in both editions, between the milestone table and the paragraph on release 0.0.3. Judged against `frame/design.md` *Scope* and `docs/roadmap.md` *Releases and the tracker*.

The repository has no document check of its own: `package.json` names `pnpm -r run check`, and `apps/desktop`'s `check` runs the typecheck and the tests, which read no roadmap sentence. The documents leg lives in `seal/config.json` `Broad gate`, which the orchestrator runs. So the phase ran no `pnpm` command and started no heavy run, and ran the leg's own counts as `grep` (scenario H).

Searches run at the phase's commit `90fcfa85` (executed):

- Scenario E: `git grep -n -F 'is not yet sorted' -- docs/roadmap.md` printed `docs/roadmap.md:77`. `git grep -n -F 'takes the first milestone' -- docs` printed `docs/roadmap.md:69`. `git grep -n -F '아직 분류하지 않은' -- docs/roadmap.ko.md` printed `docs/roadmap.ko.md:77`. `git grep -n -e '처음 맞는 조건' -- docs` printed `docs/roadmap.ko.md:69`. Each is one line, in *Releases and the tracker* or *릴리스와 트래커*.
- Scenario F: both searches for the old limit print nothing.
- Scenario H: `grep -c '^#'` counts 11 and `grep -c '^|'` counts 40 in each edition, and `git grep -n -e '도장' -- docs README.md README.ko.md` prints nothing.
- Scenario G: `gh api 'repos/{owner}/{repo}/milestones?state=open'` lists `milestone 3: hand over an issue`, `milestone 4: the person's hands on the work`, `milestone 5: after the PR, and limits`, `hardening: boundaries and edge cases`, `release: 0.1.0`, `after launch: first findings and conveniences` and `owner: by hand`, so each title the list writes in backticks is open, and `release: <version>` is the shape of the open release's title.

Scenarios A to D were read at the commit against the text of *Scope* items 1 and 2 (read). No mutation run and no new case: the unit adds no behaviour, only document text, and no code reads it (`frame/design.md` *Data & interfaces*).
