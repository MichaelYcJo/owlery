# Review round 1: 1795701355-127-role-sessions-run-in-a-sandbox

```seal
target: 559ee2de against 7c6cba4a
```

This round reviewed the branch `feat/127-a-role-sessions-shell-commands-are-bounded-by-nothing-but-its-tool-list` at `559ee2de` against `7c6cba4a`, the commit of `origin/release/v0.1.0` that `559ee2de` merged onto the built `882cb25e`. It covers phases 1 to 4. The release has since moved to `450c6e09`, whose one commit changes no file this branch changes (executed: `git diff --name-only` of the two ranges, intersected). The round read the code and the records in the branch's worktree, and ran its probes and its narrow cases in a clone of `559ee2de` under its own scratch directory, with the worktree's installed dependencies linked in and nothing installed. No earlier round exists, so nothing was carried, and every verdict below was reached at this target. `routing.md`, the three frame files, `gaps.md` and `changelog.md` were read whole at the target; no `pr.md` stands.

The caller asked four things of compliance first. Each role's commands are bounded where the frame says, and no wider, in the launch's own arguments; but a proofer's and a sealer's commands, which this work now allows, reach the daemon itself on the loopback and have it act outside their bound, which is finding 1. The frame's sentences on what a command may write match phase 3's measurement and this round's probes. The minimum version and `roleCheck`'s failure hold. A pane the person opens is untouched. *Confirmations* gives the grounds of each.

## Findings

### 1. A proofer's or a sealer's command reads the daemon's port and token from the run folder, connects to the daemon on the loopback, and has the daemon act outside the sandbox as a window would

```seal
severity: must
location: `apps/desktop/src/daemon/adapters/claude.ts:131-142`, `apps/desktop/src/daemon/adapters/claude.ts:507-520`, `apps/desktop/src/daemon/adapters/adapter.ts:43-51`, `apps/desktop/src/daemon/daemon.ts:2465-2479`, `apps/desktop/test/role-session.test.ts:85-89`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:53`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:69`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:131`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/changelog.md:9`
evidence: executed `test/test_tmp_daemon_api.test.ts` once in the clone through the lock (*Probes*); executed `git grep -n -F -e "loopback" -e "network bound" 559ee2de -- seal/threads/1795701355-127-role-sessions-run-in-a-sandbox apps/desktop/src/daemon/adapters/claude.ts apps/desktop/src/daemon/daemon.ts apps/desktop/role-bundle`; executed `strings` of the installed Claude Code 2.1.329 binary for the settings `denyRead` and `allowRead`; read `apps/desktop/src/daemon/main.ts:45`, `apps/desktop/src/daemon/main.ts:111-115`, `apps/desktop/src/daemon/discovery.ts:16-22`, `apps/desktop/src/daemon/daemon.ts:664-672`, `apps/desktop/src/shared/protocol.ts:890-894`, `apps/desktop/src/shared/protocol.ts:979`
```

Why it matters: the issue asks that a role's commands write "only where the role writes", and `docs/roadmap.md` *Milestones* row 1 says Owlery never turns a permission check off. This work lifts the daemon's refusal of a proofer's and a sealer's commands (*Scope* item 2) because the sandbox bounds them (`frame/plan.md` *Alternatives considered*, the row on a launch on an older Claude Code). The bound does not hold against the daemon itself.

- The daemon listens on a WebSocket at `127.0.0.1` (`daemon.ts:664-672`). A client that sends `hello` with the token is a full client (`daemon.ts:953`).
- `main.ts:115` writes the port and the token into `daemon.json` of the run folder. The file is readable by the person (`discovery.ts:16-22`), and the sandbox bounds writes, not reads (`frame/design.md` *Out*, the row on what a command reads).
- The proofer's prompt names its scratch folder, `<run folder>/scratch/<id>-<six characters>` (`daemon.ts#withScratch`), so the command knows where the run folder is.
- The launch lets a command reach the loopback (`claude.ts:140`), and phase 3 measured a TCP connection on `127.0.0.1` working inside the sandbox.

