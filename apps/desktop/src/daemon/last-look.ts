import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AskedQuestion, Changes, CommitInfo, Decision, FileChange, Look, PermissionAsk, Question, Seal, SessionInfo, Unread, WorkItem } from "../shared/protocol";
import { chainOf, isChain } from "./chain";
import { isPullRequest, pullRequestOf } from "./github";
import { writeWholeFile } from "./whole-file";
import { isWorktreeSetup, setupOf } from "./worktree-setup";

const FILE = "last-look.json";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isTextOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";
const isNumberOrNull = (value: unknown): value is number | null => value === null || typeof value === "number";

/** The fields of a session that came after the first look was written: `stateQuestions`, which came with the questions an agent asks. A look written by a build before it does not hold it, and it is read as `lookOf` reads an absent one. */
type SessionCameLater = "stateQuestions";
/** A session as a look's file holds one: every field of the protocol's, the ones that came later absent or of the protocol's type. */
type WrittenSession = Omit<SessionInfo, SessionCameLater> & Partial<Pick<SessionInfo, SessionCameLater>>;

function isAskedQuestion(value: unknown): value is AskedQuestion {
  return isRecord(value) && typeof value.asks === "string" && Array.isArray(value.options) && value.options.every(isOption) && typeof value.multiple === "boolean";
}

function isSession(value: unknown): value is WrittenSession {
  const session = value as Partial<SessionInfo> | null;
  return (
    typeof session === "object" &&
    session !== null &&
    typeof session.id === "number" &&
    typeof session.kind === "string" &&
    typeof session.alive === "boolean" &&
    (session.workItemId === null || typeof session.workItemId === "number") &&
    (session.state === null || session.state === "working" || session.state === "waiting" || session.state === "finished") &&
    isNumberOrNull(session.stateSince) &&
    isTextOrNull(session.stateText) &&
    isTextOrNull(session.stateTool) &&
    (session.stateQuestions === undefined || session.stateQuestions === null || (Array.isArray(session.stateQuestions) && session.stateQuestions.every(isAskedQuestion)))
  );
}

function isCommit(value: unknown): value is CommitInfo {
  return isRecord(value) && typeof value.hash === "string" && typeof value.subject === "string" && typeof value.at === "number" && isNumberOrNull(value.added) && isNumberOrNull(value.removed);
}

function isFileChange(value: unknown): value is FileChange {
  return isRecord(value) && typeof value.path === "string" && isNumberOrNull(value.added) && isNumberOrNull(value.removed);
}

function isChanges(value: unknown): value is Changes {
  return isRecord(value) && typeof value.files === "number" && typeof value.added === "number" && typeof value.removed === "number" && Array.isArray(value.list) && value.list.every(isFileChange);
}

function isPermissionAsk(value: unknown): value is PermissionAsk {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.headlessId === "number" &&
    typeof value.tool === "string" &&
    (value.action === "read" || value.action === "write" || value.action === "run" || value.action === "other") &&
    typeof value.text === "string" &&
    typeof value.at === "number"
  );
}

function isDecision(value: unknown): value is Decision {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    (value.kind === "route" || value.kind === "default" || value.kind === "scope" || value.kind === "answered") &&
    typeof value.says === "string" &&
    typeof value.grounds === "string" &&
    isTextOrNull(value.by) &&
    (value.state === "decided" || value.state === "reversed" || value.state === "applied" || value.state === "carried") &&
    isTextOrNull(value.reversal) &&
    isTextOrNull(value.landed) &&
    isNumberOrNull(value.since)
  );
}

function isOption(value: unknown): value is Question["options"][number] {
  return isRecord(value) && typeof value.label === "string" && typeof value.implies === "string";
}

function isQuestion(value: unknown): value is Question {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.asks === "string" &&
    typeof value.grounds === "string" &&
    isTextOrNull(value.by) &&
    Array.isArray(value.options) &&
    value.options.every(isOption) &&
    isTextOrNull(value.default) &&
    isTextOrNull(value.answer) &&
    isNumberOrNull(value.since)
  );
}

function isUnread(value: unknown): value is Unread {
  return isRecord(value) && typeof value.line === "number" && typeof value.why === "string";
}

function isSeal(value: unknown): value is Seal {
  return isRecord(value) && (value.state === "sealed" || value.state === "broken") && typeof value.commit === "string" && isTextOrNull(value.why);
}

