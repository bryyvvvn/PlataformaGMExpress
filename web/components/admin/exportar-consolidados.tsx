"use client"

import { useState } from "react"
import { Snowflake, Flame, Package, Moon, Loader2 } from "lucide-react"
import type { jsPDF } from "jspdf"
import type { ConsolidadoDia } from "@/lib/admin/generar-consolidado"

type ZonaExportacion = "fria" | "caliente" | "packing" | "cenas"

type DocConAutoTable = jsPDF & {
  lastAutoTable: { finalY: number }
}

const COLOR_SECUNDARIO: [number, number, number] = [27, 44, 86] // #1b2c56
const COLOR_PRIMARIO: [number, number, number] = [117, 170, 70] // #75aa46

function formatearEmpaquetado(tipo: string | null | undefined): string {
  switch (tipo) {
    case "BOWL_CRAFT": return "Bowl Craft"
    case "C10_ALUMINIO": return "C10 Aluminio"
    case "SERVICIO_TRADICIONAL_PLATO": return "Servicio Tradicional"
    default: return "Sin definir"
  }
}

function dibujarHeaderCorporativo(doc: jsPDF, titulo: string, fecha: string): void {
  doc.setFillColor(...COLOR_SECUNDARIO)
  doc.rect(0, 0, 210, 28, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("GM EXPRESS", 14, 12)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(titulo, 14, 21)
  doc.text(`Fecha: ${fecha}`, 150, 21)
  doc.setTextColor(0, 0, 0)
}

function dibujarFooter(doc: jsPDF): void {
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  const generadoEn = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })
  doc.text(`Generado: ${generadoEn}`, 14, 287)
}

