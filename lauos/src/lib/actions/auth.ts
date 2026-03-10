'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/pocketbase-server'

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const pb = await createServerClient()
  try {
    await pb.collection('users').authWithPassword(email, password)
  } catch {
    return { error: 'Invalid email or password.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('pb_auth', pb.authStore.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // No maxAge — middleware refresh keeps the session alive indefinitely
  })

  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('pb_auth')
  redirect('/login')
}
