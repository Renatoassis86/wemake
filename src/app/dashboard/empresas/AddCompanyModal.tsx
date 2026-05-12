'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

export function AddCompanyModal({ createAction }: { createAction: (formData: FormData) => Promise<any> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      const resp = await createAction(formData)
      if (resp?.error) {
        setError(resp.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--primary)',
          color: '#000',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(200, 245, 66, 0.1)'
        }}
      >

        <Plus size={16} /> Novo Registro
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(255,255,255,0.05)',
            width: '100%',
            maxWidth: '500px',
            borderRadius: '24px',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <button 
              onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Nova Unid. / Setor / Sistema</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Preencha os dados cadastrais para o novo registro estratégico.</p>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '10px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>Nome Completo (Razão/Setor)</label>
                <input name="razao_social" required placeholder="Ex: Arkos Education ou RH" style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'white' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>Sigla / Apelido</label>
                <input name="nome_fantasia" placeholder="Ex: ARK-01" style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'white' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>Identificador (CNPJ ou Cód)</label>
                <input name="cnpj" placeholder="Ex: 00.000.000/0000-00 ou ID-INTERNO" style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'white' }} />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Salvando...' : 'Finalizar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
