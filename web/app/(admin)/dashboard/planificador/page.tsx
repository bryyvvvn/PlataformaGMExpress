"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2, CheckCircle } from "lucide-react";

export default function PlanificadorPage() {
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
    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Planificador de Menús</h1>
        <p className="text-muted-foreground mt-2">
          Carga el archivo Excel para actualizar la minuta de la semana.
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Subir Minuta (Excel)</CardTitle>
          <CardDescription>
            Asegúrate de que el archivo tenga la pestaña llamada "MINUTA" y respete el formato de filas.
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
        </CardContent>
      </Card>
    </div>
  );
}