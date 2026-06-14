// HomePageTrabajador.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Menu, ChevronDown, ChevronUp, X, CalendarOff, Lock, Check } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../../constants/theme';
import { useUser } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { TarjetaPlato } from '../../components/TarjetaPlato';
import { BottomSheet } from '../../components/BottomSheet';
import LoadingView from '../../components/LoadingView';
import { Sidebar } from '../../components/Sidebar';
import { VerificadorRut } from '../../components/VerificadorRut';

// Hooks
import { useCountdown } from '../../hooks/useCountdown';
import { useMenuAPI } from '../../hooks/useMenuAPI';
import { usePedidos } from '../../hooks/usePedidos';
import { useCalendario } from '../../hooks/useCalendario';
import { useHistorial } from '../../hooks/useHistorial';
import { usePerfilTrabajador } from '../../hooks/usePerfilTrabajador';
import { useOtrosPlatos } from '../../hooks/useOtrosPlatos';
import { useConfigurarNotificaciones } from '../../hooks/useConfigurarNotificaciones';
// Nuevos Componentes
import { MenuSkeleton } from '../../components/MenuSkeleton';
import { CalendarioSemanal } from '../../components/CalendarioSemanal';
import { ResumenPedido } from '../../components/ResumenPedido';
import type { Plato } from '../../hooks/useMenuAPI';

type Categoria = 'ENTRADA' | 'FONDO' | 'POSTRE' | 'JUGO' | null;
type TipoMenu = 'MENU_DIA' | 'PERSONALIZADO' | 'OTRO';

const capitalizar = (texto: string | null | undefined) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

const getEntradasMenuDia = (menuDia: any): Plato[] => {
  if (!menuDia) return [];
  if (Array.isArray(menuDia.entradasSeleccionadas) && menuDia.entradasSeleccionadas.length > 0) {
    const entradasUnicas = new Map<number, Plato>();
    menuDia.entradasSeleccionadas.forEach((entrada: Plato) => {
      if (entrada?.id) entradasUnicas.set(entrada.id, entrada);
    });
    return Array.from(entradasUnicas.values());
  }
  return menuDia.entrada ? [menuDia.entrada] : [];
};

const getEntradaMenuDiaDisplay = (menuDia: any) => {
  if (!menuDia) return '';
  if (menuDia.entradaDisplay) return menuDia.entradaDisplay;
  const entradas = getEntradasMenuDia(menuDia);
  if (entradas.length > 0) return entradas.map((entrada) => entrada.nombre).join(' + ');
  return menuDia.entrada?.nombre ?? '';
};

const getPlatoEntradaMenuDia = (menuDia: any): Plato | null => {
  const entradas = getEntradasMenuDia(menuDia);
  const base = entradas[0] ?? menuDia?.entrada ?? null;
  if (!base) return null;
  return { ...base, nombre: getEntradaMenuDiaDisplay(menuDia) || base.nombre };
};

const obtenerIncluidosPorConvenio = (menuDia: any, convenio: any) => {
  const incluidos: string[] = [];
  if (convenio?.permitePan) incluidos.push('Pan');
  if (menuDia?.bebida?.nombre) incluidos.push(menuDia.bebida.nombre);
  else if (convenio?.permiteJugo) incluidos.push('Jugo del día');
  return incluidos;
};

// 🔥 LAS 4 OPCIONES FIJAS QUE PIDIÓ EL CLIENTE PARA EL FIN DE SEMANA
const OPCIONES_FIN_DE_SEMANA = [
  { id: 'MENU_DIA', nombre: 'MENÚ DEL DÍA', descripcion: 'Opción tradicional.' },
  { id: 'HIPOCALORICO', nombre: 'HIPOCALÓRICO', descripcion: 'Alternativa baja en calorías.' },
  { id: 'VEGETARIANO', nombre: 'VEGETARIANO', descripcion: 'Alternativa sin contenido cárnico.' },
  { id: 'COLACION', nombre: 'COLACIÓN', descripcion: 'Opción rápida o sándwich.' },
];

