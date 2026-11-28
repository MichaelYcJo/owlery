# Review round 1: 1795855409-353-owlerys-iadd-follows-the-specification

```iadd
target: 467702ea against release/v0.2.1
```

The round read `git diff origin/release/v0.2.1...467702ea` in a clone at `467702ea`. The work item has no `frame/`, no `gaps.md` and no `trail/phases/`, by the route `routing.md` states, so the ground in place of a frame is: issue #353 and the owner's decisions of its comment 7236479163, issue #362, the IADD specification at tag `v0.1.0` of MichaelYcJo/iadd-workflows (`spec/iadd.md` and `spec/iadd.ko.md`), and Owlery's code at the target. This is round 1 and no earlier record stands, so no fact was carried from one: every coordinate below was opened this round.

The implementer's account is the commit messages, `routing.md`, `changelog.md` and `pr.md`. What it claims and what the round found:

- Claimed (`changelog.md:5`): `docs/iadd.md` lists what Owlery adds to the record forms and "the nine places where Owlery's code departs". Found: each of the nine holds at the code (see *Confirmations*), and the two lists leave out lines and departures the code has (finding 7).
- Claimed (`changelog.md:6`): the Korean documents name an inspection's states with the specification's names in place of the old ones. Found: five Korean sentences still say 통과 for an inspection's state (finding 2).
- Claimed (commit `b95c2a8`'s subject): the version moves to 0.2.1. Found: `apps/desktop/package.json:3` reads 0.2.1, and the repository's own workflow file still pins 0.2.0, which a case of the suite holds against the version (finding 1).
- Claimed (`changelog.md:7`, commit `b95c2a8`'s body): #362's three sentences are fixed. Found: all three, in both languages, read exactly as #362 gives them.

## Findings

### 1. The version moves to 0.2.1 and the repository's own check workflow still pins 0.2.0, so a case of the suite fails

```iadd
severity: must
location: `.github/workflows/owlery-inspection.yml:33-38`, `apps/desktop/package.json:3`
evidence: executed python3 -I test_tmp_workflow_pin.py <clone> (row 2 of Probes); read `apps/desktop/test/records-place.test.ts:1083-1096`, `apps/desktop/src/daemon/records-place.ts:67-106`, `docs/roadmap.md:92`
```

Why it matters: the case at `apps/desktop/test/records-place.test.ts:1083` is named "holds Owlery's own workflow to the one a setup writes for the app's version, so the pull request that moves the version rewrites it". Where `agentory/README.md` opens with the marker, which it does at the target, the case asserts that `.github/workflows/owlery-inspection.yml` equals `workflowText(version)` for the version `apps/desktop/package.json` names (`records-place.test.ts:1094-1095`). Commit `b95c2a8` moved that version to 0.2.1 and left the workflow file as `workflowText("0.2.0")` writes it. The probe renders the template literal of `records-place.ts:67-106` and compares it with the committed file. The 0.2.0 text equals the file, which shows the rendering is faithful, and the 0.2.1 text does not. So the suite CI runs on the pull request fails at that case. `docs/roadmap.md:92` gives the rule the case holds: "The first of those pull requests moves the version", and a connected repository's check clones `release/v<version>` of its pinned version until the tag exists. The version move is this work item's own act, so the rewrite of the file is too. The file then fetches the check from `release/v0.2.1` until the tag `v0.2.1` exists, which is what a setup writes for 0.2.1. That branch stands on origin, since this work item's branch was cut from it.

The fix rewrites the three lines of the workflow file that name the version, lines 33, 36 and 38, to what `workflowText("0.2.1")` writes; the lines between them stay. It assumes nothing beyond the branch `release/v0.2.1` standing on origin.

```yaml
      - name: the check, at Owlery 0.2.1
          git clone --quiet --depth 1 --branch v0.2.1 \
          || git clone --quiet --depth 1 --branch release/v0.2.1 \
```

```iadd
verdict: fixed 7a1f62df
answer: The three version strings of `.github/workflows/owlery-inspection.yml` read 0.2.1.
```

### 2. Five Korean sentences still name an inspection's state 통과, which row C7 replaced with 합격 and 합격 아님

```iadd
severity: should
location: `docs/design.ko.md:11`, `docs/design.ko.md:470`, `docs/product.ko.md:9`, `docs/product.ko.md:96`, `docs/roadmap.ko.md:24`
evidence: executed git grep -n -o -E '.{0,60}통과.{0,40}' 467702ea -- '*.ko.md' README.ko.md; read `docs/design.md:11`, `docs/design.md:470`, `docs/product.md:9`, `docs/product.md:96`, `docs/roadmap.md:24`
```

Why it matters: row C7 of the owner's decisions takes the specification's Korean names, 합격, 효력을 잃음 and 합격 아님, and says that Owlery's 통과 "repeats the clash for which *passed* was set aside". The rename left five sentences where 통과 stands for the inspector clearing the work, or for an inspection that is not cleared. Each English twin says *clear*:

- `docs/design.ko.md:11`: "검수자가 이 커밋을 통과시켰다는 뜻입니다", where `docs/design.md:11` reads "an inspector that built none of the work cleared this commit".
- `docs/design.ko.md:470`: "검수가 head에서 통과했으면:", where `docs/design.md:470` reads "Cleared, where the inspection is cleared at the head:". The same cell's next state already reads "검수의 효력을 잃게 했으면".
- `docs/product.ko.md:9`: "검수자가 통과시켜야만 PR이 열립니다", where `docs/product.md:9` reads "the PR opens only when an inspector that built none of the work clears it".
- `docs/product.ko.md:96`: "만든 쪽은 자기 작업을 통과시키지 못합니다", where `docs/product.md:96` reads "The party that built the work cannot clear it". The specification's Korean principle 2 is "만든 쪽은 합격시키지 않는다".
- `docs/roadmap.ko.md:24`: "저장소의 목록 밖 모듈이 검수한 PR은 통과하지 않습니다", where `docs/roadmap.md:24` reads "is not cleared".

The search listed every 통과 in the Korean documents, and each other hit was read against its twin: a check or a status check passing (`README.ko.md:49`, `:53`, `:58`, `:61`, `docs/architecture.ko.md:280`, `:298`, `:328`, `:340`, `:343`, `docs/roadmap.ko.md:122`, `:155`), the broad gate or a test passing (`docs/design.ko.md:541`, `:544`, `docs/iadd.ko.md:95`, `:118`, `:125`, `docs/product.ko.md:63`, `:70`, `:89`, `:192`, `docs/roadmap.ko.md:21`, `:101`, `:124`), and `docs/roadmap.ko.md:149`, which says the depth judgment lets small work through. A search for 실효, 검수 통과 and 검수 없음 over the whole tree finds only `changelog.md:6`, which names the old words, and `README.ko.md:61`, which is a status check passing. The search is a sample under contract rules 12 and 19: a state written in another word than 통과 escapes it.

```markdown
docs/design.ko.md:11      통과시켰다는 뜻입니다   ->  합격시켰다는 뜻입니다
docs/design.ko.md:470     검수가 head에서 통과했으면:  ->  검수가 head에서 합격했으면:
docs/product.ko.md:9      검수자가 통과시켜야만 PR이 열립니다  ->  검수자가 합격시켜야만 PR이 열립니다
docs/product.ko.md:96     만든 쪽은 자기 작업을 통과시키지 못합니다.  ->  만든 쪽은 자기 작업을 합격시키지 못합니다.
docs/roadmap.ko.md:24     목록 밖 모듈이 검수한 PR은 통과하지 않습니다  ->  목록 밖 모듈이 검수한 PR은 합격 아님으로 읽힙니다
```

```iadd
verdict: fixed 7a1f62df
answer: The five sentences read 합격시켰다는, 합격했으면, 합격시켜야만, 합격시키지 and 합격하지.
```

### 3. Other documents still say that docs/iadd.md defines the method and holds its concept, principles and names, and README.md says an inspection lapses at the next commit

```iadd
severity: should
location: `README.md:11`, `README.md:71`, `README.ko.md:11`, `README.ko.md:71`, `docs/product.md:11`, `docs/product.ko.md:11`, `docs/architecture.md:12`, `docs/architecture.ko.md:12`, `docs/name.md:15`, `docs/name.ko.md:15`, `apps/desktop/role-bundle/README.md:3`
evidence: executed git grep -n -e 'iadd.md' -e 'iadd.ko.md' 467702ea -- . ':!docs/iadd.md' ':!docs/iadd.ko.md' ':!agentory'; executed git grep -n -e 'lapses at the next' -e '다음 커밋에서 효력' 467702ea -- .; read `docs/iadd.md:5`, `docs/iadd.md:115`
```

Why it matters: the new `docs/iadd.md:5` says the method's definition is the IADD specification, which states the concept, the principles, the invariants, the names and the record forms, and that "This document does not restate them". Sentences outside the diff still send a reader to `docs/iadd.md` for what it no longer holds, and contract rule 19 asks the change that rewrites a fact to correct each sentence that stated the old one. The search printed these, each in both languages unless named:

- `README.md:11`: "[docs/iadd.md](docs/iadd.md) is Owlery's definition of the method: its principles, its names, its records and what a workflow is." The same sentence says "The inspection is bound to one commit and lapses at the next". Row B3 of the owner's decisions calls "lapses at the next" inexact, and `docs/iadd.md:115` says a commit that changes only the closing records leaves the inspection cleared. `README.ko.md:11` says both in Korean.
- `README.md:71`, the documents table: "its concept, its principles, its names and the names set aside".
- `docs/product.md:11`: "[docs/iadd.md](iadd.md) defines it: its principles, its names, its records, what a workflow is, and what holds for every workflow."
- `docs/architecture.md:12`: "[docs/iadd.md](iadd.md) defines the method, its records and what a workflow is."
- `docs/name.md:15`: "The owner set the concept IADD on 2026-11-28 ([docs/iadd.md](iadd.md))", which cites for the concept a document that no longer states it.
- `apps/desktop/role-bundle/README.md:3`, in English alone: "`docs/iadd.md` at the top of Owlery's repository defines the method". No case of `apps/desktop/test/role-bundle.test.ts` holds that sentence.

In the snippet, `SPEC_EN` stands for the link target of the specification that `docs/iadd.md:5` uses, and `SPEC_KO` for the one `docs/iadd.ko.md:5` uses. Neither name is in the tree: the fix pass writes the full link target in its place.

The search's other hits stay as they are. `docs/architecture.md:161`, `:201`, `:212`, `:214`, `docs/product.md:192`, `:206`, `docs/roadmap.md:24` and `pr-check/README.md:3` link to sections that still stand and say what they hold. `docs/roadmap.md:60` is the row of the published release 0.2.0. The search is a sample under contract rules 12 and 19: a sentence that names the document without its file name escapes it.

```markdown
README.md:11, from "The inspection is bound":
The inspection is bound to one commit and lapses once a commit that changes more than the inspection's closing records follows it, so such a commit shows on the pull request as a lapsed inspection. The [IADD specification](SPEC_EN) defines the method, and [docs/iadd.md](docs/iadd.md) states Owlery's side of it: the version Owlery follows, where it holds each principle, what it adds to the records, where it departs, and what a workflow is.

README.ko.md:11, from "검수는 커밋 하나에":
검수는 커밋 하나에 묶이고, 마감 기록보다 많이 바꾼 커밋이 그 뒤에 오면 효력을 잃으므로, 그런 커밋은 PR에 효력을 잃음으로 보입니다. 방법론은 [IADD 명세](SPEC_KO)가 정의하고, [docs/iadd.ko.md](docs/iadd.ko.md)는 그 명세에서 Owlery가 맡은 쪽을 밝힙니다. Owlery가 따르는 버전, 각 원칙을 지키는 곳, 기록에 더한 것, 벗어나는 곳, 그리고 워크플로가 무엇인지가 거기 있습니다.

README.md:71:
| [docs/iadd.md](docs/iadd.md) | Owlery's side of the IADD specification: the version it follows, where it holds each principle and invariant, the names and record lines it adds, where it departs, its check, what a workflow is, and what holds for every workflow |

README.ko.md:71:
| [docs/iadd.ko.md](docs/iadd.ko.md) | IADD 명세에서 Owlery가 맡은 쪽. 따르는 버전, 원칙과 불변식을 지키는 곳, 더한 이름과 기록의 줄, 벗어나는 곳, 검사, 워크플로가 무엇인지, 모든 워크플로에 성립하는 것 |

docs/product.md:11, the sentence after "approves its own work.":
The [IADD specification](SPEC_EN) defines it, and [docs/iadd.md](iadd.md) states Owlery's side: where Owlery holds each principle, its names, its records, what a workflow is, and what holds for every workflow.

docs/product.ko.md:11, the two sentences after "방법론입니다.":
[IADD 명세](SPEC_KO)가 그것을 정의하고, [docs/iadd.ko.md](iadd.ko.md)가 Owlery가 맡은 쪽을 밝힙니다. Owlery가 각 원칙을 지키는 곳, 이름, 기록, 워크플로가 무엇인지, 모든 워크플로에 성립하는 것이 거기 있습니다.

docs/architecture.md:12, the second sentence:
The [IADD specification](SPEC_EN) defines the method and its records, and [docs/iadd.md](iadd.md) states Owlery's side of it and what a workflow is.

docs/architecture.ko.md:12, the second sentence:
방법론과 그 기록은 [IADD 명세](SPEC_KO)가 정의하고, 그 명세에서 Owlery가 맡은 쪽과 워크플로가 무엇인지는 [docs/iadd.ko.md](iadd.ko.md)가 밝힙니다.

docs/name.md:15: the link ([docs/iadd.md](iadd.md)) becomes ([the IADD specification](SPEC_EN))
docs/name.ko.md:15: the link ([docs/iadd.ko.md](iadd.ko.md)) becomes ([IADD 명세](SPEC_KO))

apps/desktop/role-bundle/README.md:3, the sentence that opens "`docs/iadd.md` at the top":
The [IADD specification](SPEC_EN) defines the method, `docs/iadd.md` at the top of Owlery's repository states Owlery's side of it, and the app ships neither document.
```

```iadd
verdict: fixed 7a1f62df
answer: README.md and its twin, docs/product.md, docs/architecture.md, docs/name.md with their twins, and the role bundle's README now say that the specification defines the method and docs/iadd.md states how Owlery follows it, and README.md no longer says an inspection lapses at the next commit.
```

### 4. The row on how a run ends says Owlery offers no branch end, and the daemon rests at the cleared branch where the routing says to stop before the pull request

```iadd
severity: should
location: `docs/iadd.md:15`, `docs/iadd.ko.md:15`
evidence: read `apps/desktop/src/daemon/chain.ts:194-198`, `apps/desktop/src/daemon/chain.ts:567-576`, `apps/desktop/src/daemon/decision-record.ts:93`, `apps/desktop/src/daemon/daemon.ts:4315-4318`, `apps/desktop/test/chain.test.ts:3530-3540`, `apps/desktop/role-bundle/skills/inspection/SKILL.md:46`
```

Why it matters: the row answers the specification's §1 and row A4, where each product says which ends it offers. It reads "Owlery writes `open the pull request` as the `Destination` of every work item, and offers no handed-back branch". Owlery writes a `routing.md` only where it makes the directory at a chain's first start (`chain.ts:567-576`), and a pane's session or a person may write another. Owlery's reader takes `stop before the pull request` as a declaration's answer (`decision-record.ts:93`). `pullRequestOwed` owes no pull request for it (`chain.ts:194-198`), so the daemon's chain rests at the cleared branch and calls no `gh`, which `chain.test.ts:3530-3540` holds. A pane's session opens a pull request only "Where the work goes to a pull request" (`skills/inspection/SKILL.md:46`). A person who reads the row would believe a branch end does not exist and route around it.

```markdown
docs/iadd.md:15:
| How a run ends | at a pull request where the work item's `routing.md` answers `Destination` with `open the pull request`, the answer Owlery writes into each `routing.md` it makes at a chain's first start. Where the answer is `stop before the pull request`, the chain rests at the cleared branch and opens no pull request |

docs/iadd.ko.md:15:
| 실행이 끝나는 곳 | 작업의 `routing.md`가 `Destination`에 `open the pull request`라고 답하면 PR. Owlery는 체인을 처음 시작하며 만드는 `routing.md`마다 이 답을 씁니다. 답이 `stop before the pull request`이면 체인은 합격한 브랜치에서 멈추고 PR을 열지 않습니다 |
```

```iadd
verdict: fixed 7a1f62df
answer: The row says Owlery writes `open the pull request` for every item it routes, that a routing naming `stop before the pull request` rests the chain at the cleared branch, and that no screen offers it yet.
```

### 5. The row on a merge of the base says a base commit that touches only the work item's own directory does not lapse the inspection, and the code lapses it unless the change is to a closing record

```iadd
severity: should
location: `docs/iadd.md:18`, `docs/iadd.ko.md:18`
evidence: read `pr-check/skills/code-review/scripts/chain_check.py:1075-1116`, `apps/desktop/src/daemon/chain.ts:378-388`, `apps/desktop/src/daemon/chain.ts:411-423`, `apps/desktop/src/daemon/chain.ts:535`, `apps/desktop/src/daemon/worktrees.ts:1320-1322`, `apps/desktop/src/daemon/worktrees.ts:1367-1369`
```

Why it matters: §8.7 of the specification leaves to each product whether a merge of the base, with the commits it brings, follows the inspected commit, and this row is Owlery's answer. Its second sentence reads "A commit of the base that touches only the work item's own directory does not". Both readers compare the trees first. The check's `since_cleared` returns `differs` for any path between the cleared tree and HEAD that is not one of the closing records (`chain_check.py:1104-1107`). The daemon's `gateHolds` asks the same of the paths between the gate's commit and the head (`chain.ts:386-388`), and an inspection is cleared only where the gate holds (`chain.ts:420-423`). So a base commit that changes, say, the work item's `routing.md` or a round record lapses the inspection. What the directory exempts is the other half, the walk of the commits the merge brought: a brought commit that touches a path outside the directory lapses the inspection even where the two trees hold the same (`chain_check.py:1108-1115`; in the daemon, the paths `pathsOfCommits` lists at `chain.ts:535`, with `worktrees.ts:1320-1322`, which `chain.ts:418-419` reads for a path outside the directory). The row states that half backwards, and a reader who merges such a base commit expects a cleared inspection and finds it lapsed.

```markdown
docs/iadd.md:18:
| A merge of the base after the inspected commit | it is read as every other commit: the inspection lapses where the trees of the inspected commit and the head differ in more than the closing records. Each commit of the base that the merge brings is walked as well, and one that touches a path outside the work item's own directory lapses the inspection even where the two trees hold the same |

docs/iadd.ko.md:18:
| 검수한 커밋 뒤의 base 머지 | 다른 커밋과 똑같이 읽습니다. 검수한 커밋과 head의 트리가 마감 기록보다 많이 다르면 검수는 효력을 잃습니다. 머지가 들여온 base의 커밋도 하나하나 살피고, 그 작업 자신의 디렉터리 밖의 경로를 건드린 커밋이 있으면 두 트리가 같아도 검수는 효력을 잃습니다 |
```

```iadd
verdict: fixed 7a1f62df
answer: The row says a merge lapses the inspection where it changes a path other than the closing records, as every other commit does, and drops the exception.
```

### 6. The row on an undecided verdict says the work item parks after two, and the daemon rules on the first two and parks at the third

```iadd
severity: should
location: `docs/iadd.md:19`, `docs/iadd.ko.md:19`
evidence: read `apps/desktop/src/daemon/chain.ts:55-56`, `apps/desktop/src/daemon/daemon.ts:4078-4089`
```

Why it matters: the row reads "After two `undecided` verdicts the work item parks for the person". `UNDECIDED_CEILING` is 2, the number of `undecided` verdicts of one inspection the daemon asks the orchestrator to rule on (`chain.ts:55-56`). At `daemon.ts:4079` a verdict is ruled on while fewer than two `undecided` verdicts stand before it, so the second gets a ruling too, and only the question of the third and each later one parks the work item with no ruling asked (`daemon.ts:4083-4085`). A person who sees the second `undecided` verdict and reads the row waits for a park that does not come.

```markdown
docs/iadd.md:19:
| Who answers an `undecided` verdict first | the orchestrator agent, for the first two `undecided` verdicts of an inspection, and its ruling is committed to `decisions.md`. The question of each later one parks the work item for the person with no ruling asked |

docs/iadd.ko.md:19:
| `undecided` 판정에 누가 먼저 답하는지 | 검수 하나의 처음 두 `undecided` 판정에는 orchestrator 에이전트가 답하고, 그 판단은 `decisions.md`에 커밋됩니다. 그 뒤의 `undecided` 판정은 판단을 묻지 않은 채 그 질문으로 작업을 사람을 기다리며 세워 둡니다 |
```

```iadd
verdict: fixed 7a1f62df
answer: The row says the orchestrator rules on the first two, and from the third the work item parks.
```

### 7. The lists of what Owlery adds and where it departs leave out lines and a party that the code has, which §9 of the specification asks each product to list

```iadd
severity: should
location: `docs/iadd.md:20`, `docs/iadd.md:59-65`, `docs/iadd.md:74-84`, `docs/iadd.ko.md:20`, `docs/iadd.ko.md:59-65`, `docs/iadd.ko.md:74-84`, `agentory/threads/1795855409-353-owlerys-iadd-follows-the-specification/changelog.md:5`
evidence: read `apps/desktop/src/daemon/record-blocks.ts:356-437`, `pr-check/lib/fields.py:140-260`, `pr-check/lib/config.py:329-348`, `pr-check/skills/code-review/scripts/chain_check.py:1465-1466`, `apps/desktop/src/daemon/decision-record.ts:92-93`, `apps/desktop/src/daemon/decision-record.ts:139-149`, `apps/desktop/src/daemon/stage-records.ts:369`, `apps/desktop/src/daemon/chain-command.ts:396`, `apps/desktop/role-bundle/agents/orchestrator.md`, `apps/desktop/role-bundle/workflows/owl-chain.json`
```

Why it matters: §9 item 3 of the specification asks a product to state "each place it departs from this document, and each file and line it adds to the record forms", and §8.1 asks it to state which configuration keys it reads and writes. Walked kind by kind, the block kinds of `record-blocks.ts:356-437` and `fields.py`, which the two readers share, against §8.4 to §8.6 give these gaps, each absent from `docs/iadd.md` and its twin:

- **A close block's `location:` line** (`record-blocks.ts:382`, `fields.py` `CLOSE_BLOCK`). §8.4 gives a close block `verdict:` and `answer:` alone. The check reads the line: a `fixed` commit must touch a path that the finding's or its close's `location:` names (`chain_check.py:871`).
- **A close block's `answer:` is optional** (`at most one` at `record-blocks.ts:381`), where §8.4 says the block "holds `answer:`". Departure 6 names `evidence:` and `regression:` and not this.
- **A finding's `severity:` takes any words** (`record-blocks.ts:368`), where §8.4 gives `must` or `should`, and **a `confirms:` line takes `none`** (`record-blocks.ts:386`), which a record of an earlier template wrote.
- **The rows of `routing.md` the readers read**: `Review`, `Destination` and `Branch`, which make a declaration (`decision-record.ts:139-149`), `Automation` (`chain-command.ts:396`) and `Implementation`, whose `the session` the daemon names among the builders (`stage-records.ts:369`). §8.2 gives `routing.md` only the question it answers.
- **The key `Policy root`**, which the check reads (`config.py:329-348`, `chain_check.py:1465-1466`). The row at `docs/iadd.md:20` says Owlery reads `Broad gate` and `Heavy commands`.

Walked against §6, the parties give one more. §6 says "The orchestrator is a session, not an agent". Owlery's role bundle holds an orchestrator agent, `agents/orchestrator.md`, which the daemon starts as the `judgment` stage of `workflows/owl-chain.json` and for a ruling, and `docs/iadd.md:19` itself names it "the orchestrator agent". It is a departure, and the list does not hold it.

The walk of the block kinds is whole for the forms the two readers take. The walk of the specification's other sections is a sample: it read them against the claims the document makes, and not every behaviour of the code against every section. `changelog.md:5` repeats the two lists ("six lines of the verdict block", "the nine places"), so it changes with them.

```markdown
docs/iadd.md:20, the row's answer:
`shared` alone: the root is committed. Owlery writes `Commit and pull request language`, `Record language` and `Broad gate`, writes no `Mode`, and reads `Broad gate`, `Heavy commands` and, in the check, `Policy root`

docs/iadd.md, after the bullet of `trail/refusals.md` (line 62):
- **A finding's close block** takes a `location:` line, the places its close names. The check holds that a `fixed` commit touches a path that the finding's or its close's `location:` names.
- **`routing.md`** holds the rows `Review`, `Destination` and `Branch`, which make it a declaration, `Automation`, which says whether a run stops for a question, and `Implementation`, whose `the session` the verdict block names among the builders.

docs/iadd.md, after item 9 of Where Owlery departs:
10. **§8.4.** A close block's `answer:` is optional, a finding's `severity:` takes any words, and a `confirms:` line takes `none`, which a record of an earlier template wrote. No code reads `severity:` or `answer:`.
11. **§6.** Owlery's orchestrator is also an agent, `agents/orchestrator.md`, which the daemon starts for the judgment of whether the rounds converge and for a ruling on a stage's question.

docs/iadd.ko.md:20, the row's answer:
`shared`뿐입니다. 루트는 커밋됩니다. Owlery는 `Commit and pull request language`, `Record language`, `Broad gate`를 쓰고, `Mode`는 쓰지 않으며, `Broad gate`와 `Heavy commands`를, 검사에서는 `Policy root`도 읽습니다

docs/iadd.ko.md, after the bullet of `trail/refusals.md` (line 62):
- **발견의 마감 블록**은 `location:` 줄을 받습니다. 그 마감이 가리키는 자리입니다. 검사는 `fixed` 커밋이 발견이나 그 마감의 `location:`이 가리키는 경로를 건드렸는지 봅니다.
- **`routing.md`**에는 선언을 이루는 `Review`, `Destination`, `Branch` 행, 실행이 질문으로 멈추는지를 밝히는 `Automation` 행, 그리고 `the session`이면 판정 블록이 그것을 만든 쪽으로 밝히는 `Implementation` 행이 있습니다.

docs/iadd.ko.md, after item 9 of Owlery가 벗어나는 곳:
10. **§8.4.** 마감 블록의 `answer:`는 없어도 되고, 발견의 `severity:`는 어떤 말이든 받으며, `confirms:` 줄은 예전 템플릿의 기록이 쓴 `none`도 받습니다. `severity:`와 `answer:`는 어떤 코드도 읽지 않습니다.
11. **§6.** Owlery의 orchestrator는 에이전트이기도 합니다. 데몬은 `agents/orchestrator.md`를 회차가 수렴하는지에 대한 판단과 단계의 질문에 대한 판단에 띄웁니다.

changelog.md:5: the parenthesis names the added close-block line and routing rows beside the others, and "the nine places" becomes "the eleven places".
```

```iadd
verdict: fixed 7a1f62df
answer: The additions list names the routing rows and the directory's name, the orchestrator as an agent, and what the round record's readers take beyond §8.4. The modes row names `Policy root`. The changelog fragment drops the counts.
```

The two documents' headings, table rows and `check:` lines stay paired: the snippet adds two bullets and two list items to each.

### 8. The row of principle 8 says code holds each invariant, and the document says a pane holds invariants 3 and 7 otherwise

```iadd
severity: should
location: `docs/iadd.md:35`, `docs/iadd.ko.md:35`
evidence: read `docs/iadd.md:83`, `docs/iadd.md:116`, `apps/desktop/role-bundle/agents/proofer.md`, `apps/desktop/role-bundle/agents/inspector.md`
```

Why it matters: the row reads "invariants 1 to 7 below, each held by code". Departure 8 (`docs/iadd.md:83`) and invariant 3 (`docs/iadd.md:116`) say that in a pane the judging roles are subagents holding `Bash` under the person's own permission settings, with no sandbox, and that only the check holds invariant 7 there. The bundle's `agents/proofer.md` and `agents/inspector.md` name `Bash` among their tools. So the row contradicts the document's own departure, and a reader who checks principle 8 alone takes the pane to be held by code.

```markdown
docs/iadd.md:35:
| 8. Some links no party skips | invariants 1 to 7 below. Owlery's code holds each in the daemon's chain, and item 8 of [Where Owlery departs](#where-owlery-departs) gives what holds invariants 3 and 7 in a pane |

docs/iadd.ko.md:35:
| 8. 어느 쪽도 건너뛰지 못하는 연결이 있다 | 아래 불변식 1부터 7. 데몬의 체인에서는 하나하나를 Owlery의 코드가 지키고, 칸에서 불변식 3과 7을 무엇이 지키는지는 [Owlery가 벗어나는 곳](#owlery가-벗어나는-곳) 8번에 있습니다 |
```

```iadd
verdict: fixed 7a1f62df
answer: The row says code holds each in the daemon's chain, and points at departure 8 for the pane.
```

## Confirmations

What matched: #362's three sentences read exactly as the issue's fixes give them, at `docs/roadmap.md:93`, `docs/roadmap.md:122`, `docs/architecture.md:203` and the same lines of each Korean twin. Read at the target.

What matched: the owner's decisions the document carries. `docs/iadd.md:9` names version 0.1.0, and every link to the specification names the tag `v0.1.0`. Rows D1, D2, E3, E4 and the names row of the harness table are what *The specification Owlery follows*, *Workflows* and *What holds for every workflow* state. Rows B1 and A4 are answered by the rows at `docs/iadd.md:16` and `:15`; finding 4 is about the second. The concept, principles, names and record forms are no longer restated. Read against comment 7236479163 and `spec/iadd.md` at `v0.1.0`.

What matched: departures 1 to 9 against the code, read at the target. Item 1 is `chain-command.ts:118` with `docs/architecture.md:328`. Item 2 is `role-bundle/skills/inspection/SKILL.md:110-112` and `docs/architecture.md:340`. Item 3 is `inspection-state.ts:68-70` and `chain_check.py:1098-1103` with `:1145-1148`, the latter being what the check posts as lapsed. Item 4 is `chain.ts:378-388`, a tree comparison inside the directory, against `chain.ts:418-419` with `:535`, which walks the commits outside it. Item 5 is `inspection-state.ts:73-83`. Item 6 is `record-blocks.ts:370-371` and `fields.py` `FINDING_BLOCK`. Item 7 is `daemon.ts:3332` and `stage-records.ts:95`. Item 8 is the `tools:` lines of `agents/proofer.md` and `agents/inspector.md`, `skills/inspection/SKILL.md:46`, and issue #286 open. Item 9 is `settle.ts:1-4` and issue #139 open.

What matched: the record additions listed, read at the target. `decisions.md`'s `decision:` and `question:` blocks each require one `grounds:` and one `state:` (`record-blocks.ts:440-505`). `trail/refusals.md` is a closing record (`chain.ts:70`, `chain_check.py:197`). The verdict block takes the six lines named (`record-blocks.ts:411-433`). `IADD-Built-By:` stands on a fix pass's commit (`stage-records.ts:240`). `Heavy commands` is read at `records-place.ts:245`. Owlery writes three keys and no `Mode` (`records-place.ts:56`).

What matched: the rest of the harness table and the principles table. The role bundle holds the agents crafter, inspector, orchestrator and proofer, and no framer or tracer. Milestone 3 holds the question batch (`docs/roadmap.md:23`). The Owl Chain's two files name each stage's documents and the inspector module's one check, `Broad gate`. The check refuses a verdict whose inspector is a builder (`chain_check.py` `inspection`, `INSPECTOR_BUILT`). Each section a row cites stands and says what the row says it does: *What changes because Owlery is not a plugin*, whose row *Asking the person* is at `docs/architecture.md:231`, *State lives in three places*, whose inspection sheet is at `docs/architecture.md:258`, *What each session loads*, *Role sessions run detached from the user's environment* and *Code runs the order, the orchestrator judges*. Read.

What matched: every relative link with a fragment in the tracked Markdown files, and every link to the specification, resolves by GitHub's anchor rules, Korean included. The probe checked 358 links. The two it reports are the `../blob/<commit>/<path>?raw=true` placeholders in the prose of `docs/design.md` and `docs/design.ko.md`, which stand at the base too. No text of the tree names a heading the change removed from `docs/iadd.md` or its twin by its italic title. Executed, rows 1 and 3 of *Probes*.

What matched: `docs/iadd.md` and `docs/iadd.ko.md` hold the same 14 headings, 28 table rows and 4 `check:` lines, on the same line numbers, and every `check:` line names test files that stand. Read side by side, each sentence of the twin says what its English line says. Executed, row 4 of *Probes*, and read.

What matched: `routing.md`'s claim that the branch was cut from `release/v0.2.1` at `e472b841`, which `git merge-base origin/release/v0.2.1 467702ea` prints. The three quotes of `pr.md` match issue #353's *Done when*, issue #362's last paragraph and `routing.md` *Why this way*. Executed and read.

One quality note, which opens no finding: invariant 7 at `docs/iadd.md:120` says "Owlery opens a pull request only at a cleared head" without pointing to departure 8, where in a pane the session opens it. Invariant 2 points to its departures, and invariant 7 could do the same.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite and the typecheck at the target, labelled `unverified`. Finding 1 names the case that the round expects to fail. Contract rule 2 leaves the broad run to the orchestrator, and the routing gives the suite to CI on the pull request | `apps/desktop/test/` | the orchestrator, through CI's run on the pull request |
| Whether GitHub renders each anchor as the probe's slug function computes it. The probe is a reimplementation, not GitHub's renderer | `docs/`, `README.md`, `README.ko.md` | the orchestrator or the owner, on the rendered pages of the pull request |
| The naturalness of the Korean prose beyond the rename. The round read the rename's grammar and its twins' meaning, not every sentence's style | `docs/*.ko.md`, `README.ko.md` | the owner |
| Whether the fix pass's closes are read by a round, which the chain check's records arm asks for and the owner's one-round route leaves out. The route itself is the owner's decision, and the round does not judge it | `routing.md` *Why this way* | the orchestrator and the owner |

## Probes

| Command | Result |
|---|---|
| `python3 -I test_tmp_anchors.py <clone> <iadd-workflows checkout>` | checked 358 links, 2 broken, both the `<commit>/<path>` placeholders of `docs/design.md` and `docs/design.ko.md`; an inline run of its `anchors` function on `docs/iadd.ko.md` told `owlery가-벗어나는-곳` (present) from `owlery가-벗어나는-것` (absent) |
| `python3 -I test_tmp_workflow_pin.py <clone>` | `workflowText('0.2.0') == committed file: True`, `workflowText('0.2.1') == committed file: False`, package version 0.2.1 |
| `git grep -n -e '실효' -e '검수 통과' -e '검수 없음' -e '통과시' 467702ea -- .` and the `통과` search of finding 2 | the five hits of finding 2 and the hits it classes as a check, a gate or a test passing |
| `grep -c '^#'`, `grep -c '^\|'` and `grep -c '^check:'` on `docs/iadd.md`, `docs/roadmap.md`, `docs/architecture.md` and each twin, and a diff of the line numbers of headings, rows, list items and `check:` lines of the `iadd` pair | 14/14, 28/28, 4/4 for `iadd`; 11/11, 44/44, 1/1 for `roadmap`; 25/25, 126/126, 63/63 for `architecture`; the `iadd` pair's structure lines stand on the same numbers |
