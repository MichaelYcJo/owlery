// The turns on the machine: how many heavy commands run at once, across every
// work item and every repository, and the order those that wait are given
// theirs. A heavy command is one that loads the whole machine, the broad gate
// always. The keeper starts no process and imports nothing of the daemon: it
// is given its limit, its clock and its reading of the load. The daemon asks
// it in process for the broad gate of its own chain, and for each command
// that asks on the turn socket (`turn-socket.ts`). It is no turn of
// `stage-records.ts#InTurn`, which puts the commits of one worktree in order.
// The queue lives in memory alone: a daemon that starts again holds none, and
// each command that still waits asks again.
import type { MachineWait } from "../shared/protocol";

/**
 * Where an ask stands in the order of those that wait, by what the person
 * waits on first: a work item's broad gate, which is one step from its
 * seal; a command of a work item whose branch holds a review round's record;
 * one of a work item whose branch holds none, still being built; and one run
 * in a folder no work item's records name.
 */
export type TurnPlace = "gate" | "review" | "build" | "outside";

/** The places, the first served first. */
export const TURN_PLACES: readonly TurnPlace[] = ["gate", "review", "build", "outside"];

/** The name the broad gate takes in the queue: a repository names its other heavy commands itself. */
export const BROAD_GATE_NAME = "Broad gate";

/** The limit of a daemon given no reading of the machine. */
export const NO_READING_LIMIT = 1;

/** How long a second run of a broad gate waits, at most, for the load average to come to the cores or under. */
export const CALM_WAIT_MS = 10 * 60_000;

/** How often that wait reads the load, and how often the daemon reads it during each turn. */
export const LOAD_EVERY_MS = 5_000;

/**
 * One command that asks for a turn: the folder it runs in, the worktree's
 * top, its name, its place, and whether it must run alone, as the second
 * run of a broad gate that failed while the machine was over its load does.
 * `gone` aborts once the asker is gone, which ends the ask or the turn.
 */
export interface TurnAsk {
  folder: string;
  name: string;
  place: TurnPlace;
  alone?: boolean;
  gone?: AbortSignal;
}

/**
 * A turn that was given: the load the keeper read as it was given, the
 * highest load it read while the turn was held, how many other commands
 * held a turn during any part of it, and what ends it, once however often
 * it is called. The two counts stop at the turn's end.
 */
export interface Turn {
  load: number | null;
  highest(): number | null;
  beside(): number;
  end(): void;
}

/** One ask as the queue lists it: what it asked with, when it asked, and whether it holds a turn. */
export interface Queued {
  folder: string;
  name: string;
  place: TurnPlace;
  since: number;
  state: "running" | "waiting";
}

export interface MachineTurnsOptions {
  /** How many heavy commands hold a turn at once. */
  limit: number;
  /** The clock an ask's `since` is read from; `Date.now` when absent. */
  now?: () => number;
  /** The load average a turn is given with, read as it is given; null for every turn when absent. */
  load?: () => number | null;
}

/** An ask as the keeper took it: whether it waits rather than holding its turn at once, the turn once it is given, or null where the asker went before it came, and how many of those that wait go before it, which is null once it holds its turn or has ended. */
export interface Asked {
  waits: boolean;
  turn: Promise<Turn | null>;
  ahead(): number | null;
}

interface Entry {
  ask: TurnAsk;
  since: number;
  /** The other asks that held a turn during any part of this one's. */
  beside: Set<Entry>;
  highest: number | null;
  /** Gives the asker the turn, or null where the ask ended before its turn came. */
  settle: (turn: Turn | null) => void;
  /** Stops listening for the asker's going. */
  forget: () => void;
}

/**
 * Gives turns: at most as many asks hold one at once as the limit says. An
 * ask that comes while the limit is full waits, and the turn that frees goes
 * to the first of those that wait by place (`TURN_PLACES`) and, inside a
 * place, to the one that asked first. An ask that must run alone is given
 * its turn once no other holds one, and while it waits first or holds its
 * turn no other is given one, whatever the limit. A turn is never taken
 * back for an ask that waits. A turn ends at its `end` and where its asker is gone; a lower
 * limit stops nothing and holds for the next turn, and a higher one gives
 * the next turns at once. Each ask and each grant is one synchronous step,
 * so the daemon's one thread needs no lock.
 */
export class MachineTurns {
  private limit: number;
  // The asks that hold a turn, in the order their turns were given.
  private readonly running: Entry[] = [];
  // The asks that wait, in the order they asked.
  private readonly waiting: Entry[] = [];
  private readonly watchers = new Set<() => void>();

  constructor(private readonly options: MachineTurnsOptions) {
    this.limit = options.limit;
  }