const HomePageTrabajador: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();

  const [autoSelected, setAutoSelected] = useState(false);
  useConfigurarNotificaciones(user?.id);
  
  useEffect(() => { setAutoSelected(false); }, [location.pathname]);

  const { diasBloqueadosAdmin, convenio } = usePerfilTrabajador(user?.id);
  const trabajaFinDeSemana = convenio?.trabajaFinDeSemana ?? false;

  const {
    setSemanaOffset: _setSemanaOffset, fechaTexto, diasSemanaArray, getSemanaTexto,
    diaSeleccionadoIdx, setDiaSeleccionadoIdx, fechaSeleccionadaISO,
  } = useCalendario(trabajaFinDeSemana);

  const setSemanaOffset = (delta: number) => {
    setAutoSelected(false);
    _setSemanaOffset(delta);
  };

  const [pedido, setPedido] = useState({
    entradasIds:  [] as number[], fondoId: null as number | null, postreId: null as number | null,
    guarnicionId: null as number | null, canjeId: null as number | null, sandwichId: null as number | null, 
    bebidaId: null as number | null, jugoId: null as number | null, isDoblePostre: false
  });

  const [activeTab, setActiveTab] = useState<TipoMenu>('MENU_DIA');
  const [opcionFinde, setOpcionFinde] = useState<string | null>(null); // 🔥 ESTADO PARA EL FIN DE SEMANA

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetFondo, setSheetFondo] = useState<any | null>(null);
  const [sheetSelectedGuarnicion, setSheetSelectedGuarnicion] = useState<number | null>(null);
  
  const [sheetHipoOpen, setSheetHipoOpen] = useState(false);
  const [opcionHipoSeleccionada, setOpcionHipoSeleccionada] = useState<'SOPA' | 'DOBLE_POSTRE' | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [seccionAbierta, setSeccionAbierta] = useState<Categoria>(null);
  const [tipoOtroSeleccionado, setTipoOtroSeleccionado] = useState<'CANJE' | 'PREMIUM' | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { otrosPlatos, loadingOtros } = useOtrosPlatos(activeTab === 'OTRO' || activeTab === 'PERSONALIZADO');
  const { timeRemaining } = useCountdown(DEADLINE_HOUR);
  const { menuHoy, cargando: cargandoMenu } = useMenuAPI(fechaSeleccionadaISO, user?.id);
  const { pedidoExistente, cargandoVerificacion, enviarPedido, enviarItems, enviando, refrescarVerificacion, eliminarPedido, eliminando } = usePedidos(user?.id, fechaSeleccionadaISO);
  const { historial, cargando: cargandoHistorial, cargarHistorial } = useHistorial(user?.id);

  useEffect(() => { if (user?.id) cargarHistorial(); }, [user?.id, cargarHistorial]);

  const fechasBloqueadas = useMemo(() => new Set((historial || []).map((p: any) => String(p?.fecha || '').split('T')[0])), [historial]);
  
  const isSelectedDateToday = diasSemanaArray?.[diaSeleccionadoIdx]?.esHoy ?? false;
  const isDeadlinePassed = false; 
  const numDiaSeleccionado = new Date((fechaSeleccionadaISO || '') + 'T12:00:00').getDay();
  const esBloqueadoPermanente = (diasBloqueadosAdmin || []).includes(numDiaSeleccionado);
  const fechaBloqueada = (diasSemanaArray?.[diaSeleccionadoIdx]?.bloqueado ?? false) || esBloqueadoPermanente;
  const fechaSeleccionadaTienePedido = fechasBloqueadas.has(fechaSeleccionadaISO || '');
  const bloquearUI = (isSelectedDateToday && isDeadlinePassed) || (fechaBloqueada && !fechaSeleccionadaTienePedido);

  // 🔥 DETECTOR DE FIN DE SEMANA
  const esFinDeSemana = numDiaSeleccionado === 0 || numDiaSeleccionado === 6;

  const todosBloqueados = useMemo(() => {
    return (diasSemanaArray || []).every(dia => {
      if (!dia?.iso) return false;
      const numDia = new Date(dia.iso + 'T12:00:00').getDay();
      const bloqueado = dia.bloqueado || (diasBloqueadosAdmin || []).includes(numDia);
      return bloqueado && !fechasBloqueadas.has(dia.iso);
    });
  }, [diasSemanaArray, diasBloqueadosAdmin, fechasBloqueadas]);

  useEffect(() => {
    if (autoSelected) return;
    if (!diasSemanaArray || diasSemanaArray.length === 0 || cargandoHistorial || cargandoVerificacion) return;
    
    const primerDiaSinPedido = diasSemanaArray.findIndex(dia => {
      if (!dia?.iso) return false;
      const numDia = new Date(dia.iso + 'T12:00:00').getDay();
      const bloqueado = dia.bloqueado || (diasBloqueadosAdmin || []).includes(numDia);
      return !bloqueado && !fechasBloqueadas.has(dia.iso);
    });

    if (primerDiaSinPedido !== -1) {
      setDiaSeleccionadoIdx(primerDiaSinPedido);
    } else {
      const primerDiaConPedido = diasSemanaArray.findIndex(dia => dia?.iso && fechasBloqueadas.has(dia.iso));
      if (primerDiaConPedido !== -1) setDiaSeleccionadoIdx(primerDiaConPedido);
    }
    
    setAutoSelected(true); 
  }, [autoSelected, diasSemanaArray, cargandoHistorial, cargandoVerificacion, diasBloqueadosAdmin, fechasBloqueadas, setDiaSeleccionadoIdx]);

  // --- VARIABLES DE REGLAS ---
  const fondoObj = (menuHoy?.fondos || []).find((p: any) => p?.id === pedido.fondoId);
  const isHipocalorico = fondoObj?.tipo === 'HIPOCALORICO';
  const isPlatoUnicoOrHipocalorico = fondoObj?.tipo === 'PLATO_UNICO' || isHipocalorico;
  const fondoNeedsGuarnicion = Boolean(fondoObj && (fondoObj.guarniciones || []).length > 0 && !isPlatoUnicoOrHipocalorico);
  
  const jugoObj = (otrosPlatos || []).find((p: any) => p?.id === pedido.jugoId);
  const penalizaEntradaPostre = (jugoObj?.categoria === 'BEBIDA' && !convenio?.permiteBebida) || (jugoObj?.categoria === 'AGUA_SABORIZADA' && !convenio?.permiteAguaSaborizada);

  const menuDiaSeleccionado = Boolean(menuHoy?.menuDia);
  const entradaMenuDiaPlato = menuHoy?.menuDia ? getPlatoEntradaMenuDia(menuHoy.menuDia) : null;
  const incluidosPorConvenioMenuDia = obtenerIncluidosPorConvenio(menuHoy?.menuDia, convenio);
  const estaCompletoPersonalizado = activeTab === 'PERSONALIZADO' && Boolean(
    (pedido.entradasIds.length > 0 || penalizaEntradaPostre || pedido.isDoblePostre) &&
    pedido.fondoId &&
    (pedido.postreId || penalizaEntradaPostre) &&
    (!fondoNeedsGuarnicion || pedido.guarnicionId !== null) &&
    pedido.jugoId !== null
  );

  const estaCompletoOtro = activeTab === 'OTRO' && Boolean((pedido.canjeId !== null) || (pedido.sandwichId !== null && pedido.bebidaId !== null));
  
  // 🔥 LÓGICA DE ENVÍO
  const puedeEnviar = esFinDeSemana 
    ? Boolean(opcionFinde) 
    : (activeTab === 'MENU_DIA' ? menuDiaSeleccionado : (activeTab === 'PERSONALIZADO' ? estaCompletoPersonalizado : estaCompletoOtro));

  const isCanjeSelected = tipoOtroSeleccionado === 'CANJE';
  const isPremiumSelected = tipoOtroSeleccionado === 'PREMIUM';

  useEffect(() => {
    setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null, jugoId: null, isDoblePostre: false });
    setSeccionAbierta(null);
    setModoEdicion(false); 
    setTipoOtroSeleccionado(null);
    setOpcionFinde(null);
  }, [fechaSeleccionadaISO]);

  const isPedidoDelDiaSeleccionado = String(pedidoExistente?.fecha || '').startsWith(fechaSeleccionadaISO || '');
  const pedidoSeguro = (isPedidoDelDiaSeleccionado && !cargandoVerificacion) ? pedidoExistente : null;

  useEffect(() => {
    if (activeTab === 'PERSONALIZADO' && !cargandoMenu && !bloquearUI && (!pedidoExistente || modoEdicion)) {
      setSeccionAbierta('ENTRADA'); 
    } else {
      setSeccionAbierta(null); 
    }
  }, [activeTab, cargandoMenu, bloquearUI, pedidoExistente, modoEdicion]);

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

  const seleccionarPlato = (categoria: 'fondoId' | 'postreId' | 'jugoId', id: number) => {
    if (bloquearUI) return;
    if (categoria === 'jugoId') {
      const selectedPlato = (otrosPlatos || []).find((p: any) => p?.id === id);
      setPedido(prev => {
        const isDeselecting = prev.jugoId === id;
        const newState = { ...prev, jugoId: isDeselecting ? null : id };
        if (!isDeselecting) {
           const isBebida = selectedPlato?.categoria === 'BEBIDA';
           const isAgua = selectedPlato?.categoria === 'AGUA_SABORIZADA';
           const penaliza = (isBebida && !convenio?.permiteBebida) || (isAgua && !convenio?.permiteAguaSaborizada);
           if (penaliza) { newState.entradasIds = []; newState.postreId = null; newState.isDoblePostre = false; }
        }
        return newState;
      });
      return;
    }
    if (categoria === 'fondoId') {
      const sel = (menuHoy?.fondos || []).find((p: any) => p?.id === id);
      const isDeselecting = pedido.fondoId === id;
      if (isDeselecting) { setPedido(prev => ({ ...prev, fondoId: null, guarnicionId: null, isDoblePostre: false })); return; }
      if (sel?.tipo === 'HIPOCALORICO') { setSheetFondo(sel); setOpcionHipoSeleccionada(null); setSheetHipoOpen(true); return; }
      if ((sel?.guarniciones ?? []).length > 0) { setSheetFondo(sel); setSheetSelectedGuarnicion(null); setSheetOpen(true); return; }
      setPedido(prev => ({ ...prev, fondoId: id, guarnicionId: null, isDoblePostre: false }));
      setTimeout(() => setSeccionAbierta('POSTRE'), 400); return;
    }
    setPedido(prev => ({ ...prev, [categoria]: prev[categoria] === id ? null : id }));
    if (categoria === 'postreId' && pedido.postreId !== id) setTimeout(() => setSeccionAbierta('JUGO'), 200);  
  };

  const seleccionarEntrada = (plato: any) => {
    if (bloquearUI || penalizaEntradaPostre || pedido.isDoblePostre) return;
    const nombre = String(plato?.nombre || '').toLowerCase(); 
    const isSopa = nombre.includes('sopa') || nombre.includes('crema'); 
    const isSurtida = nombre.includes('surtida');
    const isCurrentlySelected = pedido.entradasIds.includes(plato.id);
    if (isHipocalorico && !isSopa) return;
    setPedido(prev => {
      const actuales = prev.entradasIds;
      if (isCurrentlySelected) return { ...prev, entradasIds: actuales.filter(id => id !== plato.id) };
      if (isSopa || isSurtida) return { ...prev, entradasIds: [plato.id] };
      const idsExclusivos = (menuHoy?.entradas || []).filter((p: any) => {
         const n = String(p?.nombre || '').toLowerCase(); 
         return n.includes('sopa') || n.includes('crema') || n.includes('surtida'); 
      }).map((p: any) => p.id);
      const nuevas = actuales.filter(id => !idsExclusivos.includes(id));
      return { ...prev, entradasIds: [...nuevas, plato.id] };
    });
    if ((isSopa || isSurtida) && !isCurrentlySelected) setTimeout(() => setSeccionAbierta('FONDO'), 400);
  };

  const manejarEnvio = async () => {
    // 🔥 SI ES FIN DE SEMANA, ENVIAMOS LA OPCIÓN AL BACKEND
    if (esFinDeSemana) {
      if (!opcionFinde) return;
      const exito = await enviarPedido({ esFinDeSemana: true, tipoFinde: opcionFinde } as any);
      if (exito) { setModoEdicion(false); cargarHistorial(); }
      return;
    }

    if (activeTab === 'MENU_DIA' && !menuDiaSeleccionado) { alert('No hay menú disponible para este día.'); return; }
    if (activeTab === 'PERSONALIZADO' || activeTab === 'MENU_DIA') {
      const pedidoAEnviar = activeTab === 'MENU_DIA' && menuHoy?.menuDia
        ? {
            ...pedido,
            entradasIds: getEntradasMenuDia(menuHoy.menuDia).map((entrada) => entrada.id),
            fondoId: menuHoy.menuDia.fondo?.id ?? null,
            postreId: menuHoy.menuDia.postre?.id ?? null,
            guarnicionId: menuHoy.menuDia.guarnicion?.id ?? null,
            jugoId: menuHoy.menuDia.bebida?.id ?? null,
            isDoblePostre: false
          }
        : pedido;
      const exito = await enviarPedido(pedidoAEnviar as any);
      if (exito) { setSeccionAbierta(null); setModoEdicion(false); cargarHistorial(); }
      return;
    }
    if (activeTab === 'OTRO') {
      const items = [];
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
      setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null, jugoId: null, isDoblePostre: false });
      setTipoOtroSeleccionado(null);
      setOpcionFinde(null);
      try { await cargarHistorial(); refrescarVerificacion(); } catch (e) { }
    }
  };

  const manejarModificarPedido = () => {
    if (esFinDeSemana) {
      setModoEdicion(true);
      setOpcionFinde(pedidoExistente?.tipoFinde || null);
      return;
    }

    const resumen = pedidoExistente?.resumen || [];
    const entradas = resumen.filter((r:any)=>r?.categoria==='ENTRADA').map((e:any) => e.platoId);
    const f = resumen.find((r:any)=>r?.categoria==='FONDO');
    const p = resumen.find((r:any)=>r?.categoria==='POSTRE');
    const c = resumen.find((r:any)=>r?.categoria==='CANJE');
    const s = resumen.find((r:any)=>r?.categoria==='SANDWICH');
    const b = resumen.find((r:any)=>r?.categoria==='BEBIDA');
    const jugo = resumen.find((r:any)=>r?.categoria==='JUGO' || (r?.categoria==='BEBIDA' && activeTab === 'PERSONALIZADO') || (r?.categoria==='AGUA_SABORIZADA' && activeTab === 'PERSONALIZADO'));
    
    setPedido({
      entradasIds: entradas, fondoId: f?.platoId ?? null, postreId: p?.platoId ?? null, 
      guarnicionId: f?.guarnicionId ?? null, canjeId: c?.platoId ?? null, sandwichId: s?.platoId ?? null, 
      bebidaId: b?.platoId ?? null, jugoId: jugo?.platoId ?? null, isDoblePostre: p?.cantidad === 2
    });
    
    setModoEdicion(true); 
    if (c || s || b) {
      setActiveTab('OTRO');
      if (c) setTipoOtroSeleccionado('CANJE');
      if (s || b) setTipoOtroSeleccionado('PREMIUM');
    } else {
      setActiveTab('PERSONALIZADO'); setSeccionAbierta('ENTRADA');
    }
  };

  if (eliminando) return <LoadingView message="Eliminando pedido..." />;

  const categoriasPersonalizado = ['ENTRADA', 'FONDO', 'POSTRE', 'JUGO'];

  return (
    <div className="min-h-screen pb-48 relative flex flex-col" style={{ backgroundColor: THEME.colors.background }}>
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} rolPropVisible="Trabajador" empresaNombre="Starco" />

      <div className="pt-5 pb-3 flex justify-between items-center px-6" style={{ backgroundColor: THEME.colors.secondary }}>
        <h1 className="text-[24px] font-black italic text-white m-0 leading-none">GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span></h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white"><Menu size={24} /></button>
      </div>
      <div className="h-1 w-full" style={{ backgroundColor: THEME.colors.primary }} />

      <div className="px-6 pt-7 pb-10 text-white rounded-b-[40px] shadow-lg shrink-0" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-xl font-bold opacity-95">Hola, {capitalizar(user?.firstName)} {capitalizar(user?.lastName)}</h2>
        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest">{fechaTexto}</p>
      </div>

      <div className="mx-6 -mt-8 p-5 rounded-3xl shadow-2xl bg-white border-b-4 transition-all shrink-0" style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDeadlinePassed ? 'bg-red-50' : 'bg-green-50'}`}><Clock size={24} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Límite para pedir</p>
            <p className="text-2xl font-black tracking-tight text-[#1B2C56]">{isDeadlinePassed ? 'CERRADO' : timeRemaining}</p>
          </div>
        </div>
      </div>

      <CalendarioSemanal 
        getSemanaTexto={getSemanaTexto}
        setSemanaOffset={setSemanaOffset}
        diasSemanaArray={diasSemanaArray || []}
        fechasBloqueadas={fechasBloqueadas}
        diasBloqueadosAdmin={diasBloqueadosAdmin || []}
        todosBloqueados={todosBloqueados}
        setDiaSeleccionadoIdx={setDiaSeleccionadoIdx}
      />

      <div className="mt-8 px-6 flex flex-col grow pb-6">
        {todosBloqueados ? (
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm text-center mt-4 flex flex-col items-center justify-center grow mb-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><CalendarOff size={32} className="text-gray-400" /></div>
            <h3 className="font-black text-xl text-[#1d2d50] mb-2">Sin días disponibles</h3>
            <p className="text-gray-400 text-sm font-medium">No tienes días habilitados para realizar pedidos durante esta semana.</p>
          </div>
        ) : (cargandoVerificacion || cargandoMenu) ? (
          <MenuSkeleton />
        ) : pedidoSeguro && !modoEdicion ? (
          <ResumenPedido 
            pedidoExistente={pedidoSeguro} menuHoy={menuHoy} manejarEliminar={manejarEliminar}
            onModificar={manejarModificarPedido} isDeadlinePassed={isDeadlinePassed} fechaBloqueada={fechaBloqueada}
            convenio={convenio} 
          />
        ) : (
          <>
            {/* 🔥 VISTA DE FIN DE SEMANA REDISEÑADA */}
            {esFinDeSemana ? (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col grow mb-4">
                
                {/* Cabecera Estilo "Entrada" */}
                <div className="border-b border-gray-200 pb-3 mb-4 flex flex-col items-center text-center">
                  <span className="text-xl font-black text-[#1d2d50] uppercase tracking-widest">Menú Fin de Semana</span>
                  <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Revisa WhatsApp o correo para ver el menú</span>
                </div>
                
                {modoEdicion && (
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <span className="font-black text-sm text-[#1d2d50] uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /> Modificando
                    </span>
                    <button onClick={() => setModoEdicion(false)} className="text-[11px] font-bold text-gray-400 uppercase bg-gray-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                      <X size={14} className="inline mr-1" /> Cancelar
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {/* Tarjetas de Opciones */}
                  {OPCIONES_FIN_DE_SEMANA.map(opcion => (
                    <button 
                      key={opcion.id}
                      onClick={() => setOpcionFinde(opcion.id === opcionFinde ? null : opcion.id)}
                      disabled={bloquearUI}
                      className={`flex items-center justify-between w-full px-5 py-5 rounded-3xl border transition-all ${opcionFinde === opcion.id ? 'border-[#70a344] bg-green-50 shadow-sm scale-[0.98]' : 'border-gray-200 bg-white shadow-sm hover:bg-gray-50'}`}
                    >
                      <div className="flex flex-col text-left">
                        <span className={`font-black text-[16px] uppercase tracking-widest ${opcionFinde === opcion.id ? 'text-[#70a344]' : 'text-[#1d2d50]'}`}>{opcion.nombre}</span>
                        <span className={`text-xs font-medium mt-1 pr-4 ${opcionFinde === opcion.id ? 'text-[#5a8335]' : 'text-gray-400'}`}>{opcion.descripcion}</span>
                      </div>
                      <div className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${opcionFinde === opcion.id ? 'bg-[#70a344] border-[#70a344]' : 'bg-transparent border-gray-300'}`}>
                        {opcionFinde === opcion.id && <Check size={18} strokeWidth={4} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

              </div>
            ) : (
              /* VISTA NORMAL (LUNES A VIERNES) */
              <>
                <div id="seccion-tabs" className="flex bg-white border border-gray-100 p-1.5 rounded-[20px] mb-6 shadow-sm shrink-0">
                  <button onClick={() => { setActiveTab('MENU_DIA'); if (!modoEdicion) { setTipoOtroSeleccionado(null); } }} className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'MENU_DIA' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}>Menú Día</button>
                  <button onClick={() => { setActiveTab('PERSONALIZADO'); if (!modoEdicion) { setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null, jugoId: null, isDoblePostre: false }); setTipoOtroSeleccionado(null); } }} className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'PERSONALIZADO' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}>Personalizado</button>
                  <button onClick={() => { setActiveTab('OTRO'); if (!modoEdicion) { setPedido({ entradasIds: [], fondoId: null, postreId: null, guarnicionId: null, canjeId: null, sandwichId: null, bebidaId: null, jugoId: null, isDoblePostre: false }); setTipoOtroSeleccionado(null); } }} className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'OTRO' ? 'bg-[#70a344] shadow-md text-white' : 'text-gray-400 bg-transparent'}`}>Otros</button>
                </div>

                {modoEdicion && (
                  <div className="flex justify-between items-center mb-2 px-2 shrink-0">
                    <span className="font-black text-sm text-[#1d2d50] uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /> Modificando</span>
                    <button onClick={() => setModoEdicion(false)} className="text-[11px] font-bold text-gray-400 uppercase bg-gray-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform"><X size={14} className="inline mr-1" /> Cancelar</button>
                  </div>
                )}
                
                {activeTab === 'MENU_DIA' && (
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col grow mb-4">
                    {menuHoy?.menuDia ? (
                      <>
                        <div className="space-y-4 text-left grow">
                          {[
                            { label: 'Entrada', plato: entradaMenuDiaPlato, categoriaKey: 'entradaId' as const },
                            { label: 'Fondo', plato: menuHoy.menuDia.fondo, categoriaKey: 'fondoId' as const },
                            { label: 'Postre', plato: menuHoy.menuDia.postre, categoriaKey: 'postreId' as const },
                          ].filter(({ plato }) => Boolean(plato)).map(({ label, plato, categoriaKey }) => (
                            <div key={label} className="space-y-3">
                              <div className="border-b border-gray-200 pb-3 mb-4"><span className="text-xl font-black text-[#1d2d50] uppercase tracking-widest">{label}</span></div>
                              <TarjetaPlato plato={plato} categoriaKey={categoriaKey as any} isSelected={false} hideSelectionIcon={true} readOnly={true} extraInfo={label === 'Fondo' && menuHoy.menuDia?.guarnicion ? `+ ${menuHoy.menuDia.guarnicion.nombre}` : undefined} isDeadlinePassed={true} grayTag={true} onSelect={() => {}} />
                            </div>
                          ))}
                          {incluidosPorConvenioMenuDia.length > 0 && (
                            <div className="mt-2 pt-4 border-t border-dashed border-gray-200">
                              <span className="text-xs font-black text-[#70a344] uppercase tracking-widest mb-0.5">INCLUIDO POR CONVENIO</span>
                              <p className="font-bold text-[#1d2d50] leading-tight mt-1 text-lg">
                                {incluidosPorConvenioMenuDia.join(' | ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-[10px] font-black uppercase tracking-widest mt-auto mb-auto text-center">Sin menú seleccionado para este día</div>
                    )}
                  </div>
                )}

                {activeTab === 'PERSONALIZADO' && (
                  <div className="flex flex-col gap-4 grow mb-4">
                    {categoriasPersonalizado.map((cat: string) => {
                      const categoriaFormato = cat as Categoria;
                      const isOpen = seccionAbierta === categoriaFormato;
                      const isHeaderSelected = cat === 'ENTRADA' ? pedido.entradasIds.length > 0 : pedido[(cat.toLowerCase() + 'Id') as 'fondoId' | 'postreId' | 'jugoId'] !== null;
                      
                      const platos = cat === 'JUGO'
                        ? (otrosPlatos || []).filter((p: any) => p?.categoria === 'JUGO' || p?.categoria === 'BEBIDA' || p?.categoria === 'AGUA_SABORIZADA')
                        : (menuHoy as any)?.[cat === 'ENTRADA' ? 'entradas' : cat === 'FONDO' ? 'fondos' : 'postres'] ?? [];

                      let isSeccionBloqueada = false;
                      let textoBloqueo = "";
                      
                      if (cat === 'ENTRADA' && penalizaEntradaPostre) { isSeccionBloqueada = true; textoBloqueo = "Reemplazado por Bebida/Agua"; } 
                      else if (cat === 'POSTRE' && penalizaEntradaPostre) { isSeccionBloqueada = true; textoBloqueo = "Reemplazado por Bebida/Agua"; } 
                      else if (cat === 'ENTRADA' && pedido.isDoblePostre) { isSeccionBloqueada = true; textoBloqueo = "Reemplazado por Doble Postre"; }

                      return (
                        <section key={cat} id={`seccion-${cat}`} className="flex flex-col grow overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm transition-all">
                          <button onClick={() => toggleSeccion(categoriaFormato)} className="w-full grow min-h-[100px] flex items-center justify-between px-7 py-4 sm:px-8">
                            <div className="flex items-center gap-4 sm:gap-5">
                              <div className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${isHeaderSelected ? 'bg-[#70a344] border-[#70a344]' : 'bg-transparent border-gray-300'} ${isSeccionBloqueada ? 'opacity-30' : ''}`}>
                                {isHeaderSelected && <Check size={18} strokeWidth={4} className="text-white" />}
                              </div>
                              <div className="flex flex-col text-left">
                                <h3 className={`text-xl font-black uppercase tracking-widest flex items-center gap-2 ${isSeccionBloqueada ? 'text-gray-300' : 'text-[#1d2d50]'}`}>
                                  {cat === 'JUGO' ? 'BEBESTIBLE' : cat}
                                  {cat === 'POSTRE' && pedido.isDoblePostre && !isSeccionBloqueada && (
                                    <span className="text-[#70a344] text-[14px] px-2 py-1 rounded-md font-black uppercase tracking-wider ml-1">X2 PORCIONES</span>
                                  )}
                                </h3>
                                {isSeccionBloqueada && <p className="text-[10px] font-black text-red-400 uppercase">{textoBloqueo}</p>}
                              </div>
                            </div>
                            <div className="shrink-0 ml-2">{isOpen ? <ChevronUp size={24} className="text-gray-300" /> : <ChevronDown size={24} className="text-gray-300" />}</div>
                          </button>

                          <div className={`shrink-0 flex flex-col transition-all duration-500 ${isOpen ? 'max-h-[8000px] opacity-100 px-6 pb-6 visible' : 'max-h-0 opacity-0 px-6 pb-0 invisible overflow-hidden'}`}>
                            <div className="w-full border-b border-gray-200 pb-3 mb-4" />
                            
                            <div className="flex flex-col gap-4">
                              {platos.map((plato: any) => {
                                const isPlatoSelected = cat === 'ENTRADA' ? pedido.entradasIds.includes(plato.id) : pedido[(cat.toLowerCase() + 'Id') as 'fondoId' | 'postreId' | 'jugoId'] === plato.id;
                                const nombre = String(plato?.nombre || '').toLowerCase();
                                const isDisabled = isSeccionBloqueada || (cat === 'ENTRADA' && isHipocalorico && !nombre.includes('sopa') && !nombre.includes('crema'));

                                return (
                                  <TarjetaPlato 
                                    key={plato.id} plato={plato} 
                                    categoriaKey={cat === 'ENTRADA' ? 'entradaId' as any : (cat.toLowerCase() + 'Id')} 
                                    isSelected={isPlatoSelected} 
                                    isDeadlinePassed={bloquearUI || isDisabled} 
                                    disabled={isDisabled} 
                                    onSelect={() => { 
                                      if (isDisabled) return;
                                      if (cat === 'ENTRADA') seleccionarEntrada(plato); 
                                      else seleccionarPlato((cat.toLowerCase() + 'Id') as 'fondoId' | 'postreId' | 'jugoId', plato.id); 
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'OTRO' && (
                  <div className="flex flex-col gap-2 relative grow mb-2">
                    <section className={`flex flex-col grow overflow-hidden rounded-3xl border transition-all duration-300 ${isPremiumSelected ? 'border-gray-100 bg-gray-50 opacity-60 grayscale pointer-events-none' : 'border-gray-100 bg-white shadow-sm'}`}>
                      <button onClick={() => handleSeleccionarTipoOtro('CANJE')} disabled={isPremiumSelected} className="w-full grow flex items-center justify-between px-7 py-4 sm:px-8">
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${isCanjeSelected ? 'bg-[#70a344] border-[#70a344]' : 'bg-transparent border-gray-300'}`}>
                            {isCanjeSelected && <Check size={18} strokeWidth={4} className="text-white" />}
                          </div>
                          <div className="flex flex-col text-left">
                            <h3 className={`text-xl font-black uppercase tracking-widest leading-tight ${isPremiumSelected ? 'text-gray-400' : 'text-[#1d2d50]'}`}>CANJE</h3>
                            <p className="text-gray-400 text-sm font-medium leading-none mt-0.5">Combo pre-elaborado.</p>
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">{isPremiumSelected ? <Lock size={24} className="text-gray-300" /> : isCanjeSelected ? <ChevronUp size={24} className="text-gray-300" /> : <ChevronDown size={24} className="text-gray-300" />}</div>
                      </button>
                      
                      <div className={`shrink-0 flex flex-col transition-all duration-500 ${isCanjeSelected ? 'max-h-[8000px] opacity-100 px-6 pb-6 visible' : 'max-h-0 opacity-0 px-6 pb-0 invisible overflow-hidden'}`}>
                        <div className="w-full border-b border-gray-200 pb-3 mb-4" />
                        <div className="flex flex-col gap-4">
                          {loadingOtros && <div className="text-center text-sm text-gray-400 py-2">Cargando opciones...</div>}
                          {!loadingOtros && (
                            <>
                              <h4 className="text-base font-black text-[#1d2d50] uppercase tracking-wider mb-2 ml-1 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">1</span> Elige tu Combo</h4>
                              {((otrosPlatos || []).filter(p => p?.categoria === 'CANJE').length === 0) ? (
                                <div className="text-center text-[10px] font-black uppercase text-gray-400 bg-gray-50 p-3 rounded-2xl">No hay opciones disponibles</div>
                              ) : (
                                (otrosPlatos || []).filter(p => p?.categoria === 'CANJE').map((plato: any) => (
                                  <TarjetaPlato key={plato.id} plato={plato} categoriaKey="canjeId" isSelected={pedido.canjeId === plato.id} isDeadlinePassed={bloquearUI} disabled={false} onSelect={() => seleccionarOtro('canjeId', plato.id)} />
                                ))
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className={`flex flex-col grow overflow-hidden rounded-3xl border transition-all duration-300 ${isCanjeSelected ? 'border-gray-100 bg-gray-50 opacity-60 grayscale pointer-events-none' : 'border-gray-100 bg-white shadow-sm'}`}>
                      <button onClick={() => handleSeleccionarTipoOtro('PREMIUM')} disabled={isCanjeSelected} className="w-full grow flex items-center justify-between px-7 py-4 sm:px-8">
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${isPremiumSelected ? 'bg-[#70a344] border-[#70a344]' : 'bg-transparent border-gray-300'}`}>
                            {isPremiumSelected && <Check size={18} strokeWidth={4} className="text-white" />}
                          </div>
                          <div className="flex flex-col text-left">
                            <h3 className={`text-xl font-black uppercase tracking-widest leading-tight ${isCanjeSelected ? 'text-gray-400' : 'text-[#1d2d50]'}`}>COLACIÓN PREMIUM</h3>
                            <p className="text-gray-400 text-sm font-medium leading-none mt-0.5">Sándwich a elección + Bebida.</p>
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">{isCanjeSelected ? <Lock size={24} className="text-gray-300" /> : isPremiumSelected ? <ChevronUp size={24} className="text-gray-300" /> : <ChevronDown size={24} className="text-gray-300" />}</div>
                      </button>

                      <div className={`shrink-0 transition-all duration-500 ${isPremiumSelected ? 'max-h-[8000px] opacity-100 px-6 pb-6 visible' : 'max-h-0 opacity-0 px-6 pb-0 invisible overflow-hidden'}`}>
                        <div className="flex flex-col gap-6">
                          <div className="w-full border-b border-gray-200 pb-3 mb-4" /> 
                          {loadingOtros && <div className="text-center text-sm text-gray-400 py-2">Cargando opciones...</div>}
                          {!loadingOtros && (
                          <>
                            <div>
                              <h4 className="text-base font-black text-[#1d2d50] uppercase tracking-wider mb-4 ml-1 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">1</span> Elige tu Sándwich</h4>
                              <div className="flex flex-col gap-3">
                                {((otrosPlatos || []).filter(p => p?.categoria === 'SANDWICH').length === 0) ? (
                                  <div className="text-center text-[10px] font-black uppercase text-gray-400 bg-gray-50 p-3 rounded-2xl">No hay opciones disponibles</div>
                                ) : (
                                  (otrosPlatos || []).filter(p => p?.categoria === 'SANDWICH').map((plato: any) => (
                                    <TarjetaPlato key={plato.id} plato={plato} categoriaKey="sandwichId" isSelected={pedido.sandwichId === plato.id} isDeadlinePassed={bloquearUI} disabled={false} onSelect={() => seleccionarOtro('sandwichId', plato.id)} />
                                  ))
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-base font-black text-[#1d2d50] uppercase tracking-wider mb-4 ml-1 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">2</span> Elige tu Bebida</h4>
                              <div className="flex flex-col gap-3">
                                {((otrosPlatos || []).filter(p => p?.categoria === 'BEBIDA' || p?.categoria === 'JUGO' || p?.categoria === 'AGUA_SABORIZADA').length === 0) ? (
                                  <div className="text-center text-[10px] font-black uppercase text-gray-400 bg-gray-50 p-3 rounded-2xl">No hay opciones disponibles</div>
                                ) : (
                                  (otrosPlatos || []).filter(p => p?.categoria === 'BEBIDA' || p?.categoria === 'JUGO' || p?.categoria === 'AGUA_SABORIZADA').map((plato: any) => (
                                    <TarjetaPlato key={plato.id} plato={plato} categoriaKey="bebidaId" isSelected={pedido.bebidaId === plato.id} isDeadlinePassed={bloquearUI} disabled={false} onSelect={() => seleccionarOtro('bebidaId', plato.id)} />
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
          </>
        )}
      </div>

      <BottomSheet open={sheetHipoOpen} title="Menú Hipocalórico" onClose={() => setSheetHipoOpen(false)}>
        <div className="px-6 pb-6 mt-2" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-medium text-gray-500 mb-4">Selecciona el acompañamiento de tu plato:</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setOpcionHipoSeleccionada('SOPA')} 
              className={`flex items-center justify-between w-full px-5 py-4 rounded-2xl border ${opcionHipoSeleccionada==='SOPA' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm text-[#1d2d50] uppercase">Sopa/Crema del día</span>
                <span className="text-xs text-gray-400 mt-1">Podrás elegir la sopa o crema de tu preferencia.</span>
              </div>
              <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${opcionHipoSeleccionada==='SOPA' ? 'border-green-500' : 'border-gray-300'}`}>{opcionHipoSeleccionada==='SOPA' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}</div>
            </button>

            <button 
              onClick={() => setOpcionHipoSeleccionada('DOBLE_POSTRE')} 
              className={`flex items-center justify-between w-full px-5 py-4 rounded-2xl border ${opcionHipoSeleccionada==='DOBLE_POSTRE' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm text-[#1d2d50] uppercase">Doble Postre</span>
                <span className="text-xs text-gray-400 mt-1">Sin entrada. Llevarás 2 porciones del postre que elijas.</span>
              </div>
              <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${opcionHipoSeleccionada==='DOBLE_POSTRE' ? 'border-green-500' : 'border-gray-300'}`}>{opcionHipoSeleccionada==='DOBLE_POSTRE' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}</div>
            </button>
          </div>
          
          <div className="flex flex-col gap-2 mt-8">
            <button 
              onClick={(e) => { 
                e.stopPropagation();
                
                setPedido(prev => {
                  const newState = {
                    ...prev,
                    fondoId: sheetFondo?.id,
                    guarnicionId: null
                  };

                  const sopasIds = (menuHoy?.entradas || []).filter((e:any) => {
                     const n = String(e?.nombre || '').toLowerCase();
                     return n.includes('sopa') || n.includes('crema'); 
                  }).map((e:any) => e.id);
                  newState.entradasIds = newState.entradasIds.filter(eId => sopasIds.includes(eId));

                  if (opcionHipoSeleccionada === 'SOPA') {
                    newState.isDoblePostre = false;
                  } else if (opcionHipoSeleccionada === 'DOBLE_POSTRE') {
                    newState.isDoblePostre = true;
                    newState.entradasIds = [];
                  }
                  return newState;
                });

                setSheetHipoOpen(false); 
                if (opcionHipoSeleccionada === 'SOPA') {
                  setTimeout(() => setSeccionAbierta('ENTRADA'), 400); 
                } else if (opcionHipoSeleccionada === 'DOBLE_POSTRE') {
                  setTimeout(() => setSeccionAbierta('POSTRE'), 400); 
                }
              }} 
              disabled={!opcionHipoSeleccionada} 
              className={`w-full py-4 rounded-xl font-black ${!opcionHipoSeleccionada ? 'bg-gray-100 text-gray-400' : 'bg-[#70a344] text-white shadow-md'}`}
            >
              Confirmar
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSheetHipoOpen(false); }} className="w-full py-3 font-bold text-gray-400">Cancelar</button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={sheetOpen} title="Elige una guarnición" onClose={() => setSheetOpen(false)}>
        <div className="px-2 pb-2 mt-2 px-6 pb-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-3">
            {(sheetFondo?.guarniciones || []).map((g: any) => (
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
            <button 
              onClick={(e) => { 
                e.stopPropagation();
                setPedido(prev => ({ 
                  ...prev, 
                  fondoId: sheetFondo?.id, 
                  guarnicionId: sheetSelectedGuarnicion,
                  isDoblePostre: false
                })); 
                setSheetOpen(false); 
                setTimeout(() => setSeccionAbierta('POSTRE'), 300); 
              }} 
              disabled={sheetSelectedGuarnicion===null} 
              className={`w-full py-4 rounded-xl font-black ${sheetSelectedGuarnicion===null ? 'bg-gray-100 text-gray-400' : 'bg-[#70a344] text-white shadow-md'}`}
            >
              Seleccionar
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSheetOpen(false); }} className="w-full py-3 font-bold text-gray-400">Cancelar</button>
          </div>
        </div>
      </BottomSheet>

      {!(cargandoVerificacion || cargandoMenu) && !bloquearUI && (!pedidoExistente || modoEdicion) && (
        <div 
          className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40"
          onClick={(e) => e.stopPropagation()}
        >
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