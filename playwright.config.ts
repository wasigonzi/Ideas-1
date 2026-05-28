import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '3010';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'tests/report/results.json' }],
    ['list'],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  snapshotDir: './tests/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testName}{ext}',
  projects: [
    // ── Auth setup (runs first, creates .auth/*.json) ─────────────────
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
      use: { baseURL },
    },

    // ── Desktop Chrome ────────────────────────────────────────────────
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /global-setup\.ts/,
    },

    // ── Mobile Chrome (responsive audit) ─────────────────────────────
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
      testMatch: /crawler\.spec\.ts|visual\.spec\.ts/,
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- -p ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
