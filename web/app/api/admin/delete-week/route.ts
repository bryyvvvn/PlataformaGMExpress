export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import db from "@/lib/db";

function normalizarFecha(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

function serialExcelADate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const raw = new Date(utcDays * 86400 * 1000);
  return normalizarFecha(raw);
}

function parseFechaTexto(text: string): Date | null {
  try {
    const afterComma = text.includes(",") ? text.split(",").pop()!.trim() : text.trim();
    const cleaned = afterComma.replace(/\s+de\s+/gi, " ").replace(/\s+/g, " ").trim();
    const parts = cleaned.split(" ");
    // Expecting something like: 6 abril 2026 or 6 4 2026
    if (parts.length < 2) return null;
    const day = parseInt(parts[0], 10);
    if (Number.isNaN(day)) return null;
    const yearPart = parts[parts.length - 1];
    const year = parseInt(yearPart, 10);
    const monthName = parts.slice(1, parts.length - 1).join(" ").toLowerCase();
    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const monthIndex = meses.indexOf(monthName);
    if (monthIndex === -1 || Number.isNaN(year)) return null;
    return normalizarFecha(new Date(Date.UTC(year, monthIndex, day, 12, 0, 0)));
  } catch (e) {
    return null;
  }
}

function isFechaCell(v: any): boolean {
  if (!v && v !== 0) return false;
  if (v instanceof Date) return true;
  if (typeof v === "number") return true;
  if (typeof v === "string") return parseFechaTexto(v) !== null;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as any;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames.find((n) => n.trim().toUpperCase() === "MINUTA");
    if (!sheetName) return NextResponse.json({ error: "No se encontró la pestaña 'MINUTA'" }, { status: 400 });

    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, cellDates: true } as any);

    let filaIndexFechas: number | undefined = undefined;
    for (let r = 0; r < data.length; r++) {
      const row = data[r] || [];
      let count = 0;
      for (let c = 0; c < row.length; c++) {
        if (isFechaCell(row[c])) count++;
      }
      if (count >= 2) { filaIndexFechas = r; break; }
    }

    if (filaIndexFechas === undefined) return NextResponse.json({ error: "No se encontró fila de fechas en el archivo" }, { status: 400 });

    const filaFechas = data[filaIndexFechas];
    const fechaColsDetected: number[] = [];
    for (let i = 0; i < filaFechas.length; i++) if (isFechaCell(filaFechas[i])) fechaColsDetected.push(i);
    if (fechaColsDetected.length === 0) return NextResponse.json({ error: "No se detectaron columnas con fechas" }, { status: 400 });

    const startCol = Math.min(...fechaColsDetected);
    const targetCols = [startCol, startCol + 1, startCol + 2, startCol + 3, startCol + 4];

    const fechasPorColumna: Record<number, Date | undefined> = {};
    for (const col of targetCols) {
      const valorFecha = filaFechas[col];
      if (valorFecha instanceof Date) fechasPorColumna[col] = normalizarFecha(valorFecha);
      else if (typeof valorFecha === "number") fechasPorColumna[col] = serialExcelADate(valorFecha);
      else if (typeof valorFecha === "string") {
        const raw = valorFecha.trim();
        fechasPorColumna[col] = raw === "" ? undefined : parseFechaTexto(valorFecha) ?? undefined;
      } else fechasPorColumna[col] = undefined;
    }

    const knownIndices = targetCols.filter((c) => fechasPorColumna[c]);
    if (knownIndices.length === 0) return NextResponse.json({ error: "No se encontraron fechas válidas en las columnas detectadas" }, { status: 400 });

    const fechas = knownIndices.map((c) => fechasPorColumna[c]!) ;
    const inicio = new Date(Math.min(...fechas.map((d) => d.getTime())));
    const fin = new Date(Math.max(...fechas.map((d) => d.getTime())));

    // Delete MenuSemanal overlapping the interval
    const res = await db.menuSemanal.deleteMany({
      where: {
        AND: [
          { fecha_inicio: { lte: fin } },
          { fecha_fin: { gte: inicio } },
        ],
      },
    });

    return NextResponse.json({ deleted: res.count, inicio: inicio.toISOString().split("T")[0], fin: fin.toISOString().split("T")[0] });
  } catch (error: any) {
    console.error("[delete-week] Error:", error);
    return NextResponse.json({ error: "Error procesando el archivo", detalle: error.message }, { status: 500 });
  }
}
