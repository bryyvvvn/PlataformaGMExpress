import { NextResponse } from 'next/server';
import db from '../../../../lib/db'; 

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
        empresaId: true,
        empresa: {
          select: { 
            nombre: true,
            ConvenioEmpresa: true // 🔥 ESTA ES LA LÍNEA MÁGICA QUE FALTABA
          }
        }
      }
    });

    if (!usuario) {
      return NextResponse.json({ rol: 'TRABAJADOR' });
    }

    return NextResponse.json(usuario);
    
  } catch (error) {
    console.error('[API PERFIL] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}