// The one way the daemon reads a file of a person's repository whose text it
// acts on, but for the setup's command (below). Eight files are read through it: a work item's `decisions.md`,
// its `trail/gate.md` and its `inspection.md` (`chain-records.ts`), and
// each `routing.md` under `threads/` of its worktree, and, in a repository's
// main checkout, the root's `README.md`, the root's
// `config.json`, `.github/workflows/hygiene.yml`, and `package.json`. The
// pass reads every one but `package.json`, which is read where a setup of
// the records place is planned. What a checkout
// holds at such a path is input the daemon did not write, and the read is
// synchronous, on the thread that serves every pane and every client. So the
// read takes a plain file of a bounded size and nothing else: a link where
// the caller follows none, a pipe, a device and a folder are refused before a
// byte is read.
// `.worktreesetup` of the main checkout, whose command a worktree's setup
// runs, is read by `worktree-setup.ts#readSetup` with `readFile`, at a plan,
// a creation and a "Run setup again", off this thread and outside the pass,
// and none of these bounds holds it.
import { closeSync, constants, fstatSync, openSync, readFileSync } from "node:fs";
import { basename } from "node:path";

/** The most of such a file that is read, in bytes. */
export const REPOSITORY_FILE_BYTES = 1024 * 1024;

/**
 * The text of a file of a person's repository, or null where nothing stands
 * at its path. It throws a sentence that names the file where the path is a
 * link, where what stands there is not a plain file, and where the file holds
 * more than `REPOSITORY_FILE_BYTES`, and it throws what refused the read
 * otherwise. A link that leads nowhere is a link, and not a path where
 * nothing stands, so a caller that writes where it read null never replaces a
 * link it read. The last part of the path alone is held to be no link: a folder
 * above it that is one is followed. With `links` given as `followed`, a link
 * is read as what it leads to, which is held to the same two bounds.
 */
export function repositoryFileText(file: string, links: "refused" | "followed" = "refused"): string | null {
  const name = basename(file);
  let fd: number;
  try {
    // The open does not wait for a pipe's writer.
    fd = openSync(file, constants.O_RDONLY | constants.O_NONBLOCK | (links === "refused" ? constants.O_NOFOLLOW : 0));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    // What `open` answers for a link it was told not to follow.
    if (code === "ELOOP" && links === "refused") throw new Error(`${name} is a link, and Owlery reads it only as a file of its own`);
    throw error;
  }
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile()) throw new Error(`${name} is not a plain file`);
    if (stat.size > REPOSITORY_FILE_BYTES) throw new Error(`${name} holds ${String(stat.size)} bytes, and Owlery reads at most ${String(REPOSITORY_FILE_BYTES)} of such a file`);
    return readFileSync(fd, "utf8");
  } finally {
    closeSync(fd);
  }
}
