import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../constants/theme';
import { API_BASE_URL } from '../constants/api'; 
import { useUser, UserButton } from '@clerk/clerk-react';

const HomePage: React.FC = () => {
  const { user } = useUser();
  const nombreUsuario = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Usuario';

  const [pedido, setPedido] = useState({
    entradaId: null as number | null,
    fondoId: null as number | null,
    postreId: null as number | null,
  });

  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [menuHoy, setMenuHoy] = useState({ entradas: [], fondos: [], postres: [] });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/menu-semanal`);
        if (respuesta.ok) {
          const datosReales = await respuesta.json();
          setMenuHoy(datosReales);
        }
      } catch (error) {
        console.error("Error API:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarMenu();
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(DEADLINE_HOUR, 0, 0, 0);
      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining('Plazo Cerrado');
        setIsDeadlinePassed(true);
      } else {
        const h = Math.floor((diff / 3_600_000) % 24);
        const m = Math.floor((diff / 60_000) % 60);
        const s = Math.floor((diff / 1_000) % 60);
        setTimeRemaining(`${h}h ${m}s ${s}s`);
        setIsDeadlinePassed(false);
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, []);

  const seleccionarPlato = (categoria: 'entradaId' | 'fondoId' | 'postreId', id: number) => {
    setPedido(prev => ({ ...prev, [categoria]: id }));
  };

  const estaCompleto = pedido.entradaId && pedido.fondoId && pedido.postreId;

  const fechaHoy = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  const TarjetaPlato = ({ plato, categoriaKey }: { plato: any, categoriaKey: 'entradaId' | 'fondoId' | 'postreId' }) => {
    const isSelected = pedido[categoriaKey] === plato.id;
    return (
      <button
        onClick={() => seleccionarPlato(categoriaKey, plato.id)}
        disabled={isDeadlinePassed}
        className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
          isSelected ? 'border-green-500 bg-green-50 shadow-md scale-[1.01]' : 'border-gray-100 bg-white shadow-sm'
        }`}
      >
        <img 
          src={plato.url_imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
          alt={plato.nombre} 
          className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              plato.tipo === 'VEGANO' ? 'bg-green-100 text-green-700' :
              plato.tipo === 'HIPOCALORICO' ? 'bg-blue-100 text-blue-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {plato.tipo}
            </span>
          </div>
          <p className="font-bold text-gray-800 text-sm leading-tight truncate">{plato.nombre}</p>
          {plato.guarnicion && <p className="text-xs text-gray-500 mt-1 truncate">+ {plato.guarnicion}</p>}
        </div>
        <div className="flex-shrink-0 pr-2">
          {isSelected ? <CheckCircle2 size={24} className="text-green-500" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: THEME.colors.background }}>
      
      {/* HEADER ÚNICO: LOGO Y PERFIL ALINEADOS */}
      <div className="pt-10 pb-4 flex justify-between items-center px-6" style={{ backgroundColor: THEME.colors.secondary }}>
        <h1 className="text-[26px] font-black italic tracking-tighter text-white m-0 p-0 leading-none">
          GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span>
        </h1>
        <div className="flex items-center justify-center h-full">
           <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="h-1.5 w-full" style={{ backgroundColor: THEME.colors.primary }}></div>

      <div className="p-6 pb-12 text-white rounded-b-4xl shadow-md" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-xl font-bold opacity-90 capitalize">Bienvenido, {nombreUsuario.toLowerCase()}</h2>
        <p className="text-sm opacity-70 mt-1 uppercase font-medium">{fechaHoy}</p>
      </div>

      <div className="mx-6 -mt-6 p-4 rounded-2xl shadow-xl bg-white border-b-4"
        style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDeadlinePassed ? 'bg-red-50' : 'bg-green-50'}`}>
            <Clock size={20} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Tiempo para pedir</p>
            <p className="text-xl font-black tracking-tight" style={{ color: THEME.colors.secondary }}>{timeRemaining}</p>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center mt-20 animate-pulse">
          <p className="text-gray-500 font-bold">Cargando menú...</p>
        </div>
      ) : isDeadlinePassed ? (
        <div className="mx-6 mt-16 p-8 rounded-3xl bg-red-50 flex flex-col items-center justify-center text-center border-2 border-red-100 shadow-sm">
          <Clock size={40} className="text-red-500 mb-4" />
          <h3 className="font-black text-2xl text-red-700 mb-2">¡Plazo Cerrado!</h3>
          <p className="text-red-600/80 font-medium">Ya pasó la hora límite para pedir. Te esperamos mañana.</p>
        </div>
      ) : (
        <>
          <section className="mt-10 px-6">
            <h3 className="font-black text-lg mb-3" style={{ color: THEME.colors.secondary }}>Entrada</h3>
            <div className="flex flex-col gap-3">
              {menuHoy.entradas.map((plato: any) => <TarjetaPlato key={plato.id} plato={plato} categoriaKey="entradaId" />)}
            </div>
          </section>

          <section className="mt-8 px-6">
            <h3 className="font-black text-lg mb-3" style={{ color: THEME.colors.secondary }}>Plato de Fondo</h3>
            <div className="flex flex-col gap-3">
              {menuHoy.fondos.map((plato: any) => <TarjetaPlato key={plato.id} plato={plato} categoriaKey="fondoId" />)}
            </div>
          </section>

          <section className="mt-8 px-6">
            <h3 className="font-black text-lg mb-3" style={{ color: THEME.colors.secondary }}>Postre</h3>
            <div className="flex flex-col gap-3">
              {menuHoy.postres.map((plato: any) => <TarjetaPlato key={plato.id} plato={plato} categoriaKey="postreId" />)}
            </div>
          </section>
        </>
      )}

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100">
        <button
          disabled={!estaCompleto || isDeadlinePassed}
          className={`w-full py-4 rounded-2xl font-black text-lg ${
            estaCompleto && !isDeadlinePassed ? 'text-white shadow-lg' : 'bg-gray-200 text-gray-400'
          }`}
          style={estaCompleto && !isDeadlinePassed ? { backgroundColor: THEME.colors.primary } : {}}
        >
          {isDeadlinePassed ? 'Plazo cerrado' : estaCompleto ? 'Realizar Pedido' : 'Selecciona las 3 opciones'}
        </button>
      </div>
    </div>
  );
}

export default HomePage;