'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { AlertCircle, CheckCircle2, type LucideIcon } from 'lucide-react'

// ── FormField ─────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  success?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ label, hint, error, success, required, children, className }: FormFieldProps) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label className="text-[0.78rem] font-semibold text-slate-700 flex items-center gap-1"
        style={{ fontFamily: 'var(--font-montserrat, sans-serif)', letterSpacing: '.01em' }}>
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>

      {children}

      {error && (
        <p className="flex items-center gap-1 text-[0.7rem] text-red-600 font-medium">
          <AlertCircle size={11} className="flex-shrink-0" />
          {error}
        </p>
      )}
      {success && !error && (
        <p className="flex items-center gap-1 text-[0.7rem] text-emerald-600 font-medium">
          <CheckCircle2 size={11} className="flex-shrink-0" />
          {success}
        </p>
      )}
      {hint && !error && !success && (
        <p className="text-[0.7rem] text-slate-400">{hint}</p>
      )}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
  icon?: LucideIcon
  iconRight?: LucideIcon
  onIconRightClick?: () => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  error, success, icon: Icon, iconRight: IconRight, onIconRightClick, className, ...props
}, ref) => {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Icon size={14} />
        </div>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full py-2 text-sm rounded-lg border bg-white text-slate-900 outline-none',
          'transition-all duration-150',
          'placeholder:text-slate-400',
          Icon ? 'pl-9' : 'pl-3',
          IconRight ? 'pr-9' : 'pr-3',
          error
            ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
            : success
              ? 'border-emerald-400 ring-2 ring-emerald-100 focus:border-emerald-500'
              : 'border-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
          className
        )}
        style={{ fontFamily: 'var(--font-inter, sans-serif)' }}
        {...props}
      />
      {IconRight && (
        <button
          type="button"
          onClick={onIconRightClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <IconRight size={14} />
        </button>
      )}
    </div>
  )
})
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  error, children, placeholder, className, ...props
}, ref) => {
  return (
    <select
      ref={ref}
      className={clsx(
        'w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 outline-none cursor-pointer',
        'transition-all duration-150 appearance-none',
        error
          ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
          : 'border-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
        className
      )}
      style={{
        fontFamily: 'var(--font-inter, sans-serif)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '2rem',
      }}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  )
})
Select.displayName = 'Select'

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  error, className, ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full px-3 py-2.5 text-sm rounded-lg border bg-white text-slate-900 outline-none',
        'transition-all duration-150 resize-y min-h-[88px]',
        'placeholder:text-slate-400',
        error
          ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
          : 'border-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
        className
      )}
      style={{ fontFamily: 'var(--font-inter, sans-serif)', lineHeight: 1.6 }}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

// ── SectionTitle (form dividers) ──────────────────────────────────────────────

interface SectionTitleProps {
  children: React.ReactNode
  description?: string
}

export function SectionTitle({ children, description }: SectionTitleProps) {
  return (
    <div className="mb-4 mt-2">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-amber-500 flex-shrink-0" />
        <h4 className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-amber-700"
          style={{ fontFamily: 'var(--font-montserrat, sans-serif)' }}>
          {children}
        </h4>
      </div>
      {description && (
        <p className="text-[0.72rem] text-slate-400 mt-1 ml-3">{description}</p>
      )}
    </div>
  )
}

// ── CheckboxGroup ─────────────────────────────────────────────────────────────

interface CheckboxOption {
  value: string
  label: string
}

interface CheckboxGroupProps {
  options: CheckboxOption[]
  value: string[]
  onChange: (values: string[]) => void
  columns?: 1 | 2 | 3
}

export function CheckboxGroup({ options, value, onChange, columns = 2 }: CheckboxGroupProps) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  return (
    <div className={clsx(
      'grid gap-2',
      columns === 1 && 'grid-cols-1',
      columns === 2 && 'grid-cols-2',
      columns === 3 && 'grid-cols-3',
    )}>
      {options.map(opt => {
        const checked = value.includes(opt.value)
        return (
          <label
            key={opt.value}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm',
              checked
                ? 'bg-amber-50 border-amber-400 text-amber-900 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.value)}
              className="accent-amber-500 w-3.5 h-3.5 flex-shrink-0"
            />
            <span className="text-[0.8rem] leading-tight">{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}

// ── RadioGroup ────────────────────────────────────────────────────────────────

interface RadioOption {
  value: string
  label: string
  description?: string
  icon?: LucideIcon
}

interface RadioGroupProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  columns?: 1 | 2 | 3 | 4
  variant?: 'default' | 'card'
}

export function RadioGroup({ options, value, onChange, columns = 2, variant = 'default' }: RadioGroupProps) {
  return (
    <div className={clsx(
      'grid gap-2',
      columns === 1 && 'grid-cols-1',
      columns === 2 && 'grid-cols-2',
      columns === 3 && 'grid-cols-3',
      columns === 4 && 'grid-cols-4',
    )}>
      {options.map(opt => {
        const selected = value === opt.value
        const Icon = opt.icon
        if (variant === 'card') {
          return (
            <label
              key={opt.value}
              className={clsx(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all text-center',
                selected
                  ? 'border-amber-400 bg-amber-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <input type="radio" checked={selected} onChange={() => onChange(opt.value)} className="sr-only" />
              {Icon && <Icon size={20} className={selected ? 'text-amber-600' : 'text-slate-400'} />}
              <span className={clsx(
                'text-[0.78rem] font-semibold leading-tight',
                selected ? 'text-amber-900' : 'text-slate-700'
              )}>
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-[0.65rem] text-slate-400 leading-tight">{opt.description}</span>
              )}
            </label>
          )
        }
        return (
          <label
            key={opt.value}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm',
              selected
                ? 'bg-amber-50 border-amber-400 text-amber-900 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            )}
          >
            <input
              type="radio"
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="accent-amber-500 w-3.5 h-3.5 flex-shrink-0"
            />
            <span className="text-[0.8rem]">{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}

// ── NumberInput com +/- buttons ───────────────────────────────────────────────

interface NumberStepperProps {
  label?: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
}

export function NumberStepper({ label, value, onChange, min = 0, max = 9999, step = 1, prefix }: NumberStepperProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[0.72rem] font-medium text-slate-600">{label}</span>}
      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="px-2.5 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-r border-slate-200 text-sm font-bold"
        >
          −
        </button>
        <div className="flex items-center px-3 py-2 flex-1 justify-center">
          {prefix && <span className="text-xs text-slate-400 mr-1">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
            className="w-14 text-center text-sm font-semibold text-slate-900 bg-transparent outline-none tabular-nums"
          />
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="px-2.5 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-l border-slate-200 text-sm font-bold"
        >
          +
        </button>
      </div>
    </div>
  )
}
