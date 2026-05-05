import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';
import { useUser } from '@clerk/clerk-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Plato {
  id: number;
  nombre: string;
  url_imagen: string | null;
  categoria: string;
}

interface MenuDetalle {
  id: number;
  dia_semana: string;
  variante: string;
  plato: Plato;
}

interface MenuSemanal {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  detalles: MenuDetalle[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORDEN_DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const DIAS_ABREV = ['L', 'M', 'M', 'J', 'V'];

const normalize = (s: string) =>
  s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function ordenarDetalles(detalles: MenuDetalle[]): (MenuDetalle | null)[] {
  return ORDEN_DIAS.map((dia) =>
    detalles.find((d) => normalize(d.dia_semana) === dia) ?? null
  );
}

function numerosDelMes(fechaInicio: string): number[] {
  const base = new Date(fechaInicio);
  return ORDEN_DIAS.map((_, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    return d.getUTCDate();
  });
}

function labelDia(fechaInicio: string, index: number): string {
  const base = new Date(fechaInicio);
  const d = new Date(base);
  d.setUTCDate(base.getUTCDate() + index);
  return d.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

const HomePage: React.FC = () => {
  const { user } = useUser();

  const [timeRemaining, setTimeRemaining]       = useState('');
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const [weeklyMenu, setWeeklyMenu] = useState<MenuSemanal | null>(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMenu = async () => {
      const url = `${API_BASE_URL}/api/menu-semanal`;
      console.log('[HomePage] Fetching:', url);
      
      try {
        const res = await fetch(url);
        console.log('[HomePage] Status:', res.status);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        console.log('[HomePage] Detalles recibidos:', data?.detalles?.length ?? 0);

        if (!data) throw new Error('Respuesta vacía');

        setWeeklyMenu(Array.isArray(data) ? data[0] ?? null : data);
      } catch (err) {
        console.error('[HomePage] Error al cargar menú:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
      
    };
    fetchMenu();
  }, []);

  // ── Countdown ─────────────────────────────────────────────────────────────
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

  // ── Datos derivados ───────────────────────────────────────────────────────
  const detallesOrdenados = weeklyMenu ? ordenarDetalles(weeklyMenu.detalles) : [];
  const currentDetail     = detallesOrdenados[selectedDayIndex] ?? null;
  const platoReal         = currentDetail?.plato ?? null;
  const numDias           = weeklyMenu ? numerosDelMes(weeklyMenu.fecha_inicio) : [4, 5, 6, 7, 8];
  const diaLabel          = weeklyMenu ? labelDia(weeklyMenu.fecha_inicio, selectedDayIndex) : '';

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: THEME.colors.background }}>
        <p className="font-bold text-gray-400 animate-pulse">Sincronizando con Neon...</p>
      </div>
    );
  }

  if (fetchError || !weeklyMenu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-2"
        style={{ backgroundColor: THEME.colors.background }}>
        <p className="font-bold text-red-400 text-lg">Sin menú disponible</p>
        <p className="text-gray-400 text-sm text-center">
          No se encontró un menú activo. Contacta al administrador.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: THEME.colors.background }}>

      {/* Header */}
      <div className="p-6 text-white rounded-b-4xl shadow-lg"
        style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-lg font-bold opacity-90 tracking-tight">
          Bienvenido, {user?.firstName || 'Usuario'}
        </h2>
      </div>

      {/* Countdown */}
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

      {/* Selector de días */}
      <section className="mt-8 px-6">
        <div className="flex justify-between gap-2">
          {DIAS_ABREV.map((abrev, index) => {
            const isSelected   = selectedDayIndex === index;
            const tieneDetalle = detallesOrdenados[index] !== null;
            return (
              <button
                key={index}
                onClick={() => setSelectedDayIndex(index)}
                disabled={!tieneDetalle}
                className="flex-1 flex flex-col items-center p-3 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-30"
                style={{
                  borderColor:     isSelected ? THEME.colors.primary : 'transparent',
                  backgroundColor: isSelected ? `${THEME.colors.primary}15` : 'white',
                }}
              >
                <span className="text-[10px] font-bold text-gray-500">{abrev}</span>
                <span className="text-lg font-black"
                  style={{ color: isSelected ? THEME.colors.secondary : '#9CA3AF' }}>
                  {numDias[index]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Card del plato */}
      <section className="mt-6 px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Imagen */}
          <div className="h-48 w-full relative overflow-hidden bg-gray-100">
            <img
              key={`${selectedDayIndex}-${platoReal?.id ?? 'empty'}`}
              src={platoReal?.url_imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
              alt={platoReal?.nombre || 'Plato del día'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
              }}
            />
            {currentDetail?.variante && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                <span className="text-[10px] font-bold" style={{ color: THEME.colors.secondary }}>
                  {currentDetail.variante}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5">
            <p className="text-[10px] font-black uppercase" style={{ color: THEME.colors.primary }}>
              {currentDetail?.dia_semana ?? ORDEN_DIAS[selectedDayIndex]}
            </p>
            <h3 className="text-xl font-black leading-tight uppercase"
              style={{ color: THEME.colors.secondary }}>
              {platoReal?.nombre ?? 'Sin plato para este día'}
            </h3>
          </div>
        </div>

        {/* Banner */}
        <div className="mt-4 p-4 rounded-2xl flex items-center gap-3 bg-blue-50 text-blue-800">
          <AlertCircle size={16} />
          <p className="text-[10px] font-medium uppercase tracking-tight">
            Sincronizado con Neon para {diaLabel}.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;