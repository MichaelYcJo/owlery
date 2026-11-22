import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeWholeFile } from "./whole-file";

const FILE = "record-times.json";

/** The state the daemon last read a block in, and its clock when it first read the block so. */
interface Held {
  state: string;
  since: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isHeld = (value: unknown): value is Held => isRecord(value) && typeof value.state === "string" && typeof value.since === "number";
const isId = (key: string): boolean => /^[1-9][0-9]*$/.test(key);

/** Whether a value is the file's whole: under each work item's id, under each block's id, a state and a time. */
function isWritten(value: unknown): value is { workItems: Record<string, Record<string, Held>> } {
  if (!isRecord(value) || !isRecord(value.workItems)) return false;
  return Object.entries(value.workItems).every(([workItemId, blocks]) => isId(workItemId) && isRecord(blocks) && Object.entries(blocks).every(([blockId, held]) => isId(blockId) && isHeld(held)));
}

/**
 * The daemon's record of when it first read each block of each work item's
 * record of decisions and questions in the state the block is in. The record
 * itself holds no clock, and the inbox's ages are counted from these times.
 * Like the last look it is the daemon's state: it lives in
 * `record-times.json` in the run directory, as `{"workItems":{"<work item's
 * id>":{"<block's id>":{"state":<the state>,"since":<the clock>}}}}`,
 * readable by the user alone, and is read at start, so an age outlives the
 * daemon. It serves the ages alone: where the file is lost, is no JSON or is
 * of another shape, every age starts again at the next read, and nothing else
 * changes. A change is held in memory by `since` and `drop`, and `flush`
 * writes the file whole where something changed since the last write. Given
 * no run directory, the times are kept in memory alone.
 */
export class RecordTimes {
  private readonly workItems = new Map<number, Map<number, Held>>();
  private readonly file: string | undefined;
  private changed = false;

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    try {
      const value: unknown = JSON.parse(readFileSync(this.file, "utf8"));
      if (!isWritten(value)) return;
      for (const [workItemId, blocks] of Object.entries(value.workItems)) {
        this.workItems.set(Number(workItemId), new Map(Object.entries(blocks).map(([blockId, { state, since }]) => [Number(blockId), { state, since }])));
      }
    } catch {
      // No daemon has written here, or the file is not ours.
    }
  }

  /**
   * Since when each block of a work item's record has been in its state, by
   * the block's id, given the blocks just read and the clock of that read. A
   * block read for the first time, and one whose state is another than at
   * the last read, takes the clock. Every other block keeps its time. What
   * the store held of a block that is not among the ones given is dropped.
   */
  since(workItemId: number, blocks: readonly { id: number; state: string }[], now: number): Map<number, number> {
    const before = this.workItems.get(workItemId) ?? new Map<number, Held>();
    const after = new Map<number, Held>();
    for (const { id, state } of blocks) {
      const held = before.get(id);
      if (held?.state === state) after.set(id, held);
      else {
        after.set(id, { state, since: now });
        this.changed = true;
      }
    }
    if (after.size !== before.size) this.changed = true;
    if (after.size > 0) this.workItems.set(workItemId, after);
    else this.workItems.delete(workItemId);
    return new Map([...after].map(([id, held]) => [id, held.since]));
  }

  /** Takes the times of the work items given out of the store. */
  drop(workItemIds: Iterable<number>): void {
    for (const workItemId of workItemIds) this.changed = this.workItems.delete(workItemId) || this.changed;
  }

  /** Writes the file where a read or a drop changed what the store holds since the last write. A write that throws leaves the store with the times in memory, and is not tried again until the next change. */
  flush(): void {
    if (!this.changed) return;
    this.changed = false;
    if (this.file === undefined) return;
    const written = { workItems: Object.fromEntries([...this.workItems].map(([workItemId, blocks]) => [workItemId, Object.fromEntries(blocks)])) };
    // A daemon that starts meanwhile never reads a half-written file, and a write that fails removes its partial file.
    writeWholeFile(this.file, JSON.stringify(written));
  }
}
