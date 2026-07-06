import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import nodemailer from 'nodemailer';

import type { Prisma } from '@prisma/client';
import { enviarPlanillaSchema } from '@/lib/schemas/representante';
import { verificarRepresentante } from '@/lib/representante/verificar-representante';

async function obtenerConvenioEmpresa(empresaId?: number, usuarioId?: string) {
  if (empresaId) {
    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        ConvenioEmpresa: {
          select: { trabajaFinDeSemana: true, permiteCena: true },
        },
      },
    });

    return {
      trabajaFinDeSemana: Boolean(empresa?.ConvenioEmpresa?.trabajaFinDeSemana),
      permiteCena: Boolean(empresa?.ConvenioEmpresa?.permiteCena),
    };
  }

  if (usuarioId) {
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        empresa: {
          select: {
            ConvenioEmpresa: {
              select: { trabajaFinDeSemana: true, permiteCena: true },
            },
          },
        },
      },
    });

    return {
      trabajaFinDeSemana: Boolean(usuario?.empresa?.ConvenioEmpresa?.trabajaFinDeSemana),
      permiteCena: Boolean(usuario?.empresa?.ConvenioEmpresa?.permiteCena),
    };
  }

  return { trabajaFinDeSemana: false, permiteCena: false };
}

export async function POST(request: Request) {
  const rep = await verificarRepresentante(request);
  if ('error' in rep) {
    return NextResponse.json({ error: rep.error }, { status: rep.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const result = enviarPlanillaSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { usuarioId, fecha } = result.data;
  const empresaIdSeguro = rep.empresaId; // ignorar body.empresaId

  try {
    if (usuarioId) {
      const trabajador = await db.usuario.findUnique({
        where: { id: usuarioId },
        select: { empresaId: true },
      });

      if (!trabajador || trabajador.empresaId !== empresaIdSeguro) {
        return NextResponse.json(
          { error: 'No tienes autoridad sobre este trabajador' },
          { status: 403 }
        );
      }
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
    const convenio = await obtenerConvenioEmpresa(empresaIdSeguro, usuarioId);
    finSemana.setDate(inicioSemana.getDate() + (convenio.trabajaFinDeSemana ? 6 : 4));
    finSemana.setHours(23, 59, 59, 999);

    const whereClause: Prisma.PedidoWhereInput = {
      estado: 'PENDIENTE',
      fecha: {
        gte: inicioSemana,
        lte: finSemana,
      },
      ...(convenio.permiteCena ? {} : { esCena: false }),
    };

    if (usuarioId) whereClause.usuarioId = usuarioId;
    else whereClause.empresaId = empresaIdSeguro;

    // 1. ACTUALIZAMOS LA BASE DE DATOS
    const actualizados = await db.pedido.updateMany({
      where: whereClause,
      data: { estado: 'CONFIRMADO' },
    });

    // 🔥 2. SI SE CONFIRMARON PEDIDOS, MANDAMOS EL CORREO EN SEGUNDO PLANO
    if (actualizados.count > 0) {
      try {
        const empresaData = await db.empresa.findUnique({
          where: { id: empresaIdSeguro },
          select: { nombre: true }
        });

        const nombreEmpresa = empresaData?.nombre || 'Una empresa';
        const correoAdmin = process.env.ADMIN_EMAIL || 'maickol@ejemplo.com';

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

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

        // 🔥 AQUÍ ESTÁ EL CAMBIO CLAVE: Sin await, usamos .then y .catch
        transporter.sendMail(mailOptions)
          .then(() => {
            console.log(`[CORREO] Aviso enviado a ${correoAdmin} por consolidación de ${nombreEmpresa}`);
          })
          .catch((emailError) => {
            console.error('[CORREO ERROR] Falló el envío de consolidación:', emailError);
          });

      } catch (errorGeneral) {
        console.error('[PROCESO ERROR] Error al armar el correo:', errorGeneral);
      }
    }

    return NextResponse.json({ success: true, pedidosConfirmados: actualizados.count });
  } catch (error) {
    console.error('[API REPRESENTANTE ENVIAR-PLANILLA] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}