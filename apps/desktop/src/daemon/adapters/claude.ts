// The Claude adapter: it launches the `claude` CLI the user installed and
// logged into, in headless mode, detached from the user's environment
// (docs/architecture.md, "Authentication of the Claude adapter" and "Role
// sessions run detached from the user's environment"). Owlery never turns a
// permission check off (docs/roadmap.md, milestone 1).
import { execFile, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { terminalEnv } from "../pty";
import { writeWholeFile } from "../whole-file";
import type { RoleStage, Usage } from "../../shared/protocol";
import type { PermissionAction, RoleAdapter, RoleEvent, RoleRun, RoleStart } from "./adapter";
import { CONFIG_DIR_VARIABLE, claudeLogins, conversationsIn } from "./claude-accounts";
import { agentOf, rulesFileName, rulesText, toolsOf } from "./claude-roles";

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

/** How much of a call a permission request tells a person, in a string's characters. */
export const PERMISSION_TEXT_CHARS = 2000;

/** What a cut text ends with, so a person knows the call holds more than they read. */
export const PERMISSION_CUT_MARK = " [cut: the call holds more than is shown]";

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
 * The text a person reads of a call, `PERMISSION_TEXT_CHARS` characters at
 * most: the whole text where it fits, and otherwise its first characters
 * followed by `PERMISSION_CUT_MARK`, less a half of a character the cut
 * would leave before the mark.
 */
function firstOf(text: string): string {
  if (text.length <= PERMISSION_TEXT_CHARS) return text;
  const head = text.slice(0, PERMISSION_TEXT_CHARS - PERMISSION_CUT_MARK.length);
  const last = head.charCodeAt(head.length - 1);
  // A character outside the basic plane is two of a string's, and the first of the two alone is no character.
  return (last >= 0xd800 && last <= 0xdbff ? head.slice(0, -1) : head) + PERMISSION_CUT_MARK;
}

/**
 * The arguments of one headless session that works in `cwd`: stream-json in
 * and out, no settings of the user's or the repository's, no hooks, no auto
 * memory, no MCP server, the permission mode a session has with no settings
 * at all, and each call that mode asks a person about brought to the
 * session's own streams, where the adapter answers it. A role launch names
 * the built-in tools the session holds, as one value so that no other
 * reaches it, and adds the role bundle as a plugin of this session alone,
 * the role's agent of it, the file of rules appended to the system prompt,
 * and the bundle's folder among the folders the session works in, so it
 * reads the bundle's other documents. A role launch also turns Claude Code's
 * own sandbox on in the settings it passes, which on macOS runs each command
 * under `sandbox-exec`: its commands write only in `sandbox.allowWrite`,
 * never in `sandbox.denyWrite`, which wins over the first, and reach no host
 * but the loopback; no command can ask to run outside it, a session whose
 * sandbox cannot start does not start, and a sandboxed command still asks
 * the adapter as any other does. Its scratch folder, where it has one, joins
 * the folders the session works in. A refresh of an account's usage, which
 * has no role, holds no tool at all, takes one turn and writes no
 * transcript. No other launch is made: a session with neither a role nor a
 * refresh would keep Claude Code's default tools, with no grant to answer
 * its calls.
 */
export function claudeArgs(cwd: string, launch: RoleLaunch | "refresh"): string[] {
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
    JSON.stringify({ disableAllHooks: true, autoMemoryEnabled: false, ...(launch === "refresh" ? {} : { sandbox: sandboxOf(launch.sandbox) }) }),
    "--strict-mcp-config",
    "--permission-mode",
    "default",
    "--permission-prompt-tool",
    "stdio",
    ...(launch === "refresh" ? ["--tools", "", "--max-turns", "1", "--no-session-persistence"] : ["--tools", launch.tools.join(","), "--plugin-dir", launch.bundleDir, "--agent", launch.agent, "--append-system-prompt-file", launch.rulesFile]),
    // Last, because it takes every argument that follows it as a folder.
    "--add-dir",
    cwd,
    ...(launch === "refresh" ? [] : [launch.bundleDir, ...(launch.scratch === null ? [] : [launch.scratch])]),
  ];
}

