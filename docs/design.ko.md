# 디자인: 창이 가진 자기 모습

*[English](./design.md) · 한국어*

이 문서는 Owlery의 창이 어떻게 보이고 어떻게 말하는지를 적습니다. 원칙, 세 테마, 테마가 그릴 때 쓰는 모든 값, 부분마다의 형태, 문구의 말투, 그리고 피하는 것입니다. 창을 바꾸는 변경은 이 문서에 대어 읽습니다. 창과 이 문서가 다르면 둘 가운데 하나가 틀린 것이고, 그 차이를 찾은 변경이 어느 쪽이 틀렸는지 말합니다. 테마가 무엇을 바꿀 수 있는지는 [product.ko.md](product.ko.md)가 정하고, 테마 하나하나는 이 문서가 정합니다.

## 원칙

창을 바꾸는 변경은 아래를 모두 지킵니다. 지키지 않으려면 같은 PR에서 이 문서를 고치고 이유를 적습니다.

1. **밀랍으로 된 것은 검수 표식 하나입니다.** 붉은색은 검수 표식에만 씁니다. 단추와 표시와 실패는 다른 색을 씁니다. 그래서 화면의 붉은색은 언제나 작업을 하나도 만들지 않은 검수자가 이 커밋을 통과시켰다는 뜻입니다. 올빼미는 검수 표식이 있는 자리에 그리고, Night watch에서는 기다리는 표시의 눈으로 그리며, 창의 다른 곳에는 그리지 않습니다.
2. **창은 알리고, 대화하지 않습니다.** 창은 작업마다 에이전트가 무엇을 했고 무엇이 필요한지를 보입니다. 말풍선, 프롬프트 입력 상자, 모델이 만들었다는 표시는 그리지 않습니다. 작업함의 모든 줄이 에이전트가 한 일이므로 그런 표시는 아무것도 말하지 않습니다.
3. **신호는 하나이고, 사람이 필요한 곳에만 씁니다.** 테마마다 작업에 사람이 필요하다고 말하는 방법이 하나 있습니다. Night watch에서는 눈의 노란색이고, Register와 Desk에서는 진한 잉크로 채운 표시입니다. 포인터가 올라간 곳, 선택한 것, 검색에 맞은 글자, 키보드 초점은 테마의 잉크로 그리고, 어느 것도 Night watch의 노란색을 쓰지 않습니다.
4. **상태는 세 번 말합니다. 형태로, 색으로, 문구로.** 어느 상태도 색만으로 다른 상태와 구분하지 않습니다. Night watch에서 기다림과 실패는 같은 노란색을 씁니다. 밝은 모양에서는 선택된 줄의 글자가 기준을 지키도록 실패 쪽이 한 단계 어둡고, 둘은 형태와 문구로 갈립니다.
5. **테마는 토큰입니다.** 테마는 색, 글꼴, 질감, 검수 표식에 드는 빛, 그리고 가장자리와 괘선과 표시의 형태를 바꿉니다. 배치, 문구, 표식의 그림, 밀랍의 붉은색, 하나뿐인 움직임의 길이는 어느 테마의 것도 아닙니다. 페이지의 선택자와 렌더러의 모듈은 테마나 모양의 이름을 부르지 않습니다.
6. **창은 겉모습에 메모리를 쓰지 않습니다.** 글꼴은 시스템의 것입니다. 어느 테마도 글꼴, 삽화, 판 뒤에 까는 그림을 불러오지 않고, 판 뒤의 것을 흐리게 하지 않습니다.
7. **모서리는 작고, 원은 둥근 것에만 씁니다.** 테마는 모서리 넷으로 된 단계 하나를 정하고, 어느 것도 8px을 넘지 않습니다. 완전한 원은 검수 표식, 상태 표시, 종의 점을 그리고, 단추, 입력 칸, 칩, 사람의 사진에는 쓰지 않습니다.
8. **모든 형태는 여기에 적습니다.** 줄, 단추, 메뉴, 대화 상자는 테마마다 형태가 하나이고, 「부분과 그 상태」에 있습니다. 이 문서에 없는 형태가 필요한 변경은 먼저 여기에 그 형태를 더합니다. 작업마다 제 형태를 따로 그리지 않게 하려는 것입니다. 형태를 그리는 PR이 이 문서의 두 언어판에 그 행을 직접 쓰고, 릴리스의 settle에 남겨 두지 않습니다. settle이 쓰는 행은 형태가 나간 뒤에야 오고, 그때는 고치려던 행을 다른 작업이 이미 고쳐 썼을 수 있습니다.
9. **글자와 표시는 바탕에서 도드라집니다.** 글자는 그 아래 바탕에 대해 4.5 대 1 이상입니다. 24px 이상이거나 굵은 18.66px 이상인 글자는 3 대 1 이상입니다. WCAG 2.2의 AA 수준입니다. 상태 표시와 키보드 초점의 고리는 둘레의 바탕에 대해 3 대 1 이상입니다. 바탕은 그 자리에 실제로 그려진 것입니다. 창의 바탕뿐 아니라 선택한 줄의 바탕과 포인터 아래의 바탕도 해당합니다. 이 기준에 못 미치는 값은 모든 테마에서 바꿉니다. 예전부터 그랬다는 이유로 값을 그대로 두는 테마는 없습니다. 부분을 누르는 동안에만 그려지는 바탕에는 이 기준을 적용하지 않습니다. 그 바탕은 누르는 동안에만 있고, 그 부분의 글자는 누르기 전에 이미 읽었기 때문입니다. 쓸 수 없어 세기의 45%로 그리는 단추에도 이 기준을 적용하지 않습니다.

check: apps/desktop/test/themes.test.ts

## 모든 테마가 함께 가진 것

- **배치와 그 치수.** 단, 글자 크기, 간격의 단계, 부분의 높이와 너비, 그리고 하나뿐인 움직임의 길이 120ms입니다. 페이지 자신의 `:root`에 있고, 「배치의 치수」가 모두 적습니다. 테마는 치수를 갖지 않습니다.
- **문구.** 모든 테마에 한 벌이고, 말투는 「창의 문구가 가진 말투」가 정합니다.
- **검수 표식.** 표식의 그림과 밀랍의 붉은색은 AgenticSeal의 것이고, `TRADEMARKS.md`가 그 권리를 밝힙니다. 검수 전에는 그 자리가 테마 자신의 색조로 바탕에 빈 채로 눌려 있고, 작업함의 줄은 검수의 자리로 끝납니다.
- **시스템의 글꼴.** 문구는 산세리프로, 브랜치, 커밋의 해시, 경로, 줄 수, 터미널은 고정폭 글꼴로 씁니다.
- **붉은색은 검수 표식에만 쓰고, 실패는 붉지 않습니다.**
- **말풍선 표시가 없습니다.** 어느 테마도 기다림을 말풍선으로 그리지 않습니다.
- **어두운 모양과 밝은 모양.**
- **터미널은 어둡게 둡니다.** 터미널은 그 안의 프로그램이 청하는 색을 그리고, 두 모양 모두에서 바탕이 어둡습니다.

## 테마

창의 테마는 셋입니다. Night watch, Register, Desk입니다. 처음 실행하면 어두운 모양의 Night watch로 엽니다.

- **테마와 모양은 따로 고릅니다.** 사이드바의 아래쪽에 고르는 자리가 둘 있습니다. 하나는 Night watch, Register, Desk를 내놓습니다. 다른 하나는 Dark, Light, Match the system을 내놓고, Match the system에서는 창이 열려 있는 동안 모양이 시스템의 모양을 따릅니다.
- **페이지는 둘을 다 지닙니다.** 페이지의 `html`에 있는 `data-theme`은 `night-watch`, `register`, `desk` 가운데 하나이고, `data-appearance`는 `dark`나 `light`입니다. `apps/desktop/src/renderer/themes.css`는 쌍마다 블록 하나를 갖고, 두 테마의 모든 차이는 그 블록의 사용자 정의 속성입니다.
- **고른 것은 남습니다.** 앱의 사용자 데이터 폴더에 있는 `appearance.json`이 `{"theme": …, "appearance": …}`를 갖습니다. `theme`이 `night-desk`, `letter`, `system`인 예전 형식의 파일은 Night watch의 어두운 모양, 밝은 모양, 시스템의 모양으로 읽습니다.

| | Night watch | Register | Desk |
|---|---|---|---|
| 생각 | 창을 엠블럼, 곧 검은 바탕의 흰 올빼미에서 그립니다. 올빼미의 노란 눈이 작업에 사람이 필요하다고 말하는 하나뿐인 색입니다. | 창은 검수를 통과한 작업을 올리는 대장입니다. 그래서 괘선을 친 기록부로 그리고, 그 위에서 잉크가 아닌 것은 검수 표식 하나입니다. | 밤의 따뜻한 책상과 편지지 한 장입니다. 테마가 생기기 전의 창 그대로이고, 잉크만 「원칙」의 기준에 맞게 진해졌습니다. |
| 신호 | 눈의 노란색을 사람이 필요한 곳에 씁니다. 기다리는 표시와 그 문구, 에이전트가 묻는 말의 가장자리, 실패입니다. | 기다림은 진한 잉크, 실패는 황토색입니다. | 기다림은 진한 잉크, 실패는 황토색입니다. |
| 글꼴 | 산세리프만 쓰고, 브랜치와 커밋은 고정폭 글꼴입니다. 세리프는 없고, 에이전트가 한 말도 산세리프로 씁니다. | 문구는 산세리프, 사람이 목록을 따라 내려가며 견주는 사실은 모두 고정폭 글꼴입니다. 브랜치, 커밋, 지난 시간, 개수입니다. 세리프는 Desk가 쓰는 자리에 씁니다. | 산세리프, 브랜치와 커밋의 고정폭 글꼴, 그리고 에이전트가 한 말과 요약 화면의 문장에 쓰는 세리프입니다. 밝은 모양에서는 제목도 세리프입니다. |
| 모서리 | 카드, 조작 단추, 줄, 칩이 8, 6, 6, 4px이고 두 모양이 같습니다. | 2, 2, 0, 0입니다. | 어두운 모양은 8, 6, 6, 4px, 밝은 모양은 4, 5, 5, 3px입니다. |
| 가장자리와 괘선 | 줄은 가장자리가 없는 타일입니다. 에이전트가 한 말은 도드라진 카드이고, 작업에 사람이 필요하면 왼쪽에 신호 색의 가장자리가 생깁니다. | 작업함의 줄마다, 그리고 기록 목록의 행마다 아래에 괘선이 있습니다. 기록 목록은 작업의 커밋, 바뀐 파일, 사실, 그리고 작업 트리 준비(Setup)가 복사했거나 복사하지 못한 경로입니다. 사이드바의 항목은 길잡이라서 괘선이 없습니다. 묶음의 머리는 사이드바의 바탕에 괘선을 친 띠입니다. 단추는 채우지 않고 가장자리로 그립니다. 에이전트가 한 말은 두 괘선 사이에 놓입니다. 앞에 있는 탭은 위쪽에 괘선이 있습니다. | 줄은 가장자리가 없는 타일입니다. 에이전트가 한 말은 도드라진 카드입니다. |
| 선택한 것 | 옅게 물든 타일입니다. | 왼쪽 가장자리에 진한 잉크의 2px 괘선, 그 아래 옅은 바탕입니다. | 옅게 물든 타일입니다. |
| 질감 | 두 모양 모두 없습니다. | 어두운 모양에는 없습니다. 밝은 모양의 오른쪽 단은 괘선이 있는 종이입니다. | 어두운 모양에는 없습니다. 밝은 모양의 오른쪽 단은 괘선이 있는 종이입니다. |
| 상태 표시 | 달의 위상과 올빼미의 눈입니다. 달은 일이 나아간 만큼 채워지는 원판이므로, 일이 얼마나 나아갔는지가 달이 얼마나 찼는지로 읽힙니다. 오른쪽 가장자리만 가늘게 채운 고리는 잠든 것입니다. 반을 채운 원판은 일하는 중이고, 돌지 않습니다. 다 채운 원판은 끝났다는 뜻입니다. 채우는 색은 상태의 색이므로, 밝은 모양에서는 채운 쪽이 더 어둡고, 끝난 작업은 어두운 원판입니다. 눈동자가 있는 뜬 눈은 사람이 필요하다는 뜻입니다. 채운 세모는 실패입니다. 밝은 모양에서는 세모 둘레에 어둡게 한 노란색의 선이 있습니다. 밝은 노란색으로 채우기만 하면 바탕에서 도드라지지 않기 때문입니다. | 서식의 네모 칸입니다. 채운 칸은 사람이 필요하다는 뜻입니다. 반만 채운 칸은 일하는 중입니다. 체크한 칸은 끝났다는 뜻입니다. 빈 칸은 잠든 것입니다. 세로 획이 든 세모는 실패입니다. | 채운 원판은 사람이 필요하다는 뜻입니다. 도는 고리는 일하는 중입니다. 체크한 원은 끝났다는 뜻입니다. 초승달은 잠든 것입니다. 세로 획이 든 세모는 실패입니다. |
| 승인 줄 | 네 역할의 이름을 한 줄에 두고, 이름마다 앞에 표시를, 아래에 메모를 두며, 괘선으로 잇습니다. | 괘선을 친 네 칸의 블록이고, framer, crafter, proofer, 검수자에 한 칸씩입니다. 칸마다 표시와 역할 이름, 이름 아래의 메모가 들어갑니다. 검수자의 칸에 검수 표식이 들어갑니다. | 네 역할의 이름을 한 줄에 두고, 이름마다 앞에 표시를, 아래에 메모를 두며, 짧은 괘선으로 잇습니다. |
| 치르는 값 | 노란색은 대부분의 도구가 경고에 쓰는 색입니다. 그래서 사람이 필요한 작업이 고장으로 읽힐 수 있습니다. | Desk보다 차갑게 읽힙니다. 에이전트가 한 말의 세리프가 스프레드시트로 읽히지 않게 막아 줍니다. | 셋 가운데 이웃 제품과 가장 가깝습니다. 따뜻한 어두운 바탕에 크림색 잉크이고, 밝은 모양에서는 제목이 세리프입니다. |

