import path from "node:path";

// Directorio donde se guardan los estados de sesión autenticados.
export const AUTH_DIR = path.join(__dirname, ".auth");
export const ADMIN_STATE = path.join(AUTH_DIR, "admin.json");
export const CLIENT_STATE = path.join(AUTH_DIR, "client.json");

// Credenciales de prueba. Se leen de variables de entorno E2E_* (recomendado)
// con respaldo a las del seed. Las contraseñas NO tienen valor por defecto:
// si no se definen, el setup de autenticación se omite y las pruebas que
// requieren sesión se saltan automáticamente.
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@printingideaspr.com",
  password: process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "",
};

export const CLIENT = {
  email: process.env.E2E_CLIENT_EMAIL ?? "cliente@printingideaspr.com",
  password: process.env.E2E_CLIENT_PASSWORD ?? process.env.SEED_CLIENT_PASSWORD ?? "",
};

export const hasAdminCreds = ADMIN.password.length > 0;
export const hasClientCreds = CLIENT.password.length > 0;
