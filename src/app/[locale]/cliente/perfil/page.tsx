import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function ClientePerfil() {
  const session = await auth();
  const userId = (session?.user as { id?: string }).id ?? "";
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <div className="text-xs uppercase text-white/55">{label}</div>
      <div className="mt-1 font-medium">{value ?? "—"}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Mi perfil</h1>
        <p className="text-white/65 mt-1">Datos de tu cuenta de cliente.</p>
      </header>

      <section className="card p-6 grid sm:grid-cols-2 gap-5">
        <Field label="Nombre" value={user.name} />
        <Field label="Email" value={user.email} />
        <Field label="Empresa" value={user.company} />
        <Field label="Teléfono" value={user.phone} />
        <Field label="Rol" value={user.role} />
        <Field label="Cuenta desde" value={user.createdAt.toLocaleDateString()} />
      </section>

      <p className="text-xs text-white/45">Para actualizar tus datos contacta al equipo de Ideas, LLC.</p>
    </div>
  );
}
