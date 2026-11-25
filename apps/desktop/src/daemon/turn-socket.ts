// The turn socket: how a command outside the daemon asks it for a turn on the
// machine (`machine-turns.ts`). The runner of heavy commands and the chain
// command's `gate` each open one connection for one command, which is a Unix
// socket of the run folder beside the hook socket, readable by the user
// alone. Each message is one line of JSON. The command sends `ask` once; the
// daemon answers `waits` with how many go before it, at each change of that
// count while it waits, and `turn` once it may start. A connection that
// closes ends its ask or its turn, so a command whose process is gone holds
// nothing. The chain command is built without `ws` (build.mjs), so the
// socket is Node's own `net`; the daemon's own chain asks the keeper in
// process and opens none.
import { chmodSync, existsSync, rmSync } from "node:fs";
import { createConnection, createServer, type Server, type Socket } from "node:net";
import { basename, dirname } from "node:path";
import { inside } from "./hooks";
import { type Asked, TURN_PLACES, type TurnAsk, type TurnPlace } from "./machine-turns";

/** The socket's file in the run folder. */
export const TURN_SOCKET = "turns.sock";

/** What gives turns: the keeper, or the daemon, which names a worktree as its work item does before it asks the keeper. */
export interface TurnGiver {
  ask(ask: TurnAsk): Asked;
  /** Calls the watcher after every change of the queue, until the function it gives is called. */
  watch(watcher: () => void): () => void;
}

/** What a command asks with: the worktree's top, the command's name and its place. */
export interface TurnRequest {
  folder: string;
  name: string;
  place: TurnPlace;
}

/** One line a side sends. */
type Message = ({ is: "ask" } & TurnRequest) | { is: "waits"; ahead: number } | { is: "turn"; load: number | null };

/** The first line of a text and what follows it, or null where it holds no whole line yet. */
function lineOf(text: string): [string, string] | null {
  const end = text.indexOf("\n");
  return end === -1 ? null : [text.slice(0, end), text.slice(end + 1)];
}

/** A line read as an `ask`, or null where it is none: no JSON, or a field missing or of another kind. */
function askOf(line: string): TurnRequest | null {
  let message: unknown;
  try {
    message = JSON.parse(line);
  } catch {
    return null;
  }
  const { is, folder, name, place } = (typeof message === "object" && message !== null ? message : {}) as Record<string, unknown>;
  if (is !== "ask" || typeof folder !== "string" || folder === "" || typeof name !== "string" || name === "" || !TURN_PLACES.includes(place as TurnPlace)) return null;
  return { folder, name, place: place as TurnPlace };
}

const send = (socket: Socket, message: Message): void => {
  if (!socket.destroyed) socket.write(`${JSON.stringify(message)}\n`);
};

/** The daemon's side of the socket: it takes one ask on each connection and hands it to the giver. */
export class TurnServer {
  private readonly connections = new Set<Socket>();

  private constructor(
    private readonly server: Server,
    private readonly socketPath: string,
    private readonly giver: TurnGiver,
  ) {}

  /** Listens at `socketPath`, bound by its file name from inside its folder as the hook socket is (`hooks.ts#HookServer`), over a socket an earlier daemon left. */
  static listen(socketPath: string, giver: TurnGiver): Promise<TurnServer> {
    if (existsSync(socketPath)) rmSync(socketPath);
    const server = createServer();
    const turns = new TurnServer(server, socketPath, giver);
    server.on("connection", (socket) => turns.accept(socket));
    return new Promise((resolve, reject) => {
      server.once("error", reject);
      inside(dirname(socketPath), () =>
        server.listen(basename(socketPath), () => {
          chmodSync(socketPath, 0o600);
          resolve(turns);
        }),
      );
    });
  }

  /** Stops listening, removes the socket file and closes every connection, which ends each ask and each turn it holds: a command that waits then runs at once, as it does where no daemon answers. */
  close(): Promise<void> {
    const closed = new Promise<void>((resolve) => inside(dirname(this.socketPath), () => this.server.close(() => resolve())));
    for (const socket of this.connections) socket.destroy();
    return closed;
  }

  private accept(socket: Socket): void {
    this.connections.add(socket);
    const gone = new AbortController();
    socket.on("close", () => {
      this.connections.delete(socket);
      gone.abort();
    });
    socket.on("error", () => socket.destroy());
    socket.setEncoding("utf8");
    let buffer = "";
    const read = (chunk: string): void => {
      buffer += chunk;
      const line = lineOf(buffer);
      if (line === null) return;
      socket.off("data", read);
      const request = askOf(line[0]);
      if (request === null) {
        socket.destroy();
        return;
      }
      this.asked(socket, this.giver.ask({ ...request, gone: gone.signal }));
    };
    socket.on("data", read);
  }

  /** Tells the asker how many go before it at each change of that count while it waits, and that its turn came once it did. */
  private asked(socket: Socket, asked: Asked): void {
    let told: number | null = null;
    const tell = (): void => {
      const ahead = asked.ahead();
      if (ahead === null || ahead === told) return;
      told = ahead;
      send(socket, { is: "waits", ahead });
    };
    const unwatch = this.giver.watch(tell);
    socket.on("close", unwatch);
    tell();
    void asked.turn.then((turn) => {
      unwatch();
      if (turn !== null) send(socket, { is: "turn", load: turn.load });
    });
  }
}

/** How an ask on the socket ended: with a turn, held until `end`; or with none, where no daemon answered or the daemon ended before the turn came. */
export type Taken = { held: true; load: number | null; end(): void } | { held: false; why: "no daemon" | "daemon ended" };

/**
 * Asks the daemon whose socket stands at `socketPath` for a turn, and calls
 * `waiting` with how many go before the ask each time the daemon says it.
 * A socket path of null, a socket nobody listens on and a connection that
 * fails are no daemon. The turn is held until `end` is called or this
 * process is gone.
 */
export function takeTurn(socketPath: string | null, request: TurnRequest, waiting: (ahead: number) => void): Promise<Taken> {
  if (socketPath === null || !existsSync(socketPath)) return Promise.resolve({ held: false, why: "no daemon" });
  return new Promise((resolve) => {
    let connected = false;
    let settled = false;
    const settle = (taken: Taken): void => {
      if (settled) return;
      settled = true;
      resolve(taken);
    };
    let connection!: Socket;
    inside(dirname(socketPath), () => {
      connection = createConnection(basename(socketPath));
    });
    connection.setEncoding("utf8");
    connection.on("connect", () => {
      connected = true;
      connection.write(`${JSON.stringify({ is: "ask", ...request } satisfies Message)}\n`);
    });
    let buffer = "";
    connection.on("data", (chunk: string) => {
      buffer += chunk;
      for (let line = lineOf(buffer); line !== null && !settled; line = lineOf(buffer)) {
        buffer = line[1];
        let message: Partial<Record<string, unknown>>;
        try {
          message = JSON.parse(line[0]) as Partial<Record<string, unknown>>;
        } catch {
          continue;
        }
        if (message.is === "waits" && typeof message.ahead === "number") waiting(message.ahead);
        if (message.is === "turn") settle({ held: true, load: typeof message.load === "number" ? message.load : null, end: () => connection.destroy() });
      }
    });
    connection.on("error", () => connection.destroy());
    connection.on("close", () => settle({ held: false, why: connected ? "daemon ended" : "no daemon" }));
  });
}