  /**
   * Asks for a turn. Its `turn` settles with the turn once it is given, or
   * with null where the asker went before it came, and at once where the
   * asker is gone already, which the queue then never lists.
   */
  ask(ask: TurnAsk): Asked {
    if (ask.gone?.aborted) return { waits: false, turn: Promise.resolve(null), ahead: () => null };
    let settle: (turn: Turn | null) => void = () => {};
    const turn = new Promise<Turn | null>((resolve) => {
      settle = resolve;
    });
    const entry: Entry = { ask, since: (this.options.now ?? Date.now)(), beside: new Set(), highest: null, settle, forget: () => {} };
    const leave = (): void => this.leave(entry);
    ask.gone?.addEventListener("abort", leave, { once: true });
    entry.forget = () => ask.gone?.removeEventListener("abort", leave);
    this.waiting.push(entry);
    this.give();
    this.tell();
    return {
      waits: this.waiting.includes(entry),
      turn,
      ahead: () => {
        const ahead = this.ordered().indexOf(entry);
        return ahead === -1 ? null : ahead;
      },
    };
  }

  /** Calls the watcher after every change of the queue or of the limit, once the queue shows it, until the function it gives is called. */
  watch(watcher: () => void): () => void {
    const own = (): void => watcher();
    this.watchers.add(own);
    return () => this.watchers.delete(own);
  }

  /** Reads the load once and keeps it as the highest of each turn held where it is higher than the one kept; it reads nothing while no turn is held. */
  sample(): void {
    if (this.running.length === 0) return;
    const load = this.options.load?.() ?? null;
    if (load === null) return;
    for (const entry of this.running) entry.highest = Math.max(entry.highest ?? load, load);
  }

  /** Sets the limit: a lower one stops no command that runs, and a higher one gives the next turns at once. */
  setLimit(limit: number): void {
    this.limit = limit;
    this.give();
    this.tell();
  }

  /** The asks that hold a turn, in the order their turns were given, then those that wait, in the order they will be given theirs. */
  queue(): Queued[] {
    const listed = (state: Queued["state"]) => ({ ask: { folder, name, place }, since }: Entry): Queued => ({ folder, name, place, since, state });
    return [...this.running.map(listed("running")), ...this.ordered().map(listed("waiting"))];
  }

  /** The wait of the folder's command that began to wait first, with how many of those that wait go before it, or null where none of the folder's waits. */
  waitOf(folder: string): MachineWait | null {
    const ordered = this.ordered();
    const first = this.waiting.find((entry) => entry.ask.folder === folder);
    return first === undefined ? null : { name: first.ask.name, since: first.since, ahead: ordered.indexOf(first) };
  }

  /** Those that wait, in the order they will be given their turns: by place, and inside a place in the order they asked, which the sort keeps since it is stable. */
  private ordered(): Entry[] {
    const rank = (entry: Entry): number => TURN_PLACES.indexOf(entry.ask.place);
    return [...this.waiting].sort((a, b) => rank(a) - rank(b));
  }

  /** Gives turns to those that wait first while fewer hold one than the limit, none of them alone, and the first that waits must not run alone or finds none holding one. */
  private give(): void {
    while (this.running.length < this.limit && !this.running.some((entry) => entry.ask.alone === true)) {
      const [next] = this.ordered();
      if (next === undefined || (next.ask.alone === true && this.running.length > 0)) return;
      this.waiting.splice(this.waiting.indexOf(next), 1);
      for (const other of this.running) {
        other.beside.add(next);
        next.beside.add(other);
      }
      this.running.push(next);
      const load = this.options.load?.() ?? null;
      next.highest = load;
      next.settle({ load, highest: () => next.highest, beside: () => next.beside.size, end: () => this.leave(next) });
    }
  }

  /** Ends an ask, whether it waits or holds a turn, and gives what that frees; an ask that ended already changes nothing. */
  private leave(entry: Entry): void {
    const waited = this.waiting.indexOf(entry);
    const ran = this.running.indexOf(entry);
    if (waited === -1 && ran === -1) return;
    if (waited !== -1) {
      this.waiting.splice(waited, 1);
      entry.settle(null);
    } else this.running.splice(ran, 1);
    entry.forget();
    this.give();
    this.tell();
  }

  private tell(): void {
    for (const watcher of [...this.watchers]) watcher();
  }
}

/** Whether the machine was over its load during a turn: another command held a turn during any part of it, or the load read as it was given was above the cores. */
export function overLoad(turn: Pick<Turn, "load" | "beside">, cores: number | null): boolean {
  return turn.beside() > 0 || (turn.load !== null && cores !== null && turn.load > cores);
}

/**
 * Settles once the load is at the cores or under, read every `pollMs`, and
 * at the latest `waitMs` after the call, whatever the load: at once where
 * there is no reading of the load or of the cores, and once `gone` aborts.
 */
export function untilCalm(load: () => number | null, cores: number | null, calm: { waitMs: number; pollMs: number }, gone?: AbortSignal): Promise<void> {
  const calmNow = (): boolean => {
    const read = load();
    return read === null || cores === null || read <= cores;
  };
  if (calmNow() || gone?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const done = (): void => {
      clearInterval(poll);
      clearTimeout(limit);
      gone?.removeEventListener("abort", done);
      resolve();
    };
    const poll = setInterval(() => calmNow() && done(), calm.pollMs);
    const limit = setTimeout(done, calm.waitMs);
    gone?.addEventListener("abort", done, { once: true });
  });
}
