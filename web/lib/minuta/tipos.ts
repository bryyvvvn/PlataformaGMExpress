import type { CategoriaPlato, VarianteMenu } from "@prisma/client";

export type FilaMinutaExcel = unknown[];

export type ClasificacionFila = {
  categoria: CategoriaPlato;
  variante: VarianteMenu;
  esGuarnicion: boolean;
  ignorar: boolean;
};

export type PlatoMinutaParseado = {
  nombre: string;
  categoria: CategoriaPlato;
  variante: VarianteMenu;
};

export type DiaMinutaParseado = {
  col: number;
  fecha: Date;
  diaNombre: string;
  guarniciones: string[];
  platos: PlatoMinutaParseado[];
};

export type MinutaExcelParseada = {
  fechaInicio: Date;
  fechaFin: Date;
  dias: DiaMinutaParseado[];
};

export type ParsearMinutaExcelResult =
  | { ok: true; minuta: MinutaExcelParseada }
  | { ok: false; error: string; logContext?: unknown };