export default function ExportarConsolidados() {
  const [loading, setLoading] = useState<ZonaExportacion | null>(null)

  async function fetchConsolidado(cenas = false): Promise<ConsolidadoDia> {
    const res = await fetch(cenas ? "/api/admin/consolidado?cenas=true" : "/api/admin/consolidado")
    if (!res.ok) throw new Error(`Error al obtener consolidado: ${res.status}`)
    return res.json()
  }

  async function generarPDF_fria() {
    setLoading("fria")
    try {
      const data = await fetchConsolidado()
      const { default: JsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")
      const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      dibujarHeaderCorporativo(doc, "ZONA FRÍA — Entradas y Postres", data.fecha)

      const zonaFriaOrdenada = [...data.zonaFria].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es")
      )

      autoTable(doc, {
        startY: 35,
        head: [["Plato / Item", "Variante", "Cantidad"]],
        body: zonaFriaOrdenada.map((i) => [i.nombre, i.variante ?? "NORMAL", i.cantidad]),
        foot: [["TOTAL", "", zonaFriaOrdenada.reduce((s, i) => s + i.cantidad, 0)]],
        headStyles: { fillColor: COLOR_SECUNDARIO },
        footStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontStyle: "bold" },
      })

      dibujarFooter(doc)
      doc.save(`Reporte_Zona_Fria_${data.fecha.replace(/\//g, "-")}.pdf`)
    } catch (err) {
      console.error(err)
      alert("Error al generar el PDF. Intente nuevamente.")
    } finally {
      setLoading(null)
    }
  }

  async function generarPDF_caliente() {
    setLoading("caliente")
    try {
      const data = await fetchConsolidado()
      const { default: JsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")
      const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      dibujarHeaderCorporativo(doc, "ZONA CALIENTE — Fondos y Guarniciones", data.fecha)

      const zonaCalienteOrdenada = [...data.zonaCaliente].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es")
      )

      autoTable(doc, {
        startY: 35,
        head: [["Plato / Item", "Variante", "Cantidad"]],
        body: zonaCalienteOrdenada.map((i) => [i.nombre, i.variante ?? "NORMAL", i.cantidad]),
        foot: [["TOTAL", "", zonaCalienteOrdenada.reduce((s, i) => s + i.cantidad, 0)]],
        headStyles: { fillColor: COLOR_SECUNDARIO },
        footStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontStyle: "bold" },
      })

      dibujarFooter(doc)
      doc.save(`Reporte_Zona_Caliente_${data.fecha.replace(/\//g, "-")}.pdf`)
    } catch (err) {
      console.error(err)
      alert("Error al generar el PDF. Intente nuevamente.")
    } finally {
      setLoading(null)
    }
  }

  async function generarPDF_packing() {
    setLoading("packing")
    try {
      const data = await fetchConsolidado()
      const { default: JsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")
      const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      dibujarHeaderCorporativo(doc, "PACKING — Consolidado por Empresa", data.fecha)

      const resumenEmpaquetado = new Map<string, number>()
      for (const empresa of data.packing) {
        const tipo = formatearEmpaquetado(empresa.tipoEmpaquetado)
        resumenEmpaquetado.set(tipo, (resumenEmpaquetado.get(tipo) ?? 0) + empresa.totalRaciones)
      }

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...COLOR_SECUNDARIO)
      doc.text("RESUMEN POR TIPO DE EMPAQUETADO", 14, 35)

      autoTable(doc, {
        startY: 39,
        head: [["Tipo de Empaquetado", "Raciones"]],
        body: Array.from(resumenEmpaquetado.entries()).map(([tipo, raciones]) => [tipo, raciones]),
        foot: [["TOTAL", data.packing.reduce((s, e) => s + e.totalRaciones, 0)]],
        headStyles: { fillColor: COLOR_SECUNDARIO },
        footStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
        tableWidth: 100,
      })

      let currentY = (doc as DocConAutoTable).lastAutoTable.finalY + 15

      doc.setDrawColor(...COLOR_SECUNDARIO)
      doc.setLineWidth(0.5)
      doc.line(14, currentY - 8, 196, currentY - 8)

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...COLOR_SECUNDARIO)
      doc.text("DETALLE POR EMPRESA", 14, currentY + 2)

      currentY += 12

      const ORDEN_CATEGORIA: Record<string, number> = {
        FONDO: 0,
        ENTRADA: 1,
        JUGO: 2,
        BEBIDA: 2,
        AGUA_SABORIZADA: 2,
        POSTRE: 3,
        SANDWICH: 4,
        SNACK: 5,
      }

      const NOMBRE_GRUPO: Record<number, string> = {
        0: "Fondos",
        1: "Entradas",
        2: "Bebestibles",
        3: "Postres",
        4: "Sándwiches",
        5: "Snacks",
      }

      for (const empresa of data.packing) {
        if (currentY > 260) {
          doc.addPage()
          currentY = 20
        }

        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...COLOR_SECUNDARIO)
        doc.text(`${empresa.empresa} — ${empresa.totalRaciones} raciones`, 14, currentY)
        currentY += 6

        const detallesOrdenados = [...empresa.detalles].sort((a, b) => {
          const ordenA = ORDEN_CATEGORIA[a.categoria] ?? 99
          const ordenB = ORDEN_CATEGORIA[b.categoria] ?? 99
          if (ordenA !== ordenB) return ordenA - ordenB
          return a.plato.localeCompare(b.plato, "es")
        })

        const grupos = new Map<number, typeof detallesOrdenados>()
        for (const d of detallesOrdenados) {
          const orden = ORDEN_CATEGORIA[d.categoria] ?? 99
          const grupo = grupos.get(orden) ?? []
          grupo.push(d)
          grupos.set(orden, grupo)
        }

        for (const [orden, items] of grupos) {
          if (currentY > 260) {
            doc.addPage()
            currentY = 20
          }

          const subtitulo = NOMBRE_GRUPO[orden] ?? "Otros"
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(117, 170, 70)
          doc.text(subtitulo, 14, currentY)

          autoTable(doc, {
            startY: currentY + 3,
            head: [["Plato", "Cantidad"]],
            body: items.map((d) => [d.plato, d.cantidad]),
            headStyles: { fillColor: COLOR_SECUNDARIO },
            margin: { left: 14, right: 14 },
          })

          currentY = (doc as DocConAutoTable).lastAutoTable.finalY + 6
        }

        currentY += 4
      }

      dibujarFooter(doc)
      doc.save(`Reporte_Packing_${data.fecha.replace(/\//g, "-")}.pdf`)
    } catch (err) {
      console.error(err)
      alert("Error al generar el PDF. Intente nuevamente.")
    } finally {
      setLoading(null)
    }
  }

  async function generarPDF_cenas() {
    setLoading("cenas")
    try {
      const data = await fetchConsolidado(true)
      const { default: JsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")
      const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      dibujarHeaderCorporativo(doc, "CENAS — Consolidado por Empresa", data.fecha)

      const empresasOrdenadas = [...data.packing].sort((a, b) =>
        a.empresa.localeCompare(b.empresa, "es")
      )

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...COLOR_SECUNDARIO)
      doc.text("RESUMEN POR EMPRESA", 14, 35)

      autoTable(doc, {
        startY: 39,
        head: [["Empresa", "Total Cenas"]],
        body: empresasOrdenadas.map((e) => [e.empresa, e.totalRaciones]),
        foot: [["TOTAL", empresasOrdenadas.reduce((s, e) => s + e.totalRaciones, 0)]],
        headStyles: { fillColor: COLOR_SECUNDARIO },
        footStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
        tableWidth: 100,
      })

      let currentY = (doc as DocConAutoTable).lastAutoTable.finalY + 15

      doc.setDrawColor(...COLOR_SECUNDARIO)
      doc.setLineWidth(0.5)
      doc.line(14, currentY - 8, 196, currentY - 8)

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...COLOR_SECUNDARIO)
      doc.text("DETALLE POR EMPRESA", 14, currentY + 2)

      currentY += 12

      const ORDEN_CATEGORIA: Record<string, number> = {
        FONDO: 0,
        ENTRADA: 1,
        JUGO: 2,
        BEBIDA: 2,
        AGUA_SABORIZADA: 2,
        POSTRE: 3,
        SANDWICH: 4,
        SNACK: 5,
      }

      const NOMBRE_GRUPO: Record<number, string> = {
        0: "Fondos",
        1: "Entradas",
        2: "Bebestibles",
        3: "Postres",
        4: "Sándwiches",
        5: "Snacks",
      }

      for (const empresa of empresasOrdenadas) {
        if (currentY > 260) {
          doc.addPage()
          currentY = 20
        }

        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...COLOR_SECUNDARIO)
        doc.text(`${empresa.empresa} — ${empresa.totalRaciones} cenas`, 14, currentY)
        currentY += 6

        const detallesOrdenados = [...empresa.detalles].sort((a, b) => {
          const ordenA = ORDEN_CATEGORIA[a.categoria] ?? 99
          const ordenB = ORDEN_CATEGORIA[b.categoria] ?? 99
          if (ordenA !== ordenB) return ordenA - ordenB
          return a.plato.localeCompare(b.plato, "es")
        })

        const grupos = new Map<number, typeof detallesOrdenados>()
        for (const d of detallesOrdenados) {
          const orden = ORDEN_CATEGORIA[d.categoria] ?? 99
          const grupo = grupos.get(orden) ?? []
          grupo.push(d)
          grupos.set(orden, grupo)
        }

        for (const [orden, items] of grupos) {
          if (currentY > 260) {
            doc.addPage()
            currentY = 20
          }

          const subtitulo = NOMBRE_GRUPO[orden] ?? "Otros"
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(117, 170, 70)
          doc.text(subtitulo, 14, currentY)

          autoTable(doc, {
            startY: currentY + 3,
            head: [["Plato", "Cantidad"]],
            body: items.map((d) => [d.plato, d.cantidad]),
            headStyles: { fillColor: COLOR_SECUNDARIO },
            margin: { left: 14, right: 14 },
          })

          currentY = (doc as DocConAutoTable).lastAutoTable.finalY + 6
        }

        currentY += 4
      }

      dibujarFooter(doc)
      doc.save(`Reporte_Cenas_${data.fecha.replace(/\//g, "-")}.pdf`)
    } catch (err) {
      console.error(err)
      alert("Error al generar el PDF. Intente nuevamente.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Exportación Operativa
      </h3>
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={generarPDF_fria}
          disabled={loading !== null}
          className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium transition-colors hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "fria" ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          ) : (
            <Snowflake className="h-6 w-6 text-blue-500" />
          )}
          <span>Zona Fría</span>
        </button>

        <button
          onClick={generarPDF_caliente}
          disabled={loading !== null}
          className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium transition-colors hover:bg-orange-50 hover:border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "caliente" ? (
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          ) : (
            <Flame className="h-6 w-6 text-orange-500" />
          )}
          <span>Zona Caliente</span>
        </button>

        <button
          onClick={generarPDF_packing}
          disabled={loading !== null}
          className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium transition-colors hover:bg-green-50 hover:border-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "packing" ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#75aa46]" />
          ) : (
            <Package className="h-6 w-6 text-[#75aa46]" />
          )}
          <span>Packing</span>
        </button>

        <button
          onClick={generarPDF_cenas}
          disabled={loading !== null}
          className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium transition-colors hover:bg-purple-50 hover:border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "cenas" ? (
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          ) : (
            <Moon className="h-6 w-6 text-purple-500" />
          )}
          <span>Cenas</span>
        </button>

      </div>
    </div>
  )
}
