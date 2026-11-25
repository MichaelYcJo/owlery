import { mkdtempSync, readFileSync, rmSync, statfsSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { placesFree, queueOrder } from "../src/daemon/agent-queue";
import { AgentMemoryStore, LimitsStore, type MachineProbes, type MachineReader, readMachine, turnReading } from "../src/daemon/machine";
import { agentsProposal, agentsSays, capRefusal, GIB, heavyProposal, heavySays, MIB, panesProposal, panesSays, readingSays, worktreesProposal, worktreesSays } from "../src/shared/machine";
import type { MachineReading } from "../src/shared/protocol";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

/** A folder of the case's own, removed after it. */
function folder(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-machine-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** The owner's Mac as the framer's probe read it on 2026-11-25: 36 GB, 12 cores of which 6 are performance cores, and 25.1 GB free of 494.4 GB. */
const OWNERS_MAC: MachineReading = { memoryBytes: 38_654_705_664, cores: 12, performanceCores: 6, load: 3.9, disk: { freeBytes: 25_088_950_272, totalBytes: 494_384_795_648 } };

/** Probes that answer as a machine of 8 GB and 8 cores does, each counting its calls, with `sysctl` given by the case. */
function probes(sysctl: (key: string) => string, more: Partial<MachineProbes> = {}) {
  const calls = { memoryBytes: 0, cores: 0, load: 0, sysctl: [] as string[], statfs: [] as string[] };
  const given: MachineProbes = {
    memoryBytes: () => (calls.memoryBytes++, 8 * GIB),
    cores: () => (calls.cores++, 8),
    load: () => (calls.load++, 1.5),
    sysctl: (key) => (calls.sysctl.push(key), sysctl(key)),
    statfs: (at) => (calls.statfs.push(at), { freeBytes: 1, totalBytes: 2 }),
    // No process stands for a case that gives no `ps`, and `du` prints no size for a case that gives none.
    ps: () => Promise.resolve(""),
    du: () => Promise.resolve(""),
    ...more,
  };
  return { given, calls };
}

describe("the proposal of the cap on agents", () => {
  it("is the smaller of the performance cores and half of the memory at 679 MB an agent before any agent is measured, and its sentence names both numbers and which is the cap (scenario 1)", () => {
    const agents = agentsProposal(OWNERS_MAC, []);
    expect(agents).toEqual({ proposed: 6, byCores: 6, byMemory: 27, perAgentBytes: 679 * MIB, measured: 0 });
    expect(agentsSays(OWNERS_MAC, agents)).toBe("The default is 6: the 6 performance cores, fewer than the 27 that half of 36 GB holds at 679 MB an agent (not measured on this Mac yet).");

    const wide = { ...OWNERS_MAC, performanceCores: 32, cores: 40 };
    const byMemory = agentsProposal(wide, []);
    expect(byMemory).toEqual({ proposed: 27, byCores: 32, byMemory: 27, perAgentBytes: 679 * MIB, measured: 0 });
    expect(agentsSays(wide, byMemory)).toBe("The default is 27: the 27 that half of 36 GB holds at 679 MB an agent (not measured on this Mac yet), fewer than the 32 performance cores.");
  });

  it("takes the highest of what was measured once five agents are, and 679 MB before (scenario 2, the formula)", () => {
    const small: MachineReading = { ...OWNERS_MAC, memoryBytes: 8 * GIB, cores: 8, performanceCores: 8 };
    const five = [700, 766, 650, 720, 600].map((mb) => mb * MIB);
    const measured = agentsProposal(small, five);
    expect(measured).toEqual({ proposed: 5, byCores: 8, byMemory: 5, perAgentBytes: 766 * MIB, measured: 5 });
    expect(agentsSays(small, measured)).toBe("The default is 5: the 5 that half of 8 GB holds at 766 MB an agent (the highest of the last 5 agents measured here), fewer than the 8 cores.");

    const four = agentsProposal(small, five.slice(0, 4));
    expect(four).toEqual({ proposed: 6, byCores: 8, byMemory: 6, perAgentBytes: 679 * MIB, measured: 4 });
    expect(agentsSays(small, four)).toBe("The default is 6: the 6 that half of 8 GB holds at 679 MB an agent (not measured on this Mac yet: 4 agents of the 5 it takes), fewer than the 8 cores.");
    expect(agentsSays(small, agentsProposal(small, five.slice(0, 1)))).toContain("(not measured on this Mac yet: 1 agent of the 5 it takes)");
  });

  it("says the cores where they are as many as the memory gives, and is never under 1", () => {
    const even: MachineReading = { ...OWNERS_MAC, memoryBytes: 8 * GIB, cores: 6, performanceCores: 6 };
    expect(agentsSays(even, agentsProposal(even, []))).toBe("The default is 6: the 6 cores, as many as the 6 that half of 8 GB holds at 679 MB an agent (not measured on this Mac yet).");
    const tiny: MachineReading = { ...OWNERS_MAC, memoryBytes: GIB, cores: 4, performanceCores: 2 };
    const least = agentsProposal(tiny, []);
    expect(least).toEqual({ proposed: 1, byCores: 2, byMemory: 0, perAgentBytes: 679 * MIB, measured: 0 });
    expect(agentsSays(tiny, least)).toBe("The default is 1, the least it can be: half of 1 GB holds no agent at 679 MB an agent (not measured on this Mac yet).");
  });
});

describe("the proposal of the cap on panes side by side", () => {
  it("is 4 under 16 GB of memory, 6 from 16 GB and 8 from 32 GB, and its sentence says so", () => {
    expect(panesProposal({ ...OWNERS_MAC, memoryBytes: 16 * GIB - 1 })).toBe(4);
    expect(panesProposal({ ...OWNERS_MAC, memoryBytes: 16 * GIB })).toBe(6);
    expect(panesProposal({ ...OWNERS_MAC, memoryBytes: 32 * GIB - 1 })).toBe(6);
    expect(panesProposal({ ...OWNERS_MAC, memoryBytes: 32 * GIB })).toBe(8);
    expect(panesProposal(OWNERS_MAC)).toBe(8);
    expect(panesSays(OWNERS_MAC, 8)).toBe("The default is 8, for 36 GB of memory: 4 under 16 GB, 6 from 16 GB and 8 from 32 GB.");
  });
});

describe("the proposal of the cap on worktrees", () => {
  it("is nothing until a worktree is measured, and then the worktrees that stand and as many more as the free disk less 10 GB holds", () => {
    expect(worktreesProposal(OWNERS_MAC, 3, null)).toBeNull();
    expect(worktreesSays(OWNERS_MAC, { proposed: null, standing: 3, perWorktreeBytes: null })).toBe("Nothing is proposed until a worktree is measured on this Mac.");
    // (25.1 GB - 10 GB) / 440 MB is 34.
    expect(worktreesProposal(OWNERS_MAC, 3, 440_000_000)).toBe(37);
    expect(worktreesSays(OWNERS_MAC, { proposed: 37, standing: 3, perWorktreeBytes: 440_000_000 })).toBe("The default is 37: the 3 that stand, and 34 more that 25.1 GB free holds at 440 MB a worktree, with 10 GB kept free.");
    // A disk with less free than is kept free holds no more.
    expect(worktreesProposal({ ...OWNERS_MAC, disk: { freeBytes: 9_000_000_000, totalBytes: 1 } }, 3, 440_000_000)).toBe(3);
    expect(worktreesProposal({ ...OWNERS_MAC, disk: null }, 3, 440_000_000)).toBeNull();
    expect(worktreesSays({ ...OWNERS_MAC, disk: null }, { proposed: null, standing: 3, perWorktreeBytes: 440_000_000 })).toBe("Nothing is proposed: the disk of the worktrees' folder could not be read.");
  });
});

describe("the proposal of the limit on heavy commands", () => {
  it("is one for each 8 cores or one for each 16 GB of memory, whichever gives fewer, and never under 1, and its sentence gives both numbers (scenario E)", () => {
    expect(heavyProposal(OWNERS_MAC)).toEqual({ proposed: 1, byCores: 1, byMemory: 2 });
    expect(heavySays(heavyProposal(OWNERS_MAC))).toBe("The default is 1: one for each 8 cores gives 1, one for each 16 GB gives 2, and the fewer is taken.");
    const large: MachineReading = { ...OWNERS_MAC, cores: 32, memoryBytes: 64 * GIB };
    expect(heavyProposal(large)).toEqual({ proposed: 4, byCores: 4, byMemory: 4 });
    expect(heavySays(heavyProposal(large))).toBe("The default is 4: one for each 8 cores and one for each 16 GB both give 4.");
    expect(heavyProposal({ ...OWNERS_MAC, cores: 16, memoryBytes: 32 * GIB - 1 })).toEqual({ proposed: 1, byCores: 2, byMemory: 1 });
    const least: MachineReading = { ...OWNERS_MAC, cores: 1, memoryBytes: GIB };
    expect(heavyProposal(least)).toEqual({ proposed: 1, byCores: 0, byMemory: 0 });
    expect(heavySays(heavyProposal(least))).toBe("The default is 1, the least it can be: one for each 8 cores gives 0, and one for each 16 GB gives 0.");
  });
});

describe("what the window says of the reading, and of a value a person gives a cap", () => {
  it("states the reading in one sentence, the performance cores only where they are fewer than the cores", () => {
    expect(readingSays(OWNERS_MAC)).toBe("36 GB of memory, 12 cores of which 6 are performance cores, a load of 3.9, and 25.1 GB free of 494.4 GB on the worktrees' disk.");
    expect(readingSays({ ...OWNERS_MAC, performanceCores: 12, load: 0, disk: null })).toBe("36 GB of memory, 12 cores, a load of 0, and the worktrees' disk not read.");
  });

  it("refuses a value that is no whole number, one under 1, and a cap on panes over 16, with a sentence", () => {
    for (const cap of ["agents", "worktrees", "panes"] as const) {
      expect(capRefusal(cap, 1)).toBeNull();
      expect(capRefusal(cap, 16)).toBeNull();
    }
    expect(capRefusal("agents", 40)).toBeNull();
    expect(capRefusal("agents", 0)).toBe("The cap on agents at once is a whole number from 1.");
    expect(capRefusal("worktrees", 2.5)).toBe("The cap on worktrees is a whole number from 1.");
    expect(capRefusal("agents", "3")).toBe("The cap on agents at once is a whole number from 1.");
    expect(capRefusal("panes", 17)).toBe("The cap on panes side by side is a whole number from 1 to 16.");
    expect(capRefusal("panes", 0)).toBe("The cap on panes side by side is a whole number from 1 to 16.");
  });

  it("refuses a limit on heavy commands over the machine's cores, and none where the cores are not given", () => {
    expect(capRefusal("heavyCommands", 12, 12)).toBeNull();
    expect(capRefusal("heavyCommands", 13, 12)).toBe("The limit on heavy commands at once is a whole number from 1 to 12.");
    expect(capRefusal("heavyCommands", 0, 12)).toBe("The limit on heavy commands at once is a whole number from 1 to 12.");
    expect(capRefusal("heavyCommands", 40)).toBeNull();
    expect(capRefusal("heavyCommands", 0)).toBe("The limit on heavy commands at once is a whole number from 1.");
  });
});

describe("the reading of the machine", () => {
  it("reads the performance cores from `sysctl -n hw.perflevel0.physicalcpu`, and all the cores where it prints no whole number above 0, fails, or cannot start (scenario 17)", () => {
    const at = folder();
    expect(readMachine({}, probes(() => "6\n").given).read(at).performanceCores).toBe(6);
    const asked = probes(() => "6\n");
    readMachine({}, asked.given);
    expect(asked.calls.sysctl).toEqual(["hw.perflevel0.physicalcpu"]);
    for (const printed of ["", "0\n", "-2\n", "6.5\n", "none\n"]) expect(readMachine({}, probes(() => printed).given).read(at).performanceCores).toBe(8);
    const failing = (): string => {
      throw Object.assign(new Error("Command failed: /usr/sbin/sysctl -n hw.perflevel0.physicalcpu"), { status: 1 });
    };
    expect(readMachine({}, probes(failing).given).read(at).performanceCores).toBe(8);
    const absent = (): string => {
      throw Object.assign(new Error("spawnSync /usr/sbin/sysctl ENOENT"), { code: "ENOENT" });
    };
    expect(readMachine({}, probes(absent).given).read(at).performanceCores).toBe(8);
  });

  it("reads the memory, the cores and the performance cores once, and the load and the disk at each read", () => {
    const at = folder();
    const { given, calls } = probes(() => "4\n");
    const reader = readMachine({}, given);
    expect(reader.read(at)).toEqual({ memoryBytes: 8 * GIB, cores: 8, performanceCores: 4, load: 1.5, disk: { freeBytes: 1, totalBytes: 2 } });
    reader.read(at);
    expect(calls).toEqual({ memoryBytes: 1, cores: 1, load: 2, sysctl: ["hw.perflevel0.physicalcpu"], statfs: [at, at] });
  });

  it("reads the disk of the nearest folder above the worktrees' folder that stands, and none where no folder answers", () => {
    const at = folder();
    const reading = readMachine({}, probes(() => "4", { statfs: undefined }).given);
    const disk = reading.read(join(at, "worktrees", "not-yet"))?.disk;
    const real = statfsSync(at);
    expect(disk?.totalBytes).toBe(real.blocks * real.bsize);
    expect(disk?.freeBytes).toBeGreaterThan(0);
    const none = probes(() => "4", {
      statfs: () => {
        throw Object.assign(new Error("ENOENT: no such file or directory"), { code: "ENOENT" });
      },
    });
    expect(readMachine({}, none.given).read(join(at, "a")).disk).toBeNull();
    // A path through a file is walked up as one that does not stand; any other error is no disk, read at the folder alone.
    const failing = (code: string) => {
      const asked: string[] = [];
      const failed = probes(() => "4", {
        statfs: (place) => {
          asked.push(place);
          if (place === join(at, "file", "worktrees")) throw Object.assign(new Error(code), { code });
          return { freeBytes: 1, totalBytes: 2 };
        },
      });
      return { disk: readMachine({}, failed.given).read(join(at, "file", "worktrees")).disk, asked };
    };
    expect(failing("ENOTDIR")).toEqual({ disk: { freeBytes: 1, totalBytes: 2 }, asked: [join(at, "file", "worktrees"), join(at, "file")] });
    expect(failing("EACCES")).toEqual({ disk: null, asked: [join(at, "file", "worktrees")] });
  });

  it("gives the turn keeper the cores once and the load at each call, from the reader of the worktrees' folder", () => {
    const asked: string[] = [];
    let load = 3.9;
    const reader: MachineReader = { read: (at) => (asked.push(at), { ...OWNERS_MAC, load }), memoryOf: () => Promise.resolve(new Map()), sizeOf: () => Promise.resolve(null) };
    const given = turnReading(reader, "/worktrees");
    expect(given.cores).toBe(12);
    expect(given.load()).toBe(3.9);
    load = 13.1;
    expect(given.load()).toBe(13.1);
    expect(asked).toEqual(["/worktrees", "/worktrees", "/worktrees"]);
  });

  it("takes the reading `OWLERY_MACHINE` holds in place of the machine's, and asks the machine nothing (scenario 16)", () => {
    const { given, calls } = probes(() => "4");
    const reader = readMachine({ OWLERY_MACHINE: JSON.stringify({ memoryBytes: OWNERS_MAC.memoryBytes, cores: 12, performanceCores: 6, freeBytes: 25_088_950_272, totalBytes: 494_384_795_648 }) }, given);
    expect(reader.read(folder())).toEqual({ ...OWNERS_MAC, load: 0 });
    expect(readMachine({ OWLERY_MACHINE: JSON.stringify({ memoryBytes: 1, cores: 1, performanceCores: 1, freeBytes: 0, totalBytes: 0, load: 2.5 }) }, given).read("/").load).toBe(2.5);
    expect(calls).toEqual({ memoryBytes: 0, cores: 0, load: 0, sysctl: [], statfs: [] });
    // Set empty, it holds no reading, and the machine is read.
    expect(readMachine({ OWLERY_MACHINE: "" }, given).read("/").performanceCores).toBe(4);
  });

  it.each([
    ["text that is no JSON", "36 GB"],
    ["JSON that is no object", "[1,2]"],
    ["an object without the free disk", JSON.stringify({ memoryBytes: 1, cores: 1, performanceCores: 1, totalBytes: 0 })],
    ["a count of cores that is no whole number above 0", JSON.stringify({ memoryBytes: 1, cores: 0, performanceCores: 1, freeBytes: 0, totalBytes: 0 })],
    ["a number given as text", JSON.stringify({ memoryBytes: "1", cores: 1, performanceCores: 1, freeBytes: 0, totalBytes: 0 })],
    ["performance cores in a fraction", JSON.stringify({ memoryBytes: 1, cores: 1, performanceCores: 2.5, freeBytes: 0, totalBytes: 0 })],
    ["a number under 0",JSON.stringify({ memoryBytes: 1, cores: 1, performanceCores: 1, freeBytes: -1, totalBytes: 0 })],
    ["a number past what a number holds", '{"memoryBytes":1e999,"cores":1,"performanceCores":1,"freeBytes":0,"totalBytes":0}'],
  ])("refuses `OWLERY_MACHINE` that holds %s, with a sentence", (_, text) => {
    expect(() => readMachine({ OWLERY_MACHINE: text }, probes(() => "4").given)).toThrow("OWLERY_MACHINE is not a JSON object with memoryBytes, cores, performanceCores, freeBytes and totalBytes, each a number of 0 or more and the cores whole numbers from 1");
  });
});

describe("the caps a person set", () => {
  it("keeps them in `limits.json` of the run folder, readable by the user alone, where a store started later reads them, and drops a cap returned to its proposal", () => {
    const runDir = folder();
    const store = new LimitsStore(runDir);
    expect(store.get()).toEqual({ agents: null, worktrees: null, panes: null, heavyCommands: null });
    store.set({ agents: 3 });
    expect(readFileSync(join(runDir, "limits.json"), "utf8")).toBe('{"agents":3}');
    expect(statSync(join(runDir, "limits.json")).mode & 0o777).toBe(0o600);
    store.set({ panes: 12 });
    expect(new LimitsStore(runDir).get()).toEqual({ agents: 3, worktrees: null, panes: 12, heavyCommands: null });
    store.set({ agents: null });
    expect(readFileSync(join(runDir, "limits.json"), "utf8")).toBe('{"panes":12}');
    expect(new LimitsStore(runDir).get()).toEqual({ agents: null, worktrees: null, panes: 12, heavyCommands: null });
  });

  it("keeps the limit on heavy commands under its own key beside the caps, where a store started later reads it (scenario E)", () => {
    const runDir = folder();
    const store = new LimitsStore(runDir);
    store.set({ agents: 3, heavyCommands: 2 });
    expect(readFileSync(join(runDir, "limits.json"), "utf8")).toBe('{"agents":3,"heavyCommands":2}');
    expect(new LimitsStore(runDir).get()).toEqual({ agents: 3, worktrees: null, panes: null, heavyCommands: 2 });
    store.set({ heavyCommands: null });
    expect(new LimitsStore(runDir).get().heavyCommands).toBeNull();
  });

  it.each([
    ["values the daemon would refuse", '{"agents":0,"worktrees":2.5,"panes":17,"heavyCommands":0}'],
    ["text that is no JSON", "agents=3"],
    ["JSON that is no object", "null"],
    ["numbers given as text", '{"agents":"3"}'],
  ])("reads a file that holds %s as no cap set", (_, text) => {
    const runDir = folder();
    writeFileSync(join(runDir, "limits.json"), text);
    expect(new LimitsStore(runDir).get()).toEqual({ agents: null, worktrees: null, panes: null, heavyCommands: null });
  });

  it("keeps the caps in memory alone where it is given no run folder", () => {
    const store = new LimitsStore(undefined);
    store.set({ worktrees: 4 });
    expect(store.get()).toEqual({ agents: null, worktrees: 4, panes: null, heavyCommands: null });
  });
});

describe("the memory of the agents, measured", () => {
  it("keeps each agent's highest reading, for the last twenty agents read, in `agent-memory.json` of the run folder, readable by the user alone, where a store started later reads them (scenario 2, the store)", () => {
    const runDir = folder();
    const store = new AgentMemoryStore(runDir);
    expect(store.kilobytes()).toEqual([]);
    expect(store.note("pane-1", 600)).toBe(true);
    expect(store.note("pane-1", 700)).toBe(true);
    // A lower reading of the same agent keeps its highest, and changes nothing.
    expect(store.note("pane-1", 650)).toBe(false);
    expect(store.note("headless-1", 400)).toBe(true);
    expect(store.kilobytes()).toEqual([700, 400]);
    expect(readFileSync(join(runDir, "agent-memory.json"), "utf8")).toBe("[700,400]");
    expect(statSync(join(runDir, "agent-memory.json")).mode & 0o777).toBe(0o600);
    for (let agent = 2; agent <= 21; agent += 1) store.note(`pane-${String(agent)}`, agent);
    expect(store.kilobytes()).toEqual(Array.from({ length: 20 }, (_, index) => index + 2));
    // An agent no longer among the living is forgotten: where its name comes again it is a new agent. One still living keeps its highest.
    store.keepLiving(new Set(["pane-20"]));
    expect(store.note("pane-20", 1)).toBe(false);
    expect(store.note("pane-21", 1)).toBe(true);
    expect(new AgentMemoryStore(runDir).kilobytes()).toEqual([...Array.from({ length: 19 }, (_, index) => index + 3), 1]);
  });

  it.each([
    ["text that is no JSON", "700"],
    ["JSON that is no list", '{"kilobytes":[700]}'],
    ["values that are no whole numbers above 0", "[700,0,-1,2.5,\"800\"]"],
  ])("reads a file that holds %s as the values in it that are kilobytes, and none else", (_, text) => {
    const runDir = folder();
    writeFileSync(join(runDir, "agent-memory.json"), text);
    expect(new AgentMemoryStore(runDir).kilobytes()).toEqual(text.startsWith("[") ? [700] : []);
  });

  it("reads the last twenty of a file that holds more", () => {
    const runDir = folder();
    writeFileSync(join(runDir, "agent-memory.json"), JSON.stringify(Array.from({ length: 25 }, (_, index) => index + 1)));
    expect(new AgentMemoryStore(runDir).kilobytes()).toEqual(Array.from({ length: 20 }, (_, index) => index + 6));
  });

  it("keeps the measures in memory alone where it is given no run folder", () => {
    const store = new AgentMemoryStore(undefined);
    store.note("pane-1", 700);
    expect(store.kilobytes()).toEqual([700]);
  });

  it("reads the resident memory of the processes named with one `ps` call, in kilobytes, and none of a process that is gone", async () => {
    const asked: number[][] = [];
    const { given } = probes(() => "4", {
      ps: (pids) => {
        asked.push([...pids]);
        // `ps` prints a line for each process that stands, and exits 1 where one is gone.
        return Promise.resolve("  101 614400\n  103   2048\n");
      },
    });
    const reader = readMachine({}, given);
    expect(await reader.memoryOf([])).toEqual(new Map());
    expect(asked).toEqual([]);
    expect(await reader.memoryOf([101, 102, 103])).toEqual(new Map([[101, 614400], [103, 2048]]));
    expect(asked).toEqual([[101, 102, 103]]);
    // `OWLERY_MACHINE` holds the machine's reading, so no process of it is read either.
    const held = readMachine({ OWLERY_MACHINE: JSON.stringify({ memoryBytes: 1, cores: 1, performanceCores: 1, freeBytes: 0, totalBytes: 0 }) }, given);
    expect(await held.memoryOf([101])).toEqual(new Map());
    expect(asked).toHaveLength(1);
  });
});

describe("the size of a worktree, measured", () => {
  it("measures a folder with one `du -sk`, in kilobytes, gives none where `du` prints no size, and measures nothing under `OWLERY_MACHINE` (scenario 13)", async () => {
    const asked: string[] = [];
    const printed = ["429688\t/w/project/one\n", ""];
    const { given } = probes(() => "4", { du: (at) => (asked.push(at), Promise.resolve(printed.shift() ?? "")) });
    const reader = readMachine({}, given);
    expect(await reader.sizeOf("/w/project/one")).toBe(429_688);
    // A folder that is gone: `du` prints its error on stderr, and no size.
    expect(await reader.sizeOf("/w/project/gone")).toBeNull();
    expect(asked).toEqual(["/w/project/one", "/w/project/gone"]);
    const held = readMachine({ OWLERY_MACHINE: JSON.stringify({ memoryBytes: 1, cores: 1, performanceCores: 1, freeBytes: 0, totalBytes: 0 }) }, given);
    expect(await held.sizeOf("/w/project/one")).toBeNull();
    expect(asked).toHaveLength(2);
  });
});

describe("the queue of the agents", () => {
  it("starts a session a person asked for first, then a stage of a chain that already ran a stage, then a chain's first stage, and within each the one that waited longest (scenario 6)", () => {
    expect(
      queueOrder([
        { id: 1, rank: "first-stage", joined: 1 },
        { id: 2, rank: "running-chain", joined: 2 },
        { id: 3, rank: "asked", joined: 3 },
        { id: 4, rank: "running-chain", joined: 4 },
        { id: 5, rank: "asked", joined: 5 },
        { id: 6, rank: "first-stage", joined: 0 },
      ]),
    ).toEqual([3, 5, 2, 4, 6, 1]);
  });

  it("frees as many places as the cap leaves above the agents that run, and none at or over it", () => {
    expect([placesFree(4, 6), placesFree(6, 6), placesFree(7, 6), placesFree(0, 1)]).toEqual([2, 0, 0, 1]);
  });
});
