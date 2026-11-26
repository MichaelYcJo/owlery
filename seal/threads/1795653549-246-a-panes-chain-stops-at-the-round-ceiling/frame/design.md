# Design: a pane's chain stops at the round ceiling

## Grounding

The tree as read at `c9975af0`.

| Policy clause | What it fixes for this work |
|---|---|
| `routing.md` of this work item (read) | The run is unattended (`Automation` `yes`), the work goes through the review chain to a pull request, and the frame decides whether a pane's chain takes the daemon's ceiling or keeps none. |
| Issue #246 (executed: `gh issue view 246 --json body,comments,title,milestone`, 2026-11-26) | No comment. Done when `owed` answers a stop once the rounds reach the ceiling the daemon's chain keeps, or the frame says why a pane's chain keeps none, and a case pins the answer at the ceiling. |
| `docs/architecture.md` *Code runs the order, the orchestrator judges*, the paragraph opening **The daemon runs a work item's review rounds and fix passes one stage at a time** (read) | "Once a chain reaches its ceiling of rounds, a round that leaves a finding open stops the chain with no judgment, and the next start runs the fix pass on that record and one more round." The daemon's rule stays as it reads. |
| The same section, the paragraph opening **In a pane the session runs each stage, and the chain command keeps the order and writes each record** (read) | The command "refuses what the daemon's chain refuses, since both call one module". The paragraph names each subcommand and states no ceiling. `## Rule changes` adds the ceiling to it, in both editions. |
| `apps/desktop/src/daemon/chain.ts:52-53` (read) | `ROUNDS_CEILING = 6`, and its comment gives the ceiling's purpose: "It bounds the usage a chain spends with nobody watching." A pane whose routing answers `Automation` `yes` runs with nobody watching, so the purpose holds there. |
| `chain.ts#gateBefore` (`chain.ts:457-464`) and `Daemon#runChain` (`daemon.ts:3097`, `:3131-3132`) (read) | The ceiling is a gate of the runner before a fix pass, and no state of the records: `stepOwed` (`chain.ts:404-417`) knows nothing of it. `gateBefore` answers `ceiling` where the record holds an open finding, no fix pass on it finished, the round is the ceiling or a later one, and the step is not the first of a start a person's word made. The round is the round record's number. |
| `gateBefore` on a pane's values (read, `chain.ts:457-464`) | Given no stored stage and a run `{ judged: true, first }`, the function answers `ceiling` where the record holds an open finding, the round is the ceiling or later and `first` is false, and `none` everywhere else. So the chain command can ask the daemon's own rule and restate none of it. |
| `apps/desktop/src/daemon/chain-command.ts#owed` (`chain-command.ts:252-268`) and `#fixPass` (`:320-337`) (read; executed: `git grep -n -i 'ceiling' c9975af0 -- apps/desktop/src/daemon/chain-command.ts apps/desktop/src/daemon/chain-main.ts apps/desktop/test/chain-command.test.ts apps/desktop/test/chain-command-run.ts apps/desktop/role-bundle/skills/seal` prints nothing) | `owed` prints the step `stepOwed` gives and hands a fix pass at every round. `fix-pass` records a pass at every round. Nothing of the command or of the pane's document names a ceiling. |
| `chain-command.ts:261` and `apps/desktop/role-bundle/skills/seal/SKILL.md` *The loop*, the row `parked` (read) | A state the session rests in is a step `owed` prints with exit code 0, and the document's table says what the session does there. A refusal, exit code 1, is what the session is told to act on and not work around. The ceiling's stop is a state of the first kind. |
| `apps/desktop/role-bundle/skills/seal/SKILL.md:89-92` *What you judge* and `:96-110` *A run under `Automation` `yes`* (read) | A pane's session judges convergence itself before a fix pass on the record of round 2 or a later round, and under `Automation` `yes` it goes on with a question's default. The document already names "the person's word in this run" as a source a run rule may come from. |
| `apps/desktop/role-bundle/agents/orchestrator.md:118-119` and `apps/desktop/test/role-bundle.test.ts:218` (read; executed, the search of *Verifiable how*: `git grep -n 'Where the daemon runs the chain, its ceiling' c9975af0 -- apps` prints those two lines and no other) | The bundle says "Where the daemon runs the chain, its ceiling of rounds bounds such findings as well." After this work the ceiling bounds them in a pane too, so the sentence and its pin are rewritten (*Scope* items 7 and 8), and the search then prints nothing. The pathspec `apps` leaves out the work items' directories, which quote the sentence. |
| `apps/desktop/test/role-bundle.test.ts:156-159` (read) | The case refuses the words "the daemon's chain", "Owlery's chain" and "the Owlery chain" in every document of the bundle. The bundle's new sentences name the chain as "the owl chain" and the daemon's run of it as "where the daemon runs the chain". |
| `apps/desktop/test/role-bundle.test.ts:104` (read) | The case pins, in `skills/seal/SKILL.md`, each subcommand a session runs and each of its options. The new option joins that list. |
| `apps/desktop/test/chain-command-run.ts#commandOn` and `apps/desktop/src/daemon/daemon.ts:307-308` (read) | The cases run the command in their own process through a `CommandContext`. The daemon takes its ceiling from an option, `roundsCeiling`, so a case reaches it at round 2. The command's context takes the same (*Data & interfaces*). |
| #236's records, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/frame/design.md` *Scope* item 4 and *Out*, `frame/questions.md` Q2 and `frame/plan.md` *Alternatives considered* rows B, C and D (read) | #236 made a finding located in the work item's records alone count toward none of the first four convergence signals, and named the ceiling as what bounds such findings where the daemon runs the chain. It left the pane's ceiling to this issue. Its rows B to D argued the judgment and the ceiling as two bounds, and this frame does not argue them again. |
| The same records, `frame/design.md` *Grounding*, the row on the record of what the convergence judgment caught (read) | No commit of this repository records a judgment of convergence, and the one known stop by it, #225's in a pane, was at round 3 and caught nothing. So the judgment a pane's session makes from the ceiling on has no record of a catch (`## Removes`). |
| Round records in this repository's history (executed 2026-11-26: `git log --all --diff-filter=A --name-only --format= -- 'seal/threads/*/trail/rounds/round-*.md'`, sorted and counted per work item) | Of the 44 work items whose round records a ref of this clone holds, 6 hold a round 6. So a stop at round 6 is one a run reaches, and passing it has to cost the person one word and no more. |
| `docs/roadmap.md` *Releases and the tracker*, the bullet opening **A defect of the review chain is filed in both repositories** (read), with AgenticSeal 0.39.1 `docs/running/the-run.md` *The run* and `skills/code-review/orchestration.md:168` (read, in the installed plugin; `the-run.md`'s paragraph is the same on AgenticSeal's `main`, executed: `gh api repos/MichaelYcJo/AgenticSeal/contents/docs/running/the-run.md`) | The plugin bounds its rounds by the orchestrator's judgment at three finding rounds, which "mark where the orchestrator weighs a loop that is not converging and are no cap", and each such decision is a row of `frame/plan.md`. Its signals count every finding, with no exemption for one located in the records. The plugin runs no code that keeps the order, so it has no place a ceiling would stand, and the gap #236 opened in a pane does not stand there. No AgenticSeal issue is owed. |
| `seal/follow-up.md`, `seal/parity.json`, the latest GitHub Release and the changelog fragments (executed: `ls seal`, `gh release view --json tagName,body`, `grep -l 'Process changes' seal/threads/*/changelog.md`) | No `seal/follow-up.md` and no `seal/parity.json` stand. The latest Release, `v0.0.4`, holds no `### Process changes` table, and no fragment under `seal/threads/` holds one. |
| The name of the new option (executed: `git grep -n -e 'persons-word' c9975af0 -- apps docs pr-check` prints nothing) | No option, text or check of the tree uses the name `--persons-word`. |

