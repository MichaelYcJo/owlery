# Design: the window's own style

*English · [한국어](./design.ko.md)*

This document states how Owlery's window looks and speaks: its principles, its three themes, every value a theme draws with, the forms of its parts, the voice of its words, and what it stays clear of. A change to the window is read against it. Where the window and this document differ, one of them is wrong, and the change that finds the difference says which. [product.md](product.md) states what a theme may change, and this document states each theme.

## Principles

A change to the window holds each of these, or changes this document in the same pull request and says why.

1. **The seal is the one thing in wax.** Red stands on the seal alone. A button, a mark and a failure take another colour, so a red on the screen always says that a party independent of the builder judged this commit. The owl is drawn where a seal is, and in Night watch as the eye of the mark of a wait, and nowhere else in the window.
2. **The window reports, and does not converse.** It shows what each work item's agent did and what it needs. It draws no chat bubble, no prompt box and no mark that says a model made something: every line of the inbox is an agent's work, so such a mark would say nothing.
3. **One signal, spent on what needs the person.** Each theme has one way to say that a work item needs the person. In Night watch it is the eye's yellow, and in Register and Desk it is a filled mark in the strong ink. A hover, a selection, a search's match and the keyboard's focus are drawn in the theme's inks, and none of them takes Night watch's yellow.
4. **A state is said three times: by a shape, by a colour and by words.** No state is told from another by colour alone. In Night watch a wait and a failure share the yellow, a shade apart in the light appearance where a word on a selected line needs it darker, and differ by their shapes and their words.
5. **A theme is its tokens.** A theme changes colours, typefaces, texture, how the seal is lit, and the form of edges, rules and marks. The layout, the words, the seal's drawing, the wax's red and the one duration of motion belong to no theme. No selector of the page and no module of the renderer names a theme or an appearance.
6. **The window spends no memory on its look.** The typefaces are the system's. No theme loads a typeface, an illustration or an image behind a panel, and no theme blurs what is behind a panel.
7. **Corners are small, and a circle is for what is round.** A theme states one scale of four corners, none above 8px. A full circle draws the seal, a state's mark and the bell's dot, and never a button, a field, a chip or a picture of a person.
8. **Every form is stated here.** A line, a button, a menu and a dialog each have one form for each theme, in *Components and their states*. A change that needs a form this document does not state adds it here first, so that no work item draws its own. The pull request that draws the form writes its row, in both editions of this document, and leaves none to the release's settle: a row the settle writes arrives after the form shipped, and by then another work item may have rewritten the row it was to change.
9. **Words and marks stand apart from their ground.** Words stand at 4.5 to 1 or more against the ground under them, and at 3 to 1 where they are 24px or more, or 18.66px or more in a bold weight: the AA level of WCAG 2.2. A state's mark and the ring of the keyboard's focus stand at 3 to 1 or more against the ground around them. The ground is the one drawn there: a selected line's, and one under the pointer, as much as the window's own. A value that falls under a floor changes, in every theme, and no theme keeps a value because it had it. A ground drawn only while a part is pressed is outside these floors: it lasts as long as the press, and the part's words were read before it. A disabled button, which the window draws at 45% of its strength, is outside them too.

check: apps/desktop/test/themes.test.ts

## What every theme shares

- **The layout and its measures.** The columns, the sizes of type, the steps of space, the heights and widths of the parts, and the one duration of motion, 120ms. They stand in the page's own `:root`, and *The layout's measures* lists them. A theme holds no measure.
- **The words.** One set for every theme, in the voice *The voice of the window's words* states.
- **The seal.** Its drawing and the wax's red are AgenticSeal's. Before a seal, its place is pressed blank into the ground in the theme's own tones, and a line of the inbox ends in the seal's place.
- **The system's typefaces.** The sans for words, the fixed-width face for a branch, a commit's hash, a path, a count of lines, the text of a call a session asks to make and the terminal.
- **Red on the seal alone, and a failure that is not red.**
- **No speech mark.** No theme draws a wait as a chat bubble.
- **A dark and a light appearance.**
- **A terminal that stays dark.** The terminal draws the colours its program asks for, on a dark ground in both appearances.

## The themes

The window has three themes: Night watch, Register and Desk. A first run opens in Night watch, in the dark appearance.

- **A theme and an appearance are two choices.** The sidebar's foot holds two controls. One offers Night watch, Register and Desk. The other offers Dark, Light and Match the system, and under Match the system the appearance follows the system's while the window is open.
- **The page carries both.** `data-theme` on the page's `html` is `night-watch`, `register` or `desk`, and `data-appearance` is `dark` or `light`. `apps/desktop/src/renderer/themes.css` holds one block for each pair, and every difference between two themes is a custom property of their blocks.
- **The choice is kept.** `appearance.json` in the app's user data folder holds `{"theme": …, "appearance": …}`. A file of the earlier form, whose `theme` is `night-desk`, `letter` or `system`, is read as Night watch in the dark appearance, the light one, or the system's.

| | Night watch | Register | Desk |
|---|---|---|---|
| The idea | The window is drawn from the emblem, a white owl on black, and the owl's yellow eye is the one colour that says a work item needs the person. | The window is the register where sealed work is entered, so it is drawn as a ruled book of records, and the seal is the one thing on it that is not ink. | A warm desk at night and a sheet of letter paper: the window as it stood before it had themes, with its inks raised to the floors of *Principles*. |
| The signal | The eye's yellow, on what needs the person: a waiting mark and its words, the edge of what an agent asks, and a failure. | The strong ink for a wait, and the ochre for a failure. | The strong ink for a wait, and the ochre for a failure. |
| Type | The sans alone, and the fixed-width face for a branch and a commit. No serif: what an agent says is set in the sans. | The sans for words, and the fixed-width face for every fact a person compares down a list: a branch, a commit, an age, a count. The serif stands where Desk has it. | The sans, the fixed-width face for a branch and a commit, and the serif for what an agent says and the summary's sentence. In the light appearance the serif sets the titles too. |
| Corners | 8, 6, 6 and 4px for a card, a control, a line and a chip, in both appearances. | 2, 2, 0 and 0. | Dark 8, 6, 6 and 4px. Light 4, 5, 5 and 3px. |
| Edges and rules | A line is a tile with no edge. What an agent says is a raised card, with an edge of the signal at its left where the work item needs the person. | A rule under each line of the inbox and under each row of a list of records: a work item's commits, its changed files, its facts and the paths its setup copied or could not copy. An item of the sidebar is navigation and carries no rule. A group's head is a ruled band on the sidebar's ground. A button is drawn by its edge with no fill. What an agent says stands between two rules. The tab in front carries a rule along its top. | A line is a tile with no edge. What an agent says is a raised card. |
| Selected | A tinted tile. | A 2px rule of the strong ink at the left edge, over a faint ground. | A tinted tile. |
| Texture | None, in both appearances. | None in the dark appearance. The ruled paper in the light one's right column. | None in the dark appearance. The ruled paper in the light one's right column. |
| A state's marks | The phases of the moon, and the owl's eye. A moon is a disc filled as far as work has come, so how far work has come reads as how full the moon is. A ring with a thin filled edge at its right is asleep. A half-filled disc is at work, and it does not turn. A wholly filled disc is finished. The fill is the state's colour, so in the light appearance the filled part is the darker one, and a finished work item is a dark disc. An open eye with its pupil needs the person. A filled triangle is a failure, and in the light appearance a line of the darkened yellow stands around it, because the bright fill alone does not stand apart from the ground. | A form's boxes. A filled box needs the person. A half-filled box is at work. A ticked box is finished. An empty box is asleep. The triangle with its stroke is a failure. | A filled disc needs the person. A ring that turns is at work. A ticked circle is finished. A crescent is asleep. The triangle with its stroke is a failure. |
| The approval line | The four roles' names in a row, each after its mark and with its note under it, joined by rules. | A ruled block of four boxes, one for each of framer, crafter, proofer and sealer, each holding the mark, the role's name and the note under the name. The sealer's box holds the seal. | The four roles' names in a row, each after its mark and with its note under it, joined by short rules. |
| What it costs | Yellow is the colour most tools use for a warning, so a work item that needs the person may read as a fault. | It reads colder than Desk. The serif of what an agent says is what keeps it from reading as a spreadsheet. | It is the nearest of the three to its neighbours: a warm dark ground with cream ink, and in the light appearance a serif title. |

## Tokens

