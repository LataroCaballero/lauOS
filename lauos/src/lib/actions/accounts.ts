'use server'

import { createServerClient } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AccountWithBalance = {
  id: string
  name: string
  currency: 'ARS' | 'USD'
  balanceCentavos: number
}

export type PatrimonySummary = {
  totalArsCentavos: number
  totalUsdCentavos: number
}

export type AccountsWithBalancesResult =
  | { accounts: AccountWithBalance[]; patrimony: PatrimonySummary; error?: never }
  | { accounts?: never; patrimony?: never; error: string }

// ---------------------------------------------------------------------------
// createAccountAction
// ---------------------------------------------------------------------------

export async function createAccountAction(data: {
  name: string
  currency: 'ARS' | 'USD'
}): Promise<{ id?: string; error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }
  try {
    const record = await pb.collection('accounts').create({
      user: pb.authStore.record?.id,
      name: data.name.trim(),
      currency: data.currency,
      archived: false,
    })
    revalidatePath('/finance')
    return { id: record.id }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to create account' }
  }
}

// ---------------------------------------------------------------------------
// updateAccountAction — only name is editable; currency is immutable
// ---------------------------------------------------------------------------

export async function updateAccountAction(data: {
  id: string
  name: string
}): Promise<{ error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }
  try {
    await pb.collection('accounts').update(data.id, {
      name: data.name.trim(),
    })
    revalidatePath('/finance')
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to update account' }
  }
}

// ---------------------------------------------------------------------------
// archiveAccountAction — sets archived: true; transactions are preserved
// ---------------------------------------------------------------------------

export async function archiveAccountAction(data: {
  id: string
}): Promise<{ error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }
  try {
    await pb.collection('accounts').update(data.id, {
      archived: true,
    })
    revalidatePath('/finance')
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to archive account' }
  }
}

// ---------------------------------------------------------------------------
// getAccountsWithBalancesAction
// ---------------------------------------------------------------------------

export async function getAccountsWithBalancesAction(): Promise<AccountsWithBalancesResult> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  try {
    // Fetch all non-archived accounts for the current user, sorted by creation date
    const accountRecords = await pb.collection('accounts').getFullList({
      filter: 'archived = false',
      sort: 'created',
    })

    // Fetch ALL transactions for the user (only fields needed for balance calc)
    // Use a wide perPage to get everything in one request
    const txRecords = await pb.collection('transactions').getFullList({
      fields: 'account,type,amount_centavos',
    })

    // Build balance map: accountId -> balanceCentavos
    const balanceMap = new Map<string, number>()
    for (const tx of txRecords) {
      const prev = balanceMap.get(tx.account) ?? 0
      if (tx.type === 'income' || tx.type === 'transfer_in') {
        balanceMap.set(tx.account, prev + tx.amount_centavos)
      } else if (tx.type === 'expense' || tx.type === 'transfer_out') {
        balanceMap.set(tx.account, prev - tx.amount_centavos)
      }
    }

    // Build result accounts array
    const accounts: AccountWithBalance[] = accountRecords.map((rec) => ({
      id: rec.id,
      name: rec.name as string,
      currency: rec.currency as 'ARS' | 'USD',
      balanceCentavos: balanceMap.get(rec.id) ?? 0,
    }))

    // Compute patrimony summary
    const patrimony: PatrimonySummary = {
      totalArsCentavos: accounts
        .filter((a) => a.currency === 'ARS')
        .reduce((sum, a) => sum + a.balanceCentavos, 0),
      totalUsdCentavos: accounts
        .filter((a) => a.currency === 'USD')
        .reduce((sum, a) => sum + a.balanceCentavos, 0),
    }

    return { accounts, patrimony }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch accounts' }
  }
}
