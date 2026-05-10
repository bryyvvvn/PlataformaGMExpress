import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { CategoriaPlato, VarianteMenu } from "@prisma/client";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";

// ─── HELPERS DE FECHA ────────────────────────────────────────────────────────

/**
 * Normaliza cualquier Date al mediodía UTC del mismo día calendario.
 * Evita off-by-one por diferencias de zona horaria entre cliente/servidor.
 */
function normalizarFecha(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

/**
 * Convierte serial de Excel a Date (fallback si cellDates:true no actuó).
 */
function serialExcelADate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const raw = new Date(utcDays * 86400 * 1000);
  return normalizarFecha(raw);
}

/**
 * Devuelve el nombre del día en español basado en el índice UTC.
 */
function getDiaSemana(fecha: Date): string {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[fecha.getUTCDay()];
}

// ─── CLASIFICADOR DE FILAS ────────────────────────────────────────────────────

type ClasificacionFila = {
  categoria: CategoriaPlato;
  variante: VarianteMenu;
  esGuarnicion: boolean;
  ignorar: boolean;
};

/**
 * Determina qué tipo de dato representa cada fila del Excel según su etiqueta.
 * La lógica se basa en la ETIQUETA (columna B), no en el valor de la celda.
 */
function clasificarFila(etiqueta: string): ClasificacionFila {
  const label = etiqueta.toUpperCase().trim();

  // Guarniciones → se guardan aparte y se vinculan a los FONDO del día
  if (label.includes("GUARNICION") || label.includes("GUARNICIÓN")) {
    return { categoria: "FONDO", variante: "NORMAL", esGuarnicion: true, ignorar: false };
  }

  // Proteínas (1 y 2) → FONDO NORMAL (alternativas para elegir)
  if (label.startsWith("PROTEINA") || label.startsWith("PROTEÍNA")) {
    return { categoria: "FONDO", variante: "NORMAL", esGuarnicion: false, ignorar: false };
  }

  // ⚠️  VEGANA debe ir ANTES de VEGETARIANA para evitar falsos positivos
  if (label === "VEGANA") {
    return { categoria: "FONDO", variante: "VEGANO", esGuarnicion: false, ignorar: false };
  }
  if (label === "VEGETARIANA") {
    return { categoria: "FONDO", variante: "VEGETARIANO", esGuarnicion: false, ignorar: false };
  }

  if (label.includes("HIPOCALORICO") || label.includes("HIPOCALÓRICO")) {
    return { categoria: "FONDO", variante: "HIPOCALORICO", esGuarnicion: false, ignorar: false };
  }

  // Ensaladas y Sopa → ENTRADA (se muestran en la app móvil)
  if (label.includes("ENSALADA") || label.includes("SOPA")) {
    return { categoria: "ENTRADA", variante: "NORMAL", esGuarnicion: false, ignorar: false };
  }

  if (label.includes("POSTRE")) {
    return { categoria: "POSTRE", variante: "NORMAL", esGuarnicion: false, ignorar: false };
  }

  // Filas que no reconocemos (títulos, espacios, etc.)
  return { categoria: "ENTRADA", variante: "NORMAL", esGuarnicion: false, ignorar: true };
}

// ─── UPSERT SEGURO DE PLATOS ─────────────────────────────────────────────────

/**
 * Inserta o actualiza un Plato evitando colisiones de nombre cuando el mismo
 * texto existe con distinta variante (ej: "VEGETARIANO/VEGANO" para VEGETARIANA
 * y VEGANA). En ese caso añade el sufijo " [VARIANTE]".
 *
 * NOTA: La solución definitiva es agregar @@unique([nombre, tipo]) al schema
 * de Prisma. Hasta entonces, este helper garantiza que no se pierdan datos.
 */
async function upsertPlatoSeguro(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  nombre: string,
  categoria: CategoriaPlato,
  variante: VarianteMenu
) {
  // 1. ¿Existe ya con este nombre Y este tipo? → actualizar
  const existenteExacto = await tx.plato.findFirst({
    where: { nombre, tipo: variante },
  });
  if (existenteExacto) {
    return tx.plato.update({
      where: { id: existenteExacto.id },
      data: { categoria, tipo: variante },
    });
  }

  // 2. ¿Existe con el mismo nombre pero DISTINTO tipo? → crear con sufijo
  const colision = await tx.plato.findUnique({ where: { nombre } });
  const nombreFinal = colision ? `${nombre} [${variante}]` : nombre;

  return tx.plato.upsert({
    where: { nombre: nombreFinal },
    update: { categoria, tipo: variante },
    create: { nombre: nombreFinal, categoria, tipo: variante },
  });
}

