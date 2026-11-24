<p align="center"><img src="apps/desktop/assets/icon/app-icon.svg" width="200" alt="Owlery의 엠블럼: 검은 둥근 사각형 위의 따뜻한 흰색 올빼미"></p>

# Owlery

*[English](./README.md) · 한국어*

**한 번 답하고 돌아오면, 만들지 않은 쪽이 인장을 찍은 PR이 와 있습니다.**

Owlery(아울러리)는 AgenticSeal의 작업 흐름을 바탕으로, 에이전트가 만든 작업에 깨지는 인장을 찍는 데스크톱 앱입니다. 만든 쪽이 아닌 독립된 쪽이 작업을 판정하고, 인장을 커밋 하나에 묶습니다. 그 뒤에 커밋이 하나라도 들어오면 인장이 깨지고, PR을 보는 누구나 그것을 봅니다. 사람은 이슈 하나에 대한 질문에 한 번 답하고 자리를 비웁니다. 그 뒤로 설계, 구현, 리뷰 회차, 판정이 사람 없이 이어지고, 인장이 찍힌 PR이 돌아옵니다.

owlery는 올빼미가 사는 곳을 뜻합니다. 올빼미는 에이전트입니다. Owlery의 엠블럼은 밀랍 없는 올빼미이고, 밀랍 봉인 위의 올빼미는 AgenticSeal이 보증을 나타내는 표시로 남습니다. 자세한 것은 [docs/name.ko.md](docs/name.ko.md)에 있습니다.

## 실행

