'use client'
import { useState, startTransition } from 'react'
import { toast } from 'sonner'
import { useThemeStore, type AccentColor } from '@/lib/store/theme-store'
import { updateAccentAction } from '@/lib/actions/profile'

const ACCENT_OPTIONS: { key: AccentColor; label: string; color: string }[] = [
  { key: 'yellow',  label: 'Amarillo', color: '#f0c040' },
  { key: 'blue',    label: 'Azul',     color: '#4090e0' },
  { key: 'green',   label: 'Verde',    color: '#40c070' },
  { key: 'purple',  label: 'Violeta',  color: '#9060e0' },
  { key: 'red',     label: 'Rojo',     color: '#e04040' },
  { key: 'orange',  label: 'Naranja',  color: '#f07030' },
]

export default function AppearanceTab({ userId, initialAccent }: { userId: string; initialAccent: string }) {
  const { isDark, toggleDark, setAccent } = useThemeStore()
  const [selected, setSelected] = useState<AccentColor>((initialAccent as AccentColor) || 'yellow')

  function handleAccentChange(key: AccentColor) {
    setSelected(key)
    setAccent(key) // immediate UI update
    startTransition(async () => {
      const result = await updateAccentAction(userId, key)
      if (result.error) {
        toast.error('No se pudo guardar el color: ' + result.error)
      } else {
        toast.success('Color de acento guardado')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Dark mode */}
      <section>
        <h2 className="text-sm font-medium mb-3">Modo</h2>
        <button
          type="button"
          onClick={toggleDark}
          className="flex items-center gap-2 text-sm border rounded-md px-4 py-2 hover:bg-accent transition-colors"
        >
          {isDark ? '🌙 Oscuro' : '☀️ Claro'}
          <span className="text-muted-foreground">(click para cambiar)</span>
        </button>
      </section>

      {/* Accent color */}
      <section>
        <h2 className="text-sm font-medium mb-3">Color de acento</h2>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleAccentChange(opt.key)}
              data-testid={`accent-swatch-${opt.key}`}
              aria-label={opt.label}
              className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                selected === opt.key ? 'ring-2 ring-offset-2 ring-current' : ''
              }`}
              style={{ backgroundColor: opt.color }}
              title={opt.label}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Color seleccionado: {ACCENT_OPTIONS.find(o => o.key === selected)?.label ?? selected}
        </p>
      </section>
    </div>
  )
}
