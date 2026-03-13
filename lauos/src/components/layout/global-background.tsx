'use client'
import { useThemeStore, type AccentColor } from '@/lib/store/theme-store'

const ACCENT_RGB: Record<AccentColor, string> = {
  yellow: '200, 155, 0',
  blue:   '59, 130, 246',
  green:  '34, 197, 94',
  purple: '168, 85, 247',
  red:    '239, 68, 68',
  orange: '249, 115, 22',
}

// Base background colors (dark / light) to blend into
const DARK_BASE  = '10, 11, 17'   // near-black with slight blue
const LIGHT_BASE = '248, 249, 251' // near-white with slight cool

export default function GlobalBackground() {
  const { isDark, accent } = useThemeStore()
  const rgb = ACCENT_RGB[accent] ?? ACCENT_RGB.yellow

  const glowOpacity     = isDark ? 0.32 : 0.22
  const glowOrbOpacity  = isDark ? 0.28 : 0.20
  const base            = isDark ? DARK_BASE : LIGHT_BASE
  const baseFar         = isDark ? '6, 7, 12' : '255, 255, 255'

  // Main gradient: glow center sits at 78% from top (lower-third of screen, visible)
  const baseGradient = `
    radial-gradient(
      ellipse 200% 70% at 50% 90%,
      rgba(${rgb}, ${glowOpacity})  0%,
      rgba(${base}, 1)              50%,
      rgba(${baseFar}, 1)           100%
    )
  `

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Base gradient layer */}
      <div className="absolute inset-0" style={{ backgroundImage: baseGradient }} />

      {/* Blurred glow orb — the "singularity", raised to ~70% from top */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: '15%',
          width: '75%',
          height: '50%',
          background: `radial-gradient(ellipse at 50% 80%, rgba(${rgb}, ${glowOrbOpacity}) 0%, transparent 68%)`,
          filter: 'blur(48px)',
        }}
      />

      {/* Second wider, softer halo for depth */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: '10%',
          width: '120%',
          height: '45%',
          background: `radial-gradient(ellipse at 50% 90%, rgba(${rgb}, ${isDark ? 0.14 : 0.12}) 0%, transparent 62%)`,
          filter: 'blur(80px)',
        }}
      />
    </div>
  )
}
