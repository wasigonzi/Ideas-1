/**
 * This file is kept for reference only.
 * All real tests have been moved to the comprehensive QA suite:
 *
 *   tests/global-setup.ts       — Auth state creation
 *   tests/crawler.spec.ts       — Full site crawl + JS error detection
 *   tests/auth.spec.ts          — Login / logout flows
 *   tests/admin.spec.ts         — Admin portal pages
 *   tests/empleado.spec.ts      — Employee portal pages
 *   tests/forms.spec.ts         — Form testing
 *   tests/api-monitor.spec.ts   — API failure detection
 *   tests/visual.spec.ts        — Visual regression / screenshots
 *   tests/performance.spec.ts   — Performance & Core Web Vitals
 *   tests/stress.spec.ts        — Concurrent load testing
 *
 * Run: npx playwright test
 * Update snapshots: npx playwright test visual.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';

test('app loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
  await page.screenshot({ path: 'tests/screenshots/home.png' });
});

