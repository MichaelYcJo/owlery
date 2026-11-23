# Changelog: two cases no longer fail in the whole suite under load

Issue #161. Two cases of the desktop app's suite passed alone and failed when the whole suite ran on a machine under load, so no broad gate of release 0.0.2 could pass.

- **The settle case that runs the settle script seven times has 20 seconds**, as the cases that start several processes already have. It took 5.4 seconds under load, beyond the 5 seconds every case has by default.
- **The adapter case that holds the exit of a CLI whose child keeps its streams open allows 10 seconds for the exit to arrive.** The child holds the streams for 30 seconds, so an exit within 10 seconds still shows the adapter did not wait for it. The earlier 1.5 seconds counted the start of the shell and of the child, and the exit arrived at 2.1 seconds under load.
