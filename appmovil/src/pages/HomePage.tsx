import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Menu, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../constants/theme';
import { useUser } from '@clerk/clerk-react';
import { TarjetaPlato } from '../components/TarjetaPlato';
import { BottomSheet } from '../components/BottomSheet';
import { useCountdown } from '../hooks/useCountdown';
import { useMenuAPI } from '../hooks/useMenuAPI';
import { usePedidos } from '../hooks/usePedidos';
import { useCalendario } from '../hooks/useCalendario';
import { Sidebar } from '../components/Sidebar';
 
type Categoria = 'ENTRADA' | 'FONDO' | 'POSTRE' | null;
 
const HomePage: React.FC = () => {
  const { user } = useUser();
  const nombreUsuario = user?.firstName || user?.username || 'Usuario';
 
  // ── Calendario ────────────────────────────────────────────────────────────
  const {
    setSemanaOffset,
    fechaTexto,
    diasSemanaArray,
    getSemanaTexto,
    diaSeleccionadoIdx,
    setDiaSeleccionadoIdx,
    fechaSeleccionadaISO,
  } = useCalendario();
 
  // ── Estado del pedido ─────────────────────────────────────────────────────
  const [pedido, setPedido] = useState({
    entradaId:    null as number | null,
    fondoId:      null as number | null,
    postreId:     null as number | null,
    guarnicionId: null as number | null,
  });
 
  // ── BottomSheet de guarniciones ───────────────────────────────────────────
  const [sheetOpen,               setSheetOpen]               = useState(false);
  const [sheetFondo,              setSheetFondo]              = useState<any | null>(null);
  const [sheetSelectedGuarnicion, setSheetSelectedGuarnicion] = useState<number | null>(null);
 
  const [isMenuOpen,     setIsMenuOpen]     = useState(false);
  const [seccionAbierta, setSeccionAbierta] = useState<Categoria>(null);
 
  // ── Hooks de negocio ──────────────────────────────────────────────────────
  const { timeRemaining, isDeadlinePassed } = useCountdown(DEADLINE_HOUR);
  const { menuHoy, cargando: cargandoMenu } = useMenuAPI(fechaSeleccionadaISO);
  const {
    yaPedioHoy,
    pedidoExistente,
    cargandoVerificacion,
    enviarPedido,
    enviando,
  } = usePedidos(user?.id, fechaSeleccionadaISO);
 
  // ── Derivados ─────────────────────────────────────────────────────────────
  const isSelectedDateToday  = diasSemanaArray[diaSeleccionadoIdx]?.esHoy ?? false;
  const bloquearUI           = isSelectedDateToday && isDeadlinePassed;
  const fondoObj             = (menuHoy.fondos || []).find((p: any) => p.id === pedido.fondoId);
  const fondoNeedsGuarnicion = Boolean(fondoObj && (fondoObj.guarniciones || []).length > 0);
  const estaCompleto         = Boolean(
    pedido.entradaId &&
    pedido.fondoId   &&
    pedido.postreId  &&
    (!fondoNeedsGuarnicion || pedido.guarnicionId !== null)
  );
 
  // ── Efectos ───────────────────────────────────────────────────────────────
 
  useEffect(() => {
    setPedido({ entradaId: null, fondoId: null, postreId: null, guarnicionId: null });
    setSeccionAbierta(null);
  }, [fechaSeleccionadaISO]);
 
  useEffect(() => {
    if (!cargandoMenu && !bloquearUI) {
      setSeccionAbierta('ENTRADA');
    } else {
      setSeccionAbierta(null);
    }
  }, [cargandoMenu, bloquearUI]);
 
  // ── Handlers ──────────────────────────────────────────────────────────────
 
  const toggleSeccion = (cat: Categoria) =>
    setSeccionAbierta(prev => (prev === cat ? null : cat));
 
  const manejarEnvio = async () => {
    const exito = await enviarPedido(pedido);
    if (exito) setSeccionAbierta(null);
  };
 
  const seleccionarPlato = (
    categoria: 'entradaId' | 'fondoId' | 'postreId',
    id: number
  ) => {
    if (isSelectedDateToday && isDeadlinePassed) return;
 
    if (categoria === 'fondoId') {
      const seleccionado = (menuHoy.fondos || []).find((p: any) => p.id === id);
      if (seleccionado?.guarniciones?.length > 0) {
        setSheetFondo(seleccionado);
        setSheetSelectedGuarnicion(null);
        setSheetOpen(true);
        return;
      }
    }
 
    setPedido(prev => {
      const next = { ...prev, [categoria]: prev[categoria] === id ? null : id } as typeof prev;
      if (categoria === 'fondoId' && prev.fondoId !== id) next.guarnicionId = null;
      return next;
    });
 
    if (categoria === 'entradaId') setTimeout(() => setSeccionAbierta('FONDO'),  400);
    if (categoria === 'fondoId')   setTimeout(() => setSeccionAbierta('POSTRE'), 400);
  };
 
  const seleccionarDia = (index: number) => {
    if (diaSeleccionadoIdx === index) return;
    setDiaSeleccionadoIdx(index);
  };
 
  // ── Loading inicial ───────────────────────────────────────────────────────
  if (cargandoVerificacion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-[#70a344] rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest text-center">
          Verificando...
        </p>
      </div>
    );
  }
 
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen pb-40"
      style={{ backgroundColor: THEME.colors.background }}
      onClick={() => setSeccionAbierta(null)}
    >
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
 
      {/* HEADER */}
      <div
        className="pt-5 pb-3 flex justify-between items-center px-6"
        style={{ backgroundColor: THEME.colors.secondary }}
        onClick={e => e.stopPropagation()}
      >
        <h1 className="text-[24px] font-black italic tracking-tighter text-white m-0 leading-none">
          GM <span style={{ color: THEME.colors.primary }}>EXPRESS</span>
        </h1>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 text-white active:scale-90 transition-transform"
        >
          <Menu size={24} />
        </button>
      </div>
 
      <div className="h-1 w-full" style={{ backgroundColor: THEME.colors.primary }} />
 
      {/* SALUDO Y FECHA */}
      <div
        className="px-6 pt-7 pb-10 text-white rounded-b-[40px] shadow-lg"
        style={{ backgroundColor: THEME.colors.secondary }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold opacity-95 leading-none">Hola, {nombreUsuario}</h2>
        <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest">
          {fechaTexto}
        </p>
      </div>
 
      {/* TIMER CARD */}
      <div
        className="mx-6 -mt-8 p-5 rounded-3xl shadow-2xl bg-white border-b-4 transition-all"
        style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDeadlinePassed ? 'bg-red-50' : 'bg-green-50'}`}>
            <Clock size={24} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">
              Límite para pedir
            </p>
            <p
              className="text-2xl font-black tracking-tight leading-none"
              style={{ color: THEME.colors.secondary }}
            >
              {isDeadlinePassed ? 'CERRADO' : timeRemaining}
            </p>
          </div>
        </div>
      </div>
 
      {/* NAVEGACIÓN DE SEMANAS */}
      <div className="mt-10 px-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSemanaOffset(-1)}
            className="p-2 bg-white rounded-xl shadow-sm text-[#1d2d50] active:scale-90 transition-transform border border-gray-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1d2d50] opacity-60">
            {getSemanaTexto()}
          </span>
          <button
            onClick={() => setSemanaOffset(1)}
            className="p-2 bg-white rounded-xl shadow-sm text-[#1d2d50] active:scale-90 transition-transform border border-gray-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
 
        {/* CALENDARIO DE DÍAS */}
        <div className="flex justify-between items-center">
          {diasSemanaArray.map((dia, index) => (
            <button
              key={index}
              onClick={() => seleccionarDia(index)}
              className={[
                'flex flex-col items-center justify-center w-[17%] aspect-square rounded-[20px] bg-white transition-all active:scale-95',
                dia.esSeleccionado
                  ? 'border-2 scale-110 shadow-md'
                  : dia.esHoy
                  ? 'border border-gray-200 shadow-sm opacity-70'
                  : 'opacity-40',
              ].join(' ')}
              style={dia.esSeleccionado ? { borderColor: THEME.colors.primary } : {}}
            >
              <span className="text-[10px] font-black mb-1 text-gray-400 uppercase">
                {dia.letra}
              </span>
              <span
                className="text-lg font-black"
                style={{ color: dia.esSeleccionado ? THEME.colors.primary : '#1d2d50' }}
              >
                {dia.numero}
              </span>
            </button>
          ))}
        </div>
      </div>
 
      {/* LISTADO DE PLATOS */}
      <div
        className={`mt-10 px-6 space-y-4 ${bloquearUI ? 'opacity-40 grayscale pointer-events-none' : ''}`}
      >
        {cargandoMenu ? (
          <div className="py-16 flex flex-col items-center opacity-30">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#70a344] rounded-full animate-spin mb-3" />
            <p className="font-black text-[10px] uppercase tracking-widest">Cargando menú...</p>
          </div>
        ) : (
          <>
            {/* Banner de pedido existente */}
            {pedidoExistente && (
              <div className="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-black text-sm">Pedido realizado</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {pedidoExistente.resumen.map((r: any) => r.nombre).join(' • ')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const entrada = pedidoExistente.resumen.find((r: any) => r.categoria === 'ENTRADA');
                      const fondo   = pedidoExistente.resumen.find((r: any) => r.categoria === 'FONDO');
                      const postre  = pedidoExistente.resumen.find((r: any) => r.categoria === 'POSTRE');
                      setPedido({
                        entradaId:    entrada?.platoId    ?? null,
                        fondoId:      fondo?.platoId      ?? null,
                        postreId:     postre?.platoId     ?? null,
                        guarnicionId: fondo?.guarnicionId ?? null,
                      });
                      setSeccionAbierta('ENTRADA');
                    }}
                    disabled={isDeadlinePassed}
                    className={`px-3 py-2 rounded-lg font-bold text-sm ${
                      isDeadlinePassed
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {isDeadlinePassed ? 'Modificación cerrada' : 'Modificar pedido'}
                  </button>
                </div>
              </div>
            )}
 
            {/* Secciones de platos: ENTRADA → FONDO → POSTRE */}
            {(['ENTRADA', 'FONDO', 'POSTRE'] as const).map(cat => {
              const key      = cat === 'ENTRADA' ? 'entradas' : cat === 'FONDO' ? 'fondos' : 'postres';
              const stateKey = (cat.toLowerCase() + 'Id') as 'entradaId' | 'fondoId' | 'postreId';
              const isOpen     = seccionAbierta === cat;
              const isSelected = pedido[stateKey] !== null;
              const platos     = menuHoy[key] ?? [];
 
              return (
                <section
                  key={cat}
                  className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm transition-all"
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
                          isDeadlinePassed={isDeadlinePassed && isSelectedDateToday}
                          onSelect={seleccionarPlato}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </>
          // ↑ </> cierra el fragmento del bloque else del ternario.
          //   Sin este cierre, oxc lanza "Expected } but found )"
        )}
      </div>
 
      {/* BOTTOM SHEET — selección de guarnición */}
      {sheetFondo && (
        <BottomSheet
          open={sheetOpen}
          title={`Guarniciones — ${sheetFondo.nombre}`}
          onClose={() => setSheetOpen(false)}
        >
          <div className="px-2">
            <div className="flex gap-2 flex-wrap">
              {(sheetFondo.guarniciones || []).map((g: any) => (
                <button
                  key={g.id}
                  onClick={() => setSheetSelectedGuarnicion(prev => prev === g.id ? null : g.id)}
                  className={`px-4 py-3 rounded-xl border text-sm font-bold ${
                    sheetSelectedGuarnicion === g.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  {g.nombre}
                </button>
              ))}
              <button
                onClick={() => setSheetSelectedGuarnicion(prev => prev === -1 ? null : -1)}
                className={`px-4 py-3 rounded-xl border text-sm font-bold ${
                  sheetSelectedGuarnicion === -1
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                Sin guarnición
              </button>
            </div>
 
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSheetOpen(false)}
                className="px-4 py-3 rounded-xl border bg-white text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setPedido(prev => ({
                    ...prev,
                    fondoId:      sheetFondo.id,
                    guarnicionId: sheetSelectedGuarnicion,
                  }));
                  setSheetOpen(false);
                  setTimeout(() => setSeccionAbierta('POSTRE'), 300);
                }}
                disabled={sheetSelectedGuarnicion === null}
                className={`px-4 py-3 rounded-xl font-black ${
                  sheetSelectedGuarnicion === null
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-green-600 text-white'
                }`}
              >
                Seleccionar
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
 
      {/* BOTÓN FLOTANTE */}
      {!bloquearUI && (
        <div
          className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={manejarEnvio}
            disabled={!estaCompleto || bloquearUI || enviando}
            className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 ${
              estaCompleto && !bloquearUI
                ? 'text-white shadow-2xl'
                : 'bg-gray-100 text-gray-400'
            }`}
            style={estaCompleto && !bloquearUI ? { backgroundColor: THEME.colors.primary } : {}}
          >
            {enviando
              ? 'Enviando...'
              : bloquearUI
              ? 'Horario Finalizado'
              : estaCompleto
              ? (pedidoExistente ? 'Modificar Pedido' : 'Confirmar Pedido')
              : 'Faltan opciones'}
          </button>
        </div>
      )}
    </div>
  );
};
 
export default HomePage;