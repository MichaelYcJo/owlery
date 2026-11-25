import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createConnection, type Socket } from "node:net";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { readDiscovery } from "../src/daemon/discovery";
import { BuiltApp, buildApp } from "./built-app";
import { git, temporaryRepository } from "./repositories";

/** What the Machine dialog shows of each cap: its name, its field, its default's sentence, and whether "Use the default" is offered. */
type Shown = { cap: string; label: string; value: string; says: string; offersDefault: boolean }[];

/** The default's sentence of the cap on agents on the machine the harness gives every start (`SUITE_MACHINE` of ./built-app). */
const AGENTS_SAYS = "The default is 6: the 6 performance cores, fewer than the 27 that half of 36 GB holds at 679 MB an agent (not measured on this Mac yet).";
const WORKTREES_SAYS = "Nothing is proposed until a worktree is measured on this Mac.";
const PANES_SAYS = "The default is 8, for 36 GB of memory: 4 under 16 GB, 6 from 16 GB and 8 from 32 GB.";
const HEAVY_SAYS = "The default is 1: one for each 8 cores gives 1, one for each 16 GB gives 2, and the fewer is taken.";
/** The longest status line the screenshot run draws: the agents against their cap, a session that waits, and the Mac kept awake. */
const LONGEST_STATUS = "Daemon running, 4 agents of 4, 1 waiting, keeping the Mac awake";

