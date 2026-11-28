# IADD: Independent AI-Driven Development

*[English](./iadd.md) · 한국어*

이 문서는 Owlery가 돌리는 방법론 IADD를 Owlery가 정의한 것입니다. Owlery는 이 방법론을 돌리는 도구 가운데 하나이고, Owl Chain은 Owlery가 이 방법론을 위해 싣는 워크플로입니다. 개념, 원칙, 이름은 소유자가 2026-11-28에 정했습니다(이슈 #322, *Concept and names*). Owlery가 출발한 AgenticSeal 플러그인도 같은 이름으로 같은 방법론의 정의를 따로 씁니다(MichaelYcJo/AgenticSeal#1651). 소유자는 두 정의가 다 서면 둘을 나란히 놓고 견준 뒤 하나로 합치기로 정했습니다. 두 도구는 어휘 하나와 기록 폴더 하나를 함께 쓰고, 한쪽의 이름을 다른 쪽의 이름으로 옮기는 대응표는 두지 않습니다.

## 개념

**IADD — Independent AI-Driven Development.** *Zero Self-Approval: 어떤 AI도 자기 작업을 승인하지 않습니다.*

작업을 설계하고, 만들고, 검토하고, 검수하는 AI들은 서로 독립되어 있고, 어느 쪽도 다른 쪽의 판단에 기대지 않습니다. 사람은 첫 편집 전에 한 번 답하고, 검수를 보고 머지합니다. 검수는 커밋 하나에 묶이고, 다음 커밋이 들어오면 실효되며, PR 검사로 누구에게나 보입니다.

*Independent*는 독립 감사(independent audit)에서 쓰는 뜻입니다. 작업을 한 쪽과 떨어진 다른 쪽이라는 말이고, AI가 스스로 알아서 움직인다는 말이 아닙니다. IADD는 언제나 대문자로 씁니다.

## 원칙

1. **사람은 나중에 한 번이 아니라 먼저 한 번 판단합니다.** 질문은 모두 첫 편집 전에 한 묶음으로 묻습니다.
2. **만든 쪽은 통과시키지 않습니다.** 각 쪽은 다른 쪽의 기록을 주장으로 읽고 자기 결과에 스스로 닿습니다.
3. **검수는 커밋 하나의 것이고, 다음 커밋에서 실효됩니다.** 그 상태는 누구나 PR에서 봅니다.
4. **정확히 답이 나오는 것은 스크립트가 답하고, 판단은 뜻이 문제인 곳에 씁니다.** 주장마다 실행한 것(executed), 읽은 것(read), 확인하지 못한 것(unverified)을 붙입니다.
5. **기록은 한때의 것이고, 코드와 규칙이 남습니다.** 규칙은 판단마다 든 비용과 잡아낸 것을 보고 바뀝니다.

## IADD가 ADD와 다른 점

2026-11-28에 읽은 Agent Driven Development의 정의들(agentdriven.dev, Remo Jansen의 Agent Driven Development, pilotspace의 ADD)에는 공통된 워크플로가 없습니다. 이 정의들은 결과의 마지막 판단을 사람에게 남기거나, 작업을 만든 에이전트가 자기 판정을 직접 쓰게 둡니다. IADD는 그 판단을 작업을 만들지 않은 AI에게 맡기고, 누구나 PR에서 읽을 수 있는 커밋 하나에 묶습니다.

## 이름

### 이름이 따르는 규칙

**PR 페이지에서, Claude Code 안에서, 체인의 문서에서 읽는 사람이 만나는 이름은 한 가지로만 읽힙니다.** 그 자리에서 이미 다른 뜻을 가진 쉬운 낱말은 쓰지 않습니다. 따져 보고 내려놓은 이름은 아래에 적어, 아무도 다시 제안하지 않게 합니다.

**IADD는 더 위의 개념이고, 제품은 그것을 드러낼 뿐입니다.** 소유자가 2026-11-28에 이 규칙을 정했습니다(이슈 #344). Owlery는 IADD를 돌리는 제품 가운데 하나이고, AgenticSeal 플러그인도 그렇습니다. 그래서 IADD의 이름은 어느 제품과 짝을 맞추어 고르지 않고, 어느 제품도 방법론의 이름을 받지 않습니다. 플러그인은 이름 `agentic`을 그대로 씁니다. 기록 폴더는 방법론이 아니라 자리이므로, 자리의 이름인 `agentory/`로 부릅니다. *directory*와 *repository*처럼 만든 말이고, 에이전트의 설정과 워크플로와 스레드를 두는 곳이라는 뜻입니다. 방법론의 약어는 처음 보는 사람이 폴더 이름으로 읽기 어렵습니다.

### 이름

| 무엇 | 이름 |
|---|---|
| 방법론 | IADD. 대문자로 쓰고, *Zero Self-Approval*을 한 줄 문구로 붙입니다 |
| 기본 워크플로 | 문장에서는 Owl Chain, 워크플로와 검수자 모듈의 이름으로는 `owl-chain` |
| 역할 | framer, crafter, proofer, orchestrator, tracer는 그대로이고, 마지막 역할은 검수하는 검수자(`inspector`)입니다. Owlery의 역할 묶음에는 tracer가 없습니다 |
| 검수자의 기록 | 검수, `inspection.md` |
| 검수의 상태 | 검수 통과, 검수 실효, 그리고 검수가 서 있지 않은 검수 없음 |
| 기록 폴더 | `agentory/`. `README.md`의 첫 줄 `# What IADD keeps in agentory/`로 알아봅니다 |
| 릴리스의 기록을 정책 문서에 접어 넣는 단계 | settle. `agentory/threads/`에 작용합니다 |
| 작업 하나의 디렉터리 | thread, `agentory/threads/<작업>/` |
| Owlery가 쓰는 트레일러 | `IADD-Routing:`과 `IADD-Built-By:` |
| PR 검사 | `inspection` |
| 앱 | IADD를 돌리는 도구 가운데 하나인 Owlery |

앱의 이름은 Owlery로 둡니다. 소유자가 2026-11-28에 개념과 함께 정했습니다. IADD는 방법론이고 Owlery는 그것을 돌리는 도구 가운데 하나이며, "owl"만으로는 W3C의 OWL, Odoo의 OWL, Owl Carousel과 겹칩니다([docs/name.ko.md](name.ko.md)).

### 내려놓은 이름

아래 이름은 모두 따져 보았고 위 규칙을 지키지 못했으므로, 다시 제안하지 않습니다.

- **역할이나 역할을 가리키는 말로:** *planner*(Claude Code의 Plan 에이전트와 plan 모드), *builder*(체인의 문서가 이미 만드는 쪽을 두루 가리키는 말), *reviewer*(GitHub의 요청된 리뷰어와 `code-review` 스킬), *verifier*(`verify` 스킬), 그리고 마지막 역할의 이름으로 따진 *auditor*, *referee*, *arbiter*, *guarantor*.
- **마지막 역할의 기록이나 그 상태로:** *approval*과 *approved*(GitHub의 리뷰 승인과 Claude Approvals), *passed*와 *not passed*(같은 페이지의 "All checks have passed"), *judgment*(에이전트가 뜻이 문제인 곳에 쓰는 것을 가리키는 말), 그리고 *verdict*, *clearance*, *guarantee*.
- **방법론의 이름으로:** spec-driven(진실은 명세가 아니라 코드와 정책입니다), Evidence-Driven, Trust Engineering, ACE(ICLR 2026의 Agentic Context Engineering, 그리고 어느 에이전트 코딩 도구의 `.ace/`), AIDD(O'Reilly의 AI-Driven Development, 그리고 신약 개발), ACODE(Acode 편집기), AAD(Azure Active Directory), AADD, Merge on Seal, Delegated Judgment, AI-Judged, ABIC, ACOD, ACRD, AI Turnkey.
- **settle의 이름으로:** resolve-threads. PR 페이지에서 GitHub의 리뷰 스레드(`resolveReviewThread`)로 읽힙니다.
- **기록 폴더의 이름으로:** 방법론의 이름 그대로. 방법론은 자리가 아니고, 그 약어는 처음 보는 사람이 폴더 이름으로 읽기 어렵습니다. 그리고 다른 것과 겹치는 `agentics`(githubnext/agentics), `agency`(agency-agents와 Agency Swarm), `agents`, `agentworks`, `agentarium`, `ai-trail`, `inspections`, `iagentics`.

IADD는 2026-11-28에 웹, GitHub, npm, PyPI, arXiv에서 찾아보았고, 이 이름을 쓰는 방법론이나 AI 도구는 없었습니다. 소문자 `iadd`는 Python의 제자리 덧셈이고, git과 hledger의 작은 플러그인 둘의 이름입니다.

## 기록

### 기록 폴더

**저장소의 작업 기록은 `agentory/` 아래에 커밋되어 있고, `agentory/README.md`의 첫 줄이 이 폴더를 알려 줍니다.** 저장소를 연결하면 이 폴더와 그 안의 `README.md`, `config.json`을 씁니다([기록은 저장소에 커밋합니다](architecture.ko.md#기록은-저장소에-커밋합니다)). 폴더의 이름은 하나이고, 그 첫 줄 없이 자기 `agentory/`를 두는 저장소는 설정에서 거절됩니다.

- `config.json`에는 저장소가 스스로에 대해 말하는 것이 있습니다. `Broad gate` 명령, 그리고 커밋과 기록의 언어입니다.
- `threads/<작업>/`에는 작업 하나의 기록이 있습니다. `routing.md`, `frame/`, 리뷰 회차와 전체 검사(broad gate)의 실행을 담은 `trail/`, `decisions.md`, `inspection.md`, `changelog.md`, `gaps.md`, `pr.md`입니다.
- `workflows/<이름>.json`과 `inspectors/<이름>.json`에는 저장소가 직접 둔 워크플로와 검수자 모듈이 들어갈 자리입니다. 아직 Owlery의 어떤 코드도 이것들을 읽지 않습니다([아직 어떤 코드도 읽지 않는 것](#아직-어떤-코드도-읽지-않는-것)).

AgenticSeal 플러그인이 `seal/` 아래에 쓴 형식의 기록은 마이그레이션만 기록으로 읽습니다. 마이그레이션은 그 기록을 사람이 먼저 읽는 커밋 하나로 `agentory/`로 옮깁니다([기록은 저장소에 커밋합니다](architecture.ko.md#기록은-저장소에-커밋합니다)).

### 검수와 그 검사

**검수는 작업의 `inspection.md`에 있는 가장 새 판정 블록이고, 커밋 하나를 가리킵니다.** 블록은 백틱 세 개와 `iadd`로 엽니다. 블록에는 검수한 커밋과 그 base, 판정(`cleared`, 까닭을 붙인 `withheld`, 질문을 붙인 `undecided`), 작업을 만든 세션 하나하나, 검수한 세션, 검수한 모델, Owlery의 버전, 워크플로와 검수자 모듈이 들어 있습니다.

**검사 `inspection`은 검수의 상태를 PR의 head 커밋에 보입니다.** 이 검사는 앱 없이 GitHub에서 돌고, 앱과 같은 커밋된 기록을 읽습니다.

| 상태 | 언제 |
|---|---|
| 검수 통과 | head 커밋에 통과한 검수가 있고, 검수한 커밋 뒤에 마감 기록 말고는 바뀐 것이 없을 때 |
| 검수 실효 | 통과한 검수가 있는데, 그 뒤의 커밋이 마감 기록 말고 다른 것을 바꿨을 때. 베이스를 머지한 커밋도 그렇습니다 |
| 검수 없음 | head 커밋에 통과한 검수가 없을 때 |

검사가 올리는 제목 하나하나는 `README.ko.md` *GitHub의 검수 검사*에 있습니다.
check: apps/desktop/test/inspection-state.test.ts apps/desktop/test/pr-check.test.ts

## 워크플로

**워크플로는 블록을 맞추듯 짜 맞춥니다.** 사람은 뼈대를 고르고, 각 단계가 담는 것(각 역할의 프롬프트, 스킬, 모델, 제공자)을 고치고, 워크플로가 끝에 다는 검수자 모듈을 등록합니다. Owl Chain은 Owlery의 기본 IADD 워크플로이자 시스템 설정입니다. 사람이 다른 워크플로를 고르거나 만들기 전까지 저장소가 돌리는 워크플로입니다. 사람이 만든 워크플로는 Owl Chain 옆에 놓이고, Owlery가 가진 Owl Chain을 대신하지 않습니다.

### 데이터로서의 워크플로

- **워크플로**는 뼈대 하나, 단계마다의 내용, 검수자 모듈 하나를 가리키는 JSON 파일 하나입니다.
- **뼈대**는 워크플로의 모양입니다. 어떤 종류의 단계가 돌고, 어떤 순서로 돌고, 각 단계가 다음 단계에 무엇을 넘기고, 언제 다음으로 넘어가는지입니다. 뼈대는 코드입니다. 뼈대의 이름은 커밋된 기록을 읽어 다음에 할 단계를 돌려주는 함수 하나를 고릅니다. 사람은 뼈대를 고르고, 직접 쓰지 않습니다. Owl Chain의 뼈대는 `rounds-then-inspection`입니다.
- **단계**는 단계 종류 하나의 내용입니다. 역할의 이름, 에이전트의 정의, core와 agent contract 다음으로 띄울 때 싣는 문서, 어댑터의 이름인 제공자, 그리고 모델입니다. 모델의 `null`은 CLI의 기본 모델입니다. 단계 종류마다의 도구 허용 범위는 코드에 남고, 어떤 워크플로 파일도 그것을 적거나 넓히지 않습니다.
- **검수자 모듈**은 검수 전에 Owlery가 돌리는 검사들, 검수자 자신의 단계, 검수자가 답할 때 쓰는 기록의 템플릿을 가리키는 JSON 파일 하나입니다. 검사는 Owlery의 코드가 그 커밋에서 돌리고 종료 코드로 읽는 명령이고, 통과한 실행은 `trail/gate.md`의 블록 하나가 됩니다.

Owl Chain의 두 파일 `workflows/owl-chain.json`과 `inspectors/owl-chain.json`은 역할 묶음에 들어 있고, `apps/desktop/role-bundle/README.md` *The Owl Chain's two files*가 둘을 설명합니다. Owlery의 데몬과 체인 명령은 두 가지로 띄울 때 모두 각 단계를 이 두 파일에서 읽고, 뼈대나 형식을 지키지 않는 파일은 그 파일과 키를 밝혀 거절합니다.
check: apps/desktop/test/workflow.test.ts apps/desktop/test/claude-adapter.test.ts apps/desktop/test/chain-command.test.ts

**단계는 다음 가운데 모델을 처음 밝히는 것의 모델로 돕니다.** 작업의 `routing.md`에 적힌 작업의 선택, 사람이 그 단계에 정한 기본 모델, 워크플로 파일이나 모듈 파일에서 그 단계의 `model`, 그리고 CLI의 기본 모델 순서입니다. 뒤의 둘은 Owlery가 만들었고, 앞의 둘은 이슈 #129가 그 위에 만듭니다. 판정 블록의 `model:` 줄은 검수한 모델을 밝힙니다.

### 워크플로를 두는 곳과 나누는 법

Owl Chain의 두 파일은 앱에 실려 나가고, 앱의 버전이 곧 두 파일의 버전입니다. 저장소가 직접 둔 파일은 `agentory/workflows/<이름>.json`과 `agentory/inspectors/<이름>.json`에 커밋되어 설 자리입니다. 그래서 팀은 저장소로 그 파일을 나누고, 검수한 커밋은 읽은 그대로의 파일을 담습니다. 사람이 단계에 정한 기본 모델은 데몬의 상태이고, 작업 하나의 선택은 그 작업의 `routing.md`에 한 줄로 적습니다. `owl-chain`이라는 이름은 두 폴더 모두에서 앱만 씁니다.

나눠 쓰는 워크플로나 검수자 모듈은 저장소에 있는 그 파일들입니다. 사람은 그 파일의 사본을 자기 `agentory/` 아래에 커밋해서 받아들이고, 사본에는 어디서 왔는지를 적습니다. Owlery는 어떤 모듈이 좋은지 막아 서는 문을 두지 않습니다. 판단은 사람이 하고, 모듈의 값어치는 누가 받아들이는지로 드러납니다.

**검수가 무엇을 뜻하는지는 그 블록에서 읽습니다.** 블록은 워크플로와 검수자 모듈을 밝힙니다. 읽는 사람은 검수한 커밋에서 그 모듈의 파일을 열거나, `owl-chain`이면 `rules:` 줄이 밝히는 Owlery 버전의 역할 묶음을 엽니다. 검사의 제목은, 제목이 가리키는 판정 블록마다 `workflow: owl-chain`이 있으면 Owl Chain을 밝힙니다.

### 모든 워크플로에 성립하는 것

워크플로 파일이 무엇을 말하든 Owlery의 코드가 아래를 지킵니다.

1. **Zero Self-Approval.** 검수하는 세션은 작업을 하나도 만들지 않았습니다. 검수하는 세션이 작업을 만든 세션 가운데 하나이면 Owlery는 판정을 쓰지 않고, 검사도 그런 블록을 거절합니다.
2. **커밋 하나.** 검수는 커밋 하나를 가리킵니다. 그 커밋과 브랜치의 head 사이에 마감 기록 말고 다른 것이 다르지 않을 때만 head에서 검수 통과이고, 그렇지 않으면 실효됩니다. 이 답은 head에 커밋된 기록에서만 읽습니다.
3. **기록은 Owlery가 씁니다.** 기록은 하나하나 Owlery의 코드가 쓰고 커밋하며, 리뷰하거나 검수하는 단계는 파일을 쓰는 도구를 하나도 갖지 않습니다.
4. **순서는 코드가 지킵니다.** 다음에 할 단계는 커밋된 기록에서 뼈대의 함수를 거쳐 나옵니다. 어떤 문서도, 어떤 에이전트도 단계를 시작하거나, 순서를 정하거나, 건너뛰지 않습니다.
5. **단계는 자기 종류의 허용 범위를 갖습니다.** 데몬의 체인에서는 단계의 세션이 그 허용 범위가 정한 샌드박스 안에서 돕니다. 칸에서는 역할이 자기 도구를 정의에 적은 서브에이전트이고, 사람의 권한 설정이 그 호출에 답합니다. 이 부분은 이슈 #286이 맡습니다.
6. **검수는 무엇이 자신을 냈는지 밝힙니다.** 판정 블록은 워크플로, 검수자 모듈, 작업을 만든 세션 하나하나, 검수한 세션, 그 모델, Owlery의 버전을 밝히고, 검사마다 통과한 실행이 검수한 커밋의 `trail/gate.md`에 있습니다.
7. **통과한 검수 없이는 PR이 없고, 판정은 검사입니다.** Owlery는 검수를 통과한 head에서만 PR을 엽니다. 검사 `inspection`을 올리고, 리뷰를 쓰지 않고, 아무것도 머지하지 않습니다.
check: apps/desktop/test/chain.test.ts apps/desktop/test/pr-check.test.ts apps/desktop/test/inspection-state.test.ts apps/desktop/test/claude-adapter.test.ts

### Owl Chain에만 있는 것

리뷰 회차와 수정 패스, 회차가 수렴하는지에 대한 판단, 회차의 상한, 역할 정의 넷, 검수의 표 둘은 Owl Chain의 것입니다. **전체 검사는 Owl Chain 검수자 모듈의 검사입니다.** 그 모듈은 저장소의 `Broad gate` 명령을 검수 전의 유일한 검사로 밝힙니다. 다른 워크플로는 이것들을 하나도 갖지 않을 수 있고, 그 검수는 어떤 검사가 돌았는지를 밝힙니다. 그래서 Owl Chain의 검수가 보증하는 것, 곧 검수한 커밋에서 전체 검사가 통과했다는 것은 Owl Chain에 대해 하는 말입니다([docs/product.ko.md](product.ko.md#검수가-보장하는-것과-보장하지-않는-것)).

### 아직 어떤 코드도 읽지 않는 것

Owlery의 데몬과 체인 명령은 앱에 든 두 파일을 싣고, 다른 파일은 싣지 않습니다. `agentory/workflows/`, `agentory/inspectors/`, `routing.md`의 워크플로 줄, `config.json`의 워크플로 키는 읽지 않고, 불러오는 코드는 워크플로 하나와 모듈 하나, `owl-chain`만 밝힙니다. 사람이 만든 워크플로와 검수자 모듈, 다른 뼈대, 창에서 워크플로를 고치는 편집기, 나눠 쓰는 워크플로를 펴내고 받아들이는 일은 이슈 #324가 자리를 정합니다.
