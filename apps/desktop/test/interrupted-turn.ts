// The recording of a Claude Code session in which the person interrupted a
// reply and then a Bash call, `fixtures/claude-interrupted-turn.json`, and
// its play to a daemon: each hook event goes to the daemon for a pane, and
// each line the session log gained goes onto the end of a file of the case's
// own. No case starts `claude`.
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Daemon } from "../src/daemon/daemon";

/** Each hook event of the recording and each line its session log gained, with its time. */
export const RECORDED = JSON.parse(readFileSync(join(__dirname, "fixtures", "claude-interrupted-turn.json"), "utf8")) as { events: { at: number; name: string; payload: Record<string, unknown> }[]; log: { at: number; line: string }[] };
/** When the log gained the entry of the reply's interruption, and of the Bash call's. */
export const REPLY_ESC = RECORDED.log.find(({ line }) => line.includes('"text":"[Request interrupted by user]"'))?.at ?? NaN;
export const TOOL_ESC = RECORDED.log.find(({ line }) => line.includes('"text":"[Request interrupted by user for tool use]"'))?.at ?? NaN;
/** When the prompt that asks for the Bash call arrived. */
export const SECOND_PROMPT = RECORDED.events.filter(({ name }) => name === "UserPromptSubmit")[1]?.at ?? NaN;

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The lines the log gained from `from` until before `to`, each with its line end. */
export const lines = (from: number, to: number): string =>
  RECORDED.log
    .filter(({ at }) => at >= from && at < to)
    .map(({ line }) => `${line}\n`)
    .join("");

/** The path of a session log in a folder of the case's own, which stands nowhere until the case writes it. */
export function sessionLog(cleanups: (() => Promise<void> | void)[]): string {
  const folder = mkdtempSync(join(tmpdir(), "owlery-session-log-"));
  cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
  return join(folder, "session.jsonl");
}

/** Plays the recording from `from` until before `to`, in its order: each hook event goes to the daemon for the pane, naming `log` as its session log, and each batch of lines goes onto the end of `log`, which the first batch creates, with a pause after it in which the daemon can read it. */
export async function replay(d: Daemon, paneId: number, log: string, from: number, to: number): Promise<void> {
  const times = [...new Set([...RECORDED.events, ...RECORDED.log].map(({ at }) => at))].filter((at) => at >= from && at < to).sort((a, b) => a - b);
  for (const at of times) {
    for (const { name, payload } of RECORDED.events.filter((event) => event.at === at)) d.agentEvent(paneId, name, { ...payload, transcript_path: log });
    const batch = lines(at, at + 1);
    if (batch === "") continue;
    appendFileSync(log, batch);
    await pause(60);
  }
}

/** Plays the turn whose Bash call the person interrupted, from its prompt to the session's end, with `log` holding what the log held when the prompt came: the pane works from the prompt, and the Esc's batch is its interruption. */
export async function interruptToolCall(d: Daemon, paneId: number, log: string): Promise<void> {
  writeFileSync(log, lines(0, SECOND_PROMPT));
  await replay(d, paneId, log, SECOND_PROMPT, Infinity);
}
