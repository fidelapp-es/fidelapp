'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ThemeId } from '@/lib/themes'

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', setTheme: () => {} })

export function useThemeApp() { return useContext(ThemeContext) }

export function ThemeProvider({ children, initialTheme = 'dark' }: { children: React.ReactNode; initialTheme?: ThemeId }) {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme)

  useEffect(() => {
    // Leer de localStorage primero
    const stored = localStorage.getItem('fi-theme') as ThemeId | null
    if (stored) setThemeState(stored)
  }, [])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('fi-theme', theme)
  }, [theme])

  function setTheme(t: ThemeId) {
    setThemeState(t)
    // Persistir en DB en background
    fetch('/api/ajustes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