## Scope

In:

1. **`owed` stops at the ceiling.** Where the step the records owe is a fix pass, `chain-command.ts#owed` asks `chain.ts#gateBefore` with the step, no stored stage, the ceiling, and a run whose `judged` is true and whose `first` says whether the person's word names the step's round (item 2). Where the answer is `ceiling`, `owed` prints the step `ceiling` (*Data & interfaces*) with exit code 0. It writes no prompt and no rules file, and commits nothing. The rule stays `gateBefore`'s, so the command restates no comparison of a round with the ceiling.
2. **The person's word passes one round's stop.** `owed` and `fix-pass` take `--persons-word <round>`. The value is the number of the round whose record the stop stands on. Where it names that round, `owed` hands the fix pass as it does below the ceiling, and `fix-pass` records it. A value that names another round passes nothing, so a word given for one round's stop does not pass the next round's. A value that is no round number is refused with the usage. Where no stop stands, the option changes nothing. `USAGE` names the option on both subcommands.
3. **`fix-pass` records no pass the ceiling stops.** Where `gateBefore` answers `ceiling` for the step, `fix-pass` is refused with exit code 1 and commits nothing. Its sentence names the round, says that the chain stops for the person from the ceiling's round on, and says that `--persons-word <round>` records the pass once the person has said to go on. The fix commits and the close blocks a pass left stay in the worktree, and the same call with the option records them.
4. **The ceiling is the daemon's.** The command reads `chain.ts#ROUNDS_CEILING`. `CommandContext` gains `roundsCeiling`, read like the daemon's option of that name, so a case reaches the ceiling at a low round. `chain-main.ts` passes none.
5. **The stop holds whatever the routing answers.** The command reads no `Automation` row for it. Under `Automation` `yes` nobody watches the pane, which is the case the ceiling bounds.
6. **The pane's document says what the step means.** `apps/desktop/role-bundle/skills/seal/SKILL.md` changes in three places.
   - *The loop*: the table gains a row for `ceiling`. The session tells the person the round, its open findings and what the rounds kept finding, and runs nothing more of the chain. Once the person has said in this run, after that stop, to go on, it runs `owed --persons-word <round>` with the round the stop named, and passes the same option to `fix-pass` for that pass. It passes the option on no other ground.
   - *What you judge*: the session judges convergence before a fix pass on the record of round 2 or a later round below the ceiling. A fix pass that `owed` handed on the person's word follows no judgment, since the person's word is the answer.
   - *A run under `Automation` `yes`*: the ceiling's stop is no question and takes no default. The run stops there and waits for the person.
