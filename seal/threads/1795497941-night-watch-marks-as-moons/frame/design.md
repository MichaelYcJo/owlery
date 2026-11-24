# Design: Night watch marks as phases of the moon

## Grounding

The tree as read at `523a5fb`.

Issue #183 was read whole on 2026-11-24 with `gh issue view 183 --json title,body,comments` (executed). Its one comment, the owner's of 2026-11-24, moves the issue to `release: 0.0.3` and changes nothing of the request.

`routing.md` stands in the work item's directory. `seal/follow-up.md` does not exist, so no waiting item joins this scope. `docs/README.md`, the index `skills/settle/rule-changes.md` *The index* names, does not exist either, and this design writes no operation that would pick a `file:` from it. `seal/parity.json` is not declared.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/design.md` *The themes*, the row "A state's marks", Night watch's cell (line 51) | The rule this work replaces: "The owl's eye. An open eye with its pupil needs the person. A ring that turns is at work. A closed eye is finished. A crescent is asleep. A filled triangle is a failure". `docs/design.ko.md` line 51 says the same. |
| `docs/design.md` *Tokens*, opening paragraph, with `check: apps/desktop/test/themes.test.ts` | "A change of a value changes this document, its Korean edition and the style sheet in one commit." The case at `apps/desktop/test/themes.test.ts:447` holds every token row of both editions to the value `themes.css` holds. So the token rows are written in this pull request, in the commit that changes the style sheet, and cannot wait for the settle. |
| `docs/design.md` *Principles* 8 | "The pull request that draws the form writes its row, in both editions of this document, and leaves none to the release's settle." The row "A state's marks" is the form of the marks, so this pull request writes it. The issue's second *Done when* line asks the same. |
| `docs/design.md` *Principles* 1 | "The owl is drawn where a seal is, and in Night watch as the eye of a state's mark, and nowhere else in the window." After this work the eye is the mark of a wait alone, so the sentence changes with the row (contract rule 19). |
| `docs/design.md` *Principles* 3, and *The themes*, the rows "The idea" and "The signal" | Night watch's one signal is the eye's yellow, on what needs the person. This is the ground for keeping the eye as the mark of a wait (*Scope*, out of scope, first item). |
| `docs/design.md` *Principles* 4 | A state is said by a shape, a colour and words, and no state is told from another by colour alone. A wait and a failure share the yellow and differ by shape. So each of the five marks must differ from the other four in shape. |
| `docs/design.md` *Principles* 5, with the case at `apps/desktop/test/themes.test.ts:433` | No selector of the page and no module of the renderer names a theme. So the moons are values of Night watch's blocks in `themes.css` and nothing else. |
| `docs/design.md` *Principles* 7 | A full circle draws a state's mark, so a full moon is a form the principles already allow. |
| `docs/design.md` *Principles* 9, with the case at `apps/desktop/test/themes.test.ts:341` | A state's mark stands at 3 to 1 or more against the ground around it. This work changes no colour, so every mark keeps the contrast it has. |
| `docs/design.md` *Components and their states*, the row "A state's mark" | "The theme's shapes for the state, in the state's colour, 16px wide." The moons are judged at 16px. Its sentence on the part that turns stays true of Desk, and stood while Register had no such part. |
| `docs/design.md` *Components and their states*, the row "The approval line" | A place not started takes the mark of a work item asleep, a place at work the mark of work, and a finished one the finished mark. So the approval line, the inbox line and the sidebar draw one set of marks, and the issue's three places are served by one change. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | The pull request carries a screenshot of each view it changed in Night watch's dark and light appearances, made by `pnpm run screenshots` in `apps/desktop` and committed under the work item's directory. The scene shows the mark of every state and an approval line with a finished place, a place at work and two not started. |
| `docs/roadmap.md` *Releases and the tracker* (line 49) | "The first of those pull requests moves the version." This work item carries the move to 0.0.3. |
| `seal/config.json`, the key `Broad gate` | The gate refuses `docs/design.md` and `docs/design.ko.md` where their counts of lines that begin with `#` or with `\|` differ. At `523a5fb` each edition holds 15 and 379 (executed: `grep -c '^#'` and `grep -c '^\|'` on both files). This work adds and removes no heading and no table row. |