// One start of the app, in the background, with a user data folder of its own and the machine the harness gives every start in place of the one the suite runs on.
describe.skipIf(process.platform !== "darwin")("the Machine dialog in the built app", { timeout: 120_000 }, () => {
  let app: BuiltApp;
  const limits = (): string | null => {
    const file = join(app.userData, "run", "limits.json");
    return existsSync(file) ? readFileSync(file, "utf8") : null;
  };
  const shown = (): Promise<Shown> =>
    app.evaluate(
      `[...document.querySelectorAll("#machine-caps .cap")].map((part) => ({ cap: part.dataset.cap, label: part.querySelector("label").textContent, value: part.querySelector("input").value, says: part.querySelector(".cap-says").textContent, offersDefault: !part.querySelector("button").disabled }))`,
    );
  const open = async (): Promise<void> => {
    await app.click("#machine-button");
    await app.until(`document.getElementById("machine-dialog").open`, "the Machine dialog");
  };
  /** A person's typing in a cap's field, over what it held. */
  const type = async (cap: string, text: string): Promise<void> => {
    await app.click(`#machine-${cap}`);
    await app.evaluate(`document.getElementById("machine-${cap}").select()`);
    await app.cdp("Input.insertText", { text });
  };
  const save = async (): Promise<void> => {
    await app.click("#machine-submit");
    await app.until(`!document.getElementById("machine-dialog").open`, "the Machine dialog closed");
  };

  beforeAll(async () => {
    buildApp();
    // `SHELL` is a program that prints nothing, so the daemon's lookup at its start finds no `claude`, and the status line does not depend on the person's Claude Code.
    app = await BuiltApp.start({ SHELL: "/usr/bin/true" });
    await app.until(`document.getElementById("status")?.textContent === "Daemon running, no agent"`, "the daemon's state in the status line");
  });

  afterAll(async () => {
    expect(await app.stop()).toEqual([]);
  });

  it("opens from a button at the sidebar's foot, and shows what the daemon read under `OWLERY_MACHINE` in one sentence and each cap's default with the numbers it came from (scenarios 1 and 16)", async () => {
    expect(await app.evaluate<{ hidden: boolean; label: string | null; title: string }>(`(() => { const button = document.getElementById("machine-button"); return { hidden: button.hidden, label: button.getAttribute("aria-label"), title: button.title }; })()`)).toEqual({ hidden: false, label: "Machine", title: "Machine…" });
    await open();
    expect(await app.evaluate<string>(`document.getElementById("machine-reading").textContent`)).toBe("36 GB of memory, 12 cores of which 6 are performance cores, a load of 0, and 25.1 GB free of 494.4 GB on the worktrees' disk.");
    expect(await shown()).toEqual([
      { cap: "agents", label: "Agents at once", value: "6", says: AGENTS_SAYS, offersDefault: false },
      { cap: "worktrees", label: "Worktrees", value: "", says: WORKTREES_SAYS, offersDefault: false },
      { cap: "panes", label: "Panes side by side", value: "8", says: PANES_SAYS, offersDefault: false },
      { cap: "heavyCommands", label: "Heavy commands at once", value: "1", says: HEAVY_SAYS, offersDefault: false },
    ]);
    // A Save that changes nothing sends nothing and closes the dialog.
    await save();
    expect(limits()).toBeNull();
  });

  it("keeps a cap a person types and saves in the daemon's run folder, shows it at the next opening with the default offered, and follows the default again after \"Use the default\" (scenario 3)", async () => {
    await open();
    await type("agents", "3");
    expect((await shown())[0]).toEqual({ cap: "agents", label: "Agents at once", value: "3", says: AGENTS_SAYS, offersDefault: true });
    await save();
    expect(limits()).toBe('{"agents":3}');

    await open();
    expect((await shown())[0]).toEqual({ cap: "agents", label: "Agents at once", value: "3", says: AGENTS_SAYS, offersDefault: true });
    await app.click('#machine-caps [data-cap="agents"] button');
    expect((await shown())[0]).toEqual({ cap: "agents", label: "Agents at once", value: "6", says: AGENTS_SAYS, offersDefault: false });
    await save();
    expect(limits()).toBe("{}");
    await open();
    expect((await shown())[0]?.value).toBe("6");
    await app.click("#machine-cancel");
    await app.until(`!document.getElementById("machine-dialog").open`, "the Machine dialog closed");
  });

  it("keeps what a person typed where another window changes a cap while the dialog is open, and shows that change in the other rows", async () => {
    await open();
    await type("agents", "4");
    // Another window of the same daemon sets the cap on panes.
    const discovery = readDiscovery(join(app.userData, "run"));
    if (!discovery) throw new Error("the daemon wrote no discovery file");
    const other = new WebSocket(`ws://127.0.0.1:${String(discovery.port)}`);
    try {
      await new Promise<void>((resolve, reject) => {
        other.once("open", () => resolve());
        other.once("error", reject);
      });
      other.send(JSON.stringify({ type: "hello", token: discovery.token }));
      other.send(JSON.stringify({ type: "setCaps", requestId: 1, panes: 12 }));
      await app.until(`document.getElementById("machine-panes").value === "12"`, "the other window's cap in the dialog");
      expect((await shown()).map(({ value, offersDefault }) => ({ value, offersDefault }))).toEqual([
        { value: "4", offersDefault: true },
        { value: "", offersDefault: false },
        { value: "12", offersDefault: true },
        { value: "1", offersDefault: false },
      ]);
      other.send(JSON.stringify({ type: "setCaps", requestId: 2, panes: null }));
      await app.until(`document.getElementById("machine-panes").value === "8"`, "the panes back on their default");
    } finally {
      other.close();
    }
    await app.click("#machine-cancel");
    await app.until(`!document.getElementById("machine-dialog").open`, "the Machine dialog closed");
    expect(limits()).toBe("{}");
  });

  it("says why a value is refused, in the daemon's sentence, keeps what was typed and the dialog open, and sends nothing", async () => {
    await open();
    await type("panes", "17");
    await app.click("#machine-submit");
    await app.until(`document.getElementById("machine-error").textContent !== ""`, "the refusal");
    expect(await app.evaluate<string>(`document.getElementById("machine-error").textContent`)).toBe("The cap on panes side by side is a whole number from 1 to 16.");
    expect(await app.evaluate<boolean>(`document.getElementById("machine-dialog").open`)).toBe(true);
    expect((await shown())[2]?.value).toBe("17");
    expect(limits()).toBe("{}");
    await app.click("#machine-cancel");
    await app.until(`!document.getElementById("machine-dialog").open`, "the Machine dialog closed");
  });

  it("gives the status line the foot's whole width, on a row above the foot's buttons, so its longest sentence reads on two lines at most", async () => {
    // The sentence is put in the status line and taken out again within one script, so no message of the daemon draws between.
    const foot = await app.evaluate<{ width: number; inside: number; lines: number; above: boolean }>(`(() => {
      const foot = document.getElementById("sidebar-foot");
      const status = document.getElementById("status");
      const said = status.textContent;
      status.textContent = ${JSON.stringify(LONGEST_STATUS)};
      const style = getComputedStyle(foot);
      const box = status.getBoundingClientRect();
      const words = document.createRange();
      words.selectNodeContents(status);
      const lines = new Set([...words.getClientRects()].map((rect) => Math.round(rect.top))).size;
      const buttons = [...foot.querySelectorAll(".icon-button")].filter((button) => !button.hidden).map((button) => button.getBoundingClientRect().top);
      status.textContent = said;
      return { width: Math.round(box.width), inside: Math.round(foot.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)), lines, above: buttons.length > 0 && buttons.every((top) => top >= box.bottom) };
    })()`);
    expect(foot.width).toBe(foot.inside);
    expect(foot.lines).toBeLessThanOrEqual(2);
    expect(foot.above).toBe(true);
  });

  it("lists under the limit on heavy commands those that run and wait, in the queue's order with each reason, and what ran from the runs' file, and the field changes the limit (scenarios K and I)", async () => {
    const runDir = join(app.userData, "run");
    // A run the daemon kept earlier: no work item's folder, 20 seconds, 1.5 GB at most and a highest load of 3.2.
    writeFileSync(join(runDir, "heavy-runs.jsonl"), `${JSON.stringify({ repo: null, workItemId: null, folder: "/elsewhere/scratch", name: "test", askedAt: 0, startedAt: 0, endedAt: 20_000, exitCode: 0, peakMemory: 1.5 * 1024 ** 3, load: 1, highestLoad: 3.2, beside: false, alone: false })}\n`);
    /** One command that asks for its turn on the daemon's turn socket, as the runner does, and the lines the daemon answers. */
    const asking = async (folder: string, name: string): Promise<{ socket: Socket; heard: string[] }> => {
      const socket = createConnection(join(runDir, "turns.sock"));
      const heard: string[] = [];
      socket.setEncoding("utf8");
      socket.on("data", (chunk: string) => heard.push(...chunk.split("\n").filter(Boolean)));
      await new Promise<void>((resolve, reject) => {
        socket.once("connect", () => resolve());
        socket.once("error", reject);
      });
      socket.write(`${JSON.stringify({ is: "ask", folder, name, place: "outside", alone: false })}\n`);
      return { socket, heard };
    };
    /** The heavy commands' part of the dialog: each label where it is shown, and each entry's name and the line under it. */
    const heavy = (): Promise<{ queueHead: string | null; queue: string[]; ranHead: string | null; ran: string[] }> =>
      app.evaluate(`(() => {
        const row = document.querySelector('#machine-caps [data-cap="heavyCommands"]');
        const list = (name) => [...row.querySelectorAll("." + name + " li")].map((entry) => entry.querySelector(".name").textContent + " / " + entry.querySelector(".detail").textContent);
        const head = (id) => { const shown = document.getElementById(id); return shown && shown.offsetParent !== null ? shown.textContent : null; };
        return { queueHead: head("machine-heavy-head"), queue: list("heavy-queue"), ranHead: head("machine-ran-head"), ran: list("heavy-ran") };
      })()`);
    /** Waits, 10 seconds at most, until what the askers heard holds. */
    const until = async (heard: () => boolean): Promise<void> => {
      for (const deadline = Date.now() + 10_000; !heard(); await new Promise((resolve) => setTimeout(resolve, 50))) if (Date.now() >= deadline) throw new Error("the daemon did not answer the askers on its turn socket");
    };
    const held = await asking("/elsewhere/scratch", "test");
    const waits = await asking("/elsewhere/other", "install");
    try {
      await until(() => held.heard.some((line) => line.includes('"turn"')) && waits.heard.some((line) => line.includes('"waits"')));
      await open();
      await app.until(`document.querySelectorAll("#machine-caps .heavy-ran li").length === 1 && document.querySelectorAll("#machine-caps .heavy-queue li").length === 2`, "the heavy commands in the dialog");
      expect(await heavy()).toEqual({
        queueHead: "Running and waiting",
        queue: ["scratch / Running · test · less than a minute", "other / Waiting · install · in no work item · less than a minute"],
        ranHead: "What ran",
        ran: ["scratch · test / 1 run · longest less than a minute · most memory 1.5 GB · highest load 3.2"],
      });
      await type("heavyCommands", "2");
      await save();
      expect(limits()).toBe('{"heavyCommands":2}');
      await until(() => waits.heard.some((line) => line.includes('"turn"')));
      await open();
      await app.until(`[...document.querySelectorAll("#machine-caps .heavy-queue li")].every((entry) => entry.textContent.includes("Running"))`, "both heavy commands running");
      expect((await heavy()).queue).toEqual(["scratch / Running · test · less than a minute", "other / Running · install · less than a minute"]);
    } finally {
      held.socket.destroy();
      waits.socket.destroy();
    }
    await app.until(`document.querySelectorAll("#machine-caps .heavy-queue li").length === 0`, "no heavy command in the dialog");
    expect((await heavy()).queueHead).toBeNull();
    await app.click("#machine-cancel");
    await app.until(`!document.getElementById("machine-dialog").open`, "the Machine dialog closed");
  });
});

