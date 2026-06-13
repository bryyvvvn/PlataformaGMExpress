import * as xlsx from "xlsx";
import { clasificarFila, normalizarContenidoPostre } from "./clasificar";
import { getDiaSemana, normalizarFecha, parseFechaTexto, serialExcelADate } from "./fechas";
import type {
  DiaMinutaParseado,
  FilaMinutaExcel,
  ParsearMinutaExcelResult,
  PlatoMinutaParseado,
} from "./tipos";

function esFechaExcel(valor: unknown) {
  return (
    valor instanceof Date ||
    (typeof valor === "number" && !Number.isNaN(valor)) ||
    (typeof valor === "string" && parseFechaTexto(valor) !== null)
  );
}

function detectarFilaFechas(data: FilaMinutaExcel[]) {
  const maxRowToScan = Math.min(12, data.length);

  for (let r = 0; r < maxRowToScan; r++) {
    const row = data[r];
    if (!row) continue;

    let validCount = 0;
    for (let col = 2; col <= 6; col++) {
      if (esFechaExcel(row[col])) validCount++;
    }

    if (validCount >= 3) {
      return { filaFechas: row, filaIndexFechas: r };
    }
  }

  return null;
}

function obtenerFechaCelda(valorFecha: unknown) {
  if (valorFecha instanceof Date) return normalizarFecha(valorFecha);
  if (typeof valorFecha === "number") return serialExcelADate(valorFecha);
  if (typeof valorFecha === "string") {
    const raw = valorFecha.trim();
    return raw === "" ? undefined : parseFechaTexto(valorFecha) ?? undefined;
  }
  return undefined;
}

function detectarColumnasFechas(filaFechas: FilaMinutaExcel) {
  const fechaColsDetected: number[] = [];

  for (let col = 0; col < filaFechas.length; col++) {
    if (esFechaExcel(filaFechas[col])) fechaColsDetected.push(col);
  }

  return fechaColsDetected;
}

function construirFechasPorColumna(filaFechas: FilaMinutaExcel, targetCols: number[]) {
  const fechasPorColumna: Record<number, Date | undefined> = {};

  for (const col of targetCols) {
    fechasPorColumna[col] = obtenerFechaCelda(filaFechas[col]);
  }

  const knownIndices = targetCols.filter((c) => fechasPorColumna[c]);
  if (knownIndices.length === 0) return { fechasPorColumna, knownIndices };

  for (const col of targetCols) {
    if (fechasPorColumna[col]) continue;

    let nearest: number | null = null;
    let minDist = Infinity;
    for (const k of knownIndices) {
      const dist = Math.abs(k - col);
      if (dist < minDist) {
        minDist = dist;
        nearest = k;
      }
    }

    if (nearest === null) continue;

    const base = fechasPorColumna[nearest]!;
    const dayOffset = col - nearest;
    const filled = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + dayOffset, 12, 0, 0)
    );
    fechasPorColumna[col] = normalizarFecha(filled);
  }

  return { fechasPorColumna, knownIndices };
}

function detectarColumnaEtiqueta(data: FilaMinutaExcel[], startRow: number, startCol: number) {
  const tokenChecks = [
    "GUARNIC",
    "PROTEIN",
    "VEGANA",
    "VEGETARI",
    "HIPOCALOR",
    "ENSALAD",
    "SOPA",
    "POSTRE",
  ];
  const colCandidates = Math.min(startCol, 8);
  const scores: Record<number, number> = {};

  for (let c = 0; c <= colCandidates; c++) scores[c] = 0;

  for (let r = startRow; r < Math.min(data.length, startRow + 8); r++) {
    const row = data[r] || [];
    for (let c = 0; c <= colCandidates; c++) {
      const v = row[c];
      if (typeof v !== "string") continue;

      const up = v.toUpperCase();
      for (const t of tokenChecks) {
        if (up.includes(t)) scores[c]++;
      }
    }
  }

  let labelCol = 1;
  let best = 0;
  for (let c = 0; c <= colCandidates; c++) {
    if (scores[c] > best) {
      best = scores[c];
      labelCol = c;
    }
  }

  return labelCol;
}

function detectarInicioFilas(data: FilaMinutaExcel[], startRow: number, labelCol: number) {
  for (let r = startRow; r < Math.min(data.length, startRow + 6); r++) {
    const maybeLabel = data[r]?.[labelCol];
    if (typeof maybeLabel === "string" && maybeLabel.trim() !== "") {
      return r;
    }
  }

  return startRow;
}

