// The turn keeper: how many heavy commands hold a turn on the machine at
// once, and the order those that wait are given theirs. Each case gives the
// keeper its limit, its clock and its reading of the load, and starts no
// process.
import { describe, expect, it } from "vitest";
import { type Asked, MachineTurns, type TurnPlace, overLoad, untilCalm } from "../src/daemon/machine-turns";

const AT = 1_795_388_700_000;

/** The cores of the machine the cases read. */
const CORES = 4;

/** A keeper of the limit given, on a clock the case moves and with a load the case sets, which keeps what the queue was at each change it told of. A load of null is no reading. */
function keeper(limit: number) {
  let at = AT;
  let load: number | null = 2.5;
  const told: string[][] = [];
  const turns = new MachineTurns({ limit, now: () => at, load: () => load });
  turns.watch(() => told.push(shown(turns)));
  return {
    turns,
    told,
    tick: (ms: number): void => {
      at += ms;
    },
    setLoad: (value: number | null): void => {
      load = value;
    },
  };
}

/** The queue as one line for each ask: its state and its name. */
const shown = (turns: MachineTurns): string[] => turns.queue().map(({ state, name }) => `${state} ${name}`);

/** Asks in a folder of the name's own for a command of that name and place. */
function ask(turns: MachineTurns, name: string, place: TurnPlace, gone?: AbortSignal, alone = false): Asked {
  return turns.ask({ folder: `/work/${name}`, name, place, gone, alone });
}

/** Whether the promise settled within the time given. */
async function within(settles: Promise<unknown>, ms: number): Promise<boolean> {
  return Promise.race([settles.then(() => true), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), ms))]);
}

