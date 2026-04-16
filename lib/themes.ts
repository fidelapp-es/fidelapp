export type ThemeId = 'dark' | 'urbanist' | 'warm' | 'minimal'
export type CardStyleId = 'luxury' | 'fresh' | 'warm' | 'pure'
export type ColorMode = 'dark' | 'light'

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null
}

export function applyBrandColors(accent: string, mode: ColorMode) {
  const rgb = hexToRgb(accent)
  if (!rgb) return
  const { r, g, b } = rgb
  const el = document.body

  el.setAttribute('data-mode', mode)
  // Remove old data-theme to avoid conflicts
  el.removeAttribute('data-theme')

  // Compute derived accent variables
  const r2 = Math.min(r + 30, 255), g2 = Math.min(g + 30, 255), b2 = Math.min(b + 30, 255)
  el.style.setProperty('--fi-accent', accent)
  el.style.setProperty('--fi-accent-2', `rgb(${r2},${g2},${b2})`)
  el.style.setProperty('--fi-accent-bg', `rgba(${r},${g},${b},0.1)`)
  el.style.setProperty('--fi-accent-border', `rgba(${r},${g},${b},0.22)`)
  el.style.setProperty('--fi-bg-sidebar-active', `rgba(${r},${g},${b},0.15)`)

  // Shadcn compat
  el.style.setProperty('--primary', accent)
  el.style.setProperty('--ring', accent)
  el.style.setProperty('--chart-1', accent)

  // Text color on accent background (contrast)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  el.style.setProperty('--fi-accent-text', luminance > 0.55 ? '#0D0B09' : '#FFFFFF')
}

export interface CardStyle {
  id: CardStyleId
  name: string
  description: string
  cardBg: string
  cardBorder: string
  cardAccent: string
  cardText: string
  cardMuted: string
  metricBg: string
  metricBorder: string
  shadow: string
}

export const CARD_STYLES: CardStyle[] = [
  {
    id: 'luxury',
    name: 'Luxury Dark',
    description: 'Oscuro con detalles dorados',
    cardBg: 'linear-gradient(145deg, #1C1713 0%, #0D0B09 100%)',
    cardBorder: 'rgba(200,135,58,0.25)',
    cardAccent: '#C8873A',
    cardText: '#F5F0EB',
    cardMuted: 'rgba(245,240,235,0.45)',
    metricBg: 'rgba(200,135,58,0.12)',
    metricBorder: 'rgba(200,135,58,0.3)',
    shadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  {
    id: 'fresh',
    name: 'Urban Fresh',
    description: 'Limpio y moderno en blanco',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    cardAccent: '#212121',
    cardText: '#212121',
    cardMuted: 'rgba(33,33,33,0.45)',
    metricBg: 'rgba(239,240,163,0.4)',
    metricBorder: 'rgba(200,200,80,0.4)',
    shadow: '0 8px 40px rgba(0,0,0,0.1)',
  },
  {
    id: 'warm',
    name: 'Warm Organic',
    description: 'Tonos cálidos y acogedores',
    cardBg: 'linear-gradient(145deg, #FFFAF5 0%, #FDF0E4 100%)',
    cardBorder: '#E0D5C8',
    cardAccent: '#E85D26',
    cardText: '#1A1A1A',
    cardMuted: 'rgba(26,26,26,0.45)',
    metricBg: 'rgba(232,93,38,0.08)',
    metricBorder: 'rgba(232,93,38,0.25)',
    shadow: '0 8px 40px rgba(200,100,40,0.15)',
  },
  {
    id: 'pure',
    name: 'Pure Minimal',
    description: 'Minimalismo en blanco y negro',
    cardBg: '#FAFAFA',
    cardBorder: '#E4E4E7',
    cardAccent: '#0A0A0A',
    cardText: '#0A0A0A',
    cardMuted: 'rgba(0,0,0,0.38)',
    metricBg: 'rgba(0,0,0,0.04)',
    metricBorder: '#E4E4E7',
    shadow: '0 2px 20px rgba(0,0,0,0.08)',
  },
]

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
