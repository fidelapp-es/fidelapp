function BusinessSVG() {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 280 }}>
      <rect x="60" y="80" width="160" height="120" rx="8" fill="none" stroke="#D1F843" strokeWidth="3"/>
      <rect x="60" y="60" width="160" height="30" rx="6" fill="#D1F843" opacity="0.3"/>
      <text x="140" y="81" textAnchor="middle" fill="#D1F843" fontSize="14" fontWeight="700">TIENDA</text>
      <rect x="110" y="140" width="60" height="60" rx="6" fill="none" stroke="#D1F843" strokeWidth="2.5"/>
      <circle cx="162" cy="170" r="4" fill="#D1F843"/>
      <rect x="75" y="100" width="40" height="30" rx="4" fill="none" stroke="#D1F843" strokeWidth="2" opacity="0.7"/>
      <rect x="165" y="100" width="40" height="30" rx="4" fill="none" stroke="#D1F843" strokeWidth="2" opacity="0.7"/>
      <path d="M50 65 Q140 45 230 65" stroke="#D1F843" strokeWidth="3" fill="none"/>
      <line x1="30" y1="200" x2="250" y2="200" stroke="#D1F843" strokeWidth="2" opacity="0.4"/>
      <circle cx="40" cy="30" r="3" fill="#D1F843" opacity="0.6"/>
      <circle cx="240" cy="20" r="2" fill="#D1F843" opacity="0.4"/>
      <circle cx="220" cy="50" r="4" fill="#D1F843" opacity="0.3"/>
    </svg>
  )
}

function ProfileSVG() {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 280 }}>
      <circle cx="140" cy="80" r="50" fill="none" stroke="#D1F843" strokeWidth="3"/>
      <circle cx="140" cy="68" r="22" fill="none" stroke="#D1F843" strokeWidth="2.5"/>
      <path d="M100 115 Q140 95 180 115" stroke="#D1F843" strokeWidth="2.5" fill="none"/>
      <rect x="70" y="145" width="140" height="55" rx="10" fill="none" stroke="#D1F843" strokeWidth="2.5"/>
      <circle cx="100" cy="165" r="12" fill="#D1F843" opacity="0.3"/>
      <line x1="122" y1="160" x2="190" y2="160" stroke="#D1F843" strokeWidth="2" opacity="0.7"/>
      <line x1="122" y1="172" x2="175" y2="172" stroke="#D1F843" strokeWidth="2" opacity="0.4"/>
      <circle cx="40" cy="40" r="4" fill="#D1F843" opacity="0.5"/>
      <circle cx="240" cy="30" r="3" fill="#D1F843" opacity="0.4"/>
      <circle cx="250" cy="160" r="5" fill="#D1F843" opacity="0.3"/>
    </svg>
  )
}

function BrandingSVG() {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 280 }}>
      <path d="M140 40 C90 40 50 80 50 130 C50 160 70 180 95 180 C110 180 118 168 130 168 C142 168 140 180 155 180 C185 180 230 155 230 130 C230 80 190 40 140 40Z" fill="none" stroke="#D1F843" strokeWidth="3"/>
      <circle cx="100" cy="100" r="14" fill="#D1F843" opacity="0.8"/>
      <circle cx="140" cy="80" r="14" fill="#D1F843" opacity="0.5"/>
      <circle cx="180" cy="100" r="14" fill="#D1F843" opacity="0.3"/>
      <circle cx="175" cy="145" r="14" fill="#D1F843" opacity="0.6"/>
      <circle cx="105" cy="145" r="14" fill="#D1F843" opacity="0.4"/>
      <line x1="210" y1="50" x2="165" y2="95" stroke="#D1F843" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="215" cy="45" rx="10" ry="6" transform="rotate(-45 215 45)" fill="#D1F843" opacity="0.7"/>
      <circle cx="40" cy="60" r="3" fill="#D1F843" opacity="0.5"/>
      <circle cx="250" cy="170" r="4" fill="#D1F843" opacity="0.4"/>
    </svg>
  )
}

function CelebrationSVG() {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 280 }}>
      <path d="M140 180 L125 140 L140 60 L155 140 Z" fill="none" stroke="#D1F843" strokeWidth="3"/>
      <path d="M125 140 L105 155 L120 130 Z" fill="#D1F843" opacity="0.4"/>
      <path d="M155 140 L175 155 L160 130 Z" fill="#D1F843" opacity="0.4"/>
      <circle cx="140" cy="110" r="12" fill="#D1F843" opacity="0.6"/>
      <path d="M130 178 Q140 195 150 178" stroke="#D1F843" strokeWidth="2.5" fill="none" opacity="0.8"/>
      <path d="M134 182 Q140 200 146 182" stroke="#D1F843" strokeWidth="1.5" fill="none" opacity="0.5"/>
      <circle cx="60" cy="60" r="5" fill="#D1F843" opacity="0.7"/>
      <circle cx="220" cy="50" r="4" fill="#D1F843" opacity="0.6"/>
      <circle cx="50" cy="140" r="3" fill="#D1F843" opacity="0.5"/>
      <circle cx="240" cy="120" r="6" fill="#D1F843" opacity="0.4"/>
      <circle cx="80" cy="30" r="3" fill="#D1F843" opacity="0.8"/>
      <circle cx="200" cy="170" r="4" fill="#D1F843" opacity="0.5"/>
      <path d="M70 90 L75 80 L80 90 L70 90Z" fill="#D1F843" opacity="0.6"/>
      <path d="M200 90 L205 80 L210 90 L200 90Z" fill="#D1F843" opacity="0.5"/>
    </svg>
  )
}

const CONTENT = [
  { title: 'Configura tu negocio',   sub: 'En menos de 2 minutos tendrás tu programa de fidelización listo.' },
  { title: 'Personaliza tu perfil',  sub: 'Añade los datos de contacto del responsable del programa.' },
  { title: 'Dale tu toque personal', sub: 'Sube tu logo y elige los colores que representen tu marca.' },
  { title: '¡Ya casi estás!',        sub: 'Tus clientes podrán acumular puntos desde hoy mismo.' },
]

export default function LeftPanel({ step }: { step: number }) {
  const idx = step - 1
  const content = CONTENT[idx] || CONTENT[0]

  return (
    <div style={{
      background: '#005840', width: '100%', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 40px', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ alignSelf: 'flex-start', marginBottom: 48 }}>
        <span style={{ color: '#D1F843', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>Fidel</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>app</span>
      </div>

      {/* Ilustración */}
      <div style={{ marginBottom: 40 }}>
        {step === 1 && <BusinessSVG />}
        {step === 2 && <ProfileSVG />}
        {step === 3 && <BrandingSVG />}
        {step === 4 && <CelebrationSVG />}
      </div>

      {/* Texto */}
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: '#D1F843', fontWeight: 700, fontSize: 22, margin: '0 0 12px' }}>{content.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{content.sub}</p>
      </div>

      {/* Puntos de navegación */}
      <div style={{ display: 'flex', gap: 8, marginTop: 48 }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{
            width: n === step ? 24 : 8, height: 8, borderRadius: 4,
            background: n === step ? '#D1F843' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  )
}
