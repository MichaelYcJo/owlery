import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { claudePaneCommand, HOOK_EVENTS, HookServer, hookSettings, paneCommands, setupPaneCommand, writeHookSettings, type HookEvent } from "../src/daemon/hooks";

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
    for (const event of ["SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse", "PostToolUseFailure", "PermissionRequest", "Notification", "Stop", "StopFailure"]) {
      expect(HOOK_EVENTS).toContain(event);
      expect(settings.hooks[event]?.[0]?.hooks[0]?.type).toBe("command");
      expect(settings.hooks[event]?.[0]?.matcher).toBe("*");
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

  it("loads the role bundle as a plugin of the session and appends the pane's head to its system prompt where the pane carries the owl chain, before --continue, each path quoted", () => {
    const chain = { bundleDir: "/app/dist/bundle", headFile: "/Users/a b/pane-head.md", launcher: "/x/owl-chain" };
    expect(claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", false, chain).args).toEqual(["-l", "-i", "-c", "exec claude --settings '/x/hooks.json' --plugin-dir '/app/dist/bundle' --append-system-prompt-file '/Users/a b/pane-head.md'"]);
    expect(claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", true, chain).args[3]).toBe("exec claude --settings '/x/hooks.json' --plugin-dir '/app/dist/bundle' --append-system-prompt-file '/Users/a b/pane-head.md' --continue");
    // A pane that carries nothing is launched with the settings alone.
    expect(claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", false, null).args[3]).toBe("exec claude --settings '/x/hooks.json'");
  });

  it("sets CLAUDE_CONFIG_DIR to the account's folder between exec and claude, quoted for the shell, so the login profile's own export does not replace it, and writes no env where no folder is given (scenario 4)", () => {
    const chain = { bundleDir: "/app/dist/bundle", headFile: "/x/pane-head.md", launcher: "/x/owl-chain" };
    expect(claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", false, null, "/Users/a b/it's").args).toEqual(["-l", "-i", "-c", `exec env CLAUDE_CONFIG_DIR='/Users/a b/it'\\''s' claude --settings '/x/hooks.json'`]);
    // The options the owl chain gives a pane, and --continue, follow claude as they do under System default.
    expect(claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", true, chain, "/accounts/1").args[3]).toBe("exec env CLAUDE_CONFIG_DIR='/accounts/1' claude --settings '/x/hooks.json' --plugin-dir '/app/dist/bundle' --append-system-prompt-file '/x/pane-head.md' --continue");
    expect(claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", true, chain, null).args[3]).toBe("exec claude --settings '/x/hooks.json' --plugin-dir '/app/dist/bundle' --append-system-prompt-file '/x/pane-head.md' --continue");
  });

  it("ends with --resume and the conversation's id, quoted, after the options the owl chain gives, and never holds --continue beside it (scenario 8)", () => {
    const chain = { bundleDir: "/app/dist/bundle", headFile: "/x/pane-head.md", launcher: "/x/owl-chain" };
    const id = "a99099b6-accd-47d0-853b-547820b31e6d";
    expect(claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", true, chain, "/accounts/2", id).args).toEqual(["-l", "-i", "-c", `exec env CLAUDE_CONFIG_DIR='/accounts/2' claude --settings '/x/hooks.json' --plugin-dir '/app/dist/bundle' --append-system-prompt-file '/x/pane-head.md' --resume '${id}'`]);
    expect(claudePaneCommand({ SHELL: "/bin/zsh" }, "/x/hooks.json", false, null, null, id).args[3]).toBe(`exec claude --settings '/x/hooks.json' --resume '${id}'`);
  });
});

describe("paneCommands", () => {
  it("asks a Claude Code pane's command to continue only where the start asks it, gives a shell its login shell whatever the start asks, and puts the pane's id and the hook socket in the environment of both", () => {
    const commandFor = paneCommands({ SHELL: "/bin/zsh" }, "/x/hooks.json", "/x/hooks.sock");
    const env = (id: number) => ({ OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: "/x/hooks.sock" });
    const start = { folder: "/w/item", base: "main", accountDir: null };
    expect(commandFor("claude", 3, { ...start, continueLatest: true })).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", "exec claude --settings '/x/hooks.json' --continue"], env: env(3) });
    expect(commandFor("claude", 4, { ...start, continueLatest: false })).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", "exec claude --settings '/x/hooks.json'"], env: env(4) });
    expect(commandFor("shell", 5, { ...start, continueLatest: true })).toEqual({ command: "/bin/zsh", args: ["-l"], env: env(5) });
    // A start that names a conversation resumes it in a Claude Code pane, and a shell is given its login shell still.
    const resume = "a99099b6-accd-47d0-853b-547820b31e6d";
    expect(commandFor("claude", 6, { ...start, continueLatest: false, resume })).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", `exec claude --settings '/x/hooks.json' --resume '${resume}'`], env: env(6) });
    expect(commandFor("shell", 7, { ...start, continueLatest: false, resume })).toEqual({ command: "/bin/zsh", args: ["-l"], env: env(7) });
  });

  it("gives a Claude Code pane of a folder that carries the owl chain the bundle, the head, the chain command's launcher and the work item's base, and every other pane what it had: a Claude Code pane of another folder, and a shell in the carrying folder", () => {
    const chain = { bundleDir: "/app/dist/bundle", headFile: "/x/pane-head.md", launcher: "/x/owl-chain" };
    const asked: string[] = [];
    const commandFor = paneCommands({ SHELL: "/bin/zsh" }, "/x/hooks.json", "/x/hooks.sock", ({ folder }) => {
      asked.push(folder);
      return folder === "/w/owl" ? chain : null;
    });
    const env = (id: number) => ({ OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: "/x/hooks.sock" });
    const of = { accountDir: null };
    const carrying = "exec claude --settings '/x/hooks.json' --plugin-dir '/app/dist/bundle' --append-system-prompt-file '/x/pane-head.md'";
    expect(commandFor("claude", 1, { ...of, continueLatest: false, folder: "/w/owl", base: "release/x" })).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", carrying], env: { ...env(1), OWLERY_CHAIN: "/x/owl-chain", OWLERY_BASE: "release/x" } });
    expect(commandFor("claude", 2, { ...of, continueLatest: true, folder: "/w/owl", base: "release/x" }).args[3]).toBe(`${carrying} --continue`);
    // A work item that records no base names none, and the chain command then asks for `--base`.
    expect(commandFor("claude", 3, { ...of, continueLatest: false, folder: "/w/owl", base: null }).env).toEqual({ ...env(3), OWLERY_CHAIN: "/x/owl-chain" });
    expect(commandFor("claude", 4, { ...of, continueLatest: false, folder: "/w/other", base: "main" })).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", "exec claude --settings '/x/hooks.json'"], env: env(4) });
    expect(commandFor("shell", 5, { ...of, continueLatest: false, folder: "/w/owl", base: "main" })).toEqual({ command: "/bin/zsh", args: ["-l"], env: env(5) });
    // The folder is read for a Claude Code pane alone.
    expect(asked).toEqual(["/w/owl", "/w/owl", "/w/owl", "/w/other"]);
  });

  it("gives every Claude Code pane the settings file every pane shares, the one that carries the owl chain among them, and writes no file of its own beside it", () => {
    const dir = scratch();
    const shared = writeHookSettings(dir);
    const before = readFileSync(shared, "utf8");
    const chain = { bundleDir: "/app/dist/bundle", headFile: "/x/pane-head.md", launcher: "/x/owl-chain" };
    const commandFor = paneCommands({ SHELL: "/bin/zsh" }, shared, "/x/hooks.sock", ({ folder }) => (folder === "/w/owl" ? chain : null));
    const start = { continueLatest: false, base: "main", accountDir: null };
    expect(commandFor("claude", 7, { ...start, folder: "/w/owl" }).args[3]).toBe(`exec claude --settings '${shared}' --plugin-dir '/app/dist/bundle' --append-system-prompt-file '/x/pane-head.md'`);
    expect(commandFor("claude", 8, { ...start, folder: "/w/other" }).args[3]).toBe(`exec claude --settings '${shared}'`);
    commandFor("shell", 9, { ...start, folder: "/w/owl" });
    expect(readFileSync(shared, "utf8")).toBe(before);
    expect(readdirSync(dir)).toEqual(["claude-hooks.json"]);
  });

  it("gives a Claude Code pane of an account the folder in its command and none in its environment, a shell of that account the folder in its environment, a pane under System default what it had, and hands what a pane carries the whole start, its account's folder among it (scenarios 3 and 4)", () => {
    const chain = { bundleDir: "/app/dist/bundle", headFile: "/x/pane-head.md", launcher: "/x/owl-chain" };
    const asked: unknown[] = [];
    const commandFor = paneCommands({ SHELL: "/bin/zsh" }, "/x/hooks.json", "/x/hooks.sock", (start) => {
      asked.push(start);
      return chain;
    });
    const env = (id: number) => ({ OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: "/x/hooks.sock" });
    const start = { continueLatest: false, folder: "/w/owl", base: null };
    const work = { ...start, accountDir: "/accounts/work" };
    const carrying = "claude --settings '/x/hooks.json' --plugin-dir '/app/dist/bundle' --append-system-prompt-file '/x/pane-head.md'";
    expect(commandFor("claude", 1, work)).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", `exec env CLAUDE_CONFIG_DIR='/accounts/work' ${carrying}`], env: { ...env(1), OWLERY_CHAIN: "/x/owl-chain" } });
    expect(commandFor("shell", 2, work)).toEqual({ command: "/bin/zsh", args: ["-l"], env: { ...env(2), CLAUDE_CONFIG_DIR: "/accounts/work" } });
    const own = { ...start, accountDir: null };
    expect(commandFor("claude", 3, own)).toEqual({ command: "/bin/zsh", args: ["-l", "-i", "-c", `exec ${carrying}`], env: { ...env(3), OWLERY_CHAIN: "/x/owl-chain" } });
    expect(commandFor("shell", 4, own)).toEqual({ command: "/bin/zsh", args: ["-l"], env: env(4) });
    expect(asked).toEqual([work, own]);
  });

  it("names the runner of heavy commands in OWLERY_RUN in the environment of a shell, of a Claude Code pane and of one that carries the owl chain, and names none where the daemon wrote no runner", () => {
    const chain = { bundleDir: "/app/dist/bundle", headFile: "/x/pane-head.md", launcher: "/x/owl-chain" };
    const commandFor = paneCommands({ SHELL: "/bin/zsh" }, "/x/hooks.json", "/x/hooks.sock", ({ folder }) => (folder === "/w/owl" ? chain : null), "/x/owl-run");
    const env = (id: number) => ({ OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: "/x/hooks.sock", OWLERY_RUN: "/x/owl-run" });
    const start = { continueLatest: false, base: null, accountDir: null };
    expect(commandFor("shell", 1, { ...start, folder: "/w/other" }).env).toEqual(env(1));
    expect(commandFor("claude", 2, { ...start, folder: "/w/other" }).env).toEqual(env(2));
    expect(commandFor("claude", 3, { ...start, folder: "/w/owl" }).env).toEqual({ ...env(3), OWLERY_CHAIN: "/x/owl-chain" });
    const without = paneCommands({ SHELL: "/bin/zsh" }, "/x/hooks.json", "/x/hooks.sock");
    expect(without("shell", 4, { ...start, folder: "/w/other" }).env).toEqual({ OWLERY_PANE_ID: "4", OWLERY_HOOK_SOCKET: "/x/hooks.sock" });
  });
});

describe("setupPaneCommand", () => {
  it("runs the command a repository names whole in the user's interactive login shell, as a Claude Code pane's, with the pane's id in its environment and the runner of heavy commands where the daemon wrote one", () => {
    expect(setupPaneCommand({ SHELL: "/bin/bash" }, "pnpm install\necho 'done'\n", 6)).toEqual({ command: "/bin/bash", args: ["-l", "-i", "-c", "pnpm install\necho 'done'\n"], env: { OWLERY_PANE_ID: "6" } });
    expect(setupPaneCommand({}, "pnpm install", 7).command).toBe("/bin/zsh");
    // A repository that wants its setup to wait its turn names the runner in its `.worktreesetup`.
    expect(setupPaneCommand({ SHELL: "/bin/bash" }, '"$OWLERY_RUN" install', 8, "/x/owl-run").env).toEqual({ OWLERY_PANE_ID: "8", OWLERY_RUN: "/x/owl-run" });
  });
});
