import { createServerClient } from '@/lib/pocketbase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import BottomNav from '@/components/layout/bottom-nav'
import ThemeProvider from '@/components/layout/theme-provider'
import type { AccentColor } from '@/lib/store/theme-store'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) redirect('/login')
  const user = pb.authStore.record!
  const avatarUrl = user.avatar
    ? pb.files.getURL(user, user.avatar as string, { thumb: '64x64' })
    : null

  const validAccents: AccentColor[] = ['yellow', 'blue', 'green', 'purple', 'red', 'orange']
  const accent: AccentColor = validAccents.includes(user.accent as AccentColor)
    ? (user.accent as AccentColor)
    : 'yellow'

  return (
    <ThemeProvider initialAccent={accent}>
      <div className="min-h-screen flex flex-col">
        <Navbar userName={user.name ?? user.email} avatarUrl={avatarUrl} />
        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </ThemeProvider>
  )
}
