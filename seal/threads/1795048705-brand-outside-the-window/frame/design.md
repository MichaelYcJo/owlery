# Design: the brand outside the window

The ticket is issue #21. Its body and comments were read with `gh issue view 21 --json body,comments` on 2026-11-19, after the owner's decision on the icon was folded into it: the body states that decision, and the issue has no comments.

## Grounding

The tree as read at `68dc407`, the branch rebased onto `c128acb`, the merge of issue #18 into `release/v0.0.1`. Between the two commits only this work item's directory differs (executed: `git diff --name-only c128acb 68dc407`).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/name.md` *Open decisions*, the *Emblem* row, and `docs/name.ko.md` *결정을 남겨 둔 것* | The one open row of the document: "Keep the owl in a wax seal / draw the owl in front of an owlery", with keeping the wax seal recommended. The owner took neither on 2026-11-19: the emblem is a white owl on black, and the wax seal stays the seal's (the decision's bullets below) |
| `docs/name.md` *Why this name*, "The seal stays in the emblem" | The bullet says the emblem carries the seal. The decision takes the seal out of Owlery's emblem, so `## Rule changes` rewrites the bullet |
| `docs/name.md` *What to keep in mind*, the first bullet | The READMEs and the icon borrow no image from the Harry Potter books, such as an owl carrying a letter |
| `docs/product.md` *What we promise*, and `docs/product.ko.md` *무엇을 약속하는가* | The promise in one bold sentence. The READMEs' one-line description is taken from it and promises nothing the document does not |
| `docs/product.md` *What we deliberately don't do*, the last bullet | No throughput claim in the READMEs |
| `docs/architecture.md` *License and code from other projects*, and the `add` that #18's `## Rule changes` states for it | The names and the emblem are not under the Apache License, and `TRADEMARKS.md` lists the drawings in the tree. Each drawing this work adds is listed there |
| `docs/architecture.md` *Platforms and their order* | The first version is the macOS desktop app only, so the icon is the one the macOS Dock shows |
| `docs/roadmap.md` *Open decisions*, the row "Releases below 0.1.0" | Whether a release below 0.1.0 is a packaged download is open. The tree holds no packager, so "the built app" is what `pnpm --filter @owlery/desktop start` runs |
| `seal/config.json`, `Broad gate` | The README pair keeps equal counts of `#` lines and of table lines, and the Korean edition does not use the word the gate's last search names |

The owner's decision of 2026-11-19 on the icon. It reached the framer through the orchestrator's message and is the orchestrator's finding. The issue's body, which the framer opened, states the same. The design canvas the owner chose in was not opened.

- **The emblem is a warm white owl on a black rounded square, with no red and no seal.** The owner's words, in order: "나도 인장과의 차별을 위해 붉은색이나 인장은 뺄까했어 애초에 프로덕트네임도 owelery잖아", then "B에서 흰색으로하자". The owl's white is `#f3efe6`. The app's icon is this drawing, both READMEs open with it, and `docs/name.md` *Emblem* is settled as it.
- **Sizes of 32 pixels and under use a simpler drawing**: no chest marks, no two side lines, heavier eyes.
- **The seal inside the window stays AgenticSeal's `owl.svg`, and red stays on the seal alone.**
- **The two drawings are files outside git.** Read, whole, in the owner's main checkout under `etcs/design/owlery-window-canvas/assets/`, a folder git does not track: `app-icon.svg`, 2,029 bytes, SHA-256 `d2d4ac2c1bbf7564723c62bc1ec3351182ba8ad44b4adec5737265533cfc1ca2`, and `app-icon-small.svg`, 1,730 bytes, SHA-256 `3e186ea6b074cb6db330b1bb1790b27f7477043504a372575ff44bf69d828377` (executed: `ls -la`, `shasum -a 256`). Each is 1024 units square. A rounded square 824 units wide stands in the middle, filled with a gradient from `#1a1a1a` to `#050505`, with a faint white line on its edge. The owl is one mask filled with `#f3efe6`. Neither file has a filter, and neither refers to anything outside itself. The small file is the full one without the chest marks and the side lines, with heavier rings and pupils for the eyes.
- **The owl is the outline of `owl-icon-cream.svg`, redrawn.** Read beside `apps/desktop/assets/seals/owl-icon-cream.svg`: the body, the perch and its two leaves are the same paths. The icon's owl has heavier lines, one row of chest marks where the seal's owl has two, and no feet. So the canvas's files are the drawings the owner chose, and the tree's seal file cannot stand in for them.

