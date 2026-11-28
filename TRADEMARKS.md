# The Owlery and AgenticSeal names and the owl emblem

The code in this repository is licensed under the Apache License 2.0, whose
text is [`LICENSE`](LICENSE). That license covers the code. It does not cover
the Owlery name, the AgenticSeal name, the owl emblem or its drawings.

The Owlery and AgenticSeal names, the owl emblem and its drawings are not
licensed under the Apache License 2.0. All rights reserved. The drawings in
this repository are:

- [`apps/desktop/assets/marks/owl.svg`](apps/desktop/assets/marks/owl.svg),
  a disc of red wax with a raised owl, which the app draws the inspection's
  mark from.
- [`apps/desktop/assets/marks/owl-icon-cream.svg`](apps/desktop/assets/marks/owl-icon-cream.svg),
  the little owl on red wax drawn for a small size, which the app shows on
  the line of a work item whose inspection is cleared.
- [`apps/desktop/assets/icon/app-icon.svg`](apps/desktop/assets/icon/app-icon.svg),
  Owlery's emblem: a warm white owl on a black rounded square, which both
  READMEs open with.
- [`apps/desktop/assets/icon/app-icon-small.svg`](apps/desktop/assets/icon/app-icon-small.svg),
  the emblem drawn for 32 pixels and under: the same owl without its chest
  marks and its two side lines, with heavier eyes.
- [`apps/desktop/assets/icon/app-icon.png`](apps/desktop/assets/icon/app-icon.png),
  the emblem at 1024 pixels, which an app started from a checkout gives the
  macOS Dock. It is drawn
  from `app-icon.svg` with librsvg 2.58.4, by this command run in
  `apps/desktop`:

  ```
  rsvg-convert -w 1024 -h 1024 assets/icon/app-icon.svg -o assets/icon/app-icon.png
  ```

Each of the two drawings of the inspection's mark is the file of the same name
from the AgenticSeal plugin 0.38.2, unchanged. The emblem's owl is the mark's
little owl taken out of its wax.

Nothing here reserves any code.