릴리스 0.0.1은 여기까지 돕니다. 창은 작업함에서 열립니다. 작업마다 자기 브랜치와 자기 worktree가 생기고, 터미널 칸이 그 worktree에서 열리며, 헤드리스 Claude 세션에 질문 하나를 보낼 수 있습니다. 인장은 아직 없습니다. 리뷰 회차와 인장은 [로드맵](docs/roadmap.ko.md#마일스톤)의 마일스톤 2에서 들어옵니다.

macOS, Node.js, pnpm 10.33.0이 필요합니다. 아래 명령은 Node.js 26.13.1로 돌려 보았습니다. 저장소 맨 위에서 실행합니다.

```
pnpm install
pnpm --filter @owlery/desktop start
```

처음 실행할 때 Electron의 바이너리를 내려받고, 그 뒤에 창이 열립니다.

## GitHub의 인장 검사

저장소를 연결하면 Owlery는 그 저장소에 워크플로 `.github/workflows/owlery-seal.yml`을 커밋합니다. 이 워크플로는 PR마다 Owlery의 PR 검사를 돌리고, 검사는 작업이 커밋한 기록을 읽습니다. 검사는 판정을 PR의 head 커밋에 `seal`이라는 이름의 GitHub 검사로 올립니다. 워크플로 자신의 잡 `records`는 `seal`이 실패하면 실패하고, 통과하거나 중립이면 통과합니다. 앱이 없는 사람도 거기서 판정을 읽고, PR 본문 맨 위의 인장 구역에서도 읽습니다. 인장 구역은 작업의 `guarantee.md`에 있는 가장 새 판정 블록을 그대로 옮긴 것입니다. 인장 뒤에 커밋을 올리면 새 인장을 받을 때까지 검사가 실패합니다. 검사는 앱과 같은 커밋된 기록을 읽고, 앱이 준 인장 뒤에 들어온 것은 둘이 똑같이 판정합니다. 앱의 체인이 커밋하지 않은 기록, 곧 손으로 쓰거나 다른 도구가 쓴 기록은 둘이 다르게 판정할 수 있습니다. 인장과 깨진 인장의 제목은, 제목이 가리키는 판정 블록마다 owl 체인(Owlery의 에이전트 체인)이 쓰는 `rules:` 줄이 있으면 owl 체인을 밝히고, AgenticSeal 플러그인의 sealer가 쓴 블록처럼 그 줄이 없는 블록이 하나라도 있으면 어떤 체인도 밝히지 않습니다.

| `seal`의 결과 | 제목 | 언제 |
|---|---|---|
| 통과 | "Sealed by the owl chain at"과 인장이 찍힌 커밋. owl 체인이 찍지 않은 인장에는 "Sealed at"과 인장이 찍힌 커밋 | head 커밋에 인장이 있는 ready 상태의 PR, 그리고 ready가 되면 통과할 draft |
| 실패 | "Seal of the owl chain broken: a commit landed after"와 인장이 찍힌 커밋. owl 체인이 찍지 않은 인장에는 "Seal broken: a commit landed after"와 인장이 찍힌 커밋 | 인장 뒤에 들어온 커밋이 인장을 깬 ready 상태의 PR. 베이스를 머지한 커밋도 인장을 깹니다 |
| 실패 | "No seal at the head commit" | head 커밋에 인장이 없는 ready 상태의 PR |
| 실패 | "The records are refused" | 기록이 검사의 다른 부분에서 거절된 ready 상태의 PR |
| 중립 | "Draft: judged when it is ready" | ready가 되면 거절될 draft |
| 통과 | "Not judged: no work item is declared" | 작업을 하나도 밝히지 않은 PR |
| 실패 | "The seal check could not run" | 검사가 체크아웃이나 판정 기준인 base 브랜치를 읽지 못했을 때 |

**검사를 필수로 정하는 것은 저장소의 관리자입니다.** 관리자는 GitHub에서 base 브랜치에 걸린 저장소 규칙 가운데 상태 검사 통과를 요구하는 규칙에 `seal`을 넣습니다. Owlery는 저장소의 설정을 하나도 바꾸지 않고, 앱의 "Records and check" 대화 상자도 같은 것을 말합니다. 포크에서 온 PR은 `seal` 검사를 받지 않습니다. GitHub가 그 워크플로 실행에 검사를 쓸 수 없는 토큰을 주기 때문입니다. 그래서 필수 검사는 관리자가 통과시킬 때까지 그 PR을 붙잡아 둡니다. Owlery의 워크플로 대신 AgenticSeal의 `hygiene.yml`을 두는 저장소에는 `seal` 검사가 올라오지 않습니다.

**판정은 검사이고, 승인 리뷰가 아닙니다.** Owlery는 리뷰를 쓰지 않고 아무것도 머지하지 않습니다. 머지는 사람이 합니다.

## 문서

| 문서 | 담은 것 |
|---|---|
| [docs/product.ko.md](docs/product.ko.md) | 약속, 누구를 위한 것인가, 인장을 보여 주는 세 자리, 성능 가설과 벤치마크 계획, 일부러 하지 않는 것, 첫 세션 |
| [docs/architecture.ko.md](docs/architecture.ko.md) | 앱, 데몬, 에이전트 어댑터, AgenticSeal 프로세스의 관계, AgenticSeal에서 가져오는 것, 순서와 판단의 분담, 첫 마일스톤의 모양을 정하는 규칙과 v0.1 다음에 오는 것, 메모리 설계, 화면 프레임워크, 만들기 전에 잴 것 |
| [docs/roadmap.ko.md](docs/roadmap.ko.md) | 버전마다 무엇을 어떤 순서로 만들고 언제 끝났다고 보는가. v0.1의 마일스톤 다섯, 그 순서의 근거, 완료 기준, 남겨 둔 결정 |
| [docs/name.ko.md](docs/name.ko.md) | 이름의 뜻과 출처, 발음, 알고 가야 할 것, 엠블럼 |
| [docs/design.ko.md](docs/design.ko.md) | 창이 어떻게 보이고 어떻게 말하는가. 원칙, 세 테마와 테마마다 그릴 때 쓰는 모든 값, 부분의 형태와 그 상태, 문구의 말투, 피하는 것, 창을 바꾸는 PR이 싣는 스크린샷 |

## AgenticSeal과의 관계

AgenticSeal은 Owlery가 참고하는 원본이고, Owlery는 그것을 넓힌 제품입니다. Owlery는 AgenticSeal 플러그인에 기대어 돌지 않습니다. 원칙, 불변식, 역할, 기록 형식을 가져와 Owlery의 것으로 고쳐 갖고, 순서는 앱의 코드가 실행하며, 역할의 에이전트 정의와 스킬은 앱에 함께 넣어 기본값으로 씁니다. AgenticSeal 플러그인 사용자는 지금처럼 Claude Code에서 그대로 씁니다. 무엇을 어디로 가져왔는지와 기록 형식의 호환은 [docs/architecture.ko.md](docs/architecture.ko.md)에 있습니다.

## 라이선스

Apache License 2.0입니다. 고른 까닭과 다른 프로젝트의 코드를 가져오는 규칙은 [docs/architecture.ko.md](docs/architecture.ko.md#라이선스와-다른-프로젝트의-코드)에 있습니다. Owlery와 AgenticSeal이라는 이름과 올빼미 엠블럼은 이 라이선스의 대상이 아니며, 무엇이 적용되는지는 [TRADEMARKS.md](TRADEMARKS.md)가 밝힙니다.
