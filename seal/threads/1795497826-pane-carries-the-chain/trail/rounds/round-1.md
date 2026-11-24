# Review round 1: 1795497826-pane-carries-the-chain

```seal
target: cd3b5a1 against release/v0.0.3
```

The range is `18f9158..cd3b5a1`: `release/v0.0.3` at `18f9158` is merged into the branch at `f46c100`, so the range holds this work item alone. No earlier round stands, so this round carries no coordinate and no verdict from one. Every fact below was read or run at `cd3b5a1` by this round.

## Findings

### 1. A branch that left the commit round 1's record names as its base is not refused, though the architecture document says both chains refuse it

```seal
severity: should
location: `apps/desktop/src/daemon/chain.ts:283-286`, `docs/architecture.md:306`, `docs/architecture.ko.md:306`, `apps/desktop/test/chain-command.test.ts:164`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_recorded_base.test.ts` in the round's clone; read `apps/desktop/src/daemon/chain.ts:283-306`, `apps/desktop/src/daemon/chain-command.ts:161-184`, `apps/desktop/src/daemon/daemon.ts:2249-2253`
```

Why it matters: `docs/architecture.md:306` and its Korean edition state that "Both chains refuse to start where the recorded commit is no ancestor of the branch's head", and `frame/design.md` *Scope* item 13 asks the same. Once round 1's record stands, every reader takes the base through `chain.ts#baseOf`, and `baseOf` sets the base's `commit` to `git merge-base <recorded> <head>` (`chain.ts:285`), whatever the record names. A merge base is always an ancestor of the head. So the first check of `whyNoBase` (`chain.ts:297`) can never fire for a recorded base, and only the second, "share no commit", can. For a base recorded as a branch's name that is the frame's design. For a base recorded as a commit, which the target line holds where the base branch's name is one `ROUND_BASE` does not take or where the work item records no base branch (`chain.ts#roundBase`), the branch can leave that commit and both chains go on.

The probe showed it on the chain command. A branch was read against a commit `cut` through `OWLERY_BASE`, round 1 recorded `<head> against <cut>`, and the branch was then rebased, its records with it, onto a line that does not hold `cut`. `git merge-base --is-ancestor` confirmed that the head no longer holds `cut`. `owed` then exited 0 and owed round 2 instead of refusing. The sealer's diff for such a branch is then read from `cut...<head>` (`stage-records.ts#sealStage`), so it takes in the commits of the line the branch was moved onto. That is the defect of the walk of #48 that scope item 13 exists to stop. `daemon.ts#whyNoChain` (`daemon.ts:2249-2253`) and `chain-command.ts#baseHere` (`chain-command.ts:180-182`) both take the base from `baseOf`, so the daemon's chain behaves the same. `chain-command.ts:177` already takes a commit as itself and a branch through `sharedCommit` before round 1, so the two halves read a commit base differently.

The case group that pins the refusal, `chain-command.test.ts:164`, covers the refusal before round 1 alone, and no case covers a recorded base the branch left. This fix makes the record's sentence `BASE_RECORDED` reachable through the first check. The phase record `trail/phases/phase-2.md` states the old decision ("A recorded base's commit is the commit the base and the head last shared") and is history, so it stays. The documents already state the rule the fix builds, so neither edition changes.

```ts
// apps/desktop/src/daemon/chain.ts: the docstring's last sentence and the body of baseOf
 * stores. A base recorded as a branch's name is read from the commit it and
 * the head last shared, and a base recorded as a commit is that commit, so
 * `whyNoBase` refuses a branch that no longer holds it. It is a branch where
 * a base of that name stands (`worktrees.ts#baseRef`).
 */
