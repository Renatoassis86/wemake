'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Search, X, ChevronLeft, ChevronRight,
  SlidersHorizontal
} from 'lucide-react'
import { clsx } from 'clsx'

// ── Tipos ────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc' | null

export interface Column<T> {
  key: string
  header: string
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  sticky?: boolean
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  rowHref?: (row: T) => string
  loading?: boolean
  stickyHeader?: boolean
  compact?: boolean
  toolbar?: React.ReactNode   // slot extra para filtros/actions na toolbar
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc')  return <ChevronUp size={13} className="text-amber-500" />
  if (dir === 'desc') return <ChevronDown size={13} className="text-amber-500" />
  return <ChevronsUpDown size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-100 rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, unknown>>({
  data, columns, pageSize = 20, searchable = true, searchPlaceholder = 'Buscar…',
  emptyMessage = 'Nenhum resultado encontrado',
  emptyDescription = 'Tente ajustar os filtros de busca.',
  onRowClick, rowHref, loading = false, stickyHeader = true, compact = false, toolbar
}: DataTableProps<T>) {

  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page,    setPage]    = useState(1)

  // Busca global (filtra em todos os valores string)
  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      Object.values(row).some(v =>
        v != null && String(v).toLowerCase().includes(q)
      )
    )
  }, [data, search])

  // Ordenação
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey]
      if (va == null) return 1; if (vb == null) return -1
      const cmp = String(va).localeCompare(String(vb), 'pt-BR', { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // Paginação
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = useCallback((key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc') }
    else if (sortDir === 'asc') setSortDir('desc')
    else { setSortKey(null); setSortDir(null) }
    setPage(1)
  }, [sortKey, sortDir])

  const handleSearch = useCallback((v: string) => {
    setSearch(v); setPage(1)
  }, [])

  const td = compact ? 'px-3 py-2' : 'px-4 py-3'
  const th = compact ? 'px-3 py-2' : 'px-4 py-3'

  return (
    <div className="flex flex-col gap-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      {(searchable || toolbar) && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex-wrap">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={clsx(
                  'w-full pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400',
                  'placeholder:text-slate-400 transition-all'
                )}
              />
              {search && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {toolbar}

          <div className="ml-auto text-[0.72rem] text-slate-400 whitespace-nowrap">
            {filtered.length !== data.length
              ? `${filtered.length} de ${data.length} registros`
              : `${data.length} registro${data.length !== 1 ? 's' : ''}`
            }
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className={clsx(stickyHeader && 'sticky top-0 z-10')}>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={clsx(
                    th,
                    'text-left bg-slate-900 text-slate-300 text-[0.67rem] font-bold uppercase tracking-[0.07em] whitespace-nowrap border-b border-slate-800',
                    col.sortable && 'select-none group',
                    col.align === 'right'  && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sticky && 'sticky left-0 z-20',
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.sortable ? (
                    <button className="inline-flex items-center gap-1 w-full group hover:text-white transition-colors">
                      {col.header}
                      <SortIcon dir={sortKey === col.key ? sortDir : null} />
                    </button>
                  ) : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <SlidersHorizontal size={36} className="text-slate-200 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">{emptyMessage}</p>
                    <p className="text-xs text-slate-400 mt-1">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => {
                const href = rowHref?.(row)
                const clickable = !!(onRowClick || href)
                return (
                  <tr
                    key={i}
                    onClick={() => { if (onRowClick) onRowClick(row); else if (href) window.location.href = href }}
                    className={clsx(
                      'transition-colors',
                      clickable && 'cursor-pointer hover:bg-amber-50/60',
                      !clickable && 'hover:bg-slate-50'
                    )}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={clsx(
                          td,
                          'text-slate-700 align-middle',
                          col.align === 'right'  && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.sticky && 'sticky left-0 bg-white z-10 border-r border-slate-100',
                        )}
                      >
                        {col.cell ? col.cell(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginação ────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60 flex-wrap gap-2">
          <span className="text-xs text-slate-500">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            {' '}— <strong>{sorted.length}</strong> registros
          </span>
          <div className="flex items-center gap-1">
            <PageButton onClick={() => setPage(1)} disabled={page === 1} label="«" />
            <PageButton onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <ChevronLeft size={14} />
            </PageButton>

            {/* Páginas numéricas */}
            {getPagesWindow(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`sep-${i}`} className="w-8 text-center text-slate-400 text-xs">…</span>
              ) : (
                <PageButton key={p} onClick={() => setPage(p as number)} active={page === p}>
                  {p}
                </PageButton>
              )
            )}

            <PageButton onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </PageButton>
            <PageButton onClick={() => setPage(totalPages)} disabled={page === totalPages} label="»" />
          </div>
        </div>
      )}
    </div>
  )
}

function PageButton({
  onClick, disabled, active, children, label
}: { onClick: () => void; disabled?: boolean; active?: boolean; children?: React.ReactNode; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all',
        active  ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
    >
      {label ?? children}
    </button>
  )
}

function getPagesWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}
