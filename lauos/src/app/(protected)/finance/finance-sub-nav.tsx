'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const FINANCE_NAV_LINKS = [
  { href: '/finance/accounts', label: 'Cuentas' },
  { href: '/finance/insights', label: 'Insights' },
  { href: '/finance/transactions', label: 'Transacciones' },
  { href: '/finance/categories', label: 'Categorías' },
]

export function FinanceSubNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex items-center gap-1 border-b border-border px-4 pt-2"
      aria-label="finance sub-navigation"
    >
      {FINANCE_NAV_LINKS.map((link) => {
        const isActive = pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px',
              isActive
                ? 'border-[var(--color-accent)] text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