7. **The orchestrator's rule names both launches.** In `apps/desktop/role-bundle/agents/orchestrator.md` *The rounds are converging where each round leaves less to do than the round before it*, the sentence "Where the daemon runs the chain, its ceiling of rounds bounds such findings as well." is rewritten to say that the owl chain's ceiling of rounds bounds such findings where the daemon runs the chain and in a pane.
8. **Cases pin the answer.** `apps/desktop/test/chain-command.test.ts` holds the cases of items 1 to 5, and `apps/desktop/test/chain-command-run.ts#commandOn` takes the ceiling for them. `apps/desktop/test/role-bundle.test.ts` pins the new option in the list of `skills/seal/SKILL.md`'s options, each new sentence of item 6, and the rewritten sentence of item 7 in place of the old pin. Each new case and pin is seen red (the bundle's contract rule 15): a case of the command with only the stop removed, a pin with only its sentence deleted.
9. **The comments that the change makes false are rewritten in the same commit.** They are the comment of `chain.ts#ROUNDS_CEILING`, which names the daemon's options alone, the doc of `chain.ts#gateBefore`, which names a start of the daemon alone, and the head comment of `chain-command.ts`, the doc of `owed`'s output and the doc of `owes`, where each states what the command prints or refuses.
10. **The changelog fragment**, `changelog.md` of this work item, in the phase. It says that a pane's chain command now stops at the ceiling, which #236's fragment says it does not.

Out:

