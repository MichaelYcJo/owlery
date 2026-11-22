// The "Ask" section of a work item's view in the built app. It starts the app
// once, in the background, on a temporary repository. The login shell is a
// script that names a script CLI, so no real `claude` runs. While a flag file
// stands, the stand-in prints on its error stream and sleeps; after, it
// prints there and exits 3 at once.
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ServerMessage } from "../src/shared/protocol";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
import { temporaryRepository } from "./repositories";

describe("the Ask section in the built app", { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;

  function script(name: string, body: string): string {
    const path = join(made.base, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
    return path;
  }

  /** The lines of the section, as a person reads them. */
  const lines = (): Promise<{ row: string; buttons: string[]; answer: string; errorOutput: string | null }[]> =>
    app.evaluate(
      `[...document.querySelectorAll("#headless li")].map((li) => ({ row: li.querySelector(".row").textContent, buttons: [...li.querySelectorAll("button")].map((b) => b.textContent), answer: li.querySelector(".answer").textContent, errorOutput: li.querySelector(".error-output")?.textContent ?? null }))`,
    );

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    const hang = join(made.base, "hang");
    writeFileSync(hang, "");
    const cli = script(
      "cli",
      // The daemon also runs the CLI at its start, to read its version: that run prints one and is no session.
      `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\nif [ -f '${hang}' ]; then printf 'warning: no config\\nerror: the stand-in printed this\\n' >&2; echo $$ > '${join(made.base, "cli-pid")}'; exec sleep 60; fi\nprintf 'error: quick failure\\n' >&2\nexit 3`,
    );
    // The login shell: it names the stand-in, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n' '${cli}' '/usr/bin:/bin'`);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    await app.evaluate(`document.getElementById("work-item-repo").select()`);
    await app.cdp("Input.insertText", { text: made.repo });
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Alpha" });
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    await app.click("#work-item-create");
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it('offers "Stop" on a working session, stops it at a press, and shows its error, then what its process printed on its error stream', async () => {
    await app.click("#ask-prompt");
    await app.cdp("Input.insertText", { text: "Which file holds the login form?" });
    await app.click("#ask-submit");
    await app.until(`document.querySelector("#headless li .state.working")`, "the working line");
    const pidFile = join(made.base, "cli-pid");
    const deadline = Date.now() + 10_000;
    while (!existsSync(pidFile) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
    const pid = Number(readFileSync(pidFile, "utf8").trim());
    expect(alive(pid)).toBe(true);
    const working = await lines();
    expect(working).toHaveLength(1);
    expect(working[0]!.buttons).toEqual(["Stop"]);
    await app.click("#headless li button");
    await app.until(`document.querySelector("#headless li .state.failed")`, "the line as failed", 10_000);
    // The error output arrives with the `headless` that follows the process's exit, which can come after the one that carries the failure.
    await app.until(`document.querySelector("#headless li .error-output")`, "the error output under the failed line", 10_000);
    expect(await lines()).toEqual([
      {
        row: "Which file holds the login form?failed",
        buttons: [],
        answer: "the session was stopped at a request before it finished",
        errorOutput: "warning: no config\nerror: the stand-in printed this\n",
      },
    ]);
    expect(await untilGone([pid], 5_000)).toEqual([]);
  });

  it("takes a session the daemon dropped from its list out of the section", async () => {
    rmSync(join(made.base, "hang"));
    // A second client of the daemon asks fifty more, each of a stand-in that fails at once, so the daemon's bound of fifty drops the stopped session.
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    const messages: ServerMessage[] = [];
    try {
      const workItemId = await new Promise<number>((resolve) => {
        socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })));
        socket.addEventListener("message", (event) => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          messages.push(message);
          if (message.type === "ready") resolve(message.workItems.find((item) => item.title === "Alpha")!.id);
        });
      });
      const ended = (id: number | undefined): boolean => messages.some((m) => m.type === "headless" && m.headless.id === id && m.headless.state !== "working");
      for (let requestId = 1; requestId <= 50; requestId++) {
        socket.send(JSON.stringify({ type: "ask", requestId, workItemId, prompt: `Quick ${requestId}?` }));
        const deadline = Date.now() + 10_000;
        let id: number | undefined;
        while (!ended(id) && Date.now() < deadline) {
          id ??= messages.flatMap((m) => (m.type === "asked" && m.requestId === requestId ? [m.headless.id] : []))[0];
          await new Promise((r) => setTimeout(r, 20));
        }
        expect(ended(id)).toBe(true);
      }
      expect(messages.filter((m) => m.type === "headlessDropped")).toHaveLength(1);
      await app.until(`document.querySelectorAll("#headless li").length === 50`, "fifty lines", 10_000);
      expect((await lines()).map(({ row }) => row).filter((row) => row.startsWith("Which file holds the login form?"))).toEqual([]);
    } finally {
      socket.close();
    }
  });
});
