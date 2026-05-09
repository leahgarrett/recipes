import { describe, it, expect } from 'vitest';
import { theme, palette } from './theme';

describe('theme', () => {
  it('exports the cookbook palette tokens', () => {
    expect(palette).toEqual({
      cream: '#FAF6F0',
      sand: '#E8DDD0',
      brown: '#7A6240',
      espresso: '#2C2416',
    });
  });

  it('registers brown as a Mantine color scale with primary shade 6', () => {
    expect(theme.colors?.brown).toBeDefined();
    expect(theme.colors?.brown).toHaveLength(10);
    expect(theme.colors?.brown?.[6]).toBe('#7A6240');
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
