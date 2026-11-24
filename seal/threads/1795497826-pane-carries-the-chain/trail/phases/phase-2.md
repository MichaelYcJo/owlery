# Phase 2: 1795497826-pane-carries-the-chain

## What this phase found

### Where the tree contradicted the frame

**Two sentences of *Data & interfaces* cannot both hold for `body`.** One says that each subcommand prints one JSON object on its first line. The row of `body` says that it prints the two sections of the pull request body. Decision: `body` writes the sections into a file of the run folder and prints `{"body": "<path>", "head": "<commit>"}`. Grounds: every subcommand then answers in one form, and `gh pr create --body-file` takes the path as it is. Judged against `frame/design.md` *Data & interfaces*.

**The frame does not say how the command finds the run folder.** Scope item 4 says the command talks to no daemon, and the row of `owed` says it writes the prompt and the rules file into the run folder. A pane's environment already holds `OWLERY_RUN_DIR`: `apps/desktop/src/main/daemon-client.ts:53` gives it to the daemon, and `apps/desktop/src/daemon/pty.ts#terminalEnv` does not drop it. Decision: the command reads `OWLERY_RUN_DIR`, and otherwise takes the folder of the launcher `OWLERY_CHAIN` names. It writes under `chain/<work item>/` there: `round-<N>.prompt.md`, `fix-pass-<N>.prompt.md`, `seal-<run>.prompt.md`, the role's rules file and `pull-request-body.md`. Where neither variable is set it refuses.

**The rules file `owed` hands a role says two things that are untrue in a pane.** The row of `owed` names `claude-roles.ts#rulesText`, and the phase hands that text unchanged. Its head (`claude-roles.ts#rulesHead`) says "The daemon answers every call that asks for permission by the rule of your role, and no person is asked" and "You hold these tools and no other". A subagent of a pane's session is answered by the person's own permission settings and holds the tools its definition names. The phase changed nothing of it: the head is the text a role session of the daemon is launched with, and phases 3 and 4 decide what a pane's subagent is told.

**Scenario 12 names `apps/desktop/test/pull-request.test.ts` for the pull request stage, and that file holds no case of the stage.** It holds the cases of `github.ts`'s functions. The cases of `Daemon#runPullRequest` stand in `apps/desktop/test/chain.test.ts`, under "the pull request stage of a work item's chain". The case "follows the base round 1's record names, whatever base the work item stores" stands there.

**Scenario 12 says the seal's reader takes the recorded base, and nothing `sealAt` answers names a base.** A `Seal` holds a state, a commit and a sentence. The case in `apps/desktop/test/seal-state.test.ts` reads `standingOf` as `workItemSeal` calls it, with the stored base, and holds that the standing's base is the record's. It also holds that the seal still reads `sealed`.

**Scope item 13 asks for a sentence that says how to name another base, and the daemon's chain has no way to name one.** No control of the app changes a work item's stored base (`frame/design.md` *Out of scope*). The daemon's refusal therefore points at the chain command: "Name the base in a Claude Code pane of the work item, with `--base <branch or commit>` on the chain command's `owed` and `round`". No pane carries the command before phase 4, so until then the sentence names a way that is not yet reachable from the app.

**Scope item 20 says the run writes each chain's records "as the shared module of item 5 writes them".** The run commits them with git through the helpers of `apps/desktop/test/chain-run.ts`, `commitSeal` and `commitSealedAfterAFix`, which write the gate's record and the guarantee with `seal-records.ts#gateText` and `#guaranteeText`, the writers the module calls. It does not call the module's own functions: each takes a standing read from a worktree at one head and a role's answer, and the run's scene needs a sealed history made before the app starts.

**Scope item 20 does not say that the finished work item's seal must come after the look.** The summary's shot leads with the seal "given since the look", and the run takes the look once the seven work items stand. A work item stored with its sealed records before the start would hold its seal at the look. Decision: the run makes the commits of the sealed chain before the start, resets the branch to the commit before them, stores the pull request with the sealed commit as its `head` and `pushed`, and fast-forwards the branch to that commit once the look is taken.

**Storing two work items first changed the order of the run's work items.** The store gives a stored work item its id from the file, and a work item made through the form the next id. The finished work item moved from the fourth place to the second, so the stored ones are 1 and 2. A stored work item has no pane, so a second client of the daemon starts one of its kind with the client message `start`.

**The chain command's bundle cannot hold `node-pty`.** `gate.ts` takes a pane's environment from `pty.ts`, which loads the native module. `build.mjs` leaves `node-pty` out of `dist/chain.js`, as it does for the daemon. The built command was run once with Electron's Node, and answered a refusal and the usage.

### Decisions made while building

**The module is `apps/desktop/src/daemon/stage-records.ts`, and it also builds each stage's prompt.** `Daemon#runRound`, `#runFixPass` and `#runSeal` each built a prompt from a diff before the session ran, and the command's `owed` needs the same prompt. So `roundStage`, `fixPassStage` and `sealStage` stand beside `recordRound`, `recordFixPass`, `recordGate` and `recordVerdict`. `declaredDirectory` is the routing a first start writes, and `commitRecords` the commit. The daemon keeps `runStage`, the gate's process, the ledger and the stored stages. Judged against `frame/design.md` scope item 5.

