# Cookbook Palette & Typography Design

**Date:** 2026-05-08
**Status:** Approved — ready for implementation plan

## Goal

Apply a considered, intentional editorial-cookbook design language to the existing Recipe Browser app. Photos will be the visual focus; the chrome should sit quietly underneath them. Component structure, behavior, and accessibility are unchanged — this is a visual restyle.

## Design Principle

Saturation lives in the food photos. Everything in the chrome (surfaces, type, buttons, badges) sits at low chroma so the photos pop. The accent color reads as "the interactive thing" because it's the warmest, deepest tone on the page — not because it's bright.

## Palette

Four colors, each with a defined role.

| Token | Hex | Role |
|---|---|---|
| `cream` | `#FAF6F0` | Page background, button text on accent fills |
| `sand` | `#E8DDD0` | Secondary surfaces, dividers, default category badges, unselected borders, slider track |
| `brown` | `#8B6F47` | Interactive accent — buttons, links, selected borders, slider fill, focus rings, secondary text/labels, step numerals |
| `espresso` | `#2C2416` | Headings, primary body text, icons |

The palette is deliberately restrained. No additional accent color (saffron, tomato, etc.) is added — a brighter accent would compete with food photography even when not directly adjacent to a photo.

## Typography

Geometric sans-serif throughout. No serifs.

- **Heading typeface:** geometric sans (Geist or system fallback to `Helvetica Neue`, `Arial`)
- **Body typeface:** same family
- **Headings:** weight 600, tight letter-spacing (~`-0.02em` for large titles)
- **Section labels** (e.g., "Ingredients", "Instructions", "Servings"): uppercase, tracked-out (~`0.8px`), small (11px), weight 500, espresso-on-cream
- **Meta text** (prep/cook time, "Showing N of M"): uppercase, tracked-out, brown-on-cream, smaller (10–11px)
- **Body copy:** sentence case, normal tracking

**Font loading:** load Geist via Google Fonts (or equivalent CDN). System sans is the fallback. If we want to skip the network request, the system stack alone is acceptable — visually similar on Mac, slightly less crisp on Windows.

## Component Surfaces

### Page background
- `cream` (`#FAF6F0`)

### App header
- Background: `cream`
- Border-bottom: 1px `sand`
- Title: `espresso`, weight 600
- Optional right-aligned recipe count: brown, uppercase, tracked-out

### Recipe list — search input & category select
- Background: white
- Border: 1px `sand`
- Text: `espresso`
- Placeholder/icon: `brown`

### Recipe list — cards
- **Unselected:** background `cream` (matches page), border 1px `sand`. Recedes into the page.
- **Selected:** background `white` (matches detail panel), border 1.5px `brown`. Visually "becomes" the detail panel — same surface, just smaller.
- **Hover (unselected):** border color shifts to `brown`, background stays `cream`. Avoid changing the background on hover so the white-fill of the selected state remains visually distinct from a hovered-but-not-selected card.
- Card title: `espresso`, weight 600
- Description: `brown`, smaller
- Meta line (time, servings): `brown`, uppercase, tracked-out, very small

### Recipe list — category badges
- **On unselected card:** background `sand`, text `espresso`
- **On selected card:** background `brown`, text `cream` (echoes the selected state, ties the badge to the active surface)

### Recipe detail panel
- Background: white
- Border: 1px `sand`
- Border-radius: 12px
- Padding: generous (≥28px)

### Recipe detail — title block
- Title: `espresso`, weight 600, large (~28px), tight tracking
- Description: `brown`, body size
- Meta row (prep / cook / serves): `brown`, uppercase, tracked-out, small
- Category badge: `sand` background, `espresso` text

### Photo grid (recipe-level and per-step)
- Photos sit flush with rounded corners (6px), no frame or border
- `cover` fit, fixed height (recipe: 200px desktop / 110px when 3-up; step: 150px)
- Optional caption below: `brown`, very small, centered

### Dividers
- 1px solid `sand`, no shadow, generous vertical spacing around them

### Servings section
- Section label: uppercase tracked-out `espresso`
- Servings count badge: `brown` background, `cream` text, weight 600 — this is the only place a saturated brown shape appears in body content
- Slider track: `sand` (unfilled) → `brown` (filled portion)
- Slider thumb: `brown` filled circle with `cream` ring

### Ingredients
- Section label: uppercase tracked-out `espresso`
- List items: `espresso` body text, line-height ~1.9 for breathing room
- Quantities (`1 cup`, `2 tbsp`): bold weight, same color

### Instructions
- Section label: uppercase tracked-out `espresso`
- Each step rendered as a 2-column grid: `[step number] [content]`
- Step number: large (~18px), weight 600, `brown`
- Step type chip (PREP / MIX / COOK / etc.): outlined chip — transparent background, 1px `sand` border, `brown` text, uppercase tracked-out, very small
- Step instruction body: `espresso`, body size

### Buttons
- **Primary (filled):** `brown` background, `cream` text
- **Secondary (outlined):** transparent background, 1px `brown` border, `brown` text
- **Tertiary (link):** `brown` text with underline

### Focus rings
- 2px `brown` outline, 2px offset (replaces the existing `#228be6` blue)

## Implementation Approach

Use Mantine's theming system (`MantineProvider` + `createTheme`) to apply the palette and typography globally. Where the existing components reference Mantine semantic colors (`color="blue"`, `c="dimmed"`, `var(--mantine-color-blue-light)`), update them to the new palette tokens.

- **Custom Mantine color scale:** define a `brown` color array (10 shades) with `#8B6F47` at index 6, register as `primaryColor`.
- **Theme overrides:** `defaultRadius`, `fontFamily`, `headings.fontFamily`, `headings.fontWeight`, `colors.brown`, `primaryColor`, `primaryShade`.
- **Body / `<html>` background:** override via global CSS or theme `other`/`components` config so the page itself is `cream`, not white.
- **Card selected state:** replace the existing `bg={... 'var(--mantine-color-blue-light)' : undefined}` logic in `RecipeList.tsx` with explicit white-vs-cream backgrounds and the brown-vs-sand border treatment described above.
- **Step type chip:** the current `<Badge variant="dot" color="gray">` becomes an outlined chip — likely `<Badge variant="outline" color="brown" />` with explicit border and text color overrides.
- **`index.css` focus ring:** change `#228be6` to `#8B6F47`.

## Out of Scope

- Component structure changes (the current `RecipeList`, `RecipeDetail`, types, and data flow stay as-is)
- New features (favorites, sharing, print view, etc.)
- Accessibility refactoring beyond verifying contrast still meets WCAG AA with the new palette
- Photo asset work (the user will add photos separately; this spec only covers how photos are framed)
- Mobile-specific redesign (responsive grid already exists; we keep current breakpoints)

## Acceptance Criteria

- All four palette tokens are defined once and referenced everywhere — no hardcoded hex values scattered through component files
- No Mantine default blue appears anywhere in the rendered UI
- All text on `cream` and on `white` surfaces meets WCAG AA contrast (`espresso` on `cream` ≈ 14:1, `brown` on `cream` ≈ 4.6:1 — verify exact ratios during build)
- Focus indicators visible with brown outline on every interactive element
- Existing tests still pass (visual changes shouldn't break behavioral tests)