- **The daemon's code.** `Daemon#runChain`, `ceilingSays`, the stored stages and the daemon's `roundsCeiling` stay as they are. The signature and the rule of `gateBefore` do not change.
- **The convergence signals.** #236 settled them, and this work changes none.
- **A record of the person's word.** The pass is an option the session types, and no record form, block or mark is added (`frame/plan.md` *Alternatives considered*, row D; `frame/questions.md` Q1).
- **The sentence of #236's fragment**, "A pane's chain command still applies no ceiling of rounds." (`seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/changelog.md`). It is another work item's record, true of that work item's commit. Release 0.0.5's note will carry both fragments, and item 10 says which one holds at the release. Whether the note keeps #236's sentence is the orchestrator's when it composes the note.
- **`start` and the route** (#220, release 0.0.6), and how the daemon learns of a stage a pane runs (#223).
- **An AgenticSeal issue.** *Grounding* shows that the plugin does not hold the gap.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A pane's chain reaches the ceiling | Given a ceiling of 2 and a round 2 record that holds an open finding, when the session runs `owed`, then it prints `{"step":"ceiling","round":2,"ceiling":2,"open":[…]}` with exit code 0, the run folder holds no `fix-pass-2.prompt.md`, and the branch's head has not moved. | A case of `chain-command.test.ts`, seen red with the stop removed from `owed`. |
| Below the ceiling nothing changes | Given the same ceiling and a round 1 record that holds an open finding, when the session runs `owed`, then it prints the step `fix-pass` with its prompt, as before. | The same case, and the existing case opening "records a fix pass's close blocks", unchanged and green. |
| The person says to go on | Given the stop at round 2, when the session runs `owed --persons-word 2`, then it prints the step `fix-pass` of round 2 with the prompt and the rules file, and `fix-pass --by <id> --persons-word 2` records the pass. | The same case. |
| A word for one round does not pass the next | Given that pass recorded and a round 3 record that holds an open finding, when the session runs `owed --persons-word 2`, then it prints the step `ceiling` of round 3. `owed --persons-word 1` at round 2's stop prints `ceiling` as well. | The same case. |
| A pass made past the stop is not recorded | Given the stop at round 2, fix commits and close blocks in the worktree, when the session runs `fix-pass --by <id>` with no word, then the command exits with 1, its sentence names round 2 and `--persons-word 2`, and no commit is made. The same call with `--persons-word 2` then records the pass. | A case of `chain-command.test.ts` that reads the sentence whole, seen red with the refusal removed from `fix-pass`. |
| An unattended run stops too | Given a routing that answers `Automation` `yes` and the stop at round 2, when the session runs `owed`, then it prints the step `ceiling`. | The same case as the first row, with the routing declared by `start --automation yes`. |
| A value that is no round | Given `owed --persons-word soon`, when it runs, then it is refused with the usage, and the usage names the option on `owed` and on `fix-pass`. | A case of `chain-command.test.ts`. |
| The session knows what the step means | Given `skills/seal/SKILL.md`, when a pane's session reads the table at the step `ceiling`, then it reads that it tells the person and stops, that the person's word in this run is the one ground for the option, that no judgment follows that word, and that the stop is no question under `Automation` `yes`. | Pins in `role-bundle.test.ts` on the new sentences and on the option in the list at `:104`, each seen red. Whether a session follows the text is `unverified`, and the owner's walk answers it (`frame/questions.md` Q2). |
| The orchestrator's rule reads true | Given `agents/orchestrator.md`, when a judge reads what bounds a finding located in the records alone, then it reads that the ceiling bounds it in both launches. | A pin on the rewritten sentence, seen red. `git grep -n 'Where the daemon runs the chain, its ceiling' -- apps` prints nothing. |
| The daemon's chain is unchanged | Given the daemon's chain at its ceiling, when a round leaves a finding open, then it stops with no judgment and a person's start runs one fix pass and one round more. | `chain.test.ts`, the cases opening "stops at the ceiling and at each round after it with no judgment" and "stops at the ceiling of the rounds with no judgment asked", unchanged and green. |

## Data & interfaces

**`owed`'s output.** One more object, printed on the first line with exit code 0:

```json
{"step":"ceiling","round":6,"ceiling":6,"open":[1,2]}
```

`round` is the round whose record holds the open findings, `ceiling` the ceiling the command read, and `open` the numbers of the findings with no close block, as the step `fix-pass` lists them. The object holds no `agent`, `prompt` or `rules`.

**The option.** `owed [--base <base>] [--persons-word <round>]` and `fix-pass --by <session> [--persons-word <round>]`. The value is a round number in digits. No other subcommand takes it.

**The refusal of `fix-pass`.** Exit code 1, one sentence on the error output, nothing committed. `chain-command.ts` exports the sentence's function, so the case reads the text from it.

**`CommandContext.roundsCeiling?: number`.** The round the command stops at; `ROUNDS_CEILING` of `chain.ts` when absent.

**What differs from the daemon's chain.** The daemon knows from its stored stages that a fix pass on a record already finished, and then stops for no second pass on it. The command stores no stage, so a second pass on one record, which follows a question that was decided, needs the same `--persons-word <round>` as the first. The word names the round, so it holds for both.

No protocol message, record form, block grammar or check of `pr-check/` changes. The build copies the bundle whole to `dist/bundle/`, so the built app carries the new text with no other change.

## Rule changes

- change
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  from: `owed` reads the records at the head and prints the step the order owes, and for a round, a fix pass and a seal it writes the stage's prompt and the role's rules file and names the bundle's agent.
  to: `owed` reads the records at the head and prints the step the order owes, and for a round, a fix pass and a seal it writes the stage's prompt and the role's rules file and names the bundle's agent. Where a round at the ceiling of rounds or after it leaves a finding open, `owed` prints the step `ceiling` and hands no fix pass, and `fix-pass` records none, as the daemon's chain stops there with no judgment. The session passes that one round's stop with `--persons-word <round>` once the person has said to go on, and the stop holds under `Automation` `yes` as well.
- change
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  from: `owed`는 head의 기록을 읽어 순서상 다음에 할 단계를 출력하고, 회차와 수정 단계와 판정에는 그 단계의 프롬프트와 역할의 규칙 파일을 쓰고 묶음의 에이전트 이름을 밝힙니다.
  to: `owed`는 head의 기록을 읽어 순서상 다음에 할 단계를 출력하고, 회차와 수정 단계와 판정에는 그 단계의 프롬프트와 역할의 규칙 파일을 쓰고 묶음의 에이전트 이름을 밝힙니다. 회차의 상한이거나 그 뒤인 회차가 지적을 열어 둔 채 끝나면 `owed`는 `ceiling` 단계를 출력하고 수정 단계를 건네지 않으며, `fix-pass`도 수정 단계를 기록하지 않습니다. 데몬의 체인이 그 자리에서 판단을 묻지 않고 멈추는 것과 같습니다. 사람이 계속하라고 말한 뒤에 세션이 `--persons-word <round>`로 그 한 회차의 멈춤을 넘기고, 이 멈춤은 `Automation`이 `yes`여도 그대로입니다.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The convergence judgment a pane's session makes before a fix pass on a record of the ceiling's round or a later one | `apps/desktop/role-bundle/skills/seal/SKILL.md` *What you judge*, the first bullet | The ceiling stops there with no judgment, as where the daemon runs the chain, and the person's word is the answer (*Scope* item 6). This is what the new step and option take out in return. Its record of a catch is empty: no commit of this repository records a judgment of convergence, and the one known stop by it, in a pane, was at round 3 (*Grounding*, the row on #236's record of what the judgment caught). Below the ceiling the judgment stays. |
| The sentence "Where the daemon runs the chain, its ceiling of rounds bounds such findings as well." and its pin | `apps/desktop/role-bundle/agents/orchestrator.md` *The rounds are converging where each round leaves less to do than the round before it*; `apps/desktop/test/role-bundle.test.ts`, the orchestrator's case | Rewritten in place to name both launches (*Scope* item 7), and the pin follows the sentence. |
| The hand of a fix pass, and the record of one, at every round whatever its number | `apps/desktop/src/daemon/chain-command.ts#owed` and `#fixPass` | From the ceiling on, both wait for `--persons-word <round>` (*Scope* items 1 to 3). |

Framed 2026-11-26 by framer, before the build.
