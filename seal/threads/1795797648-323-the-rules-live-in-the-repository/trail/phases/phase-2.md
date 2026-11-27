# Phase 2: 1795797648-323-the-rules-live-in-the-repository

## What this phase found

**The orchestrator's broad gate at `6da47d9e` failed one case, which held a rule this work item departs from on purpose.** The gate ran against `release/v0.2.0` at `aec3e8ac`, with 1 case failed and 2636 passed. The failing case is the one in `apps/desktop/test/records-place.test.ts` that held Owlery's own `.github/workflows/owlery-seal.yml` to the text a setup writes for the version in `apps/desktop/package.json`. Round 1's finding 1 moved that version to 0.2.0 in `d3f3c26b`, and `routing.md` *Base and version* keeps the pin at `v0.1.0`. The rule the case held stands in `docs/architecture.md` *Compatibility with AgenticSeal*, and the `check:` line there names `records-place.test.ts`. That rule had no exception, and #322 *When it lands*, step 4 asks for one: this repository keeps the plugin's `seal/` root and the check of 0.1.0 until the plugin takes IADD's names, and then moves both in one commit. A pin at `v0.2.0` would clone the check from `release/v0.2.0`, which reads IADD's forms once #322's rename merges there, and this repository's `seal/` records would then fail it. So the rule was repaired and the pin was left alone. Judged against `docs/architecture.md` *Compatibility with AgenticSeal* and #322 *When it lands*.

**The case now reads which records root this repository stands in.** Where `seal/README.md` opens with the AgenticSeal plugin's marker, the workflow must be exactly the text written for 0.1.0. Otherwise the workflow must be the text for the app's version, as before. The marker is written out in the case as `PLUGIN_ROOT_MARKER` and not read from `records-place.ts#MARKER`, because #322's rename changes `MARKER` to Owlery's own root while this repository keeps the plugin's root until step 4. The held version is `PIN_HELD_FOR_THE_PLUGIN`. Once step 4 moves the root, the case holds the pin to the version again with the force it had. While the root stands, it holds the pin to 0.1.0 exactly, and a pin moved early fails it. `docs/architecture.md` and `docs/architecture.ko.md` state the exception beside the rule, in the same paragraph, under the same `check:` line.

**Seen red, each guard alone removed, with `seal mutate` over the committed case at `8c52f670`** (executed). The tests command was `pnpm --filter @owlery/desktop run test test/records-place.test.ts -t 'holds Owlery'`.

- **The exception removed** (`workflowText(onThePlugin ? PIN_HELD_FOR_THE_PLUGIN : version)` to `workflowText(version)`): red. The case fails at `records-place.test.ts:1120`, the workflow's `toBe`, expecting `v0.2.0` where the file pins `v0.1.0`. This is the gate's failure.
- **The held version changed** (`"0.1.0"` to `"0.2.0"`): red at the same line.
- **The root taken as moved** (`PLUGIN_ROOT_MARKER` set to `# What IADD keeps in iadd/`): red at the same line, so a repository whose root is not the plugin's is still held to the app's version.

`seal mutate` restored the file each time, and `git status --short` printed nothing afterwards.

**Runs** (executed):

- `pnpm --filter @owlery/desktop run test test/records-place.test.ts` exited 0, with 43 of 43 cases passed.
- The documents leg of `seal/config.json` `Broad gate` exited 0, the comparison loop plus `! git grep -n -e '도장' -- docs README.md README.ko.md`.
- The typecheck of the changed test file was not run alone. It runs in the broad gate's `pnpm -r run check`, which the orchestrator runs.

`changelog.md` already says that the pin stays at 0.1.0 until #322, so no sentence of it changes.
