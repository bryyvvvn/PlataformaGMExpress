export async function obtenerMensajeError(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error
    }
  } catch {
    // La respuesta no contenía JSON válido.
  }

  return "No se pudo descargar el histórico"
}

export async function descargarArchivoExcel(response: Response, nombreArchivo: string) {
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement("a")

  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)

  try {
    enlace.click()
  } finally {
    enlace.remove()
    URL.revokeObjectURL(url)
  }
}
