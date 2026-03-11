'use client'

import { useState } from 'react'
import { AccountCard } from '@/components/finance/account-card'
import { AccountForm } from '@/components/finance/account-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlusIcon } from 'lucide-react'
import type { AccountWithBalance } from '@/lib/actions/accounts'

type AccountsClientProps = {
  accounts: AccountWithBalance[]
}

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; account: AccountWithBalance }

export function AccountsClient({ accounts }: AccountsClientProps) {
  const [dialogState, setDialogState] = useState<DialogState>({ mode: 'closed' })

  const isOpen = dialogState.mode !== 'closed'

  function handleOpenChange(open: boolean) {
    if (!open) setDialogState({ mode: 'closed' })
  }

  function handleSuccess() {
    setDialogState({ mode: 'closed' })
    // revalidatePath is called inside the Server Actions — Next.js will refetch the page
  }

  return (
    <div>
      {/* Nueva cuenta button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-medium text-muted-foreground">
          {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
        </h2>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={
              <Button size="sm">
                <PlusIcon />
                Nueva cuenta
              </Button>
            }
            onClick={() => setDialogState({ mode: 'create' })}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogState.mode === 'edit' ? 'Editar cuenta' : 'Nueva cuenta'}
              </DialogTitle>
            </DialogHeader>
            {dialogState.mode === 'create' && (
              <AccountForm mode="create" onSuccess={handleSuccess} />
            )}
            {dialogState.mode === 'edit' && (
              <AccountForm
                mode="edit"
                initialValues={dialogState.account}
                onSuccess={handleSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Account grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => setDialogState({ mode: 'edit', account })}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Crea tu primera cuenta para comenzar a registrar transacciones.
        </p>
      )}
    </div>
  )
}
