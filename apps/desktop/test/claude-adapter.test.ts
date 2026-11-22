import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { RoleEvent } from "../src/daemon/adapters/adapter";
import { claudeAdapter, claudeArgs, claudeEnv, ERROR_OUTPUT_CHARS, eventsForLine, KILL_AFTER_MS, LOOKUP_SCRIPT, lookupCommand, parseLookup, promptLine, roleCheck } from "../src/daemon/adapters/claude";
import { agentOf, roleDocuments, rulesFileName, rulesHead, rulesText } from "../src/daemon/adapters/claude-roles";
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

  it("adds to a role launch the bundle, the role's agent and the rules file after the permission mode, and the bundle's folder after the worktree, and nothing else", () => {
    const role = { bundleDir: "/app/dist/bundle", agent: "owlery:proofer", rulesFile: "/run/roles/proofer-round.md" };
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
      '{"disableAllHooks":true,"autoMemoryEnabled":false}',
      "--strict-mcp-config",
      "--permission-mode",
      "default",
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

  it("turns no permission check off, with a role and without", () => {
    for (const args of [claudeArgs("/work/tree"), claudeArgs("/work/tree", { bundleDir: "/bundle", agent: "owlery:crafter", rulesFile: "/rules.md" })]) {
      expect(args[args.indexOf("--permission-mode") + 1]).toBe("default");
      for (const off of ["bypassPermissions", "--dangerously-skip-permissions", "--allow-dangerously-skip-permissions", "--bare"]) expect(args).not.toContain(off);
    }
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

  it("reports nothing after the exit, and closes both streams to a child the CLI started, so what the child prints later fails to reach the run", async () => {
    const folder = temporaryFolder();
    // The child ignores SIGPIPE, so it goes on to write how each of its two writes ended, 0 where the stream was still open to it.
    const late = `{"type":"result","is_error":false,"result":"late","total_cost_usd":0}`;
    const cli = script(folder, "cli", `cat > /dev/null\n(trap '' PIPE; sleep 1; echo '${late}'; out=$?; echo 'late' >&2; err=$?; echo "$out $err" > '${folder}/printed') &\nexit 0`);
    const events: RoleEvent[] = [];
    await claudeAdapter(fakeShell(folder, cli).env).start({ prompt: "Q", cwd: folder }, (event) => events.push(event));
    const printed = join(folder, "printed");
    const end = Date.now() + 5000;
    while ((!existsSync(printed) || readFileSync(printed, "utf8").trim() === "") && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    const [out, err] = readFileSync(printed, "utf8").trim().split(" ");
    expect([out === "0", err === "0"]).toEqual([false, false]);
    await new Promise((r) => setTimeout(r, 100));
    expect(events).toEqual([{ type: "exit", exitCode: 0, errorOutput: "" }]);
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
    expect(ROLE_STAGES.map(agentOf)).toEqual(["owlery:proofer", "owlery:crafter", "owlery:sealer"]);
    expect(ROLE_STAGES.map(rulesFileName)).toEqual(["proofer-round.md", "crafter-fix-pass.md", "sealer-seal.md"]);
  });

  it("holds the core and the agent contract for every pair, then the documents the role opens first at its stage", () => {
    expect(ROLE_STAGES.map((pair) => [pair.role, roleDocuments(pair)])).toEqual([
      ["proofer", ["skills/core/SKILL.md", "skills/agent-contract/SKILL.md", "skills/code-review/SKILL.md"]],
      ["crafter", ["skills/core/SKILL.md", "skills/agent-contract/SKILL.md", "skills/implement/SKILL.md", "skills/implement/fix-pass.md"]],
      ["sealer", ["skills/core/SKILL.md", "skills/agent-contract/SKILL.md"]],
    ]);
  });

  it("opens with a head that names the role, the stage, the bundle's root and the documents, and says what to do where a step names what the bundle does not hold", () => {
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
        "The bundle holds documents only. A path under those four directories that the bundle does not hold is not shipped, and neither is any `seal <subcommand>` command line or any script. Where a step needs one of them, do not look for it elsewhere and do not put another in its place: say in your report which step needed it.",
        "",
      ].join("\n"),
    );
    const head = rulesHead("/elsewhere", { role: "crafter", stage: "fix-pass" });
    for (const named of ["# Owlery role session: crafter, fix-pass\n", "the crafter of the Owlery role bundle, at the stage `fix-pass`", "`agents/crafter.md`", "`/elsewhere`", "- `skills/implement/fix-pass.md`\n"]) expect(head, named).toContain(named);
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
  const init = (fields: object): string => JSON.stringify({ type: "system", subtype: "init", plugins: [{ name: "owlery", source: "owlery@inline" }], agents: ["claude", "Explore", "owlery:crafter", "owlery:proofer", "owlery:sealer"], skills: ["owlery:core"], ...fields });

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

  it("fails with the first plugin error's message where a plugin did not load, though the agent is listed", () => {
    const errors = [{ type: "path-not-found", message: "Path not found: /app/dist/bundle" }, { type: "other", message: "second" }];
    expect(roleCheck(init({ plugin_errors: errors }), "owlery:proofer")).toEqual({ seen: true, failure: "the role bundle did not load: Path not found: /app/dist/bundle" });
    expect(roleCheck(init({ plugin_errors: [{ type: "unknown" }] }), "owlery:proofer")).toEqual({ seen: true, failure: 'the role bundle did not load: {"type":"unknown"}' });
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
  const INIT = '{"type":"system","subtype":"init","agents":["claude","owlery:proofer"],"plugins":[{"name":"owlery"}]}';
  const ANSWER = '{"type":"assistant","message":{"content":[{"type":"text","text":"owl"}]}}';
  const RESULT = '{"type":"result","is_error":false,"result":"owl","total_cost_usd":0.5}';

  /** A folder with a script CLI that prints `lines` and then does `then`, a shell that names it, a scratch bundle and a folder for the rules files. */
  function launch(lines: string[], then = "exit 0") {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", [`for a in "$@"; do printf '%s\\n' "$a"; done > '${folder}/args'`, "cat > /dev/null", ...lines.map((line) => `echo '${line}'`), then].join("\n"));
    const shell = script(folder, "shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    const bundleDir = scratchBundle(folder);
    const rulesDir = join(folder, "run", "roles");
    return { folder, env: { SHELL: shell, HOME: folder, USER: "person" }, bundleDir, rulesDir };
  }

  /** Starts one run and gives its events once it has exited, and how long that took. */
  async function run(adapter: ReturnType<typeof claudeAdapter>, cwd: string, role?: RoleStage): Promise<{ events: RoleEvent[]; ms: number }> {
    const events: RoleEvent[] = [];
    const at = Date.now();
    await new Promise<void>((resolve, reject) => {
      adapter
        .start({ prompt: "Q", cwd, ...(role ? { role } : {}) }, (event) => {
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
      { type: "result", text: "owl", isError: false, costUsd: 0.5 },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    const rulesFile = join(rulesDir, "proofer-round.md");
    expect(readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(folder, { bundleDir, agent: "owlery:proofer", rulesFile }));
    expect(readFileSync(rulesFile, "utf8")).toBe(rulesText(bundleDir, PROOFER));
    expect(statSync(rulesFile).mode & 0o777).toBe(0o600);
    expect(statSync(rulesDir).mode & 0o777).toBe(0o700);
    // The file was written whole: no partial file is left beside it.
    expect(readdirSync(rulesDir)).toEqual(["proofer-round.md"]);
  });

  it("writes the rules file again before each role launch, so a launch carries the bundle as it stands", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, RESULT]);
    const adapter = claudeAdapter(env, { bundleDir, rulesDir });
    await run(adapter, folder, PROOFER);
    writeFileSync(join(bundleDir, "skills/core/SKILL.md"), "# The core, changed\n");
    await run(adapter, folder, PROOFER);
    expect(readFileSync(join(rulesDir, "proofer-round.md"), "utf8")).toContain("===== skills/core/SKILL.md =====\n\n# The core, changed\n");
  });

  it("launches a session with no role as before, on an adapter that holds a bundle: the plain arguments, no rules file, and no reading of the first line", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([RESULT]);
    const { events } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder);
    expect(events).toEqual([
      { type: "result", text: "owl", isError: false, costUsd: 0.5 },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    expect(readFileSync(join(folder, "args"), "utf8").split("\n").slice(0, -1)).toEqual(claudeArgs(folder));
    expect(existsSync(rulesDir)).toBe(false);
  });

  it("starts no role session where it was given no bundle folder, or no folder for the rules files, and launches nothing", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, RESULT]);
    await expect(claudeAdapter(env).start({ prompt: "Q", cwd: folder, role: PROOFER }, () => {})).rejects.toThrow("this adapter was given no role bundle, so it launches no role");
    await expect(claudeAdapter(env, { rulesDir }).start({ prompt: "Q", cwd: folder, role: PROOFER }, () => {})).rejects.toThrow("this adapter was given no role bundle, so it launches no role");
    await expect(claudeAdapter(env, { bundleDir }).start({ prompt: "Q", cwd: folder, role: PROOFER }, () => {})).rejects.toThrow("this adapter was given no folder for the rules files, so it launches no role");
    expect(existsSync(join(folder, "args"))).toBe(false);
  });

  it("starts no role session where the bundle lacks a document of the pair, names it, and launches nothing", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, RESULT]);
    rmSync(join(bundleDir, "skills/code-review/SKILL.md"));
    await expect(claudeAdapter(env, { bundleDir, rulesDir }).start({ prompt: "Q", cwd: folder, role: PROOFER }, () => {})).rejects.toThrow(`the role bundle lacks skills/code-review/SKILL.md (${bundleDir})`);
    expect(existsSync(join(folder, "args"))).toBe(false);
  });

  it.each([
    ["does not list the role's agent", '{"type":"system","subtype":"init","agents":["claude","proofer","owlery:crafter"]}', "the session does not hold the agent owlery:proofer"],
    ["lists a plugin that did not load", '{"type":"system","subtype":"init","agents":["claude"],"plugin_errors":[{"type":"path-not-found","message":"Path not found: /gone"}]}', "the role bundle did not load: Path not found: /gone"],
  ])("fails a role launch whose session %s: an error result with the reason, the CLI stopped, and nothing else of the run but its exit", async (_, first, reason) => {
    // The CLI would go on to answer and then work for 30 seconds: the run ends because the adapter stops it.
    const { folder, env, bundleDir, rulesDir } = launch([first, ANSWER, RESULT], "echo 'still here' >&2\nexec sleep 30");
    const { events, ms } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, PROOFER);
    expect(events).toEqual([
      { type: "result", text: reason, isError: true, costUsd: null },
      // A process ended by a signal has no code.
      { type: "exit", exitCode: 1, errorOutput: "still here\n" },
    ]);
    expect(ms).toBeLessThan(KILL_AFTER_MS);
  });

  it("fails a role launch whose session gives a result before it said which agents it holds, and stops the CLI", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([RESULT, ANSWER], "exec sleep 30");
    const { events, ms } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, PROOFER);
    expect(events).toEqual([
      { type: "result", text: "the session did not say which agents it holds", isError: true, costUsd: null },
      { type: "exit", exitCode: 1, errorOutput: "" },
    ]);
    expect(ms).toBeLessThan(KILL_AFTER_MS);
  });

  it("reads the first line of a role launch once: a later line that lists no agent fails nothing", async () => {
    const { folder, env, bundleDir, rulesDir } = launch([INIT, '{"type":"system","subtype":"init","agents":[]}', ANSWER, RESULT]);
    const { events } = await run(claudeAdapter(env, { bundleDir, rulesDir }), folder, PROOFER);
    expect(events.map((event) => event.type)).toEqual(["text", "result", "exit"]);
  });

  it("gives a stopped role run the same stop as a caller's: a caller's stop after the failure gives the promise of the CLI's end", async () => {
    const { folder, env, bundleDir, rulesDir } = launch(['{"type":"system","subtype":"init","agents":[]}'], "exec sleep 30");
    const events: RoleEvent[] = [];
    const started = await claudeAdapter(env, { bundleDir, rulesDir }).start({ prompt: "Q", cwd: folder, role: PROOFER }, (event) => events.push(event));
    const end = Date.now() + 5000;
    while (events.length === 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    const at = Date.now();
    await started.stop();
    expect(Date.now() - at).toBeLessThan(KILL_AFTER_MS);
    while (events.length < 2 && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    expect(events.map((event) => event.type)).toEqual(["result", "exit"]);
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
    for (const pair of ROLE_STAGES) expect(roleCheck(lines[0]!, agentOf(pair)), pair.role).toEqual({ seen: true, failure: null });
    expect(roleCheck(lines[0]!, "owlery:framer")).toEqual({ seen: true, failure: "the session does not hold the agent owlery:framer" });
    expect(roleCheck(lines[0]!, "proofer")).toEqual({ seen: true, failure: "the session does not hold the agent proofer" });
  });

  it("gives the answer, which states a fact of the definition, one of the appended rules and the first line of a bundle file the session read", () => {
    const events = lines.flatMap(eventsForLine);
    const last = events.at(-1);
    expect(last).toMatchObject({ type: "result", isError: false, costUsd: expect.any(Number) });
    const answer = last?.type === "result" ? last.text : "";
    for (const fact of ["round-<n>/clone", "8, 16 and 20", "# Review round <N>"]) expect(answer, fact).toContain(fact);
    // The one tool the session used is the read of the bundle's file, in the folder the launch added.
    const used = lines.flatMap((line) => ((JSON.parse(line) as { message?: { content?: { type: string; name?: string; input?: { file_path?: string } }[] } }).message?.content ?? []).filter((block) => block.type === "tool_use"));
    expect(used.map((block) => [block.name, block.input?.file_path])).toEqual([["Read", "/app/dist/bundle/templates/records/sdd-round.md"]]);
  });

  it("goes on as a role launch's run: the adapter reports its text and its result, and fails nothing", async () => {
    const folder = temporaryFolder();
    const cli = script(folder, "cli", `cat > /dev/null\ncat '${fixture}'`);
    const shell = script(folder, "shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    const events: RoleEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      claudeAdapter({ SHELL: shell, HOME: folder }, { bundleDir: scratchBundle(folder), rulesDir: join(folder, "roles") })
        .start({ prompt: "Q", cwd: folder, role: { role: "proofer", stage: "round" } }, (event) => {
          events.push(event);
          if (event.type === "exit") resolve();
        })
        .catch(reject);
    });
    expect(events).toEqual([...lines.flatMap(eventsForLine), { type: "exit", exitCode: 0, errorOutput: "" }]);
    expect(events.at(-2)).toMatchObject({ type: "result", isError: false });
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