## 토큰

토큰은 페이지가 그릴 때 쓰는 사용자 정의 속성입니다. 이 절이 모든 토큰 값의 원본이고, `apps/desktop/src/renderer/themes.css`와 `apps/desktop/src/renderer/index.html`에 있는 페이지의 `:root`가 이 절을 따릅니다. 값을 바꾸는 변경은 이 문서, 영어판, 스타일시트를 한 커밋에서 함께 바꿉니다.

check: apps/desktop/test/themes.test.ts

이름이 말하는 것은 아래와 같습니다.

- `--scheme`: 스크롤 막대와 선택 목록처럼 시스템이 직접 그리는 부분을 어둡게 그릴지 밝게 그릴지입니다.
- `--font-*`와 `--weight-*`: 글꼴과 굵기 둘입니다. `--font-title`은 제목, `--font-said`는 에이전트가 한 말과 요약 화면의 문장, `--font-fact`는 지난 시간과 개수, `--font-terminal`은 터미널에 씁니다.
- `--ground*`와 `--texture`: 창, 사이드바, 작업 화면의 오른쪽 단, 카드, 입력 칸의 바탕과 오른쪽 단 위의 질감입니다.
- `--ink*`와 `--rule*`: 진한 것부터 옅은 것까지의 잉크와 괘선입니다.
- `--hover`, `--pressed`, `--selected*`, `--line-edge*`, `--group-*`: 줄, 사이드바의 항목, 탭이 포인터 아래에 있을 때, 눌렸을 때, 선택됐을 때의 바탕입니다. 그리고 사이드바에서 선택한 항목의 가장자리, 작업함의 줄이 가만히 있을 때와 선택됐을 때의 가장자리(가만히 있을 때의 것은 기록 목록의 행도 씁니다), 묶음의 머리의 바탕과 가장자리입니다.
- `--control*`, `--main*`, `--on-main`: 단추, 주 단추, 주 단추 위의 글자입니다.
- `--focus`, `--mark*`, `--badge*`: 키보드 초점의 고리, 검색에 맞은 글자, 새 커밋의 수입니다.
- `--state-*`, `--added`, `--removed`: 상태의 색이고, 상태 표시와 그 문구가 이 색을 씁니다. 기다림과 실패의 표시를 채우는 색, 더한 줄과 뺀 줄의 수도 여기에 있습니다.
- `--terminal-*`: 터미널의 바탕과 잉크, 앞에 있는 탭의 이름표입니다.
- `--tab-green`, `--tab-blue`, `--tab-pink`: 사람이 터미널 칸의 탭에 표시하는 색이고, 탭 메뉴의 줄에 놓인 차례대로입니다. 탭의 막대와 줄의 견본이 이 색으로 그려집니다.
- `--inspection-*`: 검수 표식의 빈 자리의 색조, 검수 통과에 드는 빛, 그리고 밀랍의 붉은색을 빼는 검수 실효의 빛입니다. 다른 토큰은 붉은색을 갖지 않습니다.
- `--radius-*`: 카드, 조작 단추, 줄, 칩, 에이전트가 한 말, 검색에 맞은 글자의 모서리입니다.
- `--card-edge`, `--said-*`, `--backdrop`, `--dialog-shadow`, `--field-edge`, `--tab-edge`, `--dot-edge`, `--on-edge`: 페이지가 그림자로 그리는 가장자리, 켜진 아이콘 단추의 가장자리, 에이전트가 한 말의 바탕과 가장자리, 대화 상자의 뒤와 아래에 놓이는 것입니다.
- `--approval-*`: 승인 줄에서 역할 이름과 다음 자리를 잇는 괘선, 블록의 가장자리, 두 자리 사이의 가장자리입니다.
- `--shape-*`: 상태 표시이고, 16단위 정사각형 위의 경로입니다. 상태마다 `--shape-<state>`는 1.5px 선으로 그리고 `--shape-<state>-fill`은 채웁니다. `--shape-working-track`은 도는 부분 아래의 옅은 선이고, `--shape-working-turn`은 도는 부분입니다. `none`은 아무것도 그리지 않습니다.

### 배치의 치수

어느 테마도 이 값을 바꾸지 않습니다. 페이지의 `:root`에 있습니다.

| 토큰 | 값 |
|---|---|
| `--size-caption` | `11px` |
| `--size-second` | `12px` |
| `--size-text` | `13px` |
| `--size-head` | `15px` |
| `--size-said` | `20px` |
| `--size-title` | `20px` |
| `--size-sentence` | `34px` |
| `--size-terminal` | `12px` |
| `--tracking-title` | `-0.01em` |
| `--weight-changed` | `650` |
| `--space-1` | `2px` |
| `--space-2` | `4px` |
| `--space-3` | `6px` |
| `--space-4` | `8px` |
| `--space-5` | `12px` |
| `--space-6` | `16px` |
| `--space-7` | `20px` |
| `--space-8` | `24px` |
| `--space-9` | `28px` |
| `--space-10` | `36px` |
| `--space-11` | `44px` |
| `--titlebar-height` | `44px` |
| `--sidebar-width` | `256px` |
| `--sidebar-line` | `28px` |
| `--icon-button` | `24px` |
| `--icon` | `16px` |
| `--control-height` | `28px` |
| `--head-height` | `52px` |
| `--tabs-height` | `34px` |
| `--strip-height` | `24px` |
| `--group-height` | `30px` |
| `--line-height` | `46px` |
| `--detail-line` | `26px` |
| `--summary-line-height` | `38px` |
| `--summary-title` | `300px` |
| `--list-width` | `404px` |
| `--facts-width` | `488px` |
| `--fact-label` | `76px` |
| `--said-height` | `260px` |
| `--dialog-width` | `460px` |
| `--menu-width` | `208px` |
| `--menu-width-most` | `340px` |
| `--line-mark` | `12px` |
| `--link-card-width` | `480px` |
| `--tab-width` | `240px` |
| `--dot` | `6px` |
| `--inspection-size-line` | `18px` |
| `--inspection-size` | `64px` |
| `--inspection-size-large` | `112px` |
| `--motion` | `120ms` |

### Night watch

