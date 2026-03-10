'use server'
import { createServerClient } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

export async function updateDisplayNameAction(
  userId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  if (!name.trim()) {
    return { success: false, error: 'Display name cannot be empty.' }
  }
  const pb = await createServerClient()
  try {
    await pb.collection('users').update(userId, { name: name.trim() })
    revalidatePath('/settings')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update display name.' }
  }
}

export async function updatePasswordAction(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }
  const pb = await createServerClient()
  try {
    await pb.collection('users').update(userId, {
      oldPassword,
      password: newPassword,
      passwordConfirm: newPassword,
    })
    return { success: true }
  } catch {
    return { success: false, error: 'Current password is incorrect.' }
  }
}
