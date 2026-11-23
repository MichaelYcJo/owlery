// The approval line in the built app. It starts the app once, in the
// background, on a temporary repository. The login shell is a script that
// names a script CLI, which only prints its version, so no real `claude`
// runs and no stage runs. A second client of the daemon makes one work item
// with a shell's pane. The case then commits a file in its worktree and
// writes the records a stage would write there: the records root, the
// routing that names the branch, and two round records. The daemon reads
// them at its next pass, and the view's right column and the inbox's preview
// draw the line. The page's `Notification` is replaced by a recorder, so
// nothing reaches the system's notifications.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import { APPEARANCES, THEMES } from "../src/shared/appearance";
import type { ServerMessage, WorkItem } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { commitFile, temporaryRepository } from "./repositories";

/** What a place of the line shows, as a person and a screen reader read it. */
interface Shown {
  role: string;
  mark: string[];
  name: string;
  note: string;
  label: string;
  seal: string | null;
}

/** The places the line holds once the daemon has read the records: the crafter's and the proofer's finished, the framer's and the sealer's not started, and the seal's place in the sealer's. */
const EXPECTED: Shown[] = [
  { role: "framer", mark: ["no-agent"], name: "Framer", note: "Not started", label: "Framer: Not started", seal: null },
  { role: "crafter", mark: ["finished"], name: "Crafter", note: "1 commit", label: "Crafter: 1 commit", seal: null },
  { role: "proofer", mark: ["finished"], name: "Proofer", note: "2 rounds", label: "Proofer: 2 rounds", seal: null },
  { role: "sealer", mark: ["no-agent"], name: "Sealer", note: "Not started", label: "Sealer: Not started", seal: "none" },
];

/** The view's right column and the inbox's preview, each with the element its section stands in, which scrolls. */
const WHERE = { view: { detail: "#view-detail", column: "#view-scroll" }, preview: { detail: "#inbox-preview-detail", column: "#inbox-screen .preview-body" } } as const;

