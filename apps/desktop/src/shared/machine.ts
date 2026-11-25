// The caps the daemon keeps on the machine it runs on: how each proposal is
// worked out from what the daemon read of the machine and what it measured
// there, the sentence that states each proposal with its numbers, and which
// value a person may set. The daemon and the window read the same functions.
import type { Cap, HeavyRan, Machine, MachineReading, PlanDisk } from "./protocol";

export const MIB = 1024 ** 2;
export const GIB = 1024 ** 3;

/** What one agent's own process is taken to use until the daemon has measured `AGENTS_MEASURED_FIRST` agents on this machine: the high end of the range docs/architecture.md states. */
export const AGENT_BYTES_UNMEASURED = 679 * MIB;

/** How many agents the daemon measures on this machine before their own memory replaces `AGENT_BYTES_UNMEASURED`. */
export const AGENTS_MEASURED_FIRST = 5;

/** The disk the worktree cap leaves free, in the decimal gigabytes a disk is sold and shown in. */
export const KEEP_FREE_BYTES = 10_000_000_000;

/** The most panes a view shows side by side: Chromium's default limit of GPU terminals. */
export const PANES_MOST = 16;

/** The panes a view shows side by side where the daemon keeps no cap: the count the four-terminal reference scene is measured at. */
export const PANES_WITHOUT_CAP = 4;

/** Each cap's name in a sentence, and on its row of the Machine dialog. */
export const CAP_NAMES: Record<Cap, { label: string; inSentence: string }> = {
  agents: { label: "Agents at once", inSentence: "agents at once" },
  worktrees: { label: "Worktrees", inSentence: "worktrees" },
  panes: { label: "Panes side by side", inSentence: "panes side by side" },
  heavyCommands: { label: "Heavy commands at once", inSentence: "heavy commands at once" },
};

/** The cores and the memory one heavy command is given by the proposal of the limit on heavy commands. */
export const HEAVY_CORES = 8;
export const HEAVY_BYTES = 16 * GIB;

/**
 * The proposal of the limit on heavy commands that hold a turn at once: one
 * for each 8 cores or one for each 16 GiB of memory, whichever gives fewer,
 * and never under 1. One run of a suite takes most of a machine's cores, so
 * a Mac of 10 to 12 cores runs one at a time.
 */
export function heavyProposal(reading: MachineReading): Pick<Machine["heavy"], "proposed" | "byCores" | "byMemory"> {
  const byCores = Math.floor(reading.cores / HEAVY_CORES);
  const byMemory = Math.floor(reading.memoryBytes / HEAVY_BYTES);
  return { proposed: Math.max(1, Math.min(byCores, byMemory)), byCores, byMemory };
}

/** The sentence that states the proposal of the limit on heavy commands with the two numbers it came from. */
export function heavySays(heavy: Pick<Machine["heavy"], "proposed" | "byCores" | "byMemory">): string {
  const cores = `one for each ${String(HEAVY_CORES)} cores`;
  const memory = `one for each ${memoryWords(HEAVY_BYTES)}`;
  if (Math.min(heavy.byCores, heavy.byMemory) < 1) return `The default is 1, the least it can be: ${cores} gives ${String(heavy.byCores)}, and ${memory} gives ${String(heavy.byMemory)}.`;
  if (heavy.byCores === heavy.byMemory) return `The default is ${String(heavy.proposed)}: ${cores} and ${memory} both give ${String(heavy.proposed)}.`;
  return `The default is ${String(heavy.proposed)}: ${cores} gives ${String(heavy.byCores)}, ${memory} gives ${String(heavy.byMemory)}, and the fewer is taken.`;
}

/** What one heavy command of one repository took, as the Machine dialog's line under its name says it. */
export function heavyRanSays(ran: HeavyRan, longest: string): string {
  const memory = ran.mostMemory === null ? "not read" : memoryWords(ran.mostMemory);
  const load = ran.highestLoad === null ? "not read" : trimmed(ran.highestLoad);
  return `${counted(ran.runs, "run")} · longest ${longest} · most memory ${memory} · highest load ${load}`;
}