A token is a custom property the page draws with. This section is the source of every token's value, and `apps/desktop/src/renderer/themes.css` and the page's `:root` in `apps/desktop/src/renderer/index.html` follow it. A change of a value changes this document, its Korean edition and the style sheet in one commit.

check: apps/desktop/test/themes.test.ts

What the names say.

- `--scheme`: whether the system draws its own parts, a scroll bar and a list of choices among them, dark or light.
- `--font-*` and `--weight-*`: the typefaces and two weights. `--font-title` sets a title, `--font-said` what an agent says and the summary's sentence, `--font-fact` an age and a count, and `--font-terminal` the terminal.
- `--ground*` and `--texture`: the window's ground, the sidebar's, a view's right column's, a card's and a field's, and the texture over the right column.
- `--ink*` and `--rule*`: the inks from strong to faint, and the rules.
- `--hover`, `--pressed`, `--selected*`, `--line-edge*` and `--group-*`: the grounds of a line, a sidebar's item and a tab under the pointer, pressed and selected; the edge of a selected item of the sidebar; the edges of a line of the inbox at rest and selected, the first of which a row of a list of records carries too; and the ground and edge of a group's head.
- `--control*`, `--main*` and `--on-main`: a button, the main button, and the words on it.
- `--focus`, `--mark*`, `--badge*`: the ring of the keyboard's focus, the letters a search matched, and the count of new commits.
- `--state-*`, `--added`, `--removed`: a state's colour, which its mark and its words take, with the fill of the mark of a wait and of a failure, and the counts of lines added and removed.
- `--terminal-*`: the terminal's ground and ink, and the label of the tab in front.
- `--seal-*`: the tones of the seal's blank place, the light on a seal, and the light on a broken seal, which takes the wax's red out. No other token holds a red.
- `--radius-*`: the corners of a card, a control, a line, a chip, what an agent says and a search's mark.
- `--card-edge`, `--said-*`, `--backdrop`, `--dialog-shadow`, `--field-edge`, `--tab-edge`, `--dot-edge`, `--on-edge`: the edges the page draws as a shadow, the edge of an icon's button that is on, the ground and edges of what an agent says, and what stands behind and under a dialog.
- `--approval-*`: the approval line's rule that joins a role's name to the next place, the edge of its block and the edge between two of its places.
- `--shape-*`: a state's mark, as paths on a square of 16 units. For each state `--shape-<state>` is drawn as a line of 1.5px and `--shape-<state>-fill` is filled. `--shape-working-track` is the faint line under the part that turns, and `--shape-working-turn` is the part that turns. `none` draws nothing.

### The layout's measures

No theme changes these. They stand in the page's `:root`.

| Token | Value |
|---|---|
| `--size-caption` | `11px` |
| `--size-second` | `12px` |
| `--size-text` | `13px` |
| `--size-head` | `15px` |
| `--size-said` | `20px` |
| `--size-title` | `20px` |
| `--size-sentence` | `34px` |
| `--size-terminal` | `12px` |
| `--tracking-title` | `-0.01em` |
| `--weight-changed` | `650` |
| `--space-1` | `2px` |
| `--space-2` | `4px` |
| `--space-3` | `6px` |
| `--space-4` | `8px` |
| `--space-5` | `12px` |
| `--space-6` | `16px` |
| `--space-7` | `20px` |
| `--space-8` | `24px` |
| `--space-9` | `28px` |
| `--space-10` | `36px` |
| `--space-11` | `44px` |
| `--titlebar-height` | `44px` |
| `--sidebar-width` | `256px` |
| `--sidebar-line` | `28px` |
| `--icon-button` | `24px` |
| `--icon` | `16px` |
| `--control-height` | `28px` |
| `--head-height` | `52px` |
| `--tabs-height` | `34px` |
| `--strip-height` | `24px` |
| `--group-height` | `30px` |
| `--line-height` | `46px` |
| `--detail-line` | `26px` |
| `--summary-line-height` | `38px` |
| `--summary-title` | `300px` |
| `--list-width` | `404px` |
| `--facts-width` | `420px` |
| `--fact-label` | `76px` |
| `--said-height` | `260px` |
| `--dialog-width` | `460px` |
| `--menu-width` | `208px` |
| `--menu-width-most` | `340px` |
| `--line-mark` | `12px` |
| `--link-card-width` | `480px` |
| `--tab-width` | `240px` |
| `--dot` | `6px` |
| `--seal-size-line` | `18px` |
| `--seal-size` | `64px` |
| `--seal-size-large` | `112px` |
| `--motion` | `120ms` |

### Night watch

| Token | Dark | Light |
|---|---|---|
| `--scheme` | `dark` | `light` |
| `--font-ui` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, monospace` | `ui-monospace, "SF Mono", Menlo, monospace` |
| `--font-serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` |
| `--font-title` | `var(--font-ui)` | `var(--font-ui)` |
| `--font-said` | `var(--font-ui)` | `var(--font-ui)` |
| `--font-fact` | `var(--font-ui)` | `var(--font-ui)` |
| `--font-terminal` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` |
| `--weight-title` | `650` | `650` |
| `--weight-said` | `500` | `500` |
| `--ground` | `#0f0f10` | `#f3efe6` |
| `--ground-side` | `#161617` | `#e9e5db` |
| `--ground-column` | `#0f0f10` | `#f3efe6` |
| `--ground-raised` | `#1c1c1e` | `#faf8f2` |
| `--ground-sunken` | `#0a0a0b` | `#fcfaf5` |
| `--texture` | `none` | `none` |
| `--ink-strong` | `#f3efe6` | `#0f0f10` |
| `--ink` | `#dcd9d1` | `#26262a` |
| `--ink-muted` | `#a3a097` | `#53514d` |
| `--ink-faint` | `#908e87` | `#62605c` |
| `--rule` | `rgba(243, 239, 230, 0.1)` | `#d5d0c4` |
| `--rule-soft` | `rgba(243, 239, 230, 0.055)` | `#e2ded3` |
| `--hover` | `rgba(243, 239, 230, 0.05)` | `rgba(15, 15, 16, 0.045)` |
| `--pressed` | `rgba(243, 239, 230, 0.08)` | `rgba(15, 15, 16, 0.07)` |
| `--selected` | `rgba(243, 239, 230, 0.1)` | `rgba(15, 15, 16, 0.085)` |
| `--selected-edge` | `none` | `none` |
| `--line-edge` | `none` | `none` |
| `--line-edge-selected` | `none` | `none` |
| `--group-ground` | `transparent` | `transparent` |
| `--group-edge` | `none` | `none` |
| `--control` | `rgba(243, 239, 230, 0.08)` | `#faf8f2` |
| `--control-hover` | `rgba(243, 239, 230, 0.13)` | `#fffefb` |
| `--control-pressed` | `rgba(243, 239, 230, 0.05)` | `#ece8de` |
| `--control-edge` | `inset 0 0 0 1px rgba(243, 239, 230, 0.1)` | `inset 0 0 0 1px #cbc6b9` |
| `--main` | `#f3efe6` | `#0f0f10` |
| `--main-hover` | `#fbf9f4` | `#26262a` |
| `--main-pressed` | `#dcd9d1` | `#000000` |
| `--on-main` | `#0f0f10` | `#f3efe6` |
| `--focus` | `#f3efe6` | `#0f0f10` |
| `--mark` | `rgba(243, 239, 230, 0.22)` | `rgba(15, 15, 16, 0.14)` |
| `--badge` | `rgba(243, 239, 230, 0.12)` | `rgba(15, 15, 16, 0.1)` |
| `--badge-ink` | `#f3efe6` | `#26262a` |
| `--state-waiting` | `#f2c033` | `#846000` |
| `--state-waiting-fill` | `var(--state-waiting)` | `#e9b61a` |
| `--state-working` | `#dcd9d1` | `#26262a` |
| `--state-finished` | `#908e87` | `#62605c` |
| `--state-no-agent` | `#908e87` | `#62605c` |
| `--state-failed` | `#f2c033` | `#7f5b00` |
| `--state-failed-fill` | `var(--state-failed)` | `#e9b61a` |
| `--added` | `#a9b88a` | `#4f6b2a` |
| `--removed` | `#a3a097` | `#53514d` |
| `--terminal-ground` | `#070708` | `#0f0f10` |
| `--terminal-ink` | `#cfccc4` | `#cfccc4` |
| `--terminal-strong` | `#f3efe6` | `#f3efe6` |
| `--seal-blank` | `#1b1b1d` | `#ebe7dd` |
| `--seal-blank-deep` | `#151516` | `#e4e0d5` |
| `--seal-blank-ring` | `#242426` | `#f6f3ec` |
| `--seal-blank-owl` | `#2c2c2f` | `#d6d1c4` |
| `--seal-blank-ground` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` |
| `--seal-blank-edge` | `inset 0 0 0 1px var(--seal-blank-ring)` | `inset 0 0 0 1px var(--seal-blank-ring)` |
| `--seal-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--seal-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--seal-broken-light` | `grayscale(1) brightness(1.6) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `grayscale(1) brightness(1.6) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--radius-card` | `8px` | `8px` |
| `--radius-control` | `6px` | `6px` |
| `--radius-line` | `6px` | `6px` |
| `--radius-chip` | `4px` | `4px` |
| `--radius-said` | `0 var(--radius-card) var(--radius-card) 0` | `0 var(--radius-card) var(--radius-card) 0` |
| `--card-edge` | `inset 0 0 0 1px rgba(243, 239, 230, 0.06)` | `inset 0 0 0 1px #d5d0c4` |
| `--said-ground` | `var(--ground-raised)` | `var(--ground-raised)` |
| `--said-edge` | `var(--card-edge)` | `var(--card-edge)` |
| `--said-edge-waiting` | `inset 2px 0 0 var(--state-waiting)` | `inset 2px 0 0 var(--state-waiting)` |
| `--backdrop` | `rgba(0, 0, 0, 0.6)` | `rgba(15, 15, 16, 0.4)` |
| `--dialog-shadow` | `0 24px 80px rgba(0, 0, 0, 0.6)` | `0 24px 80px rgba(15, 15, 16, 0.3)` |
| `--field-edge` | `inset 0 0 0 1px var(--rule)` | `inset 0 0 0 1px var(--rule)` |
| `--tab-edge` | `1px 0 0 var(--rule), -1px 0 0 var(--rule)` | `1px 0 0 var(--rule), -1px 0 0 var(--rule)` |
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--on-edge` | `inset 0 0 0 1px var(--ink-muted)` | `inset 0 0 0 1px var(--ink-muted)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `2px` | `2px` |
| `--approval-rule` | `linear-gradient(var(--rule), var(--rule))` | `linear-gradient(var(--rule), var(--rule))` |
| `--approval-edge` | `none` | `none` |
| `--approval-box-edge` | `none` | `none` |
| `--shape-waiting` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-waiting-fill` | `path("M5.5 8a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z")` | `path("M5.5 8a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z")` |
| `--shape-working` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-working-fill` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6z")` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6z")` |
| `--shape-working-track` | `none` | `none` |
| `--shape-working-turn` | `none` | `none` |
| `--shape-finished` | `none` | `none` |
| `--shape-finished-fill` | `path("M1.65 8a6.35 6.35 0 1 0 12.7 0a6.35 6.35 0 1 0-12.7 0z")` | `path("M1.65 8a6.35 6.35 0 1 0 12.7 0a6.35 6.35 0 1 0-12.7 0z")` |
| `--shape-no-agent` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-no-agent-fill` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6A7 7 0 0 0 8 2.4z")` | `path("M8 2.4A5.6 5.6 0 0 1 8 13.6A7 7 0 0 0 8 2.4z")` |
| `--shape-failed` | `none` | `path("M8 2.3l6 10.5H2z")` |
| `--shape-failed-fill` | `path("M8 2.3l6 10.5H2z")` | `path("M8 2.3l6 10.5H2z")` |

