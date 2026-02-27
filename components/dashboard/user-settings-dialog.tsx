'use client'

import { useReducer, useRef, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import Image from 'next/image'
import { Upload, Download, Key, Check, Copy, ExternalLink } from 'lucide-react'
import { ExportBookmarksDialog } from '@/components/dashboard/export-bookmarks-dialog'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface UserSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface PasswordState {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  loading: boolean
  error: string
}

type PasswordAction =
  | {
      type: 'SET_FIELD'
      field: 'currentPassword' | 'newPassword' | 'confirmPassword'
      value: string
    }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_ERROR'; value: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' }

const initialPasswordState: PasswordState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  loading: false,
  error: '',
}

function passwordReducer(
  state: PasswordState,
  action: PasswordAction
): PasswordState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_LOADING':
      return { ...state, loading: action.value }
    case 'SET_ERROR':
      return { ...state, error: action.value }
    case 'CLEAR_ERROR':
      return { ...state, error: '' }
    case 'RESET':
      return initialPasswordState
    default:
      return state
  }
}

interface PublicProfileState {
  isPublic: boolean
  username: string
  bio: string
  github: string
  twitter: string
  website: string
}

type PublicProfileAction =
  | {
      type: 'SET_FIELD'
      field: keyof PublicProfileState
      value: string | boolean
    }
  | { type: 'RESET' }

const initialPublicProfileState: PublicProfileState = {
  isPublic: false,
  username: '',
  bio: '',
  github: '',
  twitter: '',
  website: '',
}

function publicProfileReducer(
  state: PublicProfileState,
  action: PublicProfileAction
): PublicProfileState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return initialPublicProfileState
    default:
      return state
  }
}

