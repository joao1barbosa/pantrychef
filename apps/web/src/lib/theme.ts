import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type PreferenciaTema = 'sistema' | 'claro' | 'escuro'

const CHAVE = 'tema'
const EVENTO = 'pantrychef:tema'
const consultaEscuro = '(prefers-color-scheme: dark)'

function lerPreferencia(): PreferenciaTema {
  try {
    const valor = localStorage.getItem(CHAVE)
    return valor === 'claro' || valor === 'escuro' ? valor : 'sistema'
  } catch {
    return 'sistema'
  }
}

function sistemaEscuro() {
  return typeof window.matchMedia === 'function' && window.matchMedia(consultaEscuro).matches
}

export function aplicarTema(preferencia: PreferenciaTema = lerPreferencia()) {
  const escuro = preferencia === 'escuro' || (preferencia === 'sistema' && sistemaEscuro())
  document.documentElement.classList.toggle('dark', escuro)
  return escuro
}

function assinar(aoMudar: () => void) {
  window.addEventListener(EVENTO, aoMudar)
  window.addEventListener('storage', aoMudar)
  return () => {
    window.removeEventListener(EVENTO, aoMudar)
    window.removeEventListener('storage', aoMudar)
  }
}

/** Preferência de tema persistida (sistema, claro ou escuro) e o tema efetivo. */
export function useTema() {
  const preferencia = useSyncExternalStore(assinar, lerPreferencia, () => 'sistema' as const)

  useEffect(() => {
    aplicarTema(preferencia)
    if (preferencia !== 'sistema' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(consultaEscuro)
    const aoMudar = () => aplicarTema('sistema')
    media.addEventListener('change', aoMudar)
    return () => media.removeEventListener('change', aoMudar)
  }, [preferencia])

  const definir = useCallback((nova: PreferenciaTema) => {
    try {
      if (nova === 'sistema') localStorage.removeItem(CHAVE)
      else localStorage.setItem(CHAVE, nova)
    } catch {
      // sem persistência: aplica só nesta sessão
    }
    aplicarTema(nova)
    window.dispatchEvent(new Event(EVENTO))
  }, [])

  const escuro = preferencia === 'escuro' || (preferencia === 'sistema' && sistemaEscuro())
  return { preferencia, escuro, definir }
}
