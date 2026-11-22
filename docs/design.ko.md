# 디자인: 창이 가진 자기 모습

*[English](./design.md) · 한국어*

이 문서는 Owlery의 창이 어떻게 보이고 어떻게 말하는지를 적습니다. 원칙, 세 테마, 테마가 그릴 때 쓰는 모든 값, 부분마다의 형태, 문구의 말투, 그리고 피하는 것입니다. 창을 바꾸는 변경은 이 문서에 대어 읽습니다. 창과 이 문서가 다르면 둘 가운데 하나가 틀린 것이고, 그 차이를 찾은 변경이 어느 쪽이 틀렸는지 말합니다. 테마가 무엇을 바꿀 수 있는지는 [product.ko.md](product.ko.md)가 정하고, 테마 하나하나는 이 문서가 정합니다.

## 원칙

창을 바꾸는 변경은 아래를 모두 지킵니다. 지키지 않으려면 같은 PR에서 이 문서를 고치고 이유를 적습니다.

1. **밀랍으로 된 것은 인장 하나입니다.** 붉은색은 인장에만 씁니다. 단추와 표시와 실패는 다른 색을 씁니다. 그래서 화면의 붉은색은 언제나 만든 쪽이 아닌 독립된 쪽이 이 커밋을 판정했다는 뜻입니다. 올빼미는 인장이 있는 자리에 그리고, Night watch에서는 상태 표시의 눈으로 그리며, 창의 다른 곳에는 그리지 않습니다.
2. **창은 알리고, 대화하지 않습니다.** 창은 작업마다 에이전트가 무엇을 했고 무엇이 필요한지를 보입니다. 말풍선, 프롬프트 입력 상자, 모델이 만들었다는 표시는 그리지 않습니다. 작업함의 모든 줄이 에이전트가 한 일이므로 그런 표시는 아무것도 말하지 않습니다.
3. **신호는 하나이고, 사람이 필요한 곳에만 씁니다.** 테마마다 작업에 사람이 필요하다고 말하는 방법이 하나 있습니다. Night watch에서는 눈의 노란색이고, Register와 Desk에서는 진한 잉크로 채운 표시입니다. 포인터가 올라간 곳, 선택한 것, 검색에 맞은 글자, 키보드 초점은 테마의 잉크로 그리고, 어느 것도 Night watch의 노란색을 쓰지 않습니다.
4. **상태는 세 번 말합니다. 형태로, 색으로, 문구로.** 어느 상태도 색만으로 다른 상태와 구분하지 않습니다. Night watch에서 기다림과 실패는 같은 노란색을 쓰고 형태와 문구로 갈립니다.
5. **테마는 토큰입니다.** 테마는 색, 글꼴, 질감, 인장에 드는 빛, 그리고 가장자리와 괘선과 표시의 형태를 바꿉니다. 배치, 문구, 인장의 그림, 밀랍의 붉은색, 하나뿐인 움직임의 길이는 어느 테마의 것도 아닙니다. 페이지의 선택자와 렌더러의 모듈은 테마나 모양의 이름을 부르지 않습니다.
6. **창은 겉모습에 메모리를 쓰지 않습니다.** 글꼴은 시스템의 것입니다. 어느 테마도 글꼴, 삽화, 판 뒤에 까는 그림을 불러오지 않고, 판 뒤의 것을 흐리게 하지 않습니다.
7. **모서리는 작고, 원은 둥근 것에만 씁니다.** 테마는 모서리 넷으로 된 단계 하나를 정하고, 어느 것도 8px을 넘지 않습니다. 완전한 원은 인장, 상태 표시, 종의 점을 그리고, 단추, 입력 칸, 칩, 사람의 사진에는 쓰지 않습니다.
8. **모든 형태는 여기에 적습니다.** 줄, 단추, 메뉴, 대화 상자는 테마마다 형태가 하나이고, 「부분과 그 상태」에 있습니다. 이 문서에 없는 형태가 필요한 변경은 먼저 여기에 그 형태를 더합니다. 작업마다 제 형태를 따로 그리지 않게 하려는 것입니다.
9. **글자와 표시는 바탕에서 도드라집니다.** 글자는 그 아래 바탕에 대해 4.5 대 1 이상입니다. 24px 이상이거나 굵은 18.66px 이상인 글자는 3 대 1 이상입니다. WCAG 2.2의 AA 수준입니다. 상태 표시와 키보드 초점의 고리는 둘레의 바탕에 대해 3 대 1 이상입니다. 바탕은 그 자리에 실제로 그려진 것입니다. 창의 바탕뿐 아니라 선택한 줄의 바탕과 포인터 아래의 바탕도 해당합니다. 이 기준에 못 미치는 값은 모든 테마에서 바꿉니다. 예전부터 그랬다는 이유로 값을 그대로 두는 테마는 없습니다. 부분을 누르는 동안에만 그려지는 바탕에는 이 기준을 적용하지 않습니다. 그 바탕은 누르는 동안에만 있고, 그 부분의 글자는 누르기 전에 이미 읽었기 때문입니다. 쓸 수 없어 세기의 45%로 그리는 부분에도 이 기준을 적용하지 않습니다.

