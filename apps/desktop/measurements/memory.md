# Memory: the app itself with four terminals on screen

**Four terminals side by side read 503.4 MB at the highest sample of three runs.** The samples of the three runs lie between 491.1 and 503.4 MB, and two of the three runs hold a sample over 500 MB. This is the reference scene of `docs/architecture.md` *Memory design*, which publishes what a scene costs as a measurement and holds no feature to its number. The numbers are of an agent's start of the app, described under *The kind of start*. Nobody has measured a start a person makes.

## What was measured

| | |
|---|---|
| Date | 2026-11-19 |
| Commit | `f37bb25`, with nothing under `apps/desktop` that the commit does not hold |
| Machine | MacBook Pro, Apple M3 Pro, 36 GB |
| Displays | two, each 3840 by 2160 shown as 1920 by 1080, so two device pixels to one pixel of the page |
| Versions | macOS 26.5, Electron 45.3.3, xterm.js 6.0.0 |
| Window | 1440 by 900 px, the size it opens at |
| Stage | 764 by 788.8 px, between the sidebar and the view's right column |
| One terminal alone | 728 by 766.8 px, 102 columns by 54 rows |
| A tile of four | 358 by 380.4 px, 49 columns by 27 rows with WebGL, and 47 columns by 27 rows with the DOM renderer |
| The app itself | the Electron main process, every process below it, and the daemon |
| Summed apart | the processes below the daemon, which are the panes': here the fixture `test/fixtures/printer.sh`, and an agent's CLI in use |
| 1 MB | 1,048,576 bytes, as Activity Monitor counts it |

Each number is the sum of macOS's `phys_footprint` over those processes, read with `footprint --noCategories -f bytes`. A sample is taken 20, 25 and 30 seconds after a scenario's last step. Each pane's process prints about 300 lines a second of coloured text from before the first sample to the last. Each scenario and run is a launch of its own. A run is thrown away where a sample was taken while the page was hidden or drew no frame. None of these thirteen was.

## The commands

Both were run from `apps/desktop`. The first made three launches of each of its three scenarios, and the second one launch of each of its four.

```
OWLERY_BACKGROUND=1 OWLERY_MEMORY_SCENARIOS=four,four-dom,four-after-eight pnpm run measure:memory
OWLERY_BACKGROUND=1 OWLERY_MEMORY_SCENARIOS=inbox,one,eight-in-turn,inbox-after-four OWLERY_MEMORY_RUNS=1 pnpm run measure:memory
```

`OWLERY_BACKGROUND=1 pnpm run measure:memory` alone makes three launches of every scenario.

## The kind of start

Every run here is an agent's. The app starts under `OWLERY_BACKGROUND=1`, and the measurement tells the page that it has the focus, because a page without it may draw nothing. Such a start lacks five things a person's start has: the Dock icon, the menu bar, the system's focus on the window, the system's pointer, which passes through the window to what is under it, and the window on the screen, which is drawn at opacity 0.

A person's run leaves the variable unset and keeps the window in front for the whole run, with nothing typed:

```
pnpm run measure:memory
```

Nobody has made that run. Where it reads apart from the numbers here, its number is the one to publish for this scene.

## The scenarios

- `inbox`: the app as it opens, with no view opened.
- `one`: one pane on the stage.
- `eight-in-turn`: eight panes in two work items, each in front once, the last one left on the stage.
- `four`: four panes of one work item side by side.
- `four-dom`: `four` with WebGL refused to the page's canvases, so the app's own fallback keeps the DOM renderer.
- `four-after-eight`: the eight panes of `eight-in-turn` each shown once, then the four of the second work item side by side.
- `inbox-after-four`: `four`, then the inbox screen in front.

## The samples

