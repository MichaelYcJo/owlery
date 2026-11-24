# Closing memo: 1795497941-night-watch-marks-as-moons

## Not verified

| Item | Who must answer |
|---|---|
| Phase 1: the broad gate, `pnpm -r run check` and the two editions' counts, over `cb5eae0`. Phase 1 ran `test/theme-controls.test.ts` and `test/themes.test.ts` alone | the orchestrator, at the broad gate |
| Phase 1: the test files that start the built app and draw a mark, `test/approval-line.test.ts`, `test/ask-section.test.ts`, `test/get-a-seal.test.ts`, `test/navigation.test.ts`, `test/appearance.test.ts` and `test/screenshots.test.ts`. Each was read, and none reads a mark's shape: the first three read its class and its label. None was run, since another work item's build may run on this machine and built-app files run one at a time | the orchestrator, at the broad gate |
| closed phase 1: whether the five marks read apart at a glance at 16px in the built app, in both appearances, and whether the thin filled edge of the asleep mark stays apart from its outline on a display of one device pixel to a CSS pixel (`frame/plan.md` *Technical context*, the failure scenario). The case holds the filled widths, and no case can hold a reading | phase 2's crafter read the screenshots at `1bbe951` (`trail/phases/phase-2.md`): the five marks differ in shape in both appearances. By the paths the filled edge touches the outline at every density, and it reads as a ring heavier at its right. What no screenshot of this machine answers stands in the phase 2 rows that follow |
| Phase 2: whether a person reads each of the five marks apart at a glance and a finished place as done (`frame/design.md` scenario 8). The crafter's reading of the screenshots is in `trail/phases/phase-2.md`, and no case can hold a reading | the proofer, reading the screenshots at review, then the owner on the pull request |
| Phase 2: how a screen of one device pixel to a CSS pixel draws the asleep mark's inner curve. The screenshots were drawn at density 2 and scaled to one pixel per CSS pixel by the capture (`apps/desktop/test/screenshots.test.ts:427-431`), and this machine's three displays are each of density 2 | the owner, on a screen of density 1, on the pull request |
| Phase 2: in the light appearance the filled part of each moon is drawn in the state's colour, which is darker than the light ground, so read as moons the marks are reversed: the half moon's filled half is its dark half, and a finished work item is a dark disc, which reads as a new moon when seen alone (`trail/phases/phase-2.md`, the paragraph on the light appearance; `trail/rounds/round-1.md`, finding 2) | the owner, on the pull request |
| Phase 2: the broad gate over `ff9d4af` and `1bbe951`. Phase 2 ran `test/screenshots.test.ts`, `test/records-dialog.test.ts` and `test/korean-input.test.ts` alone | the orchestrator, at the broad gate |

## Not done

nothing
