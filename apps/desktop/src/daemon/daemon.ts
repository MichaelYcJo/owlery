import { timingSafeEqual } from "node:crypto";
import type { AddressInfo } from "node:net";
import { WebSocketServer, type WebSocket } from "ws";
import { TerminalSession } from "./pty";
import { type ClientMessage, type PaneKind, type ServerMessage, type SessionInfo, UNAUTHORIZED } from "../shared/protocol";
import { agentEventFor } from "./agent-events";
import { OutputBuffer } from "./buffer";

export interface PaneCommand {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface DaemonOptions {
  token: string;
  /** The command of a new pane of that kind, given the pane's id. */
  commandFor: (kind: PaneKind, id: number) => PaneCommand;
  cwd?: string;
  /** How much recent output each session keeps for a client that reconnects. */
  bufferChars?: number;
  /** How long a client has to present the token. */
  helloTimeoutMs?: number;
  /** How long the daemon waits, with no session alive and no client connected, before it asks to exit. */
  idleExitMs?: number;
  onIdle?: () => void;
}

interface Session {
  info: SessionInfo;
  terminal: TerminalSession;
  output: OutputBuffer;
}

/**
 * Owns the terminal sessions and their output, and outlives the window. A
 * client reaches it over WebSocket on the loopback address and is refused
 * unless its first message carries the token.
 */
export class Daemon {
  private readonly sessions = new Map<number, Session>();
  private readonly clients = new Set<WebSocket>();
  private server: WebSocketServer | undefined;
  private nextId = 1;
  private idleTimer: NodeJS.Timeout | undefined;

  constructor(private readonly options: DaemonOptions) {}

  listen(port: number): Promise<number> {
    const server = new WebSocketServer({ host: "127.0.0.1", port });
    this.server = server;
    server.on("connection", (socket) => this.accept(socket));
    return new Promise((resolve, reject) => {
      server.once("error", reject);
      server.once("listening", () => {
        this.checkIdle();
        resolve((server.address() as AddressInfo).port);
      });
    });
  }

  address(): string | undefined {
    return (this.server?.address() as AddressInfo | undefined)?.address;
  }

  /** Delivers an agent's event for a pane to every client, as a neutral event. */
  agentEvent(paneId: number, hookName: string, payload: Record<string, unknown>): void {
    const event = agentEventFor(hookName);
    if (!event) return;
    const tool = typeof payload.tool_name === "string" ? payload.tool_name : null;
    this.broadcast({ type: "agent", id: paneId, event, tool, at: Date.now() });
  }

  async close(): Promise<void> {
    clearTimeout(this.idleTimer);
    for (const session of this.sessions.values()) if (session.info.alive) session.terminal.kill();
    for (const client of this.clients) client.terminate();
    await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
  }

  private accept(socket: WebSocket): void {
    let authorized = false;
    const helloTimer = setTimeout(() => socket.close(UNAUTHORIZED, "unauthorized"), this.options.helloTimeoutMs ?? 2000);
    socket.on("message", (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(String(raw)) as ClientMessage;
      } catch {
        socket.close(UNAUTHORIZED, "unauthorized");
        return;
      }
      if (!authorized) {
        clearTimeout(helloTimer);
        if (message.type !== "hello" || !this.tokenMatches(message.token)) {
          socket.close(UNAUTHORIZED, "unauthorized");
          return;
        }
        authorized = true;
        this.clients.add(socket);
        this.checkIdle();
        this.send(socket, { type: "ready", sessions: [...this.sessions.values()].map((s) => s.info) });
        return;
      }
      this.handle(socket, message);
    });
    socket.on("close", () => {
      clearTimeout(helloTimer);
      this.clients.delete(socket);
      this.checkIdle();
    });
    socket.on("error", () => socket.terminate());
  }

  private handle(socket: WebSocket, message: ClientMessage): void {
    switch (message.type) {
      case "start": {
        const id = this.nextId++;
        const { command, args, env } = this.options.commandFor(message.kind, id);
        const terminal = TerminalSession.spawn({
          command,
          args,
          cwd: this.options.cwd ?? process.cwd(),
          cols: message.cols,
          rows: message.rows,
          env: { ...process.env, ...env },
        });
        const session: Session = { info: { id, kind: message.kind, alive: true }, terminal, output: new OutputBuffer(this.options.bufferChars ?? 256 * 1024) };
        this.sessions.set(id, session);
        terminal.onData((data) => {
          session.output.append(data);
          this.broadcast({ type: "output", id, data });
        });
        terminal.onExit((exitCode) => {
          session.info.alive = false;
          this.broadcast({ type: "exit", id, exitCode });
          this.checkIdle();
        });
        this.checkIdle();
        this.send(socket, { type: "started", requestId: message.requestId, session: session.info });
        return;
      }
      case "attach": {
        const session = this.sessions.get(message.id);
        if (session) this.send(socket, { type: "replay", id: message.id, data: session.output.text() });
        return;
      }
      case "input":
        this.sessions.get(message.id)?.terminal.write(message.data);
        return;
      case "resize":
        this.sessions.get(message.id)?.terminal.resize(message.cols, message.rows);
        return;
      default:
        return;
    }
  }

  private tokenMatches(token: unknown): boolean {
    if (typeof token !== "string") return false;
    const given = Buffer.from(token);
    const expected = Buffer.from(this.options.token);
    return given.length === expected.length && timingSafeEqual(given, expected);
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    socket.send(JSON.stringify(message));
  }

  private broadcast(message: ServerMessage): void {
    const text = JSON.stringify(message);
    for (const client of this.clients) client.send(text);
  }

  private checkIdle(): void {
    clearTimeout(this.idleTimer);
    const busy = this.clients.size > 0 || [...this.sessions.values()].some((s) => s.info.alive);
    if (busy || !this.options.onIdle) return;
    this.idleTimer = setTimeout(() => this.options.onIdle?.(), this.options.idleExitMs ?? 60_000);
  }
}
