import { test, expect } from '@playwright/test';

test('navigate to Next.js app and take a screenshot', async ({ page }) => {
  // Navigate to the local server
  await page.goto('/');

  // Take a screenshot of the home page
  await page.screenshot({ path: 'tests/screenshots/home.png' });

  // Optional: check that the page loaded by verifying the title doesn't crash
  // Depending on your app, you might want to assert specific elements
  const title = await page.title();
  console.log(`Page title is: ${title}`);
});

test('navigate to example.com and take a screenshot', async ({ page }) => {
  // Navigate to an external website
  await page.goto('https://example.com');

  // Verify the domain
  await expect(page).toHaveTitle(/Example Domain/);

  // Take a screenshot
  await page.screenshot({ path: 'tests/screenshots/example.png' });
});
