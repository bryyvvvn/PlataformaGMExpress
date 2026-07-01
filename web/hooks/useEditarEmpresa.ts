import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  CONTACTO_DEFAULTS,
  EMPRESA_EDIT_DEFAULTS,
} from "@/lib/empresas/constantes"
import {
  contactoAFormulario,
  crearPayloadEditarEmpresa,
  fechaParaInput,
  textoFormulario,
} from "@/lib/empresas/normalizadores"
import {
  contactoCompleto,
  contactoVacio,
  datosGeneralesCompletos,
} from "@/lib/empresas/validaciones"
import type {
  ContactoEmpresaForm,
  ContactoFormularioTipo,
  EmpresaEdicionDetalle,
  EmpresaEdicionResponse,
  EmpresaEditForm,
  EmpresaCliente,
  EmpresasResponse,
  EstadoEmpresaCliente,
} from "@/lib/empresas/tipos"

export function useEditarEmpresa(empresaId: string | undefined) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [empresaCargada, setEmpresaCargada] = useState(false)
  const [empresaNombre, setEmpresaNombre] = useState("")
  const [form, setForm] = useState<EmpresaEditForm>(EMPRESA_EDIT_DEFAULTS)
  const [casasMatrices, setCasasMatrices] = useState<EmpresaCliente[]>([])
  const [horaDespachoActivada, setHoraDespachoActivada] = useState(false)
  const [contactoTitularForm, setContactoTitularForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)
  const [contactoSuplenteForm, setContactoSuplenteForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)
  const [contactoCobranzaForm, setContactoCobranzaForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)

  const detalleHref = empresaId ? `/empresas/${empresaId}` : "/empresas"

  const hidratarFormulario = useCallback((empresa: EmpresaEdicionDetalle) => {
    const contactoTitular = empresa.contactos.find(
      (contacto) => contacto.tipo === "TITULAR" && contacto.activo
    )
    const contactoSuplente = empresa.contactos.find(
      (contacto) => contacto.tipo === "SUPLENTE" && contacto.activo
    )
    const contactoCobranza = empresa.contactos.find(
      (contacto) => contacto.tipo === "COBRANZA" && contacto.activo
    )

    setEmpresaCargada(true)
    setEmpresaNombre(empresa.nombre)
    setHoraDespachoActivada(empresa.horaDespacho !== null)
    setForm({
      nombre: empresa.nombre,
      razonSocial: textoFormulario(empresa.razonSocial),
      rut: textoFormulario(empresa.rut),
      nombreComercial: textoFormulario(empresa.nombreComercial),
      correo_contacto: textoFormulario(empresa.correo_contacto),
      telefono: textoFormulario(empresa.telefono),
      direccion: textoFormulario(empresa.direccion),
      comuna: textoFormulario(empresa.comuna),
      region: textoFormulario(empresa.region),
      sector: textoFormulario(empresa.sector),
      nombreFaena: textoFormulario(empresa.nombreFaena),
      direccionFaena: textoFormulario(empresa.direccionFaena),
      representanteLegal: textoFormulario(empresa.representanteLegal),
      rutRepresentanteLegal: textoFormulario(empresa.rutRepresentanteLegal),
      fechaNacimientoRepresentanteLegal: fechaParaInput(
        empresa.fechaNacimientoRepresentanteLegal
      ),
      fechaInicioContrato: fechaParaInput(empresa.fechaInicioContrato),
      estado: empresa.estado,
      horaDespacho: textoFormulario(empresa.horaDespacho),
      esSucursal: empresa.esSucursal,
      casaMatrizId: empresa.casaMatrizId ? String(empresa.casaMatrizId) : "",
    })
    setContactoTitularForm(contactoAFormulario(contactoTitular))
    setContactoSuplenteForm(contactoAFormulario(contactoSuplente))
    setContactoCobranzaForm(contactoAFormulario(contactoCobranza))
  }, [])

  const cargarEmpresa = useCallback(async () => {
    if (!empresaId) {
      setError("No se pudo cargar la empresa")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/empresas/${empresaId}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("No se pudo cargar la empresa")
      }

      const data = (await response.json()) as EmpresaEdicionResponse
      hidratarFormulario(data.empresa)
    } catch (err) {
      console.error("[EditarEmpresaPage] Error cargando empresa:", err)
      setError("No se pudo cargar la empresa")
    } finally {
      setLoading(false)
    }
  }, [empresaId, hidratarFormulario])

  const cargarCasasMatrices = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/empresas", { cache: "no-store" })
      if (!response.ok) return

      const data = (await response.json()) as EmpresasResponse
      const empresaActualId = empresaId ? Number(empresaId) : null
      setCasasMatrices(
        data.empresas.filter(
          (empresa) => !empresa.esSucursal && empresa.id !== empresaActualId
        )
      )
    } catch (err) {
      console.error("[EditarEmpresaPage] Error cargando casas matrices:", err)
    }
  }, [empresaId])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarEmpresa()
      void cargarCasasMatrices()
    })
  }, [cargarEmpresa, cargarCasasMatrices])

  const actualizarCampoEmpresa = (
    campo: keyof EmpresaEditForm,
    valor: string | boolean | EstadoEmpresaCliente
  ) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === "esSucursal" && valor === false ? { casaMatrizId: "" } : {}),
    }))
  }

  const alternarHoraDespacho = (activada: boolean) => {
    setHoraDespachoActivada(activada)
    actualizarCampoEmpresa("horaDespacho", activada ? form.horaDespacho || "08:00" : "")
  }

  const actualizarContacto = (
    tipo: ContactoFormularioTipo,
    campo: keyof ContactoEmpresaForm,
    valor: string
  ) => {
    const setContacto =
      tipo === "titular"
        ? setContactoTitularForm
        : tipo === "suplente"
          ? setContactoSuplenteForm
          : setContactoCobranzaForm

    setContacto((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const guardarCambios = async () => {
    if (!empresaId) return

    if (!datosGeneralesCompletos(form)) {
      setError("Completa los datos generales obligatorios de la empresa")
      return
    }

    if (!contactoCompleto(contactoTitularForm)) {
      setError("Completa los datos obligatorios del interlocutor titular")
      return
    }

    if (!contactoVacio(contactoSuplenteForm) && !contactoCompleto(contactoSuplenteForm)) {
      setError("Completa los datos obligatorios del interlocutor suplente")
      return
    }

    if (!contactoCompleto(contactoCobranzaForm)) {
      setError("Completa los datos obligatorios de cobranza")
      return
    }

    setGuardando(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/empresas/${empresaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          crearPayloadEditarEmpresa({
            form,
            contactoTitular: contactoTitularForm,
            contactoSuplente: contactoSuplenteForm,
            contactoCobranza: contactoCobranzaForm,
          })
        ),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "No se pudo actualizar la empresa")
      }

      router.push(`/empresas/${empresaId}`)
    } catch (err) {
      console.error("[EditarEmpresaPage] Error guardando empresa:", err)
      setError(err instanceof Error ? err.message : "No se pudo actualizar la empresa")
    } finally {
      setGuardando(false)
    }
  }

  return {
    loading,
    guardando,
    error,
    empresaCargada,
    empresaNombre,
    form,
    casasMatrices,
    horaDespachoActivada,
    contactoTitularForm,
    contactoSuplenteForm,
    contactoCobranzaForm,
    detalleHref,
    cargarEmpresa,
    actualizarCampoEmpresa,
    alternarHoraDespacho,
    actualizarContacto,
    guardarCambios,
  }
}
