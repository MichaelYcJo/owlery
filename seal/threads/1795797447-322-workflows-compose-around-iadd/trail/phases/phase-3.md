# Phase 3: 1795797447-322-workflows-compose-around-iadd

## What this phase found

**The frame holds, but for three things it states of the tree.** I judged it against `frame/design.md` *The migration of a connected repository*, *Stored state and the protocol* and `## Removes`, against `frame/plan.md` *Operational impact*, and against `frame/questions.md` Q5 and Q12.

- **A branch that merges a moved base does not always keep its records under `seal/`.** The probe of `frame/design.md` `## Grounding` merged a branch that added `seal/threads/b/` into a base that had moved `seal/` to `iadd/`, and the merge exited 0. I ran the same merge with git 2.54.0 where the base's `seal/threads/1-x/` held files and the branch added a file inside it. Git took the base's move as a rename of the folder and stopped with `CONFLICT (file location)`, proposing `iadd/threads/1-x/trail/rounds/round-2.md` for the branch's file. A person who keeps the file where the branch put it leaves it under `seal/`, and `migrate` moves it. A person who takes git's proposal puts a record in the earlier form under `iadd/`, with its `seal` fences and its `guarantee.md` name. No reader reads such a record, and `migrate` does not find it, since it looks for the earlier root's names. The case in `test/records-migration.test.ts` merges with `merge.directoryRenames=false` and says why. `gaps.md` *Not done* names the record left under `iadd/`.
- **An inspection cleared before the move lapses after it.** The scenario "A connected repository moves in one commit" ends with "The check passes on a cleared work item of that commit". The move changes paths outside a work item's closing records: the root, every record and the workflow. So a work item whose branch the earlier form cleared, and which then moves its own records, has an inspection that lapsed, and a new inspection is owed at its head. The check's `since_cleared` says so (`pr-check/skills/code-review/scripts/chain_check.py`). A work item cleared on a branch of the moved commit passes. The case in `test/pr-check.test.ts` holds both. It is the reading of that scenario this build could make, and the frame's sentence is the orchestrator's to fold.
- **The phase's second search over-matches.** The plan's search `git grep -n -i 'hygiene\|paneChain\|ChainChoice\|agentic-seal\|readPlugins\|enabledPlugins' -- apps/desktop/src pr-check` folds case, so `paneChain` matches the type `PaneChain` and the function `writePaneChain`. Both name what a pane on the owl chain is launched with, and they stood before the chain choice. I renamed neither. Run at `63aca792`, the search prints `hooks.ts:92`, `:116` and `:167`, `main.ts:13` and `:50` and `pane-chain.ts:15`, `:83` and `:102` for those two names, and then the lines the plan expects: `records-migration.ts:33`, the earlier root's second name, and `repositories.ts:115` and `:271`, the stored key the reader drops.

**The chain choice went whole, with what stood on it.** `## Removes` names the question, the setting, `paneChain`, `claude-pane-<id>.json`, `chain-choice.test.ts`, `claude-plugins.ts` and `Repository.chain`'s `plugin` and `chosen`. These went with them, since each existed only for the choice:

- `PaneStart.checkout`, `PaneStart.chosen` and `PaneStart.configDir`, which only `carriedIn` read. A pane's start now holds its folder, its base, whether it continues, its account's folder and the conversation it resumes.
- `DaemonOptions.pluginEnabled`, and the reads of the records place that a change of an account made: at `setRepository` with another account, at `setDefaultAccount`, and at `removeAccount`. Nothing of the records place is read under an account now.
- The window's `beforePane` and `initView`'s argument for it, the chain dialog, the settings' chain field, `asksChain`, `settingsChain`, `CHAIN_CHOICES` and `paneChainOf`.
- The screenshot view `chain`, the stand-in for the plugin in the screenshot run's config folder, and the second case of `test/pane-session.test.ts`, which held the pane's own settings file.
- The rule of `docs/architecture.md` *What each session loads* on the choice, in both editions, as `## Removes` says. The sentences on the pane's own settings file in the table of `docs/architecture.md` and on the chain dialog in `docs/design.md` *A pull request that changes the window carries its screenshots* went with it, in both editions. Their other prose is phase 5's.

`Repository.chain` keeps `owl` alone, as *Stored state and the protocol* says. No code of the window reads it now. The readLists case of `test/daemon.test.ts` made the pass fail through `pluginEnabled`, so it now fails it through the clock, which the pass reads for each record.

