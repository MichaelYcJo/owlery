# Implementation Plan: the app icon is the seal's owl (#201)

## Technical context

The tree as read at `71e7d23`.

Paths are under `apps/desktop/` unless they start at the top of the repository. The facts below are those of `frame/design.md` *Grounding*, which holds each one's label and source.

- **The icon reaches a person at two places.** `build.mjs:65` copies `assets/icon/app-icon.png` to `dist/app-icon.png`, and `src/main/main.ts:212` gives that file to the macOS Dock. `README.md:1` and `README.ko.md:1` show `assets/icon/app-icon.svg`. Neither line changes, because both files keep their names.
- **The PNG is a committed file, drawn by hand from the SVG** with the command `TRADEMARKS.md:29` documents. Nothing in the suite compares the two: the app's `package.json` holds no SVG renderer.
- **`assets/icon/app-icon-small.svg` has no reader.** `TRADEMARKS.md:20-22` lists it and nothing else names it.
- **The build ships of the drawings only what `build.mjs:62`, `:63` and `:65` copy by name.** There is no packager. A folder beside the icon's files is not copied unless somebody adds a line.
- **The owner's candidate is the seal's owl by one rule,** and the rule gives the candidate's file byte for byte. So the frame states the drawing from the tree, and its acceptance needs no file outside the tree.

