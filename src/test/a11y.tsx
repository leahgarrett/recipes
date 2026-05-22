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
