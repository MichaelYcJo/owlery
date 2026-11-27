# Phase 1: 1795797447-322-workflows-compose-around-iadd

## What this phase found

**The frame holds, but for the stored state it leaves out.** Judged against `frame/design.md` *Data & interfaces* before the build. *Stored state and the protocol* names `repositories.json`'s `paneChain` and the stored look, and not two other stores the rename of the stage kind breaks:

- `chain.ts#isChain` reads the chain that `repositories.json` and the look hold. A chain an earlier build stored with a stage of the kind `seal` would fail it, and with it the whole file, which the comment there says leaves the store holding no repository.
- The cost ledger's lines with the pair `sealer` at `seal` and the chain's stage `seal` would read as no entry.

`chain.ts#storedKind` now reads a stored `seal` as `inspection`, `chain.ts#storedRoleStage` reads `sealer` at `seal` as the inspector's pair, and `ledger.ts` reads through both. The grounds are *Stored state and the protocol*'s own rule: a store an earlier build wrote is read and not refused. The earlier spellings stand in `chain.ts`, which the acceptance search of `frame/design.md` *User scenarios & acceptance* already allows for the earlier `Seal-Built-By`.

**A record form the frame does not list.** The stage cell of `trail/refusals.md` names the stage kind: it read `seal 2` and now reads `inspection 2`. Phase 3's migration rewrites it beside the fences, or a refusals record of a migrated repository names a stage no reader knows.

**Where the window's words stop.** "The window keeps its old words" was read as the renderer's own words: the constants of `renderer/view.ts`, the protocol's `Seal`, `WorkItem.seal`, `SealRecord`, `SealRecords` and `readSealRecords`, and the back of the seal with `seal-back*.ts`. Those are phase 2's. The sentences the daemon composes took the new names, because agents read the same sentences in their prompts and in the chain command's refusals: `chain.ts#stageName`, `clearedSays`, `withheldSays` and `pullRequestCarriesSays`, and `inspection-state.ts`'s sentences, which now say "cleared commit" as the check's do. The window shows those sentences beside its own old words until phase 2. The protocol's role and stage values took the new names in this phase, because *Scope* item 4 renames the role and the stage kind and `shared/protocol.ts` defines both: `ROLE_STAGES`, `CHAIN_STAGE_KINDS`, `PaneStage.kind` and the record's verdict word in `Recorded.verdict.is`. The renderer's keys that type against them changed, and their words did not.

**Names the frame does not set.** Each was chosen against *The names, one spelling each*:

- The check's flag `--sealing` is `--inspecting`.
- The chain command's option `--judged-by` is `--inspected-by`, for the key `inspected-by:`.
- The prompt's file of a run is `inspection-<run>.prompt.md`.
- The verdict section's heading in a pull request body is `## Inspection`. The back's markers, `<!-- owlery:back -->`, hold no seal and are unchanged.
- The script `role:refusal:sealer` is `role:refusal:inspector`, and the line of `docs/architecture.md` and of its Korean edition that names it moved with it.
- The value both new lines write is `OWL_CHAIN = "owl-chain"` of `inspection-records.ts`, until phase 4 reads it from the workflow's file. Each line takes one word, at most once, so a block written before them still reads.

**The census of `pr-check/` and the bundle reaches their READMEs.** The plan's phase 1 row counts `pr-check/README.md` and the bundle's `README.md`, which *Scope* item 12 gives to phase 5. Their seal words were rewritten here so the census holds, and phase 5 rewrites them around IADD. Prose of the copied scripts and documents that names a command of AgenticSeal's CLI now says so, as AgenticSeal's `pact`, AgenticSeal's `seal mutate` and the like, since the bundle ships none of them.

**Removals the frame does not name.**

- `pr-check/skills/settle/scripts/rule_changes.py`'s `order`, `merge_order`, `group`, `unordered`, `place`, `where`, `overlapping` and `gitcmd`, with `EARLIER = ("seal/specs", ...)`. Nothing of the check calls them (`grep` of each name over `pr-check/`), and `EARLIER` read the earlier root's path.
- The case of `records-place.test.ts` that held this repository's own workflow to the one a setup writes was removed in `90763db0`, since *This repository does not move* keeps `owlery-seal.yml` at its pin. The case beside it no longer reads this repository's own heavy commands, since its root is `seal/`.

**The merge of the release branch at `a75f4581`, with #323's pull request #341, restored that case.** #323 kept it and added this repository's exception: while `seal/README.md` opens with the plugin's marker, the case holds the pin at 0.1.0, and `docs/architecture.md` states the exception. The resolution keeps both decisions. Where the plugin's root stands, the case reads `.github/workflows/owlery-seal.yml` by its own name and holds its pin at 0.1.0. Where it is gone, the case holds `iadd/README.md` to Owlery's marker and `.github/workflows/owlery-inspection.yml` to the text a setup writes for the app's version. The pin's assertion was shown red with the held version changed.

**What this phase leaves for phase 3.** After this phase a repository whose root is `seal/` in the earlier form reads as one with no root. A setup there plans a new root at `iadd/` and `owlery-inspection.yml` beside `owlery-seal.yml`. Phase 3 names the earlier root and offers the move in its place.

**The runner's form.** `pnpm --filter @owlery/desktop run test -- <files>`, as the spawn spelled it, hands vitest the `--`, and vitest then starts the whole suite. One run started so and was stopped. Every later run named its files after `test` with no `--`.

**Seen red.** The new cases were written while the machine held every test run for another work item's broad gate, so each guard was written before its case was run. Each case was then shown red with only its guard removed, by `seal mutate`, and green with the guard in place:

- `record-blocks.ts`: lower case in place of Python's fold, `INFO` back to `seal`, and the `workflow:` key removed. Each is red in `record-blocks.test.ts`, whose fixtures give both readers the dotless-i fence, the `seal` fence that is no block, and the two new lines.
- `pr-check/lib/fields.py`: `INFO` back to `seal`, and the `WORKFLOW` spec removed. Both red in `record-blocks.test.ts`.
- `inspection-records.ts`: the two lines not written, and `inspector:` not read. Both red in `inspection-records.test.ts`.
- `chain_check.py`: `TRAILERS` without `Seal-Routing`, and the title read from `rules:` again. Both red in `pr-check.test.ts`.
- `chain.ts`: `EARLIER_KINDS` empty, and no earlier pair of the sealer. Red in the stored chain case of `chain.test.ts` and in the earlier line case of `ledger.test.ts`.
- `stage-records.ts`: builders read from `IADD-Built-By:` alone. Red in the `Seal-Built-By:` case of `chain.test.ts`, whose failing line named `built-by: the session, s-9, fake-2` without `s-8`.
- `records-place.ts`: a project's own `iadd/` taken for the root, and `agentic-seal/` read as a second name. Both red in `records-place.test.ts`.
