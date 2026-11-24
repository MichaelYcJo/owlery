// The screenshot command: `pnpm run screenshots` sets `OWLERY_SCREENSHOTS`
// and this file then starts the built app in the background, on a temporary
// repository with seven work items, one in each state a work item has, one
// whose chain runs a review round, one parked with questions, a finished
// one whose seal holds and whose pull request's checks passed, and one whose
// seal a later commit broke, and writes one PNG file for each view (the
// summary, the inbox, a work item's view, the view of the parked work item,
// the view of the finished work item, the view of the broken one, a work
// item's menu and the "New work item" form) in each appearance of the theme
// a first run opens in. No agent runs: a pane's process is a fixture, a state is what
// the daemon's hook socket is fed, the agent of the work item that needs the
// person waits on a question with two choices, fed as its question tool's
// call, and the view's work item is asked two prompts, which a stand-in for
// the CLI answers. It fails the first at once,
// and holds the second, whose session asks the person to allow a command and
// gets no answer, so the work item's line says the request and the view's
// "Ask" section shows its card. The run waits until the section shows that
// request before its first shot. That work item carries no decision made
// without asking and no setup's words on its line, so the line's second row
// gives its whole width to the request. Three chains run, each started as a
// second client of the daemon starts one. Two stay at their first round,
// whose prompt the stand-in holds: one for the work item at review, so its
// line of the inbox names the stage with its age, and one for the view's
// work item, started before its prompts are asked, so its approval line
// shows a finished place, a working one and two not started. The third is
// the parked work item's, whose stages the stand-in answers: its round
// leaves no finding, the repository's broad gate, a script of the
// repository that prints two lines, passes, and its sealer asks a question
// in place of a verdict, which the orchestrator's ruling parks the work
// item with. So the parked view lists the gate that passed first under
// "Ask", with its command and "Show output", and its approval line counts
// the round and marks the sealer's place, which waits on the questions. A
// fourth chain is the finished work item's: the stand-in answers its first
// round with one finding, its fix pass with a commit that fixes it and the
// finding's close, its second round with no finding, which confirms the
// fix, and its sealer with `sealed`, after the same gate, each with what the
// stage used, and the daemon then pushes the branch to a bare repository in
// the run's temporary folder, the repository's one remote, and opens the
// pull request through the stand-in for `gh` the login shell's PATH names
// (fixtures/sample-gh/gh), which reaches no GitHub and answers the pull
// request open with two checks that passed. So that work item's line says
// "Checks passed", and its view opens to the back of its seal, with the
// finding, the commit that fixed it and each stage's converted cost, and
// lists the pull request under the seal's place, which is lit. The broken
// work item runs no chain: the run commits the records of a seal in its
// worktree with git, as the daemon writes them, and one commit after them,
// so its line waits and says "Seal broken", its view opens to the back of
// its seal, which names that commit, and its view's foot shows the broken
// seal, the seal's sentence and "Get a new seal". Once the seven
// work items stand, and before any chain runs or any seal is given, a
// second client of the daemon sends `looked`, so the daemon's look holds
// each work item with no seal. From then on the page's own `looked` is held
// back, since a page that leaves sends a look, and once the scene stands the
// page loads again. Its `ready` carries the look taken before the seals, so
// the window opens on the summary, which leads with the finished work
// item's seal, given since the look, and the broken one's, broken since.
// The second question is a block the run writes into the parked work
// item's record, which the daemon reads in its worktree. The repository
// names a setup once four work items
// stand, so the one at work shows its setup running, the one in
// the view has a setup that succeeded, with the paths it copied, and the
// form names the setup's command; no setup's command runs, and the run
// types the code a setup pane ends with. The inbox's shot previews the work
// item that needs the person, with its agent's question and its approval
// line. The view's shot scrolls its side column until the approval line is
// the last thing in it, and the parked view's shot opens at the top of the
// column, where its questions stand, with the gate's line under "Ask". With
// `OWLERY_SCREENSHOT_THEMES` it captures other themes too: `all`, or names
// with commas between them. It writes into `screenshots/<the run's start>`
// under the app's folder, or into the folder `OWLERY_SCREENSHOT_DIR` names.
// Without `OWLERY_SCREENSHOTS` the file is the cases of the run's own
// functions, and starts no app. docs/design.md states when a pull request
// carries the files.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RECORD_FILE, withQuestion } from "../src/daemon/decision-record";
import { MARKER } from "../src/daemon/records-place";
import { WINDOW_SIZE } from "../src/main/window-size";
import type { ClientMessage, ServerMessage, SessionInfo, WorkItem, WorktreeSetup } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { commitFile, git, temporaryRepository } from "./repositories";
import { commitSeal } from "./chain-run";
import { createdPane, pngSize, runFolder, type Shot, shots, themesAsked, type View } from "./screenshots";

