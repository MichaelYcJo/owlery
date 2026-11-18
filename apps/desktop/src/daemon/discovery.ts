import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Where a client finds the running daemon: its port, the token it asks for, its process. */
export interface Discovery {
  port: number;
  token: string;
  pid: number;
}

const FILE = "daemon.json";

/** Writes the discovery file, readable by the user alone, and returns its path. */
export function writeDiscovery(dir: string, discovery: Discovery): string {
  const file = join(dir, FILE);
  const partial = `${file}.${process.pid}`;
  writeFileSync(partial, JSON.stringify(discovery), { mode: 0o600 });
  // A client never reads a half-written file.
  renameSync(partial, file);
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
