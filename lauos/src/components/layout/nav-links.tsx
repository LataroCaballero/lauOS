'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MODULES } from '@/lib/modules'
import { cn } from '@/lib/utils'

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="module navigation">
      {MODULES.map((mod) => {
        const isActive = pathname.startsWith(mod.href)
        return (
          <Link
            key={mod.id}
            href={mod.href}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <mod.Icon className="h-4 w-4" />
            {mod.name}
          </Link>
        )
      })}
    </nav>
  )
}
