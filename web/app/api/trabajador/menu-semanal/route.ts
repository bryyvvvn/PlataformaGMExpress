import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  nowChile,
  chileStartOfDay,
  chileEndOfDay,
  getChileDayName,
} from "@/lib/chile-time";
import { esPlatoUnicoPorLegumbre } from "@/lib/menu/es-plato-unico";

export const dynamic = "force-dynamic";

type ConvenioMenuDia = {
  permitePlato: boolean;
  permiteEntrada: boolean;
  permitePostre: boolean;
  permitePan: boolean;
  permiteBebida: boolean;
  permiteJugo: boolean;
  permiteAguaSaborizada: boolean;
  trabajaFinDeSemana: boolean;
};

type PlatoBebida = {
  id: number;
  nombre: string;
  url_imagen: string | null;
  categoria: string;
  tipo: string;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
};

function platoOmiteGuarnicion(plato: { nombre: string; tipo: string }) {
  return (
    plato.tipo === "PLATO_UNICO" ||
    plato.tipo === "HIPOCALORICO" ||
    esPlatoUnicoPorLegumbre(plato.nombre)
  );
}

function formatearDetalle(d: {
  id: number;
  plato: {
    id: number;
    nombre: string;
    url_imagen: string | null;
    categoria: string;
    tipo: string;
  };
  guarniciones: { id: number; nombre: string }[];
}) {
  return {
    ...d.plato,
    guarniciones: platoOmiteGuarnicion(d.plato) ? [] : d.guarniciones,
    menuDetalleId: d.id,
  };
}

function construirEntradaDisplay(entradas: ReturnType<typeof formatearDetalle>[]) {
  if (entradas.length === 0) return null;
  if (entradas.length === 3) return "Ensalada surtida";
  return entradas.map((entrada) => entrada.nombre).join(" + ");
}

function puedeVerBebidaPorConvenio(bebida: PlatoBebida | null, convenio: ConvenioMenuDia | null) {
  if (!bebida || !convenio) return false;
  if (bebida.categoria === "BEBIDA") return convenio.permiteBebida;
  if (bebida.categoria === "JUGO") return convenio.permiteJugo;
  if (bebida.categoria === "AGUA_SABORIZADA") return convenio.permiteAguaSaborizada;
  return false;
}

async function obtenerConvenioUsuario(usuarioId: string | null): Promise<ConvenioMenuDia | null> {
  if (!usuarioId) return null;

  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      empresa: {
        select: {
          ConvenioEmpresa: {
            select: {
              permitePlato: true,
              permiteEntrada: true,
              permitePostre: true,
              permitePan: true,
              permiteBebida: true,
              permiteJugo: true,
              permiteAguaSaborizada: true,
              trabajaFinDeSemana: true,
            },
          },
        },
      },
    },
  });

  return usuario?.empresa?.ConvenioEmpresa ?? null;
}

function formatearSeleccion(seleccion: {
  entradaDetalle: Parameters<typeof formatearDetalle>[0];
  fondoDetalle: Parameters<typeof formatearDetalle>[0];
  postreDetalle: Parameters<typeof formatearDetalle>[0];
  guarnicion: { id: number; nombre: string } | null;
  bebidaPlato: PlatoBebida | null;
  entradasSeleccionadas: Array<{
    orden: number;
    menuDetalle: Parameters<typeof formatearDetalle>[0];
  }>;
}, convenio: ConvenioMenuDia | null) {
  const entradas = seleccion.entradasSeleccionadas.length > 0
    ? seleccion.entradasSeleccionadas
        .sort((a, b) => a.orden - b.orden)
        .map((item) => formatearDetalle(item.menuDetalle))
    : [formatearDetalle(seleccion.entradaDetalle)];
  const permiteEntrada = convenio?.permiteEntrada ?? true;
  const permitePlato = convenio?.permitePlato ?? true;
  const permitePostre = convenio?.permitePostre ?? true;
  const entradasPermitidas = permiteEntrada ? entradas : [];
  const bebida = puedeVerBebidaPorConvenio(seleccion.bebidaPlato, convenio)
    ? seleccion.bebidaPlato
    : null;

  return {
    entrada: entradasPermitidas[0] ?? null,
    fondo: permitePlato ? formatearDetalle(seleccion.fondoDetalle) : null,
    postre: permitePostre ? formatearDetalle(seleccion.postreDetalle) : null,
    guarnicion:
      permitePlato && !platoOmiteGuarnicion(seleccion.fondoDetalle.plato)
        ? seleccion.guarnicion
        : null,
    entradasSeleccionadas: entradasPermitidas,
    entradaDisplay: permiteEntrada ? construirEntradaDisplay(entradasPermitidas) : null,
    bebida,
  };
}

