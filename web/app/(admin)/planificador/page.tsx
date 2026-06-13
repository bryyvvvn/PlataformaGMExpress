"use client";

import { PlanificadorHeader } from "@/components/admin/planificador/planificador-header";
import { ProgramacionDiariaSection } from "@/components/admin/planificador/programacion-diaria-section";
import { SemanasCargadasList } from "@/components/admin/planificador/semanas-cargadas-list";
import { UploadMinutaCard } from "@/components/admin/planificador/upload-minuta-card";
import { useMenuDiaSeleccion } from "@/hooks/useMenuDiaSeleccion";
import { usePlanificador } from "@/hooks/usePlanificador";

export default function PlanificadorPage() {
  const {
    file,
    loading,
    mensaje,
    menuDia,
    loadingMenuDia,
    bebidas,
    loadingBebidas,
    drafts,
    guardandoFecha,
    diaAbierto,
    setDiaAbierto,
    semanas,
    loadingSemanas,
    eliminandoSemanaId,
    eliminarSemanasOpen,
    setEliminarSemanasOpen,
    cargarSemanas,
    cargarMenuDia,
    handleFileChange,
    handleUpload,
    actualizarDraft,
    guardarMenuDia,
    eliminarSemana,
  } = usePlanificador();
  const selectionHandlers = useMenuDiaSeleccion(actualizarDraft);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-6 bg-slate-50 min-h-screen">
      <PlanificadorHeader />

      <UploadMinutaCard
        file={file}
        loading={loading}
        mensaje={mensaje}
        onFileChange={handleFileChange}
        onUpload={handleUpload}
      />

      <SemanasCargadasList
        semanas={semanas}
        loadingSemanas={loadingSemanas}
        eliminandoSemanaId={eliminandoSemanaId}
        open={eliminarSemanasOpen}
        onToggleOpen={() => setEliminarSemanasOpen((actual) => !actual)}
        onSync={cargarSemanas}
        onEliminarSemana={eliminarSemana}
      />

      <ProgramacionDiariaSection
        menuDia={menuDia}
        loadingMenuDia={loadingMenuDia}
        bebidas={bebidas}
        loadingBebidas={loadingBebidas}
        drafts={drafts}
        guardandoFecha={guardandoFecha}
        diaAbierto={diaAbierto}
        onToggleDia={(fecha) => setDiaAbierto((actual) => (actual === fecha ? null : fecha))}
        onCargarMenuDia={cargarMenuDia}
        onActualizarDraft={actualizarDraft}
        onGuardarMenuDia={guardarMenuDia}
        selectionHandlers={selectionHandlers}
      />
    </div>
  );
}
