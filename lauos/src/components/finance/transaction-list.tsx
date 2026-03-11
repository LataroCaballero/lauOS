'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { fromCentavos } from '@/lib/money'
import { deleteTransactionAction } from '@/lib/actions/transactions'

type Category = { id: string; name: string; icon: string; color: string }

type Transaction = {
  id: string
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out'
  amount_centavos: number
  date: string
  note: string
  transfer_pair_id: string
  expand?: { category?: Category }
}

type TransactionListProps = {
  transactions: Transaction[]
  currency: 'ARS' | 'USD'
  categories: Array<{ id: string; name: string; icon: string; color: string }>
  onEditTransaction: (tx: Transaction) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

function isTransfer(type: Transaction['type']): boolean {
  return type === 'transfer_in' || type === 'transfer_out'
}

function typeLabel(type: Transaction['type']): string {
  switch (type) {
    case 'income':
      return 'Ingreso'
    case 'expense':
      return 'Egreso'
    case 'transfer_in':
      return 'Transferencia entrada'
    case 'transfer_out':
      return 'Transferencia salida'
  }
}

function TransactionRow({
  tx,
  currency,
  onEdit,
}: {
  tx: Transaction
  currency: 'ARS' | 'USD'
  onEdit: (tx: Transaction) => void
}) {
  const [isPending, startTransition] = useTransition()
  const isPositive = tx.type === 'income' || tx.type === 'transfer_in'
  const isTransferType = isTransfer(tx.type)
  const category = tx.expand?.category

  function handleDelete() {
    if (!window.confirm('¿Eliminar esta transacción?')) return
    startTransition(async () => {
      await deleteTransactionAction(tx.id)
    })
  }

  const truncatedNote =
    tx.note && tx.note.length > 40 ? `${tx.note.slice(0, 40)}…` : tx.note

  return (
    <div className="flex items-center gap-3 border-b py-3 last:border-b-0">
      {/* Sign indicator */}
      <span
        className={`w-5 text-center text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
      >
        {isPositive ? '+' : '-'}
      </span>

      {/* Date */}
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {formatDate(tx.date)}
      </span>

      {/* Type + category */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{typeLabel(tx.type)}</span>
        {category && (
          <span className="text-xs text-muted-foreground">
            {category.icon} {category.name}
          </span>
        )}
        {truncatedNote && (
          <span className="text-xs text-muted-foreground">{truncatedNote}</span>
        )}
      </div>

      {/* Amount */}
      <span className={`shrink-0 text-sm tabular-nums ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {fromCentavos(tx.amount_centavos, currency)}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isTransferType || isPending}
          title={isTransferType ? 'Las transferencias no se pueden editar' : undefined}
          onClick={() => !isTransferType && onEdit(tx)}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
        >
          {isPending ? '...' : 'Eliminar'}
        </Button>
      </div>
    </div>
  )
}

export function TransactionList({
  transactions,
  currency,
  onEditTransaction,
}: TransactionListProps) {
  // Sort by date descending (server already sorts, but ensuring client order)
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin transacciones. Registrá la primera.
      </p>
    )
  }

  return (
    <div className="divide-y-0">
      {sorted.map((tx) => (
        <TransactionRow
          key={tx.id}
          tx={tx}
          currency={currency}
          onEdit={onEditTransaction}
        />
      ))}
    </div>
  )
}
