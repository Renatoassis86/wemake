'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Encerra a sessão e recarrega a página, que volta a mostrar o formulário de login. */
export default function SairModulo() {
  const [saindo, setSaindo] = useState(false)

  async function sair() {
    setSaindo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <button type="button" className="md-sair" onClick={sair} disabled={saindo}>
      {saindo ? 'Saindo…' : 'Sair / trocar de conta'}
    </button>
  )
}
