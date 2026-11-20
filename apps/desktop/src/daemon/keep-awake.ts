// How the daemon keeps the Mac from idle sleep while an agent works: when it
// wants the Mac awake, the choice it keeps in its run directory, and the child
// process that holds the block. Nothing here knows the `Daemon` class, which
// is given the holder as an option so that its cases start no process.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_KEEP_AWAKE, isKeepAwakeChoice } from "../shared/keep-awake";
import type { HeadlessInfo, KeepAwakeChoice, SessionInfo } from "../shared/protocol";
import { writeWholeFile } from "./whole-file";

const FILE = "keep-awake.json";

/** The program that holds the block. It ships with macOS. */
const CAFFEINATE = "/usr/bin/caffeinate";

/**
 * Whether the daemon wants the Mac awake: never under `never`, always under
 * `always`, and under `working` while a pane is alive with the state
 * `working` or a headless session has it. An exited pane keeps its last
 * state, so `alive` is read beside it.
 */
export function wantsAwake(choice: KeepAwakeChoice, sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[]): boolean {
  if (choice === "never") return false;
  if (choice === "always") return true;
  return sessions.some((session) => session.alive && session.state === "working") || headless.some((session) => session.state === "working");
}

/**
 * The daemon's choice of when to keep the Mac awake. Like the last look it is
 * the daemon's state: it lives in `keep-awake.json` in the run directory, as
 * `{"choice":"<value>"}`, readable by the user alone, and is read at start, so
 * the choice outlives the daemon. A file that holds none of the three choices
 * is read as the choice of a daemon nobody has told one. Given no run
 * directory, the choice is kept in memory alone.
 */
export class KeepAwakeStore {
  private choice: KeepAwakeChoice = DEFAULT_KEEP_AWAKE;
  private readonly file: string | undefined;

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    try {
      const value = JSON.parse(readFileSync(this.file, "utf8")) as { choice?: unknown } | null;
      if (isKeepAwakeChoice(value?.choice)) this.choice = value.choice;
    } catch {
      // No person has chosen here, or the file is not ours.
    }
  }

  get(): KeepAwakeChoice {
    return this.choice;
  }

  /** Replaces the choice. It is held before it is written, so a write that throws leaves the daemon with the choice in memory. */
  set(choice: KeepAwakeChoice): void {
    this.choice = choice;
    if (this.file === undefined) return;
    writeWholeFile(this.file, JSON.stringify({ choice }));
  }
}

/**
 * A way to hold the Mac awake. A call starts a hold and `release` ends it.
 * `lost` is called once where the hold ends and `release` was not called.
 */
export type HoldAwake = (lost: () => void) => { release(): void };

/**
 * The holder that keeps the Mac from idle sleep while the process of that id
 * runs: each hold is one child process, `caffeinate -i -w <pid>`, started with
 * no shell and no input or output. `-i` leaves the display free to sleep and a
 * closed lid free to put the Mac to sleep, and `-w` ends the child when the
 * watched process ends, however it ends. A child that could not start is a
 * hold lost, so a Mac without the program holds nothing and throws nothing.
 */
export function holdAwakeFor(pid: number, program = CAFFEINATE): HoldAwake {
  return (lost) => {
    let over = false;
    // A child that could not start reports an error and no exit, and one that started and ended reports an exit.
    const ended = (): void => {
      if (over) return;
      over = true;
      lost();
    };
    const child = spawn(program, ["-i", "-w", String(pid)], { stdio: "ignore" });
    child.once("error", ended);
    child.once("exit", ended);
    return {
      release: () => {
        if (over) return;
        over = true;
        child.kill();
      },
    };
  };
}
