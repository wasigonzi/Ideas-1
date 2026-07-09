"use client";

import { useEffect, useState, useRef } from "react";
import { ClipboardCheck, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { localDateKey } from "@/lib/time";

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

function formatDateLabel(dateStr: string) {
  const today = localDateKey(new Date());
  const yesterday = shiftDate(today, -1);
  const tomorrow = shiftDate(today, 1);

  if (dateStr === today) return "Hoy";
  if (dateStr === yesterday) return "Ayer";
  if (dateStr === tomorrow) return "Mañana";

  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-PR", { weekday: "short", day: "numeric", month: "short" });
}

export function DailyWorkReport() {
  const [date, setDate] = useState(() => localDateKey(new Date()));
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Load report for the selected date
  useEffect(() => {
    async function load() {
      setLoading(true);
      setStatus("idle");
      try {
        const res = await fetch(`/api/trabajos?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setContent(data?.content ?? "");
        } else {
          setContent("");
        }
      } catch {
        setContent("");
      } finally {
        setLoading(false);
        isFirstLoad.current = true;
      }
    }
    load();
  }, [date]);

  // Save the report content
  async function save(text: string) {
    setSaving(true);
    setStatus("saving");
    try {
      const res = await fetch("/api/trabajos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, content: text }),
      });
      if (res.ok) {
        setStatus("saved");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  // Handle changes with debounced save
  function handleChange(val: string) {
    setContent(val);
    setStatus("dirty");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      save(val);
    }, 800);
  }

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/65 flex items-center gap-2">
          <ClipboardCheck size={16} className="text-[var(--color-brand-400)] shrink-0" />
          ¿En qué trabajaste hoy?
        </h3>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setDate((d) => shiftDate(d, -1))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/65 hover:text-white transition active:scale-95"
            title="Día anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-white/80 font-bold px-2 py-1 rounded bg-white/5 min-w-[90px] text-center capitalize">
            {formatDateLabel(date)}
          </span>
          <button
            onClick={() => setDate((d) => shiftDate(d, 1))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/65 hover:text-white transition active:scale-95"
            title="Día siguiente"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setDate(localDateKey(new Date()))}
            disabled={date === localDateKey(new Date())}
            className="px-2.5 py-1.5 rounded-lg bg-white/8 text-white/65 hover:text-white disabled:opacity-20 text-[10px] font-bold uppercase tracking-wider transition"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Editor container */}
      <div className="relative">
        {loading ? (
          <div className="h-[120px] rounded-xl bg-white/3 border border-white/5 flex items-center justify-center text-white/40 text-sm">
            <Loader2 className="animate-spin mr-2" size={16} />
            Cargando reporte…
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Describe los trabajos, tareas o proyectos en los que trabajaste durante este día…"
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-brand-500)]/60 resize-none min-h-[120px]"
          />
        )}
      </div>

      {/* Status Bar */}
      {!loading && (
        <div className="flex items-center gap-1.5 text-xs text-white/35">
          {status === "saving" && (
            <>
              <Loader2 size={12} className="animate-spin text-white/40" />
              <span>Guardando cambios…</span>
            </>
          )}
          {status === "saved" && (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400/80">Guardado</span>
            </>
          )}
          {status === "dirty" && (
            <span className="text-amber-400/70">
              Cambios sin guardar (se guardarán al dejar de escribir)
            </span>
          )}
          {status === "error" && (
            <span className="text-red-400">
              Error al guardar. Inténtalo de nuevo.
            </span>
          )}
          {status === "idle" && (
            <span className="text-white/20">
              {content ? "Reporte cargado" : "Escribe para iniciar tu reporte"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
