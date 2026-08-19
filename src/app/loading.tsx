export default function RootLoading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem',
      background: '#0f172a',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,.15)', borderTopColor: '#5FE3D0',
        animation: 'we-make-spin .8s linear infinite',
      }} />
      <div style={{
        fontSize: '.82rem', fontWeight: 600, color: 'rgba(255,255,255,.6)',
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
