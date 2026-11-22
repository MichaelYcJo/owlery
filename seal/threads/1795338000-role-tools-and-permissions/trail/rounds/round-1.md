# Review round 1: 1795338000-role-tools-and-permissions

```seal
target: 5d6745d against origin/release/v0.0.2
```

This round reads phases 1 and 2 as they stand at `5d6745d`. Phase 3 (the window) waits for #119, and a later round reads it. No earlier round exists, so no fact is carried from one. The records read whole at the target are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. `changelog.md` and `pr.md` are not written yet, and the caller said `pr.md` comes with phase 3. The round ran in a clone at the target, under the round's scratch directory.

## Findings

### 1. The daemon allows a crafter's write that leaves the worktree through a link after a `..`, through a link outside that points in, or through `~`

```seal
severity: must
location: `apps/desktop/src/daemon/role-grants.ts:51-90`, `apps/desktop/test/daemon.test.ts:3694`, `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:89`
evidence: executed `node --experimental-strip-types --no-warnings test_tmp_paths.mts` in the clone's `apps/desktop` (see `## Probes`); read `apps/desktop/src/daemon/role-grants.ts:51-90` and, in the 2.1.330 executable under `/Users/x/.local/share/claude/versions/`, the path function that throws `Path must be a string, received`
```

Why it matters: *Scope* item 9 says "A path that leaves through `..` or through a link is outside". The rule added to `docs/architecture.md` *Agent adapters* says the daemon "refuses its writes anywhere else, the role bundle's folder among them". The probe called `verdictOn` as a crafter on a scratch worktree that holds `link`, a link to a folder outside it. It got three allowances for writes that do not land inside the worktree:

- `missing/../link/f.txt` -> `allow`. `realLocation` (`role-grants.ts:51-71`) walks up until it reaches a part that exists, here the worktree, and joins the rest, `missing/../link/f.txt`, as text. `join` settles the `..` there, so the result is `<worktree>/link/f.txt`, and nothing follows `link` again. A CLI that settles `..` by the text writes through `link` to the folder outside. A CLI that does not settle it first, and makes the missing folder, also writes through `link`. The control `link/f.txt` is refused, so the defect is the `..` in the part that is not there.
- `<elsewhere>/L/../c.txt`, where `L` is a link outside the worktree to `<worktree>/a/b` -> `allow`. The rule follows `L` before the `..` and reads `<worktree>/a/c.txt`. Settled by the text first, the path is `<elsewhere>/c.txt`, outside.
- `~/probe-never-written.txt` -> `allow`. The rule reads it as relative, `<worktree>/~/probe-never-written.txt`. The 2.1.330 executable's path function reads `~` and `~/` as the home folder (`if(r==="~")return pn(u());if(r.startsWith("~/"))return pn(A(u(),r.slice(2)))`), and then resolves the rest against a base, which settles `..` by the text. `claudeEnv` passes `HOME` to the session (`apps/desktop/src/daemon/adapters/claude.ts:100-108`).

Claimed: `trail/phases/phase-2.md` *Decisions made while building* says `realpathSync` "settles each `..` before it follows a link, so `link/../b.txt` ... read as a path inside it while a write there lands outside". Found: the CLI's own path function settles `..` by the text before the system follows a link, so a write of `link/../b.txt` lands at `<worktree>/b.txt`. The rule's refusal of that path fails closed and does no harm. But the rule models only the system's reading, and the two readings disagree in both directions. The fix below takes a path as inside only where both readings are inside.

This round did not establish whether 2.1.330 passes `input.file_path` in a `can_use_tool` request as the model wrote it or already expanded. Seeing that takes a model's turn (`## Not judged`). The finding holds either way. `verdictOn` is the neutral rule every adapter's requests go through (`docs/architecture.md` *Rules that keep it portable*), and the fake adapter hands it raw paths. A defence that holds only because one CLI rewrites its input first is not verified (contract rule 13). A crafter's commands can already write outside the worktree (*Scope* item 20). The first case needs no command: a link that the person's repository commits is enough.

