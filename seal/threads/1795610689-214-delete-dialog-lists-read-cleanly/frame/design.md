# Design: 1795610689-214-delete-dialog-lists-read-cleanly

## Grounding

The tree as read at `ab7a5730`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *What we deliberately don't do*, the bullet "Owlery deletes nothing of a person's work without that person's word" (line 170) | A forced delete runs "only after the person has read each by name". So the dialog cannot show the first few entries of a list and only count the rest: every entry the daemon lists stays readable in the dialog. A list longer than the dialog shows scrolls. It does not stop at a fixed number of entries. |
| `docs/design.md` *What every theme shares*, "The system's typefaces" | A commit's hash, a branch and a path stand in the fixed-width face. The issue asks for the same. |
| `docs/design.md` *Principles* 8 | The pull request that draws a form writes the form's row in *Components and their states* itself, in both editions, and leaves none to the settle. *Components and their states* has no row for the delete dialog: `grep -n -i delete docs/design.md` printed only line 468, the voice's example sentence (`executed`). So this work writes a new row, "The delete dialog", directly in both editions. |
| `docs/design.md` *Principles* 9 | Words stand at 4.5 to 1 or more. The hash takes `--ink-muted` on the dialog's `--ground-raised`. `apps/desktop/test/themes.test.ts` holds that pair: `--ink-muted` is listed on `AT_REST`, which holds `CARD = "--ground-raised"` (`read`). |
| `docs/design.md` *Components and their states*, "A dialog" | The delete dialog keeps the form of a dialog. Its new row adds only what is its own. |
| `docs/design.md` *The voice of the window's words*, "What will be lost is said before it is lost" | The counts in the section heads say how much is lost before the person reads a single entry. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | A screenshot is made from the built app by `pnpm run screenshots`. The run captures no delete dialog today: `VIEWS` in `apps/desktop/test/screenshots.ts:11` names `dialog`, and that view is the "New work item" form (`apps/desktop/test/screenshots.test.ts:488-491`) (`read`). "The pull request that adds a view to the run adds it to this list, in both editions", so the view list sentence is edited in place. |

What the tree says about the code, at `ab7a5730` (`read` unless marked):

- **One function builds every loss list, and two dialogs draw it.** `lossSections` (`apps/desktop/src/renderer/view.ts:1090-1100`) builds the sections. `lossParts` (`apps/desktop/src/renderer/renderer.ts:462-477`) draws them in the delete dialog (`renderer.ts:1216`) and, for each work item, in the repository's removal dialog (`renderer.ts:1138`). A change to the lists changes both dialogs. `git grep -n 'lossParts\|lossSections' -- apps/desktop/src` printed those two callers and no other (`executed`), which is the class rule 12 asks for.
- **The defects of the issue, each at its cause.**
  - The hash and the subject run together because `lossSections` joins them as `` `${hash} ${subject}` `` (`view.ts:1094`).
  - The gaps are uneven because each row is `min-height: var(--control-height)` with `align-items: center` (`index.html:566`), while `.named.whole` lets the text wrap (`index.html:569`). A one-line row has about 5px of air above and below its text. A wrapped row has none.
  - The list scrolls with a cut row because `dialog .named` is `max-height: var(--said-height); overflow: auto` (`index.html:564`), and 260px is not a whole number of rows of uneven height.
  - The heads have no count because the captions are fixed strings (`view.ts:1093-1098`), though the counts reach the renderer in `WorkItemLoss` (`apps/desktop/src/shared/protocol.ts:150-173`).
  - The lead is muted because `#delete-says` carries `.says` (`index.html:1035`), and `dialog .says` is `--ink-muted` (`index.html:561`).
- **The daemon already cuts each list at 500 entries and counts the rest.** `LOSS_LISTED = 500` is in `apps/desktop/src/daemon/worktrees.ts:713`, and `readLoss` stamps every entry, the left-out ones too (`worktrees.ts:775-815`). The dialog's "and N more" counts against what the daemon listed (`view.ts:1091`). This work changes nothing in the daemon or the protocol.
- **The view's commit rows already have the form the issue asks for.** `.commit` is a grid with the hash in `.hash` (fixed-width face, caption size) and the subject cut to one line with an ellipsis (`index.html:196-204`). The dialog takes the same parts. It takes `--ink-muted` for the hash where the view takes `--ink-faint`, as the issue asks.
- **`.named.whole` stays for two other lists.** `namedLines(…, true)` also draws the record dialog's `records-holds` list (`renderer.ts:1292`), and `#accounts-list` carries `named whole` in the markup (`index.html:956`). Only the loss lists leave that form.
- **A modal dialog taller than the window scrolls as a whole.** The records dialog relies on this for its sticky foot (`index.html:573-575`). The delete dialog is modal too (`renderer.ts:409`).
- **The built-app and unit cases that pin the lists today.**
  - `apps/desktop/test/view.test.ts:728-744` pins the captions, the joined lines and "and 500 more".
  - `apps/desktop/test/work-item-menu.test.ts:810-853` pins the delete dialog's heads and lines.
  - `apps/desktop/test/work-item-menu.test.ts:932-966` pins the removal dialog's.
