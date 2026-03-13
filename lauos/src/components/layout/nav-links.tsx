'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MODULES } from '@/lib/modules'
import { cn } from '@/lib/utils'

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav
      className="hidden md:flex items-center frosted-glass rounded-full p-1 gap-0.5"
      aria-label="module navigation"
    >
      {MODULES.map((mod) => {
        const isActive = pathname.startsWith(mod.href)
        return (
          <Link
            key={mod.id}
            href={mod.href}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200',
              isActive
                ? 'bg-white/90 dark:bg-white/15 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/10'
            )}
          >
            {mod.name}
          </Link>
        )
      })}
    </nav>
  )
}
