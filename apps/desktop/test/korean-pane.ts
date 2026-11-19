// What the Korean input case does to a pane: it opens a shell pane whose
// process is the receiver, replays a line's steps into it through the
// debugging port, and reads the bytes the receiver was handed.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { BuiltApp } from "./built-app";

/** One call of the debugging port. A recorded event of a person's typing becomes one of these. */
export type Step =
  /** A key the input source takes: a keydown with key code 229. */
  | { type: "imeKey"; code: string }
  /** A composing text, shown and not yet sent. */
  | { type: "compose"; text: string }
  /** A committed text. */
  | { type: "commit"; text: string }
  /** A plain key, with its own key code. */
  | { type: "key"; code: string; key: string; keyCode: number; text?: string }
  /** A key released. */
  | { type: "keyUp"; code: string; keyCode: number; key?: string };

export interface Line {
  /** What the person types, and what the pane's process receives, in UTF-8, before Enter. */
  text: string;
  /** The keys the person presses, by their places on the keyboard in the Dubeolsik layout. */
  keys: string;
  steps: Step[];
  /** `assumed`: written by hand, in the order the framing probes delivered. `typed`: recorded from a person's typing. */
  source: "assumed" | "typed";
}

/** The pane's process: `SHELL` for the app the case starts. */
export const RECEIVER = join(__dirname, "fixtures", "receiver.sh");

/** The lines the case replays and a person types. */
export function readLines(): Line[] {
  return (JSON.parse(readFileSync(join(__dirname, "fixtures", "korean-input.json"), "utf8")) as { lines: Line[] }).lines;
}

/** Enter, which ends every line. No line's steps hold it. */
export const ENTER: Step[] = [
  { type: "key", code: "Enter", key: "Enter", keyCode: 13, text: "\r" },
  { type: "keyUp", code: "Enter", key: "Enter", keyCode: 13 },
];

function call(app: BuiltApp, step: Step): Promise<unknown> {
  switch (step.type) {
    case "imeKey":
      return app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 229, code: step.code, key: "Process" });
    case "compose":
      return app.cdp("Input.imeSetComposition", { text: step.text, selectionStart: step.text.length, selectionEnd: step.text.length });
    case "commit":
      return app.cdp("Input.insertText", { text: step.text });
    case "key":
      return app.cdp("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: step.keyCode, code: step.code, key: step.key, ...(step.text === undefined ? {} : { text: step.text }) });
    case "keyUp":
      return app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: step.keyCode, code: step.code, key: step.key ?? "Process" });
  }
}

/**
 * One line being typed into the pane in front. It replays steps, one call of
 * the debugging port each, and knows whether the line reached the pane as
 * its steps were written.
 */
export class Typing {
  /** Whether the steps replayed so far leave a composition open. */
  private composing = false;
  /** Whether a composition the steps left open was found ended at a step that continued or committed it. */
  private ended = false;

  private constructor(private readonly app: BuiltApp) {}

  /**
   * Starts a line. It notes, on the terminal's hidden textarea, whether a
   * composition is open and how often the textarea loses the keyboard inside
   * the window. The listeners are added from here, once, and the app's code
   * holds none of them.
   */
  static async start(app: BuiltApp): Promise<Typing> {
    await app.evaluate(`(() => {
      if (!window.__koreanInput) {
        const area = document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea");
        const noted = { composing: false, blurred: 0 };
        area.addEventListener("compositionstart", () => { noted.composing = true; }, true);
        area.addEventListener("compositionend", () => { noted.composing = false; }, true);
        area.addEventListener("blur", () => { noted.blurred += 1; }, true);
        window.__koreanInput = noted;
      }
      window.__koreanInput.blurred = 0;
    })()`);
    return new Typing(app);
  }

