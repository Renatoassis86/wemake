'use client'

import { useState } from 'react'

interface CheckboxPaideiaProps {
  defaultChecked?: boolean
  label?: string
}

export function CheckboxPaideia({ defaultChecked = false, label = 'A escola é Paideia?' }: CheckboxPaideiaProps) {
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', paddingTop: '1.5rem' }}>
      <input type="hidden" name="escola_paideia" value={checked ? 'true' : 'false'} />
      <div
        onClick={() => setChecked(!checked)}
        style={{
          width: 20, height: 20, borderRadius: 5, cursor: 'pointer', flexShrink: 0,
          background: checked ? '#4A7FDB' : '#fff',
          border: `2px solid ${checked ? '#4A7FDB' : '#cbd5e1'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s',
        }}
      >
        {checked && <span style={{ color: '#fff', fontSize: '.7rem', fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </div>
      <label
        onClick={() => setChecked(!checked)}
        style={{ cursor: 'pointer', fontSize: '.875rem', color: 'var(--text-m)', fontFamily: 'var(--font-inter,sans-serif)', userSelect: 'none' }}
      >
        {label}
      </label>
    </div>
  )
}