| 토큰 | 어두운 모양 | 밝은 모양 |
|---|---|---|
| `--scheme` | `dark` | `light` |
| `--font-ui` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, monospace` | `ui-monospace, "SF Mono", Menlo, monospace` |
| `--font-serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` |
| `--font-title` | `var(--font-ui)` | `var(--font-ui)` |
| `--font-said` | `var(--font-ui)` | `var(--font-ui)` |
| `--font-fact` | `var(--font-ui)` | `var(--font-ui)` |
| `--font-terminal` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` |
| `--weight-title` | `650` | `650` |
| `--weight-said` | `500` | `500` |
| `--ground` | `#0f0f10` | `#f3efe6` |
| `--ground-side` | `#161617` | `#e9e5db` |
| `--ground-column` | `#0f0f10` | `#f3efe6` |
| `--ground-raised` | `#1c1c1e` | `#faf8f2` |
| `--ground-sunken` | `#0a0a0b` | `#fcfaf5` |
| `--texture` | `none` | `none` |
| `--ink-strong` | `#f3efe6` | `#0f0f10` |
| `--ink` | `#dcd9d1` | `#26262a` |
| `--ink-muted` | `#a3a097` | `#53514d` |
| `--ink-faint` | `#908e87` | `#62605c` |
| `--rule` | `rgba(243, 239, 230, 0.1)` | `#d5d0c4` |
| `--rule-soft` | `rgba(243, 239, 230, 0.055)` | `#e2ded3` |
| `--hover` | `rgba(243, 239, 230, 0.05)` | `rgba(15, 15, 16, 0.045)` |
| `--pressed` | `rgba(243, 239, 230, 0.08)` | `rgba(15, 15, 16, 0.07)` |
| `--selected` | `rgba(243, 239, 230, 0.1)` | `rgba(15, 15, 16, 0.085)` |
| `--selected-edge` | `none` | `none` |
| `--line-edge` | `none` | `none` |
| `--line-edge-selected` | `none` | `none` |
| `--group-ground` | `transparent` | `transparent` |
| `--group-edge` | `none` | `none` |
| `--control` | `rgba(243, 239, 230, 0.08)` | `#faf8f2` |
| `--control-hover` | `rgba(243, 239, 230, 0.13)` | `#fffefb` |
| `--control-pressed` | `rgba(243, 239, 230, 0.05)` | `#ece8de` |
| `--control-edge` | `inset 0 0 0 1px rgba(243, 239, 230, 0.1)` | `inset 0 0 0 1px #cbc6b9` |
| `--main` | `#f3efe6` | `#0f0f10` |
| `--main-hover` | `#fbf9f4` | `#26262a` |
| `--main-pressed` | `#dcd9d1` | `#000000` |
| `--on-main` | `#0f0f10` | `#f3efe6` |
| `--focus` | `#f3efe6` | `#0f0f10` |
| `--mark` | `rgba(243, 239, 230, 0.22)` | `rgba(15, 15, 16, 0.14)` |
| `--badge` | `rgba(243, 239, 230, 0.12)` | `rgba(15, 15, 16, 0.1)` |
| `--badge-ink` | `#f3efe6` | `#26262a` |
| `--state-waiting` | `#f2c033` | `#846000` |
| `--state-waiting-fill` | `var(--state-waiting)` | `#e9b61a` |
| `--state-working` | `#dcd9d1` | `#26262a` |
| `--state-finished` | `#908e87` | `#62605c` |
| `--state-no-agent` | `#908e87` | `#62605c` |
| `--state-failed` | `#f2c033` | `#7f5b00` |
| `--state-failed-fill` | `var(--state-failed)` | `#e9b61a` |
| `--added` | `#a9b88a` | `#4f6b2a` |
| `--removed` | `#a3a097` | `#53514d` |
| `--terminal-ground` | `#070708` | `#0f0f10` |
| `--terminal-ink` | `#cfccc4` | `#cfccc4` |
| `--terminal-strong` | `#f3efe6` | `#f3efe6` |
| `--inspection-blank` | `#1b1b1d` | `#ebe7dd` |
| `--inspection-blank-deep` | `#151516` | `#e4e0d5` |
| `--inspection-blank-ring` | `#242426` | `#f6f3ec` |
| `--inspection-blank-owl` | `#2c2c2f` | `#d6d1c4` |
| `--inspection-blank-ground` | `radial-gradient(circle at 40% 35%, var(--inspection-blank), var(--inspection-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--inspection-blank), var(--inspection-blank-deep))` |
| `--inspection-blank-edge` | `inset 0 0 0 1px var(--inspection-blank-ring)` | `inset 0 0 0 1px var(--inspection-blank-ring)` |
| `--inspection-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--inspection-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--inspection-lapsed-light` | `grayscale(1) brightness(1.6) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `grayscale(1) brightness(1.6) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--radius-card` | `8px` | `8px` |
| `--radius-control` | `6px` | `6px` |
| `--radius-line` | `6px` | `6px` |
| `--radius-chip` | `4px` | `4px` |
| `--radius-said` | `0 var(--radius-card) var(--radius-card) 0` | `0 var(--radius-card) var(--radius-card) 0` |
| `--card-edge` | `inset 0 0 0 1px rgba(243, 239, 230, 0.06)` | `inset 0 0 0 1px #d5d0c4` |
| `--said-ground` | `var(--ground-raised)` | `var(--ground-raised)` |
| `--said-edge` | `var(--card-edge)` | `var(--card-edge)` |
| `--said-edge-waiting` | `inset 2px 0 0 var(--state-waiting)` | `inset 2px 0 0 var(--state-waiting)` |
| `--backdrop` | `rgba(0, 0, 0, 0.6)` | `rgba(15, 15, 16, 0.4)` |
| `--dialog-shadow` | `0 24px 80px rgba(0, 0, 0, 0.6)` | `0 24px 80px rgba(15, 15, 16, 0.3)` |
| `--field-edge` | `inset 0 0 0 1px var(--rule)` | `inset 0 0 0 1px var(--rule)` |
| `--tab-edge` | `1px 0 0 var(--rule), -1px 0 0 var(--rule)` | `1px 0 0 var(--rule), -1px 0 0 var(--rule)` |
| `--tab-green` | `#5fb86f` | `#2e8540` |
| `--tab-blue` | `#6b8cf2` | `#2f6bd0` |
| `--tab-pink` | `#e46fa8` | `#c23f80` |
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--on-edge` | `inset 0 0 0 1px var(--ink-muted)` | `inset 0 0 0 1px var(--ink-muted)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `2px` | `2px` |
| `--approval-rule` | `linear-gradient(var(--rule), var(--rule))` | `linear-gradient(var(--rule), var(--rule))` |
| `--approval-edge` | `none` | `none` |
| `--approval-box-edge` | `none` | `none` |
| `--shape-waiting` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-waiting-fill` | `path("M5.5 8a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z")` | `path("M5.5 8a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z")` |
| `--shape-working` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-working-fill` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6z")` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6z")` |
| `--shape-working-track` | `none` | `none` |
| `--shape-working-turn` | `none` | `none` |
| `--shape-finished` | `none` | `none` |
| `--shape-finished-fill` | `path("M1.65 8a6.35 6.35 0 1 0 12.7 0a6.35 6.35 0 1 0-12.7 0z")` | `path("M1.65 8a6.35 6.35 0 1 0 12.7 0a6.35 6.35 0 1 0-12.7 0z")` |
| `--shape-no-agent` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-no-agent-fill` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6A7 7 0 0 0 8 2.4z")` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6A7 7 0 0 0 8 2.4z")` |
| `--shape-failed` | `none` | `path("M8 2.3l6 10.5H2z")` |
| `--shape-failed-fill` | `path("M8 2.3l6 10.5H2z")` | `path("M8 2.3l6 10.5H2z")` |

### Register

| 토큰 | 어두운 모양 | 밝은 모양 |
|---|---|---|
| `--scheme` | `dark` | `light` |
| `--font-ui` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, monospace` | `ui-monospace, "SF Mono", Menlo, monospace` |
| `--font-serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` |
| `--font-title` | `var(--font-ui)` | `var(--font-serif)` |
| `--font-said` | `var(--font-serif)` | `var(--font-serif)` |
| `--font-fact` | `var(--font-mono)` | `var(--font-mono)` |
| `--font-terminal` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` |
| `--weight-title` | `650` | `600` |
| `--weight-said` | `500` | `500` |
| `--ground` | `#1c1a18` | `#f1e9d8` |
| `--ground-side` | `#262321` | `#e8dfcb` |
| `--ground-column` | `#1c1a18` | `#faf5e9` |
| `--ground-raised` | `#262321` | `#faf5e9` |
| `--ground-sunken` | `#171513` | `#fbf7ee` |
| `--texture` | `none` | `repeating-linear-gradient(0deg, rgba(120, 95, 60, 0.028) 0 1px, transparent 1px 3px)` |
| `--ink-strong` | `#f6ecd8` | `#1a1613` |
| `--ink` | `#e4ddcf` | `#2e2924` |
| `--ink-muted` | `#aea697` | `#564d43` |
| `--ink-faint` | `#9b9385` | `#655c51` |
| `--rule` | `rgba(246, 236, 216, 0.13)` | `#d6cab2` |
| `--rule-soft` | `rgba(246, 236, 216, 0.07)` | `#e3d9c4` |
| `--hover` | `rgba(246, 236, 216, 0.045)` | `rgba(46, 41, 36, 0.045)` |
| `--pressed` | `rgba(246, 236, 216, 0.075)` | `rgba(46, 41, 36, 0.07)` |
| `--selected` | `rgba(246, 236, 216, 0.06)` | `rgba(46, 41, 36, 0.05)` |
| `--selected-edge` | `inset 2px 0 0 var(--ink-strong)` | `inset 2px 0 0 var(--ink-strong)` |
| `--line-edge` | `0 1px 0 var(--rule-soft)` | `0 1px 0 var(--rule-soft)` |
| `--line-edge-selected` | `inset 2px 0 0 var(--ink-strong), 0 1px 0 var(--rule-soft)` | `inset 2px 0 0 var(--ink-strong), 0 1px 0 var(--rule-soft)` |
| `--group-ground` | `var(--ground-side)` | `var(--ground-side)` |
| `--group-edge` | `inset 0 -1px 0 var(--rule), inset 0 1px 0 var(--rule-soft)` | `inset 0 -1px 0 var(--rule), inset 0 1px 0 var(--rule-soft)` |
| `--control` | `transparent` | `transparent` |
| `--control-hover` | `rgba(246, 236, 216, 0.045)` | `rgba(46, 41, 36, 0.045)` |
| `--control-pressed` | `rgba(246, 236, 216, 0.075)` | `rgba(46, 41, 36, 0.07)` |
| `--control-edge` | `inset 0 0 0 1px rgba(246, 236, 216, 0.18)` | `inset 0 0 0 1px #bfb193` |
| `--main` | `#f6ecd8` | `#1a1613` |
| `--main-hover` | `#fff8e8` | `#2e2924` |
| `--main-pressed` | `#e4ddcf` | `#0d0b09` |
| `--on-main` | `#201c18` | `#fbf6ea` |
| `--focus` | `#e8c88e` | `#5e3b0f` |
| `--mark` | `rgba(219, 165, 69, 0.4)` | `rgba(162, 96, 10, 0.3)` |
| `--badge` | `rgba(246, 236, 216, 0.12)` | `rgba(46, 41, 36, 0.1)` |
| `--badge-ink` | `#f6ecd8` | `#2e2924` |
| `--state-waiting` | `#f6ecd8` | `#1a1613` |
| `--state-waiting-fill` | `var(--state-waiting)` | `var(--state-waiting)` |
| `--state-working` | `#bdb5a5` | `#564d43` |
| `--state-finished` | `#a39b8c` | `#655c51` |
| `--state-no-agent` | `#9b9385` | `#655c51` |
| `--state-failed` | `#dba545` | `#8f550b` |
| `--state-failed-fill` | `var(--state-failed)` | `var(--state-failed)` |
| `--added` | `#a3b47c` | `#4f6b2a` |
| `--removed` | `#aea697` | `#564d43` |
| `--terminal-ground` | `#151312` | `#1c1815` |
| `--terminal-ink` | `#d6cfc1` | `#d8cfbd` |
| `--terminal-strong` | `#f6ecd8` | `#f6ecd8` |
| `--inspection-blank` | `#292624` | `#ebe2ce` |
| `--inspection-blank-deep` | `#23201e` | `#e6dcc6` |
| `--inspection-blank-ring` | `#312d2a` | `#f4eddd` |
| `--inspection-blank-owl` | `#3b3632` | `#d9ccb2` |
| `--inspection-blank-ground` | `radial-gradient(circle at 40% 35%, var(--inspection-blank), var(--inspection-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--inspection-blank), var(--inspection-blank-deep))` |
| `--inspection-blank-edge` | `inset 0 0 0 1px var(--inspection-blank-ring)` | `inset 0 0 0 1px var(--inspection-blank-ring)` |
| `--inspection-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--inspection-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--inspection-lapsed-light` | `grayscale(1) brightness(1.6) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `grayscale(1) brightness(1.6) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--radius-card` | `2px` | `2px` |
| `--radius-control` | `2px` | `2px` |
| `--radius-line` | `0` | `0` |
| `--radius-chip` | `0` | `0` |
| `--radius-said` | `0` | `0` |
| `--card-edge` | `inset 0 0 0 1px rgba(246, 236, 216, 0.06)` | `inset 0 0 0 1px #d6cab2` |
| `--said-ground` | `transparent` | `transparent` |
| `--said-edge` | `0 1px 0 var(--rule), 0 -1px 0 var(--rule)` | `0 1px 0 var(--rule), 0 -1px 0 var(--rule)` |
| `--said-edge-waiting` | `0 1px 0 var(--rule), 0 -1px 0 var(--rule)` | `0 1px 0 var(--rule), 0 -1px 0 var(--rule)` |
| `--backdrop` | `rgba(0, 0, 0, 0.6)` | `rgba(46, 41, 36, 0.4)` |
| `--dialog-shadow` | `0 24px 80px rgba(0, 0, 0, 0.6)` | `0 24px 80px rgba(90, 60, 30, 0.35)` |
| `--field-edge` | `inset 0 0 0 1px var(--rule)` | `inset 0 0 0 1px var(--rule)` |
| `--tab-edge` | `inset 0 2px 0 var(--terminal-strong)` | `inset 0 2px 0 var(--terminal-strong)` |
| `--tab-green` | `#5fb86f` | `#2e8540` |
| `--tab-blue` | `#6b8cf2` | `#2f6bd0` |
| `--tab-pink` | `#e46fa8` | `#c23f80` |
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--on-edge` | `inset 0 0 0 1px var(--ink-muted)` | `inset 0 0 0 1px var(--ink-muted)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `0` | `0` |
| `--approval-rule` | `none` | `none` |
| `--approval-edge` | `inset 0 0 0 1px var(--rule)` | `inset 0 0 0 1px var(--rule)` |
| `--approval-box-edge` | `inset 1px 0 0 var(--rule)` | `inset 1px 0 0 var(--rule)` |
| `--shape-waiting` | `none` | `none` |
| `--shape-waiting-fill` | `path("M3 3h10v10H3z")` | `path("M3 3h10v10H3z")` |
| `--shape-working` | `path("M3 3h10v10H3z")` | `path("M3 3h10v10H3z")` |
| `--shape-working-fill` | `path("M3 3h5v10H3z")` | `path("M3 3h5v10H3z")` |
| `--shape-working-track` | `none` | `none` |
| `--shape-working-turn` | `none` | `none` |
| `--shape-finished` | `path("M3 3h10v10H3zM5.6 8.2l1.7 1.7 3.2-3.6")` | `path("M3 3h10v10H3zM5.6 8.2l1.7 1.7 3.2-3.6")` |
| `--shape-finished-fill` | `none` | `none` |
| `--shape-no-agent` | `path("M3 3h10v10H3z")` | `path("M3 3h10v10H3z")` |
| `--shape-no-agent-fill` | `none` | `none` |
| `--shape-failed` | `path("M8 2.3l6 10.5H2zM8 6.6v2.8M8 11.1v.1")` | `path("M8 2.3l6 10.5H2zM8 6.6v2.8M8 11.1v.1")` |
| `--shape-failed-fill` | `none` | `none` |

### Desk

