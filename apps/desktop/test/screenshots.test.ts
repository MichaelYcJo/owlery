// The screenshot command: `pnpm run screenshots` sets `OWLERY_SCREENSHOTS`
// and this file then starts the built app in the background, on a temporary
// repository with five work items, one in each state a work item has and one
// parked with questions, and writes one PNG file for each view (the inbox, a
// work item's view, the view of the parked work item, a work item's menu and
// the "New work item" form) in each appearance of the theme a first run
// opens in. No agent runs: a pane's process is a fixture, a state is what
// the daemon's hook socket is fed, and the prompt asked in the view fails at
// a stand-in for the CLI. No stage runs either: the decisions made without
// asking and the questions are blocks the run writes into the two work
// items' records, which the daemon reads in their worktrees. With
// `OWLERY_SCREENSHOT_THEMES` it captures other themes too: `all`, or names
// with commas between them. It writes into `screenshots/<the run's start>`
// under the app's folder, or into the folder `OWLERY_SCREENSHOT_DIR` names.
// Without `OWLERY_SCREENSHOTS` the file is the cases of the run's own
// functions, and starts no app. docs/design.md states when a pull request
// carries the files.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RECORD_FILE, withApplied, withDecision, withQuestion, withReversal } from "../src/daemon/decision-record";
import { MARKER } from "../src/daemon/records-place";
import { WINDOW_SIZE } from "../src/main/window-size";
import type { ServerMessage, SessionInfo, WorkItem } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { commitFile, temporaryRepository } from "./repositories";
import { pngSize, runFolder, type Shot, shots, themesAsked, type View } from "./screenshots";

/** The run, started by `pnpm run screenshots`. Without it the file is the cases. */
const RUN = process.env.OWLERY_SCREENSHOTS === "1";

const APP_DIR = join(__dirname, "..");

/** The pane's process of the run. */
const SAMPLE_PANE = join(__dirname, "fixtures", "sample-pane.sh");

/**
 * The work items of the run, which are invented examples, each with the kind
 * of its pane and the events its pane's hook is fed, as the hook's own input.
 * A shell's work item has no agent. The last one made is the one whose view
 * and menu are captured, and it is the one that needs the person.
 */
const WORK_ITEMS: { title: string; kind: "shell" | "claude"; events: Record<string, unknown>[] }[] = [
  { title: "Choose the base of the hotfix", kind: "shell", events: [] },
  { title: "Rename the settings file", kind: "shell", events: [] },
  { title: "Add an export of the history", kind: "claude", events: [{ hook_event_name: "UserPromptSubmit" }, { hook_event_name: "Stop", last_assistant_message: "The history exports as a CSV file from the menu of the history screen, and four cases hold the columns." }] },
  { title: "Run the built-app files one at a time", kind: "claude", events: [{ hook_event_name: "UserPromptSubmit" }, { hook_event_name: "PreToolUse", tool_name: "Bash" }] },
  { title: "Fix the login redirect", kind: "claude", events: [{ hook_event_name: "UserPromptSubmit" }, { hook_event_name: "Notification", message: "Should the redirect keep the query string of the page the person came from?" }] },
];
/** The last work item made. */
const SHOWN = WORK_ITEMS[WORK_ITEMS.length - 1]?.title ?? "";
/** The first work item made, which the run parks with `QUESTIONS`. Its view is the view "parked". */
const PARKED = WORK_ITEMS[0]?.title ?? "";
/**
 * The decisions made without asking that the run writes into the shown work
 * item's record, in the record's order: one that stands and says who decided,
 * one the person reversed, with the message, one a stage applied after its
 * reversal, and one that stands and names no one.
 */
const DECISIONS = [
  { kind: "route", decided: "Build it with no framer.", grounds: "The issue names one file, src/redirect.ts.", by: "orchestrator" },
  { kind: "default", decided: "Start the branch from main.", grounds: "frame/questions.md Q1 states main as its default." },
  { kind: "scope", decided: "Leave the sign-up page's redirect out.", grounds: "The issue names the login page alone." },
  { kind: "answered", decided: "The redirect is a 303.", grounds: "docs/architecture.md, Redirects, names the status." },
] as const;
const REVERSAL = "Start it from release/v0.0.2: the fix ships with this release.";
const TAKEN_IN = "Keep the sign-up page in: it shares the redirect.";
/** A block the record's reader refuses, a decision with no `decided:` line, which the view names as a line that was not read. */
const REFUSED = "```seal\ndecision: 9 scope\n```\n";
/** The questions the parked work item waits on. */
const QUESTIONS = [
  { asks: "Which base does the hotfix merge into?", grounds: "No document names the base of a hotfix, and the choice decides which release ships it.", by: "sealer", options: [{ label: "main", implies: "It waits for the next release." }, { label: "release/v0.0.2", implies: "It ships with this release." }], default: "release/v0.0.2" },
  { asks: "May the run push the branch to the remote?", grounds: "A push needs the person's approval.", by: "sealer", options: [{ label: "Yes", implies: "The branch is pushed once the seal is given." }, { label: "No", implies: "The branch stays on this Mac." }] },
];
/** The prompt the run asks in the shown work item's view. The stand-in for the CLI fails it at once. */
const ASKED = "Which file holds the redirect?";

