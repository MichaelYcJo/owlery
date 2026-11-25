import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

  it("opens from a button at the sidebar's foot, and shows what the daemon read under `OWLERY_MACHINE` in one line and each cap's default with the numbers it came from (scenarios 1 and 16)", async () => {
    expect(await app.evaluate<{ hidden: boolean; label: string | null; title: string }>(`(() => { const button = document.getElementById("machine-button"); return { hidden: button.hidden, label: button.getAttribute("aria-label"), title: button.title }; })()`)).toEqual({ hidden: false, label: "Machine", title: "Machine…" });
    await open();
    expect(await app.evaluate<string>(`document.getElementById("machine-reading").textContent`)).toBe("36 GB of memory, 12 cores of which 6 are performance cores, a load of 0, and 25.1 GB free of 494.4 GB on the worktrees' disk.");
    expect(await shown()).toEqual([
      { cap: "agents", label: "Agents at once", value: "6", says: AGENTS_SAYS, offersDefault: false },
      { cap: "worktrees", label: "Worktrees", value: "", says: WORKTREES_SAYS, offersDefault: false },
      { cap: "panes", label: "Panes side by side", value: "8", says: PANES_SAYS, offersDefault: false },
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
});

// A second start, on a disk nearly full: 10.2 GB free, and a worktree of the repository measured at 440 MB in the run folder.
describe.skipIf(process.platform !== "darwin")("the new work item form on a disk nearly full, in the built app", { timeout: 120_000 }, () => {
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

  it("warns under the plan that the disk would not hold the worktree, with the free disk, the 10 GB kept free and what a worktree of the repository takes, and that the worktrees are at the cap the same disk proposes, and keeps Create enabled (scenarios 11 and 12)", async () => {
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
  });
});
