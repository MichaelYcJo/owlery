// The turn socket: how a command outside the daemon asks it for a turn on the
// machine (`machine-turns.ts`), and how the chain command tells it the stage
// a pane's session runs. It is a Unix socket of the run folder beside the hook
// socket, readable by the user alone, and each message is one line of JSON,
// named by its field `is`. The runner of heavy commands and the chain
// command's `gate` each open one connection for one command: the command
// sends `ask` once; the daemon answers `waits` with how many go before it, at
// each change of that count while it waits, and `turn` once it may start.
// Once its command has ended, the command sends `ended` with the exit code
// and the peak memory, and the daemon answers `ran` with whether the machine
// was over its load during the run. A connection that closes ends its ask or
// its turn, so a command whose process is gone holds nothing. The chain
// command's `owed`, `round`, `fix-pass` and `seal` open a connection of their
// own for one `stage` or `stage-ended` line (`StageLine`), which the daemon
// hands its handler and answers with nothing, and close it. The chain command
// is built without `ws` (build.mjs), so the socket is Node's own `net`; the
// daemon's own chain asks the keeper in process and opens none.
import { chmodSync, existsSync, rmSync } from "node:fs";
import { createConnection, createServer, type Server, type Socket } from "node:net";
import { basename, dirname } from "node:path";
import { inside } from "./hooks";
import { CALM_WAIT_MS, LOAD_EVERY_MS, type MachineTurns, TURN_PLACES, type Turn, type TurnAsk, type TurnPlace, overLoad, untilCalm } from "./machine-turns";

/** The socket's file in the run folder. */
export const TURN_SOCKET = "turns.sock";

/** How a command's run ended, as the command tells it: the exit code, null where none was read, and the peak memory in bytes, null where none was read. */
export interface RunEnd {
  exitCode: number | null;
  peakMemory: number | null;
}

/** What the daemon read of a run: whether the machine was over its load during it, the highest load it read during it, how many other commands held a turn during any part of it, and the cores it compares a load with, null where it was given none. The last two are what a pane's sentence of an earlier run names (`chain.ts#earlierRunSays`). */
export interface Ran {
  over: boolean;
  highest: number | null;
  beside: number;
  cores: number | null;
}

/** One line of the runs' file (`heavy-runs.ts`), as the giver hands it over: the times are read from its clock. */
export interface HeavyRunTaken {
  folder: string;
  name: string;
  askedAt: number;
  startedAt: number;
  endedAt: number;
  exitCode: number | null;
  peakMemory: number | null;
  load: number | null;
  highestLoad: number | null;
  beside: boolean;
  alone: boolean;
}

/** A turn as the giver gives it: the keeper's, with when it was given, and, for a run that must run alone, the load read once its wait for the load ended. */
export type GivenTurn = Turn & { startedAt: number };

/** An ask as the giver took it: the keeper's answer with the turn as the giver gives it, the ask as the keeper took it, and when it asked. */
export interface GiverAsked {
  waits: boolean;
  turn: Promise<GivenTurn | null>;
  ahead(): number | null;
  ask: TurnAsk;
  askedAt: number;
}

/** What gives turns: the daemon, through `turnGiver`. */
export interface TurnGiver {
  /** Asks for a turn; one that must run alone is given it once the load is calm too (`untilCalm`). */
  ask(ask: TurnAsk): GiverAsked;
  /** Calls the watcher after every change of the queue, until the function it gives is called. */
  watch(watcher: () => void): () => void;
  /** Ends the turn of an ask whose command ended, keeps the run's line, and gives what the daemon read of the run. */
  ran(asked: GiverAsked, turn: GivenTurn, end: RunEnd): Ran;
}

/** What a giver is given: the cores, null where none were read, the reading of the load the keeper reads too, the calm wait, its clock, what names the folder of an ask before the keeper takes it, where a run's line is kept, and what it calls as it gives each turn, which is where a heavy command starts. */
export interface GiverOptions {
  cores: number | null;
  load: () => number | null;
  calm?: { waitMs: number; pollMs: number };
  now?: () => number;
  folderOf?: (folder: string) => string;
  kept?: (run: HeavyRunTaken) => void;
  started?: () => void;
}

/**
 * The giver of the keeper's turns. An ask that must run alone waits, once
 * the keeper has given its turn, until the load is at the cores or under,
 * for the calm wait at most (`CALM_WAIT_MS`), and holds the keeper's turn
 * meanwhile, so no other command starts; its run starts on the load read
 * as the wait ended, and its highest load counts from there. A turn ended
 * by `ran` keeps one line of the run.
 */
