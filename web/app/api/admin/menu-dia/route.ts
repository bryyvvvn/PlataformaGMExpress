import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { invalidateMenuCacheForDate } from "@/lib/menu-cache/server-menu-cache";
import { esPlatoUnicoPorLegumbre } from "@/lib/menu/es-plato-unico";
import { validarAdministrador } from "@/lib/usuarios/admin";
import { CategoriaPlato } from "@prisma/client";

export const dynamic = "force-dynamic";

const DIAS_HABILES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;
const CATEGORIAS_BEBIDA: CategoriaPlato[] = ["BEBIDA", "JUGO", "AGUA_SABORIZADA"];

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

class MenuDiaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MenuDiaValidationError";
  }
}

function crearErrorValidacion(message: string): never {
  throw new MenuDiaValidationError(message);
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

type PlatoBebida = {
  id: number;
  nombre: string;
  url_imagen: string | null;
  categoria: CategoriaPlato;
  tipo: string;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
};

type EntradaSeleccionada = {
  orden: number;
  menuDetalle: MenuDetalleConPlato;
};

function platoOmiteGuarnicion(plato: { nombre: string; tipo: string }) {
  return (
    plato.tipo === "PLATO_UNICO" ||
    plato.tipo === "HIPOCALORICO" ||
    esPlatoUnicoPorLegumbre(plato.nombre)
  );
}

function formatearDetalle(detalle: MenuDetalleConPlato) {
  return {
    detalleId: detalle.id,
    fecha: formatIsoDate(detalle.fecha_dia ?? null),
    plato: detalle.plato,
    guarniciones: platoOmiteGuarnicion(detalle.plato) ? [] : detalle.guarniciones,
  };
}

function construirEntradaDisplay(entradas: ReturnType<typeof formatearDetalle>[]) {
  if (entradas.length === 0) return null;
  if (entradas.length === 3) return "Ensalada surtida";
  return entradas.map((entrada) => entrada.plato.nombre).join(" + ");
}

function normalizarTextoBusqueda(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function esEntradaSopa(detalle: MenuDetalleConPlato) {
  return /\b(SOPA|CREMA)\b/.test(normalizarTextoBusqueda(detalle.plato.nombre));
}

function formatearSeleccion(seleccion: {
  id: number;
  postreCantidad: number;
  entradaDetalle: MenuDetalleConPlato;
  fondoDetalle: MenuDetalleConPlato;
  postreDetalle: MenuDetalleConPlato;
  guarnicion: { id: number; nombre: string } | null;
  bebidaPlato: PlatoBebida | null;
  entradasSeleccionadas: EntradaSeleccionada[];
}) {
  const entradas = seleccion.entradasSeleccionadas.length > 0
    ? seleccion.entradasSeleccionadas
        .sort((a, b) => a.orden - b.orden)
        .map((item) => formatearDetalle(item.menuDetalle))
    : [formatearDetalle(seleccion.entradaDetalle)];
  const postreCantidad = seleccion.postreCantidad ?? 1;
  const isDoblePostre = postreCantidad === 2;
  const entradasVisibles = isDoblePostre ? [] : entradas;

  return {
    id: seleccion.id,
    entrada: entradasVisibles[0] ?? null,
    fondo: formatearDetalle(seleccion.fondoDetalle),
    postre: formatearDetalle(seleccion.postreDetalle),
    postreCantidad,
    isDoblePostre,
    guarnicion: platoOmiteGuarnicion(seleccion.fondoDetalle.plato) ? null : seleccion.guarnicion,
    bebida: seleccion.bebidaPlato,
    entradasSeleccionadas: entradasVisibles,
    entradaDisplay: construirEntradaDisplay(entradasVisibles),
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
    crearErrorValidacion(`No se encontró ${nombreCampo}`);
  }

  if (detalle.menuSemanalId !== menuSemanalId || formatIsoDate(detalle.fecha_dia ?? null) !== fecha) {
    crearErrorValidacion(`${nombreCampo} no pertenece a la minuta y fecha indicadas`);
  }

  if (detalle.plato.categoria !== categoria) {
    crearErrorValidacion(`${nombreCampo} no corresponde a la categoría ${categoria}`);
  }
}

function normalizarEntradasIds(entradasIdsRaw: unknown, entradaId: number, permiteSinEntradas = false): number[] {
  if (entradasIdsRaw === undefined) {
    if (permiteSinEntradas && !isPositiveInteger(entradaId)) return [];
    if (!isPositiveInteger(entradaId)) {
      crearErrorValidacion("Debes seleccionar entrada, fondo y postre");
    }
    return [entradaId];
  }

  if (!Array.isArray(entradasIdsRaw)) {
    crearErrorValidacion("entradasIds debe ser un arreglo");
  }

  if ((!permiteSinEntradas && entradasIdsRaw.length < 1) || entradasIdsRaw.length > 3) {
    crearErrorValidacion("Debes seleccionar entre 1 y 3 entradas");
  }

  const entradasIds = entradasIdsRaw.map((value) => Number(value));
  if (entradasIds.some((value) => !isPositiveInteger(value))) {
    crearErrorValidacion("Todas las entradas deben ser IDs numéricos válidos");
  }

  if (new Set(entradasIds).size !== entradasIds.length) {
    crearErrorValidacion("No puedes repetir entradas en el menú del día");
  }

  return entradasIds;
}

function normalizarPostreCantidad(value: unknown): number {
  if (value === undefined || value === null || value === "") return 1;
  const postreCantidad = Number(value);
  if (postreCantidad !== 1 && postreCantidad !== 2) {
    crearErrorValidacion("postreCantidad invÃ¡lido");
  }
  return postreCantidad;
}

function normalizarBebidaPlatoId(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const bebidaPlatoId = Number(value);
  if (!isPositiveInteger(bebidaPlatoId)) {
    crearErrorValidacion("bebidaPlatoId inválido");
  }
  return bebidaPlatoId;
}

export async function GET() {
  try {
    const admin = await validarAdministrador();

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

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
    const admin = await validarAdministrador();

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

    const body = await req.json();
    const menuSemanalId = Number(body.menuSemanalId);
    const entradaId = Number(body.entradaId);
    const fondoId = Number(body.fondoId);
    const postreId = Number(body.postreId);
    const postreCantidad = normalizarPostreCantidad(body.postreCantidad);
    const esDoblePostre = postreCantidad === 2;
    const entradasIds = normalizarEntradasIds(body.entradasIds, entradaId, esDoblePostre);
    const bebidaPlatoId = normalizarBebidaPlatoId(body.bebidaPlatoId);
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

    if (!isPositiveInteger(fondoId) || !isPositiveInteger(postreId)) {
      return NextResponse.json({ error: "Debes seleccionar entrada, fondo y postre" }, { status: 400 });
    }

    if (guarnicionId !== null && !isPositiveInteger(guarnicionId)) {
      return NextResponse.json({ error: "guarnicionId inválido" }, { status: 400 });
    }

    const detalleIds = Array.from(new Set([...entradasIds, fondoId, postreId]));
    const detalles = await db.menuDetalle.findMany({
      where: { id: { in: detalleIds } },
      include: { plato: true, guarniciones: true },
    });

    const entradas = entradasIds.map((id) => detalles.find((detalle) => detalle.id === id));
    const fondo = detalles.find((detalle) => detalle.id === fondoId);
    const postre = detalles.find((detalle) => detalle.id === postreId);
    const fondoEsHipocalorico = fondo?.plato.tipo === "HIPOCALORICO";

    entradas.forEach((entrada, index) => {
      validarDetalle(entrada, "ENTRADA", menuSemanalId, fecha, `La entrada ${index + 1}`);
    });
    validarDetalle(fondo, "FONDO", menuSemanalId, fecha, "El fondo");
    validarDetalle(postre, "POSTRE", menuSemanalId, fecha, "El postre");

    if (esDoblePostre && !fondoEsHipocalorico) {
      crearErrorValidacion("Doble postre solo estÃ¡ permitido para menÃº hipocalÃ³rico");
    }

    if (esDoblePostre && entradasIds.length > 0) {
      crearErrorValidacion("Para menÃº hipocalÃ³rico con doble postre no se debe seleccionar entrada");
    }

    if (fondoEsHipocalorico && !esDoblePostre) {
      if (entradas.length !== 1 || !entradas[0] || !esEntradaSopa(entradas[0])) {
        crearErrorValidacion("Para menÃº hipocalÃ³rico con sopa/crema, selecciona una Ãºnica sopa o crema");
      }
    }

    const bebida = bebidaPlatoId
      ? await db.plato.findUnique({ where: { id: bebidaPlatoId } })
      : null;

    if (bebidaPlatoId && !bebida) {
      crearErrorValidacion("No se encontró la bebida seleccionada");
    }

    if (bebida && !CATEGORIAS_BEBIDA.includes(bebida.categoria)) {
      crearErrorValidacion("La bebida seleccionada no corresponde a una categoría válida");
    }

    const fondoSinGuarnicion = platoOmiteGuarnicion(fondo!.plato);
    const guarnicionIdNormalizada = fondoSinGuarnicion ? null : guarnicionId;
    const guarnicionesFondo = fondo?.guarniciones ?? [];
    const guarnicion = guarnicionIdNormalizada
      ? guarnicionesFondo.find((item) => item.id === guarnicionIdNormalizada)
      : null;

    if (!fondoSinGuarnicion && guarnicionesFondo.length > 0 && !guarnicion) {
      crearErrorValidacion("Debes seleccionar una guarnición válida para el fondo");
    }

    if (!fondoSinGuarnicion && guarnicionesFondo.length === 0 && guarnicionIdNormalizada !== null) {
      crearErrorValidacion("El fondo seleccionado no tiene guarniciones asociadas");
    }

    const fechaDia = fondo!.fecha_dia;
    if (!fechaDia) {
      crearErrorValidacion("El fondo seleccionado no tiene fecha asociada");
    }

    const entradaPrincipalId = entradasIds[0] ?? fondoId;

    const seleccion = await db.$transaction(async (tx) => {
      const seleccionGuardada = await tx.menuDiaSeleccion.upsert({
        where: {
          menuSemanalId_fecha_dia: {
            menuSemanalId,
            fecha_dia: fechaDia,
          },
        },
        update: {
          entradaDetalleId: entradaPrincipalId,
          fondoDetalleId: fondoId,
          postreDetalleId: postreId,
          postreCantidad,
          guarnicionId: guarnicionIdNormalizada,
          bebidaPlatoId,
        },
        create: {
          menuSemanalId,
          fecha_dia: fechaDia,
          entradaDetalleId: entradaPrincipalId,
          fondoDetalleId: fondoId,
          postreDetalleId: postreId,
          postreCantidad,
          guarnicionId: guarnicionIdNormalizada,
          bebidaPlatoId,
        },
      });

      await tx.menuDiaEntradaSeleccion.deleteMany({
        where: { menuDiaSeleccionId: seleccionGuardada.id },
      });

      if (entradasIds.length > 0) {
        await tx.menuDiaEntradaSeleccion.createMany({
          data: entradasIds.map((menuDetalleId, index) => ({
            menuDiaSeleccionId: seleccionGuardada.id,
            menuDetalleId,
            orden: index + 1,
          })),
        });
      }

      return seleccionGuardada;
    }, {
      maxWait: 10000,
      timeout: 15000,
    });

    const seleccionCompleta = await db.menuDiaSeleccion.findUnique({
      where: { id: seleccion.id },
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
    });

    if (!seleccionCompleta) {
      throw new Error("No se pudo leer la selección guardada");
    }

    invalidateMenuCacheForDate(fecha);
    console.info("[menu-cache] invalidated", { fecha });

    return NextResponse.json({ seleccion: formatearSeleccion(seleccionCompleta) });
  } catch (error) {
    console.error("[admin/menu-dia] Error guardando:", error);
    if (error instanceof MenuDiaValidationError) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
    }

    return NextResponse.json(
      { error: "No se pudo guardar el Menú del Día. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
