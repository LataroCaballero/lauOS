import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/pocketbase-server'
import { fromCentavos } from '@/lib/money'
import { AccountDetailClient } from './account-detail-client'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AccountDetailPage({ params }: PageProps) {
  const { id } = await params
  const pb = await createServerClient()

  if (!pb.authStore.isValid) {
    notFound()
  }

  const userId = pb.authStore.record?.id

  // Fetch the account record — 404 if not found or doesn't belong to user
  let account: { id: string; name: string; currency: 'ARS' | 'USD' } | null = null
  try {
    const rec = await pb.collection('accounts').getOne(id)
    if (rec.user !== userId) notFound()
    account = {
      id: rec.id,
      name: rec.name as string,
      currency: rec.currency as 'ARS' | 'USD',
    }
  } catch {
    notFound()
  }

  // Fetch transactions for this account, sorted by date descending, expanding category
  const txRecords = await pb.collection('transactions').getFullList({
    filter: `account = "${id}"`,
    sort: '-date',
    expand: 'category',
  })

  // Fetch all categories for the form
  const categoryRecords = await pb.collection('categories').getFullList({
    sort: 'name',
  })

  // Fetch all non-archived accounts (for transfer destination selector)
  const accountRecords = await pb.collection('accounts').getFullList({
    filter: 'archived = false',
  })

  // Compute balance inline
  let balanceCentavos = 0
  for (const tx of txRecords) {
    if (tx.type === 'income' || tx.type === 'transfer_in') {
      balanceCentavos += tx.amount_centavos as number
    } else if (tx.type === 'expense' || tx.type === 'transfer_out') {
      balanceCentavos -= tx.amount_centavos as number
    }
  }

  const transactions = txRecords.map((tx) => ({
    id: tx.id,
    type: tx.type as 'income' | 'expense' | 'transfer_in' | 'transfer_out',
    amount_centavos: tx.amount_centavos as number,
    date: tx.date as string,
    note: (tx.note as string) ?? '',
    transfer_pair_id: (tx.transfer_pair_id as string) ?? '',
    expand: tx.expand?.category
      ? {
          category: {
            id: (tx.expand.category as Record<string, unknown>).id as string,
            name: (tx.expand.category as Record<string, unknown>).name as string,
            icon: (tx.expand.category as Record<string, unknown>).icon as string,
            color: (tx.expand.category as Record<string, unknown>).color as string,
          },
        }
      : undefined,
  }))

  const categories = categoryRecords.map((c) => ({
    id: c.id,
    name: c.name as string,
    icon: (c.icon as string) ?? '',
    color: (c.color as string) ?? '',
  }))

  const allAccounts = accountRecords.map((a) => ({
    id: a.id,
    name: a.name as string,
    currency: a.currency as 'ARS' | 'USD',
  }))

  const isPositiveBalance = balanceCentavos >= 0

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* Back link */}
      <Link
        href="/finance/accounts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Cuentas
      </Link>

      {/* Account header */}
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold">{account.name}</h1>
        <p
          className={`text-3xl font-bold tabular-nums ${isPositiveBalance ? 'text-green-600' : 'text-red-600'}`}
        >
          {fromCentavos(balanceCentavos, account.currency)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{account.currency}</p>
      </div>

      {/* Client island: dialog state + new transaction + list */}
      <AccountDetailClient
        accountId={account.id}
        accountCurrency={account.currency}
        allAccounts={allAccounts}
        categories={categories}
        transactions={transactions}
      />
    </div>
  )
}
