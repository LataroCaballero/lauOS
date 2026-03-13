import Link from 'next/link'
import { BookOpen, PenLine } from 'lucide-react'
import type { Note } from '@/lib/actions/notes'

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr.replace(' ', 'T')).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  const days = Math.floor(diff / 86400)
  if (days === 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  if (days < 7) return `hace ${days} días`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'hace 1 semana'
  if (weeks < 5) return `hace ${weeks} semanas`
  const months = Math.floor(days / 30)
  if (months === 1) return 'hace 1 mes'
  return `hace ${months} meses`
}

export function LastNoteWidget({ lastNote }: { lastNote: Note | null }) {
  return (
    <div className="frosted-glass rounded-xl">
      <div className="border-b border-white/20 dark:border-white/10 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">Diario personal</p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {lastNote ? (
          <>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary/15 p-2 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{lastNote.title || 'Sin título'}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(lastNote.created_at)}</p>
              </div>
            </div>
            <Link
              href="/notes"
              className="block w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              Ver todas las entradas
            </Link>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <PenLine className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Todavía no hay entradas en tu diario</p>
            </div>
            <Link
              href="/notes"
              className="block w-full rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Escribir primera entrada
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
