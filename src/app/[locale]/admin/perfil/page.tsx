"use client";

import { useEffect, useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { UserCircle, Lock, Save } from "lucide-react";

type Profile = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  company: string | null;
  avatar: string | null;
};

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Info form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [company, setCompany] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setPosition(data.position ?? "");
        setDepartment(data.department ?? "");
        setCompany(data.company ?? "");
        setAvatar(data.avatar ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoSaving(true);
    setInfoMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null, position: position || null, department: department || null, company: company || null, avatar: avatar || null }),
    });
    setInfoSaving(false);
    if (res.ok) {
      const updated: Profile = await res.json();
      setProfile(updated);
      setInfoMsg("¡Información actualizada!");
    } else {
      const err = await res.json();
      setInfoMsg(typeof err.error === "string" ? err.error : "Error al guardar.");
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setPwSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setPwSaving(false);
    if (res.ok) {
      setPwMsg("¡Contraseña actualizada!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const err = await res.json();
      setPwError(typeof err.error === "string" ? err.error : "Error al cambiar contraseña.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-white/10 animate-pulse" />
        <div className="card p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 rounded bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <h1 className="heading-lg">Mi perfil</h1>
        <p className="text-white/60 mt-1 text-sm">Actualiza tu información personal y contraseña.</p>
      </header>

      {/* ── Info personal ── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 text-[var(--color-brand-400)] font-semibold text-sm">
          <UserCircle size={16} />
          Información personal
        </div>

        <form onSubmit={saveInfo} className="space-y-4">
          <ImageUploader
            value={avatar}
            onChange={setAvatar}
            label="Foto de perfil"
          />

          <div>
            <label className="label">Email</label>
            <input
              className="input w-full opacity-60 cursor-not-allowed"
              value={profile?.email ?? ""}
              readOnly
              tabIndex={-1}
            />
          </div>

          <div>
            <label className="label">Nombre completo</label>
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div>
            <label className="label">Teléfono</label>
            <input
              className="input w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              placeholder="+52 555 000 0000"
            />
          </div>

          <div>
            <label className="label">Cargo / Puesto</label>
            <input
              className="input w-full"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="label">Departamento</label>
            <input
              className="input w-full"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="label">Empresa / Organización</label>
            <input
              className="input w-full"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={100}
            />
          </div>

          {infoMsg && (
            <p className={`text-sm ${infoMsg.startsWith("¡") ? "text-green-400" : "text-red-400"}`}>
              {infoMsg}
            </p>
          )}

          <button type="submit" className="btn btn-brand w-full" disabled={infoSaving}>
            <Save size={15} className="inline mr-1.5" />
            {infoSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </section>

      {/* ── Contraseña ── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 text-[var(--color-brand-400)] font-semibold text-sm">
          <Lock size={16} />
          Cambiar contraseña
        </div>

        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="label">Contraseña actual</label>
            <input
              type="password"
              className="input w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="label">Nueva contraseña</label>
            <input
              type="password"
              className="input w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input
              type="password"
              className="input w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {pwError && <p className="text-sm text-red-400">{pwError}</p>}
          {pwMsg && <p className="text-sm text-green-400">{pwMsg}</p>}

          <button type="submit" className="btn btn-brand w-full" disabled={pwSaving}>
            <Lock size={15} className="inline mr-1.5" />
            {pwSaving ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </section>
    </div>
  );
}
