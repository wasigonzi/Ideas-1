import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { ADMIN_STATE, hasAdminCreds } from "./constants";

const stateReady =
  hasAdminCreds &&
  fs.existsSync(ADMIN_STATE) &&
  (() => {
    try {
      const state = JSON.parse(fs.readFileSync(ADMIN_STATE, "utf8"));
      return Array.isArray(state.cookies) && state.cookies.length > 0;
    } catch {
      return false;
    }
  })();

test.describe("Workflow guards", () => {
  test.skip(!stateReady, "Define E2E_ADMIN_PASSWORD y ejecuta el setup de autenticacion.");
  test.use({ storageState: ADMIN_STATE });

  test("rechaza mover un proyecto a una etapa inexistente", async ({ request }) => {
    const stamp = Date.now();
    const create = await request.post("/api/work-projects", {
      data: {
        estimateNumber: `E2E-MOVE-${stamp}`,
        title: `E2E Move Guard ${stamp}`,
      },
    });
    expect(create.ok()).toBeTruthy();
    const project = await create.json();

    const move = await request.post(`/api/work-projects/${project.id}/move`, {
      data: {
        toStage: "etapa_fantasma",
        photos: ["https://example.com/evidence.jpg"],
        checklist: [{ text: "Evidencia revisada", done: true }],
      },
    });
    expect(move.status()).toBe(400);
    await expect(move.json()).resolves.toMatchObject({ error: "invalid_stage" });

    await request.delete(`/api/work-projects/${project.id}`);
  });

  test("un admin no puede responder una hoja como si fuera cliente", async ({ request }) => {
    const createTask = await request.post("/api/tareas", {
      data: { title: `E2E Approval Guard ${Date.now()}`, status: "review" },
    });
    expect(createTask.ok()).toBeTruthy();
    const task = await createTask.json();

    const sheet = await request.post(`/api/tareas/${task.id}/hoja`, {
      data: { data: { numero: "E2E", pages: [] } },
    });
    expect(sheet.ok()).toBeTruthy();

    const response = await request.post(`/api/tareas/${task.id}/hoja/responder`, {
      data: { status: "approved", clientNote: "Intento interno" },
    });
    expect(response.status()).toBe(403);

    await request.delete(`/api/tareas/${task.id}`);
  });
});
