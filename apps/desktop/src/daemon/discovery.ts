import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import WebSocket from "ws";
import { writeWholeFile } from "./whole-file";

/** Where a client finds the running daemon: its port, the token it asks for, its process, and the build of the script it runs. */
export interface Discovery {
  port: number;
  token: string;
  pid: number;
  /** The daemon's build, as `buildOf` names it. A daemon that could not read its own script wrote none, and neither did a daemon of a build before this field. */
  build?: string;
}

const FILE = "daemon.json";

/** Writes the discovery file, readable by the user alone and never half-written where a client reads it, and returns its path. A write that fails throws what refused it, after removing its partial file. */
export function writeDiscovery(dir: string, discovery: Discovery): string {
  const file = join(dir, FILE);
  writeWholeFile(file, JSON.stringify(discovery));
  return file;
}

export function readDiscovery(dir: string): Discovery | undefined {
  try {
    const value = JSON.parse(readFileSync(join(dir, FILE), "utf8")) as Partial<Discovery>;
    if (typeof value.port === "number" && typeof value.token === "string" && typeof value.pid === "number") {
      return { port: value.port, token: value.token, pid: value.pid, ...(typeof value.build === "string" ? { build: value.build } : {}) };
    }
  } catch {
    // No daemon has written here, or the file is not ours.
  }
  return undefined;
}

/**
 * Says hello at the file's address with the file's token, and gives the
 * `ready` the daemon there answered with, or nothing where none came within
 * `timeoutMs`. The message is typed as no more than an object: a daemon of
 * any build may answer, and its fields are its build's. The app asks it of
 * the daemon a load finds and of the one a stop is about to signal, and a
 * daemon that starts asks it of the daemon its run folder's `daemon.json`
 * still names.
 */
export function readyOf(discovery: Discovery, timeoutMs = 1000): Promise<Readonly<Record<string, unknown>> | undefined> {
  return new Promise((resolve) => {
    const socket = new WebSocket(`ws://127.0.0.1:${discovery.port}`);
    const done = (ready: Readonly<Record<string, unknown>> | undefined) => {
      clearTimeout(timer);
      socket.terminate();
      resolve(ready);
    };
    const timer = setTimeout(() => done(undefined), timeoutMs);
    socket.on("open", () => socket.send(JSON.stringify({ type: "hello", token: discovery.token })));
    socket.on("message", (raw) => {
      let message: unknown;
      try {
        message = JSON.parse(String(raw));
      } catch {
        // Not a message of a daemon's.
      }
      done(typeof message === "object" && message !== null && (message as { type?: unknown }).type === "ready" ? (message as Record<string, unknown>) : undefined);
    });
    socket.on("error", () => done(undefined));
    socket.on("close", () => done(undefined));
  });
}

/**
 * The build of a daemon's script: the SHA-256 of the file's bytes, as
 * hexadecimal text, or nothing where the file cannot be read. It is the one
 * definition of a build. The daemon takes it of the script it runs, and the
 * app of the script it would start, so the two agree exactly where the
 * daemon's code is the same.
 */
export function buildOf(scriptFile: string): string | undefined {
  try {
    return createHash("sha256").update(readFileSync(scriptFile)).digest("hex");
  } catch {
    return undefined;
  }
}
