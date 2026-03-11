'use server'

import { createServerClient } from '@/lib/pocketbase-server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MonthlySummary = {
  currency: 'ARS' | 'USD'
  incomeCentavos: number
  expensesCentavos: number
  netCentavos: number
}

export type CategorySlice = {
  categoryId: string | null // null = uncategorized
  categoryName: string
  categoryColor: string // hex string e.g. '#FF6B35'
  amountCentavos: number
}

// ---------------------------------------------------------------------------
// getMonthlySummaryAction
// ---------------------------------------------------------------------------

export async function getMonthlySummaryAction(params: {
  year: number
  month: number // 1-indexed
}): Promise<{ summaries: MonthlySummary[]; error?: never } | { summaries?: never; error: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const userId = pb.authStore.record?.id
  const { year, month } = params

  // Month boundaries (UTC)
  const start = `${year}-${String(month).padStart(2, '0')}-01 00:00:00.000Z`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59.999Z`

  try {
    const txs = await pb.collection('transactions').getFullList({
      filter: `user = "${userId}" && date >= "${start}" && date <= "${end}" && (type = "income" || type = "expense")`,
      fields: 'type,amount_centavos,account',
    })

    // Need account currency — fetch accounts map
    const accounts = await pb.collection('accounts').getFullList({ fields: 'id,currency' })
    const currencyMap = new Map(accounts.map((a) => [a.id as string, a.currency as 'ARS' | 'USD']))

    const summaryMap = new Map<'ARS' | 'USD', { income: number; expenses: number }>()
    for (const tx of txs) {
      const currency = currencyMap.get(tx.account as string)
      if (!currency) continue
      const entry = summaryMap.get(currency) ?? { income: 0, expenses: 0 }
      if (tx.type === 'income') entry.income += tx.amount_centavos as number
      else entry.expenses += tx.amount_centavos as number
      summaryMap.set(currency, entry)
    }

    const summaries: MonthlySummary[] = (['ARS', 'USD'] as const)
      .filter((c) => summaryMap.has(c))
      .map((currency) => {
        const { income, expenses } = summaryMap.get(currency)!
        return {
          currency,
          incomeCentavos: income,
          expensesCentavos: expenses,
          netCentavos: income - expenses,
        }
      })

    return { summaries }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch summary' }
  }
}

// ---------------------------------------------------------------------------
// getCategoryDistributionAction
// ---------------------------------------------------------------------------

export async function getCategoryDistributionAction(params: {
  year: number
  month: number // 1-indexed
  type: 'income' | 'expense'
  currency: 'ARS' | 'USD'
}): Promise<{ slices: CategorySlice[]; error?: never } | { slices?: never; error: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const userId = pb.authStore.record?.id
  const { year, month, type, currency } = params

  // Month boundaries (UTC)
  const start = `${year}-${String(month).padStart(2, '0')}-01 00:00:00.000Z`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59.999Z`

  try {
    // Fetch accounts of given currency
    const accounts = await pb.collection('accounts').getFullList({
      filter: `currency = "${currency}" && archived = false`,
      fields: 'id',
    })
    const accountIds = accounts.map((a) => a.id as string)

    if (accountIds.length === 0) return { slices: [] }

    // Build account filter: (account = "id1" || account = "id2" || ...)
    const accountFilter = accountIds.map((id) => `account = "${id}"`).join(' || ')

    const txs = await pb.collection('transactions').getFullList({
      filter: `user = "${userId}" && date >= "${start}" && date <= "${end}" && type = "${type}" && (${accountFilter})`,
      fields: 'amount_centavos,category',
      expand: 'category',
    })

    // Group by category
    type CategoryAgg = {
      categoryId: string | null
      categoryName: string
      categoryColor: string
      amountCentavos: number
    }

    const categoryMap = new Map<string, CategoryAgg>()

    for (const tx of txs) {
      const expandedCategory = tx.expand?.category as
        | { id: string; name: string; color: string }
        | undefined

      const key = expandedCategory ? expandedCategory.id : '__uncategorized__'

      if (categoryMap.has(key)) {
        categoryMap.get(key)!.amountCentavos += tx.amount_centavos as number
      } else {
        categoryMap.set(key, {
          categoryId: expandedCategory ? expandedCategory.id : null,
          categoryName: expandedCategory ? expandedCategory.name : 'Sin categoría',
          categoryColor: expandedCategory ? expandedCategory.color : '#9ca3af',
          amountCentavos: tx.amount_centavos as number,
        })
      }
    }

    // Sort by amount descending
    const slices: CategorySlice[] = Array.from(categoryMap.values()).sort(
      (a, b) => b.amountCentavos - a.amountCentavos
    )

    return { slices }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch category distribution' }
  }
}
