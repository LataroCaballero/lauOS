import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fromCentavos } from '@/lib/money'
import type { MonthlySummary } from '@/lib/actions/insights'
import { cn } from '@/lib/utils'

type MonthlySummaryCardProps = {
  summary: MonthlySummary
}

const CURRENCY_FLAG: Record<'ARS' | 'USD', string> = {
  ARS: '🇦🇷',
  USD: '🇺🇸',
}

const CURRENCY_LABEL: Record<'ARS' | 'USD', string> = {
  ARS: 'Pesos (ARS)',
  USD: 'Dólares (USD)',
}

export function MonthlySummaryCard({ summary }: MonthlySummaryCardProps) {
  const { currency, incomeCentavos, expensesCentavos, netCentavos } = summary
  const isPositiveNet = netCentavos >= 0

  return (
    <Card className="flex-1 min-w-[200px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{CURRENCY_FLAG[currency]}</span>
          <span>{CURRENCY_LABEL[currency]}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Ingresos</span>
          <span className="text-sm font-semibold text-green-600 tabular-nums">
            +{fromCentavos(incomeCentavos, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Egresos</span>
          <span className="text-sm font-semibold text-red-500 tabular-nums">
            -{fromCentavos(expensesCentavos, currency)}
          </span>
        </div>
        <div className="mt-1 border-t pt-2 flex items-center justify-between">
          <span className="text-sm font-medium">Balance</span>
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              isPositiveNet ? 'text-green-600' : 'text-red-500'
            )}
          >
            {isPositiveNet ? '+' : ''}
            {fromCentavos(netCentavos, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
