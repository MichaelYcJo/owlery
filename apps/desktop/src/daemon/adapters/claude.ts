// The Claude adapter: it launches the `claude` CLI the user installed and
// logged into, in headless mode, detached from the user's environment
// (docs/architecture.md, "Authentication of the Claude adapter" and "Role
// sessions run detached from the user's environment"). Owlery never turns a
// permission check off (docs/roadmap.md, milestone 1).
import { execFile, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { terminalEnv } from "../pty";
import { writeWholeFile } from "../whole-file";
import type { RoleStage } from "../../shared/protocol";
import type { RoleAdapter, RoleEvent } from "./adapter";
import { agentOf, rulesFileName, rulesText } from "./claude-roles";

/** How much of the end of what the CLI printed on its error stream a run keeps, in a string's characters. A crash prints its cause last. */
export const ERROR_OUTPUT_CHARS = 2000;

/** How long a stop waits, after it signalled the CLI's process group to end, before it kills the group where the CLI has not exited by then. */
export const KILL_AFTER_MS = 2000;

/**
 * The oldest version of Claude Code that Owlery's role sessions were checked
 * on: the options of a launch and its detachment were confirmed on it
 * (docs/architecture.md, "Options for launching Claude Code"). An older one
 * is launched all the same, and the person is told to update.
 */
export const MIN_CLAUDE_VERSION = "2.1.326";

/** How long after the CLI's exit the run's `exit` waits for the CLI's streams to close, which a child the CLI started can hold open. */
const STREAMS_GRACE_MS = 300;

/** The last `ERROR_OUTPUT_CHARS` characters of a text, less a half of a character the cut would leave at its start. */
function lastOf(text: string): string {
  if (text.length <= ERROR_OUTPUT_CHARS) return text;
  const tail = text.slice(-ERROR_OUTPUT_CHARS);
  const first = tail.charCodeAt(0);
  // A character outside the basic plane is two of a string's, and the second of the two alone is no character.
  return first >= 0xdc00 && first <= 0xdfff ? tail.slice(1) : tail;
}

/**
 * The arguments of one headless session that works in `cwd`: stream-json in
 * and out, no settings of the user's or the repository's, no hooks, no auto
 * memory, no MCP server, and the permission mode a session has with no
 * settings at all. A role launch adds to them and takes none away: the role
 * bundle as a plugin of this session alone, the role's agent of it, the file
 * of rules appended to the system prompt, and the bundle's folder among the
 * folders the session works in, so it reads the bundle's other documents.
 */
export function claudeArgs(cwd: string, role?: { bundleDir: string; agent: string; rulesFile: string }): string[] {
  return [
    "-p",
    "--input-format",
    "stream-json",
    "--output-format",
    "stream-json",
    // Claude Code refuses stream-json output under -p without it.
    "--verbose",
    "--setting-sources",
    "",
    "--settings",
    JSON.stringify({ disableAllHooks: true, autoMemoryEnabled: false }),
    "--strict-mcp-config",
    "--permission-mode",
    "default",
    ...(role ? ["--plugin-dir", role.bundleDir, "--agent", role.agent, "--append-system-prompt-file", role.rulesFile] : []),
    // Last, because it takes every argument that follows it as a folder.
    "--add-dir",
    cwd,
    ...(role ? [role.bundleDir] : []),
  ];
}

/**
 * The environment of a headless session: five names and nothing else of the
 * daemon's, so no plugin, setting or token comes in through a variable. `path`
 * is the PATH of the user's login shell. A daemon the app started from the
 * Finder has no LANG, and the session then cannot read or print Korean.
 */
export function claudeEnv(env: NodeJS.ProcessEnv, path: string): Record<string, string> {
  const session: Record<string, string> = {};
  if (env.HOME) session.HOME = env.HOME;
  if (env.USER) session.USER = env.USER;
  session.PATH = path;
  session.LANG = env.LANG || "en_US.UTF-8";
  session.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1";
  return session;
}

/** The prompt as the one line of stream-json input a session reads as a user's message. */
export function promptLine(prompt: string): string {
  return `${JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: prompt }] } })}\n`;
}

/** What the lookup has the shell print: the CLI's path and the shell's PATH, each on a marked line of its own. */
export const LOOKUP_SCRIPT = `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' "$(command -v claude)" "$PATH"`;

/**
 * The command that finds the CLI: the user's interactive login shell, as a
 * terminal pane opens it, because a daemon the app started has the app's PATH
 * and many profiles set PATH only for an interactive shell. The adapter starts
 * it with a pane's environment, so a profile that refuses a package script's
 * variables, as nvm does, still sets the PATH the session gets.
 */
export function lookupCommand(env: NodeJS.ProcessEnv): { command: string; args: string[] } {
  return { command: env.SHELL || "/bin/zsh", args: ["-l", "-i", "-c", LOOKUP_SCRIPT] };
}

/** Reads the two marked lines out of what the shell printed; nothing where it named no file as the CLI. */
export function parseLookup(printed: string): { cli: string; path: string } | undefined {
  const marked = (name: string): string | undefined => new RegExp(`^__owlery_${name}=(.*)$`, "m").exec(printed)?.[1];
  const cli = marked("cli");
  const path = marked("path");
  // An alias or a shell function is answered by its name, which is no file to launch.
  if (!cli?.startsWith("/") || !path) return undefined;
  return { cli, path };
}

/**
 * What a person is told of the CLI's version, from what the CLI printed for
 * `--version`: that it is older than `MIN_CLAUDE_VERSION` and how to update,
 * or null where it is that version or a newer one. The version is the first
 * three numbers joined by dots, each compared as a number. Null too where
 * the CLI printed no version, and the first session then says what failed.
 */
export function versionNotice(printed: string): string | null {
  const found = /(\d+)\.(\d+)\.(\d+)/.exec(printed);
  if (!found) return null;
  const oldest = MIN_CLAUDE_VERSION.split(".").map(Number);
  for (const [place, least] of oldest.entries()) {
    const number = Number(found[place + 1]);
    if (number > least) return null;
    if (number < least) return `Claude Code ${found[0]} is older than ${MIN_CLAUDE_VERSION}, the oldest version Owlery's role sessions were checked on. Run "claude update" in a terminal.`;
  }
  return null;
}

interface TextBlock {
  type: "text";
  text: string;
}

function isTextBlock(block: unknown): block is TextBlock {
  if (typeof block !== "object" || block === null) return false;
  const { type, text } = block as Record<string, unknown>;
  return type === "text" && typeof text === "string" && text !== "";
}

/**
 * Maps one line of the output stream to neutral events: the text blocks of an
 * `assistant` message, and the `result` line. Every other line is dropped,
 * and so is a line that is not JSON.
 */
export function eventsForLine(line: string): RoleEvent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null) return [];
  const record = parsed as Record<string, unknown>;
  if (record.type === "assistant") {
    const content = (record.message as { content?: unknown } | null | undefined)?.content;
    if (!Array.isArray(content)) return [];
    return content.filter(isTextBlock).map((block) => ({ type: "text", text: block.text }));
  }
  if (record.type === "result") {
    return [
      {
        type: "result",
        text: typeof record.result === "string" ? record.result : "",
        isError: record.is_error === true,
        costUsd: typeof record.total_cost_usd === "number" ? record.total_cost_usd : null,
      },
    ];
  }
  return [];
}

