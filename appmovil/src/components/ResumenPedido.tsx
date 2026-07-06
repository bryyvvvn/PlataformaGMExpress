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
  observacion?: string | null;
}

export const ResumenPedido: React.FC<ResumenPedidoProps> = ({
  pedidoExistente,
  menuHoy,
  manejarEliminar,
  onModificar,
  isDeadlinePassed,
  fechaBloqueada,
  convenio,
  observacion,
}) => {
  const enProduccion = pedidoExistente?.estado === 'EN_PRODUCCION';
  const bloqueado = isDeadlinePassed || fechaBloqueada || enProduccion;
  return (
    <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden mt-4 grow flex flex-col">
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-[#70a344]" />
          <h3 className="font-black text-xl text-[#1d2d50]">Pedido Listo</h3>
        </div>
        <button
          onClick={manejarEliminar}
          disabled={enProduccion}
          className={`p-2 rounded-xl relative z-10 transition-transform ${enProduccion ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-red-400 bg-red-50 active:scale-90'}`}
        >
          <Trash2 size={20} />
        </button>
      </div>
      
      <div className="space-y-4 mb-6 relative z-10 grow">
        
        {/* Lógica de agrupación de platos por categoría */}
        {(() => {
          const resumenAgrupado = pedidoExistente.resumen.reduce((acc: any, item: any) => {
            const cat = item.categoria === 'JUGO' ? 'BEBESTIBLE' : item.categoria;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
          }, {});

          return Object.entries(resumenAgrupado).map(([categoria, items]: [string, any], idx) => {
            const textosPlatos = items.map((r: any) => {
              let nombreGuarnicion = r.guarnicion || r.guarnicionNombre;
              
              if (!nombreGuarnicion && r.categoria === 'FONDO' && r.guarnicionId && r.guarnicionId !== -1) {
                const platoFondo = menuHoy.fondos?.find((f: any) => f.id === r.platoId);
                const guarnicionObj = platoFondo?.guarniciones?.find((g: any) => g.id === r.guarnicionId);
                if (guarnicionObj) nombreGuarnicion = guarnicionObj.nombre;
              }

              let nombrePlato = r.nombre;

              // 🔥 VALIDACIÓN NIVEL DIOS: Lógica deductiva pura
              const fondoItem = pedidoExistente.resumen.find((i: any) => i.categoria === 'FONDO');
              const platoFondoObj = menuHoy?.fondos?.find((f: any) => f.id === fondoItem?.platoId);
              const esFondoHipo = platoFondoObj?.tipo === 'HIPOCALORICO';
              const tieneEntrada = pedidoExistente.resumen.some((i: any) => i.categoria === 'ENTRADA');
              
              // Si es hipocalórico y no pidió entrada, sabemos que es doble postre sí o sí.
              const deduccionDoblePostre = esFondoHipo && !tieneEntrada;

              const esDoblePostre = 
                r.cantidad == 2 || 
                pedidoExistente?.isDoblePostre === true ||
                pedidoExistente?.doblePostre === true ||
                deduccionDoblePostre;

              if (r.categoria === 'POSTRE' && esDoblePostre) {
                nombrePlato += ' x2';
              }

              return nombreGuarnicion ? `${nombrePlato} + ${nombreGuarnicion}` : nombrePlato;
            });

            const textoFinalCategoria = textosPlatos.join(' + ');

            return (
              <div key={idx} className="flex flex-col mb-4 last:mb-0">
                <span className="text-xs font-black text-[#70a344] uppercase tracking-widest mb-0.5">
                  {categoria}
                </span>
                <span className="font-bold text-[#1d2d50] leading-tight text-lg">
                  {textoFinalCategoria}
                </span>
              </div>
            );
          });
        })()}

        {convenio?.permitePan && (
          <div className="flex flex-col mt-2 pt-4 border-t border-dashed border-gray-200">
            <span className="text-xs font-black text-[#70a344] uppercase tracking-widest mb-0.5">INCLUIDO POR CONVENIO</span>
            <div className="font-bold text-[#1d2d50] leading-tight flex items-center gap-2 mt-0.5 text-lg">
              Pan
            </div>
          </div>
        )}

        {observacion && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">
              Observaciones
            </span>
            <p className="text-sm font-medium text-[#1d2d50] leading-snug">
              {observacion}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onModificar}
        disabled={bloqueado}
        className={`w-full py-4 rounded-xl font-black text-center transition-all relative z-10 mt-auto ${bloqueado ? 'bg-gray-100 text-gray-400' : 'bg-[#70a344] text-white shadow-md active:scale-95'}`}
      >
        {enProduccion ? 'Pedido en producción' : bloqueado ? 'Modificación cerrada' : 'Modificar pedido'}
      </button>
    </div>
  );
};