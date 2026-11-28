// The approval line in the built app. It starts the app once, in the
// background, on a temporary repository that holds the place for work
// records. The login shell is a script that names a script CLI, so no real
// `claude` runs, and nothing in the window starts a chain. A second client of
// the daemon makes a work item with a shell's pane. In its worktree the file
// commits a file and writes the records a stage would write there: the
// routing that names the branch, and two round records. The daemon reads
// them at its next pass, and the view's right column and the inbox's preview
// draw the line. A second work item, made by a later case, has the records of
// an inspection committed on its branch as a chain commits them, and then one more
// commit, which lapses that inspection. One more work item stands in the run folder
// before the app starts, with a chain a daemon stored as stopped, so the
// view's foot has a chain's sentence to say. The last case makes one more
// work item, whose branch commits Owlery's workflow, and opens a Claude Code
// pane in it, which carries the owl chain: the login shell, asked for that
// pane's command, stands in for its session, runs the built chain command's
// `start` and `owed` with the pane's variables, which hand round 1, and stays
// until the pane is closed.
// In the background the page raises nothing of the system's and keeps each
// notification in `window.__notifications` (src/renderer/notifier.ts), which
// the cases read.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER, workflowText } from "../src/daemon/records-place";
import { APPEARANCES, THEMES } from "../src/shared/appearance";
import type { ClientMessage, ServerMessage, SessionInfo, WorkItem } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
import { commitInspection } from "./chain-run";
import { branchOf, commitFile, git, temporaryRepository } from "./repositories";

/** What a place of the line shows, as a person and a screen reader read it. */
interface Shown {
  role: string;
  mark: string[];
  name: string;
  note: string;
  label: string;
  inspection: string | null;
}

