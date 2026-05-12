import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Usa domínio verificado ou fallback para testes via Resend
const FROM = 'CVE Agenda <agenda@gestaoeducation.arkosintelligence.com>'

interface ConviteParams {
  para: string
  nomeDestinatario: string
  tituloEvento: string
  dataInicio: string    // ISO string
  dataFim: string       // ISO string
  local: string | null
  descricao: string | null
  organizador: string
  diaInteiro: boolean
}

function fmtDataHora(iso: string, diaInteiro: boolean) {
  const d = new Date(iso)
  const data = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  if (diaInteiro) return data
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${data} às ${hora}`
}

function htmlConvite(p: ConviteParams) {
  const inicio = fmtDataHora(p.dataInicio, p.diaInteiro)
  const fim    = p.diaInteiro ? '' : new Date(p.dataFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const isLink = p.local?.startsWith('http')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Convite: ${p.tituloEvento}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px 16px 0 0;padding:32px 40px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d97706;margin-bottom:8px;">
              ✦ CVE Gestão Comercial
            </div>
            <div style="font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;margin-bottom:6px;">
              ${p.tituloEvento}
            </div>
            <div style="font-size:14px;color:rgba(255,255,255,0.55);">
              Você foi convidado por <strong style="color:rgba(255,255,255,0.8);">${p.organizador}</strong>
            </div>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="background:#ffffff;padding:32px 40px;">

            <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
              Olá${p.nomeDestinatario ? `, <strong>${p.nomeDestinatario}</strong>` : ''}! Você tem uma nova reunião agendada no sistema CVE.
            </p>

            <!-- Detalhes -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #f1f5f9;">
                  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Data e Horário</div>
                  <div style="font-size:15px;font-weight:600;color:#0f172a;text-transform:capitalize;">
                    ${inicio}${fim ? ` — ${fim}` : ''}
                  </div>
                </td>
              </tr>
              ${p.local ? `
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #f1f5f9;">
                  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">${isLink ? 'Link da Reunião' : 'Local'}</div>
                  <div style="font-size:15px;font-weight:600;color:#0f172a;">
                    ${isLink
                      ? `<a href="${p.local}" style="color:#2563eb;text-decoration:none;">🔗 Clique aqui para entrar na reunião</a>`
                      : p.local
                    }
                  </div>
                </td>
              </tr>` : ''}
              ${p.descricao ? `
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Pauta / Observações</div>
                  <div style="font-size:14px;color:#475569;line-height:1.6;">${p.descricao.replace(/\n/g, '<br/>')}</div>
                </td>
              </tr>` : ''}
            </table>

            <!-- CTA se tiver link -->
            ${isLink ? `
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${p.local}" style="display:inline-block;background:linear-gradient(135deg,#d97706,#b45309);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:9999px;box-shadow:0 4px 14px rgba(217,119,6,0.4);">
                Entrar na Reunião Online
              </a>
            </div>` : ''}

            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
              Este é um convite automático do sistema CVE Gestão Comercial.<br/>
              Acesse a plataforma para mais detalhes ou para confirmar sua presença.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <div style="font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} Cidade Viva Education · CVE Gestão Comercial
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`
}

export async function enviarConviteReuniao(params: ConviteParams) {
  try {
    const { error } = await resend.emails.send({
      from:    FROM,
      to:      [params.para],
      subject: `📅 Convite: ${params.tituloEvento} — CVE Education`,
      html:    htmlConvite(params),
    })
    if (error) {
      console.error('Resend error:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('Email send failed:', e)
    return false
  }
}

export async function enviarConvitesEvento({
  eventoId,
  titulo,
  dataInicio,
  dataFim,
  local,
  descricao,
  diaInteiro,
  organizadorNome,
  participantes,
}: {
  eventoId:       string
  titulo:         string
  dataInicio:     string
  dataFim:        string
  local:          string | null
  descricao:      string | null
  diaInteiro:     boolean
  organizadorNome: string
  participantes:  { email: string; nome: string | null; participanteId: string }[]
}) {
  const resultados = await Promise.allSettled(
    participantes.map(p =>
      enviarConviteReuniao({
        para:             p.email,
        nomeDestinatario: p.nome ?? '',
        tituloEvento:     titulo,
        dataInicio,
        dataFim,
        local,
        descricao,
        organizador:      organizadorNome,
        diaInteiro,
      })
    )
  )

  const enviados = resultados.filter(r => r.status === 'fulfilled' && r.value).length
  return { enviados, total: participantes.length }
}
