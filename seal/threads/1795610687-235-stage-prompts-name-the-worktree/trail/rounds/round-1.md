# Review round 1: 1795610687-235-stage-prompts-name-the-worktree

```seal
target: 8fb5de99 against release/v0.0.5
```

This is the first round, so no earlier round handed over a coordinate and every fact below was established at the target. The work item's records were read whole at `8fb5de99`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md`. No `pr.<lang>.md` is owed, since `Commit and pull request language` is English. `seal/parity.json` is not declared.

## Findings

### 1. The fix pass's prompt hands the crafter `git -C` followed by the worktree's path unquoted, and a path with a space splits that command

```seal
severity: should
location: `apps/desktop/src/daemon/chain.ts:671`, `apps/desktop/test/chain.test.ts:422`
evidence: read `apps/desktop/src/daemon/chain.ts:671`, `apps/desktop/src/daemon/hooks.ts:104-107`, `apps/desktop/src/daemon/chain-command.ts:35`, `apps/desktop/src/daemon/pane-chain.ts:60`; executed `git grep -n -F 'git -C ${' HEAD -- apps/desktop`
```

Why it matters: *Scope* item 3 asks for a prompt that makes the crafter commit with `git -C` and the worktree's path. The bundle's `skills/implement/SKILL.md:206` asks the crafter to write the repository's absolute path after `git -C`. `chain.ts:671` writes the command as a code span, `` `git -C ${given.worktree}` ``, with no quoting. A worktree under a folder whose name holds a space, such as `/Users/x/My Repos/app-wt-2`, then gives the crafter the command `git -C /Users/x/My Repos/app-wt-2`. That command is wrong as written: the shell passes `/Users/x/My` to `-C`. A crafter that copies the line exactly fails its commit, and the fix pass stops. The failure is closed, because nothing commits elsewhere, but the prompt gives the crafter a broken command. Every other place where Owlery writes a path into a command line quotes it with `hooks.ts#shellQuote`: the launcher at `pane-chain.ts:60` and `:73`, the pane's command at `hooks.ts:152` to `:155`, and the chain command at `chain-command.ts:605`. The worktree's path in the opening line is a path and not a command, so it can stay as it is.

The search printed two lines: the builder (`chain.ts:671`) and its pin (`chain.test.ts:422`). The fix below covers both. The search is a sample, because a command spelt in other words escapes it. The search of `chain.ts` and `stage-records.ts` for command spans with an interpolated value found no other such span in a prompt.

```ts
// apps/desktop/src/daemon/chain.ts: chain-command.ts already imports shellQuote from ./hooks, so the chain command's bundle holds it.
import { shellQuote } from "./hooks";
// ...
    `Make each fix in that worktree, and commit it yourself there with \`git -C ${shellQuote(given.worktree)}\`. Then append one close block under each finding you answer, and commit no change to the round record: Owlery commits the record after the pass.`,

// apps/desktop/test/chain.test.ts:422, and a second fixPassPrompt call in the same case with a worktree that holds a space and a quote, e.g. "/repos/my repo's wt"
      `Make each fix in that worktree, and commit it yourself there with \`git -C '${WORKTREE}'\`. Then append one close block under each finding you answer, and commit no change to the round record: Owlery commits the record after the pass.`,
