# Review round 1: 1795329620-role-bundle

```seal
target: 8685647 against origin/release/v0.0.2
```

The range is `git diff 6f10cd0...8685647`. Executed: `git merge-base 8685647 6f10cd0` prints `6f10cd0`, the tip of `origin/release/v0.0.2` after #124. The local `release/v0.0.2` ref of the clone is stale at `78bb2b9`, so a reader who diffs against it gets #123 and #124 in the range. This is the first round, so no earlier round's coordinates or verdicts were carried. The framer's probe output and its clone of the tag were opened at their coordinates in the session's scratch directory, `<scratchpad>/1795329620-role-bundle/frame/`, and the facts below are this round's own.

Stage 1 read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`, each whole at `8685647`. No `pr.<lang>.md` stands, and none is owed, because `Commit and pull request language` is English. The issue was read with `gh issue view 38`. Stage 2 read every source and test file of the range.

## Findings

### 1. A plugin error from any plugin of the session fails a role launch whose agent loaded, and the reason names the bundle

```seal
severity: should
location: `apps/desktop/src/daemon/adapters/claude.ts:181-210`, `apps/desktop/test/claude-adapter.test.ts:558-561`, `seal/threads/1795329620-role-bundle/frame/design.md:79`, `seal/threads/1795329620-role-bundle/frame/design.md:96`, `seal/threads/1795329620-role-bundle/frame/design.md:175`, `seal/threads/1795329620-role-bundle/frame/design.md:180`, `seal/threads/1795329620-role-bundle/pr.md:15`
evidence: read `apps/desktop/src/daemon/adapters/claude.ts:202-208`, `apps/desktop/test/fixtures/claude-role-stream.jsonl:1`, and line 88 of the framer's `probe-role-launch.txt` in the scratch directory
```

Why it matters: `roleCheck` tests `plugin_errors` before it tests the agent (`claude.ts:202-207`). Any entry fails the launch with `the role bundle did not load: <message>`, even where `agents` lists `owlery:<role>`. The session does not load the bundle alone. The real role run's `init` line (`test/fixtures/claude-role-stream.jsonl:1`) lists five built-in plugins beside `owlery`, such as `cc-plugin-telemetry@builtin`, and they load with `--setting-sources ""` too. An error of one of them fails every role launch, and the window then blames the bundle for it. The CLI marks whose error an entry is: case 5 of the framer's probe printed `{"plugin":"inline[0]","type":"path-not-found","message":…,"path":…}` (line 88 of `probe-role-launch.txt`). The check reads neither key. The agent's name settles whether the session holds the role, which is what *Scope* item 9's heading and the rule change's bold sentence (`design.md:175`) say. A plugin error explains a missing agent, and does not stand in for one. The code does what *Scope* item 9 says ("Where its `plugin_errors` is a list with an entry"), so the frame sentence is part of the defect. The test at `claude-adapter.test.ts:558` ("though the agent is listed") pins the wrong order.

The fix reads the agent first. A plugin error becomes the reason only where the agent is missing:

```ts
  if (record.type !== "system" || record.subtype !== "init") return { seen: false, failure: null };
  // The agent's name decides: a session that lists it took the bundle's definition, whatever another plugin of the session reported.
  if (Array.isArray(record.agents) && record.agents.includes(agent)) return { seen: true, failure: null };
  // Where it is missing, a plugin that did not load is the likelier cause, and its message says more than the name does.
  const errors: unknown = record.plugin_errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first: unknown = errors[0];
    const message = typeof first === "object" && first !== null ? (first as { message?: unknown }).message : undefined;
    return { seen: true, failure: `the role bundle did not load: ${typeof message === "string" ? message : JSON.stringify(first)}` };
  }
  return { seen: true, failure: `the session does not hold the agent ${agent}` };
