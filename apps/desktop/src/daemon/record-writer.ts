// The one way the daemon writes a file of a work item's directory, under a
// worktree's records root: a round record, the record of decisions and
// questions, a `routing.md`. A worktree is a checkout the daemon did not
// write, so a commit of the branch can put a link at a work item's directory,
// at a folder below it or at a record's own path, and a write through one
// lands outside the worktree. So the path is checked before each write, part
// by part: each folder from the worktree's top to the file is a folder and
// no link, and nothing but a plain file stands at the file's own path. The
// folders that do not stand are made.
//
// The check and the write are two steps, so a link put in the way between
// them is written through. What the check holds off is a link a commit or an
// earlier session left, which is there when the write begins.
import { lstatSync, mkdirSync, type Stats } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import { partialOf, writeWholeFile } from "./whole-file";

/** What stands at a path, a link as itself, or null where nothing does. It throws what refused the read otherwise. */
function standing(path: string): Stats | null {
  try {
    return lstatSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Writes `text` to `file`, a file inside the worktree, whole
 * (`whole-file.ts#writeWholeFile`), after making each folder above it that
 * does not stand. It throws a sentence that names the file by its path from
 * the worktree's top, with nothing written and no folder made past the part
 * it refused, where the path is the worktree's own or outside it; where a
 * part of the path above the file is a link, to a folder inside the worktree
 * or outside it alike, or is no folder; where a link stands at the file's
 * path, one that leads nowhere among them, or what stands there is no plain
 * file; and where a link stands at the path of the partial file the write
 * goes through. The parts above the worktree's top are not read: a worktree
 * reached through a link is the worktree.
 */
export function writeRecordFile(worktree: string, file: string, text: string): void {
  const path = relative(worktree, file);
  const refuse = (why: string): never => {
    throw new Error(`Owlery writes no record at ${path}: ${why}`);
  };
  const parts = path.split(sep);
  if (path === "" || parts[0] === ".." || isAbsolute(path)) refuse("the path is not inside the worktree.");
  let folder = "";
  for (const part of parts.slice(0, -1)) {
    folder = join(folder, part);
    const stands = standing(join(worktree, folder));
    if (stands === null) mkdirSync(join(worktree, folder));
    else if (stands.isSymbolicLink()) refuse(`${folder} is a link, and each folder above a record is a folder of the worktree itself.`);
    else if (!stands.isDirectory()) refuse(`${folder} is not a folder.`);
  }
  const stands = standing(file);
  if (stands?.isSymbolicLink()) refuse("a link stands at that path, and a record is a file of its own.");
  if (stands !== null && !stands.isFile()) refuse("what stands at that path is not a plain file.");
  // The path `writeWholeFile` writes before it renames, where a link would be written through.
  const partial = partialOf(file);
  if (standing(partial)?.isSymbolicLink()) refuse(`a link stands at ${relative(worktree, partial)}, which the write goes through.`);
  writeWholeFile(file, text);
}
