import { createServerClient } from '@/lib/pocketbase-server'
import SettingsForm from '@/components/settings-form'

export default async function SettingsPage() {
  const pb = await createServerClient()
  const user = pb.authStore.record
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SettingsForm initialName={user?.name ?? ''} userId={user?.id ?? ''} />
    </main>
  )
}
