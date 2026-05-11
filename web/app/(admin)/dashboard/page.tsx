import { Header } from "@/components/admin/header"

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Usamos el Header que creamos en components/admin */}
      <Header 
        title="Dashboard Principal" 
        subtitle="Bienvenido al panel de GM Express" 
      />
      
      {/* 2. Contenido de la página */}
      <div className="p-8">
        <div className="grid gap-6">
          {/* Aquí es donde irán las StatsCards y la Tabla que haremos después */}
          <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center">
            <h2 className="text-2xl font-bold text-primary">¡Estructura de Carpetas Lista!</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Si estás viendo esto, significa que el Layout (Sidebar azul) y el Header (barra superior) 
              están cargando correctamente desde sus carpetas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}