**The daemon passes its queue of a worktree's commits into the module.** `Daemon#chainCommit` ran inside `inWorktree`, behind every commit of a person's word. Each function of the module takes that turn as its last argument, and the command gives none.

**Two checks stay in the daemon.** The refusal of a daemon given no version keeps its sentence, "this daemon was given no version of Owlery", which `apps/desktop/test/chain.test.ts` pins: the command always holds a version. A fix pass that left a finding open and asked nothing still fails after the record's commit in the daemon. The module returns the open findings, and the command prints them, since its next `owed` owes the fix pass again.

**A judging session named `the session` is refused in the module.** Scope item 7 asks it of the command. `seal-records.ts#guaranteeText` already refuses a judge that is one of the builders, and `the session` is the name of a builder whatever the routing says. The daemon's adapter never names a session so.

**The base is one value with four fields, `chain.ts#ChainBase`.** `named` is what a target line holds, `commit` what a gate's run names, `reads` what git diffs the branch against, and `branch` what a pull request is opened against. `chain.ts#baseOf` gives the base round 1's record names where the head holds that record and the name still names a commit, and otherwise the base the caller holds. `standingOf` takes the recorded base for the standing's own `base` too, which is what the seal's reader comes through.

**A recorded base that is a commit is read as that commit.** A work item whose base branch has a name the round block's `target:` line does not take, one with a `+` in it for example, gets the commit it was cut at as its target's base (`chain.ts#roundBase`). Before round 1 the daemon reads such a branch against the base branch, as before. Once round 1's record stands, the sealer's diff is read against the recorded commit, and the pull request is still opened against the stored branch.

**A recorded base's commit is the commit the base and the head last shared.** The daemon's gate named the stored `baseCommit` in a run block. Where round 1's record stands, both chains now name `git merge-base <base> <head>`. `chain_check.py#broad_gate` holds the run's commit against the head and decides nothing on its base.

**The refusal stands at a chain's start alone.** `Daemon#whyNoChain` and the command's `start` and every subcommand that reads a base refuse a branch that left it. A run of the daemon that is under way does not ask again between two stages.

**The command's fix pass reads the round record at the head.** The daemon reads the committed record before its crafter runs. The command is called after the fix's commits, so it reads the record the head holds, which is the same text unless the crafter committed its close blocks. In that case the order owes the verifying round, and `fix-pass` is refused with the step the records owe.

**The command's gate runs with the pane's environment.** `gate.ts#gateEnvironment` takes the command's own environment less `TERM` and `COLORTERM`, and the `PATH` stays the pane's, which a login shell already set. The daemon asks a login shell for its `PATH` because the app started it.

**`chain_check.py` changed in one sentence.** It reads "decided by the pane's session or by Owlery's orchestrator agent, or answered by the person". The paragraph of `gaps.md` that named the sentence as left went with the change.

### What was seen red

- `apps/desktop/test/pr-check.test.ts`, the case of the refusal's sentence: red against the old sentence of `chain_check.py`, on the line of the `withheld` verdict.
- The other new cases first ran against code that was already written, so each was shown red by `seal mutate`, one guard removed at a time.
- `seal mutate` on `chain.ts`, three mutants red against the command's cases and the seal reader's: the standing's base taken from the caller alone, the refusal of a commit the head does not hold removed, and the refusal of a base that shares no commit removed.
- `seal mutate` on `chain.ts` against the two new cases of `chain.test.ts`: `baseOf` returning the stored base, red; the refusal of a commit the head does not hold removed, red. The standing's base taken from the caller alone SURVIVED there: the daemon's run and the command both hand `standingOf` the base `baseOf` gave, so the line is watched on the seal reader's path alone, by the case of `seal-state.test.ts`, which is red against it.
- `seal mutate` on `daemon.ts`, two mutants red: the pull request opened against the stored base branch, and the refusal's return removed from `whyNoChain`.
- `seal mutate` on `stage-records.ts`: the refusal of a judge named `the session` removed, red.
- `seal mutate` on `chain-command.ts`, ten mutants red: the check of the step owed, the gate's exit code, the `--by` option, each of the three refusals of `start`, the two refusals of a base nothing names, the back composed with a ledger entry, and the refusal of a branch that left its base.
- `seal mutate` on `apps/desktop/test/screenshots.test.ts`, each a run of the built app: the stored gate's stage removed, and the stored pull request removed.

### What the next phases need

- **Phase 3.** `chain-command.ts` holds no `ask` and `start` takes no `--automation`. `SUBCOMMANDS`, `USAGE` and `RUNS` are where each is added, and `chain.ts#routingText` writes the routing.
- **Phase 3.** The command prints a refusal on its error output, and `ask` exits with 2 there by the frame.
- **Phase 4.** The command reads `OWLERY_BASE`, `OWLERY_RUN_DIR` and `OWLERY_CHAIN`. A launcher that runs `dist/chain.js` needs `ELECTRON_RUN_AS_NODE=1` for that one process, and the gate's command does not inherit it (`pty.ts#terminalEnv`).
- **Phase 4.** `seal` takes `--judged-by` and `--model` as words: an id holds no white space and no comma (`record-blocks.ts#isSessionId`).
- **Phase 6.** Scope item 16 has `docs/architecture.md` say that the base follows the records. What the code now does is in *Decisions made while building* above: the four fields of a base, the commit a recorded base's run names, and the refusal at a start alone.
