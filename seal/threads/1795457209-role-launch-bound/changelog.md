# Changelog: a role launch case no longer fails in the whole suite under load

Issue #171. One case of the desktop app's suite passed alone and failed once when the whole suite ran, so a broad gate of #43 failed on a case its branch did not touch.

- **The two role launch cases that stop a CLI the session's first line refuses allow 10 seconds for the run to end.** The stand-in CLI would work for 30 seconds, so a run that ends within 10 seconds still shows the adapter stopped it. The earlier bound of 2 seconds was counted from the run's start, the shell's start among it, and the run ended at 2.08 seconds under the whole suite.
