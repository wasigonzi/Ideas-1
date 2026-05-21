"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, UserPlus } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  company: string | null;
  hourlyRate: number | null;
  active: boolean;
  avatar: string | null;
  createdAt: string;
};

type Form = {
  id?: string;
  name: string;
  email: string;
  password: string;
  changePassword: boolean;
  role: "admin" | "employee" | "client";
  phone: string;
  position: string;
  department: string;
  company: string;
  hourlyRate: string;
  active: boolean;
};

const emptyForm: Form = {
  name: "", email: "", password: "", changePassword: false,
  role: "employee", phone: "", position: "", department: "",
  company: "", hourlyRate: "", active: true,
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", employee: "Empleado", client: "Cliente",
};
const ROLE_STYLES: Record<string, string> = {
  admin:    "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-400)] border-[var(--color-brand-500)]/30",
  employee: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  client:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

type Tab = "employee" | "admin" | "client" | "all";

export default function UsuariosAdmin() {
  const [users, setUsers]       = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState<Form | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab]           = useState<Tab>("employee");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/empleados");
    setUsers(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setError(null); setShowPass(false);
    setForm({ ...emptyForm });
  }
  function openEdit(u: UserRow) {
    setError(null); setShowPass(false);
    setForm({
      id: u.id,
      name:          u.name ?? "",
      email:         u.email,
      password:      "",
      changePassword: false,
      role:          u.role as Form["role"],
      phone:         u.phone ?? "",
      position:      u.position ?? "",
      department:    u.department ?? "",
      company:       u.company ?? "",
      hourlyRate:    u.hourlyRate != null ? String(u.hourlyRate) : "",
      active:        u.active,
    });
  }

  async function save() {
    if (!form) return;
    setSaving(true); setError(null);
    try {
      const payload: Record<string, unknown> = {
        name:       form.name,
        email:      form.email,
        role:       form.role,
        phone:      form.phone || null,
        position:   form.position || null,
        department: form.department || null,
        company:    form.company || null,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
        active:     form.active,
      };
      if (!form.id) {
        payload.password = form.password;
      } else if (form.changePassword && form.password) {
        payload.password = form.password;
      }
      const url    = form.id ? `/api/empleados/${form.id}` : "/api/empleados";
      const method = form.id ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const j = await r.json();
        throw new Error(typeof j.error === "string" ? j.error : "Error al guardar");
      }
      setForm(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function remove(u: UserRow) {
    if (!confirm(`¿Eliminar a ${u.name ?? u.email}? Esta acción no se puede deshacer.`)) return;
    const r = await fetch(`/api/empleados/${u.id}`, { method: "DELETE" });
    if (!r.ok) { const j = await r.json(); alert(j.error ?? "Error al eliminar"); return; }
    load();
  }

  const filtered = tab === "all" ? users : users.filter((u) => u.role === tab);
  const counts   = {
    all:      users.length,
    employee: users.filter((u) => u.role === "employee").length,
    admin:    users.filter((u) => u.role === "admin").length,
    client:   users.filter((u) => u.role === "client").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="heading-lg">Usuarios</h1>
          <p className="text-white/65 mt-1">Gestión de empleados, administradores y clientes.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {(["employee", "admin", "client", "all"] as Tab[]).map((r) => (
          <button
            key={r}
            onClick={() => setTab(r)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === r ? "bg-white/15 text-white" : "text-white/55 hover:text-white/80"
            }`}
          >
            {r === "all" ? "Todos" : r === "employee" ? "Empleados" : r === "admin" ? "Admins" : "Clientes"}
            <span className="ml-1.5 text-[11px] opacity-60">{counts[r]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-white/55">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-white/55">Sin registros en esta categoría.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-white/55 bg-white/5">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 hidden md:table-cell">Teléfono</th>
                <th className="px-4 py-3 hidden lg:table-cell">Cargo / Depto</th>
                <th className="px-4 py-3 hidden lg:table-cell">Tarifa</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const initials = (u.name ?? u.email)
                  .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white/10 grid place-items-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.name ?? "—"}</div>
                          <div className="text-xs text-white/50 truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/65 hidden md:table-cell">{u.phone ?? "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-white/90">{u.position ?? "—"}</div>
                      {u.department && <div className="text-[11px] text-white/45">{u.department}</div>}
                      {u.company    && <div className="text-[11px] text-white/45">{u.company}</div>}
                    </td>
                    <td className="px-4 py-3 tabular-nums hidden lg:table-cell">
                      {u.hourlyRate != null ? `$${u.hourlyRate}/h` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${ROLE_STYLES[u.role] ?? ""}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                        u.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-white/5 text-white/35 border-white/10"
                      }`}>
                        {u.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        className="text-white/45 hover:text-white p-1.5 rounded transition"
                        title="Editar"
                        onClick={() => openEdit(u)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="text-white/45 hover:text-red-400 p-1.5 rounded transition"
                        title="Eliminar"
                        onClick={() => remove(u)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      {form && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center p-4 z-50"
          onClick={() => setForm(null)}
        >
          <div
            className="card w-full max-w-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-md">{form.id ? "Editar usuario" : "Nuevo usuario"}</h2>
              <button className="text-white/45 hover:text-white transition" onClick={() => setForm(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* ── Información personal ── */}
              <section>
                <SectionTitle>Información personal</SectionTitle>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nombre completo *">
                    <input
                      className="input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Juan García"
                    />
                  </Field>
                  <Field label="Correo electrónico *">
                    <input
                      className="input"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="juan@empresa.com"
                    />
                  </Field>
                  <Field label="Teléfono">
                    <input
                      className="input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="787-555-0100"
                    />
                  </Field>
                </div>
              </section>

              {/* ── Contraseña ── */}
              <section>
                <SectionTitle>Acceso</SectionTitle>
                {form.id && (
                  <label className="flex items-center gap-2 mb-4 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={form.changePassword}
                      onChange={(e) => setForm({ ...form, changePassword: e.target.checked, password: "" })}
                      className="accent-[var(--color-brand-500)] w-4 h-4"
                    />
                    <span className="text-sm text-white/70">Cambiar contraseña</span>
                  </label>
                )}
                {(!form.id || form.changePassword) && (
                  <Field label={form.id ? "Nueva contraseña" : "Contraseña *"}>
                    <div className="relative">
                      <input
                        className="input pr-10"
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                )}
              </section>

              {/* ── Información laboral ── */}
              <section>
                <SectionTitle>Información laboral</SectionTitle>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Rol">
                    <select
                      className="select"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as Form["role"] })}
                    >
                      <option value="employee">Empleado</option>
                      <option value="admin">Administrador</option>
                      <option value="client">Cliente</option>
                    </select>
                  </Field>
                  <Field label="Estado">
                    <select
                      className="select"
                      value={form.active ? "1" : "0"}
                      onChange={(e) => setForm({ ...form, active: e.target.value === "1" })}
                    >
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                  </Field>
                  <Field label="Puesto / Cargo">
                    <input
                      className="input"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      placeholder="Diseñador, Instalador..."
                    />
                  </Field>
                  <Field label="Departamento">
                    <input
                      className="input"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      placeholder="Producción, Diseño..."
                    />
                  </Field>
                  <Field label="Tarifa por hora ($)">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.hourlyRate}
                      onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                      placeholder="22.00"
                    />
                  </Field>
                  <Field label="Empresa">
                    <input
                      className="input"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Nombre de empresa (clientes)"
                    />
                  </Field>
                </div>
              </section>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-white/10">
              <button className="btn btn-outline" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Guardando..." : form.id ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-3 pb-2 border-b border-white/8">
      {children}
    </h3>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5 text-white/75">{label}</label>
      {children}
    </div>
  );
}