| 토큰 | 어두운 모양 | 밝은 모양 |
|---|---|---|
| `--scheme` | `dark` | `light` |
| `--font-ui` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, monospace` | `ui-monospace, "SF Mono", Menlo, monospace` |
| `--font-serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` |
| `--font-title` | `var(--font-ui)` | `var(--font-serif)` |
| `--font-said` | `var(--font-serif)` | `var(--font-serif)` |
| `--font-fact` | `var(--font-ui)` | `var(--font-ui)` |
| `--font-terminal` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` |
| `--weight-title` | `650` | `600` |
| `--weight-said` | `500` | `500` |
| `--ground` | `#1c1a18` | `#f1e9d8` |
| `--ground-side` | `#262321` | `#e8dfcb` |
| `--ground-column` | `#1c1a18` | `#faf5e9` |
| `--ground-raised` | `#262321` | `#faf5e9` |
| `--ground-sunken` | `#171513` | `#fbf7ee` |
| `--texture` | `none` | `repeating-linear-gradient(0deg, rgba(120, 95, 60, 0.028) 0 1px, transparent 1px 3px)` |
| `--ink-strong` | `#f6ecd8` | `#1a1613` |
| `--ink` | `#e4ddcf` | `#2e2924` |
| `--ink-muted` | `#aea697` | `#564d43` |
| `--ink-faint` | `#9b9385` | `#655c51` |
| `--rule` | `rgba(246, 236, 216, 0.09)` | `#d6cab2` |
| `--rule-soft` | `rgba(246, 236, 216, 0.05)` | `#e3d9c4` |
| `--hover` | `rgba(246, 236, 216, 0.045)` | `rgba(46, 41, 36, 0.045)` |
| `--pressed` | `rgba(246, 236, 216, 0.075)` | `rgba(46, 41, 36, 0.07)` |
| `--selected` | `rgba(246, 236, 216, 0.1)` | `rgba(46, 41, 36, 0.09)` |
| `--selected-edge` | `none` | `none` |
| `--line-edge` | `none` | `none` |
| `--line-edge-selected` | `none` | `none` |
| `--group-ground` | `transparent` | `transparent` |
| `--group-edge` | `none` | `none` |
| `--control` | `rgba(246, 236, 216, 0.08)` | `#faf5e9` |
| `--control-hover` | `rgba(246, 236, 216, 0.13)` | `#fffbf1` |
| `--control-pressed` | `rgba(246, 236, 216, 0.05)` | `#efe6d2` |
| `--control-edge` | `inset 0 0.5px 0 rgba(246, 236, 216, 0.14), 0 0.5px 1px rgba(0, 0, 0, 0.35)` | `inset 0 0 0 1px #cfc2a8, 0 1px 0 rgba(120, 95, 60, 0.12)` |
| `--main` | `#f6ecd8` | `#1f2a44` |
| `--main-hover` | `#fff8e8` | `#2b3959` |
| `--main-pressed` | `#e4ddcf` | `#172034` |
| `--on-main` | `#201c18` | `#fbf6ea` |
| `--focus` | `#e8c88e` | `#5e3b0f` |
| `--mark` | `rgba(219, 165, 69, 0.4)` | `rgba(162, 96, 10, 0.3)` |
| `--badge` | `rgba(246, 236, 216, 0.12)` | `rgba(46, 41, 36, 0.1)` |
| `--badge-ink` | `#f6ecd8` | `#2e2924` |
| `--state-waiting` | `#f6ecd8` | `#1a1613` |
| `--state-waiting-fill` | `var(--state-waiting)` | `var(--state-waiting)` |
| `--state-working` | `#bdb5a5` | `#564d43` |
| `--state-finished` | `#a39b8c` | `#655c51` |
| `--state-no-agent` | `#9b9385` | `#655c51` |
| `--state-failed` | `#dba545` | `#8b5107` |
| `--state-failed-fill` | `var(--state-failed)` | `var(--state-failed)` |
| `--added` | `#a3b47c` | `#4f6b2a` |
| `--removed` | `#aea697` | `#564d43` |
| `--terminal-ground` | `#151312` | `#1c1815` |
| `--terminal-ink` | `#d6cfc1` | `#d8cfbd` |
| `--terminal-strong` | `#f6ecd8` | `#f6ecd8` |
| `--inspection-blank` | `#292624` | `#ebe2ce` |
| `--inspection-blank-deep` | `#23201e` | `#e6dcc6` |
| `--inspection-blank-ring` | `#312d2a` | `#f4eddd` |
| `--inspection-blank-owl` | `#3b3632` | `#d9ccb2` |
| `--inspection-blank-ground` | `radial-gradient(circle at 40% 35%, var(--inspection-blank), var(--inspection-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--inspection-blank), var(--inspection-blank-deep))` |
| `--inspection-blank-edge` | `inset 0 0 0 1px var(--inspection-blank-ring)` | `inset 0 0 0 1px var(--inspection-blank-ring)` |
| `--inspection-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--inspection-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--inspection-lapsed-light` | `grayscale(1) brightness(1.6) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `grayscale(1) brightness(1.6) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--radius-card` | `8px` | `4px` |
| `--radius-control` | `6px` | `5px` |
| `--radius-line` | `6px` | `5px` |
| `--radius-chip` | `4px` | `3px` |
| `--radius-said` | `var(--radius-card)` | `var(--radius-card)` |
| `--card-edge` | `inset 0 0 0 1px rgba(246, 236, 216, 0.06)` | `inset 0 0 0 1px #d6cab2` |
| `--said-ground` | `var(--ground-raised)` | `var(--ground-raised)` |
| `--said-edge` | `var(--card-edge)` | `var(--card-edge)` |
| `--said-edge-waiting` | `var(--card-edge)` | `var(--card-edge)` |
| `--backdrop` | `rgba(0, 0, 0, 0.6)` | `rgba(46, 41, 36, 0.4)` |
| `--dialog-shadow` | `0 24px 80px rgba(0, 0, 0, 0.6)` | `0 24px 80px rgba(90, 60, 30, 0.35)` |
| `--field-edge` | `inset 0 0 0 1px var(--rule)` | `inset 0 0 0 1px var(--rule)` |
| `--tab-edge` | `1px 0 0 var(--rule), -1px 0 0 var(--rule)` | `1px 0 0 var(--rule), -1px 0 0 var(--rule)` |
| `--tab-green` | `#5fb86f` | `#2e8540` |
| `--tab-blue` | `#6b8cf2` | `#2f6bd0` |
| `--tab-pink` | `#e46fa8` | `#c23f80` |
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--on-edge` | `inset 0 0 0 1px var(--ink-muted)` | `inset 0 0 0 1px var(--ink-muted)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `2px` | `2px` |
| `--approval-rule` | `linear-gradient(to right, transparent 25%, var(--rule) 25%, var(--rule) 75%, transparent 75%)` | `linear-gradient(to right, transparent 25%, var(--rule) 25%, var(--rule) 75%, transparent 75%)` |
| `--approval-edge` | `none` | `none` |
| `--approval-box-edge` | `none` | `none` |
| `--shape-waiting` | `none` | `none` |
| `--shape-waiting-fill` | `path("M3.8 8a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0-8.4 0z")` | `path("M3.8 8a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0-8.4 0z")` |
| `--shape-working` | `none` | `none` |
| `--shape-working-fill` | `none` | `none` |
| `--shape-working-track` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-working-turn` | `path("M8 2.4A5.6 5.6 0 0 1 13.6 8")` | `path("M8 2.4A5.6 5.6 0 0 1 13.6 8")` |
| `--shape-finished` | `path("M2.2 8a5.8 5.8 0 1 0 11.6 0a5.8 5.8 0 1 0-11.6 0zM5.3 8.2l1.9 1.9 3.6-4")` | `path("M2.2 8a5.8 5.8 0 1 0 11.6 0a5.8 5.8 0 1 0-11.6 0zM5.3 8.2l1.9 1.9 3.6-4")` |
| `--shape-finished-fill` | `none` | `none` |
| `--shape-no-agent` | `path("M12.9 9.7A5.6 5.6 0 0 1 6.3 3.1 5.6 5.6 0 1 0 12.9 9.7z")` | `path("M12.9 9.7A5.6 5.6 0 0 1 6.3 3.1 5.6 5.6 0 1 0 12.9 9.7z")` |
| `--shape-no-agent-fill` | `none` | `none` |
| `--shape-failed` | `path("M8 2.3l6 10.5H2zM8 6.6v2.8M8 11.1v.1")` | `path("M8 2.3l6 10.5H2zM8 6.6v2.8M8 11.1v.1")` |
| `--shape-failed-fill` | `none` | `none` |

## 부분과 그 상태

부분마다 형태는 모든 테마에서 같고, 테마의 토큰으로 그립니다. 바탕이나 색은 포인터가 부분 위로 올 때 120ms에 걸쳐 바뀌고, 그 밖에는 바로 바뀝니다. 줄표는 그 부분에 없는 상태입니다.

| 부분 | 가만히 있을 때 | 포인터 아래 | 눌렸을 때 | 선택됐을 때 | 키보드 초점 | 쓸 수 없을 때 |
|---|---|---|---|---|---|---|
| 주 단추 | `--main` 위에 `--on-main`의 글자, `--radius-control`과 `--control-edge`입니다. 대화 상자와 아래쪽 줄에는 많아야 하나입니다. | `--main-hover` | `--main-pressed` | — | 가장자리에서 2px 바깥에, 단추 둘레의 바탕 위에 `--focus`의 2px 고리가 생깁니다. 고리가 안쪽에 있으면 단추를 채운 색에 묻힙니다. | 세기가 45%가 되고, 포인터에 답하지 않습니다. |
| 단추 | `--control`에 `--control-edge`와 `--radius-control`입니다. | `--control-hover` | `--control-pressed` | — | 가장자리 안쪽에 `--focus`의 2px 고리입니다. 아래 행에서는 이것을 고리라고 부릅니다. | 세기가 45%가 됩니다. |
| 아이콘 단추 | 바탕 없이 `--ink-muted`의 아이콘입니다. | `--hover` 위에 `--ink`의 아이콘입니다. | `--pressed` | 켜는 것이 켜져 있으면 아이콘이 `--on-edge` 안에서 `--ink-strong`입니다. 사이드바의 필터는 상태를 골랐거나 검색어를 입력한 동안 켜져 있고, 무엇을 보이는지 포인터에 말합니다. 예를 들면 "Showing: Needs you, matching "logs""입니다. | 고리입니다. | 세기가 45%가 됩니다. |
| 작업함의 줄 | 바탕이 없고 `--radius-line`과 `--line-edge`입니다. 제목은 `--ink`이고, 사람이 마지막으로 본 뒤에 작업이 바뀌었으면 더 굵은 `--ink-strong`입니다. 지난 시간과 개수는 `--font-fact`와 `--ink-faint`입니다. | `--hover`이고, 아무것도 선택하지 않습니다. | `--pressed` | `--selected`와 `--line-edge-selected`입니다. 포인터 아래에서도 바탕을 지킵니다. 지난 시간은 `--ink-muted`입니다. 옅은 잉크는 선택한 바탕에서 도드라지지 않기 때문입니다. | 고리입니다. | — |
| 사이드바의 항목 | 바탕이 없고 `--radius-line`입니다. | `--hover` | `--pressed` | 앞에 있는 것의 항목이 `--selected`와 `--selected-edge`입니다. 그 항목의 지난 시간과 개수는 `--ink-muted`입니다. | 고리입니다. | — |
| 저장소 줄의 검사 표시 | 저장소의 워크플로가 앱보다 오래된 Owlery의 검사를 받으면, 저장소 줄의 "+" 앞에 "Check"라는 낱말과 그 버전이 `--font-fact`와 `--ink-muted`로 섭니다. 바탕이 없는 `--radius-control`의 단추입니다. 신호도 밀랍도 아닙니다. 누르면 기록 자리의 대화 상자가 열리고, 대화 상자는 검사를 옮기는 커밋을 보여 줍니다. 두 버전과 워크플로 전체를 보여 주고, 그 아래에 "Work items whose records Owlery's readers refuse or did not read"라는 캡션을 두고, 앱의 읽기 도구가 기록을 거절하거나 읽지 못한 작업마다 제목을 `--ink`로, 그 아래에 그 작업의 문장을 `--size-second`의 `--ink-muted`로 줄이지 않고 적습니다. | `--hover` 위에 `--ink`의 글자입니다. | `--pressed` | — | 고리입니다. | — |
| 필터나 검색이 저장소를 하나도 남기지 않은 사이드바 | 저장소들의 자리에 문장 하나가 `--size-second` 크기의 `--ink-muted`로 줄을 바꿔 가며 섭니다. 그 문장은 무엇이 저장소를 하나도 남기지 않았는지 말하고, 사이드바가 그 저장소를 하나도 나열하지 않는다고 말합니다. 예를 들면 "No work item stands under "Needs you", so the sidebar lists none of its 2 repositories."입니다. 그 아래에 "Show every work item"이 섭니다. 이것은 주 단추가 아닌 단추이고, 필터에서 All을 고르고, 검색 칸을 비우고, 키보드를 첫 저장소의 행에 둡니다. 숨긴 저장소가 몇 개인지 말하는 단추는 그 아래에 섭니다. 저장소가 하나라도 남은 곳, 그리고 모든 저장소를 숨긴 곳에는 문장이 서지 않습니다. | — | — | — | — | — |
| 묶음의 머리 | 묶음의 이름은 `--ink-muted`, 개수는 `--ink-faint`와 `--font-fact`이고, `--group-ground` 위에 `--group-edge`입니다. | — | — | — | — | — |
| 사이드바의 머리 | 캡션 "Repositories"가 있고, 줄 끝에 아이콘 단추 넷이 종, 새로 고침, 필터, "+"의 순서로 섭니다. 새로 고침은 원을 따라 도는 화살표 둘이고, 포인터와 화면 낭독기에 "Read the work items again from git and GitHub."라고 말합니다. 답이 오는 동안에는 화살표가 1.1초에 한 바퀴 돌고, "Reading the work items again…"이라고 말하며, 눌러도 아무것도 보내지 않습니다. | 아이콘 단추와 같습니다. | 아이콘 단추와 같습니다. | 아이콘 단추와 같습니다. 필터가 사이드바를 좁힐 때의 필터입니다. | 고리입니다. | — |
| 기록 목록의 행: 커밋, 바뀐 파일, 작업 화면의 사실, 묻지 않고 내린 결정, 작업 트리 준비(Setup)가 복사했거나 복사하지 못한 경로, 검수 시트에 놓이는 리뷰 회차의 지적과 체인의 단계 | 바탕이 없고 `--line-edge`입니다. 작업의 기록에서 읽지 못한 줄은 결정 아래에 `--state-failed`로 나옵니다. 사람의 말이 기록에는 적혔는데 아직 어느 커밋에도 없으면, 미리보기와 작업 화면의 결정 위에 그렇다고 말하는 문장 하나가 잘리지 않고 줄을 바꿔 가며 놓이고, 사람이 그 문장을 선택할 수 있습니다. 그 말이 세션을 기다리는 동안에는 `--ink-muted`이고, 커밋이 실패했으면 `--state-failed`입니다. 복사하지 못한 경로는 잘리지 않고 다 보이고, 그 아래에 복사가 받은 오류가 고정폭 글꼴과 `--state-failed`로 잘리지 않고 줄을 바꿔 가며 놓이며, 사람이 그 오류를 선택할 수 있습니다. 지적은 번호, `--ink`의 증상, 그 오른쪽의 닫힘으로 서고, 증상 아래에 심각도와 `path:line` 꼴의 자리가 `--ink-muted`로 옵니다. 단계는 이름, 어떻게 끝났는지, 걸린 시간, 들어가고 나온 토큰, 캐시에서 읽고 쓴 토큰, 비용으로 서고, 각 칸은 시트 전체에서 한 자리에 서는 열에 놓이며, 열의 이름은 캡션의 잉크로 그 위에 옵니다. | — | — | — | — | — |
| 메뉴 | `--ground-raised` 위의 카드이고 `--radius-card`, `--card-edge`, `--dialog-shadow`입니다. 항목은 `--radius-line`이고, 메뉴의 다른 부분이 시작하는 곳에 괘선이 있습니다. | 항목이 `--hover`입니다. | 항목이 `--pressed`입니다. | 하위 메뉴가 열린 항목은 포인터 아래의 항목처럼 그립니다. | 키보드가 놓인 항목은 포인터 아래의 항목처럼 그리고, 고리는 없습니다. | — |
| 대화 상자 | `--backdrop` 위에 놓인 `--ground-raised`의 카드이고 `--radius-card`, `--card-edge`, `--dialog-shadow`입니다. 머리는 무엇을 하는지 말하고, 글은 무슨 일이 일어날지 말하며, 단추는 오른쪽 아래에 있고 주 단추가 마지막입니다. 대화 상자의 선택지는 표시와 그 뒤의 글이 한 줄에 섭니다. 켜거나 끄는 선택지의 표시는 네모이고, 둘 가운데 하나를 고르는 선택지의 표시는 동그라미입니다. 고른 동그라미는 `--ink-strong`으로 그리고, 시스템의 강조색은 쓰지 않습니다. | — | — | — | — | — |
| 입력 칸 | `--ground-sunken`에 `--field-edge`와 `--radius-control`이고, 글자는 `--ink-strong`입니다. 무엇을 넣을지 알리는 글자는 입력하기 전까지 `--ink-faint`입니다. | — | — | — | 고리입니다. | 시스템이 입력을 받지 않는 칸을 그리는 대로입니다. |
| 터미널 칸의 탭 | 이름표가 `--ink-muted`이고 닫는 표시가 `--ink-faint`입니다. 터미널 칸이 무대에 있는 탭은 두 모양 모두에서 어두운 `--terminal-ground` 위에 서고, 이름표와 닫는 표시가 `--terminal-ink`입니다. 사람이 색으로 표시한 탭은 아래 가장자리를 따라 폭 전체에 그 색의 토큰으로 높이 2px의 막대를 갖습니다. 막대는 어느 색에서나 같은 모양이고, 탭의 툴팁과 화면 낭독기에 알리는 이름은 "Shell 2, Blue"처럼 색의 낱말로 끝납니다. 터미널 칸의 탭 어디에서든 마우스 오른쪽 단추를 누르면 "터미널 칸의 탭 메뉴"가 열립니다. 시트의 탭 "Inspection sheet"는 터미널 칸의 탭들 앞에 서고, 닫는 표시가 없습니다. | `--hover` | — | 키보드를 가진 터미널 칸의 탭, 곧 앞에 있는 탭은 `--tab-edge`를 갖고 이름표가 더 굵은 `--terminal-strong`입니다. 시트는 창의 바탕 위에 서므로, 앞에 있는 시트의 탭은 `--selected`와 `--selected-edge`를 갖고 이름표가 더 굵은 `--ink-strong`입니다. | 고리입니다. 터미널 칸이 무대에 있는 탭에서는 고리가 `--terminal-strong`입니다. | — |
| 터미널 칸의 탭 메뉴 | 메뉴의 형태입니다. 터미널 칸의 탭 어디에서든 마우스 오른쪽 단추를 누르면 포인터 자리에 모서리를 두고 열리고, 화면 낭독기에는 "Menu of"와 탭의 이름표로 알립니다. 항목은 차례대로 "터미널 칸의 이름을 바꾸는 대화 상자"를 여는 "Rename…", 색의 줄, 괘선, "Close Pane", 작업의 다른 칸을 모두 닫는 "Close Other Panes", 이 탭 뒤에 선 탭의 칸을 모두 닫는 "Close Panes to the Right"입니다. 색의 줄에는 Green, Blue, Pink, No colour의 네 견본이 놓입니다. 견본은 저마다 화살표 키가 다른 항목처럼 닿는 항목이고, 항목만큼 높고 그만큼 넓으며 `--radius-line`입니다. 견본은 탭에 줄 표시를 그립니다. 색의 토큰으로 그린 폭 14px, 높이 4px의 막대이고, No colour는 같은 막대를 `--ink-faint`의 테두리로만 그립니다. 화면 낭독기에는 견본의 색의 낱말을 알리고, 포인터에는 그 낱말로 시작하는 문장을 알립니다. 견본을 누르면 탭에 그 색을 주거나 탭의 색을 떼고, 메뉴가 닫힙니다. "Rename…"과 색의 줄은 데몬이 터미널 칸의 이름과 색을 간직할 때에만 놓입니다. 더 이른 빌드의 데몬은 둘 다 간직하지 않고, 그때 메뉴는 괘선 없이 닫는 항목만 담습니다. 아무것도 닫지 않을 항목은 빠집니다. 작업에 탭이 하나뿐이면 "Close Other Panes"가 빠지고, 마지막 탭에서는 "Close Panes to the Right"가 빠집니다. 닫는 항목마다 "칸을 닫는 대화 상자"가 말하는 대로 칸을 닫습니다. 시트의 탭에서 마우스 오른쪽 단추를 누르면 메뉴가 열리지 않습니다. | 견본이 `--hover`입니다. | 견본이 `--pressed`입니다. | 탭의 색의 견본, 탭에 색이 없으면 No colour의 견본이 골라진 것이고, `--ink-muted`의 가장자리를 갖습니다. | 키보드가 놓인 견본은 포인터 아래의 견본처럼 그립니다. | — |
| 칸의 찾기 막대 | 칸 화면의 오른쪽 위 모서리에 놓이는 `--ground-raised` 위의 카드이고 `--radius-card`, `--card-edge`, `--dialog-shadow`입니다. ⌘F나 칸 메뉴의 "Find…"로 엽니다. 왼쪽부터 입력 칸이 놓이고, 칸에는 입력하기 전까지 "Find"가 보입니다. 그 다음에 "Match case"와 "Regular expression"이 "Aa"와 ".*"로 그린 아이콘 단추로 놓이고, `--font-fact`와 `--ink-muted`의 개수가 "3 of 17", "No match", "More than 1,000 matches", "Not a regular expression" 가운데 하나를 말하며, "Next match", "Previous match", "Close"가 아이콘 단추로 놓입니다. 터미널에서 맞은 곳마다 `--terminal-ink`로 테두리를 두르고, 앞에 있는 맞은 곳은 터미널의 선택이며 `--terminal-strong`으로 테두리를 두릅니다. "Next match"는 바로 더 오래된 맞은 곳으로 가고, 입력 칸의 Enter와 ⌘G가 같은 일을 합니다. "Previous match"는 가장 새것 쪽으로 돌아가고, Shift+Enter와 ⇧⌘G가 같은 일을 합니다. 입력 칸에서 누른 Escape는 막대를 닫고, 터미널에서 누른 Escape는 프로그램의 것으로 남습니다. | 아이콘 단추가 `--hover`입니다. | `--pressed` | "Match case"와 "Regular expression"은 켜져 있는 동안 아이콘이 `--ink-strong`입니다. | 입력 칸과 단추마다 고리입니다. | 맞은 곳이 없는 동안 "Next match"와 "Previous match"는 세기가 45%가 됩니다. |
| 검색에 맞은 글자 | 글자 아래가 `--mark`이고 글자는 `--ink-strong`이며, `--mark-edge`와 `--radius-mark`입니다. | — | — | — | — | — |
| 상태 표시 | 그 상태에 대한 테마의 형태를 상태의 색으로, 16px 너비로 그립니다. 표시는 포인터와 화면 낭독기에 자기 문구를 말합니다. 일하는 중인 표시의 도는 부분은 1.1초에 한 바퀴 돕니다. | — | — | — | — | — |
| 에이전트가 한 말, 그리고 작업을 멈춰 둔 질문 | `--said-ground`에 `--said-edge`와 `--radius-said`이고, 글자는 `--font-said`와 `--ink-strong`입니다. 작업에 사람이 필요하면 가장자리가 `--said-edge-waiting`입니다. 질문의 근거와 선택지가 뜻하는 바는 `--ink-muted`입니다. 에이전트가 질문과 함께 내놓은 선택지는 질문 아래에 번호를 붙인 목록으로 놓이고, 선택지의 이름은 `--ink-strong`, 그것을 고르면 어떻게 되는지는 `--ink-muted`입니다. 여러 개를 고를 수 있는 질문 아래에는 "More than one may be chosen."이라는 말이 `--size-caption`과 `--ink-faint`로 놓입니다. 사람은 에이전트의 칸에서 답하므로, 어느 선택지도 단추가 아니고 카드에는 입력 칸이 없습니다. | — | — | — | — | — |
| 검수의 자리 | 브랜치의 head 커밋에 담긴 검수를 따라 그립니다. 검수 전: 줄에서는 `--inspection-blank-ground`의 원판에 `--inspection-blank-edge`이고, 미리 보는 칸과 작업 화면의 아래쪽에서는 표식의 그림이 빈 자리의 색조로 `--inspection-blank-light` 아래 바탕에 눌려 있습니다. 검수가 head에서 통과했으면: 그려진 그대로의 표식이 `--inspection-light` 아래에 있습니다. 검수 뒤에 들어온 커밋이 검수를 실효시켰으면: 같은 그림이 비스듬한 금 하나를 따라 둘로 갈라지고, 두 쪽 사이가 벌어진 채로 `--inspection-lapsed-light` 아래에 있습니다. 이 빛은 밀랍의 붉은색을 뺍니다. 금은 페이지가 직접 긋고, 모든 테마에서 같습니다. 자리는 포인터와 화면 읽기 프로그램에 자기 말을 하고, 미리 보는 칸과 작업 화면 아래쪽의 머리는 그 말을 자리 옆에 보입니다. 그 말은 "No inspection yet", "Cleared at 3f2a9c1", "Inspection lapsed, cleared at 3f2a9c1"이고, 검수를 통과한 커밋은 앞의 일곱 글자로 씁니다. 작업 화면 아래쪽에서는 그림 옆에 글이 세로로 한 줄씩 섭니다. 위의 말이 머리이고, 그 아래로 `--ink-muted`의 설명이 오며, 데몬의 체인이 있는 작업에서는 그 체인의 문장이 `--ink`로 옵니다. 설명과 체인의 문장은 `--size-second` 크기이고 줄을 바꿔 씁니다. 검수가 실효됐으면, 검수가 왜 실효됐는지 말하는 검수의 문장이 작업 화면 아래쪽의 머리 밑에 따로 한 줄로 `--ink`로 섭니다. 검수의 자리에는 누를 것이 없습니다. 검수는 칸의 세션이 돌리는 체인에서 나오거나, 맡긴 이슈에 대해 데몬이 돌리는 체인에서 나옵니다. | — | — | — | — | — |
| 검수 시트 | 무대의 자리에, 자기 탭 뒤에, 창의 바탕 위에 창의 잉크로 서고, 사람이 그 글을 선택할 수 있습니다. 위에서부터: 큰 검수 표식과 그 상태의 말, 실효된 검수의 문장(`--ink`), 검수를 실효시킨 커밋과 그 제목을 말하는 "Lapsed by" 줄(`--ink-muted`); `--ink-muted`의 이름표와 그 값으로 된 검수의 기록; `--ink-strong`의 머리 문장들; 캡션의 잉크로 쓴 제목 아래에 지적, 회차의 문장, 단계를 가진 회차마다의 부분; 회차 뒤의 단계들; 그리고 합계, 체인 밖 세션의 줄, 환산 비용에 대한 문장, 거절된 호출입니다. 글 속의 코드는 고정폭 글꼴입니다. 비용은 `--ink`와 `--font-fact`이고, 그 낱말 "converted"는 `--ink-muted`입니다. 실패한 단계가 어떻게 끝났는지는 `--state-failed`이고, 읽지 못한 줄도 그렇습니다. 열린 지적의 닫힘은 더 굵은 `--ink-strong`이고, 닫힌 지적의 닫힘은 `--ink-muted`입니다. 시트에서 붉은 것은 검수 표식뿐입니다. 기록과 장부가 둘 다 답하기 전, 그리고 둘 중 하나가 거절된 곳에서는 그 자리에 `--ink-muted`의 문장 하나가 섭니다. | — | — | — | — | — |
| 승인 줄 | 미리보기와 작업 화면의 오른쪽 단에서 에이전트가 한 말 다음, 결정 앞에 오는 "Approval line"이라는 머리의 구역입니다. 네 역할을 framer, crafter, proofer, 검수자 순서로 같은 너비의 네 자리에 두고, 형태는 「테마」가 그 테마에 정한 것입니다. 자리마다 그 역할이 어디까지 왔는지의 표시, 첫 글자만 대문자인 역할 이름(`--ink`), 이름 아래의 두 낱말 이하의 메모(`--ink-muted`)가 있습니다. 메모는 시작하지 않은 자리에 "Not started", 사람의 답을 기다리는 자리에 "Needs you"이고, 일하는 중인 자리에는 작업의 체인이 그 역할로 돌리는 단계, 또는 체인 명령이 칸의 세션에 그 역할로 건넨 단계인 "Round 2", "Fix pass", "Judging", 체인이나 칸의 체인 명령이 저장소의 전체 검사를 돌리는 동안의 검수자 자리에는 "Broad gate", 단계가 실패한 자리에는 "Failed", 그 전체 검사가 실패한 검수자의 자리에는 "Gate failed"이며, 그 밖의 끝난 자리에는 "Framed", "1 commit", "3 rounds", "Cleared", "Withheld", "Undecided"처럼 어떻게 끝났는지입니다. 역할 이름은 한 줄에 두고, 작업 화면의 오른쪽 단(`--facts-width`)은 어느 테마에서나 자리의 표시, 가장 긴 역할 이름, 검수의 자리를 한 줄에 담는 자리 넷이 들어가는 너비입니다. 시스템이 스크롤 막대를 보여 주면 단의 스크롤 막대가 그 옆에 자리를 차지합니다. 그래서 자리의 양옆과 그 줄의 간격은 `--space-2`입니다. 자리보다 넓은 메모는 두 낱말 사이에서 줄을 바꿉니다. 전체 검사의 실행이 기록됐고 판정이 없는 검수자의 자리는 시작하지 않은 자리이고, 메모는 "Gate passed"입니다. 시작하지 않은 자리는 잠든 작업의 표시를, 일하는 중인 자리는 일하는 중의 표시를, 역할이 실패한 자리는 실패의 표시를 씁니다. 전체 검사가 실패한 검수자의 자리는 기다림의 표시를 씁니다. 그 실패는 검수자의 실패가 아니기 때문입니다. 표시는 포인터와 화면 읽기 프로그램에 역할 이름과 자리의 말 전부를 말하고, 판정이 가리키는 커밋, 단계가 속한 회차, 기다린 시간이나 단계가 돈 시간도 함께 말합니다. 검수자의 자리에는 줄에서처럼 그린 검수의 자리가 아이콘 크기(`--icon`)로 들어갑니다. 검수자의 자리는 브랜치의 head 커밋에서 검수가 통과했을 때만 "Cleared"라고 말합니다. 뒤에 들어온 커밋이 검수를 실효시켰으면 그 자리는 기다림의 표시와 "Inspection lapsed"라는 메모를 쓰고, 검수가 실효된 까닭을 말하는 검수의 문장이 자리들 아래에 옵니다. 자리들 아래에는 말할 것이 있는 자리마다 한 줄씩, 역할 이름과 쌍점과 그 글이 옵니다. 그 글은 기다리는 질문, 단계가 실패한 까닭, 또는 판정의 이유나 질문입니다. 이 줄은 `--ink-muted`이고, 실패한 자리의 줄은 `--state-failed`입니다. | — | — | — | — | — |
| 계정의 이름 | 작업함의 줄에서는 그 줄의 사실들 뒤에, 칸의 탭에서는 칸의 이름 뒤에, `--font-fact`와 `--ink-faint`로 적은 이름. 계정이 저장소나 작업이 주는 계정과 다를 때만 적습니다. Accounts 대화 상자에서는 계정 하나가 기록 목록의 한 줄이고, 기본인지는 말로 적습니다. 이름 아래에는 `--font-fact`와 `--ink-faint`로 적은 폴더가 있고, 그 아래에 로그인의 상태, 받은 시각과 함께 적은 사용량, 마지막 새로 받기, 새로 받기가 무엇을 쓰는지 알리는 문장이 각각 `--size-caption` 크기의 `--ink-muted`로 줄을 바꿔 가며 있습니다. 이름과 이 줄들은 그 줄의 너비를 다 쓰므로, 이름은 그 줄보다 길 때만 낱말 안에서 줄이 바뀝니다. 그 아래에는 기본인지 적은 말과 그 줄의 단추들이 따로 한 줄에 서고, 다 들어가지 않으면 다음 줄로 넘어갑니다. "Refresh usage"는 그 줄의 단추이고 주 단추가 아닙니다. 목록 아래의 양식에는 적을 칸이 없습니다. "Add an account"를 누르면 곧바로 로그인 칸이 열리고, 로그인이 로그인된 채로 끝나면 로그인이 정한 이름으로 그 계정의 줄이 나타납니다. 로그인 칸은 목록 아래에 있습니다. | — | — | 선택한 줄은 지난 시간을 그리듯 이름을 `--ink-muted`로 그립니다. | — | 이 창이 시작한 로그인이 데몬의 답을 기다리거나 도는 동안 "Add an account"와 각 줄의 "Sign in"은 쓸 수 없으므로, 두 번째 로그인이 대화 상자가 그리는 칸을 바꾸지 않습니다. |
| Machine 대화 상자 | "Machine"이라는 머리를 가진 대화 상자의 형태입니다. 머리 아래에 데몬이 읽은 기계가 `--font-fact`의 한 문장으로, 줄을 바꿔 가며 놓입니다. 그 아래에는 상한마다 행이 하나씩 놓입니다. "Agents at once", "Worktrees", "Panes side by side", "Scrollback lines", "Heavy commands at once"의 행이고, 행마다 상한의 이름, 여덟 글자 너비의 입력 칸, 그 옆의 "Use the default"가 서며, 그 아래에 기본값과 그 값이 나온 수를 말하는 문장이 `--ink-muted`와 `--size-caption`으로 줄을 바꿔 가며 놓입니다. "Use the default"는 주 단추가 아닌 단추이고, 상한이 기본값을 따르고 다른 값을 입력하지 않은 동안에는 쓸 수 없습니다. 데몬이 스크롤백을 보내지 않으면, 이전 빌드의 데몬처럼, "Scrollback lines" 행은 그리지 않습니다. 기계를 기다리는 세션이 있으면 에이전트 행의 끝에 캡션 "Waiting for the machine"이 놓이고, 그 아래에 기다리는 세션마다 시작할 순서대로 행이 하나씩 놓입니다. 행에는 작업의 이름이 `--ink`로, 이름 아래에 기다리는 일이 `--ink-muted`로 놓입니다. 체인의 단계는 "Proofer, round 1"처럼 그 이름으로 적고, 작업의 체인이 아직 그 단계를 목록에 두지 않은 세션은 "Proofer, round"처럼 역할과 단계로 적습니다. 역할이 없는 세션은 릴리스 0.0.5 전의 데몬만 띄웠고, "Session"과 그 번호로 적습니다. 어느 세션도 프롬프트로 적지 않습니다. 돌거나 기다리는 무거운 명령이 있으면 무거운 명령 행의 끝에 캡션 "Running and waiting"이 놓이고, 그 아래에 명령마다 대기열의 순서대로 행이 하나씩 놓입니다. 행에는 작업의 이름이, 작업이 없으면 명령이 도는 폴더의 마지막 부분이 `--ink`로 놓이고, 그 아래에 도는지 기다리는지, 명령의 이름, 기다리는 명령이 그 자리에 있는 까닭, 돌거나 기다린 시간이 `--ink-muted`로 놓입니다. 돈 무거운 명령이 있으면 캡션 "What ran"이 뒤따르고, 저장소의 명령마다 행이 하나씩 놓입니다. 행에는 저장소의 이름과 명령의 이름이 `--ink`로 놓이고, 그 아래에 실행 횟수, 가장 긴 실행, 가장 많이 쓴 메모리, 가장 높은 부하가 `--ink-muted`로 놓이며, 읽은 값이 없으면 "not read"로 적습니다. 주 단추는 "Save"입니다. | — | — | — | — | — |
| Settings 대화 상자 | "Settings"라는 머리를 가진 대화 상자의 형태입니다. 애플리케이션 메뉴의 "Settings…"나 ⌘,로 열리고, 편집기를 아직 고르지 않았을 때 칸에 찍힌 파일을 ⌘ 클릭해도 열립니다. 입력 칸 "Open files in"은 Owlery의 목록에 있는 편집기 가운데 Mac에 있는 것을 이름으로 보여 주는 메뉴이고, 맨 끝에 "Show in Finder"가 놓입니다. 메뉴는 저장해 둔 선택에 놓이고, 저장한 선택이 없으면 첫 편집기에 놓입니다. 입력 칸 아래에 "A ⌘ click on a file a pane printed opens it here, at the line the pane named. ⇧ ⌘ click shows it in Finder." 문장이 `--ink-muted`로 놓입니다. 주 단추는 "Save"입니다. 파일을 클릭해 대화 상자가 열렸을 때 편집기를 골라 저장하면 그 파일이 열립니다. | — | — | — | — | — |
| 삭제 대화 상자 | "Delete"와 작업의 이름을 머리로 가진 대화 상자의 형태입니다. 삭제가 하는 일이나 삭제로 잃을 것을 말하는 첫 문장은 이 대화 상자의 리드이고, `--ink`로 놓입니다. 그 아래에 삭제가 지우거나 잃는 것의 종류마다 절이 하나씩 놓이고, 절의 머리는 그 수를 말합니다. 예를 들면 "39 commits no other branch, no remote and no tag holds"입니다. 브랜치와 폴더를 담는 절은 머리에서 그 둘의 이름을 말합니다. 예를 들면 "The branch and the folder removed from disk"입니다. 항목마다 `--detail-line` 높이의 행이 하나씩 놓이고, 행 사이에는 틈이 없습니다. 커밋의 행에는 짧은 해시가 고정폭 글꼴과 `--ink-muted`로 목록에서 가장 긴 해시만큼 넓은 열에 놓이고, 그 뒤에 제목이 `--ink`로 한 줄에 놓이며 넘치는 부분은 잘립니다. 경로의 행에는 경로가 고정폭 글꼴로 한 줄에 놓이며 넘치는 부분은 잘립니다. 행마다 툴팁이 제목이나 경로 전체를 담습니다. 열 행보다 긴 목록은 열 행 높이로 서서 스크롤되고, 스크롤이 멈추면 온전한 행만 보입니다. 데몬이 센 것보다 적게 나열한 목록 아래에는 "and N more"가 놓입니다. "Nothing on a remote is removed."는 `--ink-muted`로 남습니다. 잃을 것 아래에서 대화 상자는 작업의 세션을 두 절에 나누어 이름으로 보입니다. 하나는 "Running sessions that end"이고, 다른 하나는 아직 시작하지 않은 세션을 담는 "Sessions waiting for the machine that leave the queue"입니다. 절은 세션을 하나라도 담을 때에만 놓입니다. 보관하기 전에 묻는 대화 상자, 저장소를 제거하는 대화 상자, 데몬이 끝나기 전에 묻는 대화 상자도 같은 절로 세션의 이름을 보입니다. 대화 상자가 열려 있는 동안 데몬이 목록을 보내도, 항목이 바뀌지 않은 목록은 그려진 그대로 남습니다. 그래서 목록은 스크롤 위치를 지키고, 포인터 아래의 툴팁도 닫히지 않습니다. 대화 상자를 열 때마다 모든 목록은 맨 위에서 시작합니다. 저장소를 제거하는 대화 상자도 작업마다 잃을 것을 이 형태로 그립니다. | — | — | — | — | — |
| 칸을 닫는 대화 상자 | 대화 상자의 형태이고, 머리 자리에 문장 하나가 놓입니다. 닫으려는 칸 가운데 하나라도 세션이 일하는 중이면 닫기 전에 열립니다. 칸의 "×", ⌘W, 칸 메뉴의 "Close Pane", 터미널 칸의 탭 메뉴의 닫는 항목마다 그렇습니다. 일하는 중인 세션이 없으면 묻지 않고 닫습니다. 문장은 일하는 중인 칸마다 그 탭의 이름표로 이름을 대고, 몇 개의 칸이 닫히는지 말합니다. 칸 하나는 "Claude Code is working. Closing the pane ends its session.", 여럿은 "Claude Code is working. Closing 3 panes ends its session."입니다. 키보드는 "Cancel"에서 시작합니다. "Cancel"과 Escape는 아무것도 닫지 않습니다. 주 단추는 닫으려는 칸을 모두 닫고, 칸 하나면 "Close pane", 여럿이면 "Close 3 panes"라고 적힙니다. 대화 상자가 열려 있는 동안 데몬이 닫으려는 칸 가운데 하나를 더 나열하지 않으면, 대화 상자는 아무 칸도 닫지 않고 닫힙니다. | — | — | — | — | — |
| 터미널 칸의 이름을 바꾸는 대화 상자 | "Rename"과 탭의 이름표를 머리로 가진 대화 상자의 형태이고, 터미널 칸의 탭 메뉴의 "Rename…"으로 열립니다. 입력란 하나에 탭의 이름표가 모두 선택된 채로 들어 있고, 입력란은 60자까지 받습니다. 그 아래에 "An empty name names the pane by its kind again."이라는 문장이 `--ink-muted`로 놓입니다. "Save"가 주 단추입니다. "Save"는 입력란의 이름에서 양 끝의 공백을 뺀 이름을 터미널 칸에 주고, 그 뒤로 창이 탭의 이름표로 터미널 칸을 부르는 곳마다 그 이름으로 부릅니다. 이름을 바꾼 칸도 같은 종류의 칸들 사이에서 제자리를 지키므로, 다른 탭의 번호는 그대로입니다. 빈 이름은 이름을 뗍니다. 칸의 종류가 주는 이름표도 이름을 떼므로, 이름이 없는 칸에서 입력란을 그대로 두고 "Save"를 눌러도 어느 탭의 번호도 바뀌지 않습니다. 데몬은 이름을 터미널 칸이 있는 동안, 창을 다시 불러와도 간직합니다. 데몬이 이름을 간직하면 대화 상자가 닫힙니다. 거절은 입력란 아래에 `--state-failed`로 놓이고, "Save"를 다시 누를 수 있습니다. 대화 상자가 열린 동안 데몬이 그 칸을 더는 나열하지 않으면, 대화 상자는 이름을 주지 않고 닫힙니다. | — | — | — | — | 데몬이 답하기 전의 "Save"입니다. |
| "New work item" 양식의 경고 | 데몬이 디스크를 보냈을 때, 양식의 이름 아래에서 브랜치, 폴더, 작업 트리 준비 다음에 놓입니다. 한 문장은 디스크가 작업 트리를 담지 못할 수 있다고 말하고, 남은 디스크, 비워 두는 10 GB, 이 저장소의 작업 트리가 차지하는 크기를 적습니다. 다른 한 문장은 작업 트리가 상한에 닿았다고 말하고, 그 작업 트리가 몇 번째인지와 상한을 적습니다. 두 문장은 한 문단에 이어서 줄을 바꿔 가며 `--size-second`와 `--ink`로 놓이고, 어떤 상태의 색도 쓰지 않습니다. 어느 작업의 상태도 아니고, 원칙 3이 테마의 신호 하나를 사람이 필요한 작업에 남겨 두기 때문입니다. 경고 아래에서도 "Create"를 누를 수 있습니다. | — | — | — | — | — |
| 나란히 놓인 무대 | "Side by side"가 눌려 있고 무대에 터미널 칸이 둘 이상 있으면, 칸들이 타일이 되어 행마다 차례로 놓입니다. 타일이 2개에서 4개면 두 열, 5개에서 9개면 세 열, 10개에서 16개면 네 열입니다. 마지막 타일은 그 행에 남은 자리를 다 차지합니다. 두 타일 사이에는 둘 사이 여백의 가운데에 `--rule`의 1px 괘선이 놓입니다. | — | — | — | — | — |
| 데몬 체인의 줄들 | 작업 화면의 아래쪽, 검수의 자리 위에 놓이는 목록입니다. 제목은 따로 없고, 화면 낭독기에는 "The daemon's chain"이라는 이름으로 읽힙니다. 맨 앞에는 그 작업의 체인이 마지막으로 돌린 전체 검사의 줄이 오고, 그 뒤에 데몬이 아직 목록에 두고 있는 체인 단계의 세션마다 줄이 하나씩, 최근 것부터 옵니다. 줄 하나는 기록 목록의 행입니다. 상태의 표시와 낱말, 그다음에 "Broad gate"와 고정폭 글꼴의 검사 명령, 또는 데몬이 보여 주는 단계의 프롬프트가 옵니다. 검사 명령이나 세션이 도는 동안에는 "Stop"이, 데몬이 검사의 출력을 간직한 곳에는 "Show output"이 함께 놓입니다. 그 아래에는 세션의 답, 또는 실패한 검사나 세션의 오류가 `--ink-muted`로 놓이고, 실패한 세션의 프로세스가 오류 출력에 쓴 것이나 검사 명령이 출력한 것이 고정폭 글꼴, `--size-caption`, `--ink-muted`로 잘리지 않고 줄을 바꿔 가며 놓이며, 사람이 그 글을 선택할 수 있습니다. 데몬이 그 작업의 세션을 하나도 두고 있지 않고 체인에 전체 검사의 실행도 없으면 목록은 그려지지 않고, 아래쪽에는 검수의 자리만 놓입니다. | — | — | — | 단추마다 고리가 생깁니다. | — |
| "New work item" 양식의 브랜치 | "Starts from" 아래의 "Branch" 입력 칸이고, 입력 칸의 형태를 따릅니다. 첫 선택지는 "No branch yet"이고, 양식이 열릴 때 골라져 있습니다. 그 아래에 "Local"과 "Remote" 묶음이 서고, 브랜치마다 그 이름으로 놓입니다. 다른 worktree가 체크아웃한 브랜치는 그 사이에 쓸 수 없는 채로 서고, 이름표는 "<branch>, checked out in <folder>"입니다. 같은 이름의 로컬 브랜치를 다른 worktree가 체크아웃한 원격 브랜치도 그렇게 섭니다. 이름 아래의 브랜치 자리는 만들기가 무엇을 하는지 말합니다. "No branch yet. The first commit or a rename makes owlery/<name>.", "Checks out <branch>." 또는 "Checks out <branch>, tracking <remote>/<branch>."이고, 이름은 `--font-fact`로 씁니다. | — | — | — | 고리입니다. | 다른 worktree가 체크아웃한 브랜치의 선택지는, 시스템이 아무것도 받지 않는 선택지를 그리는 대로입니다. |
| 작업의 브랜치 자리 | 줄의 미리 보기와 작업 화면의 머리에, 브랜치의 이름을 고정폭 글꼴로 씁니다. 브랜치가 없는 작업은 그 자리에 "No branch yet"을 산세리프와 `--ink-muted`로 쓰고, 더 말할 것이 없을 때 줄의 마지막 사실도 같은 말을 하며, 메뉴에는 "Copy branch name"이 없고, 검수의 자리는 비어 있고, 작업 화면에는 pull request 구역이 없습니다. | — | — | — | — | — |

앱은 데몬이 기록에 적힌 것을 보내 주는 작업마다 승인 줄을 그립니다. 브랜치의 head 커밋에서 검수가 통과했으면 빛이 든 표식을 그리고, 검수 뒤에 들어온 커밋이 검수를 실효시켰으면 갈라진 표식을 그리며, 둘 다 위의 형태를 따릅니다.
check: apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts

## 창의 문구가 가진 말투

어느 테마도 문구를 바꾸지 않습니다. 창은 서기의 메모처럼 말합니다. 지금 어떠한지와 무슨 일이 일어날지를 말하고, 판단은 읽는 사람에게 둡니다. 창의 문구는 영어이므로 아래 예는 영어 그대로 적습니다.

- **대상을 이름으로 부르는 온전한 문장.** "A delete removes the work item's worktree and its local branch, and takes the work item off Owlery's lists." 부분의 이름표는 명사이고, 단추는 그것이 하는 일입니다. "Open the work item"이라고 쓰고, "OK"나 "Yes"라고 쓰지 않습니다.
- **잃을 것은 잃기 전에 말하고, 잃지 않을 것도 말합니다.** "Nothing on a remote is removed."
- **검수의 사실은 사실로 말합니다.** "An inspection binds to one commit and lapses if another lands after it."
- **키는 문장 안에서 부릅니다.** "J K move through the inbox."
- **상태는 많아야 두 낱말입니다.** 네 상태는 "Needs you", "Working", "Finished", "Asleep"이고, 창은 상태를 부르는 모든 곳에서 이 낱말로 부릅니다. 상태마다 작업 수를 세는 문장에서는 낱말이 수에 맞춰 바뀝니다. "1 needs you, 2 working". 사이드바의 상태 줄은 데몬을 알립니다. "Daemon running, 2 agents".
- **첫 글자만 대문자로 씁니다.** 머리, 이름표, 단추는 대문자 하나로 시작합니다. 글자 사이를 벌린 대문자로 쓴 이름표는 없습니다.
- **일인칭이 없고, 인사가 없습니다.** 창은 에이전트가 아니고 에이전트처럼 말하지 않습니다. 에이전트가 한 말은 에이전트의 것으로, 따로 둔 카드에 보입니다.
- **파는 말이 없습니다.** "magic", "supercharge", 속도를 내세우는 말, 느낌표, 이모지를 쓰지 않습니다.

## 피하는 것

아래 가운데 하나를 그리는 변경은 어느 테마로 그렸든 리뷰에서 거절합니다. 아래 제품은 2026-11-22에 그 공개 페이지가 보인 것으로 이름을 올렸습니다. 어느 제품의 앱도 실행하지 않았으므로, 첫 페이지 너머의 앱 모습은 여기에 적지 않습니다.

### 흔한 AI 제품의 표시

1. **보라색, 그리고 보라색에서 파란색이나 분홍색으로 가는 그라데이션.** 판 뒤의 보랏빛 광채, 머리글이나 단추를 가로지르는 그라데이션입니다. 어느 테마도 보라색을 갖지 않고, 머리글, 단추, 판을 가로지르는 그라데이션을 그리지 않습니다.
2. **반짝이.** 모델이 한다는 뜻으로 낱말 옆에 두는 네 꼭지 별입니다. Claude Code의 문서 페이지는 "Ask Assistant" 단추에 하나를 둡니다.
3. **말풍선과 프롬프트 입력 상자.** 둥근 말풍선이 이어진 대화 기록, 그 아래 "Ask anything"이라고 적힌 상자, 그 밑의 칩에 적힌 모델 이름입니다. Orca, Conductor, Cursor의 첫 페이지는 저마다 자기 앱을 그 화면으로 보입니다. 데스크톱에는 채팅 화면이 없습니다. 창의 기다림 표시는 한때 말풍선이었고, 어느 테마도 그것을 다시 그리지 않습니다.
4. **유리.** 뒤의 것을 흐리게 하는 반투명한 판입니다. 흐림은 제품이 재는 그래픽 프로세스의 메모리를 씁니다.
5. **모든 것을 둥글게.** 완전히 둥근 알약 모양의 단추와 입력 칸, 12px이 넘는 모서리의 카드, 사람의 둥근 사진입니다. Linear의 "Sign up" 단추와 Cursor의 내려받기 단추가 알약 모양입니다.
6. **이 창이 한때 가졌던 여덟 가지 표시.** 푸른 슬레이트 바탕에 호박색과 하늘색 강조. Inter, Space Grotesk, JetBrains Mono. 글자 사이를 벌린 대문자 이름표. 68px 줄과 44px 단추 위의 30px 제목. 빈 미리 보는 칸. 모든 것에 8px 모서리 하나와 1px 가장자리 하나, 그리고 검수 자리의 점선 원. 신호등 단추 아래에 따로 둔 로고의 줄. 포인터 반응도, 움직임도, 상태의 아이콘도 없는 것. 2026-11-19의 조사가 이것들을 짚었고, 지금 창에는 하나도 없습니다.
7. **파는 말.** "Magic", "supercharge", "100x", 느낌표, 에이전트가 일인칭으로 건네는 인사, 이름표의 이모지입니다. Orca의 첫 페이지는 "Ship 100x with the agent IDE"로 시작하고, [product.ko.md](product.ko.md)는 처리량을 내세우는 문구를 쓰지 않습니다.

### 가장 가까운 제품들의 방식

| 제품 | 출처 | 그 페이지가 그리는 것 | Owlery가 가져오지 않는 것 |
|---|---|---|---|
| Orca | `https://www.orca.dev/` | 차가운 검정에 가까운 바탕, 흰 그로테스크 머리글, 알약 모양 탭의 띠입니다. 앱은 줄마다 에이전트의 로고가 붙은 worktree의 나무, 칸마다 프롬프트 입력 상자가 있는 나뉜 채팅 칸, 사용량 계기가 늘어선 상태 막대입니다. | 줄의 아이콘으로 쓰는 에이전트의 상표 로고, 프롬프트 입력 상자, 계기의 막대, 속도를 내세우는 말입니다. |
| Conductor | `https://www.conductor.build/` | 픽셀 별과 ASCII 그림이 깔린 검은 바탕, 픽셀 로고입니다. 앱은 작업 공간의 사이드바, 가운데의 대화 기록, 그리고 초록 "Merge" 단추 아래에 바뀐 파일과 초록과 빨강의 수가 있는 오른쪽 단입니다. 사이드바에 팀 사람들의 둥근 사진이 있습니다. | 픽셀과 ASCII 장식, 병합의 초록 단추, 사람의 사진입니다. 커밋과 바뀐 파일을 둔 오른쪽 단은 창의 것과 가깝습니다. 그래서 창의 오른쪽 단은 승인 줄과 아래쪽의 검수 표식으로 구분됩니다. |
| Linear | `https://linear.app/` | 검정에 가까운 무채색 바탕, 촘촘한 그로테스크, 첫 문장은 희고 나머지는 회색인 머리글, 글자 사이를 벌린 고정폭 대문자의 설명, 등각 투영의 가는 선으로 그린 그림입니다. | 두 색조의 머리글, 글자 사이를 벌린 대문자, 가는 선의 그림입니다. |
| Cursor | `https://cursor.com/` | 크림색 잉크의 따뜻한 검정에 가까운 바탕, 풍경 유화 위에 떠 있는 앱의 창, 링크의 주황색, 알약 모양 단추입니다. | 창 뒤의 그림, 주황색입니다. 따뜻한 바탕과 크림색 잉크는 Desk의 어두운 모양과 가깝습니다. |
| Claude Code의 데스크톱 앱 | `https://code.claude.com/docs/en/desktop` | 문서 페이지입니다. 따뜻한 어두운 바탕, 세리프로 쓴 페이지 제목, 선택한 항목과 제목 위의 줄에 쓰는 테라코타 주황색, 불꽃 로고, "Ask Assistant"의 반짝이입니다. | 주황색, 불꽃, 반짝이입니다. 따뜻한 바탕 위의 세리프 제목은 Desk의 밝은 모양의 세리프 제목과 가깝고, Desk와 Register에서 에이전트가 한 말에 쓰는 세리프와도 가깝습니다. |

