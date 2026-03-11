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
import { createAccountAction, updateAccountAction } from '@/lib/actions/accounts'

type AccountFormProps = {
  mode: 'create' | 'edit'
  initialValues?: { id: string; name: string; currency: 'ARS' | 'USD' }
  onSuccess: () => void
}

export function AccountForm({ mode, initialValues, onSuccess }: AccountFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(initialValues?.currency ?? 'ARS')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createAccountAction({ name, currency })
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
        }
      } else {
        if (!initialValues) return
        const result = await updateAccountAction({ id: initialValues.id, name })
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-name">Nombre</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          placeholder="Ej. Cuenta corriente"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-currency">Moneda</Label>
        <Select
          value={currency}
          onValueChange={(val) => setCurrency(val as 'ARS' | 'USD')}
          disabled={mode === 'edit'}
        >
          <SelectTrigger id="account-currency" className="w-full">
            <SelectValue placeholder="Seleccionar moneda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ARS">ARS — Peso argentino</SelectItem>
            <SelectItem value="USD">USD — Dólar estadounidense</SelectItem>
          </SelectContent>
        </Select>
        {mode === 'edit' && (
          <p className="text-xs text-muted-foreground">
            La moneda no puede cambiarse después de la creación.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending
          ? mode === 'create'
            ? 'Creando...'
            : 'Guardando...'
          : mode === 'create'
            ? 'Crear cuenta'
            : 'Guardar cambios'}
      </Button>
    </form>
  )
}
