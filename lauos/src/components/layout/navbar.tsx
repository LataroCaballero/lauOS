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
      className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md"
    >
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        {/* Left: Logo */}
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          lauOS
        </Link>

        {/* Center: Desktop module nav links */}
        <div className="flex-1">
          <NavLinks />
        </div>

        {/* Right: Theme toggle + User menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu userName={userName} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  )
}
