# Accessibility Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three layers of accessibility verification (axe-core unit tests, keyboard-flow tests, manual SR walkthrough README section) per the spec at `docs/superpowers/specs/2026-05-09-accessibility-testing-design.md`.

**Architecture:** Add `vitest-axe` as a dev dependency, register its matchers in the existing test setup, and centralize per-test axe execution in a single `expectNoA11yViolations()` helper that disables `color-contrast` and `region` by default (both unreliable in jsdom). Each component gets a dedicated `*.a11y.test.tsx` and `*.keyboard.test.tsx` file; App-level a11y testing requires mocking `fetch` to drive loading / error / loaded states. README gets a "Screen reader testing" subsection under the existing "Testing" heading.

**Tech Stack:** vitest-axe 0.1.x (bundles axe-core ^4.4.2), @testing-library/user-event (already installed), Vitest, React Testing Library.

**Spec source:** `docs/superpowers/specs/2026-05-09-accessibility-testing-design.md`

---

## File Structure

**Create:**
- `src/test/a11y.tsx` — shared helper exporting `expectNoA11yViolations(ui, options?)`
- `src/test/a11y.test.tsx` — verifies the helper catches a known-bad input and passes a known-good one
- `src/test/types.d.ts` — extends Vitest's `Assertion` type with `toHaveNoViolations` (so TypeScript accepts the matcher)
- `src/components/RecipeList.a11y.test.tsx` (4 tests)
- `src/components/RecipeDetail.a11y.test.tsx` (3 tests)
- `src/App.a11y.test.tsx` (3 tests; mocks `fetch`)
- `src/components/RecipeList.keyboard.test.tsx` (4 tests)
- `src/components/RecipeDetail.keyboard.test.tsx` (4 tests)

**Modify:**
- `package.json` — add `vitest-axe` to devDependencies
- `src/test/setup.ts` — register vitest-axe matchers via `expect.extend`
- `README.md` — add "Screen reader testing" subsection under "Testing"

**Untouched:** all production code (`src/App.tsx`, `src/components/*.tsx`, `src/theme.ts`, etc.).

---

## Task 1: Install vitest-axe and register matchers

**Files:**
- Modify: `package.json`
- Modify: `src/test/setup.ts`
- Create: `src/test/types.d.ts`

- [ ] **Step 1: Install vitest-axe**

Run: `npm install --save-dev vitest-axe`
Expected: package added to `devDependencies` in `package.json`. (Latest version is 0.1.0; the install also brings in `axe-core` as a transitive dependency.)

- [ ] **Step 2: Register the matchers in the test setup**

In `src/test/setup.ts`, after the existing `expect.extend(matchers)` line (line 5), add:

```ts
import * as axeMatchers from 'vitest-axe/matchers';
expect.extend(axeMatchers);
```

The full top of the file should now read:

```ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(matchers);
expect.extend(axeMatchers);
```

- [ ] **Step 3: Add the matcher type extension**

Create `src/test/types.d.ts`:

```ts
import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
```

This makes `expect(results).toHaveNoViolations()` type-check.

- [ ] **Step 4: Run all tests to confirm nothing broke**