check: apps/desktop/test/themes.test.ts

## 모든 테마가 함께 가진 것

- **배치와 그 치수.** 단, 글자 크기, 간격의 단계, 부분의 높이와 너비, 그리고 하나뿐인 움직임의 길이 120ms입니다. 페이지 자신의 `:root`에 있고, 「배치의 치수」가 모두 적습니다. 테마는 치수를 갖지 않습니다.
- **문구.** 모든 테마에 한 벌이고, 말투는 「창의 문구가 가진 말투」가 정합니다.
- **인장.** 인장의 그림과 밀랍의 붉은색은 AgenticSeal의 것입니다. 인장이 찍히기 전에는 그 자리가 테마 자신의 색조로 바탕에 빈 채로 눌려 있고, 작업함의 줄은 인장의 자리로 끝납니다.
- **시스템의 글꼴.** 문구는 산세리프로, 브랜치, 커밋의 해시, 경로, 줄 수, 터미널은 고정폭 글꼴로 씁니다.
- **붉은색은 인장에만 쓰고, 실패는 붉지 않습니다.**
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
| 생각 | 창을 엠블럼, 곧 검은 바탕의 흰 올빼미에서 그립니다. 올빼미의 노란 눈이 작업에 사람이 필요하다고 말하는 하나뿐인 색입니다. | 창은 인장이 찍힌 작업을 올리는 대장입니다. 그래서 괘선을 친 기록부로 그리고, 그 위에서 잉크가 아닌 것은 인장 하나입니다. | 밤의 따뜻한 책상과 편지지 한 장입니다. 테마가 생기기 전의 창 그대로이고, 잉크만 「원칙」의 기준에 맞게 진해졌습니다. |
| 신호 | 눈의 노란색을 사람이 필요한 곳에 씁니다. 기다리는 표시와 그 문구, 에이전트가 묻는 말의 가장자리, 실패입니다. | 기다림은 진한 잉크, 실패는 황토색입니다. | 기다림은 진한 잉크, 실패는 황토색입니다. |
| 글꼴 | 산세리프만 쓰고, 브랜치와 커밋은 고정폭 글꼴입니다. 세리프는 없고, 에이전트가 한 말도 산세리프로 씁니다. | 문구는 산세리프, 사람이 목록을 따라 내려가며 견주는 사실은 모두 고정폭 글꼴입니다. 브랜치, 커밋, 지난 시간, 개수입니다. 세리프는 Desk가 쓰는 자리에 씁니다. | 산세리프, 브랜치와 커밋의 고정폭 글꼴, 그리고 에이전트가 한 말과 요약 화면의 문장에 쓰는 세리프입니다. 밝은 모양에서는 제목도 세리프입니다. |
| 모서리 | 카드, 조작 단추, 줄, 칩이 8, 6, 6, 4px이고 두 모양이 같습니다. | 2, 2, 0, 0입니다. | 어두운 모양은 8, 6, 6, 4px, 밝은 모양은 4, 5, 5, 3px입니다. |
| 가장자리와 괘선 | 줄은 가장자리가 없는 타일입니다. 에이전트가 한 말은 도드라진 카드이고, 작업에 사람이 필요하면 왼쪽에 신호 색의 가장자리가 생깁니다. | 작업함의 줄마다, 그리고 기록 목록의 행마다 아래에 괘선이 있습니다. 기록 목록은 작업의 커밋, 바뀐 파일, 사실입니다. 사이드바의 항목은 길잡이라서 괘선이 없습니다. 묶음의 머리는 사이드바의 바탕에 괘선을 친 띠입니다. 단추는 채우지 않고 가장자리로 그립니다. 에이전트가 한 말은 두 괘선 사이에 놓입니다. 앞에 있는 탭은 위쪽에 괘선이 있습니다. | 줄은 가장자리가 없는 타일입니다. 에이전트가 한 말은 도드라진 카드입니다. |
| 선택한 것 | 옅게 물든 타일입니다. | 왼쪽 가장자리에 진한 잉크의 2px 괘선, 그 아래 옅은 바탕입니다. | 옅게 물든 타일입니다. |
| 질감 | 두 모양 모두 없습니다. | 어두운 모양에는 없습니다. 밝은 모양의 오른쪽 단은 괘선이 있는 종이입니다. | 어두운 모양에는 없습니다. 밝은 모양의 오른쪽 단은 괘선이 있는 종이입니다. |
| 상태 표시 | 올빼미의 눈입니다. 눈동자가 있는 뜬 눈은 사람이 필요하다는 뜻입니다. 도는 고리는 일하는 중입니다. 감은 눈은 끝났다는 뜻입니다. 초승달은 잠든 것입니다. 채운 세모는 실패입니다. 밝은 모양에서는 세모 둘레에 어둡게 한 노란색의 선이 있습니다. 밝은 노란색으로 채우기만 하면 바탕에서 도드라지지 않기 때문입니다. | 서식의 네모 칸입니다. 채운 칸은 사람이 필요하다는 뜻입니다. 반만 채운 칸은 일하는 중입니다. 체크한 칸은 끝났다는 뜻입니다. 빈 칸은 잠든 것입니다. 세로 획이 든 세모는 실패입니다. | 채운 원판은 사람이 필요하다는 뜻입니다. 도는 고리는 일하는 중입니다. 체크한 원은 끝났다는 뜻입니다. 초승달은 잠든 것입니다. 세로 획이 든 세모는 실패입니다. |
| 승인 줄 | 네 역할의 이름을 한 줄에 두고, 이름마다 앞에 표시를 두며, 괘선으로 잇습니다. | 괘선을 친 네 칸의 블록이고, framer, crafter, proofer, sealer에 한 칸씩입니다. sealer의 칸에 인장이 들어갑니다. | 네 역할의 이름을 한 줄에 두고, 이름마다 앞에 표시를 두며, 짧은 괘선으로 잇습니다. |
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
- `--seal-*`: 인장의 빈 자리의 색조와 인장에 드는 빛입니다. 다른 토큰은 붉은색을 갖지 않습니다.
- `--radius-*`: 카드, 조작 단추, 줄, 칩, 에이전트가 한 말, 검색에 맞은 글자의 모서리입니다.
- `--card-edge`, `--said-*`, `--backdrop`, `--dialog-shadow`, `--field-edge`, `--tab-edge`, `--dot-edge`: 페이지가 그림자로 그리는 가장자리, 에이전트가 한 말의 바탕과 가장자리, 대화 상자의 뒤와 아래에 놓이는 것입니다.
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
| `--facts-width` | `420px` |
| `--fact-label` | `76px` |
| `--said-height` | `260px` |
| `--dialog-width` | `460px` |
| `--menu-width` | `208px` |
| `--menu-width-most` | `340px` |
| `--line-mark` | `12px` |
| `--link-card-width` | `480px` |
| `--tab-width` | `240px` |
| `--dot` | `6px` |
| `--seal-size-line` | `18px` |
| `--seal-size` | `64px` |
| `--seal-size-large` | `112px` |
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
| `--state-failed` | `#f2c033` | `#846000` |
| `--state-failed-fill` | `var(--state-failed)` | `#e9b61a` |
| `--added` | `#a9b88a` | `#4f6b2a` |
| `--removed` | `#a3a097` | `#53514d` |
| `--terminal-ground` | `#070708` | `#0f0f10` |
| `--terminal-ink` | `#cfccc4` | `#cfccc4` |
| `--terminal-strong` | `#f3efe6` | `#f3efe6` |
| `--seal-blank` | `#1b1b1d` | `#ebe7dd` |
| `--seal-blank-deep` | `#151516` | `#e4e0d5` |
| `--seal-blank-ring` | `#242426` | `#f6f3ec` |
| `--seal-blank-owl` | `#2c2c2f` | `#d6d1c4` |
| `--seal-blank-ground` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` |
| `--seal-blank-edge` | `inset 0 0 0 1px var(--seal-blank-ring)` | `inset 0 0 0 1px var(--seal-blank-ring)` |
| `--seal-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--seal-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
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
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `2px` | `2px` |
| `--shape-waiting` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-waiting-fill` | `path("M5.5 8a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z")` | `path("M5.5 8a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z")` |
| `--shape-working` | `none` | `none` |
| `--shape-working-fill` | `none` | `none` |
| `--shape-working-track` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-working-turn` | `path("M8 2.4A5.6 5.6 0 0 1 13.6 8")` | `path("M8 2.4A5.6 5.6 0 0 1 13.6 8")` |
| `--shape-finished` | `path("M2.6 7.2a5.6 5.6 0 0 0 10.8 0")` | `path("M2.6 7.2a5.6 5.6 0 0 0 10.8 0")` |
| `--shape-finished-fill` | `none` | `none` |
| `--shape-no-agent` | `path("M12.9 9.7A5.6 5.6 0 0 1 6.3 3.1 5.6 5.6 0 1 0 12.9 9.7z")` | `path("M12.9 9.7A5.6 5.6 0 0 1 6.3 3.1 5.6 5.6 0 1 0 12.9 9.7z")` |
| `--shape-no-agent-fill` | `none` | `none` |
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
| `--seal-blank` | `#292624` | `#ebe2ce` |
| `--seal-blank-deep` | `#23201e` | `#e6dcc6` |
| `--seal-blank-ring` | `#312d2a` | `#f4eddd` |
| `--seal-blank-owl` | `#3b3632` | `#d9ccb2` |
| `--seal-blank-ground` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` |
| `--seal-blank-edge` | `inset 0 0 0 1px var(--seal-blank-ring)` | `inset 0 0 0 1px var(--seal-blank-ring)` |
| `--seal-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--seal-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
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
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `0` | `0` |
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
| `--state-failed` | `#dba545` | `#8f550b` |
| `--state-failed-fill` | `var(--state-failed)` | `var(--state-failed)` |
| `--added` | `#a3b47c` | `#4f6b2a` |
| `--removed` | `#aea697` | `#564d43` |
| `--terminal-ground` | `#151312` | `#1c1815` |
| `--terminal-ink` | `#d6cfc1` | `#d8cfbd` |
| `--terminal-strong` | `#f6ecd8` | `#f6ecd8` |
| `--seal-blank` | `#292624` | `#ebe2ce` |
| `--seal-blank-deep` | `#23201e` | `#e6dcc6` |
| `--seal-blank-ring` | `#312d2a` | `#f4eddd` |
| `--seal-blank-owl` | `#3b3632` | `#d9ccb2` |
| `--seal-blank-ground` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` |
| `--seal-blank-edge` | `inset 0 0 0 1px var(--seal-blank-ring)` | `inset 0 0 0 1px var(--seal-blank-ring)` |
| `--seal-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--seal-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
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
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `2px` | `2px` |
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
| 아이콘 단추 | 바탕 없이 `--ink-muted`의 아이콘입니다. | `--hover` 위에 `--ink`의 아이콘입니다. | `--pressed` | 켜는 것이 켜져 있으면 아이콘이 `--ink-strong`입니다. | 고리입니다. | 세기가 45%가 됩니다. |
| 작업함의 줄 | 바탕이 없고 `--radius-line`과 `--line-edge`입니다. 제목은 `--ink`이고, 사람이 마지막으로 본 뒤에 작업이 바뀌었으면 더 굵은 `--ink-strong`입니다. 지난 시간과 개수는 `--font-fact`와 `--ink-faint`입니다. | `--hover`이고, 아무것도 선택하지 않습니다. | `--pressed` | `--selected`와 `--line-edge-selected`입니다. 포인터 아래에서도 바탕을 지킵니다. 지난 시간은 `--ink-muted`입니다. 옅은 잉크는 선택한 바탕에서 도드라지지 않기 때문입니다. | 고리입니다. | — |
| 사이드바의 항목 | 바탕이 없고 `--radius-line`입니다. | `--hover` | `--pressed` | 앞에 있는 것의 항목이 `--selected`와 `--selected-edge`입니다. 그 항목의 지난 시간과 개수는 `--ink-muted`입니다. | 고리입니다. | — |
| 묶음의 머리 | 묶음의 이름은 `--ink-muted`, 개수는 `--ink-faint`와 `--font-fact`이고, `--group-ground` 위에 `--group-edge`입니다. | — | — | — | — | — |
| 기록 목록의 행: 커밋, 바뀐 파일, 작업 화면의 사실 | 바탕이 없고 `--line-edge`입니다. | — | — | — | — | — |
| 메뉴 | `--ground-raised` 위의 카드이고 `--radius-card`, `--card-edge`, `--dialog-shadow`입니다. 항목은 `--radius-line`이고, 메뉴의 다른 부분이 시작하는 곳에 괘선이 있습니다. | 항목이 `--hover`입니다. | 항목이 `--pressed`입니다. | 하위 메뉴가 열린 항목은 포인터 아래의 항목처럼 그립니다. | 키보드가 놓인 항목은 포인터 아래의 항목처럼 그리고, 고리는 없습니다. | — |
| 대화 상자 | `--backdrop` 위에 놓인 `--ground-raised`의 카드이고 `--radius-card`, `--card-edge`, `--dialog-shadow`입니다. 머리는 무엇을 하는지 말하고, 글은 무슨 일이 일어날지 말하며, 단추는 오른쪽 아래에 있고 주 단추가 마지막입니다. | — | — | — | — | — |
| 입력 칸 | `--ground-sunken`에 `--field-edge`와 `--radius-control`이고, 글자는 `--ink-strong`입니다. 무엇을 넣을지 알리는 글자는 입력하기 전까지 `--ink-faint`입니다. | — | — | — | 고리입니다. | 시스템이 입력을 받지 않는 칸을 그리는 대로입니다. |
| 터미널 칸의 탭 | 이름표가 `--ink-muted`이고 닫는 표시가 `--ink-faint`입니다. 터미널 칸이 무대에 있는 탭은 두 모양 모두에서 어두운 `--terminal-ground` 위에 서고, 이름표와 닫는 표시가 `--terminal-ink`입니다. | `--hover` | — | 키보드를 가진 터미널 칸의 탭, 곧 앞에 있는 탭은 `--tab-edge`를 갖고 이름표가 더 굵은 `--terminal-strong`입니다. | 고리입니다. 터미널 칸이 무대에 있는 탭에서는 고리가 `--terminal-strong`입니다. | — |
| 검색에 맞은 글자 | 글자 아래가 `--mark`이고 글자는 `--ink-strong`이며, `--mark-edge`와 `--radius-mark`입니다. | — | — | — | — | — |
| 상태 표시 | 그 상태에 대한 테마의 형태를 상태의 색으로, 16px 너비로 그립니다. 표시는 포인터와 화면 낭독기에 자기 문구를 말합니다. 일하는 중인 표시의 도는 부분은 1.1초에 한 바퀴 돕니다. | — | — | — | — | — |
| 에이전트가 한 말 | `--said-ground`에 `--said-edge`와 `--radius-said`이고, 글자는 `--font-said`와 `--ink-strong`입니다. 작업에 사람이 필요하면 가장자리가 `--said-edge-waiting`입니다. | — | — | — | — | — |
| 인장의 자리 | 인장이 찍히기 전: 줄에서는 `--seal-blank-ground`의 원판에 `--seal-blank-edge`이고, 미리 보는 칸과 작업 화면의 아래쪽에서는 인장의 그림이 빈 자리의 색조로 `--seal-blank-light` 아래 바탕에 눌려 있습니다. 인장이 찍힌 뒤: 그려진 그대로의 인장이 `--seal-light` 아래에 있습니다. | — | — | — | — | — |
| 승인 줄 | 네 역할을 framer, crafter, proofer, sealer 순서로 두고, 역할마다 어디까지 왔는지의 표시를 두며, 형태는 「테마」가 그 테마에 정한 것입니다. sealer의 자리에 인장이 들어갑니다. | — | — | — | — | — |

