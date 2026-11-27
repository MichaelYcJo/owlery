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
  - The time `pr.md` is written stays the plugin's rule, so nothing is written here.
  - The brand criteria move into `docs/name.md`.
  - Rules about using the plugin itself stay out of this repository.
  - `handoff.md` is the plugin's practice (`skills/implement/orchestration.md` of AgenticSeal), so nothing is written here.
- **Narrowed by the owner during phase 1, 2026-11-28:** no model rule is written, since #129 owns the product's model defaults and how this repository picks models stays in memory; and no rule is written that an open issue already owns (#129, #279 and #322 among them), since that issue writes it when it lands.
- **Title prefix, `docs`:** the change writes rules into `CLAUDE.md` and the policy documents, and changes no code beyond the release's version move in `apps/desktop/package.json` and the case in `apps/desktop/test/records-place.test.ts` that holds this repository's pin at 0.1.0 while it keeps the plugin's root; `chore` came closest, since the rules describe how work runs.
- **Not closed by this pull request:** #323's last *Done when* item, each machine's memory pruned to what the decision left there, is done outside the repository after the merge, so the pull request says *Part of #323*.
- **Base and version, 2026-11-28:** the orchestrator proposed 0.2.0, a minor move by `docs/roadmap.md` *Releases and the tracker*: the work of the milestone `direction: composable workflows and shared rules` brings a workflow a person composes and the rename to IADD, which a person feels. The owner approved the number on 2026-11-28: the orchestrator asked whether it may set the release's number too ("이것도 제가 정해도 되면 말씀해 주세요. 그러면 근거를 적고 브랜치를 따서 머지까지 진행하겠습니다."), and the owner answered "머지도 너가정해", which gives the number and the merge to the orchestrator. The branch `release/v0.2.0` was cut from `main` at `aec3e8ac`, and this pull request merges into it by squash. It is the release's first pull request, so it moves the version: `apps/desktop/package.json` to 0.2.0. This repository's `.github/workflows/owlery-seal.yml` keeps its pin at `v0.1.0`, because this repository keeps the AgenticSeal plugin's forms until the plugin takes IADD's names (#322 *When it lands*, step 4).
  From this pull request on, a build of the app is at 0.2.0, so its sidebar offers this repository the move of `owlery-seal.yml` to Owlery 0.2.0 (`apps/desktop/src/daemon/records-place.ts#readRecordsPlace`). The offer is not taken here until #322 *When it lands* step 4, and the orchestrator adds that to #322's body, as `docs/roadmap.md` *Releases and the tracker* says a decision that shapes an open issue does.
- **Branch:** cut from `main` at `aec3e8ac` on 2026-11-28.