/**
 * Reads one line of a role launch's output for whether the session holds the
 * role's agent. Claude Code starts a plain session, with no error, for an
 * agent's name it does not hold and for a plugin folder that is not there
 * (2.1.330, probed 2026-11-22), and only its `init` line shows it: the
 * session's agents, and the plugins that did not load. `seen` is true once
 * the line settles it, the `init` line or a `result` that arrived with none
 * before it, and `failure` is then why the launch failed, or null.
 */
export function roleCheck(line: string, agent: string): { seen: boolean; failure: string | null } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return { seen: false, failure: null };
  }
  if (typeof parsed !== "object" || parsed === null) return { seen: false, failure: null };
  const record = parsed as Record<string, unknown>;
  if (record.type === "result") return { seen: true, failure: "the session did not say which agents it holds" };
  if (record.type !== "system" || record.subtype !== "init") return { seen: false, failure: null };
  const errors: unknown = record.plugin_errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first: unknown = errors[0];
    const message = typeof first === "object" && first !== null ? (first as { message?: unknown }).message : undefined;
    return { seen: true, failure: `the role bundle did not load: ${typeof message === "string" ? message : JSON.stringify(first)}` };
  }
  if (!Array.isArray(record.agents) || !record.agents.includes(agent)) return { seen: true, failure: `the session does not hold the agent ${agent}` };
  return { seen: true, failure: null };
}

/**
 * The adapter for the user's own Claude Code. `env` is the daemon's
 * environment: it names the login shell, and gives the session its home, user
 * and locale. `bundleDir` is the role bundle's folder and `rulesDir` the
 * folder the adapter writes each role's rules file into; an adapter given
 * neither launches sessions with no role alone.
 */
