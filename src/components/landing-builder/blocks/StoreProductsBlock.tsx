import { BlockShell, Field, TextField, SelectField, ToggleField, SectionTitle, SpacingSettings } from "../shared";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Tag } from "lucide-react";

export interface StoreProductItem {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  image?: string | null;
  priceFrom: number;
  variants?: string | null;
}

function parseVariants(raw?: string | null): { price: string }[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

export const storeProductsDefaults: Record<string, unknown> = {
  bgType: "none",
  padTop: 140,
  padBottom: 80,
  maxWidth: "1200px",
  eyebrow: "Tienda",
  title: "Productos de Impresión",
  subtitle: "Stickers, banners, D-Boards, roll-ups y más. Todos impresión full color.",
  columns: "3",
  showCategories: true,
};

export function StoreProductsBlock(props: Record<string, any>) {
  const products: StoreProductItem[] = props.storeProducts ?? [];
  const cols = (props.columns as string) || "3";
  const gridCols = cols === "2" ? "sm:grid-cols-2" : cols === "4" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <BlockShell props={props}>
      {/* Header */}
      {(props.eyebrow || props.title || props.subtitle) && (
        <div className="mb-8">
          {props.eyebrow && (
            <span className="eyebrow">{props.eyebrow as string}</span>
          )}
          {props.title && (
            <h2 data-sel-prop="title" className="heading-lg mt-3 max-w-3xl">
              {props.title as string}
            </h2>
          )}
          {props.subtitle && (
            <p data-sel-prop="subtitle" className="mt-4 text-lg text-white/70 max-w-2xl">
              {props.subtitle as string}
            </p>
          )}
        </div>
      )}

      {/* Category chips */}
      {props.showCategories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border border-white/15 bg-white/5 text-white/70">
              <Tag className="size-3" /> {cat}
            </span>
          ))}
        </div>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/30">
          <ShoppingBag className="size-12" />
          <p className="text-sm">No hay productos activos.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
          {products.map((product) => {
            const variants = parseVariants(product.variants);
            const minPrice = variants.length > 0
              ? Math.min(...variants.map((v) => parseFloat(v.price) || 0))
              : product.priceFrom;

            return (
              <Link
                key={product.id}
                href={`/tienda/${product.slug}`}
                className="card group flex flex-col overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="size-16 text-white/20" />
                    </div>
                  )}
                  {product.category && (
                    <span className="absolute top-3 left-3 bg-ink-950/80 backdrop-blur text-white/80 text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                      {product.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <h3 className="font-bold text-white text-base leading-snug line-clamp-2">{product.title}</h3>
                  <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                    {minPrice > 0 && (
                      <p className="text-brand-400 font-black text-xl">
                        {variants.length > 1 ? "Desde " : ""}${minPrice.toFixed(2)}
                      </p>
                    )}
                    <span className="btn btn-brand text-sm py-2 px-4 shrink-0">Ver producto</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </BlockShell>
  );
}

export function StoreProductsSettings({ props, onChange }: { props: Record<string, unknown>; onChange: (u: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Eyebrow"><TextField value={(props.eyebrow as string) ?? ""} onChange={(v) => onChange({ eyebrow: v })} /></Field>
      <Field label="Título"><TextField value={(props.title as string) ?? ""} onChange={(v) => onChange({ title: v })} multiline /></Field>
      <Field label="Subtítulo"><TextField value={(props.subtitle as string) ?? ""} onChange={(v) => onChange({ subtitle: v })} multiline /></Field>
      <Field label="Columnas">
        <SelectField value={(props.columns as string) ?? "3"} onChange={(v) => onChange({ columns: v })}
          options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]} />
      </Field>
      <Field label="Mostrar categorías" horizontal>
        <ToggleField value={!!(props.showCategories)} onChange={(v) => onChange({ showCategories: v })} />
      </Field>
      <SectionTitle>Espaciado</SectionTitle>
      <SpacingSettings props={props} onChange={onChange} />
    </div>
  );
}
