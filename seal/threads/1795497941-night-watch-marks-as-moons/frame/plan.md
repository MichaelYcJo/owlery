# Implementation Plan: Night watch marks as phases of the moon

## Technical context

The tree as read at `523a5fb`.

A state's mark is drawn in three layers, and this work changes the first alone.

- **The theme's block names the shapes.** `apps/desktop/src/renderer/themes.css:138-149` and `253-264` hold Night watch's `--shape-*` properties for the dark and the light appearance, each a `path("…")` on a square of 16 units or `none`.
- **The page gives each part its shape.** `apps/desktop/src/renderer/index.html:117-128` maps a state's class to four parts. `line` is drawn as a line of 1.5px, `fill` is filled, `track` is a line at 28% of its strength, and `turn` is a line that goes round once in 1.1s. A part whose property is `none` draws nothing.
- **One function builds the mark.** `apps/desktop/src/renderer/shared.ts:228` (`iconOf`) builds the same four `path` elements for every state, and every place that draws a mark calls it (`frame/design.md` *Grounding*, the second table).

So a new form of a Night watch mark is a new value of a property in two blocks, and the inbox line, the sidebar, the summary, the approval line and a headless session's line all draw it with no change of their own.

Two cases constrain the change. `apps/desktop/test/themes.test.ts:447` holds each token row of `docs/design.md` and `docs/design.ko.md` to the style sheet's value, so the style sheet and both editions change in one commit. `apps/desktop/test/themes.test.ts:307` holds that each state of each block has a part that is not `none`.

