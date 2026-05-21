import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { pathForRole, type Role } from "@/lib/auth-helpers";

export default async function PortalRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!role) redirect(`/${locale}/login`);
  redirect(pathForRole(role, locale));
}
