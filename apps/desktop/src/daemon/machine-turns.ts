// The turns on the machine: how many heavy commands run at once, across every
// work item and every repository, and the order those that wait are given
// theirs. A heavy command is one that loads the whole machine, the broad gate
// always. The keeper starts no process and imports nothing of the daemon: it
// is given its limit, its clock and its reading of the load, and the daemon
// asks it in process for the broad gate of its own chain. It is no turn of
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

/** One command that asks for a turn: the folder it runs in, the worktree's top, its name, and its place. `gone` aborts once the asker is gone, which ends the ask or the turn. */
export interface TurnAsk {
  folder: string;
  name: string;
  place: TurnPlace;
  gone?: AbortSignal;
}

/** A turn that was given: the load the keeper read as it was given, and what ends it, once however often it is called. */
export interface Turn {
  load: number | null;
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
  /** Called after every change of the queue or of the limit, once the queue shows it. */
  changed?: () => void;
}

interface Entry {
  ask: TurnAsk;
  /** Counted across the keeper's life, so a lower one asked first. */
  order: number;
  since: number;
  /** Gives the asker the turn, or null where the ask ended before its turn came. */
  settle: (turn: Turn | null) => void;
  /** Stops listening for the asker's going. */
  forget: () => void;
}

/**
 * Gives turns: at most as many asks hold one at once as the limit says. An
 * ask that comes while the limit is full waits, and the turn that frees goes
 * to the first of those that wait by place (`TURN_PLACES`) and, inside a
 * place, to the one that asked first. A turn is never taken back for an ask
 * that waits. A turn ends at its `end` and where its asker is gone; a lower
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
  private asked = 0;

  constructor(private readonly options: MachineTurnsOptions) {
    this.limit = options.limit;
  }

  /**
   * Asks for a turn: `waits` says whether the ask waits rather than holding
   * its turn at once, and `turn` settles with the turn once it is given, or
   * with null where the asker went before it came, and at once where the
   * asker is gone already, which the queue then never lists.
   */
  ask(ask: TurnAsk): { waits: boolean; turn: Promise<Turn | null> } {
    if (ask.gone?.aborted) return { waits: false, turn: Promise.resolve(null) };
    let settle: (turn: Turn | null) => void = () => {};
    const turn = new Promise<Turn | null>((resolve) => {
      settle = resolve;
    });
    const entry: Entry = { ask, order: this.asked, since: (this.options.now ?? Date.now)(), settle, forget: () => {} };
    this.asked += 1;
    const leave = (): void => this.leave(entry);
    ask.gone?.addEventListener("abort", leave, { once: true });
    entry.forget = () => ask.gone?.removeEventListener("abort", leave);
    this.waiting.push(entry);
    this.give();
    this.options.changed?.();
    return { waits: this.waiting.includes(entry), turn };
  }

  /** Sets the limit: a lower one stops no command that runs, and a higher one gives the next turns at once. */
  setLimit(limit: number): void {
    this.limit = limit;
    this.give();
    this.options.changed?.();
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

  /** Those that wait, in the order they will be given their turns. */
  private ordered(): Entry[] {
    const rank = (entry: Entry): number => TURN_PLACES.indexOf(entry.ask.place);
    return [...this.waiting].sort((a, b) => rank(a) - rank(b) || a.order - b.order);
  }

  /** Gives turns while fewer hold one than the limit and an ask waits. */
  private give(): void {
    while (this.running.length < this.limit) {
      const [next] = this.ordered();
      if (next === undefined) return;
      this.waiting.splice(this.waiting.indexOf(next), 1);
      this.running.push(next);
      next.settle({ load: this.options.load?.() ?? null, end: () => this.leave(next) });
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
    this.options.changed?.();
  }
}