export function UserSettingsDialog({
  open,
  onOpenChange,
  user,
}: UserSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'public-profile'>(
    'general'
  )
  const [name, setName] = useState(user.name)
  const [isLoading, setIsLoading] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initial = user.name?.charAt(0)?.toUpperCase() ?? 'U'

  const [passwordState, passwordDispatch] = useReducer(
    passwordReducer,
    initialPasswordState
  )

  const [publicProfileState, publicProfileDispatch] = useReducer(
    publicProfileReducer,
    initialPublicProfileState
  )

  const upsertProfile = useMutation(api.profile.upsertProfile)
  const existingProfile = useQuery(api.profile.getProfile, { userId: user.id })

  useEffect(() => {
    if (open) {
      authClient.listAccounts().then((result) => {
        if (result.data) {
          const credentialAccount = result.data.find(
            (account) => account.providerId === 'credential'
          )
          setHasPassword(!!credentialAccount)
        }
      })
    }
  }, [open])

  // Load existing profile data when dialog opens
  useEffect(() => {
    if (open && existingProfile) {
      publicProfileDispatch({
        type: 'SET_FIELD',
        field: 'isPublic',
        value: existingProfile.isPublic,
      })
      if (existingProfile.username) {
        publicProfileDispatch({
          type: 'SET_FIELD',
          field: 'username',
          value: existingProfile.username,
        })
      }
      if (existingProfile.bio) {
        publicProfileDispatch({
          type: 'SET_FIELD',
          field: 'bio',
          value: existingProfile.bio,
        })
      }
      if (existingProfile.links) {
        const link = existingProfile.links
        if (link.label === 'GitHub') {
          publicProfileDispatch({
            type: 'SET_FIELD',
            field: 'github',
            value: link.url,
          })
        } else if (link.label === 'Twitter') {
          // Extract username from https://x.com/username
          const match = link.url.match(/https:\/\/x\.com\/(\w+)/)
          if (match) {
            publicProfileDispatch({
              type: 'SET_FIELD',
              field: 'twitter',
              value: match[1],
            })
          }
        } else if (link.label === 'Portfolio') {
          // Extract domain from https://domain.com
          const match = link.url.match(/https:\/\/(.+)/)
          if (match) {
            publicProfileDispatch({
              type: 'SET_FIELD',
              field: 'website',
              value: match[1],
            })
          }
        }
      }
    }
  }, [open, existingProfile])

  const handleClose = () => {
    setName(user.name)
    passwordDispatch({ type: 'RESET' })
    onOpenChange(false)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      if (name !== user.name) {
        await authClient.updateUser({ name })
      }

      // Save public profile data (only if user has entered something)
      if (
        publicProfileState.username ||
        publicProfileState.bio ||
        publicProfileState.github ||
        publicProfileState.twitter ||
        publicProfileState.website
      ) {
        const links = [] as Array<{
          label: 'GitHub' | 'Twitter' | 'Portfolio'
          url: string
        }>
        if (publicProfileState.github)
          links.push({ label: 'GitHub', url: publicProfileState.github })
        if (publicProfileState.twitter)
          links.push({
            label: 'Twitter',
            url: `https://x.com/${publicProfileState.twitter}`,
          })
        if (publicProfileState.website)
          links.push({
            label: 'Portfolio',
            url: `https://${publicProfileState.website}`,
          })

        await upsertProfile({
          userId: user.id,
          username: publicProfileState.username || undefined,
          bio: publicProfileState.bio || undefined,
          links: links[0],
          isPublic: publicProfileState.isPublic,
        })
      }

      toast.success('Profile saved successfully!')
      handleClose()
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    passwordDispatch({ type: 'CLEAR_ERROR' })

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      passwordDispatch({ type: 'SET_ERROR', value: 'Passwords do not match.' })
      return
    }

    if (passwordState.newPassword.length < 8) {
      passwordDispatch({
        type: 'SET_ERROR',
        value: 'Password must be at least 8 characters.',
      })
      return
    }

    passwordDispatch({ type: 'SET_LOADING', value: true })

    try {
      const result = await authClient.changePassword({
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
        revokeOtherSessions: true,
      })

      if (result.error) {
        passwordDispatch({
          type: 'SET_ERROR',
          value: result.error.message || 'Failed to change password.',
        })
      } else {
        toast.success('Password changed successfully!')
        passwordDispatch({ type: 'RESET' })
      }
    } catch {
      passwordDispatch({
        type: 'SET_ERROR',
        value: 'Failed to change password. Please try again.',
      })
    } finally {
      passwordDispatch({ type: 'SET_LOADING', value: false })
    }
  }

  const handleImportBookmarks = () => {
    toast.info('Import bookmarks feature coming soon!')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      toast.info('Profile picture upload coming soon!')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Manage your account settings.
          </p>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'general'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('public-profile')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'public-profile'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Public Profile
            </button>
          </div>

          {activeTab === 'general' && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <Image
                      width={48}
                      height={48}
                      src={user.image}
                      alt={user.name}
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

              <div className="space-y-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              {hasPassword && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Key className="size-4" />
                    Change Password
                  </Label>
                  <form onSubmit={handlePasswordChange} className="space-y-3">
                    {passwordState.error && (
                      <p className="text-sm text-red-500">
                        {passwordState.error}
                      </p>
                    )}
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={passwordState.currentPassword}
                      onChange={(e) =>
                        passwordDispatch({
                          type: 'SET_FIELD',
                          field: 'currentPassword',
                          value: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="password"
                      placeholder="New password"
                      value={passwordState.newPassword}
                      onChange={(e) =>
                        passwordDispatch({
                          type: 'SET_FIELD',
                          field: 'newPassword',
                          value: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordState.confirmPassword}
                      onChange={(e) =>
                        passwordDispatch({
                          type: 'SET_FIELD',
                          field: 'confirmPassword',
                          value: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={passwordState.loading}
                    >
                      {passwordState.loading ? 'Updating…' : 'Update Password'}
                    </Button>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                <Label>Data</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExportOpen(true)}
                    className="gap-2"
                  >
                    Export Bookmarks
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'public-profile' && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="public-profile-toggle" className="font-medium">
                  Public Profile
                </Label>
                <Switch
                  id="public-profile-toggle"
                  checked={publicProfileState.isPublic}
                  onCheckedChange={(checked) =>
                    publicProfileDispatch({
                      type: 'SET_FIELD',
                      field: 'isPublic',
                      value: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={publicProfileState.username}
                    onChange={(e) =>
                      publicProfileDispatch({
                        type: 'SET_FIELD',
                        field: 'username',
                        value: e.target.value,
                      })
                    }
                    placeholder="username"
                    className="pr-10"
                  />
                  {publicProfileState.username.length > 0 && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={publicProfileState.bio}
                  onChange={(e) =>
                    publicProfileDispatch({
                      type: 'SET_FIELD',
                      field: 'bio',
                      value: e.target.value,
                    })
                  }
                  placeholder="Building cool things on the web"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={publicProfileState.github}
                  onChange={(e) =>
                    publicProfileDispatch({
                      type: 'SET_FIELD',
                      field: 'github',
                      value: e.target.value,
                    })
                  }
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="twitter">X (Twitter)</Label>
                <Input
                  id="twitter"
                  value={publicProfileState.twitter}
                  onChange={(e) =>
                    publicProfileDispatch({
                      type: 'SET_FIELD',
                      field: 'twitter',
                      value: e.target.value,
                    })
                  }
                  placeholder="username"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="website">Website</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    https://
                  </span>
                  <Input
                    id="website"
                    value={publicProfileState.website}
                    onChange={(e) =>
                      publicProfileDispatch({
                        type: 'SET_FIELD',
                        field: 'website',
                        value: e.target.value,
                      })
                    }
                    placeholder="example.com"
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const profileUrl = `${window.location.origin}/u/${publicProfileState.username}`
                    navigator.clipboard.writeText(profileUrl)
                    toast.success('Profile link copied!')
                  }}
                  disabled={!publicProfileState.username}
                  className="gap-2"
                >
                  <Copy className="size-4" />
                  Copy Profile Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(`/u/${publicProfileState.username}`, '_blank')
                  }}
                  disabled={!publicProfileState.username}
                  className="gap-2"
                >
                  <ExternalLink className="size-4" />
                  Preview Profile
                </Button>
              </div>
            </div>
          )}
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
