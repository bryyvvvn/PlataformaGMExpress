import React, { useState, useEffect } from 'react';
import { ArrowLeft, CalendarOff, Loader2, UserPlus, Search, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePerfil } from '../../hooks/usePerfil';
import { useTrabajadores } from '../../hooks/useTrabajadores';
import { useClerkToken } from '../../hooks/useClerkToken';

// NUEVOS HOOKS
import { useVincularTrabajador } from '../../hooks/useVincularTrabajador';
import { useBloqueoDias } from '../../hooks/useBloqueoDias';

// --- Componente TarjetaTrabajadorListado ---
const normalizarDiasBloqueados = (dias: unknown) => {
  if (!Array.isArray(dias)) return [];
  return Array.from(
    new Set(
      dias
        .map(Number)
        .filter((dia) => Number.isInteger(dia) && dia >= 1 && dia <= 7)
    )
  ).sort((a, b) => a - b);
};

const TarjetaTrabajadorListado = ({
  t,
  token,
  trabajaFinDeSemana,
}: {
  t: any;
  token?: string | null;
  trabajaFinDeSemana?: boolean;
}) => {
  const [diasBloqueados, setDiasBloqueados] = useState<number[]>(normalizarDiasBloqueados(t.diasBloqueados));
  const { toggleDiaBloqueado, loadingDia } = useBloqueoDias(token);

  useEffect(() => {
    setDiasBloqueados(normalizarDiasBloqueados(t.diasBloqueados));
  }, [t.diasBloqueados]);

  const DIAS_BASE = [
    { num: 1, letra: 'L' }, { num: 2, letra: 'M' }, 
    { num: 3, letra: 'M' }, { num: 4, letra: 'J' }, { num: 5, letra: 'V' }
  ];
  const DIAS = trabajaFinDeSemana
    ? [...DIAS_BASE, { num: 6, letra: 'S' }, { num: 7, letra: 'D' }]
    : DIAS_BASE;

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4 transition-all mb-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-[#70a344] font-black text-lg shadow-inner shrink-0">
          {t.nombre ? t.nombre.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-sm font-bold text-[#1d2d50] capitalize truncate">{t.nombre?.toLowerCase()}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Activo
            </span>
            {t.rut && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.rut}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <CalendarOff size={20} /> Bloqueo de días
          </span>
        </div>
        <div className="flex gap-2">
          {DIAS.map(dia => {
            const isBlocked = diasBloqueados.includes(dia.num);
            const isLoad = loadingDia === dia.num;
            return (
              <button
                key={dia.num}
                onClick={() => toggleDiaBloqueado(t.id, dia.num, setDiasBloqueados)}
                disabled={isLoad}
                className={`flex-1 aspect-square rounded-2xl flex items-center justify-center font-black text-sm transition-all border active:scale-95 disabled:opacity-70 ${
                  isBlocked 
                    ? 'bg-red-50 border-red-200 text-red-500 shadow-inner' 
                    : 'bg-green-50 border-green-100 text-[#70a344] hover:bg-green-100'
                }`}
              >
                {isLoad ? <Loader2 size={16} className="animate-spin" /> : dia.letra}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal ---
const Trabajadores: React.FC = () => {
  const navigate = useNavigate();
  const { token: clerkToken } = useClerkToken();
  const { empresaId, empresaNombre, convenio } = usePerfil();
  const trabajaFinDeSemana = Boolean(convenio?.trabajaFinDeSemana);
  const { trabajadores, cargando } = useTrabajadores(empresaId, undefined, clerkToken);

  // Hook personalizado de vinculación
  const {
    buscando, vinculando, trabajadorEncontrado, errorBusqueda,
    buscarTrabajador, vincularTrabajador, limpiarBusqueda
  } = useVincularTrabajador(clerkToken);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rutBusqueda, setRutBusqueda] = useState('');
  
  // 🔥 NUEVO ESTADO PARA EL FILTRO DE BÚSQUEDA
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const manejarCambioRut = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (valor.length > 1) {
      const cuerpo = valor.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const dv = valor.slice(-1);
      valor = `${cuerpo}-${dv}`;
    }
    setRutBusqueda(valor);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setRutBusqueda('');
    limpiarBusqueda();
  };


  // 🔥 LÓGICA DE FILTRADO (POR NOMBRE O RUT MEJORADO)
  const trabajadoresFiltrados = trabajadores.filter((t: any) => {
    const terminoBusqueda = filtroBusqueda.toLowerCase().trim();
    if (!terminoBusqueda) return true;
    
    // Búsqueda por nombre
    const coincideNombre = t.nombre?.toLowerCase().includes(terminoBusqueda);
    
    // Búsqueda por RUT (Limpiando puntos y guiones)
    const rutBDLimpio = t.rut?.replace(/[\.\-]/g, '').toLowerCase() || '';
    const busquedaLimpia = terminoBusqueda.replace(/[\.\-]/g, '');
    
    // Coincide si lo busca con formato (12.314...) o sin formato (12314...)
    const coincideRut = t.rut?.toLowerCase().includes(terminoBusqueda) || (busquedaLimpia.length > 0 && rutBDLimpio.includes(busquedaLimpia));
    
    return coincideNombre || coincideRut;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in duration-500 relative">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 px-6 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-[#1d2d50]">Trabajadores</h1>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{empresaNombre}</span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-3 bg-[#70a344] text-white rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          <UserPlus size={20} />
        </button>
      </header>

      <main className="flex-1 p-6 pb-20">
        {(cargando || !empresaId) ? (
          <div className="space-y-4 max-w-md mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-[2rem] border border-gray-100 p-5 flex flex-col gap-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-1 bg-gray-100 w-full" />
                <div className="flex gap-2 h-10">
                  {[1, 2, 3, 4, 5].map(j => <div key={j} className="flex-1 bg-gray-200 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto">
            
            {/* 🔥 BARRA DE BÚSQUEDA */}
            {trabajadores.length > 0 && (
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre o RUT..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-100 shadow-sm rounded-2xl text-sm font-bold text-[#1d2d50] focus:outline-none focus:border-[#70a344] focus:ring-1 focus:ring-[#70a344] transition-all placeholder:text-gray-300 placeholder:font-medium"
                />
                {filtroBusqueda && (
                  <button
                    onClick={() => setFiltroBusqueda('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center active:scale-90 transition-transform"
                  >
                    <X size={16} className="text-gray-400 hover:text-[#1d2d50]" />
                  </button>
                )}
              </div>
            )}

            {/* LISTA DE TRABAJADORES (FILTRADOS) */}
            {trabajadoresFiltrados.length > 0 ? (
              trabajadoresFiltrados.map((t) => (
                <TarjetaTrabajadorListado
                  key={t.id}
                  t={t}
                  token={clerkToken}
                  trabajaFinDeSemana={trabajaFinDeSemana}
                />
              ))
            ) : trabajadores.length > 0 ? (
              <div className="text-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mt-4">
                <p className="text-[#1d2d50] font-black text-lg mb-1">Sin resultados</p>
                <p className="text-gray-400 text-sm font-medium">
                  No se encontró ningún trabajador con "{filtroBusqueda}"
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-400 mt-10 text-sm font-medium">
                No hay trabajadores registrados en esta empresa.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Agregar Trabajador */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1d2d50]/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={cerrarModal}
              className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 rounded-full active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>
            
            <h3 className="font-black text-xl text-[#1d2d50] mb-1">Añadir Trabajador</h3>
            <p className="text-xs text-gray-400 font-medium mb-6">Busca al trabajador por su RUT para vincularlo a tu empresa.</p>

            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                placeholder="12.345.678-9"
                value={rutBusqueda}
                onChange={manejarCambioRut}
                maxLength={12}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 font-bold text-[#1d2d50] focus:outline-none focus:border-[#70a344]"
              />
              <button 
                onClick={() => buscarTrabajador(rutBusqueda)}
                disabled={buscando || rutBusqueda.length < 8}
                className="bg-[#1d2d50] text-white p-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
              >
                {buscando ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              </button>
            </div>

            {errorBusqueda && (
              <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100 mb-4 text-center">
                {errorBusqueda}
              </div>
            )}

            {trabajadorEncontrado && (
              <div className="p-4 border border-green-200 bg-green-50 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-sm text-[#1d2d50] capitalize truncate">{trabajadorEncontrado.nombre?.toLowerCase()}</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{trabajadorEncontrado.rut}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => vincularTrabajador(trabajadorEncontrado.id, empresaId!, () => {
                    cerrarModal();
                    window.location.reload();
                  })}
                  disabled={vinculando}
                  className="w-full py-3 bg-[#70a344] text-white rounded-xl font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {vinculando ? <Loader2 size={18} className="animate-spin" /> : 'Vincular a mi empresa'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Trabajadores;