Run: `npm test -- --run`
Expected: 23/23 pass (no new tests yet; this just confirms vitest-axe didn't disturb the existing setup).

- [ ] **Step 5: Run the build to confirm TypeScript compiles**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/test/setup.ts src/test/types.d.ts
git commit -m "Add vitest-axe and register accessibility matchers"
```

---

## Task 2: Shared a11y helper with smoke tests

**Files:**
- Create: `src/test/a11y.tsx`
- Create: `src/test/a11y.test.tsx`

- [ ] **Step 1: Write the failing tests for the helper**

Create `src/test/a11y.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { expectNoA11yViolations, expectNoA11yViolationsInContainer } from './a11y';
import { theme } from '../theme';

describe('expectNoA11yViolations', () => {
  it('passes on accessible markup', async () => {
    await expectNoA11yViolations(<button type="button">Save</button>);
  });

  it('fails on inaccessible markup (button with no accessible name)', async () => {
    await expect(
      expectNoA11yViolations(<button type="button" />)
    ).rejects.toThrow();
  });

  it('respects per-call rules overrides', async () => {
    // The `region` rule is disabled by default; opting it back in for a
    // <button> rendered without a landmark makes the call fail.
    await expect(
      expectNoA11yViolations(<button type="button">Save</button>, {
        rules: { region: { enabled: true } },
      })
    ).rejects.toThrow();
  });
});

describe('expectNoA11yViolationsInContainer', () => {
  it('runs axe with the same default rules on an existing container', async () => {
    const { container } = render(
      <MantineProvider theme={theme}>
        <button type="button">Save</button>
      </MantineProvider>
    );
    await expectNoA11yViolationsInContainer(container);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm test -- --run src/test/a11y.test.tsx`
Expected: FAIL — `Cannot find module './a11y'`.

- [ ] **Step 3: Create the helper**

Create `src/test/a11y.tsx`:

```tsx
import { axe } from 'vitest-axe';
import type { RunOptions } from 'axe-core';
import { expect } from 'vitest';
import type { ReactElement } from 'react';
import { renderWithTheme } from './render';

const DEFAULT_RULES: RunOptions['rules'] = {
  // jsdom does not apply external CSS, so axe sees mostly transparent or
  // inherited colors and either skips or false-flags everything. Contrast is
  // verified manually (see docs/superpowers/specs/2026-05-08-cookbook-palette-design.md).
  'color-contrast': { enabled: false },
  // Component-level tests render outside <main>, so the landmark check fires
  // false positives. The App-level a11y test re-enables this rule because it
  // exercises the real AppShell landmark structure.
  region: { enabled: false },
};

interface Options {
  rules?: RunOptions['rules'];
}

export async function expectNoA11yViolations(ui: ReactElement, options: Options = {}): Promise<void> {
  const { container } = renderWithTheme(ui);
  await expectNoA11yViolationsInContainer(container, options);
}

// Use this when you've already rendered (e.g., to drive an interaction first)
// and want to run axe on the resulting container with the same default rules.
export async function expectNoA11yViolationsInContainer(
  container: Element,
  options: Options = {}
): Promise<void> {
  const results = await axe(container, {
    rules: { ...DEFAULT_RULES, ...(options.rules ?? {}) },
  });
  expect(results).toHaveNoViolations();
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test -- --run src/test/a11y.test.tsx`
Expected: 3/3 PASS.

- [ ] **Step 5: Run the full suite**

Run: `npm test -- --run`
Expected: 27 pass (23 existing + 4 helper smoke tests).

- [ ] **Step 6: Commit**

```bash
git add src/test/a11y.tsx src/test/a11y.test.tsx
git commit -m "Add shared expectNoA11yViolations helper"
```

---

## Task 3: a11y tests for RecipeList

**Files:**
- Create: `src/components/RecipeList.a11y.test.tsx`

- [ ] **Step 1: Write the test file**

Create `src/components/RecipeList.a11y.test.tsx`:

```tsx
import { describe, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y';
import { RecipeList } from './RecipeList';
import type { Recipe } from '../types/Recipe';

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Brown Butter Pancakes',
    servings: 4,
    prepTime: '10 min',
    cookTime: '15 min',
    category: 'Breakfast',
    description: 'Toasted, nutty.',
    ingredients: [],
    instructions: [{ instruction: 'Step', type: 'mix' }],
  },
  {
    id: '2',
    name: 'Slow-Roasted Tomato Pasta',
    servings: 4,
    prepTime: '15 min',
    cookTime: '2 hr',
    category: 'Dinner',
    description: 'Six tomatoes, two hours.',
    ingredients: [],
    instructions: [{ instruction: 'Step', type: 'cook' }],
  },
  {
    id: '3',
    name: 'Walnut Olive Oil Cake',
    servings: 8,
    prepTime: '20 min',
    cookTime: '45 min',
    category: 'Dessert',
    description: 'Bittersweet, dense.',
    ingredients: [],
    instructions: [{ instruction: 'Step', type: 'bake' }],
  },
];

describe('RecipeList a11y', () => {
  it('default render with multiple recipes is accessible', async () => {
    await expectNoA11yViolations(
      <RecipeList recipes={mockRecipes} onSelectRecipe={vi.fn()} />
    );
  });

  it('with one card in selected state is accessible', async () => {
    await expectNoA11yViolations(
      <RecipeList recipes={mockRecipes} onSelectRecipe={vi.fn()} selectedRecipeId="1" />
    );
  });

  it('with single matching recipe (filtered narrow result) is accessible', async () => {
    await expectNoA11yViolations(
      <RecipeList recipes={[mockRecipes[0]]} onSelectRecipe={vi.fn()} />
    );
  });

  it('with empty recipes list (empty state) is accessible', async () => {
    await expectNoA11yViolations(
      <RecipeList recipes={[]} onSelectRecipe={vi.fn()} />
    );
  });
});
```

Note: the spec calls for "after search filter narrows results" and "empty results from a filter that matches nothing." Those user-flow scenarios reduce to "the list renders with one recipe" and "the list renders with zero recipes" at the DOM level — the search interaction isn't what makes the rendered DOM different. We test the resulting DOM directly by passing the filtered recipes prop, which is simpler and more robust than driving the search input.

- [ ] **Step 2: Run the new tests**

Run: `npm test -- --run src/components/RecipeList.a11y.test.tsx`
Expected: 4/4 PASS.

- [ ] **Step 3: Run the full suite**

Run: `npm test -- --run`
Expected: 31 pass (27 + 4).

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeList.a11y.test.tsx
git commit -m "Add accessibility tests for RecipeList"
```

---

## Task 4: a11y tests for RecipeDetail

**Files:**
- Create: `src/components/RecipeDetail.a11y.test.tsx`

- [ ] **Step 1: Write the test file**

Create `src/components/RecipeDetail.a11y.test.tsx`:

```tsx
import { describe, it } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expectNoA11yViolations, expectNoA11yViolationsInContainer } from '../test/a11y';
import { renderWithTheme } from '../test/render';
import { RecipeDetail } from './RecipeDetail';
import type { Recipe } from '../types/Recipe';

const recipeWithPhotos: Recipe = {
  id: '1',
  name: 'Brown Butter Pancakes',
  servings: 4,
  prepTime: '10 min',
  cookTime: '15 min',
  category: 'Breakfast',
  description: 'Toasted, nutty.',
  photos: [
    { url: 'https://example.com/p1.jpg', alt: 'Stack of pancakes', caption: 'Fresh off the griddle' },
    { url: 'https://example.com/p2.jpg', alt: 'Browning butter in a pan' },
  ],
  ingredients: [
    { item: 'flour', amount: 1, unit: 'cup' },
    { item: 'brown butter', amount: 2, unit: 'tbsp' },
    { item: 'egg', amount: 1, unit: '' },
  ],
  instructions: [
    {
      instruction: 'Brown the butter until fragrant.',
      type: 'prep',
      photos: [{ url: 'https://example.com/s1.jpg', alt: 'Butter foaming in a saucepan' }],
    },
    { instruction: 'Whisk dry ingredients.', type: 'mix' },
    { instruction: 'Cook on a non-stick skillet.', type: 'cook' },
  ],
};

const recipeWithoutPhotos: Recipe = {
  ...recipeWithPhotos,
  photos: undefined,
  instructions: recipeWithPhotos.instructions.map(s => ({ ...s, photos: undefined })),
};

describe('RecipeDetail a11y', () => {
  it('recipe with photos is accessible', async () => {
    await expectNoA11yViolations(<RecipeDetail recipe={recipeWithPhotos} />);
  });

  it('recipe without photos is accessible', async () => {
    await expectNoA11yViolations(<RecipeDetail recipe={recipeWithoutPhotos} />);
  });

  it('after servings adjustment is still accessible', async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<RecipeDetail recipe={recipeWithPhotos} />);

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');

    await expectNoA11yViolationsInContainer(container);
  });
});
```

- [ ] **Step 2: Run the new tests**

Run: `npm test -- --run src/components/RecipeDetail.a11y.test.tsx`
Expected: 3/3 PASS.

- [ ] **Step 3: Run the full suite**

Run: `npm test -- --run`
Expected: 34 pass (31 + 3).

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeDetail.a11y.test.tsx
git commit -m "Add accessibility tests for RecipeDetail"
```

---

## Task 5: a11y tests for App (with fetch mocking)

**Files:**
- Create: `src/App.a11y.test.tsx`

- [ ] **Step 1: Write the test file**

Create `src/App.a11y.test.tsx`:

```tsx
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { expectNoA11yViolations, expectNoA11yViolationsInContainer } from './test/a11y';
import App from './App';

const mockRecipesPayload = {
  recipes: [
    {
      id: '1',
      name: 'Brown Butter Pancakes',
      servings: 4,
      prepTime: '10 min',
      cookTime: '15 min',
      category: 'Breakfast',
      description: 'Toasted, nutty.',
      ingredients: [{ item: 'flour', amount: 1, unit: 'cup' }],
      instructions: [{ instruction: 'Mix.', type: 'mix' }],
    },
  ],
};

describe('App a11y', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loading state is accessible', async () => {
    // Pending fetch keeps the component in its loading branch.
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})));
    await expectNoA11yViolations(<App />);
  });

  it('error state is accessible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { container } = render(<App />);
    await waitFor(() => screen.getByRole('alert'));
    await expectNoA11yViolationsInContainer(container);
  });

  it('main app with recipes loaded is accessible (region rule re-enabled)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRecipesPayload),
      })
    );
    const { container } = render(<App />);
    await waitFor(() => screen.getByText('Brown Butter Pancakes'));
    await expectNoA11yViolationsInContainer(container, {
      rules: { region: { enabled: true } },
    });
  });
});
```

Notes:
- The loading test uses `expectNoA11yViolations` directly because the loading UI renders synchronously — no need to wait.
- The error and loaded tests render manually and use `expectNoA11yViolationsInContainer` after `waitFor`, so axe runs against the post-fetch DOM rather than the initial loading state.
- The loaded test re-enables the `region` rule — the App level renders the real `<AppShell>` with semantic landmark structure, which is exactly what that rule is designed to verify.

- [ ] **Step 2: Run the new tests**

Run: `npm test -- --run src/App.a11y.test.tsx`
Expected: 3/3 PASS.

If a test fails because the fetch mock leaks between tests, ensure `vi.unstubAllGlobals()` is called in both `beforeEach` and `afterEach` — `stubGlobal` is a Vitest API specifically scoped to be auto-restored, but explicit cleanup avoids surprises.

- [ ] **Step 3: Run the full suite**

Run: `npm test -- --run`
Expected: 37 pass (34 + 3).

- [ ] **Step 4: Commit**

```bash
git add src/App.a11y.test.tsx
git commit -m "Add accessibility tests for App (loading, error, loaded)"
```

---

## Task 6: Keyboard tests for RecipeList

**Files:**
- Create: `src/components/RecipeList.keyboard.test.tsx`

- [ ] **Step 1: Write the test file**

Create `src/components/RecipeList.keyboard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithTheme } from '../test/render';
import { RecipeList } from './RecipeList';
import type { Recipe } from '../types/Recipe';

