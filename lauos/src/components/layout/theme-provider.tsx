'use client'
import { useEffect } from 'react'
import { useThemeStore, type AccentColor } from '@/lib/store/theme-store'

const ACCENT_VARS: Record<AccentColor, string> = {
  yellow:  'oklch(0.85 0.18 95)',
  blue:    'oklch(0.60 0.22 240)',
  green:   'oklch(0.65 0.20 150)',
  purple:  'oklch(0.60 0.22 290)',
  red:     'oklch(0.60 0.22 25)',
  orange:  'oklch(0.72 0.20 60)',
}

export default function ThemeProvider({
  children,
  initialAccent,
}: {
  children: React.ReactNode
  initialAccent: AccentColor
}) {
  const { isDark, accent, setAccent } = useThemeStore()

  // Sync initial accent from PocketBase into store on mount
  useEffect(() => {
    setAccent(initialAccent)
  }, [initialAccent, setAccent])

  // Apply .dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Apply accent CSS variable on :root — overrides the default --primary
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--primary',
      ACCENT_VARS[accent] ?? ACCENT_VARS.yellow
    )
  }, [accent])

  return <>{children}</>
}