What the reading and the probes found:

- **The seal's drawings at `68dc407`.** `apps/desktop/assets/seals/` holds `owl.svg` (SHA-256 `9548f411…`) and `owl-icon-cream.svg` (`fa8ffa5d…`), both committed by #18 (executed: `git ls-tree`, `shasum -a 256`). `apps/desktop/build.mjs` copies both into `dist/`. The page draws a seal's place from them, in `src/renderer/index.html`, and nothing else in the window shows a drawing: #18 removed the bar that held the emblem, and the sidebar holds the traffic lights (read: `main.ts`, `titleBarStyle: "hiddenInset"`; #18's `frame/design.md` *Scope* item 15). No path under `apps/desktop/assets/icon/` exists (executed: `git ls-tree -r --name-only 68dc407 -- apps/desktop/assets/icon` prints nothing).
- **`TRADEMARKS.md` at `68dc407`** lists the two seal drawings and ends its list with "Each is the file of the same name from the AgenticSeal plugin 0.38.2, unchanged." That sentence is false of a drawing this work adds.
- **`rsvg-convert` draws the icon, and the drawing repeats.** Executed in the reframe's scratch with `rsvg-convert` 2.58.4 on the canvas's `app-icon.svg`: `-w 1024 -h 1024`, run twice, gave the same bytes both times (SHA-256 `7201d3d6…`), a PNG 1024 pixels square with an alpha channel. Read by eye at 128 pixels: the owl, its eyes and its chest marks are plain. The small drawing at 32 pixels, read by eye enlarged, shows the owl and its two eyes.
- **`app.dock.setIcon` takes a `NativeImage` or a path to a PNG, and throws on a file it cannot load.** Read in `electron.d.ts` of Electron 45.3.3: `setIcon(image: NativeImage | string)`, macOS only; `BrowserWindow`'s `setIcon` is marked `win32,linux`, so a macOS window draws no icon. The first frame's probe gave the path of a PNG 1024 pixels square without an error, and a path to no file threw "Failed to load image from path".
- **The Dock draws the image it is given, with no backing of its own, and a capture of every display shows it.** Executed once on 2026-11-19 with Electron 45.3.3 on macOS 26.5 (`test_tmp_dock_reps.js` in the reframe's scratch): the probe set an image, waited three seconds and ran `screencapture -x` with one path for each of the machine's three displays. The Dock stood on the right edge of the third display, and the probe's tile showed the owl on its black square. The first frame's probe captured the main display alone, which holds no Dock. Read by eye in the capture: the black square is told from the dark Dock by its faint edge alone.
- **The Dock does not pick a drawing by the tile's size from an image set at run time.** The same probe gave the Dock one `NativeImage` of three representations: the small drawing at 16 and at 32 pixels, as scale factors 1 and 2, and the full drawing at 1024 pixels, as scale factor 64. Electron accepted it (`getScaleFactors()` gave `[1,2,64]`, and `setIcon` did not throw). The Dock, whose tile is 59 points on that display (executed: `defaults read com.apple.dock tilesize`), drew the 32-pixel representation enlarged: blurred, with the heavy eyes and no chest marks (read by eye in the capture). The representation follows the display's scale and not the tile's size.
- **Electron does not load an `.icns` file.** The same probe: `nativeImage.createFromPath` of an `.icns` that `iconutil` built from the two drawings gave an empty image, and `app.dock.setIcon` with its path threw "Failed to load image from path". So the one place macOS picks a drawing by size is an app bundle's own icon file, which a packager writes and this tree has none of.
- **The image's memory.** Executed in the same probe: the 1024-pixel representation's bitmap is 4,194,304 bytes, four for each pixel. Whether the main process keeps it decoded after `setIcon` was not measured.
- **No case imports the main process.** Executed: `git grep -n -e 'main/main' 68dc407 -- apps/desktop/test` prints nothing. `src/main/main.ts` imports `electron`, and the suite runs vitest under `ELECTRON_RUN_AS_NODE` (read: `scripts/test-in-electron.mjs`), which starts no app.
- **The READMEs at `68dc407`.** Executed, each search with `git grep -n` at that commit over `README.md` and `README.ko.md`: `-e 'no code yet' -e '코드는 없습니다'` prints line 9 of each; `-e 'the build order' -e '만드는 순서' -e 'open decision on the emblem' -e '엠블럼에 대해 남겨 둔 결정'` prints lines 16 and 18 of each. `grep -c '^#'` gives 4 for each and `grep -c '^|'` gives 6 for each. Line 7 of each says the owl on a wax seal is AgenticSeal's emblem, which stays true. The licence section of each links `TRADEMARKS.md`.
- **The *Documents* table does not call `docs/roadmap.md` "the build order".** The words stand in the row of `docs/architecture.md`, whose *Build order* section holds the rule for the first milestone's shape and what follows v0.1, and sends the order to the roadmap (read). `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md` *Not done* left the row as it is. The issue's sentence is read as its aim: the table names the build order in one row, the roadmap's.
- **How the app is run.** Read in `package.json` and `apps/desktop/package.json`: `packageManager` is `pnpm@10.33.0`, the install rebuilds `node-pty`, and `start` builds and runs `electron .`. No document of the tree names a Node.js version (executed: `git grep -n -i -e 'node\.js' -e 'corepack' 68dc407 -- docs README.md apps/desktop/package.json` prints nothing).
- **The brand's voice** is stated in the owner's design study, `etcs/research/ux.md` *리브랜딩*, which is uncommitted and stays so. Read there when the frame was first written, and restated in *Scope* item 5 in this frame's words: three words for the character (calm, exact, on the record), and rules for the product's sentences. Nothing of the study is copied into the tree.
- **The window's look is settled, and the icon reads none of it.** #18 merged with two themes, Night desk and Letter, in `src/renderer/themes.css` (read: #18's `frame/design.md`). Neither the stylesheet nor any file under `apps` names `#f3efe6` (executed: `git grep -n -i -e 'f3efe6' 68dc407 -- apps` prints nothing). The icon's colours are its own.
- **No index of the policy root and no follow-up file exist.** Executed: `ls docs` lists the four document pairs and no `README.md`, and `ls seal/follow-up.md` fails. Each `file:` of `## Rule changes` is picked from that listing.
- **No other unsettled design names `docs/name.md`.** Read when the frame was first written: the `## Rule changes` of #18, #19, #9 and #10 name `docs/architecture.md`, `docs/product.md` and `docs/roadmap.md` and their Korean editions.
- **The name stays.** The owner answered `frame/questions.md` Q1 on 2026-11-19: the name "Owlery" stays. This is the orchestrator's finding.

