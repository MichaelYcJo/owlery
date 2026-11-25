// The runner of heavy commands (`chain-command.ts#run`), which a session
// starts through the launcher `OWLERY_RUN` names: it looks a name up in the
// worktree's `Heavy commands`, asks the daemon for a turn on the turn socket
// of the run folder (`turn-socket.ts`), and runs the command in its turn.
// Each case runs the runner in its own process against a daemon of its own,
// or against a run folder no daemon listens in. No case starts an agent.
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routingText } from "../src/daemon/chain";
import { type CommandEnd, RUN_REFUSED, USAGE, chainCommand, daemonEndedSays, noDaemonSays, waitingSays } from "../src/daemon/chain-command";
import { type HeavyRun, readHeavyRuns } from "../src/daemon/heavy-runs";
import { MachineTurns } from "../src/daemon/machine-turns";
import { MARKER } from "../src/daemon/records-place";
import { TURN_SOCKET, TurnServer, takeTurn } from "../src/daemon/turn-socket";
import { type Cleanups, NOW, VERSION, commitAll, standing, until, write } from "./chain-run";
import { BUNDLE, commandOn } from "./chain-command-run";
import { temporaryRepository } from "./repositories";

const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** A command that marks its start in `$OUT` with its name, waits until a file of that name ending `.go` stands there, and marks its end. */
const holds = (name: string): string => `touch "$OUT/${name}.started"; while [ ! -e "$OUT/${name}.go" ]; do sleep 0.05; done; touch "$OUT/${name}.ended"`;

/** Writes the records root's config.json of a folder with these heavy commands, and commits it. */
function naming(folder: string, heavy: unknown): void {
  write(folder, "seal/README.md", `${MARKER}\n`);
  write(folder, "seal/config.json", `${JSON.stringify({ "Broad gate": "true", "Heavy commands": heavy }, null, 2)}\n`);
  commitAll(folder, "chore: name the heavy commands");
}

/** Runs the runner in a folder, with the run folder, `$OUT` and the variables given in its environment, hands each reading of its command's memory to `memoryRead`, and keeps each line it says on its error output while it runs. */
function runner(folder: string, runDir: string, out: string, args: string[], env: Record<string, string> = {}, memoryRead?: (bytes: number) => void): { end: Promise<CommandEnd>; said: string[] } {
  const said: string[] = [];
  const end = chainCommand(["run", ...args], { cwd: folder, env: { PATH: process.env.PATH, OWLERY_RUN_DIR: runDir, OUT: out, ...env }, bundleDir: BUNDLE, version: VERSION, now: () => NOW, say: (line) => said.push(line), memoryRead });
  return { end, said };
}


