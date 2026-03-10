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

  // exportToCookie returns "pb_auth=<url-encoded-json>" — we store just the value portion
  // so that loadFromCookie('pb_auth=<value>') can reconstruct the full auth state
  const cookieHeader = pb.authStore.exportToCookie({
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // httpOnly not supported by exportToCookie options — we set it via cookieStore.set below
  })
  // cookieHeader is "pb_auth=<encoded-value>; Path=/; ..."
  // extract just the encoded value (everything between "pb_auth=" and the first ";")
  const cookieValue = cookieHeader.split(';')[0].replace(/^pb_auth=/, '')

  const cookieStore = await cookies()
  cookieStore.set('pb_auth', cookieValue, {
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
