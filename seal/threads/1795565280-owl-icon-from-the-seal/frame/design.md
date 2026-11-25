# Design: the app icon is the seal's owl (#201)

## Grounding

The tree as read at `71e7d23`, the commit of this work item's `routing.md` on `4a005eb` of `release/v0.0.4`.

The ticket is issue #201, read with `gh issue view 201 --json number,title,body,comments,milestone,labels` (executed). It has no comment. Its body states the owner's choice of 2026-11-25: owl L, and the current icon kept as an archive. The spawn prompt hands the same choice with the drawing's numbers, and the rows below open each of them. `routing.md` stands and was read. `seal/follow-up.md` does not stand, `docs/README.md`, the index of the policy root, does not stand, and `seal/threads/` holds this work item alone. The latest release's note, `v0.0.3`, holds no `### Process changes` table (executed: `gh release view --json tagName,body`, searched for `process changes` without regard to case, which matched no line).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/name.md` *Why this name*, the bullet "The emblem is the owl, and the wax stays with the seal": "Owlery's emblem is a warm white owl on a black rounded square: the little owl of AgenticSeal's seal, taken out of its wax, with no red on it. The app's icon and the README show it." | Owl L is the seal's owl taken out of its wax, in warm white on the black rounded square. The sentence holds for L as it reads, so this work changes no rule |
| The same bullet: "The owl on the red wax seal stays AgenticSeal's mark of a guarantee", and the owner settled the emblem on 2026-11-19 "to tell the product's face from the seal" | The emblem and the seal's drawings are two things with two owners. The two files under `apps/desktop/assets/seals/` stay AgenticSeal's files, and this work redraws neither |
| `docs/architecture.md` *License and code from other projects*: "The Owlery and AgenticSeal names, the owl emblem and its drawings in the tree are reserved, and `TRADEMARKS.md` at the top of the repository states what they are under." | Every drawing of the emblem in the tree is listed in `TRADEMARKS.md`, the archive's files among them |
| `docs/architecture.md` *Measure before building*, the bullet that opens "A start of the app that an agent makes on a person's machine sets `OWLERY_BACKGROUND=1`, and what only a person's start shows is measured by a person" | An app started in the background has no Dock icon (`apps/desktop/src/main/main.ts:68-69`). No agent's start shows the Dock, so the Dock's look is the owner's to see (`frame/questions.md` Q2) |
| `docs/design.md` *The themes*, the row "The idea" of Night watch: "The window is drawn from the emblem, a white owl on black" | L is a white owl on black. The row holds as it reads |
| The plugin's `skills/agent-contract/SKILL.md` rules 14 and 15 | The change is one a person sees, so a case pins what a case can read of it, and the case is shown red before it is committed |

What the tree and the probe answered:

