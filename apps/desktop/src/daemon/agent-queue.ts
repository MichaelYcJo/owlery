// The queue of the headless sessions that wait for a place under the cap on
// agents: which of them starts next. It knows no session and no daemon, only
// what each waits as, so the order is one rule that a case reads whole and
// that a second queue of the machine can read for its shape.

/**
 * What a queued session waits as, in the order a place goes to: a stage of
 * a chain that has already run a stage since the chain started, then a
 * chain's first stage.
 */
export type QueueRank = "running-chain" | "first-stage";

const RANKS: readonly QueueRank[] = ["running-chain", "first-stage"];

/** One session in the queue: its id, what it waits as, and the order it joined in, a count that only grows, so that two that joined in the same millisecond keep their order. */
export interface Queued {
  id: number;
  rank: QueueRank;
  joined: number;
}

/** The ids of the queued sessions in the order they start: by their rank, and within a rank the one that waited longest first. */
export function queueOrder(queued: readonly Queued[]): number[] {
  return [...queued].sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank) || a.joined - b.joined).map(({ id }) => id);
}

/** How many sessions start now: as many as the places under the cap that the agents that run leave free, and none at or over it. */
export function placesFree(running: number, cap: number): number {
  return Math.max(0, cap - running);
}
