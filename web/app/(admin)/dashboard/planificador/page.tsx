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
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const handleDeleteWeek = async () => {
    if (!file) return;
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!file) return;
    setConfirmOpen(false);
    setLoading(true);
    setMensaje(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/delete-week", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al borrar la semana");
      }

      setMensaje({ tipo: "exito", texto: `Semana borrada: ${data.deleted || 0} registros eliminados` });
      setFile(null);
    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-60 w-60 rounded-lg bg-white/10 flex items-center justify-center border border-white/8 overflow-hidden">
            <img src="/logo-gm-verde-azul.png" alt="GM Express" className="h-60 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Planificador de Menús</h1>
            <p className="text-muted-foreground mt-1">Carga el archivo Excel para actualizar la minuta de la semana.</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-white/60">Panel Administrativo</p>
          <p className="text-xs text-white/40">Acciones rápidas: subir, borrar o depurar minuta</p>
        </div>
      </header>

      <Card className="border-border shadow-lg">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2">
              <div className="bg-gradient-to-r from-white/5 to-white/2 p-6 rounded-lg h-full">
                <h2 className="text-lg font-semibold text-white mb-2">Subir Minuta (Excel)</h2>
                <p className="text-sm text-white/60 mb-4">Asegúrate de que el archivo tenga la pestaña llamada "MINUTA" y respete el formato de filas. Aquí puedes subir la minuta o eliminar la semana según el Excel.</p>

                <div className="grid w-full max-w-lg items-center gap-2">
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
                  <div className={`p-3 rounded-md text-sm flex items-center gap-2 mt-4 ${mensaje.tipo === "exito" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {mensaje.tipo === "exito" && <CheckCircle className="w-4 h-4" />}
                    {mensaje.texto}
                  </div>
                )}
              </div>
            </div>

            <aside className="md:col-span-1 flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-primary" />
                  <span className="font-medium">Acciones</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={!file || loading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Cargar
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={handleDeleteWeek}
                    disabled={!file || loading}
                    variant="destructive"
                    className="ml-0"
                  >
                    Eliminar
                  </Button>
                </div>

                <div className="text-xs text-white/50">
                  <p>Consejo: sube primero para verificar, o utiliza eliminar si necesitas limpiar registros anteriores.</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/3 border border-white/6 text-sm text-white/60">
                <strong>Logo</strong>
                <p className="mt-2 text-xs">Espacio reservado para integrar el logo corporativo. Sube el fichero <em>logo.png</em> en la carpeta <code>public/</code> y lo mostraré aquí.</p>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOpen(false)} />
          <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
            <p className="mt-2 text-sm text-muted-foreground">¿Confirmas que deseas eliminar la minuta correspondiente a la semana indicada en este Excel? Esta acción borrará registros y no se puede deshacer.</p>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={loading}>{loading ? 'Eliminando...' : 'Eliminar semana'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}