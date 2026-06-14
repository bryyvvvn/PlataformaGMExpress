import type { ChangeEvent } from "react";
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANTILLA_MINUTA_URL } from "@/hooks/usePlanificador";

type MensajePlanificador = { tipo: "exito" | "error"; texto: string } | null;

export function UploadMinutaCard({
  file,
  loading,
  mensaje,
  onFileChange,
  onUpload,
}: {
  file: File | null;
  loading: boolean;
  mensaje: MensajePlanificador;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
}) {
  return (
    <Card className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="h-1 w-full bg-[#1B2C56]" />

      <CardContent className="p-6">
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1B2C56]">
            <FileSpreadsheet className="h-5 w-5 text-[#75AA46]" />
            <span>Importación de Datos (.xlsx)</span>
          </div>

          <p className="text-sm text-slate-500">
            Sube el archivo estructurado para actualizar la base de platos de toda la semana.
          </p>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              id="minuta"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={onFileChange}
              disabled={loading}
              className="sr-only"
            />

            <Label
              htmlFor="minuta"
              className={`inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#1B2C56]/40 hover:bg-slate-100 ${
                loading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <UploadCloud className="h-4 w-4 text-slate-500" />
              Explorar archivo
            </Label>

            <span className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-inner">
              {file ? file.name : "Ningún archivo seleccionado..."}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            <Button
              onClick={onUpload}
              disabled={!file || loading}
              className="h-9 bg-[#75AA46] font-semibold text-white shadow-sm hover:bg-[#5d8a38]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Cargar Minuta
                </>
              )}
            </Button>

            <a
              href={PLANTILLA_MINUTA_URL}
              download="formato-minuta.xlsx"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-slate-400" />
              Descargar Plantilla
            </a>
          </div>
        </div>

        {mensaje && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
              mensaje.tipo === "exito"
                ? "border-[#75AA46]/20 bg-[#75AA46]/10 text-[#5d8a38]"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensaje.tipo === "exito" && <CheckCircle className="h-4 w-4" />}
            {mensaje.texto}
          </div>
        )}
      </CardContent>
    </Card>
  );
}