이웃 제품은 두 무리로 갈립니다. Orca, Conductor, Linear는 무채색 검정에 그로테스크로 그립니다. Night watch는 그 바탕에 서되, 그 페이지들이 그리지 않는 눈의 노란색과 눈 표시를 갖습니다. Cursor와 Claude는 따뜻한 검정에 크림색으로 그리고, Desk가 거기에 섭니다. 열어 본 어느 페이지도 괘선을 친 대장, 승인 줄, 검수 표식을 그리지 않습니다.

## 창을 바꾸는 PR은 스크린샷을 싣습니다

창을 바꾸는 PR은 바꾼 화면마다 스크린샷을 싣습니다. Night watch의 어두운 모양과 밝은 모양으로 싣고, 바뀐 부분을 다르게 그리는 다른 테마로도 싣습니다. 리뷰는 스크린샷을 이 문서에 대어 읽습니다. 형태는 「부분과 그 상태」에, 값은 「토큰」에, 문구는 「창의 문구가 가진 말투」에, 전체는 「원칙」과 「피하는 것」에 대어 읽습니다. 스크린샷은 빌드한 앱에서 만들고, 화면은 요약 화면, 작업함, 작업 화면, 그 화면의 칸 위에 연 찾기 막대, 질문 때문에 멈춰 둔 작업의 화면, 끝난 작업의 화면, 검수가 실효된 작업의 화면, 메뉴, 탭마다 다른 색을 단 작업 화면과 그 탭 하나의 메뉴, 터미널 칸의 이름을 바꾸는 대화 상자, 대화 상자, 저장소 설정, Accounts 대화 상자, "Add an account"로 더하는 계정의 로그인이 도는 동안의 Accounts 대화 상자, 그 로그인이 이름을 정한 줄이 있는 Accounts 대화 상자, Machine 대화 상자, Settings 대화 상자, 커밋이 많은 작업의 삭제 대화 상자, 필터와 검색이 저장소를 하나도 남기지 않은 사이드바, 검사를 옮기는 기록 자리의 대화 상자입니다. 실행에 화면을 더하는 PR은 원칙 8이 형태의 행을 두고 말하듯 이 문서의 두 언어판에서 이 목록에 그 화면을 직접 더합니다. 이 절의 다른 문장은 화면의 수를 적지 않습니다.