- **No sibling item of the release has built anything yet.** `git -C <worktree> diff --stat ab7a5730` in the worktrees of #224, #217, #242 and #235 printed only each one's `routing.md`. #237's printed `hooks.ts`, `main.ts`, `pane-chain.ts`, `apps/desktop/package.json`, `.github/workflows/owlery-seal.yml` and its records (`executed`, 2026-11-25).
- **Records with nothing to say for this work.**
  - `seal/follow-up.md` does not stand, so no item waits on this work (`executed`: `cat` found no file).
  - `docs/README.md` does not stand, so the policy root has no index. Each `file:` of *Rule changes* is a document of `docs/` named by its path, as release 0.0.4's designs named theirs (`git show 4fab2240:seal/threads/1795559736-caps-on-worktrees-and-agents/frame/design.md`, `executed`).
  - The latest GitHub Release, `v0.0.3`, holds no `### Process changes` heading (`gh release view`, `executed`).
- **Precedent for writing a form's row in place.** #211 wrote the Machine dialog's row and the view list sentence into both editions of `docs/design.md` in its own pull request (`git show db398387 -- docs/design.md`, `executed`).
- **The issue.** `gh issue view 214 --json title,body,comments` printed no comment (`executed`, 2026-11-25).

## Scope

In:

1. **Each commit stands on one row of two columns.** The short hash is in the fixed-width face, at `--size-caption`, in `--ink-muted`. The subject is in `--ink`, at `--size-second`, cut to one line with an ellipsis. The row's tooltip (`title`) holds the whole subject. The hashes of one list stand in one column, as wide as the widest hash, because git's short hash can be longer than seven characters in a large repository.
2. **Paths stand in the fixed-width face as a compact list.** This covers the branch, the folder, the files with uncommitted changes, the untracked files and the ignored files and folders. Each path is at `--size-caption`, in `--ink`, cut to one line with an ellipsis, and the row's tooltip holds the whole path. Q3 holds the choice to cut a path.
3. **Every row of a loss list is one line of one height, `--detail-line`, with no gap between rows.** So every list has one even gap between entries.
4. **Each section head states its count.** It counts what the loss counts (`commitCount`, `uncommittedCount`, `untrackedCount`, `ignoredCount`), not the entries listed. One entry takes the singular.
   - "39 commits no other branch, no remote and no tag holds" / "1 commit no other branch, no remote and no tag holds"
   - "3 files with changes that are not committed" / "1 file with changes that are not committed"
   - "2 untracked files" / "1 untracked file"
   - "14 ignored files and folders, which go with the folder" / "1 ignored file or folder, which goes with the folder"
   - The section that held "Removed from disk" holds at most the branch and the folder. Its head names them: "The branch and the folder removed from disk", "The branch removed from disk" or "The folder removed from disk". Its rows are the branch's name and the folder's path, in that order. Q1 holds this choice.
5. **A list scrolls without cutting a row in half, and every entry the daemon listed stays readable.** A loss list shows at most ten rows, `max-height: calc(10 * var(--detail-line))`, which is the 260px of `--said-height` the box has today. Past that it scrolls with `scroll-snap-type: y mandatory`, and each row snaps at its start. The rows are of one height and the box is a whole number of rows tall, so every rest of the scroll shows whole rows only. Where the daemon cut a list at 500, the line under it still says "and N more", counted as `count − listed`. Q2 holds why the list scrolls and does not stop at a fixed number.
6. **The opening sentence is the delete dialog's lead.** `#delete-says` stands in `--ink` at `--size-text`, not in the muted ink of a note. "Nothing on a remote is removed." (`#delete-remote`) stays a muted note.
7. **The removal dialog's loss lists take items 1 to 5 as well**, since `lossParts` draws both dialogs.
8. **The row "The delete dialog" is written in *Components and their states*, in both editions of `docs/design.md`.** It states the form of items 1 to 6 and says that the repository's removal dialog draws each work item's loss in the same form. The text of the English row is under *Data & interfaces*.
9. **The screenshot run gains a view, `delete`.** It shows the delete dialog of a work item that holds 39 commits no other branch holds.
   - The run commits the 39 commits in the worktree of "Rename the settings file", the work item whose session waits for the machine. It does this before the look is taken, next to the two commits of the shown work item. Some subjects are longer than the row, so the shot shows the ellipsis.
   - It also writes one untracked file at a nested path and the ignored `.env` there, so the shot shows the untracked and the ignored path lists.
   - The view's step opens the dialog from the work item's menu in the sidebar, and its leave step presses Cancel, which deletes nothing.
   - The view list sentence of *A pull request that changes the window carries its screenshots* gains "the delete dialog of a work item with many commits", in both editions, in place.
   - The run's new scene paragraph goes through *Rule changes*.
