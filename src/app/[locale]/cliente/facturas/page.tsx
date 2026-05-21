import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { StatusPill } from "@/components/portal/PortalShell";
import { FileText } from "lucide-react";

export default async function ClienteFacturas() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";

  const invoices = await prisma.invoice.findMany({
    where: { clientId: userId },
    orderBy: { issuedAt: "desc" }
  });

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.reduce((s, i) => s + i.paid, 0);
  const due = total - paid;

  function currency(n: number) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Facturas</h1>
        <p className="text-white/65 mt-1">Historial financiero de tus proyectos.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5"><div className="text-xs uppercase text-white/55">Facturado</div><div className="text-2xl font-extrabold mt-1">{currency(total)}</div></div>
        <div className="card p-5"><div className="text-xs uppercase text-white/55">Pagado</div><div className="text-2xl font-extrabold text-emerald-400 mt-1">{currency(paid)}</div></div>
        <div className="card p-5"><div className="text-xs uppercase text-white/55">Pendiente</div><div className={`text-2xl font-extrabold mt-1 ${due > 0 ? "text-[var(--color-brand-400)]" : "text-white/55"}`}>{currency(due)}</div></div>
      </div>

      <section className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/55 text-xs uppercase tracking-wider bg-white/5">
              <tr>
                <th className="px-6 py-3">Factura</th>
                <th className="px-6 py-3">Emitida</th>
                <th className="px-6 py-3">Vence</th>
                <th className="px-6 py-3 text-right">Monto</th>
                <th className="px-6 py-3 text-right">Pagado</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-white/5">
                  <td className="px-6 py-3 font-bold">{inv.number}</td>
                  <td className="px-6 py-3 text-white/70">{new Date(inv.issuedAt).toLocaleDateString("es-PR")}</td>
                  <td className="px-6 py-3 text-white/70">{new Date(inv.dueDate).toLocaleDateString("es-PR")}</td>
                  <td className="px-6 py-3 text-right font-medium">{currency(inv.amount)}</td>
                  <td className="px-6 py-3 text-right text-emerald-400">{currency(inv.paid)}</td>
                  <td className="px-6 py-3"><StatusPill status={inv.status} /></td>
                  <td className="px-6 py-3">
                    <a
                      href={`/api/facturas/${inv.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Descargar PDF"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-xs font-semibold transition-colors"
                    >
                      <FileText size={13} /> PDF
                    </a>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-white/55">No tienes facturas aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
