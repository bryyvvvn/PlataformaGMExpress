import { NextResponse } from 'next/server';
// Usamos la conexión centralizada
import db from '../../../lib/db'; 

export async function GET() {
  try {
    // Cambiamos 'prisma' por 'db'
    const platos = await db.plato.findMany({
      orderBy: { nombre: 'asc' }
    });
    
    // Ya no necesitas configurar CORS aquí, Next.js lo hace globalmente
    return NextResponse.json(platos);
  } catch (error) {
    console.error("Error al obtener platos:", error);
    return NextResponse.json(
      { error: 'Error al obtener platos' }, 
      { status: 500 }
    );
  }
}