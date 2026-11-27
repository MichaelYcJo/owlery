# Review round 2: 1795701355-127-role-sessions-run-in-a-sandbox

```seal
target: 0ece8d98, fixes 61d7eb24..20af7ebd
```

This is a verifying round. It reviewed the fix pass of round 1, `61d7eb24` to `20af7ebd`, with its close blocks at `a99f40dc`. It also read the record commits that followed: the framer's fold `01cf053f`, the orchestrator's judgments `d607d4a4`, phase 5 `10a3b18a` and the orchestrator's fold of Q7 `0ece8d98`. Those four change records alone, and phase 5 changes one comment of `daemon.ts`. The code under review is the fix diff `49b5f65f..20af7ebd`. The round read `routing.md`, the three frame files, `gaps.md`, `changelog.md` and every phase record whole at `0ece8d98`, and read the diff of each against `49b5f65f`. No `pr.md` stands. The round ran its probes and narrow cases in its own `git clone --no-local` of the branch at `0ece8d98`, under the round's scratch directory, with the worktree's installed dependencies linked in and nothing installed. Every run used the installed Claude Code 2.1.332 and the stand-in model.

Carried from round 1, not established again: where the launch, the grants and the daemon's rule stand (`claude.ts#claudeArgs`, `role-grants.ts#verdictOn`, `daemon.ts#commandsOf`). Also carried: that the base's one commit after `7c6cba4a` changes no file this branch changes. A `git fetch` of `origin/release/v0.1.0` in the worktree showed the base still at `450c6e09`. Round 1's check that each `from:` of `## Rule changes` stands in its file is carried too, since the range changes no `from:`, `file:` or `section:` line and no file under `docs/`. Every verdict below was reached at this target.

The caller asked, above all, whether round 1's finding 1 is closed for every role by every route a command or a tool has to `daemon.json`. It is closed for the versions run. A command's read is refused by the sandbox on every route this round tried, and the committed case pins it. A file tool's read is asked of the daemon and refused, but by Claude Code's own behaviour, which no committed case pins. That is finding 1 below. The frame's sentences match what was run, as *Confirmations* states.

## Findings

### 1. The bound that keeps the daemon's token from a role session's file tools rests on Claude Code asking the daemon before each read, and no committed case tries one, so a Claude Code release that stops asking reopens round 1's finding 1 while every `role:refusal` script stays green

