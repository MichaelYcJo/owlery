import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server, type Socket } from "node:net";
import { basename, dirname, join } from "node:path";
import type { PaneKind } from "../shared/protocol";
import { CONFIG_DIR_VARIABLE } from "./adapters/claude-accounts";
import type { PaneCommand, PaneStart } from "./daemon";
import { loginShell } from "./pty";
import { writeWholeFile } from "./whole-file";

/**
 * The Claude Code hook events Owlery listens to: the inbox reads session state
 * from them, and the phone will read the conversation from them
 * (docs/architecture.md, "The phone: the terminal session as a chat").
 */
export const HOOK_EVENTS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PermissionRequest",
  "Notification",
  "Stop",
] as const;

export interface HookEvent {
  paneId: number;
  name: string;
  payload: Record<string, unknown>;
}

interface CommandHook {
  type: "command";
  command: string;
}
export interface HookSettings {
  hooks: Record<string, { matcher: string; hooks: CommandHook[] }[]>;
}

// The hook sends the pane's id and the event's JSON to Owlery's socket with the
// macOS `nc`, and always exits 0, so a session goes on when Owlery is not there.
// The pane and the socket come from the pane's environment, so one file serves
// every pane. `nc` is given the socket's name from inside the socket's folder,
// because macOS refuses a socket path over 104 bytes and a run folder can be
// longer than that. Where the folder is gone `nc` does not run, so the event
// reaches no socket of the same name in the session's own folder.
const RELAY = `{ printf '%s\\n' "$OWLERY_PANE_ID"; cat; } | { cd "\${OWLERY_HOOK_SOCKET%/*}" && /usr/bin/nc -U -w 2 "\${OWLERY_HOOK_SOCKET##*/}"; } >/dev/null 2>&1 || true`;

/** The settings Owlery passes to the `claude` it launches. They add to the user's own settings and change none. */
export function hookSettings(): HookSettings {
  const hooks: HookSettings["hooks"] = {};
  for (const event of HOOK_EVENTS) hooks[event] = [{ matcher: "*", hooks: [{ type: "command", command: RELAY }] }];
  return { hooks };
}

/** Writes the hook settings into Owlery's own directory and returns the file's path. */
export function writeHookSettings(dir: string): string {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, "claude-hooks.json");
  writeFileSync(file, JSON.stringify(hookSettings(), null, 2), { mode: 0o600 });
  return file;
}

/** The settings file of one pane that is launched with settings of its own, in the folder of the file every other pane shares. */
export function paneSettingsFile(dir: string, id: number): string {
  return join(dir, `claude-pane-${String(id)}.json`);
}

/**
 * Writes the settings of one pane that carries the owl chain under the
 * person's choice of it, and returns the file's path: the hooks every pane
 * gets, and `enabledPlugins` as the pane's launch gives it, which is what
 * the person's own files state with the AgenticSeal plugin's key set to
 * `false` (`pane-chain.ts#carriedIn`). `claude` reads the file above the
 * person's settings files, so that plugin stays out of this one session and
 * no file of the person's is written. The file is named for the pane, so a
 * launch in another repository writes another file, and it is written over
 * at the next such launch of a pane of that id.
 */
export function writePaneSettings(dir: string, id: number, enabledPlugins: Record<string, unknown>): string {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = paneSettingsFile(dir, id);
  writeWholeFile(file, JSON.stringify({ ...hookSettings(), enabledPlugins }, null, 2));
  return file;
}

/**
 * Runs `act` with the process's working directory moved into `dir`, and moves
 * it back before returning, whether `act` returned or threw. Nothing else runs
 * in between: `act` is synchronous, and the daemon runs on one thread.
 */
function inside(dir: string, act: () => void): void {
  const back = process.cwd();
  process.chdir(dir);
  try {
    act();
  } finally {
    process.chdir(back);
  }
}

/** A value as one word of a shell's command line, whatever it holds. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * What a Claude Code pane that carries the owl chain is launched with: the
 * role bundle's folder, the file of the pane's head, and the launcher of the
 * chain command. `pane-chain.ts` writes the two files and says which folder
 * carries the chain.
 */
export interface PaneChain {
  bundleDir: string;
  headFile: string;
  launcher: string;
}

/**
 * What one launch of a Claude Code pane carries of the owl chain: the chain,
 * and the `enabledPlugins` its own settings file holds where the person's
 * Claude Code enables the AgenticSeal plugin and they chose the owl chain.
 * Null there is a pane that takes the settings file every pane shares.
 */
export interface Carried {
  chain: PaneChain;
  enabledPlugins: Record<string, unknown> | null;
}

/**
 * The command of a Claude Code pane: the user's interactive login shell, so
 * `claude` is found on the PATH their profile sets, replaced by `claude` with
 * Owlery's hook settings. The pane ends when `claude` does. Where the pane
 * carries the owl chain, `claude` loads the role bundle as a plugin of this
 * session alone and ends its system prompt with the pane's head. Both reach
 * it on its command line, so no settings file of the person's is written.
 * With `continueLatest`, `claude` starts on the latest conversation of the
 * folder the pane runs in, which Claude Code chooses, and ends at once where
 * the folder holds none. With `accountDir`, the folder of the pane's
 * account, `claude` is started through `env` with that folder as its config
 * folder: the variable is set in the command, after the login profile ran,
 * because a profile that exports its own replaces a value of the pane's
 * environment. Without it nothing is set, and `claude` reads the folder the
 * shell gives it.
 */
