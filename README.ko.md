<p align="center"><img src="apps/desktop/assets/icon/app-icon.svg" width="200" alt="Owlery의 엠블럼: 검은 둥근 사각형 위의 따뜻한 흰색 올빼미"></p>

# Owlery

*[English](./README.md) · 한국어*

**한 번 답하고 돌아오면, 만들지 않은 AI가 검수를 통과시킨 PR이 와 있습니다.**

Owlery(아울러리)는 사용자의 저장소에서 IADD를 돌리는 데스크톱 앱입니다. 사람은 이슈 하나에 대한 질문에 한 번 답하고 자리를 비웁니다. 그 뒤로 설계, 구현, 리뷰 회차, 검수가 사람 없이 이어지고, 누구나 GitHub에서 읽을 수 있는 검수가 달린 PR이 돌아옵니다.

**IADD, 곧 Independent AI-Driven Development가 방법론입니다.** 한 줄 문구는 *Zero Self-Approval*, 어떤 AI도 자기 작업을 승인하지 않는다는 것입니다. 작업을 설계하고, 만들고, 검토하고, 검수하는 AI들은 서로 독립되어 있고, 검수자는 자기가 검수하는 것을 하나도 만들지 않았습니다. 검수는 커밋 하나에 묶이고 다음 커밋에서 실효되므로, 검수 뒤에 들어온 커밋은 PR에 검수 실효로 보입니다. [docs/iadd.ko.md](docs/iadd.ko.md)가 Owlery의 방법론 정의입니다. 원칙, 이름, 기록, 그리고 워크플로가 무엇인지가 거기 있습니다.

