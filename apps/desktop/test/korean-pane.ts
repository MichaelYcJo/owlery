// What the Korean input case does to a pane: it opens a shell pane whose
// process is the receiver, replays a line's steps into it through the
// debugging port, and reads the bytes the receiver was handed. The typed run
// a person makes at a release opens the same pane, and what it records,
// decides and writes into the fixture is here too.
import { execFileSync } from "node:child_process";
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
  /** `assumed`: written by hand, in the order the framing probes delivered. `typed`: recorded from a person's typing, its Enter among the steps. */
  source: "assumed" | "typed";
}

/** What the last typed run recorded beside the lines' steps. */
export interface TypedRun {
  /** The day of the run, and the versions it typed into. */
  date: string;
  macos: string;
  electron: string;
  xterm: string;
  /** The lines a person typed as expected whose recording, replayed, delivered other bytes, with those bytes in hex. Each keeps the steps it had. */
  replayDiffers: { text: string; received: string }[];
}

export interface Fixture {
  lines: Line[];
  /** Absent until a person made the first typed run. */
  typedRun?: TypedRun;
}

/** The pane's process: `SHELL` for the app the case starts. */
export const RECEIVER = join(__dirname, "fixtures", "receiver.sh");

/** The file of the lines, which a typed run that passed rewrites. */
export const FIXTURE = join(__dirname, "fixtures", "korean-input.json");

/** The lines the case replays and a person types, and what the last typed run recorded. */
export function readFixture(): Fixture {
  return JSON.parse(readFileSync(FIXTURE, "utf8")) as Fixture;
}

/** Enter, which ends every line. No assumed line's steps hold it. */
export const ENTER: Step[] = [
  { type: "key", code: "Enter", key: "Enter", keyCode: 13, text: "\r" },
  { type: "keyUp", code: "Enter", key: "Enter", keyCode: 13 },
];

/**
 * A line's steps with the Enter that ends it. A typed line's steps hold the
 * Enter where the person's typing put it, which may be before the last
 * syllable's commit, so nothing is added to them.
 */
