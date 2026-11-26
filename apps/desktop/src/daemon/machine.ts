// What the daemon reads of the machine it runs on, and the caps a person set
// there. Nothing here knows the `Daemon` class, which is given the reader as
// an option, as it is given the holder of keep-awake, so that its cases read
// a machine of their own.
import { execFile, execFileSync } from "node:child_process";
import { readFileSync, statfsSync } from "node:fs";
import { availableParallelism, loadavg, totalmem } from "node:os";
import { dirname, join } from "node:path";
import { capRefusal } from "../shared/machine";
import type { Cap, MachineReading } from "../shared/protocol";
import { writeWholeFile } from "./whole-file";

const FILE = "limits.json";

/** The caps in the order the file and the dialog give them, the scrollback after the panes and the limit on heavy commands last. */
export const CAPS: readonly Cap[] = ["agents", "worktrees", "panes", "scrollback", "heavyCommands"];

/** The program macOS asks for the performance cores. It ships with macOS. */
const SYSCTL = "/usr/sbin/sysctl";

/** The key under which macOS gives the cores of its first performance level, its performance cores. */
const PERFORMANCE_CORES = "hw.perflevel0.physicalcpu";

/** The program that gives a process's resident memory. It ships with macOS. */
const PS = "/bin/ps";

/** The program that measures a folder. It ships with macOS. */
const DU = "/usr/bin/du";

const MEMORY_FILE = "agent-memory.json";

/** How many agents' measures the daemon keeps, the last it read. */
export const AGENTS_KEPT = 20;

/** The calls a reading is made of. Each case of the reader gives its own. */
export interface MachineProbes {
  memoryBytes(): number;
  cores(): number;
  load(): number;
  /** What `sysctl -n <key>` prints. It throws where the program exits with an error or cannot start. */
  sysctl(key: string): string;
  /** The free and total bytes of the volume that holds a folder. It throws where the folder does not stand. */
  statfs(folder: string): { freeBytes: number; totalBytes: number };
  /** What `ps -o pid=,rss= -p <pids>` prints: a line for each process that stands, its id and its resident memory in kilobytes. A process that is gone has no line. */
  ps(pids: readonly number[]): Promise<string>;
  /** What `du -sk <folder>` prints: the folder's size in kilobytes, a tab and the folder. A folder that is gone prints nothing on stdout. */
  du(folder: string): Promise<string>;
}

const SYSTEM: MachineProbes = {
  memoryBytes: () => totalmem(),
  cores: () => availableParallelism(),
  load: () => loadavg()[0] ?? 0,
  sysctl: (key) => execFileSync(SYSCTL, ["-n", key], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }),
  statfs: (folder) => {
    const read = statfsSync(folder);
    return { freeBytes: read.bavail * read.bsize, totalBytes: read.blocks * read.bsize };
  },
  // `ps` exits 1 where one of the processes is gone, and prints the others all the same.
  ps: (pids) => new Promise((resolve) => execFile(PS, ["-o", "pid=,rss=", "-p", pids.join(",")], { encoding: "utf8", timeout: 5000 }, (_, stdout) => resolve(stdout ?? ""))),
  // `du` exits 1 where a file under the folder cannot be read, and prints the size of the others all the same.
  du: (folder) => new Promise((resolve) => execFile(DU, ["-sk", folder], { encoding: "utf8", timeout: 120_000 }, (_, stdout) => resolve(stdout ?? ""))),
};

/** How the daemon reads the machine: the reading, with the load and the disk of `folder`, the worktrees' folder, read at this call, the resident memory in kilobytes of each of the processes named that stands, and the size of a folder in kilobytes, or null where none was measured. */
export interface MachineReader {
  read(folder: string): MachineReading;
  memoryOf(pids: readonly number[]): Promise<Map<number, number>>;
  sizeOf(folder: string): Promise<number | null>;
}

/**
 * What the turn keeper is given of the machine: the cores, read once, and
 * the load average of the last minute, read again at each call, from the
 * reader's reading of the worktrees' folder. Under `OWLERY_MACHINE` both are
 * the reading that variable holds.
 */
export function turnReading(reader: MachineReader, folder: string): { cores: number; load: () => number } {
  return { cores: reader.read(folder).cores, load: () => reader.read(folder).load };
}

