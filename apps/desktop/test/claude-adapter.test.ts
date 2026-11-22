import { chmodSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { RoleEvent } from "../src/daemon/adapters/adapter";
import { claudeAdapter, claudeArgs, claudeEnv, ERROR_OUTPUT_CHARS, eventsForLine, KILL_AFTER_MS, LOOKUP_SCRIPT, lookupCommand, parseLookup, promptLine } from "../src/daemon/adapters/claude";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function temporaryFolder(): string {
  const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-adapter-")));
  cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
  return folder;
}

function script(folder: string, name: string, body: string): string {
  const file = join(folder, name);
  writeFileSync(file, `#!/bin/sh\n${body}\n`);
  chmodSync(file, 0o755);
  return file;
}

describe("the Claude adapter's launch", () => {
  it("passes exactly the flags that detach the session and keep the permission checks", () => {
    expect(claudeArgs("/work/tree")).toEqual([
      "-p",
      "--input-format",
      "stream-json",
      "--output-format",
      "stream-json",
      "--verbose",
      "--setting-sources",
      "",
      "--settings",
      '{"disableAllHooks":true,"autoMemoryEnabled":false}',
      "--strict-mcp-config",
      "--permission-mode",
      "default",
      "--add-dir",
      "/work/tree",
    ]);
  });

  it("turns no permission check off", () => {
    const args = claudeArgs("/work/tree");
    expect(args[args.indexOf("--permission-mode") + 1]).toBe("default");
    for (const off of ["bypassPermissions", "--dangerously-skip-permissions", "--allow-dangerously-skip-permissions", "--bare"]) expect(args).not.toContain(off);
  });

  it("gives the session five names of the environment and nothing else of the daemon's", () => {
    const daemonEnv = {
      HOME: "/Users/person",
      USER: "person",
      PATH: "/usr/bin:/bin",
      LANG: "ko_KR.UTF-8",
      SHELL: "/bin/zsh",
      CLAUDE_CODE_PLUGIN_DIRS: "/somewhere/plugins",
      CLAUDECODE: "1",
      ANTHROPIC_API_KEY: "not-passed",
      OWLERY_RUN_DIR: "/run",
    };
    expect(claudeEnv(daemonEnv, "/Users/person/.local/bin:/usr/bin")).toEqual({
      HOME: "/Users/person",
      USER: "person",
      PATH: "/Users/person/.local/bin:/usr/bin",
      LANG: "ko_KR.UTF-8",
      CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD: "1",
    });
  });

  it("gives a UTF-8 locale where the daemon inherited none", () => {
    expect(claudeEnv({ HOME: "/Users/person", USER: "person" }, "/usr/bin")).toEqual({
      HOME: "/Users/person",
      USER: "person",
      PATH: "/usr/bin",
      LANG: "en_US.UTF-8",
      CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD: "1",
    });
  });

  it("writes the prompt as one user message on one line", () => {
    const line = promptLine('Say "owl"\nand stop');
    expect(line.endsWith("\n")).toBe(true);
    expect(line.slice(0, -1)).not.toContain("\n");
    expect(JSON.parse(line)).toEqual({ type: "user", message: { role: "user", content: [{ type: "text", text: 'Say "owl"\nand stop' }] } });
  });
});

describe("finding the user's CLI", () => {
  it("asks the user's login shell, read as it is in a terminal", () => {
    expect(lookupCommand({ SHELL: "/bin/bash" })).toEqual({ command: "/bin/bash", args: ["-l", "-i", "-c", LOOKUP_SCRIPT] });
    expect(lookupCommand({}).command).toBe("/bin/zsh");
  });

  it("reads the CLI's path and the shell's PATH from between whatever else the shell printed", () => {
    const printed = "Welcome back\n\n__owlery_cli=/Users/person/.local/bin/claude\n__owlery_path=/Users/person/.local/bin:/usr/bin\nbye\n";
    expect(parseLookup(printed)).toEqual({ cli: "/Users/person/.local/bin/claude", path: "/Users/person/.local/bin:/usr/bin" });
  });

  it("finds nothing where the shell names no file: an empty answer, an alias, or no answer at all", () => {
    expect(parseLookup("\n__owlery_cli=\n__owlery_path=/usr/bin\n")).toBeUndefined();
    expect(parseLookup("\n__owlery_cli=claude\n__owlery_path=/usr/bin\n")).toBeUndefined();
    expect(parseLookup("\n__owlery_cli=/bin/claude\n")).toBeUndefined();
    expect(parseLookup("")).toBeUndefined();
  });

  it("the script it runs prints both, in a real shell", async () => {
    const folder = temporaryFolder();
    script(folder, "claude", "exit 0");
    const { execFileSync } = await import("node:child_process");
    const printed = execFileSync("/bin/sh", ["-c", LOOKUP_SCRIPT], { env: { PATH: `${folder}:/usr/bin:/bin` }, encoding: "utf8" });
    expect(parseLookup(printed)).toEqual({ cli: join(folder, "claude"), path: `${folder}:/usr/bin:/bin` });
  });
});

describe("the Claude adapter's run", () => {
  /**
   * A shell that stands for the user's login shell and names `cli` as the CLI
   * it found. It counts its own runs in a file beside it.
   */
  function fakeShell(folder: string, cli: string): { env: NodeJS.ProcessEnv; lookups: () => number } {
    const count = join(folder, "lookups");
    writeFileSync(count, "");
    const shell = script(folder, "shell", `echo x >> '${count}'\nprintf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    return { env: { SHELL: shell, HOME: folder, USER: "person", SECRET: "not-passed" }, lookups: () => readFileSync(count, "utf8").length / 2 };
  }

  /** Starts one run and gives its events once it has exited. */
  async function run(env: NodeJS.ProcessEnv, prompt: string, cwd: string): Promise<RoleEvent[]> {
    const adapter = claudeAdapter(env);
    const events: RoleEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      adapter
        .start({ prompt, cwd }, (event) => {
          events.push(event);
          if (event.type === "exit") resolve();
        })
        .catch(reject);
    });
    return events;
  }

  it("declares a name and no feature", () => {
    expect(claudeAdapter({}).name).toBe("claude");
    expect(claudeAdapter({}).features).toEqual([]);
  });

  it("launches the CLI the shell found, in the folder, with the flags, the five names and the prompt on standard input, and maps what it prints", async () => {
    const folder = temporaryFolder();
    const cwd = temporaryFolder();
    // Stands for the CLI: records how it was launched, then prints two lines of the stream.
    const cli = script(
      folder,
      "cli",
      [
        `pwd -P > '${folder}/cwd'`,
        `for a in "$@"; do printf '%s\\n' "$a"; done > '${folder}/args'`,
        `env | sort > '${folder}/env'`,
        `cat > '${folder}/stdin'`,
        `echo '{"type":"assistant","message":{"content":[{"type":"text","text":"owl"}]}}'`,
        `echo '{"type":"result","is_error":false,"result":"owl","total_cost_usd":0.5}'`,
        "exit 0",
      ].join("\n"),
    );
    const events = await run(fakeShell(folder, cli).env, "Which bird?", cwd);
    expect(events).toEqual([
      { type: "text", text: "owl" },
      { type: "result", text: "owl", isError: false, costUsd: 0.5 },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    expect(readFileSync(join(folder, "cwd"), "utf8").trim()).toBe(cwd);
    expect(readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(cwd));
    const names = readFileSync(join(folder, "env"), "utf8")
      .split("\n")
      .flatMap((line) => (line.includes("=") ? [line.slice(0, line.indexOf("="))] : []))
      // What `sh` sets for itself.
      .filter((name) => !["PWD", "SHLVL", "_", "OLDPWD"].includes(name));
    expect(names).toEqual(["CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD", "HOME", "LANG", "PATH", "USER"]);
    expect(readFileSync(join(folder, "stdin"), "utf8")).toBe(promptLine("Which bird?"));
  });

  it("asks the login shell with a pane's environment: none of what a package script or Electron gave the app, and no node_modules folder in PATH", async () => {
    const folder = temporaryFolder();
    // Stands for the login shell: records the environment it was started with, then names no CLI.
    const shell = script(folder, "shell", `env | sort > '${folder}/shell-env'`);
    const env = {
      SHELL: shell,
      HOME: folder,
      PATH: `${folder}/node_modules/.bin:/usr/bin:/bin`,
      npm_config_prefix: "/opt/prefix",
      npm_lifecycle_event: "start",
      ELECTRON_RUN_AS_NODE: "1",
      PNPM_HOME: "/opt/pnpm",
    };
    await expect(claudeAdapter(env).start({ prompt: "Q", cwd: folder }, () => {})).rejects.toThrow("claude was not found");
    const received = Object.fromEntries(
      readFileSync(join(folder, "shell-env"), "utf8")
        .split("\n")
        .flatMap((line) => (line.includes("=") ? [[line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]] : [])),
    );
    expect(received).toMatchObject({ HOME: folder, PATH: "/usr/bin:/bin", PNPM_HOME: "/opt/pnpm" });
    expect(Object.keys(received)).not.toContain("npm_config_prefix");
    expect(Object.keys(received)).not.toContain("npm_lifecycle_event");
    expect(Object.keys(received)).not.toContain("ELECTRON_RUN_AS_NODE");
  });

  it("reports the exit code of a CLI that ends without a result, and what it printed on its error stream", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", "cat > /dev/null\necho 'not json'\necho 'error: unknown option' >&2\nexit 3");
    expect(await run(fakeShell(folder, cli).env, "Q", folder)).toEqual([{ type: "exit", exitCode: 3, errorOutput: "error: unknown option\n" }]);
  });

  it("keeps the last ERROR_OUTPUT_CHARS characters of the error stream, and no half of a character at their start", async () => {
    const folder = temporaryFolder();
    const plain = script(folder, "plain", `cat > /dev/null\nprintf '%s' '${"b".repeat(3000)}end' >&2\nexit 1`);
    expect(await run(fakeShell(folder, plain).env, "Q", folder)).toEqual([{ type: "exit", exitCode: 1, errorOutput: `${"b".repeat(1997)}end` }]);
    // An a, 1,501 owls and an x are 3,004 of a string's characters, so the last 2,000 would open with the second half of an owl.
    const owls = script(folder, "owls", `cat > /dev/null\nprintf '%s' 'a${"\u{1F989}".repeat(1501)}x' >&2\nexit 1`);
    const [exit] = await run(fakeShell(folder, owls).env, "Q", folder);
    expect(exit).toEqual({ type: "exit", exitCode: 1, errorOutput: `${"\u{1F989}".repeat(999)}x` });
    expect(ERROR_OUTPUT_CHARS).toBe(2000);
  });

  it("fails to start, saying so, where the login shell finds no CLI", async () => {
    const folder = temporaryFolder();
    const { env } = fakeShell(folder, "");
    await expect(claudeAdapter(env).start({ prompt: "Q", cwd: folder }, () => {})).rejects.toThrow(`claude was not found by the login shell (${env.SHELL})`);
  });

  it("fails to start, saying so, where the login shell does not answer in time", async () => {
    const folder = temporaryFolder();
    const shell = script(folder, "shell", "exec sleep 30");
    await expect(claudeAdapter({ SHELL: shell }, { lookupTimeoutMs: 100 }).start({ prompt: "Q", cwd: folder }, () => {})).rejects.toThrow(`the login shell (${shell}) did not answer where claude is`);
  });

  it("fails to start where the folder is gone", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", "exit 0");
    await expect(claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: join(folder, "gone") }, () => {})).rejects.toThrow();
  });

  it("asks the login shell once, however many sessions start", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", "cat > /dev/null\nexit 0");
    const shell = fakeShell(folder, cli);
    const adapter = claudeAdapter(shell.env);
    const ended = () => new Promise<void>((resolve, reject) => adapter.start({ prompt: "Q", cwd: folder }, (event) => event.type === "exit" && resolve()).catch(reject));
    await Promise.all([ended(), ended()]);
    await ended();
    expect(shell.lookups()).toBe(1);
  });

  it("stops a run: the stop settles once the CLI's process has ended, and a second stop gives the same promise", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", "cat > /dev/null\nexec sleep 30");
    const events: RoleEvent[] = [];
    const started = await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder }, (event) => events.push(event));
    const stopping = started.stop();
    expect(started.stop()).toBe(stopping);
    const at = Date.now();
    await stopping;
    // The sleep ends at the signal, so no kill was needed.
    expect(Date.now() - at).toBeLessThan(KILL_AFTER_MS);
    const end = Date.now() + 5000;
    while (events.length === 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    expect(events.map((event) => event.type)).toEqual(["exit"]);
  });

  /** Whether a process of that id runs. */
  const alive = (pid: number): boolean => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };

  /** The pid a script wrote into a file, once it has; the process is killed after the case where it still runs then. */
  async function pidIn(file: string): Promise<number> {
    const end = Date.now() + 5000;
    while (!existsSync(file) || readFileSync(file, "utf8").trim() === "") {
      if (Date.now() > end) throw new Error(`no pid in ${file}`);
      await new Promise((r) => setTimeout(r, 20));
    }
    const pid = Number(readFileSync(file, "utf8").trim());
    cleanups.push(() => {
      if (alive(pid)) process.kill(pid, "SIGKILL");
    });
    return pid;
  }

  it("kills a CLI that ignores the signal KILL_AFTER_MS after it, and what the CLI started in its group with it", async () => {
    const folder = temporaryFolder();
    // An ignored signal stays ignored across `exec` and in a child started after the trap.
    const cli = script(folder, "cli", `trap '' TERM\nsleep 30 &\necho $! > '${folder}/child'\necho $$ > '${folder}/cli'\nexec sleep 30`);
    const events: RoleEvent[] = [];
    const started = await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder }, (event) => events.push(event));
    const [cliPid, childPid] = [await pidIn(join(folder, "cli")), await pidIn(join(folder, "child"))];
    const at = Date.now();
    await started.stop();
    const took = Date.now() - at;
    expect(took).toBeGreaterThanOrEqual(KILL_AFTER_MS - 50);
    expect(took).toBeLessThan(KILL_AFTER_MS + 1500);
    expect(alive(cliPid)).toBe(false);
    // The child was the shell's, and is reaped by whoever took it when the shell's process ended.
    const end = Date.now() + 2000;
    while (alive(childPid) && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    expect(alive(childPid)).toBe(false);
    expect(KILL_AFTER_MS).toBe(2000);
    const exited = Date.now() + 2000;
    while (events.length === 0 && Date.now() < exited) await new Promise((r) => setTimeout(r, 20));
    // A process ended by a signal has no code.
    expect(events).toEqual([{ type: "exit", exitCode: 1, errorOutput: "" }]);
  });

  it("reports the exit of a CLI whose child still holds its streams soon after the exit, and signals nothing once the CLI has exited", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", `cat > /dev/null\nsleep 30 &\necho $! > '${folder}/child'\necho 'gone' >&2\nexit 4`);
    const events: RoleEvent[] = [];
    const at = Date.now();
    const started = await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder }, (event) => events.push(event));
    const childPid = await pidIn(join(folder, "child"));
    const end = Date.now() + 5000;
    while (events.length === 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    expect(events).toEqual([{ type: "exit", exitCode: 4, errorOutput: "gone\n" }]);
    expect(Date.now() - at).toBeLessThan(1500);
    // The CLI's group may be gone or another's by now, so the stop signals it no more.
    await started.stop();
    await new Promise((r) => setTimeout(r, 100));
    expect(alive(childPid)).toBe(true);
  });

  it("reports nothing after the exit, though a child the CLI started prints a line on the output stream and the error stream after it", async () => {
    const folder = temporaryFolder();
    // The child ignores SIGPIPE, so it goes on to write its mark whether or not the streams are still open to it.
    const late = `{"type":"result","is_error":false,"result":"late","total_cost_usd":0}`;
    const cli = script(folder, "cli", `cat > /dev/null\n(trap '' PIPE; sleep 1; echo '${late}'; echo 'late' >&2; echo x > '${folder}/printed') &\nexit 0`);
    const events: RoleEvent[] = [];
    await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder }, (event) => events.push(event));
    const end = Date.now() + 5000;
    while (!existsSync(join(folder, "printed")) && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    expect(existsSync(join(folder, "printed"))).toBe(true);
    await new Promise((r) => setTimeout(r, 100));
    expect(events).toEqual([{ type: "exit", exitCode: 0, errorOutput: "" }]);
  });
});

describe("the output stream of a run with no login, as Claude Code 2.1.330 printed it", () => {
  const lines = readFileSync(join(__dirname, "fixtures", "claude-not-logged-in.jsonl"), "utf8").split("\n").slice(0, -1);

  it("is a recording of the init line, the synthetic message and the error result", () => {
    expect(lines.map((line) => (JSON.parse(line) as { type: string }).type)).toEqual(["system", "assistant", "result"]);
  });

  it("gives the message's text, then a result that is an error with the same text and no cost", () => {
    expect(lines.flatMap(eventsForLine)).toEqual([
      { type: "text", text: "Not logged in · Please run /login" },
      { type: "result", text: "Not logged in · Please run /login", isError: true, costUsd: 0 },
    ]);
  });
});

describe("the output stream, as one real run printed it", () => {
  const lines = readFileSync(join(__dirname, "fixtures", "claude-stream.jsonl"), "utf8").split("\n").slice(0, -1);
  const typeOf = (line: string) => (JSON.parse(line) as { type: string }).type;

  it("is a recording that holds an answer, a result, and lines that are neither", () => {
    const types = lines.map(typeOf);
    expect(types).toContain("assistant");
    expect(types.filter((type) => type === "result")).toHaveLength(1);
    expect(types).toContain("system");
    expect(types.some((type) => !["assistant", "result", "system"].includes(type))).toBe(true);
  });

  it("gives the answer's text, then the result with the whole answer and the cost", () => {
    const events = lines.flatMap(eventsForLine);
    const texts = events.flatMap((event) => (event.type === "text" ? [event.text] : []));
    expect(texts.join("")).toMatch(/^owl\.?$/i);
    const last = events.at(-1);
    expect(last).toEqual({ type: "result", text: texts.join(""), isError: false, costUsd: expect.any(Number) });
    expect(events).toHaveLength(texts.length + 1);
  });

  it("drops every line that is neither the answer's text nor the result", () => {
    for (const line of lines) {
      const type = typeOf(line);
      if (type !== "assistant" && type !== "result") expect(eventsForLine(line), type).toEqual([]);
    }
  });

  it("drops a line that is not JSON, or is JSON of another shape", () => {
    for (const line of ["", "not json", "[]", "null", "7", '{"type":"assistant"}', '{"type":"assistant","message":{"content":"owl"}}']) expect(eventsForLine(line), line).toEqual([]);
  });

  it("maps a result that is an error, and one without a cost", () => {
    expect(eventsForLine('{"type":"result","is_error":true,"result":"Not logged in"}')).toEqual([{ type: "result", text: "Not logged in", isError: true, costUsd: null }]);
    expect(eventsForLine('{"type":"result","is_error":false}')).toEqual([{ type: "result", text: "", isError: false, costUsd: null }]);
  });

  it("maps each text block of a message, and no block of another kind", () => {
    const line = JSON.stringify({ type: "assistant", message: { content: [{ type: "thinking", thinking: "hm" }, { type: "text", text: "a" }, { type: "tool_use", name: "Bash" }, { type: "other", text: "not the answer" }, { type: "text", text: "b" }, { type: "text", text: "" }] } });
    expect(eventsForLine(line)).toEqual([
      { type: "text", text: "a" },
      { type: "text", text: "b" },
    ]);
  });
});
