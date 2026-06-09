// src/components/ResumenPedido.tsx
import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';

interface ResumenPedidoProps {
  pedidoExistente: any;
  menuHoy: any;
  manejarEliminar: () => void;
  onModificar: () => void;
  isDeadlinePassed: boolean;
  fechaBloqueada: boolean;
  convenio: any;
}

export const ResumenPedido: React.FC<ResumenPedidoProps> = ({
  pedidoExistente,
  menuHoy,
  manejarEliminar,
  onModificar,
  isDeadlinePassed,
  fechaBloqueada,
  convenio
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden mt-4 grow flex flex-col">
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-[#70a344]" />
          <h3 className="font-black text-xl text-[#1d2d50]">Pedido Listo</h3>
        </div>
        <button onClick={manejarEliminar} className="p-2 text-red-400 bg-red-50 rounded-xl relative z-10 active:scale-90 transition-transform">
          <Trash2 size={20} />
        </button>
      </div>
      
      <div className="space-y-4 mb-6 relative z-10 grow">
        {pedidoExistente.resumen.map((r: any, idx: number) => {
          let nombreGuarnicion = r.guarnicion || r.guarnicionNombre;
          if (!nombreGuarnicion && r.categoria === 'FONDO' && r.guarnicionId && r.guarnicionId !== -1) {
            const platoFondo = menuHoy.fondos?.find((f: any) => f.id === r.platoId);
            const guarnicionObj = platoFondo?.guarniciones?.find((g: any) => g.id === r.guarnicionId);
            if (guarnicionObj) nombreGuarnicion = guarnicionObj.nombre;
          }
          return (
            <div key={idx} className="flex flex-col">
              <span className="text-xs font-black text-[#70a344] uppercase tracking-widest mb-0.5">
                {r.categoria === 'JUGO' ? 'BEBESTIBLE' : r.categoria}
              </span>
              <span className="font-bold text-[#1d2d50] leading-tight text-lg">
                {r.nombre}
                {nombreGuarnicion && <span> + {nombreGuarnicion}</span>}
              </span>
            </div>
          );
        })}

        {convenio?.permitePan && (
          <div className="flex flex-col mt-2 pt-4 border-t border-dashed border-gray-200">
            <span className="text-xs font-black text-[#70a344] uppercase tracking-widest mb-0.5">INCLUIDO POR CONVENIO</span>
            <div className="font-bold text-[#1d2d50] leading-tight flex items-center gap-2 mt-0.5 text-lg">
              Pan
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onModificar}
        disabled={isDeadlinePassed || fechaBloqueada}
        className={`w-full py-4 rounded-xl font-black text-center transition-all relative z-10 text-white mt-auto ${(isDeadlinePassed || fechaBloqueada) ? 'bg-gray-100 text-gray-400' : 'bg-[#70a344] shadow-md active:scale-95'}`}
      >
        {(isDeadlinePassed || fechaBloqueada) ? 'Modificación cerrada' : 'Modificar pedido'}
      </button>
    </div>
  );
};