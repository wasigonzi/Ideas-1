import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ChatShell } from "@/components/portal/ChatShell";

export default async function AdminChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireRole(["admin"], locale);

  const allUsers = await prisma.user.findMany({
    where: { role: { in: ["admin", "employee"] }, active: true },
    select: { id: true, name: true, avatar: true, role: true, company: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="heading-lg mb-6">Chat interno</h1>
      <ChatShell
        currentUser={{
          id: user.id,
          name: user.name ?? null,
          avatar: user.avatar ?? null,
          role: user.role,
        }}
        allUsers={allUsers.map((u) => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          role: u.role,
          company: u.company,
        }))}
      />
    </div>
  );
}
