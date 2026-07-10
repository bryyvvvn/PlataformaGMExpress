import { useCallback } from "react";
import {
  esEntradaSopa,
  obtenerEntradasEnsalada,
  type DraftMenuDia,
  type ModalidadHipocalorica,
  type PlatoMenuDia,
} from "@/hooks/usePlanificador";

type ActualizarDraft = (fecha: string, cambios: Partial<DraftMenuDia>) => void;

export function useMenuDiaSeleccion(actualizarDraft: ActualizarDraft) {
  const actualizarEntradaDraft = useCallback(
    (fecha: string, draftEntradaIds: number[], item: PlatoMenuDia, entradas: PlatoMenuDia[]) => {
      const seleccionada = draftEntradaIds.includes(item.detalleId);
      const itemEsSopa = esEntradaSopa(item);
      const entradasSinSopa = draftEntradaIds.filter((id) => {
        const entrada = entradas.find((opcion) => opcion.detalleId === id);
        return entrada && !esEntradaSopa(entrada);
      });
      const siguiente = seleccionada
        ? draftEntradaIds.filter((id) => id !== item.detalleId)
        : itemEsSopa
          ? [item.detalleId]
          : entradasSinSopa.length >= 3
            ? entradasSinSopa
            : [...entradasSinSopa, item.detalleId];

      actualizarDraft(fecha, {
        entradaId: siguiente[0] ?? null,
        entradasIds: siguiente,
      });
    },
    [actualizarDraft]
  );

  const seleccionarEnsaladaSurtida = useCallback(
    (fecha: string, entradas: PlatoMenuDia[]) => {
      const entradasIds = obtenerEntradasEnsalada(entradas)
        .slice(0, 3)
        .map((entrada) => entrada.detalleId);

      actualizarDraft(fecha, {
        entradaId: entradasIds[0] ?? null,
        entradasIds,
      });
    },
    [actualizarDraft]
  );

  const seleccionarFondoDraft = useCallback(
    (fecha: string, item: PlatoMenuDia) => {
      actualizarDraft(fecha, {
        fondoId: item.detalleId,
        guarnicionId: null,
        modalidadHipocalorica: null,
      });
    },
    [actualizarDraft]
  );

  const seleccionarModalidadHipocalorica = useCallback(
    (
      fecha: string,
      modalidad: ModalidadHipocalorica,
      draftEntradaIds: number[],
      entradas: PlatoMenuDia[]
    ) => {
      if (modalidad === "SOPA_CREMA") {
        const primeraSopa = draftEntradaIds
          .map((id) => entradas.find((entrada) => entrada.detalleId === id))
          .find((entrada): entrada is PlatoMenuDia => entrada !== undefined && esEntradaSopa(entrada));
        const sopaDisponible = primeraSopa ?? entradas.find(esEntradaSopa);
        const entradasIds = sopaDisponible ? [sopaDisponible.detalleId] : [];

        actualizarDraft(fecha, {
          modalidadHipocalorica: modalidad,
          entradaId: entradasIds[0] ?? null,
          entradasIds,
          guarnicionId: null,
        });
        return;
      }

      actualizarDraft(fecha, {
        modalidadHipocalorica: modalidad,
        entradaId: null,
        entradasIds: [],
        guarnicionId: null,
      });
    },
    [actualizarDraft]
  );

  return {
    actualizarEntradaDraft,
    seleccionarEnsaladaSurtida,
    seleccionarFondoDraft,
    seleccionarModalidadHipocalorica,
  };
}
