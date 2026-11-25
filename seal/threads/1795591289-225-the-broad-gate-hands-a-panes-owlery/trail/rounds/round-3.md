# Review round 3: 1795591289-225-the-broad-gate-hands-a-panes-owlery

```seal
target: c5788a987f3613e9c423571bfe8ff4850245acf3, fixes 5579ed7124d4843409423092c246134abf810cd5..c5788a987f3613e9c423571bfe8ff4850245acf3
```

This is a verifying round. It reviews the fix diff `5579ed71..c5788a98`. That diff holds three commits. `4c96c51b` is the round 2 record. `ca92695b` changes one line of `changelog.md` and one line of `frame/design.md`. `c5788a98` adds the fix pass's close block to `round-2.md`. The round read `git show --stat` of each one. At `c5788a98` the round read these files whole: `routing.md`, `frame/design.md`, `gaps.md`, `changelog.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. No `frame/plan.md`, `frame/questions.md`, `pr.md`, `pr.<lang>.md` or `trail/phases/` stands, and the prompt names no `decisions.md`. No `seal/parity.json` stands, and `seal/config.json` has no `Pact` key. `Record language` is English.

Some facts are carried from rounds 1 and 2 and were not re-established. They are round 1's *Scope* confirmations: `spawnPane`'s cut, `gateEnvironment`'s cut and its two callers, and `PANE_VARIABLES` beside the code that sets the four variables. Also carried are the two new cases read against their groups, the `## Rule changes` `from:` sentences at `docs/architecture.md:160` and `docs/architecture.ko.md:160`, and what the owner's comment on issue #225 records. This round reopened the coordinates the fix diff rests on: `apps/desktop/src/daemon/daemon.ts:1763`, `:1841`, `:2370-2405` and `:2474-2480`, `apps/desktop/src/daemon/hooks.ts:162-214`, `apps/desktop/src/daemon/adapters/claude.ts:116-125` and `:613`, `apps/desktop/src/daemon/adapters/claude-accounts.ts:155-158`, `apps/desktop/src/daemon/pty.ts:62-72` and `:89`, and `apps/desktop/src/daemon/pane-kinds.ts:11-12`. It also read `daemon.ts:2402-2405` and `claude.ts:108-126` at `d4a63f35`, the commit that *Grounding* is dated to.

## Findings

### 1. The changelog and the frame's *Grounding* still say the daemon's run folder reaches every pane, and a sign-in pane never gets it

```seal
severity: should
location: `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:5`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:10`
evidence: read `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/changelog.md:5`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:8`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:10`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/frame/design.md:19`, `seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/trail/rounds/round-2.md:673-675`, `apps/desktop/src/daemon/daemon.ts:1763`, `apps/desktop/src/daemon/daemon.ts:2382`, `apps/desktop/src/daemon/daemon.ts:2405`, `apps/desktop/src/daemon/adapters/claude-accounts.ts:155-158`, `apps/desktop/src/daemon/adapters/claude.ts:116-125`, `apps/desktop/src/daemon/adapters/claude.ts:613`, `apps/desktop/src/daemon/pty.ts:62-72`, `apps/desktop/src/daemon/pty.ts:89`
reopens: round-2#1
```

Why it matters: the close of round-2#1 does not hold for the whole class it named. Round 2's finding was that a sign-in pane takes nothing of the daemon's environment, yet a sentence said it did. A sign-in pane is the pane in which a person signs an account in to Claude Code. Round 2 said it had read every sentence of the records that says which panes receive the daemon's environment. It said only `changelog.md:3` and `frame/design.md:8` state that wrongly (`round-2.md`, its finding 1). The fix in `ca92695b` rewrote those two lines alone. The fix pass's answer says the changelog's line 5 and the frame's other lines are unchanged. Two more sentences of the same class still stand:

- `changelog.md:5`: "The daemon's run folder, `OWLERY_RUN_DIR`, still reaches every pane."
- `frame/design.md:10`: "`OWLERY_RUN_DIR` is not a pane's: the app sets it for the daemon it starts (...), each pane inherits it, ..."

A sign-in pane does not get `OWLERY_RUN_DIR`. The daemon opens it through `startSession` with `signsIn` set (`daemon.ts:1763`). `startSession` passes `inherit` as `signsIn === null` (`daemon.ts:2382`). So `spawnPane` gives the pane its command's `env` alone (`daemon.ts:2405`). That `env` is `claudeEnv` (`claude-accounts.ts:157`, wired at `claude.ts:613`). `claudeEnv` holds `HOME`, `USER`, `PATH`, `LANG`, `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` and the config folder, and nothing else (`claude.ts:116-125`). `terminalEnv` adds only `TERM`, `COLORTERM` and `LANG` to what it is given (`pty.ts:62-72`, called at `:89`). The same holds at `d4a63f35`, the commit *Grounding* is dated to. There `spawnPane` already took the `env`-alone branch, and `claudeEnv` named no `OWLERY_` variable. So `design.md:10` misstates that commit as well as the target.

