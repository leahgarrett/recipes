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
    // The `image-alt` rule is enabled by default. Verify that overriding it works
    // by testing that an image without alt text fails by default but passes when
    // we explicitly disable the rule.
    await expect(
      expectNoA11yViolations(<img src="test.jpg" />)
    ).rejects.toThrow();

    // Now disable the rule and it should pass
    await expectNoA11yViolations(<img src="test.jpg" />, {
      rules: { 'image-alt': { enabled: false } },
    });
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
