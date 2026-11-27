# Changelog: a new issue is placed by a written rule

Issue #304. The roadmap named each milestone's goal and no rule that places a new issue, so an issue opened by a person outside the repository arrived with no milestone and waited for the owner to place it.

- **A new issue takes the first milestone whose test it meets, read from a list of five.** `docs/roadmap.md` *Releases and the tracker* holds the list: the open release's milestone on the owner's word, a row of the milestones, `owner: by hand`, a defect a person met in what has shipped, and an edge case no person has met. The orchestrator sorts an issue by it without asking, except where the issue blocks the open release, meets no test, or asks for work the roadmap holds outside the first version.
- **An issue with no milestone and no line saying why is not yet sorted.** The orchestrator leaves one line on the issue that says which test placed it, and asks the owner where no test fits. Work that waits for what comes after the first version keeps no milestone and carries that line.
- **The goal of `hardening: boundaries and edge cases` no longer stops at milestones 1 and 2.** It covers what the releases after them found as well, as the tracker already held it.