// A second start, on a disk nearly full: 10.2 GB free, and a work item whose worktree is measured at 440 MB in the run folder.
describe.skipIf(process.platform !== "darwin")("the new work item form and the stage of a work item's view, in the built app on a disk nearly full", { timeout: 120_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  // No person set a cap on worktrees, so the cap is the proposal: the one that stands, and none more that the 0.2 GB past the 10 GB kept free holds at 440 MB.
  const WARNING = "The disk may not hold this worktree: 10.2 GB free, 10 GB kept free, and a worktree of this repository takes 440 MB. This is worktree 2 of a cap of 1.";

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    const worktree = join(made.root, "measured");
    git(made.repo, "worktree", "add", "--quiet", "-b", "owlery/measured", worktree);
    // 429,688 kilobytes of 1,024 bytes are 440 MB.
    const stored = { id: 1, title: "Measured", branch: "owlery/measured", worktree, createdAt: Date.now() - 60_000, baseCommit: null, baseBranch: null, pinned: false, muted: false, groupId: null, archivedAt: null, worktreeSize: { kilobytes: 429_688, measuredAt: Date.now() - 60_000 } };
    const repository = { id: 1, folder: made.repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: Date.now() - 60_000, groups: [], workItems: [stored] };
    const machine = { memoryBytes: 38_654_705_664, cores: 12, performanceCores: 6, freeBytes: 10_200_000_000, totalBytes: 494_384_795_648 };
    app = await BuiltApp.start(
      { SHELL: "/usr/bin/true", OWLERY_WORKTREES: made.root, OWLERY_MACHINE: JSON.stringify(machine) },
      { writeRun: (runDir) => writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [repository] })) },
    );
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
  });

  afterAll(async () => {
    expect(await app?.stop()).toEqual([]);
    made?.remove();
  });

  it("warns under the plan that the disk would not hold the worktree, with the free disk, the 10 GB kept free and what a worktree of the repository takes, and that the worktrees are at the cap the same disk proposes, in the theme's ink, and keeps Create enabled (scenarios 11 and 12)", async () => {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    await app.click("#work-item-repo");
    await app.evaluate(`document.getElementById("work-item-repo").select()`);
    await app.cdp("Input.insertText", { text: made.repo });
    try {
      await app.until(`document.getElementById("work-item-warning").textContent === ${JSON.stringify(WARNING)}`, "the warnings under the plan");
    } catch (error) {
      const plan = await app.evaluate<string>(`JSON.stringify({ repo: document.getElementById("work-item-repo").value, plan: document.getElementById("work-item-plan").textContent })`);
      throw new Error(`${(error as Error).message}; the form holds ${plan}`);
    }
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-create").disabled`)).toBe(false);
    expect(await app.evaluate<boolean>(`getComputedStyle(document.getElementById("work-item-warning")).display !== "none"`)).toBe(true);
    // In the theme's ink, not in the signal of a work item that waits for the person (docs/design.md, principle 3).
    const inks = await app.evaluate<{ warning: string; ink: string; signal: string }>(
      `(() => { const probe = (colour) => { const span = document.createElement("span"); span.style.color = colour; document.body.append(span); const read = getComputedStyle(span).color; span.remove(); return read; }; return { warning: getComputedStyle(document.getElementById("work-item-warning")).color, ink: probe("var(--ink)"), signal: probe("var(--state-waiting)") }; })()`,
    );
    expect(inks.warning).toBe(inks.ink);
    expect(inks.warning).not.toBe(inks.signal);
    await app.click("#work-item-cancel");
    await app.until(`!document.getElementById("work-item-dialog").open`, 'the "New work item" form closed');
  });

  /** Sets the cap on panes side by side in the Machine dialog. */
  const capPanes = async (cap: number): Promise<void> => {
    await app.click("#machine-button");
    await app.until(`document.getElementById("machine-dialog").open`, "the Machine dialog");
    await app.click("#machine-panes");
    await app.evaluate(`document.getElementById("machine-panes").select()`);
    await app.cdp("Input.insertText", { text: String(cap) });
    await app.click("#machine-submit");
    await app.until(`!document.getElementById("machine-dialog").open`, "the Machine dialog closed");
  };
  /** The tiles on the stage: how many, the columns and the rows their corners stand in, and the title of "Side by side". */
  const stage = (): Promise<{ tiles: string | undefined; columns: number; rows: number; title: string }> =>
    app.evaluate(`(() => {
      const boxes = [...document.querySelectorAll("#stage .pane:not([hidden])")].map((tile) => tile.getBoundingClientRect());
      return { tiles: document.getElementById("stage").dataset.tiles, columns: new Set(boxes.map((box) => Math.round(box.left))).size, rows: new Set(boxes.map((box) => Math.round(box.top))).size, title: document.getElementById("side-by-side").title };
    })()`);

  it("lays out six panes in three columns where the cap on panes side by side is 6, five with the last spanning two columns where it is 5, and two where it is 2, the rest staying tabs (scenario 14)", async () => {
    await capPanes(6);
    // The sidebar is drawn again at each message, so the click is made again until the view shows.
    const shown = `!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Measured"`;
    for (const deadline = Date.now() + 15_000; ; ) {
      await app.click(`#repositories button[data-work-item="1"]`);
      try {
        await app.until(shown, "the view of Measured", 2_000);
        break;
      } catch (error) {
        if (Date.now() >= deadline) throw error;
      }
    }
    const tabs = `document.querySelectorAll("#tabs .tab").length`;
    for (let count = 1; count <= 6; count += 1) {
      const button = (await app.evaluate<string[]>(`[...document.querySelectorAll("#pane-buttons button")].map((button) => button.textContent)`)).indexOf("+ Shell");
      await app.click(`#pane-buttons button:nth-child(${String(button + 1)})`);
      await app.until(`${tabs} === ${String(count)}`, `${String(count)} tabs`);
    }
    await app.click("#side-by-side");
    await app.until(`document.getElementById("stage").dataset.tiles === "6"`, "six panes side by side");
    expect(await stage()).toEqual({ tiles: "6", columns: 3, rows: 2, title: "Show up to 6 of this work item's panes at once" });
    // Five tiles: three above, and two under them, the last spanning the two columns left of its row.
    await capPanes(5);
    await app.until(`document.getElementById("stage").dataset.tiles === "5"`, "five panes side by side");
    expect(await stage()).toEqual({ tiles: "5", columns: 3, rows: 2, title: "Show up to 5 of this work item's panes at once" });
    const widths = await app.evaluate<number[]>(`[...document.querySelectorAll("#stage .pane:not([hidden])")].sort((a, b) => Number(a.dataset.tile) - Number(b.dataset.tile)).map((tile) => Math.round(tile.getBoundingClientRect().width))`);
    expect(widths[4]! / widths[0]!).toBeGreaterThan(1.9);
    await capPanes(2);
    await app.until(`document.getElementById("stage").dataset.tiles === "2"`, "two panes side by side");
    expect(await stage()).toEqual({ tiles: "2", columns: 2, rows: 1, title: "Show up to 2 of this work item's panes at once" });
    expect(await app.evaluate<number>(tabs)).toBe(6);
  });
});

