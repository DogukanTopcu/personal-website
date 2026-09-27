# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| dogukantopcu.com home | 2.4 Continuous world (worldflight) | Map: a seven stop waypoint rail, clickable, drawn beside the sheet | Establishing position on a live-rendered drafting sheet; the monogram drafts itself in blue on a clock, no video | 7 legs, 1.0 / 1.3 / 1.1 / 1.3 / 1.2 / 1.3 / 1.9, total 9.1vh + 1 landing | Camera pulls back to the whole sheet; the CTA is a field in an engineering title block in the bottom-right corner | The inked sheet: every stroke exists twice, as jittered blue pencil and as ink, and scroll is the draughtsman's hand | Technical drawing (worlds.md 8), light paper primary, blueprint dark | web/src/home |

*(empty: your first build has nothing to clear, so build whatever the interview
points at. From the second onwards, this table is the constraint.)*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

Nothing is taken yet.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
| dogukantopcu.com, Darkroom (second direction) | "Screening", a new grammar: scenes meet at hard edges, projected media lives inside a gate and all type sits outside it | Fixed marquee bar on black: wordmark, sections, one outlined CTA; every link a full load | A letterbox gate opens from a line on load; a generated projector clip scrubs inside it; the name sits under the screen | 6 scenes: scrub 2.2 > pin (credits) 2.6 > pan (film strip) 2.2 > flow (programme) > pin (darkroom, peak) 3.8 > flow (contact sheet); 13.1vh | A contact sheet of the whole site on a sheet of paper; the "Get in touch" frame is circled in red grease pencil | The print develops under the hand: a WebGL tone front brings the shadows up first and the sky last, then the safelight clicks off | Low-key cinematic, red safelight darkroom, silver gelatin prints; dark only | darkroom/src/home |
