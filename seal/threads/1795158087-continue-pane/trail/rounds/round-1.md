# Review round 1: 1795158087-continue-pane

```seal
target: af3fefb against release/v0.0.1
```

This round reviewed the range `85c381a..af3fefb`, the whole branch against its base. No earlier round exists, so no coordinate or fact was carried. Every fact below was established in this round, from the branch worktree at `af3fefb`. The round ran read-only `git` commands in that worktree and the plugin's `chain_check.py`. It ran no case and no probe, and it started no app. The work item's records were read whole at `af3fefb`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. No `pr.md` stands yet, and `seal/parity.json` is not declared.

Axes walked, beyond the table of `skills/code-review/SKILL.md`: compatibility between a window and a daemon of different builds, in both directions; the life of a pane whose process ends at once, from its tab to the inbox line; and the person-visible text the change adds.

## Findings

### 1. Nothing in the suite holds the daemon's forwarding of `continueLatest` to the command, or the window's sending of it

```seal
severity: should
location: `apps/desktop/src/daemon/main.ts:48-51`, `apps/desktop/src/renderer/work-item-view.ts:231-234`, `apps/desktop/src/daemon/hooks.ts`, `apps/desktop/test/hooks.test.ts`
evidence: executed `git grep -n -e 'daemon/main' -e 'work-item-view' -- test` (no test imports either file; the three hits are DOM ids in built-app helpers), `git grep -n -e 'continue' -- test` (no built-app case presses the continuing button or reads `--continue`); read `apps/desktop/src/daemon/main.ts:48-51`, `apps/desktop/src/renderer/work-item-view.ts:230-247`, `apps/desktop/test/memory.ts:376-385`
```

Why it matters: the whole feature rests on two lines that no case reads. In `src/daemon/main.ts:49` the inline `commandFor` passes `start.continueLatest` to `claudePaneCommand`. In `src/renderer/work-item-view.ts:233` the window adds `continueLatest: true` to the `start` message. A later edit could drop either one and the suite would stay green. The continuing button would then open a new conversation and give no sign that anything went wrong. The daemon's cases use a fake `commandFor`, so they show that the daemon hands over the request and nothing past that. The `claudePaneCommand` case shows the string, but not that the daemon's real `commandFor` asks for it.

The build's account says this was out of reach. `gaps.md` *Not done* says: "such a case adds an app start to every run of the suite." That is true of the window's click. It is not true of the daemon's half. The forwarding is a closure inside `main()`, and `main()` runs when the module loads. Moving the closure into a module function would let a unit case read it with no app start. `gaps.md` row 2 asks the proofer to read both files, and I did. Both are correct at `af3fefb`: `main.ts:49` forwards `start.continueLatest` for kind `claude` only, and `work-item-view.ts:233` sends the field only where the choice asks for it. That reading is good for this commit only. Row 2 itself says "after any later edit", and only a case covers that.

The frame accepts one start of the built app as the evidence that "the button sending it" works (`frame/design.md` scenario 2, *Verifiable how*). So the window's half meets the frame, and the fix pass may leave it as it is. If it does, it says so in its answer. The daemon's half has no such grounds. The frame's Grounding row on `claudePaneCommand` and `commandFor` says "a continuing pane that goes through both keeps the hooks and the settings by construction". That holds only while `commandFor` keeps going through both, and nothing pins that it does.

The fix for the daemon's half moves the closure into `src/daemon/hooks.ts`, next to `claudePaneCommand`, and adds a case in `test/hooks.test.ts`. Its precondition: `HookServer#socketPath` is `readonly` (`src/daemon/hooks.ts:114`), so reading it once at construction gives the same value the closure read on each call. `./pty` loads `node-pty`, which `test/daemon.test.ts` already loads in the same runner.

