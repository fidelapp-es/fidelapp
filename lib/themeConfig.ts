// Shared helper for reading/writing all visual configuration
// Stored as JSON in the `theme` column of settings (which already exists in DB)

export type ColorMode = 'dark' | 'light'

export interface WalletDesign {
  strip_color:  string        // gradient top band
  bg_color:     string        // card body background
  fg_color:     string        // primary text
  label_color:  string        // labels / accent on card
  header:       string        // text shown in band (business name variant)
  logo_url:     string | null // wallet-specific logo
  strip_url:    string | null // custom strip image (overrides generated)
  icon_key:     string        // sector icon key (from walletIcons.ts)
}

export interface ThemeConfig {
  mode:   ColorMode
  accent: string      // dashboard + public pages accent color
  wallet: WalletDesign
}

const DEFAULTS: ThemeConfig = {
  mode:   'dark',
  accent: '#C8873A',
  wallet: {
    strip_color:  '#B5312A',
    bg_color:     '#F0E8D8',
    fg_color:     '#2A1008',
    label_color:  '#B5312A',
    header:       '',
    logo_url:     null,
    strip_url:    null,
    icon_key:     'coffee',
  },
}

/** Parse the `theme` column value (may be legacy string like 'warm' or JSON). */
export function parseThemeConfig(raw: string | null | undefined): ThemeConfig {
  if (!raw) return DEFAULTS
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || !parsed) return DEFAULTS
    return {
      mode:   parsed.mode === 'light' ? 'light' : 'dark',
      accent: parsed.accent || DEFAULTS.accent,
      wallet: { ...DEFAULTS.wallet, ...(parsed.wallet || {}), icon_key: parsed.wallet?.icon_key || DEFAULTS.wallet.icon_key },
    }
  } catch {
    // Legacy non-JSON value like 'warm', 'dark', 'urbanist'
    const isLight = ['warm', 'light', 'urbanist', 'minimal'].includes(raw)
    return { ...DEFAULTS, mode: isLight ? 'light' : 'dark' }
  }
}

/** Serialize ThemeConfig back to JSON string for storing in `theme` column. */
export function serializeThemeConfig(config: ThemeConfig): string {
  return JSON.stringify(config)
}
