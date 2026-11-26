# Guarantee: 1795697255-278-a-release-takes-its-number-when-it-is-cut

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad gate ran at a commit that only the work item's records follow | `trail/gate.md:4` (`run: a1caaebb against f683c693`) | `git -C /Users/yc/Documents/GitHub/owlery-wt-278 log --no-merges --name-only a1caaebb..HEAD ^f683c693` | holds (executed): `a1caaebb` resolves and is an ancestor of HEAD; the one commit after it, `7c92ecf6`, touches only `seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/trail/gate.md` |
| The pull request body is what `seal pr-body` composes from the records at HEAD | the orchestrator's spawn prompt (body at `<scratchpad>/1795697255-278-a-release-takes-its-number-when-it-is-cut/body.md`) | `seal pr-body seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut --body <scratchpad>/1795697255-278-a-release-takes-its-number-when-it-is-cut/body.md --check` | does not hold (executed): exit 1, `refused: seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/pr.md: is not there; the orchestrator writes it before the first round`. The named body file is also absent: the scratch directory holds `gate.log`, `preflight.log`, `phase-1/` and `round-1/` and no `body.md` |
| Phase records' `executed` and `seen red` claims; `## Removes` rows | `trail/phases/phase-1.md`, `frame/design.md` | not run | unverified: the audit stops at step 2 (`agents/sealer.md`); the next sealer run answers it |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the orchestrator's part of the pull request body | nothing readable: `pr.md` is not in the work item's directory at HEAD, and the body file the prompt names does not exist | none | the spawn prompt, which says `seal pr-body` wrote the body to that file |
| the design, the build, the last round, the changelog | not compared | not compared | not compared: the audit stops at step 2, so no party was read against issue #278 and the tree in this run; the next sealer run answers it |

```seal
target: 7c92ecf665558f610cdb4ec7e8b989c5fbc42bdf against f683c69381e03d621f098c6f280f214201d50ad9
Verdict: withheld reason: refused: seal/threads/1795697255-278-a-release-takes-its-number-when-it-is-cut/pr.md: is not there; the orchestrator writes it before the first round
```
