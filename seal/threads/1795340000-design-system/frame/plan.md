# Implementation Plan: 1795340000-design-system

This plan names what the build does once the owner has chosen a direction (`questions.md` row Q1). The framer folds the answer into `design.md` and into the phases below before the first build spawn. Until then no phase starts.

## Technical context

The tree as read at `0d65470`.

- `apps/desktop/src/renderer/themes.css` holds one block of custom properties for each theme, named by role, and `apps/desktop/src/renderer/index.html` lines 10 to 63 hold the layout's measures in the page's `:root`. The page moves between themes by the value of `data-theme` on its `html` (`apps/desktop/src/renderer/theme.ts`).
- `apps/desktop/test/themes.test.ts` reads both files as text and holds the look's rules. A new case that reads `docs/design.md` beside them fits the file as it is.
- `apps/desktop/test/built-app.ts` builds the app, starts it in the background and drives its window through the debugging port. The framer's probe captured every screen of `design.md` *The window as it stands* through it with `Page.captureScreenshot`, in one run of 17 seconds. Executed.
- `apps/desktop/package.json` holds three scripts that run one test file under a variable of the environment: `korean:typed`, `measure:memory` and `role:run`. The screenshot command is a fourth of that kind.
- `apps/desktop/vitest.config.ts` runs each test file that imports `buildApp` one at a time, after the rest of the suite. A screenshot case that imports it joins that group without a change to the configuration.
- The `Broad gate` command of `seal/config.json` fails where a document of `docs/` has no `.ko.md` edition, or where the two editions differ in their count of headings or of table rows.

The failure scenario of the chosen approach, six months on: a person changes a colour in `themes.css` and the token case fails until `docs/design.md` and `docs/design.ko.md` say the same value, so every change of the look is three edits. That cost is the intent, since a change of the look is a change of the policy the review reads screenshots against. The approach breaks where the token tables grow past what a person reads, at which point the document keeps the tokens a person judges and the case reads the rest from `themes.css` alone.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The tokens' values stand in `docs/design.md`, in both editions, and a case fails where `themes.css` or the page's `:root` differs | Three copies of a value, kept in step by a case. A change of a value edits three files in one commit. | Chosen. The issue asks for the document as the source the style sheet follows, a reviewer reads a screenshot against a document and not against a style sheet, and the case makes a silent drift impossible. |
| `docs/design.md` names each token by its role and its rule, and the values stand in `themes.css` alone | One copy of a value. The document cannot answer "is this the right cream" without the style sheet open beside it, and a value changes with no change to the policy, so the review has nothing to read the screenshot against. | Refused. It keeps the structure as it stands, a style sheet nobody ratified. The premise that would keep it is that the values are not policy, and the issue says they are. |
| `themes.css` is generated from `docs/design.md` at the build | One copy a person edits. The build gains a parser of Markdown tables, and the Korean edition's table is a second input that the generator must refuse or ignore. | Refused. It replaces a file a person edits with a build step, to save one case of the suite. |
| The screenshot command is a test file run under a variable of the environment, and its images are committed in the work item's directory and shown in the pull request's body | The images weigh on the repository's history, between 0.1 and 0.3 MB a screen at 1440 by 900, as the captures of this study weigh. A work item's directory leaves at the settle, and the history keeps them. | Chosen. The three scripts of `apps/desktop/package.json` already have this form, the images are read at the commit the review reads, and nothing outside the repository has to stay up. |
| A CI job captures the screenshots and uploads them as an artifact of the run | Nothing is committed. An artifact expires, a reviewer downloads an archive to see an image, and the pull request's body cannot show it. The desktop suite on a runner already needs a virtual display. | Refused. The review reads the pull request's body and the tree. |
| A person attaches screenshots by hand | Nothing to build. It is the hand check the issue names as the thing to end, and under an unattended run no person is there. | Refused. |
| The screenshot step as a gate that fails a pull request with no images | It catches a forgotten screenshot. It needs a script that decides whether a diff "changes the window", which is a judgment of meaning and not a fact a script reads exactly. | Refused. The rule stands in `docs/design.md` and the review holds it. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* item 2 | `docs/design.md` and `docs/design.ko.md` exist, and the two loops of the `Broad gate` command over `docs/*.md` and `README.md` pass, which the orchestrator runs | |
| 2 | *Scope* item 3 | The new case of `apps/desktop/test/themes.test.ts`, seen red with one value of `themes.css` changed and with one property the document does not name added | |
| 3 | *Scope* item 7, the command and the rule in `docs/design.md` | The command exits 0 and writes a PNG for each screen the item names in each theme | |
| 4 | *Scope* items 4, 5 and 6 | The cases of `apps/desktop/test/themes.test.ts` and `apps/desktop/test/view.test.ts` that pin the mark of a wait and each changed text, each seen red; and the screenshots of phase 3's command at this phase's commit, which the review reads against `docs/design.md` | |

Phase 3 stands before phase 4 so that phase 4's commit carries the screenshots of the views it changed. Under direction C phase 4 is the mark of a wait alone.

## Overlap with the release

The spawn names no other open work item of the release. `git worktree list` in the main clone shows worktrees for issues #36, #39, #40, #97 and #119, executed, and the framer opened none of them. Phase 4 edits `apps/desktop/src/renderer/index.html`, `themes.css` and `shared.ts`, so an open item that edits one of those files meets this work there. The orchestrator names those items when it sends the owner's answer, and the framer writes their rows then.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

No migration, no new dependency and no variable a person sets to run the app. `apps/desktop/package.json` gains one script for the screenshot command. Phases 2 and 4 change what the window looks like, so the changelog fragment says so in words a person who uses the app reads.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