/** What a role launch adds to the arguments: the bundle, the role's agent, its rules file and its tools, the folders its commands write in and are refused, and its scratch folder or none. */
export interface RoleLaunch {
  bundleDir: string;
  agent: string;
  rulesFile: string;
  tools: readonly string[];
  sandbox: { allowWrite: readonly string[]; denyWrite: readonly string[] };
  scratch: string | null;
}

/** The `sandbox` block of a role launch's settings, as Claude Code names its keys. */
function sandboxOf(places: RoleLaunch["sandbox"]): unknown {
  return {
    enabled: true,
    failIfUnavailable: true,
    allowUnsandboxedCommands: false,
    // A sandboxed command still reaches the adapter as a request, so the daemon's grant answers it.
    autoAllowBashIfSandboxed: false,
    filesystem: { allowWrite: places.allowWrite, denyWrite: places.denyWrite },
    // No domain is allowed, and a host is refused with no request; a local server a test starts is reached on the loopback.
    network: { strictAllowlist: true, allowedDomains: [], allowLocalBinding: true },
  };
}

/**
 * The environment of a headless session: five names, and the config folder
 * where one is given, and nothing else of the daemon's, so no plugin, setting
 * or token comes in through a variable. `path` is the PATH of the user's
 * login shell. `configDir` is the folder of the session's account, or under
 * System default the one the user's login shell names, so a pane and a role
 * session of one work item run under one login; with neither the CLI keeps
 * its default folder. A daemon the app started from the Finder has no LANG,
 * and the session then cannot read or print Korean.
 */
export function claudeEnv(env: NodeJS.ProcessEnv, path: string, configDir?: string | null): Record<string, string> {
  const session: Record<string, string> = {};
  if (env.HOME) session.HOME = env.HOME;
  if (env.USER) session.USER = env.USER;
  session.PATH = path;
  session.LANG = env.LANG || "en_US.UTF-8";
  session.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1";
  if (configDir) session[CONFIG_DIR_VARIABLE] = configDir;
  return session;
}

/** The prompt as the one line of stream-json input a session reads as a user's message. */
export function promptLine(prompt: string): string {
  return `${JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: prompt }] } })}\n`;
}

/** The line that opens a session's input, before the prompt: the handshake of a host that answers the session's control requests. */
export const INITIALIZE_LINE = `${JSON.stringify({ type: "control_request", request_id: "owlery-initialize", request: { subtype: "initialize" } })}\n`;

/** What the lookup has the shell print: the CLI's path, the shell's PATH and the config folder the shell names, each on a marked line of its own, the last empty where the shell names none. */
export const LOOKUP_SCRIPT = `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' "$(command -v claude)" "$PATH" "\${${CONFIG_DIR_VARIABLE}:-}"`;

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

/** Reads the marked lines out of what the shell printed, the config folder null where the shell named none; nothing where it named no file as the CLI. */
export function parseLookup(printed: string): { cli: string; path: string; configDir: string | null } | undefined {
  const marked = (name: string): string | undefined => new RegExp(`^__owlery_${name}=(.*)$`, "m").exec(printed)?.[1];
  const cli = marked("cli");
  const path = marked("path");
  // An alias or a shell function is answered by its name, which is no file to launch.
  if (!cli?.startsWith("/") || !path) return undefined;
  return { cli, path, configDir: marked("config") || null };
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

/** A line of the output stream as the JSON object it holds; nothing where it holds none. */
function recordOf(line: string): Record<string, unknown> | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return undefined;
  }
  return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
}

/**
 * Reads one line of the output stream for a request the CLI makes of its
 * host and waits for the answer to: its id, its subtype, and what it carries.
 * Nothing where the line is no such request, or names no id to answer under.
 */
export function controlRequestOf(line: string): { id: string; subtype: unknown; request: Record<string, unknown> } | undefined {
  const record = recordOf(line);
  if (record?.type !== "control_request" || typeof record.request_id !== "string") return undefined;
  const request = typeof record.request === "object" && record.request !== null ? (record.request as Record<string, unknown>) : {};
  return { id: record.request_id, subtype: request.subtype, request };
}

/** What a call of each of Claude Code's tools does, and the name of the input's field that holds the file it reads or writes. A tool that is not here does something else. */
const CALLS: Record<string, { action: PermissionAction; path?: string }> = {
  Edit: { action: "write", path: "file_path" },
  Write: { action: "write", path: "file_path" },
  NotebookEdit: { action: "write", path: "notebook_path" },
  Read: { action: "read", path: "file_path" },
  Bash: { action: "run" },
};

