import { EstadoPedido } from "@prisma/client";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { chileStartOfDay } from "@/lib/chile-time";
import {
  HORA_CIERRE_PEDIDOS,
  esDiaLaboral,
  esFechaISOValida,
  obtenerDisponibilidadPlanillaProduccion,
} from "@/lib/pedidos/cierre-pedidos";
import { generarExcelProduccion } from "@/lib/pedidos/excel";
import { validarAdministrador } from "@/lib/usuarios/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

class CarreraExportacionError extends Error {}

function esObjeto(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function obtenerDiaSiguiente(fechaISO: string): string {
  const [year, month, day] = fechaISO.split("-").map(Number);
  const siguiente = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));
  return siguiente.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const admin = await validarAdministrador();

  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!esObjeto(payload)) {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud debe ser un objeto" },
      { status: 400 },
    );
  }

  const fecha = payload.fecha;

  if (typeof fecha !== "string" || fecha.length === 0) {
    return NextResponse.json(
      { error: "La fecha es obligatoria" },
      { status: 400 },
    );
  }

  if (!esFechaISOValida(fecha)) {
    return NextResponse.json(
      { error: "La fecha debe usar formato YYYY-MM-DD y ser válida" },
      { status: 400 },
    );
  }

  if (!esDiaLaboral(fecha)) {
    return NextResponse.json(
      { error: "La fecha debe corresponder a lunes-viernes" },
      { status: 400 },
    );
  }

  try {
    const configuracion = await db.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { horaLimite: true },
    });
    const disponibilidad = obtenerDisponibilidadPlanillaProduccion(fecha, {
      horaCierre: configuracion?.horaLimite ?? HORA_CIERRE_PEDIDOS,
    });

    if (!disponibilidad.permitido) {
      return NextResponse.json(
        { error: disponibilidad.mensaje },
        { status: 409 },
      );
    }

    const pedidos = await db.pedido.findMany({
      where: {
        estado: EstadoPedido.CONFIRMADO,
        fecha: {
          gte: chileStartOfDay(fecha),
          lt: chileStartOfDay(obtenerDiaSiguiente(fecha)),
        },
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        fecha: true,
        estado: true,
        observacion: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            ConvenioEmpresa: {
              select: { tipoEmpaquetado: true },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
        detalles: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            platoId: true,
            cantidad: true,
            guarnicionId: true,
            plato: {
              select: {
                nombre: true,
                categoria: true,
              },
            },
            guarnicion: {
              select: { nombre: true },
            },
          },
        },
      },
    });

    if (pedidos.length === 0) {
      return NextResponse.json(
        {
          error:
            "No hay pedidos confirmados para pasar a producción en esta fecha",
        },
        { status: 404 },
      );
    }

    const pedidosNormalizados = pedidos.map((pedido) => ({
      ...pedido,
      observacion: pedido.observacion ?? null,
      tipoEmpaquetado: pedido.empresa.ConvenioEmpresa?.tipoEmpaquetado ?? null,
      usuario: {
        ...pedido.usuario,
        nombre: pedido.usuario.nombre ?? "Usuario sin nombre",
      },
    }));

    const { archivo, pedidoIdsIncluidos } =
      await generarExcelProduccion(pedidosNormalizados);

    if (pedidoIdsIncluidos.length === 0) {
      return NextResponse.json(
        {
          error:
            "No hay pedidos confirmados válidos con fondo para pasar a producción",
        },
        { status: 422 },
      );
    }

    await db.$transaction(async (tx) => {
      const actualizacion = await tx.pedido.updateMany({
        where: {
          id: { in: pedidoIdsIncluidos },
          estado: EstadoPedido.CONFIRMADO,
        },
        data: {
          estado: EstadoPedido.EN_PRODUCCION,
        },
      });

      if (actualizacion.count !== pedidoIdsIncluidos.length) {
        throw new CarreraExportacionError();
      }
    });

    await db.exportacionProduccion.create({
      data: {
        fecha,
        pedidosIncluidos: pedidoIdsIncluidos.length,
        creadoPor: null,
      },
    });

    return new Response(archivo, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="produccion-${fecha}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof CarreraExportacionError) {
      return NextResponse.json(
        {
          error:
            "Los pedidos cambiaron durante la exportación. Actualiza la vista e inténtalo nuevamente.",
        },
        { status: 409 },
      );
    }

    console.error("[exportar-produccion] Error:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
