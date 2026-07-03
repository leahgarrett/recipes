# React + MUI + a11y Frontend Stack — Scaffold Spec

A portable spec for standing up a new frontend matching Andromeda's "Mission Control"
stack. Written to be **pasted into Claude Code** on a fresh project ("scaffold a project
per this spec") *and* to read as a human reference.

> **Why a spec and not a one-liner:** the versions here are unusually new (MUI 9, ESLint 10,
> Vite 8, TS 6, Storybook 10, React 19.2). From prose alone a model tends to scaffold older
> majors with different config formats (MUI 5, `.eslintrc`, Vite 5). Pin the versions.

Priority is to use React/MUI/theme/a11y/tooling and make choices about any gaps in the tech

---

## 1. What this stack is

React 19 + TypeScript SPA, Vite-built, MUI (on Emotion) with a token-driven light/dark theme
that follows system preference, TanStack Query for server state, React Router for routing —
with **WCAG-AA accessibility enforced across four layers** (lint, unit, Storybook, e2e) and
quality gated by ESLint strict + Prettier + Vitest + Playwright.

**Deliberately undecided** (see §8): forms, validation, mutations pattern, global client
state, notifications/toasts, the backend/API contract. Those are the experiment surface.

---

## 2. Pinned dependencies

Copy this into `package.json`. `"type": "module"`.

```jsonc
{
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/material": "^9.1.1",
    "@tanstack/react-query": "^5.101.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.0"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@storybook/addon-a11y": "^10.4.6",
    "@storybook/addon-docs": "^10.4.6",
    "@storybook/react-vite": "^10.4.6",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^26.0.1",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.2",
    "eslint": "^10.6.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-jsx-a11y": "^6.10.2",
    "eslint-plugin-react-hooks": "^7.1.1",
    "jsdom": "^29.1.1",
    "openapi-typescript": "^7.13.0",
    "prettier": "^3.9.4",
    "storybook": "^10.4.6",
    "typescript": "^6.0.3",
    "typescript-eslint": "^8.62.1",
    "vite": "^8.0.16",
    "vitest": "^4.1.9",
    "vitest-axe": "^0.1.0"
  }
}
```

E2E lives at the repo root (separate from the SPA package in the source project):

```jsonc
{ "@axe-core/playwright": "^4.12.1", "@playwright/test": "^1.58.2" }
```

### Scripts

```jsonc
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc -b",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "format": "prettier --write src/",
  "format:check": "prettier --check src/",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build",
  "api:types": "openapi-typescript ${OPENAPI_SCHEMA:-http://localhost:8000/openapi.json} -o src/api/generated/schema.d.ts"
}
```

---

## 3. Config wiring (the parts that are easy to get wrong)

- **Path alias `@/` → `src/`** must be declared in **three** places or something breaks:
  1. `tsconfig.app.json` → `compilerOptions.paths` (`"@/*": ["./src/*"]`)
  2. `vite.config.ts` → `resolve.alias` (`{ "@": "/src" }` or via `path.resolve`)
  3. `vitest.config.ts` → inherit Vite's via `mergeConfig(viteConfig, defineConfig({ test: {...} }))`
- **Vite build** sets `build.manifest: true` (needed only if a backend serves the assets;
  drop it for a pure SPA on a static host).
- **TypeScript** uses project references: root `tsconfig.json` → `tsconfig.app.json` +
  `tsconfig.node.json`; `build`/`typecheck` run `tsc -b`.
- **ESLint flat config** (`eslint.config.js`, NOT `.eslintrc`):
  `@eslint/js` recommended + `typescript-eslint` **strict type-checked** +
  `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y` **strict** + `eslint-config-prettier` last.
  All violations are **hard errors — no warning mode.**
- **Vitest** environment `jsdom`; `src/test/setup.ts` imports `@testing-library/jest-dom`
  and `vitest-axe`'s matchers.

---

## 4. Theme system (`src/theme/`)

- `tokens.ts` — design tokens: brand colours, typography (`fontFamily`), breakpoints, shape
  (border radius), Material seed colours. **Single source of truth; components never hardcode.**
- `theme.ts` — `createTheme` builds **`lightTheme` and `darkTheme`** from a shared options object
  (custom H1–H3 scale, `MuiButton`/`MuiCard` overrides, `boxShadow: none`,
  `textTransform: "none"`).
- **System preference** — `src/app/providers.tsx` picks the theme reactively:
  ```ts
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(() => (prefersDark ? darkTheme : lightTheme), [prefersDark]);
  ```
  Follows the OS. (Manual override / persisted toggle is an open decision — see §8.)

---

## 5. Accessibility — WCAG AA at four layers

| Layer | Tool | Gate |
|-------|------|------|
| Lint | `eslint-plugin-jsx-a11y` (strict) | `npm run lint` fails on violation |
| Unit | `vitest-axe` | `npm run test` fails on violation |
| Dev | `@storybook/addon-a11y` | violations panel in Storybook |
| E2E | `@axe-core/playwright` | e2e run fails on WCAG-AA violation |

Shared unit helper (`src/test/a11y.ts`):

```ts
import { expect } from "vitest";
import { axe } from "vitest-axe";

export async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
```

`vitest-axe` needs a types shim (`src/test/vitest-axe.d.ts`) to register the matcher.

---

## 6. API layer (adapt to your backend)

Source project: **typed client generated from an OpenAPI schema** via `openapi-typescript`
→ `src/api/generated/schema.d.ts`, consumed by a hand-written client with same-origin
session + CSRF.

**Gotcha worth stealing:** `schema.d.ts` is a **generated artifact** — git-ignore it, but
commit a `schema.json` snapshot so `typecheck`/`build` run **offline without the backend up**,
and add a `types` step that regenerates `schema.d.ts` from the snapshot. Refresh the snapshot
from the live API only when the contract changes; have CI check for drift. (Skipping this is
what makes "typecheck needs the whole backend running," which you do not want.)

For a side project with no OpenAPI backend, swap this for hand-written types, tRPC, or a
generated client from whatever your API exposes — the rest of the stack is unaffected.

---

## 7. Project structure

```text
src/
  api/         typed client + generated/ (schema.d.ts, schema.json snapshot)
  app/         providers (Query + Theme + Router), root router
  components/  shared UI wrappers over MUI primitives
  features/    feature modules (each owns its components/hooks/queries)
  theme/       tokens.ts, theme.ts
  test/        setup.ts, render.tsx (RTL wrapper w/ providers), a11y.ts
```

---

## 8. Open decisions — the experiment surface

The stack above is intentionally silent on these. Recommendations lean toward what composes
cleanly with React 19 + MUI + TanStack Query + the a11y gates.

### Forms
| Option | Fit | Notes |
|--------|-----|-------|
| **React Hook Form** (recommended default) | Excellent | Mature; minimal re-renders; MUI via `<Controller>`; wire `error`/`helperText` to keep the jsx-a11y + axe gates green. |
| **TanStack Form** | Good, experimental | Same family as your Query lib, headless, fully type-safe. Newer/smaller ecosystem — good if the *point* is to experiment. |
| Formik | Okay | Popular but heavier re-renders; less momentum than RHF. |
| Native/uncontrolled | Fine for tiny forms | No dep; you own validation + a11y wiring. |

### Validation
| Option | Notes |
|--------|-------|
| **Zod** (recommended default) | Schema → inferred TS types; `@hookform/resolvers/zod` plugs straight into RHF; can validate API boundaries too. |
| **Valibot** | Zod-like, much smaller bundle, modular. Great "experiment" pick. |
| Yup | Works with RHF; older; weaker inference than Zod/Valibot. |

**Recommended starting pairing:** React Hook Form + Zod (`@hookform/resolvers`). Define the
Zod schema once, infer the form type from it, and — if your API is OpenAPI-typed — assert the
schema matches the generated request type so form and contract can't drift.

### Other decisions to make
- **Mutations / writes:** TanStack Query `useMutation` + query invalidation is the natural fit;
  decide optimistic-update policy per feature.
- **Data loading:** TanStack Query everywhere, *or* React Router 7 loaders/actions, *or* a
  hybrid. Pick one as default to avoid two competing data layers.
- **Global client state (non-server):** often unnecessary with Query. If needed, prefer
  **Zustand** or **Jotai** over Context+reducer for anything beyond trivial.
- **Notifications/toasts:** MUI `Snackbar` + a small context, or `notistack`. Ensure toasts are
  announced to screen readers (`role="status"`/`aria-live`) to stay AA.
- **Theme override:** add a manual light/dark/system toggle persisted to `localStorage`
  layered over the `prefers-color-scheme` default.
- **Error handling:** React error boundaries + a Query error policy; decide route-level vs
  app-level.
- **Auth (if standalone):** the source stack leans on server sessions + CSRF; a standalone SPA
  likely wants OAuth/OIDC PKCE or a hosted auth provider instead.
- **i18n:** none in the base — add `react-i18next` or `lingui` if you need it.

---

## 9. Verification (definition of done for the base scaffold)

```bash
npm run lint          # eslint incl. jsx-a11y strict — hard errors
npm run typecheck     # tsc -b
npm run test          # vitest incl. axe assertions
npm run build         # tsc -b && vite build
npm run build-storybook
npm audit --audit-level=low
```

All green = the stack is stood up correctly before you start layering forms/validation on top.
