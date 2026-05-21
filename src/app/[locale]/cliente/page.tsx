import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ClientePage({
  params
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role === "admin") redirect(`/${locale}/admin`);
  redirect(`/${locale}/cliente/tareas`);
}
