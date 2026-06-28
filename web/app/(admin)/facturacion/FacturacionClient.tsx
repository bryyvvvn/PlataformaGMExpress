"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarRange,
  Download,
  FileSpreadsheet,
  Loader2,
  Receipt,
} from "lucide-react";
import type { Borders, Fill } from "exceljs";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nowChile } from "@/lib/chile-time";
import { obtenerResumenFacturacion, type ResumenFacturacion } from "./actions";

type EmpresaOption = {
  id: number;
  nombre: string;
};

type GuardarArchivoExcel = (data: Blob, filename?: string) => void;

type FileSaverModule = {
  saveAs?: GuardarArchivoExcel;
  default?:
    | GuardarArchivoExcel
    | {
        saveAs?: GuardarArchivoExcel;
      };
};

const RANGOS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "15", label: "Últimos 15 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "custom", label: "Rango Personalizado" },
];

const RESUMEN_VACIO: ResumenFacturacion = {
  totalPedidos: 0,
  tabla: [],
};

const HEADER_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1B2C56" },
};

const BORDE_NEGRO: Partial<Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

function restarDiasISO(fechaISO: string, dias: number): string {
  const fecha = new Date(`${fechaISO}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() - dias);
  return fecha.toISOString().slice(0, 10);
}

export function FacturacionClient({ empresas }: { empresas: EmpresaOption[] }) {
  const [empresaId, setEmpresaId] = useState<string>("");
  const [rango, setRango] = useState<string>("7");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [resumen, setResumen] = useState<ResumenFacturacion>(RESUMEN_VACIO);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const rangoFechas = useMemo(() => {
    if (rango === "custom") {
      return { inicio: fechaInicio, fin: fechaFin };
    }
    const hoy = nowChile().iso;
    return { inicio: restarDiasISO(hoy, Number(rango) - 1), fin: hoy };
  }, [rango, fechaInicio, fechaFin]);

  useEffect(() => {
    const { inicio, fin } = rangoFechas;
    let cancelado = false;

    const cargarResumen = async () => {
      if (!empresaId || !inicio || !fin || inicio > fin) {
        setResumen(RESUMEN_VACIO);
        return;
      }

      setLoadingDatos(true);
      try {
        const data = await obtenerResumenFacturacion(
          Number(empresaId),
          inicio,
          fin,
        );
        if (!cancelado) setResumen(data);
      } catch (error) {
        console.error("Error al obtener el resumen de facturación:", error);
        if (!cancelado) setResumen(RESUMEN_VACIO);
      } finally {
        if (!cancelado) setLoadingDatos(false);
      }
    };

    void cargarResumen();

    return () => {
      cancelado = true;
    };
  }, [empresaId, rangoFechas]);

  const exportarExcel = async () => {
    if (resumen.tabla.length === 0) return;

    setLoadingExcel(true);
    try {
      const [excelModule, fileSaverModule] = await Promise.all([
        import("exceljs"),
        import("file-saver") as Promise<FileSaverModule>,
      ]);
      const { Workbook } = excelModule;
      const saveAs =
        fileSaverModule.saveAs ??
        (typeof fileSaverModule.default === "function"
          ? fileSaverModule.default
          : fileSaverModule.default?.saveAs);

      if (typeof saveAs !== "function") {
        throw new Error("No se pudo cargar la función saveAs de file-saver.");
      }

      const empresaSeleccionada =
        empresas.find((e) => String(e.id) === empresaId)?.nombre ?? "Empresa";

      const workbook = new Workbook();
      const sheet = workbook.addWorksheet("Facturación");

      sheet.columns = [
        { header: "Fecha de Operación", key: "fecha", width: 22 },
        { header: "Cantidad de Pedidos", key: "pedidos", width: 22 },
      ];

      for (const fila of resumen.tabla) {
        sheet.addRow({ fecha: fila.fecha, pedidos: fila.pedidos });
      }
      sheet.addRow({
        fecha: "Total Consolidado",
        pedidos: resumen.totalPedidos,
      });

      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = BORDE_NEGRO;
          if (rowNumber === 1) {
            cell.fill = HEADER_FILL;
            cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `Facturacion_${empresaSeleccionada.replace(/\s+/g, "_")}_${rango}dias.xlsx`,
      );
    } catch (error) {
      console.error("Error al exportar Excel:", error);
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header Corporativo */}
      <header className="border-b border-slate-200 pb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#1B2C56]"></span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Gestión Administrativa
            </p>
          </div>
          <h1 className="text-2xl font-bold text-[#1B2C56] tracking-tight">
            Facturación y Reportes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualiza y exporta los resúmenes de pedidos por empresa y rango de
            fechas.
          </p>
        </div>
        <Button
          onClick={exportarExcel}
          disabled={!empresaId || loadingExcel || resumen.tabla.length === 0}
          className="bg-[#75AA46] text-white shadow-sm hover:bg-[#5d8a38] font-semibold h-10 px-5 transition-all"
        >
          {loadingExcel ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Exportar Planilla Excel
            </>
          )}
        </Button>
      </header>

      {/* Tarjeta de Filtros */}
      <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-visible relative z-10">
        <CardContent className="p-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Selector de Empresa */}
            <div className="space-y-1.5">
              <Label
                htmlFor="select-empresa"
                className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"
              >
                <Building2 className="h-3 w-3" /> Empresa Cliente
              </Label>
              <Select
                value={empresaId}
                onValueChange={(value) => {
                  if (value) setEmpresaId(value);
                }}
              >
                <SelectTrigger
                  id="select-empresa"
                  className="w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors h-10"
                >
                  <SelectValue placeholder="Seleccione una empresa...">
                    {(value: string) =>
                      empresas.find((emp) => String(emp.id) === value)
                        ?.nombre ?? "Seleccione una empresa..."
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  sideOffset={4}
                  alignItemWithTrigger={false}
                  className="z-50 w-[var(--radix-select-trigger-width)] max-h-60 overflow-y-auto bg-white border-slate-200 shadow-md"
                >
                  {empresas.map((emp) => (
                    <SelectItem
                      key={emp.id}
                      value={String(emp.id)}
                      className="cursor-pointer"
                    >
                      {emp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Rango */}
            <div className="space-y-1.5">
              <Label
                htmlFor="select-rango"
                className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"
              >
                <CalendarRange className="h-3 w-3" /> Rango de Tiempo
              </Label>
              <Select
                value={rango}
                onValueChange={(value) => {
                  if (value) setRango(value);
                }}
              >
                <SelectTrigger
                  id="select-rango"
                  className="w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors h-10"
                >
                  <SelectValue placeholder="Seleccione un rango">
                    {(value: string) =>
                      RANGOS.find((opcion) => opcion.value === value)?.label ??
                      "Seleccione un rango"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  sideOffset={4}
                  alignItemWithTrigger={false}
                  className="z-50 w-[var(--radix-select-trigger-width)] bg-white border-slate-200 shadow-md"
                >
                  {RANGOS.map((opcion) => (
                    <SelectItem
                      key={opcion.value}
                      value={opcion.value}
                      className="cursor-pointer"
                    >
                      {opcion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Inputs de Rango Personalizado */}
            {rango === "custom" && (
              <>
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-200">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Fecha Inicio
                  </Label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="h-10 bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-200">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Fecha Fin
                  </Label>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="h-10 bg-slate-50 border-slate-200"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mensaje si no hay empresa seleccionada */}
      {!empresaId ? (
        <Card className="rounded-md border border-dashed border-slate-300 bg-slate-50 shadow-sm mt-6">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center">
            <FileSpreadsheet className="size-10 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-600">
              Ninguna empresa seleccionada
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Seleccione un cliente en la parte superior para cargar sus datos
              de facturación.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Tarjeta de Resumen KPI */}
          <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col sm:max-w-xs">
            <div className="h-1 w-full bg-[#1B2C56]"></div>
            <CardContent className="flex-1 p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Cantidad de Pedidos
                </p>
                <p className="text-3xl font-bold text-[#1B2C56]">
                  {resumen.totalPedidos}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#1B2C56]/10">
                <Receipt className="size-6 text-[#1B2C56]" />
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Detalle */}
          <Card className="overflow-hidden rounded-md border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
              <p className="text-xs font-bold text-[#1B2C56] uppercase tracking-wider">
                Desglose de Operaciones
              </p>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 hover:bg-transparent">
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Fecha de Operación
                    </TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">
                      Cantidad de Pedidos
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDatos ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={2}
                        className="py-10 text-center text-sm text-slate-500"
                      >
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                        Cargando datos...
                      </TableCell>
                    </TableRow>
                  ) : resumen.tabla.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={2}
                        className="py-10 text-center text-sm text-slate-500"
                      >
                        No hay pedidos completados en el periodo seleccionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {resumen.tabla.map((fila) => (
                        <TableRow
                          key={fila.fecha}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="font-semibold text-slate-800 text-sm py-3">
                            {fila.fecha}
                          </TableCell>
                          <TableCell className="text-center py-3 text-sm">
                            <span className="font-bold text-[#1B2C56]">
                              {fila.pedidos}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fila de Totales */}
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableCell className="font-bold text-slate-800 text-xs py-3 uppercase tracking-wide">
                          Total Consolidado
                        </TableCell>
                        <TableCell className="text-center font-bold text-[#1B2C56] text-base py-3">
                          {resumen.totalPedidos}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
