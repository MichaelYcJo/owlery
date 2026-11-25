// The approval line in the built app. It starts the app once, in the
// background, on a temporary repository that holds the place for work
// records. The login shell is a script that names a script CLI, so no real
// `claude` runs, and no session of the CLI is started: nothing in the window
// starts a chain. A second client of the daemon makes a work item with a
// shell's pane. In its worktree the file commits a file and writes the
// records a stage would write there: the routing that names the branch, and
// two round records. The daemon reads them at its next pass, and the view's
// right column and the inbox's preview draw the line. A second work item,
// made by a later case, has the records of a seal committed on its branch as
// a chain commits them, and then one more commit, which breaks that seal.
// One more work item stands in the run folder before the app starts, with a
// chain a daemon stored as stopped, so the view's foot has a chain's sentence
// to say.
// In the background the page raises nothing of the system's and keeps each
// notification in `window.__notifications` (src/renderer/notifier.ts), which
// the cases read.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import { APPEARANCES, THEMES } from "../src/shared/appearance";
import type { ClientMessage, ServerMessage, WorkItem } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { commitSeal } from "./chain-run";
import { branchOf, commitFile, git, temporaryRepository } from "./repositories";

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

/** The sentence of the chain the run folder holds for the work item that stands there before the app starts. */
const STORED_SAYS = "Review round 1 failed: the session was stopped at a request before it finished.";

/** The view's right column and the inbox's preview, each with the element its section stands in, which scrolls. */
const WHERE = { view: { detail: "#view-detail", column: "#view-scroll" }, preview: { detail: "#inbox-preview-detail", column: "#inbox-screen .preview-body" } } as const;

