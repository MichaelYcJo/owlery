// The one way the app writes a file a reader must never find half-written:
// the daemon's discovery file, its repositories, its last look, its choice of
// when to keep the Mac awake, the times it first read each block of a work
// item's record at and each file of a work item's directory
// (`record-writer.ts`), and the main process's theme file and its file of the
// editor a person chose. It is kept beside the
// daemon's files, whose writers use it, and the app's
// main process imports it as it imports the discovery file's reader. It reads
// `node:fs`, so nothing the page loads imports it.
import { renameSync, rmSync, writeFileSync } from "node:fs";

/** The path of the partial file a write of `file` goes through: the file's own, with this process's id after it. */
export function partialOf(file: string): string {
  return `${file}.${process.pid}`;
}

/**
 * Writes `text` to `file`, readable by the user alone, through a partial file
 * named for this process (`partialOf`) that it then renames, so a reader
 * meanwhile never reads a half-written file. A write or a rename that fails
 * throws what refused it, after removing the partial file.
 */
export function writeWholeFile(file: string, text: string): void {
  const partial = partialOf(file);
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
