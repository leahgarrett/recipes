import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/recipes/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // The backend has its own Vitest config and test database; keep the
    // root (public site) test run scoped to src/ so it doesn't sweep in
    // backend/test/** (which targets a separate Postgres database).
    exclude: [...configDefaults.exclude, 'backend/**'],
  },
})
