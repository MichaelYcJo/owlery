import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { readDiscovery } from "../src/daemon/discovery";
import { BuiltApp, buildApp } from "./built-app";

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
