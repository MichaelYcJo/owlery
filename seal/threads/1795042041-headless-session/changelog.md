# Changelog: the headless session

Issue #8. Owlery could run an agent only in a terminal pane, where a person types and reads. It could not ask an agent one thing in the background and show the answer.

- **The side panel has an "Ask" section, under the inbox.** Type a prompt and press "Ask": the daemon starts one headless session, an agent run with no terminal, in the worktree of the work item whose pane is in front. The section lists each session with its prompt, its state and its answer.
- **The answer shows as it arrives.** A line reads `working` while the agent answers and `finished` once the whole answer is there, as plain text with its line breaks kept. The most recent session is first.
- **A session that fails says why.** A line reads `failed` and shows the error in place of the answer: the agent's own error, "the session exited with code N and gave no result", or why no session could start, such as a login shell that finds no `claude`.
- **"Ask" is disabled until it can ask, and its title says why.** It needs a work item's pane in front and a prompt in the field. A pane opened without a work item cannot be asked in, because a session in the home folder would read that folder's instructions.
- **Each ask runs your own `claude` once,** under your own login, so it draws on your subscription limit or API billing. Owlery finds `claude` through your login shell, as a pane does.
- **The session runs apart from your own Claude Code setup.** It loads no user or project settings, no hooks, no MCP servers and no automatic memory, and its environment holds five names alone. It reads the `CLAUDE.md` of the work item's worktree.
- **No permission check is turned off.** The session runs in the default permission mode, and Owlery passes no flag that skips permissions. A headless session cannot be asked for permission yet, so a tool call that needs one should be refused by Claude Code; no such call was run.
- **The answers live in the daemon's memory.** Every window that connects sees every session asked since the daemon started. A daemon that exits loses them, and it does not exit while a session is `working`.
- **Not yet:** stopping a session, a follow-up prompt to the same session, and answering a permission request.
- **For a client of the daemon:** `ask` with a `workItemId` and a `prompt` is answered with `asked`; `ready` carries `headless`; the daemon sends `headless` with one session whole to every client at each change. No message names the agent's vendor.