### Register

| Token | Dark | Light |
|---|---|---|
| `--scheme` | `dark` | `light` |
| `--font-ui` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, monospace` | `ui-monospace, "SF Mono", Menlo, monospace` |
| `--font-serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` |
| `--font-title` | `var(--font-ui)` | `var(--font-serif)` |
| `--font-said` | `var(--font-serif)` | `var(--font-serif)` |
| `--font-fact` | `var(--font-mono)` | `var(--font-mono)` |
| `--font-terminal` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` |
| `--weight-title` | `650` | `600` |
| `--weight-said` | `500` | `500` |
| `--ground` | `#1c1a18` | `#f1e9d8` |
| `--ground-side` | `#262321` | `#e8dfcb` |
| `--ground-column` | `#1c1a18` | `#faf5e9` |
| `--ground-raised` | `#262321` | `#faf5e9` |
| `--ground-sunken` | `#171513` | `#fbf7ee` |
| `--texture` | `none` | `repeating-linear-gradient(0deg, rgba(120, 95, 60, 0.028) 0 1px, transparent 1px 3px)` |
| `--ink-strong` | `#f6ecd8` | `#1a1613` |
| `--ink` | `#e4ddcf` | `#2e2924` |
| `--ink-muted` | `#aea697` | `#564d43` |
| `--ink-faint` | `#9b9385` | `#655c51` |
| `--rule` | `rgba(246, 236, 216, 0.13)` | `#d6cab2` |
| `--rule-soft` | `rgba(246, 236, 216, 0.07)` | `#e3d9c4` |
| `--hover` | `rgba(246, 236, 216, 0.045)` | `rgba(46, 41, 36, 0.045)` |
| `--pressed` | `rgba(246, 236, 216, 0.075)` | `rgba(46, 41, 36, 0.07)` |
| `--selected` | `rgba(246, 236, 216, 0.06)` | `rgba(46, 41, 36, 0.05)` |
| `--selected-edge` | `inset 2px 0 0 var(--ink-strong)` | `inset 2px 0 0 var(--ink-strong)` |
| `--line-edge` | `0 1px 0 var(--rule-soft)` | `0 1px 0 var(--rule-soft)` |
| `--line-edge-selected` | `inset 2px 0 0 var(--ink-strong), 0 1px 0 var(--rule-soft)` | `inset 2px 0 0 var(--ink-strong), 0 1px 0 var(--rule-soft)` |
| `--group-ground` | `var(--ground-side)` | `var(--ground-side)` |
| `--group-edge` | `inset 0 -1px 0 var(--rule), inset 0 1px 0 var(--rule-soft)` | `inset 0 -1px 0 var(--rule), inset 0 1px 0 var(--rule-soft)` |
| `--control` | `transparent` | `transparent` |
| `--control-hover` | `rgba(246, 236, 216, 0.045)` | `rgba(46, 41, 36, 0.045)` |
| `--control-pressed` | `rgba(246, 236, 216, 0.075)` | `rgba(46, 41, 36, 0.07)` |
| `--control-edge` | `inset 0 0 0 1px rgba(246, 236, 216, 0.18)` | `inset 0 0 0 1px #bfb193` |
| `--main` | `#f6ecd8` | `#1a1613` |
| `--main-hover` | `#fff8e8` | `#2e2924` |
| `--main-pressed` | `#e4ddcf` | `#0d0b09` |
| `--on-main` | `#201c18` | `#fbf6ea` |
| `--focus` | `#e8c88e` | `#5e3b0f` |
| `--mark` | `rgba(219, 165, 69, 0.4)` | `rgba(162, 96, 10, 0.3)` |
| `--badge` | `rgba(246, 236, 216, 0.12)` | `rgba(46, 41, 36, 0.1)` |
| `--badge-ink` | `#f6ecd8` | `#2e2924` |
| `--state-waiting` | `#f6ecd8` | `#1a1613` |
| `--state-waiting-fill` | `var(--state-waiting)` | `var(--state-waiting)` |
| `--state-working` | `#bdb5a5` | `#564d43` |
| `--state-finished` | `#a39b8c` | `#655c51` |
| `--state-no-agent` | `#9b9385` | `#655c51` |
| `--state-failed` | `#dba545` | `#8f550b` |
| `--state-failed-fill` | `var(--state-failed)` | `var(--state-failed)` |
| `--added` | `#a3b47c` | `#4f6b2a` |
| `--removed` | `#aea697` | `#564d43` |
| `--terminal-ground` | `#151312` | `#1c1815` |
| `--terminal-ink` | `#d6cfc1` | `#d8cfbd` |
| `--terminal-strong` | `#f6ecd8` | `#f6ecd8` |
| `--seal-blank` | `#292624` | `#ebe2ce` |
| `--seal-blank-deep` | `#23201e` | `#e6dcc6` |
| `--seal-blank-ring` | `#312d2a` | `#f4eddd` |
| `--seal-blank-owl` | `#3b3632` | `#d9ccb2` |
| `--seal-blank-ground` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` |
| `--seal-blank-edge` | `inset 0 0 0 1px var(--seal-blank-ring)` | `inset 0 0 0 1px var(--seal-blank-ring)` |
| `--seal-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--seal-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--seal-broken-light` | `grayscale(1) brightness(1.6) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `grayscale(1) brightness(1.6) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--radius-card` | `2px` | `2px` |
| `--radius-control` | `2px` | `2px` |
| `--radius-line` | `0` | `0` |
| `--radius-chip` | `0` | `0` |
| `--radius-said` | `0` | `0` |
| `--card-edge` | `inset 0 0 0 1px rgba(246, 236, 216, 0.06)` | `inset 0 0 0 1px #d6cab2` |
| `--said-ground` | `transparent` | `transparent` |
| `--said-edge` | `0 1px 0 var(--rule), 0 -1px 0 var(--rule)` | `0 1px 0 var(--rule), 0 -1px 0 var(--rule)` |
| `--said-edge-waiting` | `0 1px 0 var(--rule), 0 -1px 0 var(--rule)` | `0 1px 0 var(--rule), 0 -1px 0 var(--rule)` |
| `--backdrop` | `rgba(0, 0, 0, 0.6)` | `rgba(46, 41, 36, 0.4)` |
| `--dialog-shadow` | `0 24px 80px rgba(0, 0, 0, 0.6)` | `0 24px 80px rgba(90, 60, 30, 0.35)` |
| `--field-edge` | `inset 0 0 0 1px var(--rule)` | `inset 0 0 0 1px var(--rule)` |
| `--tab-edge` | `inset 0 2px 0 var(--terminal-strong)` | `inset 0 2px 0 var(--terminal-strong)` |
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--on-edge` | `inset 0 0 0 1px var(--ink-muted)` | `inset 0 0 0 1px var(--ink-muted)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `0` | `0` |
| `--approval-rule` | `none` | `none` |
| `--approval-edge` | `inset 0 0 0 1px var(--rule)` | `inset 0 0 0 1px var(--rule)` |
| `--approval-box-edge` | `inset 1px 0 0 var(--rule)` | `inset 1px 0 0 var(--rule)` |
| `--shape-waiting` | `none` | `none` |
| `--shape-waiting-fill` | `path("M3 3h10v10H3z")` | `path("M3 3h10v10H3z")` |
| `--shape-working` | `path("M3 3h10v10H3z")` | `path("M3 3h10v10H3z")` |
| `--shape-working-fill` | `path("M3 3h5v10H3z")` | `path("M3 3h5v10H3z")` |
| `--shape-working-track` | `none` | `none` |
| `--shape-working-turn` | `none` | `none` |
| `--shape-finished` | `path("M3 3h10v10H3zM5.6 8.2l1.7 1.7 3.2-3.6")` | `path("M3 3h10v10H3zM5.6 8.2l1.7 1.7 3.2-3.6")` |
| `--shape-finished-fill` | `none` | `none` |
| `--shape-no-agent` | `path("M3 3h10v10H3z")` | `path("M3 3h10v10H3z")` |
| `--shape-no-agent-fill` | `none` | `none` |
| `--shape-failed` | `path("M8 2.3l6 10.5H2zM8 6.6v2.8M8 11.1v.1")` | `path("M8 2.3l6 10.5H2zM8 6.6v2.8M8 11.1v.1")` |
| `--shape-failed-fill` | `none` | `none` |