```ts
// apps/desktop/src/daemon/role-grants.ts. `resolve` joins the import from "node:path".
// Precondition: the worktree's folder exists. A path's links are read when the request arrives, and a change to them
// before the write is not seen (the same holds today).

// In realLocation, in place of `return join(realpathSync.native(existing), ...rest);`:
      const real = realpathSync.native(existing);
      // A `..` in the part that is not there yet climbs back to where no link was followed, so the place is not known.
      return rest.includes("..") ? null : join(real, ...rest);

/**
 * Whether a path is inside the worktree, by where both really are. A
 * relative path is read from the worktree. The path is read twice, and it
 * is inside only where both readings are. The first reads it as the system
 * does, so a `..` after a link is taken from where the link points. The
 * second settles each `..` in the text first, as a CLI that resolves the
 * path before writing does. A path that opens with `~` names the home
 * folder to such a CLI, and is outside.
 */
function insideWorktree(path: string, worktree: string): boolean {
  if (path === "~" || path.startsWith("~/")) return false;
  let root: string;
  try {
    root = realpathSync.native(worktree);
  } catch {
    return false;
  }
  const readings = [isAbsolute(path) ? path : `${worktree}${sep}${path}`, resolve(worktree, path)];
  return readings.every((reading) => {
    const real = realLocation(reading);
    if (real === null) return false;
    const from = relative(root, real);
    return from !== ".." && !from.startsWith(`..${sep}`) && !isAbsolute(from);
  });
}
```

```ts
// apps/desktop/test/daemon.test.ts, the case at line 3694. Beside the links it makes:
      symlinkSync(join(worktree, "src"), join(outside, "in"));
// Among the requests that are outside, each path written as text, because `join` would settle its `..`:
        write("missing/../link/a.txt"),
        write(`${outside}/in/../c.txt`),
        write("~/a.txt"),
// with their answers, in the same places:
        `refused: Write: ${OUTSIDE("crafter", "missing/../link/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", `${outside}/in/../c.txt`)}`,
        `refused: Write: ${OUTSIDE("crafter", "~/a.txt")}`,
```

This snippet does not cover every statement of the fact, and the fix pass owes the rest. *Scope* item 9 (`frame/design.md:89`) says the daemon "follows symbolic links on the part of the path that exists". It should say what the code then does: it reads the path both ways, it takes a `..` in the part that is not there as outside, and it takes a path that opens with `~` as outside. The fold at `frame/design.md:271` should say the same, and the comment of the case's outside group should name the three new paths. Each new row is seen red against `5d6745d` first.

### 2. A crafter's request for a tool its launch did not give it is allowed where the tool writes inside the worktree

```seal
severity: should
location: `apps/desktop/src/daemon/adapters/claude.ts:196-213`, `apps/desktop/src/daemon/role-grants.ts:101-111`, `apps/desktop/test/claude-adapter.test.ts`
evidence: read `apps/desktop/src/daemon/adapters/claude.ts:196-213`, `apps/desktop/src/daemon/role-grants.ts:101-111`, `apps/desktop/src/daemon/adapters/claude-roles.ts` `toolsOf`
```

Why it matters: the caller asked whether a role session can reach a tool name its grant does not list. The adapter maps a request to an action by the tool's name alone (`CALLS`, `claude.ts:196-202`). `NotebookEdit` is `write` there. `verdictOn` answers by the action and the path, and takes no tool (`role-grants.ts:101-111`). So a crafter's `NotebookEdit` of a notebook inside the worktree is allowed, though `toolsOf` gives a crafter `Read`, `Glob`, `Grep`, `Bash`, `Edit` and `Write` alone and *Scope* item 2 says "No other built-in tool reaches a role session: no `Task`, no `NotebookEdit`". Today only `--tools` keeps the request from arriving, and the real proofer session showed that the CLI keeps to it (`trail/phases/phase-2.md`, the `init` line). That is a platform guarantee. With it removed, by a version that adds a tool to a role or by an adapter that passes one through, the daemon allows the call (contract rule 13). The same holds for any tool a later version maps to `write` or `run`. The neutral rule cannot know the vendor's tool names, but the adapter holds the launch's list.

