import { Rol } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"

import db from "@/lib/db"

export async function validarAdministrador() {
  const { userId } = await auth()

  if (!userId) {
    return { error: "No autorizado", status: 401 as const }
  }

  const administrador = await db.usuario.findUnique({
    where: { id: userId },
    select: { rol: true },
  })

  if (administrador?.rol !== Rol.ADMIN) {
    return { error: "Acceso denegado", status: 403 as const }
  }

  return { userId }
}
