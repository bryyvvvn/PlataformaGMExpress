import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const { usuarioId, diaSemana } = await req.json(); // diaSemana: 1 (Lun) a 5 (Vie)

    // Buscamos al usuario actual para ver sus bloqueos
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { diasBloqueados: true }
    });

    if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const yaBloqueado = usuario.diasBloqueados.includes(diaSemana);
    
    // Si estaba bloqueado, lo quitamos. Si no, lo agregamos.
    const nuevosBloqueos = yaBloqueado 
      ? usuario.diasBloqueados.filter(d => d !== diaSemana)
      : [...usuario.diasBloqueados, diaSemana];

    await db.usuario.update({
      where: { id: usuarioId },
      data: { diasBloqueados: nuevosBloqueos }
    });

    return NextResponse.json({ success: true, diasBloqueados: nuevosBloqueos });
  } catch (error) {
    console.error("Error actualizando bloqueos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}