export function claudeAdapter(env: NodeJS.ProcessEnv, options: { lookupTimeoutMs?: number; bundleDir?: string; rulesDir?: string } = {}): RoleAdapter {
  // Asked of the login shell once per daemon process, for the sessions and the notices together; a lookup that failed is asked again.
  let found: Promise<{ cli: string; path: string }> | undefined;

  const lookup = (): Promise<{ cli: string; path: string }> => {
    const { command, args } = lookupCommand(env);
    return new Promise((resolve, reject) => {
      execFile(command, args, { env: terminalEnv(env), encoding: "utf8", timeout: options.lookupTimeoutMs ?? 10_000 }, (error, stdout) => {
        // The exit code is the profile's last word, not the lookup's: what was printed decides.
        const result = parseLookup(stdout);
        if (result) resolve(result);
        else if (error && "killed" in error && error.killed) reject(new Error(`the login shell (${command}) did not answer where claude is`));
        else reject(new Error(`claude was not found by the login shell (${command})`));
      }).stdin?.end();
    });
  };

  const located = (): Promise<{ cli: string; path: string }> =>
    (found ??= lookup().catch((error: unknown) => {
      found = undefined;
      throw error;
    }));

  /**
   * What a role launch adds to the arguments, after writing the pair's rules
   * file: whole, so a session that starts meanwhile never reads half of one,
   * and again at each launch, so it holds the bundle as it stands. The folder
   * and the file are the user's alone, as the daemon's other files are.
   */
  const launchOf = (role: RoleStage): { bundleDir: string; agent: string; rulesFile: string } => {
    const { bundleDir, rulesDir } = options;
    if (!bundleDir) throw new Error("this adapter was given no role bundle, so it launches no role");
    if (!rulesDir) throw new Error("this adapter was given no folder for the rules files, so it launches no role");
    const text = rulesText(bundleDir, role);
    mkdirSync(rulesDir, { recursive: true, mode: 0o700 });
    const rulesFile = join(rulesDir, rulesFileName(role));
    writeWholeFile(rulesFile, text);
    return { bundleDir, agent: agentOf(role), rulesFile };
  };

  return {
    name: "claude",
    features: [],
    async start({ prompt, cwd, role }, listener) {
      const launch = role && launchOf(role);
      const { cli, path } = await located();
      // Pipes, not a terminal: stream-json is one JSON value per line. The CLI leads a process group of its own, so a
      // signal to the group also reaches what the CLI started in it, such as a tool's shell.
      const child = spawn(cli, claudeArgs(cwd, launch), { cwd, env: claudeEnv(env, path), stdio: ["pipe", "pipe", "pipe"], detached: true });
      await new Promise<void>((resolve, reject) => {
        child.once("spawn", resolve);
        child.once("error", reject);
      });
      // A process that ended early closes its input; its exit says so.
      child.stdin.on("error", () => {});
      let errorOutput = "";
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (text: string) => {
        errorOutput = lastOf(errorOutput + text);
      });
      let exited = false;
      let reported = false;
      let grace: NodeJS.Timeout | undefined;
      // A process ended by a signal has no code.
      const report = (code: number | null): void => {
        if (reported) return;
        reported = true;
        clearTimeout(grace);
        // Nothing follows the exit. A child the CLI started may still hold the streams, and what it prints is not the
        // run's: the daemon's ends of the pipes close here, so the reader of the lines gets nothing more and the
        // child's later writes fail. At a `close` the streams have ended already, and this changes nothing.
        child.stdout.destroy();
        child.stderr.destroy();
        listener({ type: "exit", exitCode: code ?? 1, errorOutput });
      };
      const exit = new Promise<void>((resolve) => {
        child.once("exit", (code) => {
          exited = true;
          resolve();
          grace = setTimeout(() => report(code), STREAMS_GRACE_MS);
        });
      });
      // `close` follows the last line of output, unless a child the CLI started holds the streams past the grace.
      child.once("close", (code) => report(code));
      // One message, then the end of input, so the session ends after one turn.
      child.stdin.end(promptLine(prompt));
      const signal = (name: NodeJS.Signals): void => {
        // Once the CLI has exited its group may be gone, and the group's id may name another's processes.
        if (exited || child.pid === undefined) return;
        try {
          // The negative id names the group the CLI leads.
          process.kill(-child.pid, name);
        } catch {
          // The group is gone already.
        }
      };
      let stopping: Promise<void> | undefined;
      const stop = (): Promise<void> =>
        (stopping ??= (async () => {
          signal("SIGTERM");
          const kill = setTimeout(() => signal("SIGKILL"), KILL_AFTER_MS);
          await exit;
          clearTimeout(kill);
        })());
      // A role launch is not the role's until its first line says the session holds the agent. `unchecked` is that
      // agent until the line that settles it, and `refused` is set where it failed the launch: the listener then
      // hears the reason as the run's result, the CLI is stopped, and nothing more of its output is reported.
      let unchecked = launch?.agent;
      let refused = false;
      const lines = createInterface({ input: child.stdout });
      lines.on("line", (line) => {
        if (refused) return;
        if (unchecked !== undefined) {
          const { seen, failure } = roleCheck(line, unchecked);
          if (seen) unchecked = undefined;
          if (failure !== null) {
            refused = true;
            listener({ type: "result", text: failure, isError: true, costUsd: null });
            void stop();
            return;
          }
        }
        for (const event of eventsForLine(line)) listener(event);
      });
      return { stop };
    },
    async notice() {
      try {
        const { cli, path } = await located();
        // The CLI is run anew at each call, with a session's environment, so the answer is the version a session would run now.
        // What it printed decides, whatever its exit code, and a CLI that does not answer in the lookup's time has printed nothing.
        const printed = await new Promise<string>((resolve) => {
          execFile(cli, ["--version"], { env: claudeEnv(env, path), encoding: "utf8", timeout: options.lookupTimeoutMs ?? 10_000 }, (_error, stdout) => resolve(stdout)).stdin?.end();
        });
        return versionNotice(printed);
      } catch {
        // No CLI was found, or it could not be run: the first session says what failed.
        return null;
      }
    },
  };
}
