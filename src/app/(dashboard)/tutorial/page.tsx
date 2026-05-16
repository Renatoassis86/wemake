import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'

// ── Ilustrações SVG inline (geradas como "imagens IA" estilizadas) ────────────

function IlustrDashboard() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="gd1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a"/><stop offset="100%" stopColor="#1e3a5f"/>
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gd1)" rx="12"/>
      {/* Sidebar */}
      <rect x="10" y="10" width="70" height="240" rx="8" fill="rgba(255,255,255,.06)"/>
      {[40,65,90,115,140,165].map((y,i) => (
        <rect key={i} x="18" y={y} width={i===0?54:44} height="14" rx="4" fill={i===0?"#4A7FDB":"rgba(255,255,255,.12)"}/>
      ))}
      {/* Main area */}
      <rect x="92" y="10" width="298" height="50" rx="8" fill="rgba(255,255,255,.06)"/>
      <rect x="102" y="22" width="120" height="10" rx="3" fill="rgba(255,255,255,.4)"/>
      <rect x="102" y="36" width="80" height="6" rx="3" fill="rgba(255,255,255,.2)"/>
      {/* KPI cards */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x={92+i*75} y="72" width="68" height="50" rx="6" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.1)" strokeWidth="1"/>
          <rect x={92+i*75} y="72" width="68" height="4" rx="2" fill={['#4A7FDB','#dc2626','#2563eb','#16a34a'][i]}/>
          <rect x={100+i*75} y="84" width="40" height="5" rx="2" fill="rgba(255,255,255,.25)"/>
          <rect x={100+i*75} y="94" width="28" height="14" rx="3" fill="rgba(255,255,255,.5)"/>
          <rect x={100+i*75} y="112" width="35" height="4" rx="2" fill="rgba(255,255,255,.15)"/>
        </g>
      ))}
      {/* Charts area */}
      <rect x="92" y="134" width="190" height="116" rx="8" fill="rgba(255,255,255,.06)"/>
      {[0,1,2,3,4,5].map(i => (
        <rect key={i} x={105+i*30} y={200-[40,60,35,80,55,70][i]} width="20" height={[40,60,35,80,55,70][i]} rx="4" fill={`rgba(74,127,219,${0.3+i*0.1})`}/>
      ))}
      <rect x="294" y="134" width="96" height="116" rx="8" fill="rgba(255,255,255,.06)"/>
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="304" y={146+i*26} width="8" height="8" rx="2" fill={['#4A7FDB','#dc2626','#2563eb','#16a34a'][i]}/>
          <rect x="316" y={148+i*26} width="50" height="4" rx="2" fill="rgba(255,255,255,.25)"/>
          <rect x="316" y={156+i*26} width="35" height="3" rx="2" fill="rgba(255,255,255,.1)"/>
        </g>
      ))}
      <text x="200" y="250" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" fontFamily="Arial">Dashboard Comercial</text>
    </svg>
  )
}

function IlustrEscolas() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="ge1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b"/><stop offset="100%" stopColor="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#ge1)" rx="12"/>
      {/* Hero card */}
      <rect x="15" y="15" width="370" height="80" rx="10" fill="rgba(255,255,255,.06)"/>
      <rect x="25" y="25" width="60" height="60" rx="8" fill="rgba(74,127,219,.2)" stroke="#4A7FDB" strokeWidth="1"/>
      {/* School icon */}
      <path d="M55 45 L70 36 L85 45 L85 60 L25 60 L25 45 Z" fill="none" stroke="#4A7FDB" strokeWidth="1.5" transform="translate(-20,0)"/>
      <rect x="47" y="50" width="16" height="14" rx="2" fill="#4A7FDB" opacity=".6" transform="translate(-5,0)"/>
      <rect x="100" y="26" width="140" height="8" rx="3" fill="rgba(255,255,255,.5)"/>
      <rect x="100" y="38" width="100" height="5" rx="2" fill="rgba(255,255,255,.2)"/>
      <rect x="100" y="47" width="80" height="5" rx="2" fill="rgba(255,255,255,.15)"/>
      <rect x="280" y="30" width="60" height="18" rx="9" fill="rgba(74,127,219,.3)" stroke="#4A7FDB" strokeWidth="1"/>
      <rect x="283" y="51" width="54" height="14" rx="7" fill="rgba(37,99,235,.3)" stroke="#2563eb" strokeWidth="1"/>
      {/* List rows */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="15" y={108+i*37} width="370" height="32" rx="7" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
          <rect x="25" y={114+i*37} width="8" height="8" rx="2" fill={['#dc2626','#4A7FDB','#2563eb','#16a34a'][i]}/>
          <rect x="40" y={115+i*37} width="80" height="6" rx="2" fill="rgba(255,255,255,.4)"/>
          <rect x="40" y={124+i*37} width="55" height="4" rx="2" fill="rgba(255,255,255,.15)"/>
          <rect x="160" y={116+i*37} width="50" height="12" rx="6" fill={`rgba(${['220,38,38','217,119,6','37,99,235','22,163,74'][i]},.2)`}/>
          <rect x="250" y={117+i*37} width="55" height="5" rx="2" fill="rgba(255,255,255,.25)"/>
          <rect x="350" y={115+i*37} width="24" height="8" rx="4" fill="rgba(74,127,219,.4)"/>
          <rect x="378" y={115+i*37} width="0" height="0"/>
        </g>
      ))}
      <text x="200" y="252" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" fontFamily="Arial">Gestão de Escolas</text>
    </svg>
  )
}