```ts
// src/daemon/hooks.ts, beside claudePaneCommand
import type { PaneKind } from "../shared/protocol";
import type { PaneCommand } from "./daemon";
import { loginShell } from "./pty";

/** The daemon's `commandFor`: a pane's command by its kind, with the pane's id and the hook socket in its environment. */
export function paneCommands(env: NodeJS.ProcessEnv, settingsFile: string, socketPath: string): (kind: PaneKind, id: number, start: { continueLatest: boolean }) => PaneCommand {
  return (kind, id, start) => ({
    ...(kind === "claude" ? claudePaneCommand(env, settingsFile, start.continueLatest) : loginShell(env)),
    env: { OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: socketPath },
  });
}

// src/daemon/main.ts, in place of the inline closure at :48-51
    commandFor: paneCommands(process.env, hookSettingsFile, hooks.socketPath),

// test/hooks.test.ts
describe("paneCommands", () => {
  it("asks a Claude Code pane's command to continue only where the start asks it, gives a shell its login shell, and puts the pane's id and the hook socket in both", () => {
    const commandFor = paneCommands({ SHELL: "/bin/zsh" }, "/x/hooks.json", "/x/hooks.sock");
    const env = (id: number) => ({ OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: "/x/hooks.sock" });
    expect(commandFor("claude", 3, { continueLatest: true })).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", "exec claude --settings '/x/hooks.json' --continue"], env: env(3) });
    expect(commandFor("claude", 4, { continueLatest: false })).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", "exec claude --settings '/x/hooks.json'"], env: env(4) });
    expect(commandFor("shell", 5, { continueLatest: true })).toEqual({ command: "/bin/zsh", args: ["-l"], env: env(5) });
  });
});
```

The snippet leaves three statements for the fix pass to update. The first is `gaps.md` row 2, whose daemon half the case closes. The second is the *Not done* paragraph that gives the app start's cost as the reason no case exists. The third is the comment at `src/daemon/main.ts:46`, "`commandFor` gives each its command", which still holds once the closure moves into `paneCommands`. The window's half needs a pure function of its own if the fix pass takes it on. One option is `startFields(choice)` in `src/renderer/view.ts`, which would return `{ kind, continueLatest: true }` or `{ kind }`, with a case beside `paneChoices` in `test/view.test.ts`.

## Confirmations

What matched: `frame/design.md` *Data & interfaces*, against the code at `af3fefb`, read field by field from the reference. `PaneKindInfo` has `continues: boolean` (`apps/desktop/src/shared/protocol.ts:27-28`). The `start` member has `continueLatest?: true` (`protocol.ts:147`). `DaemonOptions#commandFor` takes `(kind, id, start: { continueLatest: boolean })` (`src/daemon/daemon.ts:47`). `claudePaneCommand` takes `continueLatest = false` and appends ` --continue` after the quoted settings file (`src/daemon/hooks.ts:86-89`). `paneChoices` returns `kind`, `text`, `hint` and `continueLatest` (`src/renderer/view.ts:26-45`). `SessionInfo` and the server messages are unchanged in the diff. Read.

What matched: *Scope* item 3 and scenario 4. The daemon reads the request as asked only where it is `=== true` (`daemon.ts:245`). It refuses with `error` and the request's id before it looks up the work item, and starts nothing, for a kind whose entry lacks `continues` (`daemon.ts:246-249`, `:491-493`). An unknown kind sent with the flag gets the same refusal. `createWorkItem` reaches `startSession` with the default `false` (`daemon.ts:276`, `:429`). The cases at `test/daemon.test.ts:652-709` assert each of these. Read. I did not run them.

What matched: *Scope* item 5 and scenario 1. `showPaneButtons` builds one button per `paneChoices` entry and sets `title` only where `hint` is not null. It rebuilds the bar with `replaceChildren` on each `ready` (`src/renderer/renderer.ts:280`), so no tooltip from an earlier daemon is left on a button. `paneChoices` gives two choices only where `continues === true`, so a daemon of an earlier build, which sends no field, gets one button per kind (`view.ts:40-45`). `test/memory.ts:380` finds the shell button by its exact text, so the extra button does not move it. Read.

What matched: *Scope* item 6 and scenario 6, on the daemon's side. A dead pane stays a tab, because `paneTabs` does not filter on `alive` (`view.ts:555-557`). `paneInFront` keeps the tab in front while it is still a tab (`view.ts:565-566`). The exit line is printed into the pane's own output, so a replay ends with it (`daemon.ts:453-457`). The exit also clears the silent-start timer, so a pane that ends before any event is never listed as waiting (`daemon.ts:451`). What the app's terminal draws for Claude Code's closing sequence is `gaps.md` row 4, and this round did not see it. Read.

