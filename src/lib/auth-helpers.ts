import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type Role = "admin" | "employee" | "client";

export async function requireRole(allowed: Role[]) {
  const session = await auth();
  const user = session?.user as { role?: Role; id?: string; email?: string; name?: string } | undefined;
  if (!user) redirect("/login");
  if (!user.role || !allowed.includes(user.role)) {
    // Redirect to the user's own portal instead of a generic page
    redirect(pathForRole(user.role));
  }
  return user;
}

export function pathForRole(role: Role | undefined) {
  if (role === "admin") return "/admin";
  if (role === "employee") return "/empleado";
  if (role === "client") return "/cliente/tareas";
  return "/";
}
