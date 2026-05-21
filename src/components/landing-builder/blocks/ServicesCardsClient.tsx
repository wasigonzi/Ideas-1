"use client";

import { useState } from "react";
import { ServiceModal, type ServiceModalData } from "../../ServiceModal";

export interface ServiceItem {
  id: string;
  titleEs: string;
  titleEn?: string | null;
  descEs: string;
  descEn?: string | null;
  icon?: string | null;
  image?: string | null;
  gallery?: string | null;
}

const GRID: Record<string, string> = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-2 lg:grid-cols-4",
};

export function ServicesCardsClient({
  services,
  cols,
  cardBg,
  cardBorderColor,
  textColor,
  subtitleColor,
  accent,
}: {
  services: ServiceItem[];
  cols: string;
  cardBg: string;
  cardBorderColor: string;
  textColor: string;
  subtitleColor: string;
  accent: string;
}) {
  const [selected, setSelected] = useState<ServiceItem | null>(null);

  return (
    <>
      {selected && (
        <ServiceModal
          service={selected as ServiceModalData}
          onClose={() => setSelected(null)}
        />
      )}

      <div className={`grid ${GRID[cols] ?? "grid-cols-3"} gap-6`}>
        {services.map((svc) => (
          <button
            key={svc.id}
            type="button"
            onClick={() => setSelected(svc)}
            className="text-left rounded-2xl p-6 flex flex-col gap-3 border transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer w-full"
            style={{ background: cardBg, borderColor: cardBorderColor }}
          >
            {svc.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={svc.image} alt={svc.titleEs} className="w-full h-40 object-cover rounded-xl" />
            )}
            <h3 className="font-bold text-lg" style={{ color: textColor }}>
              {svc.titleEs}
            </h3>
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: subtitleColor }}>
              {svc.descEs}
            </p>
            <span className="text-xs mt-auto" style={{ color: accent }}>Ver más →</span>
          </button>
        ))}
      </div>
    </>
  );
}