export function claudePaneCommand(env: NodeJS.ProcessEnv, settingsFile: string, continueLatest = false, chain: PaneChain | null = null, accountDir: string | null = null): { command: string; args: string[] } {
  const shell = env.SHELL || "/bin/zsh";
  const under = accountDir === null ? "" : `env ${CONFIG_DIR_VARIABLE}=${shellQuote(accountDir)} `;
  const carried = chain === null ? "" : ` --plugin-dir ${shellQuote(chain.bundleDir)} --append-system-prompt-file ${shellQuote(chain.headFile)}`;
  return { command: shell, args: ["-l", "-i", "-c", `exec ${under}claude --settings ${shellQuote(settingsFile)}${carried}${continueLatest ? " --continue" : ""}`] };
}

/**
 * The daemon's `commandFor`: a pane's command by its kind, with the pane's id
 * and the hook socket in its environment, where the hook command reads both.
 * A Claude Code pane continues where the start asks it, and a shell never does.
 * `carries` says what a Claude Code pane of a start carries of the owl
 * chain, so this module reads no repository and no settings of the person's
 * itself. A pane that carries the chain also holds the launcher of the chain
 * command in `OWLERY_CHAIN`, and the work item's base in `OWLERY_BASE` where
 * the start names one. Where its launch names `enabledPlugins`, the pane is
 * given a settings file of its own, written here beside `settingsFile`
 * before the command is returned (`writePaneSettings`). A shell is asked
 * nothing and carries nothing, in whatever folder it opens. Where the start
 * names the folder of the pane's account, a Claude Code pane is given it in
 * its command (`claudePaneCommand`) and a shell in its environment, so a
 * `claude` the person types there takes it unless their profile sets its
 * own. Under System default neither is given a folder.
 */
export function paneCommands(env: NodeJS.ProcessEnv, settingsFile: string, socketPath: string, carries: (start: PaneStart) => Carried | null = () => null): (kind: PaneKind, id: number, start: PaneStart) => PaneCommand {
  return (kind, id, start) => {
    const carried = kind === "claude" ? carries(start) : null;
    const chain = carried?.chain ?? null;
    const settings = carried == null || carried.enabledPlugins === null ? settingsFile : writePaneSettings(dirname(settingsFile), id, carried.enabledPlugins);
    const account: Record<string, string> = kind === "claude" || start.accountDir === null ? {} : { [CONFIG_DIR_VARIABLE]: start.accountDir };
    return {
      ...(kind === "claude" ? claudePaneCommand(env, settings, start.continueLatest, chain, start.accountDir) : loginShell(env)),
      env: { OWLERY_PANE_ID: String(id), OWLERY_HOOK_SOCKET: socketPath, ...account, ...(chain === null ? {} : { OWLERY_CHAIN: chain.launcher, ...(start.base === null ? {} : { OWLERY_BASE: start.base }) }) },
    };
  };
}

/**
 * The command of a setup pane: the command a repository's `.worktreesetup`
 * holds, passed whole to the user's interactive login shell, as a Claude Code
 * pane's command is, so it finds the PATH their profile sets and reads the
 * text as a line typed in a pane. The pane ends when the command does. Its
 * environment holds the pane's id.
 */
export function setupPaneCommand(env: NodeJS.ProcessEnv, command: string, id: number): PaneCommand {
  return { command: env.SHELL || "/bin/zsh", args: ["-l", "-i", "-c", command], env: { OWLERY_PANE_ID: String(id) } };
}

/** Reads the pane's id on the first line and the hook's JSON after it; anything else is no event. */
export function parseEvent(text: string): HookEvent | undefined {
  const newline = text.indexOf("\n");
  if (newline < 0) return undefined;
  const paneId = Number.parseInt(text.slice(0, newline), 10);
  let payload: unknown;
  try {
    payload = JSON.parse(text.slice(newline + 1));
  } catch {
    return undefined;
  }
  if (!Number.isInteger(paneId) || typeof payload !== "object" || payload === null || Array.isArray(payload)) return undefined;
  const record = payload as Record<string, unknown>;
  const name = typeof record.hook_event_name === "string" ? record.hook_event_name : "unknown";
  return { paneId, name, payload: record };
}

/** A Unix socket, readable by the user alone, that receives the hook events of the panes. */
export class HookServer {
  private readonly listeners: ((event: HookEvent) => void)[] = [];

  private constructor(
    private readonly server: Server,
    readonly socketPath: string,
  ) {}

  /**
   * Listens at `socketPath`, an absolute path of any length the file system takes.
   * macOS refuses a socket path over 104 bytes, counted on the string the system is
   * given, so the socket is bound by its file name from inside its folder. Node binds
   * during the call of `listen`, so the working directory is moved for that call alone.
   */
  static listen(socketPath: string): Promise<HookServer> {
    if (existsSync(socketPath)) rmSync(socketPath);
    const server = createServer();
    const hooks = new HookServer(server, socketPath);
    server.on("connection", (socket) => hooks.accept(socket));
    return new Promise((resolve, reject) => {
      server.once("error", reject);
      inside(dirname(socketPath), () =>
        server.listen(basename(socketPath), () => {
          chmodSync(socketPath, 0o600);
          resolve(hooks);
        }),
      );
    });
  }

  onEvent(listener: (event: HookEvent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Stops listening and removes the socket file. Node removes it during the call of
   * `close`, by the name the server was bound with, so the call is made from inside the
   * socket's folder: made from anywhere else it would leave the socket and remove a file
   * of that name from the working directory.
   */
  close(): Promise<void> {
    return new Promise((resolve) => inside(dirname(this.socketPath), () => this.server.close(() => resolve())));
  }

  private accept(socket: Socket): void {
    // The hook's `nc` closes its side once the event is sent, so the event is read whole at the end.
    let buffer = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      buffer += chunk;
    });
    socket.on("end", () => {
      const event = parseEvent(buffer);
      if (event) for (const listener of this.listeners) listener(event);
    });
    socket.on("error", () => socket.destroy());
  }
}
