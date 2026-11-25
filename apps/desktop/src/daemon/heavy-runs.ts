// What each heavy command took: one line for each run in `heavy-runs.jsonl`
// of the run folder, appended and never rewritten, as the ledger's lines are
// (`ledger.ts`), and the reading of a command's peak memory that the line
// carries. The daemon writes the line of each run, its own broad gate's and
// each one a command ran in its turn on the turn socket (`turn-socket.ts`).
import { execFile } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LOAD_EVERY_MS } from "./machine-turns";

/** The runs' file in the run folder. */
export const HEAVY_RUNS_FILE = "heavy-runs.jsonl";

/**
 * One run: the repository's folder and the work item's id, null where the
 * folder is no work item's worktree, the command's name, when it asked,
 * started and ended, its exit code, its peak memory in bytes, the load at
 * its start and the highest load during it, whether another heavy command
 * ran beside it, and whether it ran alone as a second run.
 */
export interface HeavyRun {
  repo: string | null;
  workItemId: number | null;
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

/** Appends one run's line to the file of the run folder; a daemon given no run folder keeps none, and a line whose append fails is lost, since no run waits on it. */
export function addHeavyRun(runDir: string | undefined, run: HeavyRun): void {
  if (runDir === undefined) return;
  try {
    appendFileSync(join(runDir, HEAVY_RUNS_FILE), `${JSON.stringify(run)}\n`, { mode: 0o600 });
  } catch {
    // The run is not kept.
  }
}

/** The runs the file of the run folder holds, in the order they were added; a line that is no JSON's object is passed over. */
export function readHeavyRuns(runDir: string): HeavyRun[] {
  const file = join(runDir, HEAVY_RUNS_FILE);
  if (!existsSync(file)) return [];
  const runs: HeavyRun[] = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    try {
      const run: unknown = JSON.parse(line);
      if (typeof run === "object" && run !== null) runs.push(run as HeavyRun);
    } catch {
      // A line a crash cut.
    }
  }
  return runs;
}

/** The resident memory, in bytes, of the process and of every process it descends to, from `ps`'s lines of `pid ppid rss`, the last in KiB. */
export function treeMemory(listed: string, pid: number): number {
  const children = new Map<number, number[]>();
  const rss = new Map<number, number>();
  for (const line of listed.split("\n")) {
    const [own, parent, kib] = line.trim().split(/\s+/u).map(Number);
    if (own === undefined || parent === undefined || kib === undefined || [own, parent, kib].some(Number.isNaN)) continue;
    rss.set(own, kib * 1024);
    children.set(parent, [...(children.get(parent) ?? []), own]);
  }
  let total = 0;
  const seen = new Set<number>();
  const walk = [pid];
  for (let next = walk.pop(); next !== undefined; next = walk.pop()) {
    if (seen.has(next)) continue;
    seen.add(next);
    total += rss.get(next) ?? 0;
    walk.push(...(children.get(next) ?? []));
  }
  return total;
}

/**
 * Reads the resident memory of the process and its descendants at once and
 * every `everyMs` after, with `/bin/ps`, and keeps the highest. `stop` ends
 * the reading and gives the highest, or null where no reading found the
 * process.
 */
export function watchMemory(pid: number | undefined, everyMs = LOAD_EVERY_MS): { stop(): number | null } {
  let peak: number | null = null;
  if (pid === undefined) return { stop: () => null };
  const read = (): void => {
    execFile("/bin/ps", ["-axo", "pid=,ppid=,rss="], (error, listed) => {
      if (error !== null) return;
      const memory = treeMemory(listed, pid);
      if (memory > 0) peak = Math.max(peak ?? 0, memory);
    });
  };
  read();
  const every = setInterval(read, everyMs);
  every.unref();
  return {
    stop: () => {
      clearInterval(every);
      return peak;
    },
  };
}
