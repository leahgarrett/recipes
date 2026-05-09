# Accessibility Testing Design

**Date:** 2026-05-09
**Status:** Approved — ready for implementation plan

## Goal

Establish layered accessibility verification for the Recipe Browser so WCAG 2.1 AA compliance and screen-reader usability are continuously checked, not assumed. The layers are:

1. **Automated structural checks** via axe-core in the unit-test suite
2. **Automated keyboard-flow tests** using `@testing-library/user-event`
3. **A manual screen-reader walkthrough checklist** in the README for pre-release verification

This design only adds tests and documentation; no application code changes.

## Why three layers

axe alone catches 30–40% of accessibility issues — the structural ones (missing alts, unlabeled controls, ARIA misuse, heading hierarchy). It does not verify keyboard flow, focus management, or whether the experience is coherent for someone listening to a screen reader. Each layer covers a different gap:

| Layer | Catches | Misses |
|---|---|---|
| axe (unit tests) | DOM structure & semantics | Keyboard flow, runtime focus, narrative coherence, color contrast (in jsdom) |
| Keyboard tests | Tab order, key handlers, focus reachability | Whether SR announces things meaningfully |
| Manual SR checklist | Narrative coherence, live-region timing, focus movement | Regressions between releases (relies on humans) |

## Tooling

Add as devDependencies:
- `vitest-axe` — Vitest integration of axe-core; provides the `toHaveNoViolations` matcher and a `runAxe()` helper
- (`vitest-axe` bundles `axe-core` itself; no separate install needed)

`@testing-library/user-event` is already installed and used by the existing tests.

## File structure

**New files:**
- `src/test/a11y.tsx` — shared helper exporting `expectNoA11yViolations(ui, options?)`. Wraps in `MantineProvider theme={theme}`, renders, runs axe, asserts no violations. Accepts an optional rules-override per call so individual tests can re-enable a rule.
- `src/components/RecipeList.a11y.test.tsx`
- `src/components/RecipeDetail.a11y.test.tsx`
- `src/App.a11y.test.tsx`
- `src/components/RecipeList.keyboard.test.tsx`
- `src/components/RecipeDetail.keyboard.test.tsx`

**Modified files:**
- `src/test/setup.ts` — register vitest-axe matchers via `expect.extend`
- `package.json` — add `vitest-axe` to devDependencies
- `README.md` — add the "Screen reader testing" section

**Untouched:** all production code (`src/components/RecipeList.tsx`, `src/components/RecipeDetail.tsx`, `src/App.tsx`, etc.). This is purely test infrastructure.

## axe rules configuration

Default rule set: WCAG 2.0 A + AA + WCAG 2.1 AA (vitest-axe's default).

**Disabled by default** in `src/test/a11y.tsx` for component-level tests:
- `color-contrast` — jsdom doesn't apply external CSS, so computed colors are unreliable. Contrast was verified manually during the cookbook-palette restyle (brown `#7A6240` on cream `#FAF6F0` = 5.35:1, comfortably above 4.5:1). The README will note this gap.
- `region` — checks every element belongs to a landmark. RecipeList and RecipeDetail render in isolation (not inside `<main>`) in their unit tests, so the rule fires false positives. The App-level a11y test exercises the real landmark structure via `AppShell`, so coverage isn't lost.

The shared helper signature:

```ts
async function expectNoA11yViolations(
  ui: ReactElement,
  options?: { rules?: Record<string, { enabled: boolean }> }
): Promise<void>
```

Per-test re-enables look like:

```ts
await expectNoA11yViolations(<App />, { rules: { region: { enabled: true } } });
```

## a11y test coverage matrix (10 tests)

### `App.a11y.test.tsx` (3 tests)
- Loading state (initial render before fetch resolves)
- Error state (fetch rejects)
- Main app with recipes loaded (mock `fetch` to return seeded recipes); `region` rule re-enabled here

### `RecipeList.a11y.test.tsx` (4 tests)
- Default render with multiple recipes, none selected
- Render with one card in selected state (`selectedRecipeId` prop set)
- After search filter narrows results to one
- Empty results state (search term that matches nothing)

### `RecipeDetail.a11y.test.tsx` (3 tests)
- Recipe with photos
- Recipe without photos
- After servings slider adjustment (simulate user changing servings; assert ingredients re-render and remain accessible)

Each test calls `expectNoA11yViolations(...)` after setting up the relevant state.

## Keyboard test coverage (2 files)

### `RecipeList.keyboard.test.tsx`
- Tab order: search input → category select → first card → second card → ...
- Typing in the search input narrows results
- Selecting a category from the filter narrows results
- `Enter` on a focused card calls `onSelectRecipe`
- `Space` on a focused card calls `onSelectRecipe`

(The latter two are partially covered by the existing `RecipeList.test.tsx`; we keep the assertions focused on keyboard-only paths and rely on `userEvent.tab()` rather than direct event firing.)

### `RecipeDetail.keyboard.test.tsx`
- Tab reaches the slider
- Arrow Right increments the slider value (and the rendered serving count)
- Arrow Left decrements
- Slider value change updates rendered ingredient amounts (functional outcome — tab through to confirm)
- Tab does not land on non-interactive content (list items, dividers, photos)

## README addition

A new section titled **"Screen reader testing"** appended to `README.md`. Approximate length: 30 lines.

Contents:

- **Why** — short paragraph: automated tests don't replace listening to the experience.
- **When to run** — before each release; after changes to `aria-*` attributes, focus handling, dynamic content (slider, filters), or page structure.
- **Tool** — VoiceOver on macOS (`Cmd+F5` to toggle; `Ctrl+Option+→/←` to navigate; `Ctrl+Option+U` for the rotor).
- **Six numbered walkthrough scenarios** with expected announcements:
  1. **Open the app** — header announced as banner; list region announced; detail region announced.
  2. **Navigate the recipe list** — each card reads as `[name], [category], prep [time], cook [time], serves [N], button, [pressed | not pressed]`.
  3. **Activate a card** — confirm focus management; detail-panel update is perceptible.
  4. **Change servings** — slider announces `[N] servings` after each arrow press; ingredient list reads with updated amounts.
  5. **Search** — typing produces an `aria-live` count announcement (`Showing N of M recipes`); empty results announce the empty-state message.
  6. **Filter by category** — same expectations as search.
- **Known limitations** — `color-contrast` is verified manually, not by axe (jsdom limitation). Cite the cookbook-palette spec for the verified ratios.

## Out of scope

- Cypress / Playwright e2e tests (we stay in Vitest + jsdom for now)
- Visual regression testing
- Automated screen-reader testing (no reliable cross-platform way to script this in CI)
- Linting accessibility issues at write-time (e.g., `eslint-plugin-jsx-a11y`) — the repo has a separate, pre-existing eslint setup gap; that's its own concern
- Accessibility audits of third-party components beyond what their own surfaces emit
- Mobile screen-reader testing (TalkBack on Android, VoiceOver on iOS) — not in current product scope

## Acceptance criteria

- `npm test -- --run` passes with the new tests included; total test count is approximately `23 (existing) + 10 a11y + 10 keyboard ≈ 43` tests
- `vitest-axe` is the only new runtime dependency added
- Each a11y test file is independently meaningful (a single failing test points unambiguously at one DOM situation)
- The shared helper in `src/test/a11y.tsx` has one clear public function and is re-used by all a11y tests (DRY)
- Disabled axe rules are commented inline with a one-line justification (so future readers know why)
- README "Screen reader testing" section is added as a subsection under the existing "Testing" heading
