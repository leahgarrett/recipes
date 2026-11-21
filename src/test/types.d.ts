import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';

// Module augmentation: these must be empty interfaces that redeclare vitest's own (including the
// unused type parameter T) so TypeScript merges the axe matchers into them.
/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