```seal
severity: should
location: `apps/desktop/test/role-session.test.ts:102-107`, `apps/desktop/test/model-stand-in.ts:83`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/gaps.md:29`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/plan.md:18`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:72-76`
evidence: executed `test/test_tmp_symlink_read.test.ts` once as a proofer and once as a crafter, and `test/test_tmp_link_cat.test.ts` once as a proofer, in the clone through the lock (*Probes*); executed `git grep -n -F -e "file tool" 0ece8d98 -- seal/threads/1795701355-127-role-sessions-run-in-a-sandbox apps/desktop/test/role-session.test.ts apps/desktop/test/model-stand-in.ts`; read `apps/desktop/src/daemon/role-grants.ts:154`, `apps/desktop/src/daemon/adapters/claude-roles.ts:44-46`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/questions.md:30`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/trail/phases/phase-5.md:7-17`
```

Why it matters: this work lifts the daemon's refusal of a proofer's and a sealer's commands. A session of either role that is told the daemon's port and token can therefore have a command connect on the loopback and have the daemon act as a window does, outside the sandbox. That is round 1's finding 1. The token stands on disk in `daemon.json` of the run folder alone (`main.ts:45`, `main.ts:115`; the app hands it to the window in memory, `src/main/main.ts:207`). Two routes lead to that file. A command reads it through the sandbox, and a file tool, `Read`, `Grep` or `Glob`, reads it through Claude Code's own process, which no sandbox holds. Every role holds all three file tools (`claude-roles.ts:44-46`).

The command's route is closed by the launch's own `denyRead`, and the committed stand-in case pins it. This round ran it again for each pair at the target. The probes of this round found every other route a command has closed by the sandbox too: a read through a symbolic link the command made in its own place, a `cp` of that link, a hard link, and a listing of the run folder (*Probes*).

The file tool's route is closed only because Claude Code sends the read to the daemon as a request, and `verdictOn` refuses it with the rule `other` (`role-grants.ts:154`). Phase 5 measured that for a read by the file's own path, on 2.1.332 and 2.1.329. This round measured a read through a link that a command made in the role's own place: in a proofer's scratch folder and in a crafter's worktree. Claude Code resolved each link first ("… resolves through a symlink to …/run/daemon.json, which is outside the allowed working directories"), asked, and the daemon refused. Had it not resolved the link, the read would have been inside a folder after `--add-dir`, and Claude Code reads such a path unasked: the probe's `Read` of a missing file in the scratch folder was answered by the tool with no request.

Both behaviours are Claude Code's and no part of the launch. `frame/plan.md:18` names the three `role:refusal` scripts as what catches a Claude Code release that changes its behaviour. Those scripts try a command's `cat` alone, so a release that stops asking, or that stops resolving a link before it decides, reopens finding 1 for the proofer and the sealer, and every script still passes. Contract rule 13 holds such a defence unverified until a run can tell it from the platform. The stand-in case is where this work already shows Claude Code's sandbox doing what the launch relies on.

`gaps.md:29` states the gap and grounds the choice to commit no case on "The spawn of this work asked for a committed case only where a version read the file without asking". That is the spawn prompt, an account and no ratified document. Q7's row (`frame/questions.md:30`) says the bound holds as built and says nothing about whether a case pins it. So the choice is a question this round answers by this finding, not a pass.

The search printed `gaps.md:29` and the statements of Q7 in `frame/design.md:53`, `:54`, `:67` and `:146`, `frame/plan.md:49`, `frame/questions.md:30`, `gaps.md:17`, `phase-5.md:7` and `:15`, and round 1's close block. The rows at `frame/design.md:53-54` are dated to `a99f40dc` and state that commit. `frame/plan.md:18` holds the scripts' claim in other words, which the search does not find. The search is a sample of spellings.

```ts
// model-stand-in.ts: after its first call, the stand-in makes each call `after` gives, one a turn, taken when that turn's request arrives.
export interface StandInCall {
  name: string;
  input: Record<string, unknown>;
}
type Block = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "text"; text: string };