export async function baseOf(worktree: string, head: string, recorded: string | null, stated: ChainBase): Promise<ChainBase> {
  const commit = recorded === null ? null : await commitNamed(worktree, recorded);
  if (recorded === null || commit === null) return stated;
  const branch = (await baseRef(worktree, recorded)) === null ? null : recorded;
  return { named: recorded, commit: branch === null ? commit : await sharedCommit(worktree, recorded, head), reads: recorded, branch: branch ?? stated.branch };
}
```

```ts
// apps/desktop/test/chain-command.test.ts, after the case at line 164; BASE_RECORDED imported from "../src/daemon/chain"
it("refuses a branch that left the commit round 1's record names as its base, with the record's sentence, and commits nothing", async () => {
  const on = commandOn(cleanups);
  git(on.repo, "checkout", "--quiet", "-b", "release", on.main);
  write(on.repo, "release.txt", "Release\n");
  const cut = commitAll(on.repo, "feat: release");
  git(on.repo, "checkout", "--quiet", BRANCH);
  git(on.repo, "rebase", "--quiet", "release");
  const env = { OWLERY_BASE: cut };
  await on.said(["start"], env);
  const first = await on.said(["owed"], env);
  expect(first.target).toBe(`${head(on.repo)} against ${cut}`);
  await on.said(["round", on.answer("round-1.md", clean(givenRound(read(first.prompt))))], env);
  // The branch, its records with it, moved onto a line that does not hold the recorded commit.
  git(on.repo, "checkout", "--quiet", "-b", "aside", on.main);
  write(on.repo, "aside.txt", "Aside\n");
  commitAll(on.repo, "feat: aside");
  git(on.repo, "checkout", "--quiet", BRANCH);
  git(on.repo, "rebase", "--quiet", "--onto", "aside", cut, BRANCH);
  const moved = head(on.repo);
  expect(await on.run(["owed"], env)).toEqual({ code: 1, out: "", err: `The branch no longer holds ${cut.slice(0, 7)}, the commit its chain reads it against, so a round has no base to read the branch against. ${BASE_RECORDED}\n` });
  expect(head(on.repo)).toBe(moved);
});
```

The fix pass judges whether the daemon's half also takes a case in `apps/desktop/test/chain.test.ts`, beside the one at line 1475. The two halves share `baseOf`, so the command's case reds the line both read.

### 2. The roadmap says the owl chain seals this repository's pull requests from release 0.0.3 on, and its own ground 4 and the tree say from #176 on

```seal
severity: should
location: `docs/roadmap.md:69`, `docs/roadmap.ko.md:69`
evidence: read `docs/roadmap.md:39`, `docs/roadmap.md:69`, `docs/roadmap.ko.md:39`, `docs/roadmap.ko.md:69`; executed `git ls-tree --name-only cd3b5a1 .github/workflows/`, which lists `check.yml` and `hygiene.yml` and no `owlery-seal.yml`
```

Why it matters: the bullet "Each milestone has to be in effect before the next one's work starts" now ends "the owl chain seals Owlery's own PRs from release 0.0.3 on", and cites ground 4. Ground 4 (`docs/roadmap.md:39`) says the owl chain seals this repository's pull requests "from the pull request of issue #176 on", and that the pull requests of release 0.0.3 before #176, #181 and #146 among them, carry the AgenticSeal plugin's seal. The tree agrees with ground 4. This repository's installed check is `hygiene.yml`, so by `frame/design.md` *Scope* item 1 no pane of it carries the owl chain until #146 lands. #182 and #183 merged into `release/v0.0.3` under the plugin's seal. The Korean edition's bullet says the same as the English one. Issue #146 and #176 are framed against these documents, and a reader of the bullet alone takes the wrong check for the release's first pull requests.

```markdown
<!-- docs/roadmap.md:69 -->
- **Each milestone has to be in effect before the next one's work starts.** The owner works in the build of milestone 1 while building milestone 2, and the owl chain seals Owlery's own PRs from the pull request of issue #176 on ([Why this order](#why-this-order), ground 4).

