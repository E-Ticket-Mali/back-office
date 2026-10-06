import { defineConfig, devices } from '@playwright/test';

/**
 * Tests E2E du back-office contre un backend LOCAL (jamais le backend déployé : les tests
 * créent des organisateurs, des événements et approuvent des demandes).
 *
 * Prérequis : backend sur E2E_API_URL (défaut http://localhost:5000/api/v1) — voir
 * docs/local-deployment.md. Le serveur Vite est démarré automatiquement (ou réutilisé).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5900',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5900',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
