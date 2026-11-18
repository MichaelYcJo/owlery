import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { agentEventFor } from "../src/daemon/agent-events";
import { OutputBuffer } from "../src/daemon/buffer";
import { Daemon, type DaemonOptions } from "../src/daemon/daemon";
import { readDiscovery, writeDiscovery } from "../src/daemon/discovery";
import type { ServerMessage } from "../src/shared/protocol";

const TOKEN = "t".repeat(64);
const cleanups: (() => Promise<void> | void)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function daemon(options: Partial<DaemonOptions> = {}): Promise<{ daemon: Daemon; url: string }> {
  const d = new Daemon({
    token: TOKEN,
    // The fake command of a pane: prints, waits, prints again, and stays alive.
    commandFor: () => ({ command: "/bin/sh", args: ["-c", "echo first; sleep 0.3; echo second; sleep 30"], env: {} }),
    ...options,
  });
  const port = await d.listen(0);
  cleanups.push(() => d.close());
  return { daemon: d, url: `ws://127.0.0.1:${port}` };
}

/** A client that keeps every message it receives. */
/** `null` sends no hello at all. */
async function client(url: string, token: string | null = TOKEN) {
  const socket = new WebSocket(url);
  const messages: ServerMessage[] = [];
  let closed: { code: number } | undefined;
  socket.on("message", (raw) => messages.push(JSON.parse(String(raw)) as ServerMessage));
  socket.on("close", (code) => {
    closed = { code };
  });
  await new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
  if (token !== null) socket.send(JSON.stringify({ type: "hello", token }));
  cleanups.push(() => socket.close());
  const until = async <T>(find: () => T | undefined, ms = 5000): Promise<T> => {
    const end = Date.now() + ms;
    for (;;) {
      const found = find();
      if (found !== undefined) return found;
      if (Date.now() > end) throw new Error(`timed out; got ${JSON.stringify(messages)}`);
      await new Promise((r) => setTimeout(r, 20));
    }
  };
  return {
    socket,
    messages,
    send: (message: object) => socket.send(JSON.stringify(message)),
    closed: () => closed,
    until,
    message: <K extends ServerMessage["type"]>(type: K, where: (m: Extract<ServerMessage, { type: K }>) => boolean = () => true) =>
      until(() => messages.find((m): m is Extract<ServerMessage, { type: K }> => m.type === type && where(m as Extract<ServerMessage, { type: K }>))),
  };
}

describe("the daemon's local server", () => {
  it("listens on the loopback address only", async () => {
    const { daemon: d } = await daemon();
    expect(d.address()).toBe("127.0.0.1");
  });

  it("refuses a client whose first message has the wrong token", async () => {
    const { url } = await daemon();
    const c = await client(url, "wrong");
    await c.until(() => c.closed());
    expect(c.closed()?.code).toBe(4001);
    expect(c.messages).toEqual([]);
  });

  it("refuses a client that sends anything before the token", async () => {
    const { url } = await daemon();
    const c = await client(url, null);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    await c.until(() => c.closed());
    expect(c.closed()?.code).toBe(4001);
  });

  it("refuses a client that never says hello", async () => {
    const { url } = await daemon({ helloTimeoutMs: 100 });
    const c = await client(url, null);
    await c.until(() => c.closed());
    expect(c.closed()?.code).toBe(4001);
  });
});

describe("sessions", () => {
  it("starts a session and streams its output", async () => {
    const { url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 7 });
    const started = await c.message("started", (m) => m.requestId === 7);
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === started.session.id && m.data.includes("first")) ? true : undefined));
  });

  it("keeps a session alive when its client leaves, and replays the output the client missed", async () => {
    const { url } = await daemon();
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 1 });
    const { session } = await first.message("started");
    await first.until(() => (first.messages.some((m) => m.type === "output" && m.data.includes("first")) ? true : undefined));
    first.socket.close();

    // "second" is printed while no client is connected.
    await new Promise((r) => setTimeout(r, 500));
    const second = await client(url);
    const ready = await second.message("ready");
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true }]);
    second.send({ type: "attach", id: session.id });
    const replay = await second.message("replay");
    expect(replay.data).toContain("first");
    expect(replay.data).toContain("second");
  });

  it("tells every client when a session ends, and lists it as ended", async () => {
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 3"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    const { session } = await c.message("started");
    const exit = await c.message("exit");
    expect(exit).toEqual({ type: "exit", id: session.id, exitCode: 3 });
    const later = await client(url);
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "shell", alive: false }]);
  });

  it("gives each session's process the pane's id and the hook socket", async () => {
    const seen: number[] = [];
    const { url } = await daemon({
      commandFor: (_kind, id) => {
        seen.push(id);
        return { command: "/bin/sh", args: ["-c", 'echo "pane=$OWLERY_PANE_ID"; sleep 30'], env: { OWLERY_PANE_ID: String(id) } };
      },
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    const { session } = await c.message("started");
    expect(seen).toEqual([session.id]);
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.data.includes(`pane=${session.id}`)) ? true : undefined));
  });
});

describe("agent events", () => {
  it("carries a hook as a neutral event, with no field of the vendor's", async () => {
    const { daemon: d, url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    d.agentEvent(4, "PreToolUse", { tool_name: "Bash", session_id: "s", tool_input: { command: "ls" } });
    const event = await c.message("agent");
    expect(Object.keys(event).sort()).toEqual(["at", "event", "id", "tool", "type"]);
    expect(event).toMatchObject({ type: "agent", id: 4, event: "tool-start", tool: "Bash" });
  });

  it("maps each Claude Code hook Owlery listens to, and drops any other", () => {
    expect(agentEventFor("SessionStart")).toBe("session-start");
    expect(agentEventFor("UserPromptSubmit")).toBe("prompt");
    expect(agentEventFor("PreToolUse")).toBe("tool-start");
    expect(agentEventFor("PostToolUse")).toBe("tool-end");
    expect(agentEventFor("PostToolUseFailure")).toBe("tool-failed");
    expect(agentEventFor("PermissionRequest")).toBe("permission");
    expect(agentEventFor("Notification")).toBe("notification");
    expect(agentEventFor("Stop")).toBe("turn-end");
    expect(agentEventFor("SubagentStop")).toBeUndefined();
  });
});

describe("idle exit", () => {
  it("asks to exit once no session is alive and no client is connected", async () => {
    let idle = 0;
    const { url } = await daemon({ idleExitMs: 100, onIdle: () => idle++ });
    const c = await client(url);
    await c.message("ready");
    c.socket.close();
    await new Promise((r) => setTimeout(r, 400));
    expect(idle).toBe(1);
  });

  it("stays while a session is alive, though no client is connected", async () => {
    let idle = 0;
    const { url } = await daemon({ idleExitMs: 100, onIdle: () => idle++ });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    await c.message("started");
    c.socket.close();
    await new Promise((r) => setTimeout(r, 400));
    expect(idle).toBe(0);
  });
});

describe("OutputBuffer", () => {
  it("keeps the most recent output up to its size", () => {
    const buffer = new OutputBuffer(10);
    buffer.append("abcdef");
    buffer.append("ghijkl");
    expect(buffer.text()).toBe("cdefghijkl");
  });
});

describe("discovery", () => {
  it("writes the port and token to a file the user alone can read, and reads them back", () => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-discovery-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const file = writeDiscovery(dir, { port: 4321, token: TOKEN, pid: 99 });
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(readDiscovery(dir)).toEqual({ port: 4321, token: TOKEN, pid: 99 });
  });

  it("reads nothing where no daemon has written", () => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-discovery-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    expect(readDiscovery(dir)).toBeUndefined();
  });
});
