// Which clipboard a start of the app reads and writes. It imports nothing of
// Electron, and the system's clipboard is passed in, so the cases read it
// without the app and never touch the clipboard of the person at the machine.

/** A clipboard as the main process uses one: a text written, and the text it holds. Each answers once it is done, as Electron's does. */
export interface Clipboard {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
}

/**
 * The clipboard for this start of the app. An app started in the background
 * keeps one of its own, a text that starts empty, and neither reads nor
 * writes the system's, so a start a test or an agent makes never replaces
 * what the person at the machine copied. Any other start reads and writes
 * `system`. The text to write comes from the window, and a value that is no
 * text is not written.
 */
export function chooseClipboard(background: boolean, system: Clipboard): Clipboard {
  let own = "";
  const held: Clipboard = background
    ? {
        async writeText(text) {
          own = text;
        },
        readText: async () => own,
      }
    : system;
  return {
    async writeText(text: unknown) {
      if (typeof text === "string") await held.writeText(text);
    },
    readText: () => held.readText(),
  };
}
