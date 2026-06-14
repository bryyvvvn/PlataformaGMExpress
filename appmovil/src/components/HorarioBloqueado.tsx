import React from 'react';
import { Clock } from 'lucide-react';

export type EstadoHorarioResponse =
  | { permitido: true }
  | {
      permitido: false;
      horaLimite: string;
      fuenteHora: 'empresa' | 'global';
      mensaje: string;
      horaReapertura: string;
    };

interface HorarioBloqueadoProps {
  horaLimite: string;
  horaReapertura: string;
  mensaje: string;
}

export const HorarioBloqueado: React.FC<HorarioBloqueadoProps> = ({ horaLimite, horaReapertura, mensaje }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-6">
      <div className="rounded-full bg-slate-100 p-6">
        <Clock className="h-16 w-16 text-[#1b2c56]" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-[#1b2c56]">
          Pedidos cerrados por hoy
        </h2>
        <p className="text-gray-400 max-w-sm">{mensaje}</p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm px-6 py-4">
        <p className="text-sm text-gray-400">Podrás hacer tu pedido</p>
        <p className="text-lg font-semibold text-[#75aa46]">{horaReapertura}</p>
      </div>
    </div>
  );
};