A full client can do what a window does. It can create a work item, which writes the repository's git folder that the proofer's bound refuses (`protocol.ts:894`). It can open a `shell` pane in a work item (`protocol.ts:892`) and type into it (`protocol.ts:979`), which runs a command as the person, outside any sandbox. It can also delete a work item, rename a branch, or answer questions and reverse decisions, which commit into the branch under review.

The probe ran the real CLI 2.1.332 as a proofer at a round, through the daemon and the Claude adapter of `559ee2de`, against the stand-in model. The stand-in's command ran `node` on a script that read a `daemon.json` holding the case daemon's port and token, connected to `ws://127.0.0.1:<port>`, sent `hello` and a `createWorkItem` for the repository under review, and printed the answer. The tool result was `created <the worktrees' folder>/project/made-from-inside-the-sandbox`, and `git worktree list` of the repository gained that worktree. The session finished. The same harness's proofer had its `ln` into its scratch folder refused by the system (probe B), so the sandbox was in force for the proofer's commands in that harness. The probe's `daemon.json` stood in the case's own folder and not in an app's run folder; a role's command reads either, by the frame's own *Out* row.

The crafter's commands can do the same, but before this work they were bounded by nothing, so for the crafter this is no regression. For a proofer and a sealer it is one: at `7c6cba4a` the daemon refused every command of theirs that asked. The orchestrator's commands that ask are still refused, so it cannot run the client.

These sentences of the work item's records state the bound that does not hold. `git grep` on "loopback" and "network bound" printed `frame/design.md:69`: "the network bound alone keeps it from sending them", which the loopback to the daemon refutes. It also printed `frame/design.md:131`, the `add` of *Agent adapters*: "A sandboxed command reaches no host but the loopback", which names no service on the loopback. And it printed `changelog.md:9`, which says the same for a person. `frame/design.md:53`, *Scope* item 3, sets the `network` block with no word on reads. The search is a sample: a statement of the bound in other words escapes it.

The repair is to refuse a role's commands the read of the run folder, and give the scratch folder back. The 2.1.329 binary's settings schema holds `sandbox.filesystem.denyRead`, "Additional paths to deny reading within the sandbox", and `allowRead`, "Paths to re-allow reading within denied regions (takes precedence over denyRead)" (executed, `strings`). The precondition is unmeasured: whether the two keys given through `--settings` reach the sandbox on 2.1.329 and 2.1.332. So the stand-in case owes a step that shows it. In that step the case's daemon is given a run folder, the case writes a `daemon.json` there as `main.ts:115` does, and the proofer's and the sealer's command runs `cat <run folder>/daemon.json` and must be told `Operation not permitted`. The scratch folder stands inside the run folder, so the step also shows the clone still made there. Denying the whole run folder also keeps the other accounts' config folders under `accounts/` from a command, which is part of #285.

```ts
// adapters/adapter.ts, RoleStart
  commands?: { write: readonly string[]; refuse: readonly string[]; unread: readonly string[] };

// adapters/claude.ts, RoleLaunch and sandboxOf
  sandbox: { allowWrite: readonly string[]; denyWrite: readonly string[]; denyRead: readonly string[]; allowRead: readonly string[] };
...
    // A command reads no file of the daemon's run folder, whose daemon.json names the port and the token a client
    // reaches the daemon with on the loopback, outside the sandbox; the session's own scratch folder is read back.
    filesystem: { allowWrite: places.allowWrite, denyWrite: places.denyWrite, denyRead: places.denyRead, allowRead: places.allowRead },

// adapters/claude.ts, launchOf
    return { bundleDir, agent: agentOf(role), rulesFile, tools: toolsOf(role), sandbox: { allowWrite: commands.write, denyWrite: [...commands.refuse, bundleDir], denyRead: commands.unread, allowRead: scratch === undefined ? [] : [scratch] }, scratch: scratch ?? null };

// daemon.ts, commandsOf: every grant is refused the read of the run folder, where the daemon has one
    const unread = this.options.runDir === undefined ? [] : [realpathSync.native(this.options.runDir)];
    if (commands === "worktree") return { commands: { write: [worktree, gitFolder], refuse: [join(gitFolder, "hooks"), join(gitFolder, "config")], unread }, scratch: null };
    if (commands === "nowhere") return { commands: { write: [], refuse: [worktree, gitFolder], unread }, scratch: null };
    session.scratch = this.makeScratch(session.info.id);
    return { commands: { write: [session.scratch], refuse: [worktree, gitFolder], unread }, scratch: session.scratch };
```

