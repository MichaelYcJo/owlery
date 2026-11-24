// What the daemon gives a Claude Code pane that carries the owl chain, beside
// the role bundle the build made: the head its system prompt ends with, and
// the launcher of the chain command its environment names in `OWLERY_CHAIN`.
// Both are files of Owlery's run folder, and both reach `claude` on its
// command line or in the pane's environment (`hooks.ts#paneCommands`), so no
// file of the person's Claude Code folder is read or written here. Which
// pane carries the chain is read from the folder it opens in, at each launch.
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type PaneChain, shellQuote } from "./hooks";
import { onOwlChain } from "./records-place";
import { writeWholeFile } from "./whole-file";

/** The head's file in the run folder. */
export const HEAD_FILE = "pane-head.md";

/** The launcher's file in the run folder. It is not named `chain`: the chain command keeps what it hands a session under the folder `chain/` there (`chain-command.ts#stageFolder`). */
export const LAUNCHER_FILE = "owl-chain";

/**
 * The head a pane's system prompt ends with. It says three things and no
 * rule: the session carries the owl chain, a branch takes its seal from that
 * chain before its pull request is opened or the work is called done, and
 * the bundle's document and the pane's environment say how. The steps are
 * the document's, `skills/seal/SKILL.md` of the bundle, which the session
 * opens when a branch owes its seal.
 */
export function paneHead(): string {
  return [
    "# Owlery: this session carries the owl chain",
    "",
    "This session runs in a pane of Owlery, in a repository whose installed check is Owlery's, so it carries the owl chain: the roles of Owlery's role bundle, which is loaded as the plugin `owlery` for this session alone.",
    "",
    "A branch takes its seal from the owl chain before its pull request is opened or the work is called done.",
    "",
    "The bundle's document `skills/seal/SKILL.md`, listed as the skill `owlery:seal`, says how. The chain command is the program this pane's environment names in `OWLERY_CHAIN`.",
    "",
  ].join("\n");
}

/**
 * The launcher's text: a script that replaces itself with the chain
 * command's script, run by the Node the daemon runs on. That Node is
 * Electron's, which runs a script only with `ELECTRON_RUN_AS_NODE` set, and
 * a pane's environment holds no such variable (`pty.ts#terminalEnv`), so the
 * launcher sets it for that one process.
 */
function launcherText(node: string, script: string): string {
  return ["#!/bin/sh", "# Owlery's chain command, which a pane's session runs for the owl chain. The daemon writes this file at each start.", `ELECTRON_RUN_AS_NODE=1 exec ${shellQuote(node)} ${shellQuote(script)} "$@"`, ""].join("\n");
}

/**
 * Writes the pane's head and the chain command's launcher into the run
 * folder, over what an earlier daemon left there, and gives what a pane that
 * carries the chain is launched with. `built` names the Node the launcher
 * runs the command with, the command's script and the role bundle's folder.
 */
export function writePaneChain(dir: string, built: { node: string; script: string; bundleDir: string }): PaneChain {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const headFile = join(dir, HEAD_FILE);
  const launcher = join(dir, LAUNCHER_FILE);
  writeWholeFile(headFile, paneHead());
  writeFileSync(launcher, launcherText(built.node, built.script), { mode: 0o700 });
  // The mode of a write holds only for a file the write made.
  chmodSync(launcher, 0o700);
  return { bundleDir: built.bundleDir, headFile, launcher };
}

/**
 * What a Claude Code pane of a folder carries: the chain where the folder is
 * on the owl chain (`records-place.ts#onOwlChain`), and nothing in every
 * other folder, or where the daemon was given no chain to hand out. The
 * folder is read at each call, so a branch that gains or loses Owlery's
 * workflow is launched by what it holds then.
 */
export function carriedIn(chain: PaneChain | undefined): (folder: string) => PaneChain | null {
  return (folder) => (chain !== undefined && onOwlChain(folder) ? chain : null);
}
