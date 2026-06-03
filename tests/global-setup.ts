import { test as setup, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { AUTH_DIR, ADMIN_STATE, CLIENT_STATE, ADMIN, CLIENT, hasAdminCreds, hasClientCreds } from "./constants";

const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

setup.beforeAll(() => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
});

// Inicia sesión por la UI y guarda el estado de sesión en `statePath`.
async function loginAndSave(page: Page, email: string, password: string, statePath: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator("form").getByRole("button", { name: /Entrar/i }).click();
  // Tras el login exitoso el cliente redirige a /portal y de ahí al panel del rol.
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 });
  await expect(page.locator('text=Credenciales inválidas')).toHaveCount(0);
  await page.context().storageState({ path: statePath });
}

setup("authenticate as admin", async ({ page }) => {
  if (!hasAdminCreds) {
    fs.writeFileSync(ADMIN_STATE, EMPTY_STATE);
    setup.skip(true, "Define E2E_ADMIN_PASSWORD (o ADMIN_PASSWORD) para las pruebas autenticadas de admin.");
    return;
  }
  await loginAndSave(page, ADMIN.email, ADMIN.password, ADMIN_STATE);
});

setup("authenticate as client", async ({ page }) => {
  if (!hasClientCreds) {
    fs.writeFileSync(CLIENT_STATE, EMPTY_STATE);
    setup.skip(true, "Define E2E_CLIENT_PASSWORD (o SEED_CLIENT_PASSWORD) para las pruebas autenticadas de cliente.");
    return;
  }
  await loginAndSave(page, CLIENT.email, CLIENT.password, CLIENT_STATE);
});