  /**
   * Replays steps into whatever has the keyboard, in order. It waits for one
   * zero-delay timer of the page after every key released, before every key
   * pressed and after the last step, once where two of those meet. A person's
   * keys are never closer than that, and the terminal sends composed text
   * from such timers, so steps sent without the wait lose it.
   */
  async replay(steps: readonly Step[]): Promise<void> {
    const turn = (): Promise<unknown> => this.app.evaluate("new Promise((resolve) => setTimeout(resolve, 0))");
    let waited = true;
    for (const step of steps) {
      if ((step.type === "imeKey" || step.type === "key") && !waited) await turn();
      if (step.type === "compose" || step.type === "commit") {
        // A step that continues or commits a composition finds it open, unless something other than a step ended it.
        if (this.composing && !(await this.app.evaluate<boolean>("window.__koreanInput.composing"))) this.ended = true;
        this.composing = step.type === "compose";
      }
      await call(this.app, step);
      waited = step.type === "keyUp";
      if (waited) await turn();
    }
    if (!waited) await turn();
  }

  /**
   * True where something outside the window ended a composition of this
   * line: one was found ended that no step ended, and the textarea kept the
   * keyboard inside the window all along. That is what another app taking
   * the system's focus does. The composing syllable is committed where it
   * stands, the page sees no blur, and the pane's process receives other
   * bytes than were typed. A composition that ended with a blur was ended by
   * the window's own code, and is not this.
   */
  async endedFromOutside(): Promise<boolean> {
    return this.ended && (await this.app.evaluate<number>("window.__koreanInput.blurred")) === 0;
  }
}

/**
 * Opens a shell pane the way a person gets a first one: the sidebar's "New
 * work item" button, the form filled with `repo` and a title, the shell kind
 * chosen where the form preselects Claude Code, and "Create". It returns once
 * the work item's view is in front with the pane's terminal and the receiver
 * has started. It calls `focus()` on nothing.
 */
export async function openReceiverPane(app: BuiltApp, repo: string, receivedFile: string): Promise<void> {
  // The daemon's `ready` puts a screen in front. The session may open before the page holds its elements.
  await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
  await app.click("#new-work-item");
  await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
  await app.click("#work-item-repo");
  await app.cdp("Input.insertText", { text: repo });
  await app.click("#work-item-title");
  await app.cdp("Input.insertText", { text: "Korean input" });
  // The kind's menu is the system's own, which the debugging port does not reach, so the choice is set on the field.
  await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
  await app.click("#work-item-create");
  try {
    await app.until(`!document.getElementById("work-item-view").hidden && document.querySelectorAll(".xterm-helper-textarea").length === 1`, "the work item's view with one terminal");
  } catch (error) {
    const refused = await app.evaluate<string>(`document.getElementById("work-item-error").textContent`);
    throw new Error(`${(error as Error).message}; the form says: ${refused || "nothing"}`);
  }
  const deadline = Date.now() + 15_000;
  while (!existsSync(receivedFile)) {
    if (Date.now() >= deadline) throw new Error("the pane's process did not start the receiver");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/** The bytes the receiver was handed, read a line at a time. */
export class Received {
  private read = 0;

  constructor(private readonly file: string) {}

  /**
   * The bytes handed over since the last call. It waits until `expected`
   * bytes are there, five seconds at most, because they cross the window, the
   * daemon and the pseudo-terminal, and then a moment longer, so a byte sent
   * after the expected ones is read with this line and not with the next.
   */
  async next(expected: number): Promise<Buffer> {
    const deadline = Date.now() + 5_000;
    while (readFileSync(this.file).length - this.read < expected && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50));
    await new Promise((resolve) => setTimeout(resolve, 200));
    const bytes = readFileSync(this.file);
    const got = bytes.subarray(this.read);
    this.read = bytes.length;
    return got;
  }

  /** The receiver's process id, which it wrote beside its file. */
  pid(): number {
    return Number(readFileSync(`${this.file}.pid`, "utf8"));
  }
}

/** The pane's composition view: whether it is active, and its text. After a commit it keeps its last text and is no longer active. */
export function compositionView(app: BuiltApp): Promise<{ active: boolean; text: string } | null> {
  return app.evaluate(
    `(() => { const view = document.querySelector("#stage .pane:not([hidden]) .composition-view"); return view ? { active: view.classList.contains("active"), text: view.textContent } : null; })()`,
  );
}
