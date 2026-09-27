# BRIEF: dogukantopcu.com home page

Status: **Interviewed (3 questions answered by the owner on 2026-09-20), remaining
topics reused from the owner's written request or authored and labeled as such.**
Nothing below marked "Owner" is paraphrased. Owner answers were given in Turkish
and are recorded verbatim with a translation.

The scroll-craft build lives inside the Next.js app, not in this folder:

- Page source: `web/src/app/(home)/`
- World renderer and constructions: `web/src/home/`
- Engine (unmodified copy): `web/src/vendor/scrollcraft/`
- Verification output: `scrollcraft/builds/home/lab/`

---

## 1. Vibe in three to five words, plus references

**Owner (choice):** "Draft to Ink (Recommended)". Option text as shown to the owner:
"Kağıt + grafit, tek vurgu rengi mavi kurşun kalem. Açık tema eskiz kağıdı, koyu
tema blueprint. Mavi taslak çizgileri scroll ettikçe mürekkeplenmiş içeriğe
dönüşür. Mühendis + çizer kimliğini birleştirir; fotoğraf placeholder'ları
bilinçli tasarım gibi durur."
(Paper and graphite, one accent: blue pencil. Light theme is sketch paper, dark
theme is a blueprint. Blue draft lines turn into inked content as you scroll. It
joins the engineer and the draughtsman; photo placeholders read as deliberate.)

**Owner (from the written request), references from his own life rather than
from other sites:** "Fotoğrafçılık, Kitap Okumak, Karakalem, Çizgi Roman, 20.
yüzyıl Filmleri, Sitcom, tarih" (photography, reading, charcoal drawing, comics,
20th century films, sitcoms, history).

**Authored vibe words:** drafted, inked, precise, warm, unhurried.

References in other media that the direction borrows from (authored):
- Comics production: non-photo blue underdrawing that survives under the ink.
- Engineering drawing sheets: border, zones, dimension lines, title block.
- Cyanotype and blueprint: the dark theme.

## 2. The scroll journey, section by section

**Owner (from the written request):** a home page "kendimi tanıttığım" (where I
introduce myself), then the writing and the galleries: courses, blog (books,
games, interesting topics, films), projects (software, game dev, robotics, ML,
AI), books and stories, academic publications, and four galleries (drawings,
data viz / digital art / animation, photographs, UI designs).

**Authored sequence of waypoints on one sheet:**
1. Title: the name, what he does.
2. Profile: the career as a dimensioned timeline (2019 to now), education, roles.
3. Research: small language models and hybrid architectures (the thesis).
4. Work: projects by discipline.
5. Writing: courses, blog, stories.
6. Gallery: drawings, photographs, digital art, UI. The other half.
7. Sheet: the camera pulls back, the whole drawing, the title block with contact.

## 3. The energy curve

**Authored.** Quiet open, steady build through Profile, Research and Work, warm
in Writing, loosest and most playful in Gallery, then a breath of silence and
the largest move on the page (the pull-back), landing on a still, complete
sheet. Never loud. The page is a drawing being made, not a show.

## 4. Feeling, stage by stage, and the ONE moment

**Owner (choice):** "Sayfa kendini çizer". Option text: "Başlıklar ve çerçeveler
önce mavi kalem taslağı olarak gelir, scroll ettikçe mürekkeple dolar."
(The page draws itself. Headlines and frames first arrive as blue pencil drafts
and fill with ink as you scroll.)

### Feeling curve (written before the legs existed)

```
1  Curiosity     an almost empty sheet; a name drafted in blue that inks as the hand moves
2  Recognition   a career laid out as a dimensioned line with real years on it
3  Intrigue      a model schematic assembling block by block, the thesis named plainly
4  Appetite      empty blue frames inking into project covers, one discipline after another
5  Kinship       ruled notebook pages and one line in his own voice about writing to learn
6  Delight       the pencil loosens: a lens, a thirds grid, comic panels; the other half of him
7  Awe, then calm  silence, the camera pulls back, the whole sheet is one finished drawing
```

No two adjacent legs share a feeling. Leg 7 is the peak and the ending at once,
which is allowed because the ending resolves and holds (feel.md section 2).

### The peak

> "I kept scrolling across this drawing, and at the end it zoomed out and the
> whole thing I had just travelled through was one finished sheet, with his
> contact details in the title block like an engineering drawing."

Lives in leg 7 (Sheet). It gets the largest weight on the page (1.9 against 1.0
to 1.3 elsewhere), the silence before it, and the only scale change of that
size.

### Authored silence

The first ~30% of leg 7 has **no copy window open on purpose**. The Gallery
copy has closed, the finale copy has not opened, and the camera is already
pulling back. The verification pass should read that as anticipation, not as
dead scroll: the world is visibly moving (scale and position change every
sample).

### Tell-someone sentence

> It's the site where the whole page is one big technical drawing that inks
> itself as you scroll, and at the end the camera pulls back and you see the
> entire sheet you just travelled.

The signature move and this sentence point at the same thing.

## 5. One thing this site does that no site they have seen does

**Owner (choice, same answer as 4):** the page draws itself.

**Authored signature move: the inked sheet.** One continuous drafting sheet
rendered live on a canvas. Every construction exists twice, as a jittered blue
pencil underdrawing and as a confident ink pass, and scroll position is the
draughtsman's hand: blue arrives first, ink follows a beat later, and the blue
stays faintly visible under the ink the way it does on a real comics page. The
route the camera flies is itself drawn on the sheet, so the final pull-back
shows a record of the visit. Headlines in the copy layer use the same grammar:
blue outline first, ink fill wiping across as the window opens.

