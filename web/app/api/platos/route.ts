// web/app/api/platos/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const platos = await prisma.plato.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(platos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener platos' }, { status: 500 });
  }
}