```ts
// apps/desktop/src/daemon/adapters/claude.ts
/**
 * The neutral event of a request to use a tool: what the call does, the file it names, and what a person reads of it,
 * which is the path, the command, or the input as JSON. A role session's request for a tool its launch did not give it
 * is a call of another kind, whatever the tool does, so no role's rule allows it.
 */
function permissionEvent(id: string, request: Record<string, unknown>, held: readonly string[] | undefined): RoleEvent {
  const tool = typeof request.tool_name === "string" ? request.tool_name : "";
  const input = typeof request.input === "object" && request.input !== null ? (request.input as Record<string, unknown>) : {};
  const granted = held === undefined || held.includes(tool);
  const call = granted && Object.hasOwn(CALLS, tool) ? CALLS[tool]! : { action: "other" as const };
  // ... the rest as it stands
}

// eventsForLine gains the launch's tools, and passes them on:
export function eventsForLine(line: string, held?: readonly string[]): RoleEvent[] {
  // ...
    return control?.subtype === "can_use_tool" ? [permissionEvent(control.id, control.request, held)] : [];
  // ...
}

// In start's line handler:
        for (const event of eventsForLine(line, launch?.tools)) {
```

The fix pass also owes a case in `apps/desktop/test/claude-adapter.test.ts`: a crafter's launch whose script prints a `can_use_tool` line for `NotebookEdit` with a `notebook_path` inside the folder is reported with the action `other` and no path. It also owes a sentence in *Scope* item 5 (`frame/design.md:85`) saying so. The docstring of `eventsForLine` says what its second argument does.

### 3. A person reads at most 2,000 characters of a command, with no mark that the rest was cut

```seal
severity: should
location: `apps/desktop/src/daemon/adapters/claude.ts:46-53`, `apps/desktop/src/daemon/adapters/adapter.ts:18`, `apps/desktop/src/shared/protocol.ts:188`, `apps/desktop/test/claude-adapter.test.ts:778`, `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:132`
evidence: read `apps/desktop/src/daemon/adapters/claude.ts:46-53`, `apps/desktop/src/daemon/adapters/claude.ts:205-213`, `apps/desktop/src/shared/protocol.ts:182-192`
```

Why it matters: a request of a session with no role waits for the person, and the person allows or refuses it from `PermissionAsk.text`. For `Bash` that text is the command, cut by `firstOf` at `PERMISSION_TEXT_CHARS` with nothing to say it was cut (`claude.ts:46-53`). `PermissionAsk` carries no other field that would tell (`protocol.ts:182-192`). A command whose first 2,000 characters are harmless and whose tail is not reads as whole, and an allowance runs the whole command: the adapter answers with the request's own input (`claude.ts:381`). A heredoc or a long script passes 2,000 characters easily. The window of phase 3 cannot add the mark, because a text of exactly 2,000 characters may be whole. *Data & interfaces* says "2,000 characters at most", and the fix keeps that bound.

```ts
// apps/desktop/src/daemon/adapters/claude.ts
/** What a cut text ends with, so a person knows the call holds more than they read. */
export const PERMISSION_CUT_MARK = " [cut: the call holds more than is shown]";

/**
 * The text a person reads of a call, `PERMISSION_TEXT_CHARS` characters at most: the whole text where it fits, and
 * otherwise its first characters followed by `PERMISSION_CUT_MARK`, less a half of a character the cut would leave.
 */
function firstOf(text: string): string {
  if (text.length <= PERMISSION_TEXT_CHARS) return text;
  let head = text.slice(0, PERMISSION_TEXT_CHARS - PERMISSION_CUT_MARK.length);
  const last = head.charCodeAt(head.length - 1);
  // A character outside the basic plane is two of a string's, and the first of the two alone is no character.
  if (last >= 0xd800 && last <= 0xdbff) head = head.slice(0, -1);
  return head + PERMISSION_CUT_MARK;
}
```

The new text is a change a person reads, so the same commit pins it (contract rule 14). The case at `claude-adapter.test.ts:778` reads the mark at the end of a cut text, and no mark on a text of exactly `PERMISSION_TEXT_CHARS` characters. The comments at `adapter.ts:18` and `protocol.ts:188`, *Data & interfaces* at `frame/design.md:198` and `:247`, and scenario 5 at `frame/design.md:132` each gain "and a cut text ends with a mark that says so".

### 4. The frame says no probe on this machine can answer Q5, but the machine holds 2.1.326 to 2.1.329 and the frame's own probe needs no login

```seal
severity: should
location: `seal/threads/1795338000-role-tools-and-permissions/frame/questions.md:22`, `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:69`, `seal/threads/1795338000-role-tools-and-permissions/gaps.md:12`
evidence: executed `ls -laT /Users/x/.local/share/claude/versions/`; read `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:43-58`
```

