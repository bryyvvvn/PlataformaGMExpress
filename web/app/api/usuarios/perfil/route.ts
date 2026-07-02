import { NextResponse } from 'next/server';

import db from '@/lib/db';

function respuestaSinVinculacion(clerkId: string) {
  const usuario = {
    id: clerkId,
    nombre: null,
    rol: null,
    diasBloqueados: [],
    rut: null,
    telefono: null,
    empresaId: null,
    empresa: null,
  };

  return NextResponse.json({
    ...usuario,
    usuario,
    vinculado: false,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clerkId = searchParams.get('clerkId');

  if (!clerkId) {
    return NextResponse.json({ error: 'Falta el clerkId' }, { status: 400 });
  }

  try {
    const usuario = await db.usuario.findUnique({
      where: { id: clerkId },
      select: {
        id: true,
        nombre: true,
        rol: true,
        diasBloqueados: true,
        rut: true,
        telefono: true,
        empresaId: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            ConvenioEmpresa: true,
          },
        },
      },
    });

    if (!usuario) {
      return respuestaSinVinculacion(clerkId);
    }

    const vinculado = Boolean(usuario.empresaId && usuario.empresa);

    return NextResponse.json({
      ...usuario,
      usuario,
      vinculado,
    });
  } catch (error) {
    console.error('[API PERFIL] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
