# Design: the brand outside the window

The ticket is issue #21. Its comments were read with `gh issue view 21 --json body,comments` on 2026-11-19: it has none, and its body is the one corrected that day.

## Grounding

The tree as read at `611701c`. What issue #18 commits is read on its branch, `feat/18-the-app-opens-on-a-pane-of-terminals`, at `6509bae`, and each such row says so.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/name.md` *Open decisions*, the *Emblem* row, and `docs/name.ko.md` *결정을 남겨 둔 것* | The one open row of the document: "Keep the owl in a wax seal / draw the owl in front of an owlery", with keeping the wax seal recommended. The owner chose AgenticSeal's owl seal for the window on 2026-11-19 (#18's `frame/design.md` *Scope* item 15), so the row is settled as the first option |
| `docs/name.md` *What to keep in mind*, the first bullet | The READMEs and the icon borrow no image from the Harry Potter books, such as an owl carrying a letter |
| `docs/product.md` *What we promise*, and `docs/product.ko.md` *무엇을 약속하는가* | The promise in one bold sentence. The READMEs' one-line description is taken from it and promises nothing the document does not |
| `docs/product.md` *What we deliberately don't do*, the last bullet | No throughput claim in the READMEs |
| `docs/architecture.md` *License and code from other projects*, and the `add` #18's `## Rule changes` states for it | The names and the emblem are not under the Apache License, and `TRADEMARKS.md` lists the drawings in the tree. A drawing this work adds is listed there |
| `docs/architecture.md` *Platforms and their order* | The first version is the macOS desktop app only, so the icon is the one the macOS Dock shows |
| `docs/roadmap.md` *Open decisions*, the row "Releases below 0.1.0" | Whether a release below 0.1.0 is a packaged download is open. The tree holds no packager, so "the built app" is what `pnpm --filter @owlery/desktop start` runs |
| `seal/config.json`, `Broad gate` | The README pair keeps equal counts of `#` lines and of table lines, and the Korean edition does not use the word the gate's last search names |

What the reading and the probes found:

- **The emblem's file and its PNG.** #18 commits `apps/desktop/assets/seals/owl-icon-cream.svg` at `6509bae`, byte for byte the file of the AgenticSeal plugin 0.38.2 (executed: `shasum -a 256` gives `fa8ffa5d…` for both). It is a red wax seal with a cream owl on a transparent ground, 1200 units square, and the seal's outline reaches from 22 to 1177 of those units (read). Its colours are `#c41a1e`, `#9e1016`, `#e8463c` and `#f6ecd8`, none of them a property of the window's style (read: `:root` of `src/renderer/index.html` at `6509bae`).
- **The icon can be drawn from that file with a tool on this machine, and the drawing repeats.** Executed in the framer's scratch: `rsvg-convert` 2.58.4 at `-w 512 -h 512` gave a PNG whose SHA-256 is that of the plugin's own `owl-icon-cream.png` (`e8181500…`), and the command of *Data & interfaces* gave a PNG 1024 pixels square with an alpha channel, the seal 824 pixels wide in its middle.
- **`app.dock.setIcon` takes a path to a PNG, and throws on a missing file.** Read in `electron.d.ts` of Electron 45.3.3: `setIcon(image: NativeImage | string)`, macOS only; `BrowserWindow`'s `setIcon` is marked `win32,linux`, so a macOS window draws no icon. Executed once with that Electron on macOS 26.5 (`test_tmp_dock.js` in the framer's scratch): the padded PNG's path did not throw, and a path to no file threw "Failed to load image from path". The probe's screen capture showed no Dock, so whether the Dock draws the image as given was not seen (`frame/questions.md` Q3).
- **No case imports the main process.** Executed: `git grep -n -e 'main/main' -- apps/desktop/test` prints nothing. `src/main/main.ts` imports `electron`, and its one decision with cases, `pickFolder`, lives in a file of its own.
- **The READMEs at `611701c`.** Executed, each search with `git grep -n` over `README.md` and `README.ko.md`: `-e 'no code yet' -e '코드는 없습니다'` prints line 9 of each; `-e 'the build order' -e '만드는 순서'` prints line 16 of each, the row of `docs/architecture.md`; `-e 'open decision on the emblem' -e '엠블럼에 대해 남겨 둔 결정'` prints line 18 of each. `grep -c '^#'` gives 4 for each and `grep -c '^|'` gives 6 for each.
- **The *Documents* table does not call `docs/roadmap.md` "the build order".** The words stand in the row of `docs/architecture.md`, whose *Build order* section now holds the rule for the first milestone's shape and what follows v0.1, and sends the order to the roadmap (read). `seal/threads/1795005804-v0.1-scope-and-milestones/gaps.md` *Not done* left the row as it is. The issue's sentence is read as its aim: the table names the build order in one row, the roadmap's.
- **How the app is run.** Read in `package.json` and `apps/desktop/package.json`: `packageManager` is `pnpm@10.33.0`, the install rebuilds `node-pty`, and `start` builds and runs `electron .`. No document of the tree names a Node.js version (executed: `git grep -n -i -e 'node\.js' -e 'corepack' -- docs README.md apps/desktop/package.json` prints nothing).
- **The brand's voice** is stated in the owner's design study, `etcs/research/ux.md` *리브랜딩*, which is uncommitted and stays so. Read there, and restated in *Scope* item 4 in this frame's words: three words for the character (calm, exact, on the record), and rules for the product's sentences. Nothing of the study is copied into the tree.
- **The window's palette is not settled.** The owner judged the window's look on 2026-11-19, and a style study for a polish phase of #18 is running. This is the orchestrator's finding, from the spawn's prompt. Its folder, `etcs/design/polish-mockups/`, held one file when read on 2026-11-19, the same emblem (executed: the same SHA-256).
- **No index of the policy root and no follow-up file exist.** Executed: `ls docs` lists the four document pairs and no `README.md`, and `ls seal/follow-up.md` fails. Each `file:` of `## Rule changes` is picked from that listing.
- **No other unsettled design names `docs/name.md`.** Read: the `## Rule changes` of #18, #19, #9 and #10 on their branches name `docs/architecture.md`, `docs/product.md` and `docs/roadmap.md` and their Korean editions.