The snippet leaves these for the fix pass, which owes them too. The doc of `RoleStart.commands` (`adapter.ts:68-77`) states `unread`. The cases that build `commands` or `sandbox` by hand (`claude-adapter.test.ts`, `daemon.test.ts` *headless sessions*, `fake-adapter.test.ts`, `role-bundle.test.ts:476`) gain the field. `frame/design.md` *Scope* items 3 and 4, *Data & interfaces*, the *Out* row on what a command reads, and the `add` of *Agent adapters* with its Korean twin are the framer's to fold. `changelog.md:9` is the fix pass's to rewrite, so that it says a command reads nothing of the run folder. An alternative the fix pass may weigh instead is a launch whose commands reach no loopback port at all. Whether `allowLocalBinding: false` refuses a connection to another process's loopback port was not measured, and it would refuse a test's local server, which `claude.ts:139` names as the reason for the key.

### 2. The proofer's definition says a claim no run settled is no finding, which turns every finding read from the tree into a row of `## Not judged`

```seal
severity: should
location: `apps/desktop/role-bundle/agents/proofer.md:192-194`, `apps/desktop/test/role-bundle.test.ts:323`
evidence: executed `git grep -n -F -e "no run of yours settled" -e "only a run could settle" 559ee2de -- apps docs seal`; read `apps/desktop/role-bundle/agents/proofer.md:126-147`, `apps/desktop/role-bundle/agents/proofer.md:180-194`, and `git show 7c6cba4a:apps/desktop/role-bundle/agents/proofer.md`
```

Why it matters: the paragraph's last sentence was "A claim that only a run could settle is no finding" at `7c6cba4a`. Phase 2 rewrote it to "A claim that no run of yours settled is no finding: it is a row of `## Not judged`, with who answers it." That sentence holds every claim, not the claims only a run could settle. A pane's proofer runs nothing, so under it no claim of a pane's round is a finding. A role session's proofer that reads a wrong sentence of a record has settled it by reading, and the same paragraph's rule (`proofer.md:126-147`) makes that sentence a finding located in the file that holds it. The two rules now contradict each other, and a proofer that follows the later one reports less. *Scope* item 8 asks the paragraph to keep the pane's case, not to widen what is no finding. The search printed `proofer.md:193` and its pin `role-bundle.test.ts:323`, and nothing else; it is a sample of spellings.

```markdown
`path:line` you opened, and the `## Probes` table holds no row. A claim
that only a run could settle, and that no run of yours settled, is no
finding: it is a row of `## Not judged`, with who answers it.
```

```ts
      "A claim that only a run could settle, and that no run of yours settled, is no finding: it is a row of `## Not judged`, with who answers it.",
