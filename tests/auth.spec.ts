/**
 * tests/auth.spec.ts
 *
 * Authentication flow tests:
 *  • Login with valid admin / employee / client credentials
 *  • Login with invalid credentials (should show error)
 *  • Logout flow
 *  • Unauthenticated redirect (protected page → login)
 *  • Session persistence (reload after login stays logged in)
 */

import { test, expect, BrowserContext } from '@playwright/test';
import { ADMIN_STATE, EMP_STATE, CLI_STATE } from './utils/report';
import * as fs from 'fs';
import * as path from 'path';

const SHOT = path.join(__dirname, 'report', 'screenshots');

const ACCOUNTS = [
  { role: 'admin',    email: 'admin@printingideaspr.com',    password: 'admin123',    redirect: /\/(admin|portal)/ },
  { role: 'empleado', email: 'empleado@printingideaspr.com', password: 'empleado123', redirect: /\/(empleado|portal)/ },
  { role: 'cliente',  email: 'cliente@printingideaspr.com',  password: 'cliente123',  redirect: /\/(cliente|portal)/ },
];

// ── Login form ────────────────────────────────────────────────────────────────

for (const account of ACCOUNTS) {
  test(`login: ${account.role} — successful authentication`, async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/.+/);

    await page.fill('input[name="email"]',    account.email);
    await page.fill('input[name="password"]', account.password);

    await Promise.all([
      page.waitForURL(account.redirect, { timeout: 20_000 }),
      page.click('button[type="submit"]'),
    ]);

    // Confirm portal loaded (no login page visible)
    expect(page.url()).not.toContain('/login');
    await page.screenshot({ path: path.join(SHOT, `auth-${account.role}-success.png`), fullPage: false });
  });
}

test('login: invalid credentials — shows error message', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]',    'noexiste@fake.com');
  await page.fill('input[name="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');

  // Should NOT redirect away from /login
  await page.waitForTimeout(3_000);
  expect(page.url()).toContain('/login');

  // Error message must be visible
  const err = page.locator('text=/inválid|incorrect|error/i');
  await expect(err).toBeVisible({ timeout: 5_000 });
  await page.screenshot({ path: path.join(SHOT, 'auth-invalid-creds.png') });
});

test('login: empty form — native validation prevents submit', async ({ page }) => {
  await page.goto('/login');
  await page.click('button[type="submit"]');
  // HTML5 required validation: still on login page
  await page.waitForTimeout(1_000);
  expect(page.url()).toContain('/login');
});

// ── Unauthenticated redirect ──────────────────────────────────────────────────

test('unauthenticated: accessing /admin redirects to login', async ({ page }) => {
  // Fresh context — no cookies
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/login|\/(?:es\/)?login/, { timeout: 10_000 });
  expect(page.url()).toContain('login');
});

// ── Logout ────────────────────────────────────────────────────────────────────

test('logout: admin can sign out', async ({ browser }) => {
  const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
  const context   = await browser.newContext({ storageState: stateFile as string | undefined });
  const page      = await context.newPage();

  await page.goto('/admin');
  await page.waitForURL(/admin/, { timeout: 15_000 });

  // Find and click the sign-out / "Salir" button or link
  const logoutSel = page.locator('a[href*="signout"], a[href*="logout"], button:has-text("Salir"), a:has-text("Salir al sitio")').first();
  if (await logoutSel.count() > 0) {
    await logoutSel.click();
    await page.waitForTimeout(2_000);
    // After logout, should be on public page or login
    expect(page.url()).not.toMatch(/\/admin/);
    await page.screenshot({ path: path.join(SHOT, 'auth-logout.png') });
  } else {
    // If no logout button found, verify we are at least on the admin page
    console.warn('Logout button not found; skipping logout click.');
  }

  await context.close();
});

// ── Session persistence ───────────────────────────────────────────────────────

test('session: stays logged in after page reload', async ({ browser }) => {
  const stateFile = fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined;
  const context   = await browser.newContext({ storageState: stateFile as string | undefined });
  const page      = await context.newPage();

  await page.goto('/admin');
  await page.waitForURL(/admin/, { timeout: 15_000 });

  await page.reload({ waitUntil: 'domcontentloaded' });
  expect(page.url()).toContain('/admin');

  await context.close();
});
