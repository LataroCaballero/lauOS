'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateDisplayNameAction, updatePasswordAction } from '@/lib/actions/profile'
import AvatarUpload from '@/components/settings/avatar-upload'

interface ProfileTabProps {
  userId: string
  initialName: string
  currentAvatarUrl: string | null
}

export default function ProfileTab({ userId, initialName, currentAvatarUrl }: ProfileTabProps) {
  const [name, setName] = useState(initialName)
  const [isNamePending, setIsNamePending] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPwPending, setIsPwPending] = useState(false)

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsNamePending(true)
    const result = await updateDisplayNameAction(userId, name)
    setIsNamePending(false)
    if (result.success) {
      toast.success('Nombre actualizado')
    } else {
      toast.error(result.error ?? 'Error al actualizar nombre')
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setIsPwPending(true)
    const result = await updatePasswordAction(userId, oldPassword, newPassword)
    setIsPwPending(false)
    if (result.success) {
      toast.success('Contraseña actualizada')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      toast.error(result.error ?? 'Error al cambiar contraseña')
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
          <CardDescription>Sube una imagen cuadrada para tu avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload userId={userId} currentAvatarUrl={currentAvatarUrl} />
        </CardContent>
      </Card>

      {/* Display name section */}
      <Card>
        <CardHeader>
          <CardTitle>Nombre</CardTitle>
          <CardDescription>Actualiza tu nombre visible</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Nombre</Label>
              <Input
                id="display-name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isNamePending}
                required
              />
            </div>
            <Button type="submit" disabled={isNamePending}>
              {isNamePending ? 'Guardando…' : 'Guardar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password change section */}
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>Usa una contraseña de al menos 8 caracteres</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña actual</Label>
              <Input
                id="current-password"
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isPwPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isPwPending}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isPwPending}
                required
              />
            </div>
            <Button type="submit" disabled={isPwPending}>
              {isPwPending ? 'Cambiando…' : 'Cambiar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