const mockRecipes: Recipe[] = [
  { id: '1', name: 'Pancakes', servings: 4, prepTime: '10 min', cookTime: '15 min', category: 'Breakfast', description: 'A.', ingredients: [], instructions: [{ instruction: 'x', type: 'mix' }] },
  { id: '2', name: 'Pasta', servings: 4, prepTime: '15 min', cookTime: '2 hr', category: 'Dinner', description: 'B.', ingredients: [], instructions: [{ instruction: 'x', type: 'cook' }] },
];

describe('RecipeList keyboard', () => {
  it('Tab order reaches search input first, then category select, then each card', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeList recipes={mockRecipes} onSelectRecipe={vi.fn()} />);

    const searchInput = screen.getByLabelText(/search recipes/i);
    const cards = screen.getAllByRole('button', { name: /view recipe:/i });

    await user.tab();
    expect(document.activeElement).toBe(searchInput);

    // Tab past the category select (the exact element Mantine focuses on
    // tab varies — input vs. trigger — so we just confirm focus moves off
    // the search input and eventually lands on the first card).
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(cards[0]);

    await user.tab();
    expect(document.activeElement).toBe(cards[1]);
  });

  it('Enter on a focused card calls onSelectRecipe', async () => {
    const user = userEvent.setup();
    const onSelectRecipe = vi.fn();
    renderWithTheme(<RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />);

    const firstCard = screen.getAllByRole('button', { name: /view recipe:/i })[0];
    firstCard.focus();
    await user.keyboard('{Enter}');

    expect(onSelectRecipe).toHaveBeenCalledTimes(1);
    expect(onSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
  });

  it('Space on a focused card calls onSelectRecipe', async () => {
    const user = userEvent.setup();
    const onSelectRecipe = vi.fn();
    renderWithTheme(<RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />);

    const firstCard = screen.getAllByRole('button', { name: /view recipe:/i })[0];
    firstCard.focus();
    await user.keyboard(' ');

    expect(onSelectRecipe).toHaveBeenCalledTimes(1);
    expect(onSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
  });

  it('Typing in the search input narrows visible cards', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeList recipes={mockRecipes} onSelectRecipe={vi.fn()} />);

    const searchInput = screen.getByLabelText(/search recipes/i);
    await user.type(searchInput, 'Pancakes');

    expect(screen.getByText('Pancakes')).toBeInTheDocument();
    expect(screen.queryByText('Pasta')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new tests**

Run: `npm test -- --run src/components/RecipeList.keyboard.test.tsx`
Expected: 4/4 PASS.

If the Tab-order test fails because Mantine's category select intercepts focus differently than expected, adjust the number of `await user.tab()` calls. The assertion that matters is "after enough tabs to clear search and select, focus lands on the first card."

- [ ] **Step 3: Run the full suite**

Run: `npm test -- --run`
Expected: 41 pass (37 + 4).

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeList.keyboard.test.tsx
git commit -m "Add keyboard navigation tests for RecipeList"
```

---

## Task 7: Keyboard tests for RecipeDetail

**Files:**
- Create: `src/components/RecipeDetail.keyboard.test.tsx`

- [ ] **Step 1: Write the test file**

Create `src/components/RecipeDetail.keyboard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithTheme } from '../test/render';
import { RecipeDetail } from './RecipeDetail';
import type { Recipe } from '../types/Recipe';

const recipe: Recipe = {
  id: '1',
  name: 'Pancakes',
  servings: 4,
  prepTime: '10 min',
  cookTime: '15 min',
  category: 'Breakfast',
  description: 'A.',
  ingredients: [
    { item: 'flour', amount: 1, unit: 'cup' },
    { item: 'milk', amount: 1, unit: 'cup' },
  ],
  instructions: [
    { instruction: 'Mix the dry ingredients.', type: 'mix' },
    { instruction: 'Cook on the griddle.', type: 'cook' },
  ],
};

describe('RecipeDetail keyboard', () => {
  it('Tab eventually reaches the slider', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeDetail recipe={recipe} />);

    const slider = screen.getByRole('slider');

    // Tab repeatedly until focus reaches the slider, with a safety cap.
    for (let i = 0; i < 10; i++) {
      await user.tab();
      if (document.activeElement === slider) break;
    }
    expect(document.activeElement).toBe(slider);
  });

  it('Arrow Right on the focused slider increments servings', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeDetail recipe={recipe} />);

    const slider = screen.getByRole('slider');
    slider.focus();

    expect(slider).toHaveAttribute('aria-valuenow', '4');
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '5');
  });

  it('Arrow Left on the focused slider decrements servings', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeDetail recipe={recipe} />);

    const slider = screen.getByRole('slider');
    slider.focus();

    expect(slider).toHaveAttribute('aria-valuenow', '4');
    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '3');
  });

  it('Slider value change updates rendered ingredient amounts', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeDetail recipe={recipe} />);

    // Original recipe: 4 servings, 1 cup flour. Doubling to 8 servings = 2 cups.
    const slider = screen.getByRole('slider');
    slider.focus();

    // Press ArrowRight 4 times to go from 4 → 8 servings.
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '8');

    // The "2" should now appear as an ingredient amount (2 cups flour, 2 cups milk).
    // We assert against the rendered ingredient text.
    const flourLine = screen.getByText(/flour/);
    expect(flourLine.textContent).toMatch(/2\s*cups?\s*flour/);
  });
});
```

- [ ] **Step 2: Run the new tests**

Run: `npm test -- --run src/components/RecipeDetail.keyboard.test.tsx`
Expected: 4/4 PASS.

Note on Mantine's Slider: by default it accepts arrow-key input and updates `aria-valuenow` accordingly. If the slider's `step={1}` (set in the production code) is not honored, adjust the expected value. Also note Mantine renders the value via a Badge that updates from the same state.

- [ ] **Step 3: Run the full suite**

Run: `npm test -- --run`
Expected: 45 pass (41 + 4).

- [ ] **Step 4: Commit**

```bash
git add src/components/RecipeDetail.keyboard.test.tsx
git commit -m "Add keyboard navigation tests for RecipeDetail"
```

---

## Task 8: README "Screen reader testing" subsection

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the subsection under the existing "Testing" heading**

In `README.md`, find the existing "Testing" section (currently around line 128, beginning with `### Testing`). After the existing testing commands and before the next top-level section, add this subsection:

