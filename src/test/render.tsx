import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import type { ReactElement } from 'react';

export function renderWithTheme(ui: ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}
