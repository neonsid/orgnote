'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Upload from 'lucide-react/dist/esm/icons/upload'
import { toast } from 'sonner'
import { useUser } from '@clerk/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GeneralSettingsProps {
  nameForm: ReturnType<typeof import('@/hooks/use-name-form').useNameForm>
  onExportClick: () => void
}

export function GeneralSettings({
  nameForm,
  onExportClick,
}: GeneralSettingsProps) {
  const { user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userName = user?.fullName ?? user?.firstName ?? 'User'
  const initial = userName.charAt(0)?.toUpperCase() ?? 'U'

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      toast.info('Profile picture upload coming soon!')
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="space-y-3">
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-3">
          {user.imageUrl ? (
            <Image
              width={48}
              height={48}
              src={user.imageUrl}
              alt={userName}
              className="size-12 rounded-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center size-12 rounded-full bg-muted text-foreground text-lg font-bold">
              {initial}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            className="gap-2"
          >
            <Upload className="size-4" />
            Upload a photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Name Field */}
      <nameForm.Field
        name="name"
        children={(field) => (
          <div className="space-y-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Your name"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Email Field (Read-only) */}
      <div className="space-y-3">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user.primaryEmailAddress?.emailAddress ?? ''}
          disabled
          className="bg-muted"
        />
      </div>

      {/* Data Section */}
      <div className="space-y-3">
        <Label>Data</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportClick}
            className="gap-2"
          >
            Export Bookmarks
          </Button>
        </div>
      </div>
    </div>
  )
}
