# E.ON Next — Digital Branding & UI Replication Sheet

---

## 1. Brand colours

### Core palette

| Token | Hex | Usage |
|---|---|---|
| Orange | `#ff4822` | Primary buttons, hero backgrounds, h1 highlights |
| Orange Hover | `#e6411f` | Hover states for primary buttons |
| Windsor (Purple) | `#5e0d98` | Feature banners, secondary headings |
| Grape (Dark Purple) | `#36164a` | Primary body text, card headings, modal titles |
| Birch / Dawn Pink | `#faf6f4` | Global body background, badges, activity boxes |
| White | `#fff` | Cards, modal backgrounds, secondary buttons |
| Gray (Purple Tint) | `#7e6886` | Paragraph text inside cards and modals |

### Data & chart colours

| Token | Hex |
|---|---|
| Sun (Yellow) | `#FFDE00` |
| Flash (Pink) | `#FF83FF` |
| Cloud (Cyan) | `#00E3FF` |
| Leaf (Green) | `#1AE570` |
| Gas Off State (Purple) | `#9254FF` |
| Gas On State (Red) | `#FF4722` |

### Shadow colours (illustrative assets / characters)

| Background | Shadow hex |
|---|---|
| On Birch / Dawn Pink | `#F2E6E1` |
| On Red / Orange | `#E50000` |
| On Purple | `#170920` |

---

## 2. Typography, copywriting & storage

### Font families

```css
/* Display / Headings */
font-family: 'HaasGrotDisplay', -apple-system, BlinkMacSystemFont, Arial, sans-serif;

/* Body text */
font-family: 'HaasGrotText', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
```

### Local font storage

For any given file, the web fonts (`.woff` format) are stored in the `fonts` directory. The available files are:

- `fonts/HaasGrot-Disp-Bold.woff`
- `fonts/HaasGrot-Disp-BoldItalic.woff`
- `fonts/HaasGrot-Disp-Italic.woff`
- `fonts/HaasGrot-Disp-Regular.woff`
- `fonts/HaasGrot-Text-Bold.woff`
- `fonts/HaasGrot-Text-BoldItalic.woff`
- `fonts/HaasGrot-Text-Italic.woff`
- `fonts/HaasGrot-Text-Regular.woff`

**Fallbacks:** Helvetica Neue 75 Bold (headlines) and Helvetica Neue 55 Normal (body), or standard Helvetica if HaasGrot fails to load.

### Copywriting rules

- **Sentence case:** headlines must always be in sentence case (only capitalise the first letter and proper nouns).
- **Spacing:** never alter line spacing beyond the approved branded settings (base `line-height: 1.5`).
- **Formatting:** avoid leaving "widows" (a single line of text at the top of a column) or "orphans" (a single word on its own line at the end of a paragraph).
- **Legibility:** text should never sit directly on top of busy photography or distracting backgrounds.
- **Padding:** on headline text, set bottom padding so body copy aligns directly beneath it. Info boxes should have consistent top/bottom padding when sitting above/below imagery.

---

## 3. UI components

### Border radii

| Token | Value | Applies to |
|---|---|---|
| `--radius-md` | `1rem` | Cards, banners, modals, activity boxes |
| `--radius-xl` | `2.5rem` | Buttons (creating a pill shape) |

### Buttons

- **Primary:** padding `14px 28px`, font `1rem` bold, radius `2.5rem`, background `#ff4822`, text `#fff`
- **Secondary:** background `#fff`, text `#36164a`

### Cards & modals

- **Cards:** padding `2.5rem`, radius `1rem`, background `#fff`, shadow `0 10px 30px rgba(54, 22, 74, 0.05)`
- **Modal overlays:** background `rgba(54, 22, 74, 0.85)` with `backdrop-filter: blur(5px)`

---

## 4. Brand characters ("The Task Force")

### Roster

- **The Leaf** — gives 100% to the planet ("going green").
- **The Sun** — a warm/friendly force representing solar & renewable energy.
- **The Flash** — represents electricity, buzzing with positive energy.
- **The Cloud** — stands for wind power, an unstoppable renewable force.
- **The Gas Twins** — reflects the changing state of gas in the industry.

### Rules for usage

- **Less is more:** use sparingly. One character scenario per page is recommended to highlight key moments.
- **They do not speak:** characters are silent. Speech bubbles must only come from devices (phones, laptops).
- **No festivities:** do not dress characters up for holidays (e.g. no Santa hats).
- **Strict placement:** characters and photography should never appear on the same page.
- Do not warp, redraw, or apply tie-dye effects to them.

---

## 5. Photography & logos

### Photography

- **Tiers:** lifestyle, sustainable spaces, people, products.
- **Usage:** use sparingly (max one per slide/view). Full bleed is preferred.
- **Formatting:** do not change the shape of the image box or add an outline.

### Logo application

