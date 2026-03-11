'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCategoryAction, updateCategoryAction } from '@/lib/actions/categories'
import { CategoryBadge } from '@/components/finance/category-badge'

// Preset color swatches for quick selection
const PRESET_COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#a855f7', // purple
  '#14b8a6', // teal
  '#f97316', // orange
]

type CategoryFormProps = {
  mode: 'create' | 'edit'
  initialValues?: { id: string; name: string; icon: string; color: string }
  onSuccess: () => void
}

export function CategoryForm({ mode, initialValues, onSuccess }: CategoryFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [icon, setIcon] = useState(initialValues?.icon ?? '')
  const [color, setColor] = useState(initialValues?.color ?? PRESET_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (!icon.trim()) {
      setError('El ícono es requerido')
      return
    }

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createCategoryAction({ name, icon, color })
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
        }
      } else {
        if (!initialValues) return
        const result = await updateCategoryAction({ id: initialValues.id, name, icon, color })
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-name">Nombre</Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          placeholder="Ej. Alimentación"
          disabled={isPending}
        />
      </div>

      {/* Icon */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-icon">Ícono (emoji)</Label>
        <Input
          id="cat-icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={10}
          required
          placeholder="🛒"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">Pegá o escribí cualquier emoji.</p>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1.5">
        <Label>Color</Label>
        {/* Preset swatches */}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              disabled={isPending}
              className="h-7 w-7 rounded-md border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: preset,
                borderColor: color === preset ? '#fff' : 'transparent',
                outline: color === preset ? `2px solid ${preset}` : 'none',
                outlineOffset: '1px',
              }}
              aria-label={preset}
            />
          ))}
          {/* Native color picker for custom colors */}
          <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-foreground">
            +
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isPending}
              className="sr-only"
            />
          </label>
        </div>
        {/* Show selected hex */}
        <p className="text-xs text-muted-foreground">{color}</p>
      </div>

      {/* Live preview */}
      <div className="flex flex-col gap-1.5">
        <Label>Vista previa</Label>
        <div>
          <CategoryBadge
            name={name || 'Categoría'}
            icon={icon || '?'}
            color={color}
            size="md"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending
          ? mode === 'create'
            ? 'Creando...'
            : 'Guardando...'
          : mode === 'create'
            ? 'Crear categoría'
            : 'Guardar cambios'}
      </Button>
    </form>
  )
}
