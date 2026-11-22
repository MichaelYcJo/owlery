import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Asked, AskedQuestion } from "../shared/protocol";
import { writeWholeFile } from "./whole-file";

const FILE = "asked.json";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function isOption(value: unknown): value is AskedQuestion["options"][number] {
  return isRecord(value) && typeof value.label === "string" && typeof value.implies === "string";
}

/** Whether a value is a question of the protocol's: every field of it, each of the protocol's type, and a default that names one of its options. */
function isQuestion(value: unknown): value is AskedQuestion {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.asks === "string" &&
    Array.isArray(value.options) &&
    value.options.every(isOption) &&
    (value.default === null || (Number.isInteger(value.default) && (value.default as number) >= 0 && (value.default as number) < value.options.length)) &&
    (value.answer === null || typeof value.answer === "string")
  );
}

/** Whether a value is a record of the protocol's: every field of it, each of the protocol's type, with one question at least, each numbered by its place from 1, which is what an answer names it by. */
export function isAsked(value: unknown): value is Asked {
  return (
    isRecord(value) &&
    typeof value.by === "string" &&
    typeof value.at === "number" &&
    Array.isArray(value.questions) &&
    value.questions.length > 0 &&
    value.questions.every((question, index) => isQuestion(question) && question.id === index + 1) &&
    (value.answeredAt === null || typeof value.answeredAt === "number")
  );
}

/** Only the fields of a record, its questions and their options copies: what a file's entry carries beyond them, or the one given becomes afterwards, is not the record's. */
export function askedOf({ by, at, questions, answeredAt }: Asked): Asked {
  return {
    by,
    at,
    questions: questions.map(({ id, asks, options, default: taken, answer }) => ({ id, asks, options: options.map(({ label, implies }) => ({ label, implies })), default: taken, answer })),
    answeredAt,
  };
}

/** The file's whole: each work item's record under the work item's id. */
interface Written {
  workItems: Record<string, Asked>;
}

function isWritten(value: unknown): value is Written {
  if (!isRecord(value) || !isRecord(value.workItems) || Array.isArray(value.workItems)) return false;
  return Object.entries(value.workItems).every(([workItemId, asked]) => /^\d+$/.test(workItemId) && isAsked(asked));
}

/**
 * The daemon's record of the questions each work item is parked with, or was
 * parked with last. A work item is parked while its record holds no time of
 * an answer, and an answered record stays until the next park of the work
 * item replaces it. Like the decisions it is the daemon's state: it lives in
 * `asked.json` in the run directory, as `{"workItems":{"<work item's
 * id>":<record>, …}}`, readable by the user alone, written whole at each
 * change and read at start, so a park and its answers outlive the daemon. A
 * work item's record leaves the file when the daemon drops it: at the work
 * item's delete, at its repository's removal, and at the daemon's start for
 * a work item the list of repositories does not hold. A
 * file of another shape, one whose entries lack a field of the protocol's
 * among them, is read as no record and replaced at the next change. Given no
 * run directory, the records are kept in memory alone.
 */
export class AskedStore {
  private readonly workItems = new Map<number, Asked>();
  private readonly file: string | undefined;

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    try {
      const value: unknown = JSON.parse(readFileSync(this.file, "utf8"));
      if (!isWritten(value)) return;
      for (const [workItemId, asked] of Object.entries(value.workItems)) this.workItems.set(Number(workItemId), askedOf(asked));
    } catch {
      // No daemon has written here, or the file is not ours.
    }
  }

  /** A work item's record, a copy, or null for a work item the store holds none of. */
  of(workItemId: number): Asked | null {
    const asked = this.workItems.get(workItemId);
    return asked ? askedOf(asked) : null;
  }

  /** Keeps a record for a work item, in the place of the one it held, and gives a copy of it. It is held before it is written, so a write that throws leaves the daemon with the record in memory. */
  park(workItemId: number, asked: Asked): Asked {
    this.workItems.set(workItemId, askedOf(asked));
    this.write();
    return askedOf(asked);
  }

  /**
   * Answers the questions of a parked work item at the time given, each with
   * the answer `answers` holds under its id, and gives a copy of the record.
   * It gives nothing, and changes nothing, where the work item holds no
   * record or an answered one, where a question has no answer, and where
   * `answers` holds one for a question the record does not hold. The
   * answers are held before they are written, as a park is.
   */
  answer(workItemId: number, answers: ReadonlyMap<number, string>, at: number): Asked | undefined {
    const asked = this.workItems.get(workItemId);
    if (!asked || asked.answeredAt !== null) return undefined;
    if (answers.size !== asked.questions.length || !asked.questions.every((question) => answers.has(question.id))) return undefined;
    for (const question of asked.questions) question.answer = answers.get(question.id) as string;
    asked.answeredAt = at;
    this.write();
    return askedOf(asked);
  }

  /** The ids of the work items the store holds entries of. */
  workItemIds(): number[] {
    return [...this.workItems.keys()];
  }

  /** Takes the records of the work items given out of the store, held before written as a park is. Where it holds none of them, nothing is written. */
  drop(workItemIds: Iterable<number>): void {
    let dropped = false;
    for (const workItemId of workItemIds) dropped = this.workItems.delete(workItemId) || dropped;
    if (dropped) this.write();
  }

  private write(): void {
    if (this.file === undefined) return;
    const written: Written = { workItems: Object.fromEntries(this.workItems) };
    // A daemon that starts meanwhile never reads a half-written file, and a write that fails removes its partial file.
    writeWholeFile(this.file, JSON.stringify(written));
  }
}