```

### 3. The sealer's *Never* list still reads "Never run a command", beside the *Job* paragraph that gives its commands a scratch folder

```seal
severity: should
location: `apps/desktop/role-bundle/agents/sealer.md:114-115`, `apps/desktop/test/role-bundle.test.ts:329`
evidence: executed `git grep -n -F -e "run a command, or edit code or a record" 559ee2de -- apps docs seal`; read `apps/desktop/role-bundle/agents/sealer.md:27-36`, `apps/desktop/role-bundle/agents/sealer.md:57-69`, `apps/desktop/role-bundle/agents/sealer.md:112-115`
```

Why it matters: the item reads "Write a file of the worktree, run a command, or edit code or a record to make a claim hold". It has two readings. As three items, it says never run a command, which contradicts *Job* (`sealer.md:30-34`): in a role session the sealer's commands run in the sandbox and write in its scratch folder. As one purpose clause over all three, it says never write a file of the worktree to make a claim hold, which narrows a rule *Job* states with no condition. Phase 2 kept "run a command … to make a claim hold" and read it the second way (`trail/phases/phase-2.md:27`). A sealer has no way to ask which reading was meant, and step 2 says it checks each claim by reading, so the first reading is the likelier one. Then the commands this work gives it go unused, or are run against its own *Never* list. `skills/writing-style/SKILL.md` *에이전트와 검사가 읽는 글은 한 가지로만 읽히게 쓴다* asks a definition an agent follows to have one reading. The search printed `sealer.md:114`, its pin `role-bundle.test.ts:329` and phase 2's account; the phase record states its own commit, and the fix pass owes it nothing.

```markdown
- Write a file of the worktree: your section reaches the tree by Owlery's
  hand.
- Make a claim hold by running a command, or by editing code or a record:
  you check each claim against the tree as it stands.
```

```ts
      "- Write a file of the worktree: your section reaches the tree by Owlery's hand.",
      "- Make a claim hold by running a command, or by editing code or a record: you check each claim against the tree as it stands.",
```

### 4. Two new cases of `claude-adapter.test.ts` assert nothing that the full-arguments case and the case of each role's bound do not already assert

```seal
severity: should
location: `apps/desktop/test/claude-adapter.test.ts:56-71`
evidence: read `apps/desktop/test/claude-adapter.test.ts:56-102`, `apps/desktop/test/claude-adapter.test.ts:899-922`, `apps/desktop/src/daemon/adapters/claude.ts:94-142`, `apps/desktop/src/daemon/adapters/claude.ts:507-520`
```

Why it matters: "gives a crafter's launch the sandbox of its commands in the one settings value…" (`:56`) asserts one `--settings`, its exact JSON, and the folders after `--add-dir`. "gives a proofer's launch the scratch folder as the one place its commands write…" (`:66`) asserts the proofer's `filesystem` and the folders after `--add-dir`, the scratch folder last. "gives a role launch the role's tools as one value…" (`:73`) pins the whole argument list of a role launch, so one `--settings` and the exact JSON, keys in order, with the same `sandboxOf`. "bounds each role's commands to the places it was given…" (`:899`) runs every pair through the adapter, which calls `claudeArgs`. It pins each pair's `sandbox` block whole, the crafter's two folders to write and three refused among them. It also pins the folders after `--add-dir`, the proofer's and the sealer's scratch folder last. `claudeArgs` passes `allowWrite`, `denyWrite` and `scratch` through as given (`claude.ts:106`, `:116`, `:138`), so no mutation of it fails the two cases and passes the other two. *User scenarios* rows 1 and 2 stay held by `:73` and `:899`.

```ts
// Remove the two cases at claude-adapter.test.ts:56-71, "gives a crafter's launch the sandbox of its commands…" and
// "gives a proofer's launch the scratch folder as the one place its commands write…": `:73` and `:899` hold their facts.
```

### 5. That a crafter's command cannot point git at a folder of its own rests on Claude Code's own protections, which the launch does not name and no case runs

```seal
severity: should
location: `apps/desktop/test/role-session.test.ts:85-89`, `apps/desktop/test/role-session.test.ts:270-276`, `apps/desktop/src/daemon/daemon.ts:2475`
evidence: executed `test/test_tmp_git_redirect.test.ts` case A and `test/test_tmp_commondir.test.ts` once each in the clone through the lock (*Probes*); read `apps/desktop/src/daemon/worktrees.ts:1193-1242`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:131`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:17`
```

Why it matters: the `add` of *Agent adapters* says the crafter's commands are refused the git folder's `hooks` and `config` "so a commit is made and no hook that would run outside the sandbox is planted". The daemon commits records in the worktree with the repository's hooks (`worktrees.ts:1193-1242`). Two other places would plant one. One is the worktree's `.git` file, inside the crafter's place, which can name another git folder. The other is `commondir` of the worktree's own folder under the git folder, inside the crafter's place too. Either can point git at a copy whose `config` sets `core.hooksPath`, and the copy can be made: in the commondir probe, `cp -R` of the git folder into the worktree and `git config -f` on the copy both exited 0. The system refused the write to `.git` and to `commondir` on Claude Code 2.1.332, so no hook ran when the probe committed outside the sandbox. Those two refusals are Claude Code's own: the launch names neither (`daemon.ts:2475`). `frame/plan.md:17` names this failure, a place the launch does not name, and says the `role:refusal` scripts are what catch it. The crafter's script tries neither place, so a Claude Code release that narrows its built-in list would open the hole and every script would still pass.

```ts
// role-session.test.ts, standInCommand: the crafter's command also tries to point git elsewhere, each step run whatever the last did.
  if (pair.role === "crafter") return `printf x >> '${worktree}/README.md' && git -C '${worktree}' commit -qam probe && printf x >> '${kept}/outside.txt'; printf 'gitdir: %s\\n' '${kept}' > '${worktree}/.git'; printf '%s\\n' '${kept}' > "$(git -C '${worktree}' rev-parse --path-format=absolute --git-dir)/commondir"`;

