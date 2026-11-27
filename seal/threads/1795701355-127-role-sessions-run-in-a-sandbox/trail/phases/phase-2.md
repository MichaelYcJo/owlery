# Phase 2: 1795701355-127-role-sessions-run-in-a-sandbox

## What this phase found

The phase was built on `43a431bc`, the merge of `origin/release/v0.0.5` at `f05b9c97` into the fold `74066b25`. The merge met no conflict: #216's hunks of `daemon.ts` and `daemon.test.ts` meet none of this work's.

**The frame holds for items 7 and 8, with three points it did not reach.** Each is below: the head's sentence per grant, the sentences of the two roles' *Never* lists, and the test files beyond `daemon.test.ts` whose adapters read the prompt. Judged against `frame/design.md` *Scope* items 7 and 8 and *User scenarios* rows 6 to 8.

**The head's sentence on commands follows the grant, not one wording for every role.** *Scope* item 7 says the head says the commands "write only where its prompt names". That is true of a proofer and a sealer, whose prompt names the scratch folder. A crafter's commands also write the repository's git folder, which no prompt names, and the orchestrator's write nowhere. `claude-roles.ts#COMMANDS_WRITE` therefore holds one sentence per value of `RoleGrant.commands`, and `rulesHead` picks it by the grant. The sentence sits in the paragraph that names the tools, so the pane's head still differs from the session's in two paragraphs and the pane's is unchanged. Judged against `frame/design.md` *User scenarios* row 6 and `docs/architecture.md` *Agent adapters*, which has the grant decide what a role may do.

**The head and the scratch paragraph name only the refusals the daemon names.** Each says the system refuses a write to the worktree (and the head adds the bundle's root, and for a crafter its git folder's `hooks` and `config`), and tells the role to write with its commands only in its place. Neither says that every other write is refused. `frame/questions.md` Q3's default leaves Claude Code's own temporary folder writable, and a sentence that every write elsewhere fails would be false under that default. The refused places are deny entries of the launch, which hold whatever the default (`frame/design.md` *Scope* item 4). Phase 3's runs answer Q3. Where they show no other writable place, the framer may fold the sentences to the wider claim.

**The paragraph goes to the adapter's prompt, and the session lists the prompt it was started with.** `daemon.ts#withScratch` appends it in `startHeadless`, where the folder is made, so a queued session is listed with no folder and no paragraph. `info.prompt`, what a window shows, stays the starter's. The case "ends the prompt a proofer's and a sealer's session give the adapter with one paragraph…" pins the literal text, the crafter's and the orchestrator's unchanged prompt, and the listed prompt. Trailing newlines of the prompt are cut before the blank line, so a chain stage's prompt, which ends with one, gets one blank line before the paragraph.