export function turnGiver(turns: MachineTurns, options: GiverOptions): TurnGiver {
  const now = options.now ?? Date.now;
  const calm = options.calm ?? { waitMs: CALM_WAIT_MS, pollMs: LOAD_EVERY_MS };
  return {
    ask: (asking) => {
      const ask = { ...asking, folder: options.folderOf?.(asking.folder) ?? asking.folder };
      const askedAt = now();
      const asked = turns.ask(ask);
      const load = options.load();
      const loaded = ask.alone === true && load !== null && options.cores !== null && load > options.cores;
      const turn = asked.turn.then(async (given): Promise<GivenTurn | null> => {
        if (given === null) return null;
        if (ask.alone === true) await untilCalm(options.load, options.cores, calm, ask.gone);
        if (ask.gone?.aborted === true) {
          given.end();
          return null;
        }
        options.started?.();
        // A second run that waited for the load starts on the load read now, and its highest load counts from its start: a reading during its wait is not its run's.
        const load = ask.alone === true ? options.load() : given.load;
        if (ask.alone === true) given.restart(load);
        return { ...given, load, startedAt: now() };
      });
      return { waits: asked.waits || loaded, turn, ahead: asked.ahead, ask, askedAt };
    },
    watch: (watcher) => turns.watch(watcher),
    ran: ({ ask, askedAt }, turn, end) => {
      turn.end();
      const ran: Ran = { over: overLoad(turn, options.cores), highest: turn.highest(), beside: turn.beside(), cores: options.cores };
      options.kept?.({ folder: ask.folder, name: ask.name, askedAt, startedAt: turn.startedAt, endedAt: now(), exitCode: end.exitCode, peakMemory: end.peakMemory, load: turn.load, highestLoad: ran.highest, beside: ran.beside > 0, alone: ask.alone === true });
      return ran;
    },
  };
}

/** What a command asks with: the worktree's top, the command's name, its place, and whether it must run alone. */
export interface TurnRequest {
  folder: string;
  name: string;
  place: TurnPlace;
  alone: boolean;
}

/** The kinds of stage `owed` hands a pane's session, which a `stage` line names. */
export const STAGE_KINDS = ["round", "fix-pass", "seal"] as const;

/**
 * A line the chain command tells the daemon, which the daemon answers with
 * nothing: `stage`, the stage `owed` handed the session of the pane `pane`
 * names in the worktree whose top `folder` is, with its kind and round; or
 * `stage-ended`, that the stage of that worktree ended.
 */
export type StageLine = { is: "stage"; folder: string; pane: number; kind: (typeof STAGE_KINDS)[number]; round: number } | { is: "stage-ended"; folder: string };

/** A whole number of zero or more, as a pane's id is. */
const wholeNumber = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/** A line read as a `stage` or a `stage-ended` line, or null where it is neither: no JSON, or a field missing or of another kind. */
function stageLineOf(line: string): StageLine | null {
  const { is, folder, pane, kind, round } = fieldsOf(line);
  if (typeof folder !== "string" || folder === "") return null;
  if (is === "stage-ended") return { is, folder };
  const named = STAGE_KINDS.find((stage) => stage === kind);
  if (is !== "stage" || !wholeNumber(pane) || named === undefined || !wholeNumber(round) || round < 1) return null;
  return { is, folder, pane, kind: named, round };
}

/** One line a side sends. */
type Message = ({ is: "ask" } & TurnRequest) | { is: "waits"; ahead: number } | { is: "turn"; load: number | null } | ({ is: "ended" } & RunEnd) | ({ is: "ran" } & Ran);

/** The first line of a text and what follows it, or null where it holds no whole line yet. */
function lineOf(text: string): [string, string] | null {
  const end = text.indexOf("\n");
  return end === -1 ? null : [text.slice(0, end), text.slice(end + 1)];
}

/** A line read as JSON's object, or an empty one where it is none. */
function fieldsOf(line: string): Partial<Record<string, unknown>> {
  let message: unknown;
  try {
    message = JSON.parse(line);
  } catch {
    return {};
  }
  return typeof message === "object" && message !== null ? (message as Record<string, unknown>) : {};
}

/** A line read as an `ask`, or null where it is none: no JSON, or a field missing or of another kind. */
function askOf(line: string): TurnRequest | null {
  const { is, folder, name, place, alone } = fieldsOf(line);
  if (is !== "ask" || typeof folder !== "string" || folder === "" || typeof name !== "string" || name === "" || !TURN_PLACES.includes(place as TurnPlace) || typeof alone !== "boolean") return null;
  return { folder, name, place: place as TurnPlace, alone };
}

/** A number the field holds, or null. */
const numberOf = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

const send = (socket: Socket, message: Message): void => {
  if (!socket.destroyed) socket.write(`${JSON.stringify(message)}\n`);
};

/** The daemon's side of the socket: it takes one ask on each connection and hands it to the giver, or one stage line and hands it to the handler. */
export class TurnServer {
  private readonly connections = new Set<Socket>();

  private constructor(
    private readonly server: Server,
    private readonly socketPath: string,
    private readonly giver: TurnGiver,
    private readonly told: (line: StageLine) => void,
  ) {}