/**
 * The proposal of the cap on agents: the smaller of the performance cores and
 * half of the memory divided by what one agent uses, and never under 1. One
 * agent uses `AGENT_BYTES_UNMEASURED` until `AGENTS_MEASURED_FIRST` agents
 * were measured, and then the highest of what was measured, which is the
 * last agents the daemon keeps measures of, in bytes.
 */
export function agentsProposal(reading: MachineReading, measured: readonly number[]): Pick<Machine["agents"], "proposed" | "byCores" | "byMemory" | "perAgentBytes" | "measured"> {
  const perAgentBytes = measured.length >= AGENTS_MEASURED_FIRST ? Math.max(...measured) : AGENT_BYTES_UNMEASURED;
  const byCores = reading.performanceCores;
  const byMemory = Math.floor(reading.memoryBytes / 2 / perAgentBytes);
  return { proposed: Math.max(1, Math.min(byCores, byMemory)), byCores, byMemory, perAgentBytes, measured: measured.length };
}

/** The proposal of the cap on panes side by side: 4 under 16 GB of memory, 6 from 16 GB and 8 from 32 GB. */
export function panesProposal(reading: MachineReading): number {
  if (reading.memoryBytes >= 32 * GIB) return 8;
  if (reading.memoryBytes >= 16 * GIB) return 6;
  return 4;
}

/**
 * The proposal of the cap on worktrees: the worktrees that stand, and as many
 * more as the free disk less `KEEP_FREE_BYTES` holds at the size of the
 * largest worktree measured on this machine. Nothing until one is measured,
 * and nothing where the disk was not read.
 */
export function worktreesProposal(reading: MachineReading, standing: number, perWorktreeBytes: number | null): number | null {
  if (perWorktreeBytes === null || reading.disk === null) return null;
  return standing + more(reading.disk.freeBytes, perWorktreeBytes);
}

/** How many more worktrees of that size the free disk holds with `KEEP_FREE_BYTES` kept free. */
function more(freeBytes: number, perWorktreeBytes: number): number {
  return Math.max(0, Math.floor((freeBytes - KEEP_FREE_BYTES) / perWorktreeBytes));
}

