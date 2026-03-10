import 'server-only'
import PocketBase from 'pocketbase'
import { cookies } from 'next/headers'

/**
 * Creates a new PocketBase instance per call — never share across requests.
 * Reads the 'pb_auth' httpOnly cookie set by the login Server Action.
 * Use in Server Components, Server Actions, and middleware only.
 */
export async function createServerClient(): Promise<PocketBase> {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL)
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('pb_auth')
  if (authCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`)
  }
  return pb
}