function IlustrJornada() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="260" fill="#0f172a" rx="12"/>
      {/* Timeline line */}
      <line x1="60" y1="30" x2="60" y2="230" stroke="rgba(74,127,219,.3)" strokeWidth="2" strokeDasharray="4,4"/>
      {/* Events */}
      {[
        { y:40, cor:'#6366f1', label:'Primeiro Contato', sub:'WhatsApp · 15/01' },
        { y:90, cor:'#4A7FDB', label:'Apresentação Paideia', sub:'Videoconf · 28/01' },
        { y:140, cor:'#2563eb', label:'Envio de Proposta', sub:'E-mail · 05/02' },
        { y:190, cor:'#16a34a', label:'Contrato Assinado', sub:'Presencial · 14/02' },
      ].map((e,i) => (
        <g key={i}>
          <circle cx="60" cy={e.y+12} r="10" fill={e.cor} opacity=".9"/>
          <text x="60" y={e.y+16} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{i+1}</text>
          <rect x="82" y={e.y} width="295" height="40" rx="8" fill="rgba(255,255,255,.06)" stroke={`${e.cor}40`} strokeWidth="1.5"/>
          <rect x="82" y={e.y} width="4" height="40" rx="2" fill={e.cor}/>
          <rect x="96" y={e.y+8} width="100" height="7" rx="3" fill="rgba(255,255,255,.45)"/>
          <rect x="96" y={e.y+20} width="70" height="5" rx="2" fill="rgba(255,255,255,.2)"/>
          <rect x="300" y={e.y+8} width="65" height="22" rx="6" fill={`${e.cor}20`} stroke={`${e.cor}40`} strokeWidth="1"/>
        </g>
      ))}
      <text x="200" y="252" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" fontFamily="Arial">Jornada de Relacionamento</text>
    </svg>
  )
}

function IlustrAgenda() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="260" fill="#0f172a" rx="12"/>
      {/* Calendar header */}
      <rect x="15" y="15" width="370" height="40" rx="8" fill="rgba(255,255,255,.06)"/>
      <rect x="25" y="25" width="80" height="10" rx="3" fill="rgba(255,255,255,.4)"/>
      <rect x="270" y="22" width="55" height="16" rx="8" fill="rgba(74,127,219,.8)"/>
      {/* Day headers */}
      {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d,i) => (
        <rect key={i} x={15+i*53} y="63" width="50" height="16" rx="4" fill="rgba(255,255,255,.04)"/>
      ))}
      {/* Calendar grid */}
      {[0,1,2,3,4].map(row => (
        [0,1,2,3,4,5,6].map(col => {
          const isToday = row===1 && col===3
          const hasEvent = (row===0&&col===2)||(row===1&&col===5)||(row===2&&col===1)||(row===3&&col===4)
          return (
            <g key={`${row}-${col}`}>
              <rect x={15+col*53} y={85+row*32} width="50" height="30" rx="4"
                fill={isToday?"rgba(74,127,219,.15)":"rgba(255,255,255,.03)"}
                stroke={isToday?"rgba(74,127,219,.5)":"rgba(255,255,255,.05)"} strokeWidth="1"/>
              {hasEvent && <rect x={18+col*53} y={96+row*32} width="42" height="8" rx="3" fill="rgba(37,99,235,.5)"/>}
              {isToday && <circle cx={40+col*53} cy={92+row*32} r="7" fill="rgba(74,127,219,.8)"/>}
            </g>
          )
        })
      ))}
      <text x="200" y="252" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" fontFamily="Arial">Agenda de Reuniões</text>
    </svg>
  )
}

