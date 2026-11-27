import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { RoleEvent, RoleRun } from "../src/daemon/adapters/adapter";
import { claudeAdapter, claudeArgs, claudeEnv, ERROR_OUTPUT_CHARS, eventsForLine, INITIALIZE_LINE, KILL_AFTER_MS, LOOKUP_SCRIPT, lookupCommand, MIN_CLAUDE_VERSION, parseLookup, PERMISSION_CUT_MARK, PERMISSION_TEXT_CHARS, promptLine, roleCheck, sessionOf, versionNotice } from "../src/daemon/adapters/claude";
import { agentOf, roleDocuments, rulesFileName, rulesHead, rulesText, toolsOf } from "../src/daemon/adapters/claude-roles";
import { ROLE_STAGES, type RoleStage } from "../src/shared/protocol";

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
  it("passes exactly the flags that detach the session, keep the permission checks and bring each request to the session's own streams, and gives a refresh of an account's usage no tool at all, one turn and no transcript (scenario 15)", () => {
    expect(claudeArgs("/work/tree", "refresh")).toEqual([
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
      "--permission-prompt-tool",
      "stdio",
      "--tools",
      "",
      "--max-turns",
      "1",
      "--no-session-persistence",
      "--add-dir",
      "/work/tree",
    ]);
  });

  it("gives a crafter's launch the sandbox of its commands in the one settings value: on, never left, still asked, writing in the worktree and the git folder less that folder's hooks and config and the bundle, and reaching no host but the loopback (scenario 1 of #127)", () => {
    const role = { bundleDir: "/app/dist/bundle", agent: "owlery:crafter", rulesFile: "/run/roles/crafter-fix-pass.md", tools: ["Read", "Glob", "Grep", "Bash", "Edit", "Write"], sandbox: { allowWrite: ["/work/tree", "/repo/.git"], denyWrite: ["/repo/.git/hooks", "/repo/.git/config", "/app/dist/bundle"] }, scratch: null };
    const args = claudeArgs("/work/tree", role);
    expect(args.filter((arg) => arg === "--settings")).toHaveLength(1);
    expect(args[args.indexOf("--settings") + 1]).toBe(
      '{"disableAllHooks":true,"autoMemoryEnabled":false,"sandbox":{"enabled":true,"failIfUnavailable":true,"allowUnsandboxedCommands":false,"autoAllowBashIfSandboxed":false,"filesystem":{"allowWrite":["/work/tree","/repo/.git"],"denyWrite":["/repo/.git/hooks","/repo/.git/config","/app/dist/bundle"]},"network":{"strictAllowlist":true,"allowedDomains":[],"allowLocalBinding":true}}}',
    );
    expect(args.slice(args.indexOf("--add-dir"))).toEqual(["--add-dir", "/work/tree", "/app/dist/bundle"]);
  });

  it("gives a proofer's launch the scratch folder as the one place its commands write, refuses them the worktree and the bundle, and adds the folder after the bundle's (scenario 2 of #127)", () => {
    const role = { bundleDir: "/app/dist/bundle", agent: "owlery:proofer", rulesFile: "/run/roles/proofer-round.md", tools: ["Read", "Glob", "Grep", "Bash"], sandbox: { allowWrite: ["/run/scratch/3"], denyWrite: ["/work/tree", "/app/dist/bundle"] }, scratch: "/run/scratch/3" };
    const args = claudeArgs("/work/tree", role);
    expect(JSON.parse(args[args.indexOf("--settings") + 1]!)).toMatchObject({ sandbox: { filesystem: { allowWrite: ["/run/scratch/3"], denyWrite: ["/work/tree", "/app/dist/bundle"] } } });
    expect(args.slice(args.indexOf("--add-dir"))).toEqual(["--add-dir", "/work/tree", "/app/dist/bundle", "/run/scratch/3"]);
  });

  it("gives a role launch the role's tools as one value, then the bundle, the role's agent and the rules file, and the bundle's folder after the worktree, and nothing else", () => {
    const role = { bundleDir: "/app/dist/bundle", agent: "owlery:proofer", rulesFile: "/run/roles/proofer-round.md", tools: ["Read", "Glob", "Grep", "Bash"], sandbox: { allowWrite: [], denyWrite: ["/work/tree", "/app/dist/bundle"] }, scratch: null };
    expect(claudeArgs("/work/tree", role)).toEqual([
      "-p",
      "--input-format",
      "stream-json",
      "--output-format",
      "stream-json",
      "--verbose",
      "--setting-sources",
      "",
      "--settings",
      '{"disableAllHooks":true,"autoMemoryEnabled":false,"sandbox":{"enabled":true,"failIfUnavailable":true,"allowUnsandboxedCommands":false,"autoAllowBashIfSandboxed":false,"filesystem":{"allowWrite":[],"denyWrite":["/work/tree","/app/dist/bundle"]},"network":{"strictAllowlist":true,"allowedDomains":[],"allowLocalBinding":true}}}',
      "--strict-mcp-config",
      "--permission-mode",
      "default",
      "--permission-prompt-tool",
      "stdio",
      "--tools",
      "Read,Glob,Grep,Bash",
      "--plugin-dir",
      "/app/dist/bundle",
      "--agent",
      "owlery:proofer",
      "--append-system-prompt-file",
      "/run/roles/proofer-round.md",
      "--add-dir",
      "/work/tree",
      "/app/dist/bundle",
    ]);
  });

  it("turns no permission check off, for a refresh and for each role: the mode is default, and no other mode and no option that skips a check is named", () => {
    const launches = [claudeArgs("/work/tree", "refresh"), ...ROLE_STAGES.map((pair) => claudeArgs("/work/tree", { bundleDir: "/bundle", agent: agentOf(pair), rulesFile: "/rules.md", tools: toolsOf(pair), sandbox: { allowWrite: [], denyWrite: ["/bundle"] }, scratch: null }))];
    expect(launches).toHaveLength(5);
    for (const args of launches) {
      expect(args.filter((arg) => arg === "--permission-mode")).toHaveLength(1);
      expect(args[args.indexOf("--permission-mode") + 1]).toBe("default");
      for (const off of ["bypassPermissions", "acceptEdits", "auto", "dontAsk", "--dangerously-skip-permissions", "--allow-dangerously-skip-permissions", "--bare", "--permission-prompts"]) expect(args, off).not.toContain(off);
    }
  });

  it("gives a session under System default, where the login shell holds no config folder, five names of the environment and nothing else of the daemon's, the daemon's own config folder neither", () => {
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
      CLAUDE_CONFIG_DIR: "/Users/person/.claude-of-the-daemon",
    };
    const five = {
      HOME: "/Users/person",
      USER: "person",
      PATH: "/Users/person/.local/bin:/usr/bin",
      LANG: "ko_KR.UTF-8",
      CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD: "1",
    };
    expect(claudeEnv(daemonEnv, "/Users/person/.local/bin:/usr/bin")).toEqual(five);
    expect(claudeEnv(daemonEnv, "/Users/person/.local/bin:/usr/bin", null)).toEqual(five);
    expect(claudeEnv(daemonEnv, "/Users/person/.local/bin:/usr/bin", "")).toEqual(five);
  });

  it("gives a session the config folder it is given, an account's or the login shell's, as CLAUDE_CONFIG_DIR beside the five names", () => {
    expect(claudeEnv({ HOME: "/Users/person", USER: "person", LANG: "ko_KR.UTF-8", CLAUDE_CONFIG_DIR: "/elsewhere" }, "/usr/bin", "/Users/person/accounts/work")).toEqual({
      HOME: "/Users/person",
      USER: "person",
      PATH: "/usr/bin",
      LANG: "ko_KR.UTF-8",
      CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD: "1",
      CLAUDE_CONFIG_DIR: "/Users/person/accounts/work",
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

  it("reads the CLI's path, the shell's PATH and the shell's config folder from between whatever else the shell printed, and no config folder where the shell holds none or printed no such line", () => {
    const printed = "Welcome back\n\n__owlery_cli=/Users/person/.local/bin/claude\n__owlery_path=/Users/person/.local/bin:/usr/bin\n__owlery_config=/Users/person/.claude-work\nbye\n";
    expect(parseLookup(printed)).toEqual({ cli: "/Users/person/.local/bin/claude", path: "/Users/person/.local/bin:/usr/bin", configDir: "/Users/person/.claude-work" });
    expect(parseLookup("\n__owlery_cli=/bin/claude\n__owlery_path=/usr/bin\n__owlery_config=\n")).toEqual({ cli: "/bin/claude", path: "/usr/bin", configDir: null });
    expect(parseLookup("\n__owlery_cli=/bin/claude\n__owlery_path=/usr/bin\n")).toEqual({ cli: "/bin/claude", path: "/usr/bin", configDir: null });
  });

  it("finds nothing where the shell names no file: an empty answer, an alias, or no answer at all", () => {
    expect(parseLookup("\n__owlery_cli=\n__owlery_path=/usr/bin\n")).toBeUndefined();
    expect(parseLookup("\n__owlery_cli=claude\n__owlery_path=/usr/bin\n")).toBeUndefined();
    expect(parseLookup("\n__owlery_cli=/bin/claude\n")).toBeUndefined();
    expect(parseLookup("")).toBeUndefined();
  });

  it("the script it runs prints the three, in a real shell, and an empty config folder where the shell holds none", async () => {
    const folder = temporaryFolder();
    script(folder, "claude", "exit 0");
    const { execFileSync } = await import("node:child_process");
    const printed = execFileSync("/bin/sh", ["-c", LOOKUP_SCRIPT], { env: { PATH: `${folder}:/usr/bin:/bin` }, encoding: "utf8" });
    expect(parseLookup(printed)).toEqual({ cli: join(folder, "claude"), path: `${folder}:/usr/bin:/bin`, configDir: null });
    const configured = execFileSync("/bin/sh", ["-u", "-c", LOOKUP_SCRIPT], { env: { PATH: `${folder}:/usr/bin:/bin`, CLAUDE_CONFIG_DIR: "/Users/person/.claude-work" }, encoding: "utf8" });
    expect(parseLookup(configured)?.configDir).toBe("/Users/person/.claude-work");
    // A shell that refuses an unset name still prints the lines.
    expect(parseLookup(execFileSync("/bin/sh", ["-u", "-c", LOOKUP_SCRIPT], { env: { PATH: `${folder}:/usr/bin:/bin` }, encoding: "utf8" }))?.configDir).toBeNull();
  });
});

describe("the Claude adapter's run", () => {
  /**
   * A shell that stands for the user's login shell and names `cli` as the CLI
   * it found. It counts its own runs in a file beside it.
   */
  function fakeShell(folder: string, cli: string, configDir = ""): { env: NodeJS.ProcessEnv; lookups: () => number } {
    const count = join(folder, "lookups");
    writeFileSync(count, "");
    const shell = script(folder, "shell", `echo x >> '${count}'\nprintf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '${cli}' '/usr/bin:/bin' '${configDir}'`);
    return { env: { SHELL: shell, HOME: folder, USER: "person", SECRET: "not-passed" }, lookups: () => readFileSync(count, "utf8").length / 2 };
  }

  /** Starts one run, as the launch that takes no role, a refresh, under the account's folder where one is given, and gives its events once it has exited. */
  async function run(env: NodeJS.ProcessEnv, prompt: string, cwd: string, accountDir?: string): Promise<RoleEvent[]> {
    const adapter = claudeAdapter(env);
    const events: RoleEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      adapter
        .start({ prompt, cwd, refresh: true, ...(accountDir === undefined ? {} : { accountDir }) }, (event) => {
          events.push(event);
          if (event.type === "exit") resolve();
        })
        .catch(reject);
    });
    return events;
  }

  it("declares its name and the four features: it sets a session's tools by its role, it reports permission requests and takes their answers, it launches a session under an account's folder, and it starts the refresh of an account's usage", () => {
    expect(claudeAdapter({}).name).toBe("claude");
    expect(claudeAdapter({}).features).toEqual(["role-tools", "permission-requests", "accounts", "limit-refresh"]);
  });

  it("launches a refresh with the arguments of a refresh under the account's folder, and reports the limit its stream hands over before its result (scenario 15)", async () => {
    const folder = temporaryFolder();
    const cwd = temporaryFolder();
    const account = temporaryFolder();
    const cli = script(
      folder,
      "cli",
      [
        `for a in "$@"; do printf '%s\\n' "$a"; done > '${folder}/args'`,
        `env | sort > '${folder}/env'`,
        `echo '{"type":"rate_limit_event","rate_limit_info":{"status":"allowed","resetsAt":1800000000,"rateLimitType":"five_hour","utilization":0.3}}'`,
        `echo '{"type":"result","is_error":false,"result":"OK","total_cost_usd":0.002}'`,
        "cat > /dev/null",
        "exit 0",
      ].join("\n"),
    );
    const adapter = claudeAdapter(fakeShell(folder, cli).env);
    const events: RoleEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      adapter
        .start({ prompt: "Reply with the single word OK.", cwd, accountDir: account, refresh: true }, (event) => {
          events.push(event);
          if (event.type === "exit") resolve();
        })
        .catch(reject);
    });
    expect(readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(cwd, "refresh"));
    expect(readFileSync(join(folder, "env"), "utf8").split("\n")).toContain(`CLAUDE_CONFIG_DIR=${account}`);
    expect(events).toEqual([
      { type: "limit", status: "ok", used: 0.3, resetsAt: 1_800_000_000_000, window: "five_hour" },
      { type: "result", text: "OK", isError: false, usage: { costUsd: 0.002, converted: true, models: [] } },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
  });

  it("launches the CLI with the account's folder as CLAUDE_CONFIG_DIR where it is given one, over the login shell's, with the login shell's where it is given none, and with no such name where the shell holds none either (the role session's half of scenario 3)", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", [`env | sort > '${folder}/env'`, `echo '{"type":"result","is_error":false,"result":"owl"}'`, "cat > /dev/null", "exit 0"].join("\n"));
    const configOf = (): string | undefined => readFileSync(join(folder, "env"), "utf8").split("\n").find((line) => line.startsWith("CLAUDE_CONFIG_DIR="))?.slice("CLAUDE_CONFIG_DIR=".length);
    const shellHolds = fakeShell(folder, cli, "/Users/person/.claude-of-the-shell").env;
    await run(shellHolds, "Q", folder, "/Users/person/accounts/work");
    expect(configOf()).toBe("/Users/person/accounts/work");
    await run(shellHolds, "Q", folder);
    expect(configOf()).toBe("/Users/person/.claude-of-the-shell");
    await run({ ...fakeShell(folder, cli).env, CLAUDE_CONFIG_DIR: "/Users/person/.claude-of-the-daemon" }, "Q", folder);
    expect(configOf()).toBeUndefined();
  });

  it("answers which folder the default login lives in from its lookup: none before the lookup answered and after one that failed, the folder the login shell names, and .claude of the home where the shell names none, whatever the daemon's own environment names", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", "exit 0");
    const named = claudeAdapter({ ...fakeShell(folder, cli, "/Users/person/.claude-of-the-shell").env, CLAUDE_CONFIG_DIR: "/Users/person/.claude-of-the-daemon" });
    expect(named.defaultLoginFolder?.()).toBeNull();
    // The notice asks the lookup, as the daemon does at its start.
    await named.notice();
    expect(named.defaultLoginFolder?.()).toBe("/Users/person/.claude-of-the-shell");
    const unnamed = claudeAdapter({ ...fakeShell(folder, cli).env, CLAUDE_CONFIG_DIR: "/Users/person/.claude-of-the-daemon" });
    await unnamed.notice();
    expect(unnamed.defaultLoginFolder?.()).toBe(join(folder, ".claude"));
    const lost = claudeAdapter({ SHELL: script(folder, "lost", "exit 1"), HOME: folder, CLAUDE_CONFIG_DIR: "/Users/person/.claude-of-the-daemon" });
    await lost.notice();
    expect(lost.defaultLoginFolder?.()).toBeNull();
  });

  it("signs an account's folder in and out and reads its login through the CLI its lookup found, under a session's environment with the folder as CLAUDE_CONFIG_DIR, and links the person's names only once the lookup has answered", async () => {
    const folder = temporaryFolder();
    const own = join(folder, "own");
    mkdirSync(own);
    writeFileSync(join(own, "settings.json"), "{}\n");
    const account = join(folder, "account");
    mkdirSync(account);
    const cli = join(folder, "claude");
    writeFileSync(cli, readFileSync(join(__dirname, "fixtures", "claude-auth-stand-in", "claude")));
    chmodSync(cli, 0o755);
    const adapter = claudeAdapter(fakeShell(folder, cli, own).env);
    adapter.logins?.furnish(account);
    expect(readdirSync(account)).toEqual([]);
    expect(await adapter.logins?.signIn(account)).toEqual({ command: cli, args: ["auth", "login"], env: { HOME: folder, USER: "person", PATH: "/usr/bin:/bin", LANG: "en_US.UTF-8", CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD: "1", CLAUDE_CONFIG_DIR: account } });
    adapter.logins?.furnish(account);
    expect(readdirSync(account)).toEqual(["settings.json"]);
    expect(await adapter.logins?.status(account)).toEqual({ signedIn: false, loginEndsAt: null, name: null });
    await adapter.logins?.signOut(account);
    expect(readFileSync(join(folder, "calls"), "utf8")).toBe(`auth status|${account}\nauth logout|${account}\n`);
  });

  it("launches the CLI the shell found, in the folder, with the flags and the five names, writes the handshake and then the prompt on standard input, ends the input at the result, and maps what it prints", async () => {
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
        `echo '{"type":"assistant","message":{"content":[{"type":"text","text":"owl"}]}}'`,
        `echo '{"type":"result","is_error":false,"result":"owl","total_cost_usd":0.5}'`,
        // It exits only at the end of its input, as a session whose host answers its requests does.
        `cat > '${folder}/stdin'`,
        "exit 0",
      ].join("\n"),
    );
    const events = await run(fakeShell(folder, cli).env, "Which bird?", cwd);
    expect(events).toEqual([
      { type: "text", text: "owl" },
      { type: "result", text: "owl", isError: false, usage: { costUsd: 0.5, converted: true, models: [] } },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    expect(readFileSync(join(folder, "cwd"), "utf8").trim()).toBe(cwd);
    expect(readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(cwd, "refresh"));
    const names = readFileSync(join(folder, "env"), "utf8")
      .split("\n")
      .flatMap((line) => (line.includes("=") ? [line.slice(0, line.indexOf("="))] : []))
      // What `sh` sets for itself.
      .filter((name) => !["PWD", "SHLVL", "_", "OLDPWD"].includes(name));
    expect(names).toEqual(["CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD", "HOME", "LANG", "PATH", "USER"]);
    // The handshake on the first line, the prompt on the second, and then the end of the input, which the result brought.
    expect(readFileSync(join(folder, "stdin"), "utf8")).toBe(`${INITIALIZE_LINE}${promptLine("Which bird?")}`);
    expect(JSON.parse(INITIALIZE_LINE)).toEqual({ type: "control_request", request_id: "owlery-initialize", request: { subtype: "initialize" } });
    expect(INITIALIZE_LINE.endsWith("\n")).toBe(true);
  });

  it.each([
    ["names the key of the environment", "ANTHROPIC_API_KEY", false],
    ["names a key helper", "apiKeyHelper", false],
    ["names the key a login manages", "/login managed key", false],
    ["names no key, as a subscription login does", "none", true],
    ["names a login the adapter does not know", "a login of another kind", true],
    ["names the login by no string", 7, true],
    ["is not there", undefined, true],
  ])("marks the turn's cost as a charge only where the stream's init line names a key: an init line that %s (%s) gives converted %s", async (_, source, converted) => {
    const folder = temporaryFolder();
    const init = JSON.stringify({ type: "system", subtype: "init", ...(source === undefined ? {} : { apiKeySource: source }) });
    const result = JSON.stringify({ type: "result", is_error: false, result: "owl", total_cost_usd: 0.5, modelUsage: { "owl-1": { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 3, cacheCreationInputTokens: 4, costUSD: 0.5 } } });
    const cli = script(folder, "cli", [`echo '${init}'`, `echo '${result}'`, "cat > /dev/null", "exit 0"].join("\n"));
    const events = await run(fakeShell(folder, cli).env, "Q", folder);
    expect(events.at(-2)).toEqual({ type: "result", text: "owl", isError: false, usage: { costUsd: 0.5, converted, models: [{ model: "owl-1", inputTokens: 1, outputTokens: 2, cacheReadTokens: 3, cacheWriteTokens: 4, costUsd: 0.5 }] } });
  });

  it("marks the cost as converted where the result came before any init line, and where a later init line names a key after the first named none", async () => {
    const folder = temporaryFolder();
    const keyed = '{"type":"system","subtype":"init","apiKeySource":"ANTHROPIC_API_KEY"}';
    const unkeyed = '{"type":"system","subtype":"init","apiKeySource":"none"}';
    const result = '{"type":"result","is_error":false,"result":"owl","total_cost_usd":0.5}';
    const early = script(folder, "early", [`echo '${result}'`, `echo '${keyed}'`, "cat > /dev/null", "exit 0"].join("\n"));
    expect((await run(fakeShell(folder, early).env, "Q", folder)).at(-2)).toMatchObject({ type: "result", usage: { converted: true } });
    const twice = script(folder, "twice", [`echo '${unkeyed}'`, `echo '${keyed}'`, `echo '${result}'`, "cat > /dev/null", "exit 0"].join("\n"));
    expect((await run(fakeShell(folder, twice).env, "Q", folder)).at(-2)).toMatchObject({ type: "result", usage: { converted: true } });
  });

  it("reports the session's own id and its model once, before the session's first text, from the first init line of a launch that names no role's agent: a later init line names nothing, and a first one with no id leaves the session unnamed", async () => {
    const folder = temporaryFolder();
    const init = (fields: object): string => JSON.stringify({ type: "system", subtype: "init", ...fields });
    const answer = '{"type":"assistant","message":{"content":[{"type":"text","text":"owl"}]}}';
    const result = '{"type":"result","is_error":false,"result":"owl"}';
    const printing = (name: string, lines: string[]): string => script(folder, name, [...lines.map((line) => `echo '${line}'`), "cat > /dev/null", "exit 0"].join("\n"));
    const answered: RoleEvent[] = [
      { type: "text", text: "owl" },
      { type: "result", text: "owl", isError: false, usage: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ];

    const named = printing("named", [init({ session_id: "s-1", model: "owl-large" }), init({ session_id: "s-2", model: "owl-small" }), answer, result]);
    expect(await run(fakeShell(folder, named).env, "Q", folder)).toEqual([{ type: "session", id: "s-1", model: "owl-large" }, ...answered]);
    const unnamed = printing("unnamed", [init({ model: "owl-large" }), init({ session_id: "s-2", model: "owl-small" }), answer, result]);
    expect(await run(fakeShell(folder, unnamed).env, "Q", folder)).toEqual(answered);
    const late = printing("late", [answer, init({ session_id: "s-1" }), result]);
    expect((await run(fakeShell(folder, late).env, "Q", folder)).map((event) => event.type)).toEqual(["text", "session", "result", "exit"]);
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
    await expect(claudeAdapter(env).start({ prompt: "Q", cwd: folder, refresh: true }, () => {})).rejects.toThrow("claude was not found");
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
    const cli = script(folder, "cli", "echo 'not json'\necho 'error: unknown option' >&2\nexit 3");
    expect(await run(fakeShell(folder, cli).env, "Q", folder)).toEqual([{ type: "exit", exitCode: 3, errorOutput: "error: unknown option\n" }]);
  });

  it("keeps the last ERROR_OUTPUT_CHARS characters of the error stream, and no half of a character at their start", async () => {
    const folder = temporaryFolder();
    const plain = script(folder, "plain", `printf '%s' '${"b".repeat(3000)}end' >&2\nexit 1`);
    expect(await run(fakeShell(folder, plain).env, "Q", folder)).toEqual([{ type: "exit", exitCode: 1, errorOutput: `${"b".repeat(1997)}end` }]);
    // An a, 1,501 owls and an x are 3,004 of a string's characters, so the last 2,000 would open with the second half of an owl.
    const owls = script(folder, "owls", `printf '%s' 'a${"\u{1F989}".repeat(1501)}x' >&2\nexit 1`);
    const [exit] = await run(fakeShell(folder, owls).env, "Q", folder);
    expect(exit).toEqual({ type: "exit", exitCode: 1, errorOutput: `${"\u{1F989}".repeat(999)}x` });
    expect(ERROR_OUTPUT_CHARS).toBe(2000);
  });

  it("fails to start, saying so, where the login shell finds no CLI", async () => {
    const folder = temporaryFolder();
    const { env } = fakeShell(folder, "");
    await expect(claudeAdapter(env).start({ prompt: "Q", cwd: folder, refresh: true }, () => {})).rejects.toThrow(`claude was not found by the login shell (${env.SHELL})`);
  });

  it("fails to start, saying so, where the login shell does not answer in time", async () => {
    const folder = temporaryFolder();
    const shell = script(folder, "shell", "exec sleep 30");
    await expect(claudeAdapter({ SHELL: shell }, { lookupTimeoutMs: 100 }).start({ prompt: "Q", cwd: folder, refresh: true }, () => {})).rejects.toThrow(`the login shell (${shell}) did not answer where claude is`);
  });

  it("fails to start where the folder is gone", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", "exit 0");
    await expect(claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: join(folder, "gone"), refresh: true }, () => {})).rejects.toThrow();
  });

  it("asks the login shell once, however many sessions start", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", "exit 0");
    const shell = fakeShell(folder, cli);
    const adapter = claudeAdapter(shell.env);
    const ended = () => new Promise<void>((resolve, reject) => adapter.start({ prompt: "Q", cwd: folder, refresh: true }, (event) => event.type === "exit" && resolve()).catch(reject));
    await Promise.all([ended(), ended()]);
    await ended();
    expect(shell.lookups()).toBe(1);
  });

  it("stops a run: the stop settles once the CLI's process has ended, and a second stop gives the same promise", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", "exec sleep 30");
    const events: RoleEvent[] = [];
    const started = await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder, refresh: true }, (event) => events.push(event));
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
    const started = await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder, refresh: true }, (event) => events.push(event));
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
    const cli = script(folder, "cli", `sleep 30 &\necho $! > '${folder}/child'\necho 'gone' >&2\nexit 4`);
    const events: RoleEvent[] = [];
    const at = Date.now();
    const started = await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder, refresh: true }, (event) => events.push(event));
    const childPid = await pidIn(join(folder, "child"));
    const end = Date.now() + 10_000;
    while (events.length === 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    expect(events).toEqual([{ type: "exit", exitCode: 4, errorOutput: "gone\n" }]);
    // The child holds the streams for 30 seconds, so an exit reported within 10 is one that did not wait for it.
    expect(Date.now() - at).toBeLessThan(10_000);
    // The CLI's group may be gone or another's by now, so the stop signals it no more.
    await started.stop();
    await new Promise((r) => setTimeout(r, 100));
    expect(alive(childPid)).toBe(true);
  });

  it("reports nothing after the exit, and closes both streams to a child the CLI started, so what the child prints later fails to reach the run", async () => {
    const folder = temporaryFolder();
    // The child ignores SIGPIPE, so it goes on to write how each of its two writes ended, 0 where the stream was still open to it.
    const late = `{"type":"result","is_error":false,"result":"late","total_cost_usd":0}`;
    const cli = script(folder, "cli", `(trap '' PIPE; sleep 1; echo '${late}'; out=$?; echo 'late' >&2; err=$?; echo "$out $err" > '${folder}/printed') &\nexit 0`);
    const events: RoleEvent[] = [];
    await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder, refresh: true }, (event) => events.push(event));
    const printed = join(folder, "printed");
    const end = Date.now() + 5000;
    while ((!existsSync(printed) || readFileSync(printed, "utf8").trim() === "") && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    const [out, err] = readFileSync(printed, "utf8").trim().split(" ");
    expect([out === "0", err === "0"]).toEqual([false, false]);
    await new Promise((r) => setTimeout(r, 100));
    expect(events).toEqual([{ type: "exit", exitCode: 0, errorOutput: "" }]);
  });

  describe("the notice of an old CLI", () => {
    const older = (found: string): string => `Claude Code ${found} is older than 2.1.329, the oldest version Owlery's role sessions were checked on. Run "claude update" in a terminal.`;
    /** A CLI that prints `printed` where its one argument is `--version`, and records how it was run. */
    const versionCli = (folder: string, printed: string): string =>
      script(folder, "cli", [`for a in "$@"; do printf '%s\\n' "$a"; done > '${folder}/args'`, `env | sort > '${folder}/env'`, `[ "$*" = "--version" ] && printf '%s\\n' '${printed}'`, "exit 0"].join("\n"));

    it("names 2.1.329 as the oldest version checked, the oldest a run showed the sandbox on, and says of an older one which was found and what to run", () => {
      expect(MIN_CLAUDE_VERSION).toBe("2.1.329");
      for (const found of ["2.1.328", "2.1.326", "2.1.300", "2.1.99", "2.0.999", "1.99.999"]) expect(versionNotice(`${found} (Claude Code)`), found).toBe(older(found));
    });

    it("says nothing of the oldest version checked or a newer one, each number compared as a number", () => {
      for (const found of ["2.1.329", "2.1.332", "2.1.1000", "2.2.0", "2.10.0", "3.0.0", "10.0.0"]) expect(versionNotice(`${found} (Claude Code)`), found).toBeNull();
    });

    it("reads the first three numbers joined by dots out of what the CLI printed, and says nothing where it printed none", () => {
      expect(versionNotice("a warning of 1 line\nv2.1.300-beta.4 (Claude Code)\n")).toBe(older("2.1.300"));
      for (const printed of ["", "Claude Code", "2.1", "2.1.x"]) expect(versionNotice(printed), printed).toBeNull();
    });

    it("runs the CLI the shell found with --version alone and a session's five names, and names an older version it printed", async () => {
      const folder = temporaryFolder();
      const cli = versionCli(folder, "2.1.300 (Claude Code)");
      expect(await claudeAdapter(fakeShell(folder, cli).env).notice()).toBe(older("2.1.300"));
      expect(readFileSync(join(folder, "args"), "utf8")).toBe("--version\n");
      const names = readFileSync(join(folder, "env"), "utf8")
        .split("\n")
        .flatMap((line) => (line.includes("=") ? [line.slice(0, line.indexOf("="))] : []))
        // What `sh` sets for itself.
        .filter((name) => !["PWD", "SHLVL", "_", "OLDPWD"].includes(name));
      expect(names).toEqual(["CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD", "HOME", "LANG", "PATH", "USER"]);
    });

    it("has no notice for a CLI that prints 2.1.329, 2.2.0 or 2.10.0", async () => {
      for (const found of ["2.1.329", "2.2.0", "2.10.0"]) {
        const folder = temporaryFolder();
        const adapter = claudeAdapter(fakeShell(folder, versionCli(folder, `${found} (Claude Code)`)).env);
        expect(await adapter.notice(), found).toBeNull();
        // The CLI was asked: the answer is its version's and not a failed run's.
        expect(readFileSync(join(folder, "args"), "utf8"), found).toBe("--version\n");
      }
    });

    it("reads the version a CLI printed though the CLI then exits with a failure", async () => {
      const folder = temporaryFolder();
      const cli = script(folder, "cli", "echo '2.1.300 (Claude Code)'\nexit 3");
      expect(await claudeAdapter(fakeShell(folder, cli).env).notice()).toBe(older("2.1.300"));
    });

    it("has no notice, and rejects nothing, where no CLI is found, where the login shell does not answer, where the CLI prints no version, and where the CLI does not answer in time", async () => {
      const folder = temporaryFolder();
      expect(await claudeAdapter(fakeShell(folder, "").env).notice()).toBeNull();
      const silent = script(folder, "silent-shell", "exec sleep 30");
      expect(await claudeAdapter({ SHELL: silent }, { lookupTimeoutMs: 100 }).notice()).toBeNull();
      expect(await claudeAdapter(fakeShell(folder, script(folder, "wordy", "echo 'Claude Code'")).env).notice()).toBeNull();
      expect(await claudeAdapter(fakeShell(folder, script(folder, "failing", "echo 'error: unknown option' >&2\nexit 1")).env).notice()).toBeNull();
      const started = Date.now();
      expect(await claudeAdapter(fakeShell(folder, script(folder, "hanging", "exec sleep 30")).env, { lookupTimeoutMs: 1000 }).notice()).toBeNull();
      expect(Date.now() - started).toBeLessThan(10_000);
    });

    it("runs the CLI again at each call, so the notice goes once the person updated, and asks the login shell once for the notices and the sessions together", async () => {
      const folder = temporaryFolder();
      const version = join(folder, "version");
      writeFileSync(version, "2.1.300 (Claude Code)\n");
      const cli = script(folder, "cli", `if [ "$1" = "--version" ]; then cat '${version}'; exit 0; fi\nexit 0`);
      const shell = fakeShell(folder, cli);
      const adapter = claudeAdapter(shell.env);
      expect(await adapter.notice()).toBe(older("2.1.300"));
      writeFileSync(version, "2.1.329 (Claude Code)\n");
      expect(await adapter.notice()).toBeNull();
      await new Promise<void>((resolve, reject) => adapter.start({ prompt: "Q", cwd: folder, refresh: true }, (event) => event.type === "exit" && resolve()).catch(reject));
      expect(shell.lookups()).toBe(1);
    });

    it("asks the login shell again for a session after a notice whose lookup found no CLI", async () => {
      const folder = temporaryFolder();
      const shell = fakeShell(folder, "");
      const adapter = claudeAdapter(shell.env);
      expect(await adapter.notice()).toBeNull();
      await expect(adapter.start({ prompt: "Q", cwd: folder, refresh: true }, () => {})).rejects.toThrow(`claude was not found by the login shell (${shell.env.SHELL})`);
      expect(shell.lookups()).toBe(2);
    });
  });
});