export function withEnter(line: Line): Step[] {
  return line.source === "typed" ? line.steps : [...line.steps, ...ENTER];
}

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
   * keyboard inside the window all along. A window that holds the system's
   * focus and loses it to another app shows this: the composing syllable is
   * committed where it stands, the page sees no blur, and the pane's process
   * receives other bytes than were typed. A composition that ended with a
   * blur was ended by the window's own code, and is not this.
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
  // Create creates nothing before the form shows the plan of its folder.
  await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the folder");
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
    return this.take();
  }

  /**
   * The bytes of a line a person typed: it waits until an Enter is among the
   * bytes handed over since the last call, `ms` at most, and then a moment
   * longer for a byte sent after the Enter. Where no Enter came it answers
   * with what there is.
   */
  async typed(ms: number): Promise<Buffer> {
    const deadline = Date.now() + ms;
    while (!readFileSync(this.file).subarray(this.read).includes(0x0d) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50));
    await new Promise((resolve) => setTimeout(resolve, 300));
    return this.take();
  }

  private take(): Buffer {
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

/** One event of the pane's hidden textarea, as the recorder noted it. A key event holds `code`, `key` and `keyCode`, and a composition or input event `data`. */
export interface Noted {
  type: "keydown" | "keyup" | "compositionstart" | "compositionupdate" | "compositionend" | "input";
  code?: string;
  key?: string;
  keyCode?: number;
  data?: string | null;
  inputType?: string;
}

/**
 * Notes the key, composition and input events of the terminal's hidden
 * textarea in the pane in front, in the order they arrive. The listeners are
 * added from here, once, and the app's code holds none of them.
 */
export class Recorder {
  private constructor(private readonly app: BuiltApp) {}

  static async attach(app: BuiltApp): Promise<Recorder> {
    await app.evaluate(`(() => {
      if (window.__koreanRecord) return;
      const area = document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea");
      const record = [];
      for (const type of ["keydown", "keyup", "compositionstart", "compositionupdate", "compositionend", "input"]) {
        area.addEventListener(type, (event) => record.push({ type, code: event.code, key: event.key, keyCode: event.keyCode, data: event.data, inputType: event.inputType }), true);
      }
      window.__koreanRecord = record;
    })()`);
    return new Recorder(app);
  }

  /** The events noted since the last call. */
  take(): Promise<Noted[]> {
    return this.app.evaluate<Noted[]>("window.__koreanRecord.splice(0)");
  }
}

/** The text a plain key inserts by itself. */
function textOf(key: string | undefined): string | undefined {
  if (key === "Enter") return "\r";
  return key !== undefined && [...key].length === 1 ? key : undefined;
}

/**
 * The steps that replay a record, one per event that has a row in the
 * steps' table. A release whose press the record does not hold is dropped,
 * and a key still pressed at the record's end is released there: a person
 * releases a line's Enter after its bytes arrived.
 */
export function stepsOf(noted: readonly Noted[]): Step[] {
  const steps: Step[] = [];
  /** The keys pressed and not yet released, each with the release it is owed. */
  const pressed = new Map<string, Step>();
  let composing = false;
  /** The text the last plain key inserts by itself, until an input event showed it or another key was pressed. */
  let own: string | undefined;
  for (const event of noted) {
    const code = event.code ?? "";
    const key = event.key ?? "";
    switch (event.type) {
      case "keydown":
        own = undefined;
        if (event.keyCode === 229) {
          steps.push({ type: "imeKey", code });
        } else {
          own = textOf(event.key);
          steps.push({ type: "key", code, key, keyCode: event.keyCode ?? 0, ...(own === undefined ? {} : { text: own }) });
        }
        pressed.set(code, { type: "keyUp", code, key, keyCode: event.keyCode ?? 0 });
        break;
      case "keyup":
        if (pressed.delete(code)) steps.push({ type: "keyUp", code, key, keyCode: event.keyCode ?? 0 });
        break;
      case "compositionstart":
        composing = true;
        break;
      case "compositionupdate":
        steps.push({ type: "compose", text: event.data ?? "" });
        break;
      case "compositionend":
        composing = false;
        steps.push({ type: "commit", text: event.data ?? "" });
        break;
      case "input":
        // Inside a composition the composition's own events say what was committed.
        if (event.inputType !== "insertText" || composing || !event.data) break;
        if (event.data === own) own = undefined;
        else steps.push({ type: "commit", text: event.data });
        break;
    }
  }
  steps.push(...pressed.values());
  return steps;
}

/** One typing of a line: the bytes the receiver was handed, in hex, and the events the recorder noted. */
export interface Typed {
  bytes: string;
  noted: Noted[];
}

/**
 * Has a line typed, and typed once more where its bytes differ from
 * `expected`, since a slip of the hand is no regression. It answers with the
 * typing that matched, or with the second.
 */
export async function typedTwice(expected: string, type: (again: boolean) => Promise<Typed>): Promise<Typed & { matched: boolean }> {
  let typed = await type(false);
  if (typed.bytes !== expected) typed = await type(true);
  return { ...typed, matched: typed.bytes === expected };
}

/** What a typed run came to for one line. Bytes are in hex. */
export interface LineResult {
  text: string;
  expected: string;
  /** The bytes of the typing that matched, or of the second typing. */
  typed: string;
  /** Where the typing matched: the steps its record became, and the bytes their replay delivered. */
  replay?: { steps: Step[]; bytes: string };
}

/** One printed line per line of the run. */
export function verdicts(results: readonly LineResult[]): string[] {
  return results.map((result) => {
    if (result.typed !== result.expected || !result.replay) return `${result.text}: FAILED. Expected ${result.expected}, received ${result.typed || "nothing"}`;
    if (result.replay.bytes !== result.expected) return `${result.text}: typed as expected. The replay of its recording delivered ${result.replay.bytes || "nothing"}, so the line keeps its steps`;
    return `${result.text}: typed as expected, and the replay of its recording agrees`;
  });
}

/**
 * The fixture after a typed run. A line whose recording replayed to its bytes
 * takes the recorded steps and `source: "typed"`. A line whose replay
 * differed keeps what it had and is named under `replayDiffers`.
 */
export function fixtureAfter(fixture: Fixture, results: readonly LineResult[], run: Omit<TypedRun, "replayDiffers">): Fixture {
  const replayed = results.flatMap((result) => (result.replay ? [{ ...result, replay: result.replay }] : []));
  const lines = fixture.lines.map((line): Line => {
    const agreed = replayed.find((result) => result.text === line.text && result.replay.bytes === result.expected);
    return agreed ? { ...line, steps: agreed.replay.steps, source: "typed" } : line;
  });
  const replayDiffers = replayed.filter((result) => result.replay.bytes !== result.expected).map((result) => ({ text: result.text, received: result.replay.bytes }));
  return { lines, typedRun: { ...run, replayDiffers } };
}

/** The fixture's text: a key's steps on one row, so a typed run's change of the file reads key by key. */
export function formatFixture(fixture: Fixture): string {
  const step = (one: Step): string => `{ ${Object.entries(one).map(([name, value]) => `${JSON.stringify(name)}: ${JSON.stringify(value)}`).join(", ")} }`;
  const rows = (steps: readonly Step[]): string[] => {
    const out: string[][] = [];
    steps.forEach((one, index) => {
      // A row starts at a key pressed, and after a key released.
      if (index === 0 || one.type === "imeKey" || one.type === "key" || steps[index - 1]?.type === "keyUp") out.push([]);
      out.at(-1)?.push(step(one));
    });
    return out.map((row) => `        ${row.join(", ")}`);
  };
  const line = ({ steps, ...rest }: Line): string =>
    ["    {", ...Object.entries(rest).map(([name, value]) => `      ${JSON.stringify(name)}: ${JSON.stringify(value)},`), '      "steps": [', rows(steps).join(",\n"), "      ]", "    }"].join("\n");
  const typedRun = fixture.typedRun ? `,\n  "typedRun": ${JSON.stringify(fixture.typedRun, null, 2).replaceAll("\n", "\n  ")}` : "";
  return `{\n  "lines": [\n${fixture.lines.map(line).join(",\n")}\n  ]${typedRun}\n}\n`;
}

/** The day and the versions a typed run is recorded with. */
export function versions(today: Date): Omit<TypedRun, "replayDiffers"> {
  const two = (part: number): string => String(part).padStart(2, "0");
  const xterm = JSON.parse(readFileSync(join(__dirname, "..", "node_modules", "@xterm", "xterm", "package.json"), "utf8")) as { version: string };
  return {
    date: `${today.getFullYear()}-${two(today.getMonth() + 1)}-${two(today.getDate())}`,
    macos: execFileSync("sw_vers", ["-productVersion"], { encoding: "utf8" }).trim(),
    electron: process.versions.electron ?? "",
    xterm: xterm.version,
  };
}

/** What the bar tells the person for a line: its place, its text and its keys. */
export function barText(line: Line, index: number, count: number, again: boolean): string {
  const place = `Line ${index + 1} of ${count}${again ? ", once more: the bytes differed" : ""}`;
  return `${place}. Click the terminal, then type ${line.text} (keys: ${line.keys}) and press Enter. The terminal shows nothing of what you type.`;
}

/** Puts a bar over the window's lower edge with `text`, or changes its text. A click passes through it. */
export async function showBar(app: BuiltApp, text: string): Promise<void> {
  await app.evaluate(`(() => {
    let bar = document.getElementById("korean-typed-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "korean-typed-bar";
      bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483647;padding:14px 18px;background:#111;color:#fff;font:16px/1.4 system-ui;pointer-events:none";
      document.body.append(bar);
    }
    bar.textContent = ${JSON.stringify(text)};
  })()`);
}
