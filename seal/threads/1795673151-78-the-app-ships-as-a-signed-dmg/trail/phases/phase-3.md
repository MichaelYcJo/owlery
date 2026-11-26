# Phase 3: 1795673151-78-the-app-ships-as-a-signed-dmg

## What this phase found

**The section "Install" stands first in both READMEs, before "Run it", which is the way of a contributor.** `README.md` names it "Install" and `README.ko.md` "설치", as each README names its other sections in its own language. It holds what `frame/design.md` *Scope* item 10 lists: the download for Apple silicon alone (Q2's default); steps 1 to 5 of *What a person who downloads the build without the certificate meets*; what Owlery needs on the Mac; and the newer version installed by hand after "Quit Owlery Completely…" (Q3's default). Judged against *Scope* item 10 and `frame/questions.md` Q2 and Q3.

**The download's address is the frame's, written for this repository.** The README links `https://github.com/MichaelYcJo/owlery/releases/latest/download/Owlery-arm64.dmg`, the address `frame/plan.md` *Operational impact*, *The site's link*, gives with the repository `gh repo view` names (`executed`). No release holds the asset yet, so the link has not been opened, and `gaps.md` holds the row. The README also links the releases page, which serves every release's download.

**The menu is named where it stands.** "Quit Owlery Completely…" is an item of the Owlery menu on macOS (`apps/desktop/src/main/menu.ts#menuTemplate`, `read`). The Korean README keeps the item's English label, which the app shows in every language, and gives macOS's own Korean labels for System Settings' items with the English "Open Anyway" beside "그래도 열기". Those Korean labels are recalled and were not read on a screen, so `gaps.md`'s row for Q6 holds them.

**The README states the steps once, and the changelog fragment states what changed.** The fragment, `changelog.md`, holds the three facts of *Scope* item 12: the download, the first open of a build without the certificate, and the newer version installed by hand. It also holds what Owlery needs on the Mac, that the installed app keeps its data apart from an app started from a checkout (which phase 2's fix made true), and the two commands and the workflow for a contributor. The work item changes none of the plugin files that owe a `### Process changes` table (`docs/layout/the-record-layout.md` *A change writes fragments, never a shared file*), so the fragment has none.

**Scenario L's count, run on the two files.** Each README holds 7 lines that open with `#` and 16 that open with `|`, and `git grep -n -e '도장' -- README.md README.ko.md` exited 1 with nothing printed (`executed`, at `e9cdbd20`). The broad gate runs the same count over `docs/` with them.

**No test file reads this repository's READMEs.** The test files that name `README.md` write or read it in the repositories they build as fixtures (`git grep`, `read`), so the phase ran no cases.
