"use client"

import { useState } from "react"
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  Loader2,
  ShoppingCart,
  Snowflake,
  Utensils,
} from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import type { ConsolidadoSemana } from "@/lib/admin/generar-consolidado-semana"

type DashboardVistaProps = {
  statsDia: {
    pedidosDelDia: number
    pedidosPendientes: number
    totalPorciones: number
    totalEmpresas: number
    zonaFriaCount: number
    zonaCalienteCount: number
    empaqueCount: number
    empresaTop: string | null
  }
}

export default function DashboardVista({ statsDia }: DashboardVistaProps) {
  const [vista, setVista] = useState<"dia" | "semana">("dia")
  const [loadingSemana, setLoadingSemana] = useState(false)
  const [dataSemana, setDataSemana] = useState<ConsolidadoSemana | null>(null)
  const [desgloseVisible, setDesgloseVisible] = useState(false)

  async function cargarSemana() {
    if (dataSemana) return // ya cargado, no re-fetchear
    setLoadingSemana(true)
    try {
      const res = await fetch("/api/admin/consolidado?modo=semana")
      if (!res.ok) throw new Error("Error al cargar datos semanales")
      const json = (await res.json()) as ConsolidadoSemana
      setDataSemana(json)
    } catch (err) {
      console.error(err)
      alert("No se pudieron cargar las métricas semanales.")
      setVista("dia") // revertir toggle si falla
    } finally {
      setLoadingSemana(false)
    }
  }

  const mostrarSkeleton = vista === "semana" && loadingSemana

  const pedidosLabel = vista === "dia" ? "Pedidos Hoy" : "Pedidos Semana"
  const totalPedidos =
    vista === "dia"
      ? statsDia.pedidosDelDia
      : dataSemana?.resumenGeneral.totalPedidos ?? 0

  const zonaFriaCount =
    vista === "dia"
      ? statsDia.zonaFriaCount
      : dataSemana?.zonaFria.reduce((s, i) => s + i.cantidad, 0) ?? 0

  const zonaCalienteCount =
    vista === "dia"
      ? statsDia.zonaCalienteCount
      : dataSemana?.zonaCaliente.reduce((s, i) => s + i.cantidad, 0) ?? 0

  const empresaTop =
    vista === "dia"
      ? statsDia.empresaTop
      : dataSemana?.resumenGeneral.empresaTopNombre ?? null

  const empaqueLabel = vista === "dia" ? "Empaque / Despacho" : "Raciones Semana"
  const empaqueUnidad = vista === "dia" ? "Pedidos" : "Raciones"
  const empaqueCount =
    vista === "dia"
      ? statsDia.empaqueCount
      : dataSemana?.resumenGeneral.totalRacionesGlobal ?? 0

  const totalPorciones =
    vista === "dia"
      ? statsDia.totalPorciones
      : dataSemana?.resumenGeneral.totalRacionesGlobal ?? 0

  return (
    <div className="space-y-6">
      {/* Header + Toggle global */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1B2C56] uppercase tracking-wider mb-1">
            {vista === "dia" ? "Métricas del Día" : "Métricas de la Semana"}
          </h2>
          <p className="text-sm text-slate-500">
            Empresa con más pedidos {vista === "dia" ? "hoy" : "esta semana"}:{" "}
            <span className="font-semibold text-[#1B2C56]">{empresaTop ?? "Sin pedidos"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 bg-muted">
            <button
              onClick={() => setVista("dia")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                vista === "dia"
                  ? "bg-[#1b2c56] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Métricas del Día
            </button>
            <button
              onClick={() => {
                setVista("semana")
                cargarSemana()
              }}
              disabled={loadingSemana}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                vista === "semana"
                  ? "bg-[#75aa46] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              } disabled:opacity-50`}
            >
              {loadingSemana && <Loader2 className="h-3 w-3 animate-spin" />}
              Métricas de la Semana
            </button>
          </div>
          {vista === "semana" && dataSemana && (
            <span className="text-xs text-muted-foreground italic">{dataSemana.semana}</span>
          )}
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-[#1B2C56]"></div>
          <StatsCard
            title={pedidosLabel}
            value={totalPedidos}
            icon={<ShoppingCart className="h-5 w-5 text-[#1B2C56]" />}
            color="primary"
            loading={mostrarSkeleton}
          />
        </div>

        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-amber-500"></div>
          <StatsCard
            title="En Espera"
            value={statsDia.pedidosPendientes}
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            color="warning"
          />
        </div>

        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-[#75AA46]"></div>
          <StatsCard
            title="Porciones Totales"
            value={totalPorciones}
            icon={<Utensils className="h-5 w-5 text-[#75AA46]" />}
            color="success"
            loading={mostrarSkeleton}
          />
        </div>

        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-slate-700"></div>
          <StatsCard
            title="Empresas Activas"
            value={statsDia.totalEmpresas}
            icon={<Building2 className="h-5 w-5 text-slate-700" />}
            color="primary"
          />
        </div>
      </div>

      {/* Monitor de Áreas */}
      <div>
        <h2 className="text-sm font-bold text-[#1B2C56] uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#75AA46]"></span>
          </span>
          Monitor de Áreas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded text-red-600">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Zona Caliente</p>
                {mostrarSkeleton ? (
                  <div className="h-6 w-16 bg-slate-200 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-lg font-bold text-slate-800">{zonaCalienteCount} Items</p>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">En fuego</span>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded text-blue-600">
                <Snowflake className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Zona Fría</p>
                {mostrarSkeleton ? (
                  <div className="h-6 w-16 bg-slate-200 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-lg font-bold text-slate-800">{zonaFriaCount} Items</p>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">Preparando</span>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{empaqueLabel}</p>
                {mostrarSkeleton ? (
                  <div className="h-6 w-16 bg-slate-200 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-lg font-bold text-slate-800">
                    {empaqueCount} {empaqueUnidad}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">Despachando</span>
          </div>
        </div>
      </div>

      {/* Desglose día a día (solo modo semana) */}
      {vista === "semana" && (
        <div>
          <button
            onClick={() => setDesgloseVisible((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-[#1b2c56] hover:text-[#75aa46] transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                desgloseVisible ? "rotate-180" : ""
              }`}
            />
            {desgloseVisible ? "Ocultar desglose día a día" : "Ver desglose día a día"}
          </button>

          {desgloseVisible && (
            <div className="mt-3 rounded-xl border border-border bg-card p-4">
              {loadingSemana ? (
                <div className="space-y-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground">Día</th>
                      <th className="text-right py-2 font-medium text-blue-500">Zona Fría</th>
                      <th className="text-right py-2 font-medium text-orange-500">Zona Caliente</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Pedidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataSemana?.breakdown.map((dia) => (
                      <tr
                        key={dia.fechaISO}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2 font-medium">{dia.fecha}</td>
                        <td className="py-2 text-right tabular-nums">{dia.zonaFriaCount}</td>
                        <td className="py-2 text-right tabular-nums">{dia.zonaCalienteCount}</td>
                        <td className="py-2 text-right tabular-nums">{dia.totalPedidos}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border">
                      <td className="py-2 font-bold text-[#1b2c56]">Total Semana</td>
                      <td className="py-2 text-right font-bold tabular-nums text-blue-500">{zonaFriaCount}</td>
                      <td className="py-2 text-right font-bold tabular-nums text-orange-500">{zonaCalienteCount}</td>
                      <td className="py-2 text-right font-bold tabular-nums">
                        {dataSemana?.resumenGeneral.totalPedidos ?? 0}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
