import { prisma } from "@/lib/prisma";

export type TaskColumnDTO = {
  key: string;
  label: string;
  accent: string | null;
};

// Built-in defaults used when the TaskColumn table is empty.
export const DEFAULT_TASK_COLUMNS: TaskColumnDTO[] = [
  { key: "todo",        label: "Por hacer",       accent: "bg-amber-500" },
  { key: "in_progress", label: "En progreso",      accent: "bg-violet-500" },
  { key: "review",      label: "Para revisión",    accent: "bg-sky-500" },  { key: "produccion",  label: "Producci\u00f3n",        accent: "bg-orange-500" },  { key: "blocked",     label: "Bloqueadas",       accent: "bg-rose-500" },
  { key: "done",        label: "Hechas",           accent: "bg-emerald-500" }
];

// Allowed accent classes (whitelist) so users can't inject arbitrary CSS.
export const ACCENT_OPTIONS: { value: string; label: string }[] = [
  { value: "bg-amber-500", label: "Ámbar" },
  { value: "bg-orange-500", label: "Naranja" },
  { value: "bg-rose-500", label: "Rosa" },
  { value: "bg-red-500", label: "Rojo" },
  { value: "bg-violet-500", label: "Violeta" },
  { value: "bg-fuchsia-500", label: "Fucsia" },
  { value: "bg-indigo-500", label: "Índigo" },
  { value: "bg-sky-500", label: "Cielo" },
  { value: "bg-cyan-500", label: "Cian" },
  { value: "bg-emerald-500", label: "Esmeralda" },
  { value: "bg-lime-500", label: "Lima" },
  { value: "bg-slate-500", label: "Pizarra" }
];

export function isValidAccent(v: unknown): v is string {
  return typeof v === "string" && ACCENT_OPTIONS.some((a) => a.value === v);
}

export async function loadTaskColumns(): Promise<TaskColumnDTO[]> {
  const rows = await prisma.taskColumn.findMany({
    where: { archived: false },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });
  if (rows.length === 0) return DEFAULT_TASK_COLUMNS;
  return rows.map((r) => ({ key: r.key, label: r.label, accent: r.accent }));
}

// Slugify a label into a status key. Strips diacritics, lowercases, replaces
// non [a-z0-9] runs with underscores. Caller is responsible for ensuring
// uniqueness.
export function slugifyKey(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32) || "col";
}

// Ensure uniqueness against an existing key set by suffixing _2, _3, ...
export function uniquifyKey(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

// One-time materialization: when the table is empty and the admin starts
// editing columns, persist the defaults so we have rows to PATCH/DELETE.
export async function ensureColumnsMaterialized(): Promise<void> {
  const count = await prisma.taskColumn.count();
  if (count > 0) return;
  await prisma.taskColumn.createMany({
    data: DEFAULT_TASK_COLUMNS.map((c, i) => ({
      key: c.key,
      label: c.label,
      accent: c.accent,
      position: (i + 1) * 1000
    }))
  });
}
