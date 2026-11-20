import { execFileSync, spawn } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { holdAwakeFor } from "../src/daemon/keep-awake";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

/** Ends the process of that id, if it still runs. */
function end(pid: number): void {
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // It ended already.
  }
}

/** Whether a process of that id runs. */
function runs(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function until<T>(find: () => T | undefined, ms = 5000): Promise<T> {
  const stop = Date.now() + ms;
  for (;;) {
    const found = find();
    if (found !== undefined) return found;
    if (Date.now() > stop) throw new Error("timed out");
    await new Promise((r) => setTimeout(r, 20));
  }
}

/** A process the case starts for a hold to watch, ended after the case by its id. */
function watched(): number {
  const child = spawn("/bin/sleep", ["30"], { stdio: "ignore" });
  const pid = child.pid!;
  cleanups.push(() => end(pid));
  return pid;
}

/** The ids of this process's children that run `caffeinate` for the watched process, each ended after the case by its id. */
function holdsOf(watchedPid: number): number[] {
  const pids = execFileSync("ps", ["-axo", "pid=,ppid=,args="], { encoding: "utf8" })
    .split("\n")
    .map((line) => /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line))
    .flatMap((found) => (found && Number(found[2]) === process.pid && found[3]!.includes("caffeinate") && found[3]!.trim().endsWith(` ${String(watchedPid)}`) ? [Number(found[1])] : []));
  for (const pid of pids) cleanups.push(() => end(pid));
  return pids;
}

// The program ships with macOS, and the daemon is given this holder on macOS alone (src/daemon/main.ts).
describe.skipIf(process.platform !== "darwin")("the hold on the Mac's idle sleep", () => {
  it("runs one `/usr/bin/caffeinate -i -w` for the process it is given, and ends it at the release without reporting the hold lost", async () => {
    const pid = watched();
    let lost = 0;
    const hold = holdAwakeFor(pid)(() => lost++);
    cleanups.push(() => hold.release());
    const [child, ...others] = await until(() => {
      const found = holdsOf(pid);
      return found.length > 0 ? found : undefined;
    });
    expect(others).toEqual([]);
    expect(execFileSync("ps", ["-o", "args=", "-p", String(child)], { encoding: "utf8" }).trim()).toBe(`/usr/bin/caffeinate -i -w ${String(pid)}`);
    hold.release();
    await until(() => (runs(child!) ? undefined : true));
    expect(holdsOf(pid)).toEqual([]);
    // The process it watched is untouched, and a second release ends nothing.
    expect(runs(pid)).toBe(true);
    hold.release();
    await new Promise((r) => setTimeout(r, 200));
    expect(lost).toBe(0);
  });

  it("reports the hold lost, once, when the process it watches ends, and its child ends by itself", async () => {
    const pid = watched();
    let lost = 0;
    const hold = holdAwakeFor(pid)(() => lost++);
    cleanups.push(() => hold.release());
    const [child] = await until(() => {
      const found = holdsOf(pid);
      return found.length > 0 ? found : undefined;
    });
    expect(lost).toBe(0);
    end(pid);
    await until(() => (lost > 0 ? true : undefined));
    expect(runs(child!)).toBe(false);
    hold.release();
    await new Promise((r) => setTimeout(r, 200));
    expect(lost).toBe(1);
  });

  it("reports the hold lost, once, where the program cannot start, and throws nothing", async () => {
    const pid = watched();
    let lost = 0;
    const hold = holdAwakeFor(pid, "/usr/bin/no-such-caffeinate")(() => lost++);
    await until(() => (lost > 0 ? true : undefined));
    hold.release();
    await new Promise((r) => setTimeout(r, 200));
    expect(lost).toBe(1);
    expect(holdsOf(pid)).toEqual([]);
  });
});
