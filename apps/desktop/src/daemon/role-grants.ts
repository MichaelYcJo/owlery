// What each role may do at its stage, in no vendor's words: the grants stand
// here alone, and each adapter reads a role's grant to give its session the
// tools that fit it (docs/architecture.md, "What changes because Owlery is not
// a plugin", the row "Each party judges only its own subject").
import type { RoleStage } from "../shared/protocol";

/** What a role may do at a stage: where it may write a file, and whether a command of its session that asks permission is allowed. */
export interface RoleGrant {
  writes: "worktree" | "nowhere";
  runs: boolean;
}

/** A pair of the protocol as one key of a table that holds a row for each pair. */
export type PairKey = RoleStage extends infer Pair ? (Pair extends { role: infer Role extends string; stage: infer Stage extends string } ? `${Role} at ${Stage}` : never) : never;

/** The key of a pair. */
export function pairKey(role: RoleStage): PairKey {
  // A pair's role and stage are one of the keys together, which the type of their two unions joined cannot say.
  return `${role.role} at ${role.stage}` as PairKey;
}

/**
 * The grants. A crafter at a fix pass changes the work item's worktree. A
 * proofer at a round and a sealer at the seal judge a tree, and change
 * nothing of it.
 */
const GRANTS: Record<PairKey, RoleGrant> = {
  "proofer at round": { writes: "nowhere", runs: false },
  "crafter at fix-pass": { writes: "worktree", runs: true },
  "sealer at seal": { writes: "nowhere", runs: false },
};

/** The grant of each pair of `ROLE_STAGES`. */
export function grantOf(role: RoleStage): RoleGrant {
  return GRANTS[pairKey(role)];
}
