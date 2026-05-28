"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2, Plus, ChevronLeft, Monitor, Tablet, Smartphone, Save, Check, Loader2, Eye, X, LayoutGrid } from "lucide-react";
import type { LandingBlock, BlockType } from "./types";
import { BLOCK_REGISTRY, DEFAULT_BLOCKS, PAGE_DEFAULTS, CATEGORY_LABELS } from "./registry";
import { BgSettings, SpacingSettings, BorderSettings, ShadowSettings, FilterSettings, AccordionSection, ToggleField, Field, TextField, NumberField } from "./shared";

// ── Viewport preview sizes ─────────────────────────────────────────────────
const VIEWPORTS = [
  { key: "desktop", label: "Escritorio", icon: Monitor, width: "100%" },
  { key: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { key: "mobile", label: "Móvil", icon: Smartphone, width: "390px" },
] as const;
type ViewportKey = (typeof VIEWPORTS)[number]["key"];

// ── Corner handle for selected blocks ────────────────────────────────────
function CornerHandle({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const cls: Record<string, string> = {
    tl: "-top-1 -left-1",
    tr: "-top-1 -right-1",
    bl: "-bottom-1 -left-1",
    br: "-bottom-1 -right-1",
  };
  return (
    <div
      className={`absolute w-2.5 h-2.5 rounded-sm bg-[var(--color-brand-500)] border-2 border-white z-20 ${cls[pos]}`}
    />
  );
}

// ── Sortable drag wrapper – Elementor-style ───────────────────────────────
function SortableDragWrapper({
  id,
  selected,
  label,
  emoji,
  onSelect,
  onFocusProp,
  onDuplicate,
  onDelete,
  children,
}: {
  id: string;
  selected: boolean;
  label: string;
  emoji: string;
  onSelect: () => void;
  onFocusProp: (key: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={id}
      className={`relative group cursor-pointer transition-all duration-150 ${
        selected
          ? "outline outline-2 outline-offset-0 outline-[var(--color-brand-500)] shadow-[0_0_0_4px_rgba(var(--color-brand-500-rgb,255,174,0),0.15)] block-selected"
          : "outline outline-2 outline-transparent hover:outline-[rgba(255,174,0,0.35)]"
      }`}
      onClickCapture={(e) => {
        e.preventDefault();
        const path = e.nativeEvent.composedPath() as Element[];
        // Check for toolbar actions first (duplicate, delete)
        const actionEl = path.find(
          (el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.action
        );
        if (actionEl) {
          e.nativeEvent.stopImmediatePropagation();
          if (actionEl.dataset.action === "duplicate") onDuplicate();
          if (actionEl.dataset.action === "delete") onDelete();
          return;
        }
        e.nativeEvent.stopImmediatePropagation();
        if (!selected) { onSelect(); return; }
        // Block already selected: find the element with data-sel-prop
        const propEl = path.find(
          (el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.selProp
        );
        if (propEl?.dataset.selProp) onFocusProp(propEl.dataset.selProp);
      }}
    >
      {/* Block preview */}
      <div className="select-none">
        {children}
      </div>



      {/* Corner handles (selected only) */}
      {selected && (
        <>
          <CornerHandle pos="tl" />
          <CornerHandle pos="tr" />
          <CornerHandle pos="bl" />
          <CornerHandle pos="br" />
        </>
      )}

      {/* Floating label chip – top-left on hover or when selected */}
      <div
        className={`absolute top-0 left-0 z-[15] flex items-center gap-1 transition-all duration-150 ${
          selected
            ? "opacity-100 translate-y-0"
            : "opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0"
        }`}
      >
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold select-none shadow-lg ${
            selected
              ? "bg-[var(--color-brand-500)] text-black"
              : "bg-black/80 backdrop-blur-sm text-white/80 border border-white/10"
          }`}
          style={{ borderBottomRightRadius: "8px" }}
        >
          <span>{emoji}</span>
          <span>{label}</span>
        </div>
      </div>

      {/* Floating action toolbar – top-right */}
      <div
        className={`absolute top-0 right-0 z-[15] flex items-center gap-0.5 transition-all duration-150 ${
          selected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <div
          className="flex items-center gap-0.5 bg-black/85 backdrop-blur-sm border border-white/10 px-1 py-1 shadow-xl"
          style={{ borderBottomLeftRadius: "10px" }}
        >
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 text-white/40 hover:text-white cursor-grab active:cursor-grabbing rounded-md hover:bg-white/8 transition-colors"
            title="Mover"
          >
            <GripVertical size={13} />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button
            data-action="duplicate"
            className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/8 transition-colors"
            title="Duplicar"
          >
            <Copy size={13} />
          </button>
          <button
            data-action="delete"
            className="p-1.5 text-white/40 hover:text-red-400 rounded-md hover:bg-red-400/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Settings panel tabs ────────────────────────────────────────────────────
type SettingsTab = "content" | "style" | "advanced";

function SettingsPanel({
  block,
  viewport,
  onChange,
  onClearOverrides,
  onDeselect,
  focusedProp,
}: {
  block: LandingBlock;
  viewport: ViewportKey;
  onChange: (updates: Record<string, unknown>) => void;
  onClearOverrides: () => void;
  onDeselect: () => void;
  focusedProp?: string | null;
}) {
  const [tab, setTab] = useState<SettingsTab>("content");

  // When a canvas element is clicked, switch to content tab
  useEffect(() => {
    if (focusedProp) setTab("content");
  }, [focusedProp]);
  const meta = BLOCK_REGISTRY[block.type];
  const SettingsComp = meta.settingsComponent;
  const vpOverrides = viewport === "tablet" ? (block.propsTablet ?? {}) : viewport === "mobile" ? (block.propsMobile ?? {}) : {};
  const mergedProps = { ...meta.defaultProps, ...block.props, ...vpOverrides };
  const hasOverrides = Object.keys(vpOverrides).length > 0;
  const vpBadge =
    viewport === "tablet"
      ? { label: "Tablet", cls: "text-sky-400 border-sky-400/30 bg-sky-400/10" }
      : viewport === "mobile"
      ? { label: "Móvil", cls: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" }
      : null;

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "content", label: "Contenido" },
    { id: "style", label: "Estilo" },
    { id: "advanced", label: "Avanzado" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Block header */}
      <div className="px-3 py-2.5 border-b border-white/8 flex items-center gap-2 bg-[var(--color-brand-500)]/5">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-500)]/15 flex items-center justify-center shrink-0">
          <span className="text-sm leading-none">{meta.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white leading-tight truncate">{meta.label}</p>
          {vpBadge ? (
            <span className={`text-[9px] font-bold uppercase tracking-wider ${vpBadge.cls.split(" ").find(c => c.startsWith("text-")) ?? "text-white/40"}`}>
              {vpBadge.label}
            </span>
          ) : (
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Escritorio</p>
          )}
        </div>
        {vpBadge && (
          <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${vpBadge.cls}`}>
            {vpBadge.label}
          </span>
        )}
        <button
          onClick={onDeselect}
          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors shrink-0"
          title="Volver a módulos"
        >
          <X size={13} />
        </button>
      </div>

      {/* Focused prop indicator */}
      {focusedProp && (
        <div className="px-3 py-1.5 bg-[var(--color-brand-500)]/10 border-b border-[var(--color-brand-500)]/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulse shrink-0" />
          <span className="text-[10px] text-[var(--color-brand-400)] font-bold truncate">
            Elemento: {focusedProp}
          </span>
        </div>
      )}

      {/* Responsive override notice */}
      {viewport !== "desktop" && (
        <div className="px-4 py-2 bg-white/3 border-b border-white/8 flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/40 leading-tight">
            {hasOverrides
              ? `Config. propia de ${viewport === "tablet" ? "tablet" : "móvil"}`
              : `Heredando de escritorio`}
          </span>
          {hasOverrides && (
            <button
              onClick={onClearOverrides}
              className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors shrink-0"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/8 bg-black/20">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all ${
              tab === t.id
                ? "text-[var(--color-brand-400)] border-b-2 border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/5"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel body – key forces re-mount/animation when block changes */}
      <div key={block.id} className="flex-1 overflow-y-auto p-4 space-y-1 animate-panel-in">
        {tab === "content" && (
          <SettingsComp props={mergedProps} onChange={onChange} />
        )}
        {tab === "style" && (
          <div className="divide-y divide-white/8">
            <AccordionSection title="Fondo" defaultOpen>
              <BgSettings props={mergedProps} onChange={onChange} />
            </AccordionSection>
            <AccordionSection title="Espaciado" defaultOpen>
              <SpacingSettings props={mergedProps} onChange={onChange} />
            </AccordionSection>
            <AccordionSection title="Borde">
              <BorderSettings props={mergedProps} onChange={onChange} />
            </AccordionSection>
            <AccordionSection title="Sombra">
              <ShadowSettings props={mergedProps} onChange={onChange} />
            </AccordionSection>
            <AccordionSection title="Efectos">
              <FilterSettings props={mergedProps} onChange={onChange} />
            </AccordionSection>
          </div>
        )}
        {tab === "advanced" && (
          <div className="space-y-3">
            <Field label="Ocultar en móvil" horizontal>
              <ToggleField
                value={!!(mergedProps.hideOnMobile)}
                onChange={(v) => onChange({ hideOnMobile: v })}
              />
            </Field>
            <Field label="Ocultar en escritorio" horizontal>
              <ToggleField
                value={!!(mergedProps.hideOnDesktop)}
                onChange={(v) => onChange({ hideOnDesktop: v })}
              />
            </Field>
            <div className="border-t border-white/8 pt-3 mt-3 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">CSS personalizado</p>
              <Field label="ID del bloque">
                <TextField
                  value={(mergedProps.customId as string) || ""}
                  onChange={(v) => onChange({ customId: v })}
                  placeholder="mi-seccion"
                />
              </Field>
              <Field label="Clase(s) CSS">
                <TextField
                  value={(mergedProps.customClass as string) || ""}
                  onChange={(v) => onChange({ customClass: v })}
                  placeholder="mi-clase otra-clase"
                />
              </Field>
              <Field label="Z-index">
                <NumberField
                  value={(mergedProps.zIndex as number) ?? 0}
                  onChange={(v) => onChange({ zIndex: v || undefined })}
                  min={0}
                />
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Left panel: palette ↔ settings (single Elementor-style panel) ─────────
function LeftPanel({
  block,
  viewport,
  onChange,
  onClearOverrides,
  onDeselect,
  onAdd,
  focusedProp,
}: {
  block: LandingBlock | null;
  viewport: ViewportKey;
  onChange: (updates: Record<string, unknown>) => void;
  onClearOverrides: () => void;
  onDeselect: () => void;
  onAdd: (type: BlockType) => void;
  focusedProp?: string | null;
}) {
  return (
    <aside className="w-[270px] shrink-0 border-r border-white/8 bg-[#0d1220] overflow-hidden flex flex-col">
      {block ? (
        <SettingsPanel
          block={block}
          viewport={viewport}
          onChange={onChange}
          onClearOverrides={onClearOverrides}
          onDeselect={onDeselect}
          focusedProp={focusedProp}
        />
      ) : (
        <PaletteView onAdd={onAdd} />
      )}
    </aside>
  );
}

// ── Block palette view ─────────────────────────────────────────────────────
function PaletteView({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [search, setSearch] = useState("");
  const groups = useMemo(() => {
    const allEntries = Object.entries(BLOCK_REGISTRY) as [BlockType, (typeof BLOCK_REGISTRY)[BlockType]][];
    const filtered = search
      ? allEntries.filter(([, m]) => m.label.toLowerCase().includes(search.toLowerCase()))
      : allEntries;

    const byCategory: Record<string, [BlockType, (typeof BLOCK_REGISTRY)[BlockType]][]> = {};
    for (const entry of filtered) {
      const cat = entry[1].category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(entry);
    }
    return Object.entries(byCategory) as [string, [BlockType, (typeof BLOCK_REGISTRY)[BlockType]][]][];
  }, [search]);

  return (
    <div className="flex flex-col h-full">
      {/* Palette header */}
      <div className="px-3 py-2.5 border-b border-white/8 flex items-center gap-2">
        <LayoutGrid size={14} className="text-white/30 shrink-0" />
        <span className="text-xs font-bold text-white/50">Módulos</span>
      </div>
      <div className="p-3 border-b border-white/8">
        <input
          type="search"
          placeholder="Buscar módulo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-brand-400)]"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {groups.map(([cat, entries]) => (
          <div key={cat}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            <div className="space-y-1">
              {entries.map(([type, meta]) => (
                <button
                  key={type}
                  onClick={() => onAdd(type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/8 transition-colors group"
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-xs font-medium text-white/70 group-hover:text-white">
                    {meta.label}
                  </span>
                  <Plus size={12} className="ml-auto text-white/20 group-hover:text-[var(--color-brand-400)]" />
                </button>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-center text-xs text-white/30 py-8">Sin resultados</p>
        )}
      </div>
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────
export function LandingEditor({ pageKey = "landingJson", pageLabel = "Landing" }: { pageKey?: string; pageLabel?: string }) {
  const PAGE_URLS: Record<string, string> = {
    landingJson: "/",
    pageServiciosJson: "/servicios",
    pageProyectosJson: "/proyectos",
    pageNosotrosJson: "/nosotros",
  };
  const previewUrl = PAGE_URLS[pageKey] ?? "/";

  const [blocks, setBlocks] = useState<LandingBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedProp, setFocusedProp] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [viewport, setViewport] = useState<ViewportKey>("desktop");
  const [services, setServices] = useState<unknown[]>([]);
  const [projects, setProjects] = useState<unknown[]>([]);
  const [employees, setEmployees] = useState<unknown[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRef = useRef<HTMLElement>(null);

  // Scroll selected block into view whenever selection changes
  useEffect(() => {
    if (!selectedId || !canvasRef.current) return;
    const el = canvasRef.current.querySelector(`[data-block-id="${selectedId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  // Load blocks for the current pageKey. Using AbortController so Strict Mode
  // double-invocation and navigating between editor pages both work correctly.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSelectedId(null);

    fetch(`/api/landing?key=${encodeURIComponent(pageKey)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { blocks: LandingBlock[] }) => {
        if (controller.signal.aborted) return;
        const fallback = PAGE_DEFAULTS[pageKey] ?? [];
        setBlocks(data.blocks?.length ? data.blocks : fallback);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setBlocks(PAGE_DEFAULTS[pageKey] ?? []);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    fetch("/api/servicios", { signal: controller.signal }).then((r) => r.json()).then((d) => { if (!controller.signal.aborted) setServices(d.services ?? d ?? []); }).catch(() => {});
    fetch("/api/proyectos", { signal: controller.signal }).then((r) => r.json()).then((d) => { if (!controller.signal.aborted) setProjects(d.projects ?? d ?? []); }).catch(() => {});
    fetch("/api/empleados", { signal: controller.signal }).then((r) => r.json()).then((d) => { if (!controller.signal.aborted) setEmployees(d.employees ?? d ?? []); }).catch(() => {});

    return () => controller.abort();
  }, [pageKey]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setDirty(true);
    }
  }, []);

  const addBlock = useCallback((type: BlockType) => {
    const id = `${type}-${Date.now()}`;
    setBlocks((prev) => [...prev, { id, type, props: {} }]);
    setSelectedId(id);
    setDirty(true);
  }, []);

  const updateBlock = useCallback((id: string, updates: Record<string, unknown>, vp: ViewportKey) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (vp === "desktop") return { ...b, props: { ...b.props, ...updates } };
        if (vp === "tablet") return { ...b, propsTablet: { ...b.propsTablet, ...updates } };
        return { ...b, propsMobile: { ...b.propsMobile, ...updates } };
      })
    );
    setDirty(true);
  }, []);

  const clearBlockOverrides = useCallback((id: string, vp: "tablet" | "mobile") => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (vp === "tablet") return { ...b, propsTablet: {} };
        return { ...b, propsMobile: {} };
      })
    );
    setDirty(true);
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const src = prev[idx];
      const copy: LandingBlock = {
        ...src,
        id: `${src.type}-${Date.now()}`,
        props: { ...src.props },
        propsTablet: src.propsTablet ? { ...src.propsTablet } : undefined,
        propsMobile: src.propsMobile ? { ...src.propsMobile } : undefined,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setDirty(true);
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDirty(true);
  }, [selectedId]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, key: pageKey }),
      });
      if (res.ok) {
        setSaved(true);
        setDirty(false);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;
  const currentViewport = VIEWPORTS.find((v) => v.key === viewport)!;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-ink-950)] text-white overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-black/40 backdrop-blur-sm shrink-0 z-20">
        <a href="/admin" className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
          <ChevronLeft size={14} /> Admin
        </a>
        <span className="text-white/20">|</span>
        <span className="font-bold text-sm">Editor · {pageLabel}</span>
        {dirty && <span className="text-xs text-[var(--color-brand-400)] animate-pulse">● Sin guardar</span>}

        {/* Viewport toggles */}
        <div className="flex items-center gap-1 ml-auto bg-white/5 rounded-xl p-1">
          {VIEWPORTS.map((vp) => {
            const Icon = vp.icon;
            return (
              <button
                key={vp.key}
                onClick={() => setViewport(vp.key)}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewport === vp.key ? "bg-[var(--color-brand-500)] text-black" : "text-white/40 hover:text-white"
                }`}
                title={vp.label}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
            previewMode ? "bg-white/10 border-white/20 text-white" : "border-white/10 text-white/50 hover:text-white"
          }`}
        >
          <Eye size={13} /> Vista previa
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 text-white/50 hover:text-white transition-colors"
        >
          Ver sitio ↗
        </a>

        <button
          onClick={save}
          disabled={saving || !dirty}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[var(--color-brand-500)] text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
          {saved ? "Guardado" : "Guardar"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel (palette ↔ settings) ── */}
        {!previewMode && (
          <LeftPanel
            block={selectedBlock}
            viewport={viewport}
            onChange={(updates) => selectedBlock && updateBlock(selectedBlock.id, updates, viewport)}
            onClearOverrides={() => selectedBlock && clearBlockOverrides(selectedBlock.id, viewport as "tablet" | "mobile")}
            onDeselect={() => { setSelectedId(null); setFocusedProp(null); }}
            onAdd={addBlock}
            focusedProp={focusedProp}
          />
        )}

        {/* ── Center canvas ── */}
        <main
          ref={canvasRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: "#0a0f1a" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          <div
            className="mx-auto transition-all duration-300"
            style={{ width: currentViewport.width, minHeight: "100%" }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96 gap-3 text-white/30">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-sm">Cargando configuración…</p>
              </div>
            ) : blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 gap-4 text-white/20">
                <p className="text-sm">No hay módulos. Agrega uno desde el panel izquierdo.</p>
              </div>
            ) : previewMode ? (
              // ── Clean preview: no rings, no drag handles, full fidelity ──
              <div>
                {blocks.map((block) => {
                  const meta = BLOCK_REGISTRY[block.type];
                  if (!meta) return null;
                  const Comp = meta.component;
                  const vpOvr = viewport === "tablet" ? (block.propsTablet ?? {}) : viewport === "mobile" ? (block.propsMobile ?? {}) : {};
                  const merged: Record<string, unknown> = { ...meta.defaultProps, ...block.props, ...vpOvr };
                  if (block.type === "ServicesBlock") merged.services = services;
                  if (block.type === "ProjectsBlock") merged.projects = projects;
                  if (block.type === "TeamBlock") merged.employees = employees;
                  return <Comp key={block.id} {...merged} />;
                })}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => {
                    const meta = BLOCK_REGISTRY[block.type];
                    if (!meta) return null;
                    const Comp = meta.component;
                    // Compute merged props inline so any blocks-state change reaches
                    // the block component directly without an extra component layer.
                    const vpOvr =
                      viewport === "tablet" ? (block.propsTablet ?? {}) :
                      viewport === "mobile"  ? (block.propsMobile ?? {}) : {};
                    const mergedProps: Record<string, unknown> = {
                      ...meta.defaultProps,
                      ...block.props,
                      ...vpOvr,
                    };
                    if (block.type === "ServicesBlock") mergedProps.services = services;
                    if (block.type === "ProjectsBlock") mergedProps.projects = projects;
                    if (block.type === "TeamBlock")     mergedProps.employees = employees;
                    return (
                      <SortableDragWrapper
                        key={block.id}
                        id={block.id}
                        selected={selectedId === block.id}
                        label={meta.label}
                        emoji={meta.emoji}
                        onSelect={() => { setSelectedId(selectedId === block.id ? null : block.id); setFocusedProp(null); }}
                        onFocusProp={setFocusedProp}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onDelete={() => deleteBlock(block.id)}
                      >
                        <Comp {...mergedProps} />
                      </SortableDragWrapper>
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}

            {/* Add block button at bottom */}
            {!previewMode && (
              <div className="flex justify-center py-8">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-dashed border-white/15 text-white/30 hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-400)] text-xs font-semibold transition-colors"
                  onClick={() => {
                    const firstType = Object.keys(BLOCK_REGISTRY)[0] as BlockType;
                    addBlock(firstType);
                  }}
                >
                  <Plus size={14} /> Agregar módulo
                </button>
              </div>
            )}
          </div>
        </main>


      </div>
    </div>
  );
}