```

The snippet covers the body of `roleCheck` alone. The fix pass also owes these statements of the same fact:

- The docstring at `claude.ts:181-190`.
- The case at `claude-adapter.test.ts:558-561`. With the agent listed and an error present, it now expects `{ seen: true, failure: null }`, and its name says so. A case with the agent missing and an error present keeps the message.
- `frame/design.md` *Scope* item 9 (line 79). Its second sentence becomes "Where its `agents` lists `owlery:<role>`, the launch goes on. Where it does not, and its `plugin_errors` is a list with an entry, the text is `the role bundle did not load: <the first entry's message>`; otherwise it is `the session does not hold the agent owlery:<role>`."
- Scenario 7 (line 96). The line that "holds a `plugin_errors` entry" also lacks the agent.
- The two rule changes at lines 175 and 180. They become "where that line does not list the role's agent, and names the first plugin that did not load as the reason where there is one" and its Korean rendering.
- `pr.md:15`. It becomes "stops it where the role is missing".

Each is a frame or record sentence the settle writes into `docs/architecture.md`.

```seal
verdict: fixed 5eda611
answer: The paste-ready body was read against the folded *Scope* item 9 (`frame/design.md:79`) and applied as it stands, with its two comments reworded. `roleCheck` reads the agent first, and a session that lists it goes on whatever `plugin_errors` holds. Where the agent is missing, the first plugin error's message is the reason, and the agent's name where the list is empty or absent. The docstring says the same. The case at `claude-adapter.test.ts:558` now expects the launch to go on with the agent listed and an error present, and it failed against the old order (`expected { seen: true, … } to deeply equal { seen: true, failure: null }`). A new case holds the message with the agent missing. It passed against the old code, so it was shown red by `seal mutate` at `5eda611`: five mutants of the new body, all red, the plugin branch disabled among them. The frame's sentences (lines 79, 96, 175, 180) were folded by the framer in `595798b`, and `pr.md:15` by the orchestrator in `ccae1e4`.
```

### 2. The built-app keep-awake case now passes or fails on the version of the person's own Claude Code

```seal
severity: should
location: `apps/desktop/test/keep-awake.test.ts:116`, `seal/threads/1795329620-role-bundle/gaps.md:10`
evidence: read `apps/desktop/test/keep-awake.test.ts:116`, `apps/desktop/test/keep-awake.test.ts:125`, `apps/desktop/test/keep-awake.test.ts:135`, `apps/desktop/test/keep-awake.test.ts:150`, `apps/desktop/src/renderer/view.ts:177-179`, `apps/desktop/src/daemon/daemon.ts:214`
```

Why it matters: `keep-awake.test.ts:116` starts the built app with `BuiltApp.start({})`, so the daemon gets the suite's own `SHELL` and `HOME`. Since phase 2 that daemon asks the person's interactive login shell for `claude` at its start (`daemon.ts:214`) and runs the person's real `claude --version`. On a machine whose Claude Code is older than 2.1.326, the notice arrives a few seconds after the start. `statusNotice` then puts it in place of the daemon's state (`view.ts:177-179`). The case waits for the exact texts `Daemon running, no agent` and `Daemon running, no agent, keeping the Mac awake` (lines 125, 135, 145 and 150), so it fails there. The person's installed CLI now decides a suite case, and the case starts no pane, so `SHELL` has no other use there. `gaps.md:10` says of this read that "no case reads what came of it". The keep-awake case does read it, through the status line. The fix is the Q6 option "the suite's helper gives its apps a script `SHELL`", for the one file that still uses the person's own shell:

```ts
    // No work item and no pane: the app starts once, in the background, with a user data folder of its own.
    // `SHELL` is a program that prints nothing, so the daemon's lookup at its start finds no `claude`, and the status line does not depend on the person's Claude Code.
    const app = await BuiltApp.start({ SHELL: "/usr/bin/true" });
```

The precondition is that `/usr/bin/true` ships with macOS, and this file runs on `darwin` alone (`keep-awake.test.ts:112`). With that change, the `gaps.md:10` row no longer describes the suite. Its item keeps the owner's check of the built app, without the sentence on `keep-awake.test.ts`. Its closing memo row on Q6 (`gaps.md:9`) can then say that no case of the suite asks the person's login shell.