describe.skipIf(RUN)("the screenshot command, without the app", () => {
  it("captures the theme a first run opens in where no theme is asked for", () => {
    expect(themesAsked(undefined)).toEqual(["night-watch"]);
    expect(themesAsked("")).toEqual(["night-watch"]);
  });

  it("captures every theme where it is asked for all, and a named theme beside the first run's, in the themes' own order", () => {
    expect(themesAsked("all")).toEqual(["night-watch", "register", "desk"]);
    expect(themesAsked("desk")).toEqual(["night-watch", "desk"]);
    expect(themesAsked("desk, register")).toEqual(["night-watch", "register", "desk"]);
    expect(themesAsked("night-watch")).toEqual(["night-watch"]);
  });

  it("refuses a name that is no theme's, and names it", () => {
    expect(() => themesAsked("desk,letter")).toThrow("OWLERY_SCREENSHOT_THEMES names letter, and the themes are night-watch, register, desk, or all");
  });

  it("names one file for each view in each appearance of each theme", () => {
    expect(shots(["night-watch"]).map((shot) => shot.file)).toEqual([
      "night-watch-dark-inbox.png",
      "night-watch-dark-view.png",
      "night-watch-dark-parked.png",
      "night-watch-dark-menu.png",
      "night-watch-dark-dialog.png",
      "night-watch-light-inbox.png",
      "night-watch-light-view.png",
      "night-watch-light-parked.png",
      "night-watch-light-menu.png",
      "night-watch-light-dialog.png",
    ]);
    const all = shots(["night-watch", "register", "desk"]);
    expect(all).toHaveLength(30);
    expect(new Set(all.map((shot) => shot.file)).size).toBe(30);
    expect(all[29]).toEqual({ theme: "desk", appearance: "light", view: "dialog", file: "desk-light-dialog.png" });
  });

  it("writes into a folder named by the run's start, or into the folder it is given", () => {
    expect(runFolder(undefined, "/app", new Date(Date.UTC(2026, 10, 22, 9, 15, 0, 123)))).toBe("/app/screenshots/20261122T091500Z");
    expect(runFolder("", "/app", new Date(Date.UTC(2026, 0, 2, 3, 4, 5)))).toBe("/app/screenshots/20260102T030405Z");
    expect(runFolder("/elsewhere/shots", "/app", new Date(0))).toBe("/elsewhere/shots");
    expect(runFolder("shots", "/app", new Date(0))).toBe(resolve("shots"));
  });

  it("reads a PNG file's width and height, and refuses bytes that are not a PNG file's", () => {
    // The first 24 bytes of a PNG file of 1440 by 900: its signature, and the length, the name and the first two fields of its header.
    const head = Buffer.from("89504e470d0a1a0a0000000d49484452000005a000000384", "hex");
    expect(pngSize(head)).toEqual({ width: 1440, height: 900 });
    expect(() => pngSize(Buffer.from("not a PNG file, and long enough to hold a header"))).toThrow("the bytes are not a PNG file's");
    expect(() => pngSize(head.subarray(0, 20))).toThrow("the bytes are not a PNG file's");
    const noHeader = Buffer.from(head);
    noHeader.write("IDAT", 12, "latin1");
    expect(() => pngSize(noHeader)).toThrow("the bytes are not a PNG file's");
    const noSignature = Buffer.from(head);
    noSignature[0] = 0x88;
    expect(() => pngSize(noSignature)).toThrow("the bytes are not a PNG file's");
  });
});