export async function startModelStandIn(command: () => string, after: () => readonly StandInCall[] = () => []): Promise<{ url: string; received: Received[]; close: () => Promise<void> }> {
  // ... unchanged up to the block:
        const results = toolResults(body).length;
        const later = after()[results - 1];
        const block: Block = !tools.includes("Bash")
          ? { type: "text", text: STAND_IN_TEXT }
          : results === 0
            ? { type: "tool_use", id: "toolu_stand_in_1", name: "Bash", input: { command: command(), description: "The stand-in model's one call" } }
            : later === undefined
              ? { type: "text", text: STAND_IN_TEXT }
              : { type: "tool_use", id: `toolu_stand_in_${String(results + 1)}`, name: later.name, input: later.input };

// role-session.test.ts: the place a role's command writes, and the link to `daemon.json` it makes there after its `cat`.
const placeOf = (pair: RoleStage, worktree: string, kept: string): string => (pair.role === "crafter" ? worktree : (readFileSync(join(kept, "args"), "utf8").trimEnd().split("\n").at(-1) ?? ""));
const linkIn = (place: string): string => join(place, "daemon-link");
// standInCommand: every role's command ends, after `${discovery}`, with
//   `; ln -s '${join(runFolderIn(kept), "daemon.json")}' '${linkIn(placeOf(pair, worktree, kept))}'`

// The case: the stand-in's two calls after the command, a `Read` of the file by its path and one through the link.
const model = await startModelStandIn(
  () => { command = places === undefined ? "exit 1" : standInCommand(pair, places.worktree, places.kept); return command; },
  () => (places === undefined ? [] : [
    { name: "Read", input: { file_path: join(runFolderIn(places.kept), "daemon.json") } },
    { name: "Read", input: { file_path: linkIn(placeOf(pair, places.worktree, places.kept)) } },
  ]),
);
// After the existing assertion that no tool result holds the token: Claude Code asked the daemon for both reads, and the daemon refused both by the role's rule.
const reads = requests.filter((request) => request.subtype === "can_use_tool" && request.tool_name === "Read").map((request) => (request.input as { file_path?: string } | undefined)?.file_path);
expect(reads).toEqual([join(runFolderIn(kept), "daemon.json"), linkIn(placeOf(pair, worktree, kept))]);
expect(told.filter(({ isError, content }) => isError === true && content.startsWith(`Owlery's rule for the ${pair.role} does not allow this call.`))).toHaveLength(2);
```

The snippet assumes the case's paths hold no single quote, as the case's own comment states. The fix pass owes these statements too:

- the file's head (`role-session.test.ts:19-42`) and the doc of `standInCommand` (`:85-101`), which describe the stand-in's one call;
- the module comment and the doc of `startModelStandIn` (`model-stand-in.ts:1-11`, `:54-61`), which say the stand-in makes one call;
- the `gaps.md:29` paragraph, which the case replaces;
- `frame/plan.md:18`, where the scripts then also try a file tool's read by the file's path and through a link;
- `frame/design.md` *Scope* item 9 (`:72-76`) and *User scenarios* rows 9 to 11 (`:105-107`), for the framer to fold.

The new assertions are shown red before they are planted: with the `Read` calls left out of `after`, the `reads` line fails.

## Confirmations

```seal
confirms: round-1#1
```
What holds: every role's commands are refused each read in the run folder, and a proofer's and a sealer's are given back their scratch folder. `daemon.ts:2469-2483` gives every grant `unread`, the run folder's real path. `claude.ts:524` passes it as `denyRead`, with `allowRead` the scratch folder. `claude.ts:142` writes both into the settings. `daemon.test.ts:6039-6042` pins `unread` for all four grants, the orchestrator's among them, which has no stand-in script. Executed at the target: `role:refusal`, `role:refusal:sealer` and `role:refusal:crafter` each read 1 passed and 1 skipped, and no output held the token. Read: the orchestrator's 2.1.329 outputs in the session's scratchpad, written after `20af7ebd`, each read 1 passed and 1 skipped with `daemon.json: Operation not permitted`, and the proofer's and the sealer's clone was made. The probes of this round found the sandbox refusing a command's read through a symbolic link in the scratch folder, a `cp` of it, a hard link, and a listing of the run folder. A run folder whose path holds a space, as the app's `Application Support` folder does (`src/main/main.ts:44`), was refused the read in the same way, while the scratch folder inside it was written and read back. A command's connection to a Unix socket a listener held in the run folder reached no listener. The file tools' route holds on the versions run, by Claude Code's own asking, and finding 1 of this round is what that leaves unpinned.

```seal
confirms: round-1#2
```
What holds: `proofer.md:190-194` reads the paste-ready text, so a claim the proofer settles by reading is a finding again. `role-bundle.test.ts:323` pins it. Read, and executed in the narrow run below.

```seal
confirms: round-1#3
```
What holds: `sealer.md:114-117` splits the item in two. "Change the tree so that a claim holds, by a command or by an edit of code or a record" has one reading: the tree is the worktree, and a command of the sealer's that writes its scratch folder changes no tree. The fix pass's wording differs from the paste-ready text, and its answer says why; this round agrees that the paste-ready "Make a claim hold by running a command" kept the second reading. `role-bundle.test.ts:329-330` pins both items. Read, and executed in the narrow run below.

```seal
confirms: round-1#4
```
What holds: the two cases are gone. "gives a role launch the role's tools as one value…" (`claude-adapter.test.ts:56`) pins the whole argument list with one `--settings` value, `denyRead` and `allowRead` now among it. "bounds each role's commands to the places it was given…" (`:882`) pins every pair's `sandbox` block whole, with the folders after `--add-dir`. Read, and executed in the narrow run below.

```seal
confirms: round-1#5
```
What holds: the crafter's stand-in command (`role-session.test.ts:104`) writes the worktree's `.git` file and `commondir`, each whatever the step before did. The case asserts both refusals and that git still names the repository's folder (`:305-308`). Executed at the target: `role:refusal:crafter` read 1 passed, its result naming both refusals. The guard is Claude Code's own, and `gaps.md` *Not done* says so.

What matched: the frame's sentences against what was run. *Scope* item 4 says a file tool's read outside the session's folders is asked of the daemon and refused with the rule `other` on 2.1.329 and 2.1.332. Phase 5's record states that run, and this round's probes found the same through a link on 2.1.332. *Scope* item 9 spells each pair's command as `role-session.test.ts:102-107` builds it. The third cells of the two `add` rows on *Role sessions run detached from the user's environment* state the branch's refusal and the read's refusal on 2.1.332 and 2.1.329. The orchestrator's 2.1.329 outputs, read above, hold both. They were made after the git branch step entered the case, so round 1's *Not judged* row on which commit phase 3's 2.1.329 runs used no longer bears on the cell. *Data & interfaces*, `adapter.ts:68-77` and `changelog.md:9` say what `daemon.ts#commandsOf` and `claude.ts#launchOf` do.

What matched: the fold's *Out* rows have their issues. #313 and #314 are open under the titles of the rows on a config file git reads and on what the daemon runs from the worktree. #285 carries a comment that names the services on the loopback, as the row on what a command reads says (executed, `gh issue view`). `changelog.md:6` and `daemon.ts:2455` no longer say that no hook is planted (executed, `git grep -n -F -e "no hook" -e "hook that would run outside"`).

What matched: `gaps.md`'s diff over the range takes no row out. The row on whether a model follows the head is reworded in place, and the rows on 2.1.329 and on Q7 are added as `closed` with their grounds. The suite stays labelled unverified in the rows that name the orchestrator's broad gate, and that label is honest: no phase or fix pass claims the suite.

The fix diff adds no test case. It extends the stand-in case and the cases of `claude-adapter.test.ts`, `daemon.test.ts`, `fake-adapter.test.ts` and `role-bundle.test.ts` that build `commands` or `sandbox` by hand, and each was read against its group. One branch of the fix diff has no case: a daemon without a run folder gives `unread` empty (`daemon.ts:2471`). The daemon's start always gives a run folder (`main.ts:28-32`), so the release ships nothing on that branch.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a role session of an added account loses its shell setup. Claude Code 2.1.332 starts each `Bash` command with `source <snapshot> 2>/dev/null \|\| true`, the snapshot standing under the session's config folder in `shell-snapshots/` (read, `strings` of the installed binary). An added account's config folder stands in the run folder, which the launch now refuses a command to read. So that source fails silently, and such a session's commands run without the person's aliases, functions and shell options, while a System default session's commands keep them. The stand-in case puts its config folder in the run folder and runs only commands of `/usr/bin`, so it cannot show the difference. No run of this round compared the two | `apps/desktop/src/daemon/daemon.ts:2471`, `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/frame/design.md:52` | the orchestrator, with the framer where a remedy is wanted |
| Whether a role session's file tools still read a file that exists in the scratch folder and the worktree under `denyRead` (`gaps.md:17`). This round's probes went part of the way: a `Grep` of the scratch folder and of the worktree ran with no request, and a `Read` of a missing file in the scratch folder was answered by the tool with no request. A `Read` of a file that exists there was not tried | `seal/threads/1795701355-127-role-sessions-run-in-a-sandbox/gaps.md:17` | the orchestrator, as that row says |
| This round's probes on Claude Code 2.1.329. The caller allowed the installed version alone | *Probes* | the orchestrator, where finding 1's case is planted and run on 2.1.329 |
| Whether a model follows the head's sentence on its commands and the scratch paragraph, carried from round 1 | `apps/desktop/src/daemon/adapters/claude-roles.ts:101`, `apps/desktop/src/daemon/daemon.ts#withScratch` | the orchestrator, at the first daemon-launched round on a real model |
| The suite, the lint and the typecheck at this target, which contract rule 2 gives to the broad gate | the branch at `0ece8d98` | the orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `OWLERY_ROLE_REFUSAL=1 node scripts/test-in-electron.mjs test/test_tmp_symlink_read.test.ts`, in the clone, through the lock: a copy of phase 5's probe, a proofer at a round. The stand-in's calls were one `Bash` command, then a `Read` of `<scratch>/s`, a `Read` of `<scratch>/r/daemon.json`, a `Grep` for `token` in `<scratch>` and a `Read` of `<scratch>/h`. The command made `s`, a link to `<run>/daemon.json`, `r`, a link to `<run>`, and `h`, a hard link, then ran `nc -U` to a Unix socket of the run folder | 1 passed. `ln -s` made both links and the hard link was refused (`ln: <run>/daemon.json: Operation not permitted`). Both `Read` calls reached the daemon as requests with the reason "… resolves through a symlink to <run>/daemon.json, which is outside the allowed working directories", and the daemon refused each with the sentence of the rule `other`. The `Grep` printed "No matches found" and the `Read` of `h` "File does not exist", neither with a request. No tool result held the token, and the session finished |
| The same file with `OWLERY_ROLE_REFUSAL=crafter`, a crafter at a fix pass, with the links made in the worktree | The same result: both `Read` calls asked and refused, the hard link refused, no token, and the session finished |
| The same file with the case's own folder renamed to hold a space (`test/test_tmp_space_path.test.ts`), a proofer, its command also running `cat <run>/daemon.json` and writing and reading back a file of the scratch folder | `cat: <run>/daemon.json: Operation not permitted`, and the file of the scratch folder was written and read back. No token reached a tool result |
| `OWLERY_ROLE_REFUSAL=1 node scripts/test-in-electron.mjs test/test_tmp_link_cat.test.ts`, a proofer, its command running `cat` of `<scratch>/s` and of `<scratch>/r/daemon.json`, `cp` of `<scratch>/s`, `ls -la <run>`, and `nc -U` to a socket a listener of the case held in the run folder | Each `cat`, the `cp` and the `ls` were refused with `Operation not permitted`. The listener was bound and took no connection, and `nc` exited 1 |
| `OWLERY_ROLE_REFUSAL=1`, then `sealer`, then `crafter`, of `node scripts/test-in-electron.mjs test/role-session.test.ts`, in the clone, through the lock | Each read 1 passed and 1 skipped on 2.1.332, and no output held the token |
| `node scripts/test-in-electron.mjs test/claude-adapter.test.ts test/fake-adapter.test.ts test/role-bundle.test.ts`, then `node scripts/test-in-electron.mjs test/daemon.test.ts -t "#127\|starts no role"`, in the clone, through the lock | The first read 3 files and 151 cases passed, and the second 7 passed with 433 skipped by the filter. Each exited 0. Nothing else of the suite was run |

Each probe file ran once. The folders the four probe runs kept under the system's temporary folder were removed by their paths. The three folders the narrow `role:refusal` runs kept stand there, as the case keeps them by design. The folders `owlery-role-run-*` from earlier sessions also stand there; this round did not make them and left them.
