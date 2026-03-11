'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExchangeRatePicker } from './exchange-rate-picker'
import {
  createTransactionAction,
  createTransferAction,
  updateTransactionAction,
} from '@/lib/actions/transactions'
import { toCentavos, toRateStored, fromRateStored } from '@/lib/money'

type Category = { id: string; name: string; icon: string; color: string }
type Account = { id: string; name: string; currency: 'ARS' | 'USD' }

type TransactionType = 'income' | 'expense' | 'transfer'

type TransactionFormProps = {
  mode: 'create' | 'edit'
  accountId: string
  accountCurrency: 'ARS' | 'USD'
  allAccounts: Account[]
  categories: Category[]
  initialValues?: {
    id: string
    type: 'income' | 'expense'
    amountCentavos: number
    date: string
    categoryId: string
    note: string
    exchangeRateStored?: number
  }
  onSuccess: () => void
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function TransactionForm({
  mode,
  accountId,
  accountCurrency,
  allAccounts,
  categories,
  initialValues,
  onSuccess,
}: TransactionFormProps) {
  const [txType, setTxType] = useState<TransactionType>(
    mode === 'edit' ? (initialValues?.type ?? 'expense') : 'expense'
  )
  const [amount, setAmount] = useState<string>(
    initialValues ? String(initialValues.amountCentavos / 100) : ''
  )
  const [date, setDate] = useState<string>(initialValues?.date?.split(' ')[0] ?? todayISO())
  const [categoryId, setCategoryId] = useState<string>(initialValues?.categoryId ?? '')
  const [toAccountId, setToAccountId] = useState<string>('')
  const [note, setNote] = useState<string>(initialValues?.note ?? '')
  const [exchangeRate, setExchangeRate] = useState<string>(
    initialValues?.exchangeRateStored ? fromRateStored(initialValues.exchangeRateStored) : ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Accounts available as transfer destination (exclude current account)
  const transferAccounts = allAccounts.filter((a) => a.id !== accountId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!amount || parseFloat(amount) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    const amountCentavos = toCentavos(amount)

    startTransition(async () => {
      if (mode === 'create' && txType === 'transfer') {
        if (!toAccountId) {
          setError('Seleccioná la cuenta destino')
          return
        }
        const result = await createTransferAction({
          fromAccountId: accountId,
          toAccountId,
          amountCentavos,
          date,
          note: note || undefined,
        })
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
        }
        return
      }

      if (mode === 'create') {
        if (!categoryId) {
          setError('Seleccioná una categoría')
          return
        }
        const result = await createTransactionAction({
          accountId,
          type: txType as 'income' | 'expense',
          amountCentavos,
          date,
          categoryId,
          note: note || undefined,
          exchangeRateStored:
            accountCurrency === 'USD' && exchangeRate
              ? toRateStored(exchangeRate)
              : undefined,
        })
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
        }
        return
      }

      // Edit mode
      if (!initialValues) return
      const result = await updateTransactionAction({
        id: initialValues.id,
        amountCentavos,
        date,
        categoryId: categoryId || undefined,
        note: note || undefined,
        exchangeRateStored:
          accountCurrency === 'USD' && exchangeRate
            ? toRateStored(exchangeRate)
            : undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Type selector — hidden in edit mode */}
      {mode === 'create' && (
        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <div className="flex gap-2">
            {(['income', 'expense', 'transfer'] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={txType === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTxType(t)}
              >
                {t === 'income' ? 'Ingreso' : t === 'expense' ? 'Egreso' : 'Transferencia'}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-amount">Monto</Label>
        <Input
          id="tx-amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-date">Fecha</Label>
        <Input
          id="tx-date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Category — hidden for transfers */}
      {txType !== 'transfer' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tx-category">Categoría</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v ?? '')}
            disabled={isPending}
          >
            <SelectTrigger id="tx-category" className="w-full">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Destination account — shown only for transfers */}
      {txType === 'transfer' && mode === 'create' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tx-to-account">Cuenta destino</Label>
          <Select
            value={toAccountId}
            onValueChange={(v) => setToAccountId(v ?? '')}
            disabled={isPending}
          >
            <SelectTrigger id="tx-to-account" className="w-full">
              <SelectValue placeholder="Seleccionar cuenta destino" />
            </SelectTrigger>
            <SelectContent>
              {transferAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Note */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-note">Nota (opcional)</Label>
        <Input
          id="tx-note"
          type="text"
          placeholder="Descripción opcional"
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Exchange rate — shown only for USD accounts */}
      {accountCurrency === 'USD' && (
        <ExchangeRatePicker value={exchangeRate} onChange={setExchangeRate} />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending
          ? 'Guardando...'
          : mode === 'create'
            ? txType === 'transfer'
              ? 'Crear transferencia'
              : txType === 'income'
                ? 'Registrar ingreso'
                : 'Registrar egreso'
            : 'Guardar cambios'}
      </Button>
    </form>
  )
}