### Desk

| Token | Dark | Light |
|---|---|---|
| `--scheme` | `dark` | `light` |
| `--font-ui` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, monospace` | `ui-monospace, "SF Mono", Menlo, monospace` |
| `--font-serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` | `ui-serif, "New York", "Iowan Old Style", Palatino, Georgia, serif` |
| `--font-title` | `var(--font-ui)` | `var(--font-serif)` |
| `--font-said` | `var(--font-serif)` | `var(--font-serif)` |
| `--font-fact` | `var(--font-ui)` | `var(--font-ui)` |
| `--font-terminal` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` | `ui-monospace, "SF Mono", Menlo, "MesloLGS NF", "MesloLGS Nerd Font", "Hack Nerd Font", "Symbols Nerd Font Mono", "D2Coding", "Apple SD Gothic Neo", monospace` |
| `--weight-title` | `650` | `600` |
| `--weight-said` | `500` | `500` |
| `--ground` | `#1c1a18` | `#f1e9d8` |
| `--ground-side` | `#262321` | `#e8dfcb` |
| `--ground-column` | `#1c1a18` | `#faf5e9` |
| `--ground-raised` | `#262321` | `#faf5e9` |
| `--ground-sunken` | `#171513` | `#fbf7ee` |
| `--texture` | `none` | `repeating-linear-gradient(0deg, rgba(120, 95, 60, 0.028) 0 1px, transparent 1px 3px)` |
| `--ink-strong` | `#f6ecd8` | `#1a1613` |
| `--ink` | `#e4ddcf` | `#2e2924` |
| `--ink-muted` | `#aea697` | `#564d43` |
| `--ink-faint` | `#9b9385` | `#655c51` |
| `--rule` | `rgba(246, 236, 216, 0.09)` | `#d6cab2` |
| `--rule-soft` | `rgba(246, 236, 216, 0.05)` | `#e3d9c4` |
| `--hover` | `rgba(246, 236, 216, 0.045)` | `rgba(46, 41, 36, 0.045)` |
| `--pressed` | `rgba(246, 236, 216, 0.075)` | `rgba(46, 41, 36, 0.07)` |
| `--selected` | `rgba(246, 236, 216, 0.1)` | `rgba(46, 41, 36, 0.09)` |
| `--selected-edge` | `none` | `none` |
| `--line-edge` | `none` | `none` |
| `--line-edge-selected` | `none` | `none` |
| `--group-ground` | `transparent` | `transparent` |
| `--group-edge` | `none` | `none` |
| `--control` | `rgba(246, 236, 216, 0.08)` | `#faf5e9` |
| `--control-hover` | `rgba(246, 236, 216, 0.13)` | `#fffbf1` |
| `--control-pressed` | `rgba(246, 236, 216, 0.05)` | `#efe6d2` |
| `--control-edge` | `inset 0 0.5px 0 rgba(246, 236, 216, 0.14), 0 0.5px 1px rgba(0, 0, 0, 0.35)` | `inset 0 0 0 1px #cfc2a8, 0 1px 0 rgba(120, 95, 60, 0.12)` |
| `--main` | `#f6ecd8` | `#1f2a44` |
| `--main-hover` | `#fff8e8` | `#2b3959` |
| `--main-pressed` | `#e4ddcf` | `#172034` |
| `--on-main` | `#201c18` | `#fbf6ea` |
| `--focus` | `#e8c88e` | `#5e3b0f` |
| `--mark` | `rgba(219, 165, 69, 0.4)` | `rgba(162, 96, 10, 0.3)` |
| `--badge` | `rgba(246, 236, 216, 0.12)` | `rgba(46, 41, 36, 0.1)` |
| `--badge-ink` | `#f6ecd8` | `#2e2924` |
| `--state-waiting` | `#f6ecd8` | `#1a1613` |
| `--state-waiting-fill` | `var(--state-waiting)` | `var(--state-waiting)` |
| `--state-working` | `#bdb5a5` | `#564d43` |
| `--state-finished` | `#a39b8c` | `#655c51` |
| `--state-no-agent` | `#9b9385` | `#655c51` |
| `--state-failed` | `#dba545` | `#8b5107` |
| `--state-failed-fill` | `var(--state-failed)` | `var(--state-failed)` |
| `--added` | `#a3b47c` | `#4f6b2a` |
| `--removed` | `#aea697` | `#564d43` |
| `--terminal-ground` | `#151312` | `#1c1815` |
| `--terminal-ink` | `#d6cfc1` | `#d8cfbd` |
| `--terminal-strong` | `#f6ecd8` | `#f6ecd8` |
| `--seal-blank` | `#292624` | `#ebe2ce` |
| `--seal-blank-deep` | `#23201e` | `#e6dcc6` |
| `--seal-blank-ring` | `#312d2a` | `#f4eddd` |
| `--seal-blank-owl` | `#3b3632` | `#d9ccb2` |
| `--seal-blank-ground` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` | `radial-gradient(circle at 40% 35%, var(--seal-blank), var(--seal-blank-deep))` |
| `--seal-blank-edge` | `inset 0 0 0 1px var(--seal-blank-ring)` | `inset 0 0 0 1px var(--seal-blank-ring)` |
| `--seal-blank-light` | `drop-shadow(0 1px 0 rgba(246, 236, 216, 0.07)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.55))` | `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.95)) drop-shadow(0 -1px 0 rgba(120, 95, 60, 0.4))` |
| `--seal-light` | `drop-shadow(0 1px 0 rgba(255, 150, 130, 0.25)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `drop-shadow(0 1px 0 rgba(120, 10, 10, 0.5)) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--seal-broken-light` | `grayscale(1) brightness(1.6) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))` | `grayscale(1) brightness(1.6) drop-shadow(0 3px 4px rgba(90, 60, 30, 0.35))` |
| `--radius-card` | `8px` | `4px` |
| `--radius-control` | `6px` | `5px` |
| `--radius-line` | `6px` | `5px` |
| `--radius-chip` | `4px` | `3px` |
| `--radius-said` | `var(--radius-card)` | `var(--radius-card)` |
| `--card-edge` | `inset 0 0 0 1px rgba(246, 236, 216, 0.06)` | `inset 0 0 0 1px #d6cab2` |
| `--said-ground` | `var(--ground-raised)` | `var(--ground-raised)` |
| `--said-edge` | `var(--card-edge)` | `var(--card-edge)` |
| `--said-edge-waiting` | `var(--card-edge)` | `var(--card-edge)` |
| `--backdrop` | `rgba(0, 0, 0, 0.6)` | `rgba(46, 41, 36, 0.4)` |
| `--dialog-shadow` | `0 24px 80px rgba(0, 0, 0, 0.6)` | `0 24px 80px rgba(90, 60, 30, 0.35)` |
| `--field-edge` | `inset 0 0 0 1px var(--rule)` | `inset 0 0 0 1px var(--rule)` |
| `--tab-edge` | `1px 0 0 var(--rule), -1px 0 0 var(--rule)` | `1px 0 0 var(--rule), -1px 0 0 var(--rule)` |
| `--dot-edge` | `0 0 0 1.5px var(--ground-side)` | `0 0 0 1.5px var(--ground-side)` |
| `--on-edge` | `inset 0 0 0 1px var(--ink-muted)` | `inset 0 0 0 1px var(--ink-muted)` |
| `--mark-edge` | `0 0 0 1px var(--mark)` | `0 0 0 1px var(--mark)` |
| `--radius-mark` | `2px` | `2px` |
| `--approval-rule` | `linear-gradient(to right, transparent 25%, var(--rule) 25%, var(--rule) 75%, transparent 75%)` | `linear-gradient(to right, transparent 25%, var(--rule) 25%, var(--rule) 75%, transparent 75%)` |
| `--approval-edge` | `none` | `none` |
| `--approval-box-edge` | `none` | `none` |
| `--shape-waiting` | `none` | `none` |
| `--shape-waiting-fill` | `path("M3.8 8a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0-8.4 0z")` | `path("M3.8 8a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0-8.4 0z")` |
| `--shape-working` | `none` | `none` |
| `--shape-working-fill` | `none` | `none` |
| `--shape-working-track` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` | `path("M2.4 8a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0-11.2 0z")` |
| `--shape-working-turn` | `path("M8 2.4A5.6 5.6 0 0 1 13.6 8")` | `path("M8 2.4A5.6 5.6 0 0 1 13.6 8")` |
| `--shape-finished` | `path("M2.2 8a5.8 5.8 0 1 0 11.6 0a5.8 5.8 0 1 0-11.6 0zM5.3 8.2l1.9 1.9 3.6-4")` | `path("M2.2 8a5.8 5.8 0 1 0 11.6 0a5.8 5.8 0 1 0-11.6 0zM5.3 8.2l1.9 1.9 3.6-4")` |
| `--shape-finished-fill` | `none` | `none` |
| `--shape-no-agent` | `path("M12.9 9.7A5.6 5.6 0 0 1 6.3 3.1 5.6 5.6 0 1 0 12.9 9.7z")` | `path("M12.9 9.7A5.6 5.6 0 0 1 6.3 3.1 5.6 5.6 0 1 0 12.9 9.7z")` |
| `--shape-no-agent-fill` | `none` | `none` |
| `--shape-failed` | `path("M8 2.3l6 10.5H2zM8 6.6v2.8M8 11.1v.1")` | `path("M8 2.3l6 10.5H2zM8 6.6v2.8M8 11.1v.1")` |
| `--shape-failed-fill` | `none` | `none` |

## Components and their states

Each part's form is the same in every theme, drawn with the theme's tokens. A ground or a colour changes over 120ms where the pointer comes over a part, and at once otherwise. A dash is a state the part does not have.

| Part | At rest | Under the pointer | Pressed | Selected | Focused by the keyboard | Disabled |
|---|---|---|---|---|---|---|
| The main button | `--main` under words in `--on-main`, with `--radius-control` and `--control-edge`. A dialog and a foot hold one at most. | `--main-hover` | `--main-pressed` | — | A ring of 2px in `--focus`, 2px outside its edge, on the ground around the button: its fill would hide a ring inside it. | 45% of its strength, and no answer to the pointer. |
| A button | `--control` with `--control-edge` and `--radius-control`. | `--control-hover` | `--control-pressed` | — | A ring of 2px in `--focus`, inside its edge. The rows below call it the ring. | 45% of its strength. |
| An icon's button | The icon in `--ink-muted` on no ground. | `--hover` under the icon in `--ink`. | `--pressed` | The icon in `--ink-strong` inside `--on-edge`, where what it turns on is on. The sidebar's filter is on while a state is chosen or a search is typed, and says what it shows to a pointer: "Showing: Needs you, matching "logs"". | The ring. | 45% of its strength. |
| A line of the inbox | No ground, `--radius-line` and `--line-edge`. The title is in `--ink`, and in `--ink-strong` at the heavier weight where the work item changed since the person last looked. An age and a count are in `--font-fact` and `--ink-faint`. | `--hover`, and nothing is selected. | `--pressed` | `--selected` with `--line-edge-selected`. It keeps its ground under the pointer, and its age is in `--ink-muted`, since the faint ink does not stand apart from a selected ground. | The ring. | — |
| An item of the sidebar | No ground and `--radius-line`. | `--hover` | `--pressed` | `--selected` with `--selected-edge`, on the item of what is in front. Its age and its count are in `--ink-muted`. | The ring. | — |
| The sidebar where a filter or a search leaves no repository | In the repositories' place stands one sentence, in `--ink-muted` at `--size-second` and wrapped, that names what left no repository and says that the sidebar lists none of them: "No work item stands under "Needs you", so the sidebar lists none of its 2 repositories." Under it stands "Show every work item", a button and not the main button, which chooses All in the filter, empties the search field and puts the keyboard on the first repository's row. The button that says how many repositories are hidden stands under them. No sentence stands where a repository is left, or where every repository is hidden. | — | — | — | — | — |
| A group's head | The group's name in `--ink-muted` and its count in `--ink-faint` and `--font-fact`, on `--group-ground` with `--group-edge`. | — | — | — | — | — |
| A row of a list of records: a commit, a changed file, a fact of a view, a decision made without asking, a path the setup copied or could not copy, a finding of a review round and a stage of a chain on the back of the seal | No ground, with `--line-edge`. A line of the work item's record that was not read stands under the decisions in `--state-failed`. Where the record holds a word of the person's that no commit holds yet, one sentence above the decisions says so in the preview and in the work item's view, whole and wrapped, and the person can select it: in `--ink-muted` while the word waits for a session, and in `--state-failed` where its commit failed. A path the setup could not copy stands whole, and under it the error the copy was given, whole and wrapped, in the fixed-width face and `--state-failed`, and the person can select it. A finding stands as its number, its symptom in `--ink` and its close at its right, with its severity and its places as `path:line` under the symptom in `--ink-muted`. A stage stands as its name, how it ended, its time, its tokens in and out, its cache read and written and its cost, each in a column that stands at one place down the whole back, under the columns' words in the caption's ink. | — | — | — | — | — |
| A menu | A card on `--ground-raised` with `--radius-card`, `--card-edge` and `--dialog-shadow`. An item has `--radius-line`, and a rule stands where another part of the menu begins. | `--hover` on the item. | `--pressed` on the item. | An item whose submenu is open is drawn as the one under the pointer. | The item the keyboard is on is drawn as the one under the pointer, with no ring. | — |
| A dialog | A card on `--ground-raised` with `--radius-card`, `--card-edge` and `--dialog-shadow`, over `--backdrop`. Its heading says what it does, its text says what will happen, and its buttons stand at its right foot with the main one last. A choice in a dialog stands as its mark and then its words, on one line: a box for a choice that is on or off, and a round mark for one of two, whose chosen one is in `--ink-strong` and never in the system's own accent. | — | — | — | — | — |
| A field | `--ground-sunken` with `--field-edge` and `--radius-control`, under words in `--ink-strong`. What it asks for is in `--ink-faint` until something is typed. | — | — | — | The ring. | As the system draws a field that takes nothing. |
| A pane's tab | Its label in `--ink-muted` and its close mark in `--ink-faint`. A tab whose pane is on the stage stands on `--terminal-ground`, which is dark in both appearances, with its label and its close mark in `--terminal-ink`. The back's tab, "Back of the seal", stands before the panes' tabs and has no close mark. | `--hover` | — | The tab in front, whose pane has the keyboard, has `--tab-edge` and its label in `--terminal-strong` at the heavier weight. The back's tab in front, whose back stands on the window's ground, has `--selected` with `--selected-edge` and its label in `--ink-strong` at the heavier weight. | The ring, in `--terminal-strong` on a tab whose pane is on the stage. | — |
| A pane's find bar | A card on `--ground-raised` with `--radius-card`, `--card-edge` and `--dialog-shadow`, over the top right corner of the pane's screen, opened by ⌘F or by "Find…" in the pane's menu. From its left stand the field, which reads "Find" until something is typed, "Match case" and "Regular expression" as icons' buttons drawn "Aa" and ".*", the count in `--font-fact` and `--ink-muted`, which says "3 of 17", "No match", "More than 1,000 matches" or "Not a regular expression", and "Next match", "Previous match" and "Close" as icons' buttons. Each match is outlined in `--terminal-ink` in the terminal, and the match in front is the terminal's selection, outlined in `--terminal-strong`. "Next match" goes to the next older match, as Enter in the field and ⌘G do, and "Previous match" back toward the newest, as Shift+Enter and ⇧⌘G do. Escape in the field closes the bar, and in the terminal it stays the program's. | An icon's button takes `--hover`. | `--pressed` | "Match case" and "Regular expression" draw their icon in `--ink-strong` while they are on. | The field and each button take the ring. | "Next match" and "Previous match" at 45% of their strength while nothing matched. |
| The letters a search matched | `--mark` under the letters, which are in `--ink-strong`, with `--mark-edge` and `--radius-mark`. | — | — | — | — | — |
| A state's mark | The theme's shapes for the state, in the state's colour, 16px wide. The mark says its words to a pointer and to a screen reader. The part of the working mark that turns goes round once in 1.1s. | — | — | — | — | — |
| What an agent says, and the questions a work item is parked with | `--said-ground` with `--said-edge` and `--radius-said`, the words in `--font-said` and `--ink-strong`. Where the work item needs the person the edge is `--said-edge-waiting`. A question's grounds and what an option implies are in `--ink-muted`. The choices an agent offers with its question stand under the question as a numbered list, each choice's label in `--ink-strong` and what it leads to in `--ink-muted`. Under a question that takes more than one choice stand the words "More than one may be chosen.", in `--size-caption` and `--ink-faint`. No choice is a button and the card holds no field, since the person answers in the agent's pane. | — | — | — | — | — |
| A call a headless session asks the person to allow | The card of what an agent says, with `--said-edge-waiting`. Its head names the tool, as in "Asks to use Bash", and under it the call's text, a path, a command or the call's input, stands whole and wrapped in the fixed-width face and `--ink-strong`, and the person can select it. "Allow" and "Refuse" stand at the card's right foot as two buttons, and neither is the main button, since either answer is the person's. | — | — | — | Each button takes the ring. | — |
| The seal's place | Drawn from the seal the branch's head commit holds. Before a seal: on a line a disc of `--seal-blank-ground` with `--seal-blank-edge`, and in the preview and at a view's foot the seal's drawing pressed into the ground in the blank tones under `--seal-blank-light`. Sealed, where the seal holds at the head: the seal as it is drawn, under `--seal-light`. Broken, where a commit after the seal broke it: the same drawing parted in two along one slanted break, with a gap between its halves, under `--seal-broken-light`, which takes the wax's red out. The break is the page's own and the same in every theme. The place says its words to a pointer and to a screen reader, and the preview and the head of a view's foot show them beside it: "No seal yet", "Sealed at 3f2a9c1" or "Seal broken, sealed at 3f2a9c1", with the first seven characters of the sealed commit. At a view's foot a column of words stands beside the drawing: those words as its head, a note in `--ink-muted`, and the sentence of the daemon's chain in `--ink` where such a chain stands. The note and the chain's sentence are at `--size-second` and wrapped. Where the seal is broken, the seal's sentence, which says why it broke, stands in `--ink` on a line of its own under the head of a view's foot. The seal's place holds nothing to press: a seal comes from the chain a pane's session runs, or from the daemon's chain of a handed-over issue. | — | — | — | — | — |
| The back of the seal | In the stage's place, behind its own tab, on the window's ground and in its inks, and the person can select its text. From its top: the large seal with the words of its state, a broken seal's sentence in `--ink` and the line "Broken by" with the commit and its subject in `--ink-muted`; the seal's record as labels in `--ink-muted` beside their values; the head's sentences in `--ink-strong`; each round under its title in the caption's ink, with its findings, a round's sentence and its stages; the stages after the rounds; and the sums, the line of the sessions outside the chain, the sentence on a converted cost and the refused calls. Code in a text stands in the fixed-width face. A cost is in `--ink` and `--font-fact`, and its word "converted" in `--ink-muted`. How a stage that failed ended is in `--state-failed`, and so is a line not read. An open finding's close is in `--ink-strong` at the heavier weight, and a closed one's in `--ink-muted`. Nothing of the back is red but the seal. Until the records and the ledger have both answered, and where either was refused, the place holds one sentence in `--ink-muted`. | — | — | — | — | — |
| The approval line | A section headed "Approval line", after what the agent says and before the decisions, in the preview and in a view's right column. The four roles in the order framer, crafter, proofer, sealer, in the form *The themes* gives for the theme, four places of one width. Each place holds the mark of how far its role came, the role's name with one capital in `--ink`, and under the name a note of two words at most in `--ink-muted`: "Not started" for a place not started, "Needs you" for one that waits on the person's answer, the stage the work item's chain runs for the role, "Round 2", "Fix pass" or "Judging", for a place at work, "Broad gate" for the sealer's place while the chain runs the repository's broad gate, "Failed" for one whose stage failed, "Gate failed" for the sealer's place where that broad gate failed, and otherwise how it ended, such as "Framed", "1 commit", "3 rounds", "Sealed", "Withheld" or "Undecided". A sealer's place not started where the gate's run is recorded says "Gate passed". A place not started takes the mark of a work item asleep, a place at work the mark of work, and one whose role failed the mark of a failure. The sealer's place where the broad gate failed takes the mark of a wait, since that failure is no failure of the sealer. The mark says the role's name and the place's whole words to a pointer and to a screen reader, with the commit a verdict names, the round a stage belongs to, and the age of a wait or of a stage that runs. The sealer's place holds the seal's place, drawn as on a line. The sealer's place says "Sealed" only where the seal holds at the branch's head commit. Where a later commit broke the seal, the place takes the mark of a wait and the note "Seal broken", and the seal's sentence, which says why it broke, stands under the places. Under the places stands one line of text for each place that has something to say, the role's name, a colon and the text: the question it waits on, why its stage failed, or the verdict's reason or question. The line is in `--ink-muted`, and in `--state-failed` for a place that failed. | — | — | — | — | — |
| An account's name | The name in `--font-fact` and `--ink-faint`, after the facts of a line of the inbox and after a pane's label on its tab, only where the account differs from the one its repository or its work item gives. In the Accounts dialog an account is a row of a list of records, with the default said in words. Under its name stand its folder in `--font-fact` and `--ink-faint`, then the state of its sign-in, its usage with the time it arrived, its last refresh and the sentence on what a refresh spends, each in `--ink-muted` at `--size-caption` and wrapped. The name and these lines take the row's whole width, so a name breaks inside a word only where it is longer than the row. Under them, the default said in words and the row's buttons stand on a line of their own, and wrap where they do not fit. "Refresh usage" is a button of that row and not the main button. The form under the list holds no field: "Add an account" opens the sign-in pane at once, and the account's row appears, named from the login, when the sign-in ends signed in. The sign-in pane stands under the list. | — | — | A selected line draws the name in `--ink-muted`, as it draws its age. | — | While a sign-in this window started waits on the daemon or runs, "Add an account" and each row's "Sign in" are disabled, so no second sign-in replaces the pane the dialog draws. |
| The Machine dialog | The form of a dialog, headed "Machine". Under the heading stands what the daemon read of the machine, as one sentence in `--font-fact`, wrapped. Under it stands a row for each cap, "Agents at once", "Worktrees", "Panes side by side", "Scrollback lines" and "Heavy commands at once": the cap's name, its field, eight characters wide, with "Use the default" beside the field, and under them the sentence that states the default and the numbers it came from, in `--ink-muted` at `--size-caption` and wrapped. "Use the default" is a button and not the main button, and is disabled while the cap follows its default and nothing else is typed. The row "Scrollback lines" is not drawn where the daemon sends no scrollback, as one of an earlier build does. Where sessions wait for the machine, the agents' row ends with the caption "Waiting for the machine", and under it stands a row for each session that waits, in the order they start: its work item's name in `--ink`, and under the name what it waits to run in `--ink-muted`, a chain's stage by its name and a question by its prompt after "Asked:". Where heavy commands run or wait, the row of heavy commands ends with the caption "Running and waiting", and under it stands a row for each, in the queue's order: its work item's name, or the last part of the folder it runs in, in `--ink`, and under the name in `--ink-muted` whether it runs or waits, the command's name, why one that waits stands where it does, and how long it has run or waited. Where heavy commands ran, the caption "What ran" follows, with a row for each command of each repository: the repository's name and the command's in `--ink`, and under them in `--ink-muted` how many runs, the longest, the most memory and the highest load, "not read" where no reading was made. "Save" is the main button. | — | — | — | — | — |
| The Settings dialog | The form of a dialog, headed "Settings", opened by "Settings…" of the application menu, on ⌘,, and by a ⌘ click on a file a pane printed where no editor was chosen. It holds the field "Open files in", a menu of the editors of Owlery's list the Mac holds, by name, with "Show in Finder" last. The menu stands on the choice kept, or on the first editor where none was kept. Under the field stands the sentence "A ⌘ click on a file a pane printed opens it here, at the line the pane named. ⇧ ⌘ click shows it in Finder." in `--ink-muted`. "Save" is the main button. A Save that names an editor, after a click on a file opened the dialog, opens that file. | — | — | — | — | — |
| The delete dialog | The form of a dialog, headed "Delete" and the work item's name. Its first sentence, which says what the delete does or what it would lose, is its lead, in `--ink`. Under it stands a section for each kind of thing the delete removes or loses, its head stating how many: "39 commits no other branch, no remote and no tag holds". A section that would hold the branch and the folder names them in its head: "The branch and the folder removed from disk". Each entry stands on one row of `--detail-line`, with no gap between rows. A commit's row holds its short hash in the fixed-width face and `--ink-muted`, in a column as wide as the list's widest hash, then its subject in `--ink`, cut to one line. A path's row holds the path in the fixed-width face, cut to one line. Each row's tooltip holds its whole subject or path. A list of more than ten rows is ten rows tall and scrolls, and comes to rest on whole rows. Where the daemon listed fewer entries than it counted, "and N more" stands under the list. "Nothing on a remote is removed." stays in `--ink-muted`. Under the losses the dialog names the work item's sessions in two sections: "Running sessions that end", and "Sessions waiting for the machine that leave the queue" for a session that has not started. A section stands only where it holds a session. The dialog before an archive, the repository's removal dialog and the dialog that asks before the daemon ends name their sessions in the same sections. While the dialog is open, a list whose entries did not change stays as it is drawn when the daemon sends its lists, so it keeps its scroll and the tooltip under the pointer. Each opening of the dialog starts every list at its top. The repository's removal dialog draws each work item's loss in this form. | — | — | — | — | — |
| The warning of the "New work item" form | Under the form's name, after the branch, the folder and the setup, where the daemon sent the disk. One sentence says that the disk may not hold the worktree, with the free disk, the 10 GB kept free and what a worktree of the repository takes. Another says that the worktrees are at their cap, with the worktree's number and the cap. The two stand in one paragraph, wrapped, at `--size-second` in `--ink`, and in no state's colour: they are no work item's state, and principle 3 keeps the theme's one signal for a work item that needs the person. "Create" can still be pressed under them. | — | — | — | — | — |
| The stage side by side | Where "Side by side" is pressed and the stage holds two panes or more, the panes stand as tiles, row by row: in two columns for 2 to 4 tiles, three for 5 to 9 and four for 10 to 16. The last tile spans what is left of its row. A rule of 1px in `--rule` stands between two tiles, in the middle of the margin between them. | — | — | — | — | — |

The app draws the approval line for every work item whose daemon sends what its records say. It lights the seal where the seal holds at the branch's head commit, and draws the seal broken where a commit after the seal broke it, each in the form above.
check: apps/desktop/test/view.test.ts apps/desktop/test/approval-line.test.ts

## The voice of the window's words

No theme changes a word. The window speaks as a clerk's note does: it says what is so and what will happen, and leaves the judgment to the reader.

- **A whole sentence that names the thing.** "A delete removes the work item's worktree and its local branch, and takes the work item off Owlery's lists." A label of a part is a noun, and a button is the act it does: "Open the work item", and never "OK" or "Yes".
- **What will be lost is said before it is lost, and so is what will not be.** "Nothing on a remote is removed."
- **A fact of the seal is said as a fact.** "A seal binds to one commit and breaks if another lands after it."
- **A key is named in a sentence.** "J K move through the inbox."
- **A state is two words at most.** The four states are "Needs you", "Working", "Finished" and "Asleep", and the window names a state by those words wherever it names one. Where a sentence counts the work items in a state, the words follow the count: "1 needs you, 2 working". The sidebar's status line reports the daemon: "Daemon running, 2 agents".
- **Sentence case.** A heading, a label and a button begin with one capital. No label is set in capitals with its letters spaced apart.
- **No first person, and no greeting.** The window is not the agent and does not speak as one. What an agent says is shown as the agent's, in its own card.
- **No word that sells.** No "magic", no "supercharge", no claim of speed, no exclamation mark and no emoji.

## What to avoid

A change to the window that draws one of these is refused at its review, whichever theme it is drawn in. The products below are named for what their public pages showed on 2026-11-22. No product's app was run, so what an app looks like past its own front page is not stated here.

### The marks of a generic AI product

1. **Purple, and gradients of purple into blue or pink.** A violet glow behind a panel, or a gradient across a headline or a button. No theme holds a purple, and no theme draws a gradient across a headline, a button or a panel.
2. **Sparkles.** A four-pointed star beside a word, to say that a model does it. The Claude Code documentation page carries one on its "Ask Assistant" button.
3. **Chat bubbles and the prompt box.** A transcript of rounded bubbles over a box that says "Ask anything", with a model's name on a chip under it. The front pages of Orca, Conductor and Cursor each show their app as that screen. The desktop has no chat screen, and the window's mark of a wait was once a speech mark, which no theme draws again.
4. **Glass.** A translucent panel that blurs what is behind it. A blur costs the graphics process memory the product measures.
5. **Rounded everything.** Buttons and fields as full pills, cards with corners of 12px and more, round pictures of people. Linear's "Sign up" button and Cursor's download buttons are pills.
6. **The eight marks this window once had.** A blue slate ground with amber and sky accents. Inter, Space Grotesk and JetBrains Mono. Labels in tracked capitals. A 30px title over 68px lines and 44px buttons. An empty preview. One radius of 8px and one 1px edge on everything, with a dashed circle for the seal. A logo's row of its own under the traffic lights. No hover, no motion and no icon of a state. The study of 2026-11-19 diagnosed them and the window has none of them now.
7. **Words that sell.** "Magic", "supercharge", "100x", an exclamation mark, a greeting from the agent in the first person, an emoji in a label. Orca's front page opens with "Ship 100x with the agent IDE", and [product.md](product.md) refuses claims of throughput.

### The patterns of the nearest products

| Product | Source | What its page draws | What Owlery does not take |
|---|---|---|---|
| Orca | `https://www.orca.dev/` | A cool near-black ground, a white grotesque headline and a strip of pill tabs. The app is a tree of worktrees with each agent's logo on its row, split panes of chat with a prompt box in each, and a status bar of usage meters. | The agents' brand logos as a row's icon, the prompt box, the bar of meters, the claim of speed. |
| Conductor | `https://www.conductor.build/` | A black ground under a field of pixel stars and ASCII figures, and a pixel logo. The app is a sidebar of workspaces, a chat transcript in the middle, and a right column of changed files with green and red counts under a green "Merge" button. Team members' round photographs stand in the sidebar. | The decoration of pixels and ASCII, the green button of a merge, photographs of people. Its right column of commits and changed files is close to the window's own, so the window's column is told apart by the approval line and the seal at its foot. |
| Linear | `https://linear.app/` | A near-black neutral ground, a tight grotesque, a headline whose first sentence is white and whose rest is grey, captions in tracked fixed-width capitals, and figures drawn as isometric hairlines. | The two-tone headline, the tracked capitals, the hairline figures. |
| Cursor | `https://cursor.com/` | A warm near-black with cream ink, the app's windows floating over an oil painting of a landscape, an orange for links, and pill buttons. | The painting behind a window, the orange. Its warm ground and cream ink are close to Desk's dark appearance. |
| Claude Code's desktop app | `https://code.claude.com/docs/en/desktop` | The documentation page: a warm dark ground, page titles in a serif, a terracotta orange for the active item and for the line over a title, the spark logo, and a sparkle on "Ask Assistant". | The orange, the spark, the sparkle. Its serif titles on a warm ground are close to the serif titles of Desk's light appearance and to the serif of what an agent says in Desk and Register. |

The neighbours fall into two camps. Orca, Conductor and Linear draw in neutral black with a grotesque, and Night watch stands on that ground with the eye's yellow and the eye mark, which none of those pages draws. Cursor and Claude draw in warm black with cream, and Desk stands there. No page opened draws a ruled register, an approval line or a seal.

## A pull request that changes the window carries its screenshots

A pull request that changes the window carries a screenshot of each view it changed, in Night watch's dark and light appearances, and in each other theme that draws the changed part differently. Its review reads the screenshots against this document: each form against *Components and their states*, each value against *Tokens*, each word against *The voice of the window's words*, and the whole against *Principles* and *What to avoid*. A screenshot is made from the built app, and the views are the summary, the inbox, a work item's view, the find bar over a pane of that view, the view of a work item parked with questions, the view of a finished work item, the view of a work item whose seal is broken, a menu, a dialog, the dialog of the chain choice, a repository's settings, the Accounts dialog, the Accounts dialog while the login of an account "Add an account" adds runs, the Accounts dialog with the row that login named, the Machine dialog, the Settings dialog, the delete dialog of a work item with many commits, and the sidebar where a filter and a search leave no repository. The pull request that adds a view to the run adds it to this list, in both editions of this document, as principle 8 says of a form's row. No other sentence of this section counts the views.

**`pnpm run screenshots`, run in `apps/desktop`, makes the screenshots.** It builds the app and starts it in the background, so the window takes neither the keyboard nor the pointer of the person who runs it. The window is drawn at opacity 0, so their screen shows nothing of it, and the command captures the page and not the screen. The app opens on a temporary repository with seven invented work items: one needs the person, one is at work, one is at review, one is finished, one is asleep, one is parked with two questions, and one holds a seal that a later commit broke. The view's work item is the one that needs the person. A prompt asked in it has failed, and the session of a second prompt waits for the person to allow a command, so the screens show the mark and the words of every state, and the card of a call to allow. It carries no decision made without asking and no words of its setup, so its line's second row gives its whole width to the call. No agent runs: a pane's process is a fixture, and a state is what the run tells the daemon. The run starts no chain and none runs: its chains stand recorded. It commits with git, in a work item's worktree, the records a chain's stages write there, through the writers the chain's own code calls. It also stores two chains in the daemon's run folder before the app starts, as a daemon that ran them stored them. The work item at review holds one commit and no record. The view's work item holds its routing and one round's record, so its approval line shows two finished places and two not started, in the inbox's preview and in the view, whose shot scrolls the right column until the approval line is the last thing in it. The parked work item is stored with a parked chain. Its worktree holds the records of a round that left no finding and of the broad gate's run, and its record of questions holds two questions of the sealer's, which the run writes there. Its approval line counts the one round and marks the sealer's place, which waits on the questions, below what the parked view's shot shows, which opens at the questions. The finished work item is stored with a rested chain and a pull request, as the paragraphs below say. No shot shows a stage at work: the daemon reads a chain stored as running as stopped when it starts, and nothing in the app starts a chain until issue #55. The repository is on the owl chain, and the Claude Code config folder the run gives the app enables a stand-in for the AgenticSeal plugin, so the window holds the choice of a chain. The run stores the answer "the AgenticSeal plugin" with the repository, so no pane of the scene is asked about. For the shot of the settings it saves the answer "the owl chain" there. For the shot of the choice it takes the answer away, presses "+ Claude Code" in the view and cancels the dialog after the shot. Neither shot launches a pane. The command writes one PNG file of the window's size, 1440 by 900, for each view of the list above in each appearance of Night watch, named `<theme>-<appearance>-<view>.png`. `OWLERY_SCREENSHOT_THEMES` adds themes: `all` for every theme, or names with commas between them, such as `register,desk`. The files go into `apps/desktop/screenshots/`, in a folder named by the time the run started, which git ignores. Where `OWLERY_SCREENSHOT_DIR` names a folder, they go there.
check: apps/desktop/test/screenshots.test.ts

**The scene holds a work item whose seal holds and one whose seal is broken.** The finished work item's branch holds the records of a chain that ended in a seal, so its line and its view show the lit seal, and its view's foot says "Sealed at" with the sealed commit. The run commits the records of a seal in one more work item's worktree with git, as Owlery's code writes them, and one commit after them, and that work item holds no pull request. Its line shows the broken seal, waits, and says "Seal broken" in its second row. Its view's foot shows the broken seal with its words and the seal's sentence under them, and nothing to press.
check: apps/desktop/test/screenshots.test.ts

**The files are committed with the change, and the pull request's body shows each as `![what it shows](../blob/<commit>/<path>?raw=true)`.** They are committed in the pull request's own records under `seal/threads/`. `<commit>` is the full id of the commit that holds the file, and `<path>` is the file's path from the repository's root. GitHub reads that link from the pull request's own address, and it is the form GitHub's documentation gives for an image of the repository in a pull request. A path written as a Markdown file of the tree links an image, such as `images/inbox.png`, is not drawn in a pull request's body. The link names a commit and not the branch, so the image the body shows is the one made at that commit, whatever lands on the branch after it.

No gate decides whether a pull request "changes the window". That is a judgment of meaning, and the review holds it.

**The parked work item of the screenshot run carries a chain whose broad gate passed.** The run stores that chain, and what its gate printed, in the daemon's run folder before the app starts. The view of the parked work item lists that gate under "Ask", with the finished mark, the gate's command and the button that shows what the command printed.
check: apps/desktop/test/screenshots.test.ts

**The finished work item of the screenshot run carries a pull request whose checks passed.** The run stores the pull request with the work item before the app starts, with the sealed commit as its head. The daemon reads a stored pull request again through `gh` while a window is connected, so the run puts a stand-in for `gh` first on the login shell's `PATH`. The stand-in answers that read and notes each call, and no call reaches GitHub. Its line says so in its second row, and its view shows the pull request's number, its state and each check under the seal's place.
check: apps/desktop/test/screenshots.test.ts

**The screenshot run captures the summary.** The run takes the look before the scene's seals are given. It makes the finished work item's sealed commits before the app starts, sets the branch back to the commit before them, and moves the branch forward to the sealed commit once the look is taken. So the summary leads with a work item whose seal was given since the look and one whose seal broke since it.
check: apps/desktop/test/screenshots.test.ts

**The views of the finished work item and of the broken one show the back of a seal.** Each opens to its back, so the back is in front in both shots. The finished work item's records hold two rounds: the first leaves one finding, a commit fixes it and the finding's close names that commit, and the second leaves none. The run appends an entry for each stage of that chain to the daemon's ledger, each with what the stage used, so the ledger holds a converted cost for each stage. That back shows a finding at its file and line with the commit that fixed it, a round that caught nothing, and the cost of each stage with its sum. The broken work item's back shows the commit that broke its seal and a round that caught nothing. The ledger holds no entry of that work item, so its back shows no stage's cost and says that the stages ran outside the daemon and that Owlery read no cost of them.
check: apps/desktop/test/screenshots.test.ts

**The screenshot run's scene keeps one account beside System default.** The run writes `accounts.json` before the app starts. The account is handed over by an empty folder of the run's own, is stored as signed in, and holds two limit values. The parked work item is set to it, so its line in the inbox names the account, the settings show the account's field, and the Accounts dialog draws its row. The parked work item's shell pane runs under the account, so its row offers no refresh.
check: apps/desktop/test/screenshots.test.ts