**스크린샷은 `apps/desktop`에서 `pnpm run screenshots`를 실행해 만듭니다.** 이 명령은 앱을 빌드해 백그라운드로 띄우므로, 창은 실행한 사람의 키보드도 포인터도 가져가지 않습니다. 창은 불투명도 0으로 그려져 그 사람의 화면에 보이지 않고, 명령은 화면이 아니라 창 안의 페이지를 찍습니다. 앱은 지어낸 작업 일곱 개가 있는 임시 저장소에서 열립니다. 하나는 사람이 필요하고, 하나는 일하는 중이고, 하나는 리뷰 중이고, 하나는 끝났고, 하나는 잠들어 있고, 하나는 질문 두 개 때문에 멈춰 있고, 하나는 검수 뒤에 들어온 커밋 때문에 검수가 실효되어 있습니다. 작업 화면에 뜨는 작업은 사람이 필요한 작업입니다. 실행은 그 작업을 전체 검사가 실패한 곳에서 멈춘 체인과 함께 저장합니다. 그래서 화면 아래쪽의 그 검사 줄에 실패의 표시와 문구가 나오고, 스크린샷에는 모든 상태의 표시와 문구가 나옵니다. 실행은 작업 화면을 찍기 전에 그 줄의 "Show output"을 눌러, 검사 명령이 출력한 내용이 줄 아래에 고정폭 글꼴로 찍히게 합니다. 그 작업에는 묻지 않고 내린 결정도, 셋업의 문구도 없어서, 줄의 둘째 행은 폭을 모두 그 체인의 문장에 씁니다. 에이전트는 실행하지 않습니다. 칸의 프로세스는 픽스처이고, 상태는 실행이 데몬에 알려 준 값입니다. 실행은 스스로 체인을 시작하지 않고, 시작하는 체인의 단계도 없습니다. 체인은 기록으로만 있습니다. 다만 실행이 질문에 답해 데몬이 다시 잇는 체인 하나는 도는 중이고, 그 첫 단계는 기계를 기다리기만 하고 시작하지 않습니다. 실행은 체인의 단계가 쓰는 기록을 작업의 워크트리에 git으로 커밋하고, 이때 체인의 코드가 부르는 것과 같은 코드로 기록을 씁니다. 그리고 앱을 띄우기 전에, 질문 때문에 멈춘 작업, 끝난 작업, 작업 화면에 뜨는 작업, 단계가 기계를 기다리는 작업의 체인을 데몬의 실행 폴더에 저장합니다. 그 체인을 돌린 데몬이 저장했을 모습 그대로입니다. 리뷰 중인 작업에는 커밋 하나가 있고 기록은 없으며, 터미널 칸이 넷 있습니다. 그 가운데 셋의 탭은 초록, 파랑, 분홍을 달고, 파란 탭은 이름이 바뀌어 있습니다. 작업 화면에 뜨는 작업에는 routing과 회차 하나의 기록이 있어서, 그 승인 줄에 끝난 자리 둘, 시작하지 않은 자리 하나, 그리고 전체 검사가 실패했다고 말하는 검수자의 자리가 나옵니다. 이 승인 줄은 작업함의 미리보기에 나오고, 작업 화면의 스크린샷은 오른쪽 단을 승인 줄이 맨 아래에 올 때까지 내려서 찍습니다. 멈춰 둔 작업은 멈춰 둔 체인과 함께 저장합니다. 그 워크트리에는 지적을 남기지 않은 회차의 기록과 전체 검사를 돌린 기록이 있고, 질문 기록에는 실행이 써 넣은 검수자의 질문 둘이 있습니다. 그 작업의 승인 줄은 회차 하나를 세고 질문을 기다리는 검수자의 자리를 표시합니다. 멈춰 둔 화면의 스크린샷은 결정이 맨 아래에 올 때까지 그 열을 내려서 찍으므로, 승인 줄과 커밋되지 않은 말의 문장이 함께 나옵니다. 끝난 작업은 쉬는 체인과 PR을 함께 저장하고, 아래 문단들이 이것을 말합니다. 단계가 일하는 중인 모습은 어느 스크린샷에도 없습니다. 데몬은 시작할 때 실행 중이라고 저장된 체인을 멈춘 체인으로 읽고, 다시 잇는 체인의 단계는 기계를 기다리기 때문입니다. 저장소는 Owl Chain을 쓰므로, 장면의 Claude Code 칸은 묶음을 싣습니다. 명령은 Night watch의 두 모양마다 위 목록의 화면을 창 크기인 1440 x 900의 PNG 파일로 하나씩 씁니다. 파일의 이름은 `<theme>-<appearance>-<view>.png`입니다. `OWLERY_SCREENSHOT_THEMES`로 테마를 더합니다. `all`이면 모든 테마이고, `register,desk`처럼 쉼표로 이름을 이어 적을 수도 있습니다. 파일은 `apps/desktop/screenshots/` 아래, 실행을 시작한 시각을 이름으로 한 폴더에 들어가고, git은 이 폴더를 무시합니다. `OWLERY_SCREENSHOT_DIR`에 폴더를 적으면 그 폴더에 들어갑니다.
check: apps/desktop/test/screenshots.test.ts

