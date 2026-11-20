// The Claude adapter: it launches the `claude` CLI the user installed and
// logged into, in headless mode, detached from the user's environment
// (docs/architecture.md, "Authentication of the Claude adapter" and "Role
// sessions run detached from the user's environment"). Owlery never turns a
// permission check off (docs/roadmap.md, milestone 1).
import { execFile, spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { terminalEnv } from "../pty";
import type { RoleAdapter, RoleEvent } from "./adapter";

/**
 * The arguments of one headless session that works in `cwd`: stream-json in
 * and out, no settings of the user's or the repository's, no hooks, no auto
 * memory, no MCP server, and the permission mode a session has with no
 * settings at all.
 */
export function claudeArgs(cwd: string): string[] {
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
    // Last, because it takes every argument that follows it as a folder.
    "--add-dir",
    cwd,
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
 * The adapter for the user's own Claude Code. `env` is the daemon's
 * environment: it names the login shell, and gives the session its home, user
 * and locale.
 */
export function claudeAdapter(env: NodeJS.ProcessEnv, options: { lookupTimeoutMs?: number } = {}): RoleAdapter {
  // Asked of the login shell once per daemon process; a lookup that failed is asked again.
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

  return {
    name: "claude",
    features: [],
    async start({ prompt, cwd }, listener) {
      found ??= lookup().catch((error: unknown) => {
        found = undefined;
        throw error;
      });
      const { cli, path } = await found;
      // Pipes, not a terminal: stream-json is one JSON value per line.
      const child = spawn(cli, claudeArgs(cwd), { cwd, env: claudeEnv(env, path), stdio: ["pipe", "pipe", "pipe"] });
      await new Promise<void>((resolve, reject) => {
        child.once("spawn", resolve);
        child.once("error", reject);
      });
      // A process that ended early closes its input; its exit says so.
      child.stdin.on("error", () => {});
      child.stderr.resume();
      const lines = createInterface({ input: child.stdout });
      lines.on("line", (line) => {
        for (const event of eventsForLine(line)) listener(event);
      });
      // `close` follows the last line of output; a process ended by a signal has no code.
      child.once("close", (code) => listener({ type: "exit", exitCode: code ?? 1 }));
      // One message, then the end of input, so the session ends after one turn.
      child.stdin.end(promptLine(prompt));
      return { stop: () => void child.kill() };
    },
  };
}