function IlustrImportacao() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="260" fill="#0f172a" rx="12"/>
      {/* Upload area */}
      <rect x="30" y="20" width="160" height="100" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(74,127,219,.4)" strokeWidth="1.5" strokeDasharray="5,3"/>
      <circle cx="110" cy="55" r="18" fill="rgba(74,127,219,.2)"/>
      <path d="M103 55 L110 48 L117 55 M110 48 L110 65" stroke="#4A7FDB" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="60" y="80" width="100" height="6" rx="3" fill="rgba(255,255,255,.2)"/>
      <rect x="75" y="90" width="70" height="5" rx="2" fill="rgba(255,255,255,.1)"/>
      {/* Column selector */}
      <rect x="205" y="20" width="170" height="220" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.1)" strokeWidth="1"/>
      <rect x="215" y="30" width="100" height="7" rx="3" fill="rgba(255,255,255,.3)"/>
      {[0,1,2,3,4,5,6,7].map(i => (
        <g key={i}>
          <rect x={215} y={48+i*22} width="14" height="14" rx="3"
            fill={i<5?"rgba(22,163,74,.8)":"rgba(255,255,255,.1)"}
            stroke={i<5?"#16a34a":"rgba(255,255,255,.2)"} strokeWidth="1"/>
          {i<5 && <path d={`M${218} ${55+i*22} L${221} ${59+i*22} L${227} ${52+i*22}`} stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>}
          <rect x="235" y={51+i*22} width={[80,65,90,70,75,60,85,55][i]} height="6" rx="2" fill={i<5?"rgba(255,255,255,.35)":"rgba(255,255,255,.1)"}/>
          {i<5 && <rect x="317" y={50+i*22} width="40" height="8" rx="4" fill="rgba(22,163,74,.2)"/>}
        </g>
      ))}
      {/* Progress bar */}
      <rect x="30" y="135" width="160" height="8" rx="4" fill="rgba(255,255,255,.08)"/>
      <rect x="30" y="135" width="110" height="8" rx="4" fill="rgba(74,127,219,.7)"/>
      <rect x="30" y="152" width="160" height="30" rx="8" fill="rgba(22,163,74,.15)" stroke="rgba(22,163,74,.3)" strokeWidth="1"/>
      <rect x="50" y="162" width="80" height="6" rx="2" fill="rgba(22,163,74,.5)"/>
      <text x="200" y="252" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" fontFamily="Arial">Importação Power BI</text>
    </svg>
  )
}

function IlustrPipeline() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="260" fill="#0f172a" rx="12"/>
      {[
        { x:10, label:'Prospecção', cor:'#6366f1', cards:3 },
        { x:85, label:'Qualificação', cor:'#8b5cf6', cards:2 },
        { x:160, label:'Proposta', cor:'#4A7FDB', cards:2 },
        { x:235, label:'Negociação', cor:'#0ea5e9', cards:1 },
        { x:310, label:'Fechamento', cor:'#16a34a', cards:1 },
      ].map((col,ci) => (
        <g key={ci}>
          <rect x={col.x} y="10" width="72" height="240" rx="8" fill="rgba(255,255,255,.04)"/>
          <rect x={col.x} y="10" width="72" height="28" rx="8" fill={`${col.cor}25`}/>
          <rect x={col.x} y="10" width="72" height="4" rx="2" fill={col.cor}/>
          <rect x={col.x+8} y="19" width="40" height="6" rx="2" fill={`${col.cor}cc`}/>
          {Array.from({length:col.cards}).map((_,i) => (
            <g key={i}>
              <rect x={col.x+6} y={48+i*58} width="60" height="50" rx="6" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.1)" strokeWidth="1"/>
              <rect x={col.x+6} y={48+i*58} width="4" height="50" rx="2" fill={col.cor}/>
              <rect x={col.x+16} y={56+i*58} width="38" height="5" rx="2" fill="rgba(255,255,255,.45)"/>
              <rect x={col.x+16} y={65+i*58} width="28" height="4" rx="2" fill="rgba(255,255,255,.2)"/>
              <rect x={col.x+16} y={74+i*58} width="32" height="10" rx="5" fill={`${col.cor}30`}/>
              <rect x={col.x+16} y={87+i*58} width="20" height="4" rx="2" fill="rgba(255,255,255,.15)"/>
            </g>
          ))}
        </g>
      ))}
      <text x="200" y="255" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" fontFamily="Arial">Pipeline Kanban — arraste entre colunas</text>
    </svg>
  )
}

