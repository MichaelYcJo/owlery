import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { claudePaneCommand, HOOK_EVENTS, HookServer, hookSettings, writeHookSettings, type HookEvent } from "../src/daemon/hooks";

const dirs: string[] = [];
function scratch(): string {
  // The real path, so a case can compare it with `process.cwd()`.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "owlery-hooks-")));
  dirs.push(dir);
  return dir;
}
// macOS refuses a Unix socket whose path, as given to the system, is over 104 bytes.
const SOCKET_PATH_CAP = 104;
/** A folder whose `hooks.sock` has a path over the cap. */
function longDir(): string {
  const dir = join(scratch(), "x".repeat(120));
  mkdirSync(dir);
  expect(Buffer.byteLength(join(dir, "hooks.sock"))).toBeGreaterThan(SOCKET_PATH_CAP);
  return dir;
}
// Some cases move the working directory of this process, which vitest forks for this file alone.
const startedIn = process.cwd();
afterEach(() => {
  process.chdir(startedIn);
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/**
 * Runs the hook command of the settings as Claude Code would, with the event JSON on stdin,
 * in a child process, so the server in this process can answer while it runs.
 */
function runCommand(
  command: string,
  env: Record<string, string>,
  input: string,
  cwd?: string,
): Promise<{ status: number | null; ms: number; output: string }> {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn("/bin/sh", ["-c", command], { env: { PATH: "/usr/bin:/bin", ...env }, cwd });
    // What the command writes is what the session would see, on either stream.
    let output = "";
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.stderr.on("data", (chunk) => (output += String(chunk)));
    child.on("close", (status) => resolve({ status, ms: Date.now() - started, output }));
    child.stdin.end(input);
  });
}
function runHook(settings: ReturnType<typeof hookSettings>, env: Record<string, string>, payload: object, cwd?: string) {
  const command = settings.hooks.Stop?.[0]?.hooks[0]?.command;
  if (!command) throw new Error("no Stop hook");
  return runCommand(command, env, JSON.stringify(payload), cwd);
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
    // The socket's folder and its name are both taken from the one variable.
    expect(text).toContain("${OWLERY_HOOK_SOCKET%/*}");
    expect(text).toContain("${OWLERY_HOOK_SOCKET##*/}");
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

  it("receives an event in a run folder whose socket path is over the system's cap", async () => {
    const server = await HookServer.listen(join(longDir(), "hooks.sock"));
    const received = new Promise<HookEvent>((resolve) => server.onEvent(resolve));
    const result = await runHook(hookSettings(), { OWLERY_HOOK_SOCKET: server.socketPath, OWLERY_PANE_ID: "7" }, { hook_event_name: "Stop" });
    expect(result.status).toBe(0);
    const event = await received;
    expect(event.paneId).toBe(7);
    expect(event.name).toBe("Stop");
    // Readable by the user alone, as in a short folder.
    expect(statSync(server.socketPath).mode & 0o777).toBe(0o600);
    await server.close();
  });

  it("leaves the working directory where it was when the listen and the close resolve", async () => {
    const dir = longDir();
    const server = await HookServer.listen(join(dir, "hooks.sock"));
    expect(process.cwd()).toBe(startedIn);
    const closed = server.close();
    expect(process.cwd()).toBe(startedIn);
    await closed;
    expect(process.cwd()).toBe(startedIn);
  });

  it.each([
    ["the socket's folder does not exist", (dir: string) => join(dir, "absent", "hooks.sock")],
    ["the socket's own name is over the cap", (dir: string) => join(dir, `${"s".repeat(SOCKET_PATH_CAP)}.sock`)],
  ])("leaves the working directory where it was when the listen is refused because %s", async (_why, socketPath) => {
    await expect(HookServer.listen(socketPath(longDir()))).rejects.toThrow();
    expect(process.cwd()).toBe(startedIn);
  });

  it("removes the socket from its folder when it closes, and spares a file of the same name in the working directory", async () => {
    const bystander = join(scratch(), "hooks.sock");
    writeFileSync(bystander, "not Owlery's");
    process.chdir(dirname(bystander));
    const server = await HookServer.listen(join(longDir(), "hooks.sock"));
    expect(existsSync(server.socketPath)).toBe(true);
    await server.close();
    // The bystander is read first: a close made from outside the folder fails both lines, and this one names the loss.
    expect(existsSync(bystander)).toBe(true);
    expect(existsSync(server.socketPath)).toBe(false);
  });

  it("lets the session go on when Owlery is not listening", async () => {
    const dir = scratch();
    const result = await runHook(hookSettings(), { OWLERY_HOOK_SOCKET: join(dir, "absent.sock"), OWLERY_PANE_ID: "1" }, { hook_event_name: "Stop" });
    expect(result.status).toBe(0);
    expect(result.output).toBe("");
  });

  it("sends nothing, says nothing and lets the session go on when the socket's folder is gone", async () => {
    // A hook that went on after a failed `cd` would reach a socket of the same name in the session's own folder.
    const sessionDir = scratch();
    const other = await HookServer.listen(join(sessionDir, "hooks.sock"));
    const events: HookEvent[] = [];
    other.onEvent((e) => events.push(e));
    const env = { OWLERY_HOOK_SOCKET: join(sessionDir, "absent", "hooks.sock"), OWLERY_PANE_ID: "1" };
    const result = await runHook(hookSettings(), env, { hook_event_name: "Stop" }, sessionDir);
    expect(result.status).toBe(0);
    expect(result.output).toBe("");
    await other.close();
    expect(events).toEqual([]);
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

  it("adds --continue after the settings where the pane starts on the latest conversation of its folder, in the same shell", () => {
    const { command, args } = claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", true);
    expect(command).toBe("/bin/zsh");
    expect(args).toEqual(["-l", "-i", "-c", "exec claude --settings '/x/hooks.json' --continue"]);
  });
});