describe("the approval line in the built app", { timeout: 120_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  /** The work item whose line the records fill. */
  let workItem: WorkItem;
  /** The second client of the daemon: a work item of a title as the daemon last listed it, and a message it sends. */
  let second: { item(title: string): WorkItem | undefined; send(message: ClientMessage): void; close(): void };
  /** Gives a work item a creation made its branch by a rename to its own name, through the second client, as a person gives a work item with no branch yet its branch, and gives the work item once the lists carry the branch. */
  const branched = async (item: WorkItem, requestId: number): Promise<WorkItem> => {
    second.send({ type: "renameWorkItem", requestId, id: item.id, title: item.title, branch: true });
    for (const deadline = Date.now() + 15_000; Date.now() < deadline; await new Promise((resolve) => setTimeout(resolve, 50))) {
      const now = second.item(item.title);
      if (now?.branch) return now;
    }
    throw new Error(`the work item ${item.title} was given no branch`);
  };

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

  /**
   * Opens a work item's view by a click on its line of the sidebar. The
   * sidebar replaces its buttons each time it is drawn, so a press and a
   * release with a draw between them land on two buttons and make no click.
   * The click is made again until the view shows.
   */
  const openView = async ({ id, title }: WorkItem): Promise<void> => {
    const shown = `!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`;
    for (const deadline = Date.now() + 15_000; ; ) {
      await app.click(`#repositories button[data-work-item="${id}"]`);
      try {
        return await app.until(shown, `the view of ${title}`, 2_000);
      } catch (error) {
        if (Date.now() >= deadline) throw error;
      }
    }
  };

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The place for work records stands on the branch the work items are cut from.
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), `${MARKER}\n`);
    writeFileSync(join(made.repo, "seal", "config.json"), '{ "Broad gate": "true" }\n');
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: add the place for work records");
    // The daemon runs the CLI at its start, to read its version: that run prints one and is no session, and no case of this file starts one.
    const cli = script("cli", `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\nexit 1`);
    // The login shell: it names the stand-in, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '${cli}' '/usr/bin:/bin' "\${CLAUDE_CONFIG_DIR:-}"`);
    // A work item of the run folder, as a daemon that ran its chain stored it: the chain stopped, with its sentence. Nothing in the window starts a chain, and one the daemon holds is still said.
    const storedWorktree = join(made.root, "stored");
    git(made.repo, "worktree", "add", "--quiet", "-b", "owlery/stored", storedWorktree);
    const stored = { id: 1, title: "Stored", branch: "owlery/stored", worktree: storedWorktree, createdAt: Date.now() - 60 * 60_000, baseCommit: null, baseBranch: null, pinned: false, muted: false, groupId: null, archivedAt: null, chain: { state: "stopped", says: STORED_SAYS, stages: [], since: Date.now() - 60_000 } };
    const repository = { id: 1, folder: made.repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: Date.now() - 60 * 60_000, groups: [], workItems: [stored] };
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root }, { writeRun: (runDir) => writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [repository] })) });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");

    // A second client of the daemon makes the work item.
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    const messages: ServerMessage[] = [];
    const create = (requestId: number, title: string): void => socket.send(JSON.stringify({ type: "createWorkItem", requestId, repo: made.repo, title, kind: "shell", cols: 80, rows: 24 }));
    second = {
      item: (title) => messages.flatMap((message) => (message.type === "ready" || message.type === "inbox" ? message.workItems : [])).filter((item) => item.title === title).at(-1),
      send: (message) => socket.send(JSON.stringify(message)),
      close: () => socket.close(),
    };
    const created = await new Promise<WorkItem>((resolve) => {
      socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        messages.push(message);
        if (message.type === "ready") create(1, "Alpha");
        if (message.type === "workItemCreated") resolve(message.workItem);
      });
    });
    workItem = await branched(created, 11);

    // One commit after the base, and the records a stage writes: the routing that names the branch, and two rounds.
    commitFile(workItem.worktree, "login.ts");
    const directory = join(workItem.worktree, "seal", "threads", "1-alpha");
    mkdirSync(join(directory, "trail", "rounds"), { recursive: true });
    writeFileSync(join(directory, "routing.md"), `| Axis | Answer |\n|---|---|\n| Review | through the review chain |\n| Destination | open the pull request |\n| Branch | ${workItem.branch} |\n`);
    for (const round of [1, 2]) writeFileSync(join(directory, "trail", "rounds", `round-${round}.md`), `# Round ${round}\n`);

    await openView(workItem);
    await app.until(`document.querySelector('#view-detail section.approval .place[data-role="proofer"] .note')?.textContent === "2 rounds" && document.querySelector('#view-detail section.approval .place[data-role="crafter"] .note')?.textContent === "1 commit"`, "the line as the records and the commit give it", 20_000);
  }, 120_000);

  afterAll(async () => {
    second?.close();
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
        await openView(workItem);
        await app.until(`document.querySelector("#view-detail section.approval")`, "the view with its approval line");
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

  /** The seal's place where the window shows the work item's seal, each as its form and its words, or null where it is not drawn: the line of the inbox, the preview and the words beside it, the view's foot with the words at its head, the chain's sentence and how many buttons it holds, and the sealer's place of the view's approval line with its note. */
  const sealsOf = (id: number): Promise<Record<string, unknown>> =>
    app.evaluate(`(() => {
      const shown = (place) => (place ? [place.dataset.seal, place.getAttribute("aria-label")] : null);
      const sealer = document.querySelector('#view-detail section.approval .place[data-role="sealer"]');
      return {
        line: shown(document.querySelector('#inbox-lines button[data-work-item="${String(id)}"] .seal')),
        preview: shown(document.querySelector("#inbox-screen .seal-slot .seal")),
        previewWords: document.getElementById("inbox-preview-seal-words").textContent,
        view: shown(document.querySelector("#view-seal .seal")),
        viewHead: document.getElementById("view-seal-head").textContent,
        says: document.getElementById("seal-says").textContent,
        buttons: document.querySelectorAll("#view-seal button").length,
        sealer: sealer ? [shown(sealer.querySelector(".seal")), sealer.querySelector(".note").textContent, [...sealer.querySelector(".state-icon").classList].filter((name) => name !== "state-icon" && name !== "state")] : null,
      };
    })()`);

  /** Shows a work item in the inbox's preview, by the keyboard's place on its line. */
  const preview = async ({ id, title }: WorkItem): Promise<void> => {
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector('#inbox-lines button[data-work-item="${String(id)}"]')`, `the line of ${title}`);
    await app.evaluate(`document.querySelector('#inbox-lines button[data-work-item="${String(id)}"]').focus()`);
    await app.until(`document.querySelector('#inbox-screen [data-part="preview-title"]')?.textContent === ${JSON.stringify(title)}`, `the preview of ${title}`);
  };

  /** The second work item, whose branch the next case seals and the one after it breaks, and the commit its seal names. */
  let gamma: WorkItem;
  let sealedAt: string;

  it("lights the seal where the seal holds at the branch's head, on the work item's line, in the preview and at the view's foot, each with the words Sealed at and the sealed commit, with no sentence of a chain and nothing to press at the foot, and marks the sealer's place finished", async () => {
    second.send({ type: "createWorkItem", requestId: 2, repo: made.repo, title: "Gamma", kind: "shell", cols: 80, rows: 24 });
    for (const deadline = Date.now() + 15_000; !second.item("Gamma") && Date.now() < deadline; ) await new Promise((resolve) => setTimeout(resolve, 50));
    gamma = await branched(second.item("Gamma")!, 12);
    sealedAt = commitSeal(gamma.worktree, { workItem: "1795396353-gamma", branch: branchOf(gamma), base: gamma.baseCommit! });
    for (const deadline = Date.now() + 20_000; second.item("Gamma")?.seal?.state !== "sealed" && Date.now() < deadline; ) await new Promise((resolve) => setTimeout(resolve, 100));
    expect(second.item("Gamma")?.seal).toEqual({ state: "sealed", commit: sealedAt, why: null });
    const words = `Sealed at ${sealedAt.slice(0, 7)}`;
    await preview(gamma);
    await app.until(`document.getElementById("inbox-preview-seal-words").textContent === ${JSON.stringify(words)}`, "the preview's words of the seal");
    await openView(gamma);
    await app.until(`document.getElementById("view-seal-head").textContent === ${JSON.stringify(words)}`, "the view's foot with the seal");
    expect(await sealsOf(gamma.id)).toEqual({
      line: ["sealed", words],
      preview: ["sealed", words],
      previewWords: words,
      view: ["sealed", words],
      viewHead: words,
      says: "",
      buttons: 0,
      sealer: [["sealed", words], "Sealed", ["finished"]],
    });
  });

  it("parts the seal in two once a commit lands after it, on the line, in the preview and at the view's foot, with the words Seal broken and the sealed commit: the line waits and says Seal broken in its second row, the window notifies of the broken seal, the foot says the seal's sentence under its head and holds nothing to press, and the sealer's place waits with the seal's sentence under the line", async () => {
    // The inbox is in front, so the person is not looking at the work item, and the window tells of the seal that broke.
    await preview(gamma);
    const line = `#inbox-lines button[data-work-item="${String(gamma.id)}"]`;
    commitFile(gamma.worktree, "after-the-seal.ts");
    await app.until(`document.querySelector('${line} .says')?.textContent === "Seal broken"`, "the broken seal in the line's second row", 20_000);
    expect(await app.evaluate(`document.querySelector('${line} .state-icon').classList.contains("waiting")`)).toBe(true);
    expect(await app.evaluate(`window.__notifications.filter((told) => told.body === "Seal broken").map((told) => told.title)`)).toEqual(["Gamma"]);
    const words = `Seal broken, sealed at ${sealedAt.slice(0, 7)}`;
    await openView(gamma);
    await app.until(`document.getElementById("view-seal-head").textContent === ${JSON.stringify(words)}`, "the view's foot with the broken seal", 20_000);
    const why = second.item("Gamma")?.seal?.why;
    expect(why).toBe(`\`after-the-seal.ts\` changed after the sealed commit \`${sealedAt.slice(0, 7)}\`.`);
    const inView = await sealsOf(gamma.id);
    expect([inView.view, inView.viewHead, inView.says, inView.buttons, inView.sealer]).toEqual([["broken", words], words, "", 0, [["broken", words], "Seal broken", ["waiting"]]]);
    // The seal's sentence stands under the head, in the foot.
    expect(await app.evaluate(`[document.getElementById("view-seal-head").nextElementSibling.id, document.getElementById("view-seal-why").textContent]`)).toEqual(["view-seal-why", why]);
    expect(await app.evaluate(`[...document.querySelectorAll("#view-detail section.approval .under")].map((under) => [under.className, under.textContent])`)).toEqual([["under", `Sealer: ${why}`]]);
    // The drawing is the seal's, parted by the page's two clips, under the theme's light that takes the red out.
    expect(
      await app.evaluate(`(() => {
        const place = document.querySelector("#view-seal .seal");
        const halves = ["::before", "::after"].map((half) => getComputedStyle(place, half));
        return [getComputedStyle(place).filter.includes("grayscale"), halves.map((half) => half.clipPath.startsWith("polygon(") && half.backgroundImage.includes("owl.svg")), halves[0].clipPath !== halves[1].clipPath];
      })()`),
    ).toEqual([true, [true, true], true]);
    await preview(gamma);
    await app.until(`document.getElementById("inbox-preview-seal-words").textContent === ${JSON.stringify(words)}`, "the preview's words of the broken seal");
    const inInbox = await sealsOf(gamma.id);
    expect([inInbox.line, inInbox.preview, inInbox.previewWords]).toEqual([["broken", words], ["broken", words], words]);
  });

  it("says at the view's foot the sentence of the chain the daemon holds for the work item, under the seal's words, and holds nothing to press there", async () => {
    const stored = second.item("Stored");
    expect(stored?.chain).toMatchObject({ state: "stopped", says: STORED_SAYS });
    await openView(stored!);
    await app.until(`document.getElementById("seal-says").textContent !== ""`, "the chain's sentence at the view's foot");
    const foot = await sealsOf(stored!.id);
    expect([foot.says, foot.buttons]).toEqual([STORED_SAYS, 0]);
    // The sentence stands in the foot, after the seal's words.
    expect(await app.evaluate(`(() => { const says = document.getElementById("seal-says"); return [document.getElementById("view-seal").contains(says), Boolean(document.getElementById("view-seal-head").compareDocumentPosition(says) & Node.DOCUMENT_POSITION_FOLLOWING)]; })()`)).toEqual([true, true]);
  });
});