/** The run, started by `pnpm run screenshots`. Without it the file is the cases. */
const RUN = process.env.OWLERY_SCREENSHOTS === "1";

const APP_DIR = join(__dirname, "..");

/** The pane's process of the run. */
const SAMPLE_PANE = join(__dirname, "fixtures", "sample-pane.sh");

/**
 * The work items of the run, which are invented examples, each with the kind
 * of its pane, the events its pane's hook is fed, as the hook's own input,
 * and the state its setup shows, or null where its repository names no
 * setup when it is made. A shell's work item has no agent. The last one made
 * is the one whose view and menu are captured, and it is the one that needs
 * the person.
 */
const WORK_ITEMS: { title: string; kind: "shell" | "claude"; events: Record<string, unknown>[]; setup: "running" | "succeeded" | null }[] = [
  { title: "Choose the base of the hotfix", kind: "shell", events: [], setup: null },
  { title: "Rename the settings file", kind: "shell", events: [], setup: null },
  { title: "Sort the history by date", kind: "shell", events: [], setup: null },
  { title: "Add an export of the history", kind: "claude", events: [{ hook_event_name: "UserPromptSubmit" }, { hook_event_name: "Stop", last_assistant_message: "The history exports as a CSV file from the menu of the history screen, and four cases hold the columns." }], setup: null },
  { title: "Run the built-app files one at a time", kind: "claude", events: [{ hook_event_name: "UserPromptSubmit" }, { hook_event_name: "PreToolUse", tool_name: "Bash" }], setup: "running" },
  { title: "Cache the user avatars", kind: "shell", events: [], setup: null },
  {
    title: "Fix the login redirect",
    kind: "claude",
    events: [
      { hook_event_name: "UserPromptSubmit" },
      {
        hook_event_name: "PreToolUse",
        tool_name: "AskUserQuestion",
        tool_input: {
          questions: [
            {
              question: "Should the redirect keep the query string of the page the person came from?",
              header: "Redirect",
              multiSelect: false,
              options: [
                { label: "Keep it", description: "The person lands on the page they left, with its filters." },
                { label: "Drop it", description: "The person lands on the page's plain address." },
              ],
            },
          ],
        },
      },
    ],
    setup: "succeeded",
  },
];
/**
 * The ignored files of the repository's main checkout, each with what it
 * holds, which `.gitignore` names. They are invented examples.
 */