```

The quoting assumes a POSIX shell, which the bundle's agent contract rule 21 asks every command to be written for. Where importing `hooks.ts` into `chain.ts` is unwanted, because it brings `node-pty` into the module's graph, moving `shellQuote` to a module both import serves as well.

### 2. The new case *names the tree the stage reads by the worktree's path in each of the five prompts, and as this folder in none* covers nothing its group does not already cover, and its name claims a check it does not make

```seal
severity: should
location: `apps/desktop/test/chain.test.ts:430-439`, `seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/design.md:38`
evidence: read `apps/desktop/test/chain.test.ts:376-439`, `apps/desktop/test/chain.test.ts:596-660`, `apps/desktop/test/chain.test.ts:663-700`, `apps/desktop/src/daemon/chain.ts:597-599`, `seal/threads/1795610687-235-stage-prompts-name-the-worktree/trail/phases/phase-1.md:21`, `seal/threads/1795610687-235-stage-prompts-name-the-worktree/trail/phases/phase-1.md:30`
```

Why it matters: the case's one assertion is that `promptText` of each of the five builders does not contain "this folder" (`chain.test.ts:438`). Each of the five prompts already has a case in the same file that pins `shown`, line by line, with `toEqual`. Those cases are the round at `:377`, the fix pass at `:411`, the convergence at `:597`, the ruling at `:621` and the seal at `:666`, and each pins `diff` as well. The new case's inputs take only branches that those cases or their sibling assertions already read. One example is the seal with every record absent, which the case at `:694` reads. Another is the ruling with no options and no decisions, read at `:657`. A false flag in those builders leaves a line out and adds no text. So any change that brings "this folder" back fails a pinned case first. Phase 1 says the case was "shown red by mutation 4" (`phase-1.md:21`). That holds, but mutation 4 at `phase-1.md:30` rewrites the convergence prompt's closing line, which the pinned convergence case at `:613` also reads. So the red run does not show anything that only this case holds. The case's name also says that it checks each prompt *names the tree by the worktree's path*, and no line of it asserts that. The frame asks for the case (*Scope* item 6, `design.md:38`, "one assertion there says that no prompt holds "this folder""). That is why the finding is located in the frame as well. The plan's own failure scenario says the assertion does not reach a sixth builder (`plan.md:17`), and that is the only case it could catch that the pins miss.

The fix is to drop the case and fold *Scope* item 6 to the pins that already hold the fact. The fold touches every statement of the case: `design.md:38` (*Scope* item 6), `design.md:56` (the acceptance row that excludes `chain.test.ts` from the search because of this case), `plan.md:34` (the *Verified by* cell that names the case), and `phase-1.md:13`, `:21` and `:30`. This list comes from `git grep -n -F 'names the tree the stage reads' -- seal/threads/1795610687-235-stage-prompts-name-the-worktree`, which printed `design.md:56`, `plan.md:34`, `phase-1.md:21` and `:30`, and from `git grep -n -F 'this folder' -- seal/threads/1795610687-235-stage-prompts-name-the-worktree`, whose lines that speak of the case are `design.md:38` and `phase-1.md:13`. Its other lines quote the old prompts and stay. It is a sample: a sentence that names the case in other words escapes it.

```md
6. The cases of `chain.test.ts` that pin the five prompts' texts pin the new texts. Each pins its prompt's `shown` line by line, so no prompt holds "this folder" without a pinned case failing.
```

```ts
// apps/desktop/test/chain.test.ts:430-439: remove the case "names the tree the stage reads by the worktree's path in each of the five prompts, and as this folder in none".
```

There is another way to fix it, if the orchestrator wants a case that covers all five builders at once. The case asserts the first line of each prompt positively, to end with `` `, in its worktree \`${WORKTREE}\`. Every path below is from that worktree's top.` ``, and is renamed to what it asserts. It would still repeat the pins. So the frame's item 6 would need to state why a second assertion is worth keeping.

### 3. The crafter's definition does not say that every other path its prompt gives is from the worktree's top, although *Scope* item 8 says that step 9 says the same as the other three definitions

```seal
severity: should
location: `apps/desktop/role-bundle/agents/crafter.md:62-65`, `seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/design.md:40`
evidence: read `apps/desktop/role-bundle/agents/crafter.md:59-72`, `apps/desktop/role-bundle/agents/proofer.md:29-34`, `apps/desktop/role-bundle/agents/sealer.md:34-37`, `apps/desktop/role-bundle/agents/orchestrator.md:35-38`, `apps/desktop/test/role-bundle.test.ts:150-154`; executed `git grep -n -F 'every other path' HEAD -- apps/desktop/role-bundle apps/desktop/test`
```

Why it matters: *Scope* item 8 (`design.md:40`) says three things of `agents/proofer.md`, `agents/sealer.md` and `agents/orchestrator.md`. Each says the role works in the worktree the first line of its prompt names. Each says the role reads every other path from that top. Each says the folder its session starts in may be another worktree. It then says that `agents/crafter.md` step 9 "says the same" and adds the `git -C` sentence. The search printed the "every other path" clause in the proofer (`:31`), the sealer (`:35`) and the orchestrator (`:36`) definitions, and in no line of `agents/crafter.md`. Step 9 at `crafter.md:62-65` names the worktree and the other folder, and leaves out the clause. In a pane, the crafter's session may stand in another worktree, and its prompt lists `seal/threads/<id>/trail/rounds/round-N.md` as a relative path. The prompt's opening line does say that the paths are from the top. But the definition the crafter reads beside it is the one of the four that does not say so. *Scope* item 8 wanted all four to give a pane's role one instruction. The pin in `role-bundle.test.ts:152` checks two of the three clauses, so it does not catch the gap.

```md
9. In a fix pass, open `skills/implement/fix-pass.md` and follow it in place
   of step 7's run and of the phase record steps 5 and 8 write; steps 5 and
   6 otherwise hold for each fix. The pass runs in the work item's
   worktree, which the first line of its prompt names by the absolute path
   of its top, and you read every other path the prompt gives from that
   top. The folder your session starts in may be another worktree of the
   repository. The prompt names the round record, the
```

```ts
// apps/desktop/test/role-bundle.test.ts:152: pin the third clause for all four definitions
      for (const named of ["prompt names by the absolute path of its top", "every other path", "may be another worktree of the repository"]) expect(flat(file), `${file}: ${named}`).toContain(named);
```