/** A folder that stands for the role bundle: each document a rules file can hold, with a frontmatter and a body that names it. */
function scratchBundle(folder: string): string {
  const bundle = join(folder, "bundle");
  for (const document of new Set(ROLE_STAGES.flatMap(roleDocuments))) {
    mkdirSync(dirname(join(bundle, document)), { recursive: true });
    writeFileSync(join(bundle, document), `---\nname: taken\ndescription: |\n  Read by the harness.\n---\n\n# The body of ${document}\n\n---\n\nIts last line.\n`);
  }
  return bundle;
}

describe("a role's rules file", () => {
  const PROOFER: RoleStage = { role: "proofer", stage: "round" };

  it("names each role's agent as the bundle's plugin names it, and its file by the role and the stage", () => {
    expect(ROLE_STAGES.map(agentOf)).toEqual(["owlery:proofer", "owlery:crafter", "owlery:sealer", "owlery:orchestrator"]);
    expect(ROLE_STAGES.map(rulesFileName)).toEqual(["proofer-round.md", "crafter-fix-pass.md", "sealer-seal.md", "orchestrator-judgment.md"]);
  });

  it("holds the core and the agent contract for every pair, then the documents the role opens first at its stage", () => {
    expect(ROLE_STAGES.map((pair) => [pair.role, roleDocuments(pair)])).toEqual([
      ["proofer", ["skills/core/SKILL.md", "skills/agent-contract/SKILL.md", "skills/code-review/SKILL.md"]],
      ["crafter", ["skills/core/SKILL.md", "skills/agent-contract/SKILL.md", "skills/implement/SKILL.md", "skills/implement/fix-pass.md"]],
      ["sealer", ["skills/core/SKILL.md", "skills/agent-contract/SKILL.md"]],
      // The orchestrator reads every round record for its judgment, so the record's form follows the two.
      ["orchestrator", ["skills/core/SKILL.md", "skills/agent-contract/SKILL.md", "docs/forms/the-round-record.md"]],
    ]);
  });

  it("opens with a head that names the role, the stage, the bundle's root, the documents, the session's tools and where its commands write in the operating system's sandbox, and says what to do where a call is refused and where a step names what the bundle does not hold (scenario 6 of #127)", () => {
    expect(rulesHead("/app/dist/bundle", PROOFER)).toBe(
      [
        "# Owlery role session: proofer, round",
        "",
        "You are the proofer of the Owlery role bundle, at the stage `round`. Your definition is `agents/proofer.md` of the bundle.",
        "",
        "The bundle's root is `/app/dist/bundle`. Every `agents/`, `skills/`, `docs/` and `templates/` path that your definition and the rules below cite is a path under that root, and you read it there.",
        "",
        "The documents below follow this head whole, in this order. Each is in your context already, so do not open it again:",
        "",
        "- `skills/core/SKILL.md`",
        "- `skills/agent-contract/SKILL.md`",
        "- `skills/code-review/SKILL.md`",
        "",
        "You hold these tools and no other: Read, Glob, Grep, Bash. The daemon answers every call that asks for permission by the rule of your role, and no person is asked. Your commands run in the operating system's sandbox. Write with them only in the scratch folder your prompt names: the system refuses their writes to the worktree, to its repository's git folder and to the bundle's root. Where the daemon or the system refuses a call, do not work around it: say in your report which step needed the call.",
        "",
        "Those four directories hold documents only. A path under them that the bundle does not hold is not shipped, and neither is any `seal <subcommand>` command line or any script. Where a step needs one of them, do not look for it elsewhere and do not put another in its place: say in your report which step needed it.",
        "",
      ].join("\n"),
    );
    const head = rulesHead("/elsewhere", { role: "crafter", stage: "fix-pass" });
    for (const named of ["# Owlery role session: crafter, fix-pass\n", "the crafter of the Owlery role bundle, at the stage `fix-pass`", "`agents/crafter.md`", "`/elsewhere`", "- `skills/implement/fix-pass.md`\n"]) expect(head, named).toContain(named);
    // Each pair's head names the tools of its own launch, in the launch's order, and where its grant lets its commands write.
    const writes: Record<RoleStage["role"], string> = {
      proofer: "Write with them only in the scratch folder your prompt names: the system refuses their writes to the worktree, to its repository's git folder and to the bundle's root.",
      sealer: "Write with them only in the scratch folder your prompt names: the system refuses their writes to the worktree, to its repository's git folder and to the bundle's root.",
      crafter: "Write with them only in the worktree your prompt names and in its repository's git folder: the system refuses their writes to that git folder's hooks and config and to the bundle's root.",
      orchestrator: "Write nothing with them: the system refuses their writes to the worktree, to its repository's git folder and to the bundle's root.",
    };
    for (const pair of ROLE_STAGES) {
      expect(rulesHead("/elsewhere", pair), pair.role).toContain(
        `\n\nYou hold these tools and no other: ${toolsOf(pair).join(", ")}. The daemon answers every call that asks for permission by the rule of your role, and no person is asked. Your commands run in the operating system's sandbox. ${writes[pair.role]} Where the daemon or the system refuses a call, do not work around it: say in your report which step needed the call.\n\n`,
      );
    }
  });

  it("opens the rules of a pane's subagent with a head that differs from a role session's in two paragraphs: the documents are not said to be in its context, and it holds those of the tools its definition names that the session offers, under the person's own permission settings, with no word of the daemon", () => {
    for (const pair of ROLE_STAGES) {
      const session = rulesHead("/app/dist/bundle", pair).split("\n");
      const pane = rulesHead("/app/dist/bundle", pair, "pane").split("\n");
      expect(rulesHead("/app/dist/bundle", pair, "session").split("\n"), pair.role).toEqual(session);
      expect(pane.length, pair.role).toBe(session.length);
      expect(pane.flatMap((line, index) => (line === session[index] ? [] : [line])), pair.role).toEqual([
        "The documents below follow this head whole, in this order, so do not open them again in the bundle:",
        "You hold, of the tools your definition names, those the session that started you offers, and that session's tools where your definition names none. The person's own permission settings answer every call that asks for permission. Where a call is refused, do not work around it: say in your report which step needed the call.",
      ]);
      expect(pane.join("\n"), pair.role).not.toContain("daemon");
    }
    const bundle = scratchBundle(temporaryFolder());
    expect(rulesText(bundle, PROOFER, "pane").startsWith(`${rulesHead(bundle, PROOFER, "pane")}\n===== skills/core/SKILL.md =====\n`)).toBe(true);
    expect(rulesText(bundle, PROOFER, "pane").slice(rulesHead(bundle, PROOFER, "pane").length)).toBe(rulesText(bundle, PROOFER).slice(rulesHead(bundle, PROOFER).length));
  });

  it("holds the head, then each document after a line that names it, whole and without its frontmatter, in the table's order", () => {
    const bundle = scratchBundle(temporaryFolder());
    for (const pair of ROLE_STAGES) {
      const body = (document: string) => `===== ${document} =====\n\n# The body of ${document}\n\n---\n\nIts last line.\n`;
      expect(rulesText(bundle, pair), pair.role).toBe([rulesHead(bundle, pair), ...roleDocuments(pair).map(body)].join("\n"));
    }
    expect(rulesText(bundle, PROOFER)).not.toContain("Read by the harness.");
  });

  it("takes a document that opens with no frontmatter as it is", () => {
    const bundle = scratchBundle(temporaryFolder());
    writeFileSync(join(bundle, "skills/code-review/SKILL.md"), "# No frontmatter\n\n---\nname: a rule's own lines\n---\n");
    expect(rulesText(bundle, PROOFER).endsWith("===== skills/code-review/SKILL.md =====\n\n# No frontmatter\n\n---\nname: a rule's own lines\n---\n")).toBe(true);
  });

  it("names the document a bundle lacks", () => {
    const bundle = scratchBundle(temporaryFolder());
    rmSync(join(bundle, "skills/agent-contract/SKILL.md"));
    expect(() => rulesText(bundle, PROOFER)).toThrow(`the role bundle lacks skills/agent-contract/SKILL.md (${bundle})`);
  });
});

