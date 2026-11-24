// The screenshot command: `pnpm run screenshots` sets `OWLERY_SCREENSHOTS`
// and this file then starts the built app in the background, on a temporary
// repository with seven work items, one in each state a work item has, one
// parked with questions, a finished one whose seal holds, and one whose seal
// a later commit broke, and writes one PNG file for each view (the summary,
// the inbox, a work item's view, the view of the parked work item, the view
// of the finished work item, the view of the broken one, a work item's menu,
// the "New work item" form, the dialog of the chain choice, the
// repository's settings and the Accounts dialog) in each appearance of the
// theme a first run opens in. The daemon keeps one account beside System
// default, handed over by an empty folder of the run's own, and the parked
// work item is set to it, so its line names it and the settings show the
// account's field. No session of the scene runs under it. The repository is on the owl chain, and the Claude Code config
// folder the run gives the app enables a stand-in for the AgenticSeal
// plugin, so the window holds the choice of a chain. The run stores the
// answer "the AgenticSeal plugin" before the app starts, so no pane of the
// scene is asked about and each is launched as in any other repository. The
// settings' shot sets the answer to the owl chain, and the choice's shot
// takes the answer away, presses "+ Claude Code" in the view and cancels the
// dialog, so neither launches a pane. No agent runs: a pane's process is a fixture, a state is what
// the daemon's hook socket is fed, the agent of the work item that needs the
// person waits on a question with two choices, fed as its question tool's
// call, and the view's work item is asked two prompts, which a stand-in for
// the CLI answers. It fails the first at once,
// and holds the second, whose session asks the person to allow a command and
// gets no answer, so the work item's line says the request and the view's
// "Ask" section shows its card. The run waits until the section shows that
// request before its first shot. That work item carries no decision made
// without asking and no setup's words on its line, so the line's second row
// gives its whole width to the request. No chain runs and the run starts
// none: it commits with git, in a work item's worktree, the records a
// chain's stages write there, and it stores two chains in the daemon's run
// folder before the app starts, as a daemon that ran them stored them. The
// view's work item holds its
// routing and one round's record, so its approval line shows two finished
// places and two not started. The parked work item is stored before the
// start with a parked chain whose broad gate passed: it holds its routing, a
// round that left no finding and the broad gate's run, and its record of
// questions holds two the run writes there, asked by the sealer, so the
// parked view lists them, lists the gate's line under "Ask" with the
// finished mark, and its approval line counts the round and marks the
// sealer's place, which waits on the questions. The finished work item is
// stored before the start with a rested chain and a pull request whose
// checks passed. Its branch takes the records of a chain that sealed it
// after one fix once the look is taken: round 1 with one finding, the
// commit that fixed it, the finding's close, round 2, which confirms the
// fix, the gate's run and the seal. The daemon reads the stored pull
// request again through `gh` while the window is connected, and the login
// shell's PATH names a stand-in first (fixtures/sample-gh/gh), which
// answers that read and notes each call, so no call reaches GitHub. The run
// appends the entries of that chain's stages to the daemon's ledger, each
// with what the stage used, so that work item's view opens to the back of
// its seal, with the finding, the commit that fixed it and each stage's
// converted cost, above the seal's place, which is lit, and the pull
// request under it. The broken work item holds the records of
// a seal and one commit after them, and no entry of the ledger, so its line
// waits and says "Seal broken", its view opens to the back of its seal,
// which names that commit and says that its stages ran outside the daemon,
// and its view's foot shows the broken seal and the seal's sentence. No shot
// shows a stage at work: a chain stored as running is read as stopped at the
// daemon's start (`chain.ts#chainRead`), and nothing in the app starts one
// until issue #55. Once the seven
// work items stand, and before any seal is given, a
// second client of the daemon sends `looked`, so the daemon's look holds
// each work item with no seal. From then on the page's own `looked` is held
// back, since a page that leaves sends a look, and once the scene stands the
// page loads again. Its `ready` carries the look taken before the seals, so
// the window opens on the summary, which leads with the finished work
// item's seal, given since the look, and the broken one's, broken since.
// The repository
// names a setup once four work items
// stand, so the one at work shows its setup running, the one in
// the view has a setup that succeeded, with the paths it copied, and the
// form names the setup's command; no setup's command runs, and the run
// types the code a setup pane ends with. The inbox's shot previews the work
// item that needs the person, with its agent's question and its approval
// line. The view's shot scrolls its side column until the approval line is
// the last thing in it, and the parked view's shot opens at the top of the
// column, where its questions stand. With
// `OWLERY_SCREENSHOT_THEMES` it captures other themes too: `all`, or names
// with commas between them. It writes into `screenshots/<the run's start>`
// under the app's folder, or into the folder `OWLERY_SCREENSHOT_DIR` names.
// Without `OWLERY_SCREENSHOTS` the file is the cases of the run's own
// functions, and starts no app. docs/design.md states when a pull request
// carries the files.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RECORD_FILE, withQuestion } from "../src/daemon/decision-record";
import { PARKED_SAYS, pullRequestOpenSays, routingText } from "../src/daemon/chain";
import { GATE_OUTPUT_FOLDER } from "../src/daemon/gate";
import { MARKER } from "../src/daemon/records-place";
import { createWorktree } from "../src/daemon/worktrees";
import { WINDOW_SIZE } from "../src/main/window-size";
import { type Chain, type ChainStage, type ClientMessage, type PullRequest, type ServerMessage, type SessionInfo, SYSTEM_DEFAULT_ID, SYSTEM_DEFAULT_NAME, type WorkItem, type WorktreeSetup } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { commitFile, git, temporaryRepository } from "./repositories";
import { chainEntry, commitAll, commitSeal, commitSealedAfterAFix, roundRecord, TODAY, write } from "./chain-run";
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
 * setup when it is made. A shell's work item has no agent. The first two
 * are the ones the run stores in the daemon's run folder before the app
 * starts (`STORED`), and every other is made through the form. The last one
 * made is the one whose view and menu are captured, and it is the one that
 * needs the person.
 */
