import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server, type Socket } from "node:net";
import { basename, dirname, join } from "node:path";

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

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * The command of a Claude Code pane: the user's interactive login shell, so
 * `claude` is found on the PATH their profile sets, replaced by `claude` with
 * Owlery's hook settings. The pane ends when `claude` does. With
 * `continueLatest`, `claude` starts on the latest conversation of the folder
 * the pane runs in, which Claude Code chooses, and ends at once where the
 * folder holds none.
 */
export function claudePaneCommand(env: NodeJS.ProcessEnv, settingsFile: string, continueLatest = false): { command: string; args: string[] } {
  const shell = env.SHELL || "/bin/zsh";
  return { command: shell, args: ["-l", "-i", "-c", `exec claude --settings ${shellQuote(settingsFile)}${continueLatest ? " --continue" : ""}`] };
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
