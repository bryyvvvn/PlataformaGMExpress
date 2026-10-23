import type { ClasificacionFila } from "./tipos";

export function clasificarFila(etiqueta: string): ClasificacionFila {
  const label = etiqueta.toUpperCase().trim().replace(/\s+/g, " ");
  const labelSinEspacios = label.replace(/\s+/g, "");

  if (label.includes("GUARNICION") || label.includes("GUARNICI\u00d3N")) {
    return { categoria: "FONDO", variante: "NORMAL", esGuarnicion: true, ignorar: false };
  }

  if (label.startsWith("PROTEINA") || label.startsWith("PROTE\u00cdNA")) {
    return { categoria: "FONDO", variante: "NORMAL", esGuarnicion: false, ignorar: false };
  }

  if (label === "VEGANA") {
    return { categoria: "FONDO", variante: "VEGANO", esGuarnicion: false, ignorar: false };
  }

  if (label === "VEGETARIANA") {
    return { categoria: "FONDO", variante: "VEGETARIANO", esGuarnicion: false, ignorar: false };
  }

  if (label.includes("HIPOCALORICO") || label.includes("HIPOCAL\u00d3RICO")) {
    return { categoria: "FONDO", variante: "HIPOCALORICO", esGuarnicion: false, ignorar: false };
  }

  if (label.includes("ENSALADA") || label.includes("SOPA") || label.includes("CREMA")) {
    return { categoria: "ENTRADA", variante: "NORMAL", esGuarnicion: false, ignorar: false };
  }

  if (label === "POSTRE" || labelSinEspacios === "POSTRE1" || labelSinEspacios === "POSTRE2") {
    return { categoria: "POSTRE", variante: "NORMAL", esGuarnicion: false, ignorar: false };
  }

  return { categoria: "ENTRADA", variante: "NORMAL", esGuarnicion: false, ignorar: true };
}

export function normalizarContenidoPostre(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}
