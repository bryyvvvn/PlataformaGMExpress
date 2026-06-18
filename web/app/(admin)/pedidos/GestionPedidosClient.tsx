"use client"

import type { SemanaConsolidada } from "@/lib/pedidos/consolidado"
import { useGestionPedidos } from "@/hooks/useGestionPedidos"
import { PedidosHeader } from "@/components/admin/pedidos/pedidos-header"
import {
  MensajePedidoManualAlert,
  PedidoManualModal,
} from "@/components/admin/pedidos/pedido-manual-modal"
import {
  HoraLimitePedidosCard,
  PedidosEmptySemana,
  PedidosKpis,
} from "@/components/admin/pedidos/pedidos-resumen"
import { PedidosSemanaTabs } from "@/components/admin/pedidos/pedidos-semana-tabs"

type GestionPedidosClientProps = {
  semana: SemanaConsolidada
  horaLimitePedidos: string
}

export function GestionPedidosClient({
  semana,
  horaLimitePedidos,
}: GestionPedidosClientProps) {
  const {
    activeTab,
    ahora,
    descargandoHistorico,
    descargandoProduccion,
    errorExportacion,
    empresas,
    pedidosManuales,
    loadingManuales,
    modalManualOpen,
    guardandoManual,
    mensajeManual,
    formManual,
    empresaManualSeleccionada,
    seleccionarTab,
    abrirModalManual,
    cerrarModalManual,
    actualizarFormManual,
    guardarPedidoManual,
    handleExportarHistorico,
    handleExportarProduccion,
  } = useGestionPedidos(semana)

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6 bg-slate-50 min-h-screen">
      <PedidosHeader semana={semana} onAgregarManual={abrirModalManual} />

      <HoraLimitePedidosCard />

      {mensajeManual && !modalManualOpen && (
        <MensajePedidoManualAlert mensaje={mensajeManual} />
      )}

      <PedidoManualModal
        open={modalManualOpen}
        empresas={empresas}
        empresaManualSeleccionada={empresaManualSeleccionada}
        formManual={formManual}
        guardandoManual={guardandoManual}
        mensajeManual={mensajeManual}
        onClose={cerrarModalManual}
        onChange={actualizarFormManual}
        onGuardar={() => {
          void guardarPedidoManual()
        }}
      />

      <PedidosKpis semana={semana} />

      <PedidosEmptySemana semana={semana} />

      <PedidosSemanaTabs
        semana={semana}
        activeTab={activeTab}
        ahora={ahora}
        horaLimitePedidos={horaLimitePedidos}
        pedidosManuales={pedidosManuales}
        loadingManuales={loadingManuales}
        errorExportacion={errorExportacion}
        descargandoProduccion={descargandoProduccion}
        descargandoHistorico={descargandoHistorico}
        onTabChange={seleccionarTab}
        onExportarProduccion={(fechaISO) => {
          void handleExportarProduccion(fechaISO)
        }}
        onExportarHistorico={(fechaISO) => {
          void handleExportarHistorico(fechaISO)
        }}
      />
    </div>
  )
}
