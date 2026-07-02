import Image from "next/image";

type PlanificadorLoadingProps = {
  progress?: number;
  message?: string;
};

export function PlanificadorLoading({
  progress = 0,
  message = "Cargando programaci\u00f3n diaria...",
}: PlanificadorLoadingProps) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-10 shadow-sm"
    >
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <div className="rounded-md border border-slate-100 bg-white px-6 py-4 shadow-sm">
          <Image
            src="/logo-gm-verde-azul.png"
            alt="GM Express"
            width={192}
            height={82}
            priority
            className="h-auto w-40"
          />
        </div>

        <p className="mt-5 text-sm font-bold text-[#1B2C56]">{message}</p>

        <div className="mt-5 w-full">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 ring-1 ring-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#75AA46] via-[#9ACB6F] to-[#1B2C56] shadow-[0_0_18px_rgba(117,170,70,0.35)] transition-[width] duration-300 ease-out"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold tabular-nums text-slate-500">{safeProgress}%</p>
        </div>
      </div>
    </div>
  );
}
