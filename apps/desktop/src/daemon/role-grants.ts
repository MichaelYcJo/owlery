// What each role may do at its stage, in no vendor's words: the grants stand
// here alone. Each adapter reads a role's grant to give its session the tools
// that fit it, and the daemon answers a session's permission requests by the
// rule below (docs/architecture.md, "What changes because Owlery is not a
// plugin", the row "Each party judges only its own subject").
import { lstatSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { RoleStage } from "../shared/protocol";
import type { PermissionAction } from "./adapters/adapter";

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
 * proofer at a round, a sealer at the seal and the orchestrator at a
 * judgment judge a tree or its records, and change nothing of it.
 */
const GRANTS: Record<PairKey, RoleGrant> = {
  "proofer at round": { writes: "nowhere", runs: false },
  "crafter at fix-pass": { writes: "worktree", runs: true },
  "sealer at seal": { writes: "nowhere", runs: false },
  "orchestrator at judgment": { writes: "nowhere", runs: false },
};

/** The grant of each pair of `ROLE_STAGES`. */
export function grantOf(role: RoleStage): RoleGrant {
  return GRANTS[pairKey(role)];
}

/**
 * The rules a role's request is refused by, each by its name in a work
 * item's records: the role's grant writes nowhere, the write names a path
 * outside the worktree, the grant runs no command that asks, and every other
 * call.
 */
export const REFUSAL_RULES = ["no-write", "outside-worktree", "no-command", "other"] as const;

/** One of `REFUSAL_RULES`. */
export type RefusalRule = (typeof REFUSAL_RULES)[number];

/** What the daemon answers a request with: an allowance, a refusal with the reason the agent is told and the name of the rule that refused, or the person. */
export type Verdict = { answer: "allow" } | { answer: "refuse"; reason: string; rule: RefusalRule } | { answer: "person" };

/**
 * Where a path really is: the links on the part of it that exists followed,
 * and the rest, which a write would make, appended as it is written. Null
 * where that cannot be read: a link whose target is not there, a link that
 * leads back to itself, a `..` in the part that is not there, or a part the
 * system cannot read, such as a path longer than it reads, a folder that
 * cannot be searched or a file named as a folder. Only a name the system
 * says is not there counts as the part a write would make, so a path inside
 * the worktree that is written longer than the system reads is null as well.
 */
function realLocation(path: string): string | null {
  const rest: string[] = [];
  for (let existing = path; ; ) {
    try {
      // The system's own read: Node's other one settles each `..` before it follows a link.
      const real = realpathSync.native(existing);
      // A `..` in the part that is not there climbs back over names no link was followed on, so where it lands is not known.
      return rest.includes("..") ? null : join(real, ...rest);
    } catch {
      try {
        // It is there and has no real location, so a write through it lands where nothing here read.
        lstatSync(existing);
        return null;
      } catch (error) {
        // Only a name that is not there is asked of its folder. Any other error leaves the links past this part unread, so where a write lands is not known.
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") return null;
      }
    }
    const parent = dirname(existing);
    if (parent === existing) return null;
    rest.unshift(basename(existing));
    existing = parent;
  }
}

/**
 * Whether a path is inside the worktree, by where both really are. The rule
 * does not know how the agent that asks reads a path's text before it
 * writes, so the path is inside only where every reading of it is. A
 * relative path is read from the worktree. The text is read as it is
 * written, and again without the white space around it, which an agent may
 * drop. Each of the two is read as the system reads it, so a `..` after a
 * link is taken from where the link points, and again with each `..`
 * settled in the text first, as an agent that resolves the path before it
 * writes takes it. A path that opens with `~` names a home folder to such
 * an agent, the person's or another's, and a path that holds a null
 * character names what nothing here can read: both are outside. A file of
 * the worktree whose name opens with `~` is inside as `./~name`.
 */
function insideWorktree(path: string, worktree: string): boolean {
  if (path.includes("\0")) return false;
  const trimmed = path.trim();
  if (trimmed.startsWith("~")) return false;
  let root: string;
  try {
    root = realpathSync.native(worktree);
  } catch {
    return false;
  }
  return [path, trimmed].every((text) =>
    [isAbsolute(text) ? text : `${worktree}${sep}${text}`, resolve(worktree, text)].every((reading) => {
      const real = realLocation(reading);
      if (real === null) return false;
      const from = relative(root, real);
      return from !== ".." && !from.startsWith(`..${sep}`) && !isAbsolute(from);
    }),
  );
}

/**
 * The daemon's rule: the answer to a request of a session launched as `role`,
 * or with none, that works in `worktree`. A session with no role is a
 * person's own, and the person answers each of its requests. A role
 * session's request is answered by its grant and never reaches the person:
 * a write inside the place the grant names is allowed, a command is allowed
 * where the grant runs commands, and every other call is refused, with the
 * name of the rule that refused it. The rule reads no command's text: it
 * answers a command by the role alone.
 */
export function verdictOn(role: RoleStage | null, request: { action: PermissionAction; path: string | null }, worktree: string): Verdict {
  if (role === null) return { answer: "person" };
  const grant = grantOf(role);
  const refuse = (rule: RefusalRule, what: string, needed: string): Verdict => ({ answer: "refuse", reason: `${what} Do not work around it: say in your report which step needed ${needed}.`, rule });
  if (request.action === "write") {
    if (grant.writes === "nowhere") return refuse("no-write", `Owlery gives the ${role.role} no call that writes a file.`, "the write");
    // A write that names no file is no write the rule can place.
    if (request.path !== null) return insideWorktree(request.path, worktree) ? { answer: "allow" } : refuse("outside-worktree", `Owlery lets the ${role.role} write only inside the work item's worktree, and ${request.path} is outside it.`, "the write");
  }
  if (request.action === "run") return grant.runs ? { answer: "allow" } : refuse("no-command", `Owlery gives the ${role.role} no command that asks for permission.`, "the command");
  return refuse("other", `Owlery's rule for the ${role.role} does not allow this call.`, "it");
}