What the code holds.

| Fact | Coordinate | Label |
|---|---|---|
| A mark is one `svg` of four `path` parts, `line`, `fill`, `track` and `turn`, built for every state by one function, which the inbox line, the sidebar's item, the summary's line, the state's words and a headless session's line all call | `apps/desktop/src/renderer/shared.ts:221-241` (`MARK_PARTS`, `iconOf`), called from `shared.ts:250-262`, `list.ts:145`, `sidebar.ts:110`, `summary.ts:74`, `work-item-view.ts:706`, `781` and `966` | read |
| The page gives each part its shape from the theme's `--shape-*` properties. The `line` part is drawn as a line of 1.5px in the state's colour. The `fill` part is filled in the state's colour, or for a wait and a failure in `--state-<state>-fill`. Only the working state reads `--shape-working-track` and `--shape-working-turn` | `apps/desktop/src/renderer/index.html:110` and `117-128` | read |
| Night watch's dark and light blocks hold the same shape values but for `--shape-failed`. The closed eye is `--shape-finished`, a lower arc. The crescent is `--shape-no-agent`, an outline | `apps/desktop/src/renderer/themes.css:138-149` and `253-264` | read |
| Desk draws the same outlined crescent for a work item asleep, and a ticked circle for a finished one | `apps/desktop/src/renderer/themes.css:604-606` and `719-721` | read |
| `--state-finished` and `--state-no-agent` hold one colour in Night watch, `#908e87` in the dark appearance and `#62605c` in the light. `--state-working` is `#dcd9d1` and `#26262a` | `apps/desktop/src/renderer/themes.css:84-86` and `207-209` | read |
| The built-app case that reads the drawn marks pins Night watch's wait as a line with a fill, and the fill's colour in the light appearance as `#e9b61a`. No case pins a Night watch form of any other state, and no case pins that Night watch's working mark turns | `apps/desktop/test/theme-controls.test.ts:215-280`; `git grep -n -i -e 'turn' -- apps/desktop/test` (executed) | read, executed |
| The app's version stands in one place, and the build reads it from there alone | `apps/desktop/package.json:3`, `"version": "0.0.2"`; `apps/desktop/build.mjs:8-9` and `27` | read |
| The move from 0.0.1 to 0.0.2 changed that one line and no other file for the version | `git show --stat e4df264` (executed) | executed |

