"use client";

import { Header } from "@/components/admin/header";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Header title="Inicio" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm text-slate-600">
          No pudimos cargar el resumen. Intenta de nuevo.
        </p>
        <Button onClick={reset} variant="outline">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
