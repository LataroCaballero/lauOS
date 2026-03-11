import { getAccountsWithBalancesAction } from '@/lib/actions/accounts'
import { fromCentavos } from '@/lib/money'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const result = await getAccountsWithBalancesAction()

  if ('error' in result && result.error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-destructive">Error: {result.error}</p>
      </div>
    )
  }

  const accounts = result.accounts ?? []
  const patrimony = result.patrimony ?? { totalArsCentavos: 0, totalUsdCentavos: 0 }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* Patrimony summary */}
      <div className="mb-6">
        <h1 className="mb-4 text-xl font-semibold">Cuentas</h1>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground">Sin cuentas aún.</p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <div className="rounded-lg bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">Total ARS</p>
              <p className="text-lg font-semibold tabular-nums">
                {fromCentavos(patrimony.totalArsCentavos, 'ARS')}
              </p>
            </div>
            <div className="rounded-lg bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">Total USD</p>
              <p className="text-lg font-semibold tabular-nums">
                {fromCentavos(patrimony.totalUsdCentavos, 'USD')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Client island: handles dialog state + account list */}
      <AccountsClient accounts={accounts} />
    </div>
  )
}
