// "Get a seal" at the foot of a work item's view in the built app. It starts
// the app once, in the background, on a temporary repository that holds the
// place for work records. The login shell is a script that names a script
// CLI, so no real `claude` runs: the stand-in writes its process id and
// sleeps, so the round it is launched for runs until a second client of the
// daemon stops its session. The page's `Notification` is replaced by a
// recorder, so nothing reaches the system's notifications.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARKER } from "../src/daemon/records-place";
import type { ClientMessage, ServerMessage, WorkItem } from "../src/shared/protocol";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
import { commitFile, git, temporaryRepository } from "./repositories";

describe('"Get a seal" in the built app', { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;

  function script(name: string, body: string): string {
    const path = join(made.base, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
    return path;
  }

  /** The foot of the view, as a person reads it: the button, the chain's sentence above it and the refusal under it. */
  const foot = (): Promise<{ button: string; hidden: boolean; disabled: boolean; says: string; refusal: string }> =>
    app.evaluate(`(() => { const b = document.getElementById("get-seal"); return { button: b.textContent, hidden: b.hidden, disabled: b.disabled, says: document.getElementById("seal-says").textContent, refusal: document.getElementById("seal-refusal").textContent }; })()`);

  /** A second client of the daemon: the work item Alpha as the daemon last listed it, and a message it sends. */
  async function client(): Promise<{ alpha(): WorkItem; send(message: ClientMessage): void; close(): void }> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    const messages: ServerMessage[] = [];
    await new Promise<void>((resolve) => {
      socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        messages.push(message);
        if (message.type === "ready") resolve();
      });
    });
    return {
      alpha: () => messages.flatMap((m) => (m.type === "ready" || m.type === "inbox" ? m.workItems : [])).filter((item) => item.title === "Alpha").at(-1)!,
      send: (message) => socket.send(JSON.stringify(message)),
      close: () => socket.close(),
    };
  }

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    // The place for work records stands on the branch the work item is cut from.
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
    git(made.repo, "add", "--all");
    git(made.repo, "commit", "--quiet", "-m", "chore: add the place for work records");
    // The daemon also runs the CLI at its start, to read its version: that run prints one and is no session.
    const cli = script("cli", `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\necho $$ > '${join(made.base, "cli-pid")}'\nexec sleep 60`);
    // The login shell: it names the stand-in, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root });
    // The recorder stands before any chain starts, so no notification of this run reaches the system.
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
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    await app.evaluate(`document.getElementById("work-item-repo").select()`);
    await app.cdp("Input.insertText", { text: made.repo });
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Alpha" });
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    // Create creates nothing before the form shows the plan of its folder.
    await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the folder");
    await app.click("#work-item-create");
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("shows the daemon's refusal under the button, is disabled with the chain's sentence above it while the round runs, lists the round's session with its stop control, and once the round's session is stopped notifies of the chain, gives the line the state waiting and the chain's sentence in its second row, and has the button on again, as it is after a second press whose round is stopped with the view in front", async () => {
    const start = "Start the review rounds on Alpha";
    expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: false, says: "", refusal: "" });
    expect(await app.evaluate(`[document.getElementById("get-seal").title, document.getElementById("get-seal").classList.contains("primary"), document.getElementById("view-seal").contains(document.getElementById("get-seal"))]`)).toEqual([start, true, true]);

    // The branch holds no commit yet, so the daemon refuses the start, and the button can be pressed again.
    const nothing = "The branch holds no commit after its base, so a round has nothing to read.";
    await app.click("#get-seal");
    await app.until(`document.getElementById("seal-refusal").textContent !== ""`, "the refusal under the button");
    expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: false, says: "", refusal: nothing });

    const second = await client();
    try {
      const workItem = second.alpha();
      commitFile(workItem.worktree, "feature.txt");
      await app.click("#get-seal");
      const running = "Review round 1 is running.";
      await app.until(`document.getElementById("seal-says").textContent === ${JSON.stringify(running)}`, "the sentence of the running round", 20_000);
      expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: true, says: running, refusal: "" });
      expect(await app.evaluate(`document.getElementById("get-seal").title`)).toBe("The chain is running.");

      // The round's session stands in the "Ask" section as every headless session does, with "Stop".
      await app.until(`document.querySelector("#headless li .state.working")`, "the round's session as working");
      expect(await app.evaluate(`[...document.querySelectorAll("#headless li")].map((li) => [...li.querySelectorAll("button")].map((b) => b.textContent))`)).toEqual([["Stop"]]);
      const pidFile = join(made.base, "cli-pid");
      const deadline = Date.now() + 10_000;
      while (!existsSync(pidFile) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      const pid = Number(readFileSync(pidFile, "utf8").trim());
      expect(alive(pid)).toBe(true);

      // While the round runs the line is among those at work, and nothing was notified.
      const line = `#inbox-lines button[data-work-item="${workItem.id}"]`;
      await app.click("#nav-inbox");
      await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelector('${line}')`, "the inbox screen");
      expect(await app.evaluate(`document.querySelector('${line} .state-icon').classList.contains("working")`)).toBe(true);
      expect(await app.evaluate(`window.__notifications.length`)).toBe(0);

      // The session is stopped while the inbox is in front, so the person is not looking at the work item.
      const stage = second.alpha().chain?.stages.at(-1);
      expect([stage?.kind, stage?.round, stage?.state]).toEqual(["round", 1, "working"]);
      second.send({ type: "stopHeadless", requestId: 1, id: stage!.headlessId! });
      const stopped = "Review round 1 failed: the session was stopped at a request before it finished.";
      await app.until(`document.querySelector('${line} .says')?.textContent === ${JSON.stringify(stopped)}`, "the chain's sentence in the line's second row", 20_000);
      expect(await app.evaluate(`document.querySelector('${line} .state-icon').classList.contains("waiting")`)).toBe(true);
      expect(await untilGone([pid], 5_000)).toEqual([]);
      // The chain that stopped raised what a work item that begins to wait raises, and a click on it opens the work item's view.
      expect(await app.evaluate(`window.__notifications.map(({ title, body }) => ({ title, body }))`)).toEqual([{ title: "Alpha", body: "Needs you" }]);
      await app.evaluate(`window.__notifications[0].onclick()`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha at the click");
      expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: false, says: stopped, refusal: "" });
      expect(await app.evaluate(`document.getElementById("get-seal").title`)).toBe(start);

      // A second press runs the same round again. Its session is stopped with the view in front, and the button is on again there.
      await app.click("#get-seal");
      await app.until(`document.getElementById("seal-says").textContent === ${JSON.stringify(running)}`, "the sentence of the round that runs again", 20_000);
      expect((await foot()).disabled).toBe(true);
      const again = Date.now() + 10_000;
      while (second.alpha().chain?.stages.at(-1)?.state !== "working" && Date.now() < again) await new Promise((r) => setTimeout(r, 50));
      const rerun = second.alpha().chain?.stages ?? [];
      expect(rerun.map(({ kind, round, state }) => [kind, round, state])).toEqual([["round", 1, "failed"], ["round", 1, "working"]]);
      second.send({ type: "stopHeadless", requestId: 2, id: rerun.at(-1)!.headlessId! });
      await app.until(`document.getElementById("seal-says").textContent === ${JSON.stringify(stopped)}`, "the sentence of the chain that stopped again", 20_000);
      expect(await foot()).toEqual({ button: "Get a seal", hidden: false, disabled: false, says: stopped, refusal: "" });
      // No record of the round was committed: the branch holds the person's commit and the routing the first start declared.
      expect(git(workItem.worktree, "log", "--format=%s", `${workItem.baseCommit ?? ""}..HEAD`).trim().split("\n")).toEqual(["chore: declare the work item's routing", "add feature.txt"]);
    } finally {
      second.close();
    }
  });
});