<!-- docs/roadmap.ko.md:69 -->
- **다음 마일스톤의 일을 시작하기 전에 앞 마일스톤이 실제로 쓰이고 있어야 합니다.** 저장소 소유자는 마일스톤 1의 빌드에서 일하면서 마일스톤 2를 만들고, 이슈 #176의 PR부터는 owl 체인이 Owlery 자신의 PR에 인장을 찍습니다([이 순서인 까닭](#이-순서인-까닭), 넷째 근거).
```

## Confirmations

What matched: the merge's resolution of `apps/desktop/src/daemon/daemon.ts` keeps all of #182's session-log watch. Executed: every non-blank line that `git diff c82c611 18f9158 -- apps/desktop/src/daemon/daemon.ts` adds stands in `daemon.ts` at `cd3b5a1`, and no line was missing. The work's own diff of `daemon.ts` (`18f9158..cd3b5a1`) removes no line that names the log, `followLog`, `endLog` or an interruption. Claimed in `trail/phases/merge-release.md`: the conflict was the imports alone, and the merge drops the import of `record-blocks.ts`. `daemon.ts:81-82` import `session-log.ts` and `stage-records.ts` side by side, and `THE_SESSION` and `isSessionId` are used in `stage-records.ts`, not in `daemon.ts` (read).

What matched: no code of the pane's launch writes under the person's Claude Code folder (read). `hooks.ts#writePaneSettings` writes into `dirname(settingsFile)`, which `main.ts` gives as the run folder's `claude-hooks.json`. `pane-chain.ts#writePaneChain` writes `pane-head.md` and `owl-chain` into the run folder. `chain-command.ts#stageFolder` writes under `chain/<work item>/` of `OWLERY_RUN_DIR`, or of the launcher's folder. `claude-plugins.ts#readPlugins` only reads the three settings files and `installed_plugins.json`, and `carriedIn` reads, never writes. The bundle and the head reach `claude` as `--plugin-dir` and `--append-system-prompt-file` (`hooks.ts#claudePaneCommand`). That `claude` itself leaves the files unchanged is phase 4's probe and phase 6's hand check, which this round did not repeat (no real `claude` started).

What matched: the hook lets every call through outside `Automation` `yes` (read `chain-command.ts:436-456` and `role-bundle/hooks/hooks.json`). The hook's command does nothing where `OWLERY_CHAIN` is empty. `ask` returns exit 0 outside a worktree, with no branch, with no directory or two, and where `routingAnswer(..., "Automation")` is anything but exactly `yes`, all before it reads its input. Under `yes`, an input that is not the event is exit 1, which refuses nothing, and a throw of a reader falls to `chainCommand`'s catch, which is exit 1 too. So every failure of `ask` fails open. A call passes under `yes` where any one question opens with `No default can be taken: ` and has a reason, as scope item 19 says ("one question of the call").

What matched: the chain command writes records through the same functions as the daemon's chain (read `stage-records.ts#recordRound`, `#recordFixPass`, `#gateOwed`, `#recordGate`, `#recordVerdict` against the removed bodies of `Daemon#runRound`, `#runFixPass`, `#runGate`, `#runSeal` in the diff). The checks before each write moved whole: the head that moved, the change outside the directory, the reader's refusals, the `fixed` commits held, the judge who is a builder. Two checks were added for both chains: a judge named `the session` is refused (`stage-records.ts:355`), and the base comes from `baseOf`. The daemon keeps the check on a missing version and the open findings left after a second pass, as `trail/phases/phase-2.md` says. The command's `fix-pass` passes `answer: ""`, so it records no question, and the session asks in the pane.

What matched: the window and the daemon ask and launch as *Scope* item 10 says (read `view.ts#asksChain`, `renderer.ts#beforePane`, `pane-chain.ts#carriedIn`). The window asks only for a Claude Code pane where `owl`, `plugin` and no answer hold. Under the answer `plugin`, and with no answer, the daemon launches with nothing of the bundle. With the plugin off it launches the owl chain whatever answer is kept.

What matched: `pr.md` quotes the frame word for word (read). Items 1, 2, 6, 10 and 19 stand at `frame/design.md:55`, `:56`, `:60`, `:64` and `:73`. The three items of *Out of scope* stand at `:79`, `:81` and `:83`. The quote of `gaps.md` opens its seventh row of *Not verified*, `gaps.md:13`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

