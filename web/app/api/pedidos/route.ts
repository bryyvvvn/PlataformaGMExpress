import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {

  const pedidos = await db.pedido.findMany();

  return NextResponse.json(pedidos);
}