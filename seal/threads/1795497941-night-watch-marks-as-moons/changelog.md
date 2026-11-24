# Changelog: Night watch marks as phases of the moon

Issue #183. In Night watch the mark of a finished work item was a closed eye, a thin arc across the lower half of its box, and the mark of a work item asleep was an outlined crescent. At 16px both read as a thin grey arc, so a finished place of the approval line read as a half moon, and a finished work item could not be told from one asleep at a glance.

- **Night watch draws how far work has come as how full the moon is.** A work item asleep, which is also a place of the approval line not started, is a ring with a thin filled edge at its right. A work item at work is a half-filled disc. A finished work item is a wholly filled disc. The fill is the state's colour, so in the light appearance the filled part is the darker one. The inbox, the sidebar, the summary and the approval line draw the new marks. No colour changes.
- **Night watch's working mark no longer moves.** The ring that turned is gone from Night watch, and a person reads work from the half-filled disc and the word "Working". Desk's working mark still turns.
- **The mark of a work item that needs the person stays the owl's eye, and a failure stays the filled triangle.** Register and Desk draw every mark as before.
- **`docs/design.md` and its Korean edition state the new forms.** The row "A state's marks" of *The themes* and Night watch's token rows name the moons, and *Principles* 1 names the eye as the mark of a wait alone.
- **The desktop app's version is 0.0.3.**
