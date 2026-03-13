'use server'

import { createServerClient } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

export type Note = {
  id: string
  title: string
  body: string
  created_at: string | undefined
}

export async function getNotesAction(): Promise<{ notes: Note[] } | { error: string }> {
  try {
    const pb = await createServerClient()
    if (!pb.authStore.isValid) return { error: 'No autenticado' }
    const userId = pb.authStore.record?.id
    const records = await pb.collection('notes').getFullList({
      filter: `user = "${userId}"`,
      sort: '-id',
    })
    return {
      notes: records.map((r) => ({
        id: r.id,
        title: r.title as string,
        body: r.body as string,
        created_at: r.created_at as string | undefined,
      })),
    }
  } catch {
    return { error: 'Error al obtener notas' }
  }
}

export async function getLastNoteAction(): Promise<{ note: Note | null } | { error: string }> {
  try {
    const pb = await createServerClient()
    if (!pb.authStore.isValid) return { note: null }
    const userId = pb.authStore.record?.id
    const records = await pb.collection('notes').getList(1, 1, {
      filter: `user = "${userId}"`,
      sort: '-id',
    })
    if (records.items.length === 0) return { note: null }
    const r = records.items[0]
    return {
      note: {
        id: r.id,
        title: r.title as string,
        body: r.body as string,
        created_at: r.created_at as string | undefined,
      },
    }
  } catch {
    return { note: null }
  }
}

export async function createNoteAction(data: {
  title: string
  body: string
}): Promise<{ id: string } | { error: string }> {
  try {
    const pb = await createServerClient()
    if (!pb.authStore.isValid) return { error: 'No autenticado' }
    const userId = pb.authStore.record?.id
    const record = await pb.collection('notes').create({
      user: userId,
      title: data.title.trim(),
      body: data.body,
    })
    revalidatePath('/notes')
    revalidatePath('/dashboard')
    return { id: record.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: msg }
  }
}

export async function updateNoteAction(data: {
  id: string
  title: string
  body: string
}): Promise<{ success: true } | { error: string }> {
  try {
    const pb = await createServerClient()
    if (!pb.authStore.isValid) return { error: 'No autenticado' }
    await pb.collection('notes').update(data.id, {
      title: data.title.trim(),
      body: data.body,
    })
    revalidatePath('/notes')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { error: 'Error al actualizar nota' }
  }
}

export async function deleteNoteAction(id: string): Promise<{ success: true } | { error: string }> {
  try {
    const pb = await createServerClient()
    if (!pb.authStore.isValid) return { error: 'No autenticado' }
    await pb.collection('notes').delete(id)
    revalidatePath('/notes')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { error: 'Error al eliminar nota' }
  }
}