```seal
verdict: fixed 88369a9
answer: The finding holds, and the paste-ready line was applied as it stands: `/usr/bin/true` exits 0 and prints nothing for the lookup's arguments, so the daemon finds no CLI and its notice stays null. `test/keep-awake.test.ts` was run alone at that tree and passed, 4 cases. `gaps.md:10` lost the sentence on `keep-awake.test.ts` and now says that no case the suite runs reaches the person's login shell or their `claude`. The Q6 row (`gaps.md:9`) says the same of the suite, and the row of the files not run no longer lists `keep-awake`.
```

### 3. A rule change says every run of the CLI rewrites `~/.claude.json`, and the daemon's version read at each start does not

```seal
severity: should
location: `seal/threads/1795329620-role-bundle/frame/design.md:185`, `seal/threads/1795329620-role-bundle/frame/design.md:189`
evidence: executed `sh <scratchpad>/1795329620-role-bundle/round-1/test_tmp_version_home.sh`, which printed `2.1.330 (Claude Code)`, `exit: 0` and no file under the scratch `HOME`
```

Why it matters: this work adds a run of `claude --version` at every daemon start, and at each hello while a notice stands. The rule change for *Role sessions run detached from the user's environment* states "Every run of the CLI rewrites that file, and it is no settings file" (line 185), and the Korean text says the same (line 189). A reader of `docs/architecture.md` after the settle therefore concludes that the daemon rewrites the person's `~/.claude.json` at each start. The probe ran the installed CLI with `--version`, the five environment names of `claudeEnv` and an empty scratch `HOME`. The CLI wrote nothing there, `.claude.json` included. *Grounding* states the narrower fact ("Each run that reached a session wrote `.claude.json`"), and the sentence should say that:

```text
  to: … (probed 2026-11-22 on 2.1.330). Every session of the CLI rewrites that file, and it is no settings file; the daemon's `claude --version` at its start writes nothing there. The same run wrote no `settings.json`, no `installed_plugins.json` and no `known_marketplaces.json`.
```

```text
  to: … (2026-11-22 실험, 2.1.330). 이 파일은 CLI 세션이 뜰 때마다 다시 쓰는 파일이고, 설정 파일이 아닙니다. 데몬이 시작할 때 실행하는 `claude --version`은 이 파일에 아무것도 쓰지 않습니다. 같은 실행에서 `settings.json`, `installed_plugins.json`, `known_marketplaces.json`은 쓰이지 않았습니다.
```

```seal
verdict: fixed 595798b
answer: The framer folded both rule changes in `595798b`: each now says that every session of the CLI rewrites the file, and that the daemon's `claude --version` writes nothing there. The same fact stood in `gaps.md:25`, a path this finding does not name, and `88369a9` rewrote it to "every session of the CLI". `trail/phases/phase-1.md:71` stays as that phase's dated record.
```

### 4. `pr.md` miscounts the files kept byte for byte, and calls Q2's default the owner's answer

```seal
severity: should
location: `seal/threads/1795329620-role-bundle/pr.md:7`, `seal/threads/1795329620-role-bundle/pr.md:10`
evidence: executed `cmp` of each file of `apps/desktop/role-bundle` except `README.md` and the manifest against the installed AgenticSeal 0.38.4 and against the framer's clone of `v0.38.4` (`0eca6e7`); read `seal/threads/1795329620-role-bundle/frame/questions.md:21`
```

Why it matters: the pull request body is what the owner reads to decide the merge, and two of its cells state facts the records contradict.

- `pr.md:7` says "15 files of AgenticSeal 0.38.4 …, 11 byte for byte and 5 changed". That adds up to 16. The `cmp` run found 11 equal files, but `LICENSE` is one of them, and `LICENSE` is not among the 15 of *Scope* item 2. Of the 15, 10 are byte for byte and 5 changed, as `apps/desktop/role-bundle/README.md` and `trail/phases/phase-1.md` say.
- `pr.md:10` says the `pluginUsage` entry is one "which the owner's default answer to #38's Q2 accepts". Q2's status is `open` (`frame/questions.md:21`), and its default is the framer's, not an answer of the owner's. Read this way, the sentence tells the owner that they already accepted the entry, when that is the one question left for them.

