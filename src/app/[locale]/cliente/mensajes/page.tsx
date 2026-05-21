import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function ClienteMensajes() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const messages = await prisma.message.findMany({
    where: { OR: [{ fromId: userId }, { toRole: "client" }] },
    include: { from: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Mensajes</h1>
        <p className="text-white/65 mt-1">Conversaciones con nuestro equipo.</p>
      </header>

      <div className="card p-6">
        {messages.length === 0 ? (
          <p className="text-white/55">No hay mensajes.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const isClient = m.from.role === "client";
              return (
                <li key={m.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isClient ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950)]" : "bg-white/10 text-white"}`}>
                    <div className={`text-[11px] mb-1 ${isClient ? "text-[var(--color-ink-950)]/70" : "text-white/60"}`}>
                      {m.from.name} · {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
