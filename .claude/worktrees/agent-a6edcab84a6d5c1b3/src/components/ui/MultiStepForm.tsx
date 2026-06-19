'use client'

import { useState, createContext, useContext } from 'react'
import { clsx } from 'clsx'
import { Check, ChevronRight, ChevronLeft, type LucideIcon } from 'lucide-react'

// ── Context ───────────────────────────────────────────────────────────────────

interface StepContextValue {
  currentStep: number
  totalSteps: number
  goNext: () => void
  goPrev: () => void
  goTo: (step: number) => void
  isFirst: boolean
  isLast: boolean
  completedSteps: Set<number>
  markComplete: (step: number) => void
}

const StepContext = createContext<StepContextValue | null>(null)

export function useStepContext() {
  const ctx = useContext(StepContext)
  if (!ctx) throw new Error('useStepContext must be used inside MultiStepForm')
  return ctx
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface StepDef {
  id: string
  label: string
  description?: string
  icon?: LucideIcon
}

interface MultiStepFormProps {
  steps: StepDef[]
  children: React.ReactNode
  onFinish?: () => void
  className?: string
}

// ── MultiStepForm ─────────────────────────────────────────────────────────────

export default function MultiStepForm({ steps, children, onFinish, className }: MultiStepFormProps) {
  const [currentStep, setCurrentStep]     = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const goNext = () => {
    markComplete(currentStep)
    setCurrentStep(s => Math.min(s + 1, steps.length - 1))
  }
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 0))
  const goTo   = (s: number) => { if (completedSteps.has(s - 1) || s === 0) setCurrentStep(s) }
  const markComplete = (s: number) => setCompletedSteps(prev => new Set([...prev, s]))

  const value: StepContextValue = {
    currentStep, totalSteps: steps.length,
    goNext, goPrev, goTo,
    isFirst: currentStep === 0,
    isLast:  currentStep === steps.length - 1,
    completedSteps, markComplete,
  }

  return (
    <StepContext.Provider value={value}>
      <div className={clsx('flex flex-col gap-6', className)}>

        {/* ── Step indicator ─── */}
        <StepIndicator steps={steps} currentStep={currentStep} completedSteps={completedSteps} goTo={goTo} />

        {/* ── Content ─────────── */}
        <div>
          {Array.isArray(children)
            ? (children as React.ReactNode[])[currentStep]
            : children
          }
        </div>

      </div>
    </StepContext.Provider>
  )
}

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({
  steps, currentStep, completedSteps, goTo
}: {
  steps: StepDef[]
  currentStep: number
  completedSteps: Set<number>
  goTo: (s: number) => void
}) {
  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute top-5 left-0 right-0 h-[2px] bg-slate-200 mx-[5%]" />
      <div
        className="absolute top-5 left-0 h-[2px] bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 mx-[5%]"
        style={{ width: `${(currentStep / (steps.length - 1)) * 90}%` }}
      />

      <ol className="relative z-10 flex justify-between">
        {steps.map((step, i) => {
          const completed = completedSteps.has(i)
          const active    = i === currentStep
          const reachable = completed || i === 0 || completedSteps.has(i - 1)
          const Icon      = step.icon

          return (
            <li
              key={step.id}
              className="flex flex-col items-center gap-2 flex-1"
              style={{ cursor: reachable && !active ? 'pointer' : 'default' }}
              onClick={() => reachable && goTo(i)}
            >
              {/* Circle */}
              <div className={clsx(
                'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 z-10',
                'text-sm font-bold',
                active    ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-200'
                : completed ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-slate-300 bg-white text-slate-400'
              )}>
                {completed && !active ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : Icon ? (
                  <Icon size={16} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {/* Labels */}
              <div className="text-center hidden sm:block">
                <div className={clsx(
                  'text-[0.72rem] font-bold leading-tight whitespace-nowrap',
                  active    ? 'text-amber-700'
                  : completed ? 'text-emerald-700'
                  : 'text-slate-400'
                )}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-[0.62rem] text-slate-400 mt-0.5 whitespace-nowrap">
                    {step.description}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ── StepPanel (wrapper para o conteúdo de cada step) ─────────────────────────

interface StepPanelProps {
  title: string
  description?: string
  children: React.ReactNode
  onNext?: () => Promise<boolean> | boolean  // retorna true se pode avançar
  onPrev?: () => void
  nextLabel?: string
  prevLabel?: string
  hidePrev?: boolean
  hideNext?: boolean
  extraActions?: React.ReactNode
  loading?: boolean
}

export function StepPanel({
  title, description, children, onNext, onPrev, nextLabel, prevLabel,
  hidePrev, hideNext, extraActions, loading
}: StepPanelProps) {
  const { goNext, goPrev, isFirst, isLast } = useStepContext()
  const [busy, setBusy] = useState(false)

  const handleNext = async () => {
    if (onNext) {
      setBusy(true)
      try {
        const ok = await onNext()
        if (ok) goNext()
      } finally {
        setBusy(false)
      }
    } else {
      goNext()
    }
  }

  const handlePrev = () => {
    onPrev?.()
    goPrev()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--brand-blue)' }}>
          {title}
        </h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {children}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between gap-3">
        <div>
          {!isFirst && !hidePrev && (
            <button
              type="button"
              onClick={handlePrev}
              className="btn btn-ghost btn-sm"
            >
              <ChevronLeft size={14} />
              {prevLabel ?? 'Anterior'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {!hideNext && (
            <button
              type="button"
              onClick={handleNext}
              disabled={busy || loading}
              className="btn btn-primary btn-sm"
            >
              {busy || loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando…
                </span>
              ) : (
                <>
                  {isLast ? (nextLabel ?? 'Concluir') : (nextLabel ?? 'Próximo')}
                  {!isLast && <ChevronRight size={14} />}
                  {isLast && <Check size={14} />}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
