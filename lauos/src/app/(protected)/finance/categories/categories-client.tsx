'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlusIcon } from 'lucide-react'
import { CategoryBadge } from '@/components/finance/category-badge'
import { CategoryForm } from '@/components/finance/category-form'
import { deleteCategoryAction } from '@/lib/actions/categories'

type Category = { id: string; name: string; icon: string; color: string }

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; category: Category }

type CategoriesClientProps = {
  categories: Category[]
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const [dialogState, setDialogState] = useState<DialogState>({ mode: 'closed' })
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const isOpen = dialogState.mode !== 'closed'

  function handleOpenChange(open: boolean) {
    if (!open) setDialogState({ mode: 'closed' })
  }

  function handleSuccess() {
    setDialogState({ mode: 'closed' })
    // revalidatePath('/finance') is called inside Server Actions — Next.js will refetch
  }

  function handleDelete(category: Category) {
    if (
      !window.confirm(
        `¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    // Clear any previous error for this category
    setDeleteErrors((prev) => {
      const next = { ...prev }
      delete next[category.id]
      return next
    })

    startTransition(async () => {
      const result = await deleteCategoryAction(category.id)
      if (result.error) {
        setDeleteErrors((prev) => ({ ...prev, [category.id]: result.error! }))
      }
    })
  }

  return (
    <div>
      {/* Header row with create button */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
        </p>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={
              <Button size="sm">
                <PlusIcon />
                Nueva categoría
              </Button>
            }
            onClick={() => setDialogState({ mode: 'create' })}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogState.mode === 'edit' ? 'Editar categoría' : 'Nueva categoría'}
              </DialogTitle>
            </DialogHeader>
            {dialogState.mode === 'create' && (
              <CategoryForm mode="create" onSuccess={handleSuccess} />
            )}
            {dialogState.mode === 'edit' && (
              <CategoryForm
                mode="edit"
                initialValues={dialogState.category}
                onSuccess={handleSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Category list */}
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin categorías. Creá la primera.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 px-4 py-3">
              {/* Badge */}
              <CategoryBadge name={category.name} icon={category.icon} color={category.color} size="md" />

              {/* Actions */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogState({ mode: 'edit', category })}
                    disabled={isPending}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    Eliminar
                  </Button>
                </div>
                {/* Inline error for linked-transaction guard */}
                {deleteErrors[category.id] && (
                  <p className="max-w-xs text-right text-xs text-destructive">
                    {deleteErrors[category.id]}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