**장면에는 검수를 통과한 작업 하나와 검수가 실효된 작업 하나가 있습니다.** 끝난 작업의 브랜치에는 통과한 검수로 끝난 체인의 기록이 있으므로, 그 작업의 줄과 작업 화면은 불이 든 표식을 보이고, 작업 화면 아래쪽은 "Cleared at"과 검수를 통과한 커밋을 말합니다. 실행은 작업 하나의 워크트리에 Owlery의 코드가 쓰는 대로 통과한 검수의 기록을 git으로 커밋하고, 그 뒤에 커밋 하나를 더 합니다. 그 작업에는 PR이 없습니다. 그 작업의 줄은 갈라진 표식을 보이고, 사람을 기다리고, 둘째 행에서 "Inspection lapsed"라고 말합니다. 작업 화면 아래쪽은 갈라진 표식과 그 말, 그 밑의 검수의 문장을 보이고, 누를 것은 없습니다.
check: apps/desktop/test/screenshots.test.ts

**파일은 변경과 함께 커밋하고, PR 본문은 파일마다 `![보여 주는 것](../blob/<commit>/<path>?raw=true)`로 보여 줍니다.** 파일은 기록 뿌리의 `threads/` 아래 그 PR의 기록에 커밋합니다. `<commit>`은 파일이 든 커밋의 전체 ID이고, `<path>`는 저장소 루트에서 본 파일의 경로입니다. GitHub는 이 링크를 PR의 주소에서부터 읽습니다. GitHub 문서가 PR에서 저장소의 이미지를 보일 때 쓰라고 적은 형식이 이것입니다. `images/inbox.png`처럼 트리의 Markdown 파일이 이미지를 거는 방식으로 적은 경로는 PR 본문에서 그려지지 않습니다. 링크에는 브랜치가 아닌 커밋을 적습니다. 그래야 그 뒤에 브랜치에 무엇이 올라와도 본문이 그 커밋에서 만든 이미지를 보여 줍니다.

