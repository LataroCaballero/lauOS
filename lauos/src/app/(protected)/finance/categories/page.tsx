// Categories management page — Server Component.
//
// Categories are seeded on user creation by `pocketbase/pb_hooks/seed_categories.pb.js` (CATG-03).
// If a user was created before the hook was deployed, they won't have defaults — this is expected
// behavior for existing accounts.

import { getCategoriesAction } from '@/lib/actions/categories'
import { CategoriesClient } from './categories-client'

export default async function CategoriesPage() {
  const result = await getCategoriesAction()

  if (result.error) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive">Error al cargar categorías: {result.error}</p>
      </div>
    )
  }

  const categories = result.categories ?? []

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Categorías</h1>
      <CategoriesClient categories={categories} />
    </div>
  )
}
