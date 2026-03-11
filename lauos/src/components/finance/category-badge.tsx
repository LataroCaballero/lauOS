// CategoryBadge — small pill showing icon + name with the category's hex color as background tint.
// Uses inline style for dynamic hex color: Tailwind v4 cannot scan dynamic class values at build time.

type CategoryBadgeProps = {
  name: string
  icon: string
  color: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({ name, icon, color, size = 'sm' }: CategoryBadgeProps) {
  const textSize = size === 'md' ? 'text-sm' : 'text-xs'

  return (
    <span
      style={{
        backgroundColor: color + '22',
        color: color,
        borderColor: color + '44',
      }}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${textSize} font-medium`}
    >
      <span>{icon}</span>
      <span>{name}</span>
    </span>
  )
}
