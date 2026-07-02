import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    // 1. Seguridad básica: Asegurarnos de que quien llama a la API está logueado
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. Extraer los datos que envía el frontend
    const body = await req.json();
    const { rut, nombre, apellido, password, empresaId, telefono, correo } = body;

    const rutLimpio = String(rut ?? "").replace(/[^a-zA-Z0-9]/g, "")
    if (!rutLimpio) {
      return NextResponse.json({ error: "RUT inválido" }, { status: 400 })
    }

    const correoLimpio = String(correo ?? "").trim()
    const emailFinal = correoLimpio !== "" ? correoLimpio : `${rutLimpio}@gmexpress.cl`

    const empresaIdInt = Number.parseInt(String(empresaId), 10)
    if (Number.isNaN(empresaIdInt)) {
      return NextResponse.json({ error: "Empresa inválida" }, { status: 400 })
    }

    const passwordFinal = String(password ?? "")
    if (passwordFinal.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    // 4. Crear el usuario en Clerk
    const clerk = await clerkClient();
    const nuevoUsuarioClerk = await clerk.users.createUser({
      emailAddress: [emailFinal],
      password: passwordFinal,
      firstName: String(nombre ?? "").trim(),
      lastName: String(apellido ?? "").trim(),
      phoneNumber: telefono ? [String(telefono).trim()] : undefined,
      // username: rutLimpio, // 🔥 Descomenta esto si habilitas el login por Username en Clerk
    });

    // 5. Guardar el usuario en tu base de datos (PostgreSQL) usando el ID de Clerk
    const usuarioDB = await db.usuario.create({
      data: {
        id: nuevoUsuarioClerk.id, // ID Oficial de Clerk
        rut: rut,
        nombre: nombre,
        apellido: apellido,
        rol: "TRABAJADOR", // Asumimos que los creados por acá son trabajadores
        empresaId: parseInt(empresaId, 10),
        telefono: telefono || null,
        correo: correo || null,
      }
    });

    return NextResponse.json(usuarioDB);

  } catch (error: any) {
    console.error("[CREAR_USUARIO_API]", error);
    
    // Si Clerk rechaza la contraseña por ser muy débil o el correo ya existe
    if (error.errors && error.errors.length > 0) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "Error interno al crear el usuario" }, { status: 500 });
  }
}