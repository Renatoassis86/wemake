'use client'

/** Extrai o ID do arquivo de qualquer formato de link do Google Drive
 *  (/file/d/{id}/view, ?id={id}, /open?id={id}) — devolve null se não reconhecer. */
function driveFileId(url: string): string | null {
  const porCaminho = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/)
  if (porCaminho) return porCaminho[1]
  const porQuery = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/)
  return porQuery ? porQuery[1] : null
}

/** Embute o preview do Drive pra um documento (contrato original ou aditivo).
 *  Só carrega de fato se o arquivo estiver compartilhado de um jeito que
 *  permita visualização por quem estiver logado na plataforma — se não
 *  estiver, o Drive mostra sua própria tela de "sem permissão" dentro do
 *  iframe (não tem como a nossa página detectar isso, é conteúdo de outro
 *  domínio). */
export function DriveDocViewer({ driveUrl, titulo }: { driveUrl: string | null; titulo: string }) {
  if (!driveUrl) {
    return (
      <div style={{
        padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8',
        fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)',
        background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0',
      }}>
        Nenhum documento vinculado ainda.
      </div>
    )
  }

  const id = driveFileId(driveUrl)
  if (!id) {
    return (
      <div style={{ padding: '1rem', fontSize: '.82rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>
        Link do Drive não reconhecido.{' '}
        <a href={driveUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00889e' }}>Abrir mesmo assim ↗</a>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
      <iframe
        src={`https://drive.google.com/file/d/${id}/preview`}
        title={titulo}
        width="100%"
        height="480"
        allow="autoplay"
        style={{ border: 'none', display: 'block' }}
      />
    </div>
  )
}
