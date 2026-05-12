'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import styles from '../../../../dashboard.module.css'

interface EmissaoFormProps {
  template: any;
  campos: any[];
}

export default function EmissaoForm({ template, campos }: EmissaoFormProps) {
  const [tab, setTab] = useState<'manual' | 'excel'>('manual')
  const [excelRows, setExcelRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [successCount, setSuccessCount] = useState<number | null>(null)

  // 1. Ler Arquivo Excel
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws)
      setExcelRows(data)
    }
    reader.readAsBinaryString(file)
  }

  // 2. Enviar Formulário Manual
  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const dadosPreenchimento: Record<string, any> = {}

    campos.forEach(c => {
      const fieldKey = c.nome_campo || c.chave_tag || c.rotulo;
      if (fieldKey) {
        dadosPreenchimento[fieldKey] = formData.get(fieldKey);
      }
    })

    const response = await fetch(`/api/documentos/batch/${template.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([dadosPreenchimento])
    })

    if (response.ok) {
      window.location.href = `/dashboard/documentos`
    }
    setLoading(false)
  }

  // 3. Enviar Planilha Massa
  const handleBulkSubmit = async () => {
    if (excelRows.length === 0) return;
    setLoading(true)

    const response = await fetch(`/api/documentos/batch/${template.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(excelRows)
    })

    if (response.ok) {
      setSuccessCount(excelRows.length)
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('manual')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: tab === 'manual' ? 'var(--primary)' : 'var(--sidebar)', color: tab === 'manual' ? 'white' : 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>Preenchimento Manual</button>
        <button onClick={() => setTab('excel')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: tab === 'excel' ? 'var(--primary)' : 'var(--sidebar)', color: tab === 'excel' ? 'white' : 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>Importar Planilha Excel / CSV</button>
      </div>

      {tab === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{ background: 'white', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: 'var(--card-shadow)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }}>DADOS VARIÁVEIS</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginBottom: '0.8rem' }}>Preencha apenas os dados necessários. O sistema cuida da estrutura e rastreabilidade.</p>
            
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--foreground)' }}>NOME DO ALUNO / CONTRATADO</label>
            <input name="NOME_ALUNO" type="text" placeholder="Ex: Rinaldo Donizete" style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--border)', borderRadius: '10px' }} required />
          </div>


          <hr style={{ border: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)' }} />

          {campos.map(c => {
            const fieldKey = c.nome_campo || c.chave_tag || c.rotulo || '';
            const fieldLabel = c.label || c.rotulo || fieldKey.replace(/_/g, ' ').replace('{{', '').replace('}}', '').toUpperCase();
            
            if (fieldKey === 'NOME_ALUNO' || fieldKey === 'CRA' || fieldKey === '{{nome_aluno}}') return null;
            
            return (
              <div key={c.id || fieldKey}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{fieldLabel}</label>
                <input name={fieldKey} type={c.tipo_input === 'numero' ? 'number' : 'text'} step="0.1" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px' }} required />
              </div>
            )
          })}

          <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Processando...' : 'Confirmar Emissão'}</button>
        </form>
      )}

      {tab === 'excel' && (
        <div style={{ background: 'white', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>Subir Carga em Massa</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '1rem' }}>Sua planilha deve conter cabeçalhos idênticos aos placeholders do template: {campos.map(c => c.nome_campo || c.rotulo || c.chave_tag).filter(Boolean).join(', ')}</p>

          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} style={{ width: '100%', padding: '0.8rem', border: '1px dashed var(--border)', borderRadius: '8px', background: 'var(--sidebar)' }} />

          {excelRows.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', background: 'rgba(37,99,235,0.05)', color: 'var(--primary)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>
                🎉 Planilha lida com êxito! Encontrados <strong>{excelRows.length}</strong> registros para serem emitidos sincronizados.
              </div>
              <button onClick={handleBulkSubmit} disabled={loading} style={{ width: '100%', background: 'var(--success)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Tratando fila...' : 'Processar Carga em Lote'}</button>
            </div>
          )}

          {successCount !== null && (
            <div style={{ marginTop: '1rem', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              ✅ <strong>{successCount}</strong> de {excelRows.length} documentos criados com sucesso! Redirecione na sidebar.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
  
