// Which address a link of a pane may open, and who opens it. It imports
// nothing of Electron, and the system's opener is passed in, so the cases
// read it without the app and open no browser.
import { execFile } from "node:child_process";

/** Opens an address outside Owlery, and answers whether it did. */
export type Opener = (address: string) => Promise<boolean>;

/**
 * Has `opener` open the address a pane's link names, and answers whether it
 * was opened. Only a text that parses as a URL whose scheme is `http` or
 * `https` reaches the opener, as the parser writes it. Anything else is
 * refused: what a pane prints is not the person's, and the address of a
 * file or of another program would start what it names.
 */
export async function openLink(address: unknown, opener: Opener): Promise<boolean> {
  if (typeof address !== "string" || !URL.canParse(address)) return false;
  const url = new URL(address);
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  return opener(url.href);
}

/**
 * Who opens an address for this start of the app. Where the environment
 * named a program (`OWLERY_OPENER`), that program is run with the address as
 * its one argument, without a shell, and it opened the address where it
 * exits with 0. Otherwise an app started in the background opens nothing,
 * so a start a test or an agent makes never opens the browser of the person
 * at the machine. Otherwise it is the system's opener.
 */
export function chooseOpener(program: string | null, background: boolean, system: Opener): Opener {
  if (program !== null) return (address) => new Promise((resolve) => execFile(program, [address], (error) => resolve(error === null)));
  if (background) return async () => false;
  return system;
}

/**
 * Reads the program `OWLERY_OPENER` names, or null where it names none, and
 * takes the variable out of `env`, so that the daemon the app starts, and
 * every pane's process that daemon starts, runs without it.
 */
export function takeOpener(env: NodeJS.ProcessEnv): string | null {
  const program = env.OWLERY_OPENER;
  delete env.OWLERY_OPENER;
  return program ? program : null;
}