| Fact | Label and source |
|---|---|
| The users of the icon's and the seal's files are `README.md:1`, `README.ko.md:1`, `TRADEMARKS.md:11-34`, `apps/desktop/build.mjs:62`, `:63` and `:65`, `apps/desktop/src/main/main.ts:212`, and `apps/desktop/src/renderer/index.html:138-148`. The spawn prompt's line numbers for `build.mjs` and `main.ts` are not the tree's, and these are | `executed`: `git grep -n -i -e 'app-icon' -e 'owl-icon-cream' -e 'assets/icon' -e 'owl\.svg' -e 'rsvg' -e 'assets/seals' -- . ':!seal/threads'` |
| Nothing reads `apps/desktop/assets/icon/app-icon-small.svg`. `TRADEMARKS.md:20-22` lists it as "the emblem drawn for 32 pixels and under", and no build line, page, script or README names it | `executed`: `git grep -n -e 'app-icon-small' 71e7d23 -- . ':!seal/threads' ':!TRADEMARKS.md'` printed nothing and exited 1. Without the last pathspec the same search prints `TRADEMARKS.md:20`, so it finds the name where it stands |
| The build copies three files out of `apps/desktop/assets/`, each by its own name: `owl.svg`, `owl-icon-cream.svg` and `app-icon.png` (`build.mjs:62`, `:63`, `:65`). The one folder it copies whole is `role-bundle` (`build.mjs:67-68`). `apps/desktop/package.json` holds no packager and no `files` or `build` key: the app is `electron .` over `dist/`, and `dist` is ignored by git. So what the built app holds of the drawings is what those three lines copy | `read`: `build.mjs`, `package.json`, `.gitignore`. `executed`: `git grep -n -i -e 'electron-builder' -e 'electron-forge' -e 'packager' -e 'asar' -- ':!pnpm-lock.yaml' ':!seal/threads'` printed nothing |
| The main process gives the Dock `dist/app-icon.png` inside a `try` whose `catch` is empty (`main.ts:210-215`). A PNG the build did not copy would therefore show Electron's icon and raise nothing. The build itself fails where the source file is missing, since `copyFile` rejects | `read` |
| The owl's group in `apps/desktop/assets/seals/owl.svg`, the `<g transform="translate(600 600) scale(1.32) translate(-600 -612)">` inside the mask `relief`, holds only `path` and `circle` elements. *Data & interfaces* gives their numbers by part | `executed`: the framer's probe `test_tmp_icon_probe.py`, run once on 2026-11-25 under the framer's scratch directory, reading the worktree at `71e7d23` |
| The owner's candidate is that group by one rule. Without the paths whose data hold ` q 10 13 20 0` and the paths whose data are `M -8 -2 q 8 11 16 0`, and with each `stroke-width` multiplied by 1.8 and written to one decimal, the group's elements are the candidate's mask byte for byte. The whole file the rule gives is the candidate's file: both have the SHA-256 `8d15618c824222dc3f0a917839ce99d06e83be888e04f5d7dee94f84def0b32c` | `executed`: the same probe, and `shasum -a 256` over both files |
| `rsvg-convert -w 1024 -h 1024` over the candidate prints a PNG whose SHA-256 is `26f41562e0009dc53663b32ce0fab72f4b2911a1a395f0a1b79ad3766658f3f9`. Over the small drawing *Data & interfaces* states, it prints one whose SHA-256 is `dcf1f0666403e8da9a1b385a0f20a7980a28f4857613a2a21bc17696d90219d2` | `executed`, with librsvg 2.58.4 (`rsvg-convert --version`), each piped to `shasum -a 256` |
| The command `TRADEMARKS.md:29` documents gives the committed PNG again | `executed`: `rsvg-convert -w 1024 -h 1024 assets/icon/app-icon.svg \| cmp - assets/icon/app-icon.png` in `apps/desktop` at `71e7d23` exited 0, with librsvg 2.58.4 |
| At 16 and 32 pixels L's eyes do not show: the owl is a pale shape with no face. The same owl without its chest rows and wing ticks, each line 3 times the seal's, shows two eyes at 32 pixels. At 64 pixels and over L reads as it does at full size | `executed`: the probe drew each at 16, 32, 64 and 128 pixels with `rsvg-convert`. What the drawings show is the framer's reading of them, not a measurement |
| `apps/desktop/assets/seals/owl.svg` and `owl-icon-cream.svg` are the files of the same names in the AgenticSeal plugin 0.38.7, byte for byte. `TRADEMARKS.md:32-33` says each is the plugin's file "unchanged" | `executed`: `cmp` of each against the installed plugin's `assets/seals/`, exit 0 |
| The page draws `owl-icon-cream.svg` at one size, the 18 pixels of a line (`index.html:59`, `:133`, `:143`, `:147`). Every larger place of a seal draws `owl.svg` (`index.html:144`, `:148`), whose owl is the one L is drawn from | `read` |
| In the cream seal at 18 pixels L's owl is a shape with no eyes, and the cream seal as it stands shows two dark eyes. At 36 pixels, the same line on a screen of double density, the standing drawing shows ringed eyes and L's lines blur | `executed`: the probe drew the standing file and the same file with L's owl in the standing owl's place, at 18, 36, 64 and 128 pixels. The reading is the framer's |
| The plugin drew `owl-icon-cream.svg` for a small tile, "where the fret border, the scallops and the thin lines of `owl.svg` blur together": "flat shapes with fewer, thicker lines" | `read`: the plugin's `assets/seals/README.md` *The little owl — from 0.25.1*, the bullet "The directory icon" |
| No case reads the icon's files or the Dock's icon | `executed`: `git grep -n -i -e 'setIcon' -e 'cream' -e 'app-icon' -- apps/desktop/test` printed nothing. `apps/desktop/test/approval-line.test.ts:280` names `owl.svg`, so a search of that folder finds a drawing's name where one stands |
| A test file that imports `buildApp` from `./built-app` runs in the suite's `app` project, one file at a time, after every other file (`apps/desktop/vitest.config.ts:13-17`, `:27`). A case there reads `dist/` with no other build beside it. `apps/desktop/test/role-bundle.test.ts:279-288` already reads what a build copied, by bytes | `read` |
| The blobs of the icon's files at `71e7d23`: `app-icon.svg` is `869ae1cca97fee82ccb24759716a27f130a364e2`, `app-icon-small.svg` is `5f972c9e2bc721aa1c87ffa68e91f109c5ae5132`, and `app-icon.png` is `db0e194740a834b94abe5a22e76caa7a62b78202`. The icon dates from `7f85f414` of 2026-11-19, and the tags `v0.0.1`, `v0.0.2` and `v0.0.3` hold that commit | `executed`: `git rev-parse 71e7d23:<path>`, `git log --follow`, `git tag --contains 7f85f414` |
| The archive's name is free, and the searches of scenarios 6 and 7 below run as written | `executed` at `71e7d23`: `git grep -n -e 'earlier-2026-11-19' 71e7d23 -- . ':!seal/threads'` printed nothing and exited 1; scenario 6's search printed nothing and exited 1; scenario 7's `git diff --quiet` exited 0. None of them can fail before the build, and each scenario's cell says where it can after it |

