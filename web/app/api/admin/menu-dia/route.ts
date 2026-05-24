import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { CategoriaPlato } from "@prisma/client";

export const dynamic = "force-dynamic";

const DIAS_HABILES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;

type DiaHabil = (typeof DIAS_HABILES)[number];

function formatIsoDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error guardando el menú del día";
}

function normalizarDia(dia: string): DiaHabil | string {
  const normalized = dia
    .replace(/Ã©/g, "é")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "miercoles") return "Miércoles";
  return DIAS_HABILES.find((d) => d.toLowerCase() === normalized) ?? dia;
}

type MenuDetalleConPlato = Awaited<ReturnType<typeof db.menuDetalle.findMany>>[number] & {
  plato: {
    id: number;
    nombre: string;
    url_imagen: string | null;
    categoria: CategoriaPlato;
    tipo: string;
  };
  guarniciones: { id: number; nombre: string }[];
};

function formatearDetalle(detalle: MenuDetalleConPlato) {
  return {
    detalleId: detalle.id,
    fecha: formatIsoDate(detalle.fecha_dia ?? null),
    plato: detalle.plato,
    guarniciones: detalle.guarniciones,
  };
}

function formatearSeleccion(seleccion: {
  id: number;
  entradaDetalle: MenuDetalleConPlato;
  fondoDetalle: MenuDetalleConPlato;
  postreDetalle: MenuDetalleConPlato;
  guarnicion: { id: number; nombre: string } | null;
}) {
  return {
    id: seleccion.id,
    entrada: formatearDetalle(seleccion.entradaDetalle),
    fondo: formatearDetalle(seleccion.fondoDetalle),
    postre: formatearDetalle(seleccion.postreDetalle),
    guarnicion: seleccion.guarnicion,
  };
}

function validarDetalle(
  detalle: MenuDetalleConPlato | undefined,
  categoria: CategoriaPlato,
  menuSemanalId: number,
  fecha: string,
  nombreCampo: string
) {
  if (!detalle) {
    throw new Error(`No se encontró ${nombreCampo}`);
  }

  if (detalle.menuSemanalId !== menuSemanalId || formatIsoDate(detalle.fecha_dia ?? null) !== fecha) {
    throw new Error(`${nombreCampo} no pertenece a la minuta y fecha indicadas`);
  }

  if (detalle.plato.categoria !== categoria) {
    throw new Error(`${nombreCampo} no corresponde a la categoría ${categoria}`);
  }
}

