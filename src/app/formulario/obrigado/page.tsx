'use client'

import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function FormularioObrigado() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)',
      padding: '2rem 1rem',
      paddingTop: 'calc(env(safe-area-inset-top) + 2rem)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>

        {/* Ícone de sucesso */}
        <div style={{ marginBottom: '2rem' }}>
          <CheckCircle size={80} color="#5FE3D0" style={{ margin: '0 auto', filter: 'drop-shadow(0 4px 12px rgba(95,227,208,.3))' }} />
        </div>

        {/* Título */}
        <h1 style={{
          fontFamily: 'var(--font-cormorant, "Georgia", serif)',
          fontSize: 'clamp(2rem, 7vw, 2.5rem)',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '1rem',
          lineHeight: 1.2,
        }}>
          Obrigado!
        </h1>

        {/* Descrição */}
        <p style={{
          fontSize: 'clamp(0.95rem, 3vw, 1.05rem)',
          color: '#475569',
          marginBottom: '.5rem',
          lineHeight: 1.7,
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>
          Recebemos seu formulário de pré-cadastro com sucesso.
        </p>

        <p style={{
          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
          color: '#64748b',
          marginBottom: '2rem',
          lineHeight: 1.6,
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>
          Nossa equipe comercial da We Make entrará em contato nos próximos dias para apresentar a proposta personalizada para sua escola.
        </p>

        {/* Botão de retorno */}
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '.5rem',
          minHeight: 48,
          padding: '0 1.75rem',
          background: 'linear-gradient(135deg, #5FE3D0, #4A7FDB)',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 9999,
          fontWeight: 700,
          fontSize: '.95rem',
          fontFamily: 'var(--font-montserrat, sans-serif)',
          boxShadow: '0 6px 20px rgba(95,227,208,.35)',
          letterSpacing: '.02em',
          transition: 'transform .2s, box-shadow .2s',
        }}>
          Voltar ao início <ArrowRight size={16} />
        </Link>

        {/* Footer simples */}
        <p style={{
          marginTop: '3rem',
          fontSize: '.75rem',
          color: '#94a3b8',
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>
          We Make © {new Date().getFullYear()} · Gestão Comercial para Educação
        </p>
      </div>
    </div>
  )
}
