# Phase 5: 1795340000-design-system

## What this phase found

### Whether the frame holds

The frame holds for this phase, with one clause of the plan's row that cannot be met as written. Each coordinate `frame/design.md` *Removes* and `frame/plan.md` *Technical context* give for this phase was opened at `3e4461a` and stands: `STATE_SHAPES` in `apps/desktop/src/renderer/shared.ts` with the comment over it, the comment over `.state-icon` in the page's style, and the two texts in `apps/desktop/src/renderer/view.ts`. Every block of `themes.css` holds the twelve `--shape-*` properties and the two fills, as `trail/phases/phase-2.md` says.

`frame/plan.md` *Phases* row 5 asks for the case that every block defines a shape for each state "seen red with one shape removed". Phase 2 wrote the shapes into the blocks, so the case was green when it was first run. Its red comes from `seal mutate`, below. The case of the page was red against the tree as it stood.

No value of `docs/design.md` *Tokens* had to change. Every mark is drawn from the shapes phase 1 wrote.

### Decisions

Each was judged against `frame/design.md` *Scope* items 7 and 8, its *The words* and its *Removes*, and against `docs/design.md` *Tokens*, *Components and their states* and *A pull request that changes the window carries its screenshots*.

- **A mark is four paths with no shape of their own, and the page's style gives each its shape.** The module makes a `line`, a `fill`, a `track` and a `turn` for every state. The rule of a state's class names the theme's properties for that state, and a path takes its shape through the `d` property. `docs/design.md` *Tokens* names those four parts, and the framer's probe showed that a path takes its shape from a custom property in the app's Electron. No module holds a shape of a state.
- **A part a state does not name draws nothing.** The mark sets each part to `none` for itself, and its state's class sets the parts the state has over that. A mark therefore takes no shape from a parent that stands in another state.
- **The filled part has no line.** It is filled in the state's colour, and for a wait and a failure in `--state-waiting-fill` and `--state-failed-fill`, which `docs/design.md` *Tokens* names as "the fill of the mark of a wait and of a failure". `frame/images/mock.html` draws its filled parts without a line too.
- **A notification's body is the state's heading.** `notificationFor` asks `stateHeading` for the words where it held the two texts itself, so the waiting state's words stand in one place.
- **Two texts changed and no other.** The sentence that counts the states in the inbox's head still says "1 waiting for you", the bell's words say "waiting for you", a change's sentence says "No agent is running." and the status line says "Daemon running, no agent". `frame/design.md` *The words* names a line's state, a group's head, the state with its age, a notification's body and the strip under a view's panes, and says that every other sentence stays.
- **`icon` lost the two forms that only `STATE_SHAPES` used**: a path with a class, and a class on a circle. Nothing else passed either.
- **A case of the built app reads the marks.** The plan's row names the two text files. A case of `apps/desktop/test/themes.test.ts` can hold that the style names a property and not that a path is drawn with it, so `apps/desktop/test/theme-controls.test.ts` has a fifth case. It reads each part of each state's mark as the engine drew it and compares it with what the engine reads back for the theme's own property, in Night watch's light appearance, Register and Desk. The mark of the state the case's work item is in is the line's own. The marks of the other four states are copies of it under each state's class.
- **The states the suite reads are the classes the page's style colours.** The case of the blocks takes its list of states from the rules `.state.<state>` of the page and holds it equal to the five, so a state the page gains has to gain its shapes.
- **The screenshot run shows every state without an agent.** It makes four work items. Three have a Claude Code pane whose process is the fixture `apps/desktop/test/fixtures/sample-pane.sh`, and the run feeds the daemon's hook socket for each, as `apps/desktop/test/notification-click.test.ts` does: a notification with a question, a tool's start, and a turn's end with a sentence. The fourth has a shell and no agent. The failure is a headless session's: the fixture names a new stand-in for the CLI, `apps/desktop/test/fixtures/sample-cli.sh`, which fails every prompt, and the run asks one prompt in the shown work item's view. The run also commits twice in that work item's worktree, so the summary and the view show commits and changed files.
- **The run replaces the page's `Notification`.** A pane that comes to wait or to finish behind another raises one, and the run would have put two on the system's screen.
- **`docs/design.md` says what the run now shows**, in both editions, where it said "three invented work items".
- **Sixteen of the run's twenty-four files are committed**, under `screenshots/`: the inbox and the view in each appearance of Night watch, Register and Desk, and the menu and the form in Night watch's two. They are the ones `frame/design.md` *Scope* item 9 names. The menu and the form in Register and Desk were written and removed.