describe("the first line of a role launch", () => {
  // The keys of the `init` line Claude Code 2.1.330 printed for a role launch (the probe of 2026-11-22, case 1).
  const init = (fields: object): string => JSON.stringify({ type: "system", subtype: "init", claude_code_version: "2.1.330", plugins: [{ name: "owlery", source: "owlery@inline" }], agents: ["claude", "Explore", "owlery:crafter", "owlery:proofer", "owlery:sealer"], skills: ["owlery:core"], ...fields });

  it("fails where the session names a version older than the minimum, with the notice's sentence for that version, and reads the version before the agents (scenario 12 of #127)", () => {
    const older = `Claude Code 2.1.328 is older than 2.1.329, the oldest version Owlery's role sessions were checked on. Run "claude update" in a terminal.`;
    for (const version of ["2.1.329", "2.1.332"]) expect(roleCheck(init({ claude_code_version: version }), "owlery:proofer"), version).toEqual({ seen: true, failure: null });
    expect(roleCheck(init({ claude_code_version: "2.1.328" }), "owlery:proofer")).toEqual({ seen: true, failure: older });
    expect(roleCheck(init({ claude_code_version: "2.1.328", agents: ["claude"] }), "owlery:proofer")).toEqual({ seen: true, failure: older });
  });

  it("fails where the session names no version: none, one that is no string, or a string that holds no version, and reads that before the agents (scenario 12 of #127)", () => {
    const failure = "the session did not say which version of Claude Code it is, so its sandbox was not checked";
    for (const version of [undefined, null, 2.1, ["2.1.330"], "", "Claude Code", "2.1", "2.1.x"]) expect(roleCheck(init({ claude_code_version: version }), "owlery:proofer"), JSON.stringify(version)).toEqual({ seen: true, failure });
    expect(roleCheck(init({ claude_code_version: undefined, agents: ["claude"] }), "owlery:proofer")).toEqual({ seen: true, failure });
  });

  it("passes where the session lists the role's agent and no plugin that did not load", () => {
    expect(roleCheck(init({}), "owlery:proofer")).toEqual({ seen: true, failure: null });
    expect(roleCheck(init({ plugin_errors: [] }), "owlery:sealer")).toEqual({ seen: true, failure: null });
  });

  it("fails where the session does not list the role's agent: another's name, the bare name, or no list", () => {
    const failure = "the session does not hold the agent owlery:proofer";
    expect(roleCheck(init({ agents: ["claude", "owlery:crafter"] }), "owlery:proofer")).toEqual({ seen: true, failure });
    expect(roleCheck(init({ agents: ["proofer", "owlery:proofer-2"] }), "owlery:proofer")).toEqual({ seen: true, failure });
    expect(roleCheck(init({ agents: "owlery:proofer" }), "owlery:proofer")).toEqual({ seen: true, failure });
    expect(roleCheck(init({ agents: undefined }), "owlery:proofer")).toEqual({ seen: true, failure });
  });

  it("passes where the session lists the role's agent though a plugin did not load: the session holds other plugins beside the bundle, and the agent's name decides", () => {
    const errors = [{ plugin: "cc-plugin-telemetry@builtin", type: "path-not-found", message: "Path not found: /elsewhere" }];
    expect(roleCheck(init({ plugin_errors: errors }), "owlery:proofer")).toEqual({ seen: true, failure: null });
    expect(roleCheck(init({ plugin_errors: [{ type: "unknown" }] }), "owlery:sealer")).toEqual({ seen: true, failure: null });
  });

  it("fails with the first plugin error's message where the session does not list the role's agent and a plugin did not load", () => {
    const errors = [{ type: "path-not-found", message: "Path not found: /app/dist/bundle" }, { type: "other", message: "second" }];
    const agents = ["claude", "Explore"];
    expect(roleCheck(init({ agents, plugin_errors: errors }), "owlery:proofer")).toEqual({ seen: true, failure: "the role bundle did not load: Path not found: /app/dist/bundle" });
    expect(roleCheck(init({ agents, plugin_errors: [{ type: "unknown" }] }), "owlery:proofer")).toEqual({ seen: true, failure: 'the role bundle did not load: {"type":"unknown"}' });
    expect(roleCheck(init({ agents: undefined, plugin_errors: errors }), "owlery:proofer")).toEqual({ seen: true, failure: "the role bundle did not load: Path not found: /app/dist/bundle" });
    // An empty list names no plugin, so the agent's name is the reason.
    expect(roleCheck(init({ agents, plugin_errors: [] }), "owlery:proofer")).toEqual({ seen: true, failure: "the session does not hold the agent owlery:proofer" });
  });

  it("fails where a result arrives and no init line did", () => {
    expect(roleCheck('{"type":"result","is_error":false,"result":"owl"}', "owlery:proofer")).toEqual({ seen: true, failure: "the session did not say which agents it holds" });
  });

  it("waits for another line where the line is neither: another system line, a message, or no JSON", () => {
    for (const line of ['{"type":"system","subtype":"hook_started"}', '{"type":"assistant","message":{"content":[]}}', "not json", "null", ""]) expect(roleCheck(line, "owlery:proofer"), line).toEqual({ seen: false, failure: null });
  });
});