const WORK_ITEMS: { title: string; kind: "shell" | "claude"; events: Record<string, unknown>[]; setup: "running" | "succeeded" | null }[] = [
  { title: "Choose the base of the hotfix", kind: "shell", events: [], setup: null },
  { title: "Add an export of the history", kind: "claude", events: [{ hook_event_name: "UserPromptSubmit" }, { hook_event_name: "Stop", last_assistant_message: "The history exports as a CSV file from the menu of the history screen, and four cases hold the columns." }], setup: null },
  { title: "Rename the settings file", kind: "shell", events: [], setup: null },
  { title: "Sort the history by date", kind: "shell", events: [], setup: null },
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
/** The first work item, which the run stores with a parked chain whose broad gate passed: its worktree holds the records of a round and of the broad gate's run, in the folder of the records this name gives, and its record of questions holds `ASKED_OF_PARKED`. Its view is the view "parked". */
const PARKED = WORK_ITEMS[0]?.title ?? "";
/** The account the run hands over by its folder, and the id the daemon keeps it under. */
const HANDED = "Work";
const HANDED_ID = 1;
const PARKED_RECORDS = "1795396351-choose-the-base-of-the-hotfix";
/** The repository's broad gate command, as its `config.json` names it, the script it runs, which the repository holds, and what a run of it prints, which the run stores as the output of the parked chain's gate. No chain runs, so nothing runs the command. */
const GATE = "sh scripts/check.sh";
const GATE_PRINTED = " Test Files  2 passed\n      Tests  12 passed\n";
const GATE_SCRIPT = "#!/bin/sh\nprintf ' Test Files  2 passed\\n      Tests  12 passed\\n'\n";
/** The finished work item, which the run stores with a rested chain and a pull request whose checks passed: the run commits the records of a chain that sealed it after one fix in its worktree, in the folder of the records this name gives, and appends that chain's stages to the daemon's ledger. Its view is the view "finished". */
const FINISHED = "Add an export of the history";
/** The work items the run stores in the daemon's run folder before the app starts, which are the first two of `WORK_ITEMS`, so their ids are 1 and 2. */
const STORED = [PARKED, FINISHED];
/** The stored pull request: its number, its address and its checks, as the stand-in for `gh` answers a read of it (fixtures/sample-gh/gh), and its number as the window says it. */
const PULL_REQUEST_NUMBER = 12;
const PULL_REQUEST_ADDRESS = "https://github.com/owner/project/pull/12";
const PULL_REQUEST = `Pull request #${String(PULL_REQUEST_NUMBER)}`;
const CHECKS = ["seal", "Owlery seal"];
const FINISHED_RECORDS = "1795396352-add-an-export-of-the-history";
/** The stages of the finished work item's chain, in the order they ended: four agents' turns and the gate. */
const FINISHED_STAGES = [["round", 1], ["fix-pass", 1], ["round", 2], ["gate", 2], ["seal", 2]] as const;
/** The work item whose seal a later commit broke: the run commits the records of a seal in its worktree, in the folder of the records this name gives, and one commit after them. Its view is the view "broken". */
const BROKEN = "Cache the user avatars";
const BROKEN_RECORDS = "1795396354-cache-the-user-avatars";
/** The file of the commit that breaks the seal, which the seal's sentence names. */
const AFTER_THE_SEAL = "avatars.ts";
/** A work item whose branch holds one commit and no record. */
const AT_REVIEW = "Sort the history by date";
/** The folder of the records of the shown work item, which hold its routing and one round. */
const SHOWN_RECORDS = "1795396357-fix-the-login-redirect";
/** The two questions the run writes into the parked work item's record, each asked by the sealer. */
const ASKED_OF_PARKED = [
  { asks: "Which base does the hotfix merge into?", grounds: "No document names the base of a hotfix, and the choice decides which release ships it.", by: "sealer" },
  { asks: "May the run push the branch to the remote?", grounds: "A push needs the person's approval.", by: "sealer", options: [{ label: "Yes", implies: "The branch is pushed once the seal is given." }, { label: "No", implies: "The branch stays on this Mac." }] },
];
/** The key of the stand-in for the AgenticSeal plugin in the Claude Code config folder the run gives the app. The daemon tells the plugin by the script its install folder holds, and by no name. */
const PLUGIN_KEY = "agentic@agenticseal";
/** The answers of the chain choice, as the menu of the repository's settings holds them: none, which asks at the next Claude Code pane, and the owl chain. */
const NO_ANSWER = "";
const OWL_CHAIN = "owlery";
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
      "night-watch-dark-chain.png",
      "night-watch-dark-settings.png",
      "night-watch-dark-accounts.png",
      "night-watch-light-summary.png",
      "night-watch-light-inbox.png",
      "night-watch-light-view.png",
      "night-watch-light-parked.png",
      "night-watch-light-finished.png",
      "night-watch-light-broken.png",
      "night-watch-light-menu.png",
      "night-watch-light-dialog.png",
      "night-watch-light-chain.png",
      "night-watch-light-settings.png",
      "night-watch-light-accounts.png",
    ]);
    const all = shots(["night-watch", "register", "desk"]);
    expect(all).toHaveLength(66);
    expect(new Set(all.map((shot) => shot.file)).size).toBe(66);
    expect(all[65]).toEqual({ theme: "desk", appearance: "light", view: "accounts", file: "desk-light-accounts.png" });
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
  /** The folder of the account the run hands over, once the run's temporary folders stand. */
  let handedFolder = "";
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
  const dialogOpen = (id: string): Promise<void> => app.until(`document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id}`);
  const dialogClosed = (id: string): Promise<void> => app.until(`!document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id} closed`);

  /** Opens the settings of the run's one repository from its menu in the sidebar. */
  const openSettings = async (): Promise<void> => {
    await app.click("#sidebar section[data-repository] .repository-menu");
    await app.until(`document.querySelector('${MENU} [role="menuitem"]')`, "the repository's menu");
    await app.evaluate(`(() => { for (const item of document.querySelectorAll('${MENU} [role="menuitem"]')) item.toggleAttribute("data-pressed-here", item.textContent === "Settings"); })()`);
    await app.click(`${MENU} [role="menuitem"][data-pressed-here]`);
    await dialogOpen("settings-dialog");
  };

  /**
   * Leaves the repository's settings open with the chain's field shown and
   * `answer` in it. Where the field holds another answer the run saves
   * `answer` there, as a person does, and opens the settings again until the
   * window holds what the daemon kept.
   */
  const settingsWith = async (answer: string): Promise<void> => {
    const field = `[document.getElementById("settings-chain-field").hidden, document.getElementById("settings-chain").value]`;
    for (const deadline = Date.now() + 20_000; ; await new Promise((resolve) => setTimeout(resolve, 300))) {
      await openSettings();
      const [hidden, value] = await app.evaluate<[boolean, string]>(field);
      if (!hidden && value === answer) return;
      if (Date.now() >= deadline) throw new Error(`the repository's settings never showed the chain's field with ${JSON.stringify(answer)}: ${JSON.stringify({ hidden, value })}`);
      if (hidden) {
        // The daemon has not sent what it read of the repository's check and of the plugin yet.
        await app.click("#settings-cancel");
      } else {
        await app.evaluate(`document.getElementById("settings-chain").value = ${JSON.stringify(answer)}`);
        await app.click("#settings-submit");
      }
      await dialogClosed("settings-dialog");
    }
  };

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
      await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelectorAll("#inbox-lines button[data-work-item]").length === ${WORK_ITEMS.length} && document.querySelector('#inbox-screen [data-part="preview-title"]').textContent === ${JSON.stringify(SHOWN)} && document.querySelector('#inbox-lines button[data-work-item="${FINISHED_ID}"] .says')?.textContent === "Checks passed" && document.querySelector('#inbox-lines button[data-work-item="${FINISHED_ID}"] .seal[data-seal="sealed"]') && document.querySelector('#inbox-lines button[data-work-item="${BROKEN_ID}"] .says')?.textContent === "Seal broken" && document.querySelector('#inbox-lines button[data-work-item="${BROKEN_ID}"] .seal[data-seal="broken"]') && document.querySelector('#inbox-lines button[data-work-item="1"] .account')?.textContent === ${JSON.stringify(HANDED)}`, `the inbox with its lines, the pull request and the lit seal on the line of ${FINISHED}, the broken seal on the line of ${BROKEN}, the account on the line of ${PARKED} and the preview of ${SHOWN}`);
    },
    view: async () => {
      await app.click(SIDEBAR_LINE);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(SHOWN)} && document.querySelector("#stage .pane .xterm-scrollable-element") && document.querySelector("#view-detail section.setup") && document.querySelector('${place("proofer")} .note')?.textContent === "1 round" && document.querySelector('${place("crafter")} .state-icon.finished')`, "the work item's view with its terminal, its setup and its approval line");
      // The approval line stands under what the agent says, past the column's first screen, so the column is scrolled until the line is the last thing in it.
      await app.evaluate(`document.querySelector("#view-detail section.approval").scrollIntoView({ block: "end" })`);
    },
    parked: async () => {
      await app.click(PARKED_LINE);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(PARKED)} && !document.getElementById("questions").hidden && document.querySelectorAll("#questions fieldset[data-question]").length === ${ASKED_OF_PARKED.length} && document.querySelector('${place("proofer")} .note')?.textContent === "1 round" && document.querySelector('${place("sealer")} .state-icon.waiting') && document.querySelector("#headless li.gate .state.finished") && document.querySelector("#headless li.gate .command")?.textContent === ${JSON.stringify(GATE)} && [...document.querySelectorAll("#headless li.gate button")].map((button) => button.textContent).join() === "Show output"`, "the parked work item's view with its questions, its approval line and the line of its broad gate, which passed");
      // The questions stand at the top of the column, which the shown work item's view left scrolled.
      await app.evaluate(`document.getElementById("view-scroll").scrollTop = 0`);
    },
    finished: async () => {
      await app.click(`#repositories button[data-work-item="${FINISHED_ID}"]`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(FINISHED)} && !document.getElementById("view-pull-request").hidden && document.getElementById("pull-request-number").textContent === ${JSON.stringify(PULL_REQUEST)} && document.getElementById("pull-request-checks").textContent === "Checks passed" && [...document.querySelectorAll("#pull-request-list .name")].map((name) => name.textContent).join() === ${JSON.stringify(CHECKS.join())} && document.querySelector('${place("sealer")} .note')?.textContent === "Sealed" && document.getElementById("view-seal-head").textContent.startsWith("Sealed at ") && document.querySelector("#tabs .tab.back.active") && document.querySelectorAll("#back .round").length === 2 && document.querySelector("#back .finding .close")?.textContent.startsWith("Fixed in ") && [...document.querySelectorAll("#back .stage .cost")].filter((cost) => cost.textContent.endsWith("converted")).length === 4`, "the finished work item's view with the back of its seal in front, its finding fixed and its four turns' converted costs, its pull request with its number, its state and each check under the lit seal's place, and its sealer's place sealed");
      // The approval line stands under what the agent says, so the column is scrolled until the line is the last thing in it, as in the view's shot.
      await app.evaluate(`document.querySelector("#view-detail section.approval").scrollIntoView({ block: "end" })`);
    },
    broken: async () => {
      await app.click(`#repositories button[data-work-item="${BROKEN_ID}"]`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(BROKEN)} && document.getElementById("view-seal-head").textContent === ${JSON.stringify(`Seal broken, sealed at ${brokenAt.slice(0, 7)}`)} && document.getElementById("view-seal-why").textContent === ${JSON.stringify(`\`${AFTER_THE_SEAL}\` changed after the sealed commit \`${brokenAt.slice(0, 7)}\`.`)} && document.querySelectorAll("#view-seal button").length === 0 && document.querySelector('${place("sealer")} .note')?.textContent === "Seal broken" && document.querySelector("#tabs .tab.back.active") && document.querySelector("#back .broken-by")?.textContent.startsWith(${JSON.stringify(`Broken by ${brokenBy.slice(0, 7)}`)}) && [...document.querySelectorAll("#back .sum")].some((sum) => sum.textContent.includes("ran outside Owlery's daemon"))`, "the broken work item's view with the back of its seal in front, naming the commit that broke it and saying that its stages ran outside the daemon, and the broken seal and its sentence at its foot, with nothing to press");
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
    chain: async () => {
      // The window asks while no answer is kept, so the answer is taken away first. The dialog then opens over the view at the press of "+ Claude Code", before any pane starts.
      await settingsWith(NO_ANSWER);
      await app.click("#settings-cancel");
      await dialogClosed("settings-dialog");
      await show.view();
      await app.evaluate(`(() => { for (const button of document.querySelectorAll("#pane-buttons button")) button.toggleAttribute("data-pressed-here", button.textContent === "+ Claude Code"); })()`);
      await app.click("#pane-buttons button[data-pressed-here]");
      await app.until(`document.getElementById("chain-dialog").open && document.getElementById("chain-owlery").checked`, "the dialog of the chain choice, on the owl chain");
    },
    settings: async () => {
      await show.inbox();
      await settingsWith(OWL_CHAIN);
    },
    accounts: async () => {
      await show.inbox();
      await app.click("#accounts-button");
      await app.until(`document.getElementById("accounts-dialog").open && [...document.querySelectorAll("#accounts-list li")].map((row) => row.querySelector(".account-name > span")?.textContent).join() === ${JSON.stringify(`${SYSTEM_DEFAULT_NAME},${HANDED}`)}`, "the Accounts dialog with System default and the account handed over");
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
    chain: async () => {
      // A cancel opens no pane and keeps no answer.
      await app.click("#chain-cancel");
      await dialogClosed("chain-dialog");
    },
    settings: async () => {
      await app.click("#settings-cancel");
      await dialogClosed("settings-dialog");
    },
    accounts: async () => {
      await app.click("#accounts-close");
      await dialogClosed("accounts-dialog");
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
    // The ignored files a setup copies, in the main checkout, and the `.gitignore` that ignores them, committed before any work item starts from the branch. The place for work records is committed with it, with the broad gate command its `config.json` names and the script that command runs, so the records the run commits in a worktree stand under a records root that is whole. Owlery's workflow is committed with it too, so the repository is on the owl chain.
    writeFileSync(join(made.repo, ".gitignore"), ".env\n.env.*\nnode_modules/\n*.pem\n");
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), `${MARKER}\n`);
    writeFileSync(join(made.repo, "seal", "config.json"), `${JSON.stringify({ "Broad gate": GATE })}\n`);
    mkdirSync(join(made.repo, "scripts"));
    writeFileSync(join(made.repo, "scripts", "check.sh"), GATE_SCRIPT);
    mkdirSync(join(made.repo, ".github", "workflows"), { recursive: true });
    writeFileSync(join(made.repo, ".github", "workflows", "owlery-seal.yml"), "name: Owlery seal\n");
    git(made.repo, "add", ".gitignore", "seal/README.md", "seal/config.json", "scripts/check.sh", ".github/workflows/owlery-seal.yml");
    git(made.repo, "commit", "--quiet", "-m", "ignore");
    for (const [path, text] of Object.entries(IGNORED)) {
      mkdirSync(dirname(join(made.repo, path)), { recursive: true });
      writeFileSync(join(made.repo, path), text);
    }
    // The Claude Code config folder the app's daemon reads, which is the run's own: it enables one plugin, installed where the script of AgenticSeal's check stands, so the daemon reads the plugin as enabled in a repository on the owl chain. Nothing of it is run.
    const config = join(made.base, "claude-config");
    handedFolder = join(made.base, "claude-work");
    mkdirSync(handedFolder, { recursive: true });
    const installed = join(config, "plugins", "cache", "agenticseal", "agentic", "1.0.0");
    mkdirSync(join(installed, "skills", "code-review", "scripts"), { recursive: true });
    writeFileSync(join(installed, "skills", "code-review", "scripts", "chain_check.py"), "# the check\n");
    writeFileSync(join(config, "settings.json"), `${JSON.stringify({ enabledPlugins: { [PLUGIN_KEY]: true } }, null, 2)}\n`);
    writeFileSync(join(config, "plugins", "installed_plugins.json"), `${JSON.stringify({ version: 2, plugins: { [PLUGIN_KEY]: [{ scope: "user", installPath: installed, version: "1.0.0" }] } })}\n`);
    // The two work items the run stores before the app starts, each in a worktree cut from `main` as the daemon cuts one. The parked one holds one commit, then the records of a round that left no finding and of the broad gate's run, committed with git as a chain commits them, and no seal, and its record of questions holds two of the sealer's. The finished one holds one commit, and the commits of a chain that sealed it after one fix are made here and taken off its branch again: the branch takes them once the look is taken, and the stored pull request names the commit they end at.
    const stored = Date.now();
    const parkedAt = await createWorktree({ folder: made.repo, title: PARKED, root: made.root });
    commitFile(parkedAt.worktree, "hotfix.ts");
    commitSeal(parkedAt.worktree, { workItem: PARKED_RECORDS, branch: parkedAt.branch, base: parkedAt.baseCommit, seal: false });
    writeFileSync(join(parkedAt.worktree, "seal", "threads", PARKED_RECORDS, RECORD_FILE), ASKED_OF_PARKED.reduce(withQuestion, ""));
    const finishedAt = await createWorktree({ folder: made.repo, title: FINISHED, root: made.root });
    const unsealed = commitFile(finishedAt.worktree, "export.ts");
    commitSealedAfterAFix(finishedAt.worktree, { workItem: FINISHED_RECORDS, branch: finishedAt.branch, base: finishedAt.baseCommit });
    const sealedAt = git(finishedAt.worktree, "rev-parse", "HEAD").trim();
    git(finishedAt.worktree, "reset", "--quiet", "--hard", unsealed);
    /** A stage as a daemon stores one that finished. */
    const ran = (kind: ChainStage["kind"], round: number, place: number): ChainStage => ({ kind, round, state: "finished", failure: null, startedAt: stored - (60 - place * 5) * 60_000, endedAt: stored - (56 - place * 5) * 60_000, headlessId: null, refusals: 0, gate: kind === "gate" ? { command: GATE, exitCode: 0, output: true } : null });
    const item = (id: number, title: string, at: typeof parkedAt) => ({ id, title, branch: at.branch, worktree: at.worktree, createdAt: stored - 2 * 60 * 60_000, baseCommit: at.baseCommit, baseBranch: at.baseBranch, pinned: false, muted: false, groupId: null, archivedAt: null });
    const parkedChain: Chain = { state: "parked", says: PARKED_SAYS, since: stored - 50 * 60_000, stages: [ran("round", 1, 0), ran("gate", 1, 1)] };
    const finishedChain: Chain = { state: "rested", says: pullRequestOpenSays(PULL_REQUEST_NUMBER), since: stored - 30 * 60_000, stages: [...FINISHED_STAGES.map(([kind, round], place) => ran(kind, round, place)), ran("pull-request", 2, FINISHED_STAGES.length)] };
    const pullRequest: PullRequest = { number: PULL_REQUEST_NUMBER, url: PULL_REQUEST_ADDRESS, state: "open", head: sealedAt, pushed: sealedAt, checks: "passed", list: CHECKS.map((name) => ({ name, state: "passed", link: null })), listCount: CHECKS.length, readAt: stored, failure: null };
    // The repository is stored with the answer "the AgenticSeal plugin", so no pane of the scene is asked about and none carries the bundle. The parked work item is set to the account the run hands over, which its repository does not give, so its line names it.
    const repository = { id: 1, folder: made.repo, name: null, icon: null, defaultBase: null, hidden: false, paneChain: "plugin", addedAt: stored - 3 * 60 * 60_000, groups: [], workItems: [{ ...item(1, PARKED, parkedAt), chain: parkedChain, accountId: HANDED_ID }, { ...item(2, FINISHED, finishedAt), chain: finishedChain, pullRequest }] };
    app = await BuiltApp.start(
      { SHELL: SAMPLE_PANE, OWLERY_WORKTREES: made.root, CLAUDE_CONFIG_DIR: config },
      {
        writeRun: (runDir) => {
          writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 3, nextRepositoryId: 2, nextGroupId: 1, repositories: [repository] }));
          // One account handed over by its folder, an empty one of the run's own: no session of the scene runs under it, and nothing reads it.
          writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: HANDED_ID + 1, defaultId: SYSTEM_DEFAULT_ID, accounts: [{ id: HANDED_ID, name: HANDED, adapter: "claude", folder: handedFolder, made: false }] }), { mode: 0o600 });
          // What the parked chain's gate printed, which its line's "Show output" draws.
          mkdirSync(join(runDir, GATE_OUTPUT_FOLDER), { mode: 0o700 });
          writeFileSync(join(runDir, GATE_OUTPUT_FOLDER, "1.txt"), GATE_PRINTED, { mode: 0o600 });
        },
      },
    );
    // The app starts in the background, and the page of a window without the system's focus draws as one a person has left.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    // A pane that comes to wait or to finish behind another raises a notification, and none of this run reaches the system's.
    await app.evaluate(`window.Notification = class { static permission = "granted"; }`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    for (const { title, kind, events, setup } of WORK_ITEMS) {
      if (STORED.includes(title)) {
        // A stored work item has no pane: a second client of the daemon starts one of its kind, and its events follow.
        const id = STORED.indexOf(title) + 1;
        await listed({ type: "start", kind, cols: 80, rows: 24, requestId: id, workItemId: id });
        for (const deadline = Date.now() + 15_000; !(await listed()).sessions.some((session) => session.workItemId === id); await new Promise((resolve) => setTimeout(resolve, 100))) {
          if (Date.now() >= deadline) throw new Error(`the daemon started no pane of ${title}`);
        }
        for (const event of events) feed(createdPane(await listed(), title).id, event);
        continue;
      }
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

    // The look the summary is read against, taken before any seal: a second client of the daemon sends `looked`, and the daemon writes the look into its run folder. The page's own `looked` is held back from here on, whichever event sends it, the page that leaves among them, so no look of the page holds the seals the run gives below.
    await app.evaluate(`(() => { const send = WebSocket.prototype.send; WebSocket.prototype.send = function (data) { if (data !== '{"type":"looked"}') send.call(this, data); }; })()`);
    const lookFile = join(app.userData, "run", "last-look.json");
    const lookAsked = Date.now();
    await listed({ type: "looked" });
    const lookTaken = (): boolean => existsSync(lookFile) && (JSON.parse(readFileSync(lookFile, "utf8")) as { at: number }).at >= lookAsked;
    for (const deadline = Date.now() + 10_000; !lookTaken(); await new Promise((resolve) => setTimeout(resolve, 100))) {
      if (Date.now() >= deadline) throw new Error("the daemon wrote no look taken at the second client's `looked`");
    }

    // The parked work item stands as the run stored it: the daemon reads the two questions of its record, and its line waits for the person.
    await app.until(`document.querySelector('${PARKED_LINE} .state-icon.waiting')`, "the parked work item as one that needs the person", 15_000);

    // The finished work item: its branch takes the commits of the chain that sealed it, made before the start, so its seal is given after the look, and the entries of that chain's stages are appended to the daemon's ledger, which the daemon reads at each `readLedger`. The stored pull request names the sealed commit as the one pushed, and the daemon's next read of it through the stand-in for `gh` gives that commit as its head.
    const finished = (await listed()).workItems.find((workItem) => workItem.title === FINISHED);
    if (!finished?.baseCommit) throw new Error(`the daemon lists no work item ${FINISHED} with its base commit`);
    git(finished.worktree, "merge", "--quiet", "--ff-only", sealedAt);
    const ended = Date.now();
    appendFileSync(join(app.userData, "run", "ledger.jsonl"), FINISHED_STAGES.map(([kind, round], place) => `${JSON.stringify(chainEntry(finished, kind, round, ended + place * 5 * 60_000))}\n`).join(""), { mode: 0o600 });
    const ofFinished = async (): Promise<WorkItem | undefined> => (await listed()).workItems.find((workItem) => workItem.id === finished.id);
    for (let deadline = Date.now() + 60_000, now = await ofFinished(); now?.seal?.state !== "sealed" || now.pullRequest?.head !== sealedAt || now.pullRequest.checks !== "passed" || now.pullRequest.failure !== null; now = await ofFinished()) {
      if (Date.now() >= deadline) throw new Error(`${FINISHED} never read sealed with its pull request at the sealed commit: ${JSON.stringify({ seal: now?.seal, pullRequest: now?.pullRequest })}`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // The broken work item's seal: the records of a chain that sealed it, committed with git in its worktree, and one commit after them, which breaks the seal. The ledger holds no entry of it.
    const broken = (await listed()).workItems.find((workItem) => workItem.title === BROKEN);
    if (!broken?.baseCommit) throw new Error(`the daemon lists no work item ${BROKEN} with its base commit`);
    brokenAt = commitSeal(broken.worktree, { workItem: BROKEN_RECORDS, branch: broken.branch, base: broken.baseCommit });
    brokenBy = commitFile(broken.worktree, AFTER_THE_SEAL);
    const sealOfBroken = async (): Promise<WorkItem["seal"]> => (await listed()).workItems.find((workItem) => workItem.id === broken.id)?.seal ?? null;
    for (let deadline = Date.now() + 20_000, seal = await sealOfBroken(); seal?.state !== "broken" || seal.commit !== brokenAt; seal = await sealOfBroken()) {
      if (Date.now() >= deadline) throw new Error(`the seal of ${BROKEN} never read broken at ${brokenAt}: ${JSON.stringify(seal)}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // One commit on the branch of a work item with no record, and the shown work item's routing and one round's record, each in a commit of its own as a chain commits them.
    const atReview = (await listed()).workItems.find((item) => item.title === AT_REVIEW);
    if (!atReview) throw new Error(`the daemon lists no work item ${AT_REVIEW}`);
    commitFile(atReview.worktree, "history.ts");
    write(shown.worktree, `seal/threads/${SHOWN_RECORDS}/routing.md`, routingText(SHOWN_RECORDS, shown.branch, TODAY));
    const routed = commitAll(shown.worktree, "chore: declare the work item's routing");
    write(shown.worktree, `seal/threads/${SHOWN_RECORDS}/trail/rounds/round-1.md`, roundRecord(`# Review round 1: ${SHOWN_RECORDS}`, `${routed} against main`));
    commitAll(shown.worktree, "chore: record review round 1");
    await app.until(`document.querySelector('${place("proofer")} .note')?.textContent === "1 round" && document.querySelectorAll("#view-detail .commit").length === 4`, "the shown work item's round as recorded, and the two commits of its records", 20_000);

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
  }, 240_000);

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
    // Every call of `gh` came to the stand-in, which notes each, and each was a read of the stored pull request: the run started no chain, so nothing opened or edited one, and no call reached GitHub.
    const calls = readFileSync(join(app.userData, "run", "sample-gh.calls"), "utf8").split("\n").filter((line) => line !== "");
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.filter((call) => !call.startsWith(`pr view ${PULL_REQUEST_ADDRESS} `))).toEqual([]);
  }, 300_000);
});