```markdown
| The app ships a role bundle with the definitions and rules of proofer, crafter for fix passes, and sealer | `apps/desktop/role-bundle/`, copied into `dist/bundle/` by `build.mjs`: 15 files of AgenticSeal 0.38.4 (tag `v0.38.4`, `0eca6e7`), 10 byte for byte and 5 changed only where the launch requires (the `skills:` key of the three definitions, the sealer's stamp, one sentence of contract rule 11, one `description` each in core and contract), and AgenticSeal's `LICENSE` byte for byte |
| Nothing is installed into the user's Claude Code, and the settings files are unchanged | The four settings and plugin-list files were byte for byte the same after the real session. Claude Code's own state file `~/.claude.json` gains a `pluginUsage` count, `owlery@inline`. Whether that is acceptable is #38's Q2, still open for the owner; its default accepts it, and `docs/architecture.md` will state it |
```

```seal
verdict: fixed f3112ba
answer: The orchestrator corrected both cells of `pr.md` in `f3112ba`, the commit that recorded this round: line 7 counts 10 files byte for byte and 5 changed, with `LICENSE` named apart, and line 10 says Q2 is still open for the owner and that its default accepts the entry.
```

## Confirmations

What matched: scenario 2's comparison holds. Of the 15 taken files and `LICENSE`, 11 are byte for byte the installed `/Users/x/.claude/plugins/cache/agenticseal/agentic/0.38.4` and the framer's clone of `v0.38.4` at `0eca6e7` alike. Executed: `cmp -s` per file against each. The other five are the three definitions, `skills/agent-contract/SKILL.md` and `skills/core/SKILL.md`. Executed: `diff` of each against the installed copy. Each hunk is one of *Scope* item 3, and no hunk is outside it. The three definitions lose `skills:` with its two entries. `agents/sealer.md` changes its *Job* sentence to the frame's words with the rest kept, loses step 6 whole, renumbers step 7 as 6, loses the last sentence of the first *Never* bullet, and takes the frame's last *Never* bullet. Rule 11's first paragraph and the two `description` sentences read as *Scope* item 3 gives them. `agents/sealer.md` holds no `stamp`. Read: `grep -i stamp`. No bundle file still cites a sealer step 6 or 7. Read: `grep -rn` over the bundle.

What matched: *Scope* items 1, 4 and 5. The manifest holds `name` and `description` alone (`role-bundle/.claude-plugin/plugin.json`). `build.mjs:52-54` removes `dist/bundle` and copies `role-bundle` whole. `README.md` names AgenticSeal, the URL, `v0.38.4`, `0eca6e7`, the MIT License and `LICENSE`. It also names each change of item 3, each part left out with its reason, and the five steps of a later carry-over. Read.

What matched: *Scope* items 6 to 8 and 10, read at `protocol.ts:210-224`, `claude-roles.ts`, `claude.ts:51-72` and `claude.ts:248-257`, `fake.ts:25-28` and `daemon.ts:705-716`. The head of `rulesHead` is the frame's block of *Data & interfaces* line for line. The rules file is written with `writeWholeFile` at mode 600 in a folder of mode 700. A role launch adds the three options after `--permission-mode default` and the bundle after the worktree, and changes nothing else. The daemon keeps `roleStageOf`'s pair and not the client's object. Executed: `node scripts/test-in-electron.mjs test/claude-adapter.test.ts`, 65 cases passed.

What matched: the `init` line check against what Claude Code printed, apart from finding 1. The real run's first stdout line is `system`/`init`, and it lists `owlery:crafter`, `owlery:proofer` and `owlery:sealer` under `agents` (`test/fixtures/claude-role-stream.jsonl:1`). When every plugin loads, that line has no `plugin_errors` key, and `roleCheck` reads an absent key as no error. A `system` line of another subtype, or a message, before `init` is passed on and waits (`claude.ts:201`). The plain launch reads no line, because `unchecked` is `undefined` without a role (`claude.ts:326`). Read.

