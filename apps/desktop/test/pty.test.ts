import { describe, expect, it } from "vitest";
import { TerminalSession, terminalEnv } from "../src/daemon/pty";

function collect(session: TerminalSession, until: (out: string) => boolean, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = "";
    const timer = setTimeout(() => reject(new Error(`timed out; got: ${JSON.stringify(out)}`)), timeoutMs);
    session.onData((chunk) => {
      out += chunk;
      if (until(out)) {
        clearTimeout(timer);
        resolve(out);
      }
    });
  });
}

describe("TerminalSession", () => {
  it("shows a command's UTF-8 output, Korean included", async () => {
    const session = TerminalSession.spawn({ command: "/bin/echo", args: ["안녕하세요"], cwd: process.cwd(), cols: 80, rows: 24 });
    const out = await collect(session, (o) => o.includes("안녕하세요"));
    expect(out).toContain("안녕하세요");
  });

  it("delivers what the person types to the process", async () => {
    const session = TerminalSession.spawn({ command: "/bin/cat", args: [], cwd: process.cwd(), cols: 80, rows: 24 });
    const out = collect(session, (o) => (o.match(/한글 입력/g) ?? []).length >= 2);
    session.write("한글 입력\r");
    // The terminal echoes the line once and cat prints it once more.
    expect(await out).toMatch(/한글 입력[\s\S]*한글 입력/);
    session.kill();
  });

  it("gives the process the size of the pane", async () => {
    const session = TerminalSession.spawn({ command: "/bin/sh", args: ["-c", "stty size"], cwd: process.cwd(), cols: 100, rows: 40 });
    const out = await collect(session, (o) => /\d+ \d+/.test(o));
    expect(out).toContain("40 100");
  });

  it("reports the exit code when the process ends", async () => {
    const session = TerminalSession.spawn({ command: "/bin/sh", args: ["-c", "exit 3"], cwd: process.cwd(), cols: 80, rows: 24 });
    const code = await new Promise<number>((resolve) => session.onExit(resolve));
    expect(code).toBe(3);
  });
});

describe("terminalEnv", () => {
  it("sets a UTF-8 locale when the app was started without one", () => {
    // An app opened from the Finder inherits no LANG, and Korean then breaks in the shell.
    const env = terminalEnv({ PATH: "/usr/bin", HOME: "/Users/x" });
    expect(env.LANG).toBe("en_US.UTF-8");
    expect(env.TERM).toBe("xterm-256color");
    expect(env.COLORTERM).toBe("truecolor");
  });

  it("keeps the locale the user already has", () => {
    const env = terminalEnv({ PATH: "/usr/bin", LANG: "ko_KR.UTF-8" });
    expect(env.LANG).toBe("ko_KR.UTF-8");
  });

  it("drops the markers of a Claude Code session the app was started from", () => {
    // Started from inside a Claude Code session, the app inherits that session's identity and
    // its messaging token; a `claude` in the pane then thinks it is a child and stops saving its transcript.
    const env = terminalEnv({
      PATH: "/usr/bin",
      CLAUDECODE: "1",
      CLAUDE_PID: "16894",
      CLAUDE_EFFORT: "high",
      CLAUDE_CODE_ENTRYPOINT: "cli",
      CLAUDE_CODE_EXECPATH: "/x/claude",
      CLAUDE_CODE_SESSION_ID: "c12dc263",
      CLAUDE_CODE_SESSION_ATTENDED: "1",
      CLAUDE_CODE_CHILD_SESSION: "1",
      CLAUDE_CODE_CHILD_NOTES_DIR: "/tmp/x",
      CLAUDE_CODE_MESSAGING_SOCKET: "/tmp/cc.sock",
      CLAUDE_CODE_MESSAGING_TOKEN: "secret",
      CLAUDE_CODE_PLUGIN_DIRS: "/x/plugins",
    });
    expect(Object.keys(env).filter((k) => k.startsWith("CLAUDE"))).toEqual([]);
  });

  it("keeps the user's own Claude Code and Anthropic settings", () => {
    const env = terminalEnv({ PATH: "/usr/bin", CLAUDE_CODE_USE_BEDROCK: "1", ANTHROPIC_BASE_URL: "https://example.test" });
    expect(env.CLAUDE_CODE_USE_BEDROCK).toBe("1");
    expect(env.ANTHROPIC_BASE_URL).toBe("https://example.test");
  });

  it("drops variables that would make a child CLI behave as Electron's Node", () => {
    const env = terminalEnv({ PATH: "/usr/bin", ELECTRON_RUN_AS_NODE: "1", ELECTRON_NO_ATTACH_CONSOLE: "1" });
    expect(env.ELECTRON_RUN_AS_NODE).toBeUndefined();
    expect(env.ELECTRON_NO_ATTACH_CONSOLE).toBeUndefined();
  });
});
