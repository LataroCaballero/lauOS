'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getFilteredTransactionsAction, type TransactionRow } from '@/lib/actions/insights'
import type { AccountWithBalance } from '@/lib/actions/accounts'
import { CategoryBadge } from '@/components/finance/category-badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fromCentavos } from '@/lib/money'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionsClientProps = {
  initialData: { items: TransactionRow[]; totalPages: number; totalItems: number; page: number }
  accounts: AccountWithBalance[]
  categories: Array<{ id: string; name: string; icon: string; color: string }>
  initialParams: {
    account?: string
    category?: string
    from?: string
    to?: string
    page: number
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TransactionsClient({
  initialData,
  accounts,
  categories,
}: TransactionsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [data, setData] = useState(initialData)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // URL param helper — resets page on filter change
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page') // reset to page 1 on filter change
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  // Pagination — keeps all other filters, just changes page
  const setPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(page))
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  // Re-fetch when search params change
  useEffect(() => {
    const accountId = searchParams.get('account') ?? undefined
    const categoryId = searchParams.get('category') ?? undefined
    const fromDate = searchParams.get('from') ?? undefined
    const toDate = searchParams.get('to') ?? undefined
    const page = Number(searchParams.get('page') ?? '1')

    setLoading(true)
    getFilteredTransactionsAction({ page, accountId, categoryId, fromDate, toDate }).then(
      (result) => {
        if ('items' in result) setData(result)
        setLoading(false)
      }
    )
  }, [searchParams])

  // Derive current filter values from URL
  const currentAccount = searchParams.get('account') ?? ''
  const currentCategory = searchParams.get('category') ?? ''
  const currentFrom = searchParams.get('from') ?? ''
  const currentTo = searchParams.get('to') ?? ''

  const hasActiveFilters = !!(currentAccount || currentCategory || currentFrom || currentTo)

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Transacciones</h2>
          {hasActiveFilters && (
            <span className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
              {data.totalItems} resultados
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex items-center gap-1"
        >
          Filtros
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Collapsible filter panel */}
      {filtersOpen && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Account filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Cuenta</label>
              <Select
                value={currentAccount || 'all'}
                onValueChange={(v) => setParam('account', v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las cuentas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cuentas</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Categoría</label>
              <Select
                value={currentCategory || 'all'}
                onValueChange={(v) => setParam('category', v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* From date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <input
                type="date"
                value={currentFrom}
                onChange={(e) => setParam('from', e.target.value || null)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* To date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <input
                type="date"
                value={currentTo}
                onChange={(e) => setParam('to', e.target.value || null)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Transaction list */}
      <div className={cn('transition-opacity', loading && 'opacity-50')}>
        {data.items.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Sin transacciones</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {data.items.map((row) => {
              const isPositive = row.type === 'income' || row.type === 'transfer_in'
              const amountDisplay = `${isPositive ? '+' : '-'}${fromCentavos(row.amount_centavos, row.account.currency)}`
              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: date, account, category */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="tabular-nums text-muted-foreground">{formatDate(row.date)}</span>
                    <span className="font-medium">{row.account.name}</span>
                    {row.category ? (
                      <CategoryBadge
                        name={row.category.name}
                        icon={row.category.icon}
                        color={row.category.color}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin categoría</span>
                    )}
                    {row.note && (
                      <span className="text-xs text-muted-foreground">
                        {row.note.length > 40 ? row.note.slice(0, 40) + '…' : row.note}
                      </span>
                    )}
                  </div>

                  {/* Right: amount */}
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {amountDisplay}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={data.page <= 1 || loading}
          onClick={() => setPage(data.page - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {data.page} de {data.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={data.page >= data.totalPages || loading}
          onClick={() => setPage(data.page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