## Scope

All paths below are under `apps/desktop/` unless they start at the top of the repository.

In:

1. **`assets/icon/app-icon.svg` is owl L, as written SVG.** *Data & interfaces* states the drawing. The file keeps its name, so `README.md:1`, `README.ko.md:1` and `TRADEMARKS.md:17` keep pointing at it.
2. **`assets/icon/app-icon-small.svg` is L drawn for 32 pixels and under:** L without its chest rows and wing ticks, each line 3 times the seal's. *Data & interfaces* states it. `frame/questions.md` Q1 is the owner's look at this drawing, which the owner has not seen.
3. **`assets/icon/app-icon.png` is `app-icon.svg` at 1024 pixels,** drawn by the command `TRADEMARKS.md` documents.
4. **The earlier icon is kept at `assets/icon/earlier-2026-11-19/`.** The folder holds the three files as they stand at `71e7d23`, each under its own name and with its own bytes: `app-icon.svg`, `app-icon-small.svg` and `app-icon.png`. The date is the day the owner settled that emblem. Putting the earlier icon back is copying them over the files of the same names in `assets/icon/`.
5. **`TRADEMARKS.md` lists the files as they stand.** *Data & interfaces* states what each entry says.
6. **A case holds what the build ships of the icon.** `test/emblem.test.ts`, new, builds the app and reads `dist/`. *User scenarios & acceptance* row 4 states what it asserts.

Out:

- **`assets/seals/owl-icon-cream.svg` and `assets/seals/owl.svg`.** The cream owl of a sealed and a broken line stays. `frame/plan.md` *Alternatives considered* rows 3a to 3c hold the grounds. The issue's second *Done when* line allows it where the frame says why.
- **`build.mjs`, `src/main/main.ts` and `src/renderer/index.html`.** The build copies `assets/icon/app-icon.png` by the name it keeps, and the comment at `build.mjs:64`, "the white owl on a black rounded square", holds for L.
- **`README.md`, `README.ko.md` and every file under `docs/`.** The image's path stays. The alternative text, "a warm white owl on a black rounded square", and the sentence at line 11 of each README hold for L.
- **A script that draws the icon from `owl.svg`,** and a case that holds the icon to `owl.svg`. `frame/plan.md` *Alternatives considered* rows 1b, 1c and 6.
- **The Dock's look in a person's start of the app.** No agent's start shows it. The crafter writes it in `gaps.md` as unverified, with the owner as its answerer (`frame/questions.md` Q2).
- **The version.** `package.json` stays at `0.0.3`. The release's own work item moves it.

## User scenarios & acceptance *(mandatory)*