/** A count with its noun, the noun in the plural where the count is not 1. */
function counted(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

/** Memory as the Mac names it: binary gigabytes, whole where they are whole. */
function memoryWords(bytes: number): string {
  return `${trimmed(bytes / GIB)} GB`;
}

/** A disk's bytes as the Finder names them: decimal gigabytes, to one place. */
function diskWords(bytes: number): string {
  return `${trimmed(bytes / 1e9)} GB`;
}

/** A number to one place, without a place that is 0. */
function trimmed(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/** The cores the agent cap reads: the performance cores where macOS gave fewer than all the cores, and the cores otherwise. */
function coreWords(reading: MachineReading): string {
  return reading.performanceCores < reading.cores ? "performance cores" : "cores";
}

/** The sentence that states the proposal of the cap on agents with the numbers it came from, and which of the two is the cap. */
export function agentsSays(reading: MachineReading, agents: Pick<Machine["agents"], "proposed" | "byCores" | "byMemory" | "perAgentBytes" | "measured">): string {
  const basis =
    agents.measured >= AGENTS_MEASURED_FIRST ? `the highest of the last ${counted(agents.measured, "agent")} measured here` : agents.measured === 0 ? "not measured on this Mac yet" : `not measured on this Mac yet: ${counted(agents.measured, "agent")} of the ${String(AGENTS_MEASURED_FIRST)} it takes`;
  const each = `${String(Math.round(agents.perAgentBytes / MIB))} MB an agent (${basis})`;
  const half = `half of ${memoryWords(reading.memoryBytes)}`;
  const cores = `the ${String(agents.byCores)} ${coreWords(reading)}`;
  if (agents.byMemory === 0) return `The default is ${String(agents.proposed)}, the least it can be: ${half} holds no agent at ${each}.`;
  const memory = `the ${String(agents.byMemory)} that ${half} holds at ${each}`;
  if (agents.byMemory < agents.byCores) return `The default is ${String(agents.proposed)}: ${memory}, fewer than ${cores}.`;
  return `The default is ${String(agents.proposed)}: ${cores}, ${agents.byCores === agents.byMemory ? "as many as" : "fewer than"} ${memory}.`;
}

/** The sentence that states the proposal of the cap on panes side by side. */
export function panesSays(reading: MachineReading, proposed: number): string {
  return `The default is ${String(proposed)}, for ${memoryWords(reading.memoryBytes)} of memory: 4 under 16 GB, 6 from 16 GB and 8 from 32 GB.`;
}

/** The sentence that states the proposal of the cap on worktrees, or why there is none. */
export function worktreesSays(reading: MachineReading, worktrees: Pick<Machine["worktrees"], "proposed" | "standing" | "perWorktreeBytes">): string {
  if (worktrees.perWorktreeBytes === null) return "Nothing is proposed until a worktree is measured on this Mac.";
  if (reading.disk === null || worktrees.proposed === null) return "Nothing is proposed: the disk of the worktrees' folder could not be read.";
  return `The default is ${String(worktrees.proposed)}: the ${String(worktrees.standing)} that stand, and ${String(more(reading.disk.freeBytes, worktrees.perWorktreeBytes))} more that ${diskWords(reading.disk.freeBytes)} free holds at ${String(Math.round(worktrees.perWorktreeBytes / 1e6))} MB a worktree, with ${diskWords(KEEP_FREE_BYTES)} kept free.`;
}

/**
 * What the form warns of under its plan, or nothing: that the disk may not
 * hold the worktree, where the free disk less what a worktree of the
 * repository needs falls under what is kept free, and that the worktrees are
 * at their cap, where as many stand as the cap or more. A person may know
 * what they are about to remove, so neither refuses the creation.
 */
export function planWarning(disk: PlanDisk): string {
  const room = disk.needsBytes !== null && disk.freeBytes - disk.needsBytes < disk.keepFreeBytes ? `The disk may not hold this worktree: ${diskWords(disk.freeBytes)} free, ${diskWords(disk.keepFreeBytes)} kept free, and a worktree of this repository takes ${String(Math.round(disk.needsBytes / 1e6))} MB.` : null;
  const cap = disk.cap !== null && disk.standing >= disk.cap ? `This is worktree ${String(disk.standing + 1)} of a cap of ${String(disk.cap)}.` : null;
  return [room, cap].filter((sentence) => sentence !== null).join(" ");
}

/** What the daemon read of the machine, in one sentence. */
export function readingSays(reading: MachineReading): string {
  const cores = reading.performanceCores < reading.cores ? `${String(reading.cores)} cores of which ${String(reading.performanceCores)} are performance cores` : `${String(reading.cores)} cores`;
  const disk = reading.disk === null ? "the worktrees' disk not read" : `${diskWords(reading.disk.freeBytes)} free of ${diskWords(reading.disk.totalBytes)} on the worktrees' disk`;
  return `${memoryWords(reading.memoryBytes)} of memory, ${cores}, a load of ${trimmed(reading.load)}, and ${disk}.`;
}

/** Why the daemon refuses a value a person gives a cap, or null where it takes it: a whole number from 1, for the panes to `PANES_MOST`, and for the limit on heavy commands to the machine's cores where `cores` gives them. */
export function capRefusal(cap: Cap, value: unknown, cores?: number): string | null {
  const most = cap === "panes" ? PANES_MOST : cap === "heavyCommands" && cores !== undefined ? cores : Number.POSITIVE_INFINITY;
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= most) return null;
  const bound = Number.isFinite(most) ? ` to ${String(most)}` : "";
  return `The ${cap === "heavyCommands" ? "limit" : "cap"} on ${CAP_NAMES[cap].inSentence} is a whole number from 1${bound}.`;
}