/**
 * GET /api/trabajador/menu-semanal?fecha=YYYY-MM-DD
 *
 * Devuelve { entradas, fondos, postres, menuDia } del día solicitado.
 * Las listas se mantienen para compatibilidad con el flujo personalizado.
 * Sin parámetro → día actual en zona horaria Chile (no en UTC del servidor).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");
    const usuarioId = searchParams.get("usuarioId");

    const isoFecha: string =
      fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)
        ? fechaParam
        : nowChile().iso;

    const diaNombre = getChileDayName(isoFecha);
    const inicioDia = chileStartOfDay(isoFecha);
    const finDia = chileEndOfDay(isoFecha);
    const convenio = await obtenerConvenioUsuario(usuarioId);

    const menuActivo = await db.menuSemanal.findFirst({
      where: {
        fecha_inicio: { lte: finDia },
        fecha_fin: { gte: inicioDia },
      },
      orderBy: { creado_en: "desc" },
      include: {
        detalles: {
          where: {
            OR: [
              { fecha_dia: { gte: inicioDia, lte: finDia } },
              { fecha_dia: null, dia_semana: diaNombre },
            ],
          },
          orderBy: [{ fecha_dia: "asc" }, { id: "asc" }],
          include: { plato: true, guarniciones: true },
        },
        menuDiaSelecciones: {
          where: { fecha_dia: { gte: inicioDia, lte: finDia } },
          include: {
            entradaDetalle: { include: { plato: true, guarniciones: true } },
            fondoDetalle: { include: { plato: true, guarniciones: true } },
            postreDetalle: { include: { plato: true, guarniciones: true } },
            guarnicion: true,
            bebidaPlato: true,
            entradasSeleccionadas: {
              orderBy: [{ orden: "asc" }, { id: "asc" }],
              include: {
                menuDetalle: { include: { plato: true, guarniciones: true } },
              },
            },
          },
        },
      },
    });

    if (!menuActivo || menuActivo.detalles.length === 0) {
      return NextResponse.json({
        entradas: [],
        fondos: [],
        postres: [],
        menuDia: null,
        convenio: {
          trabajaFinDeSemana: Boolean(convenio?.trabajaFinDeSemana),
        },
      });
    }

    const seleccion = menuActivo.menuDiaSelecciones[0];
    const entradas = menuActivo.detalles
      .filter((d) => d.plato.categoria === "ENTRADA")
      .map(formatearDetalle);

    const ensaladaSurtida = await db.plato.findFirst({
      where: {
        nombre: { equals: "Ensalada surtida", mode: "insensitive" },
        categoria: "ENTRADA",
      },
    });

    const entradasConSurtida = ensaladaSurtida
      ? entradas.some((p) => p.nombre.toLowerCase().trim() === "ensalada surtida")
        ? entradas
        : [
            {
              ...ensaladaSurtida,
              guarniciones: [],
              menuDetalleId: null,
            },
            ...entradas,
          ]
      : entradas;

    const menuFormateado = {
      entradas: entradasConSurtida,

      fondos: menuActivo.detalles
        .filter((d) => d.plato.categoria === "FONDO")
        .map(formatearDetalle),

      postres: menuActivo.detalles
        .filter((d) => d.plato.categoria === "POSTRE")
        .map(formatearDetalle),

      menuDia: seleccion ? formatearSeleccion(seleccion, convenio) : null,
      convenio: {
        trabajaFinDeSemana: Boolean(convenio?.trabajaFinDeSemana),
      },
    };

    return NextResponse.json(menuFormateado);
  } catch (error) {
    console.error("[menu-semanal] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
