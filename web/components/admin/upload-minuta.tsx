"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, UploadCloud, Loader2, CheckCircle } from "lucide-react";

const PLANTILLA_MINUTA_URL = "/formato-minuta.xlsx";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado";
}

export function UploadMinuta() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error", texto: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMensaje(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMensaje(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-minuta", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al subir el archivo");
      }

      setMensaje({ tipo: "exito", texto: "¡Minuta semanal cargada exitosamente!" });
      setFile(null); // Limpiar el input
      
      // Aquí opcionalmente podrías agregar un router.refresh() si quieres que la página 
      // se recargue para mostrar datos nuevos, pero de momento con el éxito basta.
      
    } catch (error) {
      setMensaje({ tipo: "error", texto: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Subir Minuta (Excel)</CardTitle>
        <CardDescription>
          Asegúrate de que el archivo tenga la pestaña llamada &quot;MINUTA&quot; y respete el formato de filas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="minuta">Archivo (.xlsx)</Label>
          <Input 
            id="minuta" 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileChange}
            disabled={loading}
            className="cursor-pointer"
          />
        </div>

        {mensaje && (
          <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${mensaje.tipo === "exito" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {mensaje.tipo === "exito" && <CheckCircle className="w-4 h-4" />}
            {mensaje.texto}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
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
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-all hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
