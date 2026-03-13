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

export type DailyBalance = {
  date: string // 'YYYY-MM-DD'
  balanceCentavos: number
}

export type TransactionRow = {
  id: string
  date: string
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out'
  amount_centavos: number
  note: string
  account: { id: string; name: string; currency: 'ARS' | 'USD' }
  category: { id: string; name: string; icon: string; color: string } | null
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
      fields: 'amount_centavos,category,expand',
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

// ---------------------------------------------------------------------------
// computeDailyBalances — local helper
// ---------------------------------------------------------------------------

function computeDailyBalances(
  transactions: Array<{ date: string; type: string; amount_centavos: number }>,
  startDate: Date,
  endDate: Date,
  initialBalance: number = 0
): DailyBalance[] {
  // Group by date
  const byDate = new Map<string, number>()
  for (const tx of transactions) {
    const key = tx.date.slice(0, 10) // YYYY-MM-DD
    const prev = byDate.get(key) ?? 0
    const delta =
      tx.type === 'income' || tx.type === 'transfer_in'
        ? tx.amount_centavos
        : -tx.amount_centavos
    byDate.set(key, prev + delta)
  }

  // Walk day by day, carry forward balance
  const result: DailyBalance[] = []
  let runningBalance = initialBalance
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    const key = cursor.toISOString().slice(0, 10)
    runningBalance += byDate.get(key) ?? 0
    result.push({ date: key, balanceCentavos: runningBalance })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}

// ---------------------------------------------------------------------------
// getBalanceTimelineAction
// ---------------------------------------------------------------------------

export async function getBalanceTimelineAction(params: {
  accountId: string
  startDate: string // 'YYYY-MM-DD'
  endDate: string // 'YYYY-MM-DD'
}): Promise<{ points: DailyBalance[]; currency: 'ARS' | 'USD' } | { error: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const userId = pb.authStore.record?.id
  const { accountId, startDate, endDate } = params

  // Validate accountId is a 15-char alphanumeric PocketBase record ID
  if (!/^[a-z0-9]{15}$/i.test(accountId)) return { error: 'Invalid accountId' }

  // Validate dates
  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    return { error: 'Invalid date range' }
  }

  try {
    // Fetch account to get currency and verify ownership
    const account = await pb.collection('accounts').getOne(accountId, {
      fields: 'currency,user',
    })
    if ((account.user as string) !== userId) return { error: 'Access denied' }

    const currency = account.currency as 'ARS' | 'USD'

    // Compute initialBalance: all transactions before startDate
    const preTxs = await pb.collection('transactions').getFullList({
      filter: `account = "${accountId}" && date < "${startDate} 00:00:00.000Z"`,
      fields: 'type,amount_centavos',
    })

    let initialBalance = 0
    for (const tx of preTxs) {
      if (tx.type === 'income' || tx.type === 'transfer_in') {
        initialBalance += tx.amount_centavos as number
      } else {
        initialBalance -= tx.amount_centavos as number
      }
    }

    // Fetch range transactions
    const rangeTxs = await pb.collection('transactions').getFullList({
      filter: `account = "${accountId}" && date >= "${startDate} 00:00:00.000Z" && date <= "${endDate} 23:59:59.999Z"`,
      fields: 'type,amount_centavos,date',
      sort: 'date',
    })

    const points = computeDailyBalances(
      rangeTxs as unknown as Array<{ date: string; type: string; amount_centavos: number }>,
      startDateObj,
      endDateObj,
      initialBalance
    )

    return { points, currency }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch balance timeline' }
  }
}

// ---------------------------------------------------------------------------
// getFilteredTransactionsAction
// ---------------------------------------------------------------------------

export async function getFilteredTransactionsAction(params: {
  page: number
  accountId?: string
  categoryId?: string
  fromDate?: string // 'YYYY-MM-DD'
  toDate?: string // 'YYYY-MM-DD'
}): Promise<
  | { items: TransactionRow[]; totalPages: number; totalItems: number; page: number }
  | { error: string }
> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const userId = pb.authStore.record?.id
  const { page, accountId, categoryId, fromDate, toDate } = params

  // Build filter string
  const filterParts: string[] = [`user = "${userId}"`]

  if (accountId && /^[a-z0-9]{15}$/i.test(accountId)) {
    filterParts.push(`account = "${accountId}"`)
  }

  if (categoryId && /^[a-z0-9]{15}$/i.test(categoryId)) {
    filterParts.push(`category = "${categoryId}"`)
  }

  if (fromDate) {
    const d = new Date(fromDate)
    if (!isNaN(d.getTime())) {
      const safe = d.toISOString().slice(0, 10)
      filterParts.push(`date >= "${safe} 00:00:00.000Z"`)
    }
  }

  if (toDate) {
    const d = new Date(toDate)
    if (!isNaN(d.getTime())) {
      const safe = d.toISOString().slice(0, 10)
      filterParts.push(`date <= "${safe} 23:59:59.999Z"`)
    }
  }

  const filter = filterParts.join(' && ')

  try {
    const result = await pb.collection('transactions').getList(page, 25, {
      filter,
      sort: '-date',
      expand: 'category,account',
      fields: 'id,date,type,amount_centavos,note,expand',
    })

    const items: TransactionRow[] = result.items.map((item) => {
      const expandedAccount = item.expand?.account as
        | { id: string; name: string; currency: string }
        | undefined
      const expandedCategory = item.expand?.category as
        | { id: string; name: string; icon: string; color: string }
        | undefined

      return {
        id: item.id,
        date: (item.date as string).slice(0, 10),
        type: item.type as 'income' | 'expense' | 'transfer_in' | 'transfer_out',
        amount_centavos: item.amount_centavos as number,
        note: (item.note as string) ?? '',
        account: expandedAccount
          ? {
              id: expandedAccount.id,
              name: expandedAccount.name,
              currency: expandedAccount.currency as 'ARS' | 'USD',
            }
          : { id: '', name: 'Unknown', currency: 'ARS' },
        category: expandedCategory
          ? {
              id: expandedCategory.id,
              name: expandedCategory.name,
              icon: expandedCategory.icon,
              color: expandedCategory.color,
            }
          : null,
      }
    })

    return {
      items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      page: result.page,
    }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch transactions' }
  }
}
