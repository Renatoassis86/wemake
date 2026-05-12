'use client'

import { createClient } from '@/infrastructure/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

interface TemplateActionsProps {
  templateId: string
  titulo: string
}

export default function TemplateActions({ templateId, titulo }: TemplateActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    // Redireciona para o mesmo wizard mas passando o id
    router.push(`/dashboard/templates/novo?id=${templateId}`)
  }

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir o template "${titulo}"?`)) return

    setIsDeleting(true)
    const supabase = createClient()
    
    // 1. Excluir variáveis (campos_template)
    await supabase
      .from('campos_template')
      .delete()
      .eq('template_id', templateId)

    // 2. Excluir o template
    const { error } = await supabase
      .from('templates_contrato')
      .delete()
      .eq('id', templateId)

    setIsDeleting(false)

    if (error) {
      alert('❌ Erro ao excluir o template: ' + error.message)
    } else {
      alert('✅ Template excluído com sucesso!')
      router.refresh() // Atualiza os dados da página (Server Action/Component)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      <Link 
        href={`/dashboard/templates/popular/${templateId}`} 
        style={{ 
          textDecoration: 'none', 
          background: 'rgba(59, 130, 246, 0.1)', 
          color: '#3b82f6', 
          fontSize: '0.75rem', 
          padding: '4px 8px', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontWeight: 600
         }}
      >
        Popular ✨
      </Link>
      
      <button 
        onClick={handleEdit}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: '#10b981', 
          fontSize: '0.75rem', 
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Editar
      </button>

      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: '#ef4444', 
          fontSize: '0.75rem', 
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          opacity: isDeleting ? 0.5 : 1
        }}
      >
        {isDeleting ? 'Excluindo...' : 'Excluir'}
      </button>
    </div>
  )
}
