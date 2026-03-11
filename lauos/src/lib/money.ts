/**
 * Monetary conversion helpers for the Finance module.
 * All amounts stored as integer centavos (×100). Exchange rates stored ×10000.
 * Never store floats. Always use Math.round() when converting from display.
 */

/** Convert user-entered display string to integer centavos. "1234.56" → 123456 */
export const toCentavos = (display: string): number =>
  Math.round(parseFloat(display) * 100)

/** Convert integer centavos to locale-formatted display string. */
export const fromCentavos = (centavos: number, currency: 'ARS' | 'USD'): string => {
  const value = centavos / 100
  if (currency === 'ARS') {
    return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
  }
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/** Convert display exchange rate string to stored integer (rate × 10000). "1420.50" → 14205000 */
export const toRateStored = (rate: string): number =>
  Math.round(parseFloat(rate) * 10000)

/** Convert stored rate integer back to display string with 2 decimal places. */
export const fromRateStored = (stored: number): string =>
  (stored / 10000).toFixed(2)
