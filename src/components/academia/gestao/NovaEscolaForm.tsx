'use client'

import { useRef, useState } from 'react'
import { PRIORIDADES } from '@/lib/academia-gestao'
import { criarImplantacao } from '@/app/(dashboard)/academia/gestao/actions'
import { Aviso, SelectPessoa, useRun } from './ui'

/** Cadastra uma escola no Painel Mestre (regra 1: cadastrar assim que o Handoff for concluído). */
export default function NovaEscolaForm({ escolas, pessoas }: { escolas: { id: string; nome: string; cidade_uf?: string; responsavel?: string }[]; pessoas: string[] }) {
  const ref = useRef<HTMLFormElement>(null)
  const [aberto, setAberto] = useState(false)
  const [escolaId, setEscolaId] = useState('')
  const [cidade, setCidade] = useState('')
  const [resp, setResp] = useState('')
  const { pending, erro, msg, run } = useRun()

  function aoDigitar(nome: string) {
    const e = escolas.find(x => x.nome.toLowerCase() === nome.trim().toLowerCase())
    setEscolaId(e?.id ?? '')
    // herda do cadastro comercial o que já está lá, sem sobrescrever o que a pessoa digitou
    if (e?.cidade_uf && !cidade) setCidade(e.cidade_uf)
    if (e?.responsavel && !resp && pessoas.includes(e.responsavel)) setResp(e.responsavel)
  }

  return (
    <div className="ac-nova">
      {!aberto ? (
        <button type="button" className="ac-btn" onClick={() => setAberto(true)}>+ Cadastrar escola no Painel</button>
      ) : (
        <form
          ref={ref}
          className="ac-form"
          onSubmit={e => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            fd.set('escola_id', escolaId)
            run(() => criarImplantacao(fd), () => { ref.current?.reset(); setEscolaId(''); setCidade(''); setResp(''); setAberto(false) })
          }}
        >
          <h3 className="ac-form-t">Nova escola no Painel Mestre</h3>
          <div className="ac-form-g">
            <label>
              <span>Escola</span>
              <input name="escola_nome" aria-label="Escola" list="ac-escolas" required maxLength={160} onChange={e => aoDigitar(e.target.value)} placeholder="Nome oficial da instituição" />
              <datalist id="ac-escolas">{escolas.map(e => <option key={e.id} value={e.nome} />)}</datalist>
              <small>{escolaId ? 'Vinculada ao cadastro comercial.' : 'Escolha uma escola do CRM ou digite o nome.'}</small>
            </label>
            <label><span>Cidade/UF</span><input name="cidade_uf" aria-label="Cidade e UF" maxLength={80} value={cidade} onChange={e => setCidade(e.target.value)} /></label>
            <label>
              <span>Responsável We Make</span>
              <SelectPessoa pessoas={pessoas} name="responsavel" value={resp} onChange={setResp} className="" />
            </label>
            <label>
              <span>Prioridade</span>
              <select name="prioridade" defaultValue="Normal">{PRIORIDADES.map(p => <option key={p}>{p}</option>)}</select>
            </label>
            <label><span>Data da assinatura</span><input type="date" name="data_assinatura" aria-label="Data da assinatura" /></label>
            <label><span>Onboarding (dia 1)</span><input type="date" name="data_onboarding" aria-label="Data do onboarding (dia 1)" /></label>
            <label><span>Início das aulas</span><input type="date" name="data_inicio_aulas" aria-label="Data de início das aulas" /></label>
          </div>
          <label className="ac-check">
            <input type="checkbox" name="gerar_tarefas" aria-label="Criar as tarefas-modelo dos documentos" defaultChecked />
            <span>Criar as tarefas-modelo dos documentos (prazos calculados pelas datas acima)</span>
          </label>
          <Aviso erro={erro} msg={msg} />
          <div className="ac-form-a">
            <button className="ac-btn" disabled={pending}>{pending ? 'Salvando…' : 'Cadastrar'}</button>
            <button type="button" className="ac-btn is-ghost" onClick={() => setAberto(false)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  )
}
