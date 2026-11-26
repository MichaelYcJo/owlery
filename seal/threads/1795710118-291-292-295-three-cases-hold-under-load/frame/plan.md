# Plan: three cases hold under load

## Phases

| # | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1 to 3 of `frame/design.md` | each case run many times under load, and each shown red by a `seal mutate` of the product line it guards | `8981dc93` |

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-27 | The pull request's title takes the prefix `test:`. | It changes test cases alone. | the plugin's `skills/commit-pr-convention/SKILL.md` |
| 2026-11-27 | The inbox case reads two private fields of the daemon (`clients`, `readingCommits`) through a cast, as the same file reads `headless`. | No public option exposes the read under way, and a product change is out of this work's scope. | the file's precedent; `frame/design.md` *Out of scope* |
