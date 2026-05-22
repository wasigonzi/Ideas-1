import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { pathForRole, type Role } from "@/lib/auth-helpers";

export default async function PortalRedirect() {
  const session = await auth();
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!role) redirect("/login");
  redirect(pathForRole(role));
}
