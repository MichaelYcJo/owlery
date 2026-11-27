# Routing: 1795797648-323-the-rules-live-in-the-repository

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Implementation | crafter |
| Automation | yes |
| Branch | docs/323-the-rules-of-this-repository-stand-in-one-machines-memory |

Answered 2026-11-28 by the orchestrator, before the first edit.

## Why this way

Issue #323: the rules for how work runs in this repository stand in two machines' agent memory. The list in the issue is one machine's, and the other is this machine's memory. They are merged into one list, and each rule is written where it lives. The owner said on 2026-11-28 to merge them and keep only what is needed ("합쳐서 필요한것만 정제해서넣으면돼"), so the orchestrator decided each home and each open point, and the owner reviews the result at the pull request.

- **Planning, no frame:** the merge is a list of rules with a home each. The orchestrator's merged table, made before the first edit, stands for the plan, and the closing memo's scope line states what was written.
- **Implementation, crafter. Review, through the review chain. Automation, yes.**
- **Decisions the orchestrator took for the owner's open points, 2026-11-28:**
  - The rules of how this repository is worked are written in the vocabulary its tools use today (`seal/`, the `seal` command, sealer). This repository stays on the AgenticSeal plugin's forms until the plugin takes IADD's names (#322 *When it lands*, step 4), and the rename sweeps them then. IADD's own definition goes through #322, not here.
  - The pull request check's name belongs to #322.
  - The crafter's model is recommended at routing and defaults to Opus.
  - The time `pr.md` is written stays the plugin's rule, so nothing is written here.
  - The brand criteria move into `docs/name.md`.
  - Rules about using the plugin itself stay out of this repository.
  - `handoff.md` is one sentence of practice, not a record form.
  - Rules bound to the long release branch say "until #279".
- **Branch:** cut from `main` at `aec3e8ac` on 2026-11-28.