const IGNORED: Record<string, string> = {
  ".env": "API_URL=http://localhost:3000\n",
  "apps/web/.env.local": "SESSION_SECRET=local\n",
  "node_modules/left-pad/index.js": "module.exports = (text) => text;\n",
  "certs/localhost-key.pem": "-----BEGIN PRIVATE KEY-----\n",
};
/** What the main checkout's `.worktreeinclude` and `.worktreesetup` hold where a work item is made with a setup. No pane of the run runs the command. */
const SETUP_FILES = { ".worktreeinclude": ".env\n**/.env.local\nnode_modules/\n*.pem\n", ".worktreesetup": "pnpm install\n" };
/** The code the setup pane of a work item whose setup succeeds ends with, as the run types it into the pane. */
const SETUP_ENDS_WITH = 0;
/** The last work item made. */
const SHOWN = WORK_ITEMS[WORK_ITEMS.length - 1]?.title ?? "";
/** The first work item made, whose chain passes its broad gate and parks at its sealer's question, and whose record the run writes `WRITTEN` into. Its view is the view "parked". The stand-in for the CLI answers the stages of the chain whose work item's directory holds this title's slug (fixtures/sample-cli.sh). */
const PARKED = WORK_ITEMS[0]?.title ?? "";
/** The repository's broad gate command, as its `config.json` names it, and the script it runs, which the repository holds: it prints two lines and exits with 0. The lines are invented examples. */
const GATE = "sh scripts/check.sh";
const GATE_SCRIPT = "#!/bin/sh\nprintf ' Test Files  2 passed\\n      Tests  12 passed\\n'\n";
/** The finished work item, whose chain the stand-in for the CLI answers to a seal, so the daemon opens its pull request through the stand-in for `gh` (fixtures/sample-gh/gh). Its view is the view "finished". */
const FINISHED = "Add an export of the history";
/** The pull request's number and its checks as the stand-in for `gh` answers them. */
const PULL_REQUEST = "Pull request #12";
const CHECKS = ["seal", "Owlery seal"];
/** The work item whose seal a later commit broke: the run commits the records of a seal in its worktree, in the folder of the records this name gives, and one commit after them. Its view is the view "broken". */
const BROKEN = "Cache the user avatars";
const BROKEN_RECORDS = "1795396354-cache-the-user-avatars";
/** The file of the commit that breaks the seal, which the seal's sentence names. */
const AFTER_THE_SEAL = "avatars.ts";
/** The work item at review: the run commits a file on its branch and starts its chain, whose first round the stand-in for the CLI holds, so its line of the inbox names the stage. */
const AT_REVIEW = "Sort the history by date";
/** The question the parked work item's sealer asks in place of a verdict, as the stand-in for the CLI answers its seal (fixtures/sample-cli.sh). The chain parks the work item with it. */
const SEALER_ASKS = "Which base does the hotfix merge into?";
/** The question the run writes into the parked work item's record, below the sealer's. */
const WRITTEN = { asks: "May the run push the branch to the remote?", grounds: "A push needs the person's approval.", by: "sealer", options: [{ label: "Yes", implies: "The branch is pushed once the seal is given." }, { label: "No", implies: "The branch stays on this Mac." }] };
/** How many questions the parked work item waits on: the sealer's and the one the run writes. */
const QUESTIONS = 2;
/** The prompt the run asks first in the shown work item's view. The stand-in for the CLI fails it at once. */
const ASKED = "Which file holds the redirect?";
/** The prompt the run asks second there. The stand-in holds it, and its session asks the person to allow a command (fixtures/sample-cli.sh). */
const ASKED_TO_ALLOW = "Run the tests of the redirect.";

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
      "night-watch-dark-summary.png",
      "night-watch-dark-inbox.png",
      "night-watch-dark-view.png",
      "night-watch-dark-parked.png",
      "night-watch-dark-finished.png",
      "night-watch-dark-broken.png",
      "night-watch-dark-menu.png",
      "night-watch-dark-dialog.png",
      "night-watch-light-summary.png",
      "night-watch-light-inbox.png",
      "night-watch-light-view.png",
      "night-watch-light-parked.png",
      "night-watch-light-finished.png",
      "night-watch-light-broken.png",
      "night-watch-light-menu.png",
      "night-watch-light-dialog.png",
    ]);
    const all = shots(["night-watch", "register", "desk"]);
    expect(all).toHaveLength(48);
    expect(new Set(all.map((shot) => shot.file)).size).toBe(48);
    expect(all[47]).toEqual({ theme: "desk", appearance: "light", view: "dialog", file: "desk-light-dialog.png" });
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

  it("feeds a work item's events to the pane its creation named, never to the setup pane that started before it, and refuses a work item without that pane", () => {
    const workItems = [
      { id: 1, title: "Rename the settings file", setup: null },
      { id: 2, title: "Fix the login redirect", setup: { paneId: 3 } },
      { id: 3, title: "Set up alone", setup: { paneId: 5 } },
    ];
    const sessions = [
      { id: 1, workItemId: 1 },
      { id: 3, workItemId: 2 },
      { id: 4, workItemId: 2 },
      { id: 5, workItemId: 3 },
    ];
    expect(createdPane({ workItems, sessions }, "Rename the settings file").id).toBe(1);
    expect(createdPane({ workItems, sessions }, "Fix the login redirect").id).toBe(4);
    expect(() => createdPane({ workItems, sessions }, "Set up alone")).toThrow("the daemon lists no pane of Set up alone");
    expect(() => createdPane({ workItems, sessions }, "Add an export of the history")).toThrow("the daemon lists no pane of Add an export of the history");
  });
});

