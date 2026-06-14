import { auth } from "@clerk/nextjs/server";
import { Rol } from "@prisma/client";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ ok: false, motivo: "NO_ADMIN" });
  }

  const usuario = await db.usuario.findUnique({
    where: { id: userId },
    select: { rol: true },
  });

  if (usuario?.rol !== Rol.ADMIN) {
    return NextResponse.json({ ok: false, motivo: "NO_ADMIN" });
  }

  return NextResponse.json({ ok: true });
}
