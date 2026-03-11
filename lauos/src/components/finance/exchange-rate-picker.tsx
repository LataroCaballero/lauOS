'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchDolarRatesAction } from '@/lib/actions/transactions'

type ExchangeRatePickerProps = {
  value: string
  onChange: (v: string) => void
}

export function ExchangeRatePicker({ value, onChange }: ExchangeRatePickerProps) {
  const [rates, setRates] = useState<{ blue: number; oficial: number; tarjeta: number } | null>(
    null
  )
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetchDolarRatesAction().then((result) => {
      if (result.rates) {
        setRates(result.rates)
        // Pre-populate with blue rate if no value set yet
        if (!value) {
          onChange(String(result.rates.blue))
        }
      } else {
        setFetchError(result.error ?? 'Error al obtener cotización')
      }
    })
    // Only run on mount — value and onChange intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <Label>Tipo de cambio (USD)</Label>

      {/* Preset buttons */}
      {rates && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={value === String(rates.blue) ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(String(rates.blue))}
          >
            Blue ({rates.blue})
          </Button>
          <Button
            type="button"
            variant={value === String(rates.oficial) ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(String(rates.oficial))}
          >
            Oficial ({rates.oficial})
          </Button>
          <Button
            type="button"
            variant={value === String(rates.tarjeta) ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(String(rates.tarjeta))}
          >
            Tarjeta ({rates.tarjeta})
          </Button>
        </div>
      )}

      {/* Manual input — always available */}
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="Ej. 1420.50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Error warning — does NOT block submission */}
      {fetchError && (
        <p className="text-xs text-muted-foreground">
          Cotización no disponible — ingresá el TC manualmente.
        </p>
      )}
    </div>
  )
}
