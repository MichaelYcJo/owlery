import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { holdAwakeFor, wakeDisplayFor, wantsAwake } from "../src/daemon/keep-awake";
import type { HeadlessInfo } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";

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

async function until<T>(find: () => T | undefined | Promise<T | undefined>, ms = 5000): Promise<T> {
  const stop = Date.now() + ms;
  for (;;) {
    const found = await find();
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

/** The ids of the children of `parent`, this process where none is named, that run `caffeinate` for the watched process, each ended after the case by its id. */
function holdsOf(watchedPid: number, parent = process.pid): number[] {
  const pids = execFileSync("ps", ["-axo", "pid=,ppid=,args="], { encoding: "utf8" })
    .split("\n")
    .map((line) => /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line))
    .flatMap((found) => (found && Number(found[2]) === parent && found[3]!.includes("caffeinate") && found[3]!.trim().endsWith(` ${String(watchedPid)}`) ? [Number(found[1])] : []));
  for (const pid of pids) cleanups.push(() => end(pid));
  return pids;
}

describe("when the daemon wants the Mac awake", () => {
  const headless = (state: HeadlessInfo["state"]): HeadlessInfo => ({ id: 1, workItemId: 1, prompt: "Which file?", state, answer: "", error: null, usage: null, startedAt: 1, errorOutput: "", stopped: null, role: null, queuedAt: 1 });

  it("holds nothing under `working` for a headless session that waits for the machine alone, which runs no process, and holds for one that works (scenario 9)", () => {
    expect(wantsAwake("working", [], [headless("queued")])).toBe(false);
    expect(wantsAwake("working", [], [headless("queued"), headless("working")])).toBe(true);
    // A chain whose stage waits is a chain that runs, and is held across its wait as across the time between two stages.
    expect(wantsAwake("working", [], [headless("queued")], true)).toBe(true);
  });
});

// The program ships with macOS, and the daemon is given this holder on macOS alone (src/daemon/main.ts).
describe.skipIf(process.platform !== "darwin")("the hold on the Mac's idle sleep", () => {
  it("runs one `/usr/bin/caffeinate -i -w` for the process it is given, and ends it at the release without reporting the hold lost", async () => {
    const pid = watched();
    let lost = 0;
    const hold = holdAwakeFor(pid)(() => lost++, false);
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

  it("holds the display too, with `-d`, where it is asked to, and wakes the display through `caffeinate -u -t 5` once for each wake, with no shell and nothing to wait on", async () => {
    const pid = watched();
    const hold = holdAwakeFor(pid)(() => undefined, true);
    cleanups.push(() => hold.release());
    const [child] = await until(() => {
      const found = holdsOf(pid);
      return found.length > 0 ? found : undefined;
    });
    expect(execFileSync("ps", ["-o", "args=", "-p", String(child)], { encoding: "utf8" }).trim()).toBe(`/usr/bin/caffeinate -d -i -w ${String(pid)}`);
    hold.release();
    // A stand-in for the program writes the words it was started with, so the case wakes no display.
    const folder = mkdtempSync(join(tmpdir(), "owlery-wake-"));
    cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
    const program = join(folder, "caffeinate");
    writeFileSync(program, `#!/bin/sh\necho "$@" >> "${folder}/woken"\n`, { mode: 0o700 });
    const wake = wakeDisplayFor(program);
    wake();
    wake();
    expect(await until(() => (existsSync(join(folder, "woken")) && readFileSync(join(folder, "woken"), "utf8").split("\n").length === 3 ? readFileSync(join(folder, "woken"), "utf8") : undefined))).toBe("-u -t 5\n-u -t 5\n");
    // A program that cannot start wakes nothing and throws nothing.
    expect(() => wakeDisplayFor(join(folder, "none"))()).not.toThrow();
  });

  it("reports the hold lost, once, when the process it watches ends, and its child ends by itself", async () => {
    const pid = watched();
    let lost = 0;
    const hold = holdAwakeFor(pid)(() => lost++, false);
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
    const hold = holdAwakeFor(pid, "/usr/bin/no-such-caffeinate")(() => lost++, false);
    await until(() => (lost > 0 ? true : undefined));
    hold.release();
    await new Promise((r) => setTimeout(r, 200));
    expect(lost).toBe(1);
    expect(holdsOf(pid)).toEqual([]);
  });
});

// The window's control and its status line against the daemon the app starts, which holds through the real program.
describe.skipIf(process.platform !== "darwin")("keeping the Mac awake in the built app", { timeout: 120_000 }, () => {
  it("offers the three choices in the sidebar's foot, shows the daemon's, and says in the status line that the daemon holds while its one `caffeinate` child runs", async () => {
    buildApp();
    // No work item and no pane: the app starts once, in the background, with a user data folder of its own.
    // `SHELL` is a program that prints nothing, so the daemon's lookup at its start finds no `claude`, and the status line does not depend on the person's Claude Code.
    const app = await BuiltApp.start({ SHELL: "/usr/bin/true" });
    let child: number | undefined;
    let left: number[];
    try {
      const shown = (): Promise<{ hidden: boolean; value: string; title: string }> =>
        app.evaluate(`(() => { const control = document.getElementById("keep-awake-control"); return { hidden: control.hidden, value: document.getElementById("keep-awake").value, title: control.title }; })()`);
      /** A person's choice in the control. */
      const choose = (choice: string): Promise<void> =>
        app.evaluate(`(() => { const choices = document.getElementById("keep-awake"); choices.value = ${JSON.stringify(choice)}; choices.dispatchEvent(new Event("change", { bubbles: true })); })()`);
      await app.until(`document.getElementById("status")?.textContent === "Daemon running, no agent"`, "the daemon's state in the status line");
      const daemon = app.daemonPid();
      if (daemon === undefined) throw new Error("the daemon wrote no process id");

      expect(await app.evaluate<string[]>(`[...document.getElementById("keep-awake").options].map((option) => option.textContent)`)).toEqual(["While an agent works", "Always", "Never"]);
      expect(await app.evaluate<string | null>(`document.getElementById("keep-awake").getAttribute("aria-label")`)).toBe("Keep awake");
      expect(await shown()).toEqual({ hidden: false, value: "working", title: "Keep awake: While an agent works" });
      expect(holdsOf(daemon, daemon)).toEqual([]);

      await choose("always");
      await app.until(`document.getElementById("status").textContent === "Daemon running, no agent, keeping the Mac awake"`, "that the daemon keeps the Mac awake");
      const [held, ...others] = holdsOf(daemon, daemon);
      child = held;
      expect(others).toEqual([]);
      expect(execFileSync("ps", ["-o", "args=", "-p", String(child)], { encoding: "utf8" }).trim()).toBe(`/usr/bin/caffeinate -i -w ${String(daemon)}`);
      expect(await shown()).toEqual({ hidden: false, value: "always", title: "Keep awake: Always" });

      // A page loaded again holds nothing of the page before it, so what it shows is what the daemon's `ready` said.
      await app.evaluate(`window.__beforeReload = true`);
      await app.cdp("Page.reload");
      await until(async () => ((await app.evaluate<boolean>(`window.__beforeReload === undefined && document.getElementById("status")?.textContent === "Daemon running, no agent, keeping the Mac awake"`).catch(() => false)) ? true : undefined), 15_000);
      expect(await shown()).toEqual({ hidden: false, value: "always", title: "Keep awake: Always" });
      expect(holdsOf(daemon, daemon)).toEqual([child]);

      await choose("never");
      await app.until(`document.getElementById("status").textContent === "Daemon running, no agent"`, "that the daemon holds no longer");
      await until(() => (runs(child!) ? undefined : true));
      expect(holdsOf(daemon, daemon)).toEqual([]);
      expect(await shown()).toEqual({ hidden: false, value: "never", title: "Keep awake: Never" });
    } finally {
      // The app and its daemon end here whatever failed above, and the daemon's end ends a child it still had.
      left = await app.stop();
    }
    expect(left).toEqual([]);
    expect(runs(child!)).toBe(false);
  });
});
