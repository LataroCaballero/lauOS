import PocketBase from 'pocketbase'

let browserClient: PocketBase | undefined

export function createBrowserClient(): PocketBase {
  if (!browserClient) {
    browserClient = new PocketBase(process.env.NEXT_PUBLIC_PB_URL)
  }
  // Sync authStore changes back to cookie so the server can read it.
  // Non-httpOnly because the browser client sets it directly via JS.
  browserClient.authStore.onChange(() => {
    if (typeof document !== 'undefined') {
      document.cookie = browserClient!.authStore.exportToCookie({ httpOnly: false })
    }
  })
  return browserClient
}
