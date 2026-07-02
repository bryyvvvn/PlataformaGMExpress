export default function UsuariosLoading() {
  return (
    <div className="relative mx-auto min-h-screen max-w-[1600px] space-y-6 bg-slate-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="h-3 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-64 animate-pulse rounded bg-slate-300" />
          <div className="h-3 w-72 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-10 w-48 animate-pulse rounded-md bg-slate-200" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-md bg-slate-200" />
        ))}
      </div>

      {/* Tabla con tabs */}
      <div className="rounded-md bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="h-8 w-64 animate-pulse rounded-md bg-slate-200" />
          <div className="h-9 w-56 animate-pulse rounded-md bg-slate-200" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-slate-100 px-4 py-3">
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