The probe. The proposed shapes were drawn beside the shapes that stand, in both appearances, at 16px, at 32px and enlarged, with the values of *Data & interfaces* and the colours of the two Night watch blocks (executed: a script wrote `test_tmp_marks.svg` and `test_tmp_marks2.svg` under the framer's scratch directory, and `qlmanage -t` drew each to a PNG file, which was read). The drawing is of the paths alone and not of the built app. It showed four things.

- At 16px the closed eye and the outlined crescent that stand are both a thin grey arc, which is the defect the issue reports.
- A thin crescent drawn alone, with no outline of its disc, is a sliver of under 3px at the right of its box. It stands off the centre of the line and is the weakest of the five marks.
- A dark disc's outline with a thin lit edge, a half moon inside the same outline, and a full disc differ in shape from one another at 16px, and from the eye and the triangle.
- A full disc of radius 5.6 is smaller than the eye, whose line reaches 6.35 from the centre. A full disc of radius 6.35 is the eye's size.

The search of scenario 6 was run at `523a5fb` (executed):

```
git grep -n -e 'closed eye' -e '감은 눈' -e 'M2.6 7.2a5.6' -e 'eye marks' -e 'eye of a state' -e '상태 표시의 눈' 523a5fb -- . ':!seal/threads/1795497941-night-watch-marks-as-moons'
```

It printed nine lines: `apps/desktop/src/renderer/themes.css:144` and `259`, `docs/design.md:11`, `51`, `227` and `497`, and `docs/design.ko.md:11`, `51` and `227`. *Scope* items 1 to 4 change each of them so that the search no longer matches it.

## Scope

In scope.

1. **Night watch draws how far work has come as how full the moon is.** In both Night watch blocks of `apps/desktop/src/renderer/themes.css` the marks of a work item asleep, at work and finished take the values of *Data & interfaces*. Asleep, which the approval line draws for a place not started, is a ring with a thin filled edge at its right. At work is a half-filled disc inside the same outline, filled at its right, and it does not turn. Finished is a wholly filled disc and no line. The filled part is the `fill` part, in the state's colour, so in the light appearance it is the darker part. No colour changes.
2. **The row "A state's marks" states the new forms, in both editions.** Night watch's cell of that row in `docs/design.md` *The themes* and `docs/design.ko.md` *테마* takes the text of *Data & interfaces*.
3. **The token rows follow the style sheet, in both editions.** The rows of the changed properties in `docs/design.md` *Night watch* and `docs/design.ko.md` *Night watch* take the new values, in the commit that changes the style sheet.
4. **The sentences that call every Night watch mark an eye are corrected.** `docs/design.md` *Principles* 1 and `docs/design.ko.md` *원칙* 1 take the phrases of *Data & interfaces*. In `docs/design.md` *The patterns of the nearest products*, the closing paragraph, "the eye marks" becomes "the eye mark". The Korean edition's paragraph says "눈 표시", which reads as one mark or several, and stays.
5. **A case holds the rule.** The built-app case of `apps/desktop/test/theme-controls.test.ts` that reads each state's drawn mark also holds, for Night watch, that the filled part grows wider from asleep through at work to finished, and that the finished mark is a filled part as wide as it is tall with no line, no track and no part that turns.
6. **The screenshots are taken again.** `pnpm run screenshots` writes the files of Night watch's dark and light appearances into `seal/threads/1795497941-night-watch-marks-as-moons/screenshots/`, and they are committed there.
7. **The version moves to 0.0.3.** `apps/desktop/package.json` line 3 names it, and the work item's `changelog.md` says so.

Out of scope.

- **The mark of a wait stays the owl's eye.** The issue's first *Done when* line says the five marks "are redrawn". The eye's yellow is the theme's one signal (*Principles* 3) and the theme's idea (*The themes*, "The idea"), and the defect the issue reports is between finished and not started. The probe shows the eye differs in shape from each moon. `frame/questions.md` Q3 holds the other form.
- **The mark of a failure stays the filled triangle.** A failure is no step of how far work has come, so it is no phase, and the triangle is the failure's shape in every theme. `frame/questions.md` Q5 holds the other form.
- **Desk keeps its crescent for a work item asleep.** The issue names Night watch and no report names Desk. Desk's finished mark is a closed circle with a tick (`apps/desktop/src/renderer/themes.css:604`), which is no arc. The probe did not draw Desk, so that the two Desk marks stand apart at 16px is read from their paths and not seen.
- **No colour changes.** The full moon takes `--state-finished` as it stands, so no contrast pin moves. `frame/questions.md` Q4 holds the brighter one.
- **The page and the renderer's modules do not change.** The four parts of a mark draw every form of item 1 (`apps/desktop/src/renderer/index.html:117-128`), and *Principles* 5 keeps a theme's form out of the page.
- **No crop or enlargement of the marks is added to the screenshot command.** The owner judges the marks on the screenshots the command already makes.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The fuller the moon, the further the work | Given the built app in Night watch. When the page draws the marks of a work item asleep, at work and finished. Then the filled part of each is wider than the filled part of the one before | The case of *Scope* item 5 in `apps/desktop/test/theme-controls.test.ts`, shown red against the style sheet as it stands before the values change |
| 2. Finished is a whole disc | Given the same page. When it draws the finished mark. Then the filled part is as wide as it is tall, and the `line`, `track` and `turn` parts draw nothing | The same case |
| 3. A drawn mark is the theme's | Given the built app in Night watch, Register and Desk. When the page draws each state's mark. Then each part is the shape the theme's block names, and Night watch's wait is still a line with a fill, in `#e9b61a` in the light appearance | The standing assertions of the same case, which this work leaves as they are |
| 4. The document says what the style sheet holds | Given the changed blocks. When the token rows of both editions are read. Then each names the value the style sheet holds | `apps/desktop/test/themes.test.ts`, the case "names every property of every block" |
| 5. Every state still has a mark, and every mark still stands apart from its ground | Given the changed blocks. Then each state of each block has a part that is not `none`, and each state's colour stands at 3 to 1 or more against the grounds around it | `apps/desktop/test/themes.test.ts`, the cases "holds a mark for every state in every block" and "draws every state's mark at 3 to 1 or more" |
| 6. Nothing still says the closed eye | Given the built tree. When the search of *Grounding* is run with `HEAD` in place of `523a5fb`. Then it prints nothing | The search. Each line it printed at `523a5fb` is listed in *Grounding* and changed by *Scope* items 1 to 4. It excludes this work item's directory, whose frame quotes its patterns |
| 7. The two editions keep their shape | Given the changed documents. Then `docs/design.md` and `docs/design.ko.md` hold equal counts of lines that begin with `#` and of lines that begin with `\|` | `grep -c '^#'` and `grep -c '^\|'` on both files, each pair equal, as the broad gate reads them |
| 8. No mark reads as another, and finished reads as done | Given the screenshots of *Scope* item 6. When a person reads the inbox, the sidebar and the approval line in both appearances. Then each of the five marks is told from the other four at a glance, and a finished place reads as done | The proofer reads the committed screenshots against the row "A state's marks", and the owner judges them on the pull request. No case can hold a reading |
| 9. The version is 0.0.3 | Given the built tree. Then `apps/desktop/package.json` names 0.0.3 | `git grep -n '"version"' -- apps/desktop/package.json` prints line 3 with `0.0.3` |

## Data & interfaces

No protocol, no stored file and no module changes. The interface is the custom properties of the two Night watch blocks, `:root[data-theme="night-watch"][data-appearance="dark"]` and `:root[data-theme="night-watch"][data-appearance="light"]` in `apps/desktop/src/renderer/themes.css`. Each property below takes one value in both blocks.

| Property | Value at `523a5fb` | Value after |
|---|---|---|
| `--shape-working` | `none` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-working-fill` | `none` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6z")` |
| `--shape-working-track` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `none` |
| `--shape-working-turn` | `path("M8 2.4A5.6 5.6 0 0 1 13.6 8")` | `none` |
| `--shape-finished` | `path("M2.6 7.2a5.6 5.6 0 0 0 10.8 0")` | `none` |
| `--shape-finished-fill` | `none` | `path("M1.65 8a6.35 6.35 0 1 0 12.7 0a6.35 6.35 0 1 0-12.7 0z")` |
| `--shape-no-agent` | `path("M12.9 9.7A5.6 5.6 0 0 1 6.3 3.1 5.6 5.6 0 1 0 12.9 9.7z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-no-agent-fill` | `none` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6A7 7 0 0 0 8 2.4z")` |

`--shape-waiting`, `--shape-waiting-fill`, `--shape-failed`, `--shape-failed-fill` and every `--state-*` property keep their values. The token rows of the table's properties in both editions of the design document take the values of the last column, in both of a row's cells.

The text of Night watch's cell of the row "A state's marks".

- `docs/design.md`: "The phases of the moon, and the owl's eye. A moon is a disc filled as far as work has come, so how far work has come reads as how full the moon is. A ring with a thin filled edge at its right is asleep. A half-filled disc is at work, and it does not turn. A wholly filled disc is finished. The fill is the state's colour, so in the light appearance the filled part is the darker one, and a finished work item is a dark disc. An open eye with its pupil needs the person. A filled triangle is a failure, and in the light appearance a line of the darkened yellow stands around it, because the bright fill alone does not stand apart from the ground."
- `docs/design.ko.md`: "달의 위상과 올빼미의 눈입니다. 달은 일이 나아간 만큼 채워지는 원판이므로, 일이 얼마나 나아갔는지가 달이 얼마나 찼는지로 읽힙니다. 오른쪽 가장자리만 가늘게 채운 고리는 잠든 것입니다. 반을 채운 원판은 일하는 중이고, 돌지 않습니다. 다 채운 원판은 끝났다는 뜻입니다. 채우는 색은 상태의 색이므로, 밝은 모양에서는 채운 쪽이 더 어둡고, 끝난 작업은 어두운 원판입니다. 눈동자가 있는 뜬 눈은 사람이 필요하다는 뜻입니다. 채운 세모는 실패입니다. 밝은 모양에서는 세모 둘레에 어둡게 한 노란색의 선이 있습니다. 밝은 노란색으로 채우기만 하면 바탕에서 도드라지지 않기 때문입니다."

The phrase of *Principles* 1.

- `docs/design.md`: "and in Night watch as the eye of a state's mark" becomes "and in Night watch as the eye of the mark of a wait".
- `docs/design.ko.md`: "Night watch에서는 상태 표시의 눈으로 그리며" becomes "Night watch에서는 기다리는 표시의 눈으로 그리며".

## Rule changes

- nothing
  why: This pull request writes the changed rows and sentences into `docs/design.md` and `docs/design.ko.md` directly, as *Principles* 8 and the opening paragraph of *Tokens* of that document require of a pull request that draws a form or changes a token's value, and as the case at `apps/desktop/test/themes.test.ts:447` holds. It moves no section and no document, and the one unsettled design that names the document, issue #160's, adds a last row to the table of *Components and their states*, which this work does not touch, so no operation is re-pointed.

## Removes

This work adds assertions to one standing case of `apps/desktop/test/theme-controls.test.ts` and adds no case, no gate, no rule and no mark of the process. Nothing goes in return for the assertions, because no standing assertion pins a Night watch form of a state other than a wait, so none is made a copy.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The closed eye, as the mark of a finished work item in Night watch | `apps/desktop/src/renderer/themes.css`, the value of `--shape-finished` in the two Night watch blocks (lines 144 and 259 at `523a5fb`) | The full moon of *Scope* item 1. The closed eye is the mark the issue reports as read for a half moon |
| The outlined crescent, as Night watch's mark of a work item asleep | The same file, the value of `--shape-no-agent` in the two Night watch blocks (lines 146 and 261). Desk's two blocks keep the same value | The ring with a thin filled edge of *Scope* item 1 |
| The ring that turns, as Night watch's mark of work | The same file, the values of `--shape-working-track` and `--shape-working-turn` in the two Night watch blocks (lines 142-143 and 257-258). The properties stay, as `none`, since Desk draws with them | The half moon of *Scope* item 1. `frame/questions.md` Q2 holds the form that keeps a part that turns |
| The sentences that say the closed eye, the crescent and the ring of Night watch, and that every Night watch mark is an eye | `docs/design.md` *The themes*, the row "A state's marks", Night watch's cell; *Principles* 1; *The patterns of the nearest products*, the closing paragraph; and the same places of `docs/design.ko.md` but for that paragraph | The texts of *Data & interfaces* and of *Scope* item 4 |
| The old values in the token rows | `docs/design.md` *Night watch* and `docs/design.ko.md` *Night watch*, the rows of the properties *Data & interfaces* lists (lines 223-230 of each at `523a5fb`) | The new values, in the same rows |

Framed 2026-11-24 by framer, before the build.