// role-session.test.ts, the crafter's assertions, after the commit's: the system refused both, and git still names the repository's folder.
      expect(told).toContainEqual({ isError: true, content: expect.stringMatching(refusedWrite(join(worktree, ".git"))) });
      expect(told).toContainEqual({ isError: true, content: expect.stringMatching(/commondir.*operation not permitted|operation not permitted.*commondir/is) });
      // `temporaryRepository` names the case's repository `project` under `base`.
      expect(git(worktree, "rev-parse", "--path-format=absolute", "--git-common-dir").trim()).toBe(realpathSync(join(base, "project", ".git")));
```

The fix pass may also name the two places as deny entries of the crafter's launch, `<worktree>/.git` and the worktree's `commondir`, so the bound is the launch's own. A commit writes neither (read: `git commit` writes the index, the objects, the refs and the logs). The comment block above `standInCommand` (`role-session.test.ts:72-84`) and the file's head (`:28-32`) state the crafter's command and change with it.

## Confirmations

What matched: each grant names where its commands write, as *Scope* item 1 and *Data & interfaces* state it. `role-grants.ts:41-46` gives the proofer and the sealer `{ writes: "nowhere", runs: true, commands: "scratch" }`, the crafter `{ writes: "worktree", runs: true, commands: "worktree" }` and the orchestrator `{ writes: "nowhere", runs: false, commands: "nowhere" }`, and `verdictOn` is unchanged. The cases of scenario 5 hold the proofer's and the sealer's command allowed and the orchestrator's refused with `no-command` (read, `daemon.test.ts`, and executed in the narrow run below).

What matched: the places are bounded where *Scope* item 4 says, and no wider. `daemon.ts:2465-2479` gives the crafter the worktree's real path and git's common folder to write, and refuses that folder's `hooks` and `config`. It gives a proofer and a sealer the new scratch folder alone and the orchestrator nothing, and refuses all three the worktree and the git folder. `claude.ts:519` adds the bundle's folder to every role's refused places. A worktree that git names no repository for starts no role's session, with the sentence that names the role (`daemon.ts:2468-2474`). `claude.ts:131-142` passes the `sandbox` block exactly as *Data & interfaces* spells it, and `--add-dir` ends with the worktree, the bundle and, for a scratch grant, the scratch folder (`claude.ts:114-116`). The refresh launch gets no `sandbox` block (`claude.ts:106`). Read, and executed in the narrow runs below.

What matched: the frame's sentences on what a command may write match what was measured. *Scope* item 4, the *Out* row on Claude Code's temporary folder and the `add` of *Agent adapters* name the default places phase 3 measured on 2.1.332. Those are `/tmp/claude-<user id>`, which stays writable, and the session's folder and a linked worktree's git folder, which the launch refuses to the roles that do not write them. They keep "only" and "nowhere" off every sentence the head and the scratch paragraph give a role (`claude-roles.ts:67-71`, `daemon.ts#withScratch`). This round's probes found three more refusals on 2.1.332. A proofer's `ln` of a worktree file into its scratch folder was refused, so a hard link does not carry a write into the worktree. A crafter's write to the worktree's `.git` file and to its `commondir` were refused (finding 5 says why that matters). Executed, *Probes*.

