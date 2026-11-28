# Review round 2: 1795855409-353-owlerys-iadd-follows-the-specification

```iadd
target: 85f0a5f8, fixes 467702ea..85f0a5f8
```

This is a verifying round, read in a clone at `85f0a5f8`. Its range starts at round 1's target, `467702ea`, so that it holds round 1's fix commit `7a1f62df` as well as `85f0a5f8`. The caller named `git diff 2dec6b72..85f0a5f8`, which leaves `7a1f62df` out. No round has read that commit, and the chain check's records arm asks that the next record read every `fixed` commit, so the round read both. The range holds no merge of the base: `git merge-base origin/release/v0.2.1 85f0a5f8` prints `e472b841`, the commit `routing.md` names.

The work item still has no `frame/`, no `gaps.md` and no `trail/phases/`. The ground in place of a frame is the one round 1 named, with one change: the owner set on 2026-11-28 that the IADD specification holds the method's principles alone, with no record forms and no version. So the specification read is MichaelYcJo/iadd-workflows `main` at `6617881`, `spec/iadd.md` and `spec/iadd.ko.md`, and not the tag `v0.1.0`. Whether that decision is right is the owner's, and the round does not judge it.

Carried from round 1, not re-established: the coordinates of finding 4 (`chain.ts#pullRequestOwed`, `decision-record.ts:93`), finding 5 (`chain_check.py#since_cleared`, `chain.ts#gateHolds`), finding 6 (`chain.ts:55-56`, `daemon.ts:4078-4089`) and finding 7 (`record-blocks.ts:356-437`, `pr-check/lib/fields.py`). Each was opened again at the target before its verdict below. Every verdict below is this round's own.

The implementer's account is the subject and body of `85f0a5f8`, the close blocks of round 1 and `changelog.md`. What it claims and what the round found:

