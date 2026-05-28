import { FileCheck } from "lucide-react";
import { SheetGenerator } from "@/components/portal/SheetGenerator";

export default function HojasPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
        <span className="w-8 h-8 rounded-lg bg-[#ffae00]/15 text-[#ffae00] grid place-items-center shrink-0">
          <FileCheck size={16} />
        </span>
        <div>
          <h1 className="text-base font-semibold leading-none">Generador de Hojas de Aprobación</h1>
          <p className="text-xs text-white/40 mt-0.5">Crea y descarga hojas de aprobación en JPG</p>
        </div>
      </div>

      {/* Generator (fills remaining height) */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        <SheetGenerator />
      </div>
    </div>
  );
}