**Owlery는 IADD를 돌리는 도구 가운데 하나이고, Owl Chain은 그 기본 워크플로입니다.** Owl Chain은 Owlery가 싣고 관리하는 워크플로입니다. proofer의 리뷰 회차, crafter의 수정 패스, 저장소의 전체 검사(broad gate), 검수자의 판정으로 이어집니다. 지금은 Owl Chain에 있는 저장소의 Claude Code 칸이 그것을 싣고, [로드맵](docs/roadmap.ko.md#마일스톤)의 마일스톤 3에서 사람이 넘긴 이슈에 대해 Owlery의 데몬이 그것을 돌립니다.

owlery는 올빼미가 사는 곳을 뜻합니다. 올빼미는 에이전트입니다. Owlery의 엠블럼은 밀랍 없는 올빼미이고, 붉은 밀랍 위의 올빼미는 검수 표식으로, 창은 통과한 검수의 자리에 그것을 그립니다. 자세한 것은 [docs/name.ko.md](docs/name.ko.md)에 있습니다.

## 설치

Owlery는 Apple 실리콘, 곧 M1 칩 이후의 칩을 쓰고 macOS 13 Ventura 이후를 쓰는 Mac에서 돌아갑니다. Intel Mac이나 그보다 이전의 macOS에서는 열리지 않습니다.

1. 최신 릴리스에서 `Owlery-arm64.dmg`를 내려받습니다: <https://github.com/MichaelYcJo/owlery/releases/latest/download/Owlery-arm64.dmg>. 릴리스마다의 다운로드는 [릴리스 페이지](https://github.com/MichaelYcJo/owlery/releases)에 있습니다.
2. `.dmg`를 열고 Owlery를 응용 프로그램 폴더로 끌어 놓습니다.
3. 응용 프로그램 폴더에서 Owlery를 엽니다.

빌드가 Apple의 Developer ID 인증서로 서명되기 전까지는 macOS가 처음 열기를 막습니다. 알림은 Apple이 이 앱에 악성 소프트웨어가 있는지 확인할 수 없다고 말하고, 앱을 여는 단추는 보여 주지 않습니다. 알림의 문구는 macOS 버전마다 다릅니다. 앱은 이렇게 엽니다.

4. 시스템 설정을 열고, 개인정보 보호 및 보안을 누른 뒤, 아래로 내립니다.
5. Owlery에 관한 줄 옆의 "그래도 열기"(영어 화면에서는 "Open Anyway")를 누르고, "열기"로 확인합니다.

Owlery는 작업함에서 열립니다. Owlery는 로그인 셸을 거쳐 사용자의 `claude`, `git`, `gh`를 실행합니다. 그래서 셋 다 설치되어 있고, 로그인 셸이 정하는 `PATH`에 있어야 합니다.

**Owlery는 아직 스스로 업데이트하지 않습니다.** 새 버전을 설치하려면 먼저 Owlery 메뉴에서 "Quit Owlery Completely…"를 고릅니다. 그러면 Owlery의 백그라운드 프로세스와 그 프로세스가 붙들고 있는 세션이 끝납니다. 그다음 새 `.dmg`를 내려받아 응용 프로그램 폴더의 앱을 바꿉니다.

## 실행

릴리스 0.0.1은 여기까지 돕니다. 창은 작업함에서 열립니다. 작업마다 자기 브랜치와 자기 worktree가 생기고, 터미널 칸이 그 worktree에서 열리며, 헤드리스 Claude 세션에 질문 하나를 보낼 수 있습니다. 리뷰 회차와 검수는 [로드맵](docs/roadmap.ko.md#마일스톤)의 마일스톤 2에서 들어왔습니다.

macOS, Node.js, pnpm 10.33.0이 필요합니다. 아래 명령은 Node.js 26.13.1로 돌려 보았습니다. 저장소 맨 위에서 실행합니다.

```
pnpm install
pnpm --filter @owlery/desktop start
```

처음 실행할 때 Electron의 바이너리를 내려받고, 그 뒤에 창이 열립니다.

## GitHub의 검수 검사

저장소를 연결하면 Owlery는 그 저장소에 워크플로 `.github/workflows/owlery-inspection.yml`을 커밋합니다. 이 워크플로는 PR마다 Owlery의 PR 검사를 돌리고, 검사는 작업이 `agentory/` 아래에 커밋한 기록을 읽습니다. 검사는 판정을 PR의 head 커밋에 `inspection`이라는 이름의 GitHub 검사로 올립니다. 워크플로 자신의 잡 `records`는 `inspection`이 실패하면 실패하고, 통과하거나 중립이면 통과합니다. 앱이 없는 사람도 거기서 판정을 읽고, PR 본문 맨 위의 검수 구역에서도 읽습니다. 검수 구역은 작업의 `inspection.md`에 있는 가장 새 판정 블록을 그대로 옮긴 것입니다. 검수 뒤에 커밋을 올리면 검수가 실효되고, 새 검수가 통과할 때까지 검사가 실패합니다. 검사는 앱과 같은 커밋된 기록을 읽고, 앱이 통과시킨 검수 뒤에 들어온 것은 둘이 똑같이 판정합니다. 앱의 체인이 커밋하지 않은 기록, 곧 손으로 쓰거나 다른 도구가 쓴 기록은 둘이 다르게 판정할 수 있습니다. 통과한 검수와 실효된 검수의 제목은, 제목이 가리키는 판정 블록마다 `workflow: owl-chain` 줄이 있으면 Owl Chain을 밝히고, 그렇지 않으면 어떤 워크플로도 밝히지 않습니다. 이 줄은 검수를 낸 워크플로를 밝히려고 Owlery가 쓰는 줄입니다.

| `inspection`의 결과 | 제목 | 언제 |
|---|---|---|
| 통과 | "Cleared by the Owl Chain at"과 검수한 커밋. 워크플로를 밝히지 않은 검수에는 "Cleared at"과 검수한 커밋 | head 커밋에 통과한 검수가 있는 ready 상태의 PR, 그리고 ready가 되면 통과할 draft |
| 실패 | "Inspection of the Owl Chain lapsed: a commit landed after"와 검수한 커밋. 워크플로를 밝히지 않은 검수에는 "Inspection lapsed: a commit landed after"와 검수한 커밋 | 검수 뒤에 들어온 커밋이 검수를 실효시킨 ready 상태의 PR. 베이스를 머지한 커밋도 검수를 실효시킵니다 |
| 실패 | "Not cleared: no inspection at the head commit" | head 커밋에 통과한 검수가 없는 ready 상태의 PR |
| 실패 | "The records are refused" | 기록이 검사의 다른 부분에서 거절된 ready 상태의 PR |
| 중립 | "Draft: judged when it is ready" | ready가 되면 거절될 draft |
| 통과 | "Not judged: no work item is declared" | 작업을 하나도 밝히지 않은 PR |
| 실패 | "The inspection check could not run" | 검사가 체크아웃이나 판정 기준인 base 브랜치를 읽지 못했을 때 |

**검사를 필수로 정하는 것은 저장소의 관리자입니다.** 관리자는 GitHub에서 base 브랜치에 걸린 저장소 규칙 가운데 상태 검사 통과를 요구하는 규칙에 `inspection`을 넣습니다. Owlery는 저장소의 설정을 하나도 바꾸지 않고, 앱의 "Records and check" 대화 상자도 같은 것을 말합니다. 포크에서 온 PR은 `inspection` 검사를 받지 않습니다. GitHub가 그 워크플로 실행에 검사를 쓸 수 없는 토큰을 주기 때문입니다. 그래서 필수 검사는 관리자가 통과시킬 때까지 그 PR을 붙잡아 둡니다.

**예전 Owlery로 연결한 저장소는 커밋 하나로 IADD의 형식으로 옮깁니다.** Owlery는 예전 형식의 기록을 하나도 읽지 않고 거기서 체인을 돌리지 않으며, 저장소의 줄은 기록이 예전 형식이라고 말합니다. "Records and check" 대화 상자는 기록을 IADD의 형식으로 `agentory/`에 옮기고 예전 워크플로를 `owlery-inspection.yml`로 바꾸는 커밋을 보여 주고, 사람이 확인할 때까지 아무것도 쓰지 않습니다. 옮기기 전에 통과한 검수는 옮기는 커밋에서 실효됩니다. 예전 워크플로가 올리던 검사를 요구하던 규칙은 그 자리에 `inspection`을 요구해야 합니다. 옮긴 뒤에는 어떤 워크플로도 그 검사를 올리지 않기 때문입니다. 옮기기 전에 기록을 가졌던 작업의 브랜치는 체인 명령의 `migrate`로 자기 기록을 옮깁니다. 예전 형식이 무엇인지는 [docs/architecture.ko.md](docs/architecture.ko.md#기록은-저장소에-커밋합니다)가 밝힙니다.

**판정은 검사이고, 승인 리뷰가 아닙니다.** Owlery는 리뷰를 쓰지 않고 아무것도 머지하지 않습니다. 머지는 사람이 합니다.

## 문서

| 문서 | 담은 것 |
|---|---|
| [docs/iadd.ko.md](docs/iadd.ko.md) | Owlery가 돌리는 방법론 IADD. 개념, 원칙, 이름과 내려놓은 이름, 기록과 검사, 워크플로가 무엇인지, 모든 워크플로에 성립하는 것 |
| [docs/product.ko.md](docs/product.ko.md) | 약속, 누구를 위한 것인가, 검수를 보여 주는 세 자리, 성능 가설과 벤치마크 계획, 일부러 하지 않는 것, 첫 세션 |
| [docs/architecture.ko.md](docs/architecture.ko.md) | 앱, 데몬, 에이전트 어댑터, Owl Chain의 관계, Owlery가 출발한 곳, 순서와 판단의 분담, 첫 마일스톤의 모양을 정하는 규칙과 첫 버전 다음에 오는 것, 메모리 설계, 화면 프레임워크, 만들기 전에 잴 것 |
| [docs/roadmap.ko.md](docs/roadmap.ko.md) | Owlery가 무엇을 어떤 순서로 만들고 언제 끝났다고 보는가. 첫 버전의 마일스톤 다섯, 그 순서의 근거, 완료 기준, 남겨 둔 결정 |
| [docs/name.ko.md](docs/name.ko.md) | 이름의 뜻과 출처, 발음, 알고 가야 할 것, 엠블럼 |
| [docs/design.ko.md](docs/design.ko.md) | 창이 어떻게 보이고 어떻게 말하는가. 원칙, 세 테마와 테마마다 그릴 때 쓰는 모든 값, 부분의 형태와 그 상태, 문구의 말투, 피하는 것, 창을 바꾸는 PR이 싣는 스크린샷 |

## Owlery가 출발한 곳

Owlery는 같은 방법론을 돌리는 Claude Code 플러그인 AgenticSeal에서 출발했습니다. 소유자는 2026-11-28에 IADD는 방법론이고 제품은 그것을 드러낼 뿐이라고 정했습니다. 그래서 그 플러그인은 이름 `agentic`을 그대로 쓰고, 두 도구 모두 기록을 `agentory/`에 두기로 했습니다(MichaelYcJo/AgenticSeal#1651, MichaelYcJo/AgenticSeal#1658). Owlery는 그 플러그인에 기대어 돌지 않습니다. 역할 묶음과 PR 검사는 그 플러그인의 파일에서 출발한 Owlery의 것이고, 순서는 Owlery의 코드가 실행합니다. 무엇을 가져왔는지와 가져온 파일의 라이선스는 [docs/architecture.ko.md](docs/architecture.ko.md#owlery가-출발한-곳)에 있습니다.

## 라이선스

Apache License 2.0입니다. 고른 까닭과 다른 프로젝트의 코드를 가져오는 규칙은 [docs/architecture.ko.md](docs/architecture.ko.md#라이선스와-다른-프로젝트의-코드)에 있습니다. Owlery와 AgenticSeal이라는 이름과 올빼미 엠블럼은 이 라이선스의 대상이 아니며, 무엇이 적용되는지는 [TRADEMARKS.md](TRADEMARKS.md)가 밝힙니다.