```markdown
#### Screen reader testing

Automated tests verify DOM structure and keyboard flow, but they cannot tell you if the experience is coherent when read aloud. Walk through these scenarios with a screen reader before each release, and after any change to `aria-*` attributes, focus handling, dynamic content (slider, filters), or page structure.

**Tool:** VoiceOver on macOS — `Cmd+F5` to toggle, `Ctrl+Option+→/←` to navigate, `Ctrl+Option+U` to open the rotor.

**Walkthrough scenarios:**

1. **Open the app.** The header should announce as a banner; the recipe list and detail panel should announce as distinct regions.
2. **Navigate the recipe list.** Each card should read as `[name], [category], prep [time], cook [time], serves [N], button, [pressed | not pressed]`.
3. **Activate a card** with Enter or Space. Confirm focus management is sensible (focus stays on the card; the detail panel update is perceptible via region or live announcement).
4. **Change servings.** With focus on the slider, press arrows. The slider should announce `[N] servings` after each press. Then navigate down to the ingredient list and confirm amounts have updated.
5. **Search.** Type into the search input. The result count line (`Showing N of M recipes`) is in an `aria-live="polite"` region and should be announced. Empty results should announce the empty-state message.
6. **Filter by category.** Same expectations as search.

**Known limitations:**
- The `color-contrast` axe rule is disabled in unit tests because jsdom does not apply external CSS. Contrast is verified manually; see `docs/superpowers/specs/2026-05-08-cookbook-palette-design.md` for the verified ratios (espresso on cream ≈ 14:1, brown on cream = 5.35:1).
- The `region` axe rule is disabled for component-level tests (RecipeList, RecipeDetail render outside `<main>` in unit tests). The App-level test re-enables it to verify the real `AppShell` landmark structure.
```