What matched: the three facts of *Scope* item 13 each stand in one bundle file alone: `round-<n>/clone` in `agents/proofer.md`, `8, 16 and 20` in `skills/agent-contract/SKILL.md`, and `# Review round <N>` in `templates/records/sdd-round.md`. Executed: `grep -rl -F` over `apps/desktop/role-bundle`. So Q3's answer at `trail/phases/phase-1.md` stands on the run's answer as recorded.

What matched: what a role session writes to the person's Claude Code beyond the `pluginUsage` count. In the person's `~/.claude.json`, `pluginUsage` is the one key whose value names `owlery@inline` or `owlery:`. No file or folder under `~/.claude/plugins` is named for owlery. Executed: a `json` read of `~/.claude.json` and `find ~/.claude/plugins -maxdepth 4 -iname '*owlery*'`. The real run left one transcript folder under `~/.claude/projects/`. Every headless session writes one, and that has held since #8, so it is nothing new to a role. `trail/phases/phase-1.md` names it. The daemon's new `claude --version` writes nothing under `HOME` (finding 3's probe).

What matched: Q6, apart from finding 2. The suite does not slow down, because nothing waits on the read. `Daemon#listen` starts it with `void` (`daemon.ts:214`). In every built-app file but `keep-awake`, a fixture shell stands for the login shell, and each exits at once without a terminal (`test/fixtures/receiver.sh:8`, `printer.sh:9`, `basics-shell.sh:22`), so the lookup costs one short process and finds no CLI. The stand-in CLIs that a stand-in shell names are the four files `git grep -l __owlery_cli -- apps/desktop/test` lists, and each answers `--version` apart from a session. Executed. What can unsettle a case is finding 2.

What matched: the folded list at the end of *Data & interfaces*. `versionNotice` is exported from `claude.ts:127`, `statusNotice` stands at `view.ts:177`, and `held.agentNotice` at `shared.ts:25`. Read. The notice sentence of `claude.ts:134` is *Scope* item 11's word for word. Read.

What matched: the suite is labelled honestly. `gaps.md:7` names the whole suite, the typecheck and the document checks as `unverified`, with the orchestrator's broad gate as their answerer.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether one session quoting a number that only the appended contract states meets the issue's third *Done when* line, "a run shows the session following a rule that only the appended rules state". The frame's scenario 12 chose a quoted fact, and the run meets the scenario | `seal/threads/1795329620-role-bundle/frame/design.md:83`, `seal/threads/1795329620-role-bundle/frame/design.md:101`, issue #38 | the sealer, who reads the issue against the tree |
| Q2, whether the `owlery@inline` entry under `pluginUsage` is acceptable | `seal/threads/1795329620-role-bundle/frame/questions.md:21` | the owner |
| Whether a built-in plugin's error reaches `plugin_errors` in a role session in practice. Finding 1 rests on the shape of the line, and no run showed such an error | `apps/desktop/test/fixtures/claude-role-stream.jsonl:1` | a measurement, by whoever meets one |
| The whole suite, the typecheck and the `Broad gate` command at HEAD. Contract rule 2 keeps them from this round, which ran one unit file | `seal/config.json` | the orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| `sh <scratchpad>/1795329620-role-bundle/round-1/test_tmp_version_home.sh` (the installed `claude --version` with the five names of `claudeEnv` and an empty scratch `HOME`) | printed `2.1.330 (Claude Code)`, exit 0, and no file under the scratch `HOME` |
| `cmp -s` of each bundle file but `README.md` and the manifest against the installed AgenticSeal 0.38.4, then against the framer's clone of `v0.38.4` | 11 equal and 5 different, the same five against both |
| `node scripts/test-in-electron.mjs test/claude-adapter.test.ts`, in `apps/desktop` of the branch worktree | exit 0, 65 cases passed in 25 seconds |
