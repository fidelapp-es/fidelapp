import DashboardNav from './DashboardNav'
import { ThemeProvider } from './ThemeProvider'
import { createAuthClient } from '@/lib/supabase/server'
import { parseThemeConfig } from '@/lib/themeConfig'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let initialMode: 'dark' | 'light' = 'dark'
  let initialAccent = '#C8873A'
  let logoUrl = ''
  let businessName = 'Fidelapp'

  try {
    const sb = await createAuthClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      const { data } = await sb.from('settings').select('theme, logo_url, business_name').eq('id', user.id).maybeSingle()
      if (data) {
        const cfg = parseThemeConfig(data.theme)
        initialMode   = cfg.mode
        initialAccent = cfg.accent
        if (data.logo_url)     logoUrl      = data.logo_url
        if (data.business_name) businessName = data.business_name
      }
    }
  } catch {}

  return (
    <ThemeProvider initialMode={initialMode} initialAccent={initialAccent}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <DashboardNav logoUrl={logoUrl} businessName={businessName} />
        <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden', paddingBottom: '80px' }} className="bg-noise md:[padding-bottom:0]">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
