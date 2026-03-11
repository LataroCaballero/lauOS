'use client'

import { useState } from 'react'
import {
  getMonthlySummaryAction,
  getCategoryDistributionAction,
  type MonthlySummary,
  type CategorySlice,
} from '@/lib/actions/insights'
import type { AccountWithBalance } from '@/lib/actions/accounts'
import { MonthlySummaryCard } from '@/components/finance/monthly-summary-card'
import { CategoryDonutChart } from '@/components/finance/category-donut-chart'
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
// Month option helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

type MonthOption = {
  year: number
  month: number // 1-indexed
  label: string
  value: string // "YYYY-MM"
}

function buildMonthOptions(): MonthOption[] {
  const options: MonthOption[] = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1 // 1-indexed
    options.push({
      year,
      month,
      label: `${MONTH_NAMES_ES[month - 1]} ${year}`,
      value: `${year}-${String(month).padStart(2, '0')}`,
    })
  }
  return options
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type InsightsClientProps = {
  initialSummaries: MonthlySummary[]
  initialSlices: CategorySlice[]
  accounts: AccountWithBalance[]
  initialYear: number
  initialMonth: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InsightsClient({
  initialSummaries,
  initialSlices,
  accounts,
  initialYear,
  initialMonth,
}: InsightsClientProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [summaries, setSummaries] = useState<MonthlySummary[]>(initialSummaries)
  const [slices, setSlices] = useState<CategorySlice[]>(initialSlices)
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
  const [loading, setLoading] = useState(false)

  // Determine default chart currency based on accounts
  const hasCurrencies = {
    ARS: accounts.some((a) => a.currency === 'ARS'),
    USD: accounts.some((a) => a.currency === 'USD'),
  }
  const defaultCurrency: 'ARS' | 'USD' = hasCurrencies.ARS ? 'ARS' : 'USD'
  const [chartCurrency] = useState<'ARS' | 'USD'>(defaultCurrency)

  const monthOptions = buildMonthOptions()
  const currentValue = `${year}-${String(month).padStart(2, '0')}`

  async function handleMonthChange(value: string | null) {
    if (!value) return
    const [y, m] = value.split('-').map(Number)
    setYear(y)
    setMonth(m)
    setLoading(true)
    const [summaryResult, slicesResult] = await Promise.all([
      getMonthlySummaryAction({ year: y, month: m }),
      getCategoryDistributionAction({ year: y, month: m, type: activeTab, currency: chartCurrency }),
    ])
    if ('summaries' in summaryResult && summaryResult.summaries) {
      setSummaries(summaryResult.summaries)
    }
    if ('slices' in slicesResult && slicesResult.slices) {
      setSlices(slicesResult.slices)
    }
    setLoading(false)
  }

  async function handleTabChange(tab: 'expense' | 'income') {
    setActiveTab(tab)
    setLoading(true)
    const slicesResult = await getCategoryDistributionAction({
      year,
      month,
      type: tab,
      currency: chartCurrency,
    })
    if ('slices' in slicesResult && slicesResult.slices) {
      setSlices(slicesResult.slices)
    }
    setLoading(false)
  }

  const totalSlicesCentavos = slices.reduce((sum, s) => sum + s.amountCentavos, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Month selector */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Seleccioná un mes para ver el resumen</p>
        <Select value={currentValue} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Monthly summary cards */}
      <section className={cn('transition-opacity', loading && 'opacity-50')}>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Resumen del mes
        </h2>
        {summaries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos para este mes.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {summaries.map((s) => (
              <MonthlySummaryCard key={s.currency} summary={s} />
            ))}
          </div>
        )}
      </section>

      {/* Category distribution chart */}
      <section className={cn('transition-opacity', loading && 'opacity-50')}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Distribución por categoría
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeTab === 'expense' ? 'default' : 'outline'}
              onClick={() => handleTabChange('expense')}
            >
              Gastos
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'income' ? 'default' : 'outline'}
              onClick={() => handleTabChange('income')}
            >
              Ingresos
            </Button>
          </div>
        </div>

        <CategoryDonutChart slices={slices} currency={chartCurrency} />

        {/* Category legend */}
        {slices.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {slices.map((slice) => {
              const pct =
                totalSlicesCentavos > 0
                  ? ((slice.amountCentavos / totalSlicesCentavos) * 100).toFixed(1)
                  : '0.0'
              return (
                <li
                  key={slice.categoryId ?? '__uncategorized__'}
                  className="flex items-center justify-between gap-2"
                >
                  <CategoryBadge
                    name={slice.categoryName}
                    icon=""
                    color={slice.categoryColor}
                    size="sm"
                  />
                  <div className="flex items-center gap-3 text-sm tabular-nums">
                    <span className="text-muted-foreground">{pct}%</span>
                    <span className="font-medium">
                      {fromCentavos(slice.amountCentavos, chartCurrency)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