function IlustrMetas() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="260" fill="#0f172a" rx="12"/>
      {/* Hero banner */}
      <rect x="15" y="15" width="370" height="60" rx="10" fill="rgba(255,255,255,.04)"/>
      <rect x="25" y="25" width="140" height="10" rx="3" fill="rgba(255,255,255,.45)"/>
      <rect x="25" y="39" width="200" height="6" rx="2" fill="rgba(255,255,255,.2)"/>
      {/* Countdown */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x={280+i*26} y="18" width="22" height="28" rx="5" fill="rgba(74,127,219,.25)" stroke="rgba(74,127,219,.4)" strokeWidth="1"/>
          <rect x={283+i*26} y="25" width="16" height="8" rx="2" fill="rgba(74,127,219,.5)"/>
          <rect x={283+i*26} y="37" width="16" height="4" rx="2" fill="rgba(255,255,255,.1)"/>
        </g>
      ))}
      {/* KPI cards */}
      {[
        { label:'Reuniões', val:'0/80', pct:0, cor:'#2563eb' },
        { label:'Contratos', val:'0/26', pct:0, cor:'#4A7FDB' },
        { label:'Alunos', val:'2.000/5.000', pct:40, cor:'#7c3aed' },
      ].map((k,i) => (
        <g key={i}>
          <rect x={15+i*128} y="88" width="120" height="70" rx="8" fill="rgba(255,255,255,.05)" stroke={`${k.cor}30`} strokeWidth="1.5"/>
          <rect x={15+i*128} y="88" width="120" height="3" rx="1.5" fill={k.cor}/>
          <rect x={25+i*128} y="99" width="60" height="5" rx="2" fill="rgba(255,255,255,.2)"/>
          <rect x={25+i*128} y="108" width="50" height="14" rx="3" fill="rgba(255,255,255,.4)"/>
          <rect x={25+i*128} y="125" width="90" height="6" rx="3" fill="rgba(255,255,255,.08)"/>
          <rect x={25+i*128} y="125" width={k.pct*0.9} height="6" rx="3" fill={k.cor} opacity=".7"/>
          <rect x={25+i*128} y="134" width="40" height="4" rx="2" fill="rgba(255,255,255,.1)"/>
        </g>
      ))}
      {/* Progress bar total */}
      <rect x="15" y="172" width="370" height="40" rx="8" fill="rgba(22,163,74,.08)" stroke="rgba(22,163,74,.25)" strokeWidth="1"/>
      <rect x="25" y="181" width="120" height="6" rx="2" fill="rgba(255,255,255,.3)"/>
      <rect x="25" y="193" width="340" height="8" rx="4" fill="rgba(255,255,255,.06)"/>
      <rect x="25" y="193" width="136" height="8" rx="4" fill="rgba(22,163,74,.7)"/>
      <text x="200" y="252" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" fontFamily="Arial">Metas 2027 — Plano Estratégico</text>
    </svg>
  )
}

