# BRIEF: Darkroom (second home page, for comparison)

Status: **Owner chose the direction; the rest is self-authored under explicit
creative delegation.** The owner asked for the second option offered in the
first interview, built as a separate website, so the two can be compared and
one chosen. Nothing marked "Owner" is paraphrased.

The build lives inside its own Next.js app:

- Page source: `darkroom/src/app/page.tsx`, `darkroom/src/home/`
- Engine: `darkroom/public/vendor/scrollcraft.js` and `darkroom/src/vendor/scrollcraft.css`, both unmodified
- Verification output: `scrollcraft/builds/darkroom/lab/`

It shares the Supabase backend and the admin panel with the first site, so both
render exactly the same content.

---

## 1. Vibe, and references

**Owner (2026-09-27):** "bana önerdiğin ikinci seçenek olan sinematik arayüzü de
implement edebilir misin başka bir website projesi olarak. Hangisi daha güzelse
onu seçeceğim" (Can you also build the cinematic interface, the second option you
suggested, as another website project? I'll pick whichever is more beautiful.)

**The option he chose, as it was shown to him:** "Darkroom: Koyu, sinematik,
fotoğraf odaklı. Film şeridi motifleri, tek vurgu rengi karanlık oda kırmızısı.
Fotoğrafçılık ve 20. yy sinemasına gönderme." (Dark, cinematic, photography
first. Film strip motifs, one accent: darkroom red. A nod to photography and
twentieth century cinema.)

**Owner (first request), his own references:** photography, reading, charcoal,
comics, twentieth century films, sitcoms, history.

**Authored vibe words:** projected, patient, grainy, nocturnal, exact.

References from other media (authored): silent film intertitles; opening and
closing credits on black; anamorphic letterboxing; a contact sheet marked up
in red grease pencil; a print coming up in the developer tray under a safelight.

## 2. The scroll journey

**Authored**, in the order a screening runs:

1. The lights go down and the film starts: name and one line.
2. Opening credits: the real roles, one card at a time.
3. The work runs through the gate as a strip of film.
4. The programme: what he teaches, writes and tells.
5. The darkroom: a photograph develops under the visitor's hand.
6. The contact sheet: the whole site on one sheet, one frame circled.

## 3. The energy curve

Low and patient throughout. A screening, not a trailer. The only loud thing on
the page is the colour of the safelight, once.

## 4. Feeling, stage by stage, and the ONE moment

### Feeling curve (written before the acts)

```
1  Anticipation  black, the gate opens, a projector runs under the scroll
2  Recognition   credits on black, one real role at a time
3  Appetite      the projects slide past like frames through a gate
4  Curiosity     a programme of courses, essays and stories, set plainly
5  Hush -> Awe   the room goes red; a blank sheet; a photograph of İzmir comes
                 up out of nothing, shadows first; then the white light
6  Resolve       the contact sheet, and one frame circled in red: get in touch
```

No two adjacent acts share a feeling. Act 5 is the peak.

### The peak

> "The whole screen went red like a darkroom, there was a blank sheet of
> paper, and as I scrolled a photo of the Kordon slowly came up out of it,
> the dark parts first. Then the light came on."

It gets the largest span on the page (3.8 against 2.2 to 2.4 elsewhere), the
only full-screen colour change, and the only bespoke rendering.

### Authored silence

The first 12% of act 5 has **no copy and no image on purpose**: the ground goes
from black to safelight red and holds. That is the intake of breath before the
print is laid in the tray. The verification pass should read it as authored:
the ground colour changes on every sample through that stretch.

### Tell-someone sentence

> It's the site where the screen goes red like a darkroom and a photograph of
> İzmir slowly develops out of blank paper while you scroll.

## 5. The signature move

**The print develops under the hand.** A WebGL shader over a black and white
print: each pixel stays paper-white until the development front reaches its own
tone, so the deepest shadows appear first, then the midtones, and the sky last,
the way a real silver gelatin print comes up in the tray. The safelight tints
everything red until the development is done; then the light switches to white
and the finished print is seen for the first time in neutral tones. Scroll
position is the development time. Scroll back and it sinks back into the paper.