Commands run in `apps/desktop`. A SHA-256 below is the one librsvg 2.58.4 gives.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The emblem is owl L | Given the tree after the build. When `assets/icon/app-icon.svg` is drawn at 1024 pixels. Then the picture is the one the owner's candidate gives, pixel for pixel | `rsvg-convert -w 1024 -h 1024 assets/icon/app-icon.svg \| shasum -a 256` prints `26f41562e0009dc53663b32ce0fab72f4b2911a1a395f0a1b79ad3766658f3f9` |
| 2. The Dock's PNG is the emblem | Given the same tree. When the documented command is run. Then its output is the committed `assets/icon/app-icon.png` | `rsvg-convert -w 1024 -h 1024 assets/icon/app-icon.svg \| cmp - assets/icon/app-icon.png` exits 0 |
| 3. The small icon is L without its body feathers | Given the same tree. When `assets/icon/app-icon-small.svg` is drawn at 1024 pixels. Then the picture is the one *Data & interfaces* states | `rsvg-convert -w 1024 -h 1024 assets/icon/app-icon-small.svg \| shasum -a 256` prints `dcf1f0666403e8da9a1b385a0f20a7980a28f4857613a2a21bc17696d90219d2` |
| 4. The built app holds the emblem and none of the earlier icon | Given a build of the tree. When `dist/` is read. Then `dist/app-icon.png` has the bytes of `assets/icon/app-icon.png`, and no file anywhere under `dist/` has the bytes of a file under `assets/icon/earlier-2026-11-19/` | The case of `test/emblem.test.ts`, run alone with `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/emblem.test.ts`. It is shown red twice before it is committed: once with `build.mjs:65` pointed at the archive's PNG, and once with a line added to `build.mjs` that copies an archive file into `dist/` under another name. Each time the failing line is read for the assertion it names, and the line is taken back |
| 5. The earlier icon can be put back | Given the tree after the build. When the files of `assets/icon/earlier-2026-11-19/` are read. Then each has the bytes its file had at `71e7d23` | `git rev-parse HEAD:apps/desktop/assets/icon/earlier-2026-11-19/app-icon.svg`, and the same for `app-icon-small.svg` and `app-icon.png`, print the blobs *Grounding* names for those files, in that order |
| 6. Nothing the app runs names the archive | Given the tree after the build. When the build script, the sources, the scripts, the manifest and the role bundle are searched for the archive's name. Then no line names it | `git grep -n -e 'earlier-2026-11-19' -- apps/desktop/build.mjs apps/desktop/src apps/desktop/scripts apps/desktop/package.json apps/desktop/role-bundle` prints nothing. The same search over `TRADEMARKS.md` and `apps/desktop/test` prints the entry of Scope item 5 and the case of item 6, so it finds the name where it stands |
| 7. The seal's places draw as before | Given the tree after the build. Then no file a seal's place is drawn from has changed, and neither has a README or a policy document | `git diff --quiet 4a005eb -- apps/desktop/assets/seals apps/desktop/src apps/desktop/build.mjs README.md README.ko.md docs` exits 0. With `TRADEMARKS.md` added to its paths it exits 1 after the build |
| 8. `TRADEMARKS.md` lists every drawing | Given the tree after the build. Then each file under `apps/desktop/assets/` is named by one entry of `TRADEMARKS.md`, and each entry names a file that stands | Review reads the entries against `git ls-files apps/desktop/assets` |

## Data & interfaces

**`assets/icon/app-icon.svg`.** The view box is `0 0 1024 1024`.

- The square is the standing file's: the gradient from `#1a1a1a` to `#050505`, the rectangle at `100 100`, 824 wide and high with corners of 185, and over it the edge rectangle at `100.5 100.5`, 823 wide and high, stroked `#ffffff` at 0.08 opacity and 2 wide (`app-icon.svg:2`, `:4`, `:5` at `71e7d23`). The standing file's clip path `c-B` (`:3`) is used by nothing and is not carried over.
- The owl is a mask in user space over `0 0 1200 1200`: a black rectangle, then the owl's elements. A rectangle of `#f3efe6`, 1200 wide and high, is filled through the mask inside `<g transform="translate(512 524) scale(1.72) translate(-600 -621)">`.
- The owl's elements are those of the owl's group in `assets/seals/owl.svg`, in the group's order, with their own coordinates and with no transform of the seal's.
- Out of the group's 119 elements, 68 are left out: the 50 paths of the five forehead rows, whose data hold ` q 10 13 20 0`, and the 18 paths of the feathers round the eyes, whose data are `M -8 -2 q 8 11 16 0`.
- The 51 kept elements are the body, the eight circles of the two eyes, the beak, the 24 paths of the five chest rows (data holding ` q 11 16 22 0`), the two wing lines with three ticks under each, the branch, its two leaves with a vein in each, and the two feet with their lines.
- Each `stroke-width` is the group's multiplied by 1.8 and written to one decimal: 3 becomes 5.4, 3.2 becomes 5.8, 4 becomes 7.2, 4.5 becomes 8.1, 5 becomes 9.0, 9 becomes 16.2 and 18 becomes 32.4.