The new pin should be shown red against `crafter.md` as it stands at `8fb5de99` before it is committed.

## Confirmations

What matched: *Scope* items 1, 2 and 4. All five builders (`chain.ts:637`, `:664`, `:703`, `:739`, `:769`) open through `chain.ts#openingLine` (`:620-622`), which gives the stage, the worktree in a code span and "Every path below is from that worktree's top." The four closing lines read "read the files of that worktree", and the seal's prompt names its form as "the guarantee's template that your definition names". The sealer's definition names `templates/records/sdd-guarantee.md` at step 4 (`agents/sealer.md:87-89`), and `claude-roles.ts:79` says that a `templates/` path the definition cites is the bundle's. `stage-records.ts:161`, `:194` and `:308` pass `place.worktree`, and `daemon.ts:3317` and `:3342` pass `item.worktree`. Read, and executed through the narrow runs under *Probes*.

What matched: the chain command's worktree is git's top of its own folder (`chain-command.ts:153`, `:163`), and the daemon's `placeOf` (`daemon.ts:3173-3175`) gives `item.worktree`, the folder `runStage` starts the role in. So the path a daemon's prompt names is the session's own folder, as the changelog's last item says. Read.

What matched: the frame's searches, run again at the target. `git grep -n -e 'this folder' -e "the session's folder" HEAD -- apps/desktop/src/daemon/chain.ts` printed nothing. `git grep -n "folder the session starts in" HEAD -- apps/desktop/role-bundle` printed nothing. The same search at `05af4fb1` over the whole tree printed only `role-bundle.test.ts:153`, as `phase-1.md:11` says. The search over `chain.test.ts` printed `:430` and `:438`, as the acceptance row and departure 3 say. Executed.

What matched: the class of definitions that state where a role works. Searches over the bundle for `folder`, `cwd`, `working directory` and `worktree` found other sentences, and none of them locates a role's tree against its prompt. `agents/proofer.md:178` ("The folder you work in is the person's worktree") still reads true, because the folder the proofer works in is now the named worktree. `skills/seal/SKILL.md:28` is the session's own instruction. `skills/implement/SKILL.md:210` says that the shell starts in the session's folder, which agrees with the change. Executed. This is a sample, because it searches for words.

What matched: `pr.md`'s five quotes are each the opening sentence of `design.md` *Scope* items 1, 3 and 8, and the defaults of Q1 and Q2 in `questions.md`, word for word. Each item of `changelog.md` is true of the code at the target. Read.

What matched: the four `## Rule changes` entries' `from` lines stand verbatim in `docs/architecture.md:311-312` and `docs/architecture.ko.md:311-312`, under the sections they name (`docs/architecture.md:293`, `docs/architecture.ko.md:293`), and the build changed no file of `docs/`. Executed with `grep -n -F`.

What matched: `gaps.md` labels the full suite and the `daemon.test.ts` and `heavy-run.test.ts` failures `unverified`, with the orchestrator answering at the broad gate. That label is honest. This round ran three files and no suite. Read.

Two lines of the diff are reflowed past the wrap width, `agents/sealer.md:39` and `skills/implement/fix-pass.md:9`. They read badly and say nothing wrong, so they are no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a pane's subagent meets a permission question when it reads the named worktree (Q1) | `seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/questions.md:13` | the owner's walk (#184) |
| Whether a pane's crafter commits in the named worktree with `git -C` (Q2) | `seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/questions.md:14` | the owner's walk (#184) |
| The full suite, the typecheck and the broad gate's other checks, `daemon.test.ts` and `heavy-run.test.ts` among them | `seal/threads/1795610687-235-stage-prompts-name-the-worktree/gaps.md:9-10` | the orchestrator, at the broad gate |
| How the window draws a headless stage's prompt whose first line now holds an absolute path, such as whether a long path pushes the state off the row | `apps/desktop/src/renderer/work-item-view.ts:871` | the owner's walk (#184), since no built-app case was run |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/chain-command.test.ts test/role-bundle.test.ts` | exit 0: 2 files, 35 tests passed, the new case *names in a stage's prompt the worktree it is run in* among them |
| `cd apps/desktop && node scripts/test-in-electron.mjs test/chain.test.ts` | exit 1: 169 of 170 passed, every case of the five prompts and the three daemon assertions on a prompt's first line among them. One case failed on its 60-second timeout: *stops the chain where the stage fails, ...* of the pull request stage (`chain.test.ts:3507`), which reads no prompt's text. The machine's load average stood between 4 and 11 during the run |
| `cd apps/desktop && node scripts/test-in-electron.mjs test/chain.test.ts -t "stops the chain where the stage fails, with a sentence that names the stage"` | exit 0: that case passed alone, so the timeout is the machine's load and not the change, as the phase found for `daemon.test.ts` |
