'use server'

import { createServerClient } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// fetchDolarRatesAction
// Fetches dolarapi.com server-side ONLY. Never call from client code.
// ---------------------------------------------------------------------------

export async function fetchDolarRatesAction(): Promise<{
  rates?: { blue: number; oficial: number; tarjeta: number }
  error?: string
}> {
  try {
    const res = await fetch('https://dolarapi.com/api/dolares', {
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return { error: 'No se pudo obtener la cotización. Ingresala manualmente.' }
    }

    const data: Array<{ casa: string; venta: number | null; compra: number | null }> =
      await res.json()

    const find = (casa: string): number | null =>
      data.find((d) => d.casa === casa)?.venta ?? null

    const blue = find('blue')
    const oficial = find('oficial')
    const tarjeta = find('tarjeta')

    if (blue === null || oficial === null || tarjeta === null) {
      return { error: 'No se pudo obtener la cotización. Ingresala manualmente.' }
    }

    return { rates: { blue, oficial, tarjeta } }
  } catch {
    return { error: 'No se pudo obtener la cotización. Ingresala manualmente.' }
  }
}

// ---------------------------------------------------------------------------
// createTransactionAction — creates a single income or expense transaction
// ---------------------------------------------------------------------------

export async function createTransactionAction(data: {
  accountId: string
  type: 'income' | 'expense'
  amountCentavos: number
  date: string
  categoryId: string
  note?: string
  exchangeRateStored?: number
}): Promise<{ id?: string; error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  try {
    const payload: Record<string, unknown> = {
      user: pb.authStore.record?.id,
      account: data.accountId,
      type: data.type,
      amount_centavos: data.amountCentavos,
      date: data.date,
      category: data.categoryId,
    }

    if (data.note) payload.note = data.note
    if (data.exchangeRateStored && data.exchangeRateStored !== 0) {
      payload.exchange_rate_stored = data.exchangeRateStored
    }

    const record = await pb.collection('transactions').create(payload)
    revalidatePath('/finance')
    return { id: record.id }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to create transaction' }
  }
}

// ---------------------------------------------------------------------------
// createTransferAction — creates two linked transaction records atomically
// ---------------------------------------------------------------------------

export async function createTransferAction(data: {
  fromAccountId: string
  toAccountId: string
  amountCentavos: number
  date: string
  note?: string
}): Promise<{ error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const userId = pb.authStore.record?.id
  let outRecordId: string | null = null

  try {
    // Step 1: Create transfer_out with empty transfer_pair_id initially
    const outRecord = await pb.collection('transactions').create({
      user: userId,
      account: data.fromAccountId,
      type: 'transfer_out',
      amount_centavos: data.amountCentavos,
      date: data.date,
      note: data.note ?? '',
      transfer_pair_id: '',
    })
    outRecordId = outRecord.id

    // Step 2: Create transfer_in referencing the out record
    const inRecord = await pb.collection('transactions').create({
      user: userId,
      account: data.toAccountId,
      type: 'transfer_in',
      amount_centavos: data.amountCentavos,
      date: data.date,
      note: data.note ?? '',
      transfer_pair_id: outRecord.id,
    })

    // Step 3: Update outRecord to cross-reference inRecord
    await pb.collection('transactions').update(outRecord.id, {
      transfer_pair_id: inRecord.id,
    })

    revalidatePath('/finance')
    return {}
  } catch (e: unknown) {
    // Rollback: if step 2 or 3 failed, delete the outRecord
    if (outRecordId) {
      try {
        await pb.collection('transactions').delete(outRecordId)
      } catch {
        // Best-effort cleanup — ignore
      }
    }
    return { error: e instanceof Error ? e.message : 'Failed to create transfer' }
  }
}

// ---------------------------------------------------------------------------
// updateTransactionAction — updates income/expense fields; blocks transfer edits
// ---------------------------------------------------------------------------

export async function updateTransactionAction(data: {
  id: string
  amountCentavos?: number
  date?: string
  categoryId?: string
  note?: string
  exchangeRateStored?: number
}): Promise<{ error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  try {
    // Check the transaction type before updating
    const existing = await pb
      .collection('transactions')
      .getOne(data.id, { fields: 'type' })

    if (existing.type === 'transfer_in' || existing.type === 'transfer_out') {
      return { error: 'Transfer edits not supported' }
    }

    const payload: Record<string, unknown> = {}

    if (data.amountCentavos !== undefined) payload.amount_centavos = data.amountCentavos
    if (data.date !== undefined) payload.date = data.date
    if (data.categoryId !== undefined) payload.category = data.categoryId
    if (data.note !== undefined) payload.note = data.note
    if (data.exchangeRateStored !== undefined) {
      payload.exchange_rate_stored = data.exchangeRateStored !== 0 ? data.exchangeRateStored : null
    }

    await pb.collection('transactions').update(data.id, payload)
    revalidatePath('/finance')
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to update transaction' }
  }
}

// ---------------------------------------------------------------------------
// deleteTransactionAction — deletes one record; deletes both legs if transfer
// ---------------------------------------------------------------------------

export async function deleteTransactionAction(id: string): Promise<{ error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  try {
    const record = await pb
      .collection('transactions')
      .getOne(id, { fields: 'transfer_pair_id' })

    // Delete the paired record first (ignore 404 — it may already be gone)
    if (record.transfer_pair_id) {
      try {
        await pb.collection('transactions').delete(record.transfer_pair_id)
      } catch {
        // Best-effort — ignore errors on the pair
      }
    }

    await pb.collection('transactions').delete(id)
    revalidatePath('/finance')
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to delete transaction' }
  }
}