/** The fields of a work item that came after the first look was written: the ones that came with the repositories, `setup`, which came with the worktree's setup, and `decisions`, `questions` and `unread`, which came with the work item's record, `permissions`, which came with the permission requests, `behindBase`, which came with the count behind the base, `chain`, which came with the chain, `pullRequest`, which came with the pull request stage, and `seal`, which came with the seal reading the look keeps. A look written by a build before one of them does not hold it, and each is read as `lookOf` reads an absent one. */
type CameLater = "repoId" | "pinned" | "muted" | "groupId" | "archivedAt" | "setup" | "decisions" | "questions" | "unread" | "permissions" | "behindBase" | "chain" | "pullRequest" | "seal";
/** A work item as a look's file holds one: every field of the protocol's, the ones that came later absent or of the protocol's type. */
type WrittenWorkItem = Omit<WorkItem, CameLater> & Partial<Pick<WorkItem, CameLater>>;

function isWorkItem(value: unknown): value is WrittenWorkItem {
  const item = value as Partial<WorkItem> | null;
  return (
    typeof item === "object" &&
    item !== null &&
    typeof item.id === "number" &&
    typeof item.title === "string" &&
    typeof item.repo === "string" &&
    (typeof item.branch === "string" || item.branch === null) &&
    typeof item.worktree === "string" &&
    typeof item.createdAt === "number" &&
    typeof item.repoName === "string" &&
    isTextOrNull(item.baseCommit) &&
    isTextOrNull(item.baseBranch) &&
    isNumberOrNull(item.aheadOfBase) &&
    (item.behindBase === undefined || isNumberOrNull(item.behindBase)) &&
    isNumberOrNull(item.newCommits) &&
    (item.commits === null || (Array.isArray(item.commits) && item.commits.every(isCommit))) &&
    (item.changes === null || isChanges(item.changes)) &&
    (item.repoId === undefined || typeof item.repoId === "number") &&
    (item.pinned === undefined || typeof item.pinned === "boolean") &&
    (item.muted === undefined || typeof item.muted === "boolean") &&
    (item.groupId === undefined || isNumberOrNull(item.groupId)) &&
    (item.archivedAt === undefined || isNumberOrNull(item.archivedAt)) &&
    (item.setup === undefined || item.setup === null || isWorktreeSetup(item.setup)) &&
    (item.decisions === undefined || (Array.isArray(item.decisions) && item.decisions.every(isDecision))) &&
    (item.questions === undefined || (Array.isArray(item.questions) && item.questions.every(isQuestion))) &&
    (item.unread === undefined || (Array.isArray(item.unread) && item.unread.every(isUnread))) &&
    (item.permissions === undefined || (Array.isArray(item.permissions) && item.permissions.every(isPermissionAsk))) &&
    (item.chain === undefined || item.chain === null || isChain(item.chain)) &&
    (item.pullRequest === undefined || item.pullRequest === null || isPullRequest(item.pullRequest)) &&
    (item.seal === undefined || item.seal === null || isSeal(item.seal))
  );
}

function isLook(value: unknown): value is { at: number; sessions: WrittenSession[]; workItems: WrittenWorkItem[] } {
  const look = value as Partial<Look> | null;
  return typeof look === "object" && look !== null && typeof look.at === "number" && Array.isArray(look.sessions) && look.sessions.every(isSession) && Array.isArray(look.workItems) && look.workItems.every(isWorkItem);
}

/**
 * Only the fields of a look, each entry a copy, a session's questions with
 * their choices, and a work item's commits, its changes, its decisions, its
 * questions and what the reader did not read of its record among it: what
 * the lists or a file's entries carry beyond them, or become afterwards, is
 * not the look's. A session without a field that came later is read with no
 * question. A work item without a field that came later
 * gets that field's empty value: the id 0, which no repository bears, no
 * pin, no mute, no group, no archive, no setup, no decision, no question,
 * nothing unread, no permission request, no count behind the base, no chain and no pull request. A work item's seal reading is kept as the
 * lists carried it: a seal with its state, its sealed commit and its
 * sentence, a null as null, and an absent `seal` left out, so a look tells
 * a head the daemon read and found no seal at from one it had not read. The decisions and the questions a look holds, each under its work
 * item's id with its id and its state, are what the person has seen of the
 * work item's record.
 */
