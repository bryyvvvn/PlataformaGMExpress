import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../constants/theme';
import { API_BASE_URL } from '../constants/api'; 
import { useUser } from '@clerk/clerk-react';

const HomePage: React.FC = () => {
  const { user } = useUser();
  const nombreUsuario = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Usuario';

  // --- ESTADOS ---
  const [pedido, setPedido] = useState({
    entradaId: null as number | null,
    fondoId: null as number | null,
    postreId: null as number | null,
  });

  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  
  // Estados para la API
  const [menuHoy, setMenuHoy] = useState({ entradas: [], fondos: [], postres: [] });
  const [cargando, setCargando] = useState(true);

  // --- TRAER DATOS REALES DE LA BD ---
  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const urlCompleta = `${API_BASE_URL}/api/menu-semanal`;
        console.log("Llamando a la API en:", urlCompleta);

        const respuesta = await fetch(urlCompleta);
        
        if (respuesta.ok) {
          const datosReales = await respuesta.json();
          console.log("✅ Datos que llegaron al celular:", datosReales); 
          setMenuHoy(datosReales);
        } else {
          console.error("❌ Error del servidor:", respuesta.status);
        }
      } catch (error) {
        console.error("❌ Error al conectar con la API:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarMenu();
  }, []);

  // --- COUNTDOWN ---
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
        setTimeRemaining(`${h}h ${m}m ${s}s`);
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

  const manejarEnvioPedido = () => {
    if (!estaCompleto) return;
    console.log("Enviando pedido a Neon:", pedido);
    alert("¡Pedido guardado con éxito!");
  };

  // --- COMPONENTE DE TARJETA ---
  const TarjetaPlato = ({ plato, categoriaKey }: { plato: any, categoriaKey: 'entradaId' | 'fondoId' | 'postreId' }) => {
    const isSelected = pedido[categoriaKey] === plato.id;
    return (
      <button
        onClick={() => seleccionarPlato(categoriaKey, plato.id)}
        disabled={isDeadlinePassed}
        className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
          isSelected 
            ? 'border-green-500 bg-green-50 shadow-md scale-[1.01]' 
            : 'border-gray-100 bg-white shadow-sm'
        }`}
      >
        <img 
          src={plato.url_imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
          alt={plato.nombre} 
          className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0 shadow-sm"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              plato.tipo === 'VEGANO' ? 'bg-green-100 text-green-700' :
              plato.tipo === 'HIPOCALORICO' ? 'bg-blue-100 text-blue-700' :
              plato.tipo === 'NORMAL' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {plato.tipo}
            </span>
          </div>
          <p className="font-bold text-gray-800 text-sm leading-tight truncate">{plato.nombre}</p>
          {plato.guarnicion && <p className="text-xs text-gray-500 mt-1 truncate">+ {plato.guarnicion}</p>}
        </div>
        <div className="flex-shrink-0 pr-2">
          {isSelected ? (
            <CheckCircle2 size={24} className="text-green-500" />
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: THEME.colors.background }}>
      
      {/* HEADER */}
      <div className="p-6 text-white rounded-b-4xl shadow-md" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-xl font-bold opacity-90">Bienvenido, {nombreUsuario}</h2>
        <p className="text-sm opacity-70 mt-1 uppercase">Lunes, 6 de Abril</p>
      </div>

      {/* COUNTDOWN */}
      <div className="mx-6 -mt-5 p-4 rounded-2xl shadow-xl bg-white border-b-4"
        style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDeadlinePassed ? 'bg-red-50' : 'bg-green-50'}`}>
            <Clock size={20} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
              Tiempo para pedir
            </p>
            <p className="text-xl font-black tracking-tight" style={{ color: THEME.colors.secondary }}>
              {timeRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* RENDERIZADO DEL MENÚ, ESTADO DE CARGA O AVISO DE PLAZO CERRADO */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold mt-4">Cargando menú de hoy...</p>
        </div>
      ) : isDeadlinePassed ? (
        <div className="mx-6 mt-16 p-8 rounded-3xl bg-red-50 flex flex-col items-center justify-center text-center border-2 border-red-100 shadow-sm">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Clock size={40} className="text-red-500" />
          </div>
          <h3 className="font-black text-2xl text-red-700 mb-2">¡Se acabó el tiempo!</h3>
          <p className="text-red-600/80 font-medium leading-snug">
            El horario para realizar pedidos ha finalizado por hoy. Te esperamos mañana temprano para armar tu menú.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-8 px-6">
            <h3 className="font-black text-lg mb-3" style={{ color: THEME.colors.secondary }}>Entrada</h3>
            <div className="flex flex-col gap-3">
              {menuHoy.entradas.map((plato: any) => (
                <TarjetaPlato key={plato.id} plato={plato} categoriaKey="entradaId" />
              ))}
            </div>
          </section>

          <section className="mt-8 px-6">
            <h3 className="font-black text-lg mb-3" style={{ color: THEME.colors.secondary }}>Plato de Fondo</h3>
            <div className="flex flex-col gap-3">
              {menuHoy.fondos.map((plato: any) => (
                <TarjetaPlato key={plato.id} plato={plato} categoriaKey="fondoId" />
              ))}
            </div>
          </section>

          <section className="mt-8 px-6">
            <h3 className="font-black text-lg mb-3" style={{ color: THEME.colors.secondary }}>Postre</h3>
            <div className="flex flex-col gap-3">
              {menuHoy.postres.map((plato: any) => (
                <TarjetaPlato key={plato.id} plato={plato} categoriaKey="postreId" />
              ))}
            </div>
          </section>
        </>
      )}

      {/* BOTÓN FLOTANTE */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={manejarEnvioPedido}
          disabled={!estaCompleto || isDeadlinePassed || cargando}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all ${
            estaCompleto && !isDeadlinePassed
              ? 'bg-green-500 text-white shadow-lg active:scale-95 cursor-pointer' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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