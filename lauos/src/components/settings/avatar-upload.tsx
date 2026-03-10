'use client'
import { useState, useRef, useCallback, startTransition } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog } from '@base-ui/react'
import { toast } from 'sonner'
import { updateAvatarAction } from '@/lib/actions/profile'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

export default function AvatarUpload({ userId, currentAvatarUrl }: AvatarUploadProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState<Crop>()
  const [isPending, setIsPending] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() ?? '')
      setDialogOpen(true)
    })
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }, [])

  async function handleConfirm() {
    if (!imgRef.current || !crop) return
    setIsPending(true)
    try {
      const canvas = document.createElement('canvas')
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height
      const size = 256
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        size,
        size
      )
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      )
      if (!blob) {
        toast.error('Failed to process image')
        setIsPending(false)
        return
      }
      const formData = new FormData()
      formData.append('avatar', blob, 'avatar.jpg')
      startTransition(async () => {
        const result = await updateAvatarAction(userId, formData)
        setIsPending(false)
        if (result.error) {
          toast.error('Error al subir avatar: ' + result.error)
        } else {
          toast.success('Avatar actualizado')
          setDialogOpen(false)
          setImgSrc('')
        }
      })
    } catch {
      toast.error('Error al procesar la imagen')
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      {currentAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentAvatarUrl}
          alt="Avatar"
          className="w-16 h-16 rounded-full object-cover"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl text-muted-foreground">
          ?
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelect}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-sm font-medium underline underline-offset-4 hover:text-primary transition-colors"
      >
        Cambiar foto
      </button>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-background border rounded-xl shadow-xl p-6 w-full max-w-md">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Recortar foto de perfil
            </Dialog.Title>
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-72 overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '288px', objectFit: 'contain' }}
                />
              </ReactCrop>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setDialogOpen(false); setImgSrc('') }}
                className="text-sm text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || !crop}
                className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? 'Subiendo…' : 'Confirmar'}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
