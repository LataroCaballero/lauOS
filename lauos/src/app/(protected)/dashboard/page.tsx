import ModuleGrid from '@/components/dashboard/module-grid'
import { QuickTransactionWidget } from '@/components/dashboard/quick-transaction-widget'
import { LastNoteWidget } from '@/components/dashboard/last-note-widget'
import { getAccountsWithBalancesAction } from '@/lib/actions/accounts'
import { getCategoriesAction } from '@/lib/actions/categories'
import { getLastNoteAction } from '@/lib/actions/notes'
import { createServerClient } from '@/lib/pocketbase-server'

export default async function DashboardPage() {
  const pb = await createServerClient()
  const userName = (pb.authStore.record?.name as string | undefined) ?? ''

  const [accountsResult, categoriesResult, lastNoteResult] = await Promise.all([
    getAccountsWithBalancesAction(),
    getCategoriesAction(),
    getLastNoteAction(),
  ])

  const accounts = 'accounts' in accountsResult ? (accountsResult.accounts ?? []) : []
  const categories = 'categories' in categoriesResult ? (categoriesResult.categories ?? []) : []
  const lastNote = 'note' in lastNoteResult ? lastNoteResult.note : null

  const showRightPanel = accounts.length > 0 || lastNote !== undefined

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-6">
      <div className="flex gap-6">
        {/* ── Left: main content ── */}
        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <p className="mb-1 text-sm font-medium text-muted-foreground">Panel de control</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Hola{userName ? `, ${userName}` : ''}!
            </h1>
          </div>
          <ModuleGrid />
        </div>

        {/* ── Right: widgets ── */}
        {showRightPanel && (
          <div className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-6 flex flex-col gap-4">
              {accounts.length > 0 && (
                <QuickTransactionWidget accounts={accounts} categories={categories} />
              )}
              <LastNoteWidget lastNote={lastNote} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