/**
 * The reader of the machine the daemon runs on. Where `OWLERY_MACHINE` is set
 * it holds the reading, the text of a JSON object with `memoryBytes`, `cores`,
 * `performanceCores`, `freeBytes` and `totalBytes`, and `load` where it is
 * given, 0 where not; the reader then asks the machine nothing, and reads
 * no process's memory and no folder's size, so a case reads the same proposals on every machine. A value that is no such object
 * throws the sentence that says so. Otherwise the memory, the cores and the
 * performance cores are read here, once, the load and the disk at each
 * read, the memory of the processes named with one `ps` at each
 * `memoryOf`, and a folder with one `du` at each `sizeOf`.
 */
export function readMachine(env: NodeJS.ProcessEnv, given: Partial<MachineProbes> = {}): MachineReader {
  const text = env.OWLERY_MACHINE;
  if (text !== undefined && text !== "") {
    const reading = givenReading(text);
    return { read: () => reading, memoryOf: () => Promise.resolve(new Map()), sizeOf: () => Promise.resolve(null) };
  }
  const probes: MachineProbes = {
    memoryBytes: given.memoryBytes ?? SYSTEM.memoryBytes,
    cores: given.cores ?? SYSTEM.cores,
    load: given.load ?? SYSTEM.load,
    sysctl: given.sysctl ?? SYSTEM.sysctl,
    statfs: given.statfs ?? SYSTEM.statfs,
    ps: given.ps ?? SYSTEM.ps,
    du: given.du ?? SYSTEM.du,
  };
  const memoryBytes = probes.memoryBytes();
  const cores = probes.cores();
  const performanceCores = performanceCoresOf(probes.sysctl, cores);
  return {
    read: (folder) => ({ memoryBytes, cores, performanceCores, load: probes.load(), disk: diskOf(folder, probes.statfs) }),
    memoryOf: async (pids) => (pids.length === 0 ? new Map() : residentOf(await probes.ps(pids))),
    sizeOf: async (folder) => sizeIn(await probes.du(folder)),
  };
}

/** The kilobytes a `du -sk` printed, or null where it printed no size. */
function sizeIn(printed: string): number | null {
  const [, kilobytes] = /^(\d+)\s/u.exec(printed) ?? [];
  return kilobytes === undefined ? null : Number(kilobytes);
}

/** The performance cores `sysctl` gives, or all the cores where it gives no whole number above 0, exits with an error or cannot start, as on an Intel Mac and off macOS. */
function performanceCoresOf(sysctl: MachineProbes["sysctl"], cores: number): number {
  let printed: string;
  try {
    printed = sysctl(PERFORMANCE_CORES).trim();
  } catch {
    return cores;
  }
  const count = /^\d+$/.test(printed) ? Number(printed) : 0;
  return count > 0 ? count : cores;
}

/** The resident memory in kilobytes of each process a `ps -o pid=,rss=` printed a line for. */
function residentOf(printed: string): Map<number, number> {
  const read = new Map<number, number>();
  for (const line of printed.split("\n")) {
    const [, pid, kilobytes] = /^\s*(\d+)\s+(\d+)\s*$/u.exec(line) ?? [];
    if (pid !== undefined && kilobytes !== undefined) read.set(Number(pid), Number(kilobytes));
  }
  return read;
}

/** The disk of the folder, or of the nearest folder above it that stands, or null where none answers. */
function diskOf(folder: string, statfs: MachineProbes["statfs"]): MachineReading["disk"] {
  for (let at = folder; ; at = dirname(at)) {
    try {
      return statfs(at);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if ((code !== "ENOENT" && code !== "ENOTDIR") || dirname(at) === at) return null;
    }
  }
}

/** The reading `OWLERY_MACHINE` holds, or the sentence that says it holds none. */
function givenReading(text: string): MachineReading {
  const refused = new Error("OWLERY_MACHINE is not a JSON object with memoryBytes, cores, performanceCores, freeBytes and totalBytes, each a number of 0 or more and the cores whole numbers from 1");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw refused;
  }
  // A value that is no object holds none of the fields, and is refused by the first.
  const fields = Object(value) as Record<string, unknown>;
  const amount = (name: string, absent?: number): number => {
    const field = fields[name] ?? absent;
    if (typeof field !== "number" || !Number.isFinite(field) || field < 0) throw refused;
    return field;
  };
  const whole = (name: string): number => {
    const field = amount(name);
    if (!Number.isInteger(field) || field < 1) throw refused;
    return field;
  };
  return { memoryBytes: amount("memoryBytes"), cores: whole("cores"), performanceCores: whole("performanceCores"), load: amount("load", 0), disk: { freeBytes: amount("freeBytes"), totalBytes: amount("totalBytes") } };
}

