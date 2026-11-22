# Phase 4: 1795340000-design-system

## What this phase found

### Whether the frame holds

The frame holds for this phase, with one sentence of `frame/questions.md` that the source it rests on contradicts. Each coordinate `frame/plan.md` *Technical context* gives for the command was opened at `bf08c81` and stands. `apps/desktop/package.json` holds the three scripts that run one test file under a variable. `apps/desktop/test/built-app.ts` starts the built app with `OWLERY_BACKGROUND` set to `1` unless its caller asks otherwise. `apps/desktop/vitest.config.ts` puts a test file that imports `buildApp` among the files that run one at a time. `docs/design.md` *A pull request that changes the window carries its screenshots* names no command, in both editions.

Row Q2 of `frame/questions.md` says that a relative link is one "which GitHub does not resolve in a pull request's body". GitHub's documentation gives a relative link as the form for exactly that place, and the decision below follows the documentation.

### Decisions

Each was judged against `frame/design.md` *Scope* item 9 and the row "A pull request that changes the window shows it" of its *User scenarios & acceptance*, and against `docs/design.md` *A pull request that changes the window carries its screenshots*.

- **Q2: the body shows a committed image as `![…](../blob/<commit>/<path>?raw=true)`.** GitHub's *Basic writing and formatting syntax*, under *Images*, says to use relative links for an image of the repository, and its table gives `../blob/main/assets/images/electrocat.png?raw=true` for "issues, pull requests and comments of the repository". Read on 2026-11-22 from the page's source in `github/docs`, kept as `gh-docs.md` in this phase's scratch directory. The rule writes the full id of the commit where the documentation's example writes a branch, so the body shows the image made at the commit the review reads. The link resolves from the pull request's own address to the same file as the frame's default, the file at its commit by the repository's address, so the default's target stands and its spelling changes. The row's Status cell still reads `open`: the crafter does not write `frame/questions.md`.
- **The rule does not say that the image outlasts the merge.** A first draft of the paragraph gave that as the reason for naming a commit. Nothing this phase opened says what GitHub keeps of a squashed branch's commits, so the sentence left the document and the question is a row of `gaps.md`.
- **The command is `pnpm run screenshots`, under `OWLERY_SCREENSHOTS`.** The file is `apps/desktop/test/screenshots.test.ts`. Without the variable it is six cases of the run's own functions and starts no app, as `test/memory.test.ts` is without its variable. With it, those cases are skipped and the one case of the run is taken.
- **Night watch is always captured, and `OWLERY_SCREENSHOT_THEMES` adds themes.** Its value is `all`, or names with commas between them. The theme that is always captured is read from `lookChoice`, which answers the first run's theme, and is not written a second time. A name that is no theme's fails the run and names the themes, so a mistyped name does not pass as a run that captured it.
- **The folder is named by the run's start.** Without `OWLERY_SCREENSHOT_DIR` the files go into `apps/desktop/screenshots/<start>`, with the start in UTC as `20261122T113728Z`, and `.gitignore` gains that folder. With the variable they go into the folder it names, which is how phase 5 writes into the work item's directory. A file is named `<theme>-<appearance>-<view>.png`.
- **A file is 1440 by 900 on a screen of any density.** `Page.captureScreenshot` takes a clip of the window's size with a scale of one over the page's `devicePixelRatio`. On this Mac the ratio is 2, and a capture without the scale is 2880 by 1800. The eight files of Night watch weigh 0.77 MB together and the twenty-four of every theme 2.4 MB, inside what `frame/plan.md` *Technical context* counts.
- **The run asserts two things of what it wrote.** Each file's header gives the window's size, and no two files of a run hold the same bytes. A view that was not brought to the front, or a theme the page did not take, writes the bytes of the file before it.
- **The four views are the inbox, the view of the last work item made, that work item's menu from its line in the sidebar, and the "New work item" form with a name typed in it.** The menu and the form are drawn over the inbox. The app opens on a temporary repository with three work items, whose names are invented examples.
- **The pane's process is a new fixture, `apps/desktop/test/fixtures/sample-pane.sh`.** The receiver of the other built-app files prints nothing, and a view's screenshot would show an empty terminal. The fixture prints eight invented lines in the terminal's red, green, yellow, blue, bold and faint, and then waits.
- **The pointer is moved to the window's corner and 300 ms pass before each capture.** A click leaves the pointer on what it clicked, which then draws in its hover form, and the layout's one motion is 120 ms.
- **The page's focus is emulated.** The app starts in the background, and a page without the system's focus draws as a window a person has left.
- **The command prints the folder through `process.stdout`.** The suite's runner shows nothing a case hands to `console.log`, as `test/memory.test.ts` already notes.
- **`check: apps/desktop/test/screenshots.test.ts` stands under the paragraph that names the command**, in both editions. The paragraph on the link has no check line: no case can hold what GitHub draws, and review reads it.
- **The line of `gaps.md` *Not done* that said the section names no command is removed.** It was a decision of phase 1 that this phase carried out, and HEAD contradicts it.

### Seen red, and the breaks