## Scope

The subject is the app's icon and the README pair. `docs/name.md` is changed through `## Rule changes`, as a work item whose subject is the code states its rules, and the settle of release 0.0.1 writes them (issue #25, *Done when*, its last line). So the third line of this issue's *Done when* holds once that settle has run, and until then `docs/name.md` keeps its open row on `release/v0.0.1`.

1. **The emblem's two drawings enter the tree as the owner chose them.** `apps/desktop/assets/icon/app-icon.svg` and `apps/desktop/assets/icon/app-icon-small.svg` are the canvas's files of the same names, byte for byte, each with the SHA-256 *Grounding* names. The folder is new: `assets/seals/` holds the seal's drawings, and the icon is not a seal.
2. **The Dock's image is the full drawing at 1024 pixels.** `apps/desktop/assets/icon/app-icon.png` is drawn from `app-icon.svg` by the command of *Data & interfaces*. The drawing holds its own margin, so the command adds none.
3. **The app shows it in the Dock.** `apps/desktop/build.mjs` copies the PNG into `dist/`. `src/main/main.ts` sets it as the Dock's icon once the app is ready, on macOS alone. A file that cannot be loaded leaves Electron's icon and does not stop the app's start: the handlers and the window are set up whether or not the icon was.
4. **`TRADEMARKS.md` lists the new drawings**, each by its path: the two SVG files, with what each shows and that the small one is the drawing for 32 pixels and under, and the PNG, with the command and the librsvg version that drew it. That entry is the one home of the command. The sentence that calls each listed drawing an unchanged file of the AgenticSeal plugin is narrowed to the two seal drawings, and the list says that the icon's owl is the seal's little owl taken out of its wax.
5. **Both READMEs open with the emblem and the brand's one-line description.** Each opens with `app-icon.svg` as an image, from its path in the tree, with a text alternative that says what the drawing is, then the title, the language line, and the description of *Data & interfaces* in bold. The paragraphs under it say what Owlery is and where the name comes from, with the facts the two paragraphs hold today and one more: Owlery's emblem is the owl without the wax, and the owl on the wax seal stays AgenticSeal's mark of a guarantee. The voice: calm, exact and on the record. Each sentence is complete and says what happens. No exclamation mark, no "AI", no throughput number, no wordplay on owls, and no image from the Harry Potter books.
6. **Both READMEs say how to run the app**, in a new section before *Documents*: what the tree's release does today (the window that opens on the inbox, work items with a worktree of their own, terminal panes, one question to a headless session), that no seal exists before milestone 2, with a link to the roadmap; what a person needs (macOS, Node.js, pnpm in the version `package.json` names); and the commands, from the top of the tree. The builder states the Node.js version it ran them with and claims no minimum.
7. **Both READMEs stop saying there is no code**: line 9 of each goes.
8. **The *Documents* table names the build order in the roadmap's row alone.** The row of `docs/architecture.md` says "the rule for the first milestone's shape and what follows v0.1" where it says "the build order", and its Korean edition the same. The row of `docs/name.md` ends "and the emblem" where it ends "and the open decision on the emblem".
9. **The emblem and the name are recorded as settled**, by the operations of `## Rule changes`. The two `change` operations record the owner's decision on the emblem, and the two `add` operations the owner's answer to `frame/questions.md` Q1: the name stays.
10. **The seal stays as #18 committed it.** This work changes no file under `apps/desktop/assets/seals/`, neither of their copy lines in `build.mjs`, and no file under `apps/desktop/src/renderer/`.
11. **The emblem's colours are its own.** The icon and the READMEs' image carry the white `#f3efe6` and the black of the drawing, read from the SVG and from no token of the window's themes. The READMEs name no colour and show no picture of the window.
12. Out of scope, each with its reason:
    - Showing the simpler drawing anywhere. Under `electron .` the Dock takes one image and draws it at every size (*Grounding*, the bullet on the three representations), and Electron loads no `.icns` at run time. The simpler drawing shows where macOS picks among an icon's sizes, which is the icon file of a packaged app. So the first line of the issue's *Done when* holds for its first half, and its second half, "the simpler drawing at 32 pixels and under", is a row of `gaps.md` *Not done* unless the owner answers `frame/questions.md` Q4 otherwise.
    - A packaged app: an `.icns` file, the app's name in the menu bar and under the Dock's tile, signing. The tree has no packager, and the roadmap's row on releases below 0.1.0 is open. Under `electron .` the Dock shows Electron's icon until the app is ready, and the system calls the app "Electron". The hand-back names it as a follow-up, and with it the simpler drawing, which the packaging work draws into the sizes of 32 pixels and under.
    - The seal's two drawings and where the window shows them. They are #18's, and the decision keeps them.
    - A window icon for Windows and Linux. The first version is macOS only, and a macOS window draws none.
    - A screenshot of the window in the READMEs. The issue asks for the emblem and one line.
    - The trademark search `docs/name.md` *What to keep in mind* asks for before release.
    - The version, which does not move.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The Dock shows the white owl on black | Given the app built from the tree, when a person starts it with the README's command, then its Dock tile is the white owl on the black rounded square, with its chest marks | The built app started once, and every display captured while it runs, with `screencapture -x` and one path for each display; the builder reads the Dock's tile in the capture that holds the Dock. Where no capture shows the Dock, the row goes to `gaps.md` *Not verified* with the owner as its answerer |