**The failure scenario of the chosen approach.** The emblem is written SVG, with no line that ties it to `assets/seals/owl.svg`. In six months the AgenticSeal plugin redraws its owl and Owlery takes the new `owl.svg`. The seal's places then show the new owl, and the emblem keeps the shapes of the old one. Nothing reports the difference. This is the chosen behaviour, and `TRADEMARKS.md` says so in its closing paragraph, so the next person reads it as a decision. Two smaller failures stand as they stand today. An edit to `app-icon.svg` that is not followed by the documented command leaves the Dock's PNG showing the old drawing, and no case sees it. A librsvg other than 2.58.4 may give other bytes for the same picture, and then scenarios 1 and 3 of `frame/design.md` read as failed where the drawing is right. Whoever meets that reads the mask's elements against *Data & interfaces* by hand.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| 1a. The emblem is written SVG in `assets/icon/app-icon.svg`, and `TRADEMARKS.md` says in words how it was drawn from `owl.svg` | A later change to `owl.svg` leaves the emblem as it is, and nothing reports it | **Chosen.** `docs/name.md` *Why this name* makes the emblem Owlery's face, settled by the owner, and the seal's drawing AgenticSeal's file. The owner chose L by looking at it beside other candidates. A change to another party's file should not redraw Owlery's face without that look |
| 1b. A script in the tree draws `app-icon.svg` from `owl.svg`, and its output is committed | The script is run once in a release or never. A committed output can go stale against its script, so a case has to hold the two together, and that case fails the suite on the day the plugin's owl changes, for a drawing nobody chose | Rejected. It keeps a second mechanism beside the drawing to stay in step with it. The rule fits in one sentence of `TRADEMARKS.md`, and the framer's probe showed that a throwaway script gives the file again from that sentence |
| 1c. The build draws the icon from `owl.svg` each time, and no icon file is committed | The README's image has no file to show. The build needs an SVG renderer for the PNG, which the tree does not hold | Rejected, for both reasons |
| 2a. Keep the structure of the PNG: a committed file, drawn from the SVG by the documented command | An edit to the SVG without the command leaves the PNG stale, and no case sees it | **Kept.** The premise is that the documented command gives the committed file again, byte for byte, so review can check a PNG by running one command. Checked: `frame/design.md` *Grounding*, the row on `TRADEMARKS.md:29` |
| 2b. Replace it: the build draws `dist/app-icon.png` from the SVG, and the PNG leaves the tree | The build gains a renderer as a dependency, on the owner's Mac and on the CI runner, for one file that changes about once a release. A renderer of another version gives the Dock other bytes on another machine | Rejected. The stale PNG it would prevent has not happened in this tree: the committed PNG is the command's output at `71e7d23` |
| 3a. `assets/seals/owl-icon-cream.svg` stays as it is | The app shows two owls: L as the emblem and in every large seal, and the flat owl in the 18-pixel seal of a line. A person who read the earlier emblem as a skull may read the small seal the same way | **Chosen.** Four grounds, each in `frame/design.md` *Grounding*. The file is AgenticSeal's, byte for byte, and `docs/name.md` keeps the seal AgenticSeal's mark. At 18 pixels L's owl in the wax is a shape with no eyes, while the standing drawing shows two eyes. The plugin drew the flat owl for exactly this size, because the thin lines of `owl.svg` blur there. And the issue reports the app icon: its skull's cues are read at the size of an icon, and the seal of a line is a red disc 18 pixels wide. One owl across the app already holds where an owl can be seen as one: every seal of 64 pixels and over draws `owl.svg`, the owl L is drawn from |
| 3b. The cream seal takes L's owl | At the one size the file is drawn, the owl loses its face. `TRADEMARKS.md` can no longer call the file the plugin's, unchanged, and the next update of the plugin's file has to be merged by hand | Rejected, on the probe's drawing at 18 and 36 pixels |
| 3c. The cream seal takes L without its body feathers, with heavier lines | At 18 pixels its head is a dark band and its eyes still do not part. It is a third drawing of the owl, which the owner has not seen, inside a file that is AgenticSeal's | Rejected. It reads worse than the standing drawing at the size it is for |
| 4a. `app-icon-small.svg` is L without its chest rows and wing ticks, each line 3 times the seal's | The owner has not seen this drawing, and may want another | **Chosen as the default of `frame/questions.md` Q1.** The issue's first *Done when* line asks that the small icon show L, and at 32 pixels L as chosen shows no eyes. This drawing follows the standing small icon's own rule, which `TRADEMARKS.md:21-22` states: the same owl without its chest marks, with heavier lines. No part of the app reads the file, so a wrong guess reaches no person before the owner looks |
| 4b. `app-icon-small.svg` is a copy of `app-icon.svg` | Two files hold one drawing, and the one named for small sizes is unreadable at them | Rejected |
| 4c. `app-icon-small.svg` is removed, since nothing reads it | The issue names the small icon among the files that show L, and the next small use, a tray or a favicon, starts without a drawing | Rejected. The issue asks for it |
| 5a. The earlier icon stands at `assets/icon/earlier-2026-11-19/`, each file under its own name | A person who lists `assets/icon/` sees a folder beside the live files and has to read its name | **Chosen.** The folder's name says "earlier" and the day that emblem was settled, so a second replacement gets a second folder and no name collides. The files keep their names and bytes, so putting them back is a copy with no renaming, and `git rev-parse` shows the bytes are the old ones. The build copies by file name and takes nothing from a folder |
| 5b. The earlier files stand in `assets/icon/` itself under changed names, such as `app-icon-earlier.svg` | Putting them back needs each file renamed. A changed name beside `app-icon.png` is one edit of `build.mjs:65` away from being shipped by mistake | Rejected |
| 5c. No archive in the tree: `git show v0.0.3:apps/desktop/assets/icon/app-icon.svg` gives the earlier icon | It is the cheapest, and it keeps the earlier icon | Not open. The owner asked for the files in the repository |
| 5d. The archive stands outside `apps/desktop/`, at the top of the repository | The emblem's drawings stand in two trees, and `TRADEMARKS.md` points into both | Rejected. Being inside `apps/desktop/assets/` ships nothing, because the build names each file it copies |
| 6. A case holds `app-icon.svg` to `owl.svg` by the rule | The case fails when the plugin's owl changes, and the only way to pass is to redraw the emblem | Rejected with 1b: it is the tie that 1a declines |
| 7a. The case of *Scope* item 6 stands in a new file, `test/emblem.test.ts` | One more file of the `app` project, and one more build in a run of the suite | **Chosen.** A build took 127 to 583 ms on the owner's Mac where the frame of #149 measured it (`git show 4a89817:seal/threads/1795559733-built-app-files-share-one-app/frame/design.md`, read) |
| 7b. The case joins `describe("the built app's role bundle")` in `test/role-bundle.test.ts` | It saves a build. A case about the emblem stands under a heading about the role bundle, and the next reader looking for what holds the icon does not look there | Rejected |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 6, in one commit with the work item's `changelog.md` | Scenarios 1 to 7 of `frame/design.md` *User scenarios & acceptance*, each by the command its row gives, run by the crafter and labelled `executed` with its output. Scenario 4's case is run alone, with each of its red runs reported. Scenario 8 is review's reading. The crafter looks at `app-icon.png` and at `app-icon-small.svg` drawn at 32 pixels, and says what each shows. The suite is `unverified` at the hand-over, and the orchestrator's broad gate answers it | built `4d5fdd5a`; `trail/phases/phase-1.md` |

One phase holds the work, because the case of item 6 reads the archive of item 4 and the PNG of item 3 together, and `TRADEMARKS.md` is wrong at any commit that holds only some of items 1 to 4.

## Overlap with the release

The spawn prompt names no other open work item of the release, so no order of merging is stated against one. The framer saw #149 in the milestone's list (`gh issue list --milestone 'release: 0.0.4'`, executed) and read its frame's *Scope* at `4a89817` on the branch `test/149-every-built-app-file-starts-its-own-app`. That frame changes neither `apps/desktop/vitest.config.ts` nor `apps/desktop/test/built-app.ts`, and this work changes no file it names. `test/emblem.test.ts` becomes one more file of the `app` project, which #149's `test:app` script would run with the rest, and it starts no app. The frames of the other open items were not opened, and whether one of them meets this work is the orchestrator's to say.

## Operational impact

No migration, no environment variable and no dependency. The pull request moves no version: `apps/desktop/package.json` stays at `0.0.3`. A person who starts the app sees a new icon in the Dock. `rsvg-convert` of librsvg 2.58.4 is needed only by whoever draws `app-icon.png` again, as before, and neither the build nor the suite runs it.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
