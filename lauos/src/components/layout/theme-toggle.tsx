'use client'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/lib/store/theme-store'

export default function ThemeToggle() {
  const { isDark, toggleDark } = useThemeStore()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDark}
      data-testid="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}
