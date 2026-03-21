'use client'
import {
  CloudUpload as CloudUploadIcon,
  Trash2 as Trash2Icon,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VaultFileGallery } from './vault-file-gallery'
import { VaultFile } from '../dashboard/bookmark-list/types'
import { useFileUploader } from './hooks/useFileUploader'
import { Button } from '@/components/ui/button'

interface VaultGroup {
  _id: string
  title: string
  color: string
}

interface VaultUploadProps {
  selectedGroupId: string | null
  groups: VaultGroup[]
  files: VaultFile[]
  isLoading?: boolean
  onDeleteFileAction: (file: VaultFile) => void
}

function EmptyState({
  isLoading,
  groupsLength,
}: {
  isLoading?: boolean
  groupsLength: number
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Gallery</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Gallery</h3>
      </div>
      <p className="text-sm text-muted-foreground py-4 text-center">
        {groupsLength === 0
          ? 'Create a group to start uploading files'
          : 'Select a group to start uploading files'}
      </p>
    </div>
  )
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILES = 3

export function VaultUpload({
  selectedGroupId,
  groups,
  files,
  isLoading,
  onDeleteFileAction,
}: VaultUploadProps) {
  const {
    uploadFiles,
    isDragging,
    errors,
    removeFile,
    retryUpload,
    clearAll,
    openFileDialog,
    getInputProps,
    dragHandlers,
  } = useFileUploader({
    selectedGroupId,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
  })

  if (groups.length === 0 || !selectedGroupId) {
    return <EmptyState isLoading={isLoading} groupsLength={groups.length} />
  }

  const hasContent = uploadFiles.length > 0 || files.length > 0 || isLoading
  const showDropzone = !hasContent

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Gallery</h3>
        <div className="flex gap-2">
          <Button onClick={openFileDialog} variant="outline" size="sm">
            <CloudUploadIcon className="h-4 w-4 mr-2" />
            Add files
          </Button>
          {uploadFiles.length > 0 && (
            <Button onClick={clearAll} variant="outline" size="sm">
              <Trash2Icon className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <input {...getInputProps()} className="sr-only" />

      <div
        className={cn(
          'rounded-lg transition-colors',
          showDropzone &&
            cn(
              'border-2 border-dashed p-6',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25'
            )
        )}
        {...(showDropzone && dragHandlers)}
      >
        {hasContent ? (
          <>
            <VaultFileGallery
              files={files}
              uploadFiles={uploadFiles}
              onDeleteFileAction={onDeleteFileAction}
              onRemoveUpload={removeFile}
              onRetryUpload={retryUpload}
              isLoading={isLoading}
            />
            {errors.length > 0 && (
              <div className="mt-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive space-y-1">
                {errors.map((error, i) => (
                  <p key={i}>{error}</p>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Drop files here or use Add files above
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {MAX_FILE_SIZE / 1024 / 1024}MB per file • Up to {MAX_FILES}{' '}
              files at a time
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
