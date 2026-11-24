import { describe, expect, it } from "vitest";
import { agentSaid } from "../src/daemon/agent-events";

describe("agentSaid", () => {
  it("reads the tool's name of a Claude Code permission request, and no text", () => {
    expect(agentSaid("PermissionRequest", { tool_name: "Bash", tool_input: { command: "ls" }, message: "not read here", last_assistant_message: "nor this" })).toEqual({ text: null, tool: "Bash", questions: null });
  });

  it("reads the last message of a Claude Code turn's end, and no tool", () => {
    expect(agentSaid("Stop", { last_assistant_message: "The form is in src/form.ts.", tool_name: "Bash", message: "not read here" })).toEqual({ text: "The form is in src/form.ts.", tool: null, questions: null });
  });

  it("reads the message of a Claude Code notification where it is text, and no tool", () => {
    expect(agentSaid("Notification", { message: "Claude needs your permission to use Bash", tool_name: "Bash", last_assistant_message: "not read here" })).toEqual({ text: "Claude needs your permission to use Bash", tool: null, questions: null });
    expect(agentSaid("Notification", { message: { text: "an object" } })).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("Notification", {})).toEqual({ text: null, tool: null, questions: null });
  });

  it("reads neither where the event carries none, or carries one that is not text or holds no letter", () => {
    expect(agentSaid("PermissionRequest", {})).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("PermissionRequest", { tool_name: 7 })).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("PermissionRequest", { tool_name: " " })).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("Stop", {})).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("Stop", { last_assistant_message: 7 })).toEqual({ text: null, tool: null, questions: null });
    expect(agentSaid("Stop", { last_assistant_message: " \n" })).toEqual({ text: null, tool: null, questions: null });
  });

  it("reads neither from any other event, though it carries a tool's name or a message", () => {
    for (const hook of ["SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse", "PostToolUseFailure", "SubagentStop", "toString"]) {
      expect(agentSaid(hook, { tool_name: "Bash", message: "m", last_assistant_message: "l" })).toEqual({ text: null, tool: null, questions: null });
    }
  });

  /** A call of Claude Code's question tool as its hooks carry it: two questions, the first with two options, the second taking more than one. */
  const ASKING = {
    tool_name: "AskUserQuestion",
    tool_input: {
      questions: [
        {
          question: "Which library formats the dates?",
          header: "Dates",
          multiSelect: false,
          options: [
            { label: "date-fns", description: "Small functions, one import each." },
            { label: "dayjs", description: "One object, with plugins.", preview: "not read" },
          ],
        },
        { question: "Which checks run before a commit?", header: "Checks", multiSelect: true, options: [{ label: "Lint", description: "" }, { label: "Types", description: "tsc --noEmit" }] },
      ],
    },
  };
  const ASKED = [
    {
      asks: "Which library formats the dates?",
      options: [
        { label: "date-fns", implies: "Small functions, one import each." },
        { label: "dayjs", implies: "One object, with plugins." },
      ],
      multiple: false,
    },
    { asks: "Which checks run before a commit?", options: [{ label: "Lint", implies: "" }, { label: "Types", implies: "tsc --noEmit" }], multiple: true },
  ];

  it("reads the questions a call of Claude Code's question tool asks, from its start and from its permission request, with the first question as the text", () => {
    expect(agentSaid("PreToolUse", ASKING)).toEqual({ text: "Which library formats the dates?", tool: null, questions: ASKED });
    expect(agentSaid("PermissionRequest", ASKING)).toEqual({ text: "Which library formats the dates?", tool: "AskUserQuestion", questions: ASKED });
  });

  it("reads no question from a call of another tool, from an input that holds none, or from another event of the question tool", () => {
    const none = { text: null, tool: null, questions: null };
    expect(agentSaid("PreToolUse", { ...ASKING, tool_name: "Bash" })).toEqual(none);
    expect(agentSaid("PermissionRequest", { ...ASKING, tool_name: "Bash" })).toEqual({ ...none, tool: "Bash" });
    expect(agentSaid("PreToolUse", { tool_input: ASKING.tool_input })).toEqual(none);
    for (const tool_input of [undefined, null, "questions", [ASKING.tool_input], {}, { questions: "Which?" }, { questions: {} }, { questions: [] }, { questions: [null, 7, "Which?", { question: 7 }, { question: " \n", options: [{ label: "a", description: "b" }] }, { options: [] }] }]) {
      expect(agentSaid("PreToolUse", { tool_name: "AskUserQuestion", tool_input }), JSON.stringify(tool_input)).toEqual(none);
      expect(agentSaid("PermissionRequest", { tool_name: "AskUserQuestion", tool_input }), JSON.stringify(tool_input)).toEqual({ ...none, tool: "AskUserQuestion" });
    }
    for (const hook of ["PostToolUse", "PostToolUseFailure", "Notification", "Stop", "UserPromptSubmit"]) {
      expect(agentSaid(hook, ASKING).questions, hook).toBeNull();
    }
  });

  it("leaves out a question with no text and an option with no label, reads a description that is no text as empty and more than one choice only where it is said to be, and keeps 8 questions of 8 options at most", () => {
    const questions = [
      { header: "No text" },
      { question: "Which base?", options: [{ description: "no label" }, { label: " ", description: "an empty label" }, { label: 7 }, null, "main", { label: "main", description: 7 }, { label: "dev" }], multiSelect: "true" },
      { question: "Which order?", options: "none", multiSelect: 1 },
      { question: "Which name?" },
    ];
    expect(agentSaid("PreToolUse", { tool_name: "AskUserQuestion", tool_input: { questions } }).questions).toEqual([
      { asks: "Which base?", options: [{ label: "main", implies: "" }, { label: "dev", implies: "" }], multiple: false },
      { asks: "Which order?", options: [], multiple: false },
      { asks: "Which name?", options: [], multiple: false },
    ]);
    const nine = Array.from({ length: 9 }, (_, at) => ({ question: `Question ${at + 1}?`, options: Array.from({ length: 9 }, (_, of) => ({ label: `Choice ${of + 1}`, description: "" })) }));
    const kept = agentSaid("PreToolUse", { tool_name: "AskUserQuestion", tool_input: { questions: [{ header: "No text" }, ...nine] } }).questions ?? [];
    expect(kept.map(({ asks }) => asks)).toEqual(nine.slice(0, 8).map(({ question }) => question));
    expect(kept.map(({ options }) => options.map(({ label }) => label))).toEqual(Array.from({ length: 8 }, () => Array.from({ length: 8 }, (_, of) => `Choice ${of + 1}`)));
  });
});
