import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  CONTACTO_DEFAULTS,
  CONVENIO_DEFAULTS,
  CREAR_EMPRESA_DEFAULTS,
} from "@/lib/empresas/constantes"
import { crearPayloadCrearEmpresa } from "@/lib/empresas/normalizadores"
import {
  contactoCompleto,
  contactoVacio,
  datosGeneralesCompletos,
  esEmailValido,
  normalizarMensajeError,
  validarEmailsCrearEmpresa,
} from "@/lib/empresas/validaciones"
import type {
  CampoBooleanoConvenio,
  ContactoEmpresaForm,
  ContactoFormularioTipo,
  ConvenioForm,
  CrearEmpresaForm,
  PasoCrearEmpresa,
  TipoEmpaquetado,
  EstadoEmpresaCliente,
  EmpresaCliente,
  EmpresasResponse,
} from "@/lib/empresas/tipos"

export function useCrearEmpresa() {
  const router = useRouter()
  const [pasoCrearEmpresa, setPasoCrearEmpresa] = useState<PasoCrearEmpresa>(0)
  const [guardandoEmpresa, setGuardandoEmpresa] = useState(false)
  const [errorCrearEmpresa, setErrorCrearEmpresa] = useState<string | null>(null)
  const [crearEmpresaForm, setCrearEmpresaForm] =
    useState<CrearEmpresaForm>(CREAR_EMPRESA_DEFAULTS)
  const [casasMatrices, setCasasMatrices] = useState<EmpresaCliente[]>([])
  const [crearEmpresaConvenio, setCrearEmpresaConvenio] =
    useState<ConvenioForm>(CONVENIO_DEFAULTS)
  const [contactoTitularForm, setContactoTitularForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)
  const [contactoSuplenteForm, setContactoSuplenteForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)
  const [contactoCobranzaForm, setContactoCobranzaForm] =
    useState<ContactoEmpresaForm>(CONTACTO_DEFAULTS)
  const [usarTitularComoCobranza, setUsarTitularComoCobranza] = useState(true)

  const actualizarCampoCrearEmpresa = (
    campo: keyof CrearEmpresaForm,
    valor: string | boolean | EstadoEmpresaCliente
  ) => {
    setCrearEmpresaForm((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === "esSucursal" && valor === false ? { casaMatrizId: "" } : {}),
    }))
  }

  const cargarCasasMatrices = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/empresas", { cache: "no-store" })
      if (!response.ok) return

      const data = (await response.json()) as EmpresasResponse
      setCasasMatrices(data.empresas.filter((empresa) => !empresa.esSucursal))
    } catch (err) {
      console.error("[NuevaEmpresaPage] Error cargando casas matrices:", err)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarCasasMatrices()
    })
  }, [cargarCasasMatrices])

  const actualizarConvenioCrearEmpresa = (
    campo: CampoBooleanoConvenio,
    checked: boolean
  ) => {
    setCrearEmpresaConvenio((prev) => ({
      ...prev,
      [campo]: checked,
    }))
  }

  const actualizarTipoEmpaquetadoCrearEmpresa = (
    tipoEmpaquetado: TipoEmpaquetado | null
  ) => {
    setCrearEmpresaConvenio((prev) => ({
      ...prev,
      tipoEmpaquetado,
    }))
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

  const avanzarPasoCrearEmpresa = () => {
    if (pasoCrearEmpresa === 0 && !datosGeneralesCompletos(crearEmpresaForm)) {
      setErrorCrearEmpresa("Completa los datos generales obligatorios de la empresa")
      return
    }

    if (pasoCrearEmpresa === 1 && !contactoCompleto(contactoTitularForm)) {
      setErrorCrearEmpresa("Completa los datos obligatorios del interlocutor titular")
      return
    }

    if (
      pasoCrearEmpresa === 1 &&
      !esEmailValido(contactoTitularForm.email)
    ) {
      setErrorCrearEmpresa(
        "El correo del interlocutor titular debe tener un formato válido."
      )
      return
    }

    if (
      pasoCrearEmpresa === 2 &&
      !contactoVacio(contactoSuplenteForm) &&
      !contactoCompleto(contactoSuplenteForm)
    ) {
      setErrorCrearEmpresa("Completa los datos obligatorios del interlocutor suplente")
      return
    }

    if (
      pasoCrearEmpresa === 2 &&
      !contactoVacio(contactoSuplenteForm) &&
      !esEmailValido(contactoSuplenteForm.email)
    ) {
      setErrorCrearEmpresa(
        "El correo del interlocutor suplente debe tener un formato válido."
      )
      return
    }

    if (
      pasoCrearEmpresa === 3 &&
      !usarTitularComoCobranza &&
      !contactoCompleto(contactoCobranzaForm)
    ) {
      setErrorCrearEmpresa("Completa los datos obligatorios de cobranza")
      return
    }

    if (
      pasoCrearEmpresa === 3 &&
      !usarTitularComoCobranza &&
      !esEmailValido(contactoCobranzaForm.email)
    ) {
      setErrorCrearEmpresa("El correo de cobranza debe tener un formato válido.")
      return
    }

    setErrorCrearEmpresa(null)

    setPasoCrearEmpresa((prev) => {
      if (prev === 0) return 1
      if (prev === 1) return 2
      if (prev === 2) return 3
      if (prev === 3) return 4
      return prev
    })
  }

  const retrocederPasoCrearEmpresa = () => {
    setErrorCrearEmpresa(null)

    setPasoCrearEmpresa((prev) => {
      if (prev === 4) return 3
      if (prev === 3) return 2
      if (prev === 2) return 1
      if (prev === 1) return 0
      return prev
    })
  }

  const cancelar = () => {
    if (guardandoEmpresa) return
    router.push("/empresas")
  }

  const crearEmpresa = async () => {
    if (!datosGeneralesCompletos(crearEmpresaForm)) {
      setPasoCrearEmpresa(0)
      setErrorCrearEmpresa("Completa los datos generales obligatorios de la empresa")
      return
    }

    if (!contactoCompleto(contactoTitularForm)) {
      setPasoCrearEmpresa(1)
      setErrorCrearEmpresa("Completa los datos obligatorios del interlocutor titular")
      return
    }

    if (!contactoVacio(contactoSuplenteForm) && !contactoCompleto(contactoSuplenteForm)) {
      setPasoCrearEmpresa(2)
      setErrorCrearEmpresa("Completa los datos obligatorios del interlocutor suplente")
      return
    }

    if (!usarTitularComoCobranza && !contactoCompleto(contactoCobranzaForm)) {
      setPasoCrearEmpresa(3)
      setErrorCrearEmpresa("Completa los datos obligatorios de cobranza")
      return
    }

    const errorEmail = validarEmailsCrearEmpresa({
      form: crearEmpresaForm,
      contactoTitular: contactoTitularForm,
      contactoSuplente: contactoSuplenteForm,
      contactoCobranza: contactoCobranzaForm,
      usarTitularComoCobranza,
    })
    if (errorEmail) {
      setPasoCrearEmpresa(errorEmail.paso)
      setErrorCrearEmpresa(errorEmail.mensaje)
      return
    }

    setGuardandoEmpresa(true)
    setErrorCrearEmpresa(null)

    try {
      const response = await fetch("/api/admin/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          crearPayloadCrearEmpresa({
            form: crearEmpresaForm,
            convenio: crearEmpresaConvenio,
            contactoTitular: contactoTitularForm,
            contactoSuplente: contactoSuplenteForm,
            contactoCobranza: contactoCobranzaForm,
            usarTitularComoCobranza,
          })
        ),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setErrorCrearEmpresa(
          normalizarMensajeError(data?.error ?? "No se pudo crear la empresa.")
        )
        return
      }

      router.push("/empresas")
    } catch (err) {
      console.error("[NuevaEmpresaPage] Error creando empresa:", err)
      const mensaje =
        err instanceof Error ? err.message : "No se pudo crear la empresa."

      setErrorCrearEmpresa(normalizarMensajeError(mensaje))
    } finally {
      setGuardandoEmpresa(false)
    }
  }

  return {
    pasoCrearEmpresa,
    guardandoEmpresa,
    errorCrearEmpresa,
    crearEmpresaForm,
    casasMatrices,
    crearEmpresaConvenio,
    contactoTitularForm,
    contactoSuplenteForm,
    contactoCobranzaForm,
    usarTitularComoCobranza,
    setUsarTitularComoCobranza,
    actualizarCampoCrearEmpresa,
    actualizarConvenioCrearEmpresa,
    actualizarTipoEmpaquetadoCrearEmpresa,
    actualizarContacto,
    avanzarPasoCrearEmpresa,
    retrocederPasoCrearEmpresa,
    cancelar,
    crearEmpresa,
  }
}
