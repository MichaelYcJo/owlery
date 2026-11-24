# Routing: 1795497941-night-watch-marks-as-moons

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/183-a-finished-roles-eye-reads-as-a-half-moon |

Answered 2026-11-24 by the orchestrator, before the first edit.

## Why this way

On 2026-11-24 the owner answered question 1 with `agentic` for every issue of release 0.0.3. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue gives the owner's direction (Night watch's marks as phases of the moon) and leaves the forms of five states open, and the rule stands in `docs/design.md` and `docs/design.ko.md` *Themes*.
- **Implementation, crafter:** the marks' drawing on the approval line, the inbox line and the sidebar, the two editions of the design document, and the screenshots.
- **Review, through the review chain:** a mark that reads as another state misleads a person at a glance, which is the defect this issue reports, and a reader independent of the build is the check on it.
- **Automation, yes:** the forms are a design choice the framer can default and the owner judges on the pull request's screenshots; every start of the app sets `OWLERY_BACKGROUND=1`.
- **Branch:** cut from `release/v0.0.3` at `c82c611`; the pull request merges into `release/v0.0.3` by squash.