function IlustrBancoLeads() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="260" fill="#0f172a" rx="12"/>
      {/* KPIs */}
      {[
        {label:'Total',val:'981',cor:'#64748b'},
        {label:'Decisores',val:'685',cor:'#dc2626'},
        {label:'Email',val:'685',cor:'#2563eb'},
        {label:'2026',val:'485',cor:'#0d9488'},
      ].map((k,i) => (
        <rect key={i} x={10+i*97} y="10" width="90" height="42" rx="7"
          fill="rgba(255,255,255,.05)" stroke={`${k.cor}30`} strokeWidth="1.5"/>
      ))}
      {[{v:'981',c:'#64748b'},{v:'685',c:'#dc2626'},{v:'685',c:'#2563eb'},{v:'485',c:'#0d9488'}].map((k,i) => (
        <g key={i}>
          <rect x={18+i*97} y="19" width="40" height="5" rx="2" fill="rgba(255,255,255,.2)"/>
          <rect x={18+i*97} y="29" width="30" height="12" rx="3" fill={`${k.c}cc`}/>
        </g>
      ))}
      {/* Filters */}
      <rect x="10" y="62" width="185" height="28" rx="7" fill="rgba(255,255,255,.05)"/>
      <rect x="18" y="70" width="12" height="12" rx="2" fill="rgba(255,255,255,.15)"/>
      <rect x="35" y="72" width="120" height="6" rx="2" fill="rgba(255,255,255,.15)"/>
      <rect x="200" y="62" width="190" height="28" rx="7" fill="rgba(255,255,255,.05)"/>
      {['1ºCIECC','2ºCIECC','CRM','Oikos'].map((l,i) => (
        <rect key={i} x={208+i*46} y="69" width="42" height="14" rx="7"
          fill={i===0?"#0f172a":"rgba(255,255,255,.08)"}
          stroke={i===0?"rgba(255,255,255,.4)":"rgba(255,255,255,.1)"} strokeWidth="1"/>
      ))}
      {/* Table */}
      <rect x="10" y="100" width="380" height="22" rx="4" fill="#0f172a"/>
      {['#','Nome','Cargo','Escola','Contato','Cidade','Ações'].map((h,i) => (
        <rect key={i} x={10+[0,18,90,155,225,290,355][i]} y="106" width={[14,65,58,65,60,60,30][i]} height="8" rx="2" fill="rgba(255,255,255,.2)"/>
      ))}
      {[0,1,2,3,4].map(row => (
        <g key={row}>
          <rect x="10" y={126+row*24} width="380" height="22" rx="4"
            fill={row%2===0?"rgba(255,255,255,.03)":"transparent"}
            stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
          {[0,1,2,3,4,5].map(col => (
            <rect key={col} x={10+[0,18,90,155,225,290][col]} y={131+row*24}
              width={[14,65,58,65,60,60][col]} height="6" rx="2"
              fill={col===2?"rgba(220,38,38,.4)":col===0?"rgba(74,127,219,.5)":"rgba(255,255,255,.15)"}/>
          ))}
          {/* Action buttons */}
          <rect x="360" y={129+row*24} width="8" height="8" rx="2" fill="rgba(74,127,219,.4)"/>
          <rect x="372" y={129+row*24} width="8" height="8" rx="2" fill="rgba(37,99,235,.4)"/>
          <rect x="384" y={129+row*24} width="8" height="8" rx="2" fill="rgba(22,163,74,.4)"/>
        </g>
      ))}
      <text x="200" y="252" textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="9" fontFamily="Arial">Banco de Leads — 981 contatos</text>
    </svg>
  )
}

// ── Dados dos módulos ──────────────────────────────────────────────────────────

