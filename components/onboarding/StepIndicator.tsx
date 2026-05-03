const STEPS = [
  { n: 1, label: 'Tu negocio', icon: '🏪' },
  { n: 2, label: 'Tu perfil',  icon: '👤' },
  { n: 3, label: 'Identidad',  icon: '🎨' },
  { n: 4, label: '¡Listo!',    icon: '🎉' },
]

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  const pct = ((currentStep - 1) / 3) * 100

  return (
    <div>
      {/* Barra de progreso */}
      <div style={{ background: '#dde5e3', borderRadius: 99, height: 6, marginBottom: 20 }}>
        <div style={{
          background: '#D1F843', borderRadius: 99, height: 6,
          width: `${pct}%`, transition: 'width 0.4s ease',
        }} />
      </div>
      {/* Pasos */}
      <div style={{ display: 'flex', gap: 0 }}>
        {STEPS.map(s => {
          const active = s.n === currentStep
          const done   = s.n < currentStep
          return (
            <div key={s.n} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 6px',
                background: done ? '#005840' : active ? '#D1F843' : '#dde5e3',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700,
                color: done ? '#D1F843' : active ? '#005840' : '#999',
                transition: 'all 0.3s ease',
              }}>
                {done ? '✓' : s.icon}
              </div>
              <div style={{
                fontSize: 11,
                color: active ? '#005840' : '#888',
                fontWeight: active ? 700 : 400,
              }}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