The file is written by hand as source: one element to a line, the parts in the order above, and a comment that names each part. Layout and comments are free. The elements, their order and their numbers are not, because scenario 1 holds the picture to the candidate's.

**`assets/icon/app-icon-small.svg`.** The same file with two differences. The chest paths and the wing ticks are left out, which leaves 21 elements in the mask. Each `stroke-width` is the group's multiplied by 3.0: 3 becomes 9.0, 4 becomes 12.0, 4.5 becomes 13.5, 5 becomes 15.0, 9 becomes 27.0 and 18 becomes 54.0.

**`assets/icon/app-icon.png`.** `rsvg-convert -w 1024 -h 1024 assets/icon/app-icon.svg -o assets/icon/app-icon.png`, run in `apps/desktop`. The crafter states the librsvg version that drew it in `TRADEMARKS.md`.

**`TRADEMARKS.md`.** The list of drawings, top to bottom:

- The entries of `owl.svg` and `owl-icon-cream.svg` stay as they read.
- The entry of `app-icon.svg` keeps its description and adds how the owl is drawn: the owl of `owl.svg` taken out of its wax, without the feathers on its forehead and round its eyes, each line 1.8 times as thick.
- The entry of `app-icon-small.svg` says: the emblem drawn for 32 pixels and under, the same owl without the feathers on its chest and wings, each line 3 times as thick as the seal's.
- The entry of `app-icon.png` keeps its sentence and its command, with the librsvg version that drew the new file.
- A new entry names the folder `apps/desktop/assets/icon/earlier-2026-11-19/` and each file in it. It says that they are the emblem as releases 0.0.1 through 0.0.3 showed it, the owl of `owl-icon-cream.svg` taken out of its wax; that the build copies none of them; and that copying them over the files of the same names in `apps/desktop/assets/icon/` puts the earlier emblem back.
- The closing paragraph keeps its first sentence, on the two seal drawings. Its second sentence, "The emblem's owl is the seal's little owl taken out of its wax.", becomes two: the emblem's owl is drawn from `owl.svg` and is a drawing of its own, and a later change to `owl.svg` changes the emblem only where somebody draws the emblem again.

**`test/emblem.test.ts`.** One `describe`, one case, in the form of `test/role-bundle.test.ts:279-288`. It imports `buildApp` from `./built-app`, so the suite runs it in the `app` project. It starts no app.

## Rule changes

- nothing
  why: the sentences of docs/name.md and docs/design.md that describe the emblem hold for owl L as they read, and TRADEMARKS.md, which this work edits, stands outside the policy root.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The earlier owl's drawing as the emblem | `apps/desktop/assets/icon/app-icon.svg`, `apps/desktop/assets/icon/app-icon-small.svg` and `apps/desktop/assets/icon/app-icon.png`, each file's whole content | `apps/desktop/assets/icon/earlier-2026-11-19/`, each file under its own name with its own bytes |
| The unused clip path of the square | `apps/desktop/assets/icon/app-icon.svg:3` and `apps/desktop/assets/icon/app-icon-small.svg:3`, `<clipPath id="c-B">` | Nothing refers to it in either file. The archive's copies keep it |
| The sentence "The emblem's owl is the seal's little owl taken out of its wax." | `TRADEMARKS.md` *The Owlery and AgenticSeal names and the owl emblem*, lines 33-34 | The closing paragraph's new sentences, and the new archive entry, which says the same of the earlier emblem |
| The small icon's description "the same owl without its chest marks and its two side lines, with heavier eyes" | `TRADEMARKS.md` *The Owlery and AgenticSeal names and the owl emblem*, lines 21-22 | The entry's new description. The archive's entry describes the archive's copy of the file |

This work adds one case, `apps/desktop/test/emblem.test.ts`, and takes no case or check out in return. Nothing can go: no case reads the icon's files at `71e7d23`, and the issue's line "not shipped in the built app" has no other holder.

Framed 2026-11-25 by framer, before the build.