describe("the Claude adapter's role launch", () => {
  const PROOFER: RoleStage = { role: "proofer", stage: "round" };
  const INIT = '{"type":"system","subtype":"init","claude_code_version":"2.1.330","agents":["claude","owlery:proofer"],"plugins":[{"name":"owlery"}]}';
  const ANSWER = '{"type":"assistant","message":{"content":[{"type":"text","text":"owl"}]}}';
  const RESULT = '{"type":"result","is_error":false,"result":"owl","total_cost_usd":0.5}';

  /**
   * A folder with a script CLI that does `before`, prints `lines` and then does `then`, a shell that names it, a
   * scratch bundle and a folder for the rules files. What a case needs written whatever the adapter does with the
   * first line goes in `before`: the adapter can stop the CLI as soon as it reads that line, and under load the
   * signal reaches the script before it reaches `then` (issue #258).
   */
  function launch(lines: string[], then = "exit 0", before: string[] = []) {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", [`for a in "$@"; do printf '%s\\n' "$a"; done > '${folder}/args'`, ...before, ...lines.map((line) => `echo '${line}'`), then].join("\n"));
    const shell = script(folder, "shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    const bundleDir = scratchBundle(folder);
    const rulesDir = join(folder, "run", "roles");
    return { folder, env: { SHELL: shell, HOME: folder, USER: "person" }, bundleDir, rulesDir };
  }

  /** The places a case's role launch is given for its commands, where they are not what it tests: the folder alone, and nothing refused. */
  const placesIn = (cwd: string) => ({ write: [cwd], refuse: [] });

  /** Starts one run, of a role or a refresh, and gives its events once it has exited, and how long that took. A role's run is given `commands`, or the places of `placesIn`, and `scratch` where it is given one. */
  async function run(adapter: ReturnType<typeof claudeAdapter>, cwd: string, launch: RoleStage | "refresh", bound: { commands?: { write: string[]; refuse: string[] }; scratch?: string } = {}): Promise<{ events: RoleEvent[]; ms: number }> {
    const events: RoleEvent[] = [];
    const at = Date.now();
    await new Promise<void>((resolve, reject) => {
      adapter
        .start({ prompt: "Q", cwd, ...(launch === "refresh" ? { refresh: true } : { role: launch, commands: bound.commands ?? placesIn(cwd), ...(bound.scratch === undefined ? {} : { scratch: bound.scratch }) }) }, (event) => {
          events.push(event);
          if (event.type === "exit") resolve();
        })
        .catch(reject);
    });
    return { events, ms: Date.now() - at };
  }

  it("writes the pair's rules file into its folder, readable by the user alone, launches the CLI with the bundle, the agent and that file, and reports the run of a session that lists the agent", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, ANSWER, RESULT]);
    const { events } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, PROOFER);
    expect(events).toEqual([
      { type: "text", text: "owl" },
      { type: "result", text: "owl", isError: false, usage: { costUsd: 0.5, converted: true, models: [] } },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    const rulesFile = join(rulesDir, "proofer-round.md");
    expect(readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(folder, { bundleDir, agent: "owlery:proofer", rulesFile, tools: ["Read", "Glob", "Grep", "Bash"], sandbox: { allowWrite: [folder], denyWrite: [bundleDir] }, scratch: null }));
    expect(readFileSync(rulesFile, "utf8")).toBe(rulesText(bundleDir, PROOFER));
    expect(statSync(rulesFile).mode & 0o777).toBe(0o600);
    expect(statSync(rulesDir).mode & 0o777).toBe(0o700);
    // The file was written whole: no partial file is left beside it.
    expect(readdirSync(rulesDir)).toEqual(["proofer-round.md"]);
  });

  it("launches each role with the tools of its grant alone, as one value after --tools: a proofer, a sealer and the orchestrator with none that writes a file, a crafter with Edit and Write", async () => {
    const launched: [string, string | undefined][] = [];
    for (const pair of ROLE_STAGES) {
      const init = JSON.stringify({ type: "system", subtype: "init", claude_code_version: "2.1.330", agents: [agentOf(pair)] });
      const { folder, env, bundleDir, rulesDir } = launch([init, RESULT]);
      const { events } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, pair);
      expect(events.at(-1), pair.role).toEqual({ type: "exit", exitCode: 0, errorOutput: "" });
      const args = readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1);
      // One `--tools`, and one argument as its value: the next argument is the bundle's option.
      expect(args.filter((arg) => arg === "--tools"), pair.role).toHaveLength(1);
      expect(args[args.indexOf("--tools") + 2], pair.role).toBe("--plugin-dir");
      // Each role is launched as its own agent of the bundle, with the rules file of its pair.
      expect(args[args.indexOf("--agent") + 1], pair.role).toBe(`owlery:${pair.role}`);
      expect(args[args.indexOf("--append-system-prompt-file") + 1], pair.role).toBe(join(rulesDir, `${pair.role}-${pair.stage}.md`));
      launched.push([pair.role, args[args.indexOf("--tools") + 1]]);
    }
    expect(launched).toEqual([
      ["proofer", "Read,Glob,Grep,Bash"],
      ["crafter", "Read,Glob,Grep,Bash,Edit,Write"],
      ["sealer", "Read,Glob,Grep,Bash"],
      ["orchestrator", "Read,Glob,Grep,Bash"],
    ]);
  });

  it("bounds each role's commands to the places it was given: they write where `write` names, are refused what `refuse` names and the bundle's folder, and a scratch folder is added after the bundle's (scenarios 1 to 3 of #127)", async () => {
    const given = {
      crafter: { commands: { write: ["/w/tree", "/repo/.git"], refuse: ["/repo/.git/hooks", "/repo/.git/config"] } },
      proofer: { commands: { write: ["/run/scratch/1"], refuse: ["/w/tree"] }, scratch: "/run/scratch/1" },
      sealer: { commands: { write: ["/run/scratch/2"], refuse: ["/w/tree"] }, scratch: "/run/scratch/2" },
      orchestrator: { commands: { write: [], refuse: ["/w/tree"] } },
    };
    for (const pair of ROLE_STAGES) {
      const init = JSON.stringify({ type: "system", subtype: "init", claude_code_version: "2.1.330", agents: [agentOf(pair)] });
      const { folder, env, bundleDir, rulesDir } = launch([init, RESULT]);
      const bound: { commands: { write: string[]; refuse: string[] }; scratch?: string } = given[pair.role];
      await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, pair, bound);
      const args = readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1);
      const settings = JSON.parse(args[args.indexOf("--settings") + 1]!) as { sandbox: unknown };
      expect(settings.sandbox, pair.role).toEqual({
        enabled: true,
        failIfUnavailable: true,
        allowUnsandboxedCommands: false,
        autoAllowBashIfSandboxed: false,
        filesystem: { allowWrite: bound.commands.write, denyWrite: [...bound.commands.refuse, bundleDir] },
        network: { strictAllowlist: true, allowedDomains: [], allowLocalBinding: true },
      });
      expect(args.slice(args.indexOf("--add-dir")), pair.role).toEqual(["--add-dir", folder, bundleDir, ...(bound.scratch === undefined ? [] : [bound.scratch])]);
    }
  });

  it("starts no role session it was given no places for, says so, and launches nothing", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, RESULT]);
    await expect(claudeAdapter(env, { bundleDir, rulesDir }).start({ prompt: "Q", cwd: folder, role: PROOFER }, () => {})).rejects.toThrow("the Claude adapter launches a role only with the places its commands may write, and was given none");
    expect(existsSync(join(folder, "args"))).toBe(false);
    expect(existsSync(rulesDir)).toBe(false);
  });

  it("reports a role session's request for a tool its launch did not give it as a call of another kind that names no path, whatever the tool does, and a request for a tool of the launch as before", async () => {
    const CRAFTER: RoleStage = { role: "crafter", stage: "fix-pass" };
    const init = JSON.stringify({ type: "system", subtype: "init", claude_code_version: "2.1.330", agents: [agentOf(CRAFTER)] });
    const asks = (id: string, tool: string, input: unknown): string => JSON.stringify({ type: "control_request", request_id: id, request: { subtype: "can_use_tool", tool_name: tool, input } });
    const { folder, env, bundleDir, rulesDir } = launch([init, asks("r1", "NotebookEdit", { notebook_path: "FOLDER/a.ipynb" }), asks("r2", "Write", { file_path: "FOLDER/a.ts" }), RESULT]);
    const { events } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, CRAFTER);
    expect(events).toEqual([
      { type: "permission", id: "r1", tool: "NotebookEdit", action: "other", path: null, text: '{"notebook_path":"FOLDER/a.ipynb"}' },
      { type: "permission", id: "r2", tool: "Write", action: "write", path: "FOLDER/a.ts", text: "FOLDER/a.ts" },
      { type: "result", text: "owl", isError: false, usage: { costUsd: 0.5, converted: true, models: [] } },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
  });

  it("writes the rules file again before each role launch, so a launch carries the bundle as it stands", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, RESULT]);
    const adapter = claudeAdapter(env, { bundleDir, rulesDir });
    await run(adapter, folder, PROOFER);
    writeFileSync(join(bundleDir, "skills/core/SKILL.md"), "# The core, changed\n");
    await run(adapter, folder, PROOFER);
    expect(readFileSync(join(rulesDir, "proofer-round.md"), "utf8")).toContain("===== skills/core/SKILL.md =====\n\n# The core, changed\n");
  });

  it("launches a refresh as before, on an adapter that holds a bundle: the refresh's arguments, no rules file, and no reading of the first line", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([RESULT]);
    const { events } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, "refresh");
    expect(events).toEqual([
      { type: "result", text: "owl", isError: false, usage: { costUsd: 0.5, converted: true, models: [] } },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    expect(readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(folder, "refresh"));
    expect(existsSync(rulesDir)).toBe(false);
  });

  it("launches nothing given neither a role nor a refresh, which no launch of the daemon is, and says so", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([RESULT]);
    await expect(claudeAdapter(env, { bundleDir, rulesDir }).start({ prompt: "Q", cwd: folder }, () => {})).rejects.toThrow("the Claude adapter launches a role or a refresh of an account's usage, and was given neither");
    expect(existsSync(join(folder, "args"))).toBe(false);
  });

  it("starts no role session where it was given no bundle folder, or no folder for the rules files, and launches nothing", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, RESULT]);
    const commands = placesIn(folder);
    await expect(claudeAdapter(env).start({ prompt: "Q", cwd: folder, role: PROOFER, commands }, () => {})).rejects.toThrow("this adapter was given no role bundle, so it launches no role");
    await expect(claudeAdapter(env, { rulesDir }).start({ prompt: "Q", cwd: folder, role: PROOFER, commands }, () => {})).rejects.toThrow("this adapter was given no role bundle, so it launches no role");
    await expect(claudeAdapter(env, { bundleDir }).start({ prompt: "Q", cwd: folder, role: PROOFER, commands }, () => {})).rejects.toThrow("this adapter was given no folder for the rules files, so it launches no role");
    expect(existsSync(join(folder, "args"))).toBe(false);
  });

  it("starts no role session where the bundle lacks a document of the pair, names it, and launches nothing", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, RESULT]);
    rmSync(join(bundleDir, "skills/code-review/SKILL.md"));
    await expect(claudeAdapter(env, { bundleDir, rulesDir }).start({ prompt: "Q", cwd: folder, role: PROOFER, commands: placesIn(folder) }, () => {})).rejects.toThrow(`the role bundle lacks skills/code-review/SKILL.md (${bundleDir})`);
    expect(existsSync(join(folder, "args"))).toBe(false);
  });

  it.each([
    ["does not list the role's agent", '{"type":"system","subtype":"init","claude_code_version":"2.1.330","agents":["claude","proofer","owlery:crafter"]}', "the session does not hold the agent owlery:proofer"],
    ["lists a plugin that did not load", '{"type":"system","subtype":"init","claude_code_version":"2.1.330","agents":["claude"],"plugin_errors":[{"type":"path-not-found","message":"Path not found: /gone"}]}', "the role bundle did not load: Path not found: /gone"],
    // Scenario 12 of #127: the session holds the agent, and the version alone fails the launch.
    ["names a version older than the minimum", '{"type":"system","subtype":"init","claude_code_version":"2.1.328","agents":["claude","owlery:proofer"]}', `Claude Code 2.1.328 is older than 2.1.329, the oldest version Owlery's role sessions were checked on. Run "claude update" in a terminal.`],
    ["names no version", '{"type":"system","subtype":"init","agents":["claude","owlery:proofer"]}', "the session did not say which version of Claude Code it is, so its sandbox was not checked"],
  ])("fails a role launch whose session %s: an error result with the reason, the CLI stopped, and nothing else of the run but its exit", async (_, first, reason) => {
    // The CLI writes to its error stream, then would go on to answer and work for 30 seconds: the run ends because the adapter stops it.
    const { folder, env, bundleDir, rulesDir } = launch([first, ANSWER, RESULT], "exec sleep 30", ["echo 'still here' >&2"]);
    const { events, ms } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, PROOFER);
    expect(events).toEqual([
      { type: "result", text: reason, isError: true, usage: null },
      // A process ended by a signal has no code.
      { type: "exit", exitCode: 1, errorOutput: "still here\n" },
    ]);
    // The CLI would work for 30 seconds, so a run that ends within 10 is one the adapter stopped. The time is counted from the run's start, the shell's start among it, so KILL_AFTER_MS is no bound for it under load.
    expect(ms).toBeLessThan(10_000);
  });

  it("fails a role launch whose session gives a result before it said which agents it holds, and stops the CLI", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([RESULT, ANSWER], "exec sleep 30");
    const { events, ms } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, PROOFER);
    expect(events).toEqual([
      { type: "result", text: "the session did not say which agents it holds", isError: true, usage: null },
      { type: "exit", exitCode: 1, errorOutput: "" },
    ]);
    // As above: the CLI would sleep for 30 seconds, and the time counts the run's start.
    expect(ms).toBeLessThan(10_000);
  });

  it("reads the login of a role launch from the init line the role's check reads: a key there marks the cost as a charge", async () => {
    const init = '{"type":"system","subtype":"init","claude_code_version":"2.1.330","agents":["claude","owlery:proofer"],"apiKeySource":"apiKeyHelper"}';
    const { folder, env, bundleDir, rulesDir } = launch([init, RESULT]);
    const { events } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, PROOFER);
    expect(events.at(-2)).toEqual({ type: "result", text: "owl", isError: false, usage: { costUsd: 0.5, converted: false, models: [] } });
  });

  it("reports the session of a role launch after the role's check passed it, and none of a launch the check refused", async () => {
    const named = (agents: string[]): string => JSON.stringify({ type: "system", subtype: "init", claude_code_version: "2.1.330", agents, session_id: "s-9", model: "owl" });
    const held = launch([named(["claude", "owlery:proofer"]), ANSWER, RESULT]);
    expect((await run(claudeAdapter(held.env, { bundleDir: held.bundleDir, rulesDir: held.rulesDir }), held.folder, PROOFER)).events.slice(0, 2)).toEqual([
      { type: "session", id: "s-9", model: "owl" },
      { type: "text", text: "owl" },
    ]);
    const refused = launch([named(["claude"]), ANSWER, RESULT], "exec sleep 30");
    expect((await run(claudeAdapter(refused.env, { bundleDir: refused.bundleDir, rulesDir: refused.rulesDir }), refused.folder, PROOFER)).events.map((event) => event.type)).toEqual(["result", "exit"]);
  });

  it("reads the first line of a role launch once: a later line that lists no agent fails nothing", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, '{"type":"system","subtype":"init","agents":[]}', ANSWER, RESULT]);
    const { events } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, PROOFER);
    expect(events.map((event) => event.type)).toEqual(["text", "result", "exit"]);
  });

  it("gives a stopped role run the same stop as a caller's: a caller's stop after the failure gives the promise of the CLI's end", async () => {
    const { folder, env, bundleDir, rulesDir } = launch(['{"type":"system","subtype":"init","claude_code_version":"2.1.330","agents":[]}'], "exec sleep 30");
    const events: RoleEvent[] = [];
    const started = await claudeAdapter(env, { bundleDir, rulesDir }).start({ prompt: "Q", cwd: folder, role: PROOFER, commands: placesIn(folder) }, (event) => events.push(event));
    const end = Date.now() + 5000;
    while (events.length === 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    const at = Date.now();
    await started.stop();
    expect(Date.now() - at).toBeLessThan(KILL_AFTER_MS);
    while (events.length < 2 && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    expect(events.map((event) => event.type)).toEqual(["result", "exit"]);
  });
});

