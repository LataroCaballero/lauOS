'use client'

import { useTransition } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fromCentavos } from '@/lib/money'
import { archiveAccountAction } from '@/lib/actions/accounts'

type Account = {
  id: string
  name: string
  currency: 'ARS' | 'USD'
  balanceCentavos: number
}

type AccountCardProps = {
  account: Account
  onEdit: () => void
}

export function AccountCard({ account, onEdit }: AccountCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    if (!window.confirm(`¿Archivar la cuenta "${account.name}"? Sus transacciones se conservarán.`)) {
      return
    }
    startTransition(async () => {
      await archiveAccountAction({ id: account.id })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{account.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {account.currency}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">
          {fromCentavos(account.balanceCentavos, account.currency)}
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleArchive}
          disabled={isPending}
        >
          {isPending ? 'Archivando...' : 'Archivar'}
        </Button>
      </CardFooter>
    </Card>
  )
}
