'use client'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, CartesianGrid } from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import type { DailyBalance } from '@/lib/actions/insights'
import { fromCentavos } from '@/lib/money'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BalanceTimelineChartProps = {
  points: DailyBalance[]
  currency: 'ARS' | 'USD'
}

// ---------------------------------------------------------------------------
// Chart config
// ---------------------------------------------------------------------------

const chartConfig = {
  balance: { label: 'Saldo', color: 'var(--primary)' },
} satisfies ChartConfig

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BalanceTimelineChart({ points, currency }: BalanceTimelineChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
        Sin transacciones en este período
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <LineChart data={points} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(val: string) => val.slice(5)}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => fromCentavos(value as number, currency)}
            />
          }
        />
        <Line
          dataKey="balanceCentavos"
          type="monotone"
          stroke="var(--color-balance)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