### Seen red, and the breaks

The cases of the two texts in `apps/desktop/test/view.test.ts` were changed first and run against the code of `3e4461a`: 10 of 381 failed, each with "Needs you" or "Asleep" expected and the earlier text received. The case "draws a state's mark from the theme" of `themes.test.ts` was run before the page read a shape, and failed with the twelve shapes and the two fills as the names its style does not read.

The case of the blocks, the case of the built app and the case of `notification-click.test.ts` on the notification's body were first run green, so each has its red from `seal mutate`. Every break below was red at the last run.

| File | Breaks | Cases |
|---|---|---|
| `src/renderer/themes.css`, at `7a9e4b3` | the one shape of Night watch's failure in the dark set to `none`; a shape written as `circle(5.6px)`; a property `--shape-broken` added | `themes.test.ts`, "holds a mark for every state" |
| `src/renderer/index.html`, at `7a9e4b3` | the finished state reading the working state's shape; a failure's fill reading the state's colour; the class of the finished state renamed; the part that turns given no shape | `themes.test.ts`, the two cases of the marks |
| `src/renderer/view.ts`, at `7a9e4b3` | each of the two texts set back; a waiting notification saying the finished state's words; a finished one saying the working state's | `view.test.ts` |
| `src/renderer/view.ts`, at `7a9e4b3` | "Needs you" set back | `notification-click.test.ts` |
| `src/renderer/index.html`, on the tree of `6dad20d` before its commit | the line's shape not given; the fill in the state's colour; the part that turns reading the track's shape; a work item with no agent reading the finished state's shape; a wait's filled part set to `none`; the track reading the shape of the part that turns | `theme-controls.test.ts`, the case of the marks |
| `src/renderer/shared.ts`, on the tree of `6dad20d` before its commit | a mark made without the part that turns; a mark made without the class `state` | the same case |

One break survived its first run. A mark made without the class `state` passed the case of the built app, because the case wrote the classes of every mark it read. The case now reads the line's own mark for the state its work item is in, and the break is red (`6dad20d`).

Fourteen breaks were then run alone and the failing line of each was read. The shape set to `none` failed at the last assertion of the blocks' case with `night-watch dark failed`, the shape that is no path at the assertion before it with `night-watch dark --shape-waiting`, and the added property at the one before that with `night-watch dark --shape-broken`. The three breaks of the page's reads failed in the page's case with the one name the style no longer reads, and the renamed class failed at the blocks' case's list of states, with `done` where it expects `finished`. In the built app the missing shape failed with `none` where the theme gives the eye's ring, the fill with `rgb(138, 100, 0)` where the theme gives `rgb(233, 182, 26)`, and the missing class with `none` where the theme gives the crescent. The mark made without its fourth part failed by an error of the page's script and not by an assertion: the case asks the style of a part that is not there. The two breaks of the notification failed in the cases of `notificationFor`, and the text set back failed in `notification-click.test.ts` with "Waiting for you" received.

No break was run against the screenshot run. Its new steps wait for a state, for two commits and for a failed prompt, and each wait fails the run where its step did nothing.

### What only trying showed

- **A Claude Code pane takes any process.** The daemon starts it as `$SHELL -l -i -c "exec claude …"`, so with `SHELL` set to a fixture the pane runs the fixture and `claude` is never looked for on a path.
- **A pane's commits reach the page within the daemon's three seconds.** The run waits for them and asserts nothing of the time.
- **The changed files of a view are the branch's against its base.** A file changed and not committed in the worktree did not show, so the run commits both files.
- **`seal mutate` needs text that stands once in the file, and a block's shapes are the same lines in its dark and its light appearance.** The breaks of `themes.css` start from the comment over the first block's shapes, which stands once.
- **The run takes 20 seconds for every theme.**

### What the screenshots show

The sixteen files were made at `6dad20d` and each was opened and read as an image, with two parts enlarged: the marks of the inbox in Night watch's light appearance, and the right column of a view in Register's light appearance. Every file shows the four states in the inbox's groups and in the sidebar, each with its mark and its words: "Needs you", "Working", "Finished" and "Asleep". Each view shows the failure's mark beside the asked prompt. The seal's place is blank in every file, which is the one state of a seal the app has.

