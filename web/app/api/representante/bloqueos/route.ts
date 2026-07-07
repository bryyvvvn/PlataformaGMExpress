import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { bloqueoSchema } from "@/lib/schemas/representante";
import { verificarRepresentante } from "@/lib/representante/verificar-representante";
import { invalidarEmpleadosCachePorEmpresa } from "@/lib/representante/trabajadores-cache";

function normalizarDiasBloqueados(dias: number[]) {
  return Array.from(
    new Set(
      dias
        .map(Number)
        .filter((dia) => Number.isInteger(dia) && dia >= 1 && dia <= 7)
    )
  ).sort((a, b) => a - b);
}

export async function PATCH(req: NextRequest) {
  const rep = await verificarRepresentante(req);
  if ("error" in rep) {
    return NextResponse.json({ error: rep.error }, { status: rep.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const result = bloqueoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { usuarioId, diaSemana } = result.data; // diaSemana: 1 (Lun) a 7 (Dom)

  try {
    const trabajador = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { empresaId: true },
    });

    if (!trabajador || trabajador.empresaId !== rep.empresaId) {
      return NextResponse.json(
        { error: "No tienes autoridad sobre este trabajador" },
        { status: 403 }
      );
    }

    // Buscamos al usuario actual para ver sus bloqueos
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { diasBloqueados: true }
    });

    if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const bloqueosActuales = normalizarDiasBloqueados(usuario.diasBloqueados);
    const yaBloqueado = bloqueosActuales.includes(diaSemana);
    
    // Si estaba bloqueado, lo quitamos. Si no, lo agregamos.
    const nuevosBloqueos = normalizarDiasBloqueados(
      yaBloqueado 
        ? bloqueosActuales.filter(d => d !== diaSemana)
        : [...bloqueosActuales, diaSemana]
    );

    const trabajadorActualizado = await db.usuario.update({
      where: { id: usuarioId },
      data: { diasBloqueados: nuevosBloqueos },
      select: {
        id: true,
        diasBloqueados: true,
      },
    });

    invalidarEmpleadosCachePorEmpresa(rep.empresaId);

    return NextResponse.json({
      success: true,
      usuarioId: trabajadorActualizado.id,
      diasBloqueados: trabajadorActualizado.diasBloqueados,
    });
  } catch (error) {
    console.error("Error actualizando bloqueos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