Not a kit device and not a parameter change: the engine has no canvas world, no
draw-on, no camera. It supplies the track, the legs, the copy windows and the
waypoint events. Everything drawn is page-local code.

## 6. How far from premium-minimal

**Owner (choice):** Draft to Ink, which sits in the **Editorial / technical
drawing** family (worlds.md number 8, the sanctioned non-photographic world),
not premium-minimal and not dark-with-one-accent by default. Light is the
primary theme (paper). Dark exists as a blueprint, chosen by the system setting
or the toggle.

## 7. One unbroken world, or distinct scenes?

**Owner (choice):** "Tek kesintisiz dünya". Option text: "Scroll'un içinden
geçtiği tek bir mekan. En pahalı seçenek: üretilmiş video zinciri ve daha fazla
kredi gerekir." (One unbroken world. A single place the scroll travels through.)

**Authored consequence:** grammar 2.4, Continuous world, in worldflight mode.
The world is a drawing, so it is rendered live rather than generated as a video
chain. That keeps the grammar's law (one fixed stage, one spacer, no seams, a
map for nav, arrival for a close) and removes the generated-video cost and the
seam risk entirely. It also keeps AI-made imagery off the personal site of
someone who actually draws.

## 8. Assets

**Owner:** "Fotoğraf konacak yerler için placeholder alanlar bırakabilirsin."
(You can leave placeholder areas where photos will go.) "MarketingX MCP'sini
kullanarak resim, video vs. üretebilirsin", "unsplash, pexel gibi sitelerden
resim - video çekebilirsin." No owned photos supplied yet. Social links
supplied: LinkedIn, X, YouTube.

**Authored plan:**
- The world needs no raster assets. It is geometry.
- His own work (portrait, drawings, photographs, UI shots) is never faked.
  Missing images render as drafted blue frames with a diagonal cross, which is
  the world's native idiom for "not inked yet".
- Generated imagery is limited to a small, consistent set of category cover
  photographs used as fallbacks for posts, projects and courses without a cover.

---

## Step 1 answers

1. **What is this, and who is it for?** Owner: a place "kendimi tanıttığım ve
   kendi görüşlerimi, ürettiğim içerikleri paylaşabildiğim bir alan" (where I
   introduce myself and share my views and what I make). For recruiters and
   engineers reading it like a CV, for students taking the courses, and for
   himself as motivation.
2. **What must the visitor believe by the end?** Authored from the owner's
   goals ("Kendimi ve yeterliliğimi göstermek"): *this is a capable engineer
   with range, and the range includes a real artistic practice.*
3. **What does the visitor do next?** One action, one label everywhere on the
   page: **Get in touch**. Every other link is navigation into the site.
4. **What do you already have?** Bio facts, roles, stack, thesis topic, social
   links. No images yet.
5. **Art direction.** Technical drawing (worlds.md 8), owner's choice via
   Draft to Ink.

## Journey beats

```
1  Arrival       a name and a plain sentence about what he does
2  Credibility   seven years, real roles, real dates
3  Depth         the research question he spent his thesis on
4  Proof         things he built
5  Voice         things he writes and teaches
6  Surprise      the artist
7  Resolution    the whole sheet, and how to reach him
```

## Grammar

**2.4 Continuous world (worldflight).** Owner's explicit choice. Why the other
seven lost: the owner asked for one unbroken place, which rules out the five
grammars built from sections or cuts (filmic, chaptered, cutlist, split stage,
gallery). Live surface does not apply (no product). Typographic poster was the
closest runner-up and loses because the owner's peak is a drawing, not a word.

Nav is a **map**: a clickable waypoint rail with a position marker. Hero is an
establishing position on the sheet. Close is arrival at the title block, and
the CTA is an object in that place (a field of the title block).

## Score (legs, not acts)

| Leg | Waypoint | Weight (vh) | What draws | Why |
|---|---|---|---|---|
| 0 | Title | 1.0 | Sheet border, zone ticks, lettering guides | Establish that this is a drawing and that the hand moves it |
| 1 | Profile | 1.3 | Dimensioned career timeline | Real dates are the one place a dimension line is honest |
| 2 | Research | 1.1 | Layer-stack schematic | A schematic is how this subject is actually drawn |
| 3 | Work | 1.3 | Isometric blocks, frames | Built things, drawn as built things |
| 4 | Writing | 1.2 | Ruled pages, margin, index tabs | The notebook |
| 5 | Gallery | 1.3 | Lens and aperture, thirds grid, comic panels | The loosest drawing on the sheet |
| 6 | Sheet | 1.9 | Nothing new: the pull-back | Peak. Largest weight, silence in front |

Total 9.1 + 1 viewport of landing room = 10.1 viewport-heights. Outside the
13.6 to 13.8 band. One pace: every leg moves the camera a comparable distance
per viewport of scroll except the pull-back, which is the single long leg
(feel.md section 5, worldflight exception).

Pace, lerp and seam: camera lerp 0.12, `data-sc-seam="0.16"`, per
worldflight.md 7c.

## Reduced motion, no JavaScript, small screens

The same markup serves a static document: every waypoint is an ordinary section
in normal flow with its construction rendered as an inline SVG, fully inked.
Flight mode is an enhancement that mounts only when JavaScript runs and the
visitor has not asked for reduced motion. Phones get their own camera
keyframes (portrait framing, construction above, copy in a bottom band).
