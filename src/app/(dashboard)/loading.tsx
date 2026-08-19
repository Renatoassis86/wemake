export default function DashboardLoading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem',
      background: '#f8fafc',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #e2e8f0', borderTopColor: '#4A7FDB',
        animation: 'we-make-spin .8s linear infinite',
      }} />
      <div style={{
        fontSize: '.82rem', fontWeight: 600, color: '#64748b',
        fontFamily: 'var(--font-inter, sans-serif)',
      }}>
        Carregando...
      </div>
      <style>{`
        @keyframes we-make-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