describe("a permission request on the Claude adapter's streams", () => {
  /** One line the CLI prints to ask whether it may make a call. */
  const asks = (id: string, tool: string, input: unknown): string => JSON.stringify({ type: "control_request", request_id: id, request: { subtype: "can_use_tool", tool_name: tool, input, tool_use_id: "toolu_1" } });

  it("maps a request to a neutral event: the line's id, the tool's name, what the call does, the path where it names a file, and what a person reads of it", () => {
    expect(eventsForLine(asks("r1", "Edit", { file_path: "/w/src/a.ts", old_string: "a", new_string: "b" }))).toEqual([{ type: "permission", id: "r1", tool: "Edit", action: "write", path: "/w/src/a.ts", text: "/w/src/a.ts" }]);
    expect(eventsForLine(asks("r2", "Write", { file_path: "notes.md", content: "x" }))).toEqual([{ type: "permission", id: "r2", tool: "Write", action: "write", path: "notes.md", text: "notes.md" }]);
    expect(eventsForLine(asks("r3", "NotebookEdit", { notebook_path: "/w/a.ipynb", new_source: "x" }))).toEqual([{ type: "permission", id: "r3", tool: "NotebookEdit", action: "write", path: "/w/a.ipynb", text: "/w/a.ipynb" }]);
    expect(eventsForLine(asks("r4", "Read", { file_path: "/elsewhere/secret" }))).toEqual([{ type: "permission", id: "r4", tool: "Read", action: "read", path: "/elsewhere/secret", text: "/elsewhere/secret" }]);
    expect(eventsForLine(asks("r5", "Bash", { command: "printf x >> README.md", description: "Append" }))).toEqual([{ type: "permission", id: "r5", tool: "Bash", action: "run", path: null, text: "printf x >> README.md" }]);
    expect(eventsForLine(asks("r6", "WebFetch", { url: "https://example.com", prompt: "Read it" }))).toEqual([{ type: "permission", id: "r6", tool: "WebFetch", action: "other", path: null, text: '{"url":"https://example.com","prompt":"Read it"}' }]);
  });

  it("reads a call that names no path or no command by its whole input, and names no path for it", () => {
    expect(eventsForLine(asks("r1", "Write", { content: "x" }))).toEqual([{ type: "permission", id: "r1", tool: "Write", action: "write", path: null, text: '{"content":"x"}' }]);
    expect(eventsForLine(asks("r2", "Read", { file_path: 7 }))).toEqual([{ type: "permission", id: "r2", tool: "Read", action: "read", path: null, text: '{"file_path":7}' }]);
    expect(eventsForLine(asks("r3", "Bash", {}))).toEqual([{ type: "permission", id: "r3", tool: "Bash", action: "run", path: null, text: "{}" }]);
    // A file tool's `file_path` is no path of a notebook's edit, and a command is no path.
    expect(eventsForLine(asks("r4", "NotebookEdit", { file_path: "/w/a.ipynb" }))).toMatchObject([{ action: "write", path: null }]);
    expect(eventsForLine(asks("r5", "Bash", { command: "ls", file_path: "/w/a" }))).toMatchObject([{ action: "run", path: null, text: "ls" }]);
    // A `command` is what a person reads of a shell call alone: another tool's is read with the rest of its input.
    expect(eventsForLine(asks("r6", "Task", { command: "ls" }))).toMatchObject([{ action: "other", path: null, text: '{"command":"ls"}' }]);
  });

  it("takes the tools of a launch as the only ones whose calls it names: a request for any other is a call of another kind with no path, and a request for one of them, or of a launch that named no tools, is read by what the tool does", () => {
    const PROOFER = ["Read", "Glob", "Grep", "Bash"];
    const CRAFTER = [...PROOFER, "Edit", "Write"];
    expect(eventsForLine(asks("r1", "NotebookEdit", { notebook_path: "/w/a.ipynb" }), CRAFTER)).toEqual([{ type: "permission", id: "r1", tool: "NotebookEdit", action: "other", path: null, text: '{"notebook_path":"/w/a.ipynb"}' }]);
    expect(eventsForLine(asks("r2", "Edit", { file_path: "/w/a.ts" }), PROOFER)).toEqual([{ type: "permission", id: "r2", tool: "Edit", action: "other", path: null, text: '{"file_path":"/w/a.ts"}' }]);
    // A command of a tool the launch did not give is not read as the call's text either.
    expect(eventsForLine(asks("r3", "Bash", { command: "ls" }), [])).toEqual([{ type: "permission", id: "r3", tool: "Bash", action: "other", path: null, text: '{"command":"ls"}' }]);
    expect(eventsForLine(asks("r4", "Edit", { file_path: "/w/a.ts" }), CRAFTER)).toMatchObject([{ action: "write", path: "/w/a.ts" }]);
    expect(eventsForLine(asks("r5", "Bash", { command: "ls" }), PROOFER)).toMatchObject([{ action: "run", text: "ls" }]);
    expect(eventsForLine(asks("r6", "NotebookEdit", { notebook_path: "/w/a.ipynb" }))).toMatchObject([{ action: "write", path: "/w/a.ipynb" }]);
  });

  it("gives a person at most PERMISSION_TEXT_CHARS characters of a call, ends a text it cut with the mark that says so, and leaves no half of a character at the cut", () => {
    expect(PERMISSION_TEXT_CHARS).toBe(2000);
    expect(PERMISSION_CUT_MARK).toBe(" [cut: the call holds more than is shown]");
    const kept = PERMISSION_TEXT_CHARS - PERMISSION_CUT_MARK.length;
    const [long] = eventsForLine(asks("r1", "Bash", { command: "c".repeat(2500) }));
    expect(long).toMatchObject({ text: `${"c".repeat(kept)}${PERMISSION_CUT_MARK}` });
    expect((long as { text: string }).text).toHaveLength(2000);
    // A text of exactly the bound is whole, and carries no mark. One character more is cut.
    const [whole] = eventsForLine(asks("r2", "Bash", { command: "c".repeat(2000) }));
    expect(whole).toMatchObject({ text: "c".repeat(2000) });
    const [over] = eventsForLine(asks("r3", "Bash", { command: "c".repeat(2001) }));
    expect(over).toMatchObject({ text: `${"c".repeat(kept)}${PERMISSION_CUT_MARK}` });
    // An owl is two of a string's characters, so a cut after its first would leave half of it before the mark.
    const [owl] = eventsForLine(asks("r4", "Bash", { command: `${"c".repeat(kept - 1)}\u{1F989}${"c".repeat(100)}` }));
    expect(owl).toMatchObject({ text: `${"c".repeat(kept - 1)}${PERMISSION_CUT_MARK}` });
    // An owl that ends where the cut falls is kept whole.
    const [fits] = eventsForLine(asks("r5", "Bash", { command: `${"c".repeat(kept - 2)}\u{1F989}${"c".repeat(100)}` }));
    expect(fits).toMatchObject({ text: `${"c".repeat(kept - 2)}\u{1F989}${PERMISSION_CUT_MARK}` });
    // The path a rule reads is not cut.
    const [path] = eventsForLine(asks("r6", "Write", { file_path: `/w/${"d".repeat(2500)}` }));
    expect(path).toMatchObject({ path: `/w/${"d".repeat(2500)}`, text: `/w/${"d".repeat(kept - 3)}${PERMISSION_CUT_MARK}` });
  });

  it("maps a withdrawn request to an event with its id, and reports nothing for a control line of another kind", () => {
    expect(eventsForLine('{"type":"control_cancel_request","request_id":"r1"}')).toEqual([{ type: "permission-withdrawn", id: "r1" }]);
    expect(eventsForLine('{"type":"control_cancel_request"}')).toEqual([]);
    expect(eventsForLine('{"type":"control_response","response":{"subtype":"success","request_id":"owlery-initialize","response":{}}}')).toEqual([]);
    expect(eventsForLine('{"type":"control_request","request_id":"x1","request":{"subtype":"interrupt"}}')).toEqual([]);
    expect(eventsForLine('{"type":"control_request","request":{"subtype":"can_use_tool","tool_name":"Bash","input":{}}}')).toEqual([]);
    expect(eventsForLine('{"type":"control_request","request_id":"x2"}')).toEqual([]);
  });

  /** A shell that names `cli` as the CLI it found. */
  function shellFor(folder: string, cli: string): NodeJS.ProcessEnv {
    return { SHELL: script(folder, "shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`), HOME: folder, USER: "person" };
  }

  /** Starts one run whose listener is also given the run, and gives its events once it has exited. */
  async function answered(env: NodeJS.ProcessEnv, cwd: string, onEvent: (event: RoleEvent, run: RoleRun) => void): Promise<RoleEvent[]> {
    const events: RoleEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      // No event arrives before the promise of `start` has resolved, so the listener holds the run.
      const started = claudeAdapter(env).start({ prompt: "Q", cwd, refresh: true }, (event) => {
        events.push(event);
        void started.then((run) => onEvent(event, run));
        if (event.type === "exit") resolve();
      });
      started.catch(reject);
    });
    return events;
  }

  it("writes an allowance with the request's own input and a refusal with its reason, each on one line of the session's input, and nothing for an id it does not wait on", async () => {
    const folder = temporaryFolder();
    const edit = { file_path: `${folder}/a.ts`, old_string: "a", new_string: "b" };
    // Stands for the CLI: it reads the handshake and the prompt, asks twice and reads each answer before it goes on, then gives its result and copies the rest of its input.
    const cli = script(
      folder,
      "cli",
      [
        "IFS= read -r handshake",
        "IFS= read -r prompt",
        `echo '${asks("r1", "Edit", edit)}'`,
        "IFS= read -r first",
        `printf '%s\\n' "$first" > '${folder}/answers'`,
        `echo '${asks("r2", "Bash", { command: "ls" })}'`,
        "IFS= read -r second",
        `printf '%s\\n' "$second" >> '${folder}/answers'`,
        `echo '{"type":"result","is_error":false,"result":"done","total_cost_usd":0}'`,
        `cat >> '${folder}/answers'`,
        "exit 0",
      ].join("\n"),
    );
    const events = await answered(shellFor(folder, cli), folder, (event, run) => {
      if (event.type !== "permission") return;
      // An id the run does not wait on writes nothing, before the answer and after it.
      run.answer("r9", { allow: true });
      if (event.id === "r1") run.answer("r1", { allow: true });
      else run.answer("r2", { allow: false, reason: 'No: "ls" is refused.' });
      run.answer(event.id, { allow: true });
    });
    expect(events).toEqual([
      { type: "permission", id: "r1", tool: "Edit", action: "write", path: edit.file_path, text: edit.file_path },
      { type: "permission", id: "r2", tool: "Bash", action: "run", path: null, text: "ls" },
      { type: "result", text: "done", isError: false, usage: { costUsd: 0, converted: true, models: [] } },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    const written = readFileSync(join(folder, "answers"), "utf8");
    expect(written.endsWith("\n")).toBe(true);
    expect(written.split("\n").slice(0, -1).map((line) => JSON.parse(line) as unknown)).toEqual([
      { type: "control_response", response: { subtype: "success", request_id: "r1", response: { behavior: "allow", updatedInput: edit } } },
      { type: "control_response", response: { subtype: "success", request_id: "r2", response: { behavior: "deny", message: 'No: "ls" is refused.' } } },
    ]);
  });

  it("reports a withdrawn request and waits on it no more, and answers a control request of another subtype with an error, reporting nothing of it", async () => {
    const folder = temporaryFolder();
    const cli = script(
      folder,
      "cli",
      [
        "IFS= read -r handshake",
        "IFS= read -r prompt",
        `echo '${asks("r1", "Bash", { command: "ls" })}'`,
        `echo '{"type":"control_cancel_request","request_id":"r1"}'`,
        `echo '{"type":"control_request","request_id":"x1","request":{"subtype":"no_such_subtype"}}'`,
        "IFS= read -r answer",
        `printf '%s\\n' "$answer" > '${folder}/answers'`,
        `echo '{"type":"result","is_error":false,"result":"done","total_cost_usd":0}'`,
        `cat >> '${folder}/answers'`,
        "exit 0",
      ].join("\n"),
    );
    const events = await answered(shellFor(folder, cli), folder, (event, run) => {
      // The answer to a request that was withdrawn is written nowhere.
      if (event.type === "permission-withdrawn") run.answer("r1", { allow: true });
    });
    expect(events).toEqual([
      { type: "permission", id: "r1", tool: "Bash", action: "run", path: null, text: "ls" },
      { type: "permission-withdrawn", id: "r1" },
      { type: "result", text: "done", isError: false, usage: { costUsd: 0, converted: true, models: [] } },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    expect(readFileSync(join(folder, "answers"), "utf8").split("\n").slice(0, -1).map((line) => JSON.parse(line) as unknown)).toEqual([
      { type: "control_response", response: { subtype: "error", request_id: "x1", error: "Owlery answers no control request of the subtype no_such_subtype" } },
    ]);
  });

  it("writes no answer once the result has ended the session's input", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", [`echo '${asks("r1", "Bash", { command: "ls" })}'`, `echo '{"type":"result","is_error":false,"result":"done","total_cost_usd":0}'`, `cat > '${folder}/stdin'`, "exit 0"].join("\n"));
    const events = await answered(shellFor(folder, cli), folder, (event, run) => {
      if (event.type === "result") run.answer("r1", { allow: true });
    });
    expect(events.map((event) => event.type)).toEqual(["permission", "result", "exit"]);
    expect(readFileSync(join(folder, "stdin"), "utf8")).toBe(`${INITIALIZE_LINE}${promptLine("Q")}`);
  });
});

describe("the output stream of a role launch, as one real run of Claude Code 2.1.330 printed it", () => {
  // The proofer at a round, asked three questions on 2026-11-22 through `pnpm run role:run`; each id and each path of the machine is replaced.
  const fixture = join(__dirname, "fixtures", "claude-role-stream.jsonl");
  const lines = readFileSync(fixture, "utf8").split("\n").slice(0, -1);

  it("opens with an init line that lists the bundle as a plugin of the session and its three agents by the plugin's name", () => {
    const init = JSON.parse(lines[0]!) as { type: string; subtype: string; claude_code_version: string; agents: string[]; plugins: { name: string; source: string }[]; plugin_errors?: unknown };
    expect([init.type, init.subtype, init.claude_code_version]).toEqual(["system", "init", "2.1.330"]);
    expect(init.agents.filter((agent) => agent.startsWith("owlery:"))).toEqual(["owlery:crafter", "owlery:proofer", "owlery:sealer"]);
    expect(init.plugins).toContainEqual(expect.objectContaining({ name: "owlery", source: "owlery@inline" }));
    expect(init.plugin_errors ?? []).toEqual([]);
  });

  it("passes the check of the role it was launched as, and of no role the bundle does not hold", () => {
    // The run was recorded before the bundle held the orchestrator's definition, so its session lists the three agents of that day.
    const recorded = ROLE_STAGES.filter((pair) => pair.role !== "orchestrator");
    expect(recorded).toHaveLength(3);
    for (const pair of recorded) expect(roleCheck(lines[0]!, agentOf(pair)), pair.role).toEqual({ seen: true, failure: null });
    expect(roleCheck(lines[0]!, "owlery:orchestrator")).toEqual({ seen: true, failure: "the session does not hold the agent owlery:orchestrator" });
    expect(roleCheck(lines[0]!, "owlery:framer")).toEqual({ seen: true, failure: "the session does not hold the agent owlery:framer" });
    expect(roleCheck(lines[0]!, "proofer")).toEqual({ seen: true, failure: "the session does not hold the agent proofer" });
  });

  it("gives the answer, which states a fact of the definition, one of the appended rules and the first line of a bundle file the session read", () => {
    const events = lines.flatMap((line) => eventsForLine(line));
    const last = events.at(-1);
    expect(last).toMatchObject({ type: "result", isError: false, usage: { costUsd: expect.any(Number) } });
    const answer = last?.type === "result" ? last.text : "";
    for (const fact of ["round-<n>/clone", "8, 16 and 20", "# Review round <N>"]) expect(answer, fact).toContain(fact);
    // The one tool the session used is the read of the bundle's file, in the folder the launch added.
    const used = lines.flatMap((line) => ((JSON.parse(line) as { message?: { content?: { type: string; name?: string; input?: { file_path?: string } }[] } }).message?.content ?? []).filter((block) => block.type === "tool_use"));
    expect(used.map((block) => [block.name, block.input?.file_path])).toEqual([["Read", "/app/dist/bundle/templates/records/sdd-round.md"]]);
  });

  it("names the session in its init line and in no other: the id and the model the recording's first line holds", () => {
    expect(lines.map((line) => sessionOf(line))).toEqual([{ id: "00000000-0000-4000-8000-000000000001", model: "claude-opus-5-5" }, ...lines.slice(1).map(() => undefined)]);
    // Every line of the recording holds the id, and only the init line is read for it.
    expect(lines.filter((line) => line.includes('"session_id":"00000000-0000-4000-8000-000000000001"')).length).toBeGreaterThan(1);
  });

  it("reads an init line for the session: an id that is no string, or an empty one, names no session, and a model that is no string, or an empty one, is none", () => {
    const init = (fields: object): string => JSON.stringify({ type: "system", subtype: "init", ...fields });
    expect(sessionOf(init({ session_id: "s-1", model: "owl" }))).toEqual({ id: "s-1", model: "owl" });
    for (const model of [undefined, null, 7, ""]) expect(sessionOf(init({ session_id: "s-1", model })), String(model)).toEqual({ id: "s-1", model: null });
    for (const id of [undefined, null, 7, ""]) expect(sessionOf(init({ session_id: id, model: "owl" })), String(id)).toBeNull();
    for (const line of ["", "not json", "[]", '{"type":"system","subtype":"status","session_id":"s-1"}', '{"type":"assistant","session_id":"s-1"}', '{"type":"result","session_id":"s-1"}']) expect(sessionOf(line), line).toBeUndefined();
  });

  it("goes on as a role launch's run: the adapter reports the session first, with the id and the model of the init line, then its text and its result, and fails nothing; the result carries what the turn used, its cost marked as converted because the init line of the subscription login names no key", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", `cat '${fixture}'`);
    const shell = script(folder, "shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    const events: RoleEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      claudeAdapter({ SHELL: shell, HOME: folder }, { bundleDir: scratchBundle(folder), rulesDir: join(folder, "roles") })
        .start({ prompt: "Q", cwd: folder, role: { role: "proofer", stage: "round" }, commands: { write: [folder], refuse: [] } }, (event) => {
          events.push(event);
          if (event.type === "exit") resolve();
        })
        .catch(reject);
    });
    expect(events).toEqual([{ type: "session", id: "00000000-0000-4000-8000-000000000001", model: "claude-opus-5-5" }, ...lines.flatMap((line) => eventsForLine(line)), { type: "exit", exitCode: 0, errorOutput: "" }]);
    expect(lines[0]).toContain('"apiKeySource":"none"');
    expect(events.at(-2)).toMatchObject({
      type: "result",
      isError: false,
      usage: { costUsd: 0.2807378, converted: true, models: [{ model: "claude-opus-5-5", inputTokens: 4, outputTokens: 300, cacheReadTokens: 33249, cacheWriteTokens: 33509, costUsd: 0.2807378 }] },
    });
  });
});

describe("the output stream of a run with no login, as Claude Code 2.1.330 printed it", () => {
  const lines = readFileSync(join(__dirname, "fixtures", "claude-not-logged-in.jsonl"), "utf8").split("\n").slice(0, -1);

  it("is a recording of the init line, the synthetic message and the error result", () => {
    expect(lines.map((line) => (JSON.parse(line) as { type: string }).type)).toEqual(["system", "assistant", "result"]);
  });

  it("gives the message's text, then a result that is an error with the same text and no cost", () => {
    expect(lines.flatMap((line) => eventsForLine(line))).toEqual([
      { type: "text", text: "Not logged in · Please run /login" },
      { type: "result", text: "Not logged in · Please run /login", isError: true, usage: { costUsd: 0, converted: true, models: [] } },
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

  it("gives the answer's text, then the result with the whole answer and what the turn used", () => {
    const events = lines.flatMap((line) => eventsForLine(line));
    const texts = events.flatMap((event) => (event.type === "text" ? [event.text] : []));
    expect(texts.join("")).toMatch(/^owl\.?$/i);
    const last = events.at(-1);
    expect(last).toEqual({
      type: "result",
      text: texts.join(""),
      isError: false,
      usage: { costUsd: 0.0508754, converted: true, models: [{ model: "claude-opus-5-5", inputTokens: 2, outputTokens: 4, cacheReadTokens: 11617, cacheWriteTokens: 6058, costUsd: 0.0508754 }] },
    });
    // The answer's pieces, the one limit of the run's `rate_limit_event` line, and the result.
    expect(events).toHaveLength(texts.length + 2);
  });

  it("drops every line that is neither the answer's text, nor the limit, nor the result", () => {
    for (const line of lines) {
      const type = typeOf(line);
      if (type !== "assistant" && type !== "result" && type !== "rate_limit_event") expect(eventsForLine(line), type).toEqual([]);
    }
  });

  it("maps the run's `rate_limit_event` line, which a turn far from any limit printed, to one limit for each window of its `unifiedWindows`, named by the window, with a reset of 0 as none (scenario 15)", () => {
    const line = lines.find((recorded) => typeOf(recorded) === "rate_limit_event")!;
    expect(eventsForLine(line)).toEqual([{ type: "limit", status: "ok", used: 0, resetsAt: null, window: "seven_day" }]);
  });

  it("maps a limit line with no windows by its own values, named by `rateLimitType`, and gives null for each value the line holds in no form of the reference's (scenario 15)", () => {
    const limit = (info: object) => eventsForLine(JSON.stringify({ type: "rate_limit_event", rate_limit_info: info }));
    expect(limit({ status: "allowed_warning", utilization: 0.8, resetsAt: 1_800_000_000, rateLimitType: "five_hour" })).toEqual([{ type: "limit", status: "near", used: 0.8, resetsAt: 1_800_000_000_000, window: "five_hour" }]);
    // A reset too large for seconds is read as milliseconds.
    expect(limit({ status: "rejected", resetsAt: 1_800_000_000_000 })).toEqual([{ type: "limit", status: "reached", used: null, resetsAt: 1_800_000_000_000, window: null }]);
    expect(limit({ status: "throttled", utilization: 80, resetsAt: "soon", rateLimitType: "" })).toEqual([{ type: "limit", status: null, used: null, resetsAt: null, window: null }]);
    expect(limit({ unifiedWindows: { five_hour: { status: "allowed", utilization: 0.5, resetsAt: 1_800_000_000 }, seven_day: "full" } })).toEqual([{ type: "limit", status: "ok", used: 0.5, resetsAt: 1_800_000_000_000, window: "five_hour" }]);
    expect(eventsForLine('{"type":"rate_limit_event"}')).toEqual([]);
    expect(eventsForLine('{"type":"rate_limit_event","rate_limit_info":[]}')).toEqual([]);
  });

  it("drops a line that is not JSON, or is JSON of another shape", () => {
    for (const line of ["", "not json", "[]", "null", "7", '{"type":"assistant"}', '{"type":"assistant","message":{"content":"owl"}}']) expect(eventsForLine(line), line).toEqual([]);
  });

  it("maps a result that is an error, and one with neither a cost nor a model's tokens as no usage", () => {
    expect(eventsForLine('{"type":"result","is_error":true,"result":"Not logged in"}')).toEqual([{ type: "result", text: "Not logged in", isError: true, usage: null }]);
    expect(eventsForLine('{"type":"result","is_error":false}')).toEqual([{ type: "result", text: "", isError: false, usage: null }]);
    for (const extra of ['"total_cost_usd":"0.5"', '"modelUsage":[]', '"modelUsage":null', '"modelUsage":7', '"total_cost_usd":null,"modelUsage":"owl"']) {
      expect(eventsForLine(`{"type":"result","is_error":false,${extra}}`), extra).toEqual([{ type: "result", text: "", isError: false, usage: null }]);
    }
  });

  it("reads what the turn used into the neutral names: the cost, and each model in the line's order with its four counts and its cost, a value that is no number as null", () => {
    const line = JSON.stringify({
      type: "result",
      is_error: false,
      result: "owl",
      total_cost_usd: 1.5,
      modelUsage: {
        "owl-large": { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 3, cacheCreationInputTokens: 4, costUSD: 1, webSearchRequests: 0, costBasis: "list" },
        "owl-small": { inputTokens: "5", outputTokens: null, cacheReadInputTokens: 0, costUSD: 0.5 },
        "owl-odd": 7,
      },
    });
    expect(eventsForLine(line)).toEqual([
      {
        type: "result",
        text: "owl",
        isError: false,
        usage: {
          costUsd: 1.5,
          converted: true,
          models: [
            { model: "owl-large", inputTokens: 1, outputTokens: 2, cacheReadTokens: 3, cacheWriteTokens: 4, costUsd: 1 },
            { model: "owl-small", inputTokens: null, outputTokens: null, cacheReadTokens: 0, cacheWriteTokens: null, costUsd: 0.5 },
            { model: "owl-odd", inputTokens: null, outputTokens: null, cacheReadTokens: null, cacheWriteTokens: null, costUsd: null },
          ],
        },
      },
    ]);
    // A model's tokens with no cost of the turn, and a cost with no model.
    expect(eventsForLine('{"type":"result","modelUsage":{}}')).toEqual([{ type: "result", text: "", isError: false, usage: { costUsd: null, converted: true, models: [] } }]);
    expect(eventsForLine('{"type":"result","total_cost_usd":0}')).toEqual([{ type: "result", text: "", isError: false, usage: { costUsd: 0, converted: true, models: [] } }]);
  });

  it("maps each text block of a message, and no block of another kind", () => {
    const line = JSON.stringify({ type: "assistant", message: { content: [{ type: "thinking", thinking: "hm" }, { type: "text", text: "a" }, { type: "tool_use", name: "Bash" }, { type: "other", text: "not the answer" }, { type: "text", text: "b" }, { type: "text", text: "" }] } });
    expect(eventsForLine(line)).toEqual([
      { type: "text", text: "a" },
      { type: "text", text: "b" },
    ]);
  });
});