const MODULOS = [
  {
    id: 'dashboard',
    num: '01',
    titulo: 'Dashboard Comercial',
    href: '/comercial',
    cor: '#4A7FDB',
    bg: '#fffbeb',
    border: '#fde68a',
    tag: 'CRM',
    tagCor: '#4A7FDB',
    ilustracao: <IlustrDashboard />,
    para: 'Visão geral da operação comercial em tempo real.',
    como: [
      'Visualize os KPIs principais: total de escolas, leads quentes/mornos, registros do mês',
      'Acompanhe interações recentes e escolas que precisam de atenção',
      'Veja as escolas cadastradas que ainda não iniciaram negociação',
      'Acesse atalhos rápidos para as ações mais comuns',
    ],
    dica: 'O dashboard atualiza automaticamente conforme a equipe registra interações.',
  },
  {
    id: 'escolas',
    num: '02',
    titulo: 'Gestão de Escolas',
    href: '/comercial/escolas',
    cor: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    tag: 'CRM',
    tagCor: '#2563eb',
    ilustracao: <IlustrEscolas />,
    para: 'Cadastro completo de cada escola parceira ou prospect.',
    como: [
      'Cadastre uma nova escola com dados de identificação, endereço e contatos',
      'Informe a quantidade de alunos por segmento (Infantil, Fund.I, Fund.II, Médio)',
      'Defina o responsável comercial e a origem do lead',
      'Acesse a ficha completa de cada escola com toda a jornada de relacionamento',
    ],
    dica: 'O potencial financeiro é calculado automaticamente com base nos alunos cadastrados.',
  },
  {
    id: 'registros',
    num: '03',
    titulo: 'Registros de Interação',
    href: '/comercial/registros',
    cor: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    tag: 'CRM',
    tagCor: '#7c3aed',
    ilustracao: <IlustrJornada />,
    para: 'Documente cada contato com uma escola.',
    como: [
      'Clique em "+ Novo Registro" e selecione a escola',
      'Escolha o meio de contato (WhatsApp, e-mail, presencial, videoconf)',
      'Descreva o resumo da conversa e avalie interesse, prontidão e abertura',
      'Defina a data do próximo contato para manter o follow-up',
    ],
    dica: 'A probabilidade de fechamento é calculada automaticamente pela combinação de interesse + prontidão + abertura.',
  },
  {
    id: 'jornada-visual',
    num: '04',
    titulo: 'Jornada Visual',
    href: '/comercial/jornada-visual',
    cor: '#0ea5e9',
    bg: '#f0f9ff',
    border: '#bae6fd',
    tag: 'PROCESSO',
    tagCor: '#0ea5e9',
    ilustracao: <IlustrPipeline />,
    para: 'Infográfico do progresso comercial de cada escola pelas 10 etapas.',
    como: [
      'Selecione uma escola no topo da página',
      'Visualize em qual etapa ela está: Cadastro → Prospecção → ... → Parceria Ativa',
      'Acompanhe o histórico de interações em linha do tempo',
      'Veja o checklist contratual no painel lateral',
    ],
    dica: 'A etapa avança automaticamente conforme registros e contratos são atualizados.',
  },
  {
    id: 'jornada',
    num: '05',
    titulo: 'Jornada de Relacionamento',
    href: '/comercial/jornada',
    cor: '#4A7FDB',
    bg: '#fffbeb',
    border: '#fde68a',
    tag: 'PROCESSO',
    tagCor: '#4A7FDB',
    ilustracao: <IlustrJornada />,
    para: 'Storytelling visual da história comercial com cada escola.',
    como: [
      'Selecione a escola para ver sua narrativa completa de relacionamento',
      'Leia cada interação como um "capítulo" com temperatura emocional',
      'Veja a curva de engajamento (evolução da probabilidade)',
      'Identifique se a relação está avançando ou retraindo',
    ],
    dica: 'Ideal para preparar a próxima reunião — entenda o contexto histórico em segundos.',
  },
  {
    id: 'contratos',
    num: '06',
    titulo: 'Jornada Contratual',
    href: '/comercial/contratos',
    cor: '#16a34a',
    bg: '#f0fdf4',
    border: '#86efac',
    tag: 'PROCESSO',
    tagCor: '#16a34a',
    ilustracao: <IlustrEscolas />,
    para: 'Checklist de progresso contratual e gestão de alunos por segmento.',
    como: [
      'Selecione uma escola e marque cada etapa conforme avança',
      'Informe a quantidade de alunos por segmento e o valor por aluno',
      'Registre observações sobre a minuta e encaminhamentos',
      'Quando "Contrato assinado por ambas as partes" = Sim, a escola entra nas Metas 2027',
    ],
    dica: 'As metas de alunos e novas parcerias atualizam automaticamente ao marcar contrato assinado.',
  },
  {
    id: 'pipeline',
    num: '07',
    titulo: 'Pipeline Kanban',
    href: '/comercial/pipeline',
    cor: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
    tag: 'PROCESSO',
    tagCor: '#6366f1',
    ilustracao: <IlustrPipeline />,
    para: 'Quadros visuais de negociações por estágio — arraste e solte.',
    como: [
      'Crie negociações vinculadas a escolas com valor estimado',
      'Arraste os cards entre as colunas para avançar o estágio',
      'Filtre por consultor responsável',
      'Use a visão "Por Consultor" para ver o desempenho de cada um',
    ],
    dica: 'Tag colorida no card mostra quem está responsável pela negociação.',
  },
  {
    id: 'metas',
    num: '08',
    titulo: 'Metas 2027',
    href: '/comercial/metas',
    cor: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    tag: 'PROCESSO',
    tagCor: '#dc2626',
    ilustracao: <IlustrMetas />,
    para: 'Acompanhamento do plano estratégico: 80 reuniões, 26 escolas, 5.000 alunos.',
    como: [
      'Veja o contador regressivo até agosto/2026',
      'Acompanhe reuniões únicas (escolas com ≥1 contato registrado)',
      'Contratos assinados incrementam automaticamente as novas parcerias',
      'Alunos das novas parcerias somam ao total projetado de 5.000',
    ],
    dica: 'Todas as métricas são calculadas em tempo real — nenhuma entrada manual necessária.',
  },
  {
    id: 'agenda',
    num: '09',
    titulo: 'Agenda',
    href: '/agenda',
    cor: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4',
    tag: 'FERRAMENTAS',
    tagCor: '#0d9488',
    ilustracao: <IlustrAgenda />,
    para: 'Calendário de reuniões com convites por e-mail automáticos.',
    como: [
      'Clique em um dia do calendário ou em "+ Novo Evento"',
      'Adicione título, data/hora, local ou link do Google Meet',
      'Convide participantes buscando pelo nome ou e-mail cadastrado',
      'Os convidados recebem e-mail automático com os dados da reunião',
    ],
    dica: 'Ao marcar um horário, ele fica bloqueado para a equipe evitar conflitos.',
  },
  {
    id: 'banco-leads',
    num: '10',
    titulo: 'Banco de Leads',
    href: '/leads-banco',
    cor: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    tag: 'FERRAMENTAS',
    tagCor: '#dc2626',
    ilustracao: <IlustrBancoLeads />,
    para: 'Base unificada de leads dos congressos CIECC 2025/2026 e CRM.',
    como: [
      'Filtre por fonte (1º CIECC, 2º CIECC, CRM Education, Oikos Live)',
      'Filtre por tipo: só decisores (gestores, diretores, mantenedores, coordenadores)',
      'Use a busca por nome, e-mail ou escola',
      'Envie e-mail ou WhatsApp diretamente pelo ícone na linha',
      'Exporte para Excel com os filtros aplicados',
    ],
    dica: 'Os decisores (gestores/diretores) são destacados em vermelho — prioridade comercial.',
  },
  {
    id: 'importacao',
    num: '11',
    titulo: 'Importar Dados',
    href: '/importacao',
    cor: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    tag: 'FERRAMENTAS',
    tagCor: '#7c3aed',
    ilustracao: <IlustrImportacao />,
    para: 'Importe planilhas Excel e selecione exatamente as colunas desejadas.',
    como: [
      'Escolha a fonte (CIECC 2025, CIECC 2026, CRM Education, Oikos Live)',
      'Faça upload da planilha (.xlsx, .xls, .csv)',
      'Para CIECC: filtre por tipo de inscrição antes de ver as colunas',
      'Selecione as colunas que deseja importar (pré-marcadas = compatíveis com cadastro de escola)',
      'Clique em Importar — duplicatas são automaticamente sobrescritas',
    ],
    dica: 'Campos mapeados (verde) vão para colunas próprias; extras (laranja) ficam em JSON pesquisável.',
  },
  {
    id: 'transcricoes',
    num: '12',
    titulo: 'Transcrições',
    href: '/transcricoes',
    cor: '#0ea5e9',
    bg: '#f0f9ff',
    border: '#bae6fd',
    tag: 'FERRAMENTAS',
    tagCor: '#0ea5e9',
    ilustracao: <IlustrJornada />,
    para: 'Registre as transcrições e gravações das reuniões com escolas.',
    como: [
      'Clique em "Nova Transcrição" após finalizar uma reunião',
      'Selecione a escola e a data da reunião',
      'Cole o texto gerado pelo Google Meet, Zoom ou Teams',
      'Opcionalmente suba o arquivo de áudio ou vídeo da gravação',
    ],
    dica: 'No Google Meet: clique no menu ⋮ → "Transcrição" ao final da reunião para copiar o texto.',
  },
]

