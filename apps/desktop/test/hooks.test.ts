import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { claudePaneCommand, HOOK_EVENTS, HookServer, hookSettings, writeHookSettings, type HookEvent } from "../src/daemon/hooks";

const dirs: string[] = [];
function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-hooks-"));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/**
 * Runs the hook command of the settings as Claude Code would, with the event JSON on stdin,
 * in a child process, so the server in this process can answer while it runs.
 */
function runCommand(command: string, env: Record<string, string>, input: string): Promise<{ status: number | null; ms: number }> {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn("/bin/sh", ["-c", command], { env: { PATH: "/usr/bin:/bin", ...env } });
    child.on("close", (status) => resolve({ status, ms: Date.now() - started }));
    child.stdin.end(input);
  });
}
function runHook(settings: ReturnType<typeof hookSettings>, env: Record<string, string>, payload: object) {
  const command = settings.hooks.Stop?.[0]?.hooks[0]?.command;
  if (!command) throw new Error("no Stop hook");
  return runCommand(command, env, JSON.stringify(payload));
}

describe("hookSettings", () => {
  it("adds one command hook for every event the inbox and the phone read", () => {
    const settings = hookSettings();
    for (const event of ["SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse", "PostToolUseFailure", "PermissionRequest", "Notification", "Stop"]) {
      expect(HOOK_EVENTS).toContain(event);
      expect(settings.hooks[event]?.[0]?.hooks[0]?.type).toBe("command");
    }
  });

  it("names no pane and no socket in the file, so one file serves every pane", () => {
    const text = JSON.stringify(hookSettings());
    expect(text).toContain("$OWLERY_HOOK_SOCKET");
    expect(text).toContain("$OWLERY_PANE_ID");
  });
});

describe("writeHookSettings", () => {
  it("writes the hook settings into the directory it is given", () => {
    const dir = scratch();
    const file = writeHookSettings(dir);
    expect(file.startsWith(dir)).toBe(true);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(hookSettings());
  });
});

describe("HookServer", () => {
  it("receives an event through the hook command, with the pane it came from", async () => {
    const dir = scratch();
    const server = await HookServer.listen(join(dir, "hooks.sock"));
    const received = new Promise<HookEvent>((resolve) => server.onEvent(resolve));
    const result = await runHook(hookSettings(), { OWLERY_HOOK_SOCKET: server.socketPath, OWLERY_PANE_ID: "7" }, {
      hook_event_name: "Stop",
      session_id: "s-1",
      last_assistant_message: "끝났습니다",
    });
    expect(result.status).toBe(0);
    // A hook that holds the session would slow every turn of `claude`.
    expect(result.ms).toBeLessThan(1000);
    const event = await received;
    expect(event.paneId).toBe(7);
    expect(event.name).toBe("Stop");
    expect(event.payload.last_assistant_message).toBe("끝났습니다");
    await server.close();
  });

  it("lets the session go on when Owlery is not listening", async () => {
    const dir = scratch();
    const result = await runHook(hookSettings(), { OWLERY_HOOK_SOCKET: join(dir, "absent.sock"), OWLERY_PANE_ID: "1" }, { hook_event_name: "Stop" });
    expect(result.status).toBe(0);
  });

  it("ignores a payload that is not JSON rather than crashing", async () => {
    const dir = scratch();
    const server = await HookServer.listen(join(dir, "hooks.sock"));
    const events: HookEvent[] = [];
    server.onEvent((e) => events.push(e));
    const result = await runCommand(`printf '3\\nnot json' | /usr/bin/nc -U "${server.socketPath}"`, {}, "");
    // A bad payload must not hold the hook either.
    expect(result.ms).toBeLessThan(2000);
    expect(events).toEqual([]);
    await server.close();
  });
});

describe("claudePaneCommand", () => {
  it("replaces the user's interactive login shell with claude and Owlery's hook settings", () => {
    const { command, args } = claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json");
    expect(command).toBe("/bin/zsh");
    expect(args.slice(0, 3)).toEqual(["-l", "-i", "-c"]);
    // The pane ends with claude: a shell opened after it inherits the first shell's exports and
    // came up without the user's prompt theme (seen 2026-11-18). "+ Shell" opens a shell.
    expect(args[3]).toBe("exec claude --settings '/x/hooks.json'");
  });

  it("quotes a settings path that holds a space or a quote", () => {
    const { args } = claudePaneCommand({ SHELL: "/bin/zsh" }, "/Users/a b/it's.json");
    expect(args[3]).toBe(`exec claude --settings '/Users/a b/it'\\''s.json'`);
  });
});
