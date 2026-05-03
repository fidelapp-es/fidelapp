interface Props {
  data: Record<string, any>
  onFinish: () => void
  saving: boolean
}

export default function Step4Complete({ data, onFinish, saving }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: '#005840', margin: '0 0 12px' }}>¡Todo listo!</h2>
      <p style={{ color: '#666', fontSize: 16, margin: '0 0 32px', lineHeight: 1.6 }}>
        Tu programa de fidelización está configurado y listo para funcionar.
      </p>

      {/* Resumen */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        marginBottom: 32, textAlign: 'left', border: '1px solid #eee',
      }}>
        {data.business_name && <SummaryRow icon="🏪" label="Negocio" value={data.business_name} />}
        {data.business_category && <SummaryRow icon="📂" label="Categoría" value={data.business_category} />}
        {data.contact_name && (
          <SummaryRow
            icon="👤"
            label="Contacto"
            value={`${data.contact_name}${data.contact_role ? ` — ${data.contact_role}` : ''}`}
          />
        )}
        {data.business_city && <SummaryRow icon="📍" label="Ciudad" value={data.business_city} />}
      </div>

      <button
        onClick={onFinish}
        disabled={saving}
        style={{
          width: '100%', padding: '16px', borderRadius: 14,
          background: '#005840', color: '#D1F843', fontWeight: 700, fontSize: 18,
          border: 'none', cursor: 'pointer',
        }}
      >
        {saving ? 'Un momento...' : 'Ir al Dashboard →'}
      </button>
    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: '1px solid #f5f5f5',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 15, color: '#1a1a2e', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}
