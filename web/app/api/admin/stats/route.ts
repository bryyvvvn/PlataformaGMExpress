import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error en /api/admin/stats:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las estadísticas" },
      { status: 500 }
    );
  }
}