function tieneValorMinuta(valor: unknown) {
  return Boolean(valor) && valor!.toString().trim() !== "";
}

function parsearGuarnicionesDia(data: FilaMinutaExcel[], col: number, labelCol: number, startRow: number) {
  const guarniciones: string[] = [];

  for (let row = startRow; row < data.length; row++) {
    if (!data[row]) continue;

    const etiqueta = data[row][labelCol];
    const valor = data[row][col];

    if (!etiqueta || typeof etiqueta !== "string") continue;
    if (!tieneValorMinuta(valor)) continue;

    const { esGuarnicion, ignorar } = clasificarFila(etiqueta);
    if (ignorar || !esGuarnicion) continue;

    guarniciones.push(valor!.toString().trim());
  }

  return guarniciones;
}

function parsearPlatosDia(data: FilaMinutaExcel[], col: number, labelCol: number, startRow: number) {
  const platos: PlatoMinutaParseado[] = [];
  const postresProcesadosDelDia = new Set<string>();

  for (let row = startRow; row < data.length; row++) {
    if (!data[row]) continue;

    const etiqueta = data[row][labelCol];
    const valor = data[row][col];

    if (!etiqueta || typeof etiqueta !== "string") continue;
    if (!tieneValorMinuta(valor)) continue;

    const { categoria, variante, esGuarnicion, ignorar } = clasificarFila(etiqueta);
    if (ignorar || esGuarnicion) continue;

    const nombrePlato = valor!.toString().trim();
    if (categoria === "POSTRE") {
      const clavePostre = normalizarContenidoPostre(nombrePlato);
      if (postresProcesadosDelDia.has(clavePostre)) {
        continue;
      }
      postresProcesadosDelDia.add(clavePostre);
    }

    platos.push({ nombre: nombrePlato, categoria, variante });
  }

  return platos;
}

function parsearDia(
  data: FilaMinutaExcel[],
  col: number,
  fecha: Date,
  filaIndexFechas: number,
  startCol: number
): DiaMinutaParseado {
  let startRow = Math.max(1, filaIndexFechas + 1);
  const labelCol = detectarColumnaEtiqueta(data, startRow, startCol);
  startRow = detectarInicioFilas(data, startRow, labelCol);

  return {
    col,
    fecha,
    diaNombre: getDiaSemana(fecha),
    guarniciones: parsearGuarnicionesDia(data, col, labelCol, startRow),
    platos: parsearPlatosDia(data, col, labelCol, startRow),
  };
}

export function parsearMinutaExcel(buffer: Buffer): ParsearMinutaExcelResult {
  const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames.find((name) => name.trim().toUpperCase() === "MINUTA");

  if (!sheetName) {
    return { ok: false, error: "No se encontr\u00f3 la pesta\u00f1a 'MINUTA' en el archivo" };
  }

  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<FilaMinutaExcel>(worksheet, { header: 1 });
  const fechasDetectadas = detectarFilaFechas(data);

  if (!fechasDetectadas) {
    return {
      ok: false,
      error: "Formato inv\u00e1lido: no se encontr\u00f3 la fila de fechas (esperada entre filas 1 y 12 del Excel)",
    };
  }

  const { filaFechas, filaIndexFechas } = fechasDetectadas;
  const fechaColsDetected = detectarColumnasFechas(filaFechas);

  if (fechaColsDetected.length === 0) {
    return { ok: false, error: "No se detectaron columnas con fechas en la fila de fechas" };
  }

  const startCol = Math.min(...fechaColsDetected);
  const targetCols = [startCol, startCol + 1, startCol + 2, startCol + 3, startCol + 4];
  const { fechasPorColumna, knownIndices } = construirFechasPorColumna(filaFechas, targetCols);

  if (knownIndices.length === 0) {
    return { ok: false, error: "No se encontraron fechas v\u00e1lidas en las columnas detectadas" };
  }

  const fechaInicio = fechasPorColumna[targetCols[0]];
  const fechaFin = fechasPorColumna[targetCols[4]];

  if (!fechaInicio || !fechaFin) {
    return {
      ok: false,
      error: "No se pudieron determinar las fechas de inicio/fin de la semana en el archivo",
      logContext: { fechaInicio, fechaFin, fechasPorColumna },
    };
  }

  const dias = targetCols.flatMap((col) => {
    const fechaDia = fechasPorColumna[col];
    return fechaDia ? [parsearDia(data, col, fechaDia, filaIndexFechas, startCol)] : [];
  });

  return { ok: true, minuta: { fechaInicio, fechaFin, dias } };
}
