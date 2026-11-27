// A click on a notification in the built app. It starts the app once, in the
// background, on a temporary repository, where the page raises nothing of
// the system's and keeps each notification in `window.__notifications`
// (src/renderer/notifier.ts). A pane's state is changed by feeding the
// daemon's hook socket, and the click is the call of the handler the window
// gave the kept notification.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { ServerMessage, SessionInfo } from "../src/shared/protocol";
import { atRestAfterFailure, BuiltApp, buildApp, formPlanOf } from "./built-app";
import { RECEIVER } from "./korean-pane";
import { temporaryRepository } from "./repositories";

describe("a click on a notification in the built app", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;
  /** The daemon's id of Alpha's Claude Code pane. */
  let agentPane: number;

  const text = (id: string): Promise<string> => app.evaluate<string>(`document.getElementById(${JSON.stringify(id)}).textContent`);

  /** The sessions the daemon lists, read as a second client of it. */
  async function sessions(): Promise<SessionInfo[]> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    try {
      return await new Promise<SessionInfo[]>((resolve, reject) => {
        socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
        socket.addEventListener("error", () => reject(new Error("the daemon refused a second client")));
        socket.addEventListener("message", (event) => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          if (message.type === "ready") resolve(message.sessions);
        });
      });
    } finally {
      socket.close();
    }
  }

  /** Hands the daemon a hook's event for Alpha's Claude Code pane, as the hook's own command does: the pane's id on a line and the event's JSON after it, with the fields given, to the socket named from inside its folder. */
  function feed(hook: string, fields: Record<string, unknown> = {}): void {
    execFileSync("/usr/bin/nc", ["-U", "-w", "2", "hooks.sock"], { cwd: join(app.userData, "run"), input: `${agentPane}\n${JSON.stringify({ hook_event_name: hook, ...fields })}` });
  }

  /** Creates a work item through the form, with a first pane of `kind`, and waits for its view. */
  async function create(title: string, kind: string): Promise<void> {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    await app.evaluate(`document.getElementById("work-item-repo").select()`);
    await app.cdp("Input.insertText", { text: made.repo });
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: title });
    // The kind's menu is the system's own, which the debugging port does not reach, so the choice is set on the field.
    await app.evaluate(`document.getElementById("work-item-kind").value = ${JSON.stringify(kind)}`);
    // Create creates nothing before the form shows the plan of its folder. The press waits for the plan of the name typed (`built-app.ts#formPlanOf`).
    await app.until(formPlanOf(title), `the plan of the folder for ${title}`);
    await app.click("#work-item-create");
    try {
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`, `the view of ${title}`);
    } catch (error) {
      throw new Error(`${(error as Error).message}; the form says: ${(await text("work-item-error")) || "nothing"}`);
    }
  }

  /** The label of the tab marked as the one in front. */
  const activeTab = (): Promise<string | null> => app.evaluate<string | null>(`document.querySelector("#tabs .tab.active .label")?.textContent ?? null`);

  /** The notifications the page kept, as their titles and bodies. */
  const recorded = (): Promise<{ title: string; body: string }[]> => app.evaluate(`window.__notifications.map(({ title, body }) => ({ title, body }))`);

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The pane's process is the receiver, so no shell of the person's and no agent starts.
    app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: made.root, OWLERY_RECEIVER_FILE: join(made.base, "received") });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    // A stand-in that counts its constructions takes the place of the page's `Notification` before any pane starts. It keeps nothing a case reads as a notification, and a notification the page handed the system's would be counted in place of reaching the system.
    await app.evaluate(`(() => {
      window.__constructed = 0;
      window.Notification = class {
        static permission = "granted";
        constructor() {
          window.__constructed += 1;
        }
      };
    })()`);
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");

    await create("Alpha", "claude");
    const agent = (await sessions()).find((session) => session.kind === "claude");
    if (!agent) throw new Error("the daemon lists no Claude Code pane");
    agentPane = agent.id;
    // The pane's first event ends its silent start, after which the daemon would list it as waiting by itself. The pane is in front of a focused window here, so its state changes without a notification.
    feed("UserPromptSubmit");
    await app.until(`document.getElementById("strip-state").classList.contains("working")`, "Alpha as working");
    // A second pane, started after the agent's, so it is the one in front of Alpha's view.
    await app.evaluate(`[...document.querySelectorAll("#pane-buttons button")].find((button) => button.textContent === "+ Shell").click()`);
    await app.until(`document.querySelector("#tabs .tab.active .label")?.textContent === "Shell"`, "the shell pane in front of Alpha's view");
    await create("Beta", "shell");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  // The cases share one app, so a dialog or a menu a failed case leaves open would keep every later case from opening one.
  afterEach(atRestAfterFailure(() => app));

  it("raises nothing of the system's in the background, and a click on the notification the page kept opens the view of the work item that waits, with the pane that waits in front, from the view of another work item", async () => {
    expect(await recorded()).toEqual([]);
    feed("PermissionRequest");
    await app.until(`window.__notifications.length === 1`, "a notification");
    expect(await recorded()).toEqual([{ title: "Alpha", body: "Needs you" }]);
    expect(await app.evaluate<number>(`window.__constructed`)).toBe(0);

    await app.evaluate(`window.__notifications[0].onclick()`);
    expect(await text("view-title")).toBe("Alpha");
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-view").hidden`)).toBe(false);
    // The shell pane was the last in front of Alpha's view, and the click puts the pane that waits there.
    expect(await activeTab()).toBe("Claude Code");
    // The app was started in the background, so the main process brings nothing forward.
    expect(await app.evaluate<boolean>(`window.owlery.comeForward()`)).toBe(false);
  });

  it("opens the view from the inbox screen behind the open form, and leaves the form with what it holds", async () => {
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden`, "the inbox screen");
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Gamma" });

    feed("Stop");
    await app.until(`window.__notifications.length === 2`, "a second notification");
    expect((await recorded())[1]).toEqual({ title: "Alpha", body: "Finished" });

    await app.evaluate(`window.__notifications[1].onclick()`);
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-view").hidden`)).toBe(false);
    expect(await app.evaluate<boolean>(`document.getElementById("inbox-screen").hidden`)).toBe(true);
    expect(await text("view-title")).toBe("Alpha");
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-dialog").open`)).toBe(true);
    expect(await app.evaluate<string>(`document.getElementById("work-item-title").value`)).toBe("Gamma");
    expect(await app.evaluate<string>(`document.getElementById("work-item-repo").value`)).toBe(made.repo);
  });

  it("says on the bell how many work items need the person, to a pointer and to a screen reader alike", async () => {
    /** What the bell says to a pointer, to a screen reader, and as its count. */
    const bell = (): Promise<{ title: string; name: string | null; count: string | null }> =>
      app.evaluate(`(() => { const bell = document.getElementById("bell"); return { title: bell.title, name: bell.getAttribute("aria-label"), count: document.getElementById("bell-count").textContent }; })()`);
    // Alpha's agent has finished, so no work item needs the person.
    expect(await bell()).toEqual({ title: "Show the work items that need you alone.", name: "Show the work items that need you alone.", count: "" });
    feed("PermissionRequest");
    await app.until(`document.getElementById("bell").classList.contains("ringing")`, "the bell ringing");
    expect(await bell()).toEqual({ title: "1 needs you. Show them alone.", name: "1 needs you. Show them alone.", count: "1" });
  });

  it("says the question an agent asks and its choices on the inbox's line, and lists the choices in the preview's card and in the view's, with the words under a question that takes more than one, and no button and no field", async () => {
    // The form the second case left open is closed, so the screens behind it take the clicks.
    await app.evaluate(`document.getElementById("work-item-dialog").close()`);
    const alpha = (await sessions()).find((session) => session.id === agentPane)?.workItemId;
    if (alpha === undefined || alpha === null) throw new Error("the daemon lists Alpha's pane with no work item");
    // The agent works again, and then calls its question tool with two questions, the second of which takes more than one choice. The hook hands the call over before the person answers.
    feed("UserPromptSubmit");
    feed("PreToolUse", {
      tool_name: "AskUserQuestion",
      tool_input: {
        questions: [
          {
            question: "Which library formats the dates?",
            header: "Dates",
            multiSelect: false,
            options: [
              { label: "date-fns", description: "Small functions, one import each." },
              { label: "dayjs", description: "One object, with plugins." },
            ],
          },
          {
            question: "Which checks run before a commit?",
            header: "Checks",
            multiSelect: true,
            options: [
              { label: "Lint", description: "" },
              { label: "Types", description: "tsc --noEmit" },
            ],
          },
        ],
      },
    });
    await app.click("#nav-inbox");
    const line = `#inbox-screen button.line[data-work-item="${alpha}"]`;
    await app.until(`document.querySelector(${JSON.stringify(`${line} .second .says`)})?.textContent === "Which library formats the dates? date-fns · dayjs (and 1 more question)"`, "Alpha's line saying the question and its choices");
    // The line stands in the group of the work items that need the person.
    expect(await app.evaluate<string | null>(`document.querySelector(${JSON.stringify(line)}).closest("ul").previousElementSibling?.querySelector(".word")?.textContent ?? null`)).toBe("Needs you");

    /** The card of what the agent says, under `selector`: its head, its questions, the words under each question or null where it has none, the label and what each choice leads to, how many numbered lists it holds, and how many buttons and fields. */
    const card = (selector: string) =>
      app.evaluate<{ head: string; waiting: boolean; asks: string[]; notes: (string | null)[]; choices: [string, string][]; lists: number; controls: number } | null>(`(() => {
        const card = document.querySelector(${JSON.stringify(selector)});
        if (!card) return null;
        return {
          head: card.querySelector("h3").textContent,
          waiting: card.classList.contains("waiting"),
          asks: [...card.querySelectorAll(".asks")].map((asks) => asks.textContent),
          notes: [...card.querySelectorAll(".asked")].map((asked) => asked.querySelector(".hint")?.textContent ?? null),
          choices: [...card.querySelectorAll("ol > li")].map((choice) => [choice.querySelector(".label").textContent, choice.querySelector(".implies").textContent]),
          lists: card.querySelectorAll("ol").length,
          controls: card.querySelectorAll("button, input, textarea, select").length,
        };
      })()`);
    const drawn = {
      head: "Claude Code asks",
      waiting: true,
      asks: ["Which library formats the dates?", "Which checks run before a commit?"],
      notes: [null, "More than one may be chosen."],
      choices: [["date-fns", "Small functions, one import each."], ["dayjs", "One object, with plugins."], ["Lint", ""], ["Types", "tsc --noEmit"]],
      lists: 2,
      controls: 0,
    };
    // The keyboard's place on a line selects it, and the preview shows the selected line.
    await app.evaluate(`document.querySelector(${JSON.stringify(line)}).focus()`);
    await app.until(`document.querySelector('#inbox-screen [data-part="preview-title"]')?.textContent === "Alpha"`, "Alpha's preview");
    expect(await card(`#inbox-screen [data-part="preview-detail"] .says`)).toEqual(drawn);

    await app.click(line);
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha");
    expect(await card("#view-detail .says")).toEqual(drawn);
  });

  it("reads the lists again at a press of the refresh button, works until the answer, and keeps the view in front, its pane in front and the filter", async () => {
    const REST = "Read the work items again from git and GitHub.";
    /** The filter's value, and what its control says to a pointer. */
    const filter = (): Promise<[string, string]> => app.evaluate(`[document.getElementById("sidebar-filter").value, document.getElementById("sidebar-filter-control").title]`);
    // The case before left Alpha's view in front. A state is chosen in the filter, as a person chooses it.
    await app.evaluate(`(() => { const filter = document.getElementById("sidebar-filter"); filter.value = "waiting"; filter.dispatchEvent(new Event("change")); })()`);
    const before = { title: await text("view-title"), tab: await activeTab(), filter: await filter() };
    expect(before.title).toBe("Alpha");
    expect(before.filter).toEqual(["waiting", "Showing: Needs you"]);
    expect(await app.evaluate(`(() => { const button = document.getElementById("refresh-lists"); return [button.title, button.getAttribute("aria-label"), button.getAttribute("aria-busy")]; })()`)).toEqual([REST, REST, null]);
    // Each section of the sidebar as it stands is marked, and each form the button takes is recorded as it changes.
    await app.evaluate(`(() => {
      for (const section of document.querySelectorAll("#repositories section")) section.__before = true;
      const button = document.getElementById("refresh-lists");
      window.__refresh = [];
      new MutationObserver(() => window.__refresh.push([button.getAttribute("aria-busy"), button.title, button.getAttribute("aria-label")])).observe(button, { attributes: true, attributeFilter: ["aria-busy"] });
    })()`);

    await app.click("#refresh-lists");
    await app.until(`window.__refresh.length === 2`, "the refresh button working and then at rest");
    expect(await app.evaluate(`window.__refresh`)).toEqual([
      ["true", "Reading the work items again…", "Reading the work items again…"],
      [null, REST, REST],
    ]);
    // The answer's `inbox` drew the sidebar again before its `done` ended the work.
    expect(await app.evaluate(`(() => { const sections = [...document.querySelectorAll("#repositories section")]; return [sections.length > 0, sections.some((section) => section.__before === true)]; })()`)).toEqual([true, false]);
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-view").hidden`)).toBe(false);
    expect({ title: await text("view-title"), tab: await activeTab(), filter: await filter() }).toEqual(before);
    expect(await text("status")).not.toContain("did not answer");

    // The filter shows every work item again for the case after.
    await app.evaluate(`(() => { const filter = document.getElementById("sidebar-filter"); filter.value = "all"; filter.dispatchEvent(new Event("change")); })()`);
  });

  it("tells a page loaded again that the app started in the background, so that page keeps its notifications too and raises nothing of the system's", async () => {
    // The counting stand-in ends with its document, so the new document gets its own before its first script runs. The debugging port runs such a script only once its Page domain is on.
    await app.cdp("Page.enable");
    await app.cdp("Page.addScriptToEvaluateOnNewDocument", { source: `window.__constructed = 0; window.Notification = class { static permission = "granted"; constructor() { window.__constructed += 1; } };` });
    await app.evaluate(`window.__beforeReload = true`);
    await app.cdp("Page.reload");
    await app.until(`window.__beforeReload === undefined && ["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front of the page loaded again");
    expect(await app.evaluate(`[window.owlery.background, Array.isArray(window.__notifications), window.__notifications?.length]`)).toEqual([true, true, 0]);

    // Alpha's agent works, and then waits for the person while the inbox is in front, which raises a notification in the page loaded again.
    const alpha = (await sessions()).find((session) => session.id === agentPane)?.workItemId;
    if (alpha === undefined || alpha === null) throw new Error("the daemon lists Alpha's pane with no work item");
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden`, "the inbox screen");
    const icon = JSON.stringify(`#inbox-screen button.line[data-work-item="${alpha}"] .state-icon`);
    feed("UserPromptSubmit");
    await app.until(`document.querySelector(${icon})?.classList.contains("working")`, "Alpha as working");
    feed("PermissionRequest");
    await app.until(`window.__notifications.length === 1`, "a notification of the page loaded again");
    expect(await recorded()).toEqual([{ title: "Alpha", body: "Needs you" }]);
    expect(await app.evaluate<number>(`window.__constructed`)).toBe(0);
  });
});
