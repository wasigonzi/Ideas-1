import { test, expect } from "@playwright/test";

// Páginas públicas que deben cargar sin sesión y sin errores de servidor.
const PUBLIC_PAGES: { path: string; expect: RegExp }[] = [
  { path: "/", expect: /ideas/i },
  { path: "/servicios", expect: /.+/ },
  { path: "/proyectos", expect: /.+/ },
  { path: "/nosotros", expect: /.+/ },
  { path: "/cotizacion", expect: /.+/ },
  { path: "/login", expect: /acceso|email|contrase/i },
];

test.describe("Páginas públicas (humo)", () => {
  for (const p of PUBLIC_PAGES) {
    test(`carga ${p.path}`, async ({ page }) => {
      const res = await page.goto(p.path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `status de ${p.path}`).toBeLessThan(400);
      await expect(page.locator("body")).toContainText(p.expect);
    });
  }

  test("la página de login muestra el formulario", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator("form").getByRole("button", { name: /Entrar/i })).toBeVisible();
  });
});
