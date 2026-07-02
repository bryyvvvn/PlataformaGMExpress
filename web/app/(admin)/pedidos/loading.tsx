export default function PedidosLoading() {
  return (
    <div className="relative mx-auto max-w-[1600px] space-y-6 p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="h-3 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-64 animate-pulse rounded bg-slate-300" />
          <div className="h-3 w-80 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-10 w-44 animate-pulse rounded-md bg-slate-200" />
      </div>

      {/* KPIs + Reloj lado a lado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-md bg-slate-200" />
          ))}
        </div>
        <div className="h-28 animate-pulse rounded-md bg-slate-200" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-md bg-slate-200" />
        ))}
      </div>

      {/* Tabla */}
      <div className="space-y-3 rounded-md bg-white p-4 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-slate-100" />
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-gm-verde-azul.png" alt="GM Express" className="w-48 drop-shadow-lg" />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B2C56] border-t-transparent" />
        </div>
      </div>
    </div>
  )
}
