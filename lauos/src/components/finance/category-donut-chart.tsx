'use client'

import { PieChart, Pie, Cell, Label } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { fromCentavos } from '@/lib/money'
import type { CategorySlice } from '@/lib/actions/insights'

type CategoryDonutChartProps = {
  slices: CategorySlice[]
  currency: 'ARS' | 'USD'
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function CategoryDonutChart({ slices, currency }: CategoryDonutChartProps) {
  if (slices.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Sin datos para este mes</p>
      </div>
    )
  }

  const totalCentavos = slices.reduce((sum, s) => sum + s.amountCentavos, 0)

  // Build ChartConfig dynamically from slices
  const chartConfig: ChartConfig = {}
  for (const slice of slices) {
    const key = slice.categoryId ? slugify(slice.categoryName) : 'sin-categoria'
    chartConfig[key] = {
      label: slice.categoryName,
      color: slice.categoryColor,
    }
  }

  // Build chart data
  const chartData = slices.map((slice) => ({
    name: slice.categoryName,
    value: slice.amountCentavos,
    color: slice.categoryColor,
  }))

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => fromCentavos(value as number, currency)}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          strokeWidth={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 8}
                      className="fill-foreground text-xl font-bold"
                      style={{ fontSize: '13px', fontWeight: 700 }}
                    >
                      {fromCentavos(totalCentavos, currency)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 12}
                      className="fill-muted-foreground text-xs"
                      style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }}
                    >
                      Total
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
