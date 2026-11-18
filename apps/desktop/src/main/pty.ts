import * as pty from "node-pty";

export interface SpawnOptions {
  command: string;
  args: string[];
  cwd: string;
  cols: number;
  rows: number;
  env?: NodeJS.ProcessEnv;
}

// Variables that describe the process the app was started from rather than
// the user's configuration. Electron's own would make a CLI run as Electron's
// Node or lose its console. A Claude Code session's would make a `claude` in
// the pane take itself for that session's child, and they carry the session's
// messaging token. The pane opens a login shell, which restores whatever the
// user set in their own profile.
const INHERITED_ONLY = new Set([
  "ELECTRON_RUN_AS_NODE",
  "ELECTRON_NO_ATTACH_CONSOLE",
  "CLAUDECODE",
  "CLAUDE_PID",
  "CLAUDE_EFFORT",
  "CLAUDE_CODE_ENTRYPOINT",
  "CLAUDE_CODE_EXECPATH",
  "CLAUDE_CODE_PLUGIN_DIRS",
]);
const INHERITED_PREFIXES = ["CLAUDE_CODE_SESSION_", "CLAUDE_CODE_CHILD_", "CLAUDE_CODE_MESSAGING_"];

function inheritedOnly(key: string): boolean {
  return INHERITED_ONLY.has(key) || INHERITED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * The environment a terminal pane gives its process: the user's own, with a
 * terminal type, true colour, and a UTF-8 locale where the app inherited none.
 * An app opened from the Finder starts without LANG, and the shell then cannot
 * read or print Korean.
 */
export function terminalEnv(base: NodeJS.ProcessEnv): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(base)) {
    if (value !== undefined && !inheritedOnly(key)) env[key] = value;
  }
  env.TERM = "xterm-256color";
  env.COLORTERM = "truecolor";
  if (!env.LANG) env.LANG = "en_US.UTF-8";
  return env;
}

/** The user's login shell, which the pane opens so their CLIs run as they do in a terminal. */
export function loginShell(env: NodeJS.ProcessEnv): { command: string; args: string[] } {
  return { command: env.SHELL || "/bin/zsh", args: ["-l"] };
}

/** One process running in a pseudo-terminal, as one terminal pane shows it. */
export class TerminalSession {
  private constructor(private readonly proc: pty.IPty) {}

  static spawn(options: SpawnOptions): TerminalSession {
    const proc = pty.spawn(options.command, options.args, {
      name: "xterm-256color",
      cwd: options.cwd,
      cols: options.cols,
      rows: options.rows,
      env: terminalEnv(options.env ?? process.env),
    });
    return new TerminalSession(proc);
  }

  get pid(): number {
    return this.proc.pid;
  }

  onData(listener: (data: string) => void): void {
    this.proc.onData(listener);
  }

  onExit(listener: (exitCode: number) => void): void {
    this.proc.onExit(({ exitCode }) => listener(exitCode));
  }

  write(data: string): void {
    this.proc.write(data);
  }

  resize(cols: number, rows: number): void {
    this.proc.resize(Math.max(1, cols), Math.max(1, rows));
  }

  kill(): void {
    this.proc.kill();
  }
}
