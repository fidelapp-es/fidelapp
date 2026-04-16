'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { applyBrandColors, type ColorMode } from '@/lib/themes'

interface ThemeCtx {
  mode: ColorMode
  accent: string
  setMode: (m: ColorMode) => void
  setAccent: (c: string) => void
  // Legacy compat
  theme: ColorMode
  setTheme: (t: ColorMode) => void
}

const Ctx = createContext<ThemeCtx>({
  mode: 'dark', accent: '#C8873A',
  setMode: () => {}, setAccent: () => {},
  theme: 'dark', setTheme: () => {},
})

export const useThemeApp = () => useContext(Ctx)

export function ThemeProvider({
  children,
  initialMode = 'dark',
  initialAccent = '#C8873A',
  // Legacy prop
  initialTheme,
}: {
  children: React.ReactNode
  initialMode?: ColorMode
  initialAccent?: string
  initialTheme?: string
}) {
  // If legacy initialTheme provided, map to mode
  const resolvedInitialMode: ColorMode =
    initialMode !== 'dark' ? initialMode :
    (initialTheme === 'urbanist' || initialTheme === 'warm' || initialTheme === 'minimal') ? 'light' : 'dark'

  const [mode, setModeState] = useState<ColorMode>(resolvedInitialMode)
  const [accent, setAccentState] = useState(initialAccent)

  // Al montar: aplica los colores que vienen de la BD (initialMode/initialAccent).
  // NO leer localStorage — la BD es siempre la fuente de verdad entre dispositivos.
  useEffect(() => {
    applyBrandColors(accent, mode)
  }, [mode, accent])

  function setMode(m: ColorMode) {
    setModeState(m)
    patch({ custom_mode: m })
  }

  function setAccent(c: string) {
    setAccentState(c)
    patch({ custom_accent: c })
  }

  function patch(body: object) {
    fetch('/api/ajustes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  }

  const ctx: ThemeCtx = { mode, accent, setMode, setAccent, theme: mode, setTheme: setMode }

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}