## Scope

The subject is the app's icon and the README pair. `docs/name.md` is changed through `## Rule changes`, as a work item whose subject is the code states its rules, and the settle of release 0.0.1 writes them (issue #25, *Done when*, its last line). So the third line of this issue's *Done when* holds once that settle has run, and until then `docs/name.md` keeps its open row on `release/v0.0.1`.

1. **The app's icon is the emblem, redrawn at the size of a Dock tile and nothing else.** `apps/desktop/assets/seals/owl-app-icon.png` is drawn from `owl-icon-cream.svg` by the command of *Data & interfaces*: 1024 pixels square, the seal 824 pixels wide in the middle, the rest transparent. It has no tile and no ground behind the seal (`frame/questions.md` Q2).
2. **The app shows it in the Dock.** `apps/desktop/build.mjs` copies the PNG into `dist/`, beside the emblem's SVG. `src/main/main.ts` sets it as the Dock's icon once the app is ready, on macOS alone. A file that cannot be loaded leaves Electron's icon and does not stop the app's start: the daemon's handlers and the window are set up whether or not the icon was.
3. **`TRADEMARKS.md` lists the new drawing**: its path, that it is drawn from the file above it, and the command and the librsvg version that drew it. That entry is the one home of the command.
4. **Both READMEs open with the emblem and the brand's one-line description.** Each opens with the emblem as an image, from the SVG's path in the tree, with a text alternative that says what the drawing is, then the title, the language line, and the description of *Data & interfaces* in bold. The paragraphs under it say what Owlery is and where the name comes from, with the facts the two paragraphs hold today. The voice: calm, exact and on the record. Each sentence is complete and says what happens. No exclamation mark, no "AI", no throughput number, no wordplay on owls, and no image from the Harry Potter books.
5. **Both READMEs say how to run the app**, in a new section before *Documents*: what the tree's release does today (the window that opens on the inbox, work items with a worktree of their own, terminal panes, one question to a headless session), that no seal exists before milestone 2, with a link to the roadmap; what a person needs (macOS, Node.js, pnpm in the version `package.json` names); and the commands, from the top of the tree. The builder states the Node.js version it ran them with and claims no minimum.
6. **Both READMEs stop saying there is no code**: line 9 of each goes.
7. **The *Documents* table names the build order in the roadmap's row alone.** The row of `docs/architecture.md` says "the rule for the first milestone's shape and what follows v0.1" where it says "the build order", and its Korean edition the same. The row of `docs/name.md` ends "and the emblem" where it ends "and the open decision on the emblem".
8. **The emblem and the name are recorded as settled**, by the operations of `## Rule changes`. The two `add` operations, which say the name stays, state the default of `frame/questions.md` Q1. Where the owner answers otherwise, the fold rewrites them and this scope.
9. **The work follows the palette #18 settles by holding none of it.** The icon carries the emblem's four colours, which are AgenticSeal's drawing and not the window's, on a transparent ground. The READMEs name no colour and show no picture of the window. Phase 1 draws the icon from the emblem's file as `release/v0.0.1` holds it once #18 has merged, so an emblem #18's polish replaces is the one drawn. Where the owner answers Q2 with a tile, its ground is the window's ground as #18 has settled it by then.
10. Out of scope, each with its reason:
    - A packaged app: an `.icns` file, the app's name in the menu bar and under the Dock's tile, signing. The tree has no packager, and the roadmap's row on releases below 0.1.0 is open. Under `electron .` the Dock shows Electron's icon until the app is ready, and the system calls the app "Electron". The hand-back names it as a follow-up.
    - A window icon for Windows and Linux. The first version is macOS only, and a macOS window draws none.
    - A screenshot of the window in the READMEs. The window's look is under polish in #18.
    - The trademark search `docs/name.md` *What to keep in mind* asks for before release.
    - The version, which does not move.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The Dock shows the owl | Given the app built from the tree, when a person starts it with the README's command, then its Dock tile is the owl seal | The built app started once, and the screen captured with `screencapture` while it runs; the builder reads the Dock in the capture. Where the capture shows no Dock, the row goes to `gaps.md` *Not verified* with the owner as its answerer (`frame/questions.md` Q3) |