Why it matters: Q5 says "the owner's machine holds 2.1.330 alone, so no probe here can run on them". The versions folder holds 2.1.319, 2.1.322, 2.1.325, 2.1.326, 2.1.327, 2.1.328, 2.1.329 and 2.1.330. The four that Q5 asks about are dated 17 to 20 November 2026, before the frame of 22 November. `frame/design.md:69` lists Q5 among "Three behaviours no probe of this frame could show, because each needs a model's turn on the owner's login". But the probes at `frame/design.md:43-58` read `--tools` and the `initialize` answer of `--permission-prompt-tool stdio` with `HOME` set to an empty folder, no login and `total_cost_usd` 0. The same probe answers Q5's question on each of the four versions without spending the owner's usage. `gaps.md:12` leaves the measurement to "whoever meets one", which names nobody. `MIN_CLAUDE_VERSION` stays 2.1.326, so a version that reads neither option launches a role session that holds every tool or waits at its first request, and no step measures that. This round did not run the probe, because the caller said to start no real `claude`.

```text
frame/questions.md, row Q5, the question cell:
Do Claude Code 2.1.326 to 2.1.329 read `--permission-prompt-tool stdio` and `--tools` as 2.1.330 does? `MIN_CLAUDE_VERSION` is 2.1.326. The owner's machine holds 2.1.326 to 2.1.329 beside 2.1.330, and the probe of `frame/design.md` *Grounding* runs with no login, so it can run on each of them at no cost
The "who can answer" cell:
a measurement: that probe, run on 2.1.326, 2.1.327, 2.1.328 and 2.1.329, by the orchestrator before the seal

frame/design.md:69:
Two behaviours no probe of this frame could show, because each needs a model's turn on the owner's login. Each is a row of `frame/questions.md`: that a `can_use_tool` request arrives and a `deny` holds (Q3), and which commands the CLI runs without asking in the mode `default` (Q4). What 2.1.326 to 2.1.329 do with the two options (Q5) needs no model's turn, and the frame ran its probe on 2.1.330 alone.

gaps.md:12, the "who must answer" cell:
the orchestrator, by the probe of `frame/design.md` *Grounding* on each of the four versions, with no login
```

## Confirmations

What matched: no launch carries an option that skips a permission check. `claudeArgs` (`apps/desktop/src/daemon/adapters/claude.ts:68-90`) passes `--permission-mode default` and `--permission-prompt-tool stdio` to every launch. A role launch adds `--tools` with one value, and a launch with no role adds `--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode`. Executed: `git grep -n -e dangerously-skip-permissions -e bypassPermissions -e allow-dangerously -- apps/desktop/src apps/desktop/role-bundle` printed nothing and exited 1. Read: the three agents of `apps/desktop/role-bundle/agents/` carry no `permissionMode` and no `tools` key in their front matter.

What matched: a request of a session with no role waits for the person, and no rule answers it. `verdictOn` returns `person` first for a null role (`apps/desktop/src/daemon/role-grants.ts:102`). The daemon's listener only keeps such a request and sends an `inbox` (`apps/desktop/src/daemon/daemon.ts:985-996`). `headlessChanged` drops it unanswered when the session leaves `working`, and `answerPermission` is the one place that answers it (`daemon.ts:752-772`). Executed, in the narrow run below: the cases "keeps a request of a session with no role for the person", the two answers, the four ends and the withdrawal pass.

What matched: a write that names no path is refused. `verdictOn` sends it past the path rule to the sentence for any other call (`role-grants.ts:105-111`). The crafter case pins `write(null)` to that sentence (`apps/desktop/test/daemon.test.ts:3694`).

What matched: a withdrawn request is answered by nobody. The adapter forgets the id before it reports the withdrawal (`claude.ts:424`), an answer for an id it does not wait on writes nothing (`claude.ts:378`), and the daemon drops the request from its list (`daemon.ts:997-1000`). The daemon answers a role session's request in the turn that reports it, so a withdrawal cannot fall between the request and its answer.

What matched: a role session starts only through an adapter that declares both features, and a session with no role starts through any (`daemon.ts:719-724`). The sentence matches *Data & interfaces*. Both adapters declare the two features (`claude.ts:326`, `apps/desktop/src/daemon/adapters/fake.ts:37`).