Not a kit device and not a parameter change: the engine only supplies the
act's progress. The shader, the tone model and the light switch are page code.

## 6. How far from premium-minimal

**Owner (option text):** "Koyu, sinematik". Dark, with one accent that owns a
real role (the safelight, the grease pencil), photographic rather than drawn.
Family: **cinematic editorial**. The site is dark only, on purpose: the owner
chose the dark direction, and a darkroom with the lights on is not a darkroom.

## 7. One unbroken world, or distinct scenes?

**Owner (first interview, for the home page generally):** "Tek kesintisiz dünya".

**Authored decision for this site: distinct scenes.** Cinema is made of cuts, and
this build exists to be compared with a site that is already one unbroken world.
If both flowed the same way the owner would be comparing a colour scheme, not a
direction. The Darkroom look can be applied to a continuous flight later if he
prefers that structure; that is a note for the final report.

## 8. Assets

**Owner (first request):** "MarketingX MCP'sini kullanarak resim, video vs.
üretebilirsin", "unsplash, pexel gibi sitelerden resim - video çekebilirsin",
"Fotoğraf konacak yerler için placeholder alanlar bırakabilirsin."

**Authored plan:**

- **Hero clip:** generated with MarketingX (Kling 3.0, 1080p, 8 s): a projector
  running in a dark booth, one continuous dolly. Pexels was tried first and
  answered with a human-verification check, which is not something to get past.
- **The peak print:** "A train on the tracks" by Elevandos Medya on Unsplash
  (Unsplash License), the Kordon tram at dusk, converted to a black and white
  print. Credited on the page. When he marks one of his own photographs as
  featured in the admin panel, his photograph develops in the tray instead.
