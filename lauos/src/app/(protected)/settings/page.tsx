import { createServerClient } from '@/lib/pocketbase-server'
import { redirect } from 'next/navigation'
import { Tabs } from '@base-ui/react'
import ProfileTab from '@/components/settings/profile-tab'
import AppearanceTab from '@/components/settings/appearance-tab'

export default async function SettingsPage() {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) redirect('/login')
  const user = pb.authStore.record!
  const avatarUrl = user.avatar
    ? pb.files.getURL(user, user.avatar as string, { thumb: '128x128' })
    : null

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Configuración</h1>
      <Tabs.Root defaultValue="profile" className="w-full">
        <Tabs.List className="flex border-b mb-6 gap-4">
          <Tabs.Tab
            value="profile"
            className="pb-2 text-sm font-medium text-muted-foreground data-[selected]:text-foreground data-[selected]:border-b-2 data-[selected]:border-primary"
          >
            Perfil
          </Tabs.Tab>
          <Tabs.Tab
            value="appearance"
            className="pb-2 text-sm font-medium text-muted-foreground data-[selected]:text-foreground data-[selected]:border-b-2 data-[selected]:border-primary"
          >
            Apariencia
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="profile">
          <ProfileTab
            userId={user.id}
            initialName={user.name ?? ''}
            currentAvatarUrl={avatarUrl}
          />
        </Tabs.Panel>
        <Tabs.Panel value="appearance">
          <AppearanceTab userId={user.id} initialAccent={(user.accent as string) ?? 'yellow'} />
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  )
}
