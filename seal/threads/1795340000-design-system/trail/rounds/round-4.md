# Review round 4: 1795340000-design-system

```seal
target: 105c835, fixes 0fd93a8..105c835
```

This is a verifying round. It answers the two findings round 3 closed, both `fixed 9ee7239`, and reads the fix diff `0fd93a8..105c835` for anything new. The diff is two commits. `9ee7239` changes one line in each of `docs/design.md`, `docs/design.ko.md`, `changelog.md`, `frame/design.md` and `pr.md`, and adds one row to `frame/plan.md`. `105c835` appends round 3's two close blocks and changes nothing else. No code changed (executed: `git diff --quiet bf984af HEAD -- apps` exited 0).

The round read the work item's records whole at `105c835`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` stands, because `Commit and pull request language` is English. No `seal/parity.json` is declared. The phase records, `gaps.md`, `routing.md` and `frame/questions.md` are unchanged since `bf984af` (executed: `git diff --stat bf984af HEAD` on those paths printed nothing). So round 3's reading of the phase records is carried.

Carried from round 3, not established again: the values of `themes.css`, which is unchanged since `bfb25f2` (executed: `git diff --quiet bfb25f2 HEAD -- apps/desktop/src/renderer/themes.css` exited 0); the contrast numbers of round 3's probe `test_tmp_lasting_and_disabled.py`, read from its saved output; and where "Ask" stands and when it is disabled (`apps/desktop/src/renderer/index.html:575`, `apps/desktop/src/renderer/work-item-view.ts:619`). No verdict of round 3 was carried.

The code was cloned with `git clone --no-local` at `105c835` into the round's scratch directory. The branch's work tree holds only this record as a change.

## Findings

None. Both closes hold, and the fix diff adds no defect.

## Confirmations

```seal
confirms: round-3#1
```
What holds: the two editions of principle 9 now exempt the same parts. `docs/design.md:19` ends "A disabled button, which the window draws at 45% of its strength, is outside them too." `docs/design.ko.md:19` ends "쓸 수 없어 세기의 45%로 그리는 단추에도 이 기준을 적용하지 않습니다." The English clause between the commas says every disabled button is drawn at 45%, and the tree agrees. Executed: `git grep -n -e opacity -e ':disabled' -e '[disabled' -- apps/desktop/src/renderer` found one rule at 45%, `button:disabled { opacity: 0.45; }` (`index.html:70`), and it covers every `button` element. The icon buttons at the sidebar's foot that hold a `select` are `label` elements (`index.html:461`, `:471`, `:475`, `:479`). Executed: `git grep -n -e '.disabled = '` over the renderer's modules finds no line that disables one of them. So under both editions a disabled field and the label of a disabled check stay inside the floor. That is round 3's finding. The rows *A button*, *The main button* and *An icon's button* of *Components and their states* (`docs/design.md:425` to `:427`, `docs/design.ko.md:425` to `:427`) each give the disabled state as 45% of its strength, which agrees with the principle. `frame/design.md:93`, *Contrast*, names the same exemption in the principle's words. `frame/plan.md:86` records the narrowing, and its claim that a disabled button is "the one part the window draws at 45%" holds by the search above. Executed: `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts` in `apps/desktop` of the clone passed 16 cases. That run shows the token case still reads both editions after the change at line 19. No case reads the principle's own words, as round 3 found.

```seal
confirms: round-3#2
```
What holds: `pr.md:16` and `changelog.md:7` now each say four things are outside the floor, and each lists four. They are a disabled button, the ground drawn only while a part is pressed, the menu's item under the keyboard, and the edges of fields and buttons. These match principle 9's two exemptions and the two other things the floor leaves out. Both name "Ask" while its field is empty as the example. `changelog.md:7` gives the disabled button's contrast as "2.5 to 4.3 to 1". Read from round 3's saved probe output: the lowest value was 2.54, a quiet button's `--ink` on `--control` at 45% over Register light's window, and the highest was 4.27, the main button's `--on-main` on `--main` at 45% over Night watch dark's card. Rounded, those give 2.5 and 4.3. The values carry because `themes.css` and `index.html` are unchanged since the probe ran. The close's answer puts the figure beside "Ask" for both files. Only `changelog.md` carries the figure, and `pr.md` does not. That is no defect, because neither file has to carry it.

What matched: the fix diff's one new unit, the row `frame/plan.md:86`. It says the orchestrator made the word fixes itself and that round 4 reads them. `9ee7239`'s six files are the ones round 3's two findings name. `frame/plan.md:84` and `:85` still say "a disabled part". They are dated records of the judgments round 2 made, as round 3 noted. Row 86 records the narrowing below them, so the table does not state the old wording as a present decision.

What matched: the records read whole against the target. Outside the lines `9ee7239` changed, the target contradicts no sentence. The owner's quote in `pr.md` stands word for word in `frame/questions.md` row Q1. Executed: `git grep -c -F` of the quote printed 1 for each file. `pr.md` holds no line other than `:16` that the fix diff changed. So its sixteen image links and their blobs, which round 3 checked, carry: `apps/` and `screenshots/` are unchanged since `bf984af`.

What matched: the suite's label. `gaps.md` still labels the whole suite, the typecheck and the `Broad gate` command unverified, with the orchestrator named. Neither fix commit's message claims a run. The label is honest.

`gaps.md` *Not done* (`gaps.md:34` to `:36`) has a row for three of the four things `pr.md:16` names: the pressed ground, the menu's item and the edges. It has no row for the disabled button. No sentence of `gaps.md` claims that list is complete, so the target contradicts nothing and this round opens no finding. Whether to add a row is the orchestrator's call. Round 3's *Not judged* row on a disabled `select` covered the case where finding 1's fix was worded to include a field. The fix names a button alone, so that row no longer applies.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether GitHub draws the sixteen `../blob/<commit>/<path>?raw=true` images in the pull request, and after a squash merge. | `gaps.md` *Not verified* | the orchestrator, once the pull request is open |
| The whole suite, the typecheck and the `Broad gate` command. This round ran one test file narrowly. Contract rule 2 keeps the broad gate the orchestrator's. This round leaves no finding open, so the orchestrator's broad run comes next, then the sealer's spawn. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate; then the sealer's spawn |

## Probes

| Command | Result |
|---|---|
| `git diff --quiet bf984af HEAD -- apps` and `git diff --quiet bfb25f2 HEAD -- apps/desktop/src/renderer/themes.css` | Both exited 0 |
| `git diff --stat bf984af HEAD -- trail/phases gaps.md routing.md frame/questions.md` of the work item | Printed nothing |
| `git grep -n -e opacity -e ':disabled' -e '[disabled' -- apps/desktop/src/renderer` | One rule at 45%, `index.html:70` `button:disabled`. The other matches are `opacity: 0` on the select inside an icon button (`:107`), the track of the working mark at 0.28 (`:122`), a disabled check's label in `--ink-faint` (`:377`), and the pane menu's hover (`:416`) |
| `git grep -n -e '.disabled = ' -e 'disabled:' -- 'apps/desktop/src/renderer/*.ts'` | 21 lines. Each disables a button, a field or a check, and none disables a `select` of the sidebar's foot |
| `git grep -c -F` of the owner's quote at HEAD in `frame/questions.md` and `pr.md` | 1 in each |
| `pnpm install --frozen-lockfile --prefer-offline` in the clone, then `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts` in `apps/desktop` | 1 file passed, 16 cases, exit 0 |
