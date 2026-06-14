import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import nodemailer from 'nodemailer'; // 🔥 IMPORTAMOS NODEMAILER

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { empresaId, usuarioId, fecha } = body as { empresaId?: string | number; usuarioId?: string; fecha?: string | null };

    if (!empresaId && !usuarioId) {
      return NextResponse.json({ error: 'Falta empresaId o usuarioId' }, { status: 400 });
    }

    let fechaBase = new Date();
    if (fecha) {
      const safeDate = fecha.includes('T') ? fecha : `${fecha}T12:00:00`;
      fechaBase = new Date(safeDate);
    }

    const diaSemana = fechaBase.getDay() || 7;
    const inicioSemana = new Date(fechaBase);
    inicioSemana.setDate(fechaBase.getDate() - diaSemana + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const whereClause: any = {
      estado: 'PENDIENTE',
      fecha: {
        gte: inicioSemana,
        lte: finSemana,
      },
    };

    if (usuarioId) whereClause.usuarioId = usuarioId;
    else if (empresaId) whereClause.empresaId = typeof empresaId === 'string' ? parseInt(empresaId, 10) : empresaId;

    // 1. ACTUALIZAMOS LA BASE DE DATOS (Tu código original)
    const actualizados = await db.pedido.updateMany({
      where: whereClause,
      data: { estado: 'CONFIRMADO' },
    });

    // 🔥 2. SI SE CONFIRMARON PEDIDOS, MANDAMOS EL CORREO
    if (actualizados.count > 0 && empresaId) {
      try {
        // Buscamos el nombre de la empresa para personalizar el correo
        const idEmpresaNum = typeof empresaId === 'string' ? parseInt(empresaId, 10) : empresaId;
        const empresaData = await db.empresa.findUnique({
          where: { id: idEmpresaNum },
          select: { nombre: true }
        });

        const nombreEmpresa = empresaData?.nombre || 'Una empresa';
        const correoAdmin = process.env.ADMIN_EMAIL || 'maickol@ejemplo.com';

        // Configuramos el "Cartero" de Nodemailer
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        // Armamos el correo
        const mailOptions = {
          from: `"GM Express Sistema" <${process.env.EMAIL_USER}>`,
          to: correoAdmin,
          subject: `✅ Planilla Consolidada - ${nombreEmpresa}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1d2d50; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #1d2d50; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-style: italic;">GM <span style="color: #70a344;">EXPRESS</span></h1>
              </div>
              <div style="padding: 30px;">
                <h2 style="margin-top: 0; color: #1d2d50;">¡Planilla Lista para Producción!</h2>
                <p>El representante de la empresa <strong>${nombreEmpresa}</strong> ha consolidado y enviado su planilla semanal.</p>
                
                <div style="background-color: #f3f4f6; border-left: 4px solid #70a344; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 16px;">
                    <strong>Total de raciones confirmadas:</strong> ${actualizados.count}
                  </p>
                </div>

                <p>Por favor, revisa el panel de administración web para ver el detalle exacto de los platos, dietas y colaciones solicitadas.</p>
              </div>
              <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                Este es un mensaje automático del sistema GM Express. No respondas a este correo.
              </div>
            </div>
          `,
        };

        // Disparamos el correo
        await transporter.sendMail(mailOptions);
        console.log(`[CORREO] Aviso enviado a ${correoAdmin} por consolidación de ${nombreEmpresa}`);

      } catch (emailError) {
        // Si el correo falla (ej. clave mal puesta), lo registramos en consola 
        // pero NO rompemos la ejecución, para que la app del usuario diga "Éxito".
        console.error('[CORREO ERROR] Falló el envío de consolidación:', emailError);
      }
    }

    return NextResponse.json({ success: true, pedidosConfirmados: actualizados.count });
  } catch (error) {
    console.error('[API REPRESENTANTE ENVIAR-PLANILLA] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}