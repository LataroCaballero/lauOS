'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'
import { MODULES } from '@/lib/modules'
import { cn } from '@/lib/utils'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t bg-background/80 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      {/* Home link */}
      <Link
        href="/dashboard"
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors',
          pathname === '/dashboard'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Home className="h-5 w-5" />
        <span>Inicio</span>
      </Link>

      {/* Module links */}
      {MODULES.map((mod) => {
        const isActive = pathname.startsWith(mod.href)
        return (
          <Link
            key={mod.id}
            href={mod.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <mod.Icon className="h-5 w-5" />
            <span>{mod.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