What matched, the two rows of `gaps.md` *Not verified* that name the proofer. Ten screenshots not opened (`gaps.md:25`): this round opened all twelve under `screenshots/` (read). Each foot holds no button. The parked view lists the broad gate under "Ask" with the finished mark. The finished view shows pull request #12 with its checks under the seal's place. The broken view's back holds the sentence of *Scope* item 14. The chain dialog shows its heading, its two round marks with the chosen one in the strong ink, its words and its buttons at its right foot with "Open the pane" last. The settings dialog shows the field "Claude Code panes run". Each matches `docs/design.md` *Components and their states*, the rows "A dialog" and "The seal's place". Register and Desk (`gaps.md:21`): `themes.css` holds one block of tokens for each theme and appearance and no selector of its own (`themes.css:20`, `:268`, `:498` and the light blocks). The dialog's round mark and the settings field are drawn by the rules of `index.html:527-531` for every theme, with `--ink-strong` and `--icon`. So neither theme draws either part differently from Night watch in form, and *A pull request that changes the window carries its screenshots* asks no shot of them.

What matched: scenario 9's search. `trail/phases/merge-release.md` claims it prints the two rows of milestone 2. The document lines it would print are `docs/roadmap.md:22` and `docs/roadmap.ko.md:22` (read). This round did not run the search again.

A sample of the new cases was read against its group: `hooks.test.ts`'s three new cases of `claudePaneCommand` and `paneCommands`, and `chain-command.test.ts`'s base cases at lines 164 and 201. Each holds a fact its neighbours do not. The rest of the new and changed cases were not read against their groups, and `## Not judged` names them.

New failure paths this change adds: `paneCommands` can now throw from `writePaneSettings`, inside `Daemon#startSession`, which the `start` case (`daemon.ts:769`) does not catch. The same uncaught path stood before for `TerminalSession.spawn`. `## Not judged` names it for a person to classify.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the repository-wide typecheck and the document counts of the `Broad gate` command, at `cd3b5a1`. The crafter and the merge pass handed it over `unverified` (`gaps.md:7`, `gaps.md:24`), and that label is honest: the phases ran narrow files, and the merge pass ran five files and the screenshot run | the whole tree | the orchestrator, at the broad gate |
| Whether a throw of `writePaneSettings` while a pane starts should be caught and answered to the client as an error. The `start` case does not catch it, and the daemon holds no handler of an uncaught exception, so a failed write of the run folder would end the daemon. The same path stood before for `TerminalSession.spawn` | `apps/desktop/src/daemon/hooks.ts:79-84`, `apps/desktop/src/daemon/daemon.ts:769` | the orchestrator, which classifies it as a fix or as a defect that stood before |
| Whether the chain command's commits and the daemon's commit of a person's word can meet in one worktree. The command takes no turn of the daemon's queue (`chain-command.ts` passes no `InTurn`), so git's lock would refuse one of the two. This round did not read what the daemon does when its commit is refused | `apps/desktop/src/daemon/chain-command.ts`, `apps/desktop/src/daemon/daemon.ts` (`inWorktree`) | the orchestrator |
| The new and changed cases this round did not read against their groups: those of `chain.test.ts`, `daemon.test.ts`, `pane-chain.test.ts`, `claude-plugins.test.ts`, `chain-choice.test.ts`, `view.test.ts`, `role-bundle.test.ts`, `screenshots.test.ts`, `approval-line.test.ts` and `pane-session.test.ts` | `apps/desktop/test/` | the next round, or the orchestrator where it judges that none is owed |
| What only a real `claude` shows, which `gaps.md` already names: a whole chain from `owed` to `sealed` in a real pane (`gaps.md:13`), a plugin hook that prints nothing (`gaps.md:18`), and a settings file whose `enabledPlugins` merges project and local keys (`gaps.md:19`). This round started no real `claude` | `gaps.md` | the owner at the walk of #184, as `gaps.md` names |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_recorded_base.test.ts`, in `apps/desktop` of the round's clone at `cd3b5a1`, first form | Exit 0. The case passed and printed nothing, because the runner shows no output of a case that passes. The probe was rewritten to write what it saw to a file of the round's scratch directory, and run once more |
| The same command, second form | Exit 0. Round 1's target was `<head> against <cut>`. After the branch was rebased onto a line without `cut`, the head did not hold `cut`. `owed` exited 0 and owed round 2. `gate` was refused only because the records owed round 2. Finding 1 |
| `git diff c82c611 18f9158 -- apps/desktop/src/daemon/daemon.ts`, each added line searched for in `daemon.ts` at `cd3b5a1` | No line missing |
