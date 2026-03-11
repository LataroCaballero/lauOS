import { Suspense } from 'react'
import { getMonthlySummaryAction, getCategoryDistributionAction } from '@/lib/actions/insights'
import { getAccountsWithBalancesAction } from '@/lib/actions/accounts'
import { InsightsClient } from './insights-client'

export default async function InsightsPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-indexed

  const [summaryResult, slicesResult, accountsResult] = await Promise.all([
    getMonthlySummaryAction({ year: currentYear, month: currentMonth }),
    getCategoryDistributionAction({
      year: currentYear,
      month: currentMonth,
      type: 'expense',
      currency: 'ARS',
    }),
    getAccountsWithBalancesAction(),
  ])

  const initialSummaries = 'summaries' in summaryResult ? (summaryResult.summaries ?? []) : []
  const initialSlices = 'slices' in slicesResult ? (slicesResult.slices ?? []) : []
  const accounts = 'accounts' in accountsResult ? (accountsResult.accounts ?? []) : []

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Insights</h1>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando...</div>}>
        <InsightsClient
          initialSummaries={initialSummaries}
          initialSlices={initialSlices}
          accounts={accounts}
          initialYear={currentYear}
          initialMonth={currentMonth}
        />
      </Suspense>
    </div>
  )
}
