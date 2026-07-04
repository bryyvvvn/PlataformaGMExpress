import { NextRequest, NextResponse } from "next/server";
import { chileStartOfDay } from "@/lib/chile-time";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Seguridad: Solo permitimos la ejecución con el secreto de Railway
  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret !== process.env.CRON_SECRET) {
    return new NextResponse('Acceso denegado', { status: 401 });
  }

  try {
    const urlBase = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.gmexpress.cl';

    // 2. Calcular las fechas de Lunes a Viernes
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaSemana + 1);

    const promesas = [];

    // 3. Generamos las llamadas
    for (let i = 0; i < 5; i++) {
        const fechaDia = new Date(lunes);
        fechaDia.setDate(lunes.getDate() + i);
        const iso = fechaDia.toISOString().split('T')[0]; // Esto genera "2026-07-02"

        console.log(`[CRON CACHÉ] Calentando menú para el día: ${iso}`);
        
        promesas.push(
        fetch(`${urlBase}/api/trabajador/menu-semanal?fecha=${iso}`)
        );
    }

    // 4. Disparamos todas las peticiones al mismo tiempo
    await Promise.all(promesas);

    return NextResponse.json({ 
      success: true, 
      mensaje: "¡Caché de la semana calentada con éxito en la memoria RAM!" 
    });
    
  } catch (error) {
    console.error("[CRON CACHÉ] Error crítico:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}