What matched: `gaps.md` row 2's request to the proofer. Both files are correct at this commit. Finding 1 covers what keeps them correct after a later edit. Read.

What matched: the claims in `trail/phases/phase-2.md`. "The fifth file is the one other test file that imports a changed path": `git grep -l` for a direct import of a changed source path under `test/` listed `daemon`, `hooks`, `last-look`, `pane-kinds` and `view`, and nothing else. Executed. "No unit case imports either file": the same search found no import of `src/daemon/main.ts` or `src/renderer/work-item-view.ts`. Executed. The three existing cases the phase says it changed are the ones the diff changes: the `PANE_KINDS` case, the `ready` kinds case and the protocol fields case. Each gained `continues` and none was removed, so *Removes* "nothing" still holds. Read. `git grep` for `reportsState`, `continueLatest`, `paneKinds`, "pane bar", "new pane", "+ Shell" and "Claude Code pane" over `docs/` and `README.md` found no statement of the pane bar or the kinds' fields that the diff leaves stale. Executed.

What matched: the scenario 7 fold at `af3fefb`. The folded *Verifiable how* names the end of scenario 2's case, which is where the build put the two assertions (`test/daemon.test.ts:673-677`). The fold's reason holds against the base: before the build, the daemon ignored the field and started a `claude` pane, so a case of its own would pass there. Read.

What matched: `frame/questions.md` Q1 to Q4 and `changelog.md` agree with the runs in `trail/phases/phase-1.md`. Q1 is runs 3, 4 and the `lastSessionId` setup. Q2 is runs 5, 7 and 11. Q3 is runs 8 to 11. Q4 is the events table. Every changelog item has a measurement or a code line behind it. Read.

The new cases were read against their groups. In `test/daemon.test.ts`, the case without the field covers the `start` path, and the first new case covers the `createWorkItem` path, so each holds something the other does not. In `test/view.test.ts`, the three `paneChoices` cases each hold a separate row of scenario 1. Phase 2 says each was seen red. I did not re-run that.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The desktop suite, the typecheck of the whole package and the repository's broad gate. Phase 2's run of five files and its typecheck of 26 files are the build's claims, and this round ran neither | `apps/desktop/test/`, `seal/config.json` `Broad gate` | the orchestrator's broad run, after the rounds settle |
| Whether the phase 2 cases fail with the code removed, as `trail/phases/phase-2.md` *Seen red* and its `seal mutate` table say. This round read the outputs' description and ran nothing | `seal/threads/1795158087-continue-pane/trail/phases/phase-2.md` | the orchestrator, from the scratch outputs that record names, where it wants them re-run |
| What the app's terminal draws when `claude --continue` ends with `No conversation found to continue` | `seal/threads/1795158087-continue-pane/gaps.md` row 4 | the owner at the window |
| What `claude --continue` shows in a repository whose trust question was never answered | `seal/threads/1795158087-continue-pane/gaps.md` row 3 | the owner at the window |

## Probes

| Command | Result |
|---|---|
| `git grep -n -e 'daemon/main' -e 'work-item-view' -- test` in `apps/desktop` | three hits, all the DOM id `work-item-view` in `test/korean-pane.ts`, `test/memory.ts` and `test/work-item-form.test.ts`; no import of either file |
| `git grep -n -e 'continue' -- test`, without the four changed test files | two comment lines in `test/korean-pane.ts` about a composition; no case presses the continuing button |
| `git grep -l -E` for an import of a changed source path under `apps/desktop/test` | `daemon.test.ts`, `hooks.test.ts`, `last-look.test.ts`, `pane-kinds.test.ts`, `view.test.ts` |
| `git grep -n -i` for the pane bar, the kinds' fields and the new option over `docs/` and `README.md` | one hit, `docs/product.md:17`, which does not describe the pane bar |
| `python3 skills/code-review/scripts/chain_check.py --baseline 85c381a --root <the branch worktree> --worktree`, before the record | exit 0; it reported no rounds yet, and no gate or guarantee record, which the orchestrator and the sealer write; no notice at `frame/design.md` |