| 2. The build carries the icon | After `pnpm --filter @owlery/desktop run build`, `dist/app-icon.png` exists and is the committed file | Executed: `cmp` of the two files exits 0 |
| 3. The committed drawings are the ones the owner chose, and the PNG is the one the command draws | Each SVG has the SHA-256 of `## Grounding`, and the command of `TRADEMARKS.md`, run into the builder's scratch, gives the committed PNG | Executed: `shasum -a 256` of the two SVG files, and the two PNGs' sums are equal. Where the builder's librsvg is not the version the entry names, the sums are read as they come and a difference goes to the phase record |
| 4. A missing icon does not stop the app | Given `dist/` without the PNG, when the app starts, then the window opens and reaches the daemon | The built app started once with the file removed from `dist/`, and the window's first screen read through the debugging port |
| 5. The seal is untouched | `git diff --name-only c128acb -- apps/desktop/assets/seals apps/desktop/src/renderer` prints nothing | Executed. At `68dc407` it prints nothing, and a change to any file there prints that file's path |
| 6. `TRADEMARKS.md` names each new drawing | `git grep -n -e 'icon/app-icon.svg' -e 'icon/app-icon-small.svg' -e 'icon/app-icon.png' -- TRADEMARKS.md` prints a line for each of the three paths | Executed. At `68dc407` it prints nothing. That the unchanged-file sentence names the two seal drawings alone is read |
| 7. The READMEs open with the emblem and the line | The first lines of each README are the image, the title, the language line and the bold description of *Data & interfaces* | Read. The image's path is opened: `test -f` on it exits 0. How GitHub draws it, in its light and its dark page, is seen at the pushed branch, by the owner at the pull request |
| 8. The README's commands run the app | Given a `git clone --no-local` of the branch in the builder's scratch, when the commands of the new section are run as written, then the install and the build exit 0 and the window opens | Executed once, with the Node.js version printed beside it |
| 9. Nothing says there is no code | `git grep -n -e 'no code yet' -e '코드는 없습니다' -- README.md README.ko.md` prints nothing | Executed. At `68dc407` it prints line 9 of each README, which *Scope* item 7 removes |
| 10. The table names the build order once | `git grep -n -e 'the build order' -e '만드는 순서' -e 'open decision on the emblem' -e '엠블럼에 대해 남겨 둔 결정' -- README.md README.ko.md` prints nothing | Executed. At `68dc407` it prints lines 16 and 18 of each README, which *Scope* item 8 changes |
| 11. The two editions keep one shape | The count of lines that open with `#` is the same for `README.md` and `README.ko.md`, and so is the count of table lines | Executed on the two files, with the two `grep -c` commands of *Grounding*. The `Broad gate` reads the same counts and is the orchestrator's |
| 12. The name document's decisions are stated for the settle | `## Rule changes` holds an operation for each edition of `docs/name.md`, and each `from` is the text the edition holds | Read against the two files by the reviewer |
| 13. The simpler drawing is in the tree and shown by nothing | `app-icon-small.svg` is committed with its SHA-256, `TRADEMARKS.md` says it is the drawing for 32 pixels and under, and no line of `apps/desktop/src` or `build.mjs` names it | Executed: `shasum -a 256`, and `git grep -n -e 'app-icon-small' -- apps/desktop/src apps/desktop/build.mjs` prints nothing, as it does at `68dc407`. `gaps.md` *Not done* holds the second half of the issue's first *Done when* line (`frame/questions.md` Q4) |

