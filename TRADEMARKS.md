# The Owlery and AgenticSeal names and the owl emblem

The code in this repository is licensed under the Apache License 2.0, whose
text is [`LICENSE`](LICENSE). That license covers the code. It does not cover
the Owlery name, the AgenticSeal name, the owl emblem or its drawings.

The Owlery and AgenticSeal names, the owl emblem and its drawings are not
licensed under the Apache License 2.0. All rights reserved. The drawings in
this repository are:

- [`apps/desktop/assets/seals/owl.svg`](apps/desktop/assets/seals/owl.svg),
  the red wax seal with a raised owl, which the app draws a seal's place
  from.
- [`apps/desktop/assets/seals/owl-icon-cream.svg`](apps/desktop/assets/seals/owl-icon-cream.svg),
  the little owl on a wax seal drawn for a small size, which the app shows on
  the line of a sealed work item.
- [`apps/desktop/assets/icon/app-icon.svg`](apps/desktop/assets/icon/app-icon.svg),
  Owlery's emblem: a warm white owl on a black rounded square, which both
  READMEs open with. Its owl is the owl of `owl.svg` taken out of its wax,
  without the feathers on its forehead and round its eyes, each line 1.8
  times as thick.
- [`apps/desktop/assets/icon/app-icon-small.svg`](apps/desktop/assets/icon/app-icon-small.svg),
  the emblem drawn for 32 pixels and under: the same owl without the feathers
  on its chest and wings, each line 3 times as thick as the seal's.
- [`apps/desktop/assets/icon/app-icon.png`](apps/desktop/assets/icon/app-icon.png),
  the emblem at 1024 pixels, which the app gives the macOS Dock. It is drawn
  from `app-icon.svg` with librsvg 2.58.4, by this command run in
  `apps/desktop`:

  ```
  rsvg-convert -w 1024 -h 1024 assets/icon/app-icon.svg -o assets/icon/app-icon.png
  ```
- [`apps/desktop/assets/icon/earlier-2026-11-19/`](apps/desktop/assets/icon/earlier-2026-11-19/),
  which holds `app-icon.svg`, `app-icon-small.svg` and `app-icon.png`: the
  emblem as releases 0.0.1 through 0.0.3 showed it, whose owl is the owl of
  `owl-icon-cream.svg` taken out of its wax. The build copies none of them.
  Copying them over the files of the same names in `apps/desktop/assets/icon/`
  puts the earlier emblem back.

Each of the two seal drawings is the file of the same name from the
AgenticSeal plugin 0.38.2, unchanged. The emblem's owl is drawn from
`owl.svg` and is a drawing of its own. A later change to `owl.svg` changes
the emblem only where somebody draws the emblem again.

Nothing here reserves any code.
