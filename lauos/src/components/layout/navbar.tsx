import Link from 'next/link'
import NavLinks from '@/components/layout/nav-links'
import ThemeToggle from '@/components/layout/theme-toggle'
import UserMenu from '@/components/layout/user-menu'

type NavbarProps = {
  userName: string
  avatarUrl: string | null
}

export default function Navbar({ userName, avatarUrl }: NavbarProps) {
  return (
    <header
      aria-label="main navigation"
      className="sticky top-0 z-40 w-full"
    >
      <div className="flex h-14 items-center px-6">
        {/* Left: Logo — fixed width for true center alignment */}
        <div className="flex-none w-36">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-xs font-bold tracking-tight">L</span>
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-sm font-semibold tracking-tight">lauOS</span>
              <span className="text-[10px] text-muted-foreground leading-none">Dashboard</span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop module nav links */}
        <div className="flex-1 flex justify-center">
          <NavLinks />
        </div>

        {/* Right: Theme toggle + User menu — fixed width to mirror left */}
        <div className="flex-none w-36 flex items-center justify-end gap-1">
          <ThemeToggle />
          <UserMenu userName={userName} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  )
}
