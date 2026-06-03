import { test, expect } from "@playwright/test";
import { ADMIN, hasAdminCreds } from "./constants";

test.describe("Autenticación", () => {
  test("credenciales inválidas muestran error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "no-existe@printingideaspr.com");
    await page.fill('input[name="password"]', "claveIncorrecta123");
    await page.locator("form").getByRole("button", { name: /Entrar/i }).click();
    await expect(page.locator("text=Credenciales inválidas")).toBeVisible({ timeout: 15_000 });
    // No debe abandonar la página de login.
    await expect(page).toHaveURL(/\/login$/);
  });

  test("rutas de admin redirigen a login sin sesión", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login de admin redirige al panel", async ({ page }) => {
    test.skip(!hasAdminCreds, "Define E2E_ADMIN_PASSWORD para esta prueba.");
    await page.goto("/login");
    await page.fill('input[name="email"]', ADMIN.email);
    await page.fill('input[name="password"]', ADMIN.password);
    await page.locator("form").getByRole("button", { name: /Entrar/i }).click();
    await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 30_000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});
