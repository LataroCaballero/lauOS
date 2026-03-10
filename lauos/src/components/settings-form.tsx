'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateDisplayNameAction, updatePasswordAction } from '@/lib/actions/profile'
import { logoutAction } from '@/lib/actions/auth'

interface SettingsFormProps {
  initialName: string
  userId: string
}

export default function SettingsForm({ initialName, userId }: SettingsFormProps) {
  const [name, setName] = useState(initialName)
  const [nameStatus, setNameStatus] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isNamePending, setIsNamePending] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwStatus, setPwStatus] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)
  const [isPwPending, setIsPwPending] = useState(false)

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsNamePending(true)
    setNameStatus(null)
    setNameError(null)
    const result = await updateDisplayNameAction(userId, name)
    setIsNamePending(false)
    if (result.success) {
      setNameStatus('Display name saved.')
      toast.success('Display name updated')
    } else {
      setNameError(result.error ?? 'Unknown error')
      toast.error(result.error ?? 'Failed to update')
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }
    setIsPwPending(true)
    setPwStatus(null)
    setPwError(null)
    const result = await updatePasswordAction(userId, oldPassword, newPassword)
    setIsPwPending(false)
    if (result.success) {
      setPwStatus('Password updated.')
      toast.success('Password changed successfully')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setPwError(result.error ?? 'Unknown error')
      toast.error(result.error ?? 'Failed to change password')
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account</p>
      </div>

      {/* Display name section */}
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>Update your visible name</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isNamePending}
                required
              />
            </div>
            {nameStatus && <p className="text-sm text-green-600">{nameStatus}</p>}
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            <Button type="submit" disabled={isNamePending}>
              {isNamePending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password change section */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Use a strong password of at least 8 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
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
              <Label htmlFor="new-password">New Password</Label>
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
              <Label htmlFor="confirm-password">Confirm Password</Label>
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
            {pwStatus && <p className="text-sm text-green-600">{pwStatus}</p>}
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <Button type="submit" disabled={isPwPending}>
              {isPwPending ? 'Changing…' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logout */}
      <form action={logoutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Logout
        </Button>
      </form>
    </div>
  )
}
