# Implementation Plan: 1795610687-235-stage-prompts-name-the-worktree

## Technical context

The tree as read at `4da28143b1fcee9d2acda69192a79ab890ca1d2d`.

The five stage prompts are built in `apps/desktop/src/daemon/chain.ts` (`roundPrompt` at `:621`, `fixPassPrompt` at `:647`, `sealPrompt` at `:682`, `convergencePrompt` at `:718`, `rulingPrompt` at `:746`). The chain command calls the first three through `stage-records.ts#roundStage`, `#fixPassStage` and `#sealStage`, from `chain-command.ts#owed` (`:264` to `:267`), with a `Place` whose `worktree` is git's top of the command's own folder (`chain-command.ts:153`). The daemon calls all five, with `item.worktree` as its role session's folder (`daemon.ts:3264` to `:3408`). Each prompt now names its tree as "this folder". That is true for the daemon's sessions, which start in the worktree. It is false for a pane's subagent whose session stands in another worktree, because a subagent starts in its session's folder (`design.md` *Grounding*).

The cases that pin the prompts' texts are in `apps/desktop/test/chain.test.ts` (`:376` to `:714`), with `DIRECTORY` and `NAME` as constants at `:76` and `:77`. The chain command's cases run it in a temporary repository through `apps/desktop/test/chain-command-run.ts#commandOn`, whose `run` takes the folder to run in as its fourth argument.

Constraints:

- The paths a prompt lists stay from the worktree's top. A finding's `location:` is matched literally against git's paths (`chain.ts#underPlace`), so absolute paths in a prompt would invite absolute locations that `fix-pass` refuses.
- The fake roles of the cases read a prompt through `givenRound`, `givenFix` and `givenSeal` (`chain-run.ts:352` to `:370`), which match the `- …` lines and not the first line. A change to the first line leaves them working.
- Git gives a worktree's resolved path (`/private/var/…` for `/var/…` on macOS), so the new case compares with git's answer or `realpathSync`.

The failure scenario of the chosen approach, six months on: a new stage prompt is added and copies the old "in this folder" wording, or a new caller passes a relative `worktree`. The assertion over all five prompts in `chain.test.ts` does not reach a sixth builder. The build may make the opening line one helper that every builder calls, so that a new builder takes the worktree by calling it. A relative `worktree` would show in the prompt as a path that does not start with `/`, and the case of the chain command reads the path git gives.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A. Each prompt names the worktree by its absolute path, keeps its listed paths from the worktree's top, and the fix pass names `git -C` with that path. | A pane's subagent that reads the named worktree may meet a permission question, which stops an `Automation` `yes` run until the person answers. The rules file and the prompt file already sit outside the session's folder at every stage, so that question is not new to this work (Q1). | **Chosen.** The chain command holds the worktree's top exactly (`chain-command.ts:153`). The daemon's sessions see their own folder named, so nothing changes for them. |
| B. The chain command refuses a stage where its folder is not the pane's worktree, with a sentence that says how to run it (the issue's second option). | Nothing in a pane's environment names the pane's worktree (`hooks.ts:172`, `design.md` *Grounding*), so B first adds a pane variable, a new mechanism. Then it refuses the work across worktrees that the issue calls frequent ("여기서 워크트리 하나 생성해서 작업하자"). The person must open a pane in the other worktree, and a worktree made outside Owlery does not show in the sidebar to open one in (#227, open). The refusal also catches nothing that A leaves wrong. | Rejected. |
| C. Keep "this folder", and have `skills/seal/SKILL.md` tell the session to name the worktree when it starts the role. | The session forgets or words it differently, and the role reads the session's folder. The issue's walk shows that only the session's attention caught it. It also breaks the skill's "give it nothing else". | Rejected. It keeps the structure, and its premise, that the role's folder is the work item's worktree, fails in a pane (*Grounding*, the `pwd` row). |
| D. Every path the prompt lists is made absolute, with no line about the worktree's top. | A proofer copies an absolute path into a finding's `location:`, and `fix-pass` refuses each `fixed` close block, since `chain.ts#underPlace` compares with git's relative paths. | Rejected. |
| E. Change only the three prompts the chain command hands a pane (round, fix pass, seal), and leave the two the daemon alone uses. | The daemon's convergence and ruling prompts keep "this folder", which is true there, while the other three name a path. Two ways of naming one place stand in one module, and a later pane judgment that copies one of the two gets the wrong one. | Rejected. Rule 12 of the agent contract: the five builders are the class, enumerated from `git grep` on the wording that produces the defect. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 7 of `design.md`. | The new case of `apps/desktop/test/chain-command.test.ts` (*Scope* item 5), shown red against the grounding commit's `chain.ts` before it is committed, and green after. The changed cases of `apps/desktop/test/chain.test.ts`, run narrow. Then `git grep -n -e 'this folder' -e "the session's folder" -- apps/desktop/src/daemon/chain.ts apps/desktop/test/chain.test.ts` prints nothing. No built-app case: the work changes no window and no pane. The full suite is the orchestrator's broad gate. | |

## Overlap with the release

The spawn named #237, #242, #214, #224, #236 and #223, none with a frame committed or a branch pushed (`git fetch origin`, `git branch -r`, executed 2026-11-25). The files below are those this work changes: `apps/desktop/src/daemon/chain.ts`, `stage-records.ts`, `daemon.ts`, `docs/architecture.md`, `docs/architecture.ko.md`, `apps/desktop/test/chain.test.ts` and `apps/desktop/test/chain-command.test.ts`. #237 (comments in `hooks.ts`, `pane-chain.ts`, `main/main.ts`, and the version in `package.json` and `.github/workflows/owlery-seal.yml`), #242 (`renderer/sidebar.ts`, `test/approval-line.test.ts`) and #214 (`renderer/view.ts`, `index.html`) change none of them, and none reads a rule or check this work changes. So none of the three meets this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #224 | `apps/desktop/src/daemon/daemon.ts`: #224 removes the `ask` message's handling (`case "ask"` at `daemon.ts:1498`), and this work changes the prompt calls in `runConvergence` and `runRuling` (`:3317`, `:3342`). | #235 | The hunks stand about 1,800 lines apart, so either order merges without a conflict in practice. #235 is the smaller diff and likelier to be sealed first. Where #224 seals first, #235 rebases with no change of its own. |
| #236 | `apps/desktop/src/daemon/chain.ts`: #236 changes `gateBefore`, and this work changes the five prompt builders. #236 also changes the bundle's `agents/orchestrator.md`, which this work does not. | #235 | The spawn names #236 as later in the release and asks that it build on #235. A new judgment prompt #236 adds then takes the `worktree` argument as the five do. |
| #223 | `apps/desktop/src/daemon/chain-command.ts` and its cases: #223 changes `owed`, `round`, `fix-pass` and `seal`. This work changes no line of `chain-command.ts`, and adds one case to `apps/desktop/test/chain-command.test.ts`, which #223's cases likely share. | #235 | The spawn names #223 as later in the release. #223's change to `owed` reads the prompts this work changes, so it builds on the prompts as they will stand. |

## Operational impact

None. No migration, no new environment variable and no new dependency. A prompt's text changes, and with it what a window shows of a stage. This pull request moves no version: #237 moves it to 0.0.5.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
