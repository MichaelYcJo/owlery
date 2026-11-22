import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Decision, DecisionKind } from "../shared/protocol";
import { writeWholeFile } from "./whole-file";

const FILE = "decisions.json";

const KINDS: readonly DecisionKind[] = ["route", "default", "scope", "answered"];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Whether a value is one of the kinds of a decision. */
export function isDecisionKind(value: unknown): value is DecisionKind {
  return KINDS.includes(value as DecisionKind);
}

/** Whether a value is a decision of the protocol's: every field of it, each of the protocol's type. */
export function isDecision(value: unknown): value is Decision {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    isDecisionKind(value.kind) &&
    typeof value.says === "string" &&
    typeof value.grounds === "string" &&
    typeof value.at === "number" &&
    (value.reversed === null || (isRecord(value.reversed) && typeof value.reversed.at === "number" && typeof value.reversed.message === "string"))
  );
}

/** Only the fields of a decision, its reversal a copy: what a file's entry carries beyond them, or the one given becomes afterwards, is not the decision's. */
export function decisionOf({ id, kind, says, grounds, at, reversed }: Decision): Decision {
  return { id, kind, says, grounds, at, reversed: reversed && { at: reversed.at, message: reversed.message } };
}

/** The file's whole: the id the next decision gets, and each work item's decisions under the work item's id. */
interface Written {
  nextId: number;
  workItems: Record<string, Decision[]>;
}

function isWritten(value: unknown): value is Written {
  if (!isRecord(value) || !Number.isInteger(value.nextId) || !isRecord(value.workItems) || Array.isArray(value.workItems)) return false;
  const lists = Object.entries(value.workItems);
  // An id the file holds is given to no later decision.
  return lists.every(([workItemId, decisions]) => /^\d+$/.test(workItemId) && Array.isArray(decisions) && decisions.every((decision) => isDecision(decision) && decision.id < (value.nextId as number)));
}

/**
 * The daemon's record of the decisions made for each work item in place of
 * asking the person. Like the last look it is the daemon's state: it lives in
 * `decisions.json` in the run directory, as `{"nextId":<n>,"workItems":{"<work
 * item's id>":[<decision>, …]}}`, readable by the user alone, written whole at
 * each change and read at start, so the decisions outlive the daemon. A
 * decision's id is given once over the whole file and never again, the ids of
 * the decisions a removal took out among them. A file of another shape, one
 * whose entries lack a field of the protocol's among them, is read as no
 * decision and replaced at the next change. Given no run directory, the
 * decisions are kept in memory alone.
 */
export class DecisionStore {
  private nextId = 1;
  private readonly workItems = new Map<number, Decision[]>();
  private readonly file: string | undefined;

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    try {
      const value: unknown = JSON.parse(readFileSync(this.file, "utf8"));
      if (!isWritten(value)) return;
      this.nextId = value.nextId;
      for (const [workItemId, decisions] of Object.entries(value.workItems)) this.workItems.set(Number(workItemId), decisions.map(decisionOf));
    } catch {
      // No daemon has written here, or the file is not ours.
    }
  }

  /** A work item's decisions in the order they were recorded, each a copy, and none for a work item the store holds nothing of. */
  of(workItemId: number): Decision[] {
    return (this.workItems.get(workItemId) ?? []).map(decisionOf);
  }

  /** Records a decision for a work item at the time given, under the next id, and gives a copy of it. It is held before it is written, so a write that throws leaves the daemon with the decision in memory. */
  record(workItemId: number, { kind, says, grounds }: Pick<Decision, "kind" | "says" | "grounds">, at: number): Decision {
    const decision: Decision = { id: this.nextId++, kind, says, grounds, at, reversed: null };
    this.workItems.set(workItemId, [...(this.workItems.get(workItemId) ?? []), decision]);
    this.write();
    return decisionOf(decision);
  }

  /** Reverses a decision of a work item with the message and the time given, and gives a copy of it. It gives nothing, and changes nothing, where the work item holds no such decision or the decision is reversed already. A reversal is held before it is written, as a decision is. */
  reverse(workItemId: number, decisionId: number, message: string, at: number): Decision | undefined {
    const decision = this.workItems.get(workItemId)?.find((held) => held.id === decisionId);
    if (!decision || decision.reversed !== null) return undefined;
    decision.reversed = { at, message };
    this.write();
    return decisionOf(decision);
  }

  /** Takes the decisions of the work items given out of the store, held before written as a decision is. Where it holds none of them, nothing is written. */
  drop(workItemIds: Iterable<number>): void {
    let dropped = false;
    for (const workItemId of workItemIds) dropped = this.workItems.delete(workItemId) || dropped;
    if (dropped) this.write();
  }

  private write(): void {
    if (this.file === undefined) return;
    const written: Written = { nextId: this.nextId, workItems: Object.fromEntries(this.workItems) };
    // A daemon that starts meanwhile never reads a half-written file, and a write that fails removes its partial file.
    writeWholeFile(this.file, JSON.stringify(written));
  }
}
