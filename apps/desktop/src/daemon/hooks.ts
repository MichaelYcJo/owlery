import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server, type Socket } from "node:net";
import { join } from "node:path";

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
// every pane.
const RELAY = `{ printf '%s\\n' "$OWLERY_PANE_ID"; cat; } | /usr/bin/nc -U -w 2 "$OWLERY_HOOK_SOCKET" >/dev/null 2>&1 || true`;

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

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * The command of a Claude Code pane: the user's interactive login shell, so
 * `claude` is found on the PATH their profile sets, replaced by `claude` with
 * Owlery's hook settings. The pane ends when `claude` does.
 */
export function claudePaneCommand(env: NodeJS.ProcessEnv, settingsFile: string): { command: string; args: string[] } {
  const shell = env.SHELL || "/bin/zsh";
  return { command: shell, args: ["-l", "-i", "-c", `exec claude --settings ${shellQuote(settingsFile)}`] };
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

  static listen(socketPath: string): Promise<HookServer> {
    if (existsSync(socketPath)) rmSync(socketPath);
    const server = createServer();
    const hooks = new HookServer(server, socketPath);
    server.on("connection", (socket) => hooks.accept(socket));
    return new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, () => {
        chmodSync(socketPath, 0o600);
        resolve(hooks);
      });
    });
  }

  onEvent(listener: (event: HookEvent) => void): void {
    this.listeners.push(listener);
  }

  close(): Promise<void> {
    return new Promise((resolve) => this.server.close(() => resolve()));
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
