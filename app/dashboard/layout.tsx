import DashboardNav from './DashboardNav'
import { ThemeProvider } from './ThemeProvider'
import { getServiceClient } from '@/lib/supabase'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let initialTheme = 'dark'
  let logoUrl = ''
  let businessName = 'Fidelapp'

  try {
    const sb = getServiceClient()
    const { data } = await sb.from('settings').select('theme, logo_url, business_name').eq('id', '00000000-0000-0000-0000-000000000001').single()
    if (data?.theme) initialTheme = data.theme
    if (data?.logo_url) logoUrl = data.logo_url
    if (data?.business_name) businessName = data.business_name
  } catch {}

  return (
    <ThemeProvider initialTheme={initialTheme as any}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <DashboardNav logoUrl={logoUrl} businessName={businessName} />
        <main style={{ flex: 1, paddingBottom: '80px' }} className="bg-noise md:[padding-bottom:0]">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
