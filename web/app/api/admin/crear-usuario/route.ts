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

    // 3. Estrategia del "Correo Fantasma" (si el admin no pone correo)
    // Limpiamos el RUT (ej: 12.345.678-9 -> 123456789) para crear un correo falso si es necesario
    const rutLimpio = rut.replace(/[^a-zA-Z0-9]/g, '');
    const emailFinal = (correo && correo.trim() !== "") 
      ? correo 
      : `${rutLimpio}@gmexpress.cl`;

    // 4. Crear el usuario en Clerk
    const clerk = await clerkClient();
    const nuevoUsuarioClerk = await clerk.users.createUser({
      emailAddress: [emailFinal],
      password: password,
      firstName: nombre,
      lastName: apellido,
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