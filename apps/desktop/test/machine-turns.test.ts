// The turn keeper: how many heavy commands hold a turn on the machine at
// once, and the order those that wait are given theirs. Each case gives the
// keeper its limit, its clock and its reading of the load, and starts no
// process.
import { describe, expect, it } from "vitest";
import { type Asked, MachineTurns, type TurnPlace } from "../src/daemon/machine-turns";

const AT = 1_795_388_700_000;

/** A keeper of the limit given, on a clock the case moves and with a load the case sets, which keeps what the queue was at each change it told of. */
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
function ask(turns: MachineTurns, name: string, place: TurnPlace, gone?: AbortSignal): Asked {
  return turns.ask({ folder: `/work/${name}`, name, place, gone });
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
