'use client'

import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function FormularioObrigado() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 500, textAlign: 'center' }}>

        {/* Ícone de sucesso */}
        <div style={{ marginBottom: '2rem' }}>
          <CheckCircle size={80} color="#5FE3D0" style={{ margin: '0 auto', filter: 'drop-shadow(0 4px 12px rgba(95,227,208,.3))' }} />
        </div>

        {/* Título */}
        <h1 style={{
          fontFamily: 'var(--font-cormorant, "Georgia", serif)',
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '1rem',
          lineHeight: 1.2,
        }}>
          Obrigado!
        </h1>

        {/* Descrição */}
        <p style={{
          fontSize: '1.05rem',
          color: '#475569',
          marginBottom: '.5rem',
          lineHeight: 1.7,
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>
          Recebemos seu formulário de pré-cadastro com sucesso.
        </p>

        <p style={{
          fontSize: '.95rem',
          color: '#64748b',
          marginBottom: '2rem',
          lineHeight: 1.6,
          fontFamily: 'var(--font-inter, sans-serif)',
        }}>
          Nossa equipe comercial da We Make entrará em contato nos próximos dias para apresentar a proposta personalizada para sua escola.
        </p>

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
