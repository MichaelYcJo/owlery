// What the stand-in for `claude` does once it has its settings file: it runs
// the command the file names for the hook `UserPromptSubmit`, with the
// hook's input on its standard input as the CLI gives it, and then waits
// for the signal that ends the pane.
const { spawnSync } = require("node:child_process");
const { readFileSync } = require("node:fs");

const settings = JSON.parse(readFileSync(process.argv[2], "utf8"));
const command = settings.hooks.UserPromptSubmit[0].hooks[0].command;
const ran = spawnSync("/bin/sh", ["-c", command], { input: JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "a stand-in's prompt" }), stdio: ["pipe", "ignore", "inherit"] });
if (ran.status !== 0) {
  console.error(`the hook exited with ${ran.status}`);
  process.exit(1);
}
console.log("the stand-in for claude is working");
setInterval(() => {}, 60_000);
