'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createNoteAction, updateNoteAction, deleteNoteAction } from '@/lib/actions/notes'
import type { Note } from '@/lib/actions/notes'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`{1,3}([\s\S]*?)`{1,3}/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^[>-]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Markdown editor toolbar
// ---------------------------------------------------------------------------

type ToolbarAction =
  | { type: 'wrap'; before: string; after: string; label: string; title: string }
  | { type: 'line'; prefix: string; label: string; title: string }
  | { type: 'divider' }

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { type: 'wrap', before: '**', after: '**', label: 'B', title: 'Negrita' },
  { type: 'wrap', before: '*', after: '*', label: 'I', title: 'Cursiva' },
  { type: 'wrap', before: '~~', after: '~~', label: 'S', title: 'Tachado' },
  { type: 'divider' },
  { type: 'line', prefix: '# ', label: 'H1', title: 'Título 1' },
  { type: 'line', prefix: '## ', label: 'H2', title: 'Título 2' },
  { type: 'line', prefix: '### ', label: 'H3', title: 'Título 3' },
  { type: 'divider' },
  { type: 'line', prefix: '- ', label: '•', title: 'Lista' },
  { type: 'line', prefix: '1. ', label: '1.', title: 'Lista numerada' },
  { type: 'line', prefix: '> ', label: '❝', title: 'Cita' },
  { type: 'divider' },
  { type: 'wrap', before: '`', after: '`', label: '<>', title: 'Código' },
]

function NoteEditor({
  title,
  onTitleChange,
  body,
  onBodyChange,
}: {
  title: string
  onTitleChange: (v: string) => void
  body: string
  onBodyChange: (v: string) => void
}) {
  const [preview, setPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function insertWrap(before: string, after: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = body.substring(start, end)
    const newBody = body.substring(0, start) + before + selected + after + body.substring(end)
    onBodyChange(newBody)
    setTimeout(() => {
      el.focus()
      const cursor = start + before.length + selected.length + after.length
      el.setSelectionRange(cursor, cursor)
    }, 0)
  }

  function insertLinePrefix(prefix: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const lineStart = body.lastIndexOf('\n', start - 1) + 1
    const newBody = body.substring(0, lineStart) + prefix + body.substring(lineStart)
    onBodyChange(newBody)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Título de la entrada…"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="text-base font-medium"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-1">
        {TOOLBAR_ACTIONS.map((action, i) => {
          if (action.type === 'divider') {
            return <span key={i} className="mx-0.5 h-4 w-px bg-border/60" />
          }
          return (
            <button
              key={i}
              type="button"
              title={action.title}
              onClick={() => {
                if (action.type === 'wrap') insertWrap(action.before, action.after)
                else if (action.type === 'line') insertLinePrefix(action.prefix)
              }}
              className={cn(
                'rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground',
                action.label === 'B' && 'font-bold',
                action.label === 'I' && 'italic',
                action.label === 'S' && 'line-through',
              )}
            >
              {action.label}
            </button>
          )
        })}
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          title={preview ? 'Editar' : 'Previsualizar'}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {preview ? 'Editar' : 'Vista previa'}
        </button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div className="markdown-body min-h-64 rounded-lg border border-border/50 bg-muted/20 p-4 text-sm">
          {body ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">Nada que previsualizar aún…</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Escribí tu entrada… (soporta Markdown)"
          className="min-h-64 w-full resize-y rounded-lg border border-border/50 bg-muted/20 p-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Note card
// ---------------------------------------------------------------------------

function NoteCard({
  note,
  onView,
  onEdit,
  onDelete,
}: {
  note: Note
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const preview = stripMarkdown(note.body).slice(0, 130)

  return (
    <div
      className="frosted-glass group/card flex cursor-pointer flex-col gap-2 rounded-xl p-4 transition-all hover:brightness-95 dark:hover:brightness-110"
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex-1 truncate font-medium leading-snug">{note.title || 'Sin título'}</h3>
        <div
          className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            title="Editar"
            className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Eliminar"
            className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {preview && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{preview}</p>
      )}

      <p className="mt-auto text-xs text-muted-foreground/70">{formatDate(note.created_at)}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NotesClient({ notes: initialNotes }: { notes: Note[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Editor state (shared between create/edit)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setTitle('')
    setBody('')
    setError(null)
    setCreateOpen(true)
  }

  function openEdit(note: Note) {
    setTitle(note.title)
    setBody(note.body)
    setError(null)
    setEditingNote(note)
  }

  function handleSaveCreate() {
    if (!title.trim()) { setError('El título no puede estar vacío'); return }
    startTransition(async () => {
      const result = await createNoteAction({ title, body })
      if ('error' in result) { setError(result.error); return }
      setCreateOpen(false)
      router.refresh()
    })
  }

  function handleSaveEdit() {
    if (!editingNote) return
    if (!title.trim()) { setError('El título no puede estar vacío'); return }
    startTransition(async () => {
      const result = await updateNoteAction({ id: editingNote.id, title, body })
      if ('error' in result) { setError(result.error); return }
      setEditingNote(null)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNoteAction(id)
      if ('error' in result) return
      setDeletingId(null)
      setViewingNote(null)
      router.refresh()
    })
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-muted-foreground">Módulo</p>
          <h1 className="text-3xl font-semibold tracking-tight">Notas personales</h1>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva entrada
        </Button>
      </div>

      {/* Notes grid */}
      {initialNotes.length === 0 ? (
        <div className="frosted-glass flex flex-col items-center gap-4 rounded-xl py-20 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">Todavía no hay entradas</p>
            <p className="mt-1 text-sm text-muted-foreground">Empezá a registrar tus pensamientos</p>
          </div>
          <Button onClick={openCreate} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Escribir primera entrada
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {initialNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onView={() => setViewingNote(note)}
              onEdit={() => openEdit(note)}
              onDelete={() => setDeletingId(note.id)}
            />
          ))}
        </div>
      )}

      {/* ── Create dialog ── */}
      <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva entrada</DialogTitle>
          </DialogHeader>
          <NoteEditor
            title={title}
            onTitleChange={setTitle}
            body={body}
            onBodyChange={setBody}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCreate} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar entrada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ── */}
      <Dialog open={!!editingNote} onOpenChange={(open) => { if (!open) setEditingNote(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar entrada</DialogTitle>
          </DialogHeader>
          <NoteEditor
            title={title}
            onTitleChange={setTitle}
            body={body}
            onBodyChange={setBody}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View dialog ── */}
      <Dialog open={!!viewingNote} onOpenChange={(open) => { if (!open) setViewingNote(null) }}>
        <DialogContent className="sm:max-w-2xl">
          {viewingNote && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingNote.title || 'Sin título'}</DialogTitle>
                <p className="text-xs text-muted-foreground">{formatDate(viewingNote.created)}</p>
              </DialogHeader>
              <div className="markdown-body max-h-[60vh] overflow-y-auto text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewingNote.body}</ReactMarkdown>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setDeletingId(viewingNote.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setViewingNote(null); openEdit(viewingNote) }}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar entrada?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={isPending}
            >
              {isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