/**
 * The neutral event of a request to use a tool: what the call does, the file
 * it names, and what a person reads of it, which is the path, the command,
 * or the input as JSON. `held` is the tools the session's launch named. A
 * request for a tool that is not among them is a call of another kind,
 * whatever the tool does, so no role's rule allows it: the CLI keeps such a
 * tool from a session, and this holds where it does not.
 */
function permissionEvent(id: string, request: Record<string, unknown>, held: readonly string[] | undefined): RoleEvent {
  const tool = typeof request.tool_name === "string" ? request.tool_name : "";
  const input = typeof request.input === "object" && request.input !== null ? (request.input as Record<string, unknown>) : {};
  const given = held === undefined || held.includes(tool);
  const call = given && Object.hasOwn(CALLS, tool) ? CALLS[tool]! : { action: "other" as const };
  const named = call.path === undefined ? undefined : input[call.path];
  const path = typeof named === "string" ? named : null;
  const read = path ?? (call.action === "run" && typeof input.command === "string" ? input.command : JSON.stringify(request.input ?? {}));
  return { type: "permission", id, tool, action: call.action, path, text: firstOf(read) };
}

/**
 * The values of the `init` line's `apiKeySource` that name a key, the three
 * the executable of Claude Code 2.1.330 gives one (read 2026-11-23). Only
 * under one of them is a turn's cost taken as what the account is billed.
 */
const KEY_SOURCES: readonly string[] = ["ANTHROPIC_API_KEY", "apiKeyHelper", "/login managed key"];

/**
 * Reads one line of the output stream for the session's login: true where
 * it is the `init` line and its `apiKeySource` names a key, false where it is
 * the `init` line and names none, another value or no string, and nothing
 * where it is another line.
 */
export function keyedLogin(line: string): boolean | undefined {
  const record = recordOf(line);
  if (record?.type !== "system" || record.subtype !== "init") return undefined;
  return typeof record.apiKeySource === "string" && KEY_SOURCES.includes(record.apiKeySource);
}

/**
 * Reads one line of the output stream for the session's own name: the id of
 * the `init` line's `session_id` and the model of its `model`, null for an
 * `init` line whose id is no string or an empty one, and nothing where it is
 * another line. A model that is no string, or an empty one, is null.
 */
export function sessionOf(line: string): { id: string; model: string | null } | null | undefined {
  const record = recordOf(line);
  if (record?.type !== "system" || record.subtype !== "init") return undefined;
  if (typeof record.session_id !== "string" || record.session_id === "") return null;
  return { id: record.session_id, model: typeof record.model === "string" && record.model !== "" ? record.model : null };
}

/** A value of the stream as a number, and null where it is no number. */
function numberOf(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

/**
 * What a turn used, from its `result` line: the cost of `total_cost_usd`,
 * and one model for each key of `modelUsage`, in the order the line names
 * them (a name that is a whole number comes first, as JavaScript orders an
 * object's keys), with its four counts and its cost. Null where the line
 * holds neither a numeric cost nor a `modelUsage` object. `keyed` is whether
 * the session's login names a key: the cost is marked as converted unless it
 * does.
 */
function usageOf(record: Record<string, unknown>, keyed: boolean): Usage | null {
  const reported = record.modelUsage;
  const models = typeof reported === "object" && reported !== null && !Array.isArray(reported) ? (reported as Record<string, unknown>) : undefined;
  const costUsd = numberOf(record.total_cost_usd);
  if (costUsd === null && models === undefined) return null;
  return {
    costUsd,
    converted: !keyed,
    models: Object.entries(models ?? {}).map(([model, used]) => {
      const counts = typeof used === "object" && used !== null ? (used as Record<string, unknown>) : {};
      return {
        model,
        inputTokens: numberOf(counts.inputTokens),
        outputTokens: numberOf(counts.outputTokens),
        cacheReadTokens: numberOf(counts.cacheReadInputTokens),
        cacheWriteTokens: numberOf(counts.cacheCreationInputTokens),
        costUsd: numberOf(counts.costUSD),
      };
    }),
  };
}

/** How the stream names a limit's state, as the reference's `SDKRateLimitEvent` names it, read into the neutral event's. */
const LIMIT_STATUS: Readonly<Record<string, "ok" | "near" | "reached">> = { allowed: "ok", allowed_warning: "near", rejected: "reached" };

const recordOrNothing = (value: unknown): Record<string, unknown> | undefined => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined);