- **His own work is never faked.** Projects without a cover appear as title
  cards (the film's own intertitle for that project); empty galleries show
  unexposed frames.

---

## Step 1 answers

1. **What is this, and who is it for?** Owner: a place "kendimi tanıttığım ve
   kendi görüşlerimi, ürettiğim içerikleri paylaşabildiğim bir alan". For
   recruiters, engineers, students and readers.
2. **What must the visitor believe by the end?** *This is a capable engineer
   with range, and the range includes a real eye.*
3. **What does the visitor do next?** One action, one label everywhere:
   **Get in touch**.
4. **What do you already have?** Bio facts, roles, thesis, social links.
5. **Art direction.** Low-key cinematic (worlds.md 1) for the projection, a red
   safelight darkroom for the peak, silver gelatin black and white for prints.

## Grammar: "Screening" (a new grammar)

The page is a feature presented in scenes.

- **Unit:** a scene. Each scene uses a different device and lands on its own
  ground; scenes meet at hard edges (a wipe), never an interpolated ground.
- **The gate law:** projected media always sits inside a gate (2.39:1 on wide
  screens, 4:5 on phones). Type lives in the masking outside the gate, like
  subtitles, and never over the picture, so no scrim is ever needed. The one
  exception is the peak, where the image is a physical print lying in a tray.
- **Nav:** a fixed marquee bar (wordmark, sections, one CTA). Ordinary,
  visible navigation, because a screening has an usher.
- **Hero:** the gate opens on a moving image; the title sits in the masking.
- **Close:** a contact sheet. Every section of the site is a frame; the frame
  that says "Get in touch" is circled in red grease pencil.
- **Forbids:** text over footage, full-bleed media outside a gate, `drift`,
  `magnet`, `spotlight`, more than one `scrub`, a counter.

**Why the defined grammars lost.** 2.1 Filmic one-shot forbids visible sequence
and hard cuts, and cutting is the point. 2.2 Chaptered editorial forbids media
above the fold, and a film opens on a picture. 2.3 Live surface needs a product.
2.4 Continuous world is the first site, and would fail the gate on four of six.
2.5 Typographic poster throws away the photography. 2.6 Gallery / catalog came
closest (the close is a contact sheet) but the page argues before it shows a
range. 2.7 Split stage has no two sides. 2.8 Rhythmic cutlist is paced for energy
brands, and a darkroom is about patience.

## Score

| Scene | Feeling | Device | Span | Why this one |
|---|---|---|---|---|
| Opening | Anticipation | `scrub` in a gate that opens on load | 2.2 | The hand runs the projector |
| Credits | Recognition | `pin` + cue windows on black | 2.2 | Credits hold the frame while the names change |
| Work | Appetite | `pan` | 2.4 | Film runs sideways through a gate; lateral reads as range |
| Programme | Curiosity | `flow` + `in` | natural | Information, compressed |
| Darkroom | Hush, then awe | `pin` + bespoke develop | 3.8 | The peak: largest span, silence first |
| Contact sheet | Resolve | `flow`, holds | natural | The page arrives at an index |

Device families: scrub, pin, pan, flow, bespoke. No device twice in a row, one
scrub, the peak is the largest span by a clear margin (3.8 against 2.4).
Target total around 12.8 viewport-heights, outside the 13.6 to 13.8 band.

## Reduced motion, no JavaScript, WebGL missing

- Reduced motion: no clip is fetched (the poster holds), the gate is simply
  open, cues fade without movement, and the darkroom shows the finished print
  in white light with its caption.
- No WebGL: the print is shown with a CSS fade through the same act progress.
- No JavaScript: every scene is ordinary markup in reading order; cues are
  visible, the print is visible, the contact sheet is a list of links.

---

## Verification record (2026-09-27)

**Fingerprint gate** against the only existing row (the Draft to Ink home page):
grammar differs (Screening vs Continuous world), nav differs (marquee bar vs
waypoint map), hero differs (letterbox scrub vs live-drawn sheet), act shape
differs (six mixed scenes vs seven worldflight legs), close differs (contact
sheet with a grease pencil mark vs camera pull-back to a title block), signature
differs. Six of six.

**Harness** (`scroll-craft/scripts/shoot.mjs`), final runs:

- Desktop 1440 x 900, 8 samples per act: no dead scroll, the clip moves
  whenever it is on screen, every cue peaks, contrast over media clear.
- Phone 390 x 844, 10 samples per act: the same.
- Reduced motion: complete; the darkroom shows the finished print in white
  light. At 4 samples per act two cues are reported as not peaking; that is
  the sampling interval, they peak at 8 and above.

**What the harness got wrong, and was corrected by looking:**

1. The first cut faded the opening picture to black inside its own act. The
   harness passed it ("no dead scroll") because the invisible clip was still
   advancing, but on the sheet it was about one viewport of pure black. The
   picture now stays up and the credits wipe up over it.
2. Credits cross-dissolved in the same place and read as a double exposure.
   They now fade through black, one card at a time.
3. The safelight was a dimmer from 0.70 to 0.74, which left a muddy pink state
   anyone could park on. It is now a switch at 0.72 with a 240 ms warm-up.
4. The contact sheet did not fit the last screen. It now sits beside its
   heading and is sized from the screen height, so all nine frames and the
   circled one are visible on the final screen.

**Feel check** (not cold: the page had been looked at many times by then, so
this is a diff against the sheets rather than a first impression):

| Scene | Intended | Felt | Change |
|---|---|---|---|
| Opening | Anticipation | Anticipation | none |
| Credits | Recognition | Weight, then recognition | credits made to fade through black |
| Work | Appetite | Orderly, a little flat | none possible yet: every project is a title card because no project has a cover. It becomes the most visual scene once covers are uploaded |
| Programme | Curiosity | Calm reading | acceptable: it is the silence before the peak |
| Darkroom | Hush, then awe | Surprise, then awe | the switch made instant |
| Contact sheet | Resolve | Resolve | sized to fit the last screen |

The peak reads as the peak: it is the largest visual change on the sheet (the
only full-screen colour) and holds the most scroll (3.8 against 2.6 next). The
act before it is the quietest on the page. The last screen stands still with
content on it.

**Not verified:** a real phone (headless Chrome cannot reproduce an iPhone's
video decoder or Low Power Mode), and his own photograph developing in the tray
(no gallery item is marked featured yet; the code path loads it with CORS and
falls back to the CSS fade if the image cannot be read by WebGL).
