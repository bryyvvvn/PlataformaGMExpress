import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, CheckCircle2, Menu, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../constants/theme';
import { useUser } from '@clerk/clerk-react';
import { TarjetaPlato } from '../components/TarjetaPlato';
import { BottomSheet } from '../components/BottomSheet';
import { useCountdown } from '../hooks/useCountdown';
import { useMenuAPI } from '../hooks/useMenuAPI';
import { usePedidos } from '../hooks/usePedidos';
import { useCalendario } from '../hooks/useCalendario';
import { useHistorial } from '../hooks/useHistorial';
import { Sidebar } from '../components/Sidebar';
import { API_BASE_URL } from '../constants/api';
 
type Categoria = 'ENTRADA' | 'FONDO' | 'POSTRE' | null;
type TipoMenu = 'MENU_DIA' | 'PERSONALIZADO' | 'OTRO';
 
const HomePageTrabajador: React.FC = () => {
  const { user } = useUser();
  const nombreUsuario = user?.firstName || user?.username || 'Usuario';
 
  // ── 1. GESTIÓN DE CALENDARIO ──────────────────────────────────────────────
  const {
    setSemanaOffset,
    fechaTexto,
    diasSemanaArray,
    getSemanaTexto,
    diaSeleccionadoIdx,
    setDiaSeleccionadoIdx,
    fechaSeleccionadaISO,
  } = useCalendario();
 
  // ── 2. ESTADOS LOCALES (PEDIDO Y UI) ──────────────────────────────────────
  const [pedido, setPedido] = useState({
    entradaId:    null as number | null,
    fondoId:      null as number | null,
    postreId:     null as number | null,
    guarnicionId: null as number | null,
  });
 
  const [activeTab,               setActiveTab]               = useState<TipoMenu>('MENU_DIA');
  const [sheetOpen,               setSheetOpen]               = useState(false);
  const [sheetFondo,              setSheetFondo]              = useState<any | null>(null);
  const [sheetSelectedGuarnicion, setSheetSelectedGuarnicion] = useState<number | null>(null);
 
  const [isMenuOpen,     setIsMenuOpen]     = useState(false);
  const [seccionAbierta, setSeccionAbierta] = useState<Categoria>(null);
  const [modoEdicion,    setModoEdicion]    = useState(false);
  const [eliminando,     setEliminando]     = useState(false);
 
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ── 3. HOOKS DE DATOS Y API ───────────────────────────────────────────────
  const { timeRemaining } = useCountdown(DEADLINE_HOUR);
  const { menuHoy, cargando: cargandoMenu } = useMenuAPI(fechaSeleccionadaISO);
  const {
    pedidoExistente,
    cargandoVerificacion,
    enviarPedido,
    enviando,
    refrescarVerificacion
  } = usePedidos(user?.id, fechaSeleccionadaISO);

  const { historial, cargarHistorial } = useHistorial(user?.id);

  useEffect(() => {
    if (user?.id) cargarHistorial();
  }, [user?.id, cargarHistorial]);

  const fechasBloqueadas = useMemo(() => {
    return new Set(historial.map((p: any) => p.fecha.split('T')[0]));
  }, [historial]);
 
  // ── 4. LÓGICA DE NEGOCIO Y PRUEBAS ────────────────────────────────────────
  const isSelectedDateToday = diasSemanaArray[diaSeleccionadoIdx]?.esHoy ?? false;
  const isDeadlinePassed = false; 
  const bloquearUI = isSelectedDateToday && isDeadlinePassed;

  const fondoObj = (menuHoy.fondos || []).find((p: any) => p.id === pedido.fondoId);
  const fondoNeedsGuarnicion = Boolean(fondoObj && (fondoObj.guarniciones || []).length > 0);
  
  const estaCompleto = activeTab === 'PERSONALIZADO' && Boolean(
    pedido.entradaId &&
    pedido.fondoId   &&
    pedido.postreId  &&
    (!fondoNeedsGuarnicion || pedido.guarnicionId !== null)
  );
 
  // ── 5. EFECTOS DE NAVEGACIÓN Y SCROLL ─────────────────────────────────────
  useEffect(() => {
    setPedido({ entradaId: null, fondoId: null, postreId: null, guarnicionId: null });
    setSeccionAbierta(null);
    setModoEdicion(false); 
  }, [fechaSeleccionadaISO]);
 
  useEffect(() => {
    if (activeTab === 'PERSONALIZADO' && !cargandoMenu && !bloquearUI && (!pedidoExistente || modoEdicion)) {
      setSeccionAbierta('ENTRADA'); 
    } else {
      setSeccionAbierta(null); 
    }
  }, [activeTab, cargandoMenu, bloquearUI, pedidoExistente, modoEdicion]);

  useEffect(() => {
    if (seccionAbierta) {
      setTimeout(() => {
        const elemento = document.getElementById(`seccion-${seccionAbierta}`);
        if (elemento) {
          const y = elemento.getBoundingClientRect().top + window.scrollY - 20;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 300);
    }
  }, [seccionAbierta]);
 
  // ── 6. HANDLERS DE ACCIÓN ─────────────────────────────────────────────────
  const toggleSeccion = (cat: Categoria) =>
    setSeccionAbierta(prev => (prev === cat ? null : cat));
 
  const manejarEnvio = async () => {
    if (activeTab === 'PERSONALIZADO') {
      const exito = await enviarPedido(pedido);
      if (exito) {
        setSeccionAbierta(null);
        setModoEdicion(false);
        cargarHistorial(); 
      }
    } else {
      alert("La lógica para este tipo de menú se implementará próximamente.");
    }
  };

  const manejarEliminar = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este pedido?')) return;
    setEliminando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trabajador/pedidos?usuarioId=${user?.id}&fecha=${fechaSeleccionadaISO}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setModoEdicion(false);
        setPedido({ entradaId: null, fondoId: null, postreId: null, guarnicionId: null });
        await Promise.all([cargarHistorial(), refrescarVerificacion()]); 
      }
    } catch (e) { console.error(e); } 
    finally { setEliminando(false); }
  };
 
  const seleccionarPlato = (categoria: 'entradaId' | 'fondoId' | 'postreId', id: number) => {
    if (bloquearUI) return;
    
    if (categoria === 'fondoId') {
      const sel = (menuHoy.fondos || []).find((p: any) => p.id === id);
      const guarniciones = sel?.guarniciones ?? []; 
      
      if (guarniciones.length > 0) {
        setSheetFondo(sel);
        setSheetSelectedGuarnicion(null);
        setSheetOpen(true);
        return;
      }
    }
    
    setPedido(prev => ({ ...prev, [categoria]: prev[categoria] === id ? null : id }));
    if (categoria === 'entradaId') setTimeout(() => setSeccionAbierta('FONDO'), 400);
    if (categoria === 'fondoId')   setTimeout(() => setSeccionAbierta('POSTRE'), 400);
  };
 
  if (eliminando) {
    return <LoadingScreen message="Eliminando pedido..." />;
  }
 
  return (
    <div className="min-h-screen pb-40" style={{ backgroundColor: THEME.colors.background }} onClick={() => setSeccionAbierta(null)}>
      {/* 🔥 Le pasamos el rol de Trabajador y el nombre de la empresa al Sidebar */}
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        rolPropVisible="Trabajador"
        empresaNombre="Starco"
      />
 
      {/* ── HEADER ── */}
      <div className="pt-5 pb-3 flex justify-between items-center px-6" style={{ backgroundColor: THEME.colors.secondary }}>
        <h1 className="text-[24px] font-black italic text-white m-0 leading-none">GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span></h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white"><Menu size={24} /></button>
      </div>
      <div className="h-1 w-full" style={{ backgroundColor: THEME.colors.primary }} />
 
      {/* ── SALUDO ── */}
      <div className="px-6 pt-7 pb-10 text-white rounded-b-[40px] shadow-lg" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-xl font-bold opacity-95">Hola, {nombreUsuario}</h2>
        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest">{fechaTexto}</p>
      </div>
 
      {/* ── TIMER ── */}
      <div className="mx-6 -mt-8 p-5 rounded-3xl shadow-2xl bg-white border-b-4 transition-all" style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDeadlinePassed ? 'bg-red-50' : 'bg-green-50'}`}><Clock size={24} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Límite para pedir</p>
            <p className="text-2xl font-black tracking-tight text-[#1B2C56]">{isDeadlinePassed ? 'CERRADO' : timeRemaining}</p>
          </div>
        </div>
      </div>
 
      {/* ── CALENDARIO ── */}
      <div className="mt-10 px-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSemanaOffset(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-50"><ChevronLeft size={20} /></button>
          <span className="text-[10px] font-black uppercase text-[#1d2d50] opacity-60">{getSemanaTexto()}</span>
          <button onClick={() => setSemanaOffset(1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-50"><ChevronRight size={20} /></button>
        </div>
        <div className="flex justify-between items-center">
          {diasSemanaArray.map((dia, index) => {
            const tienePedido = fechasBloqueadas.has(dia.iso);
            return (
              <button
                key={index}
                onClick={() => setDiaSeleccionadoIdx(index)}
                className={['flex flex-col items-center justify-center w-[17%] aspect-square rounded-[20px] transition-all', dia.esSeleccionado ? 'border-2 scale-110 shadow-md' : 'border shadow-sm', tienePedido ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'].join(' ')}
                style={dia.esSeleccionado ? { borderColor: THEME.colors.primary } : {}}
              >
                <span className={`text-[10px] font-black mb-1 uppercase ${tienePedido ? 'text-[#70a344]' : 'text-gray-400'}`}>{dia.letra}</span>
                <span className="text-lg font-black" style={{ color: tienePedido || dia.esSeleccionado ? THEME.colors.primary : '#1d2d50' }}>{dia.numero}</span>
              </button>
            );
          })}
        </div>
      </div>
 
      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="mt-8 px-6 space-y-4">
        {(cargandoVerificacion || cargandoMenu) ? (
          <div className="flex flex-col gap-4 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm animate-pulse flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded-full w-1/3"></div>
                <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : 
         pedidoExistente && !modoEdicion ? (
          /* MODO RESUMEN */
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden mt-4">
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-green-600" />
                <h3 className="font-black text-xl text-[#1d2d50]">Pedido Listo</h3>
              </div>
              <button onClick={manejarEliminar} className="p-2 text-red-400 bg-red-50 rounded-xl relative z-10 active:scale-90 transition-transform"><Trash2 size={20} /></button>
            </div>
            
            <div className="space-y-4 mb-6 relative z-10">
              {pedidoExistente.resumen.map((r: any, idx: number) => {
                let nombreGuarnicion = r.guarnicion || r.guarnicionNombre;
                if (!nombreGuarnicion && r.categoria === 'FONDO' && r.guarnicionId && r.guarnicionId !== -1) {
                  const platoFondo = menuHoy.fondos?.find((f: any) => f.id === r.platoId);
                  const guarnicionObj = platoFondo?.guarniciones?.find((g: any) => g.id === r.guarnicionId);
                  if (guarnicionObj) nombreGuarnicion = guarnicionObj.nombre;
                }
                return (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[10px] font-black text-green-600/70 uppercase tracking-widest mb-0.5">{r.categoria}</span>
                    <span className="font-bold text-[#1d2d50] leading-tight">
                      {r.nombre}
                      {nombreGuarnicion && <span> + {nombreGuarnicion}</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                const e = pedidoExistente.resumen.find((r:any)=>r.categoria==='ENTRADA');
                const f = pedidoExistente.resumen.find((r:any)=>r.categoria==='FONDO');
                const p = pedidoExistente.resumen.find((r:any)=>r.categoria==='POSTRE');
                setPedido({entradaId: e?.platoId ?? null, fondoId: f?.platoId ?? null, postreId: p?.platoId ?? null, guarnicionId: f?.guarnicionId ?? null});
                setModoEdicion(true);
                setActiveTab('PERSONALIZADO');
                setSeccionAbierta('ENTRADA');
              }}
              disabled={isDeadlinePassed}
              className={`w-full py-4 rounded-xl font-black text-center transition-all relative z-10 text-white ${
                isDeadlinePassed
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-[#70a344] shadow-md active:scale-95'
              }`}
            >
              {isDeadlinePassed ? 'Modificación cerrada' : 'Modificar pedido'}
            </button>
          </div>
        ) : (
          /* MODO SELECCIÓN CON TABS */
          <>
            {/* ── BARRA DE PESTAÑAS (TABS) ── */}
            <div className="flex bg-white border border-gray-100 p-1.5 rounded-[20px] mb-6 shadow-sm">
              <button
                onClick={() => setActiveTab('MENU_DIA')}
                className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'MENU_DIA' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}
              >
                Menú Día
              </button>
              <button
                onClick={() => setActiveTab('PERSONALIZADO')}
                className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'PERSONALIZADO' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}
              >
                Personalizado
              </button>
              <button
                onClick={() => setActiveTab('OTRO')}
                className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'OTRO' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}
              >
                Otros
              </button>
            </div>

            {modoEdicion && (
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="font-black text-sm text-[#1d2d50] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Modificando
                </span>
                <button onClick={() => setModoEdicion(false)} className="text-[11px] font-bold text-gray-400 uppercase bg-gray-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform"><X size={14} className="inline mr-1" /> Cancelar</button>
              </div>
            )}
            
            {/* ── VISTA: MENÚ DEL DÍA (Próximamente) ── */}
            {activeTab === 'MENU_DIA' && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-[#70a344]" />
                </div>
                <h3 className="font-black text-[#1d2d50] text-xl mb-2">Menú Predeterminado</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">El menú sugerido por el casino para este día. Rápido, completo y sin complicaciones.</p>
                <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  (Vista en desarrollo)
                </div>
              </div>
            )}

            {/* ── VISTA: PERSONALIZADO (El acordeón que ya tienes) ── */}
            {activeTab === 'PERSONALIZADO' && (
              (['ENTRADA', 'FONDO', 'POSTRE'] as const).map(cat => {
                const key      = cat === 'ENTRADA' ? 'entradas' : cat === 'FONDO' ? 'fondos' : 'postres';
                const stateKey = (cat.toLowerCase() + 'Id') as 'entradaId' | 'fondoId' | 'postreId';
                const isOpen     = seccionAbierta === cat;
                const isSelected = pedido[stateKey] !== null;
                const platos     = menuHoy[key] ?? [];
  
                return (
                  <section
                    key={cat}
                    id={`seccion-${cat}`}
                    className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm transition-all mb-4"
                  >
                    <button
                      onClick={e => { e.stopPropagation(); toggleSeccion(cat); }}
                      className="w-full flex items-center justify-between p-5"
                    >
                      <div className="flex items-center gap-3">
                        <h3
                          className={`font-black text-lg tracking-tight uppercase ${
                            isOpen || isSelected ? 'text-[#1d2d50]' : 'text-gray-400'
                          }`}
                        >
                          {cat}
                        </h3>
                        {isSelected && <CheckCircle2 size={18} className="text-green-500" />}
                        {platos.length > 0 && (
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            {platos.length} {platos.length === 1 ? 'opción' : 'opciones'}
                          </span>
                        )}
                      </div>
                      {isOpen
                        ? <ChevronUp   size={20} className="text-gray-300" />
                        : <ChevronDown size={20} className="text-gray-300" />
                      }
                    </button>
  
                    <div
                      className={`flex flex-col gap-4 px-4 pb-5 transition-all duration-500 ${
                        isOpen
                          ? 'max-h-[1000px] opacity-100 visible'
                          : 'max-h-0 opacity-0 invisible overflow-hidden'
                      }`}
                    >
                      {platos.length === 0 ? (
                        <p className="text-center text-gray-300 font-black text-[11px] uppercase tracking-widest py-4">
                          Sin opciones para este día
                        </p>
                      ) : (
                        platos.map((plato: any) => (
                          <TarjetaPlato
                            key={plato.id}
                            plato={plato}
                            categoriaKey={stateKey}
                            isSelected={pedido[stateKey] === plato.id}
                            isDeadlinePassed={bloquearUI}
                            onSelect={seleccionarPlato}
                          />
                        ))
                      )}
                    </div>
                  </section>
                );
              })
            )}

            {/* ── VISTA: OTROS (Canje y Premium - Próximamente) ── */}
            {activeTab === 'OTRO' && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
                  <h3 className="font-black text-[#1d2d50] text-lg mb-1 uppercase">Canje</h3>
                  <p className="text-gray-500 text-xs mb-5">Elige entre distintos combos de snacks, bebestibles y productos pre-elaborados.</p>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    (Próximamente)
                  </div>
                </div>
                
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
                  <h3 className="font-black text-[#1d2d50] text-lg mb-1 uppercase">Colación Premium</h3>
                  <p className="text-gray-500 text-xs mb-5">Sándwich a elección + Bebida + Snack a elección.</p>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    (Próximamente)
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── GUARNICIONES (Se usa en PERSONALIZADO) ── */}
      {sheetFondo && (
        <BottomSheet open={sheetOpen} title="Elige una guarnición" onClose={() => setSheetOpen(false)}>
          <div className="px-2 pb-2 mt-2 px-6 pb-6">
            <div className="flex flex-col gap-3">
              {(sheetFondo.guarniciones || []).map((g: any) => (
                <button key={g.id} onClick={() => setSheetSelectedGuarnicion(g.id)} className={`flex items-center justify-between w-full px-5 py-4 rounded-2xl border ${sheetSelectedGuarnicion===g.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                  <span className="font-bold text-sm text-[#1d2d50] uppercase">{g.nombre}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sheetSelectedGuarnicion===g.id ? 'border-green-500' : 'border-gray-300'}`}>{sheetSelectedGuarnicion===g.id && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}</div>
                </button>
              ))}
              <button onClick={() => setSheetSelectedGuarnicion(-1)} className={`flex items-center justify-between w-full px-5 py-4 rounded-2xl border ${sheetSelectedGuarnicion===-1 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <span className="font-bold text-sm text-[#1d2d50] uppercase text-left">Sin guarnición</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sheetSelectedGuarnicion===-1 ? 'border-green-500' : 'border-gray-300'}`}>{sheetSelectedGuarnicion===-1 && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}</div>
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-8">
              <button onClick={() => {
                setPedido(prev => ({ ...prev, fondoId: sheetFondo.id, guarnicionId: sheetSelectedGuarnicion }));
                setSheetOpen(false); setTimeout(() => setSeccionAbierta('POSTRE'), 300);
              }} disabled={sheetSelectedGuarnicion===null} className={`w-full py-4 rounded-xl font-black ${sheetSelectedGuarnicion===null ? 'bg-gray-100 text-gray-400' : 'bg-[#70a344] text-white shadow-md'}`}>Seleccionar</button>
              <button onClick={() => setSheetOpen(false)} className="w-full py-3 font-bold text-gray-400">Cancelar</button>
            </div>
          </div>
        </BottomSheet>
      )}
 
      {/* ── BOTÓN FLOTANTE ── */}
      {!(cargandoVerificacion || cargandoMenu) && !bloquearUI && (!pedidoExistente || modoEdicion) && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button 
            onClick={manejarEnvio} 
            disabled={!estaCompleto || enviando} 
            className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 ${
              estaCompleto 
                ? 'bg-[#70a344] shadow-xl text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {enviando ? 'Enviando...' : modoEdicion ? 'Guardar Cambios' : 'Confirmar Pedido'}
          </button>
        </div>
      )}
    </div>
  );
};

const LoadingScreen: React.FC<{message: string}> = ({message}) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    <div className="w-10 h-10 border-4 border-gray-100 border-t-[#70a344] rounded-full animate-spin mb-4" />
    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest text-center">{message}</p>
  </div>
);

export default HomePageTrabajador;