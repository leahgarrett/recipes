# Cookbook Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the cookbook palette and geometric sans-serif typography defined in `docs/superpowers/specs/2026-05-08-cookbook-palette-design.md` to the existing Recipe Browser UI without changing component structure or behavior.

**Architecture:** Centralize the design tokens in a single Mantine theme module (`src/theme.ts`) wired into every `MantineProvider` (production and tests). Component-level styling uses Mantine's existing `color`, `bg`, `styles`, and `variant` props with the new tokens — no parallel CSS-in-JS layer. A small global CSS update covers body background and the focus ring.

**Tech Stack:** React 18, TypeScript, Mantine 7, Vite, Vitest + Testing Library.

**Testing strategy:** The theme module gets its own unit tests (Task 1). Existing component tests continue to act as regression protection — they assert behavior and accessibility, both of which the restyle must not break. Visual correctness is verified by running `npm run dev` against each restyled component (Tasks 5–10) and a final whole-app pass (Task 11).

**Spec source:** `docs/superpowers/specs/2026-05-08-cookbook-palette-design.md`

---

## File Structure

**Create:**
- `src/theme.ts` — palette tokens, font config, Mantine theme export
- `src/theme.test.ts` — asserts theme exports the expected tokens
- `src/test/render.tsx` — shared test render helper that wraps with the themed `MantineProvider`

**Modify:**
- `index.html` — add Geist font `<link>` tag
- `src/index.css` — body background, focus ring color, font fallback stack
- `src/main.tsx` — no change needed (MantineProvider lives in App.tsx)
- `src/App.tsx` — pass theme to all three `MantineProvider` instances; restyle header
- `src/components/RecipeList.tsx` — selected/unselected card surfaces, badge logic, chrome typography
- `src/components/RecipeList.test.tsx` — switch to shared render helper
- `src/components/RecipeDetail.tsx` — section labels, servings/slider styling, ingredients & instructions layout, step chip restyle
- `src/components/RecipeDetail.test.tsx` — switch to shared render helper

**Untouched:**
- `src/types/Recipe.ts`, `src/utils/recipeScaling.ts`, `public/recipes.json`, test setup

---

## Palette Reference (used throughout)

```ts
const PALETTE = {
  cream:    '#FAF6F0',  // page bg, button text on accent fills
  sand:     '#E8DDD0',  // surfaces, dividers, default badges, unselected borders
  brown:    '#8B6F47',  // interactive accent, secondary text
  espresso: '#2C2416',  // headings, primary body text
};
```

---

## Task 1: Theme module

**Files:**
- Create: `src/theme.ts`
- Test: `src/theme.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/theme.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { theme, palette } from './theme';

describe('theme', () => {
  it('exports the cookbook palette tokens', () => {
    expect(palette).toEqual({
      cream: '#FAF6F0',
      sand: '#E8DDD0',
      brown: '#8B6F47',
      espresso: '#2C2416',
    });
  });

  it('registers brown as a Mantine color scale with primary shade 6', () => {
    expect(theme.colors?.brown).toBeDefined();
    expect(theme.colors?.brown).toHaveLength(10);
    expect(theme.colors?.brown?.[6]).toBe('#8B6F47');
    expect(theme.primaryColor).toBe('brown');
    expect(theme.primaryShade).toEqual({ light: 6, dark: 6 });
  });

  it('uses a geometric sans-serif font family with Geist first', () => {
    expect(theme.fontFamily).toMatch(/^Geist,/);
    expect(theme.headings?.fontFamily).toMatch(/^Geist,/);
    expect(theme.headings?.fontWeight).toBe('600');
  });

  it('uses md as the default radius', () => {
    expect(theme.defaultRadius).toBe('md');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm test -- --run src/theme.test.ts`
Expected: FAIL — `Cannot find module './theme'`.

- [ ] **Step 3: Create `src/theme.ts`**

