import { requireRole } from "@/lib/auth-helpers";

// Minimal layout — the LandingEditor uses position:fixed so it escapes PortalShell visually.
export default async function LandingEditorLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await requireRole(["admin"]);
  return <>{children}</>;
}
