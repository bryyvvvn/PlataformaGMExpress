export default function EmpresasLoading() {
  return (
    <div className="relative mx-auto w-full max-w-7xl space-y-4 p-4 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-48 animate-pulse rounded bg-slate-300" />
          <div className="h-3 w-64 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-md bg-slate-200" />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-md bg-slate-200" />
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-md bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-slate-100 px-4 py-4">
            <div className="h-10 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-blanco.png" alt="GM Express" className="w-32 drop-shadow-lg" />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B2C56] border-t-transparent" />
        </div>
      </div>
    </div>
  )
}