/**
 * The caps a person set. Like the choice of keep-awake they are the daemon's
 * state: they live in `limits.json` in the run directory, one key for each
 * cap a person set, as in `{"agents":3}`, the limit on heavy commands
 * under `heavyCommands` and the scrollback under `scrollback`, readable by
 * the user alone, and are
 * read at start, so they outlive the daemon. A key that is absent, or holds a
 * value `setCaps` would refuse, is a cap that follows its proposal. Given no
 * run directory, the caps are kept in memory alone.
 */
export class LimitsStore {
  private readonly caps: Record<Cap, number | null> = { agents: null, worktrees: null, panes: null, heavyCommands: null, scrollback: null };
  private readonly file: string | undefined;

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(this.file, "utf8"));
    } catch {
      // No person has set a cap here, or the file is not ours.
      return;
    }
    // A value that is no object holds no cap.
    const stored = Object(value) as Record<string, unknown>;
    for (const cap of CAPS) {
      const set = stored[cap];
      if (capRefusal(cap, set) === null) this.caps[cap] = set as number;
    }
  }

  get(): Record<Cap, number | null> {
    return { ...this.caps };
  }

  /** Sets the caps named, null returning one to its proposal. They are held before they are written, so a write that throws leaves the daemon with them in memory. */
  set(changes: Partial<Record<Cap, number | null>>): void {
    for (const cap of CAPS) if (changes[cap] !== undefined) this.caps[cap] = changes[cap];
    if (this.file === undefined) return;
    writeWholeFile(this.file, JSON.stringify(Object.fromEntries(CAPS.flatMap((cap) => (this.caps[cap] === null ? [] : [[cap, this.caps[cap]]])))));
  }
}

/**
 * What the daemon measured of its agents: for each of the last
 * `AGENTS_KEPT` agents it read at least once, the highest resident memory
 * it read of the agent's own process, in kilobytes, in the order it first
 * read them. They live in `agent-memory.json` in the run directory, as a
 * list, readable by the user alone, and are read at start, so they outlive
 * the daemon. A value of the file that is no whole number above 0 is left
 * out. Given no run directory, they are kept in memory alone. The agents
 * that live are known by a name the daemon gives them. At each reading the
 * daemon tells the store which agents live, and the store forgets the
 * others: one it forgot is a new agent where its name comes again.
 */
export class AgentMemoryStore {
  private kept: { kilobytes: number }[] = [];
  private readonly living = new Map<string, { kilobytes: number }>();
  private readonly file: string | undefined;

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, MEMORY_FILE);
    if (this.file === undefined) return;
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(this.file, "utf8"));
    } catch {
      // Nothing was measured here, or the file is not ours.
      return;
    }
    if (!Array.isArray(value)) return;
    this.kept = value.filter((kilobytes): kilobytes is number => typeof kilobytes === "number" && Number.isInteger(kilobytes) && kilobytes > 0).slice(-AGENTS_KEPT).map((kilobytes) => ({ kilobytes }));
  }

  /** The measures kept, the agent read first first. */
  kilobytes(): number[] {
    return this.kept.map(({ kilobytes }) => kilobytes);
  }

  /** Notes a reading of an agent, and says whether the measures kept changed: a new agent's first, or a reading above its highest. The measures are held before they are written, so a write that throws leaves them in memory. */
  note(agent: string, kilobytes: number): boolean {
    const known = this.living.get(agent);
    if (known !== undefined && known.kilobytes >= kilobytes) return false;
    if (known !== undefined) known.kilobytes = kilobytes;
    else {
      const measured = { kilobytes };
      this.living.set(agent, measured);
      this.kept = [...this.kept, measured].slice(-AGENTS_KEPT);
    }
    if (this.file !== undefined) writeWholeFile(this.file, JSON.stringify(this.kilobytes()));
    return true;
  }

  /** Forgets every agent not among `names`, the agents that live now: their measures stay kept, and a reading under one of their names is a new agent's. */
  keepLiving(names: ReadonlySet<string>): void {
    for (const agent of [...this.living.keys()]) if (!names.has(agent)) this.living.delete(agent);
  }
}
