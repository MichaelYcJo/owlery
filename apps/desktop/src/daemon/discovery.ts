import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
