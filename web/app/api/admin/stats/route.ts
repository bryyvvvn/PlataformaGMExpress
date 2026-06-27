import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";
import { validarAdministrador } from "@/lib/usuarios/admin";

export async function GET() {
  try {
    const admin = await validarAdministrador();

    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

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