  /** Listens at `socketPath`, bound by its file name from inside its folder as the hook socket is (`hooks.ts#HookServer`), over a socket an earlier daemon left. `told` is handed each stage line; a server given none reads a stage line and does nothing with it. */
  static listen(socketPath: string, giver: TurnGiver, told: (line: StageLine) => void = () => {}): Promise<TurnServer> {
    if (existsSync(socketPath)) rmSync(socketPath);
    const server = createServer();
    const turns = new TurnServer(server, socketPath, giver, told);
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
        const stage = stageLineOf(line[0]);
        socket.destroy();
        if (stage !== null) this.told(stage);
        return;
      }
      this.asked(socket, this.giver.ask({ ...request, gone: gone.signal }), line[1]);
    };
    socket.on("data", read);
  }

  /**
   * Tells the asker how many go before it at each change of that count
   * while it waits, and that its turn came once it did. Once the command
   * says it `ended`, the turn ends and the daemon answers `ran`; a
   * connection that closes while it holds the turn ends the run with no
   * exit code and no peak memory.
   */
  private asked(socket: Socket, asked: GiverAsked, rest: string): void {
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
      if (turn === null) return;
      let ended = false;
      const end = (run: RunEnd): Ran | null => {
        if (ended) return null;
        ended = true;
        return this.giver.ran(asked, turn, run);
      };
      if (socket.destroyed) {
        end({ exitCode: null, peakMemory: null });
        return;
      }
      socket.on("close", () => end({ exitCode: null, peakMemory: null }));
      let buffer = rest;
      const read = (chunk: string): void => {
        buffer += chunk;
        for (let line = lineOf(buffer); line !== null; line = lineOf(buffer)) {
          buffer = line[1];
          const { is, exitCode, peakMemory } = fieldsOf(line[0]);
          if (is !== "ended") continue;
          const ran = end({ exitCode: numberOf(exitCode), peakMemory: numberOf(peakMemory) });
          if (ran !== null) send(socket, { is: "ran", ...ran });
        }
      };
      socket.on("data", read);
      read("");
      send(socket, { is: "turn", load: turn.load });
    });
  }
}

/**
 * How an ask on the socket ended: with a turn, held until `end`; or with
 * none, where no daemon answered or the daemon ended before the turn came.
 * `end` with how the command ended tells the daemon, and settles with what
 * the daemon read of the run, or with null where the connection closed
 * first; with nothing, it closes the connection and settles with null.
 */
export type Taken = { held: true; load: number | null; end(run?: RunEnd): Promise<Ran | null> } | { held: false; why: "no daemon" | "daemon ended" };

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
    // What settles `end` once the daemon answers `ran` or the connection closes.
    let answered: (ran: Ran | null) => void = () => {};
    const end = (run?: RunEnd): Promise<Ran | null> => {
      if (run === undefined || connection.destroyed) {
        connection.destroy();
        return Promise.resolve(null);
      }
      const ran = new Promise<Ran | null>((resolve) => {
        answered = (got) => {
          answered = () => {};
          connection.destroy();
          resolve(got);
        };
      });
      connection.write(`${JSON.stringify({ is: "ended", ...run } satisfies Message)}\n`);
      return ran;
    };
    let buffer = "";
    connection.on("data", (chunk: string) => {
      buffer += chunk;
      for (let line = lineOf(buffer); line !== null; line = lineOf(buffer)) {
        buffer = line[1];
        const message = fieldsOf(line[0]);
        if (message.is === "waits" && typeof message.ahead === "number" && !settled) waiting(message.ahead);
        if (message.is === "turn") settle({ held: true, load: numberOf(message.load), end });
        if (message.is === "ran") answered({ over: message.over === true, highest: numberOf(message.highest), beside: numberOf(message.beside) ?? 0, cores: numberOf(message.cores) });
      }
    });
    connection.on("error", () => connection.destroy());
    connection.on("close", () => {
      answered(null);
      settle({ held: false, why: connected ? "daemon ended" : "no daemon" });
    });
  });
}

/** How long the chain command waits, at most, for a stage line's write to end. */
export const STAGE_LINE_WAIT_MS = 1_000;

/**
 * Tells the daemon whose socket stands at `socketPath` a stage line, on a
 * connection of its own, and settles once the line's write has ended, the
 * connection failed or `waitMs` passed, whichever comes first; the
 * connection is then closed. It waits for nothing the daemon answers, and
 * never throws: a socket path of null, a socket nobody listens on, a daemon
 * of an earlier build that closes the connection at once and a write that
 * fails each settle it with nothing said.
 */
export function tellStage(socketPath: string | null, line: StageLine, waitMs = STAGE_LINE_WAIT_MS): Promise<void> {
  if (socketPath === null || !existsSync(socketPath)) return Promise.resolve();
  return new Promise((resolve) => {
    let connection: Socket | undefined;
    let limit: NodeJS.Timeout | undefined;
    const settle = (): void => {
      clearTimeout(limit);
      connection?.destroy();
      resolve();
    };
    limit = setTimeout(settle, waitMs);
    try {
      inside(dirname(socketPath), () => {
        connection = createConnection(basename(socketPath));
      });
    } catch {
      settle();
      return;
    }
    connection?.on("error", settle);
    connection?.on("close", settle);
    connection?.end(`${JSON.stringify(line)}\n`, settle);
  });
}