describe("the runner of heavy commands", { timeout: 60_000 }, () => {
  it("runs a named command in its turn: it says it waits while another heavy command holds the turn, its work item carries the wait though the daemon names the worktree through a link, the command starts once the other has ended with each word after `--` as one word, and the runner exits with the command's exit code (scenario C)", async () => {
    const stood = await standing(cleanups, ["Built work"], { linked: true });
    const [item] = stood.workItems as [(typeof stood.workItems)[number]];
    const worktree = realpathSync(item.worktree);
    expect(worktree).not.toBe(item.worktree);
    const out = stood.made.base;
    naming(worktree, { hold: holds("hold"), test: `sh -c '[ -e "$OUT/hold.ended" ] && printf "%s|" "$@" > "$OUT/test.args"; exit 3' test` });
    const server = await TurnServer.listen(join(stood.runDir, TURN_SOCKET), stood.d.turnGiver());
    cleanups.push(() => server.close());

    const holding = runner(worktree, stood.runDir, out, ["hold"]);
    await until(() => (existsSync(join(out, "hold.started")) ? true : undefined));
    expect(holding.said).toEqual([]);
    const test = runner(worktree, stood.runDir, out, ["test", "--", "a b", "it's"]);
    await until(() => (test.said.length > 0 ? true : undefined));
    expect(test.said).toEqual([waitingSays("test", 0)]);
    expect(await stood.c.until(() => stood.c.workItem(item.id)?.machineWait ?? undefined)).toEqual({ name: "test", since: NOW, ahead: 0 });

    writeFileSync(join(out, "hold.go"), "");
    expect(await holding.end).toEqual({ code: 0, out: "", err: "" });
    expect(await test.end).toEqual({ code: 3, out: "", err: "" });
    expect(readFileSync(join(out, "test.args"), "utf8")).toBe("a b|it's|");
    await stood.c.until(() => (stood.c.workItem(item.id)?.machineWait === null ? true : undefined));
  });

  it("asks in the place the committed records give: a work item whose branch holds a review round's record goes before one still being built, and that before a folder no work item's records name, and tells each that waits its count again only when it changes", async () => {
    const stood = await standing(cleanups, ["Reviewed work", "Built work"]);
    const [reviewed, built] = stood.workItems as [(typeof stood.workItems)[number], (typeof stood.workItems)[number]];
    const loose = temporaryRepository();
    cleanups.push(loose.remove);
    const out = stood.made.base;
    const appends = 'echo "$(basename "$PWD")" >> "$OUT/order"';
    for (const [index, item] of [reviewed, built].entries()) {
      const directory = `seal/threads/${String(index + 1)}-work`;
      write(item.worktree, `${directory}/routing.md`, routingText(`${String(index + 1)}-work`, item.branch, "2026-11-25"));
      if (item === reviewed) write(item.worktree, `${directory}/trail/rounds/round-1.md`, "# Review round 1\n");
      naming(item.worktree, { mark: appends });
    }
    naming(loose.repo, { mark: appends });
    const giver = stood.d.turnGiver();
    const server = await TurnServer.listen(join(stood.runDir, TURN_SOCKET), giver);
    cleanups.push(() => server.close());

    const held = giver.ask({ folder: out, name: "held", place: "gate" });
    const asked = [];
    for (const folder of [loose.repo, built.worktree, reviewed.worktree]) {
      const run = runner(folder, stood.runDir, out, ["mark"]);
      await until(() => (run.said.length > 0 ? true : undefined));
      asked.push(run);
    }
    // Each ask that comes goes before those of a later place, and each runner says so as the count before it grows.
    const [first] = asked as [(typeof asked)[number]];
    await until(() => (first.said.length === 3 ? true : undefined));
    expect(asked.map(({ said }) => said)).toEqual([
      [waitingSays("mark", 0), waitingSays("mark", 1), waitingSays("mark", 2)],
      [waitingSays("mark", 0), waitingSays("mark", 1)],
      [waitingSays("mark", 0)],
    ]);
    // An ask of the last place moves none of those that wait, and none of them says its count again.
    const later = runner(loose.repo, stood.runDir, out, ["mark"]);
    await until(() => (later.said.length > 0 ? true : undefined));
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect([...asked, later].map(({ said }) => said.length)).toEqual([3, 2, 1, 1]);
    expect(later.said).toEqual([waitingSays("mark", 3)]);
    (await held.turn)?.end();
    for (const run of [...asked, later]) expect((await run.end).code).toBe(0);
    expect(readFileSync(join(out, "order"), "utf8")).toBe(`${[reviewed.worktree, built.worktree, loose.repo, loose.repo].map((folder) => basename(folder)).join("\n")}\n`);
  });

  it("keeps one line for the run in the run folder's file: its repository, work item and name, when it asked, started and ended, its exit code and the peak memory of the command and what it started, read while the command holds it (scenario I)", async () => {
    const stood = await standing(cleanups, ["Measured work"], { now: Date.now });
    const [item] = stood.workItems as [(typeof stood.workItems)[number]];
    const out = stood.made.base;
    // The shell starts a child that holds 64 MiB until the case has seen a reading of the memory find it, so no reading's time decides the case.
    naming(item.worktree, { hold: `python3 -c "b = bytearray(64 * 1024 * 1024); import time; time.sleep(600)" & while [ ! -e "$OUT/hold.go" ]; do sleep 0.05; done; kill $!; exit 4` });
    const server = await TurnServer.listen(join(stood.runDir, TURN_SOCKET), stood.d.turnGiver());
    cleanups.push(() => server.close());
    const asked = Date.now();
    const readings: number[] = [];
    const holding = runner(item.worktree, stood.runDir, out, ["hold"], {}, (bytes) => readings.push(bytes));
    await until(() => (readings.some((bytes) => bytes > 64 * 1024 * 1024) ? true : undefined), 50_000);
    const released = Date.now();
    writeFileSync(join(out, "hold.go"), "");
    expect(await holding.end).toEqual({ code: 4, out: "", err: "" });
    const runs = await until(() => {
      const kept = readHeavyRuns(stood.runDir);
      return kept.length > 0 ? kept : undefined;
    });
    expect(runs).toEqual([
      {
        repo: stood.made.repo,
        workItemId: item.id,
        folder: item.worktree,
        name: "hold",
        askedAt: expect.any(Number),
        startedAt: expect.any(Number),
        endedAt: expect.any(Number),
        exitCode: 4,
        peakMemory: expect.any(Number),
        load: null,
        highestLoad: null,
        beside: false,
        alone: false,
      },
    ]);
    const [run] = runs as [HeavyRun];
    expect(run.askedAt).toBeGreaterThanOrEqual(asked);
    expect(run.startedAt).toBeGreaterThanOrEqual(run.askedAt);
    expect(run.startedAt).toBeLessThanOrEqual(released);
    expect(run.endedAt).toBeGreaterThanOrEqual(released);
    expect(run.peakMemory).toBeGreaterThan(64 * 1024 * 1024);

    // A command whose connection closes while it holds its turn, before it says how it ended, is kept with no exit code and no peak memory.
    const taken = await takeTurn(join(stood.runDir, TURN_SOCKET), { folder: item.worktree, name: "gone", place: "build", alone: false }, () => {});
    expect(taken.held).toBe(true);
    if (taken.held) expect(await taken.end()).toBeNull();
    const gone = await until(() => readHeavyRuns(stood.runDir)[1]);
    expect(gone).toMatchObject({ workItemId: item.id, name: "gone", exitCode: null, peakMemory: null });
  });

  it("reads the load the daemon is given only while a heavy command holds or waits for a turn, every reading time apart, and keeps no reading timer while none does", async () => {
    let reads = 0;
    const samples = vi.spyOn(MachineTurns.prototype, "sample");
    try {
      const stood = await standing(cleanups, ["Idle work"], { load: () => (reads++, 1), cores: 4, loadEveryMs: 20 });
      const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      await pause(200);
      expect([reads, samples.mock.calls.length]).toEqual([0, 0]);
      const giver = stood.d.turnGiver();
      const held = await giver.ask({ folder: "/elsewhere/held", name: "held", place: "build", alone: false }).turn;
      const waiting = giver.ask({ folder: "/elsewhere/waiting", name: "waiting", place: "build", alone: false });
      await pause(200);
      expect(reads).toBeGreaterThan(4);
      held?.end();
      (await waiting.turn)?.end();
      const after = [reads, samples.mock.calls.length];
      await pause(200);
      expect([reads, samples.mock.calls.length]).toEqual(after);
    } finally {
      samples.mockRestore();
    }
  });

  it("runs a named command at once where no daemon answers, and says so in one sentence (scenario D)", async () => {
    const on = commandOn(cleanups);
    naming(on.repo, { test: `sh -c 'printf "%s|" "$@" > "$OUT/test.args"; exit 5' test` });
    const run = runner(on.repo, on.runDir, on.folder, ["test", "--", "one"]);
    expect(await run.end).toEqual({ code: 5, out: "", err: "" });
    expect(run.said).toEqual([noDaemonSays("test")]);
    expect(readFileSync(join(on.folder, "test.args"), "utf8")).toBe("one|");
  });

  it("runs the command without the variable its launcher sets for Electron's Node, as a pane gives the session's environment", async () => {
    const on = commandOn(cleanups);
    naming(on.repo, { test: 'printf "%s" "${ELECTRON_RUN_AS_NODE-unset}" > "$OUT/test.env"' });
    const run = runner(on.repo, on.runDir, on.folder, ["test"], { ELECTRON_RUN_AS_NODE: "1" });
    expect((await run.end).code).toBe(0);
    expect(readFileSync(join(on.folder, "test.env"), "utf8")).toBe("unset");
  });

  it("runs the command at once where the daemon ends while the runner waits, and says that it waited and that the daemon ended", async () => {
    const stood = await standing(cleanups, ["Built work"]);
    const [item] = stood.workItems as [(typeof stood.workItems)[number]];
    const out = stood.made.base;
    naming(item.worktree, { test: 'touch "$OUT/test.ran"' });
    const giver = stood.d.turnGiver();
    const server = await TurnServer.listen(join(stood.runDir, TURN_SOCKET), giver);
    const held = giver.ask({ folder: out, name: "held", place: "gate" });
    const run = runner(item.worktree, stood.runDir, out, ["test"]);
    await until(() => (run.said.length > 0 ? true : undefined));
    expect(existsSync(join(out, "test.ran"))).toBe(false);
    await server.close();
    expect(await run.end).toEqual({ code: 0, out: "", err: "" });
    expect(run.said).toEqual([waitingSays("test", 0), daemonEndedSays("test")]);
    expect(existsSync(join(out, "test.ran"))).toBe(true);
    (await held.turn)?.end();
  });

  it("refuses with exit code 64 and runs nothing: a name the repository does not hold, with the names it holds, a repository whose key names none, a run with no name, and words not after `--`", async () => {
    const on = commandOn(cleanups);
    naming(on.repo, { test: 'touch "$OUT/ran"', install: 'touch "$OUT/ran"' });
    const refused = async (args: string[]): Promise<string> => {
      const run = runner(on.repo, on.runDir, on.folder, args);
      const end = await run.end;
      expect(end.code, args.join(" ")).toBe(RUN_REFUSED);
      expect(run.said, args.join(" ")).toEqual([]);
      return end.err;
    };
    expect(RUN_REFUSED).toBe(64);
    expect(await refused(["lint"])).toBe('The repository names no heavy command "lint" under "Heavy commands" of seal/config.json. It names `test` and `install`.\n');
    expect(await refused([])).toBe(`\`run\` takes the name of a heavy command the repository names.\n${USAGE}`);
    expect(await refused(["test", "a.test.ts"])).toBe(`\`run\` takes the words it adds to the command after \`--\`.\n${USAGE}`);
    naming(on.repo, "pnpm test");
    expect(await refused(["test"])).toBe('The repository names no heavy command "test" under "Heavy commands" of seal/config.json. It names none.\n');
    expect(existsSync(join(on.folder, "ran"))).toBe(false);
  });
});
