import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; // Ajusta la ruta a tu lib/db según corresponda
import { verificarRepresentante } from '@/lib/representante/verificar-representante';

export async function GET(req: Request) {
  const rep = await verificarRepresentante();
  if ('error' in rep) {
    return NextResponse.json({ error: rep.error }, { status: rep.status });
  }

  const { searchParams } = new URL(req.url);
  const rut = searchParams.get('rut');

  if (!rut) {
    return NextResponse.json({ error: 'RUT requerido' }, { status: 400 });
  }

  try {
    // Buscamos al usuario por su RUT
    const usuario = await db.usuario.findUnique({
      where: { rut: rut }
    });

    if (!usuario) {
      return NextResponse.json({ error: 'No se encontró ningún usuario con ese RUT' }, { status: 404 });
    }

    if (usuario.empresaId !== null) {
      return NextResponse.json({ error: 'Este usuario ya está vinculado a una empresa' }, { status: 400 });
    }

    // Si todo está bien, devolvemos los datos básicos
    return NextResponse.json({
      id: usuario.id,
      nombre: usuario.nombre || usuario.nombreUsuario,
      rut: usuario.rut
    }, { status: 200 });

  } catch (error) {
    console.error('Error buscando trabajador:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
