export type ThemeId = 'dark' | 'urbanist' | 'warm' | 'minimal'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  preview: {
    bg: string
    accent: string
    card: string
    text: string
    sidebar: string
  }
}

export const THEMES: Theme[] = [
  {
    id: 'dark',
    name: 'Dark Premium',
    description: 'Oscuro con detalles ámbar y glass morphism',
    preview: { bg: '#0D0B09', accent: '#C8873A', card: 'rgba(255,255,255,0.06)', text: '#F5F0EB', sidebar: '#0A0907' },
  },
  {
    id: 'urbanist',
    name: 'Urbanist',
    description: 'Claro y limpio con tipografía moderna',
    preview: { bg: '#F6F5FA', accent: '#212121', card: '#FFFFFF', text: '#212121', sidebar: '#FFFFFF' },
  },
  {
    id: 'warm',
    name: 'Warm Organic',
    description: 'Tonos cálidos y orgánicos con naranja',
    preview: { bg: '#F5EFE8', accent: '#E85D26', card: '#FFFFFF', text: '#1A1A1A', sidebar: '#FFFFFF' },
  },
  {
    id: 'minimal',
    name: 'Smart Minimal',
    description: 'Blanco puro, minimalismo extremo',
    preview: { bg: '#FFFFFF', accent: '#0A0A0A', card: '#F4F4F5', text: '#0A0A0A', sidebar: '#0A0A0A' },
  },
]