앱은 아직 승인 줄과 빛이 든 인장을 그리지 않습니다. 인장을 찍을 수 있는 작업이 아직 없기 때문입니다. 인장을 만드는 마일스톤이 둘을 위의 형태로 그립니다. 깨진 인장의 그림은 그 마일스톤의 일입니다.

## 창의 문구가 가진 말투

어느 테마도 문구를 바꾸지 않습니다. 창은 서기의 메모처럼 말합니다. 지금 어떠한지와 무슨 일이 일어날지를 말하고, 판단은 읽는 사람에게 둡니다. 창의 문구는 영어이므로 아래 예는 영어 그대로 적습니다.

- **대상을 이름으로 부르는 온전한 문장.** "A delete removes the work item's worktree and its local branch, and takes the work item off Owlery's lists." 부분의 이름표는 명사이고, 단추는 그것이 하는 일입니다. "Open the work item"이라고 쓰고, "OK"나 "Yes"라고 쓰지 않습니다.
- **잃을 것은 잃기 전에 말하고, 잃지 않을 것도 말합니다.** "Nothing on a remote is removed."
- **인장의 사실은 사실로 말합니다.** "A seal binds to one commit and breaks if another lands after it."
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
6. **이 창이 한때 가졌던 여덟 가지 표시.** 푸른 슬레이트 바탕에 호박색과 하늘색 강조. Inter, Space Grotesk, JetBrains Mono. 글자 사이를 벌린 대문자 이름표. 68px 줄과 44px 단추 위의 30px 제목. 빈 미리 보는 칸. 모든 것에 8px 모서리 하나와 1px 가장자리 하나, 그리고 인장 자리의 점선 원. 신호등 단추 아래에 따로 둔 로고의 줄. 포인터 반응도, 움직임도, 상태의 아이콘도 없는 것. 2026-11-19의 조사가 이것들을 짚었고, 지금 창에는 하나도 없습니다.
7. **파는 말.** "Magic", "supercharge", "100x", 느낌표, 에이전트가 일인칭으로 건네는 인사, 이름표의 이모지입니다. Orca의 첫 페이지는 "Ship 100x with the agent IDE"로 시작하고, [product.ko.md](product.ko.md)는 처리량을 내세우는 문구를 쓰지 않습니다.

