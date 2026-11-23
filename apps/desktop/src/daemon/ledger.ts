import { appendFileSync, closeSync, fstatSync, openSync, readFileSync, readSync } from "node:fs";
import { join } from "node:path";
import { type LedgerEntry, type LedgerStage, type ModelUsage, type Usage, roleStageOf } from "../shared/protocol";

const FILE = "ledger.jsonl";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number | null => value === null || typeof value === "number";

/** What one model used, where a value is one with every field in its type: the protocol's fields alone. */
function modelUsageOf(value: unknown): ModelUsage | undefined {
  if (!isRecord(value) || typeof value.model !== "string") return undefined;
  const { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, costUsd } = value;
  if (!isCount(inputTokens) || !isCount(outputTokens) || !isCount(cacheReadTokens) || !isCount(cacheWriteTokens) || !isCount(costUsd)) return undefined;
  return { model: value.model, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, costUsd };
}

/** What a turn used, null, or nothing where a value is neither. */
function usageOf(value: unknown): Usage | null | undefined {
  if (value === null) return null;
  if (!isRecord(value) || !isCount(value.costUsd) || typeof value.converted !== "boolean" || !Array.isArray(value.models)) return undefined;
  const models: ModelUsage[] = [];
  for (const model of value.models as unknown[]) {
    const read = modelUsageOf(model);
    if (read === undefined) return undefined;
    models.push(read);
  }
  return { costUsd: value.costUsd, converted: value.converted, models };
}

/** The stage a value names: a pair of `ROLE_STAGES`, the gate, null, or nothing where it names none. */
function stageOf(value: unknown): LedgerStage | undefined {
  if (value === null) return null;
  if (isRecord(value) && value.role === null && value.stage === "gate") return { role: null, stage: "gate" };
  return roleStageOf(value);
}

/** The entry a line's value is, with the protocol's fields alone, or nothing where it is no entry. */
function entryOf(value: unknown): LedgerEntry | undefined {
  if (!isRecord(value)) return undefined;
  const { workItemId, repo, branch, startedAt, endedAt, state, stopped } = value;
  if (typeof workItemId !== "number" || typeof repo !== "string" || typeof branch !== "string" || typeof startedAt !== "number" || typeof endedAt !== "number") return undefined;
  if (state !== "finished" && state !== "failed") return undefined;
  if (stopped !== "limit" && stopped !== "request" && stopped !== "daemon" && stopped !== null) return undefined;
  const stage = stageOf(value.stage);
  const usage = usageOf(value.usage);
  if (stage === undefined || usage === undefined) return undefined;
  return { workItemId, repo, branch, stage, startedAt, endedAt, state, stopped, usage };
}

/** Whether the file's last byte is no line break: a crash cut its last line. A file that does not exist has none. */
function endsInsideALine(file: string): boolean {
  let fd: number;
  try {
    fd = openSync(file, "r");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
  try {
    const { size } = fstatSync(fd);
    if (size === 0) return false;
    const last = Buffer.alloc(1);
    readSync(fd, last, 0, 1, size - 1);
    return last[0] !== 0x0a;
  } finally {
    closeSync(fd);
  }
}

/**
 * The cost ledger: one entry for each stage of a work item that ended, which
 * the daemon keeps in `ledger.jsonl` in its run directory, readable by the
 * user alone, one entry as JSON on each line in the order the stages ended
 * (docs/architecture.md, "State lives in three places"). Nothing rewrites or
 * removes a line, so no write loses an entry that was written, and a delete
 * of a work item leaves its entries. The store holds no entry in memory
 * between two reads: `read` reads the file each time. An append that fails is
 * logged, and its entry is held in memory, written before the next entry's
 * line and given in every read meanwhile. Given no run directory, the entries
 * are kept in memory alone.
 */
export class Ledger {
  private readonly file: string | undefined;
  // The entries no line of the file holds, in the order they were added: every entry where there is no file, and otherwise the ones whose append failed.
  private held: LedgerEntry[] = [];

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
  }

  /** Appends one entry, after the entries held since an append failed. */
  add(entry: LedgerEntry): void {
    this.held.push(entry);
    if (this.file === undefined) return;
    try {
      const lines = this.held.map((held) => `${JSON.stringify(held)}\n`).join("");
      // A line a crash cut stays, and the next entry starts a line of its own after it.
      appendFileSync(this.file, endsInsideALine(this.file) ? `\n${lines}` : lines, { mode: 0o600 });
      this.held = [];
    } catch (error) {
      console.error(`an entry of the ledger was not written: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * The entries of one work item whose stage started at `since` or later, in
   * the order they were added, and how many lines of the file, of any work
   * item, are no entry. A line that is no entry stays in the file. A file
   * that cannot be read is logged, and gives no line.
   */
  read(workItemId: number, since: number): { entries: LedgerEntry[]; unread: number } {
    const ofWorkItem = (entry: LedgerEntry): boolean => entry.workItemId === workItemId && entry.startedAt >= since;
    let text = "";
    if (this.file !== undefined) {
      try {
        text = readFileSync(this.file, "utf8");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error(`the ledger was not read: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const lines = text.split("\n");
    // The text after the last line break, which is empty where the last line is whole.
    if (lines.at(-1) === "") lines.pop();
    const entries: LedgerEntry[] = [];
    let unread = 0;
    for (const line of lines) {
      let entry: LedgerEntry | undefined;
      try {
        entry = entryOf(JSON.parse(line));
      } catch {
        entry = undefined;
      }
      if (entry === undefined) unread++;
      else if (ofWorkItem(entry)) entries.push(entry);
    }
    return { entries: [...entries, ...this.held.filter(ofWorkItem)], unread };
  }
}
