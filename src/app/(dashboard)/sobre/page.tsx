import PageHeader from '@/components/layout/PageHeader'

export default function SobrePage() {
  return (
    <div>
      <PageHeader title="A Plataforma" subtitle="We Make Gestão Comercial · We Make" />
      <div style={{ padding: '2rem 2.5rem', maxWidth: 960, margin: '0 auto' }}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 20, padding: '2.5rem 3rem', marginBottom: '2rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(217,119,6,.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, right: 80, width: 140, height: 140, borderRadius: '50%', background: 'rgba(217,119,6,.05)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'rgba(217,119,6,.15)', border: '1px solid rgba(217,119,6,.3)', borderRadius: 9999, padding: '.3rem .85rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
              <span style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#d97706', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Plataforma Interna · Equipe Comercial
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: '.85rem' }}>
              Gestão comercial inteligente<br />
              <span style={{ color: '#d97706' }}>para transformar parcerias em impacto</span>
            </h1>
            <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.7, fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 520 }}>
              O We Make Gestão Comercial foi desenvolvido exclusivamente para a equipe da We Make. Centraliza escolas, negociações, contratos e análises em um único ambiente seguro, ágil e focado em resultados.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {[
              ['11', 'módulos integrados'],
              ['360°', 'visão do parceiro'],
              ['Real-time', 'indicadores'],
              ['Seguro', 'acesso por perfil'],
            ].map(([val, sub]) => (
              <div key={val}>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', marginTop: '.2rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PROPÓSITO + JUSTIFICATIVA ────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 8px rgba(15,23,42,.05)', borderTop: '3px solid #d97706' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fffbeb', border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#d97706', marginBottom: '.5rem' }}>
              Propósito
            </div>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '.65rem', lineHeight: 1.25 }}>
              Centralizar para decidir melhor
            </h3>
            <p style={{ fontSize: '.85rem', color: '#475569', lineHeight: 1.7, fontFamily: 'var(--font-inter,sans-serif)' }}>
              Toda a gestão de propostas, registros de negociações e indicadores de desempenho em um único ambiente. A equipe ganha visão clara das oportunidades e toma decisões estratégicas com base em dados reais.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 8px rgba(15,23,42,.05)', borderTop: '3px solid #0f172a' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#0f172a', marginBottom: '.5rem' }}>
              Por que foi criado
            </div>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '.65rem', lineHeight: 1.25 }}>
              Controle, padronização e agilidade
            </h3>
            <p style={{ fontSize: '.85rem', color: '#475569', lineHeight: 1.7, fontFamily: 'var(--font-inter,sans-serif)' }}>
              Sem um sistema único, a equipe perdia tempo com retrabalho e informações espalhadas. Esta plataforma padroniza os processos comerciais, aumenta a agilidade no atendimento e garante rastreabilidade em cada etapa da jornada de parceria.
            </p>
          </div>
        </div>

        {/* ── FUNCIONALIDADES ─────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 8px rgba(15,23,42,.05)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fffbeb', border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#d97706' }}>Módulos Disponíveis</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Tudo que você precisa para vender mais</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem' }}>
            {[
              { title: 'Cadastro de Escolas', desc: 'Ficha completa com dados, contatos, perfil pedagógico e alunos por série.' },
              { title: 'Registro de Negociação', desc: 'Documente reuniões e interações com diagnóstico de interesse e prontidão.' },
              { title: 'Dashboard Comercial', desc: 'KPIs ao vivo: leads, potencial financeiro, registros e tarefas da equipe.' },
              { title: 'Jornada de Relacionamento', desc: 'Linha do tempo visual de todo o histórico com cada escola parceira.' },
              { title: 'Jornada Contratual', desc: 'Checklist de progresso com metas de alunos e receita para 2026.' },
              { title: 'Pipeline Kanban', desc: 'Negociações por estágio e por consultor em quadros visuais organizados.' },
              { title: 'Calculadora Eskolare', desc: 'Precificação por segmento com taxas, comissão e manutenção calculados.' },
              { title: 'Downloads', desc: 'Ficha cadastral, minuta do contrato e exportação dos formulários.' },
              { title: 'Formulário para Escolas', desc: 'Página pública para escolas iniciarem o pré-cadastro sem precisar de login.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, padding: '1rem 1.1rem' }}>
                <div style={{ marginBottom: '.5rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '.3rem' }}>{f.title}</div>
                <div style={{ fontSize: '.72rem', color: '#64748b', lineHeight: 1.55, fontFamily: 'var(--font-inter,sans-serif)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MISSÃO, VISÃO E VALORES ─────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#d97706', marginBottom: '1.25rem' }}>
            Identidade da We Make
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: '1.25rem', borderLeft: '3px solid #d97706' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#d97706', marginBottom: '.5rem' }}>Missão</div>
              <p style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.05rem', fontStyle: 'italic', color: '#fff', lineHeight: 1.55 }}>
                Conduzir pessoas ao deslumbramento a partir de uma educação cristã de excelência.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: '1.25rem', borderLeft: '3px solid rgba(255,255,255,.2)' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.5)', marginBottom: '.5rem' }}>Visão</div>
              <p style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.05rem', fontStyle: 'italic', color: 'rgba(255,255,255,.8)', lineHeight: 1.55 }}>
                Ser uma ponte que resgata o melhor do passado, educando mentes e corações para a contemplação, a virtude e a glória de Deus.
              </p>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)', marginBottom: '1rem' }}>
            Valores Organizacionais
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            {[
              { eixo: 'Cristão', cor: '#f59e0b', valores: ['Piedade', 'Sabedoria', 'Amor', 'Cosmovisão'] },
              { eixo: 'Pedagógico', cor: '#60a5fa', valores: ['Liberdade', 'Excelência', 'Integralidade', 'Beleza', 'Tradição', 'Verdade'] },
              { eixo: 'Inovação', cor: '#34d399', valores: ['Estética', 'Criatividade', 'Regionalidade', 'Tecnologia', 'Experiência'] },
              { eixo: 'Organizacional', cor: '#c084fc', valores: ['Transparência', 'Prudência', 'Mordomia', 'Comprometimento'] },
            ].map(e => (
              <div key={e.eixo} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '1rem', borderTop: `2px solid ${e.cor}` }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: e.cor, marginBottom: '.6rem' }}>{e.eixo}</div>
                {e.valores.map(v => (
                  <div key={v} style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.65)', padding: '.2rem 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontFamily: 'var(--font-inter,sans-serif)' }}>{v}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── IMPACTO ESPERADO ─────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 8px rgba(15,23,42,.05)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#16a34a' }}>Resultados Esperados</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>O que queremos alcançar juntos</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {[
              { num: '01', title: 'Processos organizados', desc: 'Fluxos comerciais padronizados e rastreáveis do primeiro contato ao contrato assinado.' },
              { num: '02', title: 'Decisões embasadas', desc: 'Analytics e KPIs em tempo real para orientar a estratégia com dados reais da operação.' },
              { num: '03', title: 'Parcerias fortalecidas', desc: 'Histórico completo de cada escola para um atendimento mais consultivo e próximo.' },
            ].map(i => (
              <div key={i.num} style={{ padding: '1.1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, color: '#d97706', lineHeight: 1, marginBottom: '.5rem' }}>{i.num}</div>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '.3rem' }}>{i.title}</div>
                <div style={{ fontSize: '.75rem', color: '#64748b', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>{i.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            PLATAFORMA PAIDEIA — DEMONSTRAÇÃO
            ══════════════════════════════════════════════════════════ */}

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2.5rem 0 2rem' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #e2e8f0)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.4rem 1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 9999 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
            <span style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#d97706', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Parceria Educacional
            </span>
          </div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #e2e8f0)' }} />
        </div>

        {/* ── Hero PAIDEIA ── */}
        <div style={{
          background: 'linear-gradient(135deg, #faf7f0 0%, #fff8e8 50%, #faf7f0 100%)',
          border: '1px solid #fde68a', borderRadius: 20,
          padding: '2.5rem', marginBottom: '1.5rem',
          overflow: 'hidden', position: 'relative',
        }}>
          {/* Ornamentos de fundo */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(217,119,6,.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: 40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(217,119,6,.04)', pointerEvents: 'none' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            {/* Texto */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.3)', borderRadius: 9999, padding: '.3rem .85rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#b45309', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  ✦ Sistema de Ensino We Make
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(1.6rem, 2.5vw, 2rem)', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, marginBottom: '.85rem' }}>
                Educando para<br />
                <span style={{ color: '#d97706' }}>a eternidade</span>
              </h2>
              <p style={{ fontSize: '.875rem', color: '#475569', lineHeight: 1.75, fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '1.25rem' }}>
                O homem, criado à imagem e semelhança de Deus, não nasce pronto. É uma criatura em potência, chamada a realizar-se pela assimilação do Bom, do Belo e do Verdadeiro. É exatamente isso que uma verdadeira educação faz: conduz o homem à Grande Conversa.
              </p>
              <p style={{ fontSize: '.875rem', color: '#475569', lineHeight: 1.75, fontFamily: 'var(--font-inter,sans-serif)' }}>
                Uma formação que capacita as pessoas a conhecerem a si mesmas, cultivar a sabedoria, fazer as perguntas certas — tornando-as livres para pensar e para ser quem Deus as criou para ser.
              </p>
            </div>

            {/* Imagem ilustrativa — escola comercial */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100%', aspectRatio: '4/3',
                borderRadius: 20, overflow: 'hidden',
                background: 'linear-gradient(145deg, #0f2744 0%, #1a3a6b 45%, #0f172a 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 16px 48px rgba(15,23,42,.25)',
                position: 'relative',
              }}>
                <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <radialGradient id="glow1" cx="50%" cy="70%" r="55%">
                      <stop offset="0%" stopColor="#d97706" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="glow2" cx="30%" cy="40%" r="35%">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0"/>
                    </linearGradient>
                  </defs>

                  {/* Luz de fundo */}
                  <ellipse cx="200" cy="200" rx="180" ry="120" fill="url(#glow1)" />
                  <ellipse cx="130" cy="120" rx="100" ry="80" fill="url(#glow2)" />

                  {/* Estrelas */}
                  {[[30,20],[80,35],[150,18],[240,28],[310,15],[355,40],[20,60],[370,65]].map(([x,y],i) => (
                    <circle key={i} cx={x} cy={y} r={i%2===0?1.2:.8} fill="rgba(255,255,255,0.5)" />
                  ))}

                  {/* Prédio escolar — edificio principal */}
                  {/* Base/corpo */}
                  <rect x="110" y="110" width="180" height="130" rx="4" fill="#1e3a6b" stroke="#2d5a9e" strokeWidth="1.5"/>
                  {/* Telhado triangular */}
                  <polygon points="95,112 200,55 305,112" fill="#162d5a" stroke="#2d5a9e" strokeWidth="1.5"/>
                  {/* Frontão central */}
                  <polygon points="155,112 200,80 245,112" fill="#0f2040"/>

                  {/* Janelas — andar superior */}
                  {[130,175,220,265].map((x,i) => (
                    <g key={i}>
                      <rect x={x} y="125" width="28" height="32" rx="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" opacity="0.9"/>
                      {/* Luz acesa nas janelas */}
                      <rect x={x+2} y="127" width="11" height="28" rx="2" fill="#fbbf24" opacity={i%2===0?0.55:0.2}/>
                      <rect x={x+15} y="127" width="11" height="28" rx="2" fill="#fbbf24" opacity={i%2===0?0.2:0.5}/>
                    </g>
                  ))}

                  {/* Janelas — andar inferior */}
                  {[130,175,265].map((x,i) => (
                    <g key={i}>
                      <rect x={x} y="172" width="28" height="32" rx="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" opacity="0.9"/>
                      <rect x={x+2} y="174" width="11" height="28" rx="2" fill="#60a5fa" opacity="0.35"/>
                      <rect x={x+15} y="174" width="11" height="28" rx="2" fill="#fbbf24" opacity="0.3"/>
                    </g>
                  ))}

                  {/* Porta principal */}
                  <rect x="185" y="195" width="30" height="45" rx="3" fill="#0f172a" stroke="#d97706" strokeWidth="1.5"/>
                  <rect x="187" y="197" width="12" height="41" rx="2" fill="#1e3a6b"/>
                  <rect x="201" y="197" width="12" height="41" rx="2" fill="#1e3a6b"/>
                  {/* Maçaneta */}
                  <circle cx="199" cy="220" r="2" fill="#d97706"/>
                  <circle cx="201" cy="220" r="2" fill="#d97706"/>

                  {/* Bandeira no topo */}
                  <line x1="200" y1="30" x2="200" y2="58" stroke="#d97706" strokeWidth="1.5"/>
                  <polygon points="200,32 218,37 200,42" fill="#d97706" opacity="0.9"/>

                  {/* Caminho / calçada */}
                  <path d="M172,240 L172,268 L228,268 L228,240" fill="#162d5a" stroke="#2d5a9e" strokeWidth="1"/>
                  {/* Piso da calçada */}
                  <rect x="80" y="240" width="240" height="18" rx="2" fill="#1a2f50" stroke="#2d4a7a" strokeWidth="1"/>

                  {/* Árvores */}
                  {[[80,180],[310,175]].map(([x,y],i) => (
                    <g key={i}>
                      <rect x={x+8} y={y+20} width="6" height="30" rx="2" fill="#1a3a20"/>
                      <ellipse cx={x+11} cy={y+14} rx="18" ry="22" fill="#16532a" opacity="0.85"/>
                      <ellipse cx={x+11} cy={y+8} rx="13" ry="16" fill="#1a6b33" opacity="0.9"/>
                    </g>
                  ))}

                  {/* Placa da escola */}
                  <rect x="145" y="250" width="110" height="18" rx="4" fill="#d97706" opacity="0.85"/>
                  <text x="200" y="263" textAnchor="middle" fill="white" fontSize="7.5" fontFamily="Arial, sans-serif" fontWeight="bold" letterSpacing="0.5">ESCOLA PARCEIRA</text>

                  {/* Chão / gramado */}
                  <ellipse cx="200" cy="258" rx="160" ry="12" fill="#0d2010" opacity="0.5"/>
                </svg>

                {/* Badge flutuante */}
                <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(217,119,6,.92)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '.4rem .9rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                  <span style={{ fontSize: '.6rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-montserrat,sans-serif)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Parceria Educacional</span>
                </div>

                {/* Badge superior direito */}
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(15,23,42,.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 99, padding: '.3rem .75rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <span style={{ fontSize: '.58rem', fontWeight: 700, color: 'rgba(255,255,255,.7)', fontFamily: 'var(--font-montserrat,sans-serif)', letterSpacing: '.04em' }}>+282 escolas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Os 3 pilares — Cristão, Clássico, Bilíngue ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            {
              icone: '✝',
              titulo: 'Cristão',
              ref: '2 Timóteo 3.15',
              desc: 'Tem como fundamento a Bíblia, onde se encontra a referência para todo conhecimento, a fim de que o homem se torne apto para toda boa obra.',
              cor: '#d97706', bg: '#fffbeb', border: '#fde68a',
            },
            {
              icone: '◈',
              titulo: 'Clássico',
              ref: 'Trivium e Quadrivium',
              desc: 'Recupera a tradição pedagógica ocidental: Gramática, Lógica e Retórica formam mentes capazes de pensar, argumentar e se expressar com excelência.',
              cor: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
            },
            {
              icone: '◎',
              titulo: 'Bilíngue',
              ref: 'Inglês integrado ao currículo',
              desc: 'O idioma é aprendido de forma integrada ao conteúdo pedagógico, não como disciplina isolada, formando comunicadores fluentes e pensadores globais.',
              cor: '#16a34a', bg: '#f0fdf4', border: '#86efac',
            },
          ].map(p => (
            <div key={p.titulo} style={{ background: p.bg, border: `1.5px solid ${p.border}`, borderRadius: 16, padding: '1.5rem', borderTop: `3px solid ${p.cor}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: p.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '.85rem' }}>
                {p.icone}
              </div>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: p.cor, marginBottom: '.3rem' }}>{p.titulo}</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '.5rem' }}>{p.ref}</div>
              <p style={{ fontSize: '.78rem', color: '#475569', lineHeight: 1.65, fontFamily: 'var(--font-inter,sans-serif)' }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* ── O que está na plataforma digital ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(15,23,42,.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>

            {/* Lado esquerdo — Ilustração */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 320,
            }}>
              <svg viewBox="0 0 320 280" xmlns="http://www.w3.org/2000/svg" style={{ width: '90%', maxWidth: 280 }}>
                <defs>
                  <linearGradient id="tela" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3a5f" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
                {/* Monitor */}
                <rect x="30" y="20" width="260" height="180" rx="12" fill="url(#tela)" stroke="#334155" strokeWidth="2" />
                <rect x="40" y="30" width="240" height="160" rx="8" fill="#0f172a" />
                {/* Interface da plataforma */}
                {/* Header */}
                <rect x="40" y="30" width="240" height="28" rx="8" fill="#1e3a5f" />
                <circle cx="56" cy="44" r="5" fill="#d97706" opacity="0.8" />
                <rect x="70" y="40" width="80" height="8" rx="4" fill="rgba(255,255,255,0.2)" />
                {/* Cards de conteúdo */}
                {[0,1,2].map(i => (
                  <g key={i}>
                    <rect x={52 + i*80} y={72} width={68} height={88} rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <rect x={58 + i*80} y={80} width={56} height={36} rx="4" fill={['#d97706','#2563eb','#16a34a'][i]} opacity="0.3" />
                    {[0,1,2].map(j => (
                      <rect key={j} x={58 + i*80} y={122 + j*9} width={j===1?40:50} height={4} rx="2" fill="rgba(255,255,255,0.15)" />
                    ))}
                  </g>
                ))}
                {/* Suporte do monitor */}
                <rect x="145" y="200" width="30" height="20" rx="2" fill="#334155" />
                <rect x="110" y="218" width="100" height="8" rx="4" fill="#334155" />
                {/* Badge de acesso demo */}
                <rect x="60" y="240" width="200" height="28" rx="14" fill="#d97706" opacity="0.9" />
                <text x="160" y="259" textAnchor="middle" fill="white" fontSize="9" fontFamily="Arial, sans-serif" fontWeight="bold">
                  ACESSO DEMONSTRAÇÃO — 48H
                </text>
              </svg>
            </div>

            {/* Lado direito — O que está disponível */}
            <div style={{ padding: '2rem 2rem 2rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#d97706', marginBottom: '.75rem' }}>
                O que está disponível
              </div>
              <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.1rem', lineHeight: 1.2 }}>
                Plataforma de Demonstração<br />do Parceria Educacional
              </h3>
              {[
                { icon: '📘', titulo: 'Material do Aluno', desc: 'Organização dos conteúdos, estrutura das aulas e atividades.' },
                { icon: '📗', titulo: 'Material do Professor', desc: 'Planejamento, orientações pedagógicas e objetivos de aprendizagem.' },
                { icon: '🎥', titulo: 'Vídeos de Formação Docente', desc: 'Proposta pedagógica, fundamentos e aplicação em sala de aula.' },
                { icon: '💻', titulo: 'Ambiente Digital', desc: 'Navegação pela plataforma e estrutura do ecossistema digital.' },
              ].map(item => (
                <div key={item.titulo} style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '.85rem' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.78rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.1rem' }}>{item.titulo}</div>
                    <div style={{ fontSize: '.72rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card de acesso à demonstração ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)',
          borderRadius: 20, padding: '2rem 2.5rem', marginBottom: '1.5rem',
          border: '1px solid rgba(217,119,6,.2)',
          boxShadow: '0 8px 32px rgba(15,23,42,.2)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Ornamentos */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(217,119,6,.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>

              {/* Texto esquerdo */}
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'rgba(217,119,6,.2)', border: '1px solid rgba(217,119,6,.4)', borderRadius: 9999, padding: '.3rem .85rem', marginBottom: '1rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#d97706', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    Acesso Temporário — 48 Horas
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: '.75rem' }}>
                  Acesso à Plataforma<br />de Demonstração
                </h3>
                <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.7, fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 460, marginBottom: '1.25rem' }}>
                  Disponibilizamos um ambiente demonstrativo do PAIDEIA para que escolas e educadores possam conhecer, de forma prática, a proposta pedagógica, a organização dos conteúdos e a experiência digital do nosso currículo.
                </p>
                <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 460 }}>
                  Esta plataforma tem caráter demonstrativo e fica disponível por <strong style={{ color: 'rgba(255,255,255,.6)' }}>48 horas</strong>, com acesso restrito a uma amostra representativa do material. Para novas visualizações, será necessária nova solicitação.
                </p>
              </div>

              {/* Card de credenciais */}
              <div style={{ background: 'rgba(255,255,255,.07)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: '1.5rem', minWidth: 280, flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#d97706', marginBottom: '1rem' }}>
                  🔐 Dados de Acesso
                </div>

                {/* Link */}
                <div style={{ marginBottom: '.85rem' }}>
                  <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.07em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>Link</div>
                  <a href="https://hub.cidadeviva.education/hub/login?t=professor" target="_blank" rel="noopener noreferrer" style={{ fontSize: '.72rem', color: '#d97706', fontFamily: 'var(--font-inter,sans-serif)', textDecoration: 'none', wordBreak: 'break-all' as const, display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    hub.cidadeviva.education/hub/login?t=professor
                  </a>
                  <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.3)', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.2rem' }}>Sempre entrar como <strong style={{ color: 'rgba(255,255,255,.5)' }}>professor</strong></div>
                </div>

                {/* Linha divisória */}
                <div style={{ height: 1, background: 'rgba(255,255,255,.08)', marginBottom: '.85rem' }} />

                {/* Login */}
                <div style={{ marginBottom: '.65rem' }}>
                  <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.07em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>📧 Login</div>
                  <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.72rem', color: '#fff', fontFamily: 'var(--font-inter,sans-serif)', letterSpacing: '.01em' }}>
                    demonstracao.plataforma.paideia@cidadeviva.org
                  </div>
                </div>

                {/* Senha */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.07em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>🔑 Senha</div>
                  <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.875rem', color: '#fbbf24', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 800, letterSpacing: '.1em' }}>
                    12345678
                  </div>
                </div>

                {/* Botão acessar */}
                <a href="https://hub.cidadeviva.education/hub/login?t=professor" target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem',
                  background: 'linear-gradient(135deg, #d97706, #b45309)',
                  color: '#fff', padding: '.7rem 1rem', borderRadius: 9999,
                  textDecoration: 'none', fontWeight: 700, fontSize: '.78rem',
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  boxShadow: '0 4px 14px rgba(217,119,6,.4)',
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Acessar Plataforma Demo
                </a>
              </div>
            </div>

            {/* Aviso de prazo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '.75rem 1rem', marginTop: '1.25rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                Para novas visualizações ou acesso em outros momentos, será necessário realizar uma <strong style={{ color: 'rgba(255,255,255,.7)' }}>nova solicitação</strong> conforme o avanço da negociação. Nossa equipe estará à disposição.
              </span>
            </div>
          </div>
        </div>

        {/* ── Mensagem pronta para WhatsApp/Email ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <div style={{ padding: '.9rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 700, color: '#0f172a' }}>Mensagem pronta — WhatsApp / E-mail</div>
                <div style={{ fontSize: '.62rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>Copie e envie para a escola ao disponibilizar o acesso demo</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <pre style={{
              fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.78rem',
              color: '#1e293b', lineHeight: 1.75, whiteSpace: 'pre-wrap',
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
              padding: '1.25rem', margin: 0,
            }}>{`🎓 *PLATAFORMA DE DEMONSTRAÇÃO – PAIDEIA*
_(Acesso temporário por 48 horas)_

Olá! Disponibilizamos um acesso demonstrativo ao nosso currículo para que você possa conhecer, na prática, a proposta pedagógica, a organização dos conteúdos e a experiência digital do PAIDEIA.

🔗 *Link de acesso:*
https://hub.cidadeviva.education/hub/login?t=professor
_(sempre entre como *professor*)_

🔐 *Dados de acesso:*
📧 Login: demonstracao.plataforma.paideia@cidadeviva.org
🔑 Senha: 12345678

📌 *O que você encontrará na plataforma:*
📘 Material do aluno — organização por ano/série e estrutura das aulas
📗 Material do professor — planejamento, orientações e objetivos
🎥 Vídeos de formação docente — fundamentos e aplicação prática
💻 Ambiente digital — navegação e organização do ecossistema

⏳ Este acesso ficará disponível por *48 horas*. Para novas visualizações, basta nos solicitar conforme avançarmos na conversa.

Qualquer dúvida, estou à disposição! 🙏`}</pre>
          </div>
        </div>

        {/* ── Rodapé ───────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '1rem', fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', letterSpacing: '.03em' }}>
          We Make © {new Date().getFullYear()} · Central de Inteligência Analítica · Plataforma de uso exclusivo da equipe interna
        </div>

      </div>
    </div>
  )
}