The failure scenario of the chosen approach. The three moons differ by how much of one disc is filled, and the thin filled edge of the mark of a work item asleep is about 2px wide inside its outline at 16px. On a display of one device pixel to a CSS pixel that edge may merge with the outline, and the mark then reads as an empty ring. An empty ring is still told from the half moon, the full moon, the eye and the triangle, so the mark loses its thin moon and not its meaning. The second risk is the working mark, which no longer moves in Night watch: a person who read the motion as a sign that an agent is alive now reads it from the half moon and the word "Working" alone. `frame/questions.md` Q2 holds the form that keeps a part that turns, and it is a change of two values.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep the structure: the four parts of a mark and the `--shape-*` properties, with new values in Night watch's two blocks | A later form that needs a fifth part, such as a filled part that turns, cannot be said in a block and waits on a change of the page | Chosen. The premise that keeps the structure is that the four parts can draw every form this work proposes. It was checked: each moon is a `line` and a `fill` or a `fill` alone (`frame/design.md` *Data & interfaces*), and the probe drew them with those two parts (`frame/design.md` *Grounding*, the probe) |
| Replace the structure: one property that holds how full the moon is, and a page that draws the moon from it | The page then holds a moon, which is Night watch's form, and Register's boxes and Desk's tick need a second way to be drawn beside it. *Principles* 5 of `docs/design.md` and the case at `apps/desktop/test/themes.test.ts:433` refuse a page that draws one theme's form | Rejected. It buys a moon at any fullness, and this work needs three fixed ones |
| Keep the eye for every state and redraw the closed eye alone, as a lid with lashes or a ticked eye | The owner read the marks as moons from the start (issue #183), so a redrawn lid beside a crescent is still read as a moon | Rejected for the issue's direction |
| Draw all five states as moons: a wait as a full moon in yellow with a halo, a failure as an eclipsed moon | A wait and a finished work item then share the full disc and differ by a ring and a colour, which strains *Principles* 4. The eye, the theme's idea and its one signal (*Principles* 3), leaves the window | Not the default. `frame/questions.md` Q3 and Q5 hold them for the owner |
| The mark of a work item asleep as a thin crescent alone, with no outline of its disc | The probe drew it: a sliver under 3px wide at the right of its box, off the centre of the line, and the weakest mark on a line | Rejected for the ring with a thin filled edge. `frame/questions.md` Q1 names it |
| The mark of a work item asleep as the outline alone, a new moon | Nothing of it is filled, so the thin moon the issue names is not drawn, and the mark is a plain ring | Not the default. `frame/questions.md` Q1 holds it |
| The working mark as a half moon with a part that turns round its unfilled half | The probe drew it at 16px, still: the arc and the half's straight edge crowd one another, and it was the least clear mark of its set. The probe did not draw it in motion | Not the default. `frame/questions.md` Q2 holds it |
| A brighter colour for the full moon | A finished line then stands out more than a working one, and nearer to the yellow that says a work item needs the person. Each new colour also meets the contrast cases of `apps/desktop/test/themes.test.ts` on a selected ground | Not the default. `frame/questions.md` Q4 holds it |
| State the changed rows in `frame/design.md` *Rule changes* and leave them to the settle | The style sheet changes in this pull request and the token rows do not, so the case at `apps/desktop/test/themes.test.ts:447` fails, and the row "A state's marks" says the closed eye for a release whose window draws a full moon | Rejected. `docs/design.md` *Principles* 8 and *Tokens* name the pull request as the writer |

## Phases

Each phase ends with the narrow runs its *Verified by* cell names, run from `apps/desktop`, one file at a time, with `OWLERY_BACKGROUND=1` set on each run that starts the app. The broad gate is the orchestrator's.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | The moons, their case and the document, in one commit: `frame/design.md` *Scope* items 1 to 5. The assertions of item 5 are written first and shown red against the style sheet as it stands | Scenarios 1, 2 and 3 by `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/theme-controls.test.ts`. Scenarios 4 and 5 by `node scripts/test-in-electron.mjs test/themes.test.ts`. Scenario 6 by the search of `frame/design.md` *Grounding* with `HEAD` in place of `523a5fb`, which prints nothing once *Scope* items 1 to 4 have changed each line that *Grounding* lists as printed at `523a5fb`; it excludes this work item's directory. Scenario 7 by the two `grep -c` counts on both editions | `cb5eae0` |
| 2 | The screenshots, the version and the changelog fragment: `frame/design.md` *Scope* items 6 and 7 | `OWLERY_BACKGROUND=1 OWLERY_SCREENSHOT_DIR=<the repository's absolute path>/seal/threads/1795497941-night-watch-marks-as-moons/screenshots pnpm run screenshots` exits 0 and writes a file named `night-watch-<appearance>-<view>.png` for each view of `apps/desktop/test/screenshots.ts#VIEWS` in the dark and the light appearance. The crafter reads the inbox's and the view's files in both appearances for scenario 8 and says in the phase record what it saw. Scenario 9 by its `git grep` | `1bbe951` |

## Overlap with the release

The spawn names five other open work items of release 0.0.3. Issues #182 and #146 are not started and hold a `routing.md` or nothing on their branches. Issue #181's frame is being written and none is committed (`feat/181-a-claude-code-pane-carries-none-of-owlerys-chain` at `38a1dd0` holds its `routing.md` alone). Issue #160's frame was read on its branch at `10eef9f`.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #181, the pane carries Owlery's chain (routed at `38a1dd0`, no frame committed) | `apps/desktop/package.json`, whose version this work moves and every later pull request of the release builds on. `docs/design.md` and `docs/design.ko.md`: by its issue it removes "Get a seal" from a view's foot, which the row "The seal's place" of *Components and their states* states, and this work changes *Principles* 1, the row "A state's marks" and Night watch's token rows, so the two change different lines of one file. Its screenshots draw the marks this work changes | #183 | This work is the smaller diff and carries the version move, which `docs/roadmap.md` *Releases and the tracker* gives to the first pull request into the release branch. Merged first, it puts the moons under #181's build, so the screenshots #181 takes for its own review already show them and none is taken twice |
| #160, accounts per repository (framed at `10eef9f`) | Its phase 2 is verified in `apps/desktop/test/screenshots.test.ts`, and its pull request carries screenshots that draw the marks. Its `add` on `docs/design.md` *Components and their states* is a last row of a table this work does not touch, written at the settle. Its frame says "This pull request does not move the version" | #183 | It is not built yet, and its phases close well after this work's. Merged first, this work's row "A state's marks" is the one #160's review reads its screenshots against |
| #182, an interrupted turn leaves its session working (routed, not started) | No file, by its issue: it changes how the daemon takes a session's state (`apps/desktop/src/daemon/agent-state.ts`). Should its frame add a state to the window, that state needs a shape in every block (`apps/desktop/test/themes.test.ts:307`) and takes its Night watch form from the row this work writes | #183 | The version move, and the row a new state's form would be read against |
| #146, this repository's own pull request check (not started) | No file. It changes which check judges a pull request of this repository, and this work's pull request is judged by the check in force when it opens | #183 | The version move. Nothing of this frame changes for the check |
| #176, the backticks in a broken seal's sentence (the owner's, built by hand after #181) | Its pull request carries screenshots of a broken work item's view in every theme and appearance, which draw the marks. By its issue it changes how a sentence is drawn at a view's foot and in the approval line, and no shape | #183 | Its issue puts it after #181, which merges after this work |

## Operational impact

- **This pull request moves the version to 0.0.3.** `apps/desktop/package.json` line 3, `"version": "0.0.2"`, becomes `"version": "0.0.3"`. That line is the one place the version is written: `apps/desktop/build.mjs` reads it and hands it to the daemon as `OWLERY_VERSION`, and `pnpm-lock.yaml` holds no version of the workspace's own package. The move belongs to phase 2, in the commit that adds `changelog.md`, and the fragment's last bullet says "The desktop app's version is 0.0.3.", as the fragment of the pull request that moved it to 0.0.2 did (`git show e4df264:seal/threads/1795268298-desktop-suite-in-ci/changelog.md`, executed).
- **Constants of the suite that hold `0.0.2` do not follow the move.** `apps/desktop/test/chain-run.ts:35` (`VERSION`) and the `rules: owlery 0.0.2` lines of the record cases are values the cases hand to the code under test, and none is read from `package.json`. `apps/desktop/test/records-dialog.test.ts:66` reads the version from `package.json` and follows the move by itself.
- **A workflow the built app writes into a connected repository names the tag `v0.0.3` from this merge on**, since the daemon writes the app's version into it (`apps/desktop/build.mjs:8`). That tag exists once release 0.0.3 is tagged. The same held for 0.0.2 between its first pull request and its tag.
- **No migration, no new environment variable and no new dependency.** A saved `appearance.json` names a theme and an appearance and no shape, so a person in Night watch sees the moons at the first start of the new build.
- **A person in Night watch loses the motion of the working mark.** The changelog fragment says so, with the three new forms.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-24 | The rounds stop after round 2; the fix pass of round 2's finding 1 is read by the sealer, not by a third round. | Round 2's one finding is the same wording class as round 1's finding 1, and every place it names is a record of the work item (`frame/questions.md`, `gaps.md`, `trail/phases/phase-1.md`), so the fix touches no code, no test and no policy document. A third round would cost close to a finding round to read a wording sweep the sealer reads whole at HEAD anyway. | The plugin's `skills/core/SKILL.md` *Judgment is not licence to skip a party*, the row *No fix that no round reads*; `skills/code-review/orchestration.md` *Orchestrator: the run ends with a verifying round* |
