"use client"

import { useState } from "react"
import { Snowflake, Flame, Package, Loader2 } from "lucide-react"
import type { jsPDF } from "jspdf"
import type { ConsolidadoDia } from "@/lib/admin/generar-consolidado"

type ZonaExportacion = "fria" | "caliente" | "packing"

type DocConAutoTable = jsPDF & {
  lastAutoTable: { finalY: number }
}

const COLOR_SECUNDARIO: [number, number, number] = [27, 44, 86] // #1b2c56
const COLOR_PRIMARIO: [number, number, number] = [117, 170, 70] // #75aa46

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

  async function fetchConsolidado(): Promise<ConsolidadoDia> {
    const res = await fetch("/api/admin/consolidado")
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

      autoTable(doc, {
        startY: 35,
        head: [["Plato / Item", "Variante", "Cantidad"]],
        body: data.zonaFria.map((i) => [i.nombre, i.variante ?? "NORMAL", i.cantidad]),
        foot: [["TOTAL", "", data.zonaFria.reduce((s, i) => s + i.cantidad, 0)]],
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

      autoTable(doc, {
        startY: 35,
        head: [["Plato / Item", "Variante", "Cantidad"]],
        body: data.zonaCaliente.map((i) => [i.nombre, i.variante ?? "NORMAL", i.cantidad]),
        foot: [["TOTAL", "", data.zonaCaliente.reduce((s, i) => s + i.cantidad, 0)]],
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

      let currentY = 35

      for (const empresa of data.packing) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...COLOR_SECUNDARIO)
        doc.text(`${empresa.empresa} — ${empresa.totalRaciones} raciones`, 14, currentY)

        autoTable(doc, {
          startY: currentY + 4,
          head: [["Plato", "Cantidad"]],
          body: empresa.detalles.map((d) => [d.plato, d.cantidad]),
          foot: [["TOTAL RACIONES (incl. manuales)", empresa.totalRaciones]],
          headStyles: { fillColor: COLOR_SECUNDARIO },
          footStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontStyle: "bold" },
          margin: { left: 14, right: 14 },
        })

        currentY = (doc as DocConAutoTable).lastAutoTable.finalY + 10

        if (currentY > 260) {
          doc.addPage()
          currentY = 20
        }
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

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Exportación Operativa
      </h3>
      <div className="grid grid-cols-3 gap-3">
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

      </div>
    </div>
  )
}