PR이 "창을 바꾸는지"를 정하는 게이트는 없습니다. 그것은 뜻을 따지는 판단이고, 리뷰가 맡습니다.

**스크린샷 실행에서 질문 때문에 멈춰 둔 작업은 전체 검사가 통과한 체인을 가집니다.** 실행은 앱을 띄우기 전에 그 체인과 그 전체 검사가 출력한 내용을 데몬의 실행 폴더에 저장합니다. 그 작업의 화면은 아래쪽, 검수의 자리 위에 그 전체 검사의 줄을 올리고, 끝난 상태의 표시, 검사 명령, 명령이 출력한 내용을 보여 주는 단추를 함께 보입니다.
check: apps/desktop/test/screenshots.test.ts

**스크린샷 실행에서 끝난 작업은 검사가 통과한 PR을 가집니다.** 실행은 앱을 띄우기 전에 그 PR을 작업과 함께 저장하고, 검수를 통과한 커밋을 PR의 head로 둡니다. 데몬은 창이 붙어 있는 동안 저장된 PR을 `gh`로 다시 읽으므로, 실행은 로그인 셸의 `PATH` 맨 앞에 `gh` 대역을 둡니다. 대역은 그 읽기에 답하고 호출을 하나하나 적어 두며, 어떤 호출도 GitHub에 닿지 않습니다. 그 작업의 줄은 둘째 행에서 그렇게 말하고, 작업 화면은 검수 자리 아래에 PR의 번호, 상태, 검사 하나하나를 보입니다.
check: apps/desktop/test/screenshots.test.ts

**스크린샷 실행은 요약 화면도 찍습니다.** 실행은 장면의 검수가 통과하기 전에 마지막으로 본 때를 남깁니다. 끝난 작업의 검수 커밋을 앱을 띄우기 전에 만들어 두고, 브랜치를 그 앞의 커밋으로 되돌렸다가, 마지막으로 본 때를 남긴 뒤에 검수를 통과한 커밋으로 옮깁니다. 그래서 요약 화면의 맨 앞에는 그 뒤에 검수를 통과한 작업과 그 뒤에 검수가 실효된 작업이 옵니다.
check: apps/desktop/test/screenshots.test.ts

**끝난 작업의 화면과 검수가 실효된 작업의 화면은 검수 시트를 보입니다.** 두 작업은 열면 시트가 먼저 보이므로, 두 스크린샷 모두 시트가 앞에 있습니다. 끝난 작업의 기록에는 회차가 둘 있습니다. 첫 회차는 지적 하나를 남기고, 커밋 하나가 그것을 고치고, 지적을 닫는 블록이 그 커밋을 가리키며, 둘째 회차는 지적을 남기지 않습니다. 실행은 그 체인의 단계마다 쓴 양을 적은 항목을 데몬의 장부에 덧붙이므로, 장부에는 단계마다 환산한 비용이 있습니다. 그 시트는 파일과 줄, 고친 커밋이 붙은 지적, 아무것도 잡지 못한 회차, 단계별 비용과 그 합계를 보입니다. 검수가 실효된 작업의 시트는 검수를 실효시킨 커밋과 아무것도 잡지 못한 회차를 보입니다. 장부에 그 작업의 항목이 없으므로, 시트는 단계 비용을 보이지 않고 단계들이 데몬 밖에서 돌았으며 Owlery가 그 비용을 읽지 않았다고 말합니다.
check: apps/desktop/test/screenshots.test.ts

**스크린샷 실행의 장면에는 System default 말고 계정이 하나 있습니다.** 실행은 앱을 띄우기 전에 `accounts.json`을 써 둡니다. 그 계정은 실행이 만든 빈 폴더로 넘긴 것이고, 로그인되어 있다고 적혀 있으며, 사용 한도 값 둘을 갖습니다. 멈춰 둔 작업이 이 계정으로 정해져 있어서, 작업함의 그 줄은 계정의 이름을 적고, 설정에는 계정 칸이 나오고, Accounts 대화 상자는 그 계정의 줄을 그립니다. 멈춰 둔 작업의 셸 칸이 이 계정으로 돌므로, 그 줄은 새로 받기를 내놓지 않습니다.
check: apps/desktop/test/screenshots.test.ts

**스크린샷 실행의 장면에는 다른 브랜치가 갖지 않은 커밋이 많은 작업이 하나 있고, 실행은 그 작업의 삭제 대화 상자를 찍습니다.** 실행은 둘러본 시점을 잡기 전에, 체인의 단계가 컴퓨터를 기다리는 작업의 브랜치에 커밋 39개를 합니다. 그 가운데 몇 커밋의 제목은 대화 상자의 한 행보다 깁니다. 실행은 그 작업의 워크트리에 깊은 경로의 추적하지 않는 파일 하나와 무시되는 `.env`를 씁니다. 삭제 대화 상자의 화면은 사이드바에서 그 작업의 메뉴를 열고 Delete를 누른 뒤, 커밋 절의 머리가 39 이상을 셀 때까지 기다립니다. 그 브랜치에는 기록의 커밋도 있기 때문입니다. 그다음 Cancel이 대화 상자를 닫고, 아무것도 지우지 않습니다. 그래서 이 스크린샷은 대화 상자가 한 번에 보이는 것보다 긴 목록, 잘린 제목, 추적하지 않는 경로 목록과 무시되는 경로 목록을 보입니다.
check: apps/desktop/test/screenshots.test.ts

**삭제 대화 상자의 스크린샷은 실행 중인 세션과 컴퓨터를 기다리는 세션을 따로 보입니다.** 실행이 삭제 대화 상자를 찍는 작업에는 셸 창 하나와, 에이전트 수 한도 아래에서 기다리는 세션 하나가 있습니다. 삭제 대화 상자의 화면은 "Running sessions that end"가 그 창을, "Sessions waiting for the machine that leave the queue"가 기다리는 세션을 나열할 때까지 기다립니다. 그래서 이 스크린샷은 두 절을 각각의 머리와 함께 보입니다.
check: apps/desktop/test/screenshots.test.ts

**장면의 멈춰 둔 작업에는 커밋이 실패한 뒤집기가 하나 있습니다.** 실행은 그 작업의 기록에 묻지 않고 내린 결정 하나와 사람이 그 결정을 뒤집은 말을 적습니다. 실행은 앱을 띄우기 전, 멈춰 둔 워크트리의 커밋을 마친 뒤에, 그 기록을 담은 커밋만 거절하는 `pre-commit` 훅을 씁니다. 그래서 데몬이 그 말을 커밋하려 할 때마다 실패합니다. 작업함의 스크린샷은 커밋되지 않은 말을 알리는 줄의 문구를 보이고, 멈춰 둔 작업 화면의 스크린샷은 결정 위에 놓인 문장을 훅이 낸 줄과 함께 보입니다.
check: apps/desktop/test/screenshots.test.ts

**스크린샷 실행은 단추 한 번으로 계정을 더하고, 로그인하는 동안과 로그인한 뒤의 Accounts 대화 상자를 찍습니다.** 실행은 Accounts 대화 상자의 화면 다음에 "Add an account"를 누릅니다. 실행이 쓰는 CLI 대역이 로그인을 붙잡아 두고, 다음 화면은 목록 아래에 새 계정의 로그인 칸을 보입니다. 그다음 실행은 로그인을 끝내고, 그 뒤의 화면은 로그인이 이름을 정한 줄을 보입니다. 그 줄의 이름은 지어낸 이메일이고, 줄은 로그인되어 있다고 적습니다. 실행은 다음 화면으로 가기 전에 그 계정을 지우므로, 모든 모양이 같은 줄들을 그립니다. 사람의 로그인은 읽지 않고, 브라우저도 열리지 않습니다.
check: apps/desktop/test/screenshots.test.ts