describe("the approval line in the built app", { timeout: 120_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  let workItem: WorkItem;

  function script(name: string, body: string): string {
    const path = join(made.base, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
    return path;
  }

  /** The approval sections under a part of the page, each with its heading and its places. */
  const sections = (within: string): Promise<{ head: string; places: Shown[] }[]> =>
    app.evaluate(
      `[...document.querySelectorAll(${JSON.stringify(`${within} section.approval`)})].map((section) => ({ head: section.querySelector("h3").textContent, places: [...section.querySelectorAll(".place")].map((place) => { const mark = place.querySelector(".state-icon"); return { role: place.dataset.role, mark: [...mark.classList].filter((name) => name !== "state-icon" && name !== "state"), name: place.querySelector(".name").textContent, note: place.querySelector(".note").textContent, label: mark.getAttribute("aria-label"), seal: place.querySelector(".seal")?.dataset.seal ?? null }; }) }))`,
    );

  /** Each width that runs past its box: the column's, the section's and each place's, with the box's own, and the section's room. */
  const overflows = (where: keyof typeof WHERE): Promise<{ room: number; over: string[] }> =>
    app.evaluate(`(() => {
      const column = document.querySelector(${JSON.stringify(WHERE[where].column)});
      const section = document.querySelector(${JSON.stringify(`${WHERE[where].detail} section.approval`)});
      const boxes = [["column", column], ["section", section], ...[...section.querySelectorAll(".place")].map((place) => [place.dataset.role, place])];
      return { room: section.clientWidth, over: boxes.filter(([, box]) => box.scrollWidth > box.clientWidth).map(([name, box]) => name + " " + box.scrollWidth + " in " + box.clientWidth) };
    })()`);

  /** A person's choice in one of the two controls of the sidebar's foot. */
  const choose = (control: "theme" | "appearance", choice: string): Promise<void> =>
    app.evaluate(`(() => { const choices = document.getElementById(${JSON.stringify(control)}); choices.value = ${JSON.stringify(choice)}; choices.dispatchEvent(new Event("change", { bubbles: true })); })()`);

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The daemon runs the CLI at its start, to read its version, and runs it for nothing else here.
    const cli = script("cli", `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\nexit 3`);
    // The login shell: it names the stand-in, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root });
    await app.evaluate(`window.Notification = class { static permission = "granted"; }`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");

    // A second client of the daemon makes the work item.
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    try {
      workItem = await new Promise<WorkItem>((resolve) => {
        socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
        socket.addEventListener("message", (event) => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          if (message.type === "ready") socket.send(JSON.stringify({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Alpha", kind: "shell", cols: 80, rows: 24 }));
          if (message.type === "workItemCreated") resolve(message.workItem);
        });
      });
    } finally {
      socket.close();
    }

    // One commit after the base, and the records a stage writes: the root, the routing that names the branch, and two rounds.
    commitFile(workItem.worktree, "login.ts");
    const directory = join(workItem.worktree, "seal", "threads", "1-alpha");
    mkdirSync(join(directory, "trail", "rounds"), { recursive: true });
    writeFileSync(join(workItem.worktree, "seal", "README.md"), `${MARKER}\n`);
    writeFileSync(join(directory, "routing.md"), `| Axis | Answer |\n|---|---|\n| Review | through the review chain |\n| Destination | open the pull request |\n| Branch | ${workItem.branch} |\n`);
    for (const round of [1, 2]) writeFileSync(join(directory, "trail", "rounds", `round-${round}.md`), `# Round ${round}\n`);

    await app.click(`#repositories button[data-work-item="${workItem.id}"]`);
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha");
    await app.until(`document.querySelector('#view-detail section.approval .place[data-role="proofer"] .note')?.textContent === "2 rounds" && document.querySelector('#view-detail section.approval .place[data-role="crafter"] .note')?.textContent === "1 commit"`, "the line as the records and the commit give it", 20_000);
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it('draws one section headed "Approval line" in the view\'s right column and in the inbox\'s preview, with the four places in order, each with its mark, its name and its note, and the seal\'s place in the sealer\'s', async () => {
    expect(await sections("#view-detail")).toEqual([{ head: "Approval line", places: EXPECTED }]);
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector("#inbox-preview-detail section.approval")`, "the preview with its approval line");
    expect(await sections("#inbox-preview-detail")).toEqual([{ head: "Approval line", places: EXPECTED }]);
    // The section stands after what the agent says and before the decisions, and this work item has neither: it is the first of the preview's.
    expect(await app.evaluate<string>(`document.querySelector("#inbox-preview-detail > section").className`)).toBe("approval");
  });

  it("keeps the section and each place within its column in every theme and in each appearance, in the view and in the preview", async () => {
    const found: string[] = [];
    for (const where of ["view", "preview"] as const) {
      if (where === "view") {
        await app.click(`#repositories button[data-work-item="${workItem.id}"]`);
        await app.until(`!document.getElementById("work-item-view").hidden && document.querySelector("#view-detail section.approval")`, "the view with its approval line");
      } else {
        await app.click("#nav-inbox");
        await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector("#inbox-preview-detail section.approval")`, "the preview with its approval line");
      }
      for (const theme of THEMES) {
        for (const appearance of APPEARANCES) {
          await choose("theme", theme);
          await choose("appearance", appearance);
          await app.until(`document.documentElement.dataset.theme === ${JSON.stringify(theme)} && document.documentElement.dataset.appearance === ${JSON.stringify(appearance)}`, `the window in ${theme}, ${appearance}`);
          const { room, over } = await overflows(where);
          // A section that is not laid out has no width, and nothing runs past nothing.
          expect(room).toBeGreaterThan(0);
          found.push(...over.map((line) => `${where}, ${theme} ${appearance}: ${line}`));
        }
      }
    }
    expect(found).toEqual([]);
  });
});