describe.skipIf(!RUN)("the screenshots of the built app", () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;

  const SIDEBAR_LINE = `#repositories button[data-work-item="${WORK_ITEMS.length}"]`;
  const PARKED_LINE = `#repositories button[data-work-item="1"]`;
  const MENU = `[role="menu"]`;

  /** The work items and the sessions the daemon lists, read as a second client of it. */
  async function listed(): Promise<{ workItems: WorkItem[]; sessions: SessionInfo[] }> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    try {
      return await new Promise((resolve, reject) => {
        socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
        socket.addEventListener("error", () => reject(new Error("the daemon refused a second client")));
        socket.addEventListener("message", (event) => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          if (message.type === "ready") resolve({ workItems: message.workItems, sessions: message.sessions });
        });
      });
    } finally {
      socket.close();
    }
  }

  /** The pane of the work item of that title. */
  async function paneOf(title: string): Promise<SessionInfo> {
    const { workItems, sessions } = await listed();
    const pane = sessions.find((session) => session.workItemId === workItems.find((item) => item.title === title)?.id);
    if (!pane) throw new Error(`the daemon lists no pane of ${title}`);
    return pane;
  }

  /** Hands the daemon a hook's event for a pane, as the hook's own command does: the pane's id on a line and the event's JSON after it, to the socket named from inside its folder. */
  function feed(pane: number, event: Record<string, unknown>): void {
    execFileSync("/usr/bin/nc", ["-U", "-w", "2", "hooks.sock"], { cwd: join(app.userData, "run"), input: `${pane}\n${JSON.stringify(event)}` });
  }

  /** The page at rest: the pointer on nothing, and the one motion of the layout over. */
  const rest = async (): Promise<void> => {
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  /** A person's choice in one of the two controls of the sidebar's foot. */
  const choose = (control: "theme" | "appearance", choice: string): Promise<void> =>
    app.evaluate(`(() => { const choices = document.getElementById(${JSON.stringify(control)}); choices.value = ${JSON.stringify(choice)}; choices.dispatchEvent(new Event("change", { bubbles: true })); })()`);

  /** Opens the "New work item" form with a name typed in it, and waits for the branch the name gets. */
  const openForm = async (name: string): Promise<void> => {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    if ((await app.evaluate<string>(`document.getElementById("work-item-repo").value`)) !== made.repo) {
      await app.evaluate(`document.getElementById("work-item-repo").select()`);
      await app.cdp("Input.insertText", { text: made.repo });
    }
    const branch = `document.getElementById("work-item-branch").textContent`;
    await app.until(`${branch}.startsWith("owlery/") && !document.getElementById("work-item-base").disabled`, "the branch and the base of the name the form generated");
    const generated = await app.evaluate<string>(branch);
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: name });
    await app.until(`${branch}.startsWith("owlery/") && ${branch} !== ${JSON.stringify(generated)}`, `the branch of ${name}`);
  };

  /** Brings a view to the front, as a person does, and waits until it is drawn. */
  const show: Record<View, () => Promise<void>> = {
    inbox: async () => {
      await app.click("#nav-inbox");
      await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelectorAll("#inbox-lines button[data-work-item]").length === ${WORK_ITEMS.length}`, "the inbox with its lines");
    },
    view: async () => {
      await app.click(SIDEBAR_LINE);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(SHOWN)} && document.querySelector("#stage .pane .xterm-scrollable-element")`, "the work item's view with its terminal");
    },
    parked: async () => {
      await app.click(PARKED_LINE);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(PARKED)} && !document.getElementById("questions").hidden && document.querySelectorAll("#questions fieldset[data-question]").length === ${QUESTIONS.length}`, "the parked work item's view with its questions");
    },
    menu: async () => {
      await show.inbox();
      const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = document.querySelector(${JSON.stringify(SIDEBAR_LINE)}).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
      await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "right", clickCount: 1 });
      await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "right", clickCount: 1 });
      await app.until(`document.querySelector('${MENU}')`, "the work item's menu");
    },
    dialog: async () => {
      await show.inbox();
      await openForm("Show the seal on a line");
    },
  };

  /** Closes what a view opened over the window, so the next view starts from the window alone. */
  const leave: Partial<Record<View, () => Promise<void>>> = {
    menu: async () => {
      await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "Escape", key: "Escape", windowsVirtualKeyCode: 27 });
      await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", code: "Escape", key: "Escape", windowsVirtualKeyCode: 27 });
      await app.until(`!document.querySelector('${MENU}')`, "the menu closed");
    },
    dialog: async () => {
      await app.click("#work-item-cancel");
      await app.until(`!document.getElementById("work-item-dialog").open`, "the form closed");
    },
  };

  /** The window as it is drawn, as a PNG file of the window's own size on a screen of any density. */
  const capture = async (): Promise<Buffer> => {
    const density = await app.evaluate<number>("window.devicePixelRatio");
    const { data } = await app.cdp<{ data: string }>("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: WINDOW_SIZE.width, height: WINDOW_SIZE.height, scale: 1 / density } });
    return Buffer.from(data, "base64");
  };

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    app = await BuiltApp.start({ SHELL: SAMPLE_PANE, OWLERY_WORKTREES: made.root });
    // The app starts in the background, and the page of a window without the system's focus draws as one a person has left.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    // A pane that comes to wait or to finish behind another raises a notification, and none of this run reaches the system's.
    await app.evaluate(`window.Notification = class { static permission = "granted"; }`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    for (const { title, kind, events } of WORK_ITEMS) {
      await openForm(title);
      await app.evaluate(`document.getElementById("work-item-kind").value = ${JSON.stringify(kind)}`);
      await app.click("#work-item-create");
      await app.until(`!document.getElementById("work-item-dialog").open && !document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`, `the view of ${title}`);
      // The events follow the pane's start at once: a Claude Code pane that says nothing for ten seconds is listed as waiting.
      for (const event of events) feed((await paneOf(title)).id, event);
    }
    await app.until(`document.getElementById("strip-state").classList.contains("waiting")`, `${SHOWN} as the one that needs the person`);

    // Two commits in the shown work item's worktree, for the commits and the changed files of the preview and the view.
    const shown = (await listed()).workItems.find((item) => item.title === SHOWN);
    if (!shown) throw new Error(`the daemon lists no work item ${SHOWN}`);
    commitFile(shown.worktree, "redirect.ts");
    commitFile(shown.worktree, "redirect.test.ts");
    await app.until(`document.querySelectorAll("#view-detail .commit").length === 2 && document.querySelectorAll("#view-detail .file").length === 2`, "the two commits and the two changed files", 15_000);

    // The records of two work items, written into their worktrees as a stage would write them: the directory with the routing that names the branch, and the record. The daemon reads each at its next pass.
    const record = (title: string, text: string): void => {
      const item = planted.find((workItem) => workItem.title === title);
      if (!item) throw new Error(`the daemon lists no work item ${title}`);
      const directory = join(item.worktree, "seal", "threads", `1-${item.branch.replace(/^.*\//, "")}`);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(item.worktree, "seal", "README.md"), `${MARKER}\n`);
      writeFileSync(join(directory, "routing.md"), `| Axis | Answer |\n|---|---|\n| Review | through the review chain |\n| Destination | open the pull request |\n| Branch | ${item.branch} |\n`);
      writeFileSync(join(directory, RECORD_FILE), text);
    };
    const planted = (await listed()).workItems;
    record(SHOWN, withApplied(withReversal(withReversal(DECISIONS.reduce(withDecision, ""), 2, REVERSAL), 3, TAKEN_IN), 3, "4c1e9a2") + REFUSED);
    record(PARKED, QUESTIONS.reduce(withQuestion, ""));
    await app.until(`document.querySelectorAll("#view-detail .decision").length === ${DECISIONS.length} && document.querySelector("#view-detail .decisions .unread")`, "the decisions and the line that was not read", 15_000);
    await app.until(`document.querySelector('${PARKED_LINE} .state-icon.waiting')`, "the parked work item as one that needs the person", 15_000);

    // A prompt asked in the view, which the stand-in for the CLI fails.
    await app.click("#ask-prompt");
    await app.cdp("Input.insertText", { text: ASKED });
    await app.click("#ask-submit");
    await app.until(`document.querySelector("#headless li .state.failed") && document.querySelector("#headless li .error-output")`, "the asked prompt as failed", 15_000);
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("writes a PNG file of the window's size for each view, in each appearance of each theme it was asked for", async () => {
    const folder = runFolder(process.env.OWLERY_SCREENSHOT_DIR, APP_DIR, new Date());
    const wanted: Shot[] = shots(themesAsked(process.env.OWLERY_SCREENSHOT_THEMES));
    mkdirSync(folder, { recursive: true });

    for (const shot of wanted) {
      await choose("theme", shot.theme);
      await choose("appearance", shot.appearance);
      await app.until(`document.documentElement.dataset.theme === ${JSON.stringify(shot.theme)} && document.documentElement.dataset.appearance === ${JSON.stringify(shot.appearance)}`, `the window in ${shot.theme}, ${shot.appearance}`);
      await show[shot.view]();
      await rest();
      writeFileSync(join(folder, shot.file), await capture());
      await leave[shot.view]?.();
    }

    // Written to the run's own output: the suite's runner shows nothing a case hands to `console.log`.
    process.stdout.write(`\n${wanted.length} screenshots in ${folder}\n`);
    const written = wanted.map((shot) => readFileSync(join(folder, shot.file)));
    expect(written.map(pngSize)).toEqual(wanted.map(() => ({ width: WINDOW_SIZE.width, height: WINDOW_SIZE.height })));
    // A view that was not drawn, or a theme the page did not take, writes the bytes of the file before it.
    expect(new Set(written.map((bytes) => createHash("sha256").update(bytes).digest("hex"))).size).toBe(wanted.length);
  }, 300_000);
});
