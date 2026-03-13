import { getNotesAction } from '@/lib/actions/notes'
import { NotesClient } from './notes-client'

export default async function NotesPage() {
  const result = await getNotesAction()
  const notes = 'notes' in result ? result.notes : []

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-6">
      <NotesClient notes={notes} />
    </div>
  )
}
