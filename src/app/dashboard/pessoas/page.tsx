'use client'

import { useState, useEffect } from 'react'
import styles from '../dashboard.module.css'
import { Plus, Download, Upload, User, Building, X } from 'lucide-react'
import { createClient } from '@/infrastructure/supabase/client'

export default function PessoasPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [tipo, setTipo] = useState<'PF' | 'PJ'>('PF')
  const [pessoas, setPessoas] = useState<any[]>([])
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function load() {
       const { data: { user } } = await supabase.auth.getUser()
       if(user) {
         // Get cookie directly or fetch tenant profile
         const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
         // Bypass or fetch latest company cookie Node triggers securely setup framing.
         const cookies = document.cookie.split('; ')
         const companyCookie = cookies.find(row => row.startsWith('active_company_id='))?.split('=')[1]
         setActiveCompanyId(companyCookie || null)
         
         if(companyCookie) {
           const { data } = await supabase.from('pessoas').select('*').eq('empresa_id', companyCookie)
           setPessoas(data || [])
         }
       }
    }
    load()
  }, [])

  return (
    <div>
      <h1 className={styles.title}>Fornecedores e Prestadores</h1>
      <p className={styles.subtitle}>Gestão de Fornecedores (PF e PJ) e dados contratuais da empresa activa.</p>

      {!activeCompanyId && (
        <p style={{ color: '#EF4444', fontStyle: 'italic' }}>
          ⚠️ Selecione uma empresa no topo para listar os fornecedores vinculados.
        </p>
      )}

      {activeCompanyId && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <button style={{ background: 'rgba(200, 245, 66, 0.05)', color: '#C8F542', border: '1px solid rgba(200, 245, 66, 0.1)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Baixar Modelo
            </button>
            <button style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} /> Importar Excel
            </button>
            <button onClick={() => setIsOpen(true)} style={{ background: '#C8F542', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Cadastrar Fornecedor
            </button>
          </div>

          <div style={{ background: '#0D0E12', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.5rem' }}>
            {pessoas.length === 0 ? (
              <p style={{ color: '#8A8F99', textAlign: 'center', padding: '2rem' }}>Nenhum fornecedor cadastrado para esta empresa.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <th style={{ padding: '0.75rem', color: '#8A8F99', fontSize: '0.813rem' }}>Nome / Razão Social</th>
                    <th style={{ padding: '0.75rem', color: '#8A8F99', fontSize: '0.813rem' }}>Documento</th>
                    <th style={{ padding: '0.75rem', color: '#8A8F99', fontSize: '0.813rem' }}>Contato</th>
                    <th style={{ padding: '0.75rem', color: '#8A8F99', fontSize: '0.813rem' }}>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {pessoas.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#F4F2ED' }}>{p.nome_razao_social}</td>
                      <td style={{ padding: '0.75rem', color: '#8A8F99' }}>{p.documento || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#8A8F99' }}>{p.email_contato || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', background: p.tipo_pessoa === 'PJ' ? 'rgba(56,189,248,0.1)' : 'rgba(168,85,247,0.1)', color: p.tipo_pessoa === 'PJ' ? '#38BDF8' : '#A855F7', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {p.tipo_pessoa}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── MODAL CADASTRO ─── */}
      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <header style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F4F2ED' }}>Cadastrar Novo Fornecedor</h3>
               <X size={20} style={{ color: '#8A8F99', cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
            </header>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#8A8F99', fontSize: '0.813rem', marginBottom: '1.25rem' }}>Insira os dados cadastrais que serão mapeados como variáveis inteligentes nos Contratos de Prestação de Serviço.</p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
                <button onClick={() => setTipo('PF')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid', borderColor: tipo === 'PF' ? '#C8F542' : 'rgba(255,255,255,0.04)', background: tipo === 'PF' ? 'rgba(200,245,66,0.05)' : 'transparent', color: tipo === 'PF' ? '#C8F542' : '#8A8F99', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
                  <User size={18} /> Pessoa Física (PF)
                </button>
                <button onClick={() => setTipo('PJ')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid', borderColor: tipo === 'PJ' ? '#38BDF8' : 'rgba(255,255,255,0.04)', background: tipo === 'PJ' ? 'rgba(56,189,248,0.05)' : 'transparent', color: tipo === 'PJ' ? '#38BDF8' : '#8A8F99', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
                  <Building size={18} /> Pessoa Jurídica (PJ)
                </button>
              </div>

              <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {tipo === 'PF' && (
                  <>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Nome Completo</label><input style={inputStyle} placeholder="Ex: João Silva" /></div>
                      <div style={{ width: '150px' }}><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>CPF</label><input style={inputStyle} placeholder="000.000.000-00" /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Nacionalidade</label><input style={inputStyle} placeholder="Ex: Brasileira" /></div>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Estado Civil</label><input style={inputStyle} placeholder="Ex: Solteiro" /></div>
                    </div>
                    <div><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Profissão</label><input style={inputStyle} placeholder="Ex: Desenvolvedor" /></div>
                  </>
                )}

                {tipo === 'PJ' && (
                  <>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Razão Social</label><input style={inputStyle} placeholder="Ex: Empresa LTDA" /></div>
                      <div style={{ width: '180px' }}><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>CNPJ</label><input style={inputStyle} placeholder="00.000.000/0001-00" /></div>
                    </div>
                    <div><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Nome Fantasia</label><input style={inputStyle} placeholder="Ex: Nome da Loja" /></div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Representante Legal</label><input style={inputStyle} placeholder="Nome do Gestor/Sócio" /></div>
                      <div style={{ width: '150px' }}><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>CPF Representante</label><input style={inputStyle} placeholder="000.000.000-00" /></div>
                    </div>
                  </>
                )}

                <div><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Email de Contato</label><input style={inputStyle} placeholder="fornecedor@email.com" /></div>
                <div><label style={{ fontSize: '0.75rem', color: '#8A8F99' }}>Endereço Completo (Sede/Residência)</label><input style={inputStyle} placeholder="Rua, Número, Bairro, Cidade - UF" /></div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                     <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: '#8A8F99', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                     <button type="submit" style={{ background: '#C8F542', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,245,66,0.15)' }}>Cadastrar e Salvar</button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', color: '#F4F2ED', fontSize: '0.875rem', marginTop: '4px', outline: 'none'
}