| Scenario | Run | Start | App itself, MB, at 20 s / 25 s / 30 s | Highest, MB | Panes' processes, MB | Terminals | Displayed | Canvases | Frames a second |
|---|---|---|---|---|---|---|---|---|---|
| inbox | 1 | agent | 156.3 / 156.4 / 155.2 | 156.4 | 0.0 / 0.0 / 0.0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 61 / 59 / 60 |
| one | 1 | agent | 450.6 / 454.1 / 452.5 | 454.1 | 2.1 / 2.1 / 2.1 | 1 / 1 / 1 | 1 / 1 / 1 | 3 / 3 / 3 | 60 / 60 / 60 |
| eight-in-turn | 1 | agent | 479.8 / 480.3 / 467.0 | 480.3 | 10.6 / 10.6 / 10.6 | 1 / 1 / 1 | 1 / 1 / 1 | 3 / 3 / 3 | 61 / 61 / 60 |
| four | 1 | agent | 499.0 / 498.1 / 491.1 | 499.0 | 5.3 / 5.3 / 8.6 | 4 / 4 / 4 | 4 / 4 / 4 | 9 / 9 / 9 | 60 / 60 / 60 |
| four | 2 | agent | 500.8 / 500.9 / 495.6 | 500.9 | 5.3 / 8.6 / 5.3 | 4 / 4 / 4 | 4 / 4 / 4 | 9 / 9 / 9 | 60 / 60 / 59 |
| four | 3 | agent | 502.3 / 503.4 / 498.3 | 503.4 | 5.3 / 5.3 / 5.3 | 4 / 4 / 4 | 4 / 4 / 4 | 9 / 9 / 9 | 60 / 60 / 60 |
| four-dom | 1 | agent | 547.6 / 464.4 / 534.6 | 547.6 | 5.3 / 5.3 / 8.5 | 4 / 4 / 4 | 4 / 4 / 4 | 0 / 0 / 0 | 60 / 60 / 60 |
| four-dom | 2 | agent | 542.1 / 531.7 / 533.8 | 542.1 | 6.9 / 5.3 / 5.3 | 4 / 4 / 4 | 4 / 4 / 4 | 0 / 0 / 0 | 60 / 60 / 59 |
| four-dom | 3 | agent | 537.3 / 468.2 / 534.9 | 537.3 | 5.3 / 8.6 / 6.9 | 4 / 4 / 4 | 4 / 4 / 4 | 0 / 0 / 0 | 60 / 61 / 60 |
| four-after-eight | 1 | agent | 511.4 / 516.1 / 518.2 | 518.2 | 10.6 / 10.6 / 10.6 | 4 / 4 / 4 | 4 / 4 / 4 | 9 / 9 / 9 | 60 / 60 / 59 |
| four-after-eight | 2 | agent | 506.6 / 512.5 / 512.6 | 512.6 | 10.6 / 10.6 / 10.6 | 4 / 4 / 4 | 4 / 4 / 4 | 9 / 9 / 9 | 59 / 60 / 60 |
| four-after-eight | 3 | agent | 511.2 / 517.9 / 519.4 | 519.4 | 10.6 / 10.6 / 10.6 | 4 / 4 / 4 | 4 / 4 / 4 | 9 / 9 / 9 | 59 / 61 / 61 |
| inbox-after-four | 1 | agent | 257.1 / 257.8 / 240.9 | 257.8 | 5.3 / 6.1 / 5.3 | 4 / 4 / 4 | 0 / 0 / 0 | 9 / 9 / 9 | 60 / 60 / 60 |

A start `agent` is made under `OWLERY_BACKGROUND=1`, with the page told that it has the focus.

## The last sample of each run, by the kind of process

| Scenario | Run | Main | Renderer | GPU | Utility | Daemon | Other | App itself, MB, at 30 s |
|---|---|---|---|---|---|---|---|---|
| inbox | 1 | 64.3 | 24.5 | 42.7 | 7.4 | 16.4 | 0.0 | 155.2 |
| one | 1 | 64.5 | 59.5 | 303.9 | 7.5 | 17.1 | 0.0 | 452.5 |
| eight-in-turn | 1 | 63.8 | 67.6 | 307.4 | 7.4 | 20.7 | 0.0 | 467.0 |
| four | 1 | 63.5 | 82.7 | 319.1 | 7.5 | 18.3 | 0.0 | 491.1 |
| four | 2 | 63.8 | 84.5 | 321.0 | 7.5 | 18.7 | 0.0 | 495.6 |
| four | 3 | 63.6 | 86.9 | 321.5 | 7.4 | 18.9 | 0.0 | 498.3 |
| four-dom | 1 | 63.5 | 117.2 | 327.9 | 7.5 | 18.5 | 0.0 | 534.6 |
| four-dom | 2 | 63.6 | 116.0 | 327.9 | 7.5 | 18.7 | 0.0 | 533.8 |
| four-dom | 3 | 63.8 | 115.1 | 330.1 | 7.6 | 18.2 | 0.0 | 534.9 |
| four-after-eight | 1 | 63.6 | 88.5 | 321.9 | 7.4 | 36.8 | 0.0 | 518.2 |
| four-after-eight | 2 | 63.6 | 82.5 | 321.9 | 7.5 | 37.1 | 0.0 | 512.6 |
| four-after-eight | 3 | 65.5 | 88.3 | 321.5 | 7.5 | 36.5 | 0.0 | 519.4 |
| inbox-after-four | 1 | 63.8 | 49.4 | 101.6 | 7.4 | 18.7 | 0.0 | 240.9 |

## What the tables show

- Four WebGL terminals as tiles read 45 to 49 MB more at the highest sample of each run than one terminal alone, whose one run read 454.1 MB. The GPU process holds about 320 MB with four and about 304 MB with one.
- The DOM renderer read higher than WebGL at this rate of output, 537.3 to 547.6 MB at the highest sample of each run. The GPU process holds about as much, and the renderer process about 30 MB more.
- Panes that are not on the stage hold no terminal in the window. Eight panes each shown once read 480.3 MB, with one terminal in the page. Four tiles after eight panes read 512.6 to 519.4 MB, 9 to 16 MB over the highest sample of `four`: the daemon holds about 18 MB more, which is the output it keeps for eight panes.
- With the inbox in front after four tiles, the page still holds the four terminals, hidden, and the app reads 257.8 MB against 156.4 MB before any view was opened.
