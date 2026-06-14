import Image from "next/image";
import { CheckCircle2, UtensilsCrossed } from "lucide-react";
import type { PlatoBebida, PlatoMenuDia } from "@/hooks/usePlanificador";

export function MenuOptionCard({
  item,
  selected,
  onSelect,
  disabled = false,
  helperText,
  badge,
}: {
  item: PlatoMenuDia;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  helperText?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onSelect();
      }}
      disabled={disabled}
      className={`group flex w-full overflow-hidden rounded-md border text-left transition-all duration-200 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-55 grayscale"
          : selected
            ? "border-[#75AA46] bg-[#75AA46]/5 ring-1 ring-[#75AA46]/30 shadow-sm"
            : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {item.plato.url_imagen ? (
        <div className="relative h-20 w-20 shrink-0 bg-slate-100 border-r border-slate-100">
          <Image src={item.plato.url_imagen} alt={item.plato.nombre} fill unoptimized className="object-cover" />
        </div>
      ) : (
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 bg-slate-50 border-r border-slate-100 text-[#1B2C56]">
          <UtensilsCrossed className="h-5 w-5 opacity-40" />
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Sin foto</span>
        </div>
      )}
      <div className="min-w-0 flex-1 p-2.5 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest mb-1 ${
                selected ? "bg-[#75AA46]/10 text-[#5d8a38]" : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.plato.tipo}
            </span>
            {badge && (
              <span className="ml-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700">
                {badge}
              </span>
            )}
            <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-800">{item.plato.nombre}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              {item.plato.categoria}
            </p>
            {helperText && <p className="mt-1 text-[10px] font-semibold text-slate-500">{helperText}</p>}
          </div>
          {selected ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#75AA46] mt-1" />
          ) : (
            <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 bg-white transition-colors group-hover:border-[#75AA46]/50" />
          )}
        </div>
      </div>
    </button>
  );
}

export function BebidaOptionCard({
  item,
  selected,
  onSelect,
}: {
  item: PlatoBebida;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full overflow-hidden rounded-md border text-left transition-all duration-200 ${
        selected
          ? "border-[#75AA46] bg-[#75AA46]/5 ring-1 ring-[#75AA46]/30 shadow-sm"
          : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {item.url_imagen ? (
        <div className="relative h-16 w-16 shrink-0 bg-slate-100 border-r border-slate-100">
          <Image src={item.url_imagen} alt={item.nombre} fill unoptimized className="object-cover" />
        </div>
      ) : (
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 bg-slate-50 border-r border-slate-100 text-[#1B2C56]">
          <UtensilsCrossed className="h-4 w-4 opacity-40" />
          <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Sin foto</span>
        </div>
      )}
      <div className="min-w-0 flex-1 p-2.5 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest mb-1 ${
                selected ? "bg-[#75AA46]/10 text-[#5d8a38]" : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.categoria}
            </span>
            <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-800">{item.nombre}</p>
          </div>
          {selected ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#75AA46] mt-1" />
          ) : (
            <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 bg-white transition-colors group-hover:border-[#75AA46]/50" />
          )}
        </div>
      </div>
    </button>
  );
}
