// Import dinámico de `xlsx` para ser compatible con entornos ESM/CJS usados por ts-node
let xlsx: any;

function normalizarFecha(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}
function serialExcelADate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const raw = new Date(utcDays * 86400 * 1000);
  return normalizarFecha(raw);
}
function parseFechaTexto(text: string): Date | null {
  try {
    const afterComma = text.includes(',') ? text.split(',').pop()!.trim() : text.trim();
    const cleaned = afterComma
      .normalize('NFD')
      .replace(/[,]/g, ' ')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
    const m = cleaned.match(/(\d{1,2})\s*(?:de\s*)?([a-zñ]+)\s*(?:de\s*)?(\d{4})/i);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const monthName = m[2].toLowerCase();
    const year = parseInt(m[3], 10);
    const meses = [
      'enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'
    ];
    const monthIndex = meses.indexOf(monthName);
    if (monthIndex === -1) return null;
    const dt = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
    return normalizarFecha(dt);
  } catch (e) { return null; }
}
function clasificarFila(etiqueta: string) {
  const label = etiqueta.toUpperCase().trim();
  if (label.includes('GUARNICION') || label.includes('GUARNICIÓN')) return { categoria: 'FONDO', variante: 'NORMAL', esGuarnicion: true, ignorar: false };
  if (label.startsWith('PROTEINA') || label.startsWith('PROTEÍNA')) return { categoria: 'FONDO', variante: 'NORMAL', esGuarnicion: false, ignorar: false };
  if (label === 'VEGANA') return { categoria: 'FONDO', variante: 'VEGANO', esGuarnicion: false, ignorar: false };
  if (label === 'VEGETARIANA') return { categoria: 'FONDO', variante: 'VEGETARIANO', esGuarnicion: false, ignorar: false };
  if (label.includes('HIPOCALORICO') || label.includes('HIPOCALÓRICO')) return { categoria: 'FONDO', variante: 'HIPOCALORICO', esGuarnicion: false, ignorar: false };
  if (label.includes('ENSALADA') || label.includes('SOPA')) return { categoria: 'ENTRADA', variante: 'NORMAL', esGuarnicion: false, ignorar: false };
  if (label.includes('POSTRE')) return { categoria: 'POSTRE', variante: 'NORMAL', esGuarnicion: false, ignorar: false };
  return { categoria: 'ENTRADA', variante: 'NORMAL', esGuarnicion: false, ignorar: true };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Usage: ts-node debug-parse-minuta.ts <path-to-xlsx>');
    process.exit(1);
  }
  const path = args[0];
  // Cargar xlsx dinámicamente y soportar tanto export default como named
  if (!xlsx) {
    const mod = await import('xlsx');
    xlsx = (mod && (mod.default ?? mod));
  }
  const workbook = xlsx.readFile(path, { cellDates: true });
  const sheetName = workbook.SheetNames.find((name: string) => name.trim().toUpperCase() === 'MINUTA');
  if (!sheetName) { console.error('No sheet MINUTA'); process.exit(1); }
  const worksheet = workbook.Sheets[sheetName];
  const data: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  // detect fecha row
  let filaFechas: any[] | undefined; let filaIndexFechas = -1;
  const maxRowToScan = Math.min(12, data.length);
  for (let r=0;r<maxRowToScan;r++){
    const row = data[r]; if(!row) continue; let validCount=0;
    for(let col=2;col<=6;col++){ const v = row[col]; if (v instanceof Date) validCount++; else if (typeof v==='number' && !Number.isNaN(v)) validCount++; else if (typeof v==='string' && parseFechaTexto(v)) validCount++; }
    if (validCount>=3){ filaFechas=row; filaIndexFechas=r; break; }
  }
  console.log('filaIndexFechas=', filaIndexFechas);
  console.log('filaFechas slice=', (filaFechas||[]).slice(0,10));

  const fechasPorColumna: Record<number, Date | undefined> = {};
  for(let col=2;col<=6;col++){
    const valorFecha = filaFechas?.[col];
    if (valorFecha instanceof Date) fechasPorColumna[col] = normalizarFecha(valorFecha);
    else if (typeof valorFecha === 'number') fechasPorColumna[col] = serialExcelADate(valorFecha);
    else if (typeof valorFecha === 'string'){ const raw = valorFecha.trim(); fechasPorColumna[col] = raw===''? undefined: (parseFechaTexto(valorFecha) ?? undefined); }
    else fechasPorColumna[col] = undefined;
  }
  console.log('fechasPorColumna initial=', fechasPorColumna);

  const known: number[] = []; for(let col=2;col<=6;col++) if (fechasPorColumna[col]) known.push(col);
  console.log('knownIndices=', known);

  for(let col=2;col<=6;col++){
    if (fechasPorColumna[col]) continue;
    let nearest: number|null = null; let minDist = Infinity;
    for(const k of known){ const dist = Math.abs(k-col); if(dist<minDist){minDist=dist; nearest=k;} }
    if (nearest===null) continue;
    const base = fechasPorColumna[nearest]!; const dayOffset = col - nearest;
    const filled = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()+dayOffset, 12,0,0));
    fechasPorColumna[col] = normalizarFecha(filled);
  }
  console.log('fechasPorColumna filled=', Object.fromEntries(Object.entries(fechasPorColumna).map(([k,v])=>[k, v? (v as Date).toISOString().split('T')[0]:null])));

  // find startRow
  let startRow = Math.max(4, filaIndexFechas + 1);
  for (let r = startRow; r < Math.min(data.length, startRow + 6); r++) {
    const maybeLabel = data[r]?.[1];
    if (typeof maybeLabel === 'string' && maybeLabel.trim() !== '') { startRow = r; break; }
  }
  console.log('startRow=', startRow);

  // print sampleLabels
  const sampleLabels: any[] = [];
  for (let r = startRow; r < Math.min(data.length, startRow + 10); r++) sampleLabels.push({ row: r, label: data[r]?.[1] ?? null });
  console.log('sampleLabels=', sampleLabels);

  // For each col, list first 12 non-empty entries with categoria
  for (let col=2; col<=6; col++){
    console.log('\n--- Column', col, 'date=', fechasPorColumna[col] ? (fechasPorColumna[col] as Date).toISOString().split('T')[0] : 'null');
    let printed = 0;
    for (let r = startRow; r < data.length && printed < 12; r++){
      const etiqueta = data[r]?.[1]; const valor = data[r]?.[col];
      if (!etiqueta || typeof etiqueta !== 'string') continue;
      if (!valor || valor.toString().trim() === '') continue;
      const cls = clasificarFila(etiqueta);
      console.log(`row=${r} etiqueta="${etiqueta}" valor="${valor}" -> ${JSON.stringify(cls)}`);
      printed++;
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