function lookOf(at: number, sessions: readonly WrittenSession[], workItems: readonly WrittenWorkItem[]): Look {
  return {
    at,
    sessions: sessions.map(({ id, kind, alive, workItemId, state, stateSince, stateText, stateTool, stateQuestions }) => ({
      id,
      kind,
      alive,
      workItemId,
      state,
      stateSince,
      stateText,
      stateTool,
      stateQuestions: stateQuestions ? stateQuestions.map(({ asks, options, multiple }) => ({ asks, options: options.map(({ label, implies }) => ({ label, implies })), multiple })) : null,
    })),
    workItems: workItems.map(({ id, title, repoId, repo, repoName, branch, worktree, createdAt, baseCommit, baseBranch, aheadOfBase, behindBase, newCommits, commits, changes, pinned, muted, groupId, archivedAt, setup, decisions, questions, unread, permissions, chain, pullRequest, seal }) => ({
      id,
      title,
      repoId: repoId ?? 0,
      repo,
      repoName,
      branch,
      worktree,
      createdAt,
      baseCommit,
      baseBranch,
      aheadOfBase,
      behindBase: behindBase ?? null,
      newCommits,
      commits: commits && commits.map(({ hash, subject, at, added, removed }) => ({ hash, subject, at, added, removed })),
      changes: changes && { files: changes.files, added: changes.added, removed: changes.removed, list: changes.list.map(({ path, added, removed }) => ({ path, added, removed })) },
      pinned: pinned ?? false,
      muted: muted ?? false,
      groupId: groupId ?? null,
      archivedAt: archivedAt ?? null,
      setup: setup ? setupOf(setup) : null,
      decisions: (decisions ?? []).map(({ id, kind, says, grounds, by, state, reversal, landed, since }) => ({ id, kind, says, grounds, by, state, reversal, landed, since })),
      questions: (questions ?? []).map(({ id, asks, grounds, by, options, default: taken, answer, since }) => ({ id, asks, grounds, by, options: options.map(({ label, implies }) => ({ label, implies })), default: taken, answer, since })),
      unread: (unread ?? []).map(({ line, why }) => ({ line, why })),
      permissions: (permissions ?? []).map(({ id, headlessId, tool, action, text, at }) => ({ id, headlessId, tool, action, text, at })),
      chain: chain ? chainOf(chain) : null,
      pullRequest: pullRequest ? pullRequestOf(pullRequest) : null,
      ...(seal === undefined ? {} : { seal: seal && { state: seal.state, commit: seal.commit, why: seal.why } }),
    })),
  };
}

/**
 * The daemon's record of when a person last looked: the time, and the
 * sessions and the work items as they were listed then. It is one record,
 * which a later look replaces. Like the repositories it is the daemon's
 * state: it lives in `last-look.json` in the run directory, readable by the
 * user alone, and is read at start, so the look outlives the daemon. A file
 * whose entries lack a field of the protocol's, as one a build before that
 * field wrote, is no look, but for the fields of a work item that came with
 * the repositories, for its setup, for its `decisions`, its `questions` and
 * its `unread`, and for its `permissions`, and for a session's
 * `stateQuestions`: a look without one of them is read with it at its empty value.
 * A work item without a `seal` is read without it.
 * Given no run directory, the look is kept in memory alone.
 */
export class LastLook {
  private look: Look | null = null;
  private readonly file: string | undefined;

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    try {
      const value: unknown = JSON.parse(readFileSync(this.file, "utf8"));
      if (isLook(value)) this.look = lookOf(value.at, value.sessions, value.workItems);
    } catch {
      // No daemon has written here, or the file is not ours.
    }
  }

  /** The look last recorded, or null where none ever was. */
  get(): Look | null {
    return this.look;
  }

  /** Replaces the look. It is held before it is written, so a write that throws leaves the daemon with the look in memory. */
  record(at: number, sessions: readonly SessionInfo[], workItems: readonly WorkItem[]): void {
    this.look = lookOf(at, sessions, workItems);
    if (this.file === undefined) return;
    // A daemon that starts meanwhile never reads a half-written file, and a write that fails removes its partial file.
    writeWholeFile(this.file, JSON.stringify(this.look));
  }
}