### 가장 가까운 제품들의 방식

| 제품 | 출처 | 그 페이지가 그리는 것 | Owlery가 가져오지 않는 것 |
|---|---|---|---|
| Orca | `https://www.orca.dev/` | 차가운 검정에 가까운 바탕, 흰 그로테스크 머리글, 알약 모양 탭의 띠입니다. 앱은 줄마다 에이전트의 로고가 붙은 worktree의 나무, 칸마다 프롬프트 입력 상자가 있는 나뉜 채팅 칸, 사용량 계기가 늘어선 상태 막대입니다. | 줄의 아이콘으로 쓰는 에이전트의 상표 로고, 프롬프트 입력 상자, 계기의 막대, 속도를 내세우는 말입니다. |
| Conductor | `https://www.conductor.build/` | 픽셀 별과 ASCII 그림이 깔린 검은 바탕, 픽셀 로고입니다. 앱은 작업 공간의 사이드바, 가운데의 대화 기록, 그리고 초록 "Merge" 단추 아래에 바뀐 파일과 초록과 빨강의 수가 있는 오른쪽 단입니다. 사이드바에 팀 사람들의 둥근 사진이 있습니다. | 픽셀과 ASCII 장식, 병합의 초록 단추, 사람의 사진입니다. 커밋과 바뀐 파일을 둔 오른쪽 단은 창의 것과 가깝습니다. 그래서 창의 오른쪽 단은 승인 줄과 아래쪽의 인장으로 구분됩니다. |
| Linear | `https://linear.app/` | 검정에 가까운 무채색 바탕, 촘촘한 그로테스크, 첫 문장은 희고 나머지는 회색인 머리글, 글자 사이를 벌린 고정폭 대문자의 설명, 등각 투영의 가는 선으로 그린 그림입니다. | 두 색조의 머리글, 글자 사이를 벌린 대문자, 가는 선의 그림입니다. |
| Cursor | `https://cursor.com/` | 크림색 잉크의 따뜻한 검정에 가까운 바탕, 풍경 유화 위에 떠 있는 앱의 창, 링크의 주황색, 알약 모양 단추입니다. | 창 뒤의 그림, 주황색입니다. 따뜻한 바탕과 크림색 잉크는 Desk의 어두운 모양과 가깝습니다. |
| Claude Code의 데스크톱 앱 | `https://code.claude.com/docs/en/desktop` | 문서 페이지입니다. 따뜻한 어두운 바탕, 세리프로 쓴 페이지 제목, 선택한 항목과 제목 위의 줄에 쓰는 테라코타 주황색, 불꽃 로고, "Ask Assistant"의 반짝이입니다. | 주황색, 불꽃, 반짝이입니다. 따뜻한 바탕 위의 세리프 제목은 Desk의 밝은 모양의 세리프 제목과 가깝고, Desk와 Register에서 에이전트가 한 말에 쓰는 세리프와도 가깝습니다. |

