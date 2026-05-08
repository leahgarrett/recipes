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
