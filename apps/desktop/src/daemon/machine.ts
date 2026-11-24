// What the daemon reads of the machine it runs on, and the caps a person set
// there. Nothing here knows the `Daemon` class, which is given the reader as
// an option, as it is given the holder of keep-awake, so that its cases read
// a machine of their own.
import { execFileSync } from "node:child_process";
import { readFileSync, statfsSync } from "node:fs";
import { availableParallelism, loadavg, totalmem } from "node:os";
import { dirname, join } from "node:path";
import { capRefusal } from "../shared/machine";
import type { Cap, MachineReading } from "../shared/protocol";
import { writeWholeFile } from "./whole-file";

const FILE = "limits.json";

/** The caps in the order the file and the dialog give them. */
const CAPS: readonly Cap[] = ["agents", "worktrees", "panes"];

/** The program macOS asks for the performance cores. It ships with macOS. */
const SYSCTL = "/usr/sbin/sysctl";

/** The key under which macOS gives the cores of its first performance level, its performance cores. */
const PERFORMANCE_CORES = "hw.perflevel0.physicalcpu";

/** The calls a reading is made of. Each case of the reader gives its own. */
export interface MachineProbes {
  memoryBytes(): number;
  cores(): number;
  load(): number;
  /** What `sysctl -n <key>` prints. It throws where the program exits with an error or cannot start. */
  sysctl(key: string): string;
  /** The free and total bytes of the volume that holds a folder. It throws where the folder does not stand. */
  statfs(folder: string): { freeBytes: number; totalBytes: number };
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
};

/** How the daemon reads the machine: the reading, with the load and the disk of `folder`, the worktrees' folder, read at this call. */
export interface MachineReader {
  read(folder: string): MachineReading;
}

/**
 * The reader of the machine the daemon runs on. Where `OWLERY_MACHINE` is set
 * it holds the reading, the text of a JSON object with `memoryBytes`, `cores`,
 * `performanceCores`, `freeBytes` and `totalBytes`, and `load` where it is
 * given, 0 where not; the reader then asks the machine nothing, so a case
 * reads the same proposals on every machine. A value that is no such object
 * throws the sentence that says so. Otherwise the memory, the cores and the
 * performance cores are read here, once, and the load and the disk at each
 * read.
 */
export function readMachine(env: NodeJS.ProcessEnv, given: Partial<MachineProbes> = {}): MachineReader {
  const text = env.OWLERY_MACHINE;
  if (text !== undefined && text !== "") {
    const reading = givenReading(text);
    return { read: () => reading };
  }
  const probes: MachineProbes = {
    memoryBytes: given.memoryBytes ?? SYSTEM.memoryBytes,
    cores: given.cores ?? SYSTEM.cores,
    load: given.load ?? SYSTEM.load,
    sysctl: given.sysctl ?? SYSTEM.sysctl,
    statfs: given.statfs ?? SYSTEM.statfs,
  };
  const memoryBytes = probes.memoryBytes();
  const cores = probes.cores();
  const performanceCores = performanceCoresOf(probes.sysctl, cores);
  return { read: (folder) => ({ memoryBytes, cores, performanceCores, load: probes.load(), disk: diskOf(folder, probes.statfs) }) };
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
 * cap a person set, as in `{"agents":3}`, readable by the user alone, and are
 * read at start, so they outlive the daemon. A key that is absent, or holds a
 * value `setCaps` would refuse, is a cap that follows its proposal. Given no
 * run directory, the caps are kept in memory alone.
 */
export class LimitsStore {
  private readonly caps: Record<Cap, number | null> = { agents: null, worktrees: null, panes: null };
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