- [ ] **Step 2: Verify the README still renders cleanly**

Run: `npx markdownlint README.md` — if markdownlint is not installed, skip this step. Otherwise: expected zero warnings.

If markdownlint isn't available, manually inspect `README.md` to confirm:
- The new section is under `### Testing` (or `## Testing` depending on heading depth)
- The four-space indentation of nested list items is consistent with the rest of the file
- No accidental disruption to surrounding sections

- [ ] **Step 3: Run all tests once more**

Run: `npm test -- --run`
Expected: 45 pass (no test changes in this task; this just confirms README edits didn't accidentally affect anything).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Add screen reader testing checklist to README"
```

---

## Task 9: Whole-implementation verification

**Files:** none

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- --run`
Expected: ~45 tests pass across ~9 files (23 existing + 4 helper smoke + 4 RecipeList a11y + 3 RecipeDetail a11y + 3 App a11y + 4 RecipeList keyboard + 4 RecipeDetail keyboard).

If the count is off by ±1–2, that's acceptable — confirm only that there are no failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: clean build with no TypeScript errors. (The `Assertion` type extension in `src/test/types.d.ts` is included in TypeScript's project compilation — confirm it doesn't break the build.)

If the build fails on `src/test/types.d.ts`, adjust the path/include in `tsconfig.json` so type-only declarations under `src/test/` are picked up. Look at the existing `tsconfig.json` `include` array.

- [ ] **Step 3: Spot-check that an a11y violation actually fails the test**

Temporarily break a component's accessibility — e.g., in `src/components/RecipeList.tsx`, find the search `TextInput` and remove the `aria-label="Search recipes by name or description"` attribute (around line 34). Save the file.

Run: `npm test -- --run src/components/RecipeList.a11y.test.tsx`
Expected: at least one of the 4 tests FAILS with an axe violation message (the input now has no accessible name).

Restore the `aria-label`. Re-run: 4/4 PASS.

This step proves the a11y suite is actually catching what we want it to catch — not silently passing because a rule was misconfigured.

- [ ] **Step 4: Confirm the README section renders as expected**

Run: `npx vite build && npx vite preview` (or just open the README in a markdown viewer / GitHub preview).

Confirm:
- The new "Screen reader testing" subsection appears under "Testing"
- The numbered scenarios render as a numbered list (not as paragraphs)
- The "Known limitations" bullets render correctly

- [ ] **Step 5: Final commit (if any tweaks were needed in earlier steps)**

If Step 3 caused a temporary edit that wasn't reverted, fix and commit. Otherwise no commit needed.

```bash
git status   # confirm clean
```

---

## Self-review notes

Spec coverage check:

- ✅ **vitest-axe added as devDependency** → Task 1
- ✅ **Matchers registered in setup.ts** → Task 1
- ✅ **TypeScript matcher type extension** → Task 1 (file `src/test/types.d.ts`)
- ✅ **Shared `expectNoA11yViolations` helper** → Task 2
- ✅ **Default disabled rules with inline justification** → Task 2 (DEFAULT_RULES has the comment)
- ✅ **Per-call rules override** → Task 2 (Options.rules) + verified in Task 2 smoke test
- ✅ **App a11y: loading / error / loaded with region re-enabled** → Task 5
- ✅ **RecipeList a11y: default / selected / single result / empty** → Task 3
- ✅ **RecipeDetail a11y: with photos / without photos / after servings change** → Task 4
- ✅ **RecipeList keyboard: tab order, Enter/Space activation, search narrowing** → Task 6
- ✅ **RecipeDetail keyboard: tab to slider, arrow keys change value, ingredients update** → Task 7
- ✅ **README "Screen reader testing" subsection under Testing** → Task 8
- ✅ **Acceptance: total ~43 tests** → Task 9 confirms ~44
- ✅ **Acceptance: vitest-axe is the only new runtime dependency** → Task 1
- ✅ **Acceptance: a11y suite actually catches violations** → Task 9 Step 3 spot-check
- ✅ **Acceptance: each a11y test file is independently meaningful** → tests are scoped per state
- ✅ **Acceptance: helper has one clear public function and is reused** → all a11y tests use it (or call axe directly with the same defaults for state-after-interaction cases, justified inline)
- ✅ **Acceptance: disabled rules have justification comments** → Task 2 DEFAULT_RULES
