// A click on a notification in the built app. It starts the app once, in the
// background, on a temporary repository, with the page's `Notification`
// replaced by a recorder, so nothing reaches the system's notifications. A
// pane's state is changed by feeding the daemon's hook socket, and the click
// is the call of the handler the window gave the recorded notification.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ServerMessage, SessionInfo } from "../src/shared/protocol";
import { BuiltApp, buildApp } from "./built-app";
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

  /** Hands the daemon a hook's event for Alpha's Claude Code pane, as the hook's own command does: the pane's id on a line and the event's JSON after it, to the socket named from inside its folder. */
  function feed(hook: string): void {
    execFileSync("/usr/bin/nc", ["-U", "-w", "2", "hooks.sock"], { cwd: join(app.userData, "run"), input: `${agentPane}\n${JSON.stringify({ hook_event_name: hook })}` });
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
    // Create creates nothing before the form shows the plan of its folder.
    await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the folder");
    await app.click("#work-item-create");
    try {
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(title)}`, `the view of ${title}`);
    } catch (error) {
      throw new Error(`${(error as Error).message}; the form says: ${(await text("work-item-error")) || "nothing"}`);
    }
  }

  /** The label of the tab marked as the one in front. */
  const activeTab = (): Promise<string | null> => app.evaluate<string | null>(`document.querySelector("#tabs .tab.active .label")?.textContent ?? null`);

  /** The recorded notifications, as their titles and bodies. */
  const recorded = (): Promise<{ title: string; body: string }[]> => app.evaluate(`window.__notifications.map(({ title, body }) => ({ title, body }))`);

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The pane's process is the receiver, so no shell of the person's and no agent starts.
    app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: made.root, OWLERY_RECEIVER_FILE: join(made.base, "received") });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    // The recorder stands before any pane starts, so no notification of this run reaches the system.
    await app.evaluate(`(() => {
      window.__notifications = [];
      window.Notification = class {
        static permission = "granted";
        constructor(title, options) {
          this.title = title;
          this.body = options?.body;
          this.onclick = null;
          window.__notifications.push(this);
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

  it("opens the view of the work item that waits, with the pane that waits in front, from the view of another work item", async () => {
    expect(await recorded()).toEqual([]);
    feed("PermissionRequest");
    await app.until(`window.__notifications.length === 1`, "a notification");
    expect(await recorded()).toEqual([{ title: "Alpha", body: "Waiting for you" }]);

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
});
