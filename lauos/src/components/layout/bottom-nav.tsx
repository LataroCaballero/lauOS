'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { MODULES } from '@/lib/modules'
import { cn } from '@/lib/utils'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-border/50 bg-background/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
    >
      {/* Home link */}
      <Link
        href="/dashboard"
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-xs font-medium transition-colors relative',
          pathname === '/dashboard'
            ? 'text-primary'
            : 'text-muted-foreground'
        )}
      >
        {pathname === '/dashboard' && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
        )}
        <Icons.Home className="h-5 w-5" />
        <span>Inicio</span>
      </Link>

      {/* Module links */}
      {MODULES.map((mod) => {
        const isActive = pathname.startsWith(mod.href)
        const Icon = (Icons[mod.icon as keyof typeof Icons] as React.ComponentType<LucideProps>) ?? Icons.Box
        return (
          <Link
            key={mod.id}
            href={mod.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-xs font-medium transition-colors relative',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
            )}
            <Icon className="h-5 w-5" />
            <span>{mod.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