## Data & interfaces

The two SVG files are copied from `/Users/michael/Documents/GitHub/owlery/etcs/design/owlery-window-canvas/assets/` into `apps/desktop/assets/icon/` with their names kept.

The icon's command, run in `apps/desktop`:

```
rsvg-convert -w 1024 -h 1024 assets/icon/app-icon.svg -o assets/icon/app-icon.png
```

In `apps/desktop/src/main/main.ts`, inside `app.whenReady()`, before `createWindow()`: on `darwin`, `app.dock.setIcon` with the path of `app-icon.png` beside `main.js`, inside a `try` whose `catch` holds a comment that says why it does nothing. `apps/desktop/build.mjs` gains one `copyFile`, from `assets/icon/app-icon.png` to `dist/app-icon.png`, with a comment that says whose drawing it is. No protocol, no IPC channel and no dependency changes.

The one-line description, which the builder may reword only inside the voice of *Scope* item 5:

- `README.md`: **Answer once, and come back to a pull request sealed by a party that did not build it.**
- `README.ko.md`: **한 번 답하고 돌아오면, 만들지 않은 쪽이 인장을 찍은 PR이 와 있습니다.**

The image, in both editions: `<p align="center"><img src="apps/desktop/assets/icon/app-icon.svg" width="200" alt="…"></p>`, the `alt` saying in the edition's language that it is Owlery's emblem, a warm white owl on a black rounded square.

The new section is `## Run it` in `README.md` and `## 실행` in `README.ko.md`. Its commands are `pnpm install` and `pnpm --filter @owlery/desktop start`.

