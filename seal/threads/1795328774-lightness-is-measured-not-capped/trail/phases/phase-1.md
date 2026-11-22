# Phase 1: 1795328774-lightness-is-measured-not-capped

## What this phase found

There is no `frame/`: issue #121's *Done when* and the owner's words quoted in `routing.md` are the frame. The work item's subject is the policy root's text, so the documents are rewritten in place and no `## Rule changes` is written (the plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes*).

**The frame held, with two coordinates off.** Judged against the tree at `f3eb57b`.

- The spawn placed the ~500 MB row of `docs/product.md` under *What we promise*, around line 114. The row stands at line 114 under *Where performance differs*. *What we promise* holds no number. The row was rewritten where it stands.
- The spawn gave the changelog's form as `git show v0.0.1:seal/threads/1795180367-fetch-before-cut/changelog.md`. That path does not exist at `v0.0.1`, because the settle of 0.0.1 removed the directory. The fragment was read where it was added, at `5bd94bf`.
- #32 names the panes on a view among the caps it reads from the machine in its comment of 2026-11-22, not in its body. Read through `gh issue view 32`. That *Done when* line of #121 is met by the comment, and this work item writes nothing to the tracker.

**How the statements were listed.** A sample, by search. The spawn's `git grep -n -i -e '500 MB' -e 'four panes' -e 'at most four' -e '네 개' -e '500MB'` over `docs`, `README.md` and `README.ko.md` was joined by searches for `four terminals`, `cap`, `limit`, `target`, `measure`, `상한`, `한도`, `목표`, `측정` and `넷까지` over the same paths, and for `500 MB`, `four panes`, `four terminals` and `target` over the whole tree. Every hit was read. Rewritten, in each language:

- `docs/architecture.md` *Memory design*: the opening paragraph, which said the app "aims to stay under about 500 MB", became four paragraphs that state the rule, the order and the machine-read limits. The sentence on four panes now says four is fixed in the code until #32.
- `docs/product.md` *Foundation*, "It stays light": "resource caps that we measure and publish" and "The target is the app itself under about 500 MB" became the rule, the scene's number as a measurement, and the limits as defaults read from the machine.
- `docs/product.md` *Where performance differs*: the hypothesis "The app itself stays under about 500 MB" became the comparison with other products in the same scene, which is the part not yet measured. The intro sentence now says no comparable product has been measured.
- `docs/roadmap.md` *Done criteria*, the row "With four terminals visible, the app itself stays under about 500 MB", and *Open decisions*, the row "The numbers of lightness beyond 500 MB".
- `docs/roadmap.md` *Milestones* row 1, *Done when*: "With four terminals visible, the app itself stays under about 500 MB" became "is measured and published". Milestone 1 shipped as 0.0.1, and its row is rewritten because it states the old rule in the present. The measurement it names exists, so the row stays true of 0.0.1.
- `docs/roadmap.md` *Milestones* row 5: "The resource caps measured and published" and "The measured caps and the ledger are public" became the reference scenes measured and published. The caps that stay are #32's, which milestone 3 builds, so a milestone-5 row publishing measured caps contradicted the rule.
- `apps/desktop/measurements/memory.md`, the published measurement: "which is over the target of about 500 MB", "The target is `docs/architecture.md` *Memory design*" and "the one to hold against the target". The file is no code and the spawn kept only code out. Its pointer to a target in *Memory design* would have been false once *Memory design* named none. Its numbers are unchanged.

**The fix pass after the hand-back.** The orchestrator asked for the doc comment of `STAGE_PANES` (`apps/desktop/src/renderer/view.ts:1221`). It read "the count the 500 MB target is measured at" and now reads: the count fixed in the code today, which is the count the four-terminal reference scene is measured at, until #32 makes it a default read from the person's machine. It matches *Memory design*. The comment alone changed, and the value stays 4. `pnpm -s run typecheck` in `apps/desktop` exited 0 after `pnpm install --frozen-lockfile` at the worktree's root, which this worktree had not had (executed).

**Left, with grounds.** The built-in browser rows, which #120 weighs (`gaps.md` *Not done*). Also left, because the new rule does not contradict them: `docs/architecture.md` *Conclusions* "Staying light is a goal", and "Light is relative" in *Foundation*, which the issue keeps; the GPU terminal limit of 16 and the renderer's memory cap, which are Chromium's and not Owlery's own; `--max-budget-usd`, a budget per stage; the code and cases that say a view shows four panes (`view.ts`, `work-item-view.ts`, `test/view.test.ts`, `test/memory.ts`), which describe `STAGE_PANES` as it stands; and `docs/roadmap.md` milestone 5's title "and limits", which names the subscription's usage limit.

**Decisions.**

- *Memory design* is the one home of the rule, in each language. `docs/product.md` states it in short and links there, and the roadmap's rows link there. Judged against the plugin's `skills/core/SKILL.md` *The rule a mechanism is kept against*: a fact has one source.
- The term "scene", which #121 uses, is defined where it first appears in *Memory design* and in *Foundation*, in each language, because a reader meets it there first. Judged against the plugin's `skills/writing-style/SKILL.md` *English prose rules* and *은어와 압축 한자어를 풀어쓴다*.
- *Memory design* says that no check runs the measurement. The issue asks that the measurement "runs as the features land", and nothing in the tree runs it, so the rule names the command and says that no check runs it. Judged against #121 *Done when* and `apps/desktop/test/memory.test.ts` line 28.
- *Memory design* says that nothing caps the agents and the worktrees until #32. #32's title says so, and a search of `apps/desktop/src` for a session or concurrency cap found none.

**Checks.** No unit adds behaviour, so no case was written and no `seal mutate` ran. Executed at the commit, by hand: for each `docs/X.md` and `README.md`, `grep -c '^#'` and `grep -c '^|'` against its `.ko.md` twin gave architecture 26/26 and 108/108, name 5/5 and 0/0, product 15/15 and 36/36, roadmap 11/11 and 24/24, README 5/5 and 6/6. `git grep -n -e '도장' -- docs README.md README.ko.md` exited 1, which means no match. The broad gate is the orchestrator's (`gaps.md`).