10. **The pull request carries the delete dialog's screenshots in every theme and appearance.** That is six PNG files, made by `OWLERY_SCREENSHOT_THEMES=all pnpm run screenshots` and committed under this work item's directory, as *A pull request that changes the window carries its screenshots* says.

Out:

- **The "Running sessions that end" list stays as it is.** It is `.named`, one line per row at `--control-height`, so its gaps are already even. The archive dialog, the removal dialog and the dialog before the daemon ends draw the same list. Changing it would change three dialogs the issue does not name.
- **The opening sentence of every other dialog stays muted.** That includes the removal dialog's lead and the `deleteSays` sentence under each work item there. Every other dialog's `.says` is a note under a head that already says what the dialog does, and changing them all would need screenshots of every dialog.
- **No rule under each loss row in Register.** *The themes* gives Register a rule under each row of a list of records. The issue does not ask for one in the dialog, and adding the dialog to that list changes the themes table in both editions.
- **The daemon, `WorkItemLoss` and the 500-entry cut stay as they are.** The ideas under *What the daemon could do beyond the issue* are proposals, not scope.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A work item with commits | Given a work item whose branch holds commits no other branch holds. When the person opens its delete dialog. Then each commit is one row: the hash in the fixed-width face and `--ink-muted`, the subject on one line with an ellipsis where it is long, and the whole subject in the row's tooltip. | A built-app case in `apps/desktop/test/work-item-menu.test.ts` the case "names in the delete dialog the branch, the folder, the commit no other branch holds by its hash and its subject apart, …". It reads each row's hash and subject parts, the computed `font-family` and `color` of the hash, the subject's `white-space`/`text-overflow`, and the row's `title`. |
| Counts in the heads | Given the same work item with 1 commit, 1 untracked file and 1 ignored file. Then the heads read "The branch and the folder removed from disk", "1 commit no other branch, no remote and no tag holds", "1 untracked file", "1 ignored file or folder, which goes with the folder". After a second untracked file arrives and the loss is read again, the head reads "2 untracked files". | The same case's `lossIn` heads. Unit cases of `lossSections` in `apps/desktop/test/view.test.ts` cover every kind, the singular and the plural. |
| Even gaps | Given any loss. Then every row of every loss list has the same height, `--detail-line`, whether its text is cut or not. | The built-app case reads `offsetHeight` of every `li` under `#delete-loss` and finds one value. A path longer than the dialog is among them. |
| A long list | Given a work item with more than ten commits no other branch holds. When the person scrolls the list. Then the list is ten rows tall and comes to rest with no row cut at its top or its foot. The head counts every commit. | A built-app case commits twelve commits in a worktree. It reads that the list's `clientHeight` is ten rows. It scrolls with a wheel event sent through the Chrome DevTools Protocol (CDP), then reads that `scrollTop` rests on a whole number of rows. Q4 holds why a wheel event and not a `scrollTop` assignment. |
| A list the daemon cut | Given a loss whose `commitCount` exceeds the commits listed. Then the line under the list says "and N more" with N = count − listed. | Unit case of `lossSections` in `view.test.ts` (the case "counts in each heading what the loss counts, …", kept with its counts). |
| The lead | When the delete dialog opens. Then its opening sentence is in `--ink` at `--size-text`, and "Nothing on a remote is removed." stays in `--ink-muted`. | The built-app case reads the computed `color` of `#delete-says` and `#delete-remote` against the resolved tokens. |
| The removal dialog | Given a repository whose removal deletes its work items. Then each work item's loss there has the same heads with counts and the same rows. | The removal cases of `work-item-menu.test.ts` "deletes a repository's work items from disk at its removal …" and "keeps in the removal's dialog the refusal …" with the new heads. |
| The policy row | The row "The delete dialog" stands in *Components and their states* in `docs/design.md` and `docs/design.ko.md`, and the screenshot view list names the delete dialog in both. | The broad gate's heading and table-row comparison of the two editions (orchestrator's run). The proofer reads that the two rows say the same. |
| The screenshots | `OWLERY_SCREENSHOT_THEMES=all pnpm run screenshots` writes `<theme>-<appearance>-delete.png` for every theme and appearance. Each shows the dialog of "Rename the settings file" with "39 commits no other branch, no remote and no tag holds" over ten whole rows. | `apps/desktop/test/screenshots.test.ts`: the names case lists the new files, and the run's step waits for that head. The six PNGs are committed under this work item's directory and shown in the pull request's body. |

