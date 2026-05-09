import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Menu, Utensils } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../constants/theme';
import { useUser } from '@clerk/clerk-react';
import { TarjetaPlato } from '../components/TarjetaPlato';
import { useCountdown } from '../hooks/useCountdown';
import { useMenuAPI } from '../hooks/useMenuAPI';
import { usePedidos } from '../hooks/usePedidos';
import { Sidebar } from '../components/Sidebar';

const HomePage: React.FC = () => {
  const { user } = useUser();
  const nombreUsuario = user?.firstName || user?.username || 'Usuario';

  const [pedido, setPedido] = useState({
    entradaId: null as number | null,
    fondoId: null as number | null,
    postreId: null as number | null,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { timeRemaining, isDeadlinePassed } = useCountdown(DEADLINE_HOUR);
  const { menuHoy, cargando: cargandoMenu } = useMenuAPI();
  const { yaPedioHoy, cargandoVerificacion, enviarPedido, enviando } = usePedidos(user?.id);

  // --- CORRECCIÓN DE FECHA ---
  // Forzamos que 'hoy' siempre se calcule bajo el horario de Chile
  const fechaHoyChile = new Date();
  const fechaTexto = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Santiago'
  }).format(fechaHoyChile);

  const diasSemanaArray = (() => {
    // Obtenemos el número del día (1=Lunes, ..., 7=Domingo)
    const diaActual = fechaHoyChile.getDay() === 0 ? 7 : fechaHoyChile.getDay();
    
    // Calculamos el lunes de esta semana
    const lunes = new Date(fechaHoyChile);
    lunes.setDate(fechaHoyChile.getDate() - (diaActual - 1));
    
    const letras = ['L', 'M', 'M', 'J', 'V'];
    return letras.map((letra, index) => {
      const fechaDia = new Date(lunes);
      fechaDia.setDate(lunes.getDate() + index);
      return { 
        letra, 
        numero: fechaDia.getDate(), 
        // Es hoy si coinciden día y mes (evita problemas de año/hora)
        esHoy: fechaDia.getDate() === fechaHoyChile.getDate() && fechaDia.getMonth() === fechaHoyChile.getMonth()
      };
    });
  })();

  const seleccionarPlato = (categoria: 'entradaId' | 'fondoId' | 'postreId', id: number) => {
    if (yaPedioHoy || isDeadlinePassed) return;
    setPedido(prev => ({ ...prev, [categoria]: prev[categoria] === id ? null : id }));
  };

  const estaCompleto = pedido.entradaId && pedido.fondoId && pedido.postreId;

  const manejarEnvioPedido = async () => {
    if (!estaCompleto || isDeadlinePassed || yaPedioHoy) return;
    const exito = await enviarPedido(pedido);
    if (exito) setPedido({ entradaId: null, fondoId: null, postreId: null });
  };

  if (cargandoVerificacion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-[#70a344] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Verificando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40" style={{ backgroundColor: THEME.colors.background }}>
      <div className="pt-12 pb-6 flex justify-between items-center px-6" style={{ backgroundColor: THEME.colors.secondary }}>
        <h1 className="text-[28px] font-black italic tracking-tighter text-white m-0">GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span></h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-3 text-white"><Menu size={28} /></button>
      </div>
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="h-1.5 w-full" style={{ backgroundColor: THEME.colors.primary }}></div>
      <div className="p-6 pb-16 text-white rounded-b-[40px] shadow-lg" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-2xl font-bold">Hola, {nombreUsuario}</h2>
        <p className="text-sm opacity-70 mt-1 uppercase font-bold tracking-wider">{fechaTexto}</p>
      </div>

      {/* Cronómetro */}
      <div className="mx-6 -mt-10 p-5 rounded-3xl shadow-2xl bg-white border-b-4" style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }}>
        <div className="flex items-center gap-4">
          <Clock size={24} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} />
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Límite para pedir</p>
            <p className="text-2xl font-black">{isDeadlinePassed ? "CERRADO" : timeRemaining}</p>
          </div>
        </div>
      </div>

      {/* Días */}
      <div className="flex justify-between items-center px-6 mt-10">
        {diasSemanaArray.map((dia, i) => (
          <div key={i} className={`flex flex-col items-center justify-center w-[17%] aspect-square rounded-[20px] bg-white ${dia.esHoy ? 'border-2 shadow-md' : 'opacity-40'}`} style={dia.esHoy ? { borderColor: THEME.colors.primary } : {}}>
            <span className="text-[10px] font-black text-gray-400 uppercase">{dia.letra}</span>
            <span className="text-lg font-black text-[#1d2d50]">{dia.numero}</span>
          </div>
        ))}
      </div>

      {yaPedioHoy && (
        <div className="mx-6 mt-10 p-6 rounded-[32px] bg-green-50 border border-green-100 flex flex-col items-center text-center gap-2">
          <CheckCircle2 size={32} className="text-green-500" />
          <h4 className="font-black text-green-900 uppercase">¡Pedido Listo!</h4>
        </div>
      )}

      {/* Menú */}
      <div className={`mt-10 px-6 ${yaPedioHoy ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
        {!cargandoMenu ? (
          <div className="flex flex-col gap-10">
            {(['ENTRADA', 'FONDO', 'POSTRE'] as const).map((cat) => {
              const key = cat.toLowerCase() === 'entrada' ? 'entradas' : cat.toLowerCase() === 'fondo' ? 'fondos' : 'postres';
              const stateKey = (cat.toLowerCase() + 'Id') as 'entradaId' | 'fondoId' | 'postreId';
              return (
                <section key={cat}>
                  <h3 className="font-black text-xl uppercase mb-4" style={{ color: THEME.colors.secondary }}>{cat}</h3>
                  <div className="flex flex-col gap-4">
                    {menuHoy[key].map((plato: any) => (
                      <TarjetaPlato key={plato.id} plato={plato} categoriaKey={stateKey} isSelected={pedido[stateKey] === plato.id} isDeadlinePassed={isDeadlinePassed || yaPedioHoy} onSelect={seleccionarPlato} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : <p className="text-center py-20 text-gray-400">Cargando...</p>}
      </div>

      {/* Botón flotante */}
      {!yaPedioHoy && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl border-t">
          <button onClick={manejarEnvioPedido} disabled={!estaCompleto || isDeadlinePassed || enviando} className={`w-full py-5 rounded-[24px] font-black text-lg ${estaCompleto && !isDeadlinePassed ? 'text-white' : 'bg-gray-100 text-gray-400'}`} style={estaCompleto && !isDeadlinePassed ? { backgroundColor: THEME.colors.primary } : {}}>
            {enviando ? 'Enviando...' : isDeadlinePassed ? 'Horario Finalizado' : estaCompleto ? 'Confirmar Pedido' : 'Selecciona tu menú'}
          </button>
        </div>
      )}
    </div>
  );
}

export default HomePage;