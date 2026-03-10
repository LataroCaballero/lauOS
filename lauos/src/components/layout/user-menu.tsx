'use client'
import { startTransition } from 'react'
import Link from 'next/link'
import { Menu } from '@base-ui/react'
import { logoutAction } from '@/lib/actions/auth'
import { Settings, LogOut, ChevronDown } from 'lucide-react'

type UserMenuProps = {
  userName: string
  avatarUrl: string | null
}

export default function UserMenu({ userName, avatarUrl }: UserMenuProps) {
  const initials = userName.charAt(0).toUpperCase()

  return (
    <Menu.Root>
      <Menu.Trigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {avatarUrl ? (
          <img
            src={`${avatarUrl}?thumb=64x64`}
            alt={userName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {initials}
          </span>
        )}
        <span data-testid="navbar-username" className="hidden sm:block text-sm font-medium">
          {userName}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8}>
          <Menu.Popup className="z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95">
            <Menu.Item
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent"
              render={<Link href="/settings" />}
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Menu.Item>
            <Menu.Separator className="my-1 border-t" />
            <Menu.Item
              data-testid="logout-button"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent text-destructive"
              onClick={() => {
                startTransition(() => {
                  logoutAction()
                })
              }}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