What matched: the texts the frame fixes are the code's, word for word. These are the head's paragraph on tools (`apps/desktop/src/daemon/adapters/claude-roles.ts:76`), the five reasons, the error for an unknown control request, the error of `answerPermission`, and the handshake line `INITIALIZE_LINE`.

What matched: *Removes* and scenario 21. Executed: `git grep -n -e 'no adapter declares one yet' -e 'and no feature' -e 'One message, then the end of input' -- apps/desktop` printed nothing and exited 1. `git grep -n -i -e claude -e anthropic -- apps/desktop/src/shared/protocol.ts` printed lines 6 and 7 alone, the comment and the type of `PaneKind`.

What matched: the cases fail where a guard is removed, on a sample of one. The phase 2 record says that Node's `realpath` in place of the system's turns the daemon's permission cases red. Executed: with that one change in the clone, the case "answers a crafter's request by its grant" failed, and its failing line was `link/../b.txt` expected refused and received allowed. The change was then undone. The rest of the record's mutation list was not re-run. It is a claim, read as a sample.

What matched: the label of the suite is honest. `gaps.md` *Not verified*, its first row, says the whole suite and the typecheck at the branch's last commit were not run, and names the orchestrator. The phase records name the files each phase ran, and this round ran the same files (`## Probes`).

The case at `apps/desktop/test/daemon.test.ts:3694` names `/app/dist/bundle/skills/core/SKILL.md` "the bundle's". It is a fixed path that is not the bundle's folder, so it pins nothing that the row `join(outside, "a.txt")` does not already pin. The daemon's rule has no notion of the bundle's folder, and that folder is outside the worktree like any other.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether Claude Code 2.1.330 puts a file tool's `file_path` into a `can_use_tool` request as the model wrote it, or already expanded and resolved. That decides whether finding 1 can be reached through this CLI today. The finding holds for the neutral rule either way | `apps/desktop/src/daemon/adapters/claude.ts:205-213` | the orchestrator, from the stream of the first real crafter session #41 runs |
| Whether a `permissionMode` key in a bundle agent's front matter would apply to a session launched with `--agent`. No case keeps the taken agents free of the key, and the bundle takes them byte for byte from AgenticSeal | `apps/desktop/role-bundle/agents/` | the orchestrator |
| What changes between the daemon's read of a path's links and the CLI's write, such as a crafter's command that swaps a folder for a link | `apps/desktop/src/daemon/role-grants.ts:51-90` | the sandbox work of *Scope* item 20, which the orchestrator opens |
| The whole suite, the typecheck and the broad gate at the branch's last commit | the repository | the orchestrator, by the broad gate |
| The window: *Scope* item 16, scenarios 17 to 19 and 22 | phase 3 | a later round |

## Probes

| Command | Result |
|---|---|
| `node --experimental-strip-types --no-warnings test_tmp_paths.mts` in the clone's `apps/desktop`, once | Exit 0. As a crafter on a scratch worktree: `link/f.txt` -> `refuse`; `missing/../link/f.txt` -> `allow`; `~/probe-never-written.txt` -> `allow`; `<elsewhere>/L/../c.txt`, with `L` a link outside to `<worktree>/a/b` -> `allow`. A fifth row meant as the absolute form of the second was built through `join`, which settled its `..`, so it repeated the control and is not counted. The scratch folders it made under the system's temporary folder were removed afterwards |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/claude-adapter.test.ts test/fake-adapter.test.ts test/daemon.test.ts test/last-look.test.ts test/view.test.ts` in the clone's `apps/desktop` | Exit 0: 5 files, 728 cases passed |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/role-bundle.test.ts`, then the same with `test/ask-section.test.ts`, one at a time | Exit 0 and exit 0: 11 cases and 2 cases passed |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/daemon.test.ts -t "answers a crafter's request by its grant"` with `realpathSync.native` replaced by `realpathSync` in `realLocation` | Exit 1: 1 failed and 240 skipped. The failing line was `link/../b.txt` expected refused and received allowed. The change was undone, and `git status` in the clone showed only the probe file |
| `ls -laT /Users/x/.local/share/claude/versions/` | Eight versions, 2.1.319 to 2.1.330, of which 2.1.326 to 2.1.329 are dated 17 to 20 November 2026 |
| `python3 -I` search of the 2.1.330 executable for `startsWith("~/")` | The path function that throws `Path must be a string, received` reads `~` and `~/` as the home folder, then resolves the rest against a base |