## Data & interfaces

`apps/desktop/src/renderer/view.ts`:

```ts
/** One entry of a loss list: a commit by its short hash and its subject, or a path. */
export type LossRow = { hash: string; subject: string } | { path: string };

/** One kind of thing a loss names: its head with its count, a row for each entry the loss lists, and how many more there are where the daemon cut the list, or nothing. */
export interface LossSection {
  caption: string;
  rows: LossRow[];
  more: string;
}
```

`lossSections(loss)` keeps its order of sections and leaves out a kind the loss holds none of. The `lines: string[]` field goes, and `rows` replaces it. The builder may name the parts differently. It keeps the hash and the subject apart, and keeps the count in the caption.

`apps/desktop/src/renderer/renderer.ts`: `lossParts` draws each section as its `h3.caption` head, then a list with its own class, for example `ul.loss`, then `p.more` where `more` is not empty. It no longer uses `namedLines(…, true)`.
- A commit row is an `li` holding `span.hash` and `span.subject`, with `title` set to the subject.
- A path row is an `li` holding `span.path`, with `title` set to the path.
- `#delete-says` gains its own rule, or loses `.says`, so it takes `--ink`.

`apps/desktop/src/renderer/index.html` styles:
- The loss list is a grid whose first column is as wide as the widest hash.
- Each row is one `--detail-line` high, set by the list's `grid-auto-rows` alone, and aligned to the centre.
- The list is `max-height: calc(10 * var(--detail-line)); overflow: auto; scroll-snap-type: y mandatory`.
- Each row is `scroll-snap-align: start`.
- The hash is `--font-mono`, `--size-caption`, `--ink-muted`.
- The subject and a path are cut with an ellipsis.

The English row for *Components and their states*. The Korean edition says the same, written by the builder in `docs/design.ko.md`'s own words:

> | The delete dialog | The form of a dialog, headed "Delete" and the work item's name. Its first sentence, which says what the delete does or what it would lose, is its lead, in `--ink`. Under it stands a section for each kind of thing the delete removes or loses, its head stating how many: "39 commits no other branch, no remote and no tag holds". A section that would hold the branch and the folder names them in its head: "The branch and the folder removed from disk". Each entry stands on one row of `--detail-line`, with no gap between rows. A commit's row holds its short hash in the fixed-width face and `--ink-muted`, in a column as wide as the list's widest hash, then its subject in `--ink`, cut to one line. A path's row holds the path in the fixed-width face, cut to one line. Each row's tooltip holds its whole subject or path. A list of more than ten rows is ten rows tall and scrolls, and comes to rest on whole rows. Where the daemon listed fewer entries than it counted, "and N more" stands under the list. "Nothing on a remote is removed." stays in `--ink-muted`. The repository's removal dialog draws each work item's loss in this form. | — | — | — | — | — |

## Rule changes

- add
  file: docs/design.md
  section: A pull request that changes the window carries its screenshots
  to: **The screenshot run's scene holds a work item with many commits no other branch holds, and the run captures its delete dialog.** Before the look is taken, the run commits 39 commits on the branch of the work item whose session waits for the machine, some with a subject longer than a row of the dialog. It writes an untracked file at a nested path and the ignored `.env` into that work item's worktree. The view of the delete dialog opens that work item's menu in the sidebar, presses Delete, and waits until the head of its commits counts 39. Cancel then closes the dialog, and nothing is deleted. So the shot shows a list longer than the dialog shows at once, cut subjects, and the untracked and the ignored path lists.
    check: apps/desktop/test/screenshots.test.ts
