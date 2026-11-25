// The "Ask" section of a work item's view in the built app. It starts the app
// once, in the background, on a temporary repository. The login shell is a
// script that names a script CLI, so no real `claude` runs. While a flag file
// stands, the stand-in prints on its error stream and sleeps; after, it
// prints there and exits 3 at once. While a second flag file stands, it asks
// the host to allow two commands, as Claude Code asks with
// `--permission-prompt-tool stdio`, writes the two answers it reads into a
// file, and then gives its result. In the background the page raises nothing
// of the system's and keeps each notification in `window.__notifications`
// (src/renderer/notifier.ts), which the cases read.
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ClientMessage, ServerMessage, WorkItem } from "../src/shared/protocol";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
import { temporaryRepository } from "./repositories";

/** The two commands the stand-in asks the host to allow, in the order it asks. */
const COMMANDS = ["git push origin HEAD", "pnpm test"];

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

  /** A second client of the daemon: what it was sent, and a message it sends. */
  async function client(): Promise<{ messages: ServerMessage[]; send(message: ClientMessage): void; close(): void }> {
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
    return { messages, send: (message) => socket.send(JSON.stringify(message)), close: () => socket.close() };
  }

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    const hang = join(made.base, "hang");
    writeFileSync(hang, "");
    // Each line the stand-in prints to ask is the CLI's own form of a request to use a tool.
    const asking = COMMANDS.map((command, place) => `printf '%s\\n' '${JSON.stringify({ type: "control_request", request_id: `ask-${place + 1}`, request: { subtype: "can_use_tool", tool_name: "Bash", input: { command }, tool_use_id: `tool-${place + 1}` } })}'`).join("\n");
    const result = JSON.stringify({ type: "result", result: "Both commands were answered.", is_error: false, total_cost_usd: 0 });
    const cli = script(
      "cli",
      // The daemon also runs the CLI at its start, to read its version: that run prints one and is no session.
      // The adapter writes the handshake and the prompt first, and ends the input once the result is printed.
      `if [ "$*" = "--version" ]; then echo '2.1.330 (Claude Code)'; exit 0; fi\nif [ -f '${join(made.base, "asks")}' ]; then\nread -r handshake\nread -r prompt\n${asking}\nread -r first\nread -r second\nprintf '%s\\n%s\\n' "$first" "$second" > '${join(made.base, "answers")}'\nprintf '%s\\n' '${result}'\nexec cat > /dev/null\nfi\nif [ -f '${hang}' ]; then printf 'warning: no config\\nerror: the stand-in printed this\\n' >&2; echo $$ > '${join(made.base, "cli-pid")}'; exec sleep 60; fi\nprintf 'error: quick failure\\n' >&2\nexit 3`,
    );
    // The login shell: it names the stand-in, and a pane it starts ends at once.
    const shell = script("shell", `printf '\\n__owlery_cli=%s\\n__owlery_path=%s\\n__owlery_config=%s\\n' '${cli}' '/usr/bin:/bin' "\${CLAUDE_CONFIG_DIR:-}"`);
    app = await BuiltApp.start({ SHELL: shell, OWLERY_WORKTREES: made.root });
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

  it("notifies of each call a session asks the person to allow and opens the view at a click, shows the calls there with Allow and Refuse on the keyboard, keeps the keyboard where an inbox changes nothing the section shows and on the same button where a change draws the section again, and sends the answer a press gives", async () => {
    writeFileSync(join(made.base, "asks"), "");
    // Only the notifications of this case's requests are read: the page's list keeps whatever a case before this one raised, and this case reads the entries after it.
    const before = await app.evaluate<number>(`window.__notifications.length`);
    // The app starts in the background, and the page of a window without the system's focus moves no keyboard.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden`, "the inbox screen");
    const second = await client();
    /** The work item Alpha as the daemon last listed it to the second client. */
    const alpha = (): WorkItem => second.messages.flatMap((m) => (m.type === "ready" || m.type === "inbox" ? m.workItems : [])).filter((item) => item.title === "Alpha").at(-1)!;
    /** Where the keyboard is: the button's words, and the call of the card it stands on. */
    const keyboardOn = (): Promise<{ words: string; call: string | null }> =>
      app.evaluate(`(() => { const e = document.activeElement; return { words: e?.textContent ?? "", call: e?.closest?.(".permission")?.querySelector(".call")?.textContent ?? null }; })()`);
    async function press(code: string, key: string, virtualKey: number, text?: string): Promise<void> {
      await app.cdp("Input.dispatchKeyEvent", { type: text === undefined ? "rawKeyDown" : "keyDown", code, key, windowsVirtualKeyCode: virtualKey, ...(text === undefined ? {} : { text }) });
      await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", code, key, windowsVirtualKeyCode: virtualKey });
    }
    try {
      const workItemId = alpha().id;
      second.send({ type: "ask", requestId: 1, workItemId, prompt: "Push the branch, then run the tests." });
      await app.until(`window.__notifications.length === ${before + 2}`, "a notification for each request");
      expect(await app.evaluate(`window.__notifications.slice(${before}).map(({ title, body }) => ({ title, body }))`)).toEqual([
        { title: "Alpha", body: "Needs you" },
        { title: "Alpha", body: "Needs you" },
      ]);
      // The line waits, and says the oldest request.
      const line = `#inbox-lines button[data-work-item="${workItemId}"]`;
      expect(await app.evaluate(`[document.querySelector('${line} .state-icon').classList.contains("waiting"), document.querySelector('${line} .says').textContent]`)).toEqual([true, `Asks to use Bash: ${COMMANDS[0]} (and 1 more)`]);

      await app.evaluate(`window.__notifications[${before}].onclick()`);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === "Alpha"`, "the view of Alpha at the click");
      await app.until(`document.querySelectorAll("#headless .permission").length === 2`, "the two calls in the view");
      expect(
        await app.evaluate(`(() => { const li = document.querySelector("#headless li"); return { row: li.querySelector(".row").textContent, waiting: li.querySelector(".row .state-icon").classList.contains("waiting"), calls: [...li.querySelectorAll(".permission")].map((card) => ({ head: card.querySelector("h3").textContent, call: card.querySelector(".call").textContent, buttons: [...card.querySelectorAll("button")].map((b) => [b.textContent, b.title]) })) }; })()`),
      ).toEqual({
        row: "Push the branch, then run the tests.Needs youStop",
        waiting: true,
        calls: COMMANDS.map((command) => ({ head: "Asks to use Bash", call: command, buttons: [["Allow", "Allow this one call"], ["Refuse", "Refuse this call: the agent is told the person refused it"]] })),
      });

      // From the line's "Stop", Tab reaches each call's "Allow" and "Refuse" in turn.
      await app.evaluate(`document.querySelector("#headless li .row button").focus()`);
      const reached: { words: string; call: string | null }[] = [];
      for (let presses = 0; presses < 4; presses++) {
        await press("Tab", "Tab", 9);
        reached.push(await keyboardOn());
      }
      expect(reached).toEqual(COMMANDS.flatMap((call) => [{ words: "Allow", call }, { words: "Refuse", call }]));

      // An inbox that changes nothing the section shows leaves the button, and the keyboard on it, as they were.
      await app.evaluate(`window.__kept = document.activeElement`);
      second.send({ type: "setWorkItem", requestId: 2, id: workItemId, pinned: true });
      await app.until(`document.querySelector('#repositories button[data-work-item="${workItemId}"] .line-mark.pinned')`, "the inbox that pins Alpha, as the sidebar draws it");
      expect(await app.evaluate(`document.activeElement === window.__kept && document.getElementById("headless").contains(window.__kept)`)).toBe(true);

      // An answer to the first call draws the section again, and the keyboard stays on the second call's "Refuse".
      const first = alpha().permissions.find((ask) => ask.text === COMMANDS[0])!;
      second.send({ type: "answerPermission", requestId: 3, workItemId, id: first.id, allow: true });
      await app.until(`document.querySelectorAll("#headless .permission").length === 1`, "the section without the first call");
      expect(await app.evaluate(`document.getElementById("headless").contains(window.__kept)`)).toBe(false);
      expect(await keyboardOn()).toEqual({ words: "Refuse", call: COMMANDS[1] });

      // Enter presses "Refuse", which sends the person's refusal of that call.
      await press("Enter", "Enter", 13, "\r");
      await app.until(`document.querySelector("#headless li .state.finished")`, "the session finished once both calls were answered", 10_000);
      expect(readFileSync(join(made.base, "answers"), "utf8").trim().split("\n").map((answer) => JSON.parse(answer) as unknown)).toEqual([
        { type: "control_response", response: { subtype: "success", request_id: "ask-1", response: { behavior: "allow", updatedInput: { command: COMMANDS[0] } } } },
        { type: "control_response", response: { subtype: "success", request_id: "ask-2", response: { behavior: "deny", message: "The person refused this call." } } },
      ]);
      expect(await app.evaluate(`document.querySelectorAll("#headless .permission").length`)).toBe(0);
    } finally {
      second.close();
    }
  });
});