What matched: the minimum version and `roleCheck`'s failure hold as *Scope* item 10 and *User scenarios* row 12 state them. `MIN_CLAUDE_VERSION` is `"2.1.329"` (`claude.ts:33`). `roleCheck` reads `claude_code_version` before the agents (`claude.ts:451-454`). A value that is no string or holds no three dot-joined numbers fails with "the session did not say which version of Claude Code it is, so its sandbox was not checked", and an older version fails with `versionNotice`'s sentence. The adapter then stops the CLI as for a missing agent. A refresh launch is not checked, since `unchecked` is undefined for it (`claude.ts:608`). The cases of row 12 and the role-launch table hold each, and passed in the narrow run below. Phase 4's claim that they were seen red and its mutation runs were read, not repeated.

What matched: a pane the person opens is untouched. The diff changes no line of the pane launch (`hooks.ts#paneCommands`, `pane-chain.ts`), and the pane's branch of `rulesHead` (`claude-roles.ts:99-100`) is the line it was at `7c6cba4a`. `roleCheck` runs only inside the Claude adapter's role launch, so the version check does not reach a pane, which still launches on any version. The bundle's proofer and sealer keep the pane's case in their text. Read; the case "opens the rules of a pane's subagent with a head that differs from a role session's in two paragraphs…" passed in the narrow run below.

What matched: the scratch folder's life is what *Scope* item 5 and *User scenarios* row 4 state. `makeScratch` makes it with `mkdtemp` under `scratch/` of the run folder, named `<id>-` and six characters, readable by the person alone, and under the system's temporary folder where the daemon has no run folder (`daemon.ts:2490-2495`). `dropScratch` removes it once, at the run's `exit`, at a rejected start, and when a wrapped stop settles (`daemon.ts:2522-2524`, `:2568-2580`). A stop or a close that arrives while git answers still stops the started run, which removes the folder. `gaps.md` *Not done* states the empty launch that costs. Read.

What matched: the bundle's head and scratch paragraph say what *Scope* items 7 and 8 ask, apart from the two sentences of findings 2 and 3. The `gaps.md` row "Whether a model follows the head's sentence on its commands and the scratch paragraph" names this round as its reader. The texts were read against items 7 and 8: each names where the role writes and the places the system refuses, and neither claims every other write is refused. Whether a model follows them is a row of *Not judged*.

What matched: `## Rule changes` can be applied by the settle. Each `from:` quote stands word for word, with runs of white space as one, in the file its operation names, and each `section:` names a heading of that file (executed: a loop over the operations with `grep -F`). The other work item of the release in this tree, #300, states no rule change of these sections (executed, `grep -n -F` of the headings over its `frame/design.md`).

What matched: `gaps.md` is new in this branch, so no row left it, and its two closed rows say `closed` with the grounds (read). The `Not verified` rows that give the files the phase boundaries did not run to the orchestrator's broad gate keep the suite labelled as unverified, and that label is honest: no phase claims the suite.

