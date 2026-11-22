Part of #39. The issue closes when `release/v0.0.2` reaches `main`.

Every headless session was launched with the same tools, and a call that needed permission was answered by nobody: Claude Code refused it inside the session, and the window said nothing of it.

| Done when | What holds now |
|---|---|
| The daemon sets the tools and the permission mode for each role at launch, and a proofer or sealer session that tries to edit a source file is refused, shown by a run | A crafter at a fix pass holds `Read`, `Glob`, `Grep`, `Bash`, `Edit` and `Write`; a proofer and a sealer hold `Read`, `Glob`, `Grep` and `Bash`. Every headless session runs in the mode `default` with `--permission-prompt-tool stdio`. A real proofer session on Claude Code 2.1.330, asked to run `printf x >> README.md`, was refused, and the file kept its bytes |
| A role session's permission request reaches the daemon in the adapter's neutral shape, and the daemon answers it by a stated rule or passes it to the person | The daemon allows a crafter's write inside the work item's worktree, by every reading of the path, and its commands. It refuses a write anywhere else, each command of a proofer or a sealer that asks, and every other request of a role session, and tells the agent why. A session with no role passes its calls to the person |
| A request passed to the person shows on the work item's line as waiting, and the notification arrives | The line stands under "Needs you" and says "Asks to use Bash: pnpm test", with "(and 1 more)" where more wait; a question the work item is parked with comes first. A notification titled with the work item says "Needs you", one for each new call. The view's card holds the whole call, "Allow" and "Refuse", reached by Tab and kept on its button across the window's redraws |
| No launch uses an option that skips permission checks | None does |
| The fake adapter raises a permission request, and the suite runs both answers | It does, and the cases run "Allow" and "Refuse" |
| The adapter's feature list names what it supports, and no protocol field names a vendor | The two features are declared; `permissions` and `answerPermission` name no vendor |

A call nobody answers ends with its session: where it finishes, fails, is stopped, reaches its 60-minute limit, or its work item is archived or deleted. The daemon keeps no request across its own restart.

`docs/design.md` and its Korean edition gain the row "A call a headless session asks the person to allow" under *Components and their states*, committed before the code that draws it. To show a request's line whole, the screenshot scene gives that work item no decision and a setup that succeeds; the scene that shows both marks, a decision record and a failed setup is carried to #157.

### Screenshots

A headless session's call waiting for the person, on the inbox line and in the work item's view:

![Night watch dark, the inbox](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/night-watch-dark-inbox.png?raw=true)
![Night watch dark, the work item's view](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/night-watch-dark-view.png?raw=true)
![Night watch light, the inbox](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/night-watch-light-inbox.png?raw=true)
![Night watch light, the work item's view](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/night-watch-light-view.png?raw=true)
![Register dark, the inbox](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/register-dark-inbox.png?raw=true)
![Register dark, the work item's view](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/register-dark-view.png?raw=true)
![Register light, the inbox](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/register-light-inbox.png?raw=true)
![Register light, the work item's view](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/register-light-view.png?raw=true)
![Desk dark, the inbox](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/desk-dark-inbox.png?raw=true)
![Desk dark, the work item's view](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/desk-dark-view.png?raw=true)
![Desk light, the inbox](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/desk-light-inbox.png?raw=true)
![Desk light, the work item's view](../blob/f4f871b2e275734d83c51a34e0c88154eac18cf3/seal/threads/1795338000-role-tools-and-permissions/screenshots/desk-light-view.png?raw=true)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