export async function GET() {
  try {
    const menuActivo = await db.menuSemanal.findFirst({
      orderBy: { creado_en: "desc" },
      include: {
        detalles: {
          include: { plato: true, guarniciones: true },
          orderBy: [{ fecha_dia: "asc" }, { id: "asc" }],
        },
        menuDiaSelecciones: {
          include: {
            entradaDetalle: { include: { plato: true, guarniciones: true } },
            fondoDetalle: { include: { plato: true, guarniciones: true } },
            postreDetalle: { include: { plato: true, guarniciones: true } },
            guarnicion: true,
          },
        },
      },
    });

    if (!menuActivo) {
      return NextResponse.json({
        menu: null,
        dias: DIAS_HABILES.map((dia) => ({
          dia,
          fecha: null,
          opciones: { entradas: [], fondos: [], postres: [] },
          seleccion: null,
        })),
      });
    }

    const dias = DIAS_HABILES.map((dia) => {
      const detalles = menuActivo.detalles.filter((detalle) => normalizarDia(detalle.dia_semana) === dia);
      const fecha = formatIsoDate(detalles.find((detalle) => detalle.fecha_dia)?.fecha_dia ?? null);
      const seleccion = fecha
        ? menuActivo.menuDiaSelecciones.find((item) => formatIsoDate(item.fecha_dia) === fecha)
        : undefined;

      return {
        dia,
        fecha,
        opciones: {
          entradas: detalles.filter((detalle) => detalle.plato.categoria === "ENTRADA").map(formatearDetalle),
          fondos: detalles.filter((detalle) => detalle.plato.categoria === "FONDO").map(formatearDetalle),
          postres: detalles.filter((detalle) => detalle.plato.categoria === "POSTRE").map(formatearDetalle),
        },
        seleccion: seleccion ? formatearSeleccion(seleccion) : null,
      };
    });

    return NextResponse.json({
      menu: {
        id: menuActivo.id,
        fecha_inicio: formatIsoDate(menuActivo.fecha_inicio),
        fecha_fin: formatIsoDate(menuActivo.fecha_fin),
      },
      dias,
    });
  } catch (error) {
    console.error("[admin/menu-dia] Error:", error);
    return NextResponse.json({ error: "Error obteniendo el menú del día" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const menuSemanalId = Number(body.menuSemanalId);
    const entradaId = Number(body.entradaId);
    const fondoId = Number(body.fondoId);
    const postreId = Number(body.postreId);
    const guarnicionId = body.guarnicionId === null || body.guarnicionId === undefined
      ? null
      : Number(body.guarnicionId);
    const fecha = body.fecha;

    if (!isPositiveInteger(menuSemanalId)) {
      return NextResponse.json({ error: "menuSemanalId inválido" }, { status: 400 });
    }

    if (!isIsoDate(fecha)) {
      return NextResponse.json({ error: "fecha inválida" }, { status: 400 });
    }

    if (!isPositiveInteger(entradaId) || !isPositiveInteger(fondoId) || !isPositiveInteger(postreId)) {
      return NextResponse.json({ error: "Debes seleccionar entrada, fondo y postre" }, { status: 400 });
    }

    if (guarnicionId !== null && !isPositiveInteger(guarnicionId)) {
      return NextResponse.json({ error: "guarnicionId inválido" }, { status: 400 });
    }

    const seleccion = await db.$transaction(async (tx) => {
      const detalles = await tx.menuDetalle.findMany({
        where: { id: { in: [entradaId, fondoId, postreId] } },
        include: { plato: true, guarniciones: true },
      });

      const entrada = detalles.find((detalle) => detalle.id === entradaId);
      const fondo = detalles.find((detalle) => detalle.id === fondoId);
      const postre = detalles.find((detalle) => detalle.id === postreId);

      validarDetalle(entrada, "ENTRADA", menuSemanalId, fecha, "La entrada");
      validarDetalle(fondo, "FONDO", menuSemanalId, fecha, "El fondo");
      validarDetalle(postre, "POSTRE", menuSemanalId, fecha, "El postre");

      const guarnicionesFondo = fondo?.guarniciones ?? [];
      const guarnicion = guarnicionId
        ? guarnicionesFondo.find((item) => item.id === guarnicionId)
        : null;

      if (guarnicionesFondo.length > 0 && !guarnicion) {
        throw new Error("Debes seleccionar una guarnición válida para el fondo");
      }

      if (guarnicionesFondo.length === 0 && guarnicionId !== null) {
        throw new Error("El fondo seleccionado no tiene guarniciones asociadas");
      }

      const fechaDia = fondo!.fecha_dia;
      if (!fechaDia) {
        throw new Error("El fondo seleccionado no tiene fecha asociada");
      }

      return tx.menuDiaSeleccion.upsert({
        where: {
          menuSemanalId_fecha_dia: {
            menuSemanalId,
            fecha_dia: fechaDia,
          },
        },
        update: {
          entradaDetalleId: entradaId,
          fondoDetalleId: fondoId,
          postreDetalleId: postreId,
          guarnicionId,
        },
        create: {
          menuSemanalId,
          fecha_dia: fechaDia,
          entradaDetalleId: entradaId,
          fondoDetalleId: fondoId,
          postreDetalleId: postreId,
          guarnicionId,
        },
        include: {
          entradaDetalle: { include: { plato: true, guarniciones: true } },
          fondoDetalle: { include: { plato: true, guarniciones: true } },
          postreDetalle: { include: { plato: true, guarniciones: true } },
          guarnicion: true,
        },
      });
    });

    return NextResponse.json({ seleccion: formatearSeleccion(seleccion) });
  } catch (error) {
    console.error("[admin/menu-dia] Error guardando:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