**The round's and the seal's prompts now end "Write no file of that worktree: read its files."** They name no place for commands, because the folder does not exist when `stage-records.ts` builds them. The judgment prompts keep "Write no file and run no command" (`chain.ts:764` and `:804` at this phase's commit).

**The class of cases whose adapter reads the prompt was taken from the tree, not from phase 1's list.** The list was made with `git grep` over `test/` for `options.prompt`, for `prompt ===` and `prompt !==`, for the fake's callbacks that take the prompt, and for answers that quote a proofer's or a sealer's prompt (`you asked:`). It found the ten cases phase 1 named, and these more:

- `daemon.test.ts`, "ends a working headless session of a repository it removes…" and "stops a working headless session of a work item it archives…", whose adapters chose by `options.prompt === "Quick?"`.
- `daemon.test.ts` *the caps on the machine*'s helper `noting`, which records each start's prompt.
- `daemon.test.ts` "changes nothing at an exit that arrives for a session it no longer lists". Its adapter chose by `options.prompt !== "First?"`. With the paragraph no prompt equalled `"First?"`, so the case passed while it no longer watched the late exit. No red showed it: it was found by the search.
- `daemon.test.ts` *the agent's notice*, "launches a session all the same while a notice stands", which quotes the prompt in the answer.
- `accounts.test.ts`, "launches each work item's session with the folder of its repository's account…" and "gives the folder only to an adapter that declares accounts…", which quote the prompt.

The adapters now choose by `startedWith(options)`, the prompt with the paragraph taken off, and the answers are compared with `withScratch` of the prompt, or, in `accounts.test.ts`, with the paragraph taken off. The ledger case's `usage` reads `prompt.startsWith("Which owl?\n")`. `answersOf` cuts the fake's own text by its first words, since it now runs over several lines. The prompt parsers of `test/chain-run.ts` match single lines, and the chain's cases passed (below). The search is a sample of spellings: an adapter that reads the prompt under another name is not in it.

**The bundle's two roles' *Never* lists said "Write a file", which the lift makes false.** `proofer.md`'s first item said "Write a file, or commit", and `sealer.md`'s "Write a file, run a command, or edit code or a record to make a claim hold". A proofer's command now writes files in its scratch folder. Both now say "Write a file of the worktree". The sealer's item keeps "run a command … to make a claim hold", which still holds. *Scope* item 8 names *Job* and one paragraph of `proofer.md` and *Job* of `sealer.md`; these two items state the same rule, so they changed with them (contract rule 19).

**The proofer's paragraph holds the commands' rule, and *Job* cites it.** *Job* says "Where your commands run and what they write is **A round changes nothing of the worktree, and its runs stand in a scratch folder.** below", so the rule has one home. The paragraph says that the scratch folder is the proofer's scratch directory of rule 17, that a run gets a `## Probes` row and an `executed` evidence line, that the folder is removed when the session ends, and that a clone there has no installed dependency and reaches no host but the loopback (`frame/design.md` *Out*, the rows on the network and on dependencies). The pane's case keeps today's text: every `evidence:` line `read` and no `## Probes` row.

**The guarantee's form cites `sealer.md` for where the sealer's commands run, and keeps both launches' case that way.** *The guarantee* now says the sealer "never runs the broad gate itself", and that its order of work and where its commands run are `agents/sealer.md`'s. **How it errs.** now says it "checks each claim by reading", which `sealer.md` step 2 still says for both launches. The sealer's step 2, its frontmatter's "by reading" and `docs/forms/the-round-record.md`'s "The sealer runs no line again" are unchanged: each says what the sealer does, and the lift gives it a place to run in without changing what it checks.

**`docs/architecture.md` *What each session loads* describes the head without the sandbox's sentence.** It says the head "names the role's tools and says that the daemon answers every call that asks for permission". The head now also says that the commands run in the operating system's sandbox and where they write. The sentence is not false, and the design's `## Rule changes` holds no change of it. The framer may add one, with the Korean twin at `docs/architecture.ko.md:154`.

**Seen red.** Against `43a431bc` with only the test edits in place (executed): the head case of `claude-adapter.test.ts`, the round's and the two seal's prompt cases of `chain.test.ts`, the places case and the new paragraph case of `daemon.test.ts -t "scenario 7 of #127|scenarios 1 to 4 of #127"`, and the sealer's and the new proofer's and sealer's cases of `role-bundle.test.ts`, eight in all, each failed on the line that pins the new text.

**Mutation runs, each `seal mutate` over a file as `2fe22532` committed it, every mutant red (executed).**

- `adapters/claude-roles.ts`, 5 mutants against `claude-adapter.test.ts -t "opens with a head|opens the rules of a pane"`: every grant given the scratch sentence, the sandbox sentence dropped, the orchestrator's "Write nothing" turned into "Write with them", the crafter's refusal of the git folder's `hooks` and `config` dropped, and "Where the daemon or the system refuses a call" put back to "Where it refuses a call".
- `daemon.ts`, 4 mutants against `daemon.test.ts -t "scenario 7 of #127"`: no paragraph appended, a paragraph appended to every session's prompt, the trailing newlines of the prompt kept before the blank line, and the sentence that the system refuses a write to the worktree dropped.
- `chain.ts`, 2 mutants against `chain.test.ts -t "a stage.s prompt|the seal.s prompt"`: the round's sentence and the seal's put back to "Write no file and run no command: read the files of that worktree."

The bundle's three documents are prose that the cases of `role-bundle.test.ts` read. Their new sentences were shown red against the old text (above), and no `seal mutate` ran over them.

**Row 8's search at `2fe22532`.** `git grep -n -e 'run no command' -e 'runs nothing' -- apps/desktop/src/daemon/chain.ts apps/desktop/role-bundle/agents/proofer.md apps/desktop/role-bundle/agents/sealer.md apps/desktop/role-bundle/docs/forms/the-guarantee.md` printed `chain.ts:764` and `chain.ts:804`, the convergence and the ruling prompts, and nothing else (executed). They are the lines `frame/design.md` *User scenarios* row 8 names at `88ad5244` as `:761` and `:801`.

**The phase boundary at `2fe22532`, each command run alone with at most three files (executed).** The spawn's limit of three files to a command splits what `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* runs as one command.

- `claude-adapter.test.ts`, `fake-adapter.test.ts` and `chain-command.test.ts`: 148 passed. The case of issue #258 did not fail in this run.
- `daemon.test.ts -t "headless sessions|the caps on the machine|idle exit|the agent's notice|repositories|what a person sets on a work item"`: 151 passed.
- `chain.test.ts` and `accounts.test.ts`, run on the working tree that `2fe22532` then committed unchanged: 230 passed.
- `gate.test.ts`, `decisions-and-questions.test.ts` and `pull-request.test.ts`, a sample of the files that run the chain through `test/chain-run.ts`: 48 passed.
- `--project app` over `role-bundle.test.ts`, its built-app cases among them: 21 passed.

The package's `tsc --noEmit` exited 0 before the commit. The other test files that start role sessions through the daemon were not run (`gaps.md` *Not verified*).