Phase 3's record holds two paragraphs that the fold of 2026-11-27 overturned, on Q4 and on Q5, and `trail/phases/phase-4.md` names both. This round reads them as statements of phase 3's commit and opens no finding on them.

The narrow run of `claude-adapter.test.ts`, `fake-adapter.test.ts` and `chain.test.ts`, and of `daemon.test.ts -t "#127|starts no role"`, is the last row of *Probes*.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a model follows the head's sentence on its commands and the scratch paragraph. A stand-in reads neither, and the caller allowed no real model call | `apps/desktop/src/daemon/adapters/claude-roles.ts:67-71`, `apps/desktop/src/daemon/daemon.ts#withScratch` | the orchestrator, at the first daemon-launched round on a real model |
| Whether the 2.1.329 runs of phase 3 were made at `f479b1bd` or later. The git branch step and its refusal entered the stand-in case at `f479b1bd`, and phase 3 names no commit for those runs, while the third cell of the `## Rule changes` row on *Role sessions run detached from the user's environment* states the branch's refusal on 2.1.329. The caller allowed `role:refusal` on the installed Claude Code only, so this round did not run 2.1.329 | `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/trail/phases/phase-3.md:31`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:161` | the orchestrator, from the crafter's run of phase 3 |
| Whether the broad gate is inside the bound the issue asks for. After a fix pass it runs the worktree's own `Broad gate` command and the code the crafter's commands wrote, outside any sandbox (`stage-records.ts:248-264`, `gate.ts`), and no row of *Out* names it | `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:66-76` | the person, through the orchestrator |
| The suite, the lint and the typecheck at this target, which contract rule 2 gives to the orchestrator's broad gate | the branch at `559ee2de` | the orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `test/test_tmp_daemon_api.test.ts` in the clone, through the lock, with the installed Claude Code 2.1.332 against the stand-in model: a proofer's command runs `node` on a script that reads a `daemon.json` with the case daemon's port and token, connects to `ws://127.0.0.1:<port>`, and sends `hello` and a `createWorkItem` | 1 passed. The tool result was `created <the worktrees' folder>/project/made-from-inside-the-sandbox`, `git worktree list` gained that worktree, and the session finished |
| `test/test_tmp_git_redirect.test.ts` case A, the same way: a crafter's command copies the git folder into the worktree as `.owl`, sets `core.hooksPath` there to a `pre-commit` that touches a file of the case's folder, and writes the worktree's `.git` to name the copy; the case then commits outside the sandbox | The `.git` write was refused (`operation not permitted: <worktree>/.git`, `rc=1`), the copy and its `git config -f` were made, a direct `touch` of the case's folder was refused, and the commit ran no planted hook |
| `test/test_tmp_git_redirect.test.ts` case B, the same way: a proofer's command runs `ln <worktree>/README.md <scratch>/r` and appends to `<scratch>/r` | `ln: <scratch>/r: Operation not permitted`; the append made a new file, and the worktree's `README.md` and `git status --porcelain` were unchanged |
| `test/test_tmp_commondir.test.ts`, the same way: a crafter's command makes the same copy and writes the copy's path into `commondir` of the worktree's folder under the git folder; the case then commits outside the sandbox | `cp=0`, `config=0`, then `operation not permitted: <git folder>/worktrees/under-review/commondir`, `commondir=1`; git still named the repository's git folder, and the commit ran no planted hook |
| `node scripts/test-in-electron.mjs test/claude-adapter.test.ts test/fake-adapter.test.ts test/chain.test.ts`, then `node scripts/test-in-electron.mjs test/daemon.test.ts -t "#127\|starts no role"`, in the clone, through the lock | The first read 3 files and 307 cases passed, and the second 7 cases passed with 433 skipped by the filter. The two runs hold the cases these files have of *User scenarios* rows 1 to 5, 7 and 12, and the head's case of row 6. Each exited 0. Nothing else of the suite was run |
