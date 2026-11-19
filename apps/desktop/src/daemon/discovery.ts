import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeWholeFile } from "./whole-file";

/** Where a client finds the running daemon: its port, the token it asks for, its process. */
export interface Discovery {
  port: number;
  token: string;
  pid: number;
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
      return { port: value.port, token: value.token, pid: value.pid };
    }
  } catch {
    // No daemon has written here, or the file is not ours.
  }
  return undefined;
}
