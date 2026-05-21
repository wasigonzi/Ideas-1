import { requireRole } from "@/lib/auth-helpers";

// Minimal layout — the LandingEditor uses position:fixed so it escapes PortalShell visually.
export default async function LandingEditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(["admin"], locale);
  return <>{children}</>;
}