/** The places the line holds once the daemon has read the records: the crafter's and the proofer's finished, the framer's and the inspector's not started, and the inspection's place in the inspector's. */
const EXPECTED: Shown[] = [
  { role: "framer", mark: ["no-agent"], name: "Framer", note: "Not started", label: "Framer: Not started", inspection: null },
  { role: "crafter", mark: ["finished"], name: "Crafter", note: "1 commit", label: "Crafter: 1 commit", inspection: null },
  { role: "proofer", mark: ["finished"], name: "Proofer", note: "2 rounds", label: "Proofer: 2 rounds", inspection: null },
  { role: "inspector", mark: ["no-agent"], name: "Inspector", note: "Not started", label: "Inspector: Not started", inspection: "none" },
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
  /** The second client of the daemon: a work item of a title as the daemon last listed it, the pane the daemon started at a request, and a message it sends. */
  let second: { item(title: string): WorkItem | undefined; started(requestId: number): SessionInfo | undefined; send(message: ClientMessage): void; close(): void };
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
      `[...document.querySelectorAll(${JSON.stringify(`${within} section.approval`)})].map((section) => ({ head: section.querySelector("h3").textContent, places: [...section.querySelectorAll(".place")].map((place) => { const mark = place.querySelector(".state-icon"); return { role: place.dataset.role, mark: [...mark.classList].filter((name) => name !== "state-icon" && name !== "state"), name: place.querySelector(".name").textContent, note: place.querySelector(".note").textContent, label: mark.getAttribute("aria-label"), inspection: place.querySelector(".mark")?.dataset.inspection ?? null }; }) }))`,
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

  /** Opens a work item's view by one click on its line of the sidebar. */
  const openView = async ({ id, title }: WorkItem): Promise<void> => {
    await app.click(`#repositories button[data-work-item="${id}"]`);
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`, `the view of ${title}`);
  };

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The place for work records stands on the branch the work items are cut from.
    mkdirSync(join(made.repo, "agentory"));
    writeFileSync(join(made.repo, "agentory", "README.md"), `${MARKER}\n`);
    writeFileSync(join(made.repo, "agentory", "config.json"), '{ "Broad gate": "true" }\n');
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: add the place for work records");
    // The daemon runs the CLI at its start, to read its version: that run prints one and is no session, and no case of this file starts one.
    const cli = script("cli", `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\nexit 1`);
    // The login shell: it names the stand-in, and a shell's pane it starts ends at once. Asked for a Claude Code pane's command, it stands in for the pane's session: it runs the chain command the pane's environment names, against the base the last case writes, notes what each call printed, and stays.
    const said = (name: string): string => `> '${join(made.base, name)}' 2>&1`;
    const base = `--base "$(cat '${join(made.base, "stand-in-base")}')"`;
    const session = `if [ "$3" = -c ] && [ "\${4#exec claude }" != "$4" ]; then "$OWLERY_CHAIN" start --automation yes ${base} ${said("stand-in-start")}; "$OWLERY_CHAIN" owed ${base} ${said("stand-in-owed")}; exec sleep 600; fi`;
    const shell = script("shell", `${session}\nprintf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '${cli}' '/usr/bin:/bin' "\${CLAUDE_CONFIG_DIR:-}"`);
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
      started: (requestId) => messages.flatMap((message) => (message.type === "started" && message.requestId === requestId ? [message.session] : [])).at(0),
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
    const directory = join(workItem.worktree, "agentory", "threads", "1-alpha");
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

  it('draws one section headed "Approval line" in the view\'s right column and in the inbox\'s preview, with the four places in order, each with its mark, its name and its note, and the inspection\'s place in the inspector\'s', async () => {
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

  /** The inspection's place where the window shows the work item's inspection, each as its form and its words, or null where it is not drawn: the line of the inbox, the preview and the words beside it, the view's foot with the words at its head, the chain's sentence and how many buttons it holds, and the inspector's place of the view's approval line with its note. */
  const inspectionsOf = (id: number): Promise<Record<string, unknown>> =>
    app.evaluate(`(() => {
      const shown = (place) => (place ? [place.dataset.inspection, place.getAttribute("aria-label")] : null);
      const inspector = document.querySelector('#view-detail section.approval .place[data-role="inspector"]');
      return {
        line: shown(document.querySelector('#inbox-lines button[data-work-item="${String(id)}"] .mark')),
        preview: shown(document.querySelector("#inbox-screen .mark-slot .mark")),
        previewWords: document.getElementById("inbox-preview-mark-words").textContent,
        view: shown(document.querySelector("#view-inspection .mark")),
        viewHead: document.getElementById("view-inspection-head").textContent,
        says: document.getElementById("inspection-says").textContent,
        buttons: document.querySelectorAll("#view-inspection button").length,
        inspector: inspector ? [shown(inspector.querySelector(".mark")), inspector.querySelector(".note").textContent, [...inspector.querySelector(".state-icon").classList].filter((name) => name !== "state-icon" && name !== "state")] : null,
      };
    })()`);

  /** Shows a work item in the inbox's preview, by the keyboard's place on its line. */
  const preview = async ({ id, title }: WorkItem): Promise<void> => {
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector('#inbox-lines button[data-work-item="${String(id)}"]')`, `the line of ${title}`);
    await app.evaluate(`document.querySelector('#inbox-lines button[data-work-item="${String(id)}"]').focus()`);
    await app.until(`document.querySelector('#inbox-screen [data-part="preview-title"]')?.textContent === ${JSON.stringify(title)}`, `the preview of ${title}`);
  };

  /** The second work item, whose branch the next case clears and the one after it lapses, and the commit its inspection names. */
  let gamma: WorkItem;
  let clearedAt: string;

  it("lights the inspection where the inspection holds at the branch's head, on the work item's line, in the preview and at the view's foot, each with the words Cleared at and the cleared commit, with no sentence of a chain and nothing to press at the foot, and marks the inspector's place finished", async () => {
    second.send({ type: "createWorkItem", requestId: 2, repo: made.repo, title: "Gamma", kind: "shell", cols: 80, rows: 24 });
    for (const deadline = Date.now() + 15_000; !second.item("Gamma") && Date.now() < deadline; ) await new Promise((resolve) => setTimeout(resolve, 50));
    gamma = await branched(second.item("Gamma")!, 12);
    clearedAt = commitInspection(gamma.worktree, { workItem: "1795396353-gamma", branch: branchOf(gamma), base: gamma.baseCommit! });
    for (const deadline = Date.now() + 20_000; second.item("Gamma")?.inspection?.state !== "cleared" && Date.now() < deadline; ) await new Promise((resolve) => setTimeout(resolve, 100));
    expect(second.item("Gamma")?.inspection).toEqual({ state: "cleared", commit: clearedAt, why: null });
    const words = `Cleared at ${clearedAt.slice(0, 7)}`;
    await preview(gamma);
    await app.until(`document.getElementById("inbox-preview-mark-words").textContent === ${JSON.stringify(words)}`, "the preview's words of the inspection");
    await openView(gamma);
    await app.until(`document.getElementById("view-inspection-head").textContent === ${JSON.stringify(words)}`, "the view's foot with the inspection");
    expect(await inspectionsOf(gamma.id)).toEqual({
      line: ["cleared", words],
      preview: ["cleared", words],
      previewWords: words,
      view: ["cleared", words],
      viewHead: words,
      says: "",
      buttons: 0,
      inspector: [["cleared", words], "Cleared", ["finished"]],
    });
  });

  it("parts the inspection in two once a commit lands after it, on the line, in the preview and at the view's foot, with the words Inspection lapsed and the cleared commit: the line waits and says Inspection lapsed in its second row, the window notifies of the lapsed inspection, the foot says the inspection's sentence under its head and holds nothing to press, and the inspector's place waits with the inspection's sentence under the line", async () => {
    // The inbox is in front, so the person is not looking at the work item, and the window tells of the inspection that lapsed.
    await preview(gamma);
    const line = `#inbox-lines button[data-work-item="${String(gamma.id)}"]`;
    commitFile(gamma.worktree, "after-the-inspection.ts");
    await app.until(`document.querySelector('${line} .says')?.textContent === "Inspection lapsed"`, "the lapsed inspection in the line's second row", 20_000);
    expect(await app.evaluate(`document.querySelector('${line} .state-icon').classList.contains("waiting")`)).toBe(true);
    expect(await app.evaluate(`window.__notifications.filter((told) => told.body === "Inspection lapsed").map((told) => told.title)`)).toEqual(["Gamma"]);
    const words = `Inspection lapsed, cleared at ${clearedAt.slice(0, 7)}`;
    await openView(gamma);
    await app.until(`document.getElementById("view-inspection-head").textContent === ${JSON.stringify(words)}`, "the view's foot with the lapsed inspection", 20_000);
    const why = second.item("Gamma")?.inspection?.why;
    expect(why).toBe(`\`after-the-inspection.ts\` changed after the cleared commit \`${clearedAt.slice(0, 7)}\`.`);
    const inView = await inspectionsOf(gamma.id);
    expect([inView.view, inView.viewHead, inView.says, inView.buttons, inView.inspector]).toEqual([["lapsed", words], words, "", 0, [["lapsed", words], "Inspection lapsed", ["waiting"]]]);
    // "Inspection lapsed" is wider than the inspector's place, so it breaks between its words, and the section and each place stay within the view's right column.
    expect((await overflows("view")).over).toEqual([]);
    // The inspection's sentence stands under the head, in the foot.
    expect(await app.evaluate(`[document.getElementById("view-inspection-head").nextElementSibling.id, document.getElementById("view-inspection-why").textContent]`)).toEqual(["view-inspection-why", why]);
    expect(await app.evaluate(`[...document.querySelectorAll("#view-detail section.approval .under")].map((under) => [under.className, under.textContent])`)).toEqual([["under", `Inspector: ${why}`]]);
    // The drawing is the inspection's, parted by the page's two clips, under the theme's light that takes the red out.
    expect(
      await app.evaluate(`(() => {
        const place = document.querySelector("#view-inspection .mark");
        const halves = ["::before", "::after"].map((half) => getComputedStyle(place, half));
        return [getComputedStyle(place).filter.includes("grayscale"), halves.map((half) => half.clipPath.startsWith("polygon(") && half.backgroundImage.includes("owl.svg")), halves[0].clipPath !== halves[1].clipPath];
      })()`),
    ).toEqual([true, [true, true], true]);
    await preview(gamma);
    await app.until(`document.getElementById("inbox-preview-mark-words").textContent === ${JSON.stringify(words)}`, "the preview's words of the lapsed inspection");
    const inInbox = await inspectionsOf(gamma.id);
    expect([inInbox.line, inInbox.preview, inInbox.previewWords]).toEqual([["lapsed", words], ["lapsed", words], words]);
  });

  it("says at the view's foot the sentence of the chain the daemon holds for the work item, under the inspection's words, and holds nothing to press there", async () => {
    const stored = second.item("Stored");
    expect(stored?.chain).toMatchObject({ state: "stopped", says: STORED_SAYS });
    await openView(stored!);
    await app.until(`document.getElementById("inspection-says").textContent !== ""`, "the chain's sentence at the view's foot");
    const foot = await inspectionsOf(stored!.id);
    expect([foot.says, foot.buttons]).toEqual([STORED_SAYS, 0]);
    // The sentence stands in the foot, after the inspection's words.
    expect(await app.evaluate(`(() => { const says = document.getElementById("inspection-says"); return [document.getElementById("view-inspection").contains(says), Boolean(document.getElementById("view-inspection-head").compareDocumentPosition(says) & Node.DOCUMENT_POSITION_FOLLOWING)]; })()`)).toEqual([true, true]);
  });

  it('holds no "Ask" section in the view, and no list above the inspection\'s place where the daemon lists no session of the work item and its chain holds no gate\'s run: the list of the daemon\'s chain stands between the column\'s text and the inspection\'s place, hidden and taking no height', async () => {
    // The stored work item's chain holds no stage, and the daemon started no session for it.
    const stored = second.item("Stored")!;
    await openView(stored);
    await app.until(`document.getElementById("inspection-says").textContent !== ""`, "the stored work item's view");
    expect(
      await app.evaluate(`(() => {
        const list = document.getElementById("view-chain");
        return {
          section: ["ask", "ask-form", "ask-prompt", "ask-account", "ask-submit"].filter((id) => document.getElementById(id) !== null),
          heading: [...document.querySelectorAll("#view-facts h2")].filter((head) => head.textContent === "Ask").length,
          list: [list.tagName, list.getAttribute("aria-label"), list.hidden, list.childElementCount, list.getBoundingClientRect().height],
          around: [list.previousElementSibling.id, list.nextElementSibling.id],
        };
      })()`),
    ).toEqual({ section: [], heading: 0, list: ["UL", "The daemon's chain", true, 0, 0], around: ["view-scroll", "view-inspection"] });
  });

  it("marks the proofer's place working with the note Round 1 and the stage's age while a Claude Code pane's session holds round 1 open through the built chain command, and leaves the place to the records once the pane is closed", async () => {
    second.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Delta", kind: "shell", cols: 80, rows: 24 });
    for (const deadline = Date.now() + 15_000; !second.item("Delta") && Date.now() < deadline; ) await new Promise((resolve) => setTimeout(resolve, 50));
    const delta = await branched(second.item("Delta")!, 13);
    // The branch puts the repository on the owl chain, with Owlery's workflow, so a Claude Code pane opened in its worktree carries the chain.
    mkdirSync(join(delta.worktree, ".github", "workflows"), { recursive: true });
    writeFileSync(join(delta.worktree, ".github", "workflows", "owlery-inspection.yml"), workflowText("0.0.0"));
    git(delta.worktree, "add", "--all");
    git(delta.worktree, "commit", "--quiet", "-m", "ci: the check");
    writeFileSync(join(made.base, "stand-in-base"), delta.baseCommit!);
    // The pane's session runs `start` and `owed` through the launcher its environment names, and stays: round 1 is open.
    second.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 14, workItemId: delta.id });
    for (const deadline = Date.now() + 20_000; second.item("Delta")?.paneStage?.kind !== "round" && Date.now() < deadline; ) await new Promise((resolve) => setTimeout(resolve, 100));
    const stood = (name: string): string => (existsSync(join(made.base, name)) ? readFileSync(join(made.base, name), "utf8") : "nothing");
    expect(second.item("Delta")?.paneStage, `the stand-in's start printed ${stood("stand-in-start")} and its owed ${stood("stand-in-owed")}`).toMatchObject({ kind: "round", round: 1 });
    expect(JSON.parse(stood("stand-in-owed").split("\n")[0] ?? "")).toMatchObject({ step: "round", round: 1 });
    const proofer = `document.querySelector('#view-detail section.approval .place[data-role="proofer"]')`;
    const place = `(() => { const place = ${proofer}; const mark = place.querySelector(".state-icon"); return [[...mark.classList].filter((name) => name !== "state-icon" && name !== "state"), place.querySelector(".note").textContent, mark.getAttribute("aria-label")]; })()`;
    await openView(second.item("Delta")!);
    await app.until(`${proofer}?.querySelector(".note").textContent === "Round 1"`, "the proofer's place at work on round 1", 20_000);
    expect(await app.evaluate(place)).toEqual([["working"], "Round 1", "Proofer: Round 1, less than a minute"]);
    // The pane is closed: the daemon drops its stage, and the records, which hold no round, say the place.
    const pane = second.started(14);
    expect(pane?.workItemId).toBe(delta.id);
    second.send({ type: "close", id: pane!.id });
    await app.until(`${proofer}?.querySelector(".note").textContent === "Not started"`, "the proofer's place as the records say", 20_000);
    expect(await app.evaluate(place)).toEqual([["no-agent"], "Not started", "Proofer: Not started"]);
    expect(second.item("Delta")?.paneStage).toBeNull();
  });
});
