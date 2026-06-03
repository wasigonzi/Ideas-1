"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

export function GoalEditor({ initial }: { initial: number }) {
  const [goal, setGoal] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initial));
  const [saving, setSaving] = useState(false);

  async function save() {
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n <= 0) { alert("Meta inválida"); return; }
    setSaving(true);
    const r = await fetch("/api/inteligencia/meta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyGoal: n }),
    });
    setSaving(false);
    if (!r.ok) { alert("Error al guardar"); return; }
    setGoal(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <input
          type="number"
          className="input w-32 py-1 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="text-emerald-400" onClick={save} disabled={saving}><Check size={16} /></button>
        <button className="text-white/50" onClick={() => setEditing(false)}><X size={16} /></button>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      ${goal.toLocaleString()}
      <button className="text-white/40 hover:text-white" onClick={() => { setValue(String(goal)); setEditing(true); }}>
        <Pencil size={13} />
      </button>
    </span>
  );
}
