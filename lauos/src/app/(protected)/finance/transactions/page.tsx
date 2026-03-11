import { Suspense } from 'react'
import { getFilteredTransactionsAction } from '@/lib/actions/insights'
import { getAccountsWithBalancesAction } from '@/lib/actions/accounts'
import { getCategoriesAction } from '@/lib/actions/categories'
import { TransactionsClient } from './transactions-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchParams = {
  account?: string
  category?: string
  from?: string
  to?: string
  page?: string
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> // Next.js 15 — searchParams is a Promise
}) {
  const params = await searchParams
  const page = Number(params.page ?? '1')

  const [transactionsResult, accountsResult, categoriesResult] = await Promise.all([
    getFilteredTransactionsAction({
      page,
      accountId: params.account,
      categoryId: params.category,
      fromDate: params.from,
      toDate: params.to,
    }),
    getAccountsWithBalancesAction(),
    getCategoriesAction(),
  ])

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando...</div>}>
        <TransactionsClient
          initialData={
            'items' in transactionsResult
              ? transactionsResult
              : { items: [], totalPages: 1, totalItems: 0, page: 1 }
          }
          accounts={'accounts' in accountsResult ? (accountsResult.accounts ?? []) : []}
          categories={
            'categories' in categoriesResult ? (categoriesResult.categories ?? []) : []
          }
          initialParams={{
            account: params.account,
            category: params.category,
            from: params.from,
            to: params.to,
            page,
          }}
        />
      </Suspense>
    </div>
  )
}
