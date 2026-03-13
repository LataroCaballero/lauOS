'use client'
import { startTransition } from 'react'
import Link from 'next/link'
import { Menu } from '@base-ui/react'
import { logoutAction } from '@/lib/actions/auth'
import { Settings, LogOut } from 'lucide-react'

type UserMenuProps = {
  userName: string
  avatarUrl: string | null
}

export default function UserMenu({ userName, avatarUrl }: UserMenuProps) {
  const initials = userName.charAt(0).toUpperCase()

  return (
    <Menu.Root>
      <Menu.Trigger
        data-testid="user-menu-trigger"
        suppressHydrationWarning
        className="frosted-glass flex items-center rounded-full p-0.5 hover:brightness-95 dark:hover:brightness-125 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {initials}
          </span>
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="frosted-glass min-w-[180px] rounded-xl p-1 animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-2 mb-1 border-b border-border/50">
              <p data-testid="navbar-username" className="text-sm font-medium truncate">{userName}</p>
            </div>
            <Menu.Item
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent transition-colors"
              render={<Link href="/settings" />}
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Menu.Item>
            <Menu.Separator className="my-1 border-t border-border/50" />
            <Menu.Item
              data-testid="logout-button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent transition-colors text-destructive"
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
