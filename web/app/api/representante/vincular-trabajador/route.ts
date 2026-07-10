import { NextResponse } from 'next/server';
import { Rol } from '@prisma/client';
import db from '../../../../lib/db'; // Ajusta la ruta a tu lib/db
import { vincularTrabajadorSchema } from '@/lib/schemas/representante';
import { verificarRepresentante } from '@/lib/representante/verificar-representante';
import { invalidarEmpleadosCachePorEmpresa } from '@/lib/representante/trabajadores-cache';
import { invalidarResumenCachePorEmpresa } from '@/lib/representante/resumen-cache';

export async function POST(req: Request) {
  const rep = await verificarRepresentante(req);
  if ('error' in rep) {
    return NextResponse.json({ error: rep.error }, { status: rep.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const result = vincularTrabajadorSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { usuarioId, empresaId } = result.data;

  // Solo puede vincular trabajadores a su propia empresa
  if (empresaId !== rep.empresaId) {
    return NextResponse.json(
      { error: 'Solo puedes vincular trabajadores a tu empresa' },
      { status: 403 }
    );
  }

  try {
    const trabajador = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { empresaId: true },
    });

    if (!trabajador) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 });
    }

    // El trabajador debe estar sin empresa o ya pertenecer a la empresa del representante
    if (trabajador.empresaId !== null && trabajador.empresaId !== rep.empresaId) {
      return NextResponse.json(
        { error: 'El trabajador ya pertenece a otra empresa' },
        { status: 403 }
      );
    }

    // Actualizamos el usuario para asignarle la empresa
    const trabajadorActualizado = await db.usuario.update({
      where: { id: usuarioId },
      data: {
        empresaId: rep.empresaId,
        rol: Rol.TRABAJADOR,
      },
    });

    invalidarEmpleadosCachePorEmpresa(rep.empresaId);
    invalidarResumenCachePorEmpresa(rep.empresaId);
    console.info('[representante-cache] caches invalidados por vinculacion', {
      empresaId: rep.empresaId,
      trabajadorId: trabajadorActualizado.id,
    });

    return NextResponse.json({ success: true, message: 'Trabajador vinculado exitosamente' }, { status: 200 });

  } catch (error) {
    console.error('Error vinculando trabajador:', error);
    return NextResponse.json({ error: 'Error al vincular trabajador' }, { status: 500 });
  }
}