**The migration's plan is the commit's, and its readers are IADD's own.** `records-migration.ts` reads each record of the earlier root with the earlier grammar through the block reader of `record-blocks.ts`, since the two grammars differ only in the fence and in the verdict's words and keys. The earlier verdict kind is built from `VERDICT_BLOCK` with `Verdict: sealed`, `judged-by:` and no `workflow:` and `inspector:`. A record IADD's reader would read otherwise blocks the plan: a fence that opens `iadd` in an earlier record is a block of IADD's form and no block of the earlier one. The moved texts are part of the stamp, so a record edited and committed between the plan and the move is refused. The dialog shows the move with the parts it already draws. Each moved file is a line of the files list with no text, and the workflow is the one file shown whole, so `renderer.ts` and `index.html` draw it unchanged.

**Names the frame does not set.** I chose each against *The names, one spelling each*.

- The move's commit subject is `chore: move the work records and the pull request check to IADD's forms`.
- `RecordsPlace.earlier` names the root in the earlier form. `RecordsPlan.migration` holds the moves and the removed files.
- The row's button reads "Records in the earlier form".
- `migrate` prints `migrated`, `moved`, `removed`, `written` and `commit`.

The window's words name the earlier form and never the plugin or the check `seal`, so `git grep -n -i 'seal' -- apps/desktop/src/renderer apps/desktop/src/shared apps/desktop/src/main apps/desktop/src/preload` prints nothing.

**Where the earlier form is refused.** `chain-command.ts#here` and `daemon.ts#whyNoChain` refuse with `records-migration.ts#earlierRecordsSays` before they read the root, so `start` is refused too, beside the six subcommands the design names. A refused `start` cannot declare a second directory under `iadd/` for a work item whose own stands under `seal/`. `run` is not refused there: it reads `Heavy commands` from the earlier root where no `iadd/` root stands (Q12). `run`'s place in the queue still comes from `iadd/` alone (`turnPlace`), so this repository's sessions ask from the place `outside` until its own move.

**A leftover of phase 1.** The docstring of `records-place.ts#onOwlChain` still named the plugin and the choice after `35802536`. `3dcffb1f` rewrote it.

**A bug the cases found.** The plan told a folder at Owlery's workflow's path only by an entry `git ls-tree -r` prints for it, and that command lists the files under a folder, never the folder. `63aca792` reads it through `holds`. The case was red against the earlier line, which gave no refusal.

**Seen red.** Each new case was run green, and each guard was then removed with `seal mutate`, the file restored from its held bytes:

- `settle.ts`: `--apply` let through as a known flag. Red in the usage case, on `--apply`.
- `records-place.ts`: `hygiene.yml` taken for the check again in `checkOf` and in `planRecords`. Both red in the hygiene case.
- `pane-chain.ts`: the chain withheld where the folder holds `.claude/`, and where a handed account's folder holds `settings.json`. Red in `pane-chain.test.ts` and in the new case of `daemon.test.ts`.
- `hooks.ts`: a pane on the chain given a settings file of its own. Red in the case that holds the shared file.
- `repositories.ts`: a `paneChain` value checked again. Red on `both`.
- `daemon.ts`: the record's clock not read from the options. The readLists case timed out on a `done` where it waits for an error.
- `records-migration.ts`, 30 mutants in three batches, all red. The batches removed each rewrite of a record, the root's marker, each opener's move, the reading of an earlier record's `iadd` opener as none, the guarantee's new name, the earlier workflow's removal and Owlery's workflow, each arm of `blocked`, the stamp's check, the put-back after a refused commit, the earlier root's detection, the branch's kept root, both arms of `earlierRecordsSays`, and the fallback of `heavyCommandsOf`. The mutant that emptied the line moving an opener left a dangling `else` and failed on the syntax, so it was run again as a comparison with another word, and that run was red.
- `chain-command.ts`: the refusal in `here`, `migrate`'s refusal with nothing to move, and `run` reading the earlier root. All red.
- `daemon.ts`: the refusal in `whyNoChain`, `RecordsPlace.earlier`, and the two routes to the move. All red in `daemon.test.ts` and `chain.test.ts`.
- `view.ts`: the dialog's move, the row's `earlier`, the move's sentences and the removed file's line. All red.
- `records-place.ts#readHeavyCommands` giving nothing. Red in the heavy commands case.

**The runner's form.** Each unit run named its files after `test`, with no `--`.