/**
 * The limit events of a `rate_limit_event` line, from its `rate_limit_info`.
 * The reference's type names `status`, `utilization` and `resetsAt`, and no
 * window. The run recorded in `test/fixtures/claude-stream.jsonl`, a turn far
 * from any limit, carried the line with `rateLimitType` naming its window and
 * `unifiedWindows` holding each window's three values, and the line is read
 * as that run printed it: one event for each window of `unifiedWindows`,
 * named by its key, and where it holds none, one event of the line's own
 * values named by `rateLimitType`. A value the line does not hold in the
 * reference's form is null: a status the reference does not name, a
 * utilization outside 0 to 1, since nothing says what another range would
 * mean, and a reset at or before the epoch. `resetsAt` is read as seconds
 * since the epoch, as Claude Code's status line gives a reset, and a value
 * too large for seconds before the year 5000 as milliseconds.
 */
function limitsOf(record: Record<string, unknown>): RoleEvent[] {
  const info = recordOrNothing(record.rate_limit_info);
  if (info === undefined) return [];
  const limitOf = (values: Record<string, unknown>, window: unknown): RoleEvent => {
    const { status, utilization, resetsAt } = values;
    const used = numberOf(utilization);
    const resets = numberOf(resetsAt);
    return {
      type: "limit",
      status: typeof status === "string" && Object.hasOwn(LIMIT_STATUS, status) ? LIMIT_STATUS[status]! : null,
      used: used !== null && used >= 0 && used <= 1 ? used : null,
      resetsAt: resets === null || resets <= 0 ? null : resets < 1e11 ? resets * 1000 : resets,
      window: typeof window === "string" && window !== "" ? window : null,
    };
  };
  const windows = Object.entries(recordOrNothing(info.unifiedWindows) ?? {}).flatMap(([window, values]) => {
    const held = recordOrNothing(values);
    return held === undefined ? [] : [limitOf(held, window)];
  });
  return windows.length > 0 ? windows : [limitOf(info, info.rateLimitType)];
}

/**
 * Maps one line of the output stream to neutral events: the text blocks of an
 * `assistant` message, the `result` line with what the turn used, what a
 * `rate_limit_event` line says of the account's limit, a request to use a
 * tool, and the withdrawal of one. Every other line is dropped, a
 * control line of another kind among them, and so is a line that is not
 * JSON. The `init` line gives no event here: a run reports its `session`
 * from `sessionOf`, once. `held` is the tools a role launch named, and
 * nothing for a refresh, which names none: a request for a tool outside
 * them is reported as a call of another kind, with no path. `keyed` is whether the session's login
 * names a key (`keyedLogin`), and false where nothing said so.
 */
