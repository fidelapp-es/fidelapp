'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Users, Tag, ShoppingBag, QrCode, LogOut, Zap, ChevronLeft, ChevronRight, Settings, Megaphone, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { useThemeApp } from './ThemeProvider'

const mobileNavItems = [
  { href: '/dashboard', label: 'Inicio', icon: BarChart3, exact: true },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/escanear', label: 'Escanear', icon: QrCode },
  { href: '/dashboard/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/dashboard/ajustes', label: 'Ajustes', icon: Settings },
]

const sidebarNavItems = [
  { href: '/dashboard', label: 'Resumen', icon: BarChart3, exact: true },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/metricas', label: 'Métricas', icon: BarChart3 },
  { href: '/dashboard/promociones', label: 'Promociones', icon: Tag },
  { href: '/dashboard/productos', label: 'Productos', icon: ShoppingBag },
  { href: '/dashboard/escanear', label: 'Escanear QR', icon: QrCode },
  { href: '/dashboard/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/dashboard/geocatch', label: 'Geocatch', icon: MapPin },
  { href: '/dashboard/ajustes', label: 'Ajustes', icon: Settings },
]

export default function DashboardNav({ logoUrl = '', businessName = 'Fidelapp' }: { logoUrl?: string; businessName?: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { theme } = useThemeApp()

  const isLight = theme === 'urbanist' || theme === 'warm'
  const isMinimal = theme === 'minimal'
  const sidebarDark = isMinimal

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Sesión cerrada')
    window.location.href = '/login'
  }

  function isActive(item: { href: string; exact?: boolean }) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href)
  }

  const sidebarBg = sidebarDark ? '#0A0A0A' : isLight ? '#FFFFFF' : '#0A0907'
  const sidebarBorder = isLight && !sidebarDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'
  const logoText = sidebarDark || (!isLight) ? '#F5F0EB' : '#0A0A0A'
  const logoSubText = sidebarDark || (!isLight) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)'
  const navInactive = sidebarDark || (!isLight) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)'
  const navHover = sidebarDark || (!isLight) ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const chevronColor = sidebarDark || (!isLight) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'

  return (
    <>
      {/* ===== SIDEBAR DESKTOP ===== */}
      <aside
        id="dashboard-sidebar"
        style={{
          flexDirection: 'column',
          borderRight: `1px solid ${sidebarBorder}`,
          background: sidebarBg,
          width: collapsed ? 64 : 224,
          transition: 'width 0.3s',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${sidebarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: logoUrl ? 'transparent' : 'var(--fi-accent-bg)', border: `1px solid var(--fi-accent-border)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                  : <Zap style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
                }
              </div>
              <div>
                <p style={{ color: logoText, fontWeight: 700, fontSize: 15, lineHeight: 1 }}>{businessName}</p>
                <p style={{ color: logoSubText, fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Panel</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width: 36, height: 36, borderRadius: 12, background: logoUrl ? 'transparent' : 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', overflow: 'hidden' }}>
              {logoUrl
                ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                : <Zap style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
              }
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{ color: chevronColor, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>

        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ display: 'flex', justifyContent: 'center', padding: '12px', color: chevronColor, background: 'none', border: 'none', borderBottom: `1px solid ${sidebarBorder}`, cursor: 'pointer', width: '100%' }}>
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sidebarNavItems.map(item => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px 0' : '9px 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: active ? 'var(--fi-bg-sidebar-active)' : 'transparent',
                  color: active ? 'var(--fi-accent)' : navInactive,
                  border: active ? '1px solid var(--fi-accent-border)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = navHover }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <item.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: 8, borderTop: `1px solid ${sidebarBorder}` }}>
          <button
            onClick={handleLogout}
            style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '9px 10px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 10, fontSize: 13, fontWeight: 500, color: navInactive, background: 'none', border: 'none', cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
          >
            <LogOut style={{ width: 15, height: 15, flexShrink: 0 }} />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ===== MÓVIL: barra inferior ===== */}
      <nav
        id="dashboard-mobile-nav"
        style={{ background: 'var(--fi-nav-bg)', borderTop: `1px solid var(--fi-border)` }}
        className="fixed bottom-0 left-0 right-0 z-50 items-center justify-around px-1 pb-5 pt-2"
      >
        {mobileNavItems.map(item => {
          const active = isActive(item)
          const isScanner = item.href === '/dashboard/escanear'
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ touchAction: 'manipulation', color: active ? 'var(--fi-accent)' : 'var(--fi-text-muted)' }}
              className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all ${isScanner ? 'mx-1 rounded-2xl' : ''}`}
            >
              {isScanner ? (
                <div style={{ background: 'var(--fi-accent)', borderRadius: 14, padding: '6px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <item.icon style={{ width: 18, height: 18, color: theme === 'minimal' ? '#FFFFFF' : '#0D0B09' }} />
                </div>
              ) : (
                <>
                  <item.icon style={{ width: 20, height: 20, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 500 }}>{item.label}</span>
                </>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
