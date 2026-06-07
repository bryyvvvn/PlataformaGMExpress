// HomePageTrabajador.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, CheckCircle2, Menu, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, Trash2, CalendarOff, Lock, Check } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../../constants/theme';
import { useUser } from '@clerk/clerk-react';
import { TarjetaPlato } from '../../components/TarjetaPlato';
import { BottomSheet } from '../../components/BottomSheet';
import LoadingView from '../../components/LoadingView';
import { useCountdown } from '../../hooks/useCountdown';
import { useMenuAPI } from '../../hooks/useMenuAPI';
import { usePedidos } from '../../hooks/usePedidos';
import { useCalendario } from '../../hooks/useCalendario';
import { useHistorial } from '../../hooks/useHistorial';
import { Sidebar } from '../../components/Sidebar';
import { API_BASE_URL } from '../../constants/api';
import { VerificadorRut } from '../../components/VerificadorRut';

type Categoria = 'ENTRADA' | 'FONDO' | 'POSTRE' | null;
type TipoMenu = 'MENU_DIA' | 'PERSONALIZADO' | 'OTRO';

const capitalizar = (texto: string | null | undefined) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

const HomePageTrabajador: React.FC = () => {
  const { user } = useUser();

  const {
    setSemanaOffset, fechaTexto, diasSemanaArray, getSemanaTexto,
    diaSeleccionadoIdx, setDiaSeleccionadoIdx, fechaSeleccionadaISO,
  } = useCalendario();

  const [pedido, setPedido] = useState({
    entradasIds:  [] as number[], 
    fondoId:      null as number | null,
    postreId:     null as number | null,
    guarnicionId: null as number | null,
    canjeId:      null as number | null,
    sandwichId:   null as number | null,
    bebidaId:     null as number | null,
  });

  const [activeTab, setActiveTab] = useState<TipoMenu>('MENU_DIA');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetFondo, setSheetFondo] = useState<any | null>(null);
  const [sheetSelectedGuarnicion, setSheetSelectedGuarnicion] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [seccionAbierta, setSeccionAbierta] = useState<Categoria>(null);
  
  // ESTADOS INDEPENDIENTES PARA OTROS
  const [tipoOtroSeleccionado, setTipoOtroSeleccionado] = useState<'CANJE' | 'PREMIUM' | null>(null);
  
  const [modoEdicion, setModoEdicion] = useState(false);
  const [diasBloqueadosAdmin, setDiasBloqueadosAdmin] = useState<number[]>([]);

  const [otrosPlatos, setOtrosPlatos] = useState<any[]>([]);
  const [loadingOtros, setLoadingOtros] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/perfil?clerkId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.diasBloqueados) {
            setDiasBloqueadosAdmin(data.diasBloqueados);
          }
        }
      } catch (error) {
        console.error("Error obteniendo perfil del trabajador:", error);
      }
    };
    fetchPerfil();
  }, [user?.id]);

  const { timeRemaining } = useCountdown(DEADLINE_HOUR);
  const { menuHoy, cargando: cargandoMenu } = useMenuAPI(fechaSeleccionadaISO);
  const { pedidoExistente, cargandoVerificacion, enviarPedido, enviarItems, enviando, refrescarVerificacion, eliminarPedido, eliminando } = usePedidos(user?.id, fechaSeleccionadaISO);
  const { historial, cargarHistorial } = useHistorial(user?.id);

  useEffect(() => { if (user?.id) cargarHistorial(); }, [user?.id, cargarHistorial]);

  const fechasBloqueadas = useMemo(() => new Set(historial.map((p: any) => p.fecha.split('T')[0])), [historial]);

  const isSelectedDateToday = diasSemanaArray[diaSeleccionadoIdx]?.esHoy ?? false;
  const isDeadlinePassed = false; 
  
  const numDiaSeleccionado = new Date(fechaSeleccionadaISO + 'T12:00:00').getDay();
  const esBloqueadoPermanente = diasBloqueadosAdmin.includes(numDiaSeleccionado);
  const fechaBloqueada = (diasSemanaArray[diaSeleccionadoIdx]?.bloqueado ?? false) || esBloqueadoPermanente;
  
  const fechaSeleccionadaTienePedido = fechasBloqueadas.has(fechaSeleccionadaISO);
  const bloquearUI = (isSelectedDateToday && isDeadlinePassed) || (fechaBloqueada && !fechaSeleccionadaTienePedido);

  const indicePrimerDiaHabil = useMemo(() => {
    return diasSemanaArray.findIndex(dia => {
      const numDia = new Date(dia.iso + 'T12:00:00').getDay();
      const bloqueadoPorAdmin = diasBloqueadosAdmin.includes(numDia);
      const visualmenteBloqueado = dia.bloqueado || bloqueadoPorAdmin;
      const tienePedido = fechasBloqueadas.has(dia.iso);
      return !(visualmenteBloqueado && !tienePedido); 
    });
  }, [diasSemanaArray, diasBloqueadosAdmin, fechasBloqueadas]);

  const todosBloqueados = useMemo(() => {
    return diasSemanaArray.every(dia => {
      const numDia = new Date(dia.iso + 'T12:00:00').getDay();
      const bloqueado = dia.bloqueado || diasBloqueadosAdmin.includes(numDia);
      const tienePedido = fechasBloqueadas.has(dia.iso);
      return bloqueado && !tienePedido;
    });
  }, [diasSemanaArray, diasBloqueadosAdmin, fechasBloqueadas]);

  const lastConfigRef = useRef({ week: '', histLen: -1, blockLen: -1 });

  useEffect(() => {
    if (diasSemanaArray.length === 0) return;
    
    const currentWeek = diasSemanaArray[0].iso;
    const currentHistLen = historial.length;
    const currentBlockLen = diasBloqueadosAdmin.length;

    // Solo hacemos el salto automático cuando carga la app, cambia la semana o haces/borras un pedido
    if (
      currentWeek !== lastConfigRef.current.week ||
      currentHistLen !== lastConfigRef.current.histLen ||
      currentBlockLen !== lastConfigRef.current.blockLen
    ) {
      lastConfigRef.current = { week: currentWeek, histLen: currentHistLen, blockLen: currentBlockLen };

      // Buscamos el primer día que NO esté bloqueado y NO tenga pedido
      const primerDiaSinPedido = diasSemanaArray.findIndex(dia => {
        const numDia = new Date(dia.iso + 'T12:00:00').getDay();
        const bloqueado = dia.bloqueado || diasBloqueadosAdmin.includes(numDia);
        const tienePedido = fechasBloqueadas.has(dia.iso);
        return !bloqueado && !tienePedido;
      });

      if (primerDiaSinPedido !== -1) {
        setDiaSeleccionadoIdx(primerDiaSinPedido);
      } else {
        // Si ya pidió toda la semana (o están bloqueados), seleccionamos el primero que tenga pedido
        const primerDiaConPedido = diasSemanaArray.findIndex(dia => fechasBloqueadas.has(dia.iso));
        if (primerDiaConPedido !== -1) {
          setDiaSeleccionadoIdx(primerDiaConPedido);
        }
      }
    }
  }, [diasSemanaArray, historial.length, diasBloqueadosAdmin.length, fechasBloqueadas, diasBloqueadosAdmin, setDiaSeleccionadoIdx]);

  const fondoObj = (menuHoy.fondos || []).find((p: any) => p.id === pedido.fondoId);
  const isPlatoUnicoOrHipocalorico = fondoObj?.tipo === 'PLATO_UNICO' || fondoObj?.tipo === 'HIPOCALORICO';
  const fondoNeedsGuarnicion = Boolean(fondoObj && (fondoObj.guarniciones || []).length > 0 && !isPlatoUnicoOrHipocalorico);
  
  const menuDiaSeleccionado = Boolean(
    menuHoy.menuDia &&
    pedido.entradasIds.length === 1 &&
    pedido.entradasIds[0] === menuHoy.menuDia.entrada.id &&
    pedido.fondoId === menuHoy.menuDia.fondo.id &&
    pedido.postreId === menuHoy.menuDia.postre.id &&
    pedido.guarnicionId === (menuHoy.menuDia.guarnicion?.id ?? null)
  );

  const estaCompletoPersonalizado = activeTab === 'PERSONALIZADO' && Boolean(
    pedido.entradasIds.length > 0 &&
    pedido.fondoId &&
    pedido.postreId &&
    (!fondoNeedsGuarnicion || pedido.guarnicionId !== null)
  );

  const estaCompletoOtro = activeTab === 'OTRO' && Boolean(
    (pedido.canjeId !== null) || (pedido.sandwichId !== null && pedido.bebidaId !== null)
  );

  const puedeEnviar = activeTab === 'MENU_DIA' ? menuDiaSeleccionado : (activeTab === 'PERSONALIZADO' ? estaCompletoPersonalizado : estaCompletoOtro);

  const isCanjeSelected = tipoOtroSeleccionado === 'CANJE';
  const isPremiumSelected = tipoOtroSeleccionado === 'PREMIUM';
  const isCanjeBloqueado = tipoOtroSeleccionado === 'PREMIUM';
  const isPremiumBloqueado = tipoOtroSeleccionado === 'CANJE';

  useEffect(() => {
    setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null });
    setSeccionAbierta(null);
    setModoEdicion(false); 
    setTipoOtroSeleccionado(null);
  }, [fechaSeleccionadaISO]);

  useEffect(() => {
    if (activeTab === 'PERSONALIZADO' && !cargandoMenu && !bloquearUI && (!pedidoExistente || modoEdicion)) {
      setSeccionAbierta('ENTRADA'); 
    } else {
      setSeccionAbierta(null); 
    }
  }, [activeTab, cargandoMenu, bloquearUI, pedidoExistente, modoEdicion]);

  useEffect(() => {
    let cancel = false;
    const cargar = async () => {
      setLoadingOtros(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/trabajador/otros`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancel) setOtrosPlatos(data.platos || []);
      } catch (e) {
        console.error('Error cargando otros:', e);
      } finally {
        if (!cancel) setLoadingOtros(false);
      }
    };
    if (activeTab === 'OTRO') cargar();
    return () => { cancel = true; };
  }, [activeTab]);

  const toggleSeccion = (cat: Categoria) => setSeccionAbierta(prev => (prev === cat ? null : cat));

  const handleSeleccionarTipoOtro = (tipo: 'CANJE' | 'PREMIUM') => {
    if (tipoOtroSeleccionado === tipo) {
      setTipoOtroSeleccionado(null);
      setPedido(prev => ({ ...prev, canjeId: null, sandwichId: null, bebidaId: null }));
    } else {
      setTipoOtroSeleccionado(tipo);
      setPedido(prev => ({ ...prev, canjeId: null, sandwichId: null, bebidaId: null }));
    }
  };

  const seleccionarMenuDelDia = () => {
    if (!menuHoy.menuDia || bloquearUI) return;
    if (menuDiaSeleccionado) {
      setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null });
    } else {
      setPedido({
        entradasIds: [menuHoy.menuDia.entrada.id],
        fondoId: menuHoy.menuDia.fondo.id,
        postreId: menuHoy.menuDia.postre.id,
        guarnicionId: menuHoy.menuDia.guarnicion?.id ?? null,
        canjeId: null, sandwichId: null, bebidaId: null
      });
    }
  };

  const seleccionarOtro = (categoria: 'canjeId' | 'sandwichId' | 'bebidaId', id: number) => {
    if (bloquearUI) return;
    setPedido(prev => {
      if (categoria === 'canjeId') {
        const isCurrentlySelected = prev.canjeId === id;
        return { ...prev, canjeId: isCurrentlySelected ? null : id, sandwichId: null, bebidaId: null };
      } 
      let nextSandwich = prev.sandwichId;
      let nextBebida = prev.bebidaId;
      if (categoria === 'sandwichId') {
        nextSandwich = prev.sandwichId === id ? null : id;
        if (!nextSandwich) nextBebida = null;
      }
      if (categoria === 'bebidaId') nextBebida = prev.bebidaId === id ? null : id;
      return { ...prev, canjeId: null, sandwichId: nextSandwich, bebidaId: nextBebida };
    });
  };

  const manejarEnvio = async () => {
    if (activeTab === 'MENU_DIA' && !menuDiaSeleccionado) { alert('Selecciona el Menú del Día antes de confirmar.'); return; }
    if (activeTab === 'PERSONALIZADO' || activeTab === 'MENU_DIA') {
      const exito = await enviarPedido(pedido);
      if (exito) { setSeccionAbierta(null); setModoEdicion(false); cargarHistorial(); }
      return;
    }
    if (activeTab === 'OTRO') {
      const items: Array<{ platoId: number; cantidad: number }> = [];
      if (pedido.canjeId) items.push({ platoId: pedido.canjeId, cantidad: 1 });
      if (pedido.sandwichId) items.push({ platoId: pedido.sandwichId, cantidad: 1 });
      if (pedido.bebidaId) items.push({ platoId: pedido.bebidaId, cantidad: 1 });
      if (items.length === 0) { alert('Selecciona al menos un item.'); return; }
      const exito = await enviarItems(items);
      if (exito) { setModoEdicion(false); setTipoOtroSeleccionado(null); cargarHistorial(); }
      return;
    }
  };

  const manejarEliminar = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este pedido?')) return;
    const exito = await eliminarPedido(fechaSeleccionadaISO);
    if (exito) {
      setModoEdicion(false);
      setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null });
      setTipoOtroSeleccionado(null);
      try { await cargarHistorial(); } catch (e) { }
      try { await refrescarVerificacion(); } catch (e) { }
    }
  };

  const seleccionarPlato = (categoria: 'fondoId' | 'postreId', id: number) => {
    if (bloquearUI) return;
    if (categoria === 'fondoId') {
      const sel = (menuHoy.fondos || []).find((p: any) => p.id === id);
      if (sel?.tipo === 'PLATO_UNICO' || sel?.tipo === 'HIPOCALORICO') {
        setPedido(prev => ({ ...prev, fondoId: id, guarnicionId: null }));
        setTimeout(() => setSeccionAbierta('POSTRE'), 400);
        return; 
      }
      if ((sel?.guarniciones ?? []).length > 0) {
        setSheetFondo(sel); setSheetSelectedGuarnicion(null); setSheetOpen(true); 
        return;
      }
    }
    setPedido(prev => ({ ...prev, [categoria]: prev[categoria] === id ? null : id }));
    if (categoria === 'fondoId') setTimeout(() => setSeccionAbierta('POSTRE'), 400);
    if (categoria === 'postreId') setTimeout(() => setSeccionAbierta(null), 200);
  };

  const seleccionarEntrada = (plato: any) => {
    if (bloquearUI) return;
    const nombre = plato.nombre.toLowerCase();
    const isSopa = nombre.includes('sopa');
    const isSurtida = nombre.includes('surtida');
    const isCurrentlySelected = pedido.entradasIds.includes(plato.id);
    setPedido(prev => {
      const actuales = prev.entradasIds;
      if (isCurrentlySelected) return { ...prev, entradasIds: actuales.filter(id => id !== plato.id) };
      if (isSopa || isSurtida) return { ...prev, entradasIds: [plato.id] };
      const idsExclusivos = (menuHoy.entradas || []).filter((p: any) => p.nombre.toLowerCase().includes('sopa') || p.nombre.toLowerCase().includes('surtida')).map((p: any) => p.id);
      const nuevas = actuales.filter(id => !idsExclusivos.includes(id));
      return { ...prev, entradasIds: [...nuevas, plato.id] };
    });
    if ((isSopa || isSurtida) && !isCurrentlySelected) setTimeout(() => setSeccionAbierta('FONDO'), 400);
  };

  if (eliminando) return <LoadingView message="Eliminando pedido..." />;

  return (
    <div className="min-h-screen pb-48 relative" style={{ backgroundColor: THEME.colors.background }} onClick={() => setSeccionAbierta(null)}>
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} rolPropVisible="Trabajador" empresaNombre="Starco" />

      <div className="pt-5 pb-3 flex justify-between items-center px-6" style={{ backgroundColor: THEME.colors.secondary }}>
        <h1 className="text-[24px] font-black italic text-white m-0 leading-none">GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span></h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white"><Menu size={24} /></button>
      </div>
      <div className="h-1 w-full" style={{ backgroundColor: THEME.colors.primary }} />

      <div className="px-6 pt-7 pb-10 text-white rounded-b-[40px] shadow-lg" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-xl font-bold opacity-95">Hola, {capitalizar(user?.firstName)} {capitalizar(user?.lastName)}</h2>
        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest">{fechaTexto}</p>
      </div>

      <div className="mx-6 -mt-8 p-5 rounded-3xl shadow-2xl bg-white border-b-4 transition-all" style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDeadlinePassed ? 'bg-red-50' : 'bg-green-50'}`}><Clock size={24} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Límite para pedir</p>
            <p className="text-2xl font-black tracking-tight text-[#1B2C56]">{isDeadlinePassed ? 'CERRADO' : timeRemaining}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 px-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSemanaOffset(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-50"><ChevronLeft size={20} /></button>
          <span className="text-[10px] font-black uppercase text-[#1d2d50] opacity-60">{getSemanaTexto()}</span>
          <button onClick={() => setSemanaOffset(1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-50"><ChevronRight size={20} /></button>
        </div>
        <div className="flex justify-between items-center">
          {diasSemanaArray.map((dia, index) => {
            const tienePedido = fechasBloqueadas.has(dia.iso);
            const numDiaMenu = new Date(dia.iso + 'T12:00:00').getDay();
            const esBloqueadoPerm = diasBloqueadosAdmin.includes(numDiaMenu);
            const visualmenteBloqueado = dia.bloqueado || esBloqueadoPerm;
            const isSelectedAndValid = dia.esSeleccionado && !todosBloqueados;

            return (
              <button
                key={index}
                onClick={() => { if (!(visualmenteBloqueado && !tienePedido)) setDiaSeleccionadoIdx(index); }}
                className={['flex flex-col items-center justify-center w-[17%] aspect-square rounded-[20px] transition-all', 
                  isSelectedAndValid ? 'border-2 scale-110 shadow-md' : 'border shadow-sm', 
                  tienePedido ? 'bg-green-50 border-green-200' : (visualmenteBloqueado ? 'bg-gray-100 border-gray-200 text-gray-300' : 'bg-white border-gray-200'), 
                  (visualmenteBloqueado && !tienePedido) ? 'cursor-not-allowed' : 'cursor-pointer'
                ].join(' ')}
                style={isSelectedAndValid ? { borderColor: THEME.colors.primary } : {}}
              >
                <span className={`text-[10px] font-black mb-1 uppercase ${tienePedido ? 'text-[#70a344]' : 'text-gray-400'}`}>{dia.letra}</span>
                <span className="text-lg font-black" style={{ color: tienePedido || isSelectedAndValid ? THEME.colors.primary : (visualmenteBloqueado ? '#a0a0a0' : '#1d2d50') }}>{dia.numero}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 px-6 space-y-4">
        {todosBloqueados ? (
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm text-center mt-4 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CalendarOff size={32} className="text-gray-400" />
            </div>
            <h3 className="font-black text-xl text-[#1d2d50] mb-2">Sin días disponibles</h3>
            <p className="text-gray-400 text-sm font-medium">No tienes días habilitados para realizar pedidos durante esta semana.</p>
          </div>
        ) : (cargandoVerificacion || cargandoMenu) ? (
          <div className="space-y-4 max-w-md mx-auto mt-2">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="h-5 bg-gray-200 rounded-full w-1/3 mb-6 animate-pulse" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-[2rem] p-4 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  </div>
                ))}
              </div>
              <div className="mt-6 h-12 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : 
         pedidoExistente && !modoEdicion ? (
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
                const entradas = pedidoExistente.resumen.filter((r:any)=>r.categoria==='ENTRADA').map((e:any) => e.platoId);
                const f = pedidoExistente.resumen.find((r:any)=>r.categoria==='FONDO');
                const p = pedidoExistente.resumen.find((r:any)=>r.categoria==='POSTRE');
                const c = pedidoExistente.resumen.find((r:any)=>r.categoria==='CANJE');
                const s = pedidoExistente.resumen.find((r:any)=>r.categoria==='SANDWICH');
                const b = pedidoExistente.resumen.find((r:any)=>r.categoria==='BEBIDA');
                
                setPedido({
                  entradasIds: entradas, 
                  fondoId: f?.platoId ?? null, 
                  postreId: p?.platoId ?? null, 
                  guarnicionId: f?.guarnicionId ?? null,
                  canjeId: c?.platoId ?? null,
                  sandwichId: s?.platoId ?? null,
                  bebidaId: b?.platoId ?? null
                });
                
                setModoEdicion(true); 
                if (c || s || b) {
                  setActiveTab('OTRO');
                  if (c) {
                    setTipoOtroSeleccionado('CANJE');
                  }
                  if (s || b) {
                    setTipoOtroSeleccionado('PREMIUM');
                  }
                } else {
                  setActiveTab('PERSONALIZADO'); setSeccionAbierta('ENTRADA');
                }
              }}
              disabled={isDeadlinePassed || fechaBloqueada}
              className={`w-full py-4 rounded-xl font-black text-center transition-all relative z-10 text-white ${(isDeadlinePassed || fechaBloqueada) ? 'bg-gray-100 text-gray-400' : 'bg-[#70a344] shadow-md active:scale-95'}`}
            >
              {(isDeadlinePassed || fechaBloqueada) ? 'Modificación cerrada' : 'Modificar pedido'}
            </button>
          </div>
        ) : (
          <>
            <div id="seccion-tabs" className="flex bg-white border border-gray-100 p-1.5 rounded-[20px] mb-6 shadow-sm">
              <button onClick={() => { setActiveTab('MENU_DIA'); if (!modoEdicion) { setTipoOtroSeleccionado(null); } }} className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'MENU_DIA' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}>Menú Día</button>
              <button onClick={() => { setActiveTab('PERSONALIZADO'); if (!modoEdicion) { setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null }); setTipoOtroSeleccionado(null); } }} className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'PERSONALIZADO' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}>Personalizado</button>
              <button onClick={() => { setActiveTab('OTRO'); if (!modoEdicion) { setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null }); setTipoOtroSeleccionado(null); } }} className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'OTRO' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}>Otros</button>
            </div>

            {modoEdicion && (
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="font-black text-sm text-[#1d2d50] uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /> Modificando</span>
                <button onClick={() => setModoEdicion(false)} className="text-[11px] font-bold text-gray-400 uppercase bg-gray-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform"><X size={14} className="inline mr-1" /> Cancelar</button>
              </div>
            )}
            
            {activeTab === 'MENU_DIA' && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                {menuHoy.menuDia ? (
                  <>
                    <div className="space-y-4 text-left">
                      {[
                        { label: 'Entrada', plato: menuHoy.menuDia.entrada, categoriaKey: 'entradaId' as const },
                        { label: 'Fondo', plato: menuHoy.menuDia.fondo, categoriaKey: 'fondoId' as const },
                        { label: 'Postre', plato: menuHoy.menuDia.postre, categoriaKey: 'postreId' as const },
                      ].map(({ label, plato, categoriaKey }) => {
                        const isPlatoSelected = categoriaKey === 'entradaId' ? pedido.entradasIds.includes(plato.id) : pedido[categoriaKey] === plato.id;
                        const handleSelectIndependiente = () => {
                          if (bloquearUI) return;
                          if (categoriaKey === 'entradaId') {
                            setPedido(prev => ({
                              ...prev,
                              entradasIds: prev.entradasIds.includes(plato.id)
                                ? prev.entradasIds.filter(id => id !== plato.id)
                                : [plato.id]
                            }));
                          } else if (categoriaKey === 'fondoId') {
                            setPedido(prev => ({
                              ...prev,
                              fondoId: prev.fondoId === plato.id ? null : plato.id,
                              guarnicionId: prev.fondoId === plato.id ? null : (menuHoy.menuDia?.guarnicion?.id ?? null)
                            }));
                          } else {
                            setPedido(prev => ({
                              ...prev,
                              [categoriaKey]: prev[categoriaKey] === plato.id ? null : plato.id
                            }));
                          }
                        };
                        return (
                          <div key={label} className="space-y-3">
                            <div className="border-b border-gray-100 pb-2 mb-6">
                              <span className="text-xl font-black text-[#1d2d50] uppercase tracking-widest">{label}</span>
                            </div>
                            
                            <TarjetaPlato 
                              plato={plato} 
                              categoriaKey={categoriaKey as any} 
                              isSelected={isPlatoSelected} 
                              extraInfo={label === 'Fondo' && menuHoy.menuDia?.guarnicion ? `+ ${menuHoy.menuDia.guarnicion.nombre}` : undefined} 
                              isDeadlinePassed={bloquearUI} 
                              onSelect={handleSelectIndependiente} 
                            />
                          </div>
                        );
                      })}
                    </div>
                  <button onClick={seleccionarMenuDelDia} disabled={bloquearUI} className={`mt-5 w-full py-4 rounded-2xl font-black text-sm transition-all ${menuDiaSeleccionado ? 'bg-[#70a344] text-white shadow-md' : 'bg-[#1d2d50] text-white active:scale-95'}`}>
                    {menuDiaSeleccionado ? 'Menú del Día seleccionado' : 'Seleccionar Menú del Día'}
                  </button>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-[10px] font-black uppercase tracking-widest">Sin menú seleccionado para este día</div>
                )}
              </div>
            )}

            {activeTab === 'PERSONALIZADO' && (
            (['ENTRADA', 'FONDO', 'POSTRE'] as const).map(cat => {
              const isOpen = seccionAbierta === cat;
              // Definimos si la categoría tiene algo seleccionado para marcar el cuadro
              const isHeaderSelected = cat === 'ENTRADA' ? pedido.entradasIds.length > 0 : pedido[(cat.toLowerCase() + 'Id') as 'fondoId' | 'postreId'] !== null;
              const platos = menuHoy[(cat === 'ENTRADA' ? 'entradas' : cat === 'FONDO' ? 'fondos' : 'postres')] ?? [];

              return (
                <section 
                  key={cat} 
                  id={`seccion-${cat}`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm transition-all mb-4"
                >
                  <button 
                    onClick={e => { e.stopPropagation(); toggleSeccion(cat); }} 
                    className="w-full flex items-center justify-between p-7 sm:p-8"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      {/* CUADRO DE MARCADO A LA IZQUIERDA */}
                      <div className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isHeaderSelected ? 'bg-[#70a344] border-[#70a344]' : 'bg-transparent border-gray-300'
                      }`}>
                        {isHeaderSelected && <Check size={18} strokeWidth={4} className="text-white" />}
                      </div>
                      
                      <div className="flex flex-col text-left">
                        <h3 className="text-xl font-black text-[#1d2d50] uppercase tracking-widest">{cat}</h3>
                      </div>
                    </div>
                    
                    <div className="shrink-0 ml-2">
                      {isOpen ? <ChevronUp size={24} className="text-gray-300" /> : <ChevronDown size={24} className="text-gray-300" />}
                    </div>
                  </button>

                  {/* CONTENIDO DESPLEGABLE */}
                  <div className={`flex flex-col transition-all duration-500 ${isOpen ? 'max-h-[8000px] opacity-100 px-6 pb-6 visible' : 'max-h-0 opacity-0 px-6 pb-0 invisible overflow-hidden'}`}>
                    <div className="w-full h-[1px] bg-gray-100 mb-4" /> 
                    <div className="flex flex-col gap-4">
                      {platos.map((plato: any) => {
                        const isPlatoSelected = cat === 'ENTRADA' ? pedido.entradasIds.includes(plato.id) : pedido[(cat.toLowerCase() + 'Id') as 'fondoId' | 'postreId'] === plato.id;
                        return (
                          <TarjetaPlato 
                            key={plato.id} 
                            plato={plato} 
                            categoriaKey={cat === 'ENTRADA' ? 'entradaId' as any : (cat.toLowerCase() + 'Id')} 
                            isSelected={isPlatoSelected} 
                            isDeadlinePassed={bloquearUI}
                            onSelect={() => {
                              if (cat === 'ENTRADA') seleccionarEntrada(plato);
                              else seleccionarPlato((cat.toLowerCase() + 'Id') as 'fondoId' | 'postreId', plato.id);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })
          )}

            {/* SECCIÓN "OTROS" */}
            {activeTab === 'OTRO' && (
              <div className="flex flex-col gap-5 relative">
                
                {/* TARJETA 1: CANJE */}
                <section 
                  className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
                    isPremiumSelected 
                      ? 'border-gray-100 bg-gray-50 opacity-60 grayscale pointer-events-none' 
                      : 'border-gray-100 bg-white shadow-sm'
                  }`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSeleccionarTipoOtro('CANJE'); }} 
                    disabled={isPremiumSelected}
                    className="w-full flex items-center justify-between p-7 sm:p-8"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isCanjeSelected ? 'bg-[#70a344] border-[#70a344]' : 'bg-transparent border-gray-300'
                      }`}>
                        {isCanjeSelected && <Check size={18} strokeWidth={4} className="text-white" />}
                      </div>
                      <div className="flex flex-col text-left">
                        <h3 className={`text-xl font-black uppercase tracking-widest leading-none mb-1.5 ${isPremiumSelected ? 'text-gray-400' : 'text-[#1d2d50]'}`}>CANJE</h3>
                        <p className="text-gray-400 text-sm font-medium leading-none">Combo pre-elaborado.</p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isPremiumSelected ? (
                        <Lock size={24} className="text-gray-300" />
                      ) : (
                        isCanjeSelected ? <ChevronUp size={24} className="text-gray-300" /> : <ChevronDown size={24} className="text-gray-300" />
                      )}
                    </div>
                  </button>
                  
                  <div className={`flex flex-col transition-all duration-500 ${isCanjeSelected ? 'max-h-[8000px] opacity-100 px-6 pb-6 visible' : 'max-h-0 opacity-0 px-6 pb-0 invisible overflow-hidden'}`}>
                    <div className="w-full h-[1px] bg-gray-100 mb-4" /> 
                    <div className="flex flex-col gap-4">
                      {loadingOtros ? (
                        <div className="text-center text-sm text-gray-400 py-2">Cargando opciones...</div>
                      ) : (
                        <>
                          <h4 className="text-sm font-black text-[#1d2d50] uppercase tracking-wider mb-2 ml-1 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">1</span> 
                            Elige tu Combo
                          </h4>
                          {(otrosPlatos.filter(p => p.categoria === 'CANJE').length === 0) ? (
                            <div className="text-center text-[10px] font-black uppercase text-gray-400 bg-gray-50 p-3 rounded-2xl">No hay opciones disponibles</div>
                          ) : (
                            otrosPlatos.filter(p => p.categoria === 'CANJE').map((plato: any) => (
                              <TarjetaPlato 
                                key={plato.id} 
                                plato={plato} 
                                categoriaKey="canjeId" 
                                isSelected={pedido.canjeId === plato.id} 
                                isDeadlinePassed={bloquearUI} 
                                disabled={false} 
                                onSelect={(_, id) => seleccionarOtro('canjeId', id)} 
                              />
                            ))
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </section>

                {/* TARJETA 2: COLACIÓN PREMIUM */}
                <section 
                  className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
                    isCanjeSelected
                      ? 'border-gray-100 bg-gray-50 opacity-60 grayscale pointer-events-none' 
                      : 'border-gray-100 bg-white shadow-sm'
                  }`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSeleccionarTipoOtro('PREMIUM'); }} 
                    disabled={isCanjeSelected}
                    className="w-full flex items-center justify-between p-7 sm:p-8"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isPremiumSelected ? 'bg-[#70a344] border-[#70a344]' : 'bg-transparent border-gray-300'
                      }`}>
                        {isPremiumSelected && <Check size={18} strokeWidth={4} className="text-white" />}
                      </div>
                      <div className="flex flex-col text-left">
                        <h3 className={`text-xl font-black uppercase tracking-widest leading-none mb-1.5 ${isCanjeSelected ? 'text-gray-400' : 'text-[#1d2d50]'}`}>COLACIÓN PREMIUM</h3>
                        <p className="text-gray-400 text-sm font-medium leading-none">Sándwich a elección + Bebida.</p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isCanjeSelected ? (
                        <Lock size={24} className="text-gray-300" />
                      ) : (
                        isPremiumSelected ? <ChevronUp size={24} className="text-gray-300" /> : <ChevronDown size={24} className="text-gray-300" />
                      )}
                    </div>
                  </button>

                  <div className={`transition-all duration-500 ${isPremiumSelected ? 'max-h-[8000px] opacity-100 px-6 pb-6 visible' : 'max-h-0 opacity-0 px-6 pb-0 invisible overflow-hidden'}`}>
                    <div className="flex flex-col gap-6">
                      <div className="w-full h-[1px] bg-gray-100" /> 
                      {loadingOtros ? (
                        <div className="text-center text-sm text-gray-400 py-2">Cargando opciones...</div>
                      ) : (
                      <>
                        <div>
                          <h4 className="text-sm font-black text-[#1d2d50] uppercase tracking-wider mb-4 ml-1 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">1</span> 
                            Elige tu Sándwich
                          </h4>
                          <div className="flex flex-col gap-3">
                            {(otrosPlatos.filter(p => p.categoria === 'SANDWICH').length === 0) ? (
                              <div className="text-center text-[10px] font-black uppercase text-gray-400 bg-gray-50 p-3 rounded-2xl">No hay opciones disponibles</div>
                            ) : (
                              otrosPlatos.filter(p => p.categoria === 'SANDWICH').map((plato: any) => (
                                <TarjetaPlato 
                                  key={plato.id} 
                                  plato={plato} 
                                  categoriaKey="sandwichId" 
                                  isSelected={pedido.sandwichId === plato.id} 
                                  isDeadlinePassed={bloquearUI} 
                                  disabled={false} 
                                  onSelect={(_, id) => seleccionarOtro('sandwichId', id)} 
                                />
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-[#1d2d50] uppercase tracking-wider mb-4 ml-1 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">2</span> 
                            Elige tu Bebida
                          </h4>
                          <div className="flex flex-col gap-3">
                            {(otrosPlatos.filter(p => p.categoria === 'BEBIDA' || p.categoria === 'BEBESTIBLE').length === 0) ? (
                              <div className="text-center text-[10px] font-black uppercase text-gray-400 bg-gray-50 p-3 rounded-2xl">No hay opciones disponibles</div>
                            ) : (
                              otrosPlatos.filter(p => p.categoria === 'BEBIDA' || p.categoria === 'BEBESTIBLE').map((plato: any) => (
                                <TarjetaPlato 
                                  key={plato.id} 
                                  plato={plato} 
                                  categoriaKey="bebidaId" 
                                  isSelected={pedido.bebidaId === plato.id} 
                                  isDeadlinePassed={bloquearUI} 
                                  disabled={false} 
                                  onSelect={(_, id) => seleccionarOtro('bebidaId', id)} 
                                />
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                </section>

              </div>
            )}
          </>
        )}
      </div>

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
              <button onClick={() => { setPedido(prev => ({ ...prev, fondoId: sheetFondo.id, guarnicionId: sheetSelectedGuarnicion })); setSheetOpen(false); setTimeout(() => setSeccionAbierta('POSTRE'), 300); }} disabled={sheetSelectedGuarnicion===null} className={`w-full py-4 rounded-xl font-black ${sheetSelectedGuarnicion===null ? 'bg-gray-100 text-gray-400' : 'bg-[#70a344] text-white shadow-md'}`}>Seleccionar</button>
              <button onClick={() => setSheetOpen(false)} className="w-full py-3 font-bold text-gray-400">Cancelar</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {!(cargandoVerificacion || cargandoMenu) && !bloquearUI && (!pedidoExistente || modoEdicion) && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
          <button onClick={manejarEnvio} disabled={!puedeEnviar || enviando} className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 ${puedeEnviar ? 'bg-[#70a344] shadow-xl text-white' : 'bg-gray-200 text-gray-500'}`}>
            {enviando ? 'Enviando...' : modoEdicion ? 'Guardar Cambios' : 'Confirmar Pedido'}
          </button>
        </div>
      )}

      <VerificadorRut />
    </div>
  );
};

export default HomePageTrabajador;