- **Night watch reads as `docs/design.md` *The themes* describes it.** The ground is black and the ink warm white in the dark appearance, and turned over in the light one, with no serif and no texture. The yellow stands on the waiting mark and its words, on the left edge of what the agent asks and on the failure, and on nothing else. The marks are an open eye with its pupil, a ring, a closed eye, a crescent and a filled triangle. A line is a tile with no edge, the selected one is tinted, and the main button is filled in the ink. In the light appearance the eye's ring is the dark yellow and its pupil the lighter one, and enlarged the mark still reads as an eye.
- **Register reads as described, but for one form.** Corners are square, a rule stands under each line of the inbox, a group's head is a band on the sidebar's ground, the selected line and the selected item carry the strong rule at their left, ages and hashes are in the fixed-width face, what the agent asks stands between two rules in the serif, the tab in front carries a rule along its top, and the light appearance has the ruled paper in a view's right column and serif titles. The marks are a filled box, a half-filled box, a ticked box, an empty box and the triangle with its stroke. **The rows of the commits and of the changed files carry no rule**, in the summary and in a view, where *The themes* gives Register "a rule under each line and each row of a list" and `frame/images/mock.html` rules those rows. The document is right and the window lacks the rule: the page gives `--line-edge` to a line of a list alone. It is a row of `gaps.md` *Not done*.
- **Desk reads as described.** The dark appearance is the warm ground with cream ink, and the light one the paper with serif titles and the ink-blue main button. What the agent asks is a raised card in the serif. The marks are a filled disc, a ring, a ticked circle, a crescent and the triangle with its stroke.
- **One thing reads against *The voice of the window's words* in every theme.** The inbox's head says "1 waiting for you, 1 working, 1 finished" over a group headed "Needs you", so one screen has two wordings of one state. The frame keeps that sentence, and it is a row of `gaps.md` *Not done*.
- **What the files do not show.** The keyboard's focus stands on a field in the form and never on a button, so the row of `gaps.md` on Night watch's focus ring is not answered by them. Read from the style, that ring has the main button's own colour and is drawn inside its edge. The part of the working mark that turns is still in a file. A view and the form show the path of the system's temporary folder.

### Runs

- Executed, at `6dad20d` with a clean tree: `OWLERY_BACKGROUND=1 pnpm run test` in `apps/desktop` over 16 test files, in one command. 15 passed and one was skipped, `role-session.test.ts`, which runs nothing without its variable. 557 cases passed and 3 were skipped. The set is the five test files the phase changed and every other file that starts the built app, reads `index.html`, or imports `view.ts`. The thirteen files of the set that import `buildApp` ran one at a time, as `vitest.config.ts` orders them. `trail/phases/phase-3.md` *Runs* found no test file that reads the whole tree.
- Executed, at `6dad20d` with a clean tree: `OWLERY_SCREENSHOT_THEMES=all OWLERY_SCREENSHOT_DIR=<the work item's directory>/screenshots pnpm run screenshots` in `apps/desktop`. It exited 0 and wrote twenty-four files of 1440 by 900, no two with the same bytes.
- Executed, at `6c89129`, which changed a comment in `shared.ts` and one in `themes.test.ts` after the run above: `pnpm exec tsc --noEmit`, exit 0, and `OWLERY_BACKGROUND=1 pnpm run test test/themes.test.ts test/theme-controls.test.ts`, whose second file builds the app from the tree. 18 cases passed.
- Executed, before each commit: `pnpm exec tsc --noEmit` in `apps/desktop`, exit 0. The repository configures no linter and no formatter.
- Executed: `git grep -n -i -e speech -e STATE_SHAPES -e StateShape -- apps/desktop/src apps/desktop/test` printed nothing, and a search of the same paths for `bubble` found the five `bubbles: true` of dispatched events alone. The search can fail: at `3e4461a` it finds six lines, the two comments among them.
- Executed: `seal unverified` on the worktree exits with "the record could not be read" at `seal/threads/1795328774-lightness-is-measured-not-capped/gaps.md:7`, another work item's file, before it reads this work item's memo. This phase did not open that file.

Phase 5 closed at `6c89129`.