- Primary logo is for the intro/header only.
- Must sit on a plain background.
- Do not apply drop shadows or warp effects.
- The "Next" portion must always be visually larger than "E.ON".

---

## Appendix A — Implementation snippets

### CSS custom properties

```css
:root {
  /* Core palette */
  --orange:        #ff4822;
  --orange-hover:  #e6411f;
  --windsor:       #5e0d98;
  --grape:         #36164a;
  --birch:         #faf6f4;
  --white:         #ffffff;
  --gray:          #7e6886;

  /* Data & chart */
  --sun:           #FFDE00;
  --flash:         #FF83FF;
  --cloud:         #00E3FF;
  --leaf:          #1AE570;
  --gas-off:       #9254FF;
  --gas-on:        #FF4722;

  /* Character shadows */
  --shadow-birch:  #F2E6E1;
  --shadow-red:    #E50000;
  --shadow-purple: #170920;

  /* Radii */
  --radius-md:     1rem;
  --radius-xl:     2.5rem;

  /* Type */
  --font-display:  'HaasGrotDisplay', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  --font-text:     'HaasGrotText', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  --line-height:   1.5;
}
```

### @font-face declarations

```css
/* --- Display / Headings --- */
@font-face {
  font-family: 'HaasGrotDisplay';
  src: url('fonts/HaasGrot-Disp-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'HaasGrotDisplay';
  src: url('fonts/HaasGrot-Disp-Italic.woff') format('woff');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'HaasGrotDisplay';
  src: url('fonts/HaasGrot-Disp-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'HaasGrotDisplay';
  src: url('fonts/HaasGrot-Disp-BoldItalic.woff') format('woff');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}

/* --- Body Text --- */
@font-face {
  font-family: 'HaasGrotText';
  src: url('fonts/HaasGrot-Text-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'HaasGrotText';
  src: url('fonts/HaasGrot-Text-Italic.woff') format('woff');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'HaasGrotText';
  src: url('fonts/HaasGrot-Text-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'HaasGrotText';
  src: url('fonts/HaasGrot-Text-BoldItalic.woff') format('woff');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}

/* Base application */
body {
  background: var(--birch);
  color: var(--grape);
  font-family: var(--font-text);
  line-height: var(--line-height);
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
}
```

### Component snippets

```css
.btn-primary {
  padding: 14px 28px;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  border-radius: var(--radius-xl);
  background: var(--orange);
  color: var(--white);
  border: none;
  cursor: pointer;
}
.btn-primary:hover { background: var(--orange-hover); }

.btn-secondary {
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: var(--radius-xl);
  background: var(--white);
  color: var(--grape);
  border: none;
  cursor: pointer;
}

.card {
  padding: 2.5rem;
  border-radius: var(--radius-md);
  background: var(--white);
  box-shadow: 0 10px 30px rgba(54, 22, 74, 0.05);
}
.card p { color: var(--gray); }

.modal-overlay {
  background: rgba(54, 22, 74, 0.85);
  backdrop-filter: blur(5px);
}
```

---

## Appendix B — Font file provenance

The `.woff` files in `fonts/` were generated from the **Neue Haas Grotesk Display Pro** TTFs in
`neue-haas-grotesk-display-pro-cufonfonts/`, converted with fontTools (a `.ttf` cannot simply be
renamed to `.woff` — WOFF is a compressed container with its own header).

| Output file | Source TTF | Notes |
|---|---|---|
| `HaasGrot-Disp-Regular.woff` | `NeueHaasDisplayRoman.ttf` | — |
| `HaasGrot-Disp-Italic.woff` | `NeueHaasDisplayRomanItalic.ttf` | — |
| `HaasGrot-Disp-Bold.woff` | `NeueHaasDisplayBold.ttf` | — |
| `HaasGrot-Disp-BoldItalic.woff` | `NeueHaasDisplayBoldItalic.ttf` | — |
| `HaasGrot-Text-Regular.woff` | `NeueHaasDisplayRoman.ttf` | **Substitute** |
| `HaasGrot-Text-Italic.woff` | `NeueHaasDisplayRomanItalic.ttf` | **Substitute** |
| `HaasGrot-Text-Bold.woff` | `NeueHaasDisplayBold.ttf` | **Substitute** |
| `HaasGrot-Text-BoldItalic.woff` | `NeueHaasDisplayBoldItalic.ttf` | **Substitute** |

**Outstanding:** the download only contains the *Display* optical size. The four `HaasGrot-Text-*`
files are currently Display cuts standing in so nothing 404s. Neue Haas Grotesk **Text** Pro is a
separate optical size (looser spacing, slightly larger x-height, designed for body copy) — when the
real Text Pro files are available, drop them into `fonts/` over the substitutes. No CSS changes
needed.

Unused weights still available in the source folder if the brand ever calls for them: Black,
Medium, Light, Thin, XThin, XXThin (each with an italic).