```ts
import { createTheme, type MantineColorsTuple } from '@mantine/core';

export const palette = {
  cream: '#FAF6F0',
  sand: '#E8DDD0',
  brown: '#8B6F47',
  espresso: '#2C2416',
} as const;

const brown: MantineColorsTuple = [
  '#F5EFE6',
  '#EADFCC',
  '#D9C5A4',
  '#C5A87C',
  '#B08F60',
  '#9C7B50',
  '#8B6F47', // primary shade
  '#6F5839',
  '#54422B',
  '#3A2D1E',
];

const FONT_STACK =
  'Geist, "Helvetica Neue", Helvetica, Arial, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const theme = createTheme({
  primaryColor: 'brown',
  primaryShade: { light: 6, dark: 6 },
  defaultRadius: 'md',
  fontFamily: FONT_STACK,
  colors: { brown },
  headings: {
    fontFamily: FONT_STACK,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test -- --run src/theme.test.ts`
Expected: PASS — all four assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/theme.ts src/theme.test.ts
git commit -m "Add cookbook palette theme module"
```

---

## Task 2: Shared test render helper + apply theme in App.tsx

**Files:**
- Create: `src/test/render.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/RecipeList.test.tsx` (lines 37–39)
- Modify: `src/components/RecipeDetail.test.tsx` (lines 25–27)

- [ ] **Step 1: Write the shared render helper**

Create `src/test/render.tsx`:

```tsx
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import type { ReactElement } from 'react';

export function renderWithTheme(ui: ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}
```

- [ ] **Step 2: Update `RecipeList.test.tsx` to use the shared helper**

Replace the local `renderWithMantine` helper (currently at lines 37–39) with an import. Replace every call to `renderWithMantine(...)` with `renderWithTheme(...)` inside the file.

```tsx
// at top of file, replace the MantineProvider import with:
import { renderWithTheme } from '../test/render';
```

Delete the local function:

```tsx
// REMOVE this block:
function renderWithMantine(component: React.ReactElement) {
  return render(<MantineProvider>{component}</MantineProvider>);
}
```

Then replace `renderWithMantine` → `renderWithTheme` throughout the file (5 call sites).

Also remove the now-unused imports `render` from `@testing-library/react` and `MantineProvider` from `@mantine/core` — verify they aren't used elsewhere in the file before removing.

- [ ] **Step 3: Update `RecipeDetail.test.tsx` to use the shared helper**

Same treatment as Step 2 — replace local helper with import, swap call sites (6 of them).

- [ ] **Step 4: Update `src/App.tsx` to pass `theme` to all three `MantineProvider` instances**

In `src/App.tsx`:

```tsx
// add import near top
import { theme } from './theme';
```

Then change every `<MantineProvider>` and `<MantineProvider defaultColorScheme="light">` to `<MantineProvider theme={theme}>`. There are three: the loading state (line 38), the error state (line 48), and the main app (line 59). The `defaultColorScheme="light"` prop on line 59 can be removed — light is the default.

- [ ] **Step 5: Run all tests to confirm nothing broke**

Run: `npm test -- --run`
Expected: ALL PASS — same number of tests as before, all green. The theme application changes the rendered colors but not the DOM structure or accessibility, so behavioral tests should be unaffected.

- [ ] **Step 6: Commit**

```bash
git add src/test/render.tsx src/App.tsx src/components/RecipeList.test.tsx src/components/RecipeDetail.test.tsx
git commit -m "Apply cookbook theme via MantineProvider in app and tests"
```

---

## Task 3: Global CSS + Geist font loading

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Add the Geist font link to `index.html`**

Open `index.html`. Inside `<head>`, add the Google Fonts preconnect + stylesheet links above the existing module script. The result should look like (showing the relevant block):

```html
<head>
  <!-- existing meta tags -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- existing script tag -->
</head>
```

- [ ] **Step 2: Update `src/index.css`**

Replace the entire file contents with:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: #FAF6F0;
  color: #2C2416;
  font-family: Geist, 'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*:focus-visible {
  outline: 2px solid #8B6F47;
  outline-offset: 2px;
}

.skip-to-main {
  position: absolute;
  left: -9999px;
  z-index: 999;
}

.skip-to-main:focus {
  left: 0;
  top: 0;
  padding: 1rem;
  background: #8B6F47;
  color: #FAF6F0;
  text-decoration: none;
}
```

- [ ] **Step 3: Run dev server and visually confirm**

Run: `npm run dev`
Open the URL printed by Vite (typically `http://localhost:5173/recipes/`). Expected:
- Page background is cream (`#FAF6F0`), not white
- Body text renders in Geist (or Helvetica fallback if Geist failed to load — open DevTools Network tab to confirm Geist loaded)
- Tabbing through interactive elements shows a brown focus ring, not blue