export function eventsForLine(line: string, held?: readonly string[], keyed = false): RoleEvent[] {
  const record = recordOf(line);
  if (!record) return [];
  if (record.type === "control_request") {
    const control = controlRequestOf(line);
    return control?.subtype === "can_use_tool" ? [permissionEvent(control.id, control.request, held)] : [];
  }
  if (record.type === "control_cancel_request") return typeof record.request_id === "string" ? [{ type: "permission-withdrawn", id: record.request_id }] : [];
  if (record.type === "assistant") {
    const content = (record.message as { content?: unknown } | null | undefined)?.content;
    if (!Array.isArray(content)) return [];
    return content.filter(isTextBlock).map((block) => ({ type: "text", text: block.text }));
  }
  if (record.type === "rate_limit_event") return limitsOf(record);
  if (record.type === "result") {
    return [
      {
        type: "result",
        text: typeof record.result === "string" ? record.result : "",
        isError: record.is_error === true,
        usage: usageOf(record, keyed),
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
 * session's agents, and the plugins that did not load. The agent's name
 * decides: a session that lists it goes on whatever plugin did not load,
 * because a session holds Claude Code's built-in plugins beside the bundle
 * and an error of one of them is not the bundle's. Where the agent is
 * missing, the first plugin that did not load is named as the reason, and
 * the agent's name where no plugin is listed. `seen` is true once the line
 * settles it, the `init` line or a `result` that arrived with none before
 * it, and `failure` is then why the launch failed, or null.
 */
export function roleCheck(line: string, agent: string): { seen: boolean; failure: string | null } {
  const record = recordOf(line);
  if (!record) return { seen: false, failure: null };
  if (record.type === "result") return { seen: true, failure: "the session did not say which agents it holds" };
  if (record.type !== "system" || record.subtype !== "init") return { seen: false, failure: null };
  if (Array.isArray(record.agents) && record.agents.includes(agent)) return { seen: true, failure: null };
  // The agent is missing. A plugin that did not load is the likelier cause, and its message says more than the name does.
  const errors: unknown = record.plugin_errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first: unknown = errors[0];
    const message = typeof first === "object" && first !== null ? (first as { message?: unknown }).message : undefined;
    return { seen: true, failure: `the role bundle did not load: ${typeof message === "string" ? message : JSON.stringify(first)}` };
  }
  return { seen: true, failure: `the session does not hold the agent ${agent}` };
}

/**
 * The adapter for the user's own Claude Code. `env` is the daemon's
 * environment: it names the login shell, and gives the session its home, user
 * and locale. `bundleDir` is the role bundle's folder and `rulesDir` the
 * folder the adapter writes each role's rules file into; an adapter given
 * neither launches no role, and so only the refresh of an account's usage.
 */
export function claudeAdapter(env: NodeJS.ProcessEnv, options: { lookupTimeoutMs?: number; bundleDir?: string; rulesDir?: string } = {}): RoleAdapter {
  type Lookup = NonNullable<ReturnType<typeof parseLookup>>;
  // Asked of the login shell once per daemon process, for the sessions and the notices together; a lookup that failed is asked again.
  let found: Promise<Lookup> | undefined;
  // What the lookup answered, once it has: the default login's folder is read from it without a wait.
  let answered: Lookup | undefined;

  const lookup = (): Promise<Lookup> => {
    const { command, args } = lookupCommand(env);
    return new Promise((resolve, reject) => {
      execFile(command, args, { env: terminalEnv(env), encoding: "utf8", timeout: options.lookupTimeoutMs ?? 10_000 }, (error, stdout) => {
        // The exit code is the profile's last word, not the lookup's: what was printed decides.
        const result = parseLookup(stdout);
        if (result) {
          answered = result;
          resolve(result);
        }
        else if (error && "killed" in error && error.killed) reject(new Error(`the login shell (${command}) did not answer where claude is`));
        else reject(new Error(`claude was not found by the login shell (${command})`));
      }).stdin?.end();
    });
  };

  const located = (): Promise<Lookup> =>
    (found ??= lookup().catch((error: unknown) => {
      found = undefined;
      throw error;
    }));

  /**
   * What a role launch adds to the arguments, after writing the pair's rules
   * file: whole, so a session that starts meanwhile never reads half of one,
   * and again at each launch, so it holds the bundle as it stands. The folder
   * and the file are the user's alone, as the daemon's other files are. The
   * session's commands write where `commands` lets them, and are refused the
   * bundle's folder beside what `commands` refuses.
   */
  const launchOf = (role: RoleStage, commands: RoleStart["commands"], scratch: string | undefined): RoleLaunch => {
    if (!commands) throw new Error("the Claude adapter launches a role only with the places its commands may write, and was given none");
    const { bundleDir, rulesDir } = options;
    if (!bundleDir) throw new Error("this adapter was given no role bundle, so it launches no role");
    if (!rulesDir) throw new Error("this adapter was given no folder for the rules files, so it launches no role");
    const text = rulesText(bundleDir, role);
    mkdirSync(rulesDir, { recursive: true, mode: 0o700 });
    const rulesFile = join(rulesDir, rulesFileName(role));
    writeWholeFile(rulesFile, text);
    return { bundleDir, agent: agentOf(role), rulesFile, tools: toolsOf(role), sandbox: { allowWrite: commands.write, denyWrite: [...commands.refuse, bundleDir] }, scratch: scratch ?? null };
  };

  // The folder the login shell names, which a pane's `claude` reads, and `.claude` of the home where it names none, as Claude Code itself reads it.
  const defaultLoginFolder = (): string | null => (answered === undefined ? null : (answered.configDir ?? join(env.HOME || homedir(), ".claude")));

  return {
    name: "claude",
    features: ["role-tools", "permission-requests", "accounts", "limit-refresh"],
    async start({ prompt, cwd, role, accountDir, refresh, commands, scratch }, listener) {
      // The daemon launches a role's session or a refresh. A session that is neither would hold Claude Code's default tools with no grant to answer its calls, so none is launched.
      if (!role && refresh !== true) throw new Error("the Claude adapter launches a role or a refresh of an account's usage, and was given neither");
      const launch = role ? launchOf(role, commands, scratch) : "refresh";
      const { cli, path, configDir } = await located();
      // Pipes, not a terminal: stream-json is one JSON value per line. The CLI leads a process group of its own, so a
      // signal to the group also reaches what the CLI started in it, such as a tool's shell. The account's folder, and
      // under System default the folder the login shell names, as a pane of the work item would run under it.
      const child = spawn(cli, claudeArgs(cwd, launch), { cwd, env: claudeEnv(env, path, accountDir ?? configDir), stdio: ["pipe", "pipe", "pipe"], detached: true });
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
      // The handshake, then one message. The input stays open for the answers to the session's requests, and ends at
      // the result, so the session ends after one turn.
      child.stdin.write(INITIALIZE_LINE);
      child.stdin.write(promptLine(prompt));
      // The requests the session waits on, by their ids, each with the input of its call, which an allowance gives back unchanged.
      const waiting = new Map<string, unknown>();
      const respond = (response: object): void => {
        child.stdin.write(`${JSON.stringify({ type: "control_response", response })}\n`);
      };
      const answer: RoleRun["answer"] = (id, given) => {
        if (!waiting.has(id)) return;
        const input = waiting.get(id);
        waiting.delete(id);
        respond({ subtype: "success", request_id: id, response: given.allow ? { behavior: "allow", updatedInput: input } : { behavior: "deny", message: given.reason } });
      };
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
      let unchecked = launch === "refresh" ? undefined : launch.agent;
      let refused = false;
      // Whether the session's login names a key, as the first `init` line says, and nothing until that line: a result
      // that comes before any is marked as converted, and a later `init` line changes nothing.
      let keyed: boolean | undefined;
      // The session's own id and its model, as the first `init` line names them, and nothing until that line. The listener
      // hears them once, and a first `init` line that names no id leaves the session unnamed whatever a later one names.
      let named: ReturnType<typeof sessionOf>;
      const lines = createInterface({ input: child.stdout });
      lines.on("line", (line) => {
        if (refused) return;
        if (unchecked !== undefined) {
          const { seen, failure } = roleCheck(line, unchecked);
          if (seen) unchecked = undefined;
          if (failure !== null) {
            refused = true;
            listener({ type: "result", text: failure, isError: true, usage: null });
            void stop();
            return;
          }
        }
        keyed ??= keyedLogin(line);
        if (named === undefined) {
          named = sessionOf(line);
          if (named) listener({ type: "session", ...named });
        }
        const control = controlRequestOf(line);
        if (control?.subtype === "can_use_tool") waiting.set(control.id, control.request.input);
        // The CLI waits for an answer to every request it makes, so one the adapter does not take is answered as an error.
        else if (control) respond({ subtype: "error", request_id: control.id, error: `Owlery answers no control request of the subtype ${String(control.subtype)}` });
        for (const event of eventsForLine(line, launch === "refresh" ? undefined : launch.tools, keyed === true)) {
          if (event.type === "permission-withdrawn") waiting.delete(event.id);
          // The turn is over, and the end of the input ends the session. An answer given after it is written nowhere: the ended stream takes none.
          if (event.type === "result") child.stdin.end();
          listener(event);
        }
      });
      // The CLI's own process, whose resident memory the daemon reads as the agent's.
      return { stop, answer, ...(child.pid === undefined ? {} : { pid: child.pid }) };
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
    defaultLoginFolder,
    conversationsOf: conversationsIn,
    // The CLI the lookup finds signs a folder in and out, under the environment a role session is given, so no variable of the daemon's reaches it.
    logins: claudeLogins({ locate: located, envOf: (path, folder) => claudeEnv(env, path, folder), ownFolder: defaultLoginFolder }),
  };
}