describe.skipIf(!RUN)("the screenshots of the built app", () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;

  const SIDEBAR_LINE = `#repositories button[data-work-item="${WORK_ITEMS.length}"]`;
  const PARKED_LINE = `#repositories button[data-work-item="1"]`;
  const REVIEW_LINE = `#inbox-lines button[data-work-item="${WORK_ITEMS.findIndex(({ title }) => title === AT_REVIEW) + 1}"]`;
  const FINISHED_ID = WORK_ITEMS.findIndex(({ title }) => title === FINISHED) + 1;
  const BROKEN_ID = WORK_ITEMS.findIndex(({ title }) => title === BROKEN) + 1;
  /** The commit the broken work item's seal names, and the commit after it that broke it, once the run has committed them. */
  let brokenAt = "";
  let brokenBy = "";
  /** The summary's lines, in the order it draws them. */
  const SUMMARY_LINES = `[...document.querySelectorAll("#summary-lines button[data-work-item]")]`;
  /** A role's place of the approval line in the view's right column. */
  const place = (role: string): string => `#view-detail section.approval .place[data-role="${role}"]`;
  const MENU = `[role="menu"]`;

  /** The work items and the sessions the daemon lists, read as a second client of it, which then hands the daemon `told` where it is given. */
  async function listed(told?: ClientMessage): Promise<{ workItems: WorkItem[]; sessions: SessionInfo[] }> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    try {
      return await new Promise((resolve, reject) => {
        socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
        socket.addEventListener("error", () => reject(new Error("the daemon refused a second client")));
        socket.addEventListener("message", (event) => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          if (message.type !== "ready") return;
          if (told) socket.send(JSON.stringify(told));
          resolve({ workItems: message.workItems, sessions: message.sessions });
        });
      });
    } finally {
      socket.close();
    }
  }

  /** Asks the daemon for a seal of the work item, as a second client of it, and waits for its answer: the chain has started, or the daemon's refusal is thrown. */
  async function getSeal(workItemId: number): Promise<void> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    try {
      await new Promise<void>((resolve, reject) => {
        socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
        socket.addEventListener("error", () => reject(new Error("the daemon refused a second client")));
        socket.addEventListener("message", (event) => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          if (message.type === "ready") socket.send(JSON.stringify({ type: "getSeal", requestId: 1, workItemId } satisfies ClientMessage));
          if (message.type === "done" && message.requestId === 1) resolve();
          if (message.type === "error" && message.requestId === 1) reject(new Error(`the daemon started no chain for work item ${workItemId}: ${message.message}`));
        });
      });
    } finally {
      socket.close();
    }
  }

  /** The setup of the work item of that title, as the daemon lists it. */
  async function setupOf(title: string): Promise<WorktreeSetup | null> {
    return (await listed()).workItems.find((item) => item.title === title)?.setup ?? null;
  }

  /** Makes the main checkout name a setup, or none, before a work item is made: its two files. */
  function nameSetup(setup: "running" | "succeeded" | null): void {
    for (const [file, text] of Object.entries(SETUP_FILES)) {
      if (setup === null) rmSync(join(made.repo, file), { force: true });
      else writeFileSync(join(made.repo, file), text);
    }
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
    summary: async () => {
      await app.click("#nav-summary");
      await app.until(`!document.getElementById("summary-screen").hidden && document.getElementById("summary-sentence").textContent.startsWith("1 sealed, 1 seal broken") && ${SUMMARY_LINES}.slice(0, 2).map((line) => line.dataset.workItem + " " + line.querySelector(".seal").dataset.seal).join() === "${FINISHED_ID} sealed,${BROKEN_ID} broken"`, `the summary, leading with the seal given on ${FINISHED} and the seal broken on ${BROKEN}`);
    },
    inbox: async () => {
      // The inbox selects the work item whose view was open last, so the shown one's view opens first and the preview shows its question in each appearance.
      await show.view();
      await app.click("#nav-inbox");
      await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelectorAll("#inbox-lines button[data-work-item]").length === ${WORK_ITEMS.length} && document.querySelector('#inbox-screen [data-part="preview-title"]').textContent === ${JSON.stringify(SHOWN)} && document.querySelector('${REVIEW_LINE} .says')?.textContent === "Proofer, round 1" && document.querySelector('#inbox-lines button[data-work-item="${FINISHED_ID}"] .says')?.textContent === "Checks passed" && document.querySelector('#inbox-lines button[data-work-item="${FINISHED_ID}"] .seal[data-seal="sealed"]') && document.querySelector('#inbox-lines button[data-work-item="${BROKEN_ID}"] .says')?.textContent === "Seal broken" && document.querySelector('#inbox-lines button[data-work-item="${BROKEN_ID}"] .seal[data-seal="broken"]')`, `the inbox with its lines, the stage on the line of ${AT_REVIEW}, the pull request and the lit seal on the line of ${FINISHED}, the broken seal on the line of ${BROKEN} and the preview of ${SHOWN}`);
    },
    view: async () => {
      await app.click(SIDEBAR_LINE);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(SHOWN)} && document.querySelector("#stage .pane .xterm-scrollable-element") && document.querySelector("#view-detail section.setup") && document.querySelector('${place("proofer")} .state-icon.working') && document.querySelector('${place("crafter")} .state-icon.finished')`, "the work item's view with its terminal, its setup and its approval line");
      // The approval line stands under what the agent says, past the column's first screen, so the column is scrolled until the line is the last thing in it.
      await app.evaluate(`document.querySelector("#view-detail section.approval").scrollIntoView({ block: "end" })`);
    },
    parked: async () => {
      await app.click(PARKED_LINE);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(PARKED)} && !document.getElementById("questions").hidden && document.querySelectorAll("#questions fieldset[data-question]").length === ${QUESTIONS} && document.querySelector('${place("proofer")} .note')?.textContent === "1 round" && document.querySelector('${place("sealer")} .state-icon.waiting') && document.querySelector("#headless li.gate .state.finished") && document.querySelector("#headless li.gate .command")?.textContent === ${JSON.stringify(GATE)} && [...document.querySelectorAll("#headless li.gate button")].map((button) => button.textContent).join() === "Show output"`, "the parked work item's view with its questions, its approval line and the line of its broad gate");
      // The questions stand at the top of the column, which the shown work item's view left scrolled.
      await app.evaluate(`document.getElementById("view-scroll").scrollTop = 0`);
    },
    finished: async () => {
      await app.click(`#repositories button[data-work-item="${FINISHED_ID}"]`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(FINISHED)} && !document.getElementById("view-pull-request").hidden && document.getElementById("pull-request-number").textContent === ${JSON.stringify(PULL_REQUEST)} && document.getElementById("pull-request-checks").textContent === "Checks passed" && [...document.querySelectorAll("#pull-request-list .name")].map((name) => name.textContent).join() === ${JSON.stringify(CHECKS.join())} && document.querySelector('${place("sealer")} .note')?.textContent === "Sealed" && document.getElementById("view-seal-head").textContent.startsWith("Sealed at ") && document.querySelector("#tabs .tab.back.active") && document.querySelectorAll("#back .round").length === 2 && document.querySelector("#back .finding .close")?.textContent.startsWith("Fixed in ") && [...document.querySelectorAll("#back .stage .cost")].filter((cost) => cost.textContent.endsWith("converted")).length === 4`, "the finished work item's view with the back of its seal in front, its finding fixed and its four turns' converted costs, its pull request under the lit seal's place and its sealer's place sealed");
      // The approval line stands under what the agent says, so the column is scrolled until the line is the last thing in it, as in the view's shot.
      await app.evaluate(`document.querySelector("#view-detail section.approval").scrollIntoView({ block: "end" })`);
    },
    broken: async () => {
      await app.click(`#repositories button[data-work-item="${BROKEN_ID}"]`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(BROKEN)} && document.getElementById("view-seal-head").textContent === ${JSON.stringify(`Seal broken, sealed at ${brokenAt.slice(0, 7)}`)} && document.getElementById("view-seal-why").textContent === ${JSON.stringify(`\`${AFTER_THE_SEAL}\` changed after the sealed commit \`${brokenAt.slice(0, 7)}\`.`)} && !document.getElementById("get-seal").hidden && document.getElementById("get-seal").textContent === "Get a new seal" && document.querySelector('${place("sealer")} .note')?.textContent === "Seal broken" && document.querySelector("#tabs .tab.back.active") && document.querySelector("#back .broken-by")?.textContent.startsWith(${JSON.stringify(`Broken by ${brokenBy.slice(0, 7)}`)})`, "the broken work item's view with the back of its seal in front, naming the commit that broke it, and the broken seal, its sentence and Get a new seal at its foot");
      // The approval line stands under what the work item says, so the column is scrolled until the line is the last thing in it, as in the view's shot.
      await app.evaluate(`document.querySelector("#view-detail section.approval").scrollIntoView({ block: "end" })`);
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
    // The ignored files a setup copies, in the main checkout, and the `.gitignore` that ignores them, committed before any work item starts from the branch. The place for work records is committed with it, since a chain starts only in a worktree that holds one, and so are the broad gate command its `config.json` names and the script that command runs, since a chain starts only where the records name a gate.
    writeFileSync(join(made.repo, ".gitignore"), ".env\n.env.*\nnode_modules/\n*.pem\n");
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), `${MARKER}\n`);
    writeFileSync(join(made.repo, "seal", "config.json"), `${JSON.stringify({ "Broad gate": GATE })}\n`);
    mkdirSync(join(made.repo, "scripts"));
    writeFileSync(join(made.repo, "scripts", "check.sh"), GATE_SCRIPT);
    git(made.repo, "add", ".gitignore", "seal/README.md", "seal/config.json", "scripts/check.sh");
    git(made.repo, "commit", "--quiet", "-m", "ignore");
    for (const [path, text] of Object.entries(IGNORED)) {
      mkdirSync(dirname(join(made.repo, path)), { recursive: true });
      writeFileSync(join(made.repo, path), text);
    }
    app = await BuiltApp.start({ SHELL: SAMPLE_PANE, OWLERY_WORKTREES: made.root });
    // The app starts in the background, and the page of a window without the system's focus draws as one a person has left.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    // A pane that comes to wait or to finish behind another raises a notification, and none of this run reaches the system's.
    await app.evaluate(`window.Notification = class { static permission = "granted"; }`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    for (const { title, kind, events, setup } of WORK_ITEMS) {
      // Before the form opens, since the form names the setup its plan read and the creation runs that one alone.
      nameSetup(setup);
      await openForm(title);
      await app.evaluate(`document.getElementById("work-item-kind").value = ${JSON.stringify(kind)}`);
      await app.click("#work-item-create");
      await app.until(`!document.getElementById("work-item-dialog").open && !document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`, `the view of ${title}`);
      // The events follow the pane's start at once: a Claude Code pane that says nothing for ten seconds is listed as waiting.
      for (const event of events) feed(createdPane(await listed(), title).id, event);
      if (setup === null) continue;
      const begun = await setupOf(title);
      if (begun?.state !== "running" || begun.paneId === null) throw new Error(`the setup of ${title} is not running in a pane: ${JSON.stringify(begun)}`);
      if (setup === "running") continue;
      // The setup pane waits for the code its command ends with, on a line.
      await listed({ type: "input", id: begun.paneId, data: `${SETUP_ENDS_WITH}\n` });
      for (const deadline = Date.now() + 15_000; (await setupOf(title))?.state !== "succeeded"; await new Promise((resolve) => setTimeout(resolve, 100))) {
        if (Date.now() >= deadline) throw new Error(`the setup of ${title} never succeeded: ${JSON.stringify(await setupOf(title))}`);
      }
    }
    await app.until(`document.getElementById("strip-state").classList.contains("waiting")`, `${SHOWN} as the one that needs the person`);

    // Two commits in the shown work item's worktree, for the commits and the changed files of the preview and the view.
    const shown = (await listed()).workItems.find((item) => item.title === SHOWN);
    if (!shown) throw new Error(`the daemon lists no work item ${SHOWN}`);
    commitFile(shown.worktree, "redirect.ts");
    commitFile(shown.worktree, "redirect.test.ts");
    await app.until(`document.querySelectorAll("#view-detail .commit").length === 2 && document.querySelectorAll("#view-detail .file").length === 2`, "the two commits and the two changed files", 15_000);

    // The look the summary is read against, taken before any chain runs and before any seal: a second client of the daemon sends `looked`, and the daemon writes the look into its run folder. The page's own `looked` is held back from here on, whichever event sends it, the page that leaves among them, so no look of the page holds the seals the run gives below.
    await app.evaluate(`(() => { const send = WebSocket.prototype.send; WebSocket.prototype.send = function (data) { if (data !== '{"type":"looked"}') send.call(this, data); }; })()`);
    const lookFile = join(app.userData, "run", "last-look.json");
    const lookAsked = Date.now();
    await listed({ type: "looked" });
    const lookTaken = (): boolean => existsSync(lookFile) && (JSON.parse(readFileSync(lookFile, "utf8")) as { at: number }).at >= lookAsked;
    for (const deadline = Date.now() + 10_000; !lookTaken(); await new Promise((resolve) => setTimeout(resolve, 100))) {
      if (Date.now() >= deadline) throw new Error("the daemon wrote no look taken at the second client's `looked`");
    }

    // The parked work item's chain: one commit on its branch, and a seal asked for it. The stand-in for the CLI answers its round with no finding, the daemon runs the repository's broad gate, which passes, and the stand-in's sealer asks a question in place of a verdict, which the ruling parks the work item with. The run then writes a second question into the record the chain committed, and the daemon reads it at its next pass.
    const parked = (await listed()).workItems.find((workItem) => workItem.title === PARKED);
    if (!parked) throw new Error(`the daemon lists no work item ${PARKED}`);
    commitFile(parked.worktree, "hotfix.ts");
    await getSeal(parked.id);
    const chainOfParked = async (): Promise<WorkItem["chain"]> => (await listed()).workItems.find((workItem) => workItem.id === parked.id)?.chain ?? null;
    for (const deadline = Date.now() + 30_000; (await chainOfParked())?.state !== "parked"; await new Promise((resolve) => setTimeout(resolve, 100))) {
      if (Date.now() >= deadline) throw new Error(`the chain of ${PARKED} never parked: ${JSON.stringify(await chainOfParked())}`);
    }
    const stages = (await chainOfParked())?.stages.map(({ kind, state }) => `${kind} ${state}`) ?? [];
    if (stages.join() !== "round finished,gate finished,seal finished,ruling finished") throw new Error(`the chain of ${PARKED} parked after other stages: ${stages.join()}`);
    const threads = join(parked.worktree, "seal", "threads");
    const [named, ...others] = readdirSync(threads);
    if (named === undefined || others.length > 0) throw new Error(`the worktree of ${PARKED} holds no one directory of its own: ${[named, ...others].join()}`);
    const record = join(threads, named, RECORD_FILE);
    const asked = readFileSync(record, "utf8");
    if (!asked.includes(`asks: ${SEALER_ASKS}`)) throw new Error(`the record of ${PARKED} does not hold the sealer's question: ${asked}`);
    writeFileSync(record, withQuestion(asked, WRITTEN));
    await app.until(`document.querySelector('${PARKED_LINE} .state-icon.waiting')`, "the parked work item as one that needs the person", 15_000);

    // The finished work item's chain: one commit on its branch, a bare repository as the repository's one remote, and a seal asked for it. The stand-in for the CLI answers its first round with one finding, its fix pass with a fix and the finding's close, and its second round with no finding, the broad gate passes, and the stand-in's sealer seals, so the daemon pushes the branch to the bare repository and opens the pull request through the stand-in for `gh`, which reaches no GitHub.
    const finished = (await listed()).workItems.find((workItem) => workItem.title === FINISHED);
    if (!finished) throw new Error(`the daemon lists no work item ${FINISHED}`);
    const bare = join(made.base, "origin.git");
    git(made.base, "init", "--quiet", "--bare", bare);
    git(made.repo, "remote", "add", "origin", bare);
    commitFile(finished.worktree, "export.ts");
    await getSeal(finished.id);
    const ofFinished = async (): Promise<WorkItem | undefined> => (await listed()).workItems.find((workItem) => workItem.id === finished.id);
    for (let deadline = Date.now() + 30_000, now = await ofFinished(); now?.chain?.state !== "rested" || now.pullRequest?.checks !== "passed"; now = await ofFinished()) {
      if (now?.chain?.state === "stopped" || now?.chain?.state === "parked" || Date.now() >= deadline) throw new Error(`the chain of ${FINISHED} opened no pull request whose checks passed: ${JSON.stringify({ chain: now?.chain, pullRequest: now?.pullRequest })}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const sealed = (await ofFinished())?.chain?.stages.map(({ kind, state }) => `${kind} ${state}`) ?? [];
    if (sealed.join() !== "round finished,fix-pass finished,round finished,gate finished,seal finished,pull-request finished") throw new Error(`the chain of ${FINISHED} was sealed after other stages: ${sealed.join()}`);
    const branch = git(finished.worktree, "rev-parse", "--abbrev-ref", "HEAD").trim();
    if (git(bare, "rev-parse", branch).trim() !== git(finished.worktree, "rev-parse", "HEAD").trim()) throw new Error(`the bare remote does not hold the branch of ${FINISHED} at its worktree's head`);

    // The broken work item's seal: the records of a chain that sealed it, committed with git in its worktree as the daemon writes them, and one commit after them, which breaks the seal. No chain runs for it, and it holds no pull request.
    const broken = (await listed()).workItems.find((workItem) => workItem.title === BROKEN);
    if (!broken?.baseCommit) throw new Error(`the daemon lists no work item ${BROKEN} with its base commit`);
    brokenAt = commitSeal(broken.worktree, { workItem: BROKEN_RECORDS, branch: broken.branch, base: broken.baseCommit });
    brokenBy = commitFile(broken.worktree, AFTER_THE_SEAL);
    const sealOfBroken = async (): Promise<WorkItem["seal"]> => (await listed()).workItems.find((workItem) => workItem.id === broken.id)?.seal ?? null;
    for (let deadline = Date.now() + 20_000, seal = await sealOfBroken(); seal?.state !== "broken" || seal.commit !== brokenAt; seal = await sealOfBroken()) {
      if (Date.now() >= deadline) throw new Error(`the seal of ${BROKEN} never read broken at ${brokenAt}: ${JSON.stringify(seal)}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // The two chains that stay at work: one commit on the branch of the work item at review, and a seal asked for it and for the shown work item, before the shown one's prompts, since a chain starts in no work item a session works in. Each chain declares its work item's routing in a commit of its own and then runs round 1, which the stand-in for the CLI holds.
    const atReview = (await listed()).workItems.find((item) => item.title === AT_REVIEW);
    if (!atReview) throw new Error(`the daemon lists no work item ${AT_REVIEW}`);
    commitFile(atReview.worktree, "history.ts");
    await getSeal(atReview.id);
    await getSeal(shown.id);
    await app.until(`document.querySelector('${place("proofer")} .note')?.textContent === "Round 1" && document.querySelectorAll("#view-detail .commit").length === 3`, "the shown work item's round as running, and the commit that declares its routing", 20_000);

    // A prompt asked in the view, which the stand-in for the CLI fails.
    await app.click("#ask-prompt");
    await app.cdp("Input.insertText", { text: ASKED });
    await app.click("#ask-submit");
    await app.until(`document.querySelector("#headless li .state.failed") && document.querySelector("#headless li .error-output")`, "the asked prompt as failed", 15_000);
    // A second prompt, whose session waits for the person to allow a command.
    await app.click("#ask-prompt");
    await app.cdp("Input.insertText", { text: ASKED_TO_ALLOW });
    await app.click("#ask-submit");
    await app.until(`document.querySelector("#headless li .permission .call")?.textContent === "pnpm test -- redirect.test.ts"`, "the second prompt's request in the view", 15_000);

    // The page loads again, and opens on the summary of the look taken before the seals. The new page is a new document: its `Notification` is replaced before its first script runs, and its focus is emulated again.
    await app.cdp("Page.addScriptToEvaluateOnNewDocument", { source: `window.Notification = class { static permission = "granted"; }` });
    await app.cdp("Page.reload");
    await app.until(`document.getElementById("summary-screen")?.hidden === false`, "the summary in front of the page loaded again", 20_000);
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
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
