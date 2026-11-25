# Questions for the planner: 1795610689-214-delete-dialog-lists-read-cleanly

`routing.md` answers `Automation` `yes`. No row below holds the build. Each row's default is what the build makes, and the owner may overturn it after the release.

The issue left these judgments open, and the tree answered them:

- Whether the dialog's row is written in place or through *Rule changes*: `frame/design.md` *Grounding*, the row for `docs/design.md` *Principles* 8.
- Whether the removal dialog's loss lists change with the delete dialog's: `frame/design.md` *Grounding*, "One function builds every loss list, and two dialogs draw it".
- Whether the hash takes `--ink-muted` at the contrast floor: `frame/design.md` *Grounding*, the row for *Principles* 9.
- Whether the screenshot run already captures the delete dialog: `frame/design.md` *Grounding*, the row for *A pull request that changes the window carries its screenshots*.
- Which work item of the scene holds the 39 commits: `frame/plan.md` *Alternatives considered*, the row "A scene work item made for the delete dialog alone".
- Whether every dialog's list changes: `frame/plan.md` *Alternatives considered*, the rows on `.named`.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | The section of the branch and the folder holds at most two entries. Should its head state a number, as the issue's "each section head states its count" reads, or name the two entries? | a person | (a) Name them: "The branch and the folder removed from disk". This counts in words and keeps the rows to bare paths. (b) A number: "2 removed from disk". It meets the issue's words and reads as a count of things of no one kind. (c) Keep "Removed from disk" and give each row a key column, "Branch" and "Folder". The head then has no count. | (a) | open |
| Q2 | A dialog whose lists are all full is taller than the window and scrolls as a whole, and its own edge can cut a row. Is that scroll inside what the issue's "where the list scrolls, it does not cut a row in half" asks? | a person | (a) No: the issue speaks of a list's own scroll. The whole dialog scrolls as every modal dialog of the window does, and only a dialog with several full lists reaches it. (b) Yes: the dialog takes a fixed head and foot and snaps its body on rows and heads, which is a new form for one dialog. (c) Cap the lists at fewer rows so the dialog always fits. That drops entries from sight, which `docs/product.md` refuses for a forced delete. | (a) | open |
| Q3 | Should a path be cut to one line with its whole text in the tooltip, or stand whole and wrapped, as #104 chose? | a person | (a) Cut: every row is one height, the list snaps on whole rows, and the view's changed files already cut a path the same way. A file name at the end of a long path is read by pointing at it. (b) Whole: a path is read in full without the pointer, but a wrapped row breaks the even scroll of *Scope* item 5 wherever a list holding it scrolls. | (a) | open |
| Q4 | Does Chromium in Electron 45.3.3 snap a scroll that a `scrollTop` assignment makes, or only one that a wheel, a key or the scroll bar makes? | the work | No probe can run here: a probe of the behaviour runs the built app, a launch of Electron the batch of phase 1 already makes. The case of the long list scrolls with a wheel event sent through CDP (`Input.dispatchMouseEvent`, `type: "mouseWheel"`), as a person scrolls. That event snaps whether or not an assignment does, so the answer changes no line of the build. | The case scrolls with a wheel event. Phase 1 records what it saw. | open |
