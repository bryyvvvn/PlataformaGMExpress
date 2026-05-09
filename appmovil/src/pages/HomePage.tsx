import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Menu, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../constants/theme';
import { useUser } from '@clerk/clerk-react';
import { TarjetaPlato } from '../components/TarjetaPlato';
import { useCountdown } from '../hooks/useCountdown';
import { useMenuAPI } from '../hooks/useMenuAPI';
import { usePedidos } from '../hooks/usePedidos';
import { useCalendario } from '../hooks/useCalendario';
import { Sidebar } from '../components/Sidebar';

type Categoria = 'ENTRADA' | 'FONDO' | 'POSTRE' | null;

const HomePage: React.FC = () => {
  const { user } = useUser();
  const nombreUsuario = user?.firstName || user?.username || 'Usuario';

  const { 
    setSemanaOffset, 
    fechaTexto, 
    diasSemanaArray, 
    getSemanaTexto 
  } = useCalendario();

  const [pedido, setPedido] = useState({
    entradaId: null as number | null,
    fondoId: null as number | null,
    postreId: null as number | null,
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Estado inicial en null para que nada fuerce la apertura al cargar
  const [seccionAbierta, setSeccionAbierta] = useState<Categoria>(null);

  const { timeRemaining, isDeadlinePassed } = useCountdown(DEADLINE_HOUR);
  const { menuHoy, cargando: cargandoMenu } = useMenuAPI();
  const { yaPedioHoy, cargandoVerificacion, enviarPedido, enviando } = usePedidos(user?.id);

  // EFECTO: Controla la apertura automática de secciones
  useEffect(() => {
    if (!cargandoMenu && !yaPedioHoy && !isDeadlinePassed) {
      // Solo abrimos 'ENTRADA' si el usuario realmente puede pedir
      setSeccionAbierta('ENTRADA');
    } else {
      // Si ya pidió o cerró el horario, todo colapsado
      setSeccionAbierta(null);
    }
  }, [cargandoMenu, yaPedioHoy, isDeadlinePassed]);

  const toggleSeccion = (cat: Categoria) => {
    setSeccionAbierta(seccionAbierta === cat ? null : cat);
  };

  const manejarEnvio = async () => {
    const exito = await enviarPedido(pedido);
    if (exito) {
      setSeccionAbierta(null); // Cerramos todo al confirmar con éxito
    }
  };

  const seleccionarPlato = (categoria: 'entradaId' | 'fondoId' | 'postreId', id: number) => {
    if (yaPedioHoy || isDeadlinePassed) return;
    setPedido(prev => ({ ...prev, [categoria]: prev[categoria] === id ? null : id }));
    
    // Auto-navegación simple entre categorías
    if (categoria === 'entradaId') setTimeout(() => setSeccionAbierta('FONDO'), 400);
    if (categoria === 'fondoId') setTimeout(() => setSeccionAbierta('POSTRE'), 400);
  };

  const estaCompleto = pedido.entradaId && pedido.fondoId && pedido.postreId;

  if (cargandoVerificacion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-[#70a344] rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest text-center">Verificando...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-40" 
      style={{ backgroundColor: THEME.colors.background }}
      onClick={() => setSeccionAbierta(null)}
    >
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* HEADER */}
      <div className="pt-5 pb-3 flex justify-between items-center px-6" style={{ backgroundColor: THEME.colors.secondary }} onClick={(e) => e.stopPropagation()}>
        <h1 className="text-[24px] font-black italic tracking-tighter text-white m-0 leading-none">
          GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span>
        </h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white active:scale-90 transition-transform">
          <Menu size={24} />
        </button>
      </div>

      <div className="h-1 w-full" style={{ backgroundColor: THEME.colors.primary }} />

      {/* SALUDO Y FECHA */}
      <div className="px-6 pt-7 pb-10 text-white rounded-b-[40px] shadow-lg" style={{ backgroundColor: THEME.colors.secondary }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold opacity-95 leading-none">Hola, {nombreUsuario}</h2>
        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest">{fechaTexto}</p>
      </div>

      {/* TIMER CARD */}
      <div className="mx-6 -mt-8 p-5 rounded-3xl shadow-2xl bg-white border-b-4 transition-all"
        style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDeadlinePassed ? 'bg-red-50' : 'bg-green-50'}`}>
            <Clock size={24} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Límite para pedir</p>
            <p className="text-2xl font-black tracking-tight leading-none" style={{ color: THEME.colors.secondary }}>
              {isDeadlinePassed ? "CERRADO" : timeRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN DE SEMANAS - FLECHAS EN LATERALES */}
      <div className="mt-10 px-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setSemanaOffset(prev => prev - 1)}
            className="p-2 bg-white rounded-xl shadow-sm text-[#1d2d50] active:scale-90 transition-transform border border-gray-50"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1d2d50] opacity-60">
            {getSemanaTexto()}
          </span>

          <button 
            onClick={() => setSemanaOffset(prev => prev + 1)}
            className="p-2 bg-white rounded-xl shadow-sm text-[#1d2d50] active:scale-90 transition-transform border border-gray-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* CALENDARIO DE DÍAS */}
        <div className="flex justify-between items-center">
          {diasSemanaArray.map((dia, index) => (
            <div key={index} className={`flex flex-col items-center justify-center w-[17%] aspect-square rounded-[20px] bg-white transition-all ${dia.esHoy ? 'border-2 scale-110 shadow-md' : 'opacity-40'}`}
              style={dia.esHoy ? { borderColor: THEME.colors.primary } : {}}>
              <span className="text-[10px] font-black mb-1 text-gray-400 uppercase">{dia.letra}</span>
              <span className="text-lg font-black text-[#1d2d50]">{dia.numero}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LISTADO DE PLATOS */}
      {/* Agregamos 'pointer-events-none' para que no se pueda hacer click en nada si está bloqueado */}
      <div className={`mt-10 px-6 space-y-4 ${yaPedioHoy || isDeadlinePassed ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        {!cargandoMenu ? (
          (['ENTRADA', 'FONDO', 'POSTRE'] as const).map((cat) => {
            const key = cat.toLowerCase() === 'entrada' ? 'entradas' : cat.toLowerCase() === 'fondo' ? 'fondos' : 'postres';
            const stateKey = (cat.toLowerCase() + 'Id') as 'entradaId' | 'fondoId' | 'postreId';
            const isOpen = seccionAbierta === cat;
            const isSelected = pedido[stateKey] !== null;
            
            return (
              <section key={cat} className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm transition-all">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSeccion(cat);
                  }} 
                  className="w-full flex items-center justify-between p-5"
                >
                  <div className="flex items-center gap-3">
                    {/* Si está bloqueado, el texto también se verá gris suave */}
                    <h3 className={`font-black text-lg tracking-tight uppercase ${isOpen || isSelected ? 'text-[#1d2d50]' : 'text-gray-400'}`}>
                      {cat}
                    </h3>
                    {isSelected && <CheckCircle2 size={18} className="text-green-500" />}
                  </div>
                  {isOpen ? <ChevronUp size={20} className="text-gray-300" /> : <ChevronDown size={20} className="text-gray-300" />}
                </button>

                <div className={`flex flex-col gap-4 px-4 pb-5 transition-all duration-500 ${isOpen ? 'max-h-[1000px] opacity-100 visible' : 'max-h-0 opacity-0 invisible overflow-hidden'}`}>
                  {menuHoy[key].map((plato: any) => (
                    <TarjetaPlato 
                      key={plato.id} 
                      plato={plato} 
                      categoriaKey={stateKey} 
                      isSelected={pedido[stateKey] === plato.id} 
                      // Esta prop en TarjetaPlato debe manejar el estado visual interno también
                      isDeadlinePassed={isDeadlinePassed || yaPedioHoy} 
                      onSelect={seleccionarPlato} 
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className="py-20 flex flex-col items-center opacity-20">
            <Menu size={40} className="mb-2" />
            <p className="font-black text-[10px] uppercase tracking-widest">Sin menú disponible</p>
          </div>
        )}
      </div>

      {/* BOTÓN FLOTANTE */}
      {!yaPedioHoy && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={manejarEnvio} 
            disabled={!estaCompleto || isDeadlinePassed || enviando} 
            className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 ${estaCompleto && !isDeadlinePassed ? 'text-white shadow-2xl' : 'bg-gray-100 text-gray-400'}`} 
            style={estaCompleto && !isDeadlinePassed ? { backgroundColor: THEME.colors.primary } : {}}
          >
            {enviando ? 'Enviando...' : isDeadlinePassed ? 'Horario Finalizado' : estaCompleto ? 'Confirmar Pedido' : 'Faltan opciones'}
          </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;