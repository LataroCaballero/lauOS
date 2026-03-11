'use server'

import { createServerClient } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// getCategoriesAction
// ---------------------------------------------------------------------------

export async function getCategoriesAction(): Promise<{
  categories?: Array<{ id: string; name: string; icon: string; color: string }>
  error?: string
}> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }
  try {
    const records = await pb.collection('categories').getFullList({
      sort: 'name',
    })
    const categories = records.map((r) => ({
      id: r.id,
      name: r.name as string,
      icon: r.icon as string,
      color: r.color as string,
    }))
    return { categories }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch categories' }
  }
}

// ---------------------------------------------------------------------------
// createCategoryAction
// ---------------------------------------------------------------------------

export async function createCategoryAction(data: {
  name: string
  icon: string
  color: string
}): Promise<{ id?: string; error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const name = data.name.trim()
  if (!name) return { error: 'El nombre es requerido' }
  if (data.icon.length === 0 || data.icon.length > 10)
    return { error: 'El ícono debe tener entre 1 y 10 caracteres' }
  if (!data.color.startsWith('#') || data.color.length > 7)
    return { error: 'El color debe ser un código hex válido (ej: #22c55e)' }

  try {
    const record = await pb.collection('categories').create({
      user: pb.authStore.record?.id,
      name,
      icon: data.icon,
      color: data.color,
    })
    revalidatePath('/finance')
    return { id: record.id }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to create category' }
  }
}

// ---------------------------------------------------------------------------
// updateCategoryAction — only update fields that are provided
// ---------------------------------------------------------------------------

export async function updateCategoryAction(data: {
  id: string
  name?: string
  icon?: string
  color?: string
}): Promise<{ error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const update: Record<string, string> = {}
  if (data.name !== undefined) update.name = data.name.trim()
  if (data.icon !== undefined) update.icon = data.icon
  if (data.color !== undefined) update.color = data.color

  try {
    await pb.collection('categories').update(data.id, update)
    revalidatePath('/finance')
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to update category' }
  }
}

// ---------------------------------------------------------------------------
// deleteCategoryAction — blocked if linked transactions exist
// ---------------------------------------------------------------------------

export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  try {
    // Check for linked transactions before deleting
    const linked = await pb.collection('transactions').getList(1, 1, {
      filter: `category = "${id}"`,
      fields: 'id',
    })
    if (linked.totalItems > 0) {
      return {
        error: `Esta categoría tiene ${linked.totalItems} transacción/es. Reasignálas antes de eliminarla.`,
      }
    }

    await pb.collection('categories').delete(id)
    revalidatePath('/finance')
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to delete category' }
  }
}