- Claimed (subject of `85f0a5f8`): the document states "its own record forms in full". Found: the records section leaves out lines and files that the two readers read (finding 5), and states the three states as the daemon reads them while saying the check reads them the same way (finding 4).
- Claimed (`changelog.md:5`): where the code leaves a gap, the row names its issue, `#139`, `#286`, `#363`, `#365`, `#367` and `#369`. Found: each of the six is open on GitHub and its title is the gap the row names. `#139` is at `docs/iadd.md:33`, `#286` at `:30` and `:134`, `#363` at `:14`, `#365` at `:92`, `#367` at `:27`, and `#369` at `:30`.
- Claimed (close of round-1#7): the additions list names the directory's name. Found: the name it states is not the one the daemon writes (finding 2).
- Claimed (close of round-1#3): the documents now say that `docs/iadd.md` states how Owlery follows the specification. Found: that holds for each sentence round 1 named, and `85f0a5f8` then made two of them false again (finding 1).

## Findings

### 1. README's documents table says docs/iadd.md answers what the specification leaves to a product and lists where Owlery departs, and the architecture says the specification defines the records

```iadd
severity: should
location: `README.md:71`, `README.ko.md:71`, `docs/architecture.md:12`, `docs/architecture.ko.md:12`
evidence: executed git grep -n -o -e 'leaves to a product' -e 'where it departs' -e '벗어나는 곳' -e '명세가 제품에 맡긴' -e 'defines the method and its records' -e '방법론과 그 기록은' 85f0a5f8 -- . ':!agentory'; read `docs/iadd.md:5`, `docs/iadd.md:51`, spec/iadd.md (iadd-workflows 6617881) section 8
regression: round-1#3
```

Why it matters: the unit is the row of `README.md:71` and the second sentence of `docs/architecture.md:12`, with their twins, which round 1's finding 3 had `7a1f62df` rewrite. Round 1's fix set them to the specification `v0.1.0`, which stated record forms and left choices to each product. `85f0a5f8` then rewrote `docs/iadd.md` on the owner's new ground, so the defect comes from that commit leaving the two sentences as they were.

- `README.md:71` reads "its answers to what the specification leaves to a product, where it holds each principle, what it adds to the record forms and where it departs". `docs/iadd.md` no longer has a section on departures or additions. It states Owlery's choices, what Owlery takes from each principle, and Owlery's own record forms (`docs/iadd.md:5`). `README.ko.md:71` says the same in Korean.
- `docs/architecture.md:12` reads "The IADD specification defines the method and its records". The specification at `main` defines no record forms, and each product "defines its own workflow and records in its own documents" (`spec/iadd.md` section 8). `docs/iadd.md:51` says "These are Owlery's own forms". `docs/architecture.ko.md:12` says the same in Korean.

The search also printed `docs/name.ko.md:15`. That sentence says the method and its records carry IADD's name, which is about names and still holds. The search is a sample under contract rules 12 and 19: a sentence that describes the document in other words escapes it.

```markdown
README.md:71:
| [docs/iadd.md](docs/iadd.md) | How Owlery runs IADD: its choices, what it takes from each principle, its own names and record forms, its check, what a workflow is, and what holds for every workflow |

README.ko.md:71:
| [docs/iadd.ko.md](docs/iadd.ko.md) | Owlery가 IADD를 돌리는 방식. Owlery의 선택, 원칙마다 가져오는 것, Owlery 자신의 이름과 기록 형식, 검사, 워크플로가 무엇인지, 모든 워크플로에 성립하는 것 |

docs/architecture.md:12, the second sentence:
The [IADD specification](https://github.com/MichaelYcJo/iadd-workflows/blob/main/spec/iadd.md) defines the method, and [docs/iadd.md](iadd.md) states how Owlery runs it, Owlery's own records, and what a workflow is.

docs/architecture.ko.md:12, the second sentence:
방법론은 [IADD 명세](https://github.com/MichaelYcJo/iadd-workflows/blob/main/spec/iadd.ko.md)가 정의하고, Owlery가 그것을 어떻게 돌리는지, Owlery 자신의 기록, 워크플로가 무엇인지는 [docs/iadd.ko.md](iadd.ko.md)가 밝힙니다.
```

```iadd
verdict: fixed 4e7e6896
answer: README's table and the architecture's line now say docs/iadd.md states how Owlery runs IADD and Owlery's own records, and that the specification defines the method.
```

### 2. The work item's directory is said to be named with the issue, and the daemon names it from the branch alone

```iadd
severity: should
location: `docs/iadd.md:61`, `docs/iadd.ko.md:61`
evidence: read `apps/desktop/src/daemon/stage-records.ts:142`, `apps/desktop/src/daemon/worktrees.ts:28-31`; executed git grep -n -F '<seconds>-<issue>-<slug>' 85f0a5f8 -- .
regression: round-1#7
```

Why it matters: the unit is the directory name that `7a1f62df` added to the additions list for round 1's finding 7, which `85f0a5f8` carried into the sentence above the table of *A work item's directory*. Round 1 asked for each file and line Owlery adds to be listed, and the fix wrote a name the code does not make. The sentence reads `agentory/threads/<seconds>-<issue>-<slug>/`. `declaredDirectory` names a new directory `${Math.floor(now / 1000)}-${slugFor(<the branch's last part>)}`, or `<seconds>-work-item` where the slug is empty (`stage-records.ts:142`). No issue number enters it. A branch named `docs/353-x` gives `353-x` only because the branch's name holds the number. The readers find a directory by the `Branch` row of its `routing.md` (`decision-record.ts#workItemDirectories`), not by its name. The search printed the two lines named in `location:` and no other.

```markdown
docs/iadd.md:61:
A work item's records stand in `agentory/threads/<seconds>-<slug>/`, where `<seconds>` is the time of the chain's first start and `<slug>` the slug of the last part of the branch's name, or `work-item` where that gives none. The readers find the directory by the `Branch` row of its `routing.md`, not by its name:

docs/iadd.ko.md:61:
작업 하나의 기록은 `agentory/threads/<seconds>-<slug>/`에 있습니다. `<seconds>`는 체인을 처음 시작한 시각이고, `<slug>`는 브랜치 이름의 마지막 부분을 slug로 만든 것이며, 그것이 비면 `work-item`입니다. 읽는 쪽은 디렉터리를 이름이 아니라 그 `routing.md`의 `Branch` 행으로 찾습니다.
```

```iadd
verdict: fixed 4e7e6896
answer: The directory reads `<seconds>-<slug>` from the branch's last part, found by the `Branch` row.
```

### 3. The table says pr.md holds the opening of the pull request body, and Owlery copies no pr.md into a body

```iadd
severity: should
location: `docs/iadd.md:72`, `docs/iadd.ko.md:72`
evidence: read `apps/desktop/src/daemon/github.ts:503-534`, `apps/desktop/role-bundle/skills/implement/SKILL.md:292`; executed git grep -n -F 'pr.md' 85f0a5f8 -- apps/desktop/src pr-check
regression: round-1
```

Why it matters: the unit is the row `gaps.md`, `changelog.md`, `pr.md` of the table that `85f0a5f8` added, a fix pass no finding of round 1 named. The owner asked for Owlery's own record forms in full, and the row gives `pr.md` a part that it has in the plugin's forms and not in Owlery's. `pullRequestBody` composes the body from the inspection section, the back's section, `changelog.md` under *What changed*, the newest run of `trail/gate.md` and the decisions (`github.ts:503-534`). The role bundle says "Owlery writes no `pr.md` ... a `pr.md` a person commits is a record Owlery copies into no body" (`skills/implement/SKILL.md:292`). The search found `pr.md` in the code only in the sample list `RECORDS` of `records-place.ts:37`, which no reader of a body uses. A person who writes `pr.md` to open the body finds it missing from the pull request.

```markdown
docs/iadd.md:72:
| `gaps.md`, `changelog.md`, `pr.md` | what was not verified; the entry in the next release's notes, which the pull request body carries whole under *What changed*; and a text Owlery copies into no body |

docs/iadd.ko.md:72:
| `gaps.md`, `changelog.md`, `pr.md` | 검증하지 못한 것, 다음 릴리스 노트의 항목(PR 본문이 *What changed* 아래에 통째로 싣습니다), 그리고 Owlery가 어느 본문에도 옮기지 않는 글 |
```

```iadd
verdict: fixed 4e7e6896
answer: The row says the pull request body carries the changelog whole and that Owlery copies `pr.md` into no body.
```

### 4. The three states are the daemon's reading, the document says the check reads them the same, and the not-cleared row leaves out a newest verdict that is not cleared

```iadd
severity: should
location: `docs/iadd.md:51`, `docs/iadd.md:86-92`, `docs/iadd.ko.md:51`, `docs/iadd.ko.md:86-92`
evidence: read `apps/desktop/src/daemon/inspection-state.ts:43-82`, `pr-check/skills/code-review/scripts/chain_check.py:1075-1116`, `pr-check/skills/code-review/scripts/chain_check.py:1830-1880`, `pr-check/skills/code-review/scripts/chain_check.py:2518-2539`, `pr-check/skills/code-review/scripts/chain_check.py:2607-2620`, `pr-check/README.md:5`; executed git grep -n -e 'decisions' 85f0a5f8 -- pr-check
regression: round-1
```

Why it matters: the unit is the table *The three states, as Owlery reads them* and the sentence of `docs/iadd.md:51` "The daemon and the pull request check write and read them exactly as stated here", both of which `85f0a5f8` added. Owlery's choice is to read three states, and the owner asked for them as Owlery reads them. The fix wrote the daemon's reading as both readers' reading. The code gives three differences:

- **The check does not read the chain's owed step.** The cleared row requires "the chain owes no step at the head", and the lapsed row lapses where "the chain owes a step". That is `inspectionAt` through `stepOwed` (`inspection-state.ts:73-82`). The check reads no `decisions.md`: the search finds the word only in `pr-check/README.md:5`, which says so, and in a comment of `lib/console.py`. So an open question or a reversed decision lapses the inspection in the window, and the check still passes the pull request as cleared.
- **A record that does not read lapses the inspection in the daemon and not in the check.** `inspectionAt` returns lapsed where `standingOf` throws a `ChainStop` (`inspection-state.ts:73-79`). In the check, a refused record adds a problem and nothing to the list of comparisons behind the head, so the title is "The records are refused" and not the lapsed title (`chain_check.py:2537-2539`, `:2607-2614`). The lapsed row names neither case.
- **The not-cleared row leaves one case out.** It reads "no verdict that reads `cleared` stands". `inspection.md` is appended and never edited (`docs/iadd.md:81`). A block that reads `withheld` or `undecided` after a `cleared` one leaves a `cleared` block standing. Both readers then read not cleared: `inspectionAt` returns null on the newest block (`inspection-state.ts:67`), and the check reads `cleared` from the newest block alone (`chain_check.py:1860`). The cleared and lapsed rows require that the newest verdict reads `cleared`, so this case fits none of the three rows.

A reader who checks a pull request by the table expects the check to fail on an open question, and it passes. The snippet scopes the table to the daemon and says where the check differs. The words "exactly as stated here" stand only at `docs/iadd.md:51` and `docs/iadd.ko.md:51`, which the search for finding 5's evidence also printed.

```markdown
docs/iadd.md:51, the third sentence:
The daemon writes them as stated here, and the daemon and the pull request check read them so, apart from what [The three states, as Owlery reads them](#the-three-states-as-owlery-reads-them) names.

docs/iadd.md:86-90, the rows:
| cleared | the newest verdict reads `cleared`, nothing but the closing records changed between its commit and the head, and the daemon's chain owes no step at the head |
| lapsed | the newest verdict reads `cleared`, and a commit after it changed more than the closing records or the head no longer holds the cleared commit, or, in the daemon, the chain owes a step at the head or a record the head holds does not read |
| not cleared | the head holds no verdict block, or the newest one reads `withheld` or `undecided` |

docs/iadd.md, after line 92:
The pull request check reads no `decisions.md`, so an open question or a reversed decision that lapses the inspection in the window leaves the check cleared. A record the check refuses fails the check as refused, not as lapsed ([pr-check/README.md](../pr-check/README.md)).

docs/iadd.ko.md:51, the third sentence:
데몬은 여기 적은 그대로 쓰고, 데몬과 PR 검사도 그대로 읽습니다. 다른 점은 [Owlery가 읽는 세 상태](#owlery가-읽는-세-상태)에 있습니다.

docs/iadd.ko.md:86-90, the rows:
| 합격 | 가장 새 판정이 `cleared`이고, 그 커밋과 head 사이에 마감 기록 말고는 바뀐 것이 없고, 데몬의 체인이 head에서 빚진 단계가 없을 때 |
| 효력을 잃음 | 가장 새 판정이 `cleared`인데, 그 뒤의 커밋이 마감 기록보다 많이 바꿨거나 head가 그 합격 커밋을 더는 담지 않을 때, 또는 데몬에서 체인이 head에서 단계를 빚지고 있거나 head에 있는 기록이 읽히지 않을 때 |
| 합격 아님 | head에 판정 블록이 없거나, 가장 새 판정이 `withheld`나 `undecided`일 때 |

docs/iadd.ko.md, after line 92:
PR 검사는 `decisions.md`를 읽지 않습니다. 그래서 창에서 검수의 효력을 잃게 하는 열린 질문이나 뒤집힌 결정이 있어도 검사는 합격으로 남습니다. 검사가 거절하는 기록은 효력을 잃음이 아니라 거절로 검사를 실패시킵니다([pr-check/README.md](../pr-check/README.md)).
```

```iadd
verdict: fixed 4e7e6896
answer: The opening says where the readers read apart, the rows hold the daemon-only conditions and the withheld or undecided case, and a paragraph says the check reads no `decisions.md` and fails a refused record as refused.
```

### 5. The records are said to be stated in full, and the section leaves out lines and files that the two readers read

```iadd
severity: should
location: `docs/iadd.md:51`, `docs/iadd.md:55-57`, `docs/iadd.md:65`, `docs/iadd.md:71`, `docs/iadd.md:79-82`, `docs/iadd.md:96-97`, `docs/iadd.ko.md:51`, `docs/iadd.ko.md:55-57`, `docs/iadd.ko.md:65`, `docs/iadd.ko.md:71`, `docs/iadd.ko.md:79-82`, `docs/iadd.ko.md:96-97`
evidence: read `apps/desktop/src/daemon/record-blocks.ts:354-375`, `apps/desktop/src/daemon/record-blocks.ts:440-505`, `apps/desktop/src/daemon/decision-record.ts:92-93`, `apps/desktop/src/daemon/chain.ts:85-88`, `apps/desktop/src/daemon/chain.ts:957`, `pr-check/lib/fields.py:140-160`, `pr-check/lib/routing.py:195-225`, `pr-check/skills/code-review/scripts/chain_check.py:1676-1758`, `pr-check/skills/code-review/scripts/chain_check.py:2162-2164`, `pr-check/lib/gate.py:13-24`, `docs/architecture.md:289`; executed git grep -n -F 'exactly as stated here' 85f0a5f8 -- .
regression: round-1
```

Why it matters: the unit is the section *The records* that `85f0a5f8` wrote. The owner asked for Owlery's own record forms in full, and the commit's subject says "its own record forms in full". `docs/iadd.md:51` adds that the daemon and the check "write and read them exactly as stated here". Walked block kind by block kind through `record-blocks.ts` and `fields.py`, and file by file through what each reader opens, the section leaves out these facts:

- **`agentory/parity.json` and a round block's `original:` line.** The check reads the migration config at the root (`chain_check.py:1734`). Where it stands and the pull request changes a path outside `docs/` and the root (`gate.py:13-24`), the check refuses each round block with no `original:` line naming its `Baseline commit`. It does the same for the newest verdict block of a work item that goes `straight to the PR` (`chain_check.py:1676-1758`). The round bullet gives the round block `target:` alone, where `ROUND_BLOCK` also takes at most one `original:` (`record-blocks.ts:361`, `fields.py:148-158`). `docs/architecture.md:289` already says Owlery neither writes nor asks for the line.
- **The values of `regression:` and `reopens:`.** The bullet names the two keys and no value. `regression:` takes `round-<N>#<n>` or `round-<N>`, and `reopens:` takes `round-<N>#<n>` alone (`record-blocks.ts:371-372`).
- **The lines of `decisions.md`'s blocks.** The table gives "blocks opened by `decision:` or `question:`, each with its `grounds:` and its state". `DECISION_BLOCK` takes `decision: <id> <kind>`, where the kind is `route`, `default`, `scope` or `answered`. It also takes `decided:`, `grounds:`, at most one `by:`, a `state:` of `decided`, `reversed`, `applied <commit>` or `carried <home>`, and a `reversal:` in every state but `decided`. `QUESTION_BLOCK` takes `question: <id>`, `asks:`, `grounds:`, at most one `by:`, any number of `option:` lines, at most one `default:`, a `state:` of `open` or `answered`, and an `answer:` once answered (`record-blocks.ts:440-502`). Each kind's own check refuses a block that breaks one of those rules.
- **The columns of `trail/refusals.md`**: `Stage`, `Role`, `Tool`, `What the call does` and `Rule` (`chain.ts:957`).
- **The answers that make a `routing.md` a declaration.** `Review` answers `through the review chain` or `straight to the PR`, and `Destination` answers `open the pull request` or `stop before the pull request`. A file without both, and without a `Branch`, declares no work item (`decision-record.ts:92-93`, `pr-check/lib/routing.py:195-225`).
- **The trailers of commits written before the rename.** The check reads `Seal-Routing:` beside `IADD-Routing:` (`chain_check.py:2162-2164`), and the daemon reads `Seal-Built-By:` beside `IADD-Built-By:` (`chain.ts:85-88`).

The walk of the block kinds is whole for the kinds the two readers' records hold. The walk of the files is a sample: it read what the readers open by name, and a reader that builds a path in parts escapes it. The search printed `docs/iadd.md:51` and its twin, which finding 4's snippet also rewrites.

```markdown
docs/iadd.md, after line 57:
- **`agentory/parity.json`** declares a migration, and the pull request check alone reads it. Where it stands and a pull request changes a path outside `docs/` and `agentory/`, the check refuses each round block, and the newest verdict block of a work item that goes `straight to the PR`, that holds no `original:` line naming the file's `Baseline commit`. Owlery writes no `original:` line ([Records are committed to the repository](architecture.md#records-are-committed-to-the-repository)).

docs/iadd.md:65:
| `routing.md` | the rows `Review`, `Destination`, `Planning`, `Implementation`, `Automation` and `Branch`, and why. `Review` answers `through the review chain` or `straight to the PR`, and `Destination` answers `open the pull request` or `stop before the pull request`. A file without those two answers and a `Branch` declares no work item |

docs/iadd.md:71:
| `trail/refusals.md` | one row for each tool call a role session's grant refused, under the columns `Stage`, `Role`, `Tool`, `What the call does` and `Rule` |

docs/iadd.md:80, the round bullet: after "for a verifying round", insert
, and at most one `original:`
and after "at most one of `regression:` and `reopens:`", insert
; `regression:` names `round-<N>#<n>` or `round-<N>`, and `reopens:` names `round-<N>#<n>`

docs/iadd.md, after line 82:
- **`decisions.md`** holds one block per decision, opened by `decision: <id> <kind>`, the kind `route`, `default`, `scope` or `answered`. It holds `decided:`, `grounds:`, at most one `by:`, `state:` (`decided`, `reversed`, `applied <commit>` or `carried <home>`), and, in every state but `decided`, `reversal:`. A question is a block opened by `question: <id>`, holding `asks:`, `grounds:`, at most one `by:`, any number of `option:` lines, at most one `default:`, `state:` (`open` or `answered`), and, once answered, `answer:`. The daemon alone reads them.

docs/iadd.md, after line 97:
- A commit written before the rename to IADD carries `Seal-Routing:` or `Seal-Built-By:`. The check reads `Seal-Routing:` beside `IADD-Routing:`, the daemon reads `Seal-Built-By:` beside `IADD-Built-By:`, and Owlery writes neither.

docs/iadd.ko.md, after line 57:
- **`agentory/parity.json`**은 마이그레이션을 선언하고, PR 검사만 이 파일을 읽습니다. 이 파일이 있고 PR이 `docs/`와 `agentory/` 밖의 경로를 바꾸면, 검사는 이 파일의 `Baseline commit`을 가리키는 `original:` 줄이 없는 회차 블록을 하나하나 거절하고, `straight to the PR`로 가는 작업의 가장 새 판정 블록도 그렇게 거절합니다. Owlery는 `original:` 줄을 쓰지 않습니다([기록은 저장소에 커밋합니다](architecture.ko.md#기록은-저장소에-커밋합니다)).

docs/iadd.ko.md:65:
| `routing.md` | `Review`, `Destination`, `Planning`, `Implementation`, `Automation`, `Branch` 행과 그 까닭. `Review`는 `through the review chain`이나 `straight to the PR`로, `Destination`은 `open the pull request`나 `stop before the pull request`로 답합니다. 이 두 답과 `Branch`가 없는 파일은 어떤 작업도 선언하지 않습니다 |

docs/iadd.ko.md:71:
| `trail/refusals.md` | 역할 세션의 허용 범위가 거절한 도구 호출마다 한 행. 열은 `Stage`, `Role`, `Tool`, `What the call does`, `Rule`입니다 |

docs/iadd.ko.md:80, the round bullet: after "`target: <commit>, fixes <a>..<b>`로 씁니다", insert
. 이 블록은 `original:`을 많아야 하나 가집니다
and after "가운데 많아야 하나가 있습니다", replace the full stop with
. `regression:`은 `round-<N>#<n>`이나 `round-<N>`을, `reopens:`는 `round-<N>#<n>`을 가리킵니다.

docs/iadd.ko.md, after line 82:
- **`decisions.md`**에는 결정마다 `decision: <id> <kind>`로 여는 블록이 하나씩 있습니다. kind는 `route`, `default`, `scope`, `answered` 가운데 하나입니다. 블록에는 `decided:`, `grounds:`, 많아야 하나인 `by:`, `state:`(`decided`, `reversed`, `applied <commit>`, `carried <home>`), 그리고 `decided`가 아닌 상태에서는 `reversal:`이 있습니다. 질문은 `question: <id>`로 여는 블록이고, `asks:`, `grounds:`, 많아야 하나인 `by:`, 몇 개든 되는 `option:` 줄, 많아야 하나인 `default:`, `state:`(`open`이나 `answered`), 그리고 답한 뒤의 `answer:`가 있습니다. 이 블록들은 데몬만 읽습니다.

docs/iadd.ko.md, after line 97:
- IADD로 이름을 바꾸기 전에 쓴 커밋에는 `Seal-Routing:`이나 `Seal-Built-By:`가 있습니다. 검사는 `IADD-Routing:` 옆에서 `Seal-Routing:`도 읽고, 데몬은 `IADD-Built-By:` 옆에서 `Seal-Built-By:`도 읽으며, Owlery는 둘 다 쓰지 않습니다.
```

```iadd
verdict: fixed 4e7e6896
answer: The section adds `parity.json` and `original:`, the values of `regression:` and `reopens:`, the blocks of `decisions.md`, the columns of `trail/refusals.md`, the answers that make `routing.md` a declaration, and the older `Seal-` trailers.
```

The snippet adds bullets and changes cells, and adds no heading and no table row, so the twins stay paired under the `Broad gate` command's heading and row counts.

### 6. The changelog fragment's title still says docs/iadd.md follows the IADD specification 0.1.0

```iadd
severity: should
location: `agentory/threads/1795855409-353-owlerys-iadd-follows-the-specification/changelog.md:1`
evidence: executed git grep -n -e '0\.1\.0' -e 'v0.1.0' 85f0a5f8 -- agentory/threads/1795855409-353-owlerys-iadd-follows-the-specification ':!*/trail/rounds/*'; read `apps/desktop/src/daemon/github.ts:521`, `docs/iadd.md:5`
regression: round-1
```

Why it matters: the unit is `changelog.md`, which `85f0a5f8` rewrote. The owner set that the specification has no version, and the commit removed the version from `docs/iadd.md` and from line 1 of the fragment's body. It left the title, "Owlery's definition of IADD follows the IADD specification 0.1.0". The settle writes the fragment into the release notes. Owlery's own body composer carries the whole fragment under *What changed* (`github.ts:521`), so the title would reach the pull request too if Owlery composed it. The search printed this line, and `routing.md:16`, which finding 7 holds.

```markdown
agentory/threads/1795855409-353-owlerys-iadd-follows-the-specification/changelog.md:1:
# Changelog: Owlery's definition of IADD states Owlery as a product built on the IADD specification
```

```iadd
verdict: fixed 4e7e6896
answer: The fragment's title says Owlery is a product built on the IADD specification.
```

### 7. routing.md says this work item names the specification's version and lists what Owlery adds and where it departs

```iadd
severity: should
location: `agentory/threads/1795855409-353-owlerys-iadd-follows-the-specification/routing.md:16`
evidence: executed the search of finding 6's evidence; read `docs/iadd.md:5-17`
```

Why it matters: `routing.md:16` says what the work does: "The merged definition is the specification in MichaelYcJo/iadd-workflows, tagged `v0.1.0`. This work item writes Owlery's side: `docs/iadd.md` and its twin name that version, state where Owlery holds each principle and invariant, list what Owlery adds to the record forms and where it departs". At the target the document names no version, has no list of additions or departures, and links the specification at `main`. The sentence was true at `467702ea`, and the owner's decision of 2026-11-28 that `85f0a5f8` carried out made it false. The routing answers above it stay as they are, and the record of when the route was answered stays too. Only the sentence about what the work writes changes. The unit was made by the build, so the finding names no earlier one.

```markdown
agentory/threads/1795855409-353-owlerys-iadd-follows-the-specification/routing.md:16, the second and third sentences:
The merged source of the method's principles is the IADD specification in MichaelYcJo/iadd-workflows, which on 2026-11-28 the owner set to hold the principles alone, with no record forms and no version. This work item writes Owlery's side: `docs/iadd.md` and its twin state Owlery's choices, what Owlery takes from each principle, its own names and its own record forms, and drop what the specification states.
```

```iadd
verdict: fixed 4e7e6896
answer: The routing's account says the specification holds the principles alone and what this item writes.
```

## Confirmations

```iadd
confirms: round-1#1
```
What holds: `.github/workflows/owlery-inspection.yml:33-38` names 0.2.1 in its three version strings, and `apps/desktop/package.json:3` reads 0.2.1. The probe of round 1, written again from its *Probes* row, renders `records-place.ts#workflowText` for the package's version and finds it equal to the committed file. Executed, row 2 of *Probes*.

```iadd
confirms: round-1#2
```
What holds: the five sentences read 합격시켰다는 (`docs/design.ko.md:11`), 합격했으면 (`:470`), 합격시켜야만 (`docs/product.ko.md:9`), 합격시키지 (`:96`) and 합격하지 (`docs/roadmap.ko.md:24`). The search of round 1's `evidence:` line, run again over the three files, prints only a check, a gate or a test passing, and the depth judgment at `docs/roadmap.ko.md:149`. Executed, row 3 of *Probes*.

```iadd
confirms: round-1#3
```
What holds: the sentences round 1 named no longer say that `docs/iadd.md` defines the method or holds its concept, principles and names, and `README.md:11` no longer says an inspection lapses at the next commit. The rows `README.md:71` and `docs/architecture.md:12` hold that first defect no longer. Finding 1 is a different defect in them, which `85f0a5f8` brought. `README.md:11`, `docs/product.md:11`, `docs/name.md:15` and `apps/desktop/role-bundle/README.md:3`, with their twins, still hold at the target. Read.

```iadd
confirms: round-1#4
```
What holds: `docs/iadd.md:13` says Owlery writes `open the pull request` for every item it routes, and that a routing naming `stop before the pull request` rests the chain at the cleared branch. It also says no screen offers that. `pullRequestOwed` owes no pull request for that answer (`chain.ts:194-198`). `chain.ts#routingText` writes `open the pull request` (`chain.ts:585`), and the renderer names the other answer nowhere: `stop before the pull request` stands in `src/` only at `decision-record.ts:93`. Read, and executed by `grep -rn`.

```iadd
confirms: round-1#5
```
What holds: `docs/iadd.md:16` says a merge lapses the inspection where it changes a path other than the closing records, as every other commit does. The check compares the two trees and then walks the base's commits that a merge brought, outside the work item's directory (`chain_check.py:1104-1115`). The daemon compares the trees at the gate (`chain.ts#gateHolds`) and walks the commits after the last round (`chain.ts:535`). Read.

```iadd
confirms: round-1#6
```
What holds: `docs/iadd.md:17` says the orchestrator rules on the first two `undecided` verdicts and that from the third the work item parks. `runInspection` asks for a ruling while fewer than `UNDECIDED_CEILING`, 2, `undecided` verdicts stand before this one, and parks past it (`daemon.ts:4077-4089`, `chain.ts:55-56`). Read.

```iadd
confirms: round-1#7
```
What holds: what round 1's finding 7 listed now stands in the document. The routing rows are at `docs/iadd.md:65` and the orchestrator as an agent at `:12`. The close block's `location:`, its optional `answer:`, `severity:` taking any word, and `confirms: none` are at `:80` (`record-blocks.ts:368`, `:381-382`, `:386`). `Policy root` is at `:56` (`pr-check/lib/config.py:329-348`). The directory's name, which the fix added, is finding 2, and the rest of the forms is finding 5. Read.

```iadd
confirms: round-1#8
```
What holds: `docs/iadd.md:30` says code holds each invariant in the daemon's chain. It says the person's settings bound the judging roles in a pane (#286), and that the check alone holds there that a pull request opens only at a cleared inspection (#369). `docs/iadd.md:134` says the same of invariant 3. Both issues are open with those titles. Round 1's quality note on invariant 7 is answered by the same row. Read, and executed by `gh issue view`.

What matched: the rows of *How Owlery runs IADD* against the code, at the target. The parties at `:12` are the four agents of `apps/desktop/role-bundle/agents/`, and the orchestrator is the `judgment` stage of `workflows/owl-chain.json:7`. The question row at `:14` matches the ruling block (`record-blocks.ts` `RULING_BLOCK`, whose `park` parks one work item) and the pane's `ask` refusal (`chain-command.ts:631`, `NO_DEFAULT` at `:118`). Read.

What matched: the field lists of the round, finding, close, confirmation, verdict and run blocks at `docs/iadd.md:80-82` against `record-blocks.ts:354-430` and `pr-check/lib/fields.py:148-280`, apart from what finding 5 names. The closing records at `:75` are `chain.ts:70` and `chain_check.py:197`. The marker at `:55` is `pr-check/lib/optin.py:62` and `src/shared/protocol.ts:74`. The keys Owlery writes at `:56` are `records-place.ts:56`. It reads `Broad gate` (`records-place.ts:214`) and `Heavy commands` (`:245`). The check reads `Policy root` and, through `agentory/parity.json`, `Baseline commit`, which finding 5 holds. `Mode`, `Reference specs` and `Pact` are defined in `lib/config.py` and called by no arm. The trailers at `:96-97` are `daemon.ts:3332`, `:3478`, `stage-records.ts:95` and `stage-records.ts:240`. Read, and executed by `grep`.

What matched: the principles table against the specification at `main`. Each principle's name is the specification's, shortened for principles 3 and 8, and each Korean name is the Korean specification's. Executed and read.

What matched: every relative link with a fragment in the tracked Markdown files, and every link to the specification at `main`, resolves by GitHub's slug rule, Korean anchors among them. No tracked file outside `agentory/` links a heading that `85f0a5f8` removed: *The specification Owlery follows*, *Where Owlery holds each principle*, *What Owlery adds to the record forms*, *Where Owlery departs*, and their Korean twins. The only text naming one in words is `README.ko.md:71`, which finding 1 holds. Executed, row 1 of *Probes*.

What matched: `docs/iadd.md` and `docs/iadd.ko.md` hold 17 headings, 44 table rows and 4 `check:` lines each. Every heading, row, list item and `check:` line stands on the same line number in both. Each `check:` line names test files that stand. Read side by side, each sentence of the twin says what its English line says. The same counts hold for `README.md` (7, 17) and `docs/architecture.md` (25, 126) with their twins. Executed, row 4 of *Probes*, and read.

A quality note, which opens no finding: `docs/iadd.md:12` says the orchestrator agent rules on questions and `undecided` verdicts, and leaves out its judgment of whether the rounds converge (`record-blocks.ts` `CONVERGENCE_BLOCK`, the `judgment` stage). The row is not false, only short.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the documents leg of `Broad gate` at the target, labelled `unverified`. Contract rule 2 leaves the broad run to the orchestrator, and the routing gives the suite to CI on the pull request | `agentory/config.json` `Broad gate` | the orchestrator |
| Whether GitHub renders each anchor as the probe's slug function computes it. The probe is a reimplementation, not GitHub's renderer | `docs/`, `README.md`, `README.ko.md` | the orchestrator or the owner, on the rendered pages of the pull request |
| The naturalness of the rewritten Korean prose. The round read each sentence against its twin for meaning, not for style | `docs/iadd.ko.md` | the owner |
| The owner's decisions themselves: that the specification holds principles alone, and that this work item runs a second round where `routing.md` *Why this way* says one round, and no inspector. The round judges neither | `routing.md` *Why this way* | the owner |
| The range of this record's `target:` line. The caller named `2dec6b72..85f0a5f8`; the round used `467702ea..85f0a5f8` so that it holds round 1's fix commit, as the opening paragraph says | this record | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `python3 -I test_tmp_anchors.py <clone> <spec clone at 6617881>` | checked 277 links, 0 broken; no tracked file outside `agentory/` holds a fragment of a removed heading; an inline run of its slug function on the specification at `main` found `7-names`, `5-the-invariants-of-every-workflow`, `7-이름` and `5-모든-workflow의-불변식`, and did not find `8-the-record-forms`, the anchor of `v0.1.0` |
| `python3 -I test_tmp_workflow_pin.py <clone>` | package version 0.2.1; `workflowText('0.2.1') == committed file: True`; `workflowText('0.2.0') == committed file: False` |
| `git grep -n -o -E '.{0,30}통과.{0,20}' 85f0a5f8 -- docs/design.ko.md docs/product.ko.md docs/roadmap.ko.md` | hits at `docs/design.ko.md:541`, `:544`, `docs/product.ko.md:63`, `:70`, `:89`, `:192`, `docs/roadmap.ko.md:21`, `:101`, `:122`, `:124`, `:149`, `:155`, each a check, a gate or a test passing, or the depth judgment; none is an inspection's state |
| `diff` of the line numbers of the headings, rows, list items and `check:` lines of `docs/iadd.md` and `docs/iadd.ko.md`, and `grep -c '^#'` and `grep -c '^\|'` on the pairs of `README.md` and `docs/architecture.md` | the structure lines stand on the same numbers; the `check:` lines are identical; 7/7 and 17/17 for `README`, 25/25 and 126/126 for `architecture` |
| `python3 skills/code-review/scripts/chain_check.py --baseline origin/release/v0.2.1 --root <worktree> --worktree`, the plugin's 0.41.0 and then Owlery's `pr-check/` copy, with this record in the working tree | exit 0 for each, the pull request not judged as ready; each refuses the seven findings of this record as open, having no close block, and names the absent `trail/gate.md` and `inspection.md`; no other refusal and no notice at a `frame/design.md` |
