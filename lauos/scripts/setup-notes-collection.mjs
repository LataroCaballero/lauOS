/**
 * Crea o repara la colección "notes" en PocketBase.
 * Uso: node scripts/setup-notes-collection.mjs <admin-email> <admin-password>
 */

const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? 'http://127.0.0.1:8090'
const [, , email, password] = process.argv

if (!email || !password) {
  console.error('Uso: node scripts/setup-notes-collection.mjs <admin-email> <admin-password>')
  process.exit(1)
}

// ── 1. Autenticar como admin ──────────────────────────────────────────────
const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identity: email, password }),
})
if (!authRes.ok) {
  console.error('Error de autenticación:', await authRes.text())
  process.exit(1)
}
const { token } = await authRes.json()
console.log('✓ Admin autenticado')

const headers = { 'Content-Type': 'application/json', Authorization: token }

// ── 2. Obtener el ID real de la colección users ───────────────────────────
const collectionsRes = await fetch(`${PB_URL}/api/collections?perPage=200`, { headers })
const collectionsData = await collectionsRes.json()
const usersCol = collectionsData.items?.find((c) => c.name === 'users')
if (!usersCol) {
  console.error('No se encontró la colección "users"')
  process.exit(1)
}
const usersColId = usersCol.id
console.log(`✓ Colección users encontrada (id: ${usersColId})`)

// ── 3. Definición de campos ───────────────────────────────────────────────
const FIELDS = [
  {
    name: 'user',
    type: 'relation',
    required: true,
    collectionId: usersColId,
    cascadeDelete: true,
    maxSelect: 1,
  },
  { name: 'title', type: 'text', required: true, max: 500 },
  { name: 'body',  type: 'text', required: false, max: 100000 },
]

const RULES = {
  listRule:   '@request.auth.id = user',
  viewRule:   '@request.auth.id = user',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id = user',
  deleteRule: '@request.auth.id = user',
}

// ── 4. ¿Ya existe la colección? ───────────────────────────────────────────
const existingCol = collectionsData.items?.find((c) => c.name === 'notes')

if (existingCol) {
  console.log(`ℹ Colección "notes" ya existe (id: ${existingCol.id}) — actualizando campos…`)

  // Combinar campos existentes con los nuevos (no duplicar por nombre)
  const existingFieldNames = new Set((existingCol.fields ?? existingCol.schema ?? []).map((f) => f.name))
  const fieldsToAdd = FIELDS.filter((f) => !existingFieldNames.has(f.name))

  if (fieldsToAdd.length === 0) {
    console.log('✓ Todos los campos ya existen, solo actualizando reglas…')
  }

  const updateRes = await fetch(`${PB_URL}/api/collections/${existingCol.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      fields: [...(existingCol.fields ?? existingCol.schema ?? []), ...fieldsToAdd],
      ...RULES,
    }),
  })

  if (!updateRes.ok) {
    console.error('Error al actualizar:', await updateRes.text())
    process.exit(1)
  }

  console.log('✓ Colección "notes" actualizada correctamente')
} else {
  // ── 5. Crear desde cero ─────────────────────────────────────────────────
  const createRes = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'notes', type: 'base', fields: FIELDS, ...RULES }),
  })

  if (!createRes.ok) {
    console.error('Error al crear:', await createRes.text())
    process.exit(1)
  }

  console.log('✓ Colección "notes" creada correctamente')
}