## Rule changes

- change
  file: docs/name.md
  section: Why this name
  from: - **The seal stays in the emblem.** The name says where the work gathers. The owl on the wax seal says what leaves: work that a party independent of the one that built it has judged and sealed.
  to: - **The emblem is the owl, and the wax stays with the seal.** The name says where the work gathers. Owlery's emblem is a warm white owl on a black rounded square: the little owl of AgenticSeal's seal, taken out of its wax, with no red on it. The app's icon and the README show it. The owl on the red wax seal stays AgenticSeal's mark of a guarantee and says what leaves: work that a party independent of the one that built it has judged and sealed. The window draws it at a seal's place and nowhere else, and red stands on the seal alone. The owner settled the emblem on 2026-11-19, to tell the product's face from the seal. Keeping the owl in the wax seal and drawing the owl in front of an owlery were the two options left open, and neither was taken.

- change
  file: docs/name.ko.md
  section: 왜 이 이름인가
  from: - **인장은 엠블럼이 맡습니다.** 이름은 일이 모이는 곳을 말합니다. 밀랍 봉인 위의 올빼미는 무엇이 나가는지를 말합니다. 만든 쪽이 아닌 독립된 쪽이 판정하고 인장을 찍은 작업입니다.
  to: - **엠블럼은 올빼미이고, 밀랍은 인장에 남습니다.** 이름은 일이 모이는 곳을 말합니다. Owlery의 엠블럼은 검은 둥근 사각형 위의 따뜻한 흰색 올빼미입니다. AgenticSeal 인장의 작은 올빼미를 밀랍에서 꺼낸 것이고, 붉은색은 없습니다. 앱의 아이콘과 README가 이 엠블럼을 보입니다. 붉은 밀랍 봉인 위의 올빼미는 AgenticSeal이 보증을 나타내는 표시로 남아, 무엇이 나가는지를 말합니다. 만든 쪽이 아닌 독립된 쪽이 판정하고 인장을 찍은 작업입니다. 창은 인장의 자리에만 그것을 그리고, 붉은색은 인장에만 씁니다. 소유자가 2026-11-19에, 제품의 얼굴을 인장과 구분하려고 엠블럼을 이렇게 정했습니다. 올빼미 밀랍 봉인을 유지하는 안과 owlery 앞의 올빼미를 그리는 안이 남아 있었고, 둘 다 고르지 않았습니다.

- add
  file: docs/name.md
  section: Why this name
  to: - **The name stays Owlery.** The owner decided it on 2026-11-19, in the rebranding that weighed the name again with the study of the window's look in hand. An owlery is where the owls come back to, and the window now opens on the inbox, the place the work comes back to, so the name says what the first screen is.

- add
  file: docs/name.ko.md
  section: 왜 이 이름인가
  to: - **이름은 Owlery로 둡니다.** 창의 모습을 살핀 조사를 놓고 이름을 다시 따진 리브랜딩에서, 소유자가 2026-11-19에 그렇게 정했습니다. owlery는 올빼미가 돌아오는 곳이고, 창은 이제 일이 돌아오는 작업함에서 열리므로, 이름이 첫 화면이 무엇인지를 말합니다.

- remove
  file: docs/name.md
  section: Open decisions

- remove
  file: docs/name.ko.md
  section: 결정을 남겨 둔 것

## Removes

The work adds no gate, check, hook or mark, so nothing is owed for one in return.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The sentences that say there is no code | `README.md` line 9, `README.ko.md` line 9 | The new section that says what runs today and how to run it (*Scope* item 6) |
| "the build order" among what the architecture document holds | `README.md` and `README.ko.md`, *Documents*, the row of `docs/architecture.md` | The roadmap's row of the same table, which already says "in what order" (*Scope* item 8) |
| "the open decision on the emblem" | `README.md` and `README.ko.md`, *Documents*, the row of `docs/name.md` | Nothing needs to: the decision is made (*Scope* item 9) |
| The section of open decisions, whose one row is the emblem's | `docs/name.md` *Open decisions*, `docs/name.ko.md` *결정을 남겨 둔 것* | *Why this name* in each edition. It leaves at the settle, by the `remove` operations of `## Rule changes`, and no commit of this work takes it out |

Framed 2026-11-19 by framer, before the build.
