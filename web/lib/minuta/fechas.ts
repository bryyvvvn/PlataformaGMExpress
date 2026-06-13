export function normalizarFecha(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

export function serialExcelADate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const raw = new Date(utcDays * 86400 * 1000);
  return normalizarFecha(raw);
}

export function parseFechaTexto(text: string): Date | null {
  try {
    const afterComma = text.includes(",") ? text.split(",").pop()!.trim() : text.trim();

    const cleaned = afterComma
      .normalize("NFD")
      .replace(/[,]/g, " ")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase();

    const m = cleaned.match(/(\d{1,2})\s*(?:de\s*)?([a-z\u00f1]+)\s*(?:de\s*)?(\d{4})/i);
    if (!m) return null;

    const day = parseInt(m[1], 10);
    const monthName = m[2].toLowerCase();
    const year = parseInt(m[3], 10);

    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const monthIndex = meses.indexOf(monthName);
    if (monthIndex === -1) return null;

    const dt = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
    return normalizarFecha(dt);
  } catch {
    return null;
  }
}

export function getDiaSemana(fecha: Date): string {
  const dias = ["Domingo", "Lunes", "Martes", "Mi\u00e9rcoles", "Jueves", "Viernes", "S\u00e1bado"];
  return dias[fecha.getUTCDay()];
}