describe("the turns on the machine", () => {
  it("gives the turn that frees to what waits by its place, a broad gate, then a command under review, then one still being built, then one in a folder no work item names, and inside a place to the one that asked first", async () => {
    const { turns, tick } = keeper(1);
    const first = ask(turns, "first", "build");
    expect(first.waits).toBe(false);
    tick(1_000);
    const built = ask(turns, "built", "build");
    tick(1_000);
    const outside = ask(turns, "outside", "outside");
    tick(1_000);
    const reviewed = ask(turns, "reviewed", "review");
    tick(1_000);
    const builtLater = ask(turns, "built later", "build");
    tick(1_000);
    const gate = ask(turns, "gate", "gate");
    expect([built, outside, reviewed, builtLater, gate].map(({ waits }) => waits)).toEqual([true, true, true, true, true]);
    expect(shown(turns)).toEqual(["running first", "waiting gate", "waiting reviewed", "waiting built", "waiting built later", "waiting outside"]);
    expect(turns.queue()[1]).toEqual({ folder: "/work/gate", name: "gate", place: "gate", since: AT + 5_000, state: "waiting" });
    expect(turns.waitOf("/work/built")).toEqual({ name: "built", since: AT + 1_000, ahead: 2 });
    expect(turns.waitOf("/work/gate")).toEqual({ name: "gate", since: AT + 5_000, ahead: 0 });
    expect(turns.waitOf("/work/first")).toBeNull();
    // Each ask says how many go before it while it waits, and nothing once it holds its turn.
    expect([first, gate, reviewed, built, builtLater, outside].map((asked) => asked.ahead())).toEqual([null, 0, 1, 2, 3, 4]);

    const order: string[] = [];
    for (const asked of [first, gate, reviewed, built, builtLater, outside]) {
      const turn = await asked.turn;
      order.push(shown(turns)[0] ?? "");
      turn?.end();
    }
    expect(order).toEqual(["running first", "running gate", "running reviewed", "running built", "running built later", "running outside"]);
    expect(turns.queue()).toEqual([]);
  });

  it("lets as many commands run at once as the limit says, and the next waits with none ahead", async () => {
    const { turns } = keeper(2);
    const asked = ["one", "two", "three"].map((name) => ask(turns, name, "build"));
    expect(asked.map(({ waits }) => waits)).toEqual([false, false, true]);
    expect(shown(turns)).toEqual(["running one", "running two", "waiting three"]);
    expect(turns.waitOf("/work/three")).toEqual({ name: "three", since: AT, ahead: 0 });
    (await asked[1]?.turn)?.end();
    expect(shown(turns)).toEqual(["running one", "running three"]);
    expect(turns.waitOf("/work/three")).toBeNull();
  });

  it("ends a turn whose asker is gone and gives it to the next, drops an ask whose asker went before its turn came, takes no ask whose asker is gone already, and frees nothing more at a second end of one turn", async () => {
    const { turns } = keeper(1);
    const first = new AbortController();
    const second = new AbortController();
    const running = ask(turns, "running", "build", first.signal);
    const leaving = ask(turns, "leaving", "gate", second.signal);
    const next = ask(turns, "next", "build");
    const last = ask(turns, "last", "build");
    expect(turns.waitOf("/work/next")).toEqual({ name: "next", since: AT, ahead: 1 });

    second.abort();
    expect(await leaving.turn).toBeNull();
    expect(shown(turns)).toEqual(["running running", "waiting next", "waiting last"]);
    expect(turns.waitOf("/work/next")).toEqual({ name: "next", since: AT, ahead: 0 });
    expect([leaving.ahead(), next.ahead(), last.ahead()]).toEqual([null, 0, 1]);

    const turn = await running.turn;
    first.abort();
    expect(shown(turns)).toEqual(["running next", "waiting last"]);
    turn?.end();
    expect(shown(turns)).toEqual(["running next", "waiting last"]);
    expect(await next.turn).not.toBeNull();

    const gone = new AbortController();
    gone.abort();
    const late = ask(turns, "late", "gate", gone.signal);
    expect(await late.turn).toBeNull();
    expect(shown(turns)).toEqual(["running next", "waiting last"]);
    void last;
  });

  it("stops no command when the limit is lowered while two run, and gives the next turn once fewer run than the new limit", async () => {
    const { turns } = keeper(2);
    const [one, two, three] = ["one", "two", "three"].map((name) => ask(turns, name, "build"));
    turns.setLimit(1);
    expect(shown(turns)).toEqual(["running one", "running two", "waiting three"]);
    (await one?.turn)?.end();
    expect(shown(turns)).toEqual(["running two", "waiting three"]);
    (await two?.turn)?.end();
    expect(shown(turns)).toEqual(["running three"]);
    expect(await three?.turn).not.toBeNull();
  });

  it("gives the next turn at once where the limit is raised, to the first in the order", async () => {
    const { turns } = keeper(1);
    ask(turns, "one", "build");
    ask(turns, "two", "build");
    const gate = ask(turns, "gate", "gate");
    turns.setLimit(2);
    expect(shown(turns)).toEqual(["running one", "running gate", "waiting two"]);
    expect(await gate.turn).not.toBeNull();
  });

  it("starts an ask that must run alone only once no other command runs, and starts no other while it waits or runs, though the limit has room", async () => {
    const { turns } = keeper(2);
    const running = ask(turns, "running", "build");
    const alone = ask(turns, "alone", "gate", undefined, true);
    const reviewed = ask(turns, "reviewed", "review");
    expect(shown(turns)).toEqual(["running running", "waiting alone", "waiting reviewed"]);
    (await running.turn)?.end();
    const turn = await alone.turn;
    expect(shown(turns)).toEqual(["running alone", "waiting reviewed"]);
    const late = ask(turns, "late", "gate");
    expect(late.waits).toBe(true);
    turn?.end();
    expect(shown(turns)).toEqual(["running late", "running reviewed"]);
  });

  it("counts each command that held a turn during any part of a turn, keeps the highest load read while it was held, and reads a turn as over the machine's load where one did or where the load as it was given was above the cores", async () => {
    const { turns, setLoad } = keeper(2);
    const first = await ask(turns, "first", "build").turn;
    const second = await ask(turns, "second", "build").turn;
    setLoad(7);
    turns.sample();
    setLoad(5);
    turns.sample();
    first?.end();
    // A reading after a turn ended is not that turn's.
    setLoad(8);
    turns.sample();
    expect([first?.beside(), second?.beside(), first?.highest(), second?.highest()]).toEqual([1, 1, 7, 8]);
    expect([overLoad(first!, CORES), overLoad(second!, CORES)]).toEqual([true, true]);
    second?.end();
    setLoad(2.5);
    const calm = await ask(turns, "calm", "build").turn;
    expect([calm?.load, calm?.highest(), calm?.beside(), overLoad(calm!, CORES)]).toEqual([2.5, 2.5, 0, false]);
    calm?.end();
    setLoad(CORES + 0.5);
    const loaded = await ask(turns, "loaded", "build").turn;
    expect([loaded?.beside(), overLoad(loaded!, CORES), overLoad(loaded!, null)]).toEqual([0, true, false]);
    loaded?.end();
    setLoad(null);
    const unread = await ask(turns, "unread", "build").turn;
    turns.sample();
    expect([unread?.load, unread?.highest(), overLoad(unread!, CORES)]).toEqual([null, null, false]);
  });

  it("waits until the load is at or under the cores, for the calm wait at most, and not where the load or the cores are not read or the asker is gone", async () => {
    let load: number | null = CORES * 2;
    const calm = { waitMs: 300, pollMs: 10 };
    const calmed = untilCalm(() => load, CORES, calm);
    expect(await within(calmed, 100)).toBe(false);
    load = CORES;
    expect(await within(calmed, 100)).toBe(true);
    load = CORES * 2;
    const late = untilCalm(() => load, CORES, calm);
    expect(await within(late, 150)).toBe(false);
    expect(await within(late, 400)).toBe(true);
    expect(await within(untilCalm(() => load, null, calm), 5)).toBe(true);
    expect(await within(untilCalm(() => null, CORES, calm), 5)).toBe(true);
    const going = new AbortController();
    const left = untilCalm(() => load, CORES, calm, going.signal);
    going.abort();
    expect(await within(left, 50)).toBe(true);
  });

  it("gives each turn the load read when it was given, and tells each watcher of every change once the queue shows it, until the watcher stops watching", async () => {
    const { turns, told, setLoad } = keeper(1);
    const second: string[][] = [];
    const unwatch = turns.watch(() => second.push(shown(turns)));
    const first = ask(turns, "first", "build");
    expect(told).toEqual([["running first"]]);
    const gate = ask(turns, "second", "gate");
    expect(told.at(-1)).toEqual(["running first", "waiting second"]);
    setLoad(7.25);
    const turn = await first.turn;
    expect(turn?.load).toBe(2.5);
    turn?.end();
    expect(told.at(-1)).toEqual(["running second"]);
    expect((await gate.turn)?.load).toBe(7.25);
    expect(second).toEqual(told);
    unwatch();
    turns.setLimit(2);
    expect(told).toHaveLength(4);
    expect(second).toHaveLength(3);
    setLoad(null);
    expect((await ask(turns, "third", "build").turn)?.load).toBeNull();
  });
});
