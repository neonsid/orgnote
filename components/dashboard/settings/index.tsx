'use client'

import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExportBookmarksDialog } from '@/components/dashboard/export-bookmarks-dialog'
import { useHasPassword } from '@/hooks/use-has-password'
import { useNameForm } from '@/hooks/use-name-form'
import { usePublicProfileForm } from '@/hooks/use-public-profile-form'
import { GeneralSettings } from './general-settings'
import { PublicProfileSettings } from './public-profile-settings'
import { toast } from 'sonner'
import type { UserSettingsUser, SettingsTab } from './types'

interface UserSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserSettingsUser
}

function SettingsTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
      <button
        onClick={() => onTabChange('general')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          activeTab === 'general'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        General
      </button>
      <button
        onClick={() => onTabChange('public-profile')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          activeTab === 'public-profile'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Public Profile
      </button>
    </div>
  )
}

export function UserSettingsDialog({
  open,
  onOpenChange,
  user,
}: UserSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [isLoading, setIsLoading] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const { data: hasPassword } = useHasPassword(open)
  const existingProfile = useQuery(api.profile.getProfile, { userId: user.id })

  const nameForm = useNameForm({ user })
  const profileForm = usePublicProfileForm({
    userId: user.id,
    existingProfile,
  })

  // Reset name form when user prop changes
  useEffect(() => {
    nameForm.setFieldValue('name', user.name)
  }, [user.name, nameForm])

  const handleClose = () => {
    nameForm.reset()
    profileForm.reset()
    onOpenChange(false)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Submit name form
      await nameForm.handleSubmit()

      // Submit profile form
      await profileForm.handleSubmit()

      toast.success('Profile saved successfully!')
      handleClose()
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Manage your account settings.
          </p>
        </DialogHeader>

        <div className="mt-4">
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="mt-6">
            {activeTab === 'general' && (
              <GeneralSettings
                user={user}
                nameForm={nameForm}
                hasPassword={hasPassword}
                onExportClick={() => setExportOpen(true)}
              />
            )}

            {activeTab === 'public-profile' && (
              <PublicProfileSettings profileForm={profileForm} />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>

      <ExportBookmarksDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        userId={user.id}
      />
    </Dialog>
  )
}