- add
  file: docs/design.ko.md
  section: 창을 바꾸는 PR은 스크린샷을 싣습니다
  to: **스크린샷 실행의 장면에는 다른 브랜치가 갖지 않은 커밋이 많은 작업이 하나 있고, 실행은 그 작업의 삭제 대화 상자를 찍습니다.** 실행은 둘러본 시점을 잡기 전에, 세션이 컴퓨터를 기다리는 작업의 브랜치에 커밋 39개를 합니다. 그 가운데 몇 커밋의 제목은 대화 상자의 한 행보다 깁니다. 실행은 그 작업의 워크트리에 깊은 경로의 추적하지 않는 파일 하나와 무시되는 `.env`를 씁니다. 삭제 대화 상자의 화면은 사이드바에서 그 작업의 메뉴를 열고 Delete를 누른 뒤, 커밋 절의 머리가 39를 셀 때까지 기다립니다. 그다음 Cancel이 대화 상자를 닫고, 아무것도 지우지 않습니다. 그래서 이 스크린샷은 대화 상자가 한 번에 보이는 것보다 긴 목록, 잘린 제목, 추적하지 않는 경로 목록과 무시되는 경로 목록을 보입니다.
    check: apps/desktop/test/screenshots.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The commit entry joined into one string, `` `${hash} ${subject}` `` | `apps/desktop/src/renderer/view.ts#lossSections` | A `LossRow` with the hash and the subject apart. The row draws them in two columns. |
| `LossSection.lines: string[]` | `apps/desktop/src/renderer/view.ts#LossSection` | `LossSection.rows: LossRow[]`. `lossSections` is its only producer and `lossParts` its only reader. |
| The fixed captions with no count: "Removed from disk", "Commits no other branch, no remote and no tag holds", "Files with changes that are not committed", "Untracked files", "Ignored files and folders, which go with the folder" | `apps/desktop/src/renderer/view.ts#lossSections` | The counted heads of *Scope* item 4. |
| The loss lists' use of `namedLines(lines, true)`, and with it their inner box of `--said-height` that cut a row | `apps/desktop/src/renderer/renderer.ts#lossParts` | The loss list's own rule in `index.html`, of whole rows that snap. `namedLines` stays for the session lists and `records-holds`. |
| The comment "What a delete would remove is read whole: a long path or subject takes the lines it needs." | `apps/desktop/src/renderer/index.html`, above `dialog .named.whole li > span` | Rewritten to name the lists that rule still serves: the Accounts list and the record dialog's `records-holds`. The loss lists' rule carries its own comment. |
| The delete dialog's lead in `dialog .says`'s muted ink | `apps/desktop/src/renderer/index.html`, `#delete-says` | Its own rule in `--ink`. `.says` keeps every other dialog's note. |
| The case pins of the old captions and joined lines | `apps/desktop/test/view.test.ts`, the case at `:728`; `apps/desktop/test/work-item-menu.test.ts`, the `named` heads at `:830-835`, `:848` and `:936` | Rewritten to the counted heads and the split rows, each shown red against the old code as rule 15 asks. |

## What the daemon could do beyond the issue

The orchestrator takes what is cheap and in scope, and files issues for the rest. None of these is in *Scope*, and none was probed.

- **Say where the work already stands on the base.** A branch whose pull request was squash-merged holds every one of its commits "on no other branch", so the dialog counts 39 commits lost while their changes stand on the base. The daemon could read this exactly. It could merge the branch into its base with `git merge-tree --write-tree` and compare the tree with the base's. Where they are equal, the dialog could say the branch's changes already stand on the base. This changes the product rule on forcing a delete (`docs/product.md` line 170), so it needs an issue and a person. Cost: one `merge-tree` per read of a loss.
- **Name the work item's merged pull request in the dialog.** The renderer already holds `WorkItem.pullRequest` with `state: "merged"` (`apps/desktop/src/shared/protocol.ts:412-415`). One line, "Pull request #12 is merged.", would tell the person why the commits may not matter. It is renderer-only and cheap, but it adds a sentence and a part to the dialog that the issue did not ask for. Candidate for the orchestrator to fold in or file.
- **Say what disk the delete frees.** The ignored folders, `node_modules/` above all, are often most of a worktree. The daemon could measure the worktree when the dialog asks. A `du` over `node_modules/` can take seconds and runs only while the dialog is open, which fits "a feature costs nothing while nobody uses it" (`docs/architecture.md` *Memory design*). An issue.
- **Keep a forced delete undoable for a while.** The daemon could keep the branch's tip under a ref of its own for some days before it lets git collect the commits, and offer to restore it. This changes what "delete" means in `docs/product.md`, so it is for an issue and a person.

Framed 2026-11-25 by framer, before the build.