The helper module `apps/desktop/test/screenshots.ts` and its cases were written together, and the cases were first run green. Each unit has its red from `seal mutate`. Every break below was red, and none survived.

| File | Breaks | Cases |
|---|---|---|
| `apps/desktop/test/screenshots.ts`, at `3a46a79` | `all` answered with the first run's theme alone; the first run's theme left out; a name that is no theme's let through; a name with a space before it not trimmed; a file's name without its appearance; an empty `OWLERY_SCREENSHOT_DIR` taken as a folder; the folder's name with its milliseconds; a relative folder not resolved; a PNG file's length not read; its header's name not read; its signature not read; its width and height turned over; the light appearance left out | the six cases of `test/screenshots.test.ts` that run without the variable |
| `apps/desktop/test/screenshots.test.ts`, at `3a46a79` | the capture's scale set to 1; the step that brings a view to the front removed; the choice of an appearance removed | the run, `pnpm run screenshots` |

The four breaks of a refusal were then run alone and the failure of each was read. The name let through failed in "refuses a name that is no theme's, and names it" with `expected [Function] to throw an error`. The length not read failed with the range error of the read in place of the refusal's own words. The header's name and the signature each failed in the PNG case with `expected [Function] to throw an error`. The case of the signature was added after the first commit, because the case as first written held a missing signature by the header's check alone, and a break of the signature's check would have survived.

The three breaks of the run were each run alone. The scale failed at the assertion on the size, with `2880` by `1800` where it expects `1440` by `900`. The missing step failed at the assertion on distinct files with 4 of 8, and the missing choice of an appearance with 5 of 8.

### What only trying showed

- **Two captures of one screen do not always hold the same bytes.** With the choice of an appearance removed, 5 of 8 files were distinct and not 4. The run asserts that the files differ, never that two are equal, so this does not reach it.
- **The run takes 7 seconds for Night watch and 16 seconds for every theme**, the build among them.
- **A view and the form show the path of the system's temporary folder**, as `/private/var/folders/…/owlery-work-items-…/worktrees/project/…`. The path is the machine's and differs at each run.
- **Every work item of the run has no agent.** Each line carries the mark and the words of that one state, and the summary of commits and changes is empty.

### Runs

- Executed, at `8405c02` with a clean tree: `OWLERY_BACKGROUND=1 pnpm run test test/screenshots.test.ts test/themes.test.ts test/korean-input.test.ts` in `apps/desktop`. Three files, 49 cases passed and 2 were skipped, the run of the screenshots among the skipped. This is the phase's set: the file the phase added, `themes.test.ts`, which reads `docs/design.md` and `docs/design.ko.md`, and `korean-input.test.ts`, which reads `apps/desktop/package.json`. A search of `apps/desktop/test` for `package.json`, `gitignore`, `design.`, `sample-pane` and `./screenshots` found no other file that reads a path this phase changed, and `trail/phases/phase-3.md` *Runs* found no test file that reads the whole tree.
- Executed, at `3a46a79` with a clean tree: `pnpm run screenshots` in `apps/desktop`, with no other variable set. It exited 0 and wrote eight files into `apps/desktop/screenshots/20261122T113728Z`, the four views in Night watch's two appearances. The folder was removed after its listing was read.
- Executed, on the tree of `8405c02` before its commit: `OWLERY_SCREENSHOT_DIR=<scratch>/shots-print pnpm run screenshots`. It exited 0, wrote eight files and printed `8 screenshots in` with the folder.
- Executed, on the tree of `6082001` before its commit: `OWLERY_SCREENSHOT_THEMES=all OWLERY_SCREENSHOT_DIR=<scratch>/shots-all pnpm run screenshots`. It exited 0 and wrote twenty-four files, the four views in each appearance of each theme. Four of them were opened and read as images: Night watch's dark view, Night watch's light menu, Register's light form and Desk's dark inbox. Each shows the screen its name says, in that theme and appearance. The two later commits changed one case of the functions and the line that prints the folder.
- Executed, at `8405c02`: the loop of the `Broad gate` command over `docs/*.md` and `README.md`, typed alone, exited 0. `docs/design.md` and `docs/design.ko.md` each hold 15 headings and 363 table lines. `git grep -n -e '도장' -- docs README.md README.ko.md` printed nothing and exited 1.
- Executed, before each commit: `pnpm exec tsc --noEmit` in `apps/desktop`, exit 0. The repository configures no linter and no formatter.

### What the next phases need

- Phase 5 makes this pull request's screenshots with `OWLERY_SCREENSHOT_THEMES=all OWLERY_SCREENSHOT_DIR=<the work item's directory> pnpm run screenshots`, at its own commit. The run writes twenty-four files, and `frame/design.md` *Scope* item 9 names sixteen of them for this pull request: the inbox and the view in every theme and appearance, and the menu and the form in Night watch.
- The command's screens show one state's mark. Four rows of `gaps.md` *Not verified* name phase 5's screenshots as what shows the marks and the forms of the other states. Phase 5 either brings work items in those states onto the command's screens or answers those rows another way.
- The pull request's body links each image as `docs/design.md` now states, with the full id of the commit that holds the files.

Phase 4 closed at `8405c02`.