| 2. The build carries the icon | After `pnpm --filter @owlery/desktop run build`, `dist/owl-app-icon.png` exists and is the committed file | Executed: `cmp` of the two files exits 0 |
| 3. The committed icon is the one the command draws | The command of `TRADEMARKS.md`, run into the builder's scratch, gives the committed file | Executed: the two SHA-256 sums are equal. Where the builder's librsvg is not the version the entry names, the sums are read as they come and a difference goes to the phase record |
| 4. A missing icon does not stop the app | Given `dist/` without the PNG, when the app starts, then the window opens and reaches the daemon | The built app started once with the file removed from `dist/`, and the window's first screen read through the debugging port |
| 5. The READMEs open with the emblem and the line | The first lines of each README are the image, the title, the language line and the bold description of *Data & interfaces* | Read. The image's path is opened: `test -f` on it exits 0. How GitHub draws it is seen at the pushed branch, by the owner at the pull request |
| 6. The README's commands run the app | Given a `git clone --no-local` of the branch in the builder's scratch, when the commands of the new section are run as written, then the install and the build exit 0 and the window opens | Executed once, with the Node.js version printed beside it |
| 7. Nothing says there is no code | `git grep -n -e 'no code yet' -e '코드는 없습니다' -- README.md README.ko.md` prints nothing | Executed. At `611701c` it prints line 9 of each README, which *Scope* item 6 removes |
| 8. The table names the build order once | `git grep -n -e 'the build order' -e '만드는 순서' -e 'open decision on the emblem' -e '엠블럼에 대해 남겨 둔 결정' -- README.md README.ko.md` prints nothing | Executed. At `611701c` it prints lines 16 and 18 of each README, which *Scope* item 7 changes |
| 9. The two editions keep one shape | The count of lines that open with `#` is the same for `README.md` and `README.ko.md`, and so is the count of table lines | Executed on the two files, with the two `grep -c` commands of *Grounding*. The `Broad gate` reads the same counts and is the orchestrator's |
| 10. The name document's decisions are stated for the settle | `## Rule changes` holds an operation for each edition of `docs/name.md`, and each `from` is the text the edition holds | Read against the two files by the reviewer |

## Data & interfaces

The icon's command, run in `apps/desktop`:

```
rsvg-convert -w 824 -h 824 --page-width 1024 --page-height 1024 --left 100 --top 100 assets/seals/owl-icon-cream.svg -o assets/seals/owl-app-icon.png
```

The seal takes about four fifths of the canvas. The proportion is the framer's choice and is read from no document; the owner judges it in the Dock.

