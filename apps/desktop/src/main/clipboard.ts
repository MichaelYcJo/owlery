// Which clipboard a start of the app reads and writes, and the file a pasted
// image is written to. It imports nothing of Electron, and the system's
// clipboard is passed in, so the cases read it without the app and never
// touch the clipboard of the person at the machine.
import { chmodSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** A clipboard as the main process uses one: a text written, the text it holds, and the image it holds as a PNG file's bytes, or null where it holds none. Each answers once it is done, as Electron's does. */
export interface Clipboard {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
  readImage(): Promise<Uint8Array | null>;
}

/**
 * The clipboard for this start of the app. An app started in the background
 * keeps one of its own, a text that starts empty and no image, and neither
 * reads nor writes the system's, so a start a test or an agent makes never
 * replaces what the person at the machine copied, and never reads an image
 * they copied. Any other start reads and writes `system`. The text to write
 * comes from the window, and a value that is no text is not written.
 */
export function chooseClipboard(background: boolean, system: Clipboard): Clipboard {
  let own = "";
  const held: Clipboard = background
    ? {
        async writeText(text) {
          own = text;
        },
        readText: async () => own,
        readImage: async () => null,
      }
    : system;
  return {
    async writeText(text: unknown) {
      if (typeof text === "string") await held.writeText(text);
    },
    readText: () => held.readText(),
    readImage: () => held.readImage(),
  };
}

/** How many days a pasted image stays in its folder: a write removes the folder's files older than that. */
export const PASTED_DAYS = 7;

/**
 * Writes the image `clipboard` holds as a PNG file into `folder`, and
 * answers the file's path, or null where the clipboard holds no image, which
 * the clipboard of an app started in the background never does. The folder
 * is `owlery-pasted` in the system's temporary folder (./main), and it and
 * the file are readable by the person alone. The file is named for `now`, as
 * `pasted-<milliseconds since 1970>.png`. Each write removes the folder's
 * files older than `PASTED_DAYS`, by the time each was last written. Nothing
 * is made where there is no image to write.
 */
export async function pastedImage(clipboard: Clipboard, folder: string, now: number): Promise<string | null> {
  const bytes = await clipboard.readImage();
  if (bytes === null) return null;
  // The folder is taken to the person alone before anything is written in it, a folder made before with another mode among them.
  mkdirSync(folder, { recursive: true });
  chmodSync(folder, 0o700);
  for (const name of readdirSync(folder)) {
    const file = join(folder, name);
    if (now - statSync(file).mtimeMs > PASTED_DAYS * 24 * 60 * 60_000) rmSync(file, { recursive: true, force: true });
  }
  const file = join(folder, `pasted-${now}.png`);
  writeFileSync(file, bytes, { mode: 0o600 });
  return file;
}