Stop the dev server (Ctrl+C) before committing.

- [ ] **Step 4: Run all tests**

Run: `npm test -- --run`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html src/index.css
git commit -m "Load Geist font and apply cream/brown global CSS"
```

---

## Task 4: App header restyle

**Files:**
- Modify: `src/App.tsx` (the AppShell.Header block, currently lines 64–70)

- [ ] **Step 1: Update the header markup**

Replace the existing `AppShell.Header` block in `src/App.tsx`:

```tsx
<AppShell.Header style={{ backgroundColor: '#FAF6F0', borderBottom: '1px solid #E8DDD0' }}>
  <Container size="xl" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Title order={1} size="h2" c="#2C2416" style={{ letterSpacing: '-0.01em' }}>
      Recipe Browser
    </Title>
    <Text
      size="xs"
      c="#8B6F47"
      style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}
    >
      {recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'}
    </Text>
  </Container>
</AppShell.Header>
```

- [ ] **Step 2: Run all tests**

Run: `npm test -- --run`
Expected: ALL PASS. (No header tests exist; this just confirms nothing else regressed.)

- [ ] **Step 3: Visually verify in dev server**

Run: `npm run dev`. Confirm:
- Header has cream background with a 1px sand bottom border
- "Recipe Browser" title in espresso, slightly tightened tracking
- Right-aligned "12 RECIPES" (or actual count) in brown, uppercase, tracked-out

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "Restyle app header with cookbook palette"
```

---

## Task 5: RecipeList card surfaces

**Files:**
- Modify: `src/components/RecipeList.tsx` (the Card block, currently lines 56–99)

- [ ] **Step 1: Update the card block**

In `src/components/RecipeList.tsx`, replace the `<Card>` and its children (currently lines 56–99) with:

```tsx
<Card
  shadow="none"
  padding="md"
  radius="md"
  withBorder
  style={{
    cursor: 'pointer',
    backgroundColor: selectedRecipeId === recipe.id ? '#FFFFFF' : '#FAF6F0',
    borderColor: selectedRecipeId === recipe.id ? '#8B6F47' : '#E8DDD0',
    borderWidth: selectedRecipeId === recipe.id ? 1.5 : 1,
    transition: 'border-color 120ms ease',
  }}
  onMouseEnter={(e) => {
    if (selectedRecipeId !== recipe.id) {
      e.currentTarget.style.borderColor = '#8B6F47';
    }
  }}
  onMouseLeave={(e) => {
    if (selectedRecipeId !== recipe.id) {
      e.currentTarget.style.borderColor = '#E8DDD0';
    }
  }}
  onClick={() => onSelectRecipe(recipe)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectRecipe(recipe);
    }
  }}
  tabIndex={0}
  role="button"
  aria-pressed={selectedRecipeId === recipe.id}
  aria-label={`View recipe: ${recipe.name}`}
>
  <Group justify="space-between" mb="xs" wrap="nowrap">
    <Text fw={600} size="md" c="#2C2416" component="h2" style={{ letterSpacing: '-0.01em' }}>
      {recipe.name}
    </Text>
    <Badge
      variant="filled"
      color={selectedRecipeId === recipe.id ? 'brown' : 'gray'}
      style={
        selectedRecipeId === recipe.id
          ? { backgroundColor: '#8B6F47', color: '#FAF6F0' }
          : { backgroundColor: '#E8DDD0', color: '#2C2416' }
      }
      styles={{ root: { fontWeight: 500, letterSpacing: '0.06em' } }}
    >
      {recipe.category}
    </Badge>
  </Group>

  <Text size="sm" c="#8B6F47" mb="sm" style={{ lineHeight: 1.5 }}>
    {recipe.description}
  </Text>

  <Group gap="xs">
    <Text size="xs" c="#8B6F47" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <span aria-label="Preparation time">⏱ Prep {recipe.prepTime}</span>
    </Text>
    <Text size="xs" c="#8B6F47" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <span aria-label="Cooking time">· Cook {recipe.cookTime}</span>
    </Text>
    <Text size="xs" c="#8B6F47" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <span aria-label="Number of servings">· Serves {recipe.servings}</span>
    </Text>
  </Group>
</Card>
```

Note: the `bg=` prop on the previous version is replaced by inline `style.backgroundColor`. The existing `aria-pressed` semantics are unchanged so existing tests remain valid.

- [ ] **Step 2: Run RecipeList tests**

Run: `npm test -- --run src/components/RecipeList.test.tsx`
Expected: ALL PASS — accessibility attributes (`role="button"`, `aria-pressed`, `aria-label`) are preserved; click/keyboard handlers unchanged.

- [ ] **Step 3: Visually verify in dev server**

Run: `npm run dev`. Click through several recipes. Confirm:
- Selected card has white background and brown 1.5px border
- Unselected cards have cream background and sand 1px border
- Hovering an unselected card swaps its border to brown
- Selected card's category badge is brown-on-cream; unselected cards' badges are sand-on-espresso
- Card title is espresso, description is brown, meta line is brown uppercase tracked

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeList.tsx
git commit -m "Restyle recipe list cards: selected/unselected surfaces and meta"
```

---

## Task 6: RecipeList chrome (search, filter, count)

**Files:**
- Modify: `src/components/RecipeList.tsx` (the search/filter/count block, currently lines 28–51)

- [ ] **Step 1: Update the chrome block**

Replace the block from `<TextInput ...>` through the count `<Text>` (currently lines 29–51) with:

```tsx
<TextInput
  placeholder="Search recipes..."
  leftSection={<IconSearch size={16} color="#8B6F47" />}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.currentTarget.value)}
  aria-label="Search recipes by name or description"
  styles={{
    input: { backgroundColor: '#FFFFFF', borderColor: '#E8DDD0', color: '#2C2416' },
  }}
