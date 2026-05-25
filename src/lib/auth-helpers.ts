import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
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
  return user as { role: Role; id: string; email?: string; name?: string };
}

export function pathForRole(role: Role | undefined) {
  if (role === "admin") return "/admin";
  if (role === "employee") return "/empleado";
  if (role === "client") return "/cliente/tareas";
  return "/";
}

/**
 * For API routes: returns the authenticated user if their role matches one of the
 * allowed roles, otherwise returns a NextResponse error (401/403). Callers must
 * check `instanceof NextResponse` and return early.
 */
export async function requireApiRole(allowed: Role[]) {
  const session = await auth();
  const user = session?.user as { role?: Role; id?: string; email?: string; name?: string } | undefined;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!user.role || !allowed.includes(user.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return user as { role: Role; id: string; email?: string; name?: string };
}