// ─── ENDPOINT POST ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No se subió ningún archivo" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // cellDates: true → xlsx convierte los seriales de fecha a objetos Date
    const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });

    const sheetName = workbook.SheetNames.find(
      (name) => name.trim().toUpperCase() === "MINUTA"
    );
    if (!sheetName) {
      return NextResponse.json(
        { error: "No se encontró la pestaña 'MINUTA' en el archivo" },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    // header:1 → array de arrays 0-indexado
    const data: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // ── ESTRUCTURA REAL DEL EXCEL ──────────────────────────────────────────
    // Fila índice 3 → fechas en columnas 2..6  (Lunes→Viernes)
    // Fila índice 4+ → etiqueta en col 1, datos en cols 2..6
    // ──────────────────────────────────────────────────────────────────────

    const filaFechas = data[3];
    if (!filaFechas) {
      return NextResponse.json(
        { error: "Formato inválido: no se encontró la fila de fechas (fila 4 del Excel)" },
        { status: 400 }
      );
    }

    // Extraer las 5 fechas (columnas índice 2 a 6)
    const fechasPorColumna: Record<number, Date> = {};
    for (let col = 2; col <= 6; col++) {
      const valorFecha = filaFechas[col];
      if (valorFecha instanceof Date) {
        fechasPorColumna[col] = normalizarFecha(valorFecha);
      } else if (typeof valorFecha === "number") {
        // Fallback: xlsx no aplicó cellDates → convertir serial manualmente
        fechasPorColumna[col] = serialExcelADate(valorFecha);
      } else {
        return NextResponse.json(
          { error: `Fecha inválida o vacía en la columna ${col + 1} (día ${col - 1})` },
          { status: 400 }
        );
      }
    }

    const fechaInicio = fechasPorColumna[2]; // Lunes
    const fechaFin = fechasPorColumna[6];   // Viernes

    // Evitar duplicados: no permitir cargar la misma semana dos veces
    const menuExistente = await db.menuSemanal.findFirst({
      where: {
        fecha_inicio: { gte: new Date(fechaInicio.getTime() - 60000) },
        fecha_fin:    { lte: new Date(fechaFin.getTime()   + 60000) },
      },
    });
    if (menuExistente) {
      return NextResponse.json(
        {
          error: "Ya existe un menú cargado para esta semana",
          detalle: `Semana del ${fechaInicio.toISOString().split("T")[0]} al ${fechaFin.toISOString().split("T")[0]}`,
        },
        { status: 409 }
      );
    }

    // ── TRANSACCIÓN PRINCIPAL ──────────────────────────────────────────────
    await db.$transaction(
      async (tx) => {
        const menuSemanal = await tx.menuSemanal.create({
          data: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        });

        // Procesar cada columna: col 2=Lunes, 3=Martes, 4=Miércoles, 5=Jueves, 6=Viernes
        for (let col = 2; col <= 6; col++) {
          const fechaDia = fechasPorColumna[col];
          const diaNombre = getDiaSemana(fechaDia);

          // PASO 1: Recolectar IDs de guarniciones del día
          const guarnicionesDelDiaIds: number[] = [];

          for (let row = 4; row < data.length; row++) {
            if (!data[row]) continue;
            const etiqueta = data[row][1]; // col B (índice 1) → etiqueta
            const valor    = data[row][col];

            if (!etiqueta || typeof etiqueta !== "string") continue;
            if (!valor || valor.toString().trim() === "") continue;

            const { esGuarnicion, ignorar } = clasificarFila(etiqueta);
            if (ignorar || !esGuarnicion) continue;

            const guarnicion = await tx.guarnicion.upsert({
              where: { nombre: valor.toString().trim() },
              update: {},
              create: { nombre: valor.toString().trim() },
            });
            guarnicionesDelDiaIds.push(guarnicion.id);
          }

          // PASO 2: Insertar platos y crear MenuDetalle
          for (let row = 4; row < data.length; row++) {
            if (!data[row]) continue;
            const etiqueta = data[row][1];
            const valor    = data[row][col];

            if (!etiqueta || typeof etiqueta !== "string") continue;
            if (!valor || valor.toString().trim() === "") continue;

            const { categoria, variante, esGuarnicion, ignorar } = clasificarFila(etiqueta);
            if (ignorar || esGuarnicion) continue;

            const plato = await upsertPlatoSeguro(tx, valor.toString().trim(), categoria, variante);

            await tx.menuDetalle.create({
              data: {
                dia_semana:    diaNombre,
                fecha_dia:     fechaDia,
                menuSemanalId: menuSemanal.id,
                platoId:       plato.id,
                // Solo los FONDO llevan guarniciones
                guarniciones:
                  categoria === "FONDO" && guarnicionesDelDiaIds.length > 0
                    ? { connect: guarnicionesDelDiaIds.map((id) => ({ id })) }
                    : undefined,
              },
            });
          }
        }
      },
      { maxWait: 15000, timeout: 60000 }
    );

    return NextResponse.json(
      {
        message: "Minuta cargada correctamente",
        periodo: {
          inicio: fechaInicio.toISOString().split("T")[0],
          fin:    fechaFin.toISOString().split("T")[0],
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[upload-minuta] Error:", error);
    return NextResponse.json(
      { error: "Error procesando el archivo", detalle: error.message },
      { status: 500 }
    );
  }
}