이웃 제품은 두 무리로 갈립니다. Orca, Conductor, Linear는 무채색 검정에 그로테스크로 그립니다. Night watch는 그 바탕에 서되, 그 페이지들이 그리지 않는 눈의 노란색과 눈 표시를 갖습니다. Cursor와 Claude는 따뜻한 검정에 크림색으로 그리고, Desk가 거기에 섭니다. 열어 본 어느 페이지도 괘선을 친 대장, 승인 줄, 인장을 그리지 않습니다.

## 창을 바꾸는 PR은 스크린샷을 싣습니다

창을 바꾸는 PR은 바꾼 화면마다 스크린샷을 싣습니다. Night watch의 어두운 모양과 밝은 모양으로 싣고, 바뀐 부분을 다르게 그리는 다른 테마로도 싣습니다. 리뷰는 스크린샷을 이 문서에 대어 읽습니다. 형태는 「부분과 그 상태」에, 값은 「토큰」에, 문구는 「창의 문구가 가진 말투」에, 전체는 「원칙」과 「피하는 것」에 대어 읽습니다. 스크린샷은 빌드한 앱에서 만들고, 화면은 작업함, 작업 화면, 메뉴, 대화 상자입니다.

**스크린샷은 `apps/desktop`에서 `pnpm run screenshots`를 실행해 만듭니다.** 이 명령은 앱을 빌드해 백그라운드로 띄우므로, 창은 실행한 사람의 키보드도 포인터도 가져가지 않습니다. 앱은 지어낸 작업 네 개가 있는 임시 저장소에서 열립니다. 하나는 사람이 필요하고, 하나는 일하는 중이고, 하나는 끝났고, 하나는 잠들어 있습니다. 작업 화면에 뜨는 작업은 사람이 필요한 작업이고, 거기서 물은 프롬프트 하나는 실패해 있습니다. 그래서 스크린샷에는 모든 상태의 표시와 문구가 나옵니다. 에이전트는 실행하지 않습니다. 패널의 프로세스는 픽스처이고, 상태는 실행이 데몬에 알려 준 값입니다. 명령은 Night watch의 두 모양마다 네 화면을 창 크기인 1440 x 900의 PNG 파일로 하나씩 씁니다. 파일은 여덟 개이고 이름은 `<theme>-<appearance>-<view>.png`입니다. `OWLERY_SCREENSHOT_THEMES`로 테마를 더합니다. `all`이면 모든 테마이고, `register,desk`처럼 쉼표로 이름을 이어 적을 수도 있습니다. 파일은 `apps/desktop/screenshots/` 아래, 실행을 시작한 시각을 이름으로 한 폴더에 들어가고, git은 이 폴더를 무시합니다. `OWLERY_SCREENSHOT_DIR`에 폴더를 적으면 그 폴더에 들어갑니다.
check: apps/desktop/test/screenshots.test.ts

**파일은 변경과 함께 커밋하고, PR 본문은 파일마다 `![보여 주는 것](../blob/<commit>/<path>?raw=true)`로 보여 줍니다.** 파일은 `seal/threads/` 아래 그 PR의 기록에 커밋합니다. `<commit>`은 파일이 든 커밋의 전체 ID이고, `<path>`는 저장소 루트에서 본 파일의 경로입니다. GitHub는 이 링크를 PR의 주소에서부터 읽습니다. GitHub 문서가 PR에서 저장소의 이미지를 보일 때 쓰라고 적은 형식이 이것입니다. `images/inbox.png`처럼 트리의 Markdown 파일이 이미지를 거는 방식으로 적은 경로는 PR 본문에서 그려지지 않습니다. 링크에는 브랜치가 아닌 커밋을 적습니다. 그래야 그 뒤에 브랜치에 무엇이 올라와도 본문이 그 커밋에서 만든 이미지를 보여 줍니다.

PR이 "창을 바꾸는지"를 정하는 게이트는 없습니다. 그것은 뜻을 따지는 판단이고, 리뷰가 맡습니다.