In `apps/desktop/src/main/main.ts`, inside `app.whenReady()`: on `darwin`, `app.dock.setIcon` with the path of `owl-app-icon.png` beside `main.js`, inside a `try` whose `catch` holds a comment that says why it does nothing. `apps/desktop/build.mjs` gains one `copyFile` for the PNG. No protocol, no IPC channel and no dependency changes.

The one-line description, which the builder may reword only inside the voice of *Scope* item 4:

- `README.md`: **Answer once, and come back to a pull request sealed by a party that did not build it.**
- `README.ko.md`: **한 번 답하고 돌아오면, 만들지 않은 쪽이 인장을 찍은 PR이 와 있습니다.**

The image, in both editions: `<p align="center"><img src="apps/desktop/assets/seals/owl-icon-cream.svg" width="120" alt="…"></p>`, the `alt` saying in the edition's language that it is a cream owl on a red wax seal.

The new section is `## Run it` in `README.md` and `## 실행` in `README.ko.md`. Its commands are `pnpm install` and `pnpm --filter @owlery/desktop start`.

## Rule changes

- change
  file: docs/name.md
  section: Why this name
  from: - **The seal stays in the emblem.** The name says where the work gathers. The owl on the wax seal says what leaves: work that a party independent of the one that built it has judged and sealed.
  to: - **The seal stays in the emblem.** The name says where the work gathers. The owl on the wax seal says what leaves: work that a party independent of the one that built it has judged and sealed. The emblem is settled as that owl seal: the app's icon, the README and the window's bar show AgenticSeal's little owl on a red wax seal. Drawing the owl in front of an owlery was the other option. It was set aside because the wax seal carries the picture of "a commit after the seal breaks it", and the name does not.

- change
  file: docs/name.ko.md
  section: 왜 이 이름인가
  from: - **인장은 엠블럼이 맡습니다.** 이름은 일이 모이는 곳을 말합니다. 밀랍 봉인 위의 올빼미는 무엇이 나가는지를 말합니다. 만든 쪽이 아닌 독립된 쪽이 판정하고 인장을 찍은 작업입니다.
  to: - **인장은 엠블럼이 맡습니다.** 이름은 일이 모이는 곳을 말합니다. 밀랍 봉인 위의 올빼미는 무엇이 나가는지를 말합니다. 만든 쪽이 아닌 독립된 쪽이 판정하고 인장을 찍은 작업입니다. 엠블럼은 이 올빼미 봉인으로 정했습니다. 앱의 아이콘, README, 창의 위쪽 줄이 AgenticSeal의 붉은 밀랍 봉인 위 작은 올빼미를 보입니다. owlery 앞의 올빼미를 그리는 안도 있었습니다. "인장 뒤에 커밋이 들어오면 깨진다"는 그림은 밀랍 봉인이 보여 주고 이름은 그 그림을 담지 않으므로, 그 안은 접었습니다.

- add
  file: docs/name.md
  section: Why this name
  to: - **The name stays Owlery.** The rebranding of 2026-11-19 weighed the name again, with the study of the window's look in hand, and kept it. An owlery is where the owls come back to, and the window now opens on the inbox, the place the work comes back to, so the name says what the first screen is.

- add
  file: docs/name.ko.md
  section: 왜 이 이름인가
  to: - **이름은 Owlery로 둡니다.** 2026-11-19의 리브랜딩에서 창의 모습을 살핀 조사를 놓고 이름을 다시 따졌고, 그대로 두기로 했습니다. owlery는 올빼미가 돌아오는 곳이고, 창은 이제 일이 돌아오는 작업함에서 열리므로, 이름이 첫 화면이 무엇인지를 말합니다.

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
| The sentences that say there is no code | `README.md` line 9, `README.ko.md` line 9 | The new section that says what runs today and how to run it (*Scope* item 5) |
| "the build order" among what the architecture document holds | `README.md` and `README.ko.md`, *Documents*, the row of `docs/architecture.md` | The roadmap's row of the same table, which already says "in what order" (*Scope* item 7) |
| "the open decision on the emblem" | `README.md` and `README.ko.md`, *Documents*, the row of `docs/name.md` | Nothing needs to: the decision is made (*Scope* item 8) |
| The section of open decisions, whose one row is the emblem's | `docs/name.md` *Open decisions*, `docs/name.ko.md` *결정을 남겨 둔 것* | *Why this name* in each edition. It leaves at the settle, by the `remove` operations of `## Rule changes`, and no commit of this work takes it out |

Framed 2026-11-19 by framer, before the build.
