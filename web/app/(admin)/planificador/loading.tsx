export default function PlanificadorLoading() {
  return (
    <div className="relative mx-auto max-w-[1600px] space-y-4 p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="h-16 animate-pulse rounded-md bg-slate-200" />

      {/* Upload card */}
      <div className="h-28 animate-pulse rounded-md bg-slate-200" />

      {/* Semanas cargadas */}
      <div className="h-20 animate-pulse rounded-md bg-slate-200" />

      {/* Programación diaria - acordeones */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-slate-200" />
        ))}
      </div>

      {/* Overlay - logo más pequeño */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-blanco.png" alt="GM Express" className="w-24 drop-shadow-lg" />
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#1B2C56] border-t-transparent" />
        </div>
      </div>
    </div>
  )
}
