'use client'

import { useRouter } from 'next/navigation'

interface TemplateSelectorProps {
  templates: { id: string; titulo: string; versao: string }[];
  selectedId?: string;
}

export function TemplateSelector({ templates, selectedId }: TemplateSelectorProps) {
  const router = useRouter()

  return (
    <select 
      style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)' }}
      defaultValue={selectedId || ''}
      onChange={(e) => {
        const val = e.target.value;
        if (val) {
          router.push(`?template_id=${val}`)
        } else {
          router.push('?')
        }
      }}
    >
      <option value="">Selecione...</option>
      {templates.map((t) => (
        <option key={t.id} value={t.id}>{t.titulo} (v{t.versao})</option>
      ))}
    </select>
  )
}
  