// ── Página ─────────────────────────────────────────────────────────────────────

export default function TutorialPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader
        title="Tutorial da Plataforma"
        subtitle="Guia completo de todos os módulos do We Make Gestão Comercial"
      />

      <div style={{ padding: '2rem 2.5rem' }}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)',
          borderRadius: 20, padding: '2.5rem 3rem', marginBottom: '2.5rem',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: '2rem', alignItems: 'center',
          boxShadow: '0 8px 32px rgba(15,23,42,.25)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: 200, width: 200, height: 200, borderRadius: '50%', background: 'rgba(74,127,219,.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'rgba(74,127,219,.15)', border: '1px solid rgba(74,127,219,.3)', borderRadius: 9999, padding: '.3rem .9rem', marginBottom: '1rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A7FDB' }} />
              <span style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Guia Completo
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: '.75rem' }}>
              Bem-vindo ao We Make<br />
              <span style={{ color: '#4A7FDB' }}>Gestão Comercial</span>
            </h1>
            <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.7, maxWidth: 520 }}>
              Esta plataforma centraliza toda a gestão comercial da We Make.
              Abaixo você encontra o tutorial de cada módulo com instruções passo a passo.
            </p>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
            {[
              { n: '12', label: 'Módulos' },
              { n: '3', label: 'Grupos' },
              { n: '∞', label: 'Dados' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '.85rem 1.25rem', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.8rem', fontWeight: 800, color: '#4A7FDB', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Índice rápido ───────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '2.5rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '1rem' }}>
            Navegação rápida
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
            {MODULOS.map(m => (
              <a key={m.id} href={`#${m.id}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                padding: '.35rem .8rem', borderRadius: 99,
                border: `1.5px solid ${m.cor}30`,
                background: m.bg,
                color: m.cor, textDecoration: 'none',
                fontSize: '.72rem', fontWeight: 700,
                fontFamily: 'var(--font-montserrat,sans-serif)',
                transition: 'all .15s',
              }}>
                <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '.85rem', fontWeight: 800 }}>{m.num}</span>
                {m.titulo}
              </a>
            ))}
          </div>
        </div>

        {/* ── Módulos ─────────────────────────────────────────── */}
        {['CRM', 'PROCESSO', 'FERRAMENTAS'].map(grupo => (
          <div key={grupo} style={{ marginBottom: '3rem' }}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ height: 2, flex: 1, background: 'linear-gradient(to right, #e2e8f0, transparent)' }} />
              <div style={{ padding: '.4rem 1.25rem', background: '#0f172a', borderRadius: 9999 }}>
                <span style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  {grupo === 'CRM' ? 'CRM — Gestão de Clientes' : grupo === 'PROCESSO' ? 'Processos Comerciais' : 'Ferramentas'}
                </span>
              </div>
              <div style={{ height: 2, flex: 1, background: 'linear-gradient(to left, #e2e8f0, transparent)' }} />
            </div>

            {/* Cards do grupo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {MODULOS.filter(m => m.tag === grupo).map((m, idx) => (
                <div key={m.id} id={m.id} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
                  overflow: 'hidden', boxShadow: '0 2px 12px rgba(15,23,42,.06)',
                  display: 'grid',
                  gridTemplateColumns: idx % 2 === 0 ? '380px 1fr' : '1fr 380px',
                }}>

                  {/* Ilustração */}
                  {idx % 2 === 0 && (
                    <div style={{ background: '#0f172a', minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                      {m.ilustracao}
                    </div>
                  )}

                  {/* Conteúdo */}
                  <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2.5rem', fontWeight: 800, color: m.cor, lineHeight: 1, opacity: .3 }}>{m.num}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.2rem' }}>
                          <span style={{ fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: m.tagCor, background: m.bg, border: `1px solid ${m.border}`, padding: '.15rem .5rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                            {m.tag}
                          </span>
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                          {m.titulo}
                        </h2>
                      </div>
                    </div>

                    <p style={{ fontSize: '.875rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      {m.para}
                    </p>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '.65rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        Como usar:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                        {m.como.map((passo, pi) => (
                          <div key={pi} style={{ display: 'flex', alignItems: 'flex-start', gap: '.65rem' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '.1rem' }}>
                              <span style={{ fontSize: '.6rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{pi + 1}</span>
                            </div>
                            <span style={{ fontSize: '.82rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.6 }}>{passo}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dica */}
                    <div style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 10, padding: '.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '.6rem' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={m.cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '.15rem' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span style={{ fontSize: '.78rem', color: m.cor, fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.6 }}>
                        <strong>Dica:</strong> {m.dica}
                      </span>
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: '1.25rem' }}>
                      <Link href={m.href} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                        padding: '.55rem 1.25rem', borderRadius: 9999,
                        background: m.cor, color: '#fff', textDecoration: 'none',
                        fontSize: '.78rem', fontWeight: 700,
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                        boxShadow: `0 4px 12px ${m.cor}44`,
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                        Acessar {m.titulo}
                      </Link>
                    </div>
                  </div>

                  {/* Ilustração lado direito (índices pares invertidos) */}
                  {idx % 2 !== 0 && (
                    <div style={{ background: '#0f172a', minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                      {m.ilustracao}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ── Rodapé ──────────────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 16, padding: '2rem', textAlign: 'center', marginTop: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '.5rem' }}>
            Precisa de ajuda?
          </div>
          <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '1.25rem' }}>
            Fale com Renato Assis para suporte técnico ou dúvidas sobre a plataforma.
          </p>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://wa.me/5583986048784" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.55rem 1.25rem', borderRadius: 9999, background: '#16a34a', color: '#fff', textDecoration: 'none', fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              WhatsApp (83) 98604-8784
            </a>
            <a href="mailto:comercial@wemake.org" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.55rem 1.25rem', borderRadius: 9999, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', color: '#fff', textDecoration: 'none', fontSize: '.78rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              comercial@wemake.org
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

