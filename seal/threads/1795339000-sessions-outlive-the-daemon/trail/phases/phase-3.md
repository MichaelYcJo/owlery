# Phase 3: 1795339000-sessions-outlive-the-daemon

## What this phase found

**The frame holds.** The text of `frame/plan.md` *The text placed in the policy documents* was placed word for word in both editions, with `#133` in place of `#DAEMON-ISSUE` (`executed`: the edits were taken from the plan's code blocks by a script that asserted each anchor matched once).

- **Edit 1** replaced the first bullet under the diagram of *Overall layout* / *전체 구성*. **Edit 2** went between the last line of that section and `## Agent adapters` / `## 에이전트 어댑터`. **Edit 3** replaced the daemon's row of *State lives in three places* / *상태는 세 곳에 둡니다*. **Edit 4** is the new last line of *Open decisions* / *결정을 남겨 둔 것*, which is the end of each file.
- **Issue citation.** Both editions cite an issue as plain text, `issue #78` and `이슈 #78`, with no link, so `#133` is plain text too. Judged against the editions' own existing usage.
- **Counts.** Each edition has 27 lines starting with `#` and 122 starting with `|` (`executed`, `grep -c`). Before the phase each had 26 and 107 (a heading and 15 table lines added to each: the section's heading, its two tables of 5 and 6 lines, the new row of *Open decisions*; edit 3 replaces a row).
- **Anchors.** `#what-a-session-survives` and `#세션이-견디는-것` resolve to the new headings, and the other anchors the text uses (`#overall-layout`, `#rules-that-keep-it-portable`, `#options-for-launching-claude-code`, `#open-decisions`, `#전체-구성`, `#이식할-수-있게-지키는-규칙`, `#claude-code를-띄우는-옵션`, `#결정을-남겨-둔-것`, `roadmap.md#milestones`, `roadmap.ko.md#마일스톤`) each match a heading in the tree (`read`, by grep of the headings).
- **Searches.** `git grep -n DAEMON-ISSUE -- docs README.md README.ko.md` and `git grep -n -i -e orca -e paseo -e cmux -- docs` print nothing (`executed`).
- **Document arm of the broad gate.** I ran only its docs loop and its `도장` search by hand: the editions' heading and table-line counts agree and `도장` is absent (`executed`). That is not the broad gate, which stays the orchestrator's.
- **No case reads these files.** `git grep -l architecture` over `apps/desktop/test`, `scripts`, `bin` and `.github` lists nothing, so no test was run and none was written. The phase adds no behaviour, so no mutation run is owed.
- **The `check:` lines.** The editions carry `check:` lines under bullets of *Overall layout* that name a test. The new section and rows state a design built by issues #133, #61 and #55 and have no test yet, so none carries a `check:` line.
- **Changelog.** The pull request changes no code, so the fragment says only what a reader of the policy gains. No version moves (`frame/plan.md` *Operational impact*), and the diff touches none of the files that ask for a `### Process changes` table.
