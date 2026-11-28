# Owlery의 IADD

*[English](./iadd.md) · 한국어*

**Owlery는 IADD, 곧 Independent AI-Driven Development를 돌리고, 그 정의는 [IADD 명세](https://github.com/MichaelYcJo/iadd-workflows/blob/v0.1.0/spec/iadd.ko.md)입니다.** 명세는 방법을 밝힙니다. 개념, 원칙, 모든 워크플로가 지키는 불변식, 이름, 기록 형식입니다. 이 문서는 그것을 다시 쓰지 않습니다. Owlery가 그것을 어떻게 지키는지, 기록 형식에 무엇을 더하는지, 어디서 벗어나는지, 그리고 데이터로서의 Owl Chain을 밝힙니다. 소유자는 2026-11-28에 IADD의 두 정의, 곧 Owlery의 정의와 AgenticSeal 플러그인의 정의를 이 명세로 합쳤습니다(이슈 #353). Owlery가 출발한 플러그인 `agentic`은 같은 체인을 기준 구현으로 돌리고, Owlery는 그 체인을 데몬에서 돌립니다([Owlery가 출발한 곳](architecture.ko.md#owlery가-출발한-곳)).

## Owlery가 따르는 명세

**Owlery는 IADD 명세 0.1.0을 따릅니다.** 명세가 제품마다 정하게 둔 것에 Owlery는 아래처럼 답합니다.

| 명세가 제품에 맡긴 것 | Owlery의 답 |
|---|---|
| harness | 데스크톱 앱의 데몬. 단계마다 자기 샌드박스 안의 역할 세션으로 띄웁니다. 그리고 Claude Code 세션이 Owl Chain을 싣는 칸 |
| 참여자 | orchestrator, crafter, proofer, 검수자(inspector). 역할 묶음에 framer와 tracer가 없으므로, 원칙 2의 framer에 대한 절반은 생기지 않습니다 |
| 실행이 끝나는 곳 | PR. Owlery는 자기가 라우팅하는 모든 작업의 `Destination`에 `open the pull request`를 씁니다. 라우팅이 `stop before the pull request`를 밝히면 체인은 합격한 브랜치에서 서고 PR을 열지 않지만, 아직 어느 화면도 그것을 제공하지 않습니다 |
| 질문 묶음을 언제 묻는지 | 아직 만들지 않았습니다. 최초의 묶음은 마일스톤 3의 몫입니다([docs/roadmap.ko.md](roadmap.ko.md#마일스톤)). 나중에 생긴 질문은 코드와 정책으로 정해 `decisions.md`에 기록하거나, 그 작업 하나를 세워 둡니다([순서는 코드가, 판단은 orchestrator가](architecture.ko.md#순서는-코드가-판단은-orchestrator가)) |
| 누가 기록을 쓰고 순서를 지키는지 | Owlery의 코드가 커밋된 기록에서 합니다([모든 워크플로에 성립하는 것](#모든-워크플로에-성립하는-것)) |
| 검수한 커밋 뒤의 base 머지 | 마감 기록 말고 다른 경로를 바꾸면, 다른 모든 커밋처럼 검수가 효력을 잃습니다 |
| `undecided` 판정에 누가 먼저 답하는지 | orchestrator 에이전트이고, 그 판단은 `decisions.md`에 커밋됩니다. 처음 두 번은 orchestrator가 판단하고, 세 번째부터는 작업이 사람을 기다리며 섭니다 |
| 모드와 설정 키 | `shared`뿐입니다. 루트는 커밋됩니다. Owlery는 `Commit and pull request language`, `Record language`, `Broad gate`를 쓰고, `Mode`는 쓰지 않으며, `Broad gate`와 `Heavy commands`를 읽습니다. PR 검사는 `Policy root`도 읽습니다 |

## Owlery가 각 원칙을 지키는 곳

명세의 원칙 열한 가지와, 그 하나하나를 지키는 Owlery의 문서와 코드입니다. 불변식 일곱 가지는 [모든 워크플로에 성립하는 것](#모든-워크플로에-성립하는-것)에 있습니다.

| 원칙 | Owlery가 지키는 곳 |
|---|---|
| 1. AI는 최초에 한 번 묻는다 | [플러그인이 아니라서 달라지는 것](architecture.ko.md#플러그인이-아니라서-달라지는-것)의 *사람에게 묻기* 행, 그리고 `decisions.md`([기록은 저장소에 커밋합니다](architecture.ko.md#기록은-저장소에-커밋합니다)). 칸에서는 벗어납니다([Owlery가 벗어나는 곳](#owlery가-벗어나는-곳) 1번과 2번) |
| 2. 만든 쪽은 합격시키지 않는다 | 아래 불변식 1 |
| 3. 독립된 AI들이 thread의 기록으로 소통한다 | 역할 세션은 사람의 설정, 훅, 서버 없이 시작하고([역할 세션은 사용자 환경에서 떼어 띄웁니다](architecture.ko.md#역할-세션은-사용자-환경에서-떼어-띄웁니다)), 데몬은 단계마다의 프롬프트를 커밋된 기록에서 씁니다 |
| 4. 검수는 커밋 하나의 것이다 | 아래 불변식 2 |
| 5. 정확한 것은 스크립트가 답한다 | Owlery의 코드가 전체 검사를 돌리고 그 종료 코드를 읽습니다. `executed`, `read`, `unverified` 표시는 역할 묶음의 proofer와 agent contract에 있고, 어떤 코드도 그것을 읽지 않습니다([Owlery가 벗어나는 곳](#owlery가-벗어나는-곳) 6번) |
| 6. 판단은 원천 문서에 기댄다 | `decisions.md`의 결정, 판단, 질문은 모두 `grounds:`를 가지고, 역할 묶음의 core가 그 규칙을 밝힙니다 |
| 7. 규칙은 판단을 위한 지침이다 | 역할 묶음의 core. 묶음의 어떤 문서도 순서를 다시 쓰지 않고, 순서는 코드가 지킵니다([순서는 코드가, 판단은 orchestrator가](architecture.ko.md#순서는-코드가-판단은-orchestrator가)) |
| 8. 어느 쪽도 건너뛰지 못하는 연결이 있다 | 아래 불변식 1부터 7. 데몬의 체인에서는 하나하나를 코드가 지킵니다. 칸에서는 그 가운데 몇은 검사만 지킵니다([Owlery가 벗어나는 곳](#owlery가-벗어나는-곳) 8번) |
| 9. 메커니즘은 비용에 비춰 남긴다 | 역할 묶음의 core, 그리고 작업의 비용을 그 회차들이 찾은 것 옆에 보여 주는 검수 시트([상태는 세 곳에 둡니다](architecture.ko.md#상태는-세-곳에-둡니다)) |
| 10. 문서는 누가 여는지에 따라 자른다 | Owl Chain의 두 파일은 단계마다 띄울 때 싣는 문서를 밝힙니다([세션마다 싣는 것](architecture.ko.md#세션마다-싣는-것)) |
| 11. 기록은 임시이다 | settle. Owlery 자신의 명령은 settle이 남길 것을 보여 줄 뿐 아직 아무것도 지우지 않고, 나머지는 이슈 #139가 만듭니다([Owlery가 벗어나는 곳](#owlery가-벗어나는-곳) 9번) |
check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/decision-record.test.ts apps/desktop/test/role-bundle.test.ts apps/desktop/test/settle.test.ts apps/desktop/test/gate.test.ts

## 이름

방법의 이름은 명세의 것이고([이름](https://github.com/MichaelYcJo/iadd-workflows/blob/v0.1.0/spec/iadd.ko.md#7-이름)), 내려놓은 이름도 그렇습니다. Owlery는 아래를 더합니다.

| 무엇 | 이름 |
|---|---|
| Owlery의 기본 워크플로 | 문장에서는 Owl Chain, 워크플로와 검수자 모듈의 이름으로는 `owl-chain` |
| PR 검사 | `inspection` |
| 앱 | IADD를 돌리는 제품 가운데 하나인 Owlery |

앱의 이름은 Owlery로 둡니다. 소유자가 2026-11-28에 개념과 함께 정했습니다. IADD는 방법론이고 Owlery는 그것을 돌리는 제품 가운데 하나이며, "owl"만으로는 W3C의 OWL, Odoo의 OWL, Owl Carousel과 겹칩니다([docs/name.ko.md](name.ko.md)).

## 기록

**저장소의 작업 기록은 `agentory/` 아래에 명세의 형식으로 커밋되어 있습니다([기록 형식](https://github.com/MichaelYcJo/iadd-workflows/blob/v0.1.0/spec/iadd.ko.md#8-기록-형식)).** 저장소를 연결하면 이 폴더와 그 안의 `README.md`, `config.json`을 씁니다([기록은 저장소에 커밋합니다](architecture.ko.md#기록은-저장소에-커밋합니다)). 표식 줄 없이 자기 `agentory/`를 두는 저장소는 설정에서 거절됩니다. `agentory/workflows/<이름>.json`과 `agentory/inspectors/<이름>.json`에는 저장소가 직접 둔 워크플로와 검수자 모듈이 들어갈 자리이고, 아직 Owlery의 어떤 코드도 이것들을 읽지 않습니다([아직 어떤 코드도 읽지 않는 것](#아직-어떤-코드도-읽지-않는-것)).

AgenticSeal 플러그인이 0.40.0 전의 릴리스에서 `seal/` 아래에 쓴 형식의 기록은 마이그레이션만 기록으로 읽습니다. 마이그레이션은 그 기록을 사람이 먼저 읽는 커밋 하나로 `agentory/`로 옮깁니다([기록은 저장소에 커밋합니다](architecture.ko.md#기록은-저장소에-커밋합니다)).

### Owlery가 기록 형식에 더한 것

- 작업 디렉터리의 **`decisions.md`**에는 묻지 않고 내린 결정, 판단, 작업을 세워 두는 질문이 하나하나 `decision:`이나 `question:`으로 여는 `iadd` 블록으로 들어 있고, 블록마다 `grounds:`와 상태가 있습니다([기록은 저장소에 커밋합니다](architecture.ko.md#기록은-저장소에-커밋합니다)).
- **`trail/refusals.md`**에는 역할 세션의 허용 범위가 거절한 도구 호출마다 한 행이 있고, `trail/gate.md`, `inspection.md`와 함께 마감 기록입니다.
- **판정 블록**은 여섯 줄을 더합니다. `built-by:`(작업을 만든 세션 하나하나), `inspected-by:`(검수한 세션), `model:`(그 모델), `rules:`(`owlery <version>`), 그리고 `workflow:`와 `inspector:`(Owl Chain이면 둘 다 `owl-chain`)입니다.
- **trailer `IADD-Built-By:`**는 수정 패스를 기록하는 커밋에 그 패스를 만든 세션을 밝힙니다.
- `agentory/config.json`의 **키 `Heavy commands`**는 기기에서 차례를 기다리는 명령을 밝힙니다.
- **`routing.md`**에는 `Review`, `Destination`, `Planning`, `Implementation`, `Automation`, `Branch` 행이 있고, 작업 디렉터리의 이름은 `<seconds>-<issue>-<slug>`입니다.
- **orchestrator는 작업을 돌리는 세션이면서 역할 묶음의 에이전트이기도 합니다.** 데몬의 체인에서는 질문과 `undecided` 판정을 판단합니다.
- **라운드 기록을 읽는 쪽은 §8.4보다 많이 받습니다.** 닫는 블록의 `location:` 줄, `answer:` 없는 닫는 블록, `severity:`의 아무 낱말, `confirms: none`입니다.

### 검수와 그 검사

**검사 `inspection`은 PR의 head 커밋에 검수의 상태를 명세의 세 상태로 보입니다.** 이 검사는 앱 없이 GitHub에서 돌고, 앱과 같은 커밋된 기록을 읽습니다. 검사가 올리는 제목 하나하나는 `README.ko.md` *GitHub의 검수 검사*에 있습니다.
check: apps/desktop/test/inspection-state.test.ts apps/desktop/test/pr-check.test.ts

## Owlery가 벗어나는 곳

Owlery의 코드가 명세 0.1.0과 다른 곳 하나하나입니다.

1. **원칙 1, 칸에서.** 칸의 세션은 실행 중에 칸에서 사람에게 묻습니다. `Automation`이 `yes`이면 질문의 기본값으로 가지만, `No default can be taken: `으로 시작하는 질문은 그래도 사람에게 갑니다. 최초의 묶음은 아직 만들지 않았습니다.
2. **§8.5, 칸에서.** 칸의 세션은 `undecided` 판정을 실행 중에 스스로 정하거나, 칸에서 사람에게 묻습니다.
3. **§8.7.** head가 담지 않은 합격 커밋이나 저장소가 찾지 못하는 합격 커밋을, 명세는 합격 아님으로 읽고 Owlery는 효력을 잃음으로 읽습니다.
4. **불변식 2와 §8.7.** 작업 자신의 디렉터리 안에서는 Owlery가 트리를 비교합니다. 그래서 마감 기록이 아닌 기록을 바꾼 커밋을 뒤의 커밋이 되돌리면, 검수는 합격으로 남습니다.
5. **§8.7.** 체인이 head에서 단계를 하나 빚지고 있을 때도 Owlery는 효력을 잃음으로 읽습니다. 합격 커밋에 이미 있던 열린 질문이나, 읽을 수 없는 기록이 그런 경우입니다.
6. **§8.4와 원칙 5.** 발견의 `evidence:`는 없어도 되고, 그 표시는 어떤 코드도 읽지 않습니다. `regression:`은 발견 번호 없는 `round-<N>`도 받습니다.
7. **§8.8.** `IADD-Routing:`은 단계를 기록하는 커밋에 있고, 세션의 커밋 하나하나에 있지는 않습니다.
8. **불변식 3과 7, 칸에서.** 판단하는 역할은 사람의 권한 설정 아래에서 샌드박스 없이 `Bash`를 갖는 서브에이전트입니다(이슈 #286). 칸의 세션은 PR을 스스로 열고, 검수가 합격했는지는 검사만 지킵니다.
9. **원칙 11과 §8.9.** Owlery의 settle은 settle이 남길 것을 보여 줄 뿐 아무것도 지우지 않습니다(이슈 #139). 이 저장소는 플러그인으로 settle합니다.

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

워크플로 파일이 무엇을 말하든, Owlery의 코드가 명세의 불변식 일곱 가지([모든 workflow의 불변식](https://github.com/MichaelYcJo/iadd-workflows/blob/v0.1.0/spec/iadd.ko.md#5-모든-workflow의-불변식))를 아래처럼 지킵니다.

1. **만든 쪽은 합격시키지 않는다.** 검수하는 세션은 작업을 하나도 만들지 않았습니다. 검수하는 세션이 작업을 만든 세션 가운데 하나이면 Owlery는 판정을 쓰지 않고, 검사도 그런 블록을 거절합니다.
2. **커밋 하나.** 검수는 커밋 하나를 가리킵니다. 그 커밋과 브랜치의 head 사이에 마감 기록 말고 다른 것이 다르지 않을 때만 head에서 합격이고, 그렇지 않으면 효력을 잃습니다. 이 답은 head에 커밋된 기록에서만 읽습니다. 이것이 명세와 다르게 읽히는 곳은 [Owlery가 벗어나는 곳](#owlery가-벗어나는-곳) 3번부터 5번에 있습니다.
3. **판단하는 쪽은 판단 대상을 고치지 않는다.** 기록은 하나하나 Owlery의 코드가 쓰고 커밋하며, 리뷰하거나 검수하는 단계는 파일을 쓰는 도구를 하나도 갖지 않습니다. 데몬의 체인에서는 단계의 세션이 그 허용 범위가 정한 샌드박스 안에서 돕니다. 칸에서는 역할이 자기 도구를 정의에 적은 서브에이전트이고, 사람의 권한 설정이 그 호출에 답합니다. 이 부분은 이슈 #286이 맡습니다.
4. **아무도 건너뛰지 못하는 연결은 코드가 지킨다.** 다음에 할 단계는 커밋된 기록에서 뼈대의 함수를 거쳐 나옵니다. 어떤 문서도, 어떤 에이전트도 단계를 시작하거나, 순서를 정하거나, 건너뛰지 않습니다.
5. **선언한 검사는 검수한 커밋에서 통과한다.** Owl Chain의 검수자 모듈은 저장소의 `Broad gate` 명령을 유일한 검사로 밝힙니다. Owlery의 코드가 그것을 돌리고, 통과한 실행은 하나하나 검수한 커밋의 `trail/gate.md`에 있습니다.
6. **검수는 무엇이 자신을 냈는지 밝힌다.** 판정 블록은 워크플로, 검수자 모듈, 작업을 만든 세션 하나하나, 검수한 세션, 그 모델, Owlery의 버전을 밝힙니다.
7. **합격한 검수 없이는 PR이 없고, 판정은 검사다.** Owlery는 합격한 head에서만 PR을 엽니다. 검사 `inspection`을 올리고, 리뷰를 쓰지 않고, 아무것도 머지하지 않습니다.
check: apps/desktop/test/chain.test.ts apps/desktop/test/pr-check.test.ts apps/desktop/test/inspection-state.test.ts apps/desktop/test/claude-adapter.test.ts apps/desktop/test/gate.test.ts

### Owl Chain에만 있는 것

리뷰 회차와 수정 패스, 회차가 수렴하는지에 대한 판단, 회차의 상한, 역할 정의 넷, 검수의 표 둘은 Owl Chain의 것입니다. **전체 검사는 Owl Chain 검수자 모듈의 검사입니다.** 그 모듈은 저장소의 `Broad gate` 명령을 검수 전의 유일한 검사로 밝힙니다. 다른 워크플로는 이것들을 하나도 갖지 않을 수 있고, 그 검수는 어떤 검사가 돌았는지를 밝힙니다. 그래서 Owl Chain의 검수가 보증하는 것, 곧 검수한 커밋에서 전체 검사가 통과했다는 것은 Owl Chain에 대해 하는 말입니다([docs/product.ko.md](product.ko.md#검수가-보장하는-것과-보장하지-않는-것)).

### 아직 어떤 코드도 읽지 않는 것

Owlery의 데몬과 체인 명령은 앱에 든 두 파일을 싣고, 다른 파일은 싣지 않습니다. `agentory/workflows/`, `agentory/inspectors/`, `routing.md`의 워크플로 줄, `config.json`의 워크플로 키는 읽지 않고, 불러오는 코드는 워크플로 하나와 모듈 하나, `owl-chain`만 밝힙니다. 사람이 만든 워크플로와 검수자 모듈, 다른 뼈대, 창에서 워크플로를 고치는 편집기, 나눠 쓰는 워크플로를 펴내고 받아들이는 일은 이슈 #324가 자리를 정한 마일스톤 `workflows: a person's own, and shared`에 있습니다.
