import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type Role = "admin" | "employee" | "client";

export async function requireRole(allowed: Role[], locale: string) {
  const session = await auth();
  const user = session?.user as { role?: Role; id?: string; email?: string; name?: string } | undefined;
  if (!user) redirect(`/${locale}/login`);
  if (!user.role || !allowed.includes(user.role)) {
    // Redirect to the user's own portal instead of a generic page
    redirect(pathForRole(user.role, locale));
  }
  return user;
}

export function pathForRole(role: Role | undefined, locale: string) {
  if (role === "admin") return `/${locale}/admin`;
  if (role === "employee") return `/${locale}/empleado`;
  if (role === "client") return `/${locale}/cliente/tareas`;
  return `/${locale}`;
}