// A third start, whose login shell is the stand-in of the screenshot run, which names the stand-in for the CLI (fixtures/sample-pane.sh, fixtures/sample-cli.sh), so a session a person asks for runs no `claude` of the person's. The cap on agents is 1, set in the run folder before the start.
describe.skipIf(process.platform !== "darwin")("the sessions that wait for the machine, in the Machine dialog of the built app", { timeout: 120_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  /** The prompt the stand-in for the CLI holds: it asks the person to allow a command and waits, so its session works until the app stops. */
  const HELD = "Run the tests of the redirect.";
  /** The prompt asked second, whose session waits for the machine and never starts. */
  const WAITS = "Which keys does the settings file hold?";
  const TITLE = "Rename the settings file";

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    const worktree = join(made.root, "settings");
    git(made.repo, "worktree", "add", "--quiet", "-b", "owlery/settings", worktree);
    const stored = { id: 1, title: TITLE, branch: "owlery/settings", worktree, createdAt: Date.now() - 60_000, baseCommit: null, baseBranch: null, pinned: false, muted: false, groupId: null, archivedAt: null };
    const repository = { id: 1, folder: made.repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: Date.now() - 60_000, groups: [], workItems: [stored] };
    app = await BuiltApp.start(
      { SHELL: join(__dirname, "fixtures", "sample-pane.sh"), OWLERY_WORKTREES: made.root },
      {
        writeRun: (runDir) => {
          writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [repository] }));
          writeFileSync(join(runDir, "limits.json"), JSON.stringify({ agents: 1 }));
        },
      },
    );
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
  });

  afterAll(async () => {
    expect(await app?.stop()).toEqual([]);
    made?.remove();
  });

  it("lists the sessions that wait under a label of their own, \"Waiting for the machine\", each with its work item's name and, on the line under it in the secondary colour, what it waits to run, and shows no label while none waits", async () => {
    await app.click("#machine-button");
    await app.until(`document.getElementById("machine-dialog").open && document.querySelector('#machine-caps [data-cap="agents"]')`, "the Machine dialog");
    /** The queue's label, as the agent row draws it where it is shown, and each entry's two parts with their boxes and colours. */
    const queue = (): Promise<{ label: string | null; entries: { name: string; detail: string; under: boolean; aligned: boolean; muted: boolean }[] }> =>
      app.evaluate(`(() => {
        const row = document.querySelector('#machine-caps [data-cap="agents"]');
        const list = row.querySelector(".cap-queue");
        const label = list?.previousElementSibling;
        const shown = label && label.offsetParent !== null ? label.textContent : null;
        const muted = getComputedStyle(row.querySelector(".cap-says")).color;
        return {
          label: shown,
          entries: [...(list?.querySelectorAll("li") ?? [])].map((entry) => {
            const name = entry.querySelector(".name");
            const detail = entry.querySelector(".detail");
            const a = name.getBoundingClientRect();
            const b = detail.getBoundingClientRect();
            const from = label ? Math.round(label.getBoundingClientRect().left) : -1;
            return { name: name.textContent, detail: detail.textContent, under: b.top >= a.bottom, aligned: Math.round(a.left) === from && Math.round(b.left) === from, muted: getComputedStyle(detail).color === muted };
          }),
        };
      })()`);
    expect(await queue()).toEqual({ label: null, entries: [] });

    const discovery = readDiscovery(join(app.userData, "run"));
    if (!discovery) throw new Error("the daemon wrote no discovery file");
    const other = new WebSocket(`ws://127.0.0.1:${String(discovery.port)}`);
    try {
      await new Promise<void>((resolve, reject) => {
        other.once("open", () => resolve());
        other.once("error", reject);
      });
      other.send(JSON.stringify({ type: "hello", token: discovery.token }));
      other.send(JSON.stringify({ type: "ask", requestId: 1, workItemId: 1, prompt: HELD }));
      await app.until(`document.getElementById("status")?.textContent.startsWith("Daemon running, 1 agent of 1")`, "the held session as the one agent");
      other.send(JSON.stringify({ type: "ask", requestId: 2, workItemId: 1, prompt: WAITS }));
      await app.until(`document.querySelectorAll("#machine-caps .cap-queue li").length === 1`, "the session that waits, in the dialog");
    } finally {
      other.close();
    }
    expect(await queue()).toEqual({ label: "Waiting for the machine", entries: [{ name: TITLE, detail: `Asked: ${WAITS}`, under: true, aligned: true, muted: true }] });
    await app.click("#machine-cancel");
    await app.until(`!document.getElementById("machine-dialog").open`, "the Machine dialog closed");
  });
});
