import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { ADMIN_STATE, hasAdminCreds } from "./constants";

// Estas pruebas requieren sesión de admin. Si no hay credenciales E2E o el
// estado de sesión está vacío, se saltan automáticamente.
const stateReady =
  hasAdminCreds &&
  fs.existsSync(ADMIN_STATE) &&
  (() => {
    try {
      const s = JSON.parse(fs.readFileSync(ADMIN_STATE, "utf8"));
      return Array.isArray(s.cookies) && s.cookies.length > 0;
    } catch {
      return false;
    }
  })();

test.describe("Admin · Proyectos del taller", () => {
  test.skip(!stateReady, "Define E2E_ADMIN_PASSWORD y ejecuta el setup de autenticación.");
  test.use({ storageState: ADMIN_STATE });

  test("crea y elimina un proyecto", async ({ page }) => {
    const stamp = Date.now();
    const title = `E2E Proyecto ${stamp}`;
    const estimate = `E2E-${stamp}`;

    await page.goto("/admin/proyectos-taller");
    await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();

    // Abrir el modal de creación.
    await page.getByRole("button", { name: /Nuevo proyecto/i }).click();
    const modal = page.locator(".card", { hasText: "Nuevo proyecto" });
    await expect(modal).toBeVisible();

    await modal.getByPlaceholder("ej. 2451").fill(estimate);
    // El título es el input dentro del Field "Título" (sin placeholder).
    await modal.locator("input.input").nth(2).fill(title);
    await modal.getByRole("button", { name: "Crear" }).click();

    // El proyecto nuevo debe aparecer en el tablero.
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

    // Limpieza: eliminarlo (acepta el diálogo de confirmación).
    page.once("dialog", (d) => d.accept());
    const card = page.locator("li, div", { hasText: title }).first();
    await card.getByRole("button").first().click();

    await expect(page.getByText(title)).toHaveCount(0, { timeout: 15_000 });
  });

  test("la página de auditoría carga y muestra acciones", async ({ page }) => {
    await page.goto("/admin/auditoria");
    await expect(page.getByRole("heading", { name: /Auditoría/i })).toBeVisible();
  });
});
