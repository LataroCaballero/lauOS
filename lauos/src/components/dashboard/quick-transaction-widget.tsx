'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
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
import { fetchDolarRatesAction, createTransactionAction, createTransferAction } from '@/lib/actions/transactions'
import { toCentavos, toRateStored } from '@/lib/money'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TxType = 'income' | 'expense' | 'transfer'
type Currency = 'ARS' | 'USD'
type Step = 'quick' | 'details' | 'success'

type DolarRates = { blue: number; oficial: number; tarjeta: number }

type Account = { id: string; name: string; currency: 'ARS' | 'USD' }
type Category = { id: string; name: string; icon: string; color: string }

type Props = {
  accounts: Account[]
  categories: Category[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

const TYPE_LABELS: Record<TxType, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  transfer: 'Transferencia',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickTransactionWidget({ accounts, categories }: Props) {
  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('quick')
  const [txType, setTxType] = useState<TxType>('expense')
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [amount, setAmount] = useState('')
  const [step1Error, setStep1Error] = useState<string | null>(null)

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [dolarRates, setDolarRates] = useState<DolarRates | null>(null)
  const [dolarError, setDolarError] = useState(false)
  const [step2Error, setStep2Error] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedAccount = accounts.find((a) => a.id === accountId)

  // Show TC picker when: user picked USD amount going into an ARS account,
  // or the account itself is denominated in USD.
  const needsTc =
    !!accountId &&
    ((currency === 'USD' && selectedAccount?.currency === 'ARS') ||
      selectedAccount?.currency === 'USD')

  // For transfers the currency selector is irrelevant – hide it
  const isTransfer = txType === 'transfer'

  // Show all accounts always — TC picker handles currency mismatch
  const eligibleAccounts = accounts

  // Destination accounts for transfer: exclude the source
  const destinationAccounts = accounts.filter((a) => a.id !== accountId)

  // ── Fetch dolar rates when we enter step 2 and needsTc ────────────────────
  useEffect(() => {
    if (step !== 'details' || !needsTc || dolarRates) return
    fetchDolarRatesAction().then((result) => {
      if (result.rates) {
        setDolarRates(result.rates)
        if (!exchangeRate) setExchangeRate(String(result.rates.blue))
      } else {
        setDolarError(true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, needsTc])

  // ── Reset TC when account changes ─────────────────────────────────────────
  function handleAccountChange(id: string) {
    setAccountId(id)
    setExchangeRate('')
    setDolarRates(null)
    setDolarError(false)
  }

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setStep1Error('El monto debe ser mayor a 0')
      return
    }
    setStep1Error(null)
    setStep('details')
  }

  // ── Back to step 1 ────────────────────────────────────────────────────────
  function handleBack() {
    setStep('quick')
    setStep2Error(null)
    setAccountId('')
    setToAccountId('')
    setCategoryId('')
    setExchangeRate('')
    setDolarRates(null)
    setDolarError(false)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep2Error(null)

    if (!accountId) {
      setStep2Error('Seleccioná una cuenta')
      return
    }
    if (isTransfer && !toAccountId) {
      setStep2Error('Seleccioná la cuenta destino')
      return
    }
    if (!isTransfer && !categoryId) {
      setStep2Error('Seleccioná una categoría')
      return
    }
    if (needsTc && (!exchangeRate || parseFloat(exchangeRate) <= 0)) {
      setStep2Error('Ingresá el tipo de cambio')
      return
    }

    startTransition(async () => {
      // Calculate centavos in the account's native currency
      let amountCentavos = toCentavos(amount)
      let exchangeRateStored: number | undefined

      if (currency === 'USD' && selectedAccount?.currency === 'ARS') {
        // USD amount → convert to ARS centavos using TC
        amountCentavos = Math.round(parseFloat(amount) * parseFloat(exchangeRate) * 100)
        exchangeRateStored = toRateStored(exchangeRate)
      } else if (selectedAccount?.currency === 'USD' && exchangeRate) {
        exchangeRateStored = toRateStored(exchangeRate)
      }

      if (isTransfer) {
        const result = await createTransferAction({
          fromAccountId: accountId,
          toAccountId,
          amountCentavos,
          date: todayISO(),
        })
        if (result.error) {
          setStep2Error(result.error)
        } else {
          handleSuccess()
        }
        return
      }

      const result = await createTransactionAction({
        accountId,
        type: txType as 'income' | 'expense',
        amountCentavos,
        date: todayISO(),
        categoryId,
        exchangeRateStored,
      })
      if (result.error) {
        setStep2Error(result.error)
      } else {
        handleSuccess()
      }
    })
  }

  function handleSuccess() {
    setStep('success')
    router.refresh()
    // Auto-reset after brief success flash
    setTimeout(() => {
      setStep('quick')
      setTxType('expense')
      setCurrency('ARS')
      setAmount('')
      setAccountId('')
      setToAccountId('')
      setCategoryId('')
      setExchangeRate('')
      setDolarRates(null)
      setDolarError(false)
      setStep2Error(null)
    }, 1800)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="frosted-glass rounded-xl">
      {/* Header */}
      <div className="border-b border-white/20 dark:border-white/10 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">Registro rápido</p>
      </div>

      {/* ── Success flash ── */}
      {step === 'success' && (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <p className="text-sm font-medium">Transacción registrada</p>
        </div>
      )}

      {/* ── Step 1: Quick entry ── */}
      {step === 'quick' && (
        <form onSubmit={handleContinue} className="flex flex-col gap-4 p-4">
          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                {(['income', 'expense'] as TxType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxType(t)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      txType === t
                        ? 'bg-primary text-primary-foreground'
                        : 'frosted-glass text-muted-foreground hover:brightness-95 dark:hover:brightness-125'
                    )}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTxType('transfer')}
                className={cn(
                  'w-full rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  txType === 'transfer'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {TYPE_LABELS.transfer}
              </button>
            </div>
          </div>

          {/* Currency — only for income/expense */}
          {!isTransfer && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Moneda</Label>
              <div className="flex gap-1">
                {(['ARS', 'USD'] as Currency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      currency === c
                        ? 'bg-primary text-primary-foreground'
                        : 'frosted-glass text-muted-foreground hover:brightness-95 dark:hover:brightness-125'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qw-amount" className="text-xs text-muted-foreground">
              Monto {!isTransfer && <span className="text-muted-foreground">({currency})</span>}
            </Label>
            <Input
              id="qw-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9"
            />
          </div>

          {step1Error && <p className="text-xs text-destructive">{step1Error}</p>}

          <Button type="submit" size="sm" className="w-full">
            Continuar →
          </Button>
        </form>
      )}

      {/* ── Step 2: Details ── */}
      {step === 'details' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          {/* Back breadcrumb */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            {TYPE_LABELS[txType]} · {!isTransfer ? `${currency} ` : ''}{amount}
          </button>

          {/* Source account */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {isTransfer ? 'Cuenta origen' : 'Cuenta'}
            </Label>
            <Select value={accountId} onValueChange={(v) => handleAccountChange(v ?? '')} disabled={isPending}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {eligibleAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id} className="text-xs">
                    {acc.name}
                    <span className="ml-1 text-muted-foreground">({acc.currency})</span>
                  </SelectItem>
                ))}
                {eligibleAccounts.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No hay cuentas en {currency}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Destination account — transfer only */}
          {isTransfer && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Cuenta destino</Label>
              <Select
                value={toAccountId}
                onValueChange={(v) => setToAccountId(v ?? '')}
                disabled={isPending || !accountId}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {destinationAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="text-xs">
                      {acc.name}
                      <span className="ml-1 text-muted-foreground">({acc.currency})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category — income/expense only */}
          {!isTransfer && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Categoría</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setCategoryId(v ?? '')}
                disabled={isPending}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Exchange rate — when TC is needed */}
          {needsTc && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {currency === 'USD' && selectedAccount?.currency === 'ARS'
                  ? 'Tipo de cambio (USD → ARS)'
                  : 'Tipo de cambio'}
              </Label>

              {/* Preset buttons */}
              {dolarRates && (
                <div className="flex gap-1">
                  {(
                    [
                      { key: 'blue', label: 'Blue' },
                      { key: 'oficial', label: 'Oficial' },
                      { key: 'tarjeta', label: 'Tarjeta' },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setExchangeRate(String(dolarRates[key]))}
                      className={cn(
                        'flex-1 rounded-md px-1.5 py-1 text-[10px] font-medium leading-tight transition-colors',
                        exchangeRate === String(dolarRates[key])
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {label}
                      <br />
                      <span className="font-normal">{dolarRates[key]}</span>
                    </button>
                  ))}
                </div>
              )}

              {!dolarRates && !dolarError && (
                <p className="text-xs text-muted-foreground">Obteniendo cotización…</p>
              )}

              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ej. 1420.50"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                disabled={isPending}
                className="h-9 text-xs"
              />

              {dolarError && (
                <p className="text-xs text-muted-foreground">
                  Cotización no disponible — ingresala manualmente.
                </p>
              )}
            </div>
          )}

          {step2Error && <p className="text-xs text-destructive">{step2Error}</p>}

          <Button type="submit" size="sm" disabled={isPending} className="w-full">
            {isPending
              ? 'Guardando…'
              : isTransfer
                ? 'Registrar transferencia'
                : txType === 'income'
                  ? 'Registrar ingreso'
                  : 'Registrar egreso'}
          </Button>
        </form>
      )}
    </div>
  )
}
