// The one way the app writes a file a reader must never find half-written:
// the daemon's discovery file, its list of work items, its last look and its
// choice of when to keep the Mac awake, and the main process's theme file. It
// is kept beside the daemon's files, whose four writers use it, and the app's
// main process imports it as it imports the discovery file's reader. It reads
// `node:fs`, so nothing the page loads imports it.
import { renameSync, rmSync, writeFileSync } from "node:fs";

/**
 * Writes `text` to `file`, readable by the user alone, through a partial file
 * named for this process that it then renames, so a reader meanwhile never
 * reads a half-written file. A write or a rename that fails throws what
 * refused it, after removing the partial file.
 */
export function writeWholeFile(file: string, text: string): void {
  const partial = `${file}.${process.pid}`;
  try {
    writeFileSync(partial, text, { mode: 0o600 });
    renameSync(partial, file);
  } catch (error) {
    try {
      rmSync(partial, { force: true });
    } catch {
      // The caller is told why the write failed, not why its partial file could not be removed.
    }
    throw error;
  }
}
