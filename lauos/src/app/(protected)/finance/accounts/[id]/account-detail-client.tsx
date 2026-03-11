'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TransactionForm } from '@/components/finance/transaction-form'
import { TransactionList } from '@/components/finance/transaction-list'
import { PlusIcon } from 'lucide-react'

type Category = { id: string; name: string; icon: string; color: string }
type Account = { id: string; name: string; currency: 'ARS' | 'USD' }
type Transaction = {
  id: string
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out'
  amount_centavos: number
  date: string
  note: string
  transfer_pair_id: string
  expand?: { category?: Category }
}

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; tx: Transaction }

type AccountDetailClientProps = {
  accountId: string
  accountCurrency: 'ARS' | 'USD'
  allAccounts: Account[]
  categories: Category[]
  transactions: Transaction[]
}

export function AccountDetailClient({
  accountId,
  accountCurrency,
  allAccounts,
  categories,
  transactions,
}: AccountDetailClientProps) {
  const [dialogState, setDialogState] = useState<DialogState>({ mode: 'closed' })

  const isOpen = dialogState.mode !== 'closed'

  function handleOpenChange(open: boolean) {
    if (!open) setDialogState({ mode: 'closed' })
  }

  function handleSuccess() {
    setDialogState({ mode: 'closed' })
  }

  function handleEdit(tx: Transaction) {
    if (tx.type === 'transfer_in' || tx.type === 'transfer_out') return
    setDialogState({ mode: 'edit', tx })
  }

  const editTx = dialogState.mode === 'edit' ? dialogState.tx : null

  return (
    <div>
      {/* Nueva transacción button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-medium text-muted-foreground">
          {transactions.length}{' '}
          {transactions.length === 1 ? 'transacción' : 'transacciones'}
        </h2>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <Button
            size="sm"
            onClick={() => setDialogState({ mode: 'create' })}
          >
            <PlusIcon />
            Nueva transacción
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogState.mode === 'edit' ? 'Editar transacción' : 'Nueva transacción'}
              </DialogTitle>
            </DialogHeader>

            {dialogState.mode === 'create' && (
              <TransactionForm
                mode="create"
                accountId={accountId}
                accountCurrency={accountCurrency}
                allAccounts={allAccounts}
                categories={categories}
                onSuccess={handleSuccess}
              />
            )}

            {dialogState.mode === 'edit' && editTx && (editTx.type === 'income' || editTx.type === 'expense') && (
              <TransactionForm
                mode="edit"
                accountId={accountId}
                accountCurrency={accountCurrency}
                allAccounts={allAccounts}
                categories={categories}
                initialValues={{
                  id: editTx.id,
                  type: editTx.type,
                  amountCentavos: editTx.amount_centavos,
                  date: editTx.date,
                  categoryId: editTx.expand?.category
                    ? (editTx.expand.category as unknown as { id: string }).id ?? ''
                    : '',
                  note: editTx.note ?? '',
                }}
                onSuccess={handleSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Transaction list */}
      <TransactionList
        transactions={transactions}
        currency={accountCurrency}
        categories={categories}
        onEditTransaction={handleEdit}
      />
    </div>
  )
}
