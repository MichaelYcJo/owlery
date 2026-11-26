import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { TerminalSession, terminalEnv } from "../src/daemon/pty";

/**
 * The descriptors of this process that name a pseudo-terminal, as `lsof` lists them, each as "<descriptor> <name>".
 * A terminal's other end that stays open after its master closed is one macOS has revoked, and `lsof` names it "(revoked)".
 */
function terminalDescriptors(): string[] {
  const listed = execFileSync("/usr/sbin/lsof", ["-nP", "-a", "-p", String(process.pid), "-F", "fn"], { encoding: "utf8" });
  const found: string[] = [];
  let descriptor: string | undefined;
  for (const line of listed.split("\n")) {
    if (line.startsWith("f")) descriptor = /^\d+$/.test(line.slice(1)) ? line.slice(1) : undefined;
    else if (line.startsWith("n") && descriptor !== undefined && /^(\/dev\/ptmx|\/dev\/ttys\d+|\(revoked\))$/.test(line.slice(1))) found.push(`${descriptor} ${line.slice(1)}`);
  }
  return found;
}

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

  it("reports the signal that ended the process, beside an exit code that reads 0", async () => {
    const session = TerminalSession.spawn({ command: "/bin/sh", args: ["-c", "kill -TERM $$"], cwd: process.cwd(), cols: 80, rows: 24 });
    const end = await new Promise<[number, number]>((resolve) => session.onExit((code, signal) => resolve([code, signal])));
    expect(end).toEqual([0, 15]);
  });

  it("leaves no pseudo-terminal open in this process once its processes have ended, by themselves or by kill()", async () => {
    // macOS gives the whole machine 511 pseudo-terminals, and the daemon outlives every pane it starts.
    // node-pty 1.1.0 kept a spare one open for each start, until the repository's patch of it (`patches/`).
    const before = terminalDescriptors();
    const ending = Array.from({ length: 4 }, () => TerminalSession.spawn({ command: "/bin/sh", args: ["-c", "exit 0"], cwd: process.cwd(), cols: 80, rows: 24 }));
    const killed = Array.from({ length: 4 }, () => TerminalSession.spawn({ command: "/bin/sh", args: ["-c", "echo started; exec /bin/cat"], cwd: process.cwd(), cols: 80, rows: 24 }));
    const ended = [...ending, ...killed].map((session) => new Promise<void>((resolve) => session.onExit(() => resolve())));
    await Promise.all(killed.map((session) => collect(session, (o) => o.includes("started"))));
    for (const session of killed) session.kill();
    await Promise.all(ended);
    // A terminal's own descriptor closes once its output is read to the end, which may follow the exit.
    const giveUp = Date.now() + 3000;
    let left = terminalDescriptors().filter((open) => !before.includes(open));
    while (left.length > 0 && Date.now() < giveUp) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      left = terminalDescriptors().filter((open) => !before.includes(open));
    }
    expect(left).toEqual([]);
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

  it("drops the variables a package script gives the app it starts, and keeps the user's own", () => {
    // `pnpm -C apps/desktop start` gives the app these. nvm refuses to load while `npm_config_prefix` is set,
    // so a login shell in the pane found no `node`, and Claude Code's hooks that run `node` failed.
    const env = terminalEnv({
      PATH: "/usr/bin",
      HOME: "/Users/x",
      npm_config_prefix: "/Users/x/owlery/apps/desktop",
      npm_config_user_agent: "pnpm/10.33.0",
      npm_lifecycle_event: "start",
      npm_package_name: "@owlery/desktop",
      npm_execpath: "/x/pnpm.cjs",
      npm_node_execpath: "/x/node",
      npm_command: "run-script",
      pnpm_config_verify_deps_before_run: "false",
      PNPM_SCRIPT_SRC_DIR: "/Users/x/owlery/apps/desktop",
      INIT_CWD: "/Users/x/owlery",
      NODE: "/x/node",
      NODE_PATH: "/Users/x/owlery/node_modules/.pnpm/node_modules",
      PNPM_HOME: "/Users/x/Library/pnpm",
      NVM_DIR: "/Users/x/.nvm",
    });
    expect(Object.keys(env).filter((k) => /^(npm_|pnpm_)/i.test(k) && k !== "PNPM_HOME")).toEqual([]);
    expect([env.PNPM_SCRIPT_SRC_DIR, env.INIT_CWD, env.NODE, env.NODE_PATH]).toEqual([undefined, undefined, undefined, undefined]);
    expect([env.HOME, env.PNPM_HOME, env.NVM_DIR]).toEqual(["/Users/x", "/Users/x/Library/pnpm", "/Users/x/.nvm"]);
  });

  it("drops the folders inside a node_modules folder from PATH, and keeps the others in their order", () => {
    const env = terminalEnv({
      PATH: [
        "/Users/x/owlery/apps/desktop/node_modules/.bin",
        "/opt/homebrew/Cellar/pnpm/10.33.0/libexec/lib/node_modules/pnpm/dist/node-gyp-bin",
        "/Users/x/owlery/node_modules/.bin",
        "/Users/x/.nvm/versions/node/v26.13.1/bin",
        "/usr/bin",
        "/bin",
      ].join(":"),
    });
    expect(env.PATH).toBe("/Users/x/.nvm/versions/node/v26.13.1/bin:/usr/bin:/bin");
  });

  it("starts a pane's process without a package script's variables", async () => {
    const session = TerminalSession.spawn({
      command: "/bin/sh",
      args: ["-c", 'echo "prefix=${npm_config_prefix-none}"'],
      cwd: process.cwd(),
      cols: 80,
      rows: 24,
      env: { PATH: "/usr/bin:/bin", npm_config_prefix: "/Users/x/owlery/apps/desktop" },
    });
    expect(await collect(session, (o) => o.includes("prefix="))).toContain("prefix=none");
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