The changelog becomes the release's note. Its line 5 now names the panes the chain variables leave, and then tells a reader that the run folder reaches every pane. The sign-in pane is the one that line 3 now leaves out, and line 5 puts it back in. A sealer reads *Grounding* line 10 beside line 8, which now excludes a sign-in pane, and gets two different answers about the same pane. The frame's *Out* at `:19` says a sign-in pane "runs in its command's environment alone", and line 10 contradicts it.

The round built the list of statements by taking each of the six record files apart into its sentences. It kept every sentence that names a set of panes or what a pane receives from the daemon. That gives `changelog.md:3` and `:5`, `frame/design.md:7`, `:8`, `:10`, `:15`, `:19`, `:25`, `:35` and `:40`, and `gaps.md:5`. Only `changelog.md:5` and `frame/design.md:10` still state the fact wrongly. Here is why the others hold. `:15`, `:35`, `:40` and `gaps.md:5` say what a pane does not take, and a sign-in pane takes none of it. `:25` names a Claude Code pane and a shell alone. In `:35` and `:40`, the daemon and the gate keep the run folder, not every pane. The panes that do get the run folder are a shell, a Claude Code pane and a worktree setup pane. Each of them takes the daemon's environment through `withoutPaneVariables`, which keeps `OWLERY_RUN_DIR` (`daemon.ts:2405`, `hooks.ts:172-176`).

The fix rewrites both sentences. The rest of `changelog.md:5`, and every other line of the frame, hold as they read.

```markdown
- **A pane holds a chain's variables only where its own command sets them.** A daemon started in an Owlery pane, for example by `pnpm start` typed there, gives a shell and a Claude Code pane on no chain no `OWLERY_CHAIN` and no `OWLERY_BASE`, and gives each pane only the id and hook socket its own command sets. The daemon's run folder, `OWLERY_RUN_DIR`, still reaches a shell, a Claude Code pane and a worktree setup pane.
```

```markdown
- `OWLERY_RUN_DIR` is not a pane's: the app sets it for the daemon it starts (`apps/desktop/src/main/daemon-client.ts`), each pane other than a sign-in pane inherits it, and the chain command reads it (`apps/desktop/src/daemon/chain-command.ts`).
```

## Confirmations

What matched: the two lines `ca92695b` rewrites. `changelog.md:3` and `frame/design.md:8` now read word for word as round 2's paste-ready texts. Line 3's list of the panes that named the outer chain is whole. The round built it from every place a pane starts. `startSession` has four callers. Two start a pane of the kind the client asks for (`daemon.ts:860`, `:891`), and the kinds are a shell and a Claude Code pane (`pane-kinds.ts:11-12`). The third is a sign-in pane (`:1763`), and the fourth is a worktree setup pane (`:2480`). `spawnPane`'s one other caller restarts a work item's pane under another account (`:1841`), so it is the same shell or Claude Code pane. A Claude Code pane on the chain sets its own `OWLERY_CHAIN` (`hooks.ts:200`). A setup pane sets its id alone (`hooks.ts:213`). Line 8 holds at `d4a63f35`, where `spawnPane` already gave a sign-in pane its command's `env` alone. The close of round-2#1 holds for these two lines, and finding 1 reopens it for the two sentences of the class that the fix left standing (read).

What matched: the fix pass's own record edit. `c5788a98` adds only the close block to `round-2.md`. The commit it names, `ca92695b`, touches both paths the finding located (read).

What matched: the label in `gaps.md:11`, which the fix diff did not change. The whole suite is still labelled unverified, and the broad gate is named as its answerer. The fix diff adds no test and no code unit, so no new case had to be read against its group (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the lint and the typecheck at `c5788a98`. This round ran nothing | the repository's `Broad gate` | the orchestrator, through the broad gate the chain command runs from the pane |
| *Grounding* line 11's second run: the group passing 17 at `5cb81763` with the four variables unset and `OWLERY_RUN_DIR` kept. Only a run settles it | `frame/design.md:11` | the session that ran it. The broad gate runs the same condition at the target, not at `5cb81763` |
| Scenario 3: the group passing in a pane that holds the four variables. The session claims 443 cases passed there (`gaps.md:11`) | `frame/design.md:27` | the session that ran it, or the owner |
| A daemon started by `pnpm start` in an Owlery pane, with a real Claude Code pane in it | `gaps.md:12` | the owner, where they start the app from a pane |

## Probes

| Command | Result |
|---|---|