/>

<Select
  placeholder="Filter by category"
  data={[
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat })),
  ]}
  value={categoryFilter}
  onChange={setCategoryFilter}
  clearable
  aria-label="Filter recipes by category"
  styles={{
    input: { backgroundColor: '#FFFFFF', borderColor: '#E8DDD0', color: '#2C2416' },
  }}
/>

<Text
  size="xs"
  c="#8B6F47"
  aria-live="polite"
  style={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}
>
  Showing {filteredRecipes.length} of {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
</Text>
```

- [ ] **Step 2: Run RecipeList tests**

Run: `npm test -- --run src/components/RecipeList.test.tsx`
Expected: ALL PASS — the existing test asserts `Showing 2 of 2 recipes` (case-insensitive regex), which still matches.

- [ ] **Step 3: Visually verify in dev server**

Run: `npm run dev`. Confirm:
- Search and filter inputs have white backgrounds and sand borders
- Search icon is brown
- Recipe count line reads in uppercase tracked-out brown

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeList.tsx
git commit -m "Restyle recipe list search, filter, and count"
```

---

## Task 7: RecipeDetail header + outer card

**Files:**
- Modify: `src/components/RecipeDetail.tsx` (outer Card and header block, currently lines 20–45)

- [ ] **Step 1: Update outer Card and header**

In `src/components/RecipeDetail.tsx`, change the outer `<Card>` opening tag (line 20) to:

```tsx
<Card
  shadow="none"
  padding="xl"
  radius="md"
  withBorder
  style={{ backgroundColor: '#FFFFFF', borderColor: '#E8DDD0' }}
>
```

Then replace the header `<div>` block (currently lines 23–45) with:

```tsx
<div>
  <Group justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
    <Text
      size="xl"
      fw={600}
      component="h1"
      c="#2C2416"
      style={{ fontSize: '28px', letterSpacing: '-0.02em', lineHeight: 1.15 }}
    >
      {recipe.name}
    </Text>
    <Badge
      size="lg"
      style={{ backgroundColor: '#E8DDD0', color: '#2C2416' }}
      styles={{ root: { fontWeight: 500, letterSpacing: '0.06em' } }}
    >
      {recipe.category}
    </Badge>
  </Group>

  <Text size="md" c="#8B6F47" mb="md" style={{ lineHeight: 1.5 }}>
    {recipe.description}
  </Text>

  <Group gap="md">
    <Text size="xs" c="#8B6F47" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      <span aria-label="Preparation time">⏱ Prep {recipe.prepTime}</span>
    </Text>
    <Text size="xs" c="#8B6F47" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      <span aria-label="Cooking time">· Cook {recipe.cookTime}</span>
    </Text>
  </Group>
</div>
```

- [ ] **Step 2: Run RecipeDetail tests**

Run: `npm test -- --run src/components/RecipeDetail.test.tsx`
Expected: ALL PASS — title text and description are unchanged; only styling differs.

- [ ] **Step 3: Visually verify in dev server**

Run: `npm run dev`. Confirm:
- Detail panel has white background with sand border
- Recipe title is large espresso, weight 600, tight tracking
- Description is brown
- Prep/Cook line is uppercase tracked-out brown
- Category badge is sand background with espresso text

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeDetail.tsx
git commit -m "Restyle recipe detail header and outer card"
```

---

## Task 8: RecipeDetail servings section

**Files:**
- Modify: `src/components/RecipeDetail.tsx` (servings section, currently lines 76–107)

- [ ] **Step 1: Replace the servings section**

In `src/components/RecipeDetail.tsx`, replace the `{/* Servings Slider */}` block (the `<div>` containing the `<Group>` heading, the `<Slider>`, and the helper text — currently lines 76–107) with:

```tsx
<div>
  <Group justify="space-between" mb="md">
    <Text
      fw={500}
      size="xs"
      component="h2"
      c="#2C2416"
      style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
    >
      Servings
    </Text>
    <Badge
      size="lg"
      aria-live="polite"
      style={{ backgroundColor: '#8B6F47', color: '#FAF6F0' }}
      styles={{ root: { fontWeight: 600 } }}
    >
      {servings}
    </Badge>
  </Group>

  <Slider
    value={servings}
    onChange={setServings}
    min={1}
    max={recipe.servings * 3}
    step={1}
    color="brown"
    styles={{
      track: { backgroundColor: '#E8DDD0' },
      bar: { backgroundColor: '#8B6F47' },
      thumb: { backgroundColor: '#8B6F47', borderColor: '#FAF6F0' },
      mark: { backgroundColor: '#8B6F47', borderColor: '#8B6F47' },
      markLabel: { color: '#8B6F47', fontSize: 11, letterSpacing: '0.04em' },
    }}
    marks={[
      { value: recipe.servings, label: `${recipe.servings} (original)` }
    ]}
    label={(value) => `${value} servings`}
    aria-label={`Adjust servings, currently ${servings} servings. Original recipe serves ${recipe.servings}.`}
    aria-valuemin={1}
    aria-valuemax={recipe.servings * 3}
    aria-valuenow={servings}
    aria-valuetext={`${servings} servings`}
  />

  <Text size="xs" c="#8B6F47" mt="xs" ta="center" style={{ letterSpacing: '0.04em' }}>
    Slide to adjust ingredient quantities
  </Text>
</div>
```

Note: the `<h2>` change for "Servings" preserves the existing semantic (it was previously `component="h2"` on the `Text` element).

- [ ] **Step 2: Run RecipeDetail tests**

Run: `npm test -- --run src/components/RecipeDetail.test.tsx`
Expected: ALL PASS — slider role, aria-* attributes, and the displayed `4` are unchanged.

- [ ] **Step 3: Visually verify in dev server**

Run: `npm run dev`. Confirm:
- "SERVINGS" label is uppercase tracked espresso
- Servings count badge has brown background, cream text
- Slider track is sand, filled portion is brown, thumb is brown
- Original-serving mark label is brown

Drag the slider to confirm interactive states still feel right.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeDetail.tsx
git commit -m "Restyle recipe detail servings section and slider"
```

---

## Task 9: RecipeDetail ingredients section + dividers

**Files:**
- Modify: `src/components/RecipeDetail.tsx` (Divider color override + Ingredients block, currently around lines 74, 109, 111–127, 129)

- [ ] **Step 1: Update Divider colors**

There are three `<Divider />` elements in the file (around lines 74, 109, 129 — they have no props currently). Replace each with:

```tsx
<Divider color="#E8DDD0" />
```

- [ ] **Step 2: Update the ingredients section**

Replace the `{/* Ingredients */}` block (currently lines 111–127) with:

```tsx
<div>
  <Text
    fw={500}
    size="xs"
    component="h2"
    c="#2C2416"
    mb="md"
    style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
  >
    Ingredients
  </Text>

  <List spacing="xs" size="sm" component="ul" styles={{ itemWrapper: { lineHeight: 1.9 } }}>
    {scaledIngredients.map((ingredient, index) => (
      <List.Item key={index}>
        <Text component="span" c="#2C2416">
          <strong>{formatAmount(ingredient.amount)}</strong>
          {ingredient.unit && ` ${ingredient.unit}`} {ingredient.item}
        </Text>
      </List.Item>
    ))}
  </List>
</div>
```

- [ ] **Step 3: Run RecipeDetail tests**

Run: `npm test -- --run src/components/RecipeDetail.test.tsx`
Expected: ALL PASS — the `screen.getByRole('heading', { name: 'Ingredients' })` query still matches because the `<Text component="h2">` renders as a heading element. The list-item count assertion (`querySelectorAll('ul li').length === 2`) is also preserved.

- [ ] **Step 4: Visually verify in dev server**

Run: `npm run dev`. Confirm:
- Dividers are sand-colored, not the default Mantine gray
- "INGREDIENTS" label is uppercase tracked espresso
- Ingredient lines have generous line-height; quantities are bold

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/RecipeDetail.tsx
git commit -m "Restyle recipe detail ingredients and dividers"
```

---

## Task 10: RecipeDetail instructions section + step chips

**Files:**
- Modify: `src/components/RecipeDetail.tsx` (Instructions block, currently lines 131–172)

- [ ] **Step 1: Replace the instructions section**

Replace the `{/* Instructions */}` block (currently lines 131–172) with:

```tsx
<div>
  <Text
    fw={500}
    size="xs"
    component="h2"
    c="#2C2416"
    mb="md"
    style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
  >
    Instructions
  </Text>

  <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
    {recipe.instructions.map((step, index) => (
      <li key={index} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: '12px', marginBottom: 24 }}>
        <Text fw={600} c="#8B6F47" style={{ fontSize: 18, lineHeight: 1 }}>
          {index + 1}
        </Text>
        <Stack gap="sm">
          <div>
            <Badge
              variant="outline"
              size="xs"
              style={{
                borderColor: '#E8DDD0',
                color: '#8B6F47',
                backgroundColor: 'transparent',
                marginBottom: 6,
              }}
              styles={{ root: { fontWeight: 500, letterSpacing: '0.07em' } }}
            >
              {step.type}
            </Badge>
            <Text c="#2C2416" style={{ lineHeight: 1.6 }}>
              {step.instruction}
            </Text>
          </div>

          {step.photos && step.photos.length > 0 && (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {step.photos.map((photo, photoIndex) => (
                <div key={photoIndex}>
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    radius="sm"
                    h={150}
                    fit="cover"
                  />
                  {photo.caption && (
                    <Text size="xs" c="#8B6F47" mt="xs">
                      {photo.caption}
                    </Text>
                  )}
                </div>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </li>
    ))}
  </ol>
</div>
```

The previous code used Mantine's `<List type="ordered">` which renders default ordered-list numerals. We replace it with a plain `<ol>` and a 2-column grid (brown numeral + content) — the numerals are now part of the design, not browser default.

- [ ] **Step 2: Run RecipeDetail tests**

Run: `npm test -- --run src/components/RecipeDetail.test.tsx`
Expected: ALL PASS — both instruction strings are still rendered as `Text` and findable by `screen.getByText`.

- [ ] **Step 3: Visually verify in dev server**

Run: `npm run dev`. Confirm:
- Each step shows a large brown numeral (1, 2, 3…) on the left
- Step type chip (PREP / MIX / COOK / etc.) is uppercase brown text inside a 1px sand border with transparent fill
- Instruction body text is espresso with comfortable line-height
- Step photos (if any) still render correctly

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeDetail.tsx
git commit -m "Restyle recipe detail instructions with numbered grid and outlined step chips"
```

---

## Task 11: Whole-app verification

**Files:** none

- [ ] **Step 1: Run full test suite**

Run: `npm test -- --run`
Expected: ALL PASS — every existing test plus the four theme tests added in Task 1.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: clean, zero warnings.

- [ ] **Step 3: Build for production**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors. (The build uses `tsc && vite build` per `package.json`.)

- [ ] **Step 4: Visual whole-app pass against the spec**

Run: `npm run dev` and open the URL.

Walk through the spec (`docs/superpowers/specs/2026-05-08-cookbook-palette-design.md`) section by section. Tick off each acceptance item:

- [ ] All four palette tokens come from `palette` in `src/theme.ts` — grep for any stray hardcoded hex values that don't match the four tokens (`grep -rn "#[0-9A-Fa-f]\{6\}" src/ --include="*.tsx" --include="*.ts"`). Every hex literal should be `#FAF6F0`, `#E8DDD0`, `#8B6F47`, `#2C2416`, or one of the brown-scale shades inside `src/theme.ts`. Anything else is a hardcoded leak — track it down and replace with the right token.
- [ ] No Mantine default blue anywhere (no blue badges, no blue focus ring, no blue selection highlight). Tab through every interactive element with the keyboard.
- [ ] Selected card visually matches the detail panel surface (both white).
- [ ] Hover on an unselected card shifts the border to brown.
- [ ] Search input, category filter, recipe count, all section labels render as expected.
- [ ] Servings slider track is sand, fill and thumb brown.
- [ ] Step chips are outlined sand with brown text.
- [ ] All photos render correctly (use a recipe with photos in `public/recipes.json` if present; otherwise the photo grid is just absent, which is correct).

- [ ] **Step 5: Contrast verification**

Open browser DevTools color picker. Confirm:
- `#2C2416` (espresso) on `#FAF6F0` (cream) — contrast ratio ≥ 4.5:1 (expected ~14:1)
- `#2C2416` (espresso) on `#FFFFFF` (white) — contrast ratio ≥ 4.5:1 (expected ~15:1)
- `#8B6F47` (brown) on `#FAF6F0` (cream) — contrast ratio ≥ 4.5:1 (expected ~4.6:1, borderline — verify)
- `#8B6F47` (brown) on `#FFFFFF` (white) — contrast ratio ≥ 4.5:1 (expected ~4.8:1)
- `#FAF6F0` (cream) on `#8B6F47` (brown) — contrast ratio ≥ 4.5:1 (expected ~4.6:1, borderline — verify)

If any ratio falls below 4.5:1, darken the brown shade slightly (e.g., to `#7A6240`) in **both** `src/theme.ts` (palette + brown[6]) and `src/index.css` (focus ring + skip-to-main). Re-run tests, re-verify visually.

- [ ] **Step 6: Final commit (if any tweaks were needed in Step 5)**

```bash
git add -A
git commit -m "Adjust palette for AA contrast"
```

If no tweaks were needed, this step is a no-op — skip the commit.

---

## Self-review notes

Cross-checked against the spec sections:

- ✅ **Palette** → Task 1 (tokens), Tasks 4–10 (applied)
- ✅ **Typography** → Task 1 (font), Task 3 (CSS), Tasks 4–10 (per-component label styling)
- ✅ **Page background** → Task 3
- ✅ **App header** → Task 4
- ✅ **Recipe list cards (selected/unselected/hover/badges)** → Task 5
- ✅ **Recipe list chrome (search/filter/count)** → Task 6
- ✅ **Recipe detail panel surface** → Task 7
- ✅ **Recipe detail title/meta** → Task 7
- ✅ **Photo grid** → unchanged (already uses `radius="md"` and `fit="cover"`); per spec, no border/frame is needed
- ✅ **Dividers** → Task 9
- ✅ **Servings section + slider** → Task 8
- ✅ **Ingredients** → Task 9
- ✅ **Instructions + step chips + step numerals** → Task 10
- ✅ **Buttons** → spec lists button styling, but the current app has no rendered buttons in `RecipeList` or `RecipeDetail`. The button styling is achieved automatically through the theme's `primaryColor: 'brown'` setting in Task 1, so any future button uses `brown` by default. No dedicated task needed.
- ✅ **Focus rings** → Task 3
- ✅ **Acceptance: no hardcoded hex leaks** → Task 11 grep
- ✅ **Acceptance: no Mantine default blue** → Task 11 visual pass
- ✅ **Acceptance: WCAG AA contrast** → Task 11 contrast check
- ✅ **Acceptance: existing tests still pass** → every implementation task runs